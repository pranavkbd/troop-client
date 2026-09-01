"use client";

import { PlusIcon, XIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import type { ExcuseReason, Student } from "@/lib/types";

function byName(a: Student, b: Student) {
  return (
    a.lastName.localeCompare(b.lastName) ||
    a.firstName.localeCompare(b.firstName)
  );
}

interface PresentEntry {
  student: Student;
  checkInTime: string;
}

interface CheckedOutEntry {
  student: Student;
  checkInTime: string;
  checkOutTime: string;
}

export type ExcusedEntry =
  | { student: Student; kind: "excused"; reason: ExcuseReason; notes?: string }
  | { student: Student; kind: "unknown"; notes?: string };

type RosterRow =
  | { status: "not-checked-in"; student: Student }
  | { status: "present"; student: Student; checkInTime: string }
  | {
      status: "checked-out";
      student: Student;
      checkInTime: string;
      checkOutTime: string;
    }
  | {
      status: "excused";
      student: Student;
      reason: ExcuseReason;
      notes?: string;
    }
  | { status: "unknown"; student: Student; notes?: string };

interface AttendanceBoardProps {
  formattedToday: string;
  allStudents: Student[];
  expectedStudentIds: string[];
  initialPresentStudents: PresentEntry[];
  initialCheckedOutStudents: CheckedOutEntry[];
  initialExcusedStudents: ExcusedEntry[];
}

function ExpectedDot() {
  return (
    <span
      className="h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500"
      title="Expected today"
    >
      <span className="sr-only">Expected today</span>
    </span>
  );
}

const excuseReasonLabels: Record<ExcuseReason, string> = {
  sick: "Sick",
  vacation: "Vacation",
  other: "Excused",
};

const enrollmentStatusLabels: Partial<Record<Student["status"], string>> = {
  paused: "Paused",
  inactive: "Inactive",
};

function EnrollmentStatusBadge({ status }: { status: Student["status"] }) {
  const label = enrollmentStatusLabels[status];
  if (!label) return null;
  return (
    <Badge variant="outline" className="h-4 px-1 text-[10px]">
      {label}
    </Badge>
  );
}

function formatTime(date: Date) {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function AttendanceBoard({
  formattedToday,
  allStudents,
  expectedStudentIds,
  initialPresentStudents,
  initialCheckedOutStudents,
  initialExcusedStudents,
}: AttendanceBoardProps) {
  const expectedIds = useMemo(
    () => new Set(expectedStudentIds),
    [expectedStudentIds],
  );
  const [present, setPresent] = useState<Map<string, PresentEntry>>(
    () =>
      new Map(initialPresentStudents.map((entry) => [entry.student.id, entry])),
  );
  const [checkedOut, setCheckedOut] = useState<Map<string, CheckedOutEntry>>(
    () =>
      new Map(
        initialCheckedOutStudents.map((entry) => [entry.student.id, entry]),
      ),
  );
  const [excused, setExcused] = useState<Map<string, ExcusedEntry>>(
    () =>
      new Map(initialExcusedStudents.map((entry) => [entry.student.id, entry])),
  );
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [staged, setStaged] = useState<Student[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);

  const buildRosterRow = useCallback(
    (student: Student): RosterRow => {
      const checkedOutEntry = checkedOut.get(student.id);
      if (checkedOutEntry) {
        return {
          status: "checked-out",
          student,
          checkInTime: checkedOutEntry.checkInTime,
          checkOutTime: checkedOutEntry.checkOutTime,
        };
      }
      const presentEntry = present.get(student.id);
      if (presentEntry) {
        return {
          status: "present",
          student,
          checkInTime: presentEntry.checkInTime,
        };
      }
      const excusedEntry = excused.get(student.id);
      if (excusedEntry) {
        if (excusedEntry.kind === "excused") {
          return {
            status: "excused",
            student,
            reason: excusedEntry.reason,
            notes: excusedEntry.notes,
          };
        }
        return { status: "unknown", student, notes: excusedEntry.notes };
      }
      return { status: "not-checked-in", student };
    },
    [present, checkedOut, excused],
  );

  const activeStudents = useMemo(
    () => allStudents.filter((student) => student.status === "active"),
    [allStudents],
  );
  const pausedStudents = useMemo(
    () => allStudents.filter((student) => student.status === "paused"),
    [allStudents],
  );

  const rosterList = useMemo(
    () =>
      activeStudents
        .map(buildRosterRow)
        .sort((a, b) => byName(a.student, b.student)),
    [activeStudents, buildRosterRow],
  );

  const pausedRosterList = useMemo(
    () =>
      pausedStudents
        .map(buildRosterRow)
        .sort((a, b) => byName(a.student, b.student)),
    [pausedStudents, buildRosterRow],
  );

  const stagedIds = useMemo(() => new Set(staged.map((s) => s.id)), [staged]);

  const searchResults = allStudents.filter(
    (student) =>
      !present.has(student.id) &&
      !checkedOut.has(student.id) &&
      !stagedIds.has(student.id) &&
      `${student.firstName} ${student.lastName} ${student.id}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );

  function checkInStudent(student: Student) {
    setPresent((prev) => {
      const next = new Map(prev);
      next.set(student.id, { student, checkInTime: formatTime(new Date()) });
      return next;
    });
    setExcused((prev) => {
      if (!prev.has(student.id)) return prev;
      const next = new Map(prev);
      next.delete(student.id);
      return next;
    });
  }

  function checkOutStudent(studentId: string) {
    const entry = present.get(studentId);
    if (!entry) return;

    setPresent((prev) => {
      const next = new Map(prev);
      next.delete(studentId);
      return next;
    });
    setCheckedOut((prev) => {
      const next = new Map(prev);
      next.set(studentId, { ...entry, checkOutTime: formatTime(new Date()) });
      return next;
    });
  }

  function addToStaged(student: Student) {
    setStaged((prev) => [...prev, student]);
  }

  function removeFromStaged(studentId: string) {
    setStaged((prev) => prev.filter((s) => s.id !== studentId));
  }

  function handleDialogOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setStaged([]);
      setQuery("");
      setSearchOpen(false);
    }
  }

  function handleSubmit() {
    const checkInTime = formatTime(new Date());
    setPresent((prev) => {
      const next = new Map(prev);
      for (const student of staged) {
        next.set(student.id, { student, checkInTime });
      }
      return next;
    });
    setExcused((prev) => {
      const next = new Map(prev);
      for (const student of staged) {
        next.delete(student.id);
      }
      return next;
    });
    setStaged([]);
    setQuery("");
    setSearchOpen(false);
    setOpen(false);
  }

  function renderRosterCard(row: RosterRow) {
    if (row.status === "present") {
      return (
        <div
          key={row.student.id}
          className="flex items-center justify-between gap-2 border-x-0 border-t-0 border-b-2 border-green-600 bg-green-50 p-3 dark:border-green-500 dark:bg-green-950/40"
        >
          <div className="flex flex-col">
            <span className="flex items-center gap-1.5 text-sm font-medium">
              {expectedIds.has(row.student.id) && <ExpectedDot />}
              {row.student.firstName} {row.student.lastName}
              <EnrollmentStatusBadge status={row.student.status} />
            </span>
            <span className="text-muted-foreground text-xs">
              Checked in {row.checkInTime}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => checkOutStudent(row.student.id)}
          >
            Check out
          </Button>
        </div>
      );
    }

    if (row.status === "checked-out") {
      return (
        <div
          key={row.student.id}
          className="flex flex-col rounded-lg border bg-muted p-3 text-muted-foreground"
        >
          <span className="flex items-center gap-1.5 text-sm font-medium">
            {expectedIds.has(row.student.id) && <ExpectedDot />}
            {row.student.firstName} {row.student.lastName}
            <EnrollmentStatusBadge status={row.student.status} />
          </span>
          <span className="text-xs">
            {row.checkInTime} &ndash; {row.checkOutTime}
          </span>
        </div>
      );
    }

    if (row.status === "excused") {
      return (
        <div
          key={row.student.id}
          className="flex items-center justify-between gap-2 border-x-0 border-t-0 border-b-2 border-amber-500 bg-amber-50 p-3 dark:border-amber-400 dark:bg-amber-950/40"
        >
          <div className="flex flex-col">
            <span className="flex items-center gap-1.5 text-sm font-medium">
              {expectedIds.has(row.student.id) && <ExpectedDot />}
              {row.student.firstName} {row.student.lastName}
              <EnrollmentStatusBadge status={row.student.status} />
            </span>
            <span className="text-muted-foreground text-xs">
              {excuseReasonLabels[row.reason]}
              {row.notes ? ` — ${row.notes}` : ""}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => checkInStudent(row.student)}
          >
            <PlusIcon className="h-3.5 w-3.5" />
            <span className="sr-only">Check in</span>
          </Button>
        </div>
      );
    }

    if (row.status === "unknown") {
      return (
        <div
          key={row.student.id}
          className="flex items-center justify-between gap-2 border-x-0 border-t-0 border-b-2 border-rose-500 bg-rose-50 p-3 dark:border-rose-400 dark:bg-rose-950/40"
        >
          <div className="flex flex-col">
            <span className="flex items-center gap-1.5 text-sm font-medium">
              {expectedIds.has(row.student.id) && <ExpectedDot />}
              {row.student.firstName} {row.student.lastName}
              <EnrollmentStatusBadge status={row.student.status} />
            </span>
            <span className="text-muted-foreground text-xs">
              No show{row.notes ? ` — ${row.notes}` : ""}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => checkInStudent(row.student)}
          >
            <PlusIcon className="h-3.5 w-3.5" />
            <span className="sr-only">Check in</span>
          </Button>
        </div>
      );
    }

    return (
      <div
        key={row.student.id}
        className="flex items-center justify-between gap-2 rounded-lg border bg-card p-3"
      >
        <span className="flex items-center gap-1.5 text-sm font-medium">
          {expectedIds.has(row.student.id) && <ExpectedDot />}
          {row.student.firstName} {row.student.lastName}
          <EnrollmentStatusBadge status={row.student.status} />
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => checkInStudent(row.student)}
        >
          <PlusIcon className="h-3.5 w-3.5" />
          <span className="sr-only">Check in</span>
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardDescription>Attendance</CardDescription>
        <CardTitle className="text-3xl font-semibold tracking-tight">
          {formattedToday}
        </CardTitle>
        <CardAction>
          <Dialog open={open} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger render={<Button variant="outline" size="icon" />}>
              <PlusIcon className="h-4 w-4" />
              <span className="sr-only">Add students</span>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>Add students</DialogTitle>
                <DialogDescription>
                  Search for students and add them to today&apos;s attendance.
                </DialogDescription>
              </DialogHeader>

              <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                <PopoverTrigger
                  nativeButton={false}
                  render={
                    <Input
                      placeholder="Search students..."
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setSearchOpen(true);
                      }}
                      onFocus={() => setSearchOpen(true)}
                      autoFocus
                    />
                  }
                />
                <PopoverContent
                  align="start"
                  initialFocus={false}
                  className="w-(--anchor-width) max-h-64 overflow-y-auto p-1"
                >
                  {searchResults.length === 0 ? (
                    <p className="text-muted-foreground p-2 text-sm">
                      {query ? "No students found." : "Start typing to search."}
                    </p>
                  ) : (
                    searchResults.map((student) => (
                      <button
                        key={student.id}
                        type="button"
                        onClick={() => addToStaged(student)}
                        className="hover:bg-muted flex w-full flex-col rounded-md px-2 py-1.5 text-left"
                      >
                        <span className="text-sm font-medium">
                          {student.firstName} {student.lastName}
                        </span>
                        <span className="text-muted-foreground font-mono text-xs">
                          {student.id}
                        </span>
                      </button>
                    ))
                  )}
                </PopoverContent>
              </Popover>

              <Separator />

              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">
                  Added{staged.length > 0 && ` (${staged.length})`}
                </p>
                <div className="flex max-h-48 flex-col divide-y overflow-y-auto">
                  {staged.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      No students added yet.
                    </p>
                  ) : (
                    staged.map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between gap-3 py-1.5"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {student.firstName} {student.lastName}
                          </span>
                          <span className="text-muted-foreground font-mono text-xs">
                            {student.id}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => removeFromStaged(student.id)}
                        >
                          <XIcon className="h-3 w-3" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>
                  Cancel
                </DialogClose>
                <Button onClick={handleSubmit} disabled={staged.length === 0}>
                  Submit
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {rosterList.map((row) => renderRosterCard(row))}
        </div>

        {pausedRosterList.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-muted-foreground text-sm font-medium">
              Paused ({pausedRosterList.length})
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {pausedRosterList.map((row) => renderRosterCard(row))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
