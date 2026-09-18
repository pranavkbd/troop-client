import { faker } from "@faker-js/faker";

import { employeeBarcode, studentBarcode } from "@/lib/barcode";
import type {
  ActivityLogEntry,
  AttendanceRecord,
  AttendanceStatus,
  DayOfWeek,
  Employee,
  Enrollment,
  ExcuseReason,
  Student,
  Subject,
} from "@/lib/types";

const generatedSubjects = ["Math", "Reading"] as const;
const generatedStatuses: Student["status"][] = [
  "active",
  "active",
  "active",
  "active",
  "active",
  "active",
  "paused",
  "inactive",
];

type StudentSeed = Omit<Student, "barcode">;

function generateStudents(count: number, startNumber: number): StudentSeed[] {
  faker.seed(1234);

  const result: StudentSeed[] = [];
  for (let i = 0; i < count; i++) {
    const idNumber = startNumber + i;
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const guardianFirstName = faker.person.firstName();
    const subject = faker.helpers.arrayElement(generatedSubjects);

    result.push({
      id: String(1000000 + idNumber),
      firstName,
      lastName,
      guardianName: `${guardianFirstName} ${lastName}`,
      guardianPhone: `(${faker.helpers.arrayElement(["604", "778"])}) 555-${faker.string.numeric(4)}`,
      levels: {
        [subject]: `${faker.number.int({ min: 1, max: 7 })}${faker.helpers.arrayElement(["A", "B", "C"])}`,
      },
      status: faker.helpers.arrayElement(generatedStatuses),
      enrolledAt: faker.date.past({ years: 2 }).toISOString().slice(0, 10),
    });
  }
  return result;
}

