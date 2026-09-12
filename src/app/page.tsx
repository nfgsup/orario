"use client";

import * as React from "react";
import {
  GraduationCap,
  Clock,
  Sun,
  Moon,
  Share2,
  PartyPopper,
  CalendarDays,
  Forward,
  School,
  Sparkles,
  Hourglass,
  MapPin,
  User,
  Bell,
  CheckCircle2,
  CalendarDaysIcon,
  LayoutGrid,
  Users,
  Home as HomeIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  SCHEDULE,
  DAY_ORDER,
  SUBJECT_META,
  SLOT_START,
  SLOT_END,
  resolveDay,
  getCurrentState,
  jsDayToDayKey,
  formatCountdown,
  nextHoliday,
  daysUntil,
  dayHours,
  dayEndLabel,
  type DayKey,
  type DaySchedule,
  type ResolvedEntry,
  type CurrentState,
} from "@/lib/schedule";
import { SubjectIcon } from "@/components/orario/icons";
import { NotesCard } from "@/components/orario/notes-card";
import { WeeklyGrid } from "@/components/orario/weekly-grid";
import { TeachersDirectory } from "@/components/orario/teachers-directory";
import { SettingsSheet } from "@/components/orario/settings-sheet";
import { NotificationsManager } from "@/components/orario/notifications-manager";
import { YearProgress } from "@/components/orario/year-progress";
import { useTheme } from "next-themes";
import { useSettings } from "@/components/orario/use-settings";

type View = "today" | "week" | "teachers";

// ----------------------------------------------------------------
// Page
// ----------------------------------------------------------------
export default function Home() {
  const [mounted, setMounted] = React.useState(false);
  const [now, setNow] = React.useState<Date>(() => new Date());
  const [selectedDay, setSelectedDay] = React.useState<DayKey | null>(null);
  const [view, setView] = React.useState<View>("today");

  React.useEffect(() => setMounted(true), []);
  React.useEffect(() => {
    if (!mounted) return;
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, [mounted]);

  // Leggi view da URL query (shortcut PWA)
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get("view");
    if (v === "week" || v === "teachers" || v === "today") setView(v);
  }, []);

  const todayKey: DayKey | null = mounted
    ? jsDayToDayKey(now.getDay())
    : null;
  const displayDayKey: DayKey | null = selectedDay ?? todayKey;
  const isToday =
    mounted && displayDayKey !== null && todayKey === displayDayKey;
  const day: DaySchedule | null = displayDayKey
    ? SCHEDULE[displayDayKey]
    : null;
  const liveState: CurrentState | null =
    day && isToday ? getCurrentState(day, now) : null;

  return (
    <div className="min-h-dvh flex flex-col pb-16 sm:pb-0">
      <NotificationsManager now={now} />
      <Header
        mounted={mounted}
        now={now}
        selectedDay={selectedDay}
        onSelectDay={setSelectedDay}
        todayKey={todayKey}
        view={view}
      />
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-5 py-6 sm:py-8 space-y-5">
        {view === "today" && (
          <TodayView
            day={day}
            isToday={isToday}
            liveState={liveState}
            now={now}
            mounted={mounted}
          />
        )}
        {view === "week" && (
          <>
            <div className="flex items-center gap-2 mb-1">
              <LayoutGrid className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold tracking-tight">
                Settimana
              </h2>
            </div>
            <WeeklyGrid now={now} />
            <YearProgress now={now} />
          </>
        )}
        {view === "teachers" && (
          <>
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold tracking-tight">Docenti</h2>
            </div>
            <TeachersDirectory now={now} />
          </>
        )}
      </main>
      <Footer mounted={mounted} now={now} />
      <BottomNav view={view} onChange={setView} />
    </div>
  );
}

