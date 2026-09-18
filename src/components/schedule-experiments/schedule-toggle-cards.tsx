"use client";

import { CheckIcon } from "lucide-react";
import { useState } from "react";
import {
  EXPERIMENT_DAYS,
  getTimeSlots,
  slotKey,
} from "@/lib/schedule-experiment-utils";
import { cn } from "@/lib/utils";

const timeSlots = getTimeSlots();

export function ScheduleToggleCards() {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(day: string, time: string) {
    const key = slotKey(day, time);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-6 md:flex-row md:gap-2">
      {EXPERIMENT_DAYS.map((day) => (
        <div key={day} className="flex flex-col gap-2 md:flex-1">
          <div className="sticky top-0 z-10 rounded-md bg-muted px-2 py-1.5 text-center text-sm font-medium">
            {day}
          </div>
          <div className="flex flex-col gap-1.5">
            {timeSlots.map((slot) => {
              const key = slotKey(day, slot.value);
              const isSelected = selected.has(key);
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => toggle(day, slot.value)}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm ring-1 ring-foreground/10 transition-colors",
                    isSelected
                      ? "bg-primary text-primary-foreground ring-primary"
                      : "bg-card text-card-foreground hover:bg-muted",
                  )}
                >
                  <span className="flex items-baseline gap-1.5">
                    <span>{slot.label}</span>
                    <span
                      className={cn(
                        "text-xs md:hidden",
                        isSelected
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground",
                      )}
                    >
                      {day}
                    </span>
                  </span>
                  {isSelected ? (
                    <CheckIcon className="size-3.5 shrink-0" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