const studentSeeds: StudentSeed[] = [
  {
    id: "1000001",
    firstName: "Ava",
    lastName: "Nguyen",
    guardianName: "Linh Nguyen",
    guardianPhone: "(604) 555-0142",
    levels: { Math: "3A", Reading: "2B" },
    status: "active",
    enrolledAt: "2025-02-10",
  },
  {
    id: "1000002",
    firstName: "Ethan",
    lastName: "Cho",
    guardianName: "Michael Cho",
    guardianPhone: "(604) 555-0198",
    levels: { Math: "5B" },
    status: "active",
    enrolledAt: "2024-11-03",
  },
  {
    id: "1000003",
    firstName: "Sofia",
    lastName: "Ramirez",
    guardianName: "Carla Ramirez",
    guardianPhone: "(778) 555-0110",
    levels: { Math: "1A", Reading: "1A" },
    status: "active",
    enrolledAt: "2025-05-20",
  },
  {
    id: "1000004",
    firstName: "Liam",
    lastName: "Patel",
    guardianName: "Priya Patel",
    guardianPhone: "(604) 555-0177",
    levels: { Reading: "4C" },
    status: "paused",
    enrolledAt: "2024-08-15",
  },
  {
    id: "1000005",
    firstName: "Mia",
    lastName: "Tanaka",
    guardianName: "Kenji Tanaka",
    guardianPhone: "(778) 555-0164",
    levels: { Math: "2C", Reading: "3A" },
    status: "active",
    enrolledAt: "2025-01-27",
  },
  {
    id: "1000006",
    firstName: "Noah",
    lastName: "Kim",
    guardianName: "Grace Kim",
    guardianPhone: "(604) 555-0133",
    levels: { Math: "6A" },
    status: "inactive",
    enrolledAt: "2023-09-05",
  },
  {
    id: "1000007",
    firstName: "Zoe",
    lastName: "Bianchi",
    guardianName: "Marco Bianchi",
    guardianPhone: "(778) 555-0121",
    levels: { Math: "4A", Reading: "4A" },
    status: "active",
    enrolledAt: "2024-12-12",
  },
  {
    id: "1000008",
    firstName: "Oliver",
    lastName: "Singh",
    guardianName: "Ravi Singh",
    guardianPhone: "(604) 555-0155",
    levels: { Reading: "2A" },
    status: "active",
    enrolledAt: "2025-04-01",
  },
  {
    id: "1000009",
    firstName: "Isla",
    lastName: "Fraser",
    guardianName: "Emma Fraser",
    guardianPhone: "(604) 555-0189",
    levels: { Math: "1B", Reading: "2C" },
    status: "active",
    enrolledAt: "2025-03-14",
  },
  {
    id: "1000010",
    firstName: "Lucas",
    lastName: "Moreau",
    guardianName: "Julien Moreau",
    guardianPhone: "(778) 555-0143",
    levels: { Math: "7A" },
    status: "active",
    enrolledAt: "2024-09-22",
  },
  {
    id: "1000011",
    firstName: "Chloe",
    lastName: "Wong",
    guardianName: "Diane Wong",
    guardianPhone: "(604) 555-0166",
    levels: { Reading: "3C" },
    status: "paused",
    enrolledAt: "2025-06-09",
  },
  {
    id: "1000012",
    firstName: "Benjamin",
    lastName: "Okafor",
    guardianName: "Ade Okafor",
    guardianPhone: "(778) 555-0128",
    levels: { Math: "4B", Reading: "5A" },
    status: "active",
    enrolledAt: "2024-10-30",
  },
  {
    id: "1000013",
    firstName: "Aria",
    lastName: "Petrov",
    guardianName: "Nadia Petrov",
    guardianPhone: "(604) 555-0197",
    levels: { Math: "2B" },
    status: "active",
    enrolledAt: "2025-07-01",
  },
  {
    id: "1000014",
    firstName: "Mateo",
    lastName: "Silva",
    guardianName: "Renata Silva",
    guardianPhone: "(778) 555-0152",
    levels: { Reading: "1C" },
    status: "inactive",
    enrolledAt: "2023-11-18",
  },
  {
    id: "1000015",
    firstName: "Grace",
    lastName: "Dubois",
    guardianName: "Pierre Dubois",
    guardianPhone: "(604) 555-0184",
    levels: { Math: "5A", Reading: "5B" },
    status: "active",
    enrolledAt: "2025-01-08",
  },
  {
    id: "1000016",
    firstName: "Elijah",
    lastName: "Osei",
    guardianName: "Kwame Osei",
    guardianPhone: "(778) 555-0139",
    levels: { Math: "3B" },
    status: "active",
    enrolledAt: "2025-02-24",
  },
  {
    id: "1000017",
    firstName: "Nora",
    lastName: "Hansen",
    guardianName: "Lars Hansen",
    guardianPhone: "(604) 555-0171",
    levels: { Reading: "4B" },
    status: "paused",
    enrolledAt: "2024-07-19",
  },
  {
    id: "1000018",
    firstName: "Julian",
    lastName: "Castillo",
    guardianName: "Rosa Castillo",
    guardianPhone: "(778) 555-0163",
    levels: { Math: "6B", Reading: "6A" },
    status: "active",
    enrolledAt: "2024-05-06",
  },
  {
    id: "1000019",
    firstName: "Freya",
    lastName: "Lindqvist",
    guardianName: "Erik Lindqvist",
    guardianPhone: "(604) 555-0158",
    levels: { Math: "1C" },
    status: "active",
    enrolledAt: "2025-08-11",
  },
  {
    id: "1000020",
    firstName: "Samuel",
    lastName: "Adeyemi",
    guardianName: "Tunde Adeyemi",
    guardianPhone: "(778) 555-0147",
    levels: { Reading: "3B" },
    status: "inactive",
    enrolledAt: "2023-12-02",
  },
  ...generateStudents(180, 21),
];

export const students: Student[] = studentSeeds.map((seed) => ({
  ...seed,
  barcode: studentBarcode(seed.id),
}));

