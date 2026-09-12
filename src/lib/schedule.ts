// ===================================================================
// Orario classe 3Ai — Stagione scolastica 2026/2027
// Dati estratti dalla timetable fornita (immagine).
//
// REGOLE:
//  - Niente ore buche: una cella "vuota" è in realtà la 2ª ora di un
//    "ora doppia" (stessa materia, 2h consecutive).
//  - Alcuni giorni hanno 5 ore (08:05–13:05), altri 6 ore (08:05–14:05).
// ===================================================================

export type SubjectKey =
  | "INGLESE"
  | "MATEMATICA"
  | "STORIA"
  | "INFORMATICA"
  | "LAB_INFORM"
  | "ITALIANO"
  | "RELIGIONE"
  | "LAB_TLC"
  | "TLC"
  | "TPSIT"
  | "LAB_TPSIT"
  | "SC_MOT_SPORT"
  | "LAB_SIST_RETI"
  | "SISTEMI_RETI";

export interface SubjectInfo {
  key: SubjectKey;
  name: string; // full name as shown on timetable
  short: string; // short tag for badges
  teacher: string;
  room: string;
  isLab: boolean;
}

export interface ScheduleEntry {
  subject: SubjectInfo;
  hours: 1 | 2; // duration in hours (1 or 2 for "ora doppia")
}

export type DayKey =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday";

export interface DaySchedule {
  key: DayKey;
  label: string; // "Lunedì"
  short: string; // "LUN"
  entries: ScheduleEntry[]; // in chronological order, starting 08:05
}

// 6 possible one-hour slots. Days use the first 5 (→13:05) or 6 (→14:05).
export const SLOT_START = [
  "08:05",
  "09:05",
  "10:05",
  "11:05",
  "12:05",
  "13:05",
] as const;
export const SLOT_END = [
  "09:05",
  "10:05",
  "11:05",
  "12:05",
  "13:05",
  "14:05",
] as const;

// Helper to build a subject quickly
const S = (
  key: SubjectKey,
  name: string,
  short: string,
  teacher: string,
  room: string,
  isLab = false,
): SubjectInfo => ({ key, name, short, teacher, room, isLab });

// --- Subjects dictionary (for color/icon lookup) ---
export const SUBJECT_META: Record<
  SubjectKey,
  { color: string; bg: string; border: string; text: string; icon: string; emoji: string }
> = {
  INGLESE: {
    color: "amber",
    bg: "bg-amber-500/15",
    border: "border-amber-500/40",
    text: "text-amber-600 dark:text-amber-300",
    icon: "Languages",
    emoji: "🇬🇧",
  },
  MATEMATICA: {
    color: "rose",
    bg: "bg-rose-500/15",
    border: "border-rose-500/40",
    text: "text-rose-600 dark:text-rose-300",
    icon: "Calculator",
    emoji: "📐",
  },
  STORIA: {
    color: "orange",
    bg: "bg-orange-500/15",
    border: "border-orange-500/40",
    text: "text-orange-600 dark:text-orange-300",
    icon: "Landmark",
    emoji: "🏛️",
  },
  INFORMATICA: {
    color: "cyan",
    bg: "bg-cyan-500/15",
    border: "border-cyan-500/40",
    text: "text-cyan-600 dark:text-cyan-300",
    icon: "Cpu",
    emoji: "💻",
  },
  LAB_INFORM: {
    color: "cyan",
    bg: "bg-cyan-500/15",
    border: "border-cyan-500/40",
    text: "text-cyan-600 dark:text-cyan-300",
    icon: "Terminal",
    emoji: "🖥️",
  },
  ITALIANO: {
    color: "red",
    bg: "bg-red-500/15",
    border: "border-red-500/40",
    text: "text-red-600 dark:text-red-300",
    icon: "BookOpen",
    emoji: "📖",
  },
  RELIGIONE: {
    color: "violet",
    bg: "bg-violet-500/15",
    border: "border-violet-500/40",
    text: "text-violet-600 dark:text-violet-300",
    icon: "Church",
    emoji: "✝️",
  },
  LAB_TLC: {
    color: "teal",
    bg: "bg-teal-500/15",
    border: "border-teal-500/40",
    text: "text-teal-600 dark:text-teal-300",
    icon: "CircuitBoard",
    emoji: "📡",
  },
  TLC: {
    color: "teal",
    bg: "bg-teal-500/15",
    border: "border-teal-500/40",
    text: "text-teal-600 dark:text-teal-300",
    icon: "Radio",
    emoji: "📻",
  },
  TPSIT: {
    color: "emerald",
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/40",
    text: "text-emerald-600 dark:text-emerald-300",
    icon: "Network",
    emoji: "🌐",
  },
  LAB_TPSIT: {
    color: "emerald",
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/40",
    text: "text-emerald-600 dark:text-emerald-300",
    icon: "Server",
    emoji: "🗄️",
  },
  SC_MOT_SPORT: {
    color: "lime",
    bg: "bg-lime-500/15",
    border: "border-lime-500/40",
    text: "text-lime-600 dark:text-lime-300",
    icon: "Dumbbell",
    emoji: "⚽",
  },
  LAB_SIST_RETI: {
    color: "fuchsia",
    bg: "bg-fuchsia-500/15",
    border: "border-fuchsia-500/40",
    text: "text-fuchsia-600 dark:text-fuchsia-300",
    icon: "Router",
    emoji: "🔧",
  },
  SISTEMI_RETI: {
    color: "fuchsia",
    bg: "bg-fuchsia-500/15",
    border: "border-fuchsia-500/40",
    text: "text-fuchsia-600 dark:text-fuchsia-300",
    icon: "Network",
    emoji: "🔗",
  },
};

