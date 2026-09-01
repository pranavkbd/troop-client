import {
  AttendanceBoard,
  type ExcusedEntry,
} from "@/components/attendance-board";
import {
  attendanceRecords,
  enrollments,
  sessions,
  students,
} from "@/lib/mock-data";

const TODAY = "2026-08-25";
const TODAY_DATE = new Date(`${TODAY}T00:00:00`);

const formattedToday = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
}).format(TODAY_DATE);

const todayDayOfWeek = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
}).format(TODAY_DATE);

export default function AttendancePage() {
  const sessionIdsToday = sessions
    .filter((session) => session.dayOfWeek === todayDayOfWeek)
    .map((session) => session.id);

  const expectedStudentIds = Array.from(
    new Set(
      enrollments
        .filter((enrollment) => sessionIdsToday.includes(enrollment.sessionId))
        .map((enrollment) => enrollment.studentId),
    ),
  );

  const todaysRecords = attendanceRecords.filter(
    (record) => record.date === TODAY && record.status === "present",
  );

  const initialExcusedStudents: ExcusedEntry[] = students.flatMap(
    (student): ExcusedEntry[] => {
      const record = attendanceRecords.find(
        (r) =>
          r.studentId === student.id &&
          r.date === TODAY &&
          (r.status === "absent" ||
            r.status === "excused" ||
            r.status === "unknown"),
      );
      if (!record) return [];
      if (record.status === "unknown") {
        const entry: ExcusedEntry = {
          student,
          kind: "unknown",
          notes: record.notes,
        };
        return [entry];
      }
      const entry: ExcusedEntry = {
        student,
        kind: "excused",
        reason: record.excuseReason ?? "other",
        notes: record.notes,
      };
      return [entry];
    },
  );

  const initialPresentStudents = students.flatMap((student) => {
    const record = todaysRecords.find(
      (r) => r.studentId === student.id && !r.checkOutTime,
    );
    return record ? [{ student, checkInTime: record.checkInTime ?? "—" }] : [];
  });

  const initialCheckedOutStudents = students.flatMap((student) => {
    const record = todaysRecords.find(
      (r) => r.studentId === student.id && r.checkOutTime,
    );
    return record
      ? [
          {
            student,
            checkInTime: record.checkInTime ?? "—",
            checkOutTime: record.checkOutTime ?? "—",
          },
        ]
      : [];
  });

  return (
    <AttendanceBoard
      formattedToday={formattedToday}
      allStudents={students}
      expectedStudentIds={expectedStudentIds}
      initialExcusedStudents={initialExcusedStudents}
      initialPresentStudents={initialPresentStudents}
      initialCheckedOutStudents={initialCheckedOutStudents}
    />
  );
}
