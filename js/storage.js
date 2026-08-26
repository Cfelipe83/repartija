export const CURRENT_STATE_KEY = "albion_payouts_pro_state";
export const LEDGER_KEY = "albion_payouts_pro_ledger";

export function sanitize(num) {
  const val = Number(num);
  return isNaN(val) || val < 0 ? 0 : val;
}

export function formatSilver(val) {
  return Math.round(val || 0).toLocaleString('es-CL');
}

export function safeSetText(id, text) {
  const el = document.getElementById(id);
  if (el) el.innerText = text;
}

export function saveState(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn("Storage quota exceeded", e);
  }
}

export function loadState(key) {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}