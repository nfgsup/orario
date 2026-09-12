"use client";

import * as React from "react";
import { Search, Users, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  SCHEDULE,
  DAY_ORDER,
  SUBJECT_META,
  SLOT_START,
  SLOT_END,
  resolveDay,
  jsDayToDayKey,
  type DayKey,
  type SubjectKey,
} from "@/lib/schedule";
import { SubjectIcon } from "./icons";

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------
interface TeacherSlot {
  dayKey: DayKey;
  dayShort: string;
  dayLabel: string;
  startSlot: number;
  endSlot: number;
  startTime: string;
  endTime: string;
  subjectKey: SubjectKey;
  subjectShort: string;
  room: string;
  isDouble: boolean;
  /** Absolute Date on `now`'s day (only meaningful if dayKey === today). */
  start: Date;
  end: Date;
}

interface TeacherRecord {
  name: string;
  surname: string;
  initials: string;
  subjectKeys: SubjectKey[];
  rooms: string[];
  slots: TeacherSlot[];
  teachingNow: boolean;
}

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

/** First letter of each whitespace-separated part, uppercased. */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = parts
    .map((p) => p.charAt(0).toUpperCase())
    .filter((c) => /[A-Z]/.test(c))
    .join("");
  return initials.slice(0, 3) || "?";
}

/**
 * Extract surname for sorting.
 *
 * Spec says "last word of name", but our data follows the Italian school
 * convention "Surname Initial." (e.g. "Pompilio G.", "D'Addona R.A."). When
 * the last word looks like an initial (short, all caps + dots), we fall back
 * to the first word so surnames sort correctly in both conventions.
 */
function getSurname(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return name;
  if (parts.length === 1) return parts[0];
  const last = parts[parts.length - 1];
  // Looks like an initial token: "G." "M.G." "R.A." (only uppercase letters + dots)
  const looksLikeInitial = /^[A-Z]+(\.[A-Z]+)*\.?$/.test(last) && last.length <= 5;
  return looksLikeInitial ? parts[0] : last;
}

const DAY_ORDER_INDEX: Record<DayKey, number> = {
  Monday: 0,
  Tuesday: 1,
  Wednesday: 2,
  Thursday: 3,
  Friday: 4,
  Saturday: 5,
};

/**
 * SubjectKey → { name, short } lookup, derived from SCHEDULE since SUBJECT_META
 * only carries styling info (no human-readable name/short).
 */
const SUBJECT_LABELS: Record<SubjectKey, { name: string; short: string }> =
  (() => {
    const out = {} as Record<SubjectKey, { name: string; short: string }>;
    for (const dk of DAY_ORDER) {
      for (const entry of SCHEDULE[dk].entries) {
        const s = entry.subject;
        if (!out[s.key]) out[s.key] = { name: s.name, short: s.short };
      }
    }
    return out;
  })();

