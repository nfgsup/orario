# Orario 3Ai · 26/27

PWA per l'orario scolastico della classe **3Ai** — stagione **2026/2027**.
Costruita con Next.js 16, TypeScript, Tailwind CSS 4 e shadcn/ui.

![Orario 3Ai](public/icon.svg)

## ✨ Funzionalità

- **📱 PWA installabile** — aggiungila alla home, funziona offline (service worker con app-shell caching).
- **🕒 Vista "Oggi"** — materia in corso con countdown live, progress bar dell'ora, prossima materia, timeline della giornata, statistiche (ore totali / fatte / rimanenti / ora corrente), countdown prossime vacanze e avanzamento anno scolastico.
- **🗓️ Vista "Settimana"** — griglia completa LUN→SAB con slot orari, ore doppie (2h) come celle unite, colonna di oggi evidenziata.
- **👩‍🏫 Vista "Docenti"** — elenco dinamico dei docenti con materie, aule, orari; docenti "in classe ora" evidenziati; ricerca per nome o materia.
- **🔔 Notifiche + campanella** — notifica browser + suono (Web Audio, niente asset esterni) all'inizio di ogni ora e 5 min prima della fine. Tutto disattivabile dalle impostazioni.
- **📚 Compiti** — CRUD persistente (SQLite via Prisma) con materia, scadenza, checkbox completato.
- **🎨 Tema chiaro/scuro/sistema** — violet primary + emerald accent, niente indigo/blue.
- **📱 Mobile-first** — bottom navigation (Oggi/Settimana/Docenti), safe-area aware, touch-friendly.
- **⏰ Formato 12/24h** selezionabile.

## 🗓️ Orario 3Ai 26/27

| Giorno | Materie | Ore | Esce |
|--------|---------|-----|------|
| Lunedì | INGLESE, LAB. TLC (2h), LAB. SIST. E RETI (2h) | 5 | 13:05 |
| Martedì | MATEMATICA (2h), TPSIT, INFORMATICA, ITALIANO, SISTEMI E RETI | 6 | **14:05** |
| Mercoledì | STORIA, INFORMATICA (2h), LAB. TPSIT (2h) | 5 | 13:05 |
| Giovedì | MATEMATICA, RELIGIONE, SC. MOT. SPORT, STORIA, SISTEMI E RETI (2h) | 6 | **14:05** |
| Venerdì | LAB. INFORM. (2h), MATEMATICA, ITALIANO, INGLESE | 5 | 13:05 |
| Sabato | ITALIANO, INFORMATICA (2h), INGLESE, TLC | 5 | 13:05 |

Totale: **32 ore/settimana**.

## 🛠️ Stack

- **Next.js 16** (App Router, Turbopack)
- **TypeScript 5**
- **Tailwind CSS 4** + **shadcn/ui** (New York)
- **Prisma ORM** (SQLite)
- **next-themes** per dark/light
- **lucide-react** per le icone
- PWA: manifest + service worker (vanilla, offline-first)

## 🚀 Avvio locale

```bash
bun install
bun run db:push     # crea il DB SQLite con la tabella Note
bun run dev         # http://localhost:3000
```

## 📦 Build & deploy

```bash
bun run build
bun run start
```

La PWA è pronta per il deploy su Vercel, Netlify, Cloudflare Pages o qualsiasi host statico/Node.

> ⚠️ Il service worker viene registrato **solo in produzione** (non in `dev`).

## 📁 Struttura

```
prisma/
  schema.prisma          # modello Note (compiti)
public/
  manifest.json          # PWA manifest
  sw.js                  # service worker (offline caching)
  icon.svg, icon-*.png   # icone PWA
src/
  app/
    layout.tsx           # meta PWA + theme provider + SW register
    page.tsx             # UI principale (3 view: today/week/teachers)
    api/notes/           # CRUD compiti
  components/
    orario/
      weekly-grid.tsx        # vista settimana
      teachers-directory.tsx # elenco docenti
      notes-card.tsx         # compiti
      settings-sheet.tsx     # impostazioni
      notifications-manager.tsx
      year-progress.tsx
      pwa-register.tsx
      icons.tsx
      use-settings.ts        # hook preferenze (localStorage)
  lib/
    schedule.ts          # dati orario + helper temporali
    db.ts                # client Prisma
```

## 🔒 Privacy

- I compiti sono salvati in un DB SQLite locale al server.
- Le preferenze (notifiche/suono/tema) sono in `localStorage`.
- Nessun tracking, nessun analytics, nessun dato inviato a terzi.

## 📝 Licenza

MIT — usala liberamente.
