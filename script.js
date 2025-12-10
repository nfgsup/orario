// --- FIREBASE CONFIG ---
const FIREBASE_URL = 'https://orario-warnings-default-rtdb.europe-west1.firebasedatabase.app';
const ADMIN_PASSWORD = 'nfgsup2025'; // Cambia questa password!

// --- DATI ---
let firebaseWarnings = []; // Avvisi caricati da Firebase
const schedule = {
    Monday: ['S.T.A. INF', 'Religione', 'Inglese', 'Chimica', 'Fisica'],
    Tuesday: ['S.T.A. INF', 'Storia', 'Chimica', 'Lab. TTRG', 'Matematica', 'Inglese'],
    Wednesday: ['Grammatica', 'Matematica', 'Matematica', 'Sc. Mot. Sport', 'Sc. Mot. Sport'],
    Thursday: ['Diritto - Ec.', 'Lab. Fisica', 'Biologia', 'T.T.R.G.', 'Antologia', 'Antologia'],
    Friday: ['Grammatica', 'Lab. Chimica', 'Fisica', 'Biologia', 'Matematica'],
    Saturday: ['T.T.R.G.', 'S.T.A. INF', 'Inglese', 'Diritto - Ec.', 'Storia']
};

const times = {
    Monday: ['08:05', '09:05', '10:05', '11:05', '12:05'],
    Tuesday: ['08:05', '09:05', '10:05', '11:05', '12:05', '13:05'],
    Wednesday: ['08:05', '09:05', '10:05', '11:05', '12:05'],
    Thursday: ['08:05', '09:05', '10:05', '11:05', '12:05', '13:05'],
    Friday: ['08:05', '09:05', '10:05', '11:05', '12:05'],
    Saturday: ['08:05', '09:05', '10:05', '11:05', '12:05']
};

const endOfDay = {
    Monday: '13:05',
    Tuesday: '14:05',
    Wednesday: '13:05',
    Thursday: '14:05',
    Friday: '13:05',
    Saturday: '13:05'
};

const festivi = ["2025-09-23"]; // Formato YYYY-MM-DD (backup locale)
const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const translateDay = {
    'Monday': 'Lunedì', 'Tuesday': 'Martedì', 'Wednesday': 'Mercoledì',
    'Thursday': 'Giovedì', 'Friday': 'Venerdì', 'Saturday': 'Sabato', 'Sunday': 'Domenica'
};

// --- FIREBASE FUNCTIONS ---
async function fetchWarnings() {
    try {
        const response = await fetch(`${FIREBASE_URL}/warnings.json`);
        const data = await response.json();
        if (data) {
            // Converti oggetto in array
            firebaseWarnings = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            }));
        } else {
            firebaseWarnings = [];
        }
        renderWarnings();
        renderAdminWarningsList();
    } catch (error) {
        console.error('Errore caricamento avvisi:', error);
    }
}

async function addWarningToFirebase(warning) {
    try {
        const response = await fetch(`${FIREBASE_URL}/warnings.json`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(warning)
        });
        if (response.ok) {
            fetchWarnings(); // Ricarica avvisi
            return true;
        }
    } catch (error) {
        console.error('Errore aggiunta avviso:', error);
    }
    return false;
}

async function deleteWarningFromFirebase(id) {
    try {
        const response = await fetch(`${FIREBASE_URL}/warnings/${id}.json`, {
            method: 'DELETE'
        });
        if (response.ok) {
            fetchWarnings(); // Ricarica avvisi
            return true;
        }
    } catch (error) {
        console.error('Errore eliminazione avviso:', error);
    }
    return false;
}

function renderWarnings() {
    const warningsDiv = document.getElementById('warningsArea');
    warningsDiv.innerHTML = '';
    
    const now = new Date();
    const todayISO = now.toISOString().split('T')[0];
    
    firebaseWarnings.forEach(warning => {
        // Se ha una data, controlla se è scaduto
        if (warning.date && warning.date < todayISO) return;
        
        let iconClass = 'fa-exclamation-triangle';
        let boxClass = 'warning-box';
        
        if (warning.type === 'holiday') {
            iconClass = 'fa-calendar-xmark';
            boxClass = 'warning-box holiday';
        } else if (warning.type === 'info') {
            iconClass = 'fa-info-circle';
            boxClass = 'warning-box info';
        }
        
        let dateText = '';
        if (warning.date) {
            const d = new Date(warning.date);
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = String(d.getFullYear()).slice(-2);
            dateText = ` (${day}/${month}/${year})`;
        }
        
        warningsDiv.innerHTML += `
            <div class="${boxClass}">
                <i class="fas ${iconClass}"></i>
                <span>${warning.message}${dateText}</span>
            </div>
        `;
    });
}

