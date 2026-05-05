import { calculateExactCombinations, calculateSecurity, formatTime } from './passwordGenerator.js';

// DOM Elements
const emailInput = document.getElementById('simEmail');
const passwordInput = document.getElementById('simPassword');
const btnStart = document.getElementById('startBtn');

const riskBadge = document.getElementById('riskBadge');
const calcTimeEl = document.getElementById('calcTime');
const dictRiskEl = document.getElementById('dictRisk');
const simTipEl = document.getElementById('simTip');

const terminalOut = document.getElementById('terminalOut');
const progressBar = document.getElementById('progressBar');

let simulationInterval = null;

// Fake dictionary of common passwords
const commonPasswords = ['123456', 'password', '123456789', '12345', '12345678', 'qwerty', 'password123', 'admin'];

window.startSimulation = function() {
    const email = emailInput.value.trim();
    const pwd = passwordInput.value;

    if (!email || !pwd) return;

    btnStart.disabled = true;
    clearInterval(simulationInterval);
    terminalOut.innerHTML = `Avvio simulazione attacco su: <span class="t-blue">${email}</span><br>`;
    progressBar.style.width = '0%';
    
    // 1. Math Analysis
    const combinations = calculateExactCombinations(pwd);
    // Let's assume an average attacker speed of a Botnet (e.g. 100 Billion ops/sec) for this demo
    const speed = 100_000_000_000; 
    const secData = calculateSecurity(combinations, speed);
    
    let isDictionary = commonPasswords.includes(pwd.toLowerCase());
    
    // 2. UI Updates
    calcTimeEl.textContent = secData.formattedTime;
    
    if (isDictionary) {
        dictRiskEl.innerHTML = `<span style="color: var(--danger)">ALTISSIMO</span>`;
        riskBadge.className = 'badge badge-danger';
        riskBadge.textContent = 'Critico';
        simTipEl.innerHTML = `Questa password è in un dizionario noto! Un attacco 'Dictionary Attack' la troverebbe istantaneamente, ignorando la matematica del Brute Force.`;
        simTipEl.style.color = 'var(--danger)';
    } else {
        dictRiskEl.innerHTML = `<span style="color: var(--success)">Basso</span>`;
        if (secData.level === 'Debole') {
            riskBadge.className = 'badge badge-danger';
            riskBadge.textContent = 'Alto Rischio';
            simTipEl.innerHTML = `Password troppo debole. Può essere forzata tramite Brute Force in pochissimo tempo. Aumenta la lunghezza.`;
            simTipEl.style.color = 'var(--warning)';
        } else if (secData.level === 'Media') {
            riskBadge.className = 'badge badge-warning';
            riskBadge.textContent = 'Rischio Moderato';
            simTipEl.innerHTML = `Sicurezza accettabile, ma aggiungi simboli o rendila più lunga per resistere ad hardware dedicato.`;
            simTipEl.style.color = 'var(--warning)';
        } else {
            riskBadge.className = 'badge badge-success';
            riskBadge.textContent = 'Sicura';
            simTipEl.innerHTML = `Ottimo. Questa password è resistente al Brute Force e non è in dizionari comuni.`;
            simTipEl.style.color = 'var(--success)';
        }
    }

    // 3. Fake Terminal Animation
    let steps = 0;
    const maxSteps = isDictionary ? 5 : 20;
    
    simulationInterval = setInterval(() => {
        steps++;
        const progress = Math.min((steps / maxSteps) * 100, 100);
        progressBar.style.width = `${progress}%`;
        
        let randomTry = Math.random().toString(36).substring(2, 8) + Math.random().toString(36).substring(2, 6);
        
        if (steps < maxSteps) {
            terminalOut.innerHTML += `<span class="t-dim">[ATTEMPT] ${email} : ${randomTry} -> Access Denied</span><br>`;
        } else {
            // End of simulation
            clearInterval(simulationInterval);
            if (isDictionary || secData.level === 'Debole') {
                terminalOut.innerHTML += `<span class="t-red">[CRACKED] Password trovata: ${pwd}</span><br>`;
                terminalOut.innerHTML += `<span class="t-red">Violazione completata! (SIMULAZIONE)</span><br>`;
            } else {
                terminalOut.innerHTML += `<span class="t-dim">[ATTEMPT] ${email} : ${randomTry} -> Access Denied</span><br>`;
                terminalOut.innerHTML += `<span class="t-green">[FAILED] L'attacco sta richiedendo troppo tempo. Il sistema ha mitigato la minaccia o il calcolo è impraticabile.</span><br>`;
            }
            terminalOut.innerHTML += `<br><span class="t-blue">Analisi conclusa.</span>`;
            btnStart.disabled = false;
        }
        
        // Auto scroll to bottom
        const termBox = document.getElementById('terminalBox');
        termBox.scrollTop = termBox.scrollHeight;
        
    }, isDictionary ? 200 : 100);
};
