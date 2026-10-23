# Worker “Richiedi compiti”

Piccolo proxy che permette al sito statico di avviare il workflow GitHub
`bot.yml` **senza esporre alcun token**.

## Perché serve

Una pagina GitHub Pages non può autenticarsi a GitHub in modo sicuro: un token
nel JavaScript sarebbe visibile a chiunque. Il Worker custodisce il token nei
suoi secret e accetta solo richieste provenienti dal tuo sito.

## Deploy

```bash
npm install -g wrangler
cp wrangler.toml.example wrangler.toml
```

Modifica `wrangler.toml`:

```toml
[vars]
GITHUB_OWNER = "tuo-utente"
GITHUB_REPO = "orariocompiti"
WORKFLOW_FILE = "bot.yml"
GITHUB_REF = "main"
ALLOWED_ORIGINS = "https://tuo-utente.github.io"
```

Crea il token GitHub:

1. GitHub → **Settings → Developer settings → Fine-grained tokens**.
2. Access limited alla repository del sito.
3. Permessi: **Actions: Read and write** (e `Contents: Read`).
4. Salvalo nel Worker:

```bash
wrangler secret put GITHUB_TOKEN
wrangler deploy
```

## Rate limit (consigliato)

```bash
wrangler kv namespace create RATE_LIMIT
```

Copia l'`id` restituito in `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "RATE_LIMIT"
id = "xxxxxxxx"
```

Senza KV il Worker funziona comunque, ma non limita le richieste.

## Collega il sito

In `config.js`:

```js
requestEndpoint: "https://orario-3ai-trigger.TUO-SUBDOMINIO.workers.dev",
```

Fai commit e push. Il pulsante nel sito ora avvia il bot.

## Risposte

| Stato | Significato |
|---|---|
| `202` | richiesta inviata a GitHub Actions |
| `403` | origine non autorizzata |
| `429` | rate limit (riprova tra 5 minuti) |
| `502` | GitHub non ha accettato la richiesta (token/permessi) |

## Sicurezza

- Non inserire mai il token GitHub in `config.js`.
- Limita `ALLOWED_ORIGINS` al dominio esatto del sito.
- Usa un token fine-grained solo su questa repository.
- Ruota il token se sospetti che sia stato esposto.