// Manually-curated schedule slots for the narrative students, inlined from
// what used to be the shared `sess1`..`sess4` catalog so the seeded story
// (Ava/Sofia/Mia Tue 16:00, Ethan/Zoe Thu 16:00, Zoe/Oliver Sat 10:00) is
// unchanged visually now that each enrollment carries its own time.
const manualEnrollments: Enrollment[] = [
  {
    id: "e1",
    studentId: "1000001",
    subject: "Math",
    dayOfWeek: "Tue",
    startTime: "16:00",
    endTime: "17:30",
    instructor: "Ms. Carter",
    room: "Room A",
  },
  {
    id: "e2",
    studentId: "1000001",
    subject: "Reading",
    dayOfWeek: "Tue",
    startTime: "16:00",
    endTime: "17:30",
    instructor: "Mr. Alvarez",
    room: "Room B",
  },
  {
    id: "e3",
    studentId: "1000002",
    subject: "Math",
    dayOfWeek: "Thu",
    startTime: "16:00",
    endTime: "17:30",
    instructor: "Ms. Carter",
    room: "Room A",
  },
  {
    id: "e4",
    studentId: "1000003",
    subject: "Math",
    dayOfWeek: "Tue",
    startTime: "16:00",
    endTime: "17:30",
    instructor: "Ms. Carter",
    room: "Room A",
  },
  {
    id: "e5",
    studentId: "1000003",
    subject: "Reading",
    dayOfWeek: "Tue",
    startTime: "16:00",
    endTime: "17:30",
    instructor: "Mr. Alvarez",
    room: "Room B",
  },
  {
    id: "e6",
    studentId: "1000005",
    subject: "Math",
    dayOfWeek: "Tue",
    startTime: "16:00",
    endTime: "17:30",
    instructor: "Ms. Carter",
    room: "Room A",
  },
  {
    id: "e7",
    studentId: "1000005",
    subject: "Reading",
    dayOfWeek: "Tue",
    startTime: "16:00",
    endTime: "17:30",
    instructor: "Mr. Alvarez",
    room: "Room B",
  },
  {
    id: "e8",
    studentId: "1000007",
    subject: "Math",
    dayOfWeek: "Thu",
    startTime: "16:00",
    endTime: "17:30",
    instructor: "Ms. Carter",
    room: "Room A",
  },
  {
    id: "e9",
    studentId: "1000007",
    subject: "Reading",
    dayOfWeek: "Sat",
    startTime: "10:00",
    endTime: "11:30",
    instructor: "Mr. Alvarez",
    room: "Room B",
  },
  {
    id: "e10",
    studentId: "1000008",
    subject: "Reading",
    dayOfWeek: "Sat",
    startTime: "10:00",
    endTime: "11:30",
    instructor: "Mr. Alvarez",
    room: "Room B",
  },
];

const TIME_SLOTS: {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}[] = [
  { dayOfWeek: "Mon", startTime: "15:00", endTime: "16:30" },
  { dayOfWeek: "Tue", startTime: "16:00", endTime: "17:30" },
  { dayOfWeek: "Wed", startTime: "15:30", endTime: "17:00" },
  { dayOfWeek: "Thu", startTime: "16:00", endTime: "17:30" },
  { dayOfWeek: "Thu", startTime: "17:30", endTime: "19:00" },
  { dayOfWeek: "Fri", startTime: "15:00", endTime: "16:30" },
  { dayOfWeek: "Sat", startTime: "10:00", endTime: "11:30" },
];

const INSTRUCTORS_BY_SUBJECT: Record<Subject, string[]> = {
  Math: ["Ms. Carter", "Mr. Nakamura"],
  Reading: ["Mr. Alvarez", "Ms. Delgado"],
};

const ROOMS = ["Room A", "Room B", "Room C"];

function timeRangesOverlap(
  a: { startTime: string; endTime: string },
  b: { startTime: string; endTime: string },
): boolean {
  return a.startTime < b.endTime && b.startTime < a.endTime;
}

function generateEnrollments(
  studentsNeedingEnrollment: Student[],
): Enrollment[] {
  faker.seed(5678);

  const result: Enrollment[] = [];
  for (const student of studentsNeedingEnrollment) {
    const studentSlots: (typeof TIME_SLOTS)[number][] = [];
    for (const subject of Object.keys(student.levels) as Subject[]) {
      let slot = faker.helpers.arrayElement(TIME_SLOTS);
      const maxAttempts = 5;
      for (
        let attempt = 0;
        attempt < maxAttempts &&
        studentSlots.some(
          (existing) =>
            existing.dayOfWeek === slot.dayOfWeek &&
            timeRangesOverlap(existing, slot),
        );
        attempt++
      ) {
        slot = faker.helpers.arrayElement(TIME_SLOTS);
      }
      studentSlots.push(slot);

      result.push({
        id: `e-gen-${student.id}-${subject}`,
        studentId: student.id,
        subject,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        instructor: faker.helpers.arrayElement(INSTRUCTORS_BY_SUBJECT[subject]),
        room: faker.helpers.arrayElement(ROOMS),
      });
    }
  }
  return result;
}

const manuallyEnrolledStudentIds = new Set(
  manualEnrollments.map((enrollment) => enrollment.studentId),
);

export const enrollments: Enrollment[] = [
  ...manualEnrollments,
  ...generateEnrollments(
    students.filter(
      (student) =>
        !manuallyEnrolledStudentIds.has(student.id) &&
        student.status === "active",
    ),
  ),
];

