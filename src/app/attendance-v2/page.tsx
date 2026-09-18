import {
  AttendanceBoardV2,
  type ExcusedEntry,
} from "@/components/attendance-board-v2";
import { enrollments, getAttendanceRecords, students } from "@/lib/mock-data";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function todayLocal() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default async function AttendanceV2Page(
  props: PageProps<"/attendance-v2">,
) {
  const searchParams = await props.searchParams;
  const rawDate = searchParams.date;
  const selectedDate =
    typeof rawDate === "string" && DATE_PATTERN.test(rawDate)
      ? rawDate
      : todayLocal();
  const selectedDateObj = new Date(`${selectedDate}T00:00:00`);

  const selectedDayOfWeek = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
  }).format(selectedDateObj);

  const scheduledTimes: Record<string, string> = {};
  for (const enrollment of enrollments) {
    if (enrollment.dayOfWeek !== selectedDayOfWeek) continue;
    const current = scheduledTimes[enrollment.studentId];
    if (!current || enrollment.startTime < current) {
      scheduledTimes[enrollment.studentId] = enrollment.startTime;
    }
  }

  const attendanceRecords = getAttendanceRecords().filter(
    (record) => !record.voidedAt,
  );
  const todaysRecords = attendanceRecords.filter(
    (record) =>
      record.date === selectedDate &&
      (record.status === "present" || record.status === "late"),
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
    <AttendanceBoardV2
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
