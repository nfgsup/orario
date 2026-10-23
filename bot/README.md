# Bot compiti — 3Ai

Legge gli argomenti/compiti dal registro elettronico, aggiorna
`data/homework.json` e invia il riepilogo su Telegram.

## Configurazione

Le credenziali **non** sono nel codice. Usa le variabili d'ambiente:

| Variabile | Descrizione |
|---|---|
| `SCHOOL_USERNAME` | utente registro |
| `SCHOOL_PASSWORD` | password registro |
| `TELEGRAM_BOT_TOKEN` | token bot Telegram (opzionale) |
| `TELEGRAM_CHAT_ID` | chat/canale Telegram (opzionale) |
| `FIREBASE_DB_URL` | opzionale, Realtime Database |
| `FIREBASE_DB_SECRET` | opzionale |
| `SITE_DATA_FILE` | percorso alternativo del JSON |

Copia `.env.example` in `.env` per l'esecuzione locale. Su GitHub usa i
**Secrets** della repository.

## Uso

```bash
python check_compiti.py            # esecuzione manuale
python check_compiti.py --scheduled # solo alle 14:00 italiane (cron)
```

## Cosa fa

1. Calcola il prossimo giorno di scuola (salta domenica).
2. Effettua il login al registro.
3. Per ogni materia di quel giorno apre `riepargomgen.php`, seleziona la
   materia e legge le righe con data più recente.
4. Scrive un JSON con materia, testo, data e flag eLearning.
5. Invia il messaggio Telegram in formato HTML.
6. (Opzionale) sincronizza Firebase Realtime Database.

Il file JSON viene poi committato dal workflow `.github/workflows/bot.yml`,
così GitHub Pages lo pubblica.

## Formato JSON

```json
{
  "updatedAt": "2026-10-23T14:00:05+02:00",
  "generatedFor": "2026-10-24",
  "targetDay": "Sabato",
  "source": "registro",
  "items": [
    {
      "subjectId": 13,
      "subject": "ITALIANO",
      "text": "Esercizi pag. 45",
      "date": "2026-10-23",
      "elearning": false,
      "status": "ok"
    }
  ]
}
```

## Nota

Se il registro cambia i selettori HTML (`#utente`, `#password`,
`select[name='idmateria']`), aggiorna `login_and_collect()` in
`check_compiti.py`.
