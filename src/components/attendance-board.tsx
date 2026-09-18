"use client";

import { addDays, format, parseISO, subDays } from "date-fns";
import {
  BarcodeIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Barcode } from "@/components/barcode";
import { useEmployeeSession } from "@/components/employee-auth";
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
import { recordBoardAttendance } from "@/lib/attendance-actions";
import type { ScanAction } from "@/lib/scan";
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
  checkedInBy?: string;
}

interface CheckedOutEntry {
  student: Student;
  checkInTime: string;
  checkOutTime: string;
  pickedUpTime?: string;
  checkedInBy?: string;
  checkedOutBy?: string;
}

export type ExcusedEntry =
  | { student: Student; kind: "excused"; reason: ExcuseReason; notes?: string }
  | { student: Student; kind: "unknown"; notes?: string };

type RosterRow =
  | { status: "not-checked-in"; student: Student }
  | {
      status: "present";
      student: Student;
      checkInTime: string;
      checkedInBy?: string;
    }
  | {
      status: "checked-out";
      student: Student;
      checkInTime: string;
      checkOutTime: string;
      pickedUpTime?: string;
      checkedInBy?: string;
      checkedOutBy?: string;
    }
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

interface RosterSectionProps {
  title: string;
  rows: RosterRow[];
  /** Fewer, wider cards so a full-size barcode fits in each. */
  wide?: boolean;
  renderRosterCard: (row: RosterRow) => React.ReactNode;
}

function RosterSection({
  title,
  rows,
  wide = false,
  renderRosterCard,
}: RosterSectionProps) {
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
      <CollapsiblePanel>
        <div
          className={cn(
            "grid grid-cols-1 gap-2 pt-2",
            wide ? "md:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3",
          )}
        >
          {rows.map((row) => renderRosterCard(row))}
        </div>
      </CollapsiblePanel>
    </Collapsible>
  );
}

