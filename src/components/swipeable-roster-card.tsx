"use client";

import { CheckIcon, HandIcon, LogOutIcon } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SWIPE_THRESHOLD_PX = 88;
const HOLD_DURATION_MS = 550;
const HOLD_MOVE_CANCEL_PX = 10;

interface SwipeableRosterCardProps {
  studentName: string;
  onCheckIn?: () => void;
  onCheckOut?: () => void;
  onPickUp?: () => void;
  className?: string;
  children: React.ReactNode;
}

export function SwipeableRosterCard({
  studentName,
  onCheckIn,
  onCheckOut,
  onPickUp,
  className,
  children,
}: SwipeableRosterCardProps) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [confirmingPickUp, setConfirmingPickUp] = useState(false);

  const startX = useRef(0);
  const activePointerId = useRef<number | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdTriggered = useRef(false);

  const canSwipeRight = Boolean(onCheckIn);
  const canSwipeLeft = Boolean(onCheckOut);

  function clearHoldTimer() {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  }

  function handlePointerDown(e: React.PointerEvent) {
    if (!canSwipeRight && !canSwipeLeft && !onPickUp) return;

    activePointerId.current = e.pointerId;
    startX.current = e.clientX;
    holdTriggered.current = false;
    setDragging(true);

    if (onPickUp) {
      holdTimer.current = setTimeout(() => {
        holdTriggered.current = true;
        setDragX(0);
        setDragging(false);
        setConfirmingPickUp(true);
      }, HOLD_DURATION_MS);
    }
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (activePointerId.current !== e.pointerId || !dragging) return;

    const delta = e.clientX - startX.current;
    if (Math.abs(delta) > HOLD_MOVE_CANCEL_PX) {
      clearHoldTimer();
    }
    if (holdTriggered.current) return;

    let clamped = delta;
    if (!canSwipeRight) clamped = Math.min(clamped, 0);
    if (!canSwipeLeft) clamped = Math.max(clamped, 0);
    setDragX(clamped);
  }

  function endDrag() {
    clearHoldTimer();
    activePointerId.current = null;
    setDragging(false);

    if (holdTriggered.current) {
      holdTriggered.current = false;
      return;
    }

    if (dragX > SWIPE_THRESHOLD_PX && canSwipeRight) {
      onCheckIn?.();
    } else if (dragX < -SWIPE_THRESHOLD_PX && canSwipeLeft) {
      onCheckOut?.();
    }
    setDragX(0);
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (activePointerId.current !== e.pointerId) return;
    endDrag();
  }

  function handlePointerCancel(e: React.PointerEvent) {
    if (activePointerId.current !== e.pointerId) return;
    clearHoldTimer();
    activePointerId.current = null;
    holdTriggered.current = false;
    setDragging(false);
    setDragX(0);
  }

  const revealOpacity = Math.min(Math.abs(dragX) / SWIPE_THRESHOLD_PX, 1);

  return (
    <div className="relative overflow-hidden rounded-lg">
      {canSwipeRight && (
        <div
          className="absolute inset-y-0 left-0 flex items-center gap-1.5 overflow-hidden rounded-lg bg-green-600 px-4 text-sm font-medium text-white"
          style={{
            width: Math.max(dragX, 0),
            opacity: dragX > 0 ? revealOpacity : 0,
          }}
        >
          <CheckIcon className="h-4 w-4 shrink-0" />
          <span className="whitespace-nowrap">Check in</span>
        </div>
      )}
      {canSwipeLeft && (
        <div
          className="absolute inset-y-0 right-0 flex items-center justify-end gap-1.5 overflow-hidden rounded-lg bg-rose-600 px-4 text-sm font-medium text-white"
          style={{
            width: Math.max(-dragX, 0),
            opacity: dragX < 0 ? revealOpacity : 0,
          }}
        >
          <span className="whitespace-nowrap">Check out</span>
          <LogOutIcon className="h-4 w-4 shrink-0" />
        </div>
      )}

      <div
        className={cn(
          "relative touch-pan-y select-none",
          (canSwipeRight || canSwipeLeft || onPickUp) &&
            (dragging ? "cursor-grabbing" : "cursor-grab"),
          !dragging && "transition-transform duration-200 ease-out",
          className,
        )}
        style={{ transform: `translateX(${dragX}px)` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        {children}
      </div>

      {confirmingPickUp && (
        <div className="absolute inset-0 z-10 flex items-center justify-between gap-2 rounded-lg border bg-card p-3 shadow-sm">
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <HandIcon className="h-4 w-4 shrink-0" />
            Mark {studentName} picked up?
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmingPickUp(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setConfirmingPickUp(false);
                onPickUp?.();
              }}
            >
              Confirm
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
