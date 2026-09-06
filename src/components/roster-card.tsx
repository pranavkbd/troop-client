"use client";

import { useDrag } from "@use-gesture/react";
import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  PlusIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import type { RosterRow } from "@/components/attendance-board";
import { excuseReasonLabels } from "@/components/attendance-board";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Student } from "@/lib/types";
import { cn } from "@/lib/utils";

const DRAG_THRESHOLD = 56;
const MOVE_DAMPING = 0.15;
const MAX_TRANSLATE = 10;

type Direction = "right" | "left" | "up" | "down";

interface RosterCardProps {
  row: RosterRow;
  onCheckIn: (student: Student) => void;
  onCheckOut: (studentId: string) => void;
  onPickUp: (student: Student) => void;
}

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

const directionHints: Record<
  Direction,
  { label: string; icon: React.ReactNode; activeClassName: string }
> = {
  right: {
    label: "Check in",
    icon: <ArrowRightIcon className="h-3 w-3" />,
    activeClassName: "bg-green-600 text-white",
  },
  left: {
    label: "Check out",
    icon: <ArrowLeftIcon className="h-3 w-3" />,
    activeClassName: "bg-slate-600 text-white",
  },
  up: {
    label: "Pick up",
    icon: <ArrowUpIcon className="h-3 w-3" />,
    activeClassName: "bg-blue-600 text-white",
  },
  down: {
    label: "Details",
    icon: <ArrowDownIcon className="h-3 w-3" />,
    activeClassName: "bg-neutral-700 text-white",
  },
};

const directionPositionClassName: Record<Direction, string> = {
  right: "right-2 top-1/2",
  left: "left-2 top-1/2",
  up: "top-2 left-1/2",
  down: "bottom-2 left-1/2",
};

const directionIsHorizontal: Record<Direction, boolean> = {
  right: false,
  left: false,
  up: true,
  down: true,
};

function DirectionHint({
  direction,
  enabled,
  progress,
}: {
  direction: Direction;
  enabled: boolean;
  progress: number;
}) {
  const hint = directionHints[direction];
  const ready = progress >= 1;
  const scale = 0.85 + progress * 0.15;
  const center = directionIsHorizontal[direction]
    ? `translateX(-50%) scale(${scale})`
    : `translateY(-50%) scale(${scale})`;
  return (
    <div
      className={cn(
        "pointer-events-none absolute z-10 flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium shadow-sm",
        directionPositionClassName[direction],
        enabled ? hint.activeClassName : "bg-muted text-muted-foreground",
        ready && enabled && "ring-2 ring-white/60",
      )}
      style={{
        opacity: Math.min(0.4 + progress * 0.6, 1),
        transform: center,
      }}
    >
      {hint.icon}
      {hint.label}
    </div>
  );
}

export function RosterCard({
  row,
  onCheckIn,
  onCheckOut,
  onPickUp,
}: RosterCardProps) {
  const router = useRouter();
  const [dragging, setDragging] = useState(false);
  const [delta, setDelta] = useState<[number, number]>([0, 0]);
  const cardRef = useRef<HTMLDivElement>(null);

  const canCheckIn = row.status !== "present";
  const canCheckOut = row.status === "present";
  const canPickUp = row.status !== "present";

  const isDirectionEnabled: Record<Direction, boolean> = {
    right: canCheckIn,
    left: canCheckOut,
    up: canPickUp,
    down: true,
  };

  const [dx, dy] = delta;
  const dominantIsHorizontal = Math.abs(dx) >= Math.abs(dy);
  const magnitude = dominantIsHorizontal ? Math.abs(dx) : Math.abs(dy);
  const activeDirection: Direction | null =
    magnitude < 16
      ? null
      : dominantIsHorizontal
        ? dx > 0
          ? "right"
          : "left"
        : dy > 0
          ? "down"
          : "up";
  const progress = Math.min(magnitude / DRAG_THRESHOLD, 1);

  const commit = (direction: Direction) => {
    switch (direction) {
      case "right":
        if (canCheckIn) onCheckIn(row.student);
        break;
      case "left":
        if (canCheckOut) onCheckOut(row.student.id);
        break;
      case "up":
        if (canPickUp) onPickUp(row.student);
        break;
      case "down":
        router.push(`/students/${row.student.id}`);
        break;
    }
  };

  const bind = useDrag(
    ({ down, movement: [mx, my], last, tap }) => {
      if (tap) return;
      setDragging(down);
      setDelta(down ? [mx, my] : [0, 0]);
      if (last) {
        const horizontal = Math.abs(mx) >= Math.abs(my);
        const finalMagnitude = horizontal ? Math.abs(mx) : Math.abs(my);
        const finalDirection: Direction = horizontal
          ? mx > 0
            ? "right"
            : "left"
          : my > 0
            ? "down"
            : "up";
        if (finalMagnitude >= DRAG_THRESHOLD) {
          commit(finalDirection);
        }
      }
    },
    {
      filterTaps: true,
      pointer: { touch: true },
      preventScroll: true,
    },
  );

  const visualDx = Math.max(
    -MAX_TRANSLATE,
    Math.min(MAX_TRANSLATE, dx * MOVE_DAMPING),
  );
  const visualDy = Math.max(
    -MAX_TRANSLATE,
    Math.min(MAX_TRANSLATE, dy * MOVE_DAMPING),
  );

  return (
    <div
      ref={cardRef}
      {...bind()}
      className={cn(
        "relative touch-none select-none",
        dragging && "z-20 shadow-md",
      )}
      style={{
        transform: dragging
          ? `translate3d(${visualDx}px, ${visualDy}px, 0)`
          : undefined,
        transition: dragging ? "none" : "transform 150ms ease-out",
      }}
    >
      {dragging && activeDirection && (
        <DirectionHint
          direction={activeDirection}
          enabled={isDirectionEnabled[activeDirection]}
          progress={progress}
        />
      )}
      <RosterCardContent row={row} onCheckIn={onCheckIn} />
    </div>
  );
}

