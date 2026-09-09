export type Subject = "Math" | "Reading";

export type StudentStatus = "active" | "paused" | "inactive";

export type AttendanceStatus =
  | "present"
  | "absent"
  | "late"
  | "excused"
  | "unknown";

export type ExcuseReason = "sick" | "vacation" | "other";

export type DayOfWeek = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  guardianName: string;
  guardianPhone: string;
  levels: Partial<Record<Subject, string>>;
  status: StudentStatus;
  enrolledAt: string;
}

export type EmployeeRole = "Front Desk" | "Instructor" | "Admin";

export interface Employee {
  id: string;
  name: string;
  pin: string;
  role: EmployeeRole;
}

export interface Enrollment {
  id: string;
  studentId: string;
  subject: Subject;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  instructor: string;
  room?: string;
}

export type ActivityAction =
  | "Checked In"
  | "Checked Out"
  | "Marked Absent"
  | "Marked Excused"
  | "Edited Attendance Record"
  | "Voided Attendance Record";

export interface ActivityLogEntry {
  id: string;
  studentId: string;
  employeeName: string;
  action: ActivityAction;
  /** ISO 8601 timestamp */
  occurredAt: string;
  metadata: Record<string, unknown>;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  enrollmentId: string;
  date: string;
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  excuseReason?: ExcuseReason;
  notes?: string;
  /** Set when the record has been retracted; the row is kept for its history, not deleted. */
  voidedAt?: string;
  voidReason?: string;
}

export const DAY_ORDER: DayOfWeek[] = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

export function compareByDayThenTime(
  a: { dayOfWeek: DayOfWeek; startTime: string },
  b: { dayOfWeek: DayOfWeek; startTime: string },
): number {
  const dayDiff =
    DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek);
  if (dayDiff !== 0) return dayDiff;
  return a.startTime.localeCompare(b.startTime);
}
