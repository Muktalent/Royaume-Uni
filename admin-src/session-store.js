// session-v11 · Same-device sessions that stay open until the end of the local day.
// Supabase keeps its tokens here. "Remember this device" uses localStorage; otherwise sessionStorage (closes with the tab).
// A day stamp is written at sign-in; when the calendar day changes the stored session is discarded.
const DAY = 'muk-auth-day', REMEMBER = 'muk-auth-remember', KEY = 'muk-auth';
const safe = fn => { try { return fn(); } catch { return null; } };
export function today() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
export function rememberDevice() { return safe(() => localStorage.getItem(REMEMBER)) !== '0'; }
export function setRememberDevice(on) { safe(() => localStorage.setItem(REMEMBER, on ? '1' : '0')); }
function purge() {
  for (const s of [localStorage, sessionStorage]) safe(() => { for (const k of Object.keys(s)) if (k === DAY || k.startsWith(KEY)) s.removeItem(k); });
}
export function sessionExpired() { const d = safe(() => localStorage.getItem(DAY)); return !!d && d !== today(); }
export const deviceStorage = {
  getItem(k) { if (sessionExpired()) { purge(); return null; } return safe(() => localStorage.getItem(k)) ?? safe(() => sessionStorage.getItem(k)); },
  setItem(k, v) {
    const keep = rememberDevice();
    safe(() => (keep ? localStorage : sessionStorage).setItem(k, v));
    safe(() => (keep ? sessionStorage : localStorage).removeItem(k));
    if (!safe(() => localStorage.getItem(DAY))) safe(() => localStorage.setItem(DAY, today()));
  },
  removeItem(k) { safe(() => localStorage.removeItem(k)); safe(() => sessionStorage.removeItem(k)); if (k === KEY) safe(() => localStorage.removeItem(DAY)); }
};
export const AUTH_OPTIONS = { persistSession: true, storage: deviceStorage, storageKey: KEY, autoRefreshToken: true };
// Calls onEnd once when the day changes while the app is open (checked every minute and when the tab becomes visible).
let watcher = null;
export function watchDayEnd(onEnd) {
  if (watcher) { clearInterval(watcher.t); document.removeEventListener('visibilitychange', watcher.v); }
  const check = () => { if (sessionExpired()) { stopWatch(); purge(); Promise.resolve(onEnd?.()).catch(() => {}); } };
  watcher = { t: setInterval(check, 60000), v: () => { if (document.visibilityState === 'visible') check(); } };
  document.addEventListener('visibilitychange', watcher.v);
}
export function stopWatch() { if (watcher) { clearInterval(watcher.t); document.removeEventListener('visibilitychange', watcher.v); watcher = null; } }
