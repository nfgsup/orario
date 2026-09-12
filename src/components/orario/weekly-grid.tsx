"use client";

import * as React from "react";
import { CalendarDays, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SCHEDULE,
  DAY_ORDER,
  SUBJECT_META,
  SLOT_START,
  SLOT_END,
  resolveDay,
  dayHours,
  dayEndLabel,
  jsDayToDayKey,
  type DayKey,
  type ResolvedEntry,
} from "@/lib/schedule";
import { SubjectIcon } from "./icons";

// ----------------------------------------------------------------
// WeeklyGrid — full-week (Mon–Sat) at-a-glance grid.
//
//  - 6 one-hour slots × 6 days (LUN..SAB).
//  - 2h entries (entry.hours === 2) merge visually into a single
//    block that spans two slot rows (CSS grid `gridRow: span 2`).
//  - Empty cells (no class in that slot for that day) render as a
//    faint dotted placeholder, NOT labeled "Buco".
//  - Highlights today's column header and the "currently in
//    progress" cell when `now` is a school day.
//  - Mobile-friendly: horizontally scrollable with a sticky first
//    column for time labels.
// ----------------------------------------------------------------

type Cell =
  | { kind: "empty" }
  | { kind: "start"; entry: ResolvedEntry; span: 1 | 2 }
  | { kind: "continuation" }; // covered by a spanning cell above

