import { AttendanceBoard } from "@/components/attendance-board";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { attendanceRecords, students } from "@/lib/mock-data";

const TODAY = "2026-08-25";

export default function AttendancePage() {
  const presentStudentIds = new Set(
    attendanceRecords
      .filter((record) => record.date === TODAY && record.status === "present")
      .map((record) => record.studentId)
  );
  const presentStudents = students.filter((student) =>
    presentStudentIds.has(student.id)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-semibold tracking-tight">
          Attendance
        </CardTitle>
        <CardDescription>Mark attendance for {TODAY}.</CardDescription>
      </CardHeader>
      <CardContent>
        <AttendanceBoard presentStudents={presentStudents} />
      </CardContent>
    </Card>
  );
}
