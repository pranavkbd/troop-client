import { AttendanceBoard } from "@/components/attendance-board";
import { attendanceRecords, students } from "@/lib/mock-data";

const TODAY = "2026-08-25";

const formattedToday = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
}).format(new Date(`${TODAY}T00:00:00`));

export default function AttendancePage() {
  const checkInTimes = new Map(
    attendanceRecords
      .filter((record) => record.date === TODAY && record.status === "present")
      .map((record) => [record.studentId, record.checkInTime ?? "—"])
  );

  const initialPresentStudents = students
    .filter((student) => checkInTimes.has(student.id))
    .map((student) => ({
      student,
      checkInTime: checkInTimes.get(student.id) ?? "—",
    }));

  return (
    <AttendanceBoard
      formattedToday={formattedToday}
      allStudents={students}
      initialPresentStudents={initialPresentStudents}
    />
  );
}
