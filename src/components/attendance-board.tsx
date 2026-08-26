"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  AttendanceRecord,
  AttendanceStatus,
  Enrollment,
  Session,
  Student,
} from "@/lib/types";

const statusVariant: Record<
  AttendanceStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  present: "default",
  late: "secondary",
  excused: "outline",
  absent: "destructive",
};

const statusOptions: AttendanceStatus[] = [
  "present",
  "late",
  "absent",
  "excused",
];

interface AttendanceBoardProps {
  date: string;
  sessions: Session[];
  students: Student[];
  enrollments: Enrollment[];
  initialRecords: AttendanceRecord[];
}

export function AttendanceBoard({
  date,
  sessions,
  students,
  enrollments,
  initialRecords,
}: AttendanceBoardProps) {
  const [records, setRecords] = useState<Record<string, AttendanceStatus>>(
    () => {
      const map: Record<string, AttendanceStatus> = {};
      for (const record of initialRecords) {
        map[`${record.sessionId}:${record.studentId}`] = record.status;
      }
      return map;
    }
  );

  function setStatus(
    sessionId: string,
    studentId: string,
    status: AttendanceStatus
  ) {
    setRecords((prev) => ({
      ...prev,
      [`${sessionId}:${studentId}`]: status,
    }));
  }

  return (
    <Tabs defaultValue={sessions[0]?.id}>
      <TabsList>
        {sessions.map((session) => (
          <TabsTrigger key={session.id} value={session.id}>
            {session.subject} · {session.startTime}
          </TabsTrigger>
        ))}
      </TabsList>

      {sessions.map((session) => {
        const roster = students.filter((student) =>
          enrollments.some(
            (e) => e.sessionId === session.id && e.studentId === student.id
          )
        );

        return (
          <TabsContent key={session.id} value={session.id}>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Set status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roster.map((student) => {
                    const key = `${session.id}:${student.id}`;
                    const status = records[key] ?? "absent";

                    return (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">
                          {student.firstName} {student.lastName}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant[status]}>
                            {status}
                          </Badge>
                        </TableCell>
                        <TableCell className="flex justify-end">
                          <Select
                            value={status}
                            onValueChange={(value) =>
                              setStatus(
                                session.id,
                                student.id,
                                value as AttendanceStatus
                              )
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {statusOptions.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {roster.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-muted-foreground text-center"
                      >
                        No students enrolled in this session.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <p className="text-muted-foreground mt-3 text-sm">
              {session.instructor} · {session.room} · {date}
            </p>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
