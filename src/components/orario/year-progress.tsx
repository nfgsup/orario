"use client";

import * as React from "react";
import { CalendarRange } from "lucide-react";

// Anno scolastico 26/27: 14 set 2026 → 8 giu 2027 (approssimativo)
const YEAR_START = new Date("2026-09-14T00:00:00");
const YEAR_END = new Date("2027-06-08T00:00:00");

export function YearProgress({ now }: { now: Date }) {
  const total = YEAR_END.getTime() - YEAR_START.getTime();
  const elapsed = Math.max(0, now.getTime() - YEAR_START.getTime());
  const pct = Math.max(0, Math.min(100, (elapsed / total) * 100));
  const daysLeft = Math.max(
    0,
    Math.ceil((YEAR_END.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
  );
  const isBefore = now.getTime() < YEAR_START.getTime();
  const isAfter = now.getTime() > YEAR_END.getTime();

  let label = `${pct.toFixed(0)}% completato`;
  if (isBefore) {
    const d = Math.ceil(
      (YEAR_START.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    label = `Inizia tra ${d} giorni`;
  } else if (isAfter) {
    label = "Anno concluso";
  }

  return (
    <section className="rounded-3xl border border-border/60 bg-card/60 backdrop-blur-md p-5 sm:p-6 shadow-lg shadow-black/5 animate-rise">
      <div className="flex items-center gap-3 mb-3">
        <div className="grid place-items-center w-9 h-9 rounded-xl bg-primary/15 text-primary shrink-0">
          <CalendarRange className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold leading-tight">
            Anno scolastico 26/27
          </h2>
          <p className="text-xs text-muted-foreground">
            {formatDate(YEAR_START)} → {formatDate(YEAR_END)}
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-2xl font-extrabold tnum bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
            {isBefore ? "—" : isAfter ? "100" : pct.toFixed(0)}
            {!isBefore && !isAfter && <span className="text-sm">%</span>}
          </div>
          {!isAfter && !isBefore && (
            <div className="text-[10px] text-muted-foreground">
              {daysLeft} giorni rimasti
            </div>
          )}
        </div>
      </div>
      <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary via-chart-2 to-primary transition-[width] duration-1000 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[11px] text-muted-foreground mt-1.5">{label}</p>
    </section>
  );
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
