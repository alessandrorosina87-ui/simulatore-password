// ============================================================
// userController.js — Controller della Dashboard post-login
// ============================================================
// Gestisce:
// - Autenticazione e profilo utente
// - Calcolo in tempo reale delle combinazioni
// - Simulazione brute force con terminale sequenziale
// - Salvataggio storico su Firestore
// ============================================================

import { saveGeneratedPassword, getUserPasswords } from "../services/passwordService.js";
import { getUserProfile } from "../services/userService.js";
import { logout } from "../services/authService.js";
import { showMessage, formatDate, requireAuth } from "./utils.js";
import {
  calculateSecurity,
  formatTime,
  generatePassword,
  detectCharset,
  getCharsetString,
  indexToPassword
} from "./passwordGenerator.js";

let currentUser = null;
let simulationInterval = null;

// ============================================================
// UTILITY: Formattazione numeri grandi in notazione scientifica
// ============================================================
function formatNumberScientific(num) {
  if (num < 1000000) return Math.floor(num).toLocaleString('it-IT');
  return num.toExponential(2).replace('e+', ' × 10^');
}

// ============================================================
// UTILITY: Restituisce la lunghezza effettiva da usare.
// Se l'utente ha digitato una password custom, usa QUELLA lunghezza
// (non il valore dello slider, che ha min=4 e potrebbe non corrispondere).
// ============================================================
function getEffectiveLength(pwInput, lengthSlider) {
  const customPw = pwInput?.value;
  if (customPw && customPw.length > 0) {
    return customPw.length; // Lunghezza reale della password inserita
  }
  return parseInt(lengthSlider.value); // Fallback: valore dello slider
}

// ============================================================
// AUTENTICAZIONE: Verifica sessione e carica profilo
// ============================================================
requireAuth(async (user) => {
  currentUser = user;
  const profile = await getUserProfile(user.uid);
  if (profile) {
    const welcome = document.getElementById("welcomeMsg");
    if (welcome) welcome.textContent = `Benvenuto, ${profile.nome} ${profile.ruolo === 'admin' ? '(Admin)' : ''}`;
    
    if (profile.ruolo === 'admin') {
      const adminLink = document.getElementById("adminLink");
      if (adminLink) adminLink.style.display = "inline-block";
    }
  }
  loadHistory();
});

document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  await logout();
  window.location.href = "/login.html";
});

