"use client";

import { addDays, format, parseISO, subDays } from "date-fns";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { ExcuseReason, Student } from "@/lib/types";
import { cn } from "@/lib/utils";

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

interface PickedUpEntry {
  student: Student;
  pickupTime: string;
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
  | { status: "picked-up"; student: Student; pickupTime: string }
  | {
      status: "excused";
      student: Student;
      reason: ExcuseReason;
      notes?: string;
    }
  | { status: "unknown"; student: Student; notes?: string };

interface AttendanceBoardProps {
  selectedDate: string;
  allStudents: Student[];
  scheduledTimes: Record<string, string>;
  initialPresentStudents: PresentEntry[];
  initialCheckedOutStudents: CheckedOutEntry[];
  initialExcusedStudents: ExcusedEntry[];
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

interface RosterSectionProps {
  title: string;
  rows: RosterRow[];
  renderRosterCard: (row: RosterRow) => React.ReactNode;
}

function RosterSection({ title, rows, renderRosterCard }: RosterSectionProps) {
  const [open, setOpen] = useState(true);

  if (rows.length === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center gap-1.5 py-1">
        <ChevronRightIcon
          className={cn(
            "text-muted-foreground h-4 w-4 shrink-0 transition-transform",
            open && "rotate-90",
          )}
        />
        <span className="text-sm font-medium">
          {title} ({rows.length})
        </span>
      </CollapsibleTrigger>
      <CollapsiblePanel className="overflow-visible">
        <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => renderRosterCard(row))}
        </div>
      </CollapsiblePanel>
    </Collapsible>
  );
}