// ----------------------------------------------------------------
// Today view (Hero + Timeline + Stats + Vacation + Notes)
// ----------------------------------------------------------------
function TodayView({
  day,
  isToday,
  liveState,
  now,
  mounted,
}: {
  day: DaySchedule | null;
  isToday: boolean;
  liveState: CurrentState | null;
  now: Date;
  mounted: boolean;
}) {
  return (
    <>
      <Hero
        day={day}
        isToday={isToday}
        liveState={liveState}
        now={now}
        mounted={mounted}
      />
      <Timeline
        day={day}
        isToday={isToday}
        liveState={liveState}
        now={now}
        mounted={mounted}
      />
      <StatsGrid
        day={day}
        isToday={isToday}
        liveState={liveState}
        now={now}
        mounted={mounted}
      />
      <VacationCard mounted={mounted} now={now} />
      <YearProgress now={now} />
      <NotesCard />
    </>
  );
}

// ----------------------------------------------------------------
// Header
// ----------------------------------------------------------------
function Header({
  mounted,
  now,
  selectedDay,
  onSelectDay,
  todayKey,
  view,
}: {
  mounted: boolean;
  now: Date;
  selectedDay: DayKey | null;
  onSelectDay: (d: DayKey | null) => void;
  todayKey: DayKey | null;
  view: View;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const { settings } = useSettings();
  const [themeReady, setThemeReady] = React.useState(false);
  React.useEffect(() => setThemeReady(true), []);

  const displayDayKey: DayKey | null = selectedDay ?? todayKey;
  const day = displayDayKey ? SCHEDULE[displayDayKey] : null;

  // day progress 0..100 (only meaningful for today)
  let dayProgress = 0;
  if (mounted && day && todayKey === displayDayKey) {
    const st = getCurrentState(day, now);
    if (st.effectiveEnd) {
      const startMs = new Date(now).setHours(8, 5, 0, 0);
      const endMs = st.effectiveEnd.getTime();
      const total = endMs - startMs;
      const elapsed = now.getTime() - startMs;
      dayProgress = total > 0 ? Math.max(0, Math.min(100, (elapsed / total) * 100)) : 0;
    } else if (st.isOver) dayProgress = 100;
  }

  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = "Orario classe 3Ai — stagione 26/27";
    try {
      if (navigator.share) {
        await navigator.share({ title: "Orario 3Ai", text, url });
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
      }
    } catch {
      /* user dismissed */
    }
  }

  // Show day tabs only in "today" view
  const showDayTabs = view === "today";

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-5 pt-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="grid place-items-center w-9 h-9 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="font-extrabold text-base sm:text-lg leading-tight tracking-tight truncate">
                Orario 3Ai
              </h1>
              <p className="text-[11px] text-muted-foreground leading-tight flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
                Stagione 2026 / 2027
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 h-9 rounded-xl bg-muted/60 text-muted-foreground tnum text-sm">
              <Clock className="w-3.5 h-3.5" />
              {mounted ? formatClock(now, settings.hour24) : "--:--"}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl"
              onClick={share}
              aria-label="Condividi"
            >
              <Share2 className="w-4 h-4" />
            </Button>
            <SettingsSheet />
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl"
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
              aria-label="Cambia tema"
            >
              {themeReady ? (
                resolvedTheme === "dark" ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )
              ) : (
                <Sun className="w-4 h-4 opacity-0" />
              )}
            </Button>
          </div>
        </div>

        {showDayTabs && (
          <div className="mt-3 -mx-1 flex items-center gap-1.5 overflow-x-auto fancy-scroll pb-2 pt-0.5 px-1">
            <DayPill
              active={selectedDay === null}
              onClick={() => onSelectDay(null)}
              label="Oggi"
              sub={todayKey ? SCHEDULE[todayKey].short : undefined}
            />
            {DAY_ORDER.map((k) => (
              <DayPill
                key={k}
                active={selectedDay === k}
                onClick={() => onSelectDay(k)}
                label={SCHEDULE[k].label}
                sub={SCHEDULE[k].short}
                isToday={todayKey === k}
                endLabel={dayEndLabel(SCHEDULE[k])}
              />
            ))}
          </div>
        )}

        {showDayTabs && (
          <div className="h-1 w-full rounded-full bg-muted/50 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-chart-2 transition-[width] duration-1000 ease-linear"
              style={{ width: `${dayProgress}%` }}
            />
          </div>
        )}
      </div>
    </header>
  );
}

