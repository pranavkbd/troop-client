import { revalidatePath } from "next/cache";

import {
  attendanceRecordId,
  enrollments,
  getAttendanceRecord,
  recordCheckIn,
  recordCheckOut,
  recordPickUp,
  type SessionRef,
  walkInRecordId,
} from "@/lib/mock-data";
import {
  isScanAction,
  type ScanAction,
  type ScanResult,
  type ScanSubject,
} from "@/lib/scan";
import type {
  AttendanceRecord,
  DayOfWeek,
  Employee,
  Enrollment,
  Student,
} from "@/lib/types";

/**
 * The one place attendance rules live. Both the scan station (after resolving
 * barcodes) and the attendance board (after resolving IDs) call this, so a
 * check-in means the same thing no matter which screen recorded it.
 */

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function toSubject(student: Student): ScanSubject {
  return {
    id: student.id,
    firstName: student.firstName,
    lastName: student.lastName,
  };
}

function dayOfWeekFor(date: string): DayOfWeek | null {
  const label = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(
    new Date(`${date}T00:00:00`),
  );
  return label === "Sun" ? null : (label as DayOfWeek);
}

/**
 * A scan identifies a student, but the ledger is keyed by session + date.
 * Prefer whichever of today's sessions already has a (non-voided) record so
 * a check-out lands on the same row as the check-in. Failing that, take the
 * student's earliest slot of the day, or a walk-in when there is no slot.
 */
function resolveSession(
  student: Student,
  date: string,
): {
  ref: SessionRef;
  enrollment: Enrollment | null;
  record?: AttendanceRecord;
} {
  const dayOfWeek = dayOfWeekFor(date);
  const todays = dayOfWeek
    ? enrollments
        .filter((e) => e.studentId === student.id && e.dayOfWeek === dayOfWeek)
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
    : [];

  for (const enrollment of todays) {
    const record = getAttendanceRecord(attendanceRecordId(enrollment.id, date));
    if (record && !record.voidedAt) {
      return { ref: { enrollmentId: enrollment.id }, enrollment, record };
    }
  }

  const walkIn = getAttendanceRecord(walkInRecordId(student.id, date));
  if (walkIn && !walkIn.voidedAt) {
    return {
      ref: { walkInStudentId: student.id },
      enrollment: null,
      record: walkIn,
    };
  }

  if (todays.length > 0) {
    return { ref: { enrollmentId: todays[0].id }, enrollment: todays[0] };
  }
  return { ref: { walkInStudentId: student.id }, enrollment: null };
}

function minutesBetween(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

function fail(
  action: ScanAction,
  message: string,
  extra: Partial<Extract<ScanResult, { ok: false }>> = {},
): ScanResult {
  return { ok: false, action, message, ...extra };
}

export interface AttendanceCommand {
  action: ScanAction;
  employee: Employee;
  student: Student;
  /** Business day, "yyyy-MM-dd". */
  date: string;
  /** Wall-clock time, "HH:mm". */
  time: string;
}

export function applyAttendance(input: AttendanceCommand): ScanResult {
  const { action, employee, student } = input;

  if (!isScanAction(action)) {
    return fail("check-in", "Unknown attendance action.");
  }
  if (!DATE_PATTERN.test(input.date) || !TIME_PATTERN.test(input.time)) {
    return fail(action, "Invalid timestamp.");
  }

  const subject = toSubject(student);
  const common = { student: subject, employeeName: employee.name };

  if (student.status === "inactive") {
    return fail(
      action,
      `${student.firstName} ${student.lastName}'s enrollment is inactive.`,
      {
        ...common,
        detail: "Reactivate the student before recording attendance.",
      },
    );
  }

  const { ref, enrollment, record } = resolveSession(student, input.date);
  const params = {
    ...ref,
    date: input.date,
    time: input.time,
    employeeName: employee.name,
  };
  const checkedIn = Boolean(record?.checkInTime);

  let detail: string | undefined;

  switch (action) {
    case "check-in": {
      // Only four things block a check-in: inactive (handled above), on
      // vacation today, currently checked in, or already picked up. Anything
      // else, including a finished earlier session, starts a new one.
      if (
        record &&
        (record.status === "excused" || record.status === "absent") &&
        record.excuseReason === "vacation"
      ) {
        return fail(action, "On vacation today.", {
          ...common,
          detail: record.notes ?? "Marked excused for vacation.",
        });
      }
      if (record?.pickedUpTime) {
        return fail(action, "Already picked up today.", {
          ...common,
          detail: `Picked up at ${record.pickedUpTime}.`,
        });
      }
      if (checkedIn && record && !record.checkOutTime) {
        return fail(action, "Already checked in today.", {
          ...common,
          detail: `Checked in at ${record.checkInTime}.`,
        });
      }
      const returning = checkedIn && Boolean(record?.checkOutTime);
      const recordId = recordCheckIn(params);
      const written = getAttendanceRecord(recordId);
      if (returning) {
        detail = "Back for another session; the earlier one stays in the log.";
      } else if (enrollment === null) {
        detail = "Walk-in: not on today's schedule.";
      } else if (written?.status === "late") {
        const late = minutesBetween(enrollment.startTime, input.time);
        detail = `Arrived ${late} min after the ${enrollment.startTime} start.`;
      }
      break;
    }
    case "check-out": {
      if (!checkedIn || !record) {
        return fail(action, "Not checked in today.", {
          ...common,
          detail: "Check the student in before checking them out.",
        });
      }
      if (record.checkOutTime) {
        return fail(action, "Already checked out today.", {
          ...common,
          detail: `Checked out at ${record.checkOutTime}.`,
        });
      }
      recordCheckOut(params);
      break;
    }
    case "pick-up": {
      if (!checkedIn || !record) {
        return fail(action, "Not checked in today.", {
          ...common,
          detail: "There's no session to pick the student up from.",
        });
      }
      if (record.pickedUpTime) {
        return fail(action, "Already picked up today.", {
          ...common,
          detail: `Picked up at ${record.pickedUpTime}.`,
        });
      }
      const wasStillIn = !record.checkOutTime;
      recordPickUp(params);
      if (wasStillIn) detail = "Also checked out of the session.";
      break;
    }
  }

  revalidatePath("/");
  revalidatePath("/attendance");
  revalidatePath(`/students/${student.id}`);

  return {
    ok: true,
    action,
    student: subject,
    employeeName: employee.name,
    date: input.date,
    time: input.time,
    detail,
  };
}
