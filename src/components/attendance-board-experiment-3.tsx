"use client";

import { addDays, format, parseISO, subDays } from "date-fns";
import {
  ArrowUpIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
} from "lucide-react";
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
import { useLongPress } from "@/hooks/use-long-press";
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
  pickedUpTime: string;
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
  | { status: "picked-up"; student: Student; pickedUpTime: string }
  | {
      status: "excused";
      student: Student;
      reason: ExcuseReason;
      notes?: string;
    }
  | { status: "unknown"; student: Student; notes?: string };

// Kept in sync with each HoldPulseGlow's `duration-[1500ms]` class below.
const HOLD_THRESHOLD_MS = 1500;

// A soft blurred dot at the card's center that grows into a full radial
// glow as you hold, plus a slight scale-down on the card for tactile "press" feel.
function HoldPulseGlow({
  isPressing,
  colorClassName,
}: {
  isPressing: boolean;
  colorClassName: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute top-1/2 left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full blur-lg",
        colorClassName,
        isPressing
          ? "scale-[14] opacity-70 transition-[transform,opacity] duration-[1500ms] ease-linear"
          : "scale-0 opacity-0 transition-none",
      )}
    />
  );
}

type PointerHandlers = {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerLeave: (e: React.PointerEvent) => void;
  onPointerCancel: (e: React.PointerEvent) => void;
};

function PickUpTrigger({
  handlers,
  isPressing,
}: {
  handlers: PointerHandlers;
  isPressing: boolean;
}) {
  return (
    <Button
      variant="ghost"
      size="icon-xs"
      className={cn(
        "relative overflow-hidden transition-transform duration-150 ease-out",
        isPressing && "scale-90",
      )}
      onPointerDown={handlers.onPointerDown}
      onPointerUp={handlers.onPointerUp}
      onPointerLeave={handlers.onPointerLeave}
      onPointerCancel={handlers.onPointerCancel}
      onClick={(e) => e.stopPropagation()}
    >
      <HoldPulseGlow isPressing={isPressing} colorClassName="bg-yellow-400" />
      <ArrowUpIcon className="relative z-10 h-3.5 w-3.5" />
      <span className="sr-only">Pick up</span>
    </Button>
  );
}

interface RosterCardProps {
  row: RosterRow;
  isScheduled: boolean;
  onCheckIn: (student: Student) => void;
  onCheckOut: (studentId: string) => void;
  onPickUp: (student: Student) => void;
  onOpenDetail: (studentId: string) => void;
}