const excuseReasons: ExcuseReason[] = ["sick", "vacation", "other"];
const excuseNotesByReason: Record<ExcuseReason, string> = {
  sick: "Feeling unwell",
  vacation: "Family trip",
  other: "Excused by guardian",
};

export const employees: Employee[] = (
  [
    { id: "emp-1", name: "Front Desk", pin: "1234", role: "Front Desk" },
    { id: "emp-2", name: "Ms. Delgado", pin: "2468", role: "Instructor" },
    { id: "emp-3", name: "Mr. Nakamura", pin: "1357", role: "Instructor" },
    { id: "emp-4", name: "Ms. Carter", pin: "9081", role: "Instructor" },
    { id: "emp-5", name: "Mr. Alvarez", pin: "5150", role: "Instructor" },
    { id: "emp-6", name: "Ms. Whitfield", pin: "4321", role: "Admin" },
  ] satisfies Omit<Employee, "barcode">[]
).map((employee, index) => ({
  ...employee,
  barcode: employeeBarcode(index + 1),
}));

const FRONT_DESK_STAFF = employees.map((employee) => employee.name);

// ---------------------------------------------------------------------------
// Attendance store
//
// `activityLogEntries` is the source of truth: every check-in, check-out,
// edit, and void is appended here and never rewritten. `attendanceRecordsById`
// is a derived summary table (one row per enrollment/date) kept in sync with
// it on every write, inside a "transaction," so the two can never drift.
// ---------------------------------------------------------------------------

const activityLogEntries: ActivityLogEntry[] = [];
const attendanceRecordsById = new Map<string, AttendanceRecord>();

function withTransaction<T>(fn: () => T): T {
  const logSnapshot = [...activityLogEntries];
  const recordsSnapshot = new Map(attendanceRecordsById);
  try {
    return fn();
  } catch (error) {
    activityLogEntries.length = 0;
    activityLogEntries.push(...logSnapshot);
    attendanceRecordsById.clear();
    for (const [id, record] of recordsSnapshot) {
      attendanceRecordsById.set(id, record);
    }
    throw error;
  }
}

function appendEvent(entry: ActivityLogEntry) {
  activityLogEntries.push(entry);
}

function upsertAttendanceRecord(
  recordId: string,
  base: Pick<AttendanceRecord, "studentId" | "enrollmentId" | "date">,
  patch: Partial<AttendanceRecord>,
) {
  const existing = attendanceRecordsById.get(recordId);
  attendanceRecordsById.set(recordId, {
    id: recordId,
    status: "present",
    ...existing,
    // Every legitimate write un-voids the slot; voidAttendanceRecord is the
    // only caller that re-sets these through `patch`.
    voidedAt: undefined,
    voidReason: undefined,
    ...base,
    ...patch,
  });
}

export function getAttendanceRecord(
  recordId: string,
): AttendanceRecord | undefined {
  return attendanceRecordsById.get(recordId);
}

export function attendanceRecordId(enrollmentId: string, date: string) {
  return `${enrollmentId}-${date}`;
}

/** Record id for a session the student wasn't scheduled for. */
export function walkInRecordId(studentId: string, date: string) {
  return `walkin-${studentId}-${date}`;
}

/**
 * What a write is about: a scheduled slot, or a walk-in for a student who
 * has no slot that day. Either way the record id is deterministic, so the
 * same session always lands on the same row.
 */
export type SessionRef = { enrollmentId: string } | { walkInStudentId: string };

interface ResolvedSession {
  recordId: string;
  studentId: string;
  enrollment: Enrollment | null;
}

function resolveSession(ref: SessionRef, date: string): ResolvedSession {
  if ("enrollmentId" in ref) {
    const enrollment = enrollments.find((e) => e.id === ref.enrollmentId);
    if (!enrollment) {
      throw new Error(`Unknown enrollment ${ref.enrollmentId}`);
    }
    return {
      recordId: attendanceRecordId(enrollment.id, date),
      studentId: enrollment.studentId,
      enrollment,
    };
  }
  if (!students.some((s) => s.id === ref.walkInStudentId)) {
    throw new Error(`Unknown student ${ref.walkInStudentId}`);
  }
  return {
    recordId: walkInRecordId(ref.walkInStudentId, date),
    studentId: ref.walkInStudentId,
    enrollment: null,
  };
}

