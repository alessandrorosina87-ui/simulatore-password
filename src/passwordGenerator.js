// ============================================================
// passwordGenerator.js — Modulo di calcolo e generazione
// ============================================================
// Questo modulo contiene tutta la logica matematica per:
// - Rilevare il charset di una password inserita dall'utente
// - Calcolare il numero di combinazioni possibili
// - Stimare il tempo di cracking
// - Generare password casuali
// - Generare tentativi SEQUENZIALI coerenti (brute force realistico)
// ============================================================

// --- CHARSET: le stringhe di caratteri per ogni dimensione ---
const CHARSETS = {
  10: "0123456789",
  26: "abcdefghijklmnopqrstuvwxyz",
  52: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
  62: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  94: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-="
};

/**
 * Rileva il charset appropriato analizzando i caratteri nella stringa.
 * Restituisce la dimensione del charset (10, 26, 52, 62, 94).
 */
export const detectCharset = (str) => {
  if (!str) return 62;
  const hasNum   = /[0-9]/.test(str);
  const hasLower = /[a-z]/.test(str);
  const hasUpper = /[A-Z]/.test(str);
  const hasSym   = /[^a-zA-Z0-9]/.test(str);

  // Ordine: dal più complesso al più semplice
  if (hasSym) return 94;
  if (hasNum && hasLower && hasUpper) return 62;
  if (hasLower && hasUpper) return 52;
  if (hasLower && !hasNum) return 26;
  if (hasNum && !hasLower && !hasUpper) return 10;
  return 62;
};

/**
 * Calcola le combinazioni e il tempo di cracking.
 * Formula: combinazioni = charsetSize ^ length
 *          tempo = combinazioni / velocità
 */
export const calculateSecurity = (length, charsetSize, speed) => {
  const combinations = Math.pow(charsetSize, length);
  const timeSeconds = combinations / speed;
  return { combinations, timeSeconds };
};

/**
 * Formatta il tempo in una stringa leggibile (secondi → millenni).
 */
export const formatTime = (seconds) => {
  if (seconds < 0.001) return "Istantaneo";
  if (seconds < 1) return seconds.toFixed(3) + " secondi";

  const sec   = Math.floor(seconds % 60);
  const min   = Math.floor((seconds / 60) % 60);
  const hours = Math.floor((seconds / 3600) % 24);
  const days  = Math.floor((seconds / 86400) % 365);
  const years = seconds / (86400 * 365);

  if (years > 1e100) return "Infinito";
  if (years > 1e9)   return "Età dell'Universo";
  if (years >= 1000)  return `${Math.floor(years).toLocaleString('it-IT')} anni`;
  if (years >= 1) {
    let y = Math.floor(years);
    let str = `${y} ann${y === 1 ? 'o' : 'i'}`;
    if (days > 0) str += `, ${days} giorn${days === 1 ? 'o' : 'i'}`;
    return str;
  }

  let parts = [];
  if (days > 0)  parts.push(`${days}g`);
  if (hours > 0) parts.push(`${hours}h`);
  if (min > 0 && days === 0)  parts.push(`${min}m`);
  if (sec > 0 && days === 0 && hours === 0) parts.push(`${sec}s`);
  return parts.join(" ");
};

/**
 * Genera una password casuale della lunghezza e charset specificati.
 */
export const generatePassword = (length, charsetSize) => {
  const chars = CHARSETS[charsetSize] || CHARSETS[62];
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Restituisce la stringa di caratteri corrispondente alla dimensione del charset.
 */
export const getCharsetString = (charsetSize) => {
  return CHARSETS[charsetSize] || CHARSETS[62];
};

/**
 * Converte un indice numerico in una "password" sequenziale,
 * come un contatore in base N (dove N = dimensione charset).
 *
 * Esempio con charset "0123456789" e lunghezza 1:
 *   indice 0 → "0", indice 1 → "1", ..., indice 9 → "9"
 *
 * Esempio con charset "0123456789" e lunghezza 2:
 *   indice 0 → "00", indice 1 → "01", ..., indice 99 → "99"
 *
 * Questo simula un vero attacco brute force sequenziale.
 */
export const indexToPassword = (index, charsetSize, length) => {
  const chars = CHARSETS[charsetSize] || CHARSETS[62];
  const base = chars.length;
  let result = "";

  // Conversione da indice a base N, partendo dalla cifra meno significativa
  for (let i = 0; i < length; i++) {
    result = chars[index % base] + result;
    index = Math.floor(index / base);
  }
  return result;
};