function renderAdminWarningsList() {
    const listDiv = document.getElementById('activeWarningsList');
    if (!listDiv) return;
    
    if (firebaseWarnings.length === 0) {
        listDiv.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">Nessun avviso attivo</p>';
        return;
    }
    
    listDiv.innerHTML = '';
    firebaseWarnings.forEach(warning => {
        let dateDisplay = '';
        if (warning.date) {
            const d = new Date(warning.date);
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = String(d.getFullYear()).slice(-2);
            dateDisplay = `${day}/${month}/${year}`;
        }
        listDiv.innerHTML += `
            <div class="admin-warning-item">
                <div class="admin-warning-text">
                    <strong>${warning.message}</strong>
                    ${dateDisplay ? `<br><small>${dateDisplay}</small>` : ''}
                </div>
                <button class="admin-delete-btn" onclick="deleteWarning('${warning.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    });
}

// --- ADMIN PANEL FUNCTIONS ---
let adminAuthenticated = false;

function toggleAdminPanel() {
    const overlay = document.getElementById('adminOverlay');
    overlay.classList.toggle('show');
    
    if (overlay.classList.contains('show')) {
        if (adminAuthenticated) {
            document.getElementById('adminLogin').style.display = 'none';
            document.getElementById('adminContent').style.display = 'block';
            renderAdminWarningsList();
            renderNotes();
        } else {
            document.getElementById('adminLogin').style.display = 'block';
            document.getElementById('adminContent').style.display = 'none';
        }
    }
}

function switchAdminTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.admin-tab[onclick="switchAdminTab('${tab}')"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(tab + 'Tab').classList.add('active');
    
    // Refresh content
    if (tab === 'compiti') {
        renderNotes();
    } else {
        renderAdminWarningsList();
    }
}

function checkAdminPassword() {
    const password = document.getElementById('adminPassword').value;
    if (password === ADMIN_PASSWORD) {
        adminAuthenticated = true;
        document.getElementById('adminLogin').style.display = 'none';
        document.getElementById('adminContent').style.display = 'block';
        renderAdminWarningsList();
        renderNotes();
    } else {
        alert('Password errata!');
    }
}

async function addWarning() {
    const message = document.getElementById('warningMessage').value.trim();
    const date = document.getElementById('warningDate').value;
    const type = document.getElementById('warningType').value;
    
    if (!message) {
        alert('Inserisci un messaggio!');
        return;
    }
    
    const warning = {
        message: message,
        type: type,
        createdAt: new Date().toISOString()
    };
    
    if (date) {
        warning.date = date;
    }
    
    const success = await addWarningToFirebase(warning);
    if (success) {
        document.getElementById('warningMessage').value = '';
        document.getElementById('warningDate').value = '';
        alert('Avviso pubblicato! ✅');
    } else {
        alert('Errore durante la pubblicazione');
    }
}

async function deleteWarning(id) {
    if (confirm('Sei sicuro di voler eliminare questo avviso?')) {
        await deleteWarningFromFirebase(id);
    }
}

// --- ICON MAPPING ---
function getSubjectIcon(subject) {
    const sub = subject.toLowerCase();
    if (sub.includes('inf')) return '<i class="fas fa-laptop-code"></i>';
    if (sub.includes('religione')) return '<i class="fas fa-hands-praying"></i>';
    if (sub.includes('inglese')) return '<i class="fas fa-language"></i>';
    if (sub.includes('chimica')) return '<i class="fas fa-flask"></i>';
    if (sub.includes('fisica')) return '<i class="fas fa-atom"></i>';
    if (sub.includes('storia')) return '<i class="fas fa-landmark"></i>';
    if (sub.includes('matematica')) return '<i class="fas fa-calculator"></i>';
    if (sub.includes('mot') || sub.includes('sport')) return '<i class="fas fa-running"></i>';
    if (sub.includes('diritto')) return '<i class="fas fa-scale-balanced"></i>';
    if (sub.includes('biologia')) return '<i class="fas fa-dna"></i>';
    if (sub.includes('ttrg') || sub.includes('t.t.r.g')) return '<i class="fas fa-compass-drafting"></i>';
    if (sub.includes('antologia') || sub.includes('grammatica')) return '<i class="fas fa-book-open"></i>';
    return '<i class="fas fa-book"></i>';
}

// --- LOGICA PRINCIPALE ---
let lastDisplayDay = null; // Per evitare di ricostruire timeline inutilmente
let timelineBuilt = false;

function updateSchedule() {
    const now = new Date();
    const userSelection = document.getElementById('daySelect').value;
    const todayName = weekdays[now.getDay()];
    const todayISO = now.toISOString().split('T')[0];
    
    // 1. Determina il Giorno da visualizzare
    let displayDay = userSelection || todayName;
    let isSunday = (displayDay === 'Sunday');
    let isHoliday = festivi.includes(todayISO);
    let schoolOver = false;
    
    // Se non c'è override utente, controlla se la scuola è finita per oggi
    if (!userSelection && !isSunday && !isHoliday) {
        const endParts = endOfDay[todayName].split(':');
        const endDate = new Date();
        endDate.setHours(parseInt(endParts[0]), parseInt(endParts[1]), 0);
        
        if (now > endDate) {
            // Scuola finita -> Mostra domani
            schoolOver = true;
            let nextIdx = (now.getDay() + 1) % 7;
            displayDay = weekdays[nextIdx];
            if (displayDay === 'Sunday') displayDay = 'Monday'; // Salta domenica
        }
    } else if (isSunday) {
            displayDay = 'Monday'; // Default a Lunedì se è domenica
    }

    // Recupera dati per il giorno visualizzato
    const daySchedule = schedule[displayDay];
    const dayTimes = times[displayDay];
    
    // Aggiorna titolo sezione Timeline
    let displayLabel = translateDay[displayDay];
    if (schoolOver && !userSelection) displayLabel += " (Domani)";
    else if (isSunday && !userSelection) displayLabel += " (Domani)";
    document.getElementById('timelineTitle').innerText = `Programma di ${displayLabel}`;

    // Warnings vengono renderizzati da renderWarnings() che legge da Firebase

    // --- RENDER TIMELINE & LOGICA ORA CORRENTE ---
    const timelineList = document.getElementById('timelineList');
    
    // Ricostruisci la timeline solo se il giorno è cambiato
    const shouldRebuildTimeline = (displayDay !== lastDisplayDay) || !timelineBuilt;
    
    if (shouldRebuildTimeline) {
        timelineList.innerHTML = '';
        lastDisplayDay = displayDay;
        timelineBuilt = true;
    }
    
    let activeFound = false;
    let currentSubjectName = "Tempo Libero";
    let currentIcon = '<i class="fas fa-couch"></i>';
    let currentTimeRange = "Goditi il riposo";
    let nextSubjectName = "--";
    let statusText = schoolOver ? "A domani" : (isSunday ? "Weekend" : "Fuori orario");
    
    // Reset Progress Bars se non siamo a scuola
    document.getElementById('lessonProgressBar').style.width = '0%';
    document.getElementById('dayProgressBar').style.width = '0%';
    document.getElementById('countdownBig').innerText = "--:--";
    document.getElementById('activeClassUI').style.opacity = '0.3';

    if (daySchedule) {
        let dayStartObj, dayEndObj; // Per barra giornaliera
        
        daySchedule.forEach((sub, index) => {
            // Calcola orari lezione
            const [sh, sm] = dayTimes[index].split(':');
            const start = new Date();
            // Importante: se stiamo visualizzando domani, le date devono essere manipolate,
            // ma per la logica "active" ci interessa solo se displayDay == todayName E non è finito.
            start.setHours(sh, sm, 0, 0);

            let end = new Date();
            if (index < daySchedule.length - 1) {
                const [nh, nm] = dayTimes[index + 1].split(':');
                end.setHours(nh, nm, 0, 0);
            } else {
                const [eh, em] = endOfDay[displayDay].split(':');
                end.setHours(eh, em, 0, 0);
            }

            // Per calcolo barra giornaliera
            if (index === 0) dayStartObj = start;
            if (index === daySchedule.length - 1) dayEndObj = end;

            // Stato lezione
            let isActive = false;
            let isDone = false;
            
            // Active logic funziona solo se stiamo guardando il giorno CORRENTE reale
            if (!userSelection && displayDay === weekdays[now.getDay()] && !schoolOver) {
                if (now >= start && now < end) {
                    isActive = true;
                    activeFound = true;
                    
                    // Populate Hero
                    currentSubjectName = sub;
                    currentIcon = getSubjectIcon(sub);
                    statusText = "In Corso";
                    currentTimeRange = `${dayTimes[index]} - ${index < daySchedule.length - 1 ? dayTimes[index+1] : endOfDay[displayDay]}`;
                    nextSubjectName = (index + 1 < daySchedule.length) ? daySchedule[index+1] : "Uscita";

                    // Countdown Logic
                    const totalDuration = end - start;
                    const elapsed = now - start;
                    const pct = (elapsed / totalDuration) * 100;
                    const remaining = end - now;
                    
                    const m = Math.floor(remaining / 60000);
                    const s = Math.floor((remaining % 60000) / 1000);
                    
                    document.getElementById('countdownBig').innerText = `${m}:${s < 10 ? '0'+s : s}`;
                    document.getElementById('lessonProgressBar').style.width = `${pct}%`;
                    document.getElementById('activeClassUI').style.opacity = '1';
                } else if (now >= end) {
                    isDone = true;
                }
            }

            // Creazione Elemento Timeline (solo se dobbiamo ricostruire)
            if (shouldRebuildTimeline) {
                const item = document.createElement('div');
                item.className = `timeline-item ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`;
                if(isActive) item.classList.add('pulse-text');

                item.innerHTML = `
                    <div class="t-time">${dayTimes[index]}</div>
                    <div class="t-line"><div class="t-dot"></div></div>
                    <div class="t-info">
                        <div class="t-subject">${sub}</div>
                        <div class="t-duration">${getSubjectIcon(sub)} Lezione ${index+1}</div>
                    </div>
                `;
                timelineList.appendChild(item);
            } else {
                // Aggiorna solo le classi degli item esistenti
                const existingItem = timelineList.children[index];
                if (existingItem) {
                    existingItem.className = `timeline-item ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`;
                    if(isActive) existingItem.classList.add('pulse-text');
                }
            }
        });

        // Calcolo barra giornaliera (Solo se è oggi e siamo a scuola)
        if(activeFound && dayStartObj && dayEndObj) {
            const dayTotal = dayEndObj - dayStartObj;
            const dayElapsed = now - dayStartObj;
            const dayPct = Math.max(0, Math.min(100, (dayElapsed / dayTotal) * 100));
            document.getElementById('dayProgressBar').style.width = `${dayPct}%`;
        } else if (schoolOver) {
            document.getElementById('dayProgressBar').style.width = `100%`;
        }
    }

    // Update DOM Hero Text
    document.getElementById('heroSubject').innerText = currentSubjectName;
    document.getElementById('heroIcon').innerHTML = currentIcon;
    document.getElementById('schoolStatus').innerText = statusText;
    document.getElementById('schoolStatus').style.color = activeFound ? 'var(--accent)' : 'var(--text-muted)';
    document.getElementById('heroTime').innerText = currentTimeRange;
    document.getElementById('nextSubjectText').innerText = nextSubjectName;
    
    // Colore status
    if(activeFound) document.getElementById('heroCard').style.borderColor = 'var(--accent)';
    else document.getElementById('heroCard').style.borderColor = 'var(--card-border)';
}

function updateClock() {
    const now = new Date();
    document.getElementById('liveClock').innerText = now.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }) + ' ' + now.toLocaleTimeString();
}

// --- POPUP LOGIC ---
function checkPopup() {
    // Controlla se l'utente ha già visto la V2
    if (!localStorage.getItem('nfgsup_v2_seen')) {
        setTimeout(() => {
            document.getElementById('welcomePopup').classList.add('show');
        }, 500); // Ritardo scenico di mezzo secondo
    }
}

function closePopup() {
    document.getElementById('welcomePopup').classList.remove('show');
    // Salva nel browser che l'utente ha visto il popup
    localStorage.setItem('nfgsup_v2_seen', 'true');
}

// --- VACATION COUNTDOWN ---
const VACATION_START = '2025-12-23'; // Inizio vacanze di Natale

function updateVacationCountdown() {
    const now = new Date();
    const vacation = new Date(VACATION_START);
    const diff = vacation - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    const vacationCard = document.getElementById('vacationCard');
    const vacationDays = document.getElementById('vacationDays');
    
    if (days > 0) {
        vacationDays.innerText = `${days} giorn${days === 1 ? 'o' : 'i'}`;
        vacationCard.style.display = 'flex';
    } else if (days >= -14) {
        // Durante le vacanze
        vacationDays.innerText = 'VACANZE! 🎉';
        document.querySelector('.vacation-label').innerText = 'Buone';
        vacationCard.style.display = 'flex';
    } else {
        vacationCard.style.display = 'none';
    }
}

// --- STATISTICS ---
function updateStats() {
    const now = new Date();
    const todayName = weekdays[now.getDay()];
    const daySchedule = schedule[todayName] || [];
    
    // Conta materie uniche
    const uniqueSubjects = [...new Set(daySchedule)];
    const totalHours = daySchedule.length;
    
    // Materia più frequente oggi
    const freq = {};
    daySchedule.forEach(s => freq[s] = (freq[s] || 0) + 1);
    const mostFrequent = Object.keys(freq).sort((a, b) => freq[b] - freq[a])[0] || '--';
    
    const statsGrid = document.getElementById('statsGrid');
    statsGrid.innerHTML = `
        <div class="stat-item">
            <div class="stat-value">${totalHours}</div>
            <div class="stat-label">Ore Oggi</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${uniqueSubjects.length}</div>
            <div class="stat-label">Materie</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${mostFrequent.split(' ')[0]}</div>
            <div class="stat-label">Più Frequente</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${freq[mostFrequent] || 0}h</div>
            <div class="stat-label">Ore ${mostFrequent.split(' ')[0]}</div>
        </div>
    `;
}

// --- NOTES / COMPITI (FIREBASE) ---
let notes = [];

async function fetchNotes() {
    try {
        const response = await fetch(`${FIREBASE_URL}/notes.json`);
        const data = await response.json();
        if (data) {
            notes = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            }));
        } else {
            notes = [];
        }
        renderNotes();
    } catch (error) {
        console.error('Errore caricamento compiti:', error);
    }
}

async function addNote() {
    const subject = document.getElementById('noteSubject').value;
    const text = document.getElementById('noteText').value.trim();
    const date = document.getElementById('noteDate').value;
    
    if (!text) {
        alert('Inserisci una descrizione!');
        return;
    }
    
    const note = {
        subject,
        text,
        date,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    try {
        const response = await fetch(`${FIREBASE_URL}/notes.json`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(note)
        });
        
        if (response.ok) {
            fetchNotes();
            document.getElementById('noteText').value = '';
            document.getElementById('noteDate').value = '';
            alert('Compito salvato! ✅');
        }
    } catch (error) {
        console.error('Errore aggiunta compito:', error);
        alert('Errore durante il salvataggio');
    }
}

async function toggleNote(id) {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    
    try {
        await fetch(`${FIREBASE_URL}/notes/${id}.json`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed: !note.completed })
        });
        fetchNotes();
    } catch (error) {
        console.error('Errore toggle compito:', error);
    }
}

async function deleteNote(id) {
    if (!confirm('Eliminare questo compito?')) return;
    
    try {
        await fetch(`${FIREBASE_URL}/notes/${id}.json`, {
            method: 'DELETE'
        });
        fetchNotes();
    } catch (error) {
        console.error('Errore eliminazione compito:', error);
    }
}

function renderNotes() {
    const list = document.getElementById('notesList');
    if (!list) return;
    
    // Filtra note scadute completate (più di 2 giorni fa)
    const now = new Date();
    const validNotes = notes.filter(n => {
        if (!n.date || !n.completed) return true;
        const noteDate = new Date(n.date);
        const diff = now - noteDate;
        return diff < (2 * 24 * 60 * 60 * 1000);
    });
    
    if (validNotes.length === 0) {
        list.innerHTML = '<p class="notes-empty">Nessun compito salvato</p>';
        return;
    }
    
    // Ordina: non completati prima, poi per data
    const sorted = [...validNotes].sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return new Date(a.date || '9999') - new Date(b.date || '9999');
    });
    
    list.innerHTML = sorted.map(n => {
        const dateStr = n.date ? (() => {
            const d = new Date(n.date);
            return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth()+1).padStart(2, '0')}`;
        })() : '';
        
        return `
            <div class="note-item ${n.completed ? 'completed' : ''}">
                <input type="checkbox" class="note-checkbox" ${n.completed ? 'checked' : ''} onchange="toggleNote('${n.id}')">
                <div class="note-content">
                    <div class="note-subject">${n.subject}</div>
                    <div class="note-text">${n.text}</div>
                    ${dateStr ? `<div class="note-date">📅 ${dateStr}</div>` : ''}
                </div>
                <button class="note-delete" onclick="deleteNote('${n.id}')"><i class="fas fa-trash"></i></button>
            </div>
        `;
    }).join('');
    
    // Aggiorna anche la lista pubblica
    renderPublicNotes(validNotes);
}