function sessionBase(session: ResolvedSession, date: string) {
  return {
    studentId: session.studentId,
    enrollmentId: session.enrollment?.id,
    date,
  };
}

function sessionMetadata(session: ResolvedSession) {
  return {
    attendanceRecordId: session.recordId,
    enrollmentId: session.enrollment?.id ?? null,
    walkIn: session.enrollment === null,
  };
}

const LATE_THRESHOLD_MINUTES = 10;

function minutesLate(scheduledStart: string, checkInTime: string): number {
  const [startHours, startMinutes] = scheduledStart.split(":").map(Number);
  const [inHours, inMinutes] = checkInTime.split(":").map(Number);
  return inHours * 60 + inMinutes - (startHours * 60 + startMinutes);
}

export function recordCheckIn(
  params: SessionRef & {
    date: string;
    time: string;
    employeeName: string;
  },
): string {
  const session = resolveSession(params, params.date);
  const { recordId, enrollment } = session;
  const isLate =
    enrollment !== null &&
    minutesLate(enrollment.startTime, params.time) > LATE_THRESHOLD_MINUTES;

  withTransaction(() => {
    appendEvent({
      id: `log-${recordId}-checkin-${activityLogEntries.length}`,
      studentId: session.studentId,
      employeeName: params.employeeName,
      action: "Checked In",
      occurredAt: `${params.date}T${params.time}:00`,
      metadata: {
        ...sessionMetadata(session),
        room: enrollment?.room ?? null,
      },
    });

    upsertAttendanceRecord(recordId, sessionBase(session, params.date), {
      status: isLate ? "late" : "present",
      checkInTime: params.time,
      // A check-in opens a fresh span. If the student already finished a
      // session today, the earlier one lives on in the activity log.
      checkOutTime: undefined,
    });
  });

  return recordId;
}

export function recordCheckOut(
  params: SessionRef & {
    date: string;
    time: string;
    employeeName: string;
  },
): string {
  const session = resolveSession(params, params.date);
  const { recordId } = session;

  withTransaction(() => {
    appendEvent({
      id: `log-${recordId}-checkout-${activityLogEntries.length}`,
      studentId: session.studentId,
      employeeName: params.employeeName,
      action: "Checked Out",
      occurredAt: `${params.date}T${params.time}:00`,
      metadata: sessionMetadata(session),
    });

    upsertAttendanceRecord(recordId, sessionBase(session, params.date), {
      checkOutTime: params.time,
    });
  });

  return recordId;
}

/**
 * A guardian collected the student. If the student was still checked in, the
 * pick-up also closes the session: both "Checked Out" and "Picked Up" are
 * logged, because both actually happened.
 */
export function recordPickUp(
  params: SessionRef & {
    date: string;
    time: string;
    employeeName: string;
  },
): string {
  const session = resolveSession(params, params.date);
  const { recordId } = session;
  const existing = attendanceRecordsById.get(recordId);
  const needsCheckOut = !existing?.checkOutTime;

  withTransaction(() => {
    if (needsCheckOut) {
      appendEvent({
        id: `log-${recordId}-checkout-${activityLogEntries.length}`,
        studentId: session.studentId,
        employeeName: params.employeeName,
        action: "Checked Out",
        occurredAt: `${params.date}T${params.time}:00`,
        metadata: { ...sessionMetadata(session), impliedByPickUp: true },
      });
    }

    appendEvent({
      id: `log-${recordId}-pickup-${activityLogEntries.length}`,
      studentId: session.studentId,
      employeeName: params.employeeName,
      action: "Picked Up",
      occurredAt: `${params.date}T${params.time}:00`,
      metadata: sessionMetadata(session),
    });

    upsertAttendanceRecord(
      recordId,
      sessionBase(session, params.date),
      needsCheckOut
        ? { checkOutTime: params.time, pickedUpTime: params.time }
        : { pickedUpTime: params.time },
    );
  });

  return recordId;
}

