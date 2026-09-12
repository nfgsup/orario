"use client";

import * as React from "react";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, ClipboardList, CalendarClock, Loader2 } from "lucide-react";
import { SUBJECT_META, type SubjectKey } from "@/lib/schedule";
import { SubjectIcon } from "./icons";
import { cn } from "@/lib/utils";

interface Note {
  id: string;
  subject: string;
  text: string;
  dueDate: string | null;
  done: boolean;
  createdAt: string;
}

const SUBJECT_OPTIONS: SubjectKey[] = [
  "MATEMATICA",
  "ITALIANO",
  "INGLESE",
  "STORIA",
  "INFORMATICA",
  "LAB_INFORM",
  "TPSIT",
  "LAB_TPSIT",
  "SISTEMI_RETI",
  "LAB_SIST_RETI",
  "TLC",
  "LAB_TLC",
  "SC_MOT_SPORT",
  "RELIGIONE",
];

function subjectKeyFor(name: string): SubjectKey | null {
  return SUBJECT_OPTIONS.includes(name as SubjectKey)
    ? (name as SubjectKey)
    : null;
}

export function NotesCard() {
  const { toast } = useToast();
  const [notes, setNotes] = React.useState<Note[] | null>(null);
  const [subject, setSubject] = React.useState<SubjectKey>("MATEMATICA");
  const [text, setText] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const res = await fetch("/api/notes", { cache: "no-store" });
      const data = await res.json();
      setNotes(data.notes ?? []);
    } catch {
      setNotes([]);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          text: text.trim(),
          dueDate: dueDate || null,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setNotes((prev) => [data.note, ...(prev ?? [])]);
      setText("");
      setDueDate("");
      toast({ title: "Compito aggiunto", description: SUBJECT_META[subject].name });
    } catch {
      toast({
        title: "Errore",
        description: "Impossibile salvare il compito.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function toggle(id: string, done: boolean) {
    setNotes((prev) =>
      (prev ?? []).map((n) => (n.id === id ? { ...n, done } : n)),
    );
    try {
      await fetch(`/api/notes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done }),
      });
    } catch {
      setNotes((prev) =>
        (prev ?? []).map((n) => (n.id === id ? { ...n, done: !done } : n)),
      );
      toast({
        title: "Errore",
        description: "Aggiornamento non riuscito.",
        variant: "destructive",
      });
    }
  }

  async function remove(id: string) {
    const prev = notes;
    setNotes((p) => (p ?? []).filter((n) => n.id !== id));
    try {
      await fetch(`/api/notes/${id}`, { method: "DELETE" });
      toast({ title: "Compito eliminato" });
    } catch {
      setNotes(prev);
      toast({
        title: "Errore",
        description: "Eliminazione non riuscita.",
        variant: "destructive",
      });
    }
  }

  const pending = (notes ?? []).filter((n) => !n.done);
  const completed = (notes ?? []).filter((n) => n.done);

  return (
    <section className="rounded-3xl border bg-card/60 backdrop-blur-md p-5 sm:p-6 shadow-lg shadow-black/5 animate-rise">
      <header className="flex items-center gap-2 mb-4">
        <div className="grid place-items-center w-9 h-9 rounded-xl bg-primary/15 text-primary">
          <ClipboardList className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h2 className="font-semibold leading-tight">Compiti</h2>
          <p className="text-xs text-muted-foreground">
            {notes === null
              ? "Caricamento…"
              : `${pending.length} da fare · ${completed.length} completati`}
          </p>
        </div>
      </header>

      {/* Add form */}
      <form onSubmit={addNote} className="space-y-2 mb-5">
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={subject} onValueChange={(v) => setSubject(v as SubjectKey)}>
            <SelectTrigger className="sm:w-40 h-10 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {SUBJECT_OPTIONS.map((k) => {
                const m = SUBJECT_META[k];
                return (
                  <SelectItem key={k} value={k}>
                    <span className="inline-flex items-center gap-2">
                      <SubjectIcon name={m.icon} className="w-4 h-4" />
                      {m.name}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Es. Esercizi pag. 45 es. 1-10"
            className="flex-1 h-10 rounded-xl"
            maxLength={140}
          />
        </div>
        <div className="flex gap-2">
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="flex-1 h-10 rounded-xl text-muted-foreground"
          />
          <Button
            type="submit"
            disabled={submitting || !text.trim()}
            className="h-10 rounded-xl px-4"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span className="ml-1.5">Aggiungi</span>
          </Button>
        </div>
      </form>

      {/* List */}
      <div className="space-y-2 max-h-80 overflow-y-auto fancy-scroll pr-1">
        {notes === null ? (
          <NotesSkeleton />
        ) : notes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Nessun compito. Aggiungine uno!</p>
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <div className="space-y-2">
                {pending.map((n) => (
                  <NoteRow
                    key={n.id}
                    note={n}
                    onToggle={(d) => toggle(n.id, d)}
                    onDelete={() => remove(n.id)}
                  />
                ))}
              </div>
            )}
            {completed.length > 0 && (
              <div className="space-y-2 pt-2">
                {pending.length > 0 && (
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground/70 pl-1">
                    Completati
                  </div>
                )}
                {completed.map((n) => (
                  <NoteRow
                    key={n.id}
                    note={n}
                    onToggle={(d) => toggle(n.id, d)}
                    onDelete={() => remove(n.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function NoteRow({
  note,
  onToggle,
  onDelete,
}: {
  note: Note;
  onToggle: (done: boolean) => void;
  onDelete: () => void;
}) {
  const key = subjectKeyFor(note.subject);
  const meta = key ? SUBJECT_META[key] : null;
  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-2xl border bg-background/40 p-3 transition-colors hover:bg-background/70",
        note.done && "opacity-55",
      )}
    >
      <Checkbox
        checked={note.done}
        onCheckedChange={(v) => onToggle(Boolean(v))}
        className="mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          {meta && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md border",
                meta.bg,
                meta.border,
                meta.text,
              )}
            >
              <SubjectIcon name={meta.icon} className="w-3 h-3" />
              {meta.short}
            </span>
          )}
          {note.dueDate && (
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
              <CalendarClock className="w-3 h-3" />
              {formatDue(note.dueDate)}
            </span>
          )}
        </div>
        <p
          className={cn(
            "text-sm leading-snug break-words",
            note.done && "line-through text-muted-foreground",
          )}
        >
          {note.text}
        </p>
      </div>
      <button
        type="button"
        onClick={onDelete}
        aria-label="Elimina compito"
        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1.5 rounded-lg hover:bg-destructive/10"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

function NotesSkeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-16 rounded-2xl" />
      ))}
    </div>
  );
}

function formatDue(iso: string): string {
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
