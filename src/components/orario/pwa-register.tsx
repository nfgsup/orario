"use client";

import * as React from "react";

/**
 * Registra il service worker e gestisce l'installazione PWA.
 * Mostra un toast/prompt quando c'è un aggiornamento disponibile.
 */
export function PWARegister() {
  React.useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV !== "production"
    ) {
      // In dev non registriamo il SW (Next.js HMR conflict).
      return;
    }
    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // C'è un nuovo SW in attesa; ricarichiamo al prossimo idle.
              newWorker.postMessage("SKIP_WAITING");
            }
          });
        });
        // Ricerca aggiornamenti ogni ora
        setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
      } catch {
        /* ignore */
      }
    };
    register();

    // Capture install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      window.__deferredPrompt = e;
      window.dispatchEvent(new CustomEvent("pwa-installable"));
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      window.__deferredPrompt = null;
    });
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  return null;
}

declare global {
  interface Window {
    __deferredPrompt?: Event & {
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
    };
  }
}

export function useInstallPrompt() {
  const [installable, setInstallable] = React.useState(false);
  React.useEffect(() => {
    const onInstallable = () => setInstallable(true);
    window.addEventListener("pwa-installable", onInstallable);
    if (window.__deferredPrompt) setInstallable(true);
    return () =>
      window.removeEventListener("pwa-installable", onInstallable);
  }, []);
  const promptInstall = React.useCallback(async () => {
    const dp = window.__deferredPrompt;
    if (!dp) return false;
    await dp.prompt();
    const choice = await dp.userChoice;
    window.__deferredPrompt = undefined;
    setInstallable(false);
    return choice.outcome === "accepted";
  }, []);
  return { installable, promptInstall };
}