function recordAbsence(params: {
  enrollmentId: string;
  date: string;
  status: Extract<AttendanceStatus, "absent" | "excused" | "unknown">;
  employeeName: string;
  excuseReason?: ExcuseReason;
  notes?: string;
}): string {
  const enrollment = enrollments.find((e) => e.id === params.enrollmentId);
  if (!enrollment) {
    throw new Error(`Unknown enrollment ${params.enrollmentId}`);
  }

  const recordId = `${params.enrollmentId}-${params.date}`;

  withTransaction(() => {
    appendEvent({
      id: `log-${recordId}-${params.status}`,
      studentId: enrollment.studentId,
      employeeName: params.employeeName,
      action: params.status === "excused" ? "Marked Excused" : "Marked Absent",
      occurredAt: `${params.date}T08:30:00`,
      metadata: {
        attendanceRecordId: recordId,
        reason: params.excuseReason ?? null,
        notes: params.notes ?? null,
      },
    });

    upsertAttendanceRecord(
      recordId,
      {
        studentId: enrollment.studentId,
        enrollmentId: enrollment.id,
        date: params.date,
      },
      {
        status: params.status,
        excuseReason: params.excuseReason,
        notes: params.notes,
      },
    );
  });

  return recordId;
}

function editAttendanceField(params: {
  recordId: string;
  field: "checkInTime" | "checkOutTime";
  newValue: string;
  employeeName: string;
  occurredAt: string;
}) {
  const existing = attendanceRecordsById.get(params.recordId);
  if (!existing) {
    throw new Error(`Unknown attendance record ${params.recordId}`);
  }

  const previousValue = existing[params.field] ?? null;

  withTransaction(() => {
    appendEvent({
      id: `log-${params.recordId}-edit-${params.field}-${activityLogEntries.length}`,
      studentId: existing.studentId,
      employeeName: params.employeeName,
      action: "Edited Attendance Record",
      occurredAt: params.occurredAt,
      metadata: {
        attendanceRecordId: params.recordId,
        field: params.field,
        previousValue,
        newValue: params.newValue,
      },
    });

    upsertAttendanceRecord(
      params.recordId,
      {
        studentId: existing.studentId,
        enrollmentId: existing.enrollmentId,
        date: existing.date,
      },
      { [params.field]: params.newValue },
    );
  });
}

function voidAttendanceRecord(params: {
  recordId: string;
  reason: string;
  employeeName: string;
  occurredAt: string;
}) {
  const existing = attendanceRecordsById.get(params.recordId);
  if (!existing) {
    throw new Error(`Unknown attendance record ${params.recordId}`);
  }

  withTransaction(() => {
    appendEvent({
      id: `log-${params.recordId}-void`,
      studentId: existing.studentId,
      employeeName: params.employeeName,
      action: "Voided Attendance Record",
      occurredAt: params.occurredAt,
      metadata: {
        attendanceRecordId: params.recordId,
        reason: params.reason,
        snapshot: { ...existing },
      },
    });

    upsertAttendanceRecord(
      params.recordId,
      {
        studentId: existing.studentId,
        enrollmentId: existing.enrollmentId,
        date: existing.date,
      },
      { voidedAt: params.occurredAt, voidReason: params.reason },
    );
  });
}

// ---------------------------------------------------------------------------
// Seed data — every attendance fact below is written through the functions
// above, so `attendanceRecords` and `activityLog` (exported at the bottom)
// are always consistent with each other by construction.
// ---------------------------------------------------------------------------

interface NarrativeEntry {
  enrollmentId: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  status?: Extract<AttendanceStatus, "absent" | "excused">;
  notes?: string;
  excuseReason?: ExcuseReason;
}