/** Build the list of teachers from SCHEDULE. Recomputed when `now` changes. */
function buildTeachers(now: Date): TeacherRecord[] {
  const todayKey = jsDayToDayKey(now.getDay());
  const nowMs = now.getTime();
  const map = new Map<string, TeacherRecord>();

  for (const dayKey of DAY_ORDER) {
    const day = SCHEDULE[dayKey];
    // resolveDay lays out entries on concrete time slots starting at 08:05.
    // We pass `now` as the base so the absolute start/end Dates are on today's
    // date (only meaningful when dayKey === todayKey for the "teaching now" check).
    const resolved = resolveDay(day, now);

    for (const re of resolved) {
      // Split co-taught labs on " · " — each teacher gets their own record.
      const teacherNames = re.subject.teacher
        .split(" · ")
        .map((t) => t.trim())
        .filter(Boolean);

      const slot: TeacherSlot = {
        dayKey,
        dayShort: day.short,
        dayLabel: day.label,
        startSlot: re.startSlot,
        endSlot: re.endSlot,
        startTime: SLOT_START[re.startSlot],
        endTime: SLOT_END[re.endSlot],
        subjectKey: re.subject.key,
        subjectShort: re.subject.short,
        room: re.subject.room,
        isDouble: re.entry.hours === 2,
        start: re.start,
        end: re.end,
      };

      const isToday = dayKey === todayKey;
      const slotActiveNow =
        isToday &&
        nowMs >= re.start.getTime() &&
        nowMs < re.end.getTime();

      for (const teacherName of teacherNames) {
        let rec = map.get(teacherName);
        if (!rec) {
          rec = {
            name: teacherName,
            surname: getSurname(teacherName),
            initials: getInitials(teacherName),
            subjectKeys: [],
            rooms: [],
            slots: [],
            teachingNow: false,
          };
          map.set(teacherName, rec);
        }
        if (!rec.subjectKeys.includes(slot.subjectKey)) {
          rec.subjectKeys.push(slot.subjectKey);
        }
        if (!rec.rooms.includes(slot.room)) {
          rec.rooms.push(slot.room);
        }
        rec.slots.push(slot);
        if (slotActiveNow) rec.teachingNow = true;
      }
    }
  }

  const list = Array.from(map.values());

  // Sort slots within a teacher chronologically (day order, then start slot).
  for (const t of list) {
    t.slots.sort((a, b) => {
      const d = DAY_ORDER_INDEX[a.dayKey] - DAY_ORDER_INDEX[b.dayKey];
      if (d !== 0) return d;
      return a.startSlot - b.startSlot;
    });
    // Stable, friendly subject order (by DAY_ORDER first occurrence).
    // (subjectKeys already in insertion order — leave as-is.)
  }

  // Sort teachers: teaching-now first, then alphabetically by surname.
  list.sort((a, b) => {
    if (a.teachingNow !== b.teachingNow) return a.teachingNow ? -1 : 1;
    const sa = a.surname.toLowerCase();
    const sb = b.surname.toLowerCase();
    if (sa !== sb) return sa.localeCompare(sb, "it");
    return a.name.localeCompare(b.name, "it");
  });

  return list;
}

// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------
export function TeachersDirectory({ now }: { now: Date }) {
  const [query, setQuery] = React.useState("");

  // Rebuild every render tick — cheap (12 teachers, ~30 slots) and keeps the
  // "in classe ora" highlight in sync with the per-second page refresh.
  const teachers = React.useMemo(() => buildTeachers(now), [now]);

  const q = query.trim().toLowerCase();
  const filtered: TeacherRecord[] = React.useMemo(() => {
    if (!q) return teachers;
    return teachers.filter((t) => {
      if (t.name.toLowerCase().includes(q)) return true;
      if (t.surname.toLowerCase().includes(q)) return true;
      for (const sk of t.subjectKeys) {
        const m = SUBJECT_META[sk];
        const lbl = SUBJECT_LABELS[sk];
        if (
          lbl.name.toLowerCase().includes(q) ||
          lbl.short.toLowerCase().includes(q) ||
          m.emoji.includes(q)
        )
          return true;
      }
      return false;
    });
  }, [teachers, q]);

  const nowCount = teachers.reduce((n, t) => n + (t.teachingNow ? 1 : 0), 0);

  return (
    <section className="rounded-3xl border border-border/60 bg-card/60 backdrop-blur-md p-5 sm:p-6 shadow-lg shadow-black/5 animate-rise">
      <header className="flex items-center gap-2 mb-3">
        <div className="grid place-items-center w-9 h-9 rounded-xl bg-primary/15 text-primary shrink-0">
          <Users className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold leading-tight">Docenti</h2>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
            <span className="tnum">{teachers.length} docenti</span>
            {nowCount > 0 && (
              <>
                <span className="opacity-40">·</span>
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-300 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-soft" />
                  {nowCount} in classe ora
                </span>
              </>
            )}
          </p>
        </div>
      </header>

      {/* Scrollable area: sticky search stays pinned while the list scrolls */}
      <div className="max-h-[32rem] overflow-y-auto fancy-scroll -mx-1 px-1">
        <div className="sticky top-0 z-10 -mx-1 px-3 py-2 bg-card/90 backdrop-blur-md border-b border-border/40">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cerca docente o materia…"
              className="pl-9 h-10 rounded-xl bg-background/60"
              aria-label="Cerca docente o materia"
            />
          </div>
        </div>

        <div className="space-y-2 pt-2 pb-1">
          {filtered.length === 0 ? (
            <EmptyState query={query} />
          ) : (
            filtered.map((t) => <TeacherCard key={t.name} teacher={t} />)
          )}
        </div>
      </div>
    </section>
  );
}

