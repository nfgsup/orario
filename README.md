# Orario 3Ai + Bot compiti

Sito PWA dell'orario della classe **3Ai** (2026/2027) con integrazione del
registro elettronico: i compiti vengono aggiornati ogni giorno alle **14:00**
e possono essere richiesti manualmente dal pulsante **“Richiedi compiti”**.

Nessuna password, token o API key è presente nel codice o nel sito pubblico:
tutto passa da **GitHub Secrets** e da un piccolo **Cloudflare Worker**.

---

## 📁 Struttura

```
.
├── index.html                   # sito statico (GitHub Pages, root)
├── style.css
├── script.js
├── config.js                    # configurazione PUBBLICA (nessun segreto)
├── sw.js
├── manifest.json
├── data/homework.json           # compiti aggiornati dal bot
├── bot/
│   ├── check_compiti.py         # scraper registro + Telegram + JSON
│   ├── requirements.txt
│   └── .env.example
├── worker/                      # Cloudflare Worker per il pulsante
│   ├── index.js
│   └── wrangler.toml.example
└── .github/workflows/
    └── bot.yml                  # cron 14:00 + workflow_dispatch
```

> **Consiglio:** usa **una sola repository** con questa struttura. È la
> configurazione più semplice e non richiede Firebase.

---

## 🚀 Setup GitHub (una volta sola)

### 1. Crea la repository e carica i file

Carica tutta la cartella `orariocompiti` (con `.github`, `bot`, `worker`,
`data` e i file del sito) nella repository.

### 2. Attiva GitHub Pages

**Settings → Pages → Build and deployment → Source: Deploy from a branch**,
poi scegli **`main`** e **`/ (root)`**.

I file del sito sono già nella root della repository, quindi ogni push
pubblica automaticamente la nuova versione. Alla fine del workflow del bot
viene anche richiesta esplicitamente una nuova build di Pages.

Se usi Vercel (collegato alla repository), il deploy avviene in automatico
senza configurare GitHub Pages.

Il sito sarà su:

```
https://TUO-UTENTE.github.io/NOME-REPO/
```

### 3. Aggiungi i secrets

**Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Obbligatorio | Descrizione |
|---|---|---|
| `SCHOOL_USERNAME` | ✅ | Utente del registro elettronico |
| `SCHOOL_PASSWORD` | ✅ | Password del registro |
| `TELEGRAM_BOT_TOKEN` | consigliato | Token del bot Telegram |
| `TELEGRAM_CHAT_ID` | consigliato | ID chat/canale Telegram |
| `FIREBASE_DB_URL` | opzionale | URL Realtime Database (solo se lo usi) |
| `FIREBASE_DB_SECRET` | opzionale | Secret del Realtime Database |

**Settings → Actions → General → Workflow permissions**:
seleziona **Read and write permissions** (il bot deve committare
`data/homework.json`).

### 4. Primo avvio

**Actions → Bot compiti → Run workflow**. Il bot:

1. fa login al registro;
2. legge argomenti/compiti delle materie del giorno successivo;
3. invia il riepilogo su Telegram;
4. aggiorna `data/homework.json`;
5. committa il file → GitHub Pages ripubblica il sito.

---

## ⏰ Aggiornamento automatico alle 14:00

Il workflow `bot.yml` contiene:

```yaml
schedule:
  - cron: "0 12,13 * * *"
```

GitHub usa UTC, l'Italia usa UTC+1 (inverno) e UTC+2 (estate). Lo script
controlla l'ora reale italiana e si esegue **solo alle 14:00**, evitando
doppie esecuzioni ai cambi di ora legale.

> GitHub può ritardare i cron di alcuni minuti nei momenti di carico.
> Il pulsante manuale resta la soluzione immediata.

---

## 🔘 Pulsante “Richiedi compiti”

Il sito è statico e **non può contenere un token GitHub**. Il pulsante chiama
un Cloudflare Worker che, al posto del sito, avvia il workflow con un token
custodito nei secret del Worker.

### Deploy del Worker (5 minuti)