const narrativeAttendance: NarrativeEntry[] = [
  // Week of 2026-08-25
  {
    enrollmentId: "e1",
    date: "2026-08-25",
    checkInTime: "16:02",
    checkOutTime: "17:28",
  },
  {
    enrollmentId: "e4",
    date: "2026-08-25",
    checkInTime: "16:15",
    checkOutTime: "17:30",
  },
  {
    enrollmentId: "e6",
    date: "2026-08-25",
    checkInTime: "15:58",
    checkOutTime: "17:25",
  },
  { enrollmentId: "e2", date: "2026-08-25", status: "absent", notes: "Sick" },
  {
    enrollmentId: "e5",
    date: "2026-08-25",
    checkInTime: "16:05",
    checkOutTime: "17:29",
  },
  {
    enrollmentId: "e7",
    date: "2026-08-25",
    status: "excused",
    excuseReason: "vacation",
    notes: "Family trip",
  },

  // Week of 2026-08-18
  {
    enrollmentId: "e1",
    date: "2026-08-18",
    checkInTime: "16:00",
    checkOutTime: "17:30",
  },
  {
    enrollmentId: "e2",
    date: "2026-08-18",
    checkInTime: "16:03",
    checkOutTime: "17:29",
  },
  {
    enrollmentId: "e4",
    date: "2026-08-18",
    checkInTime: "16:01",
    checkOutTime: "17:30",
  },
  {
    enrollmentId: "e5",
    date: "2026-08-18",
    checkInTime: "16:06",
    checkOutTime: "17:31",
  },
  {
    enrollmentId: "e6",
    date: "2026-08-18",
    checkInTime: "15:57",
    checkOutTime: "17:26",
  },
  {
    enrollmentId: "e7",
    date: "2026-08-18",
    checkInTime: "16:00",
    checkOutTime: "17:30",
  },
  {
    enrollmentId: "e9",
    date: "2026-08-22",
    checkInTime: "10:01",
    checkOutTime: "11:29",
  },
  {
    enrollmentId: "e10",
    date: "2026-08-22",
    checkInTime: "10:00",
    checkOutTime: "11:28",
  },
  {
    enrollmentId: "e3",
    date: "2026-08-20",
    checkInTime: "16:00",
    checkOutTime: "17:32",
  },
  {
    enrollmentId: "e8",
    date: "2026-08-20",
    checkInTime: "16:02",
    checkOutTime: "17:30",
  },

  // Week of 2026-08-11
  {
    enrollmentId: "e1",
    date: "2026-08-11",
    checkInTime: "16:12",
    checkOutTime: "17:30",
  },
  {
    enrollmentId: "e2",
    date: "2026-08-11",
    checkInTime: "16:01",
    checkOutTime: "17:28",
  },
  {
    enrollmentId: "e4",
    date: "2026-08-11",
    checkInTime: "15:58",
    checkOutTime: "17:29",
  },
  {
    enrollmentId: "e5",
    date: "2026-08-11",
    status: "excused",
    notes: "Doctor appointment",
  },
  {
    enrollmentId: "e6",
    date: "2026-08-11",
    checkInTime: "16:03",
    checkOutTime: "17:29",
  },
  {
    enrollmentId: "e7",
    date: "2026-08-11",
    checkInTime: "16:01",
    checkOutTime: "17:31",
  },
  {
    enrollmentId: "e3",
    date: "2026-08-13",
    checkInTime: "16:18",
    checkOutTime: "17:32",
  },
  {
    enrollmentId: "e8",
    date: "2026-08-13",
    checkInTime: "16:18",
    checkOutTime: "17:32",
  },
  {
    enrollmentId: "e9",
    date: "2026-08-15",
    checkInTime: "09:59",
    checkOutTime: "11:30",
  },
  {
    enrollmentId: "e10",
    date: "2026-08-15",
    checkInTime: "10:02",
    checkOutTime: "11:30",
  },

  // Week of 2026-08-04
  {
    enrollmentId: "e1",
    date: "2026-08-04",
    checkInTime: "15:59",
    checkOutTime: "17:31",
  },
  {
    enrollmentId: "e2",
    date: "2026-08-04",
    status: "absent",
    notes: "Family event",
  },
  {
    enrollmentId: "e4",
    date: "2026-08-04",
    checkInTime: "16:00",
    checkOutTime: "17:30",
  },
  {
    enrollmentId: "e5",
    date: "2026-08-04",
    checkInTime: "16:02",
    checkOutTime: "17:28",
  },
  {
    enrollmentId: "e6",
    date: "2026-08-04",
    status: "absent",
    notes: "Vacation",
  },
  {
    enrollmentId: "e7",
    date: "2026-08-04",
    status: "absent",
    notes: "Vacation",
  },
  {
    enrollmentId: "e3",
    date: "2026-08-06",
    checkInTime: "16:00",
    checkOutTime: "17:31",
  },
  {
    enrollmentId: "e8",
    date: "2026-08-06",
    checkInTime: "16:00",
    checkOutTime: "17:31",
  },
  {
    enrollmentId: "e9",
    date: "2026-08-08",
    status: "excused",
    notes: "Family trip",
  },
  {
    enrollmentId: "e10",
    date: "2026-08-08",
    checkInTime: "09:58",
    checkOutTime: "11:29",
  },
];

