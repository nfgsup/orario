"use client";

/**
 * NotificationsManager:
 *  - Chiede il permesso per le notifiche browser (solo se abilitato nelle settings).
 *  - Quando cambia la materia "in corso" (inizio di una nuova entry), suona la campanella
 *    + mostra una notifica "Inizia: <materia> — <aula> (<docente>)".
 *  - Quando mancano 5 minuti alla fine dell'ora corrente, notifica "5 min alla fine di <materia>".
 *  - Tutto in background, client-only. Nessun render visibile.
 */

import * as React from "react";
import { useSettings } from "./use-settings";
import {
  SCHEDULE,
  SUBJECT_META,
  SLOT_START,
  SLOT_END,
  resolveDay,
  jsDayToDayKey,
} from "@/lib/schedule";

// Campanella synth (Web Audio) — niente asset esterni, funziona offline.
function playBell() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    // Due rintocchi (800 Hz poi 1000 Hz)
    const ring = (freq: number, start: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(0.25, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + dur);
    };
    ring(880, 0, 0.5);
    ring(1175, 0.35, 0.6);
    setTimeout(() => ctx.close().catch(() => {}), 1500);
  } catch {
    /* ignore */
  }
}

export function NotificationsManager({
  now,
}: {
  now: Date;
}) {
  const { settings, loaded } = useSettings();

  // Track della materia attiva e dell'ultimo avviso "5 min"
  const activeRef = React.useRef<string | null>(null);
  const warned5minRef = React.useRef<string | null>(null);

  // Request permission when notifications enabled
  React.useEffect(() => {
    if (!loaded) return;
    if (
      settings.notifications &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission().catch(() => {});
    }
  }, [settings.notifications, loaded]);

  React.useEffect(() => {
    if (!loaded) return;
    const dayKey = jsDayToDayKey(now.getDay());
    if (!dayKey) return;
    const day = SCHEDULE[dayKey];
    const entries = resolveDay(day, now);
    const nowMs = now.getTime();

    // Trova entry attiva
    const active = entries.find(
      (e) => nowMs >= e.start.getTime() && nowMs < e.end.getTime(),
    );
    const activeKey = active
      ? `${dayKey}-${active.startSlot}`
      : null;

    // Cambio materia: appena inizia una nuova entry (entro i primi 15s)
    if (
      active &&
      activeKey !== activeRef.current &&
      nowMs - active.start.getTime() < 15000
    ) {
      activeRef.current = activeKey;
      warned5minRef.current = null;
      const meta = SUBJECT_META[active.subject.key];
      const title = `🔔 Inizia: ${active.subject.name}`;
      const body = `${active.subject.teacher} · ${active.subject.room}\n${SLOT_START[active.startSlot]}–${SLOT_END[active.endSlot]}`;
      if (settings.sound) playBell();
      if (
        settings.notifications &&
        "Notification" in window &&
        Notification.permission === "granted" &&
        document.visibilityState === "hidden"
      ) {
        try {
          const n = new Notification(title, {
            body,
            tag: activeKey ?? undefined,
            icon: "/icon-192.png",
            badge: "/icon-192.png",
            silent: !settings.sound,
          });
          n.onclick = () => {
            window.focus();
            n.close();
          };
        } catch {}
      }
    }
    if (!active) activeRef.current = null;

    // Avviso "5 min alla fine"
    if (
      active &&
      warned5minRef.current !== activeKey &&
      active.end.getTime() - nowMs <= 5 * 60 * 1000 &&
      active.end.getTime() - nowMs > 4 * 60 * 1000
    ) {
      warned5minRef.current = activeKey;
      if (
        settings.notifications &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        try {
          new Notification("⏰ 5 minuti alla fine", {
            body: `${active.subject.name} termina alle ${SLOT_END[active.endSlot]}`,
            tag: `${activeKey}-5min`,
            icon: "/icon-192.png",
            silent: !settings.sound,
          });
        } catch {}
      }
    }
  }, [now, loaded, settings.notifications, settings.sound]);

  return null;
}
