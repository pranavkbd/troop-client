import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BarcodePanel } from "@/components/barcode-panel";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  enrollments,
  getActiveBarcode,
  getActivityLog,
  getAttendanceRecords,
  getBarcodes,
  students,
} from "@/lib/mock-data";
import { EXPERIMENT_DAYS } from "@/lib/schedule-experiment-utils";
import {
  compareByDayThenTime,
  type DayOfWeek,
  type Enrollment,
  type StudentStatus,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const DAY_INDEX: Record<DayOfWeek, number> = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function formatTime12h(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "pm" : "am";
  const hours12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hours12}:${String(minutes).padStart(2, "0")}${period}`;
}

function getNextOccurrence(
  enrollment: Pick<Enrollment, "dayOfWeek" | "startTime">,
  from: Date,
) {
  const [hours, minutes] = enrollment.startTime.split(":").map(Number);
  const next = new Date(from);
  next.setHours(hours, minutes, 0, 0);

  let daysUntil = (DAY_INDEX[enrollment.dayOfWeek] - from.getDay() + 7) % 7;
  if (daysUntil === 0 && next <= from) {
    daysUntil = 7;
  }
  next.setDate(next.getDate() + daysUntil);
  return next;
}

function formatNextSessionDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
}

const statusVariant: Record<
  StudentStatus,
  "default" | "secondary" | "outline"
> = {
  active: "default",
  paused: "secondary",
  inactive: "outline",
};

function formatActivityTimestamp(isoDateTime: string) {
  const date = new Date(isoDateTime);
  const datePart = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(date);

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? "pm" : "am";
  const hours12 = hours % 12 === 0 ? 12 : hours % 12;
  const timePart = `${hours12}:${String(minutes).padStart(2, "0")}${period}`;

  return `${datePart}, ${timePart}`;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

export default async function StudentDetailPage(
  props: PageProps<"/students/[id]">,
) {
  const { id } = await props.params;
  const student = students.find((s) => s.id === id);

  if (!student) {
    notFound();
  }

  const history = getAttendanceRecords()
    .filter((record) => record.studentId === student.id && !record.voidedAt)
    .sort((a, b) => b.date.localeCompare(a.date));

  const studentActivityLog = getActivityLog().filter(
    (entry) => entry.studentId === student.id,
  );

  const schedule = enrollments
    .filter((enrollment) => enrollment.studentId === student.id)
    .sort(compareByDayThenTime);

  const now = new Date();
  const nextSession = schedule
    .map((enrollment) => ({
      enrollment,
      date: getNextOccurrence(enrollment, now),
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())[0];

  const weeklyOverview = EXPERIMENT_DAYS.map((day) => ({
    day,
    enrollment: schedule.find(
      (enrollment) => (enrollment.dayOfWeek as string) === day,
    ),
  }));

  const initials = `${student.firstName[0]}${student.lastName[0]}`;
  const barcode = getActiveBarcode("student", student.id);
  const barcodeHistory = getBarcodes("student", student.id).filter(
    (b) => b.voidedAt,
  );

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
                Student ID {student.id} · Enrolled{" "}
                {formatDate(student.enrolledAt)}
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

      <Card>
        <CardHeader>
          <CardTitle>Barcode</CardTitle>
        </CardHeader>
        <CardContent>
          {barcode ? (
            <BarcodePanel
              owner={{
                kind: "student",
                id: student.id,
                name: `${student.firstName} ${student.lastName}`,
              }}
              barcode={barcode}
              history={barcodeHistory}
            />
          ) : (
            <p className="text-sm text-destructive">
              This student has no active barcode, which shouldn't happen.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Schedule</CardTitle>
          <CardAction>
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={
                <Link href={`/students/${student.id}/schedule-experiment-2`} />
              }
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit schedule
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {weeklyOverview.map(({ day }) => (
              <div
                key={day}
                className="rounded-md bg-muted px-2 py-1.5 text-center text-sm font-medium"
              >
                {day}
              </div>
            ))}
            {weeklyOverview.map(({ day, enrollment }) => (
              <div
                key={day}
                className={cn(
                  "rounded-md px-2 py-1.5 text-center text-sm ring-1 ring-foreground/10",
                  enrollment
                    ? "bg-green-600 font-medium text-white ring-transparent dark:bg-green-500"
                    : "text-muted-foreground",
                )}
              >
                {enrollment ? formatTime12h(enrollment.startTime) : "–"}
              </div>
            ))}
          </div>
          {nextSession ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Next session: {formatNextSessionDate(nextSession.date)} at{" "}
              {formatTime12h(nextSession.enrollment.startTime)}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="attendance">
            <TabsList>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="activity-log">Activity Log</TabsTrigger>
            </TabsList>

            <TabsContent value="attendance" className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">
                {history.length} check-in{history.length === 1 ? "" : "s"}{" "}
                recorded.
              </p>
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead>Check-out</TableHead>
                      <TableHead>Picked up</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.length ? (
                      history.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            {formatDate(record.date)}
                            {record.enrollmentId ? null : (
                              <span className="text-muted-foreground">
                                {" "}
                                · Walk-in
                              </span>
                            )}
                          </TableCell>
                          <TableCell>{record.checkInTime ?? "—"}</TableCell>
                          <TableCell>{record.checkOutTime ?? "—"}</TableCell>
                          <TableCell>{record.pickedUpTime ?? "—"}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {record.notes ?? "—"}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="h-24 text-center text-muted-foreground"
                        >
                          No attendance records yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="activity-log" className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">
                {studentActivityLog.length} activity log entr
                {studentActivityLog.length === 1 ? "y" : "ies"}.
              </p>
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date &amp; time</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Metadata</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentActivityLog.length ? (
                      studentActivityLog.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="whitespace-nowrap">
                            {formatActivityTimestamp(entry.occurredAt)}
                          </TableCell>
                          <TableCell>{entry.employeeName}</TableCell>
                          <TableCell>{entry.action}</TableCell>
                          <TableCell>
                            {student.firstName} {student.lastName}
                          </TableCell>
                          <TableCell>
                            <code className="text-xs text-muted-foreground">
                              {JSON.stringify(entry.metadata)}
                            </code>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="h-24 text-center text-muted-foreground"
                        >
                          No activity recorded yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