function seedNarrativeAttendance() {
  for (const entry of narrativeAttendance) {
    const enrollment = enrollments.find((e) => e.id === entry.enrollmentId);
    if (!enrollment) continue;

    if (entry.status) {
      recordAbsence({
        enrollmentId: entry.enrollmentId,
        date: entry.date,
        status: entry.status,
        employeeName: faker.helpers.arrayElement(FRONT_DESK_STAFF),
        excuseReason: entry.excuseReason,
        notes: entry.notes,
      });
      continue;
    }

    if (entry.checkInTime) {
      recordCheckIn({
        enrollmentId: entry.enrollmentId,
        date: entry.date,
        time: entry.checkInTime,
        employeeName: enrollment.instructor,
      });
    }
    if (entry.checkOutTime) {
      recordCheckOut({
        enrollmentId: entry.enrollmentId,
        date: entry.date,
        time: entry.checkOutTime,
        employeeName: enrollment.instructor,
      });
    }
  }
}

function seedGeneratedExcusedRecords() {
  faker.seed(91011);

  const candidates = enrollments.filter(
    (enrollment) =>
      enrollment.dayOfWeek === "Tue" && Number(enrollment.studentId) >= 1000021,
  );
  const picks = faker.helpers.arrayElements(candidates, 14);
  const [excusedPicks, unknownPicks] = [picks.slice(0, 10), picks.slice(10)];

  for (const enrollment of excusedPicks) {
    const excuseReason = faker.helpers.arrayElement(excuseReasons);
    const status = faker.helpers.arrayElement<"absent" | "excused">([
      "absent",
      "excused",
    ]);
    recordAbsence({
      enrollmentId: enrollment.id,
      date: "2026-08-25",
      status,
      employeeName: faker.helpers.arrayElement(FRONT_DESK_STAFF),
      excuseReason,
      notes: excuseNotesByReason[excuseReason],
    });
  }

  for (const enrollment of unknownPicks) {
    recordAbsence({
      enrollmentId: enrollment.id,
      date: "2026-08-25",
      status: "unknown",
      employeeName: faker.helpers.arrayElement(FRONT_DESK_STAFF),
      notes: "No show, no reason given",
    });
  }
}

function seedEditsAndVoids() {
  faker.seed(13579);

  const allRecordIds = Array.from(attendanceRecordsById.keys());

  const editableRecordIds = allRecordIds.filter((id) => {
    const record = attendanceRecordsById.get(id);
    return record && (record.checkInTime || record.checkOutTime);
  });
  const recordsToEdit = faker.helpers.arrayElements(
    editableRecordIds,
    Math.min(8, editableRecordIds.length),
  );

  for (const recordId of recordsToEdit) {
    const record = attendanceRecordsById.get(recordId);
    if (!record) continue;

    const editableFields = (["checkInTime", "checkOutTime"] as const).filter(
      (field) => record[field],
    );
    const field = faker.helpers.arrayElement(editableFields);
    const currentValue = record[field] as string;
    const [hours, minutes] = currentValue.split(":").map(Number);
    const driftMinutes = faker.helpers.arrayElement([-10, -5, 5, 10]);
    const corrected = new Date(2000, 0, 1, hours, minutes + driftMinutes);
    const newValue = `${String(corrected.getHours()).padStart(2, "0")}:${String(corrected.getMinutes()).padStart(2, "0")}`;

    editAttendanceField({
      recordId,
      field,
      newValue,
      employeeName: faker.helpers.arrayElement(FRONT_DESK_STAFF),
      occurredAt: "2026-09-10T11:30:00",
    });
  }

  const voidCandidateIds = faker.helpers.arrayElements(
    allRecordIds,
    Math.min(4, allRecordIds.length),
  );

  voidCandidateIds.forEach((recordId, index) => {
    voidAttendanceRecord({
      recordId,
      reason: "Duplicate entry",
      employeeName: faker.helpers.arrayElement(FRONT_DESK_STAFF),
      occurredAt: `2026-09-1${index + 1}T09:15:00`,
    });
  });
}

seedNarrativeAttendance();
seedGeneratedExcusedRecords();
seedEditsAndVoids();

/** Current derived summary rows. Read live so server-action writes show up. */
export function getAttendanceRecords(): AttendanceRecord[] {
  return Array.from(attendanceRecordsById.values());
}

/** The append-only ledger, newest first. */
export function getActivityLog(): ActivityLogEntry[] {
  return [...activityLogEntries].sort((a, b) =>
    b.occurredAt.localeCompare(a.occurredAt),
  );
}
