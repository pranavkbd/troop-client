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

const DEFAULT_DATE = "2026-08-25";
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export default async function AttendancePage(props: PageProps<"/attendance">) {
  const searchParams = await props.searchParams;
  const rawDate = searchParams.date;
  const selectedDate =
    typeof rawDate === "string" && DATE_PATTERN.test(rawDate)
      ? rawDate
      : DEFAULT_DATE;
  const selectedDateObj = new Date(`${selectedDate}T00:00:00`);

  const selectedDayOfWeek = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
  }).format(selectedDateObj);

  const sessionsToday = sessions.filter(
    (session) => session.dayOfWeek === selectedDayOfWeek,
  );
  const sessionStartTimeById = new Map(
    sessionsToday.map((session) => [session.id, session.startTime]),
  );

  const scheduledTimes: Record<string, string> = {};
  for (const enrollment of enrollments) {
    const startTime = sessionStartTimeById.get(enrollment.sessionId);
    if (!startTime) continue;
    const current = scheduledTimes[enrollment.studentId];
    if (!current || startTime < current) {
      scheduledTimes[enrollment.studentId] = startTime;
    }
  }

  const todaysRecords = attendanceRecords.filter(
    (record) => record.date === selectedDate && record.status === "present",
  );

  const initialExcusedStudents: ExcusedEntry[] = students.flatMap(
    (student): ExcusedEntry[] => {
      const record = attendanceRecords.find(
        (r) =>
          r.studentId === student.id &&
          r.date === selectedDate &&
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
      key={selectedDate}
      selectedDate={selectedDate}
      allStudents={students}
      scheduledTimes={scheduledTimes}
      initialExcusedStudents={initialExcusedStudents}
      initialPresentStudents={initialPresentStudents}
      initialCheckedOutStudents={initialCheckedOutStudents}
    />
  );
}
