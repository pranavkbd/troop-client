"use client";

import { format } from "date-fns";
import {
  CircleCheckIcon,
  CircleXIcon,
  Loader2Icon,
  LogInIcon,
  LogOutIcon,
  ScanBarcodeIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useTransition,
} from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  barcodeProblem,
  COMPLETE_BARCODE,
  findEmployeeByBarcode,
  looksLikeEmployeeBarcode,
  looksLikeStudentBarcode,
} from "@/lib/barcode";
import {
  SCAN_ACTION_DONE,
  SCAN_ACTION_LABELS,
  SCAN_ACTIONS,
  type ScanAction,
  type ScanResult,
} from "@/lib/scan";
import { recordScan } from "@/lib/scan-actions";
import type { Employee } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Only what the station needs; PINs never leave the server for this page. */
export type ScanEmployee = Pick<Employee, "id" | "name" | "barcode">;

/** Where we are inside one badge → student cycle. */
type Phase = { kind: "badge" } | { kind: "student"; employee: ScanEmployee };

interface RecentScan {
  id: number;
  result: ScanResult;
}

/** How long a result owns the stage before the badge prompt returns. */
const FLASH_MS = 2_500;

const RECENT_LIMIT = 6;

const ACTION_ICONS: Record<ScanAction, typeof LogInIcon> = {
  "check-in": LogInIcon,
  "check-out": LogOutIcon,
  "pick-up": UsersIcon,
};

const ACTION_HINTS: Record<ScanAction, string> = {
  "check-in": "Student has arrived for their session.",
  "check-out": "Student has finished their session.",
  "pick-up": "A guardian is taking the student home.",
};

/** Each mode gets its own hue so a glance across the room says which one is live. */
const MODE_STYLES: Record<ScanAction, { bar: string; ring: string }> = {
  "check-in": {
    bar: "bg-green-600 text-white dark:bg-green-700",
    ring: "ring-green-600/30 dark:ring-green-500/30",
  },
  "check-out": {
    bar: "bg-sky-600 text-white dark:bg-sky-700",
    ring: "ring-sky-600/30 dark:ring-sky-500/30",
  },
  "pick-up": {
    bar: "bg-violet-600 text-white dark:bg-violet-700",
    ring: "ring-violet-600/30 dark:ring-violet-500/30",
  },
};

const ENTER = "animate-in fade-in-0 duration-300";