// Lista pubblica compiti (senza controlli admin)
function renderPublicNotes(validNotes) {
    const publicList = document.getElementById('publicNotesList');
    if (!publicList) return;
    
    // Mostra solo compiti non completati
    const pending = validNotes.filter(n => !n.completed);
    
    if (pending.length === 0) {
        publicList.innerHTML = '<p class="notes-empty">Nessun compito da fare 🎉</p>';
        return;
    }
    
    // Ordina per data
    const sorted = [...pending].sort((a, b) => {
        return new Date(a.date || '9999') - new Date(b.date || '9999');
    });
    
    publicList.innerHTML = sorted.map(n => {
        const dateStr = n.date ? (() => {
            const d = new Date(n.date);
            return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth()+1).padStart(2, '0')}`;
        })() : '';
        
        return `
            <div class="note-item-public">
                <div class="note-content">
                    <div class="note-subject">${n.subject}</div>
                    <div class="note-text">${n.text}</div>
                    ${dateStr ? `<div class="note-date">📅 ${dateStr}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// --- WHATSAPP SHARE ---
function shareOnWhatsApp() {
    const now = new Date();
    const todayName = weekdays[now.getDay()];
    const daySchedule = schedule[todayName] || [];
    const dayTimes = times[todayName] || [];
    
    let msg = `📚 *Orario di ${translateDay[todayName]}*\n\n`;
    daySchedule.forEach((sub, i) => {
        msg += `${dayTimes[i]} - ${sub}\n`;
    });
    msg += `\n🔗 Vedi su: https://nfgsup.github.io/orario/`;
    
    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
}

// --- THEME TOGGLE ---
function toggleTheme() {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    localStorage.setItem('orario_theme', isLight ? 'light' : 'dark');
    
    // Update icon
    const icon = document.querySelector('#themeToggle i');
    icon.className = isLight ? 'fas fa-moon' : 'fas fa-sun';
}

function loadTheme() {
    const saved = localStorage.getItem('orario_theme');
    if (saved === 'light') {
        document.body.classList.add('light-theme');
        document.querySelector('#themeToggle i').className = 'fas fa-moon';
    }
}

// --- BELL SOUND ---
let lastHourPlayed = -1;

function checkBellSound() {
    const now = new Date();
    const todayName = weekdays[now.getDay()];
    const dayTimes = times[todayName] || [];
    
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    // Controlla se è l'inizio di una lezione
    if (dayTimes.includes(currentTime) && now.getSeconds() < 2) {
        if (lastHourPlayed !== now.getHours()) {
            playBell();
            lastHourPlayed = now.getHours();
            
            // Vibrazione se supportata
            if (navigator.vibrate) {
                navigator.vibrate([200, 100, 200]);
            }
        }
    }
}

function playBell() {
    const bell = document.getElementById('bellSound');
    if (bell) {
        bell.volume = 0.5;
        bell.play().catch(e => console.log('Audio blocked:', e));
    }
}

// --- SERVICE WORKER (PWA) ---
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/orario/sw.js')
        .then(reg => console.log('SW registered'))
        .catch(err => console.log('SW failed:', err));
}

// Event Listeners
document.getElementById('daySelect').addEventListener('change', updateSchedule);

// Init loops
setInterval(() => {
    updateSchedule();
    updateClock();
    checkBellSound();
}, 1000);

// Prima chiamata
updateSchedule();
updateClock();
checkPopup();
fetchWarnings();
fetchNotes(); // Carica compiti da Firebase
updateVacationCountdown();
updateStats();
loadTheme();

// Ricarica avvisi e compiti ogni 30 secondi
setInterval(fetchWarnings, 30000);
setInterval(fetchNotes, 30000);
