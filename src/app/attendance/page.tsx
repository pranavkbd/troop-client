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
  const todaysRecords = attendanceRecords.filter(
    (record) => record.date === TODAY && record.status === "present"
  );

  const initialPresentStudents = students
    .flatMap((student) => {
      const record = todaysRecords.find(
        (r) => r.studentId === student.id && !r.checkOutTime
      );
      return record
        ? [{ student, checkInTime: record.checkInTime ?? "—" }]
        : [];
    });

  const initialCheckedOutStudents = students.flatMap((student) => {
    const record = todaysRecords.find(
      (r) => r.studentId === student.id && r.checkOutTime
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
      initialPresentStudents={initialPresentStudents}
      initialCheckedOutStudents={initialCheckedOutStudents}
    />
  );
}