function DayPill({
  active,
  onClick,
  label,
  sub,
  isToday,
  endLabel,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  sub?: string;
  isToday?: boolean;
  endLabel?: string;
}) {
  const isLong = endLabel === "14:05";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-sm font-medium border transition-all",
        active
          ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/25"
          : "bg-transparent text-muted-foreground border-border/70 hover:bg-muted/60 hover:text-foreground",
      )}
    >
      {isToday && !active && (
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-soft" />
      )}
      <span>{label}</span>
      <span
        className={cn(
          "text-[10px] uppercase tracking-wide opacity-70",
          active && "opacity-80",
        )}
      >
        {sub}
      </span>
      {isLong && (
        <span
          className={cn(
            "ml-0.5 inline-flex items-center text-[9px] font-bold px-1 py-0.5 rounded",
            active
              ? "bg-primary-foreground/20 text-primary-foreground"
              : "bg-amber-500/15 text-amber-600 dark:text-amber-300",
          )}
          title="Esci alle 14:05"
        >
          2pm
        </span>
      )}
    </button>
  );
}

// ----------------------------------------------------------------
// Hero
// ----------------------------------------------------------------
function Hero({
  day,
  isToday,
  liveState,
  now,
  mounted,
}: {
  day: DaySchedule | null;
  isToday: boolean;
  liveState: CurrentState | null;
  now: Date;
  mounted: boolean;
}) {
  if (!day) {
    return <HeroShell>{null}</HeroShell>;
  }

  const totalH = dayHours(day);
  const endLbl = dayEndLabel(day);

  // --- PREVIEW ---
  if (!isToday || !liveState) {
    const first = day.entries[0];
    return (
      <HeroShell>
        <div className="text-center py-2">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/60 rounded-full px-2.5 py-1 mb-4">
            <Sparkles className="w-3 h-3" /> Anteprima
          </div>
          <p className="text-sm text-muted-foreground mb-1 flex items-center justify-center gap-2 flex-wrap">
            <span>{day.label}</span>
            <span className="opacity-40">·</span>
            <span className="tnum">{totalH} ore</span>
            <span className="opacity-40">·</span>
            <span className="inline-flex items-center gap-1 tnum">
              <Clock className="w-3 h-3" /> fino alle {endLbl}
            </span>
          </p>
          <h2 className="text-2xl font-extrabold tracking-tight">
            {first ? first.subject.name : "Riposo"}
          </h2>
          {first && (
            <>
              <p className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1.5">
                <User className="w-3.5 h-3.5" /> {first.subject.teacher}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5 flex items-center justify-center gap-1.5 flex-wrap">
                <MapPin className="w-3.5 h-3.5" /> {first.subject.room}
                <span className="opacity-50">·</span>
                <Clock className="w-3.5 h-3.5" /> {SLOT_START[0]}–{SLOT_END[first.hours - 1]}
                {first.hours === 2 && (
                  <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/15 text-primary">
                    2h
                  </span>
                )}
              </p>
            </>
          )}
        </div>
      </HeroShell>
    );
  }

  const st = liveState;

  // After school
  if (st.isOver) {
    return (
      <HeroShell>
        <div className="text-center py-2">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 rounded-full px-2.5 py-1 mb-4">
            <CheckCircle2 className="w-3 h-3" /> Lezioni terminate
          </div>
          <div className="grid place-items-center mb-3">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 grid place-items-center text-emerald-600 dark:text-emerald-300">
              <PartyPopper className="w-8 h-8" />
            </div>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">
            Hai finito per oggi! 🎉
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Uscita alle {endLbl}. Ci vediamo domani.
          </p>
          <TomorrowPreview now={now} />
        </div>
      </HeroShell>
    );
  }

  // Before school
  if (st.isBefore) {
    const next = st.next;
    return (
      <HeroShell>
        <div className="text-center py-2">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary bg-primary/10 rounded-full px-2.5 py-1 mb-4">
            <Hourglass className="w-3 h-3" /> Prima delle lezioni
          </div>
          {next ? (
            <>
              <p className="text-sm text-muted-foreground mb-1">
                La scuola inizia tra
              </p>
              <CountdownBig
                mounted={mounted}
                value={formatCountdown(next.start.getTime() - now.getTime())}
              />
              <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-border/60 bg-muted/40 px-3 py-2 flex-wrap">
                <SubjectBadgeSmall subject={next.subject} />
                <span className="text-sm font-medium">
                  {next.subject.name}
                </span>
                {next.entry.hours === 2 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/15 text-primary">
                    2h
                  </span>
                )}
                <span className="text-xs text-muted-foreground tnum">
                  {SLOT_START[next.startSlot]}
                </span>
              </div>
            </>
          ) : (
            <h2 className="text-2xl font-extrabold">Buongiorno!</h2>
          )}
        </div>
      </HeroShell>
    );
  }

  // Active class
  if (st.active) {
    const e = st.active;
    const p = e.subject;
    const meta = SUBJECT_META[p.key];
    const total = e.end.getTime() - e.start.getTime();
    const elapsed = now.getTime() - e.start.getTime();
    const pct = Math.max(0, Math.min(100, (elapsed / total) * 100));
    const remaining = e.end.getTime() - now.getTime();

    return (
      <HeroShell accent>
        <div className="text-center py-1">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 rounded-full px-2.5 py-1 mb-3 animate-pulse-soft">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-soft" />
            In classe ora · {e.ordinal}ª ora
          </div>
          <div className="grid place-items-center mb-3">
            <div
              className={cn(
                "w-16 h-16 rounded-2xl grid place-items-center border",
                meta.bg,
                meta.border,
                meta.text,
              )}
            >
              <SubjectIcon name={meta.icon} className="w-8 h-8" />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {p.name}
          </h2>
          <p className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1">
              <User className="w-3.5 h-3.5" /> {p.teacher}
            </span>
            <span className="opacity-40">·</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {p.room}
            </span>
          </p>
          <p className="text-xs text-muted-foreground mt-1 tnum flex items-center justify-center gap-1.5">
            <Clock className="w-3 h-3" />
            {SLOT_START[e.startSlot]} – {SLOT_END[e.endSlot]}
            {e.entry.hours === 2 && (
              <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/15 text-primary">
                2h consec.
              </span>
            )}
          </p>

          <div className="mt-5">
            <CountdownBig mounted={mounted} value={formatCountdown(remaining)} />
            <div className="text-[11px] text-muted-foreground mt-1">
              alla fine dell&apos;ora{e.entry.hours === 2 ? " (doppia)" : ""}
            </div>
          </div>

          <div className="mt-4">
            <Progress value={pct} className="h-2" />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1 tnum">
              <span>{SLOT_START[e.startSlot]}</span>
              <span>{Math.round(pct)}%</span>
              <span>{SLOT_END[e.endSlot]}</span>
            </div>
          </div>
        </div>

        {st.next && <HeroNextPeek entry={st.next} />}
      </HeroShell>
    );
  }

  // In a gap (shouldn't happen, no holes)
  if (st.next) {
    const next = st.next;
    return (
      <HeroShell>
        <div className="text-center py-1">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-500/15 rounded-full px-2.5 py-1 mb-3">
            <Hourglass className="w-3 h-3" /> In pausa
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">Prossima lezione</h2>
          <p className="text-sm text-muted-foreground mt-1">tra</p>
          <div className="mt-2">
            <CountdownBig
              mounted={mounted}
              value={formatCountdown(next.start.getTime() - now.getTime())}
            />
          </div>
          <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-border/60 bg-muted/40 px-3 py-2 flex-wrap">
            <SubjectBadgeSmall subject={next.subject} />
            <span className="text-sm font-medium">{next.subject.name}</span>
            {next.entry.hours === 2 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/15 text-primary">
                2h
              </span>
            )}
            <span className="text-xs text-muted-foreground tnum">
              {SLOT_START[next.startSlot]}
            </span>
          </div>
        </div>
      </HeroShell>
    );
  }

  return (
    <HeroShell>
      <div className="text-center py-4">
        <h2 className="text-2xl font-extrabold">Niente lezioni</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Oggi non ci sono altre materie.
        </p>
      </div>
    </HeroShell>
  );
}

