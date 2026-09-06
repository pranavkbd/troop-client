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
