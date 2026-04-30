import { login, registerAuth } from "../services/authService.js";
import { createUserProfile } from "../services/userService.js";
import { showMessage, requireNoAuth } from "./utils.js";

requireNoAuth();

const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const btn = loginForm.querySelector("button");
    btn.disabled = true;
    try {
      await login(email, password);
      window.location.href = "/dashboard.html";
    } catch (error) {
      showMessage("loginError", "Errore di accesso: " + error.message, true);
      btn.disabled = false;
    }
  });
}

const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nome = document.getElementById("nome").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const btn = registerForm.querySelector("button");
    btn.disabled = true;
    
    try {
      const userCredential = await registerAuth(email, password);
      const user = userCredential.user;
      await createUserProfile(user.uid, {
        nome,
        email,
        ruolo: "user"
      });
      window.location.href = "/dashboard.html";
    } catch (error) {
      showMessage("registerError", "Errore di registrazione: " + error.message, true);
      btn.disabled = false;
    }
  });
}
