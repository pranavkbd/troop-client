"use server";

import { revalidatePath } from "next/cache";

import { findEmployeeByBarcode, findStudentByBarcode } from "@/lib/barcode";
import {
  attendanceRecordId,
  employees,
  enrollments,
  getAttendanceRecord,
  recordCheckIn,
  recordCheckOut,
  recordPickUp,
  students,
} from "@/lib/mock-data";
import {
  isScanAction,
  type ScanAction,
  type ScanInput,
  type ScanResult,
  type ScanSubject,
} from "@/lib/scan";
import type {
  AttendanceRecord,
  DayOfWeek,
  Enrollment,
  Student,
} from "@/lib/types";

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
 * A scan identifies a student, but the ledger is keyed by enrollment + date.
 * Prefer the enrollment that already has a (non-voided) record today so a
 * check-out lands on the same row as the check-in; otherwise take the
 * student's earliest slot of the day.
 */
function resolveEnrollment(
  student: Student,
  date: string,
): { enrollment: Enrollment; record: AttendanceRecord | undefined } | null {
  const dayOfWeek = dayOfWeekFor(date);
  if (!dayOfWeek) return null;

  const todays = enrollments
    .filter((e) => e.studentId === student.id && e.dayOfWeek === dayOfWeek)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  if (todays.length === 0) return null;

  for (const enrollment of todays) {
    const record = getAttendanceRecord(attendanceRecordId(enrollment.id, date));
    if (record && !record.voidedAt) return { enrollment, record };
  }
  return { enrollment: todays[0], record: undefined };
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

export async function recordScan(input: ScanInput): Promise<ScanResult> {
  const action: ScanAction = isScanAction(input.action)
    ? input.action
    : "check-in";

  if (!isScanAction(input.action)) {
    return fail(action, "Unknown scan action.");
  }
  if (
    typeof input.date !== "string" ||
    !DATE_PATTERN.test(input.date) ||
    typeof input.time !== "string" ||
    !TIME_PATTERN.test(input.time)
  ) {
    return fail(action, "The scan station sent an invalid timestamp.");
  }

  const employee = findEmployeeByBarcode(
    employees,
    String(input.employeeBarcode ?? ""),
  );
  if (!employee) {
    return fail(action, "Employee badge not recognized.");
  }

  const student = findStudentByBarcode(
    students,
    String(input.studentBarcode ?? ""),
  );
  if (!student) {
    return fail(action, "Student barcode not recognized.", {
      employeeName: employee.name,
    });
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

  const resolved = resolveEnrollment(student, input.date);
  if (!resolved) {
    return fail(
      action,
      `${student.firstName} ${student.lastName} isn't scheduled today.`,
      {
        ...common,
        detail:
          "Use the Attendance page to record an unscheduled session by hand.",
      },
    );
  }

  const { enrollment, record } = resolved;
  const params = {
    enrollmentId: enrollment.id,
    date: input.date,
    time: input.time,
    employeeName: employee.name,
  };
  const checkedIn = Boolean(record?.checkInTime);

  let detail: string | undefined;

  switch (action) {
    case "check-in": {
      if (checkedIn && record) {
        return fail(action, "Already checked in today.", {
          ...common,
          detail: record.checkOutTime
            ? `In at ${record.checkInTime}, out at ${record.checkOutTime}.`
            : `Checked in at ${record.checkInTime}.`,
        });
      }
      const recordId = recordCheckIn(params);
      const written = getAttendanceRecord(recordId);
      if (written?.status === "late") {
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
