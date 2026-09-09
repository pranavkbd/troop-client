# The Attendance Ledger

**Troop — Attendance & Scheduling design memo**
Status: exploratory — reasoning is implemented against mock data; no real database yet.

How a student's check-ins, corrections, and voided records should be stored — and why the table you look at every day shouldn't be the table that remembers what actually happened.

## Contents

1. [The problem with one mutable row](#01--the-problem-with-one-mutable-row)
2. [Two tables, one truth](#02--two-tables-one-truth)
3. [The write path](#03--the-write-path)
4. [What counts as an action](#04--what-counts-as-an-action)
5. [Correcting the past](#05--correcting-the-past)
6. [The cost of reading it back](#06--the-cost-of-reading-it-back)
7. [Representing a schedule](#07--representing-a-schedule)
8. [The database shape](#08--the-database-shape)
9. [Queries that matter](#09--queries-that-matter)
10. [Open questions](#10--open-questions)

---

## 01 — The problem with one mutable row

The obvious way to store attendance is a row per session: a `checkInTime` and `checkOutTime` column a staff member fills in and edits directly. It works — until someone asks who changed a check-in time from 4:02pm to 4:00pm, or why a record disappeared. If the row is the only thing that exists, editing it destroys the only evidence of what it used to say.

That's the core tension this memo works through: the table people look at every day (`attendance_records`) and the record of what actually happened (`activity_log`) can't be the same table.

## 02 — Two tables, one truth

**`activity_log` is the source of truth.** Every check-in, check-out, edit, and void is appended to it and never rewritten — the same principle a general ledger uses: mistakes get a correcting entry, not an erasure.

**`attendance_records` is a derived summary** — one row per session, with the check-in/check-out span living alongside status and notes for easy display. It's what the Attendance tab reads. It is never edited on its own; it only changes as a side effect of an event being appended.

> Users mostly interact with `attendance_records`. Every action that touches it is actually recorded in `activity_log` first.

## 03 — The write path

Each event targets exactly one summary row — never the whole table — and both writes happen inside one transaction, so the log and the summary can never disagree.

```
                 ┌─────────────── TRANSACTION ───────────────┐
                 │                                            │
recordCheckIn() ─┼─ append ─▶ activity_log                    │  ◀── read by the
 enrollmentId,   │            (+1 row · append-only)          │      Activity Log tab
 date, time      │                                            │
                 │─ upsert ─▶ attendance_records               │  ◀── read by the
                 │            (1 row changed, in place)        │      Attendance tab
                 └────────────────────────────────────────────┘
```

```ts
function recordCheckIn(params: {
  enrollmentId: string; date: string; time: string; employeeName: string;
}) {
  const recordId = `${params.enrollmentId}-${params.date}`;

  withTransaction(() => {
    appendEvent({
      studentId: enrollment.studentId,
      employeeName: params.employeeName,
      action: "Checked In",
      occurredAt: `${params.date}T${params.time}:00`,
      metadata: { attendanceRecordId: recordId, enrollmentId: enrollment.id },
    });

    upsertAttendanceRecord(recordId, {
      status: isLate ? "late" : "present",
      checkInTime: params.time,
    });
  });
}
```

The rule that makes this trustworthy: **nothing else is allowed to write to `attendance_records`**. Not a migration script, not an admin edit, not a well-meaning shortcut — only a function shaped like this one, that always writes the event first.

`recordCheckIn`, `recordCheckOut`, `recordAbsence`, and `editAttendanceField` all funnel through one more shared primitive underneath — `upsertAttendanceRecord` — and that's deliberate, not incidental:

```ts
function upsertAttendanceRecord(recordId, base, patch) {
  const existing = attendanceRecordsById.get(recordId);
  attendanceRecordsById.set(recordId, {
    id: recordId,
    status: "present",
    ...existing,
    voidedAt: undefined,     // every write un-voids by default
    voidReason: undefined,
    ...base,
    ...patch,                // voidAttendanceRecord is the only caller that re-sets these
  });
}
```

Any invariant that has to hold across *every* write — "un-void the slot whenever something legitimate happens to it" is one, see §08 — belongs in this one function, not repeated in each caller. The moment you catch yourself thinking "I just have to remember to clear X every time I call this," that's the signal X has been pushed one level too high: move it down into the shared primitive, where it can't be forgotten, instead of trusting every call site to get it right.

## 04 — What counts as an action

Not every field change deserves its own action name. `Updated Check-In Time` and `Updated Check-Out Time` aren't real domain actions — they're field-level edits, and inventing a new action name per editable field doesn't scale. They collapse into one:

| action | means | who |
|---|---|---|
| `Checked In` | Student arrived | Instructor |
| `Checked Out` | Student left | Instructor |
| `Marked Absent` / `Marked Excused` | No session occurred | Front desk |
| `Edited Attendance Record` | A field was corrected — `metadata.field` says which | Front desk |
| `Voided Attendance Record` | The record itself is retracted | Front desk |

A staff member fat-fingering a check-in and immediately clicking checkout isn't a special case, either — `Checked In` then `Checked Out` is exactly what happened, so that's exactly what gets logged. The "oops, undo that" case is what `Voided Attendance Record` is for.

## 05 — Correcting the past

An edit made today can target a session from two weeks ago — so every event needs two independent timestamps: `date` (which session this is about) and `occurredAt` (when the event was actually recorded).

| action | `date` | `occurredAt` |
|---|---|---|
| `Checked In` | `2026-08-25` | `2026-08-25T16:02:00` |
| `Edited Attendance Record` | `2026-08-25` | `2026-09-10T11:30:00` |

To compute the Aug 25 row, fold every event whose `date` is Aug 25 — regardless of when they were logged — in `occurredAt` order. The correction lands on Aug 25's row, not on today's.

```ts
const record = events.reduce((row, event) => {
  switch (event.action) {
    case "Checked In":
    case "Edited Attendance Record":
      return { ...row, [event.field]: event.value };
    case "Voided Attendance Record":
      return { ...row, voidedAt: event.occurredAt };
    default:
      return row;
  }
}, {});
```

## 06 — The cost of reading it back

Folding on every read is not "one query per row" — it's one query for all of a student's events, then a fold in memory. Cheap for a single history page. It stops being cheap for a dashboard folding every student on every page load, which is exactly why `attendance_records` exists at all.

| strategy | when | cost |
|---|---|---|
| Fold at read time | One student's history page | Cheap — dozens to hundreds of events, folded once per view |
| Materialize at write time *(chosen)* | A roster / dashboard of many students | Reads are a plain table scan; the fold happens once, per event, at write time |

## 07 — Representing a schedule

A schedule isn't an event stream — it's configuration, not "things that happened." It gets a plainer model: one row per day and time a student actually attends, with the subject stripped out entirely.

> Subject and level are informational (the badges on the student profile), not a scheduling axis. A student doesn't have a "Math schedule" and a "Reading schedule" — they have one weekly schedule.

```ts
interface ScheduleSlot {
  id: string;
  studentId: string;
  dayOfWeek: DayOfWeek;  // Mon–Sun
  startTime: string;     // "16:00"
  endTime: string;
}
```

If schedule history ever matters — who moved a student's Tuesday slot, and when — that's a lightweight audit log next to the slot table, not a full event-sourced fold. The slot itself stays directly-edited state.

## 08 — The database shape

Three tables carry the whole design: the ledger (`activity_log`), the summary it's projected into (`attendance_records`), and the schedule (`schedule_slots`) that generates sessions in the first place.

**`activity_log` — append-only, never updated**

```sql
CREATE TABLE activity_log (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id           uuid NOT NULL REFERENCES students(id),
  attendance_record_id text NOT NULL,   -- logical reference, see note below
  employee_name        text NOT NULL,
  action                text NOT NULL CHECK (action IN (
                          'Checked In', 'Checked Out',
                          'Marked Absent', 'Marked Excused',
                          'Edited Attendance Record', 'Voided Attendance Record'
                        )),
  occurred_at           timestamptz NOT NULL, -- when the event claims to have happened
  recorded_at           timestamptz NOT NULL DEFAULT now(), -- when we actually wrote the row
  metadata              jsonb NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_activity_log_record  ON activity_log (attendance_record_id);
CREATE INDEX idx_activity_log_student ON activity_log (student_id, occurred_at DESC);
CREATE INDEX idx_activity_log_meta    ON activity_log USING gin (metadata);
```

`occurred_at` and `recorded_at` are different timestamps on purpose — the same distinction §05 relies on. `occurred_at` is a claim ("this happened at 4:00pm") that a later correction can itself correct; `recorded_at` is never edited, so it's the honest answer to "when did we actually learn this."

**`attendance_records` — the derived summary, one row per session**

```sql
CREATE TABLE attendance_records (
  id               text PRIMARY KEY,      -- deterministic: enrollment_id || '-' || date
  student_id       uuid NOT NULL REFERENCES students(id),
  enrollment_id    uuid NOT NULL REFERENCES enrollments(id),
  date             date NOT NULL,         -- the business day this session belongs to
  status           text NOT NULL CHECK (status IN ('present','late','absent','excused','unknown')),
  attendance_span  tstzrange,             -- [check-in, check-out) — see note below
  excuse_reason    text CHECK (excuse_reason IN ('sick','vacation','other')),
  notes            text,
  voided_at        timestamptz,
  void_reason      text,
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (enrollment_id, date)
);

CREATE INDEX idx_attendance_records_student ON attendance_records (student_id, date DESC);

-- fast "who's still here right now" — see §09
CREATE INDEX idx_attendance_records_open ON attendance_records (date)
  WHERE upper_inf(attendance_span) AND voided_at IS NULL;
```

`attendance_span` is a timezone-aware range, not two naive `time` columns — a plain `time` value has no UTC offset, so it quietly breaks across DST transitions and can't survive a second location in another timezone. A `tstzrange` also gives the states real meaning instead of a null check standing in for one:

| state | value |
|---|---|
| not checked in yet | `NULL` |
| checked in, still present | `[2026-09-09 16:00-04, )` — open upper bound |
| completed session | `[2026-09-09 16:00-04, 2026-09-09 17:30-04)` |

`date` stays a separate column on purpose, rather than being derived from `attendance_span` — it names *which schedule slot* this attendance is for (the business day), which can diverge at the edges from the literal check-in instant (a center open past midnight, say). It's set from the slot being fulfilled, never cast off the timestamp.

**`schedule_slots` — configuration, not events**

```sql
SELECT EXTRACT(ISODOW FROM TIMESTAMP '2026-09-09');
-- 3 (Wednesday). Monday is 1, Sunday is 7.

CREATE TABLE schedule_slots (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- ISODOW
  start_time  time NOT NULL,
  end_time    time NOT NULL CHECK (end_time > start_time),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_schedule_slots_student ON schedule_slots (student_id);
```

Decisions worth calling out:

- `attendance_record_id` on `activity_log` is deliberately *not* a foreign key. The log is the more primitive table — its authority shouldn't depend on the summary row already existing, or on which order a transaction happens to write things in.
- `time` and `smallint` columns on `schedule_slots`, not strings — the database can do the arithmetic and enforce it, instead of every comparison happening in application code.
- An exclusion constraint (`EXCLUDE USING gist`, via `btree_gist`) on `(student_id, day_of_week, tsrange(start_time, end_time))` makes double-booking a student structurally impossible, not just UI-validated.
- A pure recurring model can't say "skip this once" or "moved to Wednesday just this week." If that's real, it's a separate `schedule_exceptions` table — the same pattern iCal uses for `EXDATE` — not a special case bolted onto `schedule_slots`.

## 09 — Queries that matter

The schema is only as good as the questions it answers quickly. Five queries a front desk or an auditor would actually run:

**01 — a student's current attendance history**

```sql
SELECT date, attendance_span, status, notes
FROM attendance_records
WHERE student_id = $1 AND voided_at IS NULL
ORDER BY date DESC;
```

**02 — the full audit trail behind one row**

```sql
SELECT occurred_at, employee_name, action, metadata
FROM activity_log
WHERE attendance_record_id = $1
ORDER BY occurred_at ASC;
```

This is the fold from §05, minus the folding — the raw sequence of events a "why does this say 4:00pm" support ticket needs.

**03 — who's still checked in right now**

```sql
SELECT student_id, lower(attendance_span) AS checked_in_at
FROM attendance_records
WHERE date = CURRENT_DATE
  AND upper_inf(attendance_span)
  AND voided_at IS NULL;
```

Backed by the partial index in §08 — this is the query a front-desk dashboard would poll, so it needs to stay index-only fast even with years of history sitting in the table.

**04 — everything one employee touched this week**

```sql
SELECT occurred_at, action, student_id, metadata
FROM activity_log
WHERE employee_name = $1
  AND occurred_at >= $2 AND occurred_at < $3
ORDER BY occurred_at DESC;
```

The accountability query — spot-checking a staff member's edits and voids, not just their check-ins.

**05 — a student's next scheduled session**

```sql
SELECT s.*,
  (CURRENT_DATE
    + ((s.day_of_week - EXTRACT(ISODOW FROM CURRENT_DATE)::int + 7) % 7)
  )::date AS next_date
FROM schedule_slots s
WHERE s.student_id = $1
ORDER BY next_date, s.start_time
LIMIT 1;
```

Same `ISODOW` arithmetic as §08, put to work — this is what powers the "Next session: Tuesday at 4:00pm" line on the student page.

## 10 — Open questions

- **Typing.** Metadata is still `Record<string, unknown>` for every action. A discriminated union keyed by `action` would guarantee an `Edited Attendance Record` event always has `previousValue` / `newValue`.
- **Taxonomy.** `reason` on a void is free text (`"Duplicate entry"`). Real time-and-attendance systems require a fixed reason-code enum for compliance reporting — worth doing before this reaches anything regulated.
- **Migration.** `Enrollment` still conflates day/time with subject and instructor. Splitting it into `ScheduleSlot` (§07) is designed but not yet implemented against the mock data.
- **Exceptions.** No `schedule_exceptions` concept exists yet. Don't build it speculatively — confirm "reschedule just this once" is something staff actually ask for first.

---

*Troop — student attendance & scheduling. Design memo, not a spec.*