function HeroShell({
  children,
  accent,
}: {
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-3xl border bg-card/60 backdrop-blur-md shadow-xl shadow-black/5 animate-rise",
        accent ? "border-primary/30" : "border-border/60",
      )}
    >
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-1 bg-gradient-to-r",
          accent
            ? "from-primary via-chart-2 to-primary"
            : "from-primary/40 via-chart-2/40 to-primary/40",
        )}
      />
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function HeroNextPeek({ entry }: { entry: ResolvedEntry }) {
  const meta = SUBJECT_META[entry.subject.key];
  return (
    <div className="mt-5 pt-4 border-t border-border/60 flex items-center gap-2 text-sm">
      <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider text-muted-foreground">
        <Forward className="w-3.5 h-3.5" /> Prossima
      </span>
      <div className="flex-1 flex items-center gap-2 justify-end flex-wrap">
        <span
          className={cn(
            "inline-flex items-center justify-center w-7 h-7 rounded-lg border",
            meta.bg,
            meta.border,
            meta.text,
          )}
        >
          <SubjectIcon name={meta.icon} className="w-4 h-4" />
        </span>
        <span className="font-medium">{entry.subject.name}</span>
        {entry.entry.hours === 2 && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/15 text-primary">
            2h
          </span>
        )}
        <span className="text-xs text-muted-foreground tnum">
          {SLOT_START[entry.startSlot]}
        </span>
      </div>
    </div>
  );
}