```bash
cd worker
npm install -g wrangler
cp wrangler.toml.example wrangler.toml
# modifica GITHUB_OWNER, GITHUB_REPO, ALLOWED_ORIGINS
wrangler login
wrangler secret put GITHUB_TOKEN   # PAT fine-grained con permesso Actions: write
wrangler deploy
```

Poi copia l'URL del Worker in `config.js`:

```js
window.ORARIO_CONFIG = {
  homeworkUrl: "data/homework.json",
  requestEndpoint: "https://orario-3ai-trigger.TUO-SUBDOMINIO.workers.dev",
  ...
};
```

Fai commit/push: il pulsante ora funziona per tutti i visitatori del sito.
Il Worker accetta solo l'origine del tuo sito e, se configuri il binding KV
`RATE_LIMIT`, limita le richieste a 1 ogni 5 minuti per IP.

Dettagli completi: [`worker/README.md`](worker/README.md).

---

## 📚 Come funzionano i compiti sul sito

- La card **“Compiti dal registro”** legge `data/homework.json`
  (network-first: non resta mai bloccata su una cache vecchia).
- Mostra materia, testo, data e l'avviso eLearning per Informatica, TPSIT,
  Sistemi e TLC.
- Si aggiorna da sola ogni 5 minuti.
- Dopo “Richiedi compiti” attende fino a ~2 minuti che il bot aggiorni il file.
- La card **“Compiti”** in basso resta per gli appunti personali salvati solo
  nel browser (`localStorage`).

---

## 🗓️ Orario corretto 2026/2027

| Giorno | Materie | Ore | Esce |
|---|---|---|---|
| Lunedì | INGLESE, LAB. TLC (2h), LAB. SIST. E RETI (2h) | 5 | 13:05 |
| Martedì | MATEMATICA (2h), TPSIT, INFORMATICA, ITALIANO, SISTEMI E RETI | 6 | **14:05** |
| Mercoledì | STORIA, INFORMATICA (2h), LAB. TPSIT (2h) | 5 | 13:05 |
| Giovedì | MATEMATICA, RELIGIONE, **SC. MOT. SPORT (2h)**, STORIA, SISTEMI E RETI | 6 | **14:05** |
| Venerdì | LAB. INFORM. (2h), MATEMATICA, ITALIANO, INGLESE | 5 | 13:05 |
| Sabato | **ITALIANO (2h)**, INFORMATICA, INGLESE, TLC | 5 | 13:05 |

Correzioni rispetto alla versione precedente:

- **Giovedì:** Scienze Motorie è doppia (10:05–12:05), Sistemi e Reti è singola
  (13:05–14:05). Prima erano invertite.
- **Sabato:** Italiano è doppio (08:05–10:05), Informatica è singola
  (10:05–11:05). Prima erano invertite.

---

## 🕑 Dopo le 14:00

Dalle **14:00** (e nei giorni festivi/domenica) il sito mostra in automatico
il **prossimo giorno di scuola**, non quello appena concluso. Un pulsante
**“Oggi”** appare in cima ai giorni per tornare alla giornata corrente.
Prima delle 14:00 resta visibile il giorno attuale.

## 🖥️ Selezione giorni su computer

Su desktop i giorni vanno a capo e sono tutti cliccabili. Restano comunque
disponibili rotella del mouse e trascinamento. Su mobile la barra scorre
orizzontalmente e porta automaticamente in vista il giorno attivo.

---

## 🔐 Sicurezza

- **Nessuna credenziale nel repository.** Rimuovi `.env` e non committarlo mai.
- **Ruota subito** la password del registro e il token Telegram se erano già
  stati scritti in chiaro in versioni precedenti: considera quelle credenziali
  compromesse.
- Il token GitHub vive solo nei secret del Worker Cloudflare.
- Il Worker valida l'header `Origin` e può applicare un rate limit con KV.
- I compiti sono dati scolastici: il file JSON è pubblico se il sito è pubblico.

---

## 🧪 Test locale

```bash
# sito (dalla root del repository)
python3 -m http.server 8000

# bot (serve un .env con le credenziali)
cd bot
cp .env.example .env
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
playwright install chromium
python check_compiti.py
```

Il bot scrive di default in `data/homework.json`.

---

## 📝 Licenza

MIT.