export function AttendanceBoardV2({
  selectedDate,
  allStudents,
  scheduledTimes,
  initialPresentStudents,
  initialCheckedOutStudents,
  initialExcusedStudents,
}: AttendanceBoardProps) {
  const router = useRouter();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const selectedDateObj = useMemo(() => parseISO(selectedDate), [selectedDate]);
  const formattedToday = useMemo(
    () => format(selectedDateObj, "EEEE, MMMM d, yyyy"),
    [selectedDateObj],
  );

  const goToDate = useCallback(
    (date: Date) => {
      router.push(`/attendance-v2?date=${format(date, "yyyy-MM-dd")}`);
    },
    [router],
  );

  const scheduledIds = useMemo(
    () => new Set(Object.keys(scheduledTimes)),
    [scheduledTimes],
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
  const [pickedUp, setPickedUp] = useState<Map<string, PickedUpEntry>>(
    () => new Map(),
  );
  const [query, setQuery] = useState("");
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(
    null,
  );

  const toggleExpanded = useCallback((studentId: string) => {
    setExpandedStudentId((prev) => (prev === studentId ? null : studentId));
  }, []);

  const buildRosterRow = useCallback(
    (student: Student): RosterRow => {
      const pickedUpEntry = pickedUp.get(student.id);
      if (pickedUpEntry) {
        return {
          status: "picked-up",
          student,
          pickupTime: pickedUpEntry.pickupTime,
        };
      }
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
    [present, checkedOut, excused, pickedUp],
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
    setCheckedOut((prev) => {
      if (!prev.has(student.id)) return prev;
      const next = new Map(prev);
      next.delete(student.id);
      return next;
    });
    setPickedUp((prev) => {
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

  function pickUpStudent(student: Student) {
    setPickedUp((prev) => {
      const next = new Map(prev);
      next.set(student.id, { student, pickupTime: formatTime(new Date()) });
      return next;
    });
    setPresent((prev) => {
      if (!prev.has(student.id)) return prev;
      const next = new Map(prev);
      next.delete(student.id);
      return next;
    });
    setCheckedOut((prev) => {
      if (!prev.has(student.id)) return prev;
      const next = new Map(prev);
      next.delete(student.id);
      return next;
    });
    setExcused((prev) => {
      if (!prev.has(student.id)) return prev;
      const next = new Map(prev);
      next.delete(student.id);
      return next;
    });
  }

  const trimmedQuery = query.trim().toLowerCase();

  const { checkedInRows, scheduledRows, activeRows, inactiveRows } =
    useMemo(() => {
      const checkedIn: RosterRow[] = [];
      const scheduled: RosterRow[] = [];
      const active: RosterRow[] = [];
      const inactive: RosterRow[] = [];

      for (const student of allStudents) {
        if (
          trimmedQuery &&
          !`${student.firstName} ${student.lastName} ${student.id}`
            .toLowerCase()
            .includes(trimmedQuery)
        ) {
          continue;
        }

        const row = buildRosterRow(student);
        if (present.has(student.id)) {
          checkedIn.push(row);
        } else if (scheduledIds.has(student.id)) {
          scheduled.push(row);
        } else if (student.status === "active") {
          active.push(row);
        } else {
          inactive.push(row);
        }
      }

      checkedIn.sort((a, b) => byName(a.student, b.student));
      scheduled.sort((a, b) => {
        const timeA = scheduledTimes[a.student.id] ?? "";
        const timeB = scheduledTimes[b.student.id] ?? "";
        return timeA.localeCompare(timeB) || byName(a.student, b.student);
      });
      active.sort((a, b) => byName(a.student, b.student));
      inactive.sort((a, b) => byName(a.student, b.student));

      return {
        checkedInRows: checkedIn,
        scheduledRows: scheduled,
        activeRows: active,
        inactiveRows: inactive,
      };
    }, [
      allStudents,
      trimmedQuery,
      present,
      scheduledIds,
      buildRosterRow,
      scheduledTimes,
    ]);

  const totalRows =
    checkedInRows.length +
    scheduledRows.length +
    activeRows.length +
    inactiveRows.length;

  function renderName(row: RosterRow) {
    return (
      <span className="flex items-center gap-1.5 text-sm font-medium">
        {row.student.firstName} {row.student.lastName}
        <EnrollmentStatusBadge status={row.student.status} />
      </span>
    );
  }

  function renderExpandedActions(row: RosterRow) {
    if (expandedStudentId !== row.student.id) return null;

    return (
      <div className="absolute top-full right-0 left-0 z-20 mt-1 flex flex-wrap items-center gap-2 rounded-lg border bg-popover p-2 shadow-md">
        {row.status === "present" ? (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              checkOutStudent(row.student.id);
            }}
          >
            Check out
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              checkInStudent(row.student);
            }}
          >
            Check in
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            pickUpStudent(row.student);
          }}
        >
          Pick up
        </Button>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          onClick={(e) => e.stopPropagation()}
          render={<Link href={`/students/${row.student.id}`} />}
        >
          More info
        </Button>
      </div>
    );
  }

  function cardProps(row: RosterRow) {
    return {
      onClick: () => toggleExpanded(row.student.id),
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleExpanded(row.student.id);
        }
      },
      role: "button" as const,
      tabIndex: 0,
      "aria-expanded": expandedStudentId === row.student.id,
    };
  }

  function renderRosterCard(row: RosterRow) {
    if (row.status === "present") {
      return (
        <div
          key={row.student.id}
          {...cardProps(row)}
          className="relative flex cursor-pointer flex-col gap-2 border-x-0 border-t-0 border-b-2 border-green-600 bg-green-50 p-3 outline-none dark:border-green-500 dark:bg-green-950/40"
        >
          <div className="flex flex-col">
            {renderName(row)}
            <span className="text-muted-foreground text-xs">
              Checked in {row.checkInTime}
            </span>
          </div>
          {renderExpandedActions(row)}
        </div>
      );
    }

    if (row.status === "checked-out") {
      return (
        <div
          key={row.student.id}
          {...cardProps(row)}
          className="relative flex cursor-pointer flex-col rounded-lg border bg-muted p-3 text-muted-foreground outline-none"
        >
          {renderName(row)}
          <span className="text-xs">
            {row.checkInTime} &ndash; {row.checkOutTime}
          </span>
          {renderExpandedActions(row)}
        </div>
      );
    }

    if (row.status === "picked-up") {
      return (
        <div
          key={row.student.id}
          {...cardProps(row)}
          className="relative flex cursor-pointer flex-col rounded-lg border bg-muted p-3 text-muted-foreground outline-none"
        >
          {renderName(row)}
          <span className="text-xs">Picked up {row.pickupTime}</span>
          {renderExpandedActions(row)}
        </div>
      );
    }

    if (row.status === "excused") {
      return (
        <div
          key={row.student.id}
          {...cardProps(row)}
          className="relative flex cursor-pointer flex-col gap-2 border-x-0 border-t-0 border-b-2 border-amber-500 bg-amber-50 p-3 outline-none dark:border-amber-400 dark:bg-amber-950/40"
        >
          {renderName(row)}
          <span className="text-muted-foreground text-xs">
            {excuseReasonLabels[row.reason]}
            {row.notes ? ` — ${row.notes}` : ""}
          </span>
          {renderExpandedActions(row)}
        </div>
      );
    }

    if (row.status === "unknown") {
      return (
        <div
          key={row.student.id}
          {...cardProps(row)}
          className="relative flex cursor-pointer flex-col gap-2 border-x-0 border-t-0 border-b-2 border-rose-500 bg-rose-50 p-3 outline-none dark:border-rose-400 dark:bg-rose-950/40"
        >
          {renderName(row)}
          <span className="text-muted-foreground text-xs">
            No show{row.notes ? ` — ${row.notes}` : ""}
          </span>
          {renderExpandedActions(row)}
        </div>
      );
    }

    return (
      <div
        key={row.student.id}
        {...cardProps(row)}
        className="relative flex cursor-pointer flex-col gap-2 rounded-lg border bg-card p-3 outline-none"
      >
        {renderName(row)}
        {renderExpandedActions(row)}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex w-full items-center justify-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => goToDate(subDays(selectedDateObj, 1))}
        >
          <ChevronLeftIcon className="h-4 w-4" />
          <span className="sr-only">Previous day</span>
        </Button>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger
            render={<Button variant="ghost" className="h-auto px-2 py-1" />}
          >
            <span className="text-3xl font-semibold tracking-tight">
              {formattedToday}
            </span>
            <CalendarIcon className="text-muted-foreground ml-2 h-4 w-4 shrink-0" />
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-0">
            <Calendar
              mode="single"
              selected={selectedDateObj}
              onSelect={(date) => {
                if (!date) return;
                setCalendarOpen(false);
                goToDate(date);
              }}
            />
          </PopoverContent>
        </Popover>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => goToDate(addDays(selectedDateObj, 1))}
        >
          <ChevronRightIcon className="h-4 w-4" />
          <span className="sr-only">Next day</span>
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-6 pt-6">
          <div className="relative">
            <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search students..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {totalRows === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              No students found.
            </p>
          ) : (
            <>
              <RosterSection
                title="Checked In"
                rows={checkedInRows}
                renderRosterCard={renderRosterCard}
              />
              <RosterSection
                title="Scheduled Today"
                rows={scheduledRows}
                renderRosterCard={renderRosterCard}
              />
              <RosterSection
                title="Active"
                rows={activeRows}
                renderRosterCard={renderRosterCard}
              />
              <RosterSection
                title="Inactive"
                rows={inactiveRows}
                renderRosterCard={renderRosterCard}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