function CountdownBig({ value, mounted }: { value: string; mounted: boolean }) {
  return (
    <div className="text-5xl sm:text-6xl font-extrabold tnum tracking-tight bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
      {mounted ? value : "--:--"}
    </div>
  );
}

function SubjectBadgeSmall({ subject }: { subject: { key: keyof typeof SUBJECT_META } }) {
  const meta = SUBJECT_META[subject.key];
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center w-7 h-7 rounded-lg border",
        meta.bg,
        meta.border,
        meta.text,
      )}
    >
      <SubjectIcon name={meta.icon} className="w-4 h-4" />
    </span>
  );
}

function TomorrowPreview({ now }: { now: Date }) {
  let d = new Date(now);
  for (let i = 0; i < 7; i++) {
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    const k = jsDayToDayKey(d.getDay());
    if (k) {
      const day = SCHEDULE[k];
      if (day.entries.length > 0) {
        const first = day.entries[0];
        const totalH = dayHours(day);
        return (
          <div className="mt-5 pt-4 border-t border-border/60 flex items-center gap-2 text-sm flex-wrap">
            <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider text-muted-foreground">
              <CalendarDays className="w-3.5 h-3.5" /> {day.label}
            </span>
            <div className="flex-1 flex items-center gap-2 justify-end flex-wrap">
              <SubjectBadgeSmall subject={first.subject} />
              <span className="font-medium">{first.subject.name}</span>
              {first.hours === 2 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/15 text-primary">
                  2h
                </span>
              )}
              <span className="text-xs text-muted-foreground tnum">
                {SLOT_START[0]}
              </span>
              <span className="text-[10px] text-muted-foreground">
                · {totalH}h → {dayEndLabel(day)}
              </span>
            </div>
          </div>
        );
      }
    }
  }
  return null;
}

// ----------------------------------------------------------------
// Timeline
// ----------------------------------------------------------------
function Timeline({
  day,
  isToday,
  liveState,
  now,
  mounted,
}: {
  day: DaySchedule | null;
  isToday: boolean;
  liveState: CurrentState | null;
  now: Date;
  mounted: boolean;
}) {
  if (!day) return null;
  const activeEntry = liveState?.active ?? null;
  const resolved = resolveDay(day, now);
  const totalH = dayHours(day);
  const endLbl = dayEndLabel(day);

  return (
    <section className="rounded-3xl border bg-card/60 backdrop-blur-md p-5 sm:p-6 shadow-lg shadow-black/5 animate-rise">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="grid place-items-center w-9 h-9 rounded-xl bg-primary/15 text-primary">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold leading-tight">
              Programma {isToday ? "di oggi" : `di ${day.label}`}
            </h2>
            <p className="text-xs text-muted-foreground tnum">
              {day.entries.length} materie · {totalH} ore · fino alle {endLbl}
            </p>
          </div>
        </div>
      </header>

      <ol className="relative space-y-2">
        {resolved.map((e) => {
          const isActive = isToday && mounted && activeEntry?.startSlot === e.startSlot;
          const isPast = mounted && isToday && now.getTime() >= e.end.getTime();
          return (
            <TimelineRow
              key={e.startSlot}
              entry={e}
              isActive={!!isActive}
              isPast={isPast}
            />
          );
        })}
      </ol>
    </section>
  );
}