function RosterCard({
  row,
  isScheduled,
  onCheckIn,
  onCheckOut,
  onPickUp,
  onOpenDetail,
}: RosterCardProps) {
  const { student } = row;
  const isCheckedIn = row.status === "present";

  const onLongPress = useCallback(() => {
    if (isCheckedIn) {
      onCheckOut(student.id);
    } else {
      onCheckIn(student);
    }
  }, [isCheckedIn, onCheckIn, onCheckOut, student]);

  const { isPressing, handlers } = useLongPress({
    onLongPress,
    threshold: HOLD_THRESHOLD_MS,
  });

  const cardHandlers = {
    ...handlers,
    onDoubleClick: () => onOpenDetail(student.id),
  };

  const holdColorClassName = isCheckedIn ? "bg-orange-500" : "bg-green-500";

  const canPickUp = student.status === "active";

  const onPickUpLongPress = useCallback(
    () => onPickUp(student),
    [onPickUp, student],
  );
  const { isPressing: isPickingUp, handlers: pickUpHandlers } = useLongPress({
    onLongPress: onPickUpLongPress,
    threshold: HOLD_THRESHOLD_MS,
  });
  const pickUpTriggerHandlers: PointerHandlers = {
    onPointerDown: (e) => {
      e.stopPropagation();
      pickUpHandlers.onPointerDown();
    },
    onPointerUp: (e) => {
      e.stopPropagation();
      pickUpHandlers.onPointerUp();
    },
    onPointerLeave: (e) => {
      e.stopPropagation();
      pickUpHandlers.onPointerLeave();
    },
    onPointerCancel: (e) => {
      e.stopPropagation();
      pickUpHandlers.onPointerCancel();
    },
  };

  const pressScaleClassName = cn(
    "transition-transform duration-150 ease-out",
    isPressing && "scale-[0.98]",
  );
  const nameLine = (
    <span className="flex items-center gap-1.5 text-sm font-medium">
      {isScheduled && <ExpectedDot />}
      {student.firstName} {student.lastName}
      <EnrollmentStatusBadge status={student.status} />
    </span>
  );

  if (row.status === "present") {
    return (
      <div
        {...cardHandlers}
        className={cn(
          "bg-card relative flex touch-none items-center justify-between gap-2 overflow-hidden border-x-0 border-t-0 border-b-2 p-3 transition-colors duration-300 select-none",
          isPressing
            ? "border-orange-500"
            : "border-green-600 dark:border-green-500",
          pressScaleClassName,
        )}
      >
        <HoldPulseGlow
          isPressing={isPressing}
          colorClassName={holdColorClassName}
        />
        <div className="relative z-10 flex flex-col">
          {nameLine}
          <span className="text-muted-foreground text-xs">
            Checked in {row.checkInTime}
          </span>
        </div>
      </div>
    );
  }

  if (row.status === "checked-out") {
    return (
      <div
        {...cardHandlers}
        className={cn(
          "bg-muted text-muted-foreground relative flex touch-none flex-col overflow-hidden rounded-lg border p-3 select-none",
          pressScaleClassName,
        )}
      >
        <HoldPulseGlow
          isPressing={isPressing}
          colorClassName={holdColorClassName}
        />
        <div className="relative z-10 flex flex-col">
          {nameLine}
          <span className="text-xs">
            {row.checkInTime} &ndash; {row.checkOutTime}
          </span>
        </div>
      </div>
    );
  }

  if (row.status === "picked-up") {
    return (
      <div
        {...cardHandlers}
        className={cn(
          "bg-muted text-muted-foreground relative flex touch-none flex-col overflow-hidden rounded-lg border p-3 select-none",
          pressScaleClassName,
        )}
      >
        <HoldPulseGlow
          isPressing={isPressing}
          colorClassName={holdColorClassName}
        />
        <div className="relative z-10 flex flex-col">
          {nameLine}
          <span className="flex items-center gap-1.5 text-xs">
            <Badge variant="outline" className="h-4 px-1 text-[10px]">
              Picked up
            </Badge>
            {row.pickedUpTime}
          </span>
        </div>
      </div>
    );
  }

  if (row.status === "excused") {
    return (
      <div
        {...cardHandlers}
        className={cn(
          "relative flex touch-none items-center justify-between gap-2 overflow-hidden border-x-0 border-t-0 border-b-2 border-amber-500 bg-amber-50 p-3 select-none dark:border-amber-400 dark:bg-amber-950/40",
          pressScaleClassName,
        )}
      >
        <HoldPulseGlow
          isPressing={isPressing}
          colorClassName={holdColorClassName}
        />
        <div className="relative z-10 flex flex-col">
          {nameLine}
          <span className="text-muted-foreground text-xs">
            {excuseReasonLabels[row.reason]}
            {row.notes ? ` — ${row.notes}` : ""}
          </span>
        </div>
        {canPickUp && (
          <PickUpTrigger
            handlers={pickUpTriggerHandlers}
            isPressing={isPickingUp}
          />
        )}
      </div>
    );
  }

  if (row.status === "unknown") {
    return (
      <div
        {...cardHandlers}
        className={cn(
          "relative flex touch-none items-center justify-between gap-2 overflow-hidden border-x-0 border-t-0 border-b-2 border-rose-500 bg-rose-50 p-3 select-none dark:border-rose-400 dark:bg-rose-950/40",
          pressScaleClassName,
        )}
      >
        <HoldPulseGlow
          isPressing={isPressing}
          colorClassName={holdColorClassName}
        />
        <div className="relative z-10 flex flex-col">
          {nameLine}
          <span className="text-muted-foreground text-xs">
            No show{row.notes ? ` — ${row.notes}` : ""}
          </span>
        </div>
        {canPickUp && (
          <PickUpTrigger
            handlers={pickUpTriggerHandlers}
            isPressing={isPickingUp}
          />
        )}
      </div>
    );
  }

  return (
    <div
      {...cardHandlers}
      className={cn(
        "bg-card relative flex touch-none items-center justify-between gap-2 overflow-hidden rounded-lg border p-3 select-none",
        pressScaleClassName,
      )}
    >
      <HoldPulseGlow
        isPressing={isPressing}
        colorClassName={holdColorClassName}
      />
      <span className="relative z-10">{nameLine}</span>
      {canPickUp && (
        <PickUpTrigger
          handlers={pickUpTriggerHandlers}
          isPressing={isPickingUp}
        />
      )}
    </div>
  );
}

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
      <CollapsiblePanel>
        <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-2 lg:grid-cols-3">
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
  const [pickedUp, setPickedUp] = useState<Map<string, PickedUpEntry>>(
    () => new Map(),
  );
  const [query, setQuery] = useState("");

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
      const pickedUpEntry = pickedUp.get(student.id);
      if (pickedUpEntry) {
        return {
          status: "picked-up",
          student,
          pickedUpTime: pickedUpEntry.pickedUpTime,
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
    [present, checkedOut, pickedUp, excused],
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
      next.set(student.id, { student, pickedUpTime: formatTime(new Date()) });
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

  const {
    pickedUpRows,
    checkedInRows,
    scheduledRows,
    activeRows,
    inactiveRows,
  } = useMemo(() => {
    const pickedUpList: RosterRow[] = [];
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
      if (pickedUp.has(student.id)) {
        pickedUpList.push(row);
      } else if (present.has(student.id)) {
        checkedIn.push(row);
      } else if (scheduledIds.has(student.id)) {
        scheduled.push(row);
      } else if (student.status === "active") {
        active.push(row);
      } else {
        inactive.push(row);
      }
    }

    pickedUpList.sort((a, b) => byName(a.student, b.student));
    checkedIn.sort((a, b) => byName(a.student, b.student));
    scheduled.sort((a, b) => {
      const timeA = scheduledTimes[a.student.id] ?? "";
      const timeB = scheduledTimes[b.student.id] ?? "";
      return timeA.localeCompare(timeB) || byName(a.student, b.student);
    });
    active.sort((a, b) => byName(a.student, b.student));
    inactive.sort((a, b) => byName(a.student, b.student));

    return {
      pickedUpRows: pickedUpList,
      checkedInRows: checkedIn,
      scheduledRows: scheduled,
      activeRows: active,
      inactiveRows: inactive,
    };
  }, [
    allStudents,
    trimmedQuery,
    pickedUp,
    present,
    scheduledIds,
    buildRosterRow,
    scheduledTimes,
  ]);

  const totalRows =
    pickedUpRows.length +
    checkedInRows.length +
    scheduledRows.length +
    activeRows.length +
    inactiveRows.length;

  function renderRosterCard(row: RosterRow) {
    return (
      <RosterCard
        key={row.student.id}
        row={row}
        isScheduled={scheduledIds.has(row.student.id)}
        onCheckIn={checkInStudent}
        onCheckOut={checkOutStudent}
        onPickUp={pickUpStudent}
        onOpenDetail={(studentId) => router.push(`/students/${studentId}`)}
      />
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
                title="Picked Up"
                rows={pickedUpRows}
                renderRosterCard={renderRosterCard}
              />
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