// ===================================================================
// SCHEDULE GRID
// Entries are sequential from 08:05. Each entry consumes `hours` slots.
// 5-hour days end at 13:05. 6-hour days end at 14:05.
// ===================================================================
export const SCHEDULE: Record<DayKey, DaySchedule> = {
  // 5h → 13:05
  Monday: {
    key: "Monday",
    label: "Lunedì",
    short: "LUN",
    entries: [
      { subject: S("INGLESE", "INGLESE", "ING", "Nardella T.", "P2-03"), hours: 1 },
      { subject: S("LAB_TLC", "LAB. TLC", "TLC", "Pompilio G. · Placentino G.", "Lab. Ele. 1", true), hours: 2 },
      { subject: S("LAB_SIST_RETI", "LAB. SIST. E RETI", "S&R", "Chiumento G. · Mischielli C.", "Lab. Sist.", true), hours: 2 },
    ],
  },
  // 6h → 14:05
  Tuesday: {
    key: "Tuesday",
    label: "Martedì",
    short: "MAR",
    entries: [
      { subject: S("MATEMATICA", "MATEMATICA", "MAT", "D'Addona R.A.", "P2-01"), hours: 2 },
      { subject: S("TPSIT", "TPSIT", "TPSIT", "Chiumento G.", "P2-01"), hours: 1 },
      { subject: S("INFORMATICA", "INFORMATICA", "INF", "Tamburrano P.", "P2-01"), hours: 1 },
      { subject: S("ITALIANO", "ITALIANO", "ITA", "Ferosi G.", "P2-01"), hours: 1 },
      { subject: S("SISTEMI_RETI", "SISTEMI E RETI", "S&R", "Chiumento G.", "P2-01"), hours: 1 },
    ],
  },
  // 5h → 13:05
  Wednesday: {
    key: "Wednesday",
    label: "Mercoledì",
    short: "MER",
    entries: [
      { subject: S("STORIA", "STORIA", "STO", "Ferosi G.", "P2-03"), hours: 1 },
      { subject: S("INFORMATICA", "INFORMATICA", "INF", "Tamburrano P.", "P2-03"), hours: 2 },
      { subject: S("LAB_TPSIT", "LAB. TPSIT", "TPSIT", "Chiumento G. · Augello", "Lab. Tec. Inf.", true), hours: 2 },
    ],
  },
  // 6h → 14:05
  Thursday: {
    key: "Thursday",
    label: "Giovedì",
    short: "GIO",
    entries: [
      { subject: S("MATEMATICA", "MATEMATICA", "MAT", "D'Addona R.A.", "P2-03"), hours: 1 },
      { subject: S("RELIGIONE", "RELIGIONE", "REL", "Ritrovato M.G.", "P2-03"), hours: 1 },
      { subject: S("SC_MOT_SPORT", "SC. MOT. SPORT", "MOT", "Gentile A.", "Palestra 1"), hours: 1 },
      { subject: S("STORIA", "STORIA", "STO", "Ferosi G.", "P2-01"), hours: 1 },
      { subject: S("SISTEMI_RETI", "SISTEMI E RETI", "S&R", "Chiumento G.", "P2-01"), hours: 2 },
    ],
  },
  // 5h → 13:05
  Friday: {
    key: "Friday",
    label: "Venerdì",
    short: "VEN",
    entries: [
      { subject: S("LAB_INFORM", "LAB. INFORM.", "INF", "Tamburrano P. · Martella M.", "Lab. Tec. Inf.", true), hours: 2 },
      { subject: S("MATEMATICA", "MATEMATICA", "MAT", "D'Addona R.A.", "P2-03"), hours: 1 },
      { subject: S("ITALIANO", "ITALIANO", "ITA", "Ferosi G.", "P2-03"), hours: 1 },
      { subject: S("INGLESE", "INGLESE", "ING", "Nardella T.", "P2-03"), hours: 1 },
    ],
  },
  // 5h → 13:05
  Saturday: {
    key: "Saturday",
    label: "Sabato",
    short: "SAB",
    entries: [
      { subject: S("ITALIANO", "ITALIANO", "ITA", "Ferosi G.", "P2-01"), hours: 1 },
      { subject: S("INFORMATICA", "INFORMATICA", "INF", "Tamburrano P.", "P2-01"), hours: 2 },
      { subject: S("INGLESE", "INGLESE", "ING", "Nardella T.", "P2-01"), hours: 1 },
      { subject: S("TLC", "TLC", "TLC", "Pompilio G.", "P2-01"), hours: 1 },
    ],
  },
};

