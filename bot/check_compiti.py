#!/usr/bin/env python3
"""
Bot compiti — Liceo 3Ai.

Legge gli argomenti/compiti dal registro elettronico, li salva in
`data/homework.json` (usato dal sito) e li invia su Telegram.

Sicurezza: nessuna credenziale è scritta nel codice. Tutto arriva da
variabili d'ambiente / GitHub Secrets (vedi .env.example).

Uso locale:
    cp .env.example .env      # compila i valori
    python check_compiti.py

Uso GitHub Actions:
    python check_compiti.py --scheduled
"""

from __future__ import annotations

import argparse
import datetime as dt
import html
import json
import os
import re
import sys
import tempfile
from pathlib import Path
from zoneinfo import ZoneInfo

import requests
from playwright.sync_api import TimeoutError as PWTimeoutError
from playwright.sync_api import sync_playwright

ROME = ZoneInfo("Europe/Rome")
BASE_DIR = Path(__file__).resolve().parent
REPO_ROOT = BASE_DIR.parent

# ---------------------------------------------------------------------------
# Configurazione non segreta
# ---------------------------------------------------------------------------
LOGIN_URL = "https://registro.itdimaggio.edu.it/login/login.php?suffisso=it"
ARGOMENTI_URL = "https://registro.itdimaggio.edu.it/lezioni/riepargomgen.php"

# ID materia usati dal registro -> nome leggibile
MATERIE = {
    6: "INGLESE",
    39: "TLC",
    37: "SISTEMI E RETI",
    11: "MATEMATICA",
    38: "TPSIT",
    3: "INFORMATICA",
    13: "ITALIANO",
    9: "STORIA",
    34: "RELIGIONE",
    52: "SC. MOT. SPORT",
}

# Materie con materiale anche sulla piattaforma eLearning
MATERIE_ELEARNING = {3, 38, 37, 39}

# Orario settimanale (lunedì=0). Serve solo per sapere le materie del giorno.
ORARIO = {
    0: [6, 39, 37],
    1: [11, 38, 3, 13, 37],
    2: [9, 3, 38],
    3: [11, 34, 52, 9, 37],
    4: [3, 11, 13, 6],
    5: [13, 3, 6, 39],
}

GIORNI = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"]

# Vacanze / festivi (stesse date usate dal sito). Formato ISO, estremi inclusi.
VACANZE = [
    ("2026-12-23", "2027-01-07"),
    ("2027-02-08", "2027-02-12"),
    ("2027-04-01", "2027-04-13"),
    ("2027-04-25", "2027-04-25"),
    ("2027-05-01", "2027-05-01"),
    ("2027-06-08", "2027-09-08"),
]

DATE_RE = re.compile(r"\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4}|\d{2})\b")
ISO_DATE_RE = re.compile(r"\b(\d{4})-(\d{2})-(\d{2})\b")


# ---------------------------------------------------------------------------
# Utility
# ---------------------------------------------------------------------------
def load_dotenv() -> None:
    """Carica un .env locale senza dipendenze esterne (solo se esiste)."""
    for candidate in (BASE_DIR / ".env", REPO_ROOT / ".env"):
        if not candidate.exists():
            continue
        for raw in candidate.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            os.environ.setdefault(key, value)


def env(*names: str, default: str = "") -> str:
    for name in names:
        value = os.environ.get(name, "").strip()
        if value:
            return value
    return default


def now_rome() -> dt.datetime:
    return dt.datetime.now(ROME)


def is_scheduled_run_window(now: dt.datetime) -> bool:
    """Evita di eseguire due volte il job nei giorni di cambio ora legale."""
    return now.hour == 14


def is_vacanza(value: dt.date) -> bool:
    iso = value.isoformat()
    return any(start <= iso <= end for start, end in VACANZE)


def next_school_day(now: dt.datetime) -> tuple[int, str, dt.date]:
    """Restituisce indice settimana, nome e data del prossimo giorno di scuola."""
    target = now.date() + dt.timedelta(days=1)
    for _ in range(60):
        if target.weekday() <= 5 and not is_vacanza(target):
            return target.weekday(), GIORNI[target.weekday()], target
        target += dt.timedelta(days=1)
    return target.weekday(), GIORNI[target.weekday()], target


def clean_text(value: str) -> str:
    value = value.replace("\r", "\n")
    value = re.sub(r"[ \t]+", " ", value)
    value = re.sub(r"\n{2,}", "\n", value)
    return value.strip()


