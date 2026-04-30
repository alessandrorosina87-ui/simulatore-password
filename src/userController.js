import { saveGeneratedPassword, getUserPasswords } from "../services/passwordService.js";
import { getUserProfile } from "../services/userService.js";
import { logout } from "../services/authService.js";
import { showMessage, formatDate, requireAuth } from "./utils.js";
import { calculateSecurity, formatTime, generatePassword, detectCharset } from "./passwordGenerator.js";

let currentUser = null;
let simulationInterval = null;

// Utility functions for UI formatting and simulation
function formatNumberScientific(num) {
  if (num < 1000000) return Math.floor(num).toLocaleString('it-IT');
  return num.toExponential(2).replace('e+', ' × 10^');
}

function getRandomChar() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
  return chars.charAt(Math.floor(Math.random() * chars.length));
}

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

const form = document.getElementById("generatorForm");
if (form) {
  const lengthSlider = document.getElementById("lengthSlider");
  const lengthDisplay = document.getElementById("lengthDisplay");
  const pwInput = document.getElementById("customPassword");
  const charsetSelect = document.getElementById("charsetSelect");
  const speedSelect = document.getElementById("speedSelect");
  
  const combinationsOut = document.getElementById("combinationsOut");
  const timeOut = document.getElementById("timeOut");
  const securityBadge = document.getElementById("securityBadge");
  const eduTip = document.getElementById("eduTip");
  
  const terminalOut = document.getElementById("terminalOut");
  const terminalContainer = document.getElementById("terminalContainer");
  const progressBar = document.getElementById("progressBar");
  const simBtn = document.getElementById("simBtn");

  // Auto-detect on custom password typing
  pwInput?.addEventListener("input", () => {
    const val = pwInput.value;
    if (val.length > 0) {
      lengthSlider.value = val.length;
      lengthDisplay.textContent = val.length;
      charsetSelect.value = detectCharset(val);
    }
    updateCalculations();
  });

  lengthSlider?.addEventListener("input", (e) => {
    lengthDisplay.textContent = e.target.value;
    updateCalculations();
  });

  charsetSelect?.addEventListener("change", updateCalculations);
  speedSelect?.addEventListener("change", updateCalculations);

  function updateCalculations() {
    const length = parseInt(lengthSlider.value);
    const charsetSize = parseInt(charsetSelect.value);
    const speed = parseFloat(speedSelect.value);

    const { combinations, timeSeconds } = calculateSecurity(length, charsetSize, speed);

    combinationsOut.textContent = formatNumberScientific(combinations);
    timeOut.textContent = formatTime(timeSeconds);

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

  // Initial calculation
  updateCalculations();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (simulationInterval) clearInterval(simulationInterval);
    
    simBtn.disabled = true;
    simBtn.textContent = "Simulazione in corso...";
    
    const length = parseInt(lengthSlider.value);
    const charsetSize = parseInt(charsetSelect.value);
    const speed = parseFloat(speedSelect.value);
    
    let targetPw = pwInput.value;
    if (!targetPw) {
      targetPw = generatePassword(length, charsetSize);
      pwInput.value = targetPw; // Show what is being cracked
    }

    const { combinations, timeSeconds } = calculateSecurity(length, charsetSize, speed);
    const realTime = timeSeconds;

    // determine UI animation duration
    let duration = 3000;
    if (realTime < 1) duration = 1000;
    else if (realTime < 60) duration = 2000;

    let startTime = Date.now();
    progressBar.style.transition = 'none';
    progressBar.style.width = '0%';
    progressBar.style.background = 'var(--primary)';

    // force reflow
    void progressBar.offsetWidth;

    progressBar.style.transition = `width ${duration}ms linear`;
    progressBar.style.width = '100%';

    let fullTerminalText = "Inizializzazione cluster GPU...\nCaricamento dizionario bypassato.\nAvvio attacco forza bruta...\n\n";
    terminalOut.textContent = fullTerminalText;
    terminalContainer.scrollTop = terminalContainer.scrollHeight;

    simulationInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const percent = Math.min(1, elapsed / duration);
        const currentSimTime = realTime * percent;
        
        let timeLabel = "";
        if (currentSimTime > 1e12) timeLabel = currentSimTime.toExponential(2) + "s";
        else if (currentSimTime < 1) timeLabel = currentSimTime.toFixed(3) + "s";
        else timeLabel = Math.floor(currentSimTime).toLocaleString('it-IT') + "s";
        
        let block = "";
        for(let i=0; i<8; i++) {
            let attempt = "";
            for(let j=0; j<length; j++) attempt += getRandomChar();
            block += `[${timeLabel}] [TRY] ${attempt}  => Access Denied\n`;
        }
        
        fullTerminalText += block;
        terminalOut.textContent = fullTerminalText;
        terminalContainer.scrollTop = terminalContainer.scrollHeight;

        if (elapsed >= duration) {
            clearInterval(simulationInterval);
            finishSimulation(targetPw, combinations, timeSeconds, fullTerminalText);
        }
    }, 100);
  });

  async function finishSimulation(targetPw, combinations, timeSeconds, fullTerminalText) {
    fullTerminalText += `\n\n[SUCCESS] Collisione trovata!\n[!] PASSWORD IDENTIFICATA: ${targetPw}\n\nTerminazione processo.\n`;
    terminalOut.textContent = fullTerminalText;
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
