import { getAllUsers } from "../services/userService.js";
import { getAllPasswords } from "../services/passwordService.js";
import { getUserProfile } from "../services/userService.js";
import { logout } from "../services/authService.js";
import { requireAuth, formatDate } from "./utils.js";

requireAuth(async (user) => {
  try {
    const profile = await getUserProfile(user.uid);
    if (!profile || profile.ruolo !== "admin") {
      alert("Accesso negato. Area riservata agli amministratori.");
      window.location.href = "/dashboard.html";
      return;
    }
    loadAdminData();
  } catch (error) {
    console.error("Admin check failed", error);
    window.location.href = "/dashboard.html";
  }
});

document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  await logout();
  window.location.href = "/login.html";
});

async function loadAdminData() {
  try {
    const [users, passwords] = await Promise.all([
      getAllUsers(),
      getAllPasswords()
    ]);

    const tbody = document.getElementById("adminUsersBody");
    if (!tbody) return;
    
    tbody.innerHTML = "";
    users.forEach(u => {
      const userPws = passwords.filter(p => p.user_id === u.uid);
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${u.nome || 'N/A'}</td>
        <td>${u.email}</td>
        <td>${u.ruolo}</td>
        <td>${userPws.length}</td>
        <td>${formatDate(u.createdAt)}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch(e) {
    console.error("Errore admin:", e);
    alert("Errore caricamento dati admin: " + e.message);
  }
}