function TimelineRow({
  entry,
  isActive,
  isPast,
}: {
  entry: ResolvedEntry;
  isActive: boolean;
  isPast: boolean;
}) {
  const p = entry.subject;
  const meta = SUBJECT_META[p.key];
  const isDouble = entry.entry.hours === 2;

  return (
    <li
      className={cn(
        "flex items-stretch gap-3 rounded-2xl transition-colors",
        isActive && "bg-primary/8 ring-1 ring-primary/25",
      )}
    >
      <div className="flex flex-col items-center w-14 shrink-0">
        <span
          className={cn(
            "text-[11px] tnum pt-1.5 font-medium leading-tight",
            isActive ? "text-primary" : "text-muted-foreground",
          )}
        >
          {SLOT_START[entry.startSlot]}
        </span>
        {isDouble && (
          <span className="text-[9px] tnum text-muted-foreground/60 leading-tight">
            ↓{SLOT_START[entry.endSlot]}
          </span>
        )}
        <div className="flex-1 flex items-center justify-center py-1">
          <span
            className={cn(
              "w-3 h-3 rounded-full border-2 transition-all",
              isActive
                ? "bg-primary border-primary ring-4 ring-primary/15"
                : isPast
                  ? "bg-muted border-muted-foreground/40"
                  : cn(meta.bg, meta.border),
              isDouble && "w-3.5 h-3.5",
            )}
          />
        </div>
      </div>

      <div
        className={cn(
          "flex-1 flex items-center gap-3 py-2 pr-2 min-w-0 rounded-xl",
          isActive && "px-2",
          isPast && "opacity-45",
        )}
      >
        <span
          className={cn(
            "inline-flex items-center justify-center w-10 h-10 rounded-xl border shrink-0",
            meta.bg,
            meta.border,
            meta.text,
          )}
        >
          <SubjectIcon name={meta.icon} className="w-5 h-5" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold truncate">{p.name}</span>
            {p.isLab && (
              <span className="text-[9px] uppercase tracking-wider px-1 py-0.5 rounded bg-muted text-muted-foreground">
                Lab
              </span>
            )}
            {isDouble && (
              <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/15 text-primary font-bold">
                2h
              </span>
            )}
            {isActive && (
              <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 animate-pulse-soft">
                Ora
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5 truncate flex-wrap">
            <span className="inline-flex items-center gap-1 truncate">
              <User className="w-3 h-3 shrink-0" />
              <span className="truncate">{p.teacher}</span>
            </span>
            <span className="opacity-40">·</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3 shrink-0" />
              {p.room}
            </span>
          </div>
        </div>
        <div className="text-[11px] text-muted-foreground tnum shrink-0 text-right">
          {SLOT_END[entry.endSlot]}
        </div>
      </div>
    </li>
  );
}

// ----------------------------------------------------------------
// Stats grid
// ----------------------------------------------------------------
function StatsGrid({
  day,
  isToday,
  liveState,
  now,
  mounted,
}: {
  day: DaySchedule | null;
  isToday: boolean;
  liveState: CurrentState | null;
  now: Date;
  mounted: boolean;
}) {
  if (!day) return null;
  const totalH = dayHours(day);
  const totalClasses = day.entries.length;
  const endLbl = dayEndLabel(day);

  let doneH = 0;
  let currentOrdinal = 0;
  if (mounted && isToday && liveState) {
    for (const e of liveState.entries) {
      if (now.getTime() >= e.end.getTime()) doneH += e.entry.hours;
    }
    if (liveState.active) currentOrdinal = liveState.active.ordinal;
  }
  const leftH = Math.max(
    0,
    totalH - doneH - (liveState?.active ? liveState.active.entry.hours : 0),
  );

  return (
    <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-rise">
      <StatTile
        label="Ore totali"
        value={String(totalH)}
        sub={`· ${totalClasses} mat.`}
        icon={<School className="w-4 h-4" />}
      />
      <StatTile
        label="Ora corrente"
        value={
          mounted && isToday && liveState?.active
            ? `${currentOrdinal}ª`
            : "—"
        }
        sub={`di ${totalClasses}`}
        icon={<Bell className="w-4 h-4" />}
        accent
      />
      <StatTile
        label="Fatte"
        value={mounted && isToday ? String(doneH) : "—"}
        sub="ore"
        icon={<CheckCircle2 className="w-4 h-4" />}
      />
      <StatTile
        label="Rimaste"
        value={mounted && isToday ? String(leftH) : "—"}
        sub={`ore · esci ${endLbl}`}
        icon={<Hourglass className="w-4 h-4" />}
      />
    </section>
  );
}

function StatTile({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-card/60 backdrop-blur-md p-3.5 shadow-sm",
        accent ? "border-primary/30 bg-primary/5" : "border-border/60",
      )}
    >
      <div
        className={cn(
          "inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider mb-1.5",
          accent ? "text-primary" : "text-muted-foreground",
        )}
      >
        {icon}
        {label}
      </div>
      <div className="flex items-baseline gap-1 flex-wrap">
        <span className="text-2xl font-extrabold tnum">{value}</span>
        <span className="text-[11px] text-muted-foreground">{sub}</span>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------
// Vacation countdown
// ----------------------------------------------------------------
function VacationCard({ mounted, now }: { mounted: boolean; now: Date }) {
  const h = nextHoliday(now);
  if (!h) return null;
  const days = daysUntil(h.start, now);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-chart-2/10 to-primary/5 p-5 sm:p-6 shadow-lg shadow-black/5 animate-rise">
      <div className="flex items-center gap-4">
        <div className="grid place-items-center w-14 h-14 rounded-2xl bg-background/60 text-3xl shrink-0">
          {h.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Prossima vacanza
          </div>
          <div className="font-semibold truncate">{h.name}</div>
          <div className="text-xs text-muted-foreground">
            dal {formatDate(h.start)}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-3xl font-extrabold tnum bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
            {mounted ? days : "—"}
          </div>
          <div className="text-[11px] text-muted-foreground">giorni</div>
        </div>
      </div>
    </section>
  );
}

// ----------------------------------------------------------------
// Footer
// ----------------------------------------------------------------
function Footer({ mounted, now }: { mounted: boolean; now: Date }) {
  const { settings } = useSettings();
  return (
    <footer className="hidden sm:block mt-auto border-t border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-5 py-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 tnum">
          <Clock className="w-3.5 h-3.5" />
          {mounted ? formatClockFull(now, settings.hour24) : "--:--:--"}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
          3Ai · 26/27 · PWA
        </div>
      </div>
    </footer>
  );
}

// ----------------------------------------------------------------
// Bottom Navigation (mobile)
// ----------------------------------------------------------------
function BottomNav({
  view,
  onChange,
}: {
  view: View;
  onChange: (v: View) => void;
}) {
  const items: { key: View; label: string; icon: React.ReactNode }[] = [
    { key: "today", label: "Oggi", icon: <HomeIcon className="w-5 h-5" /> },
    { key: "week", label: "Settimana", icon: <LayoutGrid className="w-5 h-5" /> },
    { key: "teachers", label: "Docenti", icon: <Users className="w-5 h-5" /> },
  ];
  return (
    <nav
      className="sm:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border/60 bg-background/90 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-3 h-14">
        {items.map((it) => {
          const active = view === it.key;
          return (
            <button
              key={it.key}
              onClick={() => onChange(it.key)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              <span className={cn(active && "scale-110 transition-transform")}>
                {it.icon}
              </span>
              {it.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ----------------------------------------------------------------
// format helpers
// ----------------------------------------------------------------
function formatClock(d: Date, hour24: boolean): string {
  return d.toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: !hour24,
  });
}
function formatClockFull(d: Date, hour24: boolean): string {
  return d.toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: !hour24,
  });
}
function formatDate(iso: string): string {
  try {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "short",
    });
  } catch {
    return iso;
  }
}