// ----------------------------------------------------------------
// Subcomponents
// ----------------------------------------------------------------
function EmptyState({ query }: { query: string }) {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
      <p className="text-sm">
        {query.trim()
          ? "Nessun docente trovato."
          : "Nessun docente."}
      </p>
    </div>
  );
}

function TeacherCard({ teacher }: { teacher: TeacherRecord }) {
  return (
    <article
      className={cn(
        "rounded-2xl border p-3 sm:p-4 transition-colors",
        teacher.teachingNow
          ? "border-emerald-500/50 ring-2 ring-emerald-500/40 bg-emerald-500/5"
          : "border-border/60 bg-background/40 hover:bg-background/70",
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar initials={teacher.initials} teachingNow={teacher.teachingNow} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="font-semibold leading-tight truncate">
              {teacher.name}
            </h3>
            {teacher.teachingNow && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 animate-pulse-soft">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                In classe ora
              </span>
            )}
          </div>

          {/* Subject badges */}
          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
            {teacher.subjectKeys.map((sk) => {
              const m = SUBJECT_META[sk];
              const lbl = SUBJECT_LABELS[sk];
              return (
                <span
                  key={sk}
                  className={cn(
                    "inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md border",
                    m.bg,
                    m.border,
                    m.text,
                  )}
                >
                  <SubjectIcon name={m.icon} className="w-3 h-3" />
                  {lbl.short}
                </span>
              );
            })}
          </div>

          {/* Rooms */}
          <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-muted-foreground flex-wrap">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{teacher.rooms.join(" · ")}</span>
          </div>

          {/* Slots list */}
          <div className="mt-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-1">
              Insegna
            </p>
            <ul className="space-y-0.5">
              {teacher.slots.map((s, i) => (
                <SlotRow key={`${s.dayKey}-${s.startSlot}-${i}`} slot={s} />
              ))}
            </ul>
          </div>
        </div>
      </div>
    </article>
  );
}

function Avatar({
  initials,
  teachingNow,
}: {
  initials: string;
  teachingNow: boolean;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "shrink-0 grid place-items-center w-11 h-11 rounded-full bg-gradient-to-br from-primary to-chart-2 text-primary-foreground font-bold text-sm shadow-md shadow-primary/20 select-none",
        teachingNow && "ring-2 ring-emerald-500/50 ring-offset-2 ring-offset-card",
      )}
    >
      {initials}
    </div>
  );
}

function SlotRow({ slot }: { slot: TeacherSlot }) {
  const m = SUBJECT_META[slot.subjectKey];
  return (
    <li className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
      <span className="font-semibold text-foreground/80 w-9 shrink-0 uppercase">
        {slot.dayShort}
      </span>
      <span className="tnum text-foreground/80 whitespace-nowrap">
        {slot.startTime}–{slot.endTime}
      </span>
      <span
        className={cn(
          "inline-flex items-center gap-0.5 px-1 py-0 rounded text-[9px] font-bold uppercase tracking-wide border",
          m.bg,
          m.border,
          m.text,
        )}
      >
        {slot.subjectShort}
      </span>
      {slot.isDouble && (
        <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-primary/15 text-primary">
          2h
        </span>
      )}
    </li>
  );
}

