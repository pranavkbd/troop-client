import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { attendanceRecords, enrollments, students } from "@/lib/mock-data";
import type { DayOfWeek, Enrollment } from "@/lib/types";

const today = "2026-08-25";
const todaysDayOfWeek: DayOfWeek = "Tue";

function groupKey(enrollment: Enrollment) {
  return [
    enrollment.dayOfWeek,
    enrollment.startTime,
    enrollment.endTime,
    enrollment.subject,
    enrollment.instructor,
    enrollment.room ?? "",
  ].join("|");
}

export default function Home() {
  const activeStudents = students.filter((s) => s.status === "active");
  const todayRecords = attendanceRecords.filter((a) => a.date === today);
  const presentCount = todayRecords.filter(
    (a) => a.status === "present" || a.status === "late",
  ).length;
  const attendanceRate = todayRecords.length
    ? Math.round((presentCount / todayRecords.length) * 100)
    : 0;

  const todaysEnrollments = enrollments.filter(
    (e) => e.dayOfWeek === todaysDayOfWeek,
  );
  const groups = new Map<
    string,
    { enrollment: Enrollment; studentCount: number }
  >();
  for (const enrollment of todaysEnrollments) {
    const key = groupKey(enrollment);
    const existing = groups.get(key);
    if (existing) {
      existing.studentCount += 1;
    } else {
      groups.set(key, { enrollment, studentCount: 1 });
    }
  }
  const upcomingSessions = [...groups.values()].sort((a, b) =>
    a.enrollment.startTime.localeCompare(b.enrollment.startTime),
  );

  const stats = [
    { label: "Active students", value: activeStudents.length },
    { label: "Sessions today", value: upcomingSessions.length },
    { label: "Present today", value: presentCount },
    { label: "Attendance rate", value: `${attendanceRate}%` },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Overview of today&apos;s attendance and roster.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming sessions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {upcomingSessions.map(({ enrollment, studentCount }) => (
            <div
              key={groupKey(enrollment)}
              className="flex items-center justify-between border-b pb-3 last:border-b-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-medium">
                  {enrollment.subject} — {enrollment.dayOfWeek}{" "}
                  {enrollment.startTime}–{enrollment.endTime}
                </p>
                <p className="text-muted-foreground text-sm">
                  {enrollment.instructor} · {enrollment.room} · {studentCount}{" "}
                  student{studentCount === 1 ? "" : "s"}
                </p>
              </div>
              <Badge variant="secondary">{enrollment.subject}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
