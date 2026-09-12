"use client";

import * as React from "react";
import { Settings as Cog, Bell, Volume2, Clock, X, Github, Download } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useSettings } from "./use-settings";
import { useTheme } from "next-themes";
import { useInstallPrompt } from "./pwa-register";

export function SettingsSheet() {
  const { settings, update, loaded } = useSettings();
  const { resolvedTheme, setTheme } = useTheme();
  const { installable, promptInstall } = useInstallPrompt();
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          aria-label="Impostazioni"
          className="grid place-items-center w-9 h-9 rounded-xl hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground"
        >
          <Cog className="w-4 h-4" />
        </button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-sm p-0">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border/60">
          <SheetTitle className="flex items-center gap-2">
            <Cog className="w-4 h-4" /> Impostazioni
          </SheetTitle>
          <SheetDescription>
            Personalizza notifiche, suono e tema.
          </SheetDescription>
        </SheetHeader>

        <div className="px-5 py-4 space-y-1">
          {/* Notifiche */}
          <Row
            icon={<Bell className="w-4 h-4" />}
            title="Notifiche browser"
            desc="Avvisi all'inizio di ogni ora e 5 min prima della fine"
          >
            <Switch
              checked={loaded && settings.notifications}
              onCheckedChange={(v) => update({ notifications: v })}
              disabled={!loaded}
            />
          </Row>

          {/* Suono campanella */}
          <Row
            icon={<Volume2 className="w-4 h-4" />}
            title="Suono campanella"
            desc="Rintocco al cambio materia (Web Audio)"
          >
            <Switch
              checked={loaded && settings.sound}
              onCheckedChange={(v) => update({ sound: v })}
              disabled={!loaded}
            />
          </Row>

          {/* Formato ora */}
          <Row
            icon={<Clock className="w-4 h-4" />}
            title="Formato 24 ore"
            desc="Disattiva per 12h (AM/PM)"
          >
            <Switch
              checked={loaded && settings.hour24}
              onCheckedChange={(v) => update({ hour24: v })}
              disabled={!loaded}
            />
          </Row>

          <div className="h-px bg-border/60 my-3" />

          {/* Tema */}
          <div className="py-2">
            <div className="text-sm font-medium mb-2">Tema</div>
            <div className="grid grid-cols-3 gap-2">
              {(["light", "dark", "system"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={
                    "h-9 rounded-xl text-xs font-medium border transition-colors capitalize " +
                    (resolvedTheme === t || (t === "system" && !loaded)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border/60 hover:bg-muted/60 text-muted-foreground")
                  }
                >
                  {t === "light" ? "Chiaro" : t === "dark" ? "Scuro" : "Sistema"}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-border/60 my-3" />

          {/* Installa PWA */}
          {installable && (
            <Button
              onClick={promptInstall}
              className="w-full h-10 rounded-xl"
            >
              <Download className="w-4 h-4 mr-1.5" />
              Installa app
            </Button>
          )}

          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            <Github className="w-3.5 h-3.5" /> Codice su GitHub
          </a>

          <p className="text-center text-[10px] text-muted-foreground/60 pt-1">
            Orario 3Ai · 26/27 · PWA
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Row({
  icon,
  title,
  desc,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="grid place-items-center w-9 h-9 rounded-xl bg-muted/60 text-muted-foreground shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-[11px] text-muted-foreground leading-tight">
          {desc}
        </div>
      </div>
      {children}
    </div>
  );
}
