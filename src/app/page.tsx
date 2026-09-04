import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { attendanceRecords, sessions, students } from "@/lib/mock-data";

const today = "2026-08-25";

export default function Home() {
  const activeStudents = students.filter((s) => s.status === "active");
  const todayRecords = attendanceRecords.filter((a) => a.date === today);
  const presentCount = todayRecords.filter(
    (a) => a.status === "present" || a.status === "late",
  ).length;
  const attendanceRate = todayRecords.length
    ? Math.round((presentCount / todayRecords.length) * 100)
    : 0;

  const stats = [
    { label: "Active students", value: activeStudents.length },
    { label: "Sessions today", value: 2 },
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
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between border-b pb-3 last:border-b-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-medium">
                  {session.subject} — {session.dayOfWeek} {session.startTime}–
                  {session.endTime}
                </p>
                <p className="text-muted-foreground text-sm">
                  {session.instructor} · {session.room}
                </p>
              </div>
              <Badge variant="secondary">{session.subject}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
