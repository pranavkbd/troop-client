export type Subject = "Math" | "Reading";

export type StudentStatus = "active" | "paused" | "inactive";

export type AttendanceStatus = "present" | "absent" | "late" | "excused";

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

export interface Session {
  id: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  subject: Subject;
  instructor: string;
  room?: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  sessionId: string;
  subject: Subject;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  sessionId: string;
  date: string;
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  notes?: string;
}