export function WeeklyGrid({ now }: { now: Date }) {
  const days: DayKey[] = DAY_ORDER;
  const slotCount = SLOT_START.length;

  // Lay each day's entries onto concrete slots (anchored on `now`).
  // Cheap computation (6 days × ≤5 entries) — no need to memoize.
  const resolvedByDay: ResolvedEntry[][] = days.map((dk) =>
    resolveDay(SCHEDULE[dk], now),
  );

  // Today's DayKey (null on Sunday).
  const todayKey: DayKey | null = jsDayToDayKey(now.getDay());

  // Currently-active entry, if `now` falls inside an entry on today.
  const t = now.getTime();
  let activeEntry: ResolvedEntry | null = null;
  if (todayKey) {
    const idx = days.indexOf(todayKey);
    if (idx !== -1) {
      activeEntry =
        resolvedByDay[idx].find(
          (e) => t >= e.start.getTime() && t < e.end.getTime(),
        ) ?? null;
    }
  }

  // Build the sparse cell matrix flattened in slot-major order
  // (cells[s * days.length + d]).
  const cells: Cell[] = [];
  for (let s = 0; s < slotCount; s++) {
    for (let d = 0; d < days.length; d++) {
      const ent = resolvedByDay[d].find(
        (e) => s >= e.startSlot && s <= e.endSlot,
      );
      if (!ent) {
        cells.push({ kind: "empty" });
      } else if (s === ent.startSlot) {
        cells.push({ kind: "start", entry: ent, span: ent.entry.hours });
      } else {
        cells.push({ kind: "continuation" });
      }
    }
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/60 backdrop-blur-md shadow-lg shadow-black/5 animate-rise">
      <header className="flex items-center gap-2 px-5 py-4 border-b border-border/60">
        <div className="grid place-items-center w-9 h-9 rounded-xl bg-primary/15 text-primary">
          <CalendarDays className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h2 className="font-semibold leading-tight">Settimana</h2>
          <p className="text-xs text-muted-foreground">
            Lunedì → Sabato · {slotCount} fasce orarie
          </p>
        </div>
        {todayKey ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 rounded-full px-2 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-soft" />
            Oggi · {SCHEDULE[todayKey].short}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/60 rounded-full px-2 py-0.5">
            Domenica
          </span>
        )}
      </header>

      <div className="overflow-x-auto fancy-scroll">
        <div
          className="min-w-[860px] p-3 grid gap-1.5"
          style={{
            gridTemplateColumns: `68px repeat(${days.length}, minmax(128px, 1fr))`,
            gridTemplateRows: `auto repeat(${slotCount}, 78px)`,
          }}
        >
          {/* Top-left corner (sticky both axes) */}
          <div
            className="sticky left-0 z-30 bg-background rounded-md"
            style={{ gridColumn: "1", gridRow: "1" }}
            aria-hidden
          />

          {/* Day headers */}
          {days.map((dk, i) => {
            const day = SCHEDULE[dk];
            const isToday = dk === todayKey;
            const hours = dayHours(day);
            const end = dayEndLabel(day);
            return (
              <div
                key={`hdr-${dk}`}
                style={{ gridColumn: String(i + 2), gridRow: "1" }}
                className={cn(
                  "rounded-lg border px-2 py-1.5 text-center transition-colors",
                  isToday
                    ? "border-primary/60 bg-primary/10 ring-1 ring-primary/40"
                    : "border-border/60 bg-background/40",
                )}
              >
                <div className="text-xs font-semibold uppercase tracking-wide">
                  {day.short}
                </div>
                <div className="text-[10px] text-muted-foreground tnum">
                  {hours}h → {end}
                </div>
              </div>
            );
          })}

          {/* Time column (sticky left) */}
          {SLOT_START.map((start, s) => (
            <div
              key={`time-${s}`}
              style={{ gridColumn: "1", gridRow: `${s + 2} / span 1` }}
              className="sticky left-0 z-20 bg-background rounded-md px-1.5 py-1 text-right flex flex-col justify-center"
            >
              <div className="text-[10px] font-medium text-muted-foreground tnum">
                {start}
              </div>
              <div className="text-[9px] text-muted-foreground/60 tnum">
                {SLOT_END[s]}
              </div>
            </div>
          ))}

          {/* Subject cells (flattened, slot-major) */}
          {cells.map((cell, idx) => {
            const s = Math.floor(idx / days.length);
            const d = idx % days.length;
            const isTodayCol = days[d] === todayKey;

            // Continuation cells are covered by a spanning block above — skip.
            if (cell.kind === "continuation") return null;

            if (cell.kind === "empty") {
              return (
                <div
                  key={`cell-${s}-${d}`}
                  style={{
                    gridColumn: String(d + 2),
                    gridRow: `${s + 2} / span 1`,
                  }}
                  className={cn(
                    "rounded-lg border border-dashed border-border/40",
                    isTodayCol && "bg-primary/5",
                  )}
                  aria-hidden
                />
              );
            }

            const e = cell.entry;
            const span = cell.span;
            const meta = SUBJECT_META[e.subject.key];
            const isActive = activeEntry !== null && activeEntry === e;

            return (
              <div
                key={`cell-${s}-${d}`}
                style={{
                  gridColumn: String(d + 2),
                  gridRow: `${s + 2} / span ${span}`,
                }}
                className={cn(
                  "rounded-lg border px-2 py-1.5 flex flex-col gap-0.5 min-w-0 overflow-hidden",
                  meta.bg,
                  meta.border,
                  meta.text,
                  isActive && "ring-2 ring-primary bg-primary/10",
                )}
                title={`${e.subject.name} · ${e.subject.teacher} · ${e.subject.room}`}
              >
                <div className="flex items-center gap-1">
                  <SubjectIcon
                    name={meta.icon}
                    className="w-4 h-4 shrink-0"
                  />
                  <span className="text-xs font-semibold truncate">
                    {e.subject.short}
                  </span>
                  {span === 2 && (
                    <span className="ml-auto text-[9px] font-bold px-1 py-0.5 rounded bg-background/70 backdrop-blur-sm">
                      2h
                    </span>
                  )}
                </div>
                <div className="text-[10px] opacity-80 truncate flex items-center gap-0.5">
                  <MapPin className="w-2.5 h-2.5 shrink-0" />
                  <span className="truncate">{e.subject.room}</span>
                </div>
                {span === 2 && (
                  <div className="text-[10px] opacity-70 truncate mt-auto">
                    {e.subject.name}
                  </div>
                )}
                {isActive && (
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary mt-0.5">
                    <span className="w-1 h-1 rounded-full bg-primary animate-pulse-soft" />
                    Adesso
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default WeeklyGrid;