// ============================================================
// LOGICA PRINCIPALE: Form, calcoli e simulazione
// ============================================================
const form = document.getElementById("generatorForm");
if (form) {
  const lengthSlider   = document.getElementById("lengthSlider");
  const lengthDisplay  = document.getElementById("lengthDisplay");
  const pwInput        = document.getElementById("customPassword");
  const charsetSelect  = document.getElementById("charsetSelect");
  const speedSelect    = document.getElementById("speedSelect");
  
  const combinationsOut = document.getElementById("combinationsOut");
  const timeOut         = document.getElementById("timeOut");
  const securityBadge   = document.getElementById("securityBadge");
  const eduTip          = document.getElementById("eduTip");
  
  const terminalOut       = document.getElementById("terminalOut");
  const terminalContainer = document.getElementById("terminalContainer");
  const progressBar       = document.getElementById("progressBar");
  const simBtn            = document.getElementById("simBtn");

  // ----------------------------------------------------------
  // AUTO-DETECT: Quando l'utente digita una password custom,
  // aggiorna lunghezza e charset automaticamente.
  // ----------------------------------------------------------
  pwInput?.addEventListener("input", () => {
    const val = pwInput.value;
    if (val.length > 0) {
      // Aggiorna il display della lunghezza (ma NON lo slider,
      // che ha min=4 e non può rappresentare lunghezze < 4)
      lengthDisplay.textContent = val.length;
      charsetSelect.value = detectCharset(val);
    } else {
      // Se il campo è vuoto, ripristina il valore dello slider
      lengthDisplay.textContent = lengthSlider.value;
    }
    updateCalculations();
  });

  lengthSlider?.addEventListener("input", (e) => {
    // Lo slider aggiorna il display SOLO se non c'è una password custom
    if (!pwInput.value) {
      lengthDisplay.textContent = e.target.value;
    }
    updateCalculations();
  });

  charsetSelect?.addEventListener("change", updateCalculations);
  speedSelect?.addEventListener("change", updateCalculations);

  // ----------------------------------------------------------
  // CALCOLO IN TEMPO REALE: Aggiorna combinazioni, tempo e badge
  // ----------------------------------------------------------
  function updateCalculations() {
    // Usa la lunghezza EFFETTIVA (password custom o slider)
    const length      = getEffectiveLength(pwInput, lengthSlider);
    const charsetSize = parseInt(charsetSelect.value);
    const speed       = parseFloat(speedSelect.value);

    // Mostra la velocità selezionata nel label della metrica
    const speedLabel = document.getElementById("speedLabelOut");
    if (speedLabel) {
      speedLabel.textContent = `Tempo (a ${formatNumberScientific(speed)} t/s)`;
    }

    // Formula: combinazioni = charset ^ lunghezza
    const { combinations, timeSeconds } = calculateSecurity(length, charsetSize, speed, pwInput.value);

    combinationsOut.textContent = formatNumberScientific(combinations);
    timeOut.textContent = formatTime(timeSeconds);

    // Badge di sicurezza con colori semantici
    securityBadge.className = 'badge';
    if (timeSeconds < 3600) {
      securityBadge.classList.add('danger');
      securityBadge.textContent = 'Debole';
      eduTip.innerHTML = "<strong>Password Debole:</strong> Può essere forzata in pochissimo tempo. Aumenta la lunghezza o aggiungi simboli.";
      eduTip.style.borderColor = "var(--danger)";
    } else if (timeSeconds < 31536000) {
      securityBadge.classList.add('warning');
      securityBadge.textContent = 'Media';
      eduTip.innerHTML = "<strong>Password Media:</strong> Resiste ad attacchi di base. Aggiungi qualche carattere in più.";
      eduTip.style.borderColor = "var(--warning)";
    } else {
      securityBadge.classList.add('success');
      securityBadge.textContent = 'Forte';
      eduTip.innerHTML = "<strong>Password Forte:</strong> Ottima scelta! Praticamente inattaccabile con il brute force.";
      eduTip.style.borderColor = "var(--success)";
    }
  }

  // Calcolo iniziale al caricamento della pagina
  updateCalculations();

  // ----------------------------------------------------------
  // SIMULAZIONE BRUTE FORCE: Terminale sequenziale
  // ----------------------------------------------------------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (simulationInterval) clearInterval(simulationInterval);
    
    simBtn.disabled = true;
    simBtn.textContent = "Simulazione in corso...";
    
    const length      = getEffectiveLength(pwInput, lengthSlider);
    const charsetSize = parseInt(charsetSelect.value);
    const speed       = parseFloat(speedSelect.value);
    
    // Se l'utente non ha inserito una password, ne genera una casuale
    let targetPw = pwInput.value;
    if (!targetPw) {
      targetPw = generatePassword(length, charsetSize);
      pwInput.value = targetPw;
      lengthDisplay.textContent = targetPw.length;
    }

    const { combinations, timeSeconds } = calculateSecurity(length, charsetSize, speed, targetPw);

    // --- Calcola la posizione della password target nel brute force ---
    // Questo serve per mostrare tentativi che "convergono" verso la soluzione
    const charsetStr = getCharsetString(charsetSize);
    let targetIndex = 0;
    for (let i = 0; i < targetPw.length; i++) {
      const charPos = charsetStr.indexOf(targetPw[i]);
      targetIndex = targetIndex * charsetStr.length + (charPos >= 0 ? charPos : 0);
    }

    // --- Configurazione animazione terminale ---
    // Durata dell'animazione UI (non il tempo reale di cracking)
    let duration = 4000;
    if (combinations <= 20) duration = Math.max(800, combinations * 200);
    else if (combinations <= 100) duration = 2000;
    else if (timeSeconds < 1) duration = 2000;

    // Max righe visibili nel terminale (evita saturazione DOM)
    const MAX_TERMINAL_LINES = 50;

    let startTime = Date.now();
    progressBar.style.transition = 'none';
    progressBar.style.width = '0%';
    progressBar.style.background = 'var(--primary)';
    void progressBar.offsetWidth; // force reflow
    progressBar.style.transition = `width ${duration}ms linear`;
    progressBar.style.width = '100%';

    // Array di righe del terminale (limitato a MAX_TERMINAL_LINES)
    let terminalLines = [
      `$ Parametri: lunghezza=${length}, charset=${charsetSize}, velocità=${formatNumberScientific(speed)}/s`,
      `$ Combinazioni possibili: ${formatNumberScientific(combinations)}`,
      `$ Avvio attacco brute force sequenziale...`,
      ``
    ];
    terminalOut.textContent = terminalLines.join("\n");

    // --- Contatore sequenziale per tentativi ---
    // Per password con poche combinazioni (es: "1" → 10 combinazioni),
    // mostra TUTTI i tentativi reali in ordine.
    // Per password con molte combinazioni, salta avanti simulando la velocità.
    let currentIndex = 0;
    const isSmallSpace = (combinations <= MAX_TERMINAL_LINES);

    simulationInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const percent = Math.min(1, elapsed / duration);

      // Calcola il tempo simulato corrispondente
      const currentSimTime = timeSeconds * percent;
      let timeLabel;
      if (currentSimTime > 1e12) timeLabel = currentSimTime.toExponential(2) + "s";
      else if (currentSimTime < 1) timeLabel = currentSimTime.toFixed(3) + "s";
      else timeLabel = Math.floor(currentSimTime).toLocaleString('it-IT') + "s";

      if (isSmallSpace) {
        // --- CASO 1: Poche combinazioni → mostra OGNI tentativo ---
        // Es: password "1", charset numerico → mostra 0, 1, 2, ... 9
        const batchEnd = Math.min(combinations, Math.ceil(combinations * percent));
        while (currentIndex < batchEnd) {
          const attempt = indexToPassword(currentIndex, charsetSize, length);
          if (attempt === targetPw) {
            // Password trovata! (verrà gestita dalla fine dell'animazione)
          } else {
            terminalLines.push(`[${timeLabel}] [TRY] ${attempt}  => Access Denied`);
          }
          currentIndex++;
        }
      } else {
        // --- CASO 2: Molte combinazioni → mostra campioni sequenziali ---
        // Salta avanti nel "contatore" per simulare la velocità,
        // ma genera tentativi coerenti con charset e lunghezza.
        const simulatedIndex = Math.floor(targetIndex * percent);
        const linesPerTick = 6;
        for (let i = 0; i < linesPerTick; i++) {
          // Calcola un indice vicino alla posizione simulata corrente
          const offset = Math.max(0, simulatedIndex - (linesPerTick - i));
          const attempt = indexToPassword(offset, charsetSize, length);
          terminalLines.push(`[${timeLabel}] [TRY] ${attempt}  => Access Denied`);
        }
      }

      // Limita il numero di righe visibili
      if (terminalLines.length > MAX_TERMINAL_LINES + 4) {
        // Mantieni le prime 4 righe (header) + le ultime MAX_TERMINAL_LINES
        terminalLines = [
          ...terminalLines.slice(0, 4),
          `  ... (${formatNumberScientific(combinations)} tentativi totali) ...`,
          ...terminalLines.slice(-MAX_TERMINAL_LINES)
        ];
      }

      terminalOut.textContent = terminalLines.join("\n");
      terminalContainer.scrollTop = terminalContainer.scrollHeight;

      if (elapsed >= duration) {
        clearInterval(simulationInterval);
        finishSimulation(targetPw, combinations, timeSeconds, terminalLines);
      }
    }, 100);
  });

  // ----------------------------------------------------------
  // FINE SIMULAZIONE: Mostra successo e salva nello storico
  // ----------------------------------------------------------
  async function finishSimulation(targetPw, combinations, timeSeconds, terminalLines) {
    terminalLines.push(``);
    terminalLines.push(`[SUCCESS] ✓ Password trovata!`);
    terminalLines.push(`[!] PASSWORD: ${targetPw}`);
    terminalLines.push(`[!] Tentativi totali: ${formatNumberScientific(combinations)}`);
    terminalLines.push(`[!] Tempo reale stimato: ${formatTime(timeSeconds)}`);
    terminalLines.push(``);
    terminalLines.push(`$ Processo terminato.`);
    
    terminalOut.textContent = terminalLines.join("\n");
    terminalContainer.scrollTop = terminalContainer.scrollHeight;
    
    simBtn.disabled = false;
    simBtn.textContent = "Ripeti Simulazione";
    progressBar.style.background = 'var(--success)';

    try {
      await saveGeneratedPassword(currentUser.uid, {
        password_generata: targetPw,
        criteri: { lunghezza: targetPw.length, charset: parseInt(charsetSelect.value) },
        combinations: combinations,
        timeSeconds: timeSeconds
      });
      loadHistory();
      showMessage("genMsg", "Password simulata salvata nello storico!");
    } catch (err) {
      showMessage("genMsg", "Errore nel salvataggio: " + err.message, true);
    }
  }
}

// ============================================================
// STORICO: Carica le password salvate dall'utente
// ============================================================
async function loadHistory() {
  const tbody = document.getElementById("historyBody");
  if (!tbody || !currentUser) return;
  
  try {
    const passwords = await getUserPasswords(currentUser.uid);
    tbody.innerHTML = "";
    passwords.forEach(pw => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${pw.password_generata}</td>
        <td>${pw.criteri?.lunghezza || 'N/A'}</td>
        <td>${formatDate(pw.createdAt)}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch(e) {
    console.error("Error loading history", e);
  }
}