function RosterCardContent({
  row,
  onCheckIn,
}: {
  row: RosterRow;
  onCheckIn: (student: Student) => void;
}) {
  if (row.status === "present") {
    return (
      <div className="flex items-center justify-between gap-2 border-x-0 border-t-0 border-b-2 border-green-600 bg-green-50 p-3 dark:border-green-500 dark:bg-green-950/40">
        <div className="flex flex-col">
          <span className="flex items-center gap-1.5 text-sm font-medium">
            {row.student.firstName} {row.student.lastName}
            <EnrollmentStatusBadge status={row.student.status} />
          </span>
          <span className="text-muted-foreground text-xs">
            Checked in {row.checkInTime}
          </span>
        </div>
      </div>
    );
  }

  if (row.status === "picked-up") {
    return (
      <div className="flex flex-col rounded-lg border bg-muted p-3 text-muted-foreground">
        <span className="flex items-center gap-1.5 text-sm font-medium">
          {row.student.firstName} {row.student.lastName}
          <EnrollmentStatusBadge status={row.student.status} />
        </span>
        <span className="text-xs">Picked up {row.pickUpTime}</span>
      </div>
    );
  }

  if (row.status === "checked-out") {
    return (
      <div className="flex flex-col rounded-lg border bg-muted p-3 text-muted-foreground">
        <span className="flex items-center gap-1.5 text-sm font-medium">
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
      <div className="flex items-center justify-between gap-2 border-x-0 border-t-0 border-b-2 border-amber-500 bg-amber-50 p-3 dark:border-amber-400 dark:bg-amber-950/40">
        <div className="flex flex-col">
          <span className="flex items-center gap-1.5 text-sm font-medium">
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
          onClick={() => onCheckIn(row.student)}
        >
          <PlusIcon className="h-3.5 w-3.5" />
          <span className="sr-only">Check in</span>
        </Button>
      </div>
    );
  }

  if (row.status === "unknown") {
    return (
      <div className="flex items-center justify-between gap-2 border-x-0 border-t-0 border-b-2 border-rose-500 bg-rose-50 p-3 dark:border-rose-400 dark:bg-rose-950/40">
        <div className="flex flex-col">
          <span className="flex items-center gap-1.5 text-sm font-medium">
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
          onClick={() => onCheckIn(row.student)}
        >
          <PlusIcon className="h-3.5 w-3.5" />
          <span className="sr-only">Check in</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border bg-card p-3">
      <span className="flex items-center gap-1.5 text-sm font-medium">
        {row.student.firstName} {row.student.lastName}
        <EnrollmentStatusBadge status={row.student.status} />
      </span>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => onCheckIn(row.student)}
      >
        <PlusIcon className="h-3.5 w-3.5" />
        <span className="sr-only">Check in</span>
      </Button>
    </div>
  );
}
