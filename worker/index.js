/**
 * Cloudflare Worker — avvia il bot compiti su GitHub Actions.
 *
 * Il token GitHub NON sta mai nel sito: vive solo tra i secret del Worker.
 * Endpoint: POST /  →  GitHub Actions workflow_dispatch
 *
 * Variabili (wrangler.toml [vars]):
 *   GITHUB_OWNER     es. "mario-rossi"
 *   GITHUB_REPO      es. "orariocompiti"
 *   WORKFLOW_FILE    es. "bot.yml"
 *   GITHUB_REF       es. "main"
 *   ALLOWED_ORIGINS  es. "https://mario-rossi.github.io"
 *
 * Secret:
 *   wrangler secret put GITHUB_TOKEN   (fine-grained PAT, Actions: write)
 *
 * Binding opzionale (rate limit):
 *   RATE_LIMIT  → KV namespace
 */

function corsHeaders(origin, env) {
  const allowed = String(env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const ok = allowed.length === 0 || allowed.includes(origin);
  const allowOrigin = ok ? origin || allowed[0] || "*" : "null";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
    "Content-Type": "application/json; charset=utf-8",
  };
}

function json(body, status, origin, env) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders(origin, env),
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin, env) });
    }
    if (request.method !== "POST") {
      return json({ error: "Metodo non consentito" }, 405, origin, env);
    }

    const allowed = String(env.ALLOWED_ORIGINS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (allowed.length && !allowed.includes(origin)) {
      return json({ error: "Origine non autorizzata" }, 403, origin, env);
    }

    // Rate limit semplice: 1 richiesta ogni 5 minuti per IP (se il binding esiste).
    if (env.RATE_LIMIT) {
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      const key = `cooldown:${ip}`;
      const existing = await env.RATE_LIMIT.get(key);
      if (existing) {
        return json(
          { error: "Hai già richiesto i compiti da poco. Riprova tra qualche minuto." },
          429,
          origin,
          env
        );
      }
      await env.RATE_LIMIT.put(key, "1", { expirationTtl: 300 });
    }

    const owner = env.GITHUB_OWNER;
    const repo = env.GITHUB_REPO;
    const workflow = env.WORKFLOW_FILE || "bot.yml";
    const ref = env.GITHUB_REF || "main";

    if (!env.GITHUB_TOKEN || !owner || !repo) {
      return json({ error: "Worker non configurato correttamente" }, 500, origin, env);
    }

    const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${encodeURIComponent(
      workflow
    )}/dispatches`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "orario-3ai-trigger",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ref,
          inputs: { reason: "pulsante-sito" },
        }),
      });

      if (res.status === 204) {
        return json(
          {
            ok: true,
            message: "Richiesta inviata: il bot aggiornerà i compiti tra poco.",
          },
          202,
          origin,
          env
        );
      }

      const detail = await res.text();
      console.error("GitHub dispatch failed", res.status, detail.slice(0, 500));
      return json(
        { error: `GitHub ha risposto ${res.status}. Controlla i secret del Worker.` },
        502,
        origin,
        env
      );
    } catch (err) {
      console.error("Dispatch error", err);
      return json({ error: "Impossibile contattare GitHub" }, 502, origin, env);
    }
  },
};
