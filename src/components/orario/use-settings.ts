"use client";

/**
 * Hook per le preferenze utente (localStorage).
 * Settings: notifications, sound, theme fallback, hour24.
 */

import * as React from "react";

export interface Settings {
  notifications: boolean;
  sound: boolean;
  hour24: boolean;
}

const DEFAULTS: Settings = {
  notifications: false,
  sound: true,
  hour24: true,
};

const KEY = "orario-3ai-settings-v1";

function load(): Settings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

export function useSettings() {
  const [settings, setSettings] = React.useState<Settings>(DEFAULTS);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    setSettings(load());
    setLoaded(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setSettings(load());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const update = React.useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  return { settings, update, loaded };
}

export function formatTime(d: Date, hour24: boolean): string {
  return d.toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: !hour24,
  });
}
