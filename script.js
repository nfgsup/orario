/* ===================================================================
   Orario 3Ai · 26/27 — vanilla JS (no framework)
   Tutta la logica: dati, rendering, notifiche, settings, PWA, compiti.
   =================================================================== */
(function () {
  "use strict";

  // ============ ICONS (inline SVG, offline-ready) ============
  const I = {
    cap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    volume: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    party: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5.8 11.3 2 22l10.7-3.79M5.8 11.3 9 8.1M5.8 11.3 2 22l10.7-3.79M5.8 11.3 9 8.1M9 8.1 4 4M9 8.1l5-5M14 3l3 3M4 4l4-1M4 4 2 8M11 21a4 4 0 0 0 4-4M16 9a2 2 0 0 0 2 2M19 5a1 1 0 1 0 0-2"/></svg>',
    hourglass: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 22h14M5 2h14M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/></svg>',
    sparkle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    forward: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 17 20 12 15 7"/><path d="M4 18v-2a4 4 0 0 1 4-4h12"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    calrange: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M7 14h2M11 14h2M15 14h2M7 18h2M11 18h6"/></svg>',
    school: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 22v-4a2 2 0 0 0-4 0v4"/><path d="m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2"/><path d="M18 5v17M6 5v17"/><path d="m12 2 4 2-4 2-4-2 4-2z"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    clipboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>',
    calclock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3"/><path d="M16 2v4M8 2v4M3 10h5"/><circle cx="14" cy="16" r="6"/><polyline points="14 14 14 16 16 17"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    github: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  };
  function svg(name, cls) {
    return I[name] ? I[name].replace("<svg", '<svg class="' + (cls || "ic") + '"') : "";
  }

  // ============ SCHEDULE DATA ============
  const SLOT_START = ["08:05","09:05","10:05","11:05","12:05","13:05"];
  const SLOT_END   = ["09:05","10:05","11:05","12:05","13:05","14:05"];

  function mkSubject(key, name, short, teacher, room, isLab) {
    return { key, name, short, teacher, room, isLab: !!isLab };
  }

  const COLOR = {
    INGLESE: "amber", MATEMATICA: "rose", STORIA: "orange",
    INFORMATICA: "cyan", LAB_INFORM: "cyan", ITALIANO: "red",
    RELIGIONE: "violet", LAB_TLC: "teal", TLC: "teal",
    TPSIT: "emerald", LAB_TPSIT: "emerald", SC_MOT_SPORT: "lime",
    LAB_SIST_RETI: "fuchsia", SISTEMI_RETI: "fuchsia",
  };
  const EMOJI = {
    INGLESE: "🇬🇧", MATEMATICA: "📐", STORIA: "🏛️", INFORMATICA: "💻",
    LAB_INFORM: "🖥️", ITALIANO: "📖", RELIGIONE: "✝️", LAB_TLC: "📡",
    TLC: "📻", TPSIT: "🌐", LAB_TPSIT: "🗄️", SC_MOT_SPORT: "⚽",
    LAB_SIST_RETI: "🔧", SISTEMI_RETI: "🔗",
  };
  function colorOf(s) { return COLOR[s.key] || "violet"; }

  const S = mkSubject;
  const SCHEDULE = {
    Monday: {
      label: "Lunedì", short: "LUN",
      entries: [
        { subject: S("INGLESE","INGLESE","ING","Nardella T.","P2-03"), hours: 1 },
        { subject: S("LAB_TLC","LAB. TLC","TLC","Pompilio G. · Placentino G.","Lab. Ele. 1",true), hours: 2 },
        { subject: S("LAB_SIST_RETI","LAB. SIST. E RETI","S&R","Chiumento G. · Mischielli C.","Lab. Sist.",true), hours: 2 },
      ],
    },
    Tuesday: {
      label: "Martedì", short: "MAR",
      entries: [
        { subject: S("MATEMATICA","MATEMATICA","MAT","D'Addona R.A.","P2-01"), hours: 2 },
        { subject: S("TPSIT","TPSIT","TPSIT","Chiumento G.","P2-01"), hours: 1 },
        { subject: S("INFORMATICA","INFORMATICA","INF","Tamburrano P.","P2-01"), hours: 1 },
        { subject: S("ITALIANO","ITALIANO","ITA","Ferosi G.","P2-01"), hours: 1 },
        { subject: S("SISTEMI_RETI","SISTEMI E RETI","S&R","Chiumento G.","P2-01"), hours: 1 },
      ],
    },
    Wednesday: {
      label: "Mercoledì", short: "MER",
      entries: [
        { subject: S("STORIA","STORIA","STO","Ferosi G.","P2-03"), hours: 1 },
        { subject: S("INFORMATICA","INFORMATICA","INF","Tamburrano P.","P2-03"), hours: 2 },
        { subject: S("LAB_TPSIT","LAB. TPSIT","TPSIT","Chiumento G. · Augello","Lab. Tec. Inf.",true), hours: 2 },
      ],
    },
    Thursday: {
      label: "Giovedì", short: "GIO",
      entries: [
        { subject: S("MATEMATICA","MATEMATICA","MAT","D'Addona R.A.","P2-03"), hours: 1 },
        { subject: S("RELIGIONE","RELIGIONE","REL","Ritrovato M.G.","P2-03"), hours: 1 },
        { subject: S("SC_MOT_SPORT","SC. MOT. SPORT","MOT","Gentile A.","Palestra 1"), hours: 1 },
        { subject: S("STORIA","STORIA","STO","Ferosi G.","P2-01"), hours: 1 },
        { subject: S("SISTEMI_RETI","SISTEMI E RETI","S&R","Chiumento G.","P2-01"), hours: 2 },
      ],
    },
    Friday: {
      label: "Venerdì", short: "VEN",
      entries: [
        { subject: S("LAB_INFORM","LAB. INFORM.","INF","Tamburrano P. · Martella M.","Lab. Tec. Inf.",true), hours: 2 },
        { subject: S("MATEMATICA","MATEMATICA","MAT","D'Addona R.A.","P2-03"), hours: 1 },
        { subject: S("ITALIANO","ITALIANO","ITA","Ferosi G.","P2-03"), hours: 1 },
        { subject: S("INGLESE","INGLESE","ING","Nardella T.","P2-03"), hours: 1 },
      ],
    },
    Saturday: {
      label: "Sabato", short: "SAB",
      entries: [
        { subject: S("ITALIANO","ITALIANO","ITA","Ferosi G.","P2-01"), hours: 1 },
        { subject: S("INFORMATICA","INFORMATICA","INF","Tamburrano P.","P2-01"), hours: 2 },
        { subject: S("INGLESE","INGLESE","ING","Nardella T.","P2-01"), hours: 1 },
        { subject: S("TLC","TLC","TLC","Pompilio G.","P2-01"), hours: 1 },
      ],
    },
  };
  const DAY_ORDER = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const HOLIDAYS = [
    { name: "Vacanze di Natale", emoji: "🎄", start: "2026-12-23", end: "2027-01-07" },
    { name: "Vacanze di Carnevale", emoji: "🎭", start: "2027-02-08", end: "2027-02-12" },
    { name: "Vacanze di Pasqua", emoji: "🐣", start: "2027-04-01", end: "2027-04-13" },
    { name: "Festa della Liberazione", emoji: "🇮🇹", start: "2027-04-25", end: "2027-04-25" },
    { name: "Festa dei Lavoratori", emoji: "🌷", start: "2027-05-01", end: "2027-05-01" },
    { name: "Vacanze Estive", emoji: "🏖️", start: "2027-06-08", end: "2027-09-08" },
  ];
  const YEAR_START = new Date("2026-09-14T00:00:00");
  const YEAR_END = new Date("2027-06-08T00:00:00");

  // ============ TIME HELPERS ============
  function slotStart(d, i) { const x = new Date(d); const [h,m] = SLOT_START[i].split(":").map(Number); x.setHours(h,m,0,0); return x; }
  function slotEnd(d, i) { const x = new Date(d); const [h,m] = SLOT_END[i].split(":").map(Number); x.setHours(h,m,0,0); return x; }
  function resolveDay(day, base) {
    const out = []; let cur = 0, ord = 0;
    for (const e of day.entries) {
      const ss = cur, es = cur + e.hours - 1; ord++;
      out.push({ entry: e, subject: e.subject, startSlot: ss, endSlot: es, start: slotStart(base,ss), end: slotEnd(base,es), ordinal: ord });
      cur = es + 1;
    }
    return out;
  }
  function dayHours(day) { return day.entries.reduce((a,e)=>a+e.hours,0); }
  function dayEndLabel(day) { const h = dayHours(day); return SLOT_END[h-1]; }
  function jsDayToKey(n) { return [null,"Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][n] || null; }
  function formatCountdown(ms) {
    if (ms < 0) ms = 0;
    const t = Math.floor(ms/1000), h = Math.floor(t/3600), m = Math.floor((t%3600)/60), s = t%60;
    const p = n => String(n).padStart(2,"0");
    return h > 0 ? `${p(h)}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`;
  }
  function nextHoliday(now) {
    const today = iso(now);
    return HOLIDAYS.find(h => h.end >= today) || null;
  }
  function daysUntil(startISO, now) {
    const s = new Date(startISO+"T00:00:00");
    return Math.max(0, Math.ceil((s.getTime()-now.getTime())/86400000));
  }
  function iso(d) { return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
  function fmtDate(isoStr) {
    try { const d = new Date(isoStr+"T00:00:00"); return d.toLocaleDateString("it-IT",{day:"2-digit",month:"short"}); } catch { return isoStr; }
  }
  function fmtClock(d, h24) { return d.toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit",hour12:!h24}); }
  function fmtClockFull(d, h24) { return d.toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:!h24}); }
  function esc(s) { return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }

  // ============ STATE ============
  const state = {
    now: new Date(),
    selectedDay: null,
    view: "today",
    settings: { notifications: false, sound: true, hour24: true },
    notes: [],
    activeKey: null,
    warned5: null,
    deferredPrompt: null,
  };

  function loadSettings() {
    try { const r = localStorage.getItem("orario-3ai-settings-v1"); if (r) state.settings = Object.assign(state.settings, JSON.parse(r)); } catch {}
  }
  function saveSettings() { try { localStorage.setItem("orario-3ai-settings-v1", JSON.stringify(state.settings)); } catch {} }

  function loadNotes() {
    try { const r = localStorage.getItem("orario-3ai-notes-v1"); state.notes = r ? JSON.parse(r) : []; } catch { state.notes = []; }
  }
  function saveNotes() { try { localStorage.setItem("orario-3ai-notes-v1", JSON.stringify(state.notes)); } catch {} }

  // ============ DOM refs ============
  const $ = (id) => document.getElementById(id);
  const dayTabs = $("dayTabs");
  const dayProgressBar = $("dayProgressBar");
  const heroEl = $("hero");
  const timelineCard = $("timelineCard");
  const statsGrid = $("statsGrid");
  const vacationCard = $("vacationCard");
  const yearCard = $("yearCard");
  const yearCard2 = $("yearCard2");
  const notesCard = $("notesCard");
  const weekGrid = $("weekGrid");
  const teachersList = $("teachersList");
  const teacherSearch = $("teacherSearch");
  const clockPill = $("clockPill");
  const headerClock = $("headerClock");
  const footerClock = $("footerClock");
  const drawerOverlay = $("drawerOverlay");

  // ============ ICON INJECTION ============
  function injectIcons() {
    $("logoBadge").innerHTML = svg("cap","ic");
    $("headerIconClock").innerHTML = svg("clock","ic");
    $("footerIconClock").innerHTML = svg("clock","ic");
    $("shareBtn").innerHTML = svg("share","ic");
    $("settingsBtn").innerHTML = svg("settings","ic");
    $("themeBtn").innerHTML = svg("sun","ic");
    $("weekTitleIcon").innerHTML = svg("grid","ic");
    $("teachersTitleIcon").innerHTML = svg("users","ic");
    $("searchIcon").innerHTML = svg("search","ic");
    $("navIconToday").innerHTML = svg("home","ic");
    $("navIconWeek").innerHTML = svg("grid","ic");
    $("navIconTeachers").innerHTML = svg("users","ic");
    $("drawerIcon").innerHTML = svg("settings","ic");
    $("drawerClose").innerHTML = svg("x","ic");
    $("setIconBell").innerHTML = svg("bell","ic");
    $("setIconVolume").innerHTML = svg("volume","ic");
    $("setIconClock").innerHTML = svg("clock","ic");
    $("installIcon").innerHTML = svg("download","ic");
    $("githubIcon").innerHTML = svg("github","ic");
  }

  // ============ THEME ============
  function applyTheme(mode) {
    const html = document.documentElement;
    if (mode === "light" || mode === "dark") html.setAttribute("data-theme", mode);
    else html.removeAttribute("data-theme");
    $("themeBtn").innerHTML = svg(currentThemeIsDark() ? "sun" : "moon", "ic");
    document.querySelectorAll(".theme-btn").forEach(b => b.classList.toggle("active", b.dataset.theme === mode));
    // theme-color meta
    const dark = currentThemeIsDark();
    $("meta-theme-light").setAttribute("content", dark ? "#0b0d12" : "#7c4dff");
    $("meta-theme-dark").setAttribute("content", dark ? "#0b0d12" : "#7c4dff");
  }
  function currentThemeIsDark() {
    const t = document.documentElement.getAttribute("data-theme");
    if (t === "dark") return true;
    if (t === "light") return false;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  function getStoredTheme() { return localStorage.getItem("orario-3ai-theme") || "system"; }
  function storeTheme(m) { localStorage.setItem("orario-3ai-theme", m); }
  function toggleTheme() {
    const cur = getStoredTheme();
    const isDark = currentThemeIsDark();
    // cycle: if system → set explicit opposite of resolved; else flip
    const next = cur === "system" ? (isDark ? "light" : "dark") : (isDark ? "light" : "dark");
    storeTheme(next); applyTheme(next);
  }
  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { if (getStoredTheme() === "system") applyTheme("system"); });
  }

  // ============ DAY TABS ============
  function renderDayTabs() {
    const todayKey = jsDayToKey(state.now.getDay());
    const sel = state.selectedDay;
    let html = "";
    html += `<button class="day-pill ${sel===null?"active":""}" data-day="">
      ${todayKey && sel!==null ? '<span class="today-dot"></span>' : ""}<span>Oggi</span><span class="sub">${todayKey ? SCHEDULE[todayKey].short : ""}</span></button>`;
    DAY_ORDER.forEach(k => {
      const d = SCHEDULE[k];
      const active = sel === k;
      const isToday = todayKey === k && !active;
      const long = dayEndLabel(d) === "14:05";
      html += `<button class="day-pill ${active?"active":""}" data-day="${k}">
        ${isToday ? '<span class="today-dot"></span>' : ""}
        <span>${d.label}</span><span class="sub">${d.short}</span>
        ${long ? '<span class="chip-2pm">2pm</span>' : ""}
      </button>`;
    });
    dayTabs.innerHTML = html;
    dayTabs.querySelectorAll(".day-pill").forEach(b => {
      b.addEventListener("click", () => { state.selectedDay = b.dataset.day || null; renderDayTabs(); renderToday(); });
    });
  }

  // ============ HERO ============
  function renderHero() {
    const todayKey = jsDayToKey(state.now.getDay());
    const dispKey = state.selectedDay || todayKey;
    if (!dispKey) { heroEl.innerHTML = ""; return; }
    const day = SCHEDULE[dispKey];
    const isToday = dispKey === todayKey;
    const totalH = dayHours(day);
    const endLbl = dayEndLabel(day);

    if (!isToday) {
      // preview
      const first = day.entries[0];
      heroEl.classList.remove("accent");
      heroEl.innerHTML = `
        <div class="status-badge status-preview">${svg("sparkle","ic")} Anteprima</div>
        <p class="meta">${day.label} <span class="sep">·</span> <span class="tnum">${totalH} ore</span> <span class="sep">·</span> <span class="tnum">${svg("clock","ic")} fino alle ${endLbl}</span></p>
        <h2>${first ? esc(first.subject.name) : "Riposo"}</h2>
        ${first ? `<p class="meta">${svg("user","ic")} ${esc(first.subject.teacher)}</p>
        <p class="meta">${svg("pin","ic")} ${esc(first.subject.room)} <span class="sep">·</span> ${svg("clock","ic")} <span class="tnum">${SLOT_START[0]}–${SLOT_END[first.hours-1]}</span> ${first.hours===2?'<span class="dbl-badge">2h</span>':""}</p>` : ""}
      `;
      return;
    }

    const now = state.now, nowMs = now.getTime();
    const entries = resolveDay(day, now);
    let active = null, next = null;
    entries.forEach(e => {
      if (nowMs >= e.start.getTime() && nowMs < e.end.getTime()) active = e;
      else if (nowMs < e.start.getTime() && !next) next = e;
    });
    const effEnd = entries.length ? entries[entries.length-1].end : null;
    const isOver = effEnd ? nowMs >= effEnd.getTime() : false;
    const isBefore = entries.length ? nowMs < entries[0].start.getTime() : true;

    if (isOver) {
      heroEl.classList.remove("accent");
      // tomorrow preview
      let tmr = "";
      let d = new Date(now);
      for (let i=0;i<7;i++){
        d = new Date(d.getFullYear(),d.getMonth(),d.getDate()+1);
        const k = jsDayToKey(d.getDay());
        if (k && SCHEDULE[k].entries.length) {
          const f = SCHEDULE[k].entries[0];
          tmr = `<div class="hero-foot"><span class="hf-label">${svg("cal","ic")} ${SCHEDULE[k].label}</span>
            <span class="hf-info">${subjectBadge(f.subject)}<span class="hf-name">${esc(f.subject.name)}</span>${f.hours===2?'<span class="dbl-badge">2h</span>':""}<span class="hf-time tnum">${SLOT_START[0]}</span><span class="hf-sub">${dayHours(SCHEDULE[k])}h → ${dayEndLabel(SCHEDULE[k])}</span></span></div>`;
          break;
        }
      }
      heroEl.innerHTML = `
        <div class="status-badge status-over">${svg("check","ic")} Lezioni terminate</div>
        <div class="hero-icon c-emerald">${svg("party","ic")}</div>
        <h2>Hai finito per oggi! 🎉</h2>
        <p class="meta">Uscita alle ${endLbl}. Ci vediamo domani.</p>
        ${tmr}
      `;
      return;
    }

    if (isBefore) {
      heroEl.classList.remove("accent");
      if (next) {
        const rem = next.start.getTime() - nowMs;
        heroEl.innerHTML = `
          <div class="status-badge status-before">${svg("hourglass","ic")} Prima delle lezioni</div>
          <p class="meta">La scuola inizia tra</p>
          <div class="countdown-big">${formatCountdown(rem)}</div>
          <div class="hero-chip">${subjectBadge(next.subject)}<span>${esc(next.subject.name)}</span>${next.entry.hours===2?'<span class="dbl-badge">2h</span>':""}<span class="hf-time tnum">${SLOT_START[next.startSlot]}</span></div>
        `;
      } else {
        heroEl.innerHTML = `<h2>Buongiorno!</h2>`;
      }
      return;
    }

    if (active) {
      const e = active, p = e.subject, c = colorOf(p);
      const total = e.end.getTime() - e.start.getTime();
      const elapsed = nowMs - e.start.getTime();
      const pct = Math.max(0, Math.min(100, (elapsed/total)*100));
      const rem = e.end.getTime() - nowMs;
      heroEl.classList.add("accent");
      heroEl.innerHTML = `
        <div class="status-badge status-live"><span class="live-dot"></span> In classe ora · ${e.ordinal}ª ora</div>
        <div class="hero-icon c-${c}">${EMOJI[p.key]}</div>
        <h2>${esc(p.name)}</h2>
        <p class="meta">${svg("user","ic")} ${esc(p.teacher)} <span class="sep">·</span> ${svg("pin","ic")} ${esc(p.room)}</p>
        <p class="meta tnum">${svg("clock","ic")} ${SLOT_START[e.startSlot]} – ${SLOT_END[e.endSlot]} ${e.entry.hours===2?'<span class="dbl-badge">2h consec.</span>':""}</p>
        <div class="countdown-big">${formatCountdown(rem)}</div>
        <div class="countdown-label">alla fine dell'ora${e.entry.hours===2?" (doppia)":""}</div>
        <div class="progress-linear"><div class="progress-fill" style="width:${pct}%"></div></div>
        <div class="progress-meta"><span class="tnum">${SLOT_START[e.startSlot]}</span><span>${Math.round(pct)}%</span><span class="tnum">${SLOT_END[e.endSlot]}</span></div>
        ${next ? `<div class="hero-foot"><span class="hf-label">${svg("forward","ic")} Prossima</span><span class="hf-info">${subjectBadge(next.subject)}<span class="hf-name">${esc(next.subject.name)}</span>${next.entry.hours===2?'<span class="dbl-badge">2h</span>':""}<span class="hf-time tnum">${SLOT_START[next.startSlot]}</span></span></div>` : ""}
      `;
      return;
    }

    // gap (shouldn't happen)
    if (next) {
      heroEl.classList.remove("accent");
      const rem = next.start.getTime() - nowMs;
      heroEl.innerHTML = `
        <div class="status-badge status-gap">${svg("hourglass","ic")} In pausa</div>
        <h2>Prossima lezione</h2>
        <p class="meta">tra</p>
        <div class="countdown-big">${formatCountdown(rem)}</div>
        <div class="hero-chip">${subjectBadge(next.subject)}<span>${esc(next.subject.name)}</span>${next.entry.hours===2?'<span class="dbl-badge">2h</span>':""}<span class="hf-time tnum">${SLOT_START[next.startSlot]}</span></div>
      `;
      return;
    }

    heroEl.classList.remove("accent");
    heroEl.innerHTML = `<h2>Niente lezioni</h2><p class="meta">Oggi non ci sono altre materie.</p>`;
  }

  function subjectBadge(s) {
    const c = colorOf(s);
    return `<span class="sbadge c-${c}">${EMOJI[s.key]}</span>`;
  }

  // ============ TIMELINE ============
  function renderTimeline() {
    const todayKey = jsDayToKey(state.now.getDay());
    const dispKey = state.selectedDay || todayKey;
    if (!dispKey) { timelineCard.innerHTML = ""; return; }
    const day = SCHEDULE[dispKey];
    const isToday = dispKey === todayKey;
    const entries = resolveDay(day, state.now);
    const totalH = dayHours(day);
    const endLbl = dayEndLabel(day);
    const nowMs = state.now.getTime();

    let rows = "";
    entries.forEach(e => {
      const p = e.subject, c = colorOf(p);
      const active = isToday && nowMs >= e.start.getTime() && nowMs < e.end.getTime();
      const past = isToday && nowMs >= e.end.getTime();
      const dbl = e.entry.hours === 2;
      rows += `<li class="tl-row ${active?"active":""} ${past?"past":""}">
        <div class="tl-time">
          <span class="tnum">${SLOT_START[e.startSlot]}</span>
          ${dbl ? `<span class="down tnum">↓${SLOT_START[e.endSlot]}</span>` : ""}
        </div>
        <div class="tl-dot c-${c} ${dbl?"dbl":""}"></div>
        <div class="tl-body">
          <span class="tl-sicon c-${c}">${EMOJI[p.key]}</span>
          <div class="tl-info">
            <div class="tl-name-row">
              <span class="tl-name">${esc(p.name)}</span>
              ${p.isLab?'<span class="lab-badge">Lab</span>':""}
              ${dbl?'<span class="dbl-badge">2h</span>':""}
              ${active?'<span class="now-badge">Ora</span>':""}
            </div>
            <div class="tl-meta">${svg("user","ic")}<span class="truncate">${esc(p.teacher)}</span> <span class="sep">·</span> ${svg("pin","ic")} ${esc(p.room)}</div>
          </div>
          <span class="tl-end tnum">${SLOT_END[e.endSlot]}</span>
        </div>
      </li>`;
    });

    timelineCard.innerHTML = `
      <div class="card-head">
        <div class="tl-icon">${svg("bell","ic")}</div>
        <div>
          <div class="tl-title">Programma ${isToday?"di oggi":"di "+day.label}</div>
          <div class="tl-sub tnum">${day.entries.length} materie · ${totalH} ore · fino alle ${endLbl}</div>
        </div>
      </div>
      <ol class="timeline">${rows}</ol>
    `;
  }

  // ============ STATS ============
  function renderStats() {
    const todayKey = jsDayToKey(state.now.getDay());
    const dispKey = state.selectedDay || todayKey;
    if (!dispKey) { statsGrid.innerHTML = ""; return; }
    const day = SCHEDULE[dispKey];
    const isToday = dispKey === todayKey;
    const totalH = dayHours(day);
    const totalC = day.entries.length;
    const endLbl = dayEndLabel(day);
    const nowMs = state.now.getTime();

    let doneH = 0, curOrd = 0;
    if (isToday) {
      const entries = resolveDay(day, state.now);
      entries.forEach(e => { if (nowMs >= e.end.getTime()) doneH += e.entry.hours; });
      entries.forEach(e => { if (nowMs >= e.start.getTime() && nowMs < e.end.getTime()) curOrd = e.ordinal; });
    }
    const activeH = isToday && curOrd ? resolveDay(day,state.now).find(e=>e.ordinal===curOrd).entry.hours : 0;
    const leftH = Math.max(0, totalH - doneH - activeH);

    statsGrid.innerHTML = `
      <div class="stat"><div class="stat-label">${svg("school","ic")} Ore totali</div><div class="stat-val tnum">${totalH}<span class="stat-sub"> · ${totalC} mat.</span></div></div>
      <div class="stat accent"><div class="stat-label">${svg("bell","ic")} Ora corrente</div><div class="stat-val tnum">${isToday && curOrd ? curOrd+"ª" : "—"}<span class="stat-sub"> di ${totalC}</span></div></div>
      <div class="stat"><div class="stat-label">${svg("check","ic")} Fatte</div><div class="stat-val tnum">${isToday?doneH:"—"}<span class="stat-sub"> ore</span></div></div>
      <div class="stat"><div class="stat-label">${svg("hourglass","ic")} Rimaste</div><div class="stat-val tnum">${isToday?leftH:"—"}<span class="stat-sub"> ore · esci ${endLbl}</span></div></div>
    `;
  }

  // ============ VACATION ============
  function renderVacation() {
    const h = nextHoliday(state.now);
    if (!h) { vacationCard.innerHTML = ""; return; }
    const days = daysUntil(h.start, state.now);
    vacationCard.innerHTML = `
      <div class="vac-emoji">${h.emoji}</div>
      <div class="vac-info"><div class="vac-label">Prossima vacanza</div><div class="vac-name">${esc(h.name)}</div><div class="vac-date">dal ${fmtDate(h.start)}</div></div>
      <div class="vac-days"><div class="vac-days-n tnum">${days}</div><div class="vac-days-l">giorni</div></div>
    `;
  }

  // ============ YEAR PROGRESS ============
  function renderYear(card) {
    if (!card) return;
    const total = YEAR_END.getTime() - YEAR_START.getTime();
    const elapsed = Math.max(0, state.now.getTime() - YEAR_START.getTime());
    const pct = Math.max(0, Math.min(100, (elapsed/total)*100));
    const daysLeft = Math.max(0, Math.ceil((YEAR_END.getTime()-state.now.getTime())/86400000));
    const isBefore = state.now.getTime() < YEAR_START.getTime();
    const isAfter = state.now.getTime() > YEAR_END.getTime();
    let label = `${pct.toFixed(0)}% completato`;
    if (isBefore) label = `Inizia tra ${Math.ceil((YEAR_START.getTime()-state.now.getTime())/86400000)} giorni`;
    else if (isAfter) label = "Anno concluso";
    card.innerHTML = `
      <div class="yp-head">
        <div class="yp-icon">${svg("calrange","ic")}</div>
        <div class="yp-info"><div class="yp-title">Anno scolastico 26/27</div><div class="yp-range">${fmtDate(iso(YEAR_START))} → ${fmtDate(iso(YEAR_END))}</div></div>
        <div class="yp-pct"><div class="yp-pct-n tnum">${isBefore?"—":isAfter?"100":pct.toFixed(0)}${!isBefore && !isAfter?'<span class="yp-pct-s">%</span>':""}</div>${!isAfter && !isBefore?`<div class="yp-left">${daysLeft} giorni rimasti</div>`:""}</div>
      </div>
      <div class="yp-bar"><div class="yp-fill" style="width:${pct}%"></div></div>
      <div class="yp-status">${label}</div>
    `;
  }

  // ============ NOTES ============
  function renderNotes() {
    const pending = state.notes.filter(n => !n.done);
    const done = state.notes.filter(n => n.done);
    const opts = Object.keys(COLOR).map(k => `<option value="${k}">${labelFor(k)}</option>`).join("");
    let html = `
      <div class="notes-head"><span class="nh-icon">${svg("clipboard","ic")}</span>
        <div><div class="nh-title">Compiti</div><div class="nh-sub">${pending.length} da fare · ${done.length} completati</div></div>
      </div>
      <form class="notes-form" id="noteForm">
        <select class="ns-select" id="nsSubject">${opts}</select>
        <input class="ns-input" type="text" id="nsText" placeholder="Es. Esercizi pag. 45 es. 1-10" maxlength="140" />
        <div class="ns-row"><input class="ns-date" type="date" id="nsDate" /><button class="ns-btn" type="submit">${svg("plus","ic")}<span>Aggiungi</span></button></div>
      </form>
      <div class="notes-list fancy-scroll" id="notesList"></div>
    `;
    notesCard.innerHTML = html;
    renderNotesList();
    $("noteForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const subj = $("nsSubject").value;
      const text = $("nsText").value.trim();
      const date = $("nsDate").value;
      if (!text) return;
      state.notes.unshift({ id: "n"+Date.now()+"r"+Math.random().toString(36).slice(2,6), subject: subj, text, dueDate: date || null, done: false, createdAt: new Date().toISOString() });
      saveNotes();
      $("nsText").value = ""; $("nsDate").value = "";
      renderNotesList();
      updateNotesCount();
    });
  }
  function labelFor(key) {
    for (const k of DAY_ORDER) { const e = SCHEDULE[k].entries.find(e => e.subject.key === key); if (e) return e.subject.name; }
    return key;
  }
  function updateNotesCount() {
    const pending = state.notes.filter(n=>!n.done).length;
    const done = state.notes.filter(n=>n.done).length;
    const sub = notesCard.querySelector(".nh-sub");
    if (sub) sub.textContent = `${pending} da fare · ${done} completati`;
  }
  function renderNotesList() {
    const list = $("notesList");
    if (!list) return;
    if (state.notes.length === 0) {
      list.innerHTML = `<div class="notes-empty">${svg("clipboard","ic")}<p>Nessun compito. Aggiungine uno!</p></div>`;
      return;
    }
    const pending = state.notes.filter(n=>!n.done);
    const done = state.notes.filter(n=>n.done);
    let html = "";
    pending.forEach(n => html += noteRow(n));
    if (done.length) {
      if (pending.length) html += `<div class="notes-section">Completati</div>`;
      done.forEach(n => html += noteRow(n));
    }
    list.innerHTML = html;
    list.querySelectorAll(".note").forEach(el => {
      const id = el.dataset.id;
      el.querySelector(".n-check").addEventListener("change", (e) => {
        const n = state.notes.find(x => x.id === id); if (n) { n.done = e.target.checked; saveNotes(); renderNotesList(); updateNotesCount(); }
      });
      el.querySelector(".n-del").addEventListener("click", () => {
        state.notes = state.notes.filter(x => x.id !== id); saveNotes(); renderNotesList(); updateNotesCount();
      });
    });
  }
  function noteRow(n) {
    const c = COLOR[n.subject] || "violet";
    const lbl = labelFor(n.subject);
    return `<div class="note ${n.done?"done":""}" data-id="${n.id}">
      <input type="checkbox" class="n-check" ${n.done?"checked":""} />
      <div class="n-content">
        <div class="n-meta"><span class="n-subj c-${c}">${EMOJI[n.subject]||"📚"} ${shortFor(n.subject)}</span>${n.dueDate?`<span class="n-due">${svg("calclock","ic")} ${fmtDate(n.dueDate)}</span>`:""}</div>
        <div class="n-text">${esc(n.text)}</div>
      </div>
      <button class="n-del" aria-label="Elimina">${svg("trash","ic")}</button>
    </div>`;
  }
  function shortFor(key) {
    for (const k of DAY_ORDER) { const e = SCHEDULE[k].entries.find(e => e.subject.key === key); if (e) return e.subject.short; }
    return key;
  }

  // ============ WEEK GRID ============
  function renderWeek() {
    const todayKey = jsDayToKey(state.now.getDay());
    const nowMs = state.now.getTime();
    // header
    let html = `<div class="wg-corner"></div>`;
    DAY_ORDER.forEach(k => {
      const d = SCHEDULE[k];
      const isToday = k === todayKey;
      const long = dayEndLabel(d) === "14:05";
      html += `<div class="wg-day ${isToday?"today":""}">
        <div class="wg-day-name">${d.short}</div>
        <div class="wg-day-sub tnum">${dayHours(d)}h → ${dayEndLabel(d)}</div>
        ${long?'<span class="wg-chip">2pm</span>':""}
        ${isToday?'<span class="wg-today">Oggi</span>':""}
      </div>`;
    });
    // 6 slot rows
    for (let s=0; s<6; s++) {
      html += `<div class="wg-time tnum">${SLOT_START[s]}</div>`;
      DAY_ORDER.forEach(k => {
        const d = SCHEDULE[k];
        const entries = resolveDay(d, state.now);
        const e = entries.find(e => e.startSlot <= s && e.endSlot >= s);
        if (e && e.startSlot === s) {
          const p = e.subject, c = colorOf(p);
          const active = k === todayKey && nowMs >= e.start.getTime() && nowMs < e.end.getTime();
          const span = e.entry.hours;
          html += `<div class="wg-lesson c-${c} ${active?"active":""}" style="grid-row: ${s+2} / span ${span}">
            <span class="wg-lname">${esc(p.short)}</span>
            <span class="wg-lroom">${svg("pin","ic")} ${esc(p.room)}</span>
            ${span===2?'<span class="wg-ldbl">2h</span>':""}
            ${active?'<span class="wg-now">Adesso</span>':""}
          </div>`;
        } else if (!e) {
          const isTodayCol = k === todayKey;
          html += `<div class="wg-cell ${isTodayCol?"today":""}"></div>`;
        }
        // else: cell is covered by a spanning lesson above → skip
      });
    }
    weekGrid.innerHTML = html;
  }

  // ============ TEACHERS ============
  let teacherSearchTerm = "";
  function buildTeachers() {
    const map = new Map();
    DAY_ORDER.forEach(k => {
      const d = SCHEDULE[k];
      const entries = resolveDay(d, state.now);
      entries.forEach(e => {
        const parts = e.subject.teacher.split(" · ");
        parts.forEach(name => {
          name = name.trim();
          if (!name) return;
          if (!map.has(name)) map.set(name, { name, subjectKeys: new Set(), rooms: new Set(), slots: [] });
          const rec = map.get(name);
          rec.subjectKeys.add(e.subject.key);
          rec.rooms.add(e.subject.room);
          rec.slots.push({ dayShort: d.short, dayKey: k, startSlot: e.startSlot, endSlot: e.endSlot, subject: e.subject, isDouble: e.entry.hours===2, start: e.start, end: e.end });
        });
      });
    });
    const todayKey = jsDayToKey(state.now.getDay());
    const nowMs = state.now.getTime();
    const arr = Array.from(map.values()).map(r => {
      r.teachingNow = todayKey && r.slots.some(sl => sl.dayKey === todayKey && nowMs >= sl.start.getTime() && nowMs < sl.end.getTime());
      const parts = r.name.split(" ");
      const last = parts[parts.length-1];
      r.surname = last && /^[A-Z]/.test(last) && last.length > 2 ? last : parts[0];
      r.initials = parts.map(p => p[0]).slice(0,2).join("").toUpperCase();
      r.subjectArr = Array.from(r.subjectKeys);
      r.roomArr = Array.from(r.rooms);
      return r;
    });
    arr.sort((a,b) => (b.teachingNow - a.teachingNow) || a.surname.localeCompare(b.surname));
    return arr;
  }
  function renderTeachers() {
    const all = buildTeachers();
    const term = teacherSearchTerm.toLowerCase().trim();
    const list = term ? all.filter(r => r.name.toLowerCase().includes(term) || r.subjectArr.some(k => labelFor(k).toLowerCase().includes(term))) : all;
    if (list.length === 0) {
      teachersList.innerHTML = `<div class="notes-empty"><p>Nessun docente trovato.</p></div>`;
      return;
    }
    teachersList.innerHTML = list.map(r => {
      const badges = r.subjectArr.map(k => `<span class="t-badge c-${COLOR[k]||"violet"}">${EMOJI[k]||"📚"} ${shortFor(k)}</span>`).join("");
      const slots = r.slots.map(sl => `<div class="t-slot"><span class="t-slot-day">${sl.dayShort}</span><span class="t-slot-time tnum">${SLOT_START[sl.startSlot]}–${SLOT_END[sl.endSlot]}</span><span class="t-slot-subj">${sl.subject.short}</span>${sl.isDouble?'<span class="t-slot-dbl">2h</span>':""}</div>`).join("");
      return `<div class="teacher ${r.teachingNow?"now":""}">
        <div class="t-avatar">${r.initials}</div>
        <div class="t-info">
          <div class="t-name">${esc(r.name)}</div>
          <div class="t-badges">${badges}</div>
          <div class="t-slots">${slots}</div>
        </div>
        ${r.teachingNow?'<span class="t-now-badge">In classe ora</span>':""}
      </div>`;
    }).join("");
  }

  // ============ VIEW SWITCHING ============
  function setView(v) {
    state.view = v;
    document.querySelectorAll(".view").forEach(s => { s.hidden = s.dataset.view !== v; });
    document.querySelectorAll(".nav-btn").forEach(b => {
      b.setAttribute("aria-current", b.dataset.view === v ? "page" : "false");
    });
    // day tabs only in today view
    dayTabs.style.display = v === "today" ? "" : "none";
    dayProgressBar.parentElement.style.display = v === "today" ? "" : "none";
    if (v === "today") renderToday();
    if (v === "week") { renderWeek(); renderYear(yearCard2); }
    if (v === "teachers") renderTeachers();
    // update URL
    try { history.replaceState(null, "", "?view=" + v); } catch {}
  }

  // ============ DAY PROGRESS ============
  function renderDayProgress() {
    const todayKey = jsDayToKey(state.now.getDay());
    if (state.view !== "today" || !todayKey) { dayProgressBar.style.width = "0%"; return; }
    const day = SCHEDULE[todayKey];
    const entries = resolveDay(day, state.now);
    const effEnd = entries.length ? entries[entries.length-1].end : null;
    const startMs = new Date(state.now).setHours(8,5,0,0);
    let pct = 0;
    if (effEnd) {
      const total = effEnd.getTime() - startMs;
      const elapsed = state.now.getTime() - startMs;
      pct = total > 0 ? Math.max(0, Math.min(100, (elapsed/total)*100)) : 0;
    } else if (state.now.getTime() >= effEnd?.getTime?.()) pct = 100;
    dayProgressBar.style.width = pct + "%";
  }

  // ============ CLOCK + TICK ============
  function renderToday() {
    renderHero();
    renderTimeline();
    renderStats();
    renderVacation();
    renderYear(yearCard);
    renderDayProgress();
  }
  function tick() {
    state.now = new Date();
    headerClock.textContent = fmtClock(state.now, state.settings.hour24);
    footerClock.textContent = fmtClockFull(state.now, state.settings.hour24);
    if (state.view === "today") renderToday();
    if (state.view === "week") { renderWeek(); renderYear(yearCard2); }
    if (state.view === "teachers") renderTeachers();
    checkNotifications();
  }

  // ============ NOTIFICATIONS + BELL ============
  function playBell() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const t = ctx.currentTime;
      const ring = (freq, start, dur) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "sine"; o.frequency.value = freq;
        g.gain.setValueAtTime(0.0001, t+start);
        g.gain.exponentialRampToValueAtTime(0.25, t+start+0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t+start+dur);
        o.connect(g).connect(ctx.destination);
        o.start(t+start); o.stop(t+start+dur);
      };
      ring(880, 0, 0.5); ring(1175, 0.35, 0.6);
      setTimeout(() => ctx.close().catch(()=>{}), 1500);
    } catch {}
  }
  function checkNotifications() {
    if (!state.settings.notifications && !state.settings.sound) return;
    const dayKey = jsDayToKey(state.now.getDay());
    if (!dayKey) return;
    const entries = resolveDay(SCHEDULE[dayKey], state.now);
    const nowMs = state.now.getTime();
    const active = entries.find(e => nowMs >= e.start.getTime() && nowMs < e.end.getTime());
    const activeKey = active ? `${dayKey}-${active.startSlot}` : null;

    if (active && activeKey !== state.activeKey && nowMs - active.start.getTime() < 15000) {
      state.activeKey = activeKey;
      state.warned5 = null;
      const title = "🔔 Inizia: " + active.subject.name;
      const body = `${active.subject.teacher} · ${active.subject.room}\n${SLOT_START[active.startSlot]}–${SLOT_END[active.endSlot]}`;
      if (state.settings.sound) playBell();
      if (state.settings.notifications && "Notification" in window && Notification.permission === "granted" && document.visibilityState === "hidden") {
        try {
          const n = new Notification(title, { body, tag: activeKey, icon: "icon-192.png", badge: "icon-192.png", silent: !state.settings.sound });
          n.onclick = () => { window.focus(); n.close(); };
        } catch {}
      }
    }
    if (!active) state.activeKey = null;

    if (active && state.warned5 !== activeKey && (active.end.getTime()-nowMs) <= 5*60*1000 && (active.end.getTime()-nowMs) > 4*60*1000) {
      state.warned5 = activeKey;
      if (state.settings.notifications && "Notification" in window && Notification.permission === "granted") {
        try { new Notification("⏰ 5 minuti alla fine", { body: `${active.subject.name} termina alle ${SLOT_END[active.endSlot]}`, tag: activeKey+"-5min", icon: "icon-192.png", silent: !state.settings.sound }); } catch {}
      }
    }
  }

  // ============ SETTINGS DRAWER ============
  function openDrawer() {
    drawerOverlay.classList.add("open");
    $("setNotifications").checked = state.settings.notifications;
    $("setSound").checked = state.settings.sound;
    $("set24h").checked = state.settings.hour24;
    document.querySelectorAll(".theme-btn").forEach(b => b.classList.toggle("active", b.dataset.theme === getStoredTheme()));
    if (state.deferredPrompt) $("installBtn").hidden = false;
  }
  function closeDrawer() { drawerOverlay.classList.remove("open"); }

  // ============ PWA ============
  function registerSW() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("sw.js").catch(()=>{});
    }
  }
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    state.deferredPrompt = e;
    if (drawerOverlay.classList.contains("open")) $("installBtn").hidden = false;
  });
  window.addEventListener("appinstalled", () => { state.deferredPrompt = null; $("installBtn").hidden = true; });

  // ============ SHARE ============
  async function share() {
    const url = window.location.href, text = "Orario classe 3Ai — stagione 26/27";
    try {
      if (navigator.share) await navigator.share({ title: "Orario 3Ai", text, url });
      else await navigator.clipboard.writeText(text + " " + url);
    } catch {}
  }

  // ============ INIT ============
  function init() {
    loadSettings();
    loadNotes();
    injectIcons();
    applyTheme(getStoredTheme());

    // view from URL
    const params = new URLSearchParams(window.location.search);
    const v = params.get("view");
    if (v === "week" || v === "teachers" || v === "today") state.view = v;

    renderDayTabs();
    renderNotes();
    setView(state.view);

    // events
    $("shareBtn").addEventListener("click", share);
    $("themeBtn").addEventListener("click", toggleTheme);
    $("settingsBtn").addEventListener("click", openDrawer);
    $("drawerClose").addEventListener("click", closeDrawer);
    drawerOverlay.addEventListener("click", (e) => { if (e.target === drawerOverlay) closeDrawer(); });
    document.querySelectorAll(".nav-btn").forEach(b => b.addEventListener("click", () => setView(b.dataset.view)));
    document.querySelectorAll(".theme-btn").forEach(b => b.addEventListener("click", () => { storeTheme(b.dataset.theme); applyTheme(b.dataset.theme); }));

    $("setNotifications").addEventListener("change", (e) => {
      state.settings.notifications = e.target.checked; saveSettings();
      if (e.target.checked && "Notification" in window && Notification.permission === "default") {
        Notification.requestPermission().catch(()=>{});
      }
    });
    $("setSound").addEventListener("change", (e) => { state.settings.sound = e.target.checked; saveSettings(); });
    $("set24h").addEventListener("change", (e) => { state.settings.hour24 = e.target.checked; saveSettings(); });
    $("installBtn").addEventListener("click", async () => {
      if (!state.deferredPrompt) return;
      state.deferredPrompt.prompt();
      try { await state.deferredPrompt.userChoice; } catch {}
      state.deferredPrompt = null; $("installBtn").hidden = true;
    });
    teacherSearch.addEventListener("input", (e) => { teacherSearchTerm = e.target.value; renderTeachers(); });

    // first tick + interval
    tick();
    setInterval(tick, 1000);

    // request notification permission if enabled
    if (state.settings.notifications && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(()=>{});
    }
    registerSW();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