function initialsFor(name: string) {
  return name
    .replace(".", "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function studentNameOf(result: ScanResult) {
  return result.student
    ? `${result.student.firstName} ${result.student.lastName}`
    : null;
}

// ---------------------------------------------------------------------------
// Mode picker — the first screen, and where "Change mode" lands.
// ---------------------------------------------------------------------------

function ModePicker({ onPick }: { onPick: (action: ScanAction) => void }) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-8 px-6 py-10",
        ENTER,
      )}
    >
      <div className="text-center">
        <h2 className="text-2xl font-semibold tracking-tight">
          What are you recording?
        </h2>
        <p className="text-muted-foreground text-sm">
          Pick a mode once. Then scan your badge and a student, as many times as
          you need.
        </p>
      </div>
      <div className="grid w-full max-w-xl gap-3 sm:grid-cols-3">
        {SCAN_ACTIONS.map((action, index) => {
          const Icon = ACTION_ICONS[action];
          return (
            <button
              key={action}
              type="button"
              onClick={() => onPick(action)}
              className="group flex flex-col items-center gap-2 rounded-xl border bg-card p-6 text-center transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <Icon className="h-8 w-8 text-primary transition-transform group-hover:scale-110" />
              <span className="text-lg font-semibold">
                {SCAN_ACTION_LABELS[action]}
              </span>
              <span className="text-muted-foreground text-xs">
                {ACTION_HINTS[action]}
              </span>
              <kbd className="text-muted-foreground mt-1 rounded border px-1.5 font-mono text-[10px]">
                {index + 1}
              </kbd>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mode bar — persistent header once a mode is chosen.
// ---------------------------------------------------------------------------

function ModeBar({
  action,
  tally,
  onSwitch,
}: {
  action: ScanAction;
  tally: number;
  onSwitch: (action: ScanAction) => void;
}) {
  const Icon = ACTION_ICONS[action];

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-t-xl px-5 py-3 transition-colors duration-300",
        MODE_STYLES[action].bar,
      )}
    >
      <div className="flex items-center gap-2.5">
        <Icon className="h-5 w-5" />
        <div className="flex flex-col leading-tight">
          <span className="text-[11px] font-medium uppercase tracking-wider opacity-80">
            Mode
          </span>
          <span className="text-base font-semibold">
            {SCAN_ACTION_LABELS[action]}
          </span>
        </div>
        <span className="ml-2 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium tabular-nums">
          {tally} recorded
        </span>
      </div>
      <fieldset
        className="flex items-center gap-0.5 rounded-lg bg-black/15 p-0.5"
        aria-label="Switch mode"
      >
        {SCAN_ACTIONS.map((candidate) => (
          <button
            key={candidate}
            type="button"
            aria-pressed={candidate === action}
            tabIndex={-1}
            onClick={() => onSwitch(candidate)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              candidate === action
                ? "bg-white text-foreground shadow-sm"
                : "text-white/80 hover:bg-white/15 hover:text-white",
            )}
          >
            {SCAN_ACTION_LABELS[candidate]}
          </button>
        ))}
      </fieldset>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stage — fixed-geometry center where prompts and results swap in place.
// ---------------------------------------------------------------------------

interface StageProps {
  action: ScanAction;
  phase: Phase;
  flash: RecentScan | null;
  error: string | null;
  pending: boolean;
  onScan: (code: string) => void;
}

function Stage({ action, phase, flash, error, pending, onScan }: StageProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");

  // Keep the scanner input focused no matter what else happens on the page.
  // A USB scanner is a keyboard: it types the code and presses Enter.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function refocus() {
    window.setTimeout(() => {
      const active = document.activeElement;
      if (
        active instanceof HTMLButtonElement ||
        active instanceof HTMLAnchorElement
      ) {
        return;
      }
      inputRef.current?.focus();
    }, 50);
  }

  const result = flash?.result ?? null;
  const awaitingStudent = phase.kind === "student";

  // Some scanners are configured without an Enter suffix. When the typed
  // value already looks like a complete code and the keystrokes pause, submit
  // it anyway. A scanner types a whole code in a few milliseconds, so a short
  // idle window separates it from a person still typing.
  const submitRef = useRef<() => void>(() => {});
  submitRef.current = () => {
    const code = value.trim();
    setValue("");
    if (!code) return;
    onScan(code);
  };
  useEffect(() => {
    if (!COMPLETE_BARCODE.test(value.trim())) return;
    const timer = window.setTimeout(() => submitRef.current(), 250);
    return () => window.clearTimeout(timer);
  }, [value]);

  return (
    <form
      className="relative flex flex-col items-center px-6 pt-8 pb-6"
      onSubmit={(event) => {
        event.preventDefault();
        submitRef.current();
      }}
    >
      {/* Cycle pips: which half of badge → student we're in. */}
      <ol className="mb-6 flex items-center gap-2 text-xs font-medium">
        <li
          className={cn(
            "rounded-full border px-2.5 py-1 transition-colors",
            !awaitingStudent
              ? "border-foreground bg-foreground text-background"
              : "text-muted-foreground",
          )}
        >
          Badge
        </li>
        <li className="h-px w-6 bg-border" aria-hidden />
        <li
          className={cn(
            "rounded-full border px-2.5 py-1 transition-colors",
            awaitingStudent
              ? "border-foreground bg-foreground text-background"
              : "text-muted-foreground",
          )}
        >
          Student
        </li>
      </ol>

      {/* Headline zone: fixed height so prompt ⇄ result never shifts the input. */}
      <div className="relative h-40 w-full">
        {result ? (
          <output
            key={flash?.id}
            aria-live="assertive"
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl text-center",
              "animate-in fade-in-0 zoom-in-95 duration-300",
              result.ok
                ? "bg-green-50 text-green-900 dark:bg-green-950/50 dark:text-green-100"
                : "bg-rose-50 text-rose-900 dark:bg-rose-950/50 dark:text-rose-100",
            )}
          >
            {result.ok ? (
              <CircleCheckIcon className="h-12 w-12 text-green-600 dark:text-green-400" />
            ) : (
              <CircleXIcon className="h-12 w-12 text-rose-600 dark:text-rose-400" />
            )}
            <h2 className="px-6 text-2xl font-semibold tracking-tight">
              {result.ok
                ? `${studentNameOf(result)} ${SCAN_ACTION_DONE[result.action]}`
                : result.message}
            </h2>
            <p className="text-sm opacity-80">
              {result.ok
                ? `${result.time} · by ${result.employeeName}`
                : studentNameOf(result) &&
                    !result.message.includes(studentNameOf(result) ?? "")
                  ? studentNameOf(result)
                  : null}
            </p>
            {result.detail ? (
              <p className="text-sm font-medium">{result.detail}</p>
            ) : null}
          </output>
        ) : (
          <div
            key={awaitingStudent ? "student" : "badge"}
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center gap-3 text-center",
              ENTER,
            )}
          >
            {awaitingStudent ? (
              <div className="bg-foreground text-background flex h-14 w-14 items-center justify-center rounded-full text-lg font-semibold">
                {initialsFor(phase.employee.name)}
              </div>
            ) : (
              <ScanBarcodeIcon className="text-muted-foreground h-14 w-14" />
            )}
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                {awaitingStudent
                  ? "Now scan the student"
                  : "Scan your badge to begin"}
              </h2>
              <p className="text-muted-foreground text-sm">
                {awaitingStudent
                  ? `${phase.employee.name} · ${ACTION_HINTS[action]}`
                  : `Every ${SCAN_ACTION_LABELS[action].toLowerCase()} is attributed to the badge scanned first.`}
              </p>
            </div>
          </div>
        )}
      </div>

      <Input
        ref={inputRef}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={refocus}
        placeholder={awaitingStudent ? "S10000000" : "E000000"}
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        disabled={pending}
        aria-label={
          awaitingStudent ? "Student barcode" : "Employee badge barcode"
        }
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "scan-error" : undefined}
        className="mt-4 h-12 max-w-sm text-center font-mono text-lg tracking-widest transition-shadow"
      />
      <div className="mt-3 flex h-5 items-center">
        {pending ? (
          <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
            <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
            Recording…
          </span>
        ) : error ? (
          <p id="scan-error" className={cn("text-sm text-destructive", ENTER)}>
            {error}
          </p>
        ) : (
          <p className="text-muted-foreground text-xs">
            Scan a barcode, or type the code and press Enter.
          </p>
        )}
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Recent scans — a running record of this session.
// ---------------------------------------------------------------------------