def parse_date(text: str) -> dt.date | None:
    match = ISO_DATE_RE.search(text)
    if match:
        year, month, day = (int(match.group(1)), int(match.group(2)), int(match.group(3)))
        try:
            return dt.date(year, month, day)
        except ValueError:
            return None
    match = DATE_RE.search(text)
    if not match:
        return None
    day, month, year = (int(match.group(1)), int(match.group(2)), int(match.group(3)))
    if year < 100:
        year += 2000
    try:
        return dt.date(year, month, day)
    except ValueError:
        return None


def date_to_iso(value: dt.date | None) -> str | None:
    return value.isoformat() if value else None


# ---------------------------------------------------------------------------
# Telegram
# ---------------------------------------------------------------------------
def telegram_send(token: str, chat_id: str, message: str) -> bool:
    if not token or not chat_id:
        print("ℹ️  Telegram non configurato: salto l'invio.")
        return False

    url = f"https://api.telegram.org/bot{token}/sendMessage"
    # Telegram limita i messaggi a 4096 caratteri.
    chunks: list[str] = []
    current = ""
    for line in message.splitlines(keepends=True):
        if len(current) + len(line) > 3900:
            chunks.append(current)
            current = ""
        current += line
    if current:
        chunks.append(current)

    ok = True
    for chunk in chunks:
        try:
            response = requests.post(
                url,
                json={
                    "chat_id": chat_id,
                    "text": chunk,
                    "parse_mode": "HTML",
                    "disable_web_page_preview": True,
                },
                timeout=30,
            )
            if response.status_code != 200:
                ok = False
                print(f"❌ Errore Telegram: {response.status_code} {response.text}")
        except requests.RequestException as exc:
            ok = False
            print(f"❌ Errore di rete Telegram: {exc}")
    if ok:
        print("✅ Messaggio inviato su Telegram.")
    return ok


# ---------------------------------------------------------------------------
# Scraping registro
# ---------------------------------------------------------------------------
def login_and_collect(username: str, password: str, subject_ids: list[int]) -> dict[int, dict]:
    results: dict[int, dict] = {}

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            locale="it-IT",
            timezone_id="Europe/Rome",
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0 Safari/537.36"
            ),
        )
        page = context.new_page()
        page.set_default_timeout(30_000)

        print("🔐 Login al registro…")
        page.goto(LOGIN_URL, wait_until="domcontentloaded")
        page.fill("#utente", username)
        page.fill("#password", password)
        page.locator("#password").press("Enter")
        try:
            page.wait_for_load_state("networkidle", timeout=45_000)
        except PWTimeoutError:
            pass

        if page.locator("#utente").count() and page.locator("#utente").is_visible():
            raise RuntimeError(
                "Login fallito: controlla SCHOOL_USERNAME / SCHOOL_PASSWORD nei secrets."
            )

        print("📚 Apro gli argomenti delle lezioni…")
        page.goto(ARGOMENTI_URL, wait_until="networkidle")

        for subject_id in subject_ids:
            name = MATERIE.get(subject_id, f"Materia {subject_id}")
            print(f"   • {name} (id {subject_id})")
            try:
                page.select_option("select[name='idmateria']", str(subject_id))
                try:
                    page.wait_for_load_state("networkidle", timeout=20_000)
                except PWTimeoutError:
                    pass
                page.wait_for_timeout(700)

                rows = page.locator("table tr").all_inner_texts()
                if not rows:
                    rows = page.locator("tr").all_inner_texts()

                # Prendi le righe con una data; tieni le più recenti.
                parsed: list[tuple[dt.date, str]] = []
                seen: set[str] = set()
                for row in rows:
                    date = parse_date(row)
                    if not date:
                        continue
                    text = clean_text(ISO_DATE_RE.sub("", DATE_RE.sub("", row, count=1), count=1))
                    # Rimuove eventuali prime colonne tipo "Argomenti/Compiti"
                    text = re.sub(r"^(argomenti?|compiti?|lezione)\s*[:\-]?\s*", "", text, flags=re.I)
                    if not text or text in seen:
                        continue
                    seen.add(text)
                    parsed.append((date, text))

                parsed.sort(key=lambda item: item[0], reverse=True)
                recent = parsed[:2]
                if recent:
                    text = "\n".join(
                        f"{d.strftime('%d/%m')}: {t}" if len(recent) > 1 else t
                        for d, t in recent
                    )
                    latest_date = recent[0][0]
                    status = "ok"
                else:
                    text = "Nessun nuovo argomento inserito."
                    latest_date = None
                    status = "empty"

                results[subject_id] = {
                    "subjectId": subject_id,
                    "subject": name,
                    "text": text[:1500],
                    "date": date_to_iso(latest_date),
                    "elearning": subject_id in MATERIE_ELEARNING,
                    "status": status,
                }
            except Exception as exc:  # una materia non deve bloccare tutto
                print(f"     ⚠️  Errore: {exc}")
                results[subject_id] = {
                    "subjectId": subject_id,
                    "subject": name,
                    "text": "Errore nel recupero dei dati. Riprova più tardi.",
                    "date": None,
                    "elearning": subject_id in MATERIE_ELEARNING,
                    "status": "error",
                }

        context.close()
        browser.close()

    return results


# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------
def build_payload(target: dt.date, day_name: str, results: dict[int, dict]) -> dict:
    items = []
    for subject_id in ORARIO.get(target.weekday(), []):
        item = results.get(subject_id)
        if item:
            items.append(item)
    return {
        "updatedAt": now_rome().isoformat(timespec="seconds"),
        "generatedFor": target.isoformat(),
        "targetDay": day_name,
        "source": "registro",
        "items": items,
    }


def build_telegram_message(payload: dict) -> str:
    target = dt.date.fromisoformat(payload["generatedFor"])
    day_name = payload["targetDay"]
    lines = [
        f"📚 <b>COMPITI E ARGOMENTI PER {html.escape(day_name.upper())}</b>",
        f"🗓️ {target.strftime('%d/%m/%Y')}",
        "",
    ]

    for item in payload["items"]:
        subject = html.escape(str(item.get("subject", "")))
        text = html.escape(str(item.get("text", ""))).strip()
        lines.append(f"📖 <b>{subject}</b>")
        lines.append(text or "Nessun nuovo argomento inserito.")
        if item.get("elearning"):
            lines.append("⚠️ <i>Controlla anche la piattaforma eLearning.</i>")
        lines.append("")
        lines.append("───────────────────")

    lines.append("")
    lines.append(f"<i>Aggiornato: {now_rome().strftime('%d/%m/%Y %H:%M')}</i>")
    return "\n".join(lines)


def write_json_atomic(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp_name = tempfile.mkstemp(dir=str(path.parent), prefix=".homework-", suffix=".json")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            json.dump(payload, handle, ensure_ascii=False, indent=2)
            handle.write("\n")
        os.replace(tmp_name, path)
    finally:
        if os.path.exists(tmp_name):
            os.unlink(tmp_name)
    print(f"💾 Salvato: {path}")


def sync_firebase(payload: dict) -> None:
    """Sincronizzazione opzionale su Firebase Realtime Database."""
    db_url = env("FIREBASE_DB_URL")
    db_secret = env("FIREBASE_DB_SECRET")
    if not db_url or not db_secret:
        return
    url = db_url.rstrip("/") + "/homework.json"
    try:
        response = requests.put(url, params={"auth": db_secret}, json=payload, timeout=30)
        if response.status_code in (200, 204):
            print("🔥 Firebase aggiornato.")
        else:
            print(f"⚠️  Firebase non aggiornato: {response.status_code} {response.text[:200]}")
    except requests.RequestException as exc:
        print(f"⚠️  Firebase non raggiungibile: {exc}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main() -> int:
    parser = argparse.ArgumentParser(description="Bot compiti registro 3Ai")
    parser.add_argument(
        "--scheduled",
        action="store_true",
        help="Esegue solo nella finestra delle 14:00 italiane (per i cron GitHub).",
    )
    args = parser.parse_args()

    load_dotenv()

    now = now_rome()
    if (args.scheduled or env("SCHEDULED") == "1") and not is_scheduled_run_window(now):
        print(f"⏭️  Fuori finestra (ora italiana {now:%H:%M}), esco senza fare nulla.")
        return 0

    username = env("SCHOOL_USERNAME", "USERNAME")
    password = env("SCHOOL_PASSWORD", "PASSWORD")
    if not username or not password:
        print("❌ Mancano SCHOOL_USERNAME / SCHOOL_PASSWORD (GitHub Secrets o .env).")
        return 2

    day_index, day_name, target = next_school_day(now)
    subject_ids = ORARIO.get(day_index, [])
    if not subject_ids:
        print("ℹ️  Domani non ci sono lezioni.")
        return 0

    print(f"📅 Raccolgo i compiti per {day_name} {target:%d/%m/%Y}")

    try:
        results = login_and_collect(username, password, subject_ids)
    except Exception as exc:
        print(f"❌ Errore durante lo scraping: {exc}")
        return 1

    payload = build_payload(target, day_name, results)

    output = Path(
        env(
            "SITE_DATA_FILE",
            default=str(REPO_ROOT / "data" / "homework.json"),
        )
    )
    write_json_atomic(output, payload)
    sync_firebase(payload)

    message = build_telegram_message(payload)
    telegram_send(env("TELEGRAM_BOT_TOKEN"), env("TELEGRAM_CHAT_ID"), message)

    print("✅ Fatto.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
