import { AttendanceBoard } from "@/components/attendance-board";
import {
  attendanceRecords,
  enrollments,
  sessions,
  students,
} from "@/lib/mock-data";

const TODAY = "2026-08-25";
const TODAY_DAY = "Tue";

export default function AttendancePage() {
  const sessionsToday = sessions.filter((s) => s.dayOfWeek === TODAY_DAY);
  const recordsToday = attendanceRecords.filter((r) => r.date === TODAY);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Attendance</h1>
        <p className="text-muted-foreground text-sm">
          Mark attendance for today&apos;s sessions.
        </p>
      </div>

      <AttendanceBoard
        date={TODAY}
        sessions={sessionsToday}
        students={students}
        enrollments={enrollments}
        initialRecords={recordsToday}
      />
    </div>
  );
}
