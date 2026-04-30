import { saveGeneratedPassword, getUserPasswords } from "../services/passwordService.js";
import { getUserProfile } from "../services/userService.js";
import { logout } from "../services/authService.js";
import { showMessage, formatDate, requireAuth } from "./utils.js";
import { calculateSecurity, formatTime, generatePassword } from "./passwordGenerator.js";

let currentUser = null;

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
  
  lengthSlider?.addEventListener("input", (e) => {
    lengthDisplay.textContent = e.target.value;
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const length = parseInt(lengthSlider.value);
    const charset = parseInt(document.getElementById("charsetSelect").value);
    const speed = 1000000000; 

    const password = generatePassword(length, charset);
    const { combinations, timeSeconds } = calculateSecurity(length, charset, speed);
    
    document.getElementById("resultPassword").textContent = password;
    document.getElementById("resultTime").textContent = formatTime(timeSeconds);

    try {
      await saveGeneratedPassword(currentUser.uid, {
        password_generata: password,
        criteri: { lunghezza: length, charset: charset },
        combinations: combinations,
        timeSeconds: timeSeconds
      });
      loadHistory();
      showMessage("genMsg", "Password salvata nello storico!");
    } catch (err) {
      showMessage("genMsg", "Errore nel salvataggio: " + err.message, true);
    }
  });
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