export function AttendanceBoard({
  selectedDate,
  allStudents,
  scheduledTimes,
  initialPresentStudents,
  initialCheckedOutStudents,
  initialExcusedStudents,
}: AttendanceBoardProps) {
  const router = useRouter();
  const { employee } = useEmployeeSession();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const selectedDateObj = useMemo(() => parseISO(selectedDate), [selectedDate]);
  const formattedToday = useMemo(
    () => format(selectedDateObj, "EEEE, MMMM d, yyyy"),
    [selectedDateObj],
  );

  const goToDate = useCallback(
    (date: Date) => {
      router.push(`/attendance?date=${format(date, "yyyy-MM-dd")}`);
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
  const [query, setQuery] = useState("");
  const [showBarcodes, setShowBarcodes] = useState(false);
  const [, startTransition] = useTransition();

  /** Scannable barcode under a name, for testing a scanner against the roster. */
  function cardBarcode(student: Student) {
    if (!showBarcodes) return null;
    return (
      <Barcode
        value={student.barcode}
        module={3}
        height={48}
        className="mt-2 w-fit gap-0.5 [&_figcaption]:text-[11px] [&_figcaption]:tracking-[0.25em]"
      />
    );
  }

  /**
   * Every board click is written to the ledger. The local maps update
   * optimistically so the card moves at once; if the ledger refuses, the
   * snapshot taken before the click is restored and the refusal is shown.
   */
  function persist(action: ScanAction, student: Student, time: string) {
    const snapshot = { present, checkedOut, excused };
    startTransition(async () => {
      const result = await recordBoardAttendance({
        action,
        employeeId: employee.id,
        studentId: student.id,
        date: selectedDate,
        time,
      });
      if (result.ok) {
        if (result.detail) toast.message(result.detail);
        return;
      }
      toast.error(result.message, { description: result.detail });
      setPresent(snapshot.present);
      setCheckedOut(snapshot.checkedOut);
      setExcused(snapshot.excused);
    });
  }

  const buildRosterRow = useCallback(
    (student: Student): RosterRow => {
      const checkedOutEntry = checkedOut.get(student.id);
      if (checkedOutEntry) {
        return {
          status: "checked-out",
          student,
          checkInTime: checkedOutEntry.checkInTime,
          checkOutTime: checkedOutEntry.checkOutTime,
          pickedUpTime: checkedOutEntry.pickedUpTime,
          checkedInBy: checkedOutEntry.checkedInBy,
          checkedOutBy: checkedOutEntry.checkedOutBy,
        };
      }
      const presentEntry = present.get(student.id);
      if (presentEntry) {
        return {
          status: "present",
          student,
          checkInTime: presentEntry.checkInTime,
          checkedInBy: presentEntry.checkedInBy,
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

  function checkInStudent(student: Student) {
    const time = formatTime(new Date());
    setPresent((prev) => {
      const next = new Map(prev);
      next.set(student.id, {
        student,
        checkInTime: time,
        checkedInBy: employee.name,
      });
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
    persist("check-in", student, time);
  }

  function checkOutStudent(studentId: string) {
    const entry = present.get(studentId);
    if (!entry) return;
    const time = formatTime(new Date());

    setPresent((prev) => {
      const next = new Map(prev);
      next.delete(studentId);
      return next;
    });
    setCheckedOut((prev) => {
      const next = new Map(prev);
      next.set(studentId, {
        ...entry,
        checkOutTime: time,
        checkedOutBy: employee.name,
      });
      return next;
    });
    persist("check-out", entry.student, time);
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

  function renderRosterCard(row: RosterRow) {
    if (row.status === "present") {
      return (
        <div
          key={row.student.id}
          className="flex items-center justify-between gap-2 border-x-0 border-t-0 border-b-2 border-green-600 bg-green-50 p-3 dark:border-green-500 dark:bg-green-950/40"
        >
          <div className="flex flex-col">
            <span className="flex items-center gap-1.5 text-sm font-medium">
              {scheduledIds.has(row.student.id) && <ExpectedDot />}
              {row.student.firstName} {row.student.lastName}
              <EnrollmentStatusBadge status={row.student.status} />
            </span>
            {cardBarcode(row.student)}
            <span className="text-muted-foreground text-xs">
              Checked in {row.checkInTime}
              {row.checkedInBy ? ` by ${row.checkedInBy}` : ""}
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
          className="flex items-center justify-between gap-2 rounded-lg border bg-muted p-3 text-muted-foreground"
        >
          <div className="flex flex-col">
            <span className="flex items-center gap-1.5 text-sm font-medium">
              {scheduledIds.has(row.student.id) && <ExpectedDot />}
              {row.student.firstName} {row.student.lastName}
              <EnrollmentStatusBadge status={row.student.status} />
            </span>
            {cardBarcode(row.student)}
            <span className="text-xs">
              {row.checkInTime} &ndash; {row.checkOutTime}
              {row.checkedOutBy ? ` (out by ${row.checkedOutBy})` : ""}
              {row.pickedUpTime ? ` · Picked up ${row.pickedUpTime}` : ""}
            </span>
          </div>
          {row.pickedUpTime ? null : (
            <Button
              variant="ghost"
              size="icon-xs"
              title="Check in again"
              onClick={() => checkInStudent(row.student)}
            >
              <PlusIcon className="h-3.5 w-3.5" />
              <span className="sr-only">Check in again</span>
            </Button>
          )}
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
              {scheduledIds.has(row.student.id) && <ExpectedDot />}
              {row.student.firstName} {row.student.lastName}
              <EnrollmentStatusBadge status={row.student.status} />
            </span>
            {cardBarcode(row.student)}
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
              {scheduledIds.has(row.student.id) && <ExpectedDot />}
              {row.student.firstName} {row.student.lastName}
              <EnrollmentStatusBadge status={row.student.status} />
            </span>
            {cardBarcode(row.student)}
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
        <div className="flex flex-col">
          <span className="flex items-center gap-1.5 text-sm font-medium">
            {scheduledIds.has(row.student.id) && <ExpectedDot />}
            {row.student.firstName} {row.student.lastName}
            <EnrollmentStatusBadge status={row.student.status} />
          </span>
          {cardBarcode(row.student)}
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
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Search students..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant={showBarcodes ? "secondary" : "outline"}
              aria-pressed={showBarcodes}
              onClick={() => setShowBarcodes((value) => !value)}
            >
              <BarcodeIcon />
              Barcodes
            </Button>
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
                wide={showBarcodes}
                renderRosterCard={renderRosterCard}
              />
              <RosterSection
                title="Scheduled Today"
                rows={scheduledRows}
                wide={showBarcodes}
                renderRosterCard={renderRosterCard}
              />
              <RosterSection
                title="Active"
                rows={activeRows}
                wide={showBarcodes}
                renderRosterCard={renderRosterCard}
              />
              <RosterSection
                title="Inactive"
                rows={inactiveRows}
                wide={showBarcodes}
                renderRosterCard={renderRosterCard}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
