export const showMessage = (elementId, message, isError = false) => {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = message;
  el.style.color = isError ? 'var(--danger)' : 'var(--success)';
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 3000);
};

export const formatDate = (isoString) => {
  if (!isoString) return 'N/A';
  const date = new Date(isoString);
  return date.toLocaleString('it-IT');
};

export const requireAuth = (callback) => {
  import('../services/authService.js').then(({ onAuthChange }) => {
    onAuthChange(user => {
      if (!user) {
        window.location.href = '/login.html';
      } else {
        if(callback) callback(user);
      }
    });
  });
};

export const requireNoAuth = (callback) => {
  import('../services/authService.js').then(({ onAuthChange }) => {
    onAuthChange(user => {
      if (user) {
        window.location.href = '/dashboard.html';
      } else {
        if(callback) callback();
      }
    });
  });
};
