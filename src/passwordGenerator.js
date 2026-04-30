export const detectCharset = (str) => {
  if (!str) return 62;
  let hasNum = /[0-9]/.test(str);
  let hasLower = /[a-z]/.test(str);
  let hasUpper = /[A-Z]/.test(str);
  let hasSym = /[^a-zA-Z0-9]/.test(str);

  if (hasSym) return 94;
  if (hasLower && hasUpper && hasNum) return 62;
  if (hasLower && hasUpper) return 52;
  if (hasLower && !hasUpper && !hasNum) return 26;
  if (!hasLower && !hasUpper && hasNum) return 10;
  return 62;
};

export const calculateSecurity = (length, charsetSize, speed) => {
  const combinations = Math.pow(charsetSize, length);
  const timeSeconds = combinations / speed;
  return { combinations, timeSeconds };
};

export const formatTime = (seconds) => {
  if (seconds < 1) return "Istantaneo";
  const sec = Math.floor(seconds % 60);
  const min = Math.floor((seconds / 60) % 60);
  const hours = Math.floor((seconds / 3600) % 24);
  const days = Math.floor((seconds / 86400) % 365);
  const years = seconds / (86400 * 365);

  if (years > 1e100) return "Infinito";
  if (years > 1e9) return "Età dell'Universo";
  if (years >= 1000) return `${Math.floor(years).toLocaleString('it-IT')} anni`;
  if (years >= 1) {
      let y = Math.floor(years);
      let str = `${y} ann${y===1?'o':'i'}`;
      if (days > 0) str += `, ${days} giorn${days===1?'o':'i'}`;
      return str;
  }

  let parts = [];
  if (days > 0) parts.push(`${days}g`);
  if (hours > 0) parts.push(`${hours}h`);
  if (min > 0 && days === 0) parts.push(`${min}m`);
  if (sec > 0 && days === 0 && hours === 0) parts.push(`${sec}s`);
  return parts.join(" ");
};

export const generatePassword = (length, charsetSize) => {
  let chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  if (charsetSize === 10) chars = "0123456789";
  else if (charsetSize === 26) chars = "abcdefghijklmnopqrstuvwxyz";
  else if (charsetSize === 52) chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  else if (charsetSize === 94) chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
  
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};