function RecentScans({ items }: { items: RecentScan[] }) {
  return (
    <section className="border-t px-5 py-4">
      <h3 className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wider">
        Recent
      </h3>
      {items.length === 0 ? (
        <p className="text-muted-foreground py-3 text-center text-sm">
          Nothing recorded yet this session.
        </p>
      ) : (
        <ol className="flex flex-col gap-1">
          {items.map((item, index) => {
            const { result } = item;
            const name = studentNameOf(result);
            return (
              <li
                key={item.id}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm",
                  index === 0 &&
                    "animate-in fade-in-0 slide-in-from-top-2 duration-300",
                  index === 0 &&
                    (result.ok
                      ? "bg-green-50 dark:bg-green-950/30"
                      : "bg-rose-50 dark:bg-rose-950/30"),
                )}
              >
                {result.ok ? (
                  <CircleCheckIcon className="h-4 w-4 shrink-0 text-green-600 dark:text-green-500" />
                ) : (
                  <CircleXIcon className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                )}
                <span className="min-w-0 flex-1 truncate">
                  {result.ok ? (
                    <>
                      <span className="font-medium">{name}</span>{" "}
                      {SCAN_ACTION_DONE[result.action]}
                    </>
                  ) : (
                    <>
                      {name ? (
                        <span className="font-medium">{name}: </span>
                      ) : null}
                      {result.message}
                    </>
                  )}
                </span>
                <span className="text-muted-foreground shrink-0 text-xs">
                  {result.ok
                    ? `${result.time} · ${result.employeeName}`
                    : SCAN_ACTION_LABELS[result.action]}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Station
// ---------------------------------------------------------------------------

interface ScanStationProps {
  employees: ScanEmployee[];
}

export function ScanStation({ employees }: ScanStationProps) {
  const [mode, setMode] = useState<ScanAction | null>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "badge" });
  const [recent, setRecent] = useState<RecentScan[]>([]);
  const [flash, setFlash] = useState<RecentScan | null>(null);
  const [tally, setTally] = useState<Record<ScanAction, number>>({
    "check-in": 0,
    "check-out": 0,
    "pick-up": 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function pickMode(action: ScanAction) {
    setMode(action);
    setPhase({ kind: "badge" });
    setFlash(null);
    setError(null);
  }

  function leaveMode() {
    setMode(null);
    setPhase({ kind: "badge" });
    setFlash(null);
    setError(null);
  }

  // Global keys: Esc backs out to the picker; 1/2/3 pick a mode from it.
  const onKey = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === "Escape") {
      leaveMode();
      return;
    }
    if (mode === null && ["1", "2", "3"].includes(event.key)) {
      // The badge input mounts and focuses during this keystroke; without
      // this, the digit would land in it as the first character of a scan.
      event.preventDefault();
      pickMode(SCAN_ACTIONS[Number(event.key) - 1]);
    }
  });
  useEffect(() => {
    const listener = (event: KeyboardEvent) => onKey(event);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  // A result owns the stage briefly, then hands it back to the badge prompt.
  useEffect(() => {
    if (!flash) return;
    const timer = window.setTimeout(() => setFlash(null), FLASH_MS);
    return () => window.clearTimeout(timer);
  }, [flash]);

  function handleScan(code: string) {
    if (!mode) return;

    if (phase.kind === "badge") {
      if (looksLikeStudentBarcode(code)) {
        setError("That's a student barcode. Scan your employee badge first.");
        return;
      }
      const employee = findEmployeeByBarcode(employees, code);
      if (!employee) {
        setError(
          barcodeProblem(code) ??
            `Employee badge not recognized (read "${code}"). Try again.`,
        );
        return;
      }
      setError(null);
      setFlash(null);
      setPhase({ kind: "student", employee });
      return;
    }

    if (looksLikeEmployeeBarcode(code)) {
      setError("That's an employee badge. Scan the student's barcode.");
      return;
    }
    const problem = barcodeProblem(code);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    const { employee } = phase;
    const action = mode;
    const now = new Date();
    startTransition(async () => {
      const result = await recordScan({
        action,
        employeeBarcode: employee.barcode,
        studentBarcode: code,
        date: format(now, "yyyy-MM-dd"),
        time: format(now, "HH:mm"),
      });
      const entry: RecentScan = { id: Date.now(), result };
      setRecent((previous) => [entry, ...previous].slice(0, RECENT_LIMIT));
      setFlash(entry);
      if (result.ok) {
        setTally((previous) => ({
          ...previous,
          [action]: previous[action] + 1,
        }));
      }
      setPhase({ kind: "badge" });
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Scan Station</h1>
        {mode ? (
          <Button variant="ghost" size="sm" onClick={leaveMode}>
            Change mode
            <kbd className="text-muted-foreground ml-1 rounded border px-1 font-mono text-[10px]">
              Esc
            </kbd>
          </Button>
        ) : null}
      </div>

      <Card
        className={cn(
          "min-h-[36rem] py-0 transition-shadow duration-300",
          mode && MODE_STYLES[mode].ring,
        )}
      >
        {mode === null ? (
          <ModePicker onPick={pickMode} />
        ) : (
          <>
            <ModeBar action={mode} tally={tally[mode]} onSwitch={pickMode} />
            <Stage
              action={mode}
              phase={phase}
              flash={flash}
              error={error}
              pending={isPending}
              onScan={handleScan}
            />
            <RecentScans items={recent} />
          </>
        )}
      </Card>

      {mode && recent[0]?.result.ok ? (
        <p className="text-muted-foreground text-center text-xs">
          <Link
            href={`/attendance?date=${recent[0].result.date}`}
            className="underline-offset-4 hover:underline"
          >
            View today on the attendance board
          </Link>
        </p>
      ) : null}
    </div>
  );
}