export const DAY_ORDER: DayKey[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// ===================================================================
// Italian school holidays for 26/27 season (used for countdowns)
// ===================================================================
export interface Holiday {
  name: string;
  emoji: string;
  start: string; // ISO date (YYYY-MM-DD)
  end: string;
}

export const HOLIDAYS_26_27: Holiday[] = [
  { name: "Vacanze di Natale", emoji: "🎄", start: "2026-12-23", end: "2027-01-07" },
  { name: "Vacanze di Carnevale", emoji: "🎭", start: "2027-02-08", end: "2027-02-12" },
  { name: "Vacanze di Pasqua", emoji: "🐣", start: "2027-04-01", end: "2027-04-13" },
  { name: "Festa della Liberazione", emoji: "🇮🇹", start: "2027-04-25", end: "2027-04-25" },
  { name: "Festa dei Lavoratori", emoji: "🌷", start: "2027-05-01", end: "2027-05-01" },
  { name: "Vacanze Estive", emoji: "🏖️", start: "2027-06-08", end: "2027-09-08" },
];

// ===================================================================
// Time helpers (work on entries, not fixed slots)
// ===================================================================

/** Parse "HH:MM" → minutes since midnight. */
export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** Build a Date for the start of a given slot index on `base`. */
export function slotStartDate(base: Date, slotIndex: number): Date {
  const d = new Date(base);
  const [h, m] = SLOT_START[slotIndex].split(":").map(Number);
  d.setHours(h, m, 0, 0);
  return d;
}

export function slotEndDate(base: Date, slotIndex: number): Date {
  const d = new Date(base);
  const [h, m] = SLOT_END[slotIndex].split(":").map(Number);
  d.setHours(h, m, 0, 0);
  return d;
}

/** Resolved entry: an entry placed on the day grid with concrete start/end slots. */
export interface ResolvedEntry {
  entry: ScheduleEntry;
  subject: SubjectInfo;
  startSlot: number; // first slot index
  endSlot: number; // last slot index (inclusive)
  start: Date; // absolute start (on `base` day)
  end: Date; // absolute end (on `base` day)
  /** 1-based ordinal among class entries (1st class of the day, 2nd, ...). */
  ordinal: number;
}

/** Lay out a day's entries on concrete time slots starting at 08:05. */
export function resolveDay(day: DaySchedule, base: Date): ResolvedEntry[] {
  const out: ResolvedEntry[] = [];
  let cursor = 0; // next free slot
  let ordinal = 0;
  for (const entry of day.entries) {
    const startSlot = cursor;
    const endSlot = cursor + entry.hours - 1;
    ordinal += 1;
    out.push({
      entry,
      subject: entry.subject,
      startSlot,
      endSlot,
      start: slotStartDate(base, startSlot),
      end: slotEndDate(base, endSlot),
      ordinal,
    });
    cursor = endSlot + 1;
  }
  return out;
}

/** Total hours in a day (sum of entry.hours). */
export function dayHours(day: DaySchedule): number {
  return day.entries.reduce((a, e) => a + e.hours, 0);
}

/** End-time label ("13:05" or "14:05") for a day. */
export function dayEndLabel(day: DaySchedule): string {
  const h = dayHours(day);
  return SLOT_END[h - 1]; // 5h → SLOT_END[4]=13:05, 6h → SLOT_END[5]=14:05
}

/** End Date for the day (end of last entry). */
export function dayEndDate(day: DaySchedule, base: Date): Date | null {
  if (day.entries.length === 0) return null;
  const lastEndSlot = dayHours(day) - 1;
  return slotEndDate(base, lastEndSlot);
}

export interface CurrentState {
  /** The entry currently in progress, or null if none. */
  active: ResolvedEntry | null;
  /** The next upcoming entry today (start strictly after now), or null. */
  next: ResolvedEntry | null;
  /** All resolved entries (for rendering & stats). */
  entries: ResolvedEntry[];
  /** Effective end-of-school Date (end of last entry). */
  effectiveEnd: Date | null;
  /** Whether school is over for today. */
  isOver: boolean;
  /** Whether school has not started yet today. */
  isBefore: boolean;
  /** Whether we are currently in a gap between two entries (not over, not before, no active). */
  inGap: boolean;
}

/** Get the live state for a given day given "now". */
export function getCurrentState(day: DaySchedule, now: Date): CurrentState {
  const entries = resolveDay(day, now);
  const nowMs = now.getTime();

  let active: ResolvedEntry | null = null;
  let next: ResolvedEntry | null = null;

  for (const e of entries) {
    if (nowMs >= e.start.getTime() && nowMs < e.end.getTime()) {
      active = e;
    } else if (nowMs < e.start.getTime() && !next) {
      next = e;
    }
  }

  const effectiveEnd = entries.length
    ? entries[entries.length - 1].end
    : null;
  const isOver = effectiveEnd ? nowMs >= effectiveEnd.getTime() : false;
  const dayStart = entries.length ? entries[0].start : slotStartDate(now, 0);
  const isBefore = nowMs < dayStart.getTime();
  const inGap = !active && !isBefore && !isOver && !!next;

  return { active, next, entries, effectiveEnd, isOver, isBefore, inGap };
}

/** Map a JS Day (0=Sun..6=Sat) to a DayKey, or null for Sunday. */
export function jsDayToDayKey(jsDay: number): DayKey | null {
  const map: (DayKey | null)[] = [
    null,
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return map[jsDay];
}

/** Countdown formatting: mm:ss or hh:mm:ss. */
export function formatCountdown(ms: number): string {
  if (ms < 0) ms = 0;
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

/** Next upcoming holiday from "now". Returns null if none. */
export function nextHoliday(now: Date): Holiday | null {
  const today = now.toISOString().slice(0, 10);
  const upcoming = HOLIDAYS_26_27.filter((h) => h.end >= today);
  return upcoming.length > 0 ? upcoming[0] : null;
}

/** Days until a holiday starts (ceil, min 0). */
export function daysUntil(startISO: string, now: Date): number {
  const start = new Date(startISO + "T00:00:00");
  const diff = start.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
