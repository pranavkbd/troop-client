import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { attendanceRecords, sessions, students } from "@/lib/mock-data";
import type { AttendanceStatus, StudentStatus } from "@/lib/types";

const statusVariant: Record<
  StudentStatus,
  "default" | "secondary" | "outline"
> = {
  active: "default",
  paused: "secondary",
  inactive: "outline",
};

const attendanceStatusVariant: Record<
  AttendanceStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  present: "default",
  late: "secondary",
  excused: "outline",
  absent: "destructive",
  unknown: "secondary",
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

export default async function StudentDetailPage(
  props: PageProps<"/students/[id]">
) {
  const { id } = await props.params;
  const student = students.find((s) => s.id === id);

  if (!student) {
    notFound();
  }

  const history = attendanceRecords
    .filter((record) => record.studentId === student.id)
    .map((record) => ({
      record,
      session: sessions.find((s) => s.id === record.sessionId),
    }))
    .sort((a, b) => b.record.date.localeCompare(a.record.date));

  const initials = `${student.firstName[0]}${student.lastName[0]}`;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/students"
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to students
      </Link>

      <Card>
        <CardContent className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <Avatar size="lg">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-2xl font-semibold tracking-tight">
                  {student.firstName} {student.lastName}
                </h1>
                <Badge variant={statusVariant[student.status]}>
                  {student.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Student ID {student.id} · Enrolled {formatDate(student.enrolledAt)}
              </p>
            </div>
          </div>
          <div className="flex gap-1.5">
            {Object.entries(student.levels).map(([subject, level]) => (
              <Badge key={subject} variant="secondary">
                {subject} {level}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Email</span>
              <span>{student.email ?? "—"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Phone</span>
              <span>{student.phone ?? "—"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Guardian</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Name</span>
              <span>{student.guardianName}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Phone</span>
              <span>{student.guardianPhone}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance history</CardTitle>
          <CardDescription>
            {history.length} check-in{history.length === 1 ? "" : "s"} recorded.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Check-out</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.length ? (
                  history.map(({ record, session }) => (
                    <TableRow key={record.id}>
                      <TableCell>{formatDate(record.date)}</TableCell>
                      <TableCell>
                        {session
                          ? `${session.subject} · ${session.dayOfWeek} ${session.startTime}`
                          : "—"}
                      </TableCell>
                      <TableCell>{record.checkInTime ?? "—"}</TableCell>
                      <TableCell>{record.checkOutTime ?? "—"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={attendanceStatusVariant[record.status]}
                        >
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {record.notes ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No attendance records yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
