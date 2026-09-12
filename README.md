# Orario 3Ai · 26/27 (vanilla)

Versione **statica standalone** (HTML + CSS + JS, niente framework, niente build step, niente server) dell'orario scolastico della classe **3Ai** per la stagione **2026/2027**.

![Orario 3Ai](icon.svg)

## ✨ Funzionalità

- **📱 PWA installabile** — aggiungila alla home, funziona offline (service worker con app-shell caching).
- **🕒 Vista "Oggi"** — materia in corso con countdown live, progress bar dell'ora, prossima materia, timeline della giornata, statistiche, countdown vacanze, avanzamento anno scolastico.
- **🗓️ Vista "Settimana"** — griglia completa LUN→SAB con slot orari, ore doppie (2h) come celle unite, colonna di oggi evidenziata.
- **👩‍🏫 Vista "Docenti"** — elenco dinamico con materie, aule, orari; docenti "in classe ora" evidenziati; ricerca per nome o materia.
- **🔔 Notifiche + campanella** — notifica browser + suono (Web Audio, niente asset esterni) all'inizio di ogni ora e 5 min prima della fine.
- **📚 Compiti** — CRUD persistente su `localStorage` con materia, scadenza, checkbox completato.
- **🎨 Tema chiaro/scuro/sistema**.
- **📱 Mobile-first** — bottom navigation (Oggi/Settimana/Docenti), safe-area aware.
- **⏰ Formato 12/24h** selezionabile.
- **100% offline-ready** — niente CDN, tutte le icone inline (SVG), font Google caricato ma con fallback di sistema.

## 🚀 Avvio

Niente build, niente dipendenze. Apri direttamente `index.html` nel browser, **oppure** servila con un qualsiasi web server statico (necessario per il service worker / PWA):

```bash
# con Python
python3 -m http.server 8000

# con Node (http-server)
npx http-server -p 8000

# con bun
bunx serve -p 8000
```

Poi visita `http://localhost:8000`.

> Per testare la PWA (installazione, offline) usa un server, non `file://`.

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

## 📁 Struttura

```
orario-3ai-vanilla/
├── index.html          # struttura (header, 3 view, settings drawer, bottom nav, footer)
├── style.css           # tema + layout + responsive (vanilla CSS con custom properties)
├── script.js           # tutta la logica (dati, rendering, notifiche, settings, PWA, compiti)
├── manifest.json       # PWA manifest
├── sw.js               # service worker (offline caching)
├── icon.svg            # icona SVG
├── icon-192.png        # icone PWA
├── icon-512.png
├── icon-maskable-192.png
├── icon-maskable-512.png
├── apple-touch-icon.png
├── favicon-32.png
└── README.md
```

## 🔒 Privacy

- I compiti sono salvati in `localStorage` (sul tuo dispositivo).
- Le preferenze (notifiche/suono/tema) sono in `localStorage`.
- Nessun tracking, nessun analytics, nessun dato inviato a terzi.
- Tutto funziona offline dopo il primo caricamento.

## 📝 Licenza

MIT — usala liberamente.
