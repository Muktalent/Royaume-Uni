// v20 · Online status of the team.
// 1) startPresence(api): every signed-in staff workspace sends a heartbeat (45 s, and when the tab is shown or hidden).
// 2) watchTeamPresence(api, host): Admin → Equipo shows who is online, away or offline and refreshes every 30 s.
// Failures are silent: if the database migration is missing, the status is simply not shown.
const HEARTBEAT_MS = 45000;
const REFRESH_MS = 30000;
const LABEL = { online: 'En línea', away: 'Ausente', offline: 'Desconectado' };

let beat = null;

export function startPresence(api) {
  stopPresence();
  const send = state => api('/api/presence', { method: 'POST', body: JSON.stringify({ state }) }).catch(() => {});
  const visible = () => document.visibilityState !== 'hidden';
  const tick = () => send(visible() ? 'active' : 'away');
  const onVisibility = () => tick();
  const timer = setInterval(tick, HEARTBEAT_MS);
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('focus', onVisibility);
  beat = { timer, onVisibility };
  tick();
  return stopPresence;
}

export function stopPresence() {
  if (!beat) return;
  clearInterval(beat.timer);
  document.removeEventListener('visibilitychange', beat.onVisibility);
  window.removeEventListener('focus', beat.onVisibility);
  beat = null;
}

export function lastSeenText(iso, now = Date.now()) {
  if (!iso) return 'Sin conexiones registradas';
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return 'Sin conexiones registradas';
  const min = Math.max(0, Math.round((now - t) / 60000));
  if (min < 1) return 'Activo hace un momento';
  const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
  if (min < 60) return 'Visto ' + rtf.format(-min, 'minute');
  const h = Math.round(min / 60);
  if (h < 24) return 'Visto ' + rtf.format(-h, 'hour');
  const d = Math.round(h / 24);
  if (d < 30) return 'Visto ' + rtf.format(-d, 'day');
  return 'Visto el ' + new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' }).format(new Date(t));
}

// Small "● En línea" label. Kept in sync by watchTeamPresence through data-presence-uid.
export function presenceLabel(userId) {
  const el = document.createElement('span');
  el.className = 'mt-presence';
  el.dataset.presenceUid = userId;
  el.dataset.state = 'unknown';
  el.hidden = true;
  el.append(document.createElement('i'), document.createElement('span'));
  el.lastChild.textContent = '';
  return el;
}

// Dot on the corner of a team photo card.
export function presenceDot(userId) {
  const el = document.createElement('span');
  el.className = 'mt-presence-dot';
  el.dataset.presenceUid = userId;
  el.hidden = true;
  return el;
}

function paint(host, map, now) {
  for (const el of host.querySelectorAll('[data-presence-uid]')) {
    const row = map.get(el.dataset.presenceUid);
    const state = row?.status || 'offline';
    el.dataset.state = state;
    el.hidden = false;
    const text = state === 'offline' ? lastSeenText(row?.last_seen_at, now) : LABEL[state];
    el.title = state === 'offline' ? text : LABEL[state] + ' · ' + lastSeenText(row?.last_seen_at, now);
    if (el.classList.contains('mt-presence')) el.lastChild.textContent = text;
    else el.setAttribute('aria-label', el.title);
  }
}

function summary(bar, team, map) {
  if (!bar) return;
  const ids = team.filter(p => p.account_active !== false).map(p => p.user_id);
  const count = s => ids.filter(id => (map.get(id)?.status || 'offline') === s).length;
  bar.hidden = false;
  bar.replaceChildren();
  const part = (n, text, state) => { const s = document.createElement('span'); s.className = 'mt-presence'; s.dataset.state = state; const i = document.createElement('i'); const b = document.createElement('b'); b.textContent = n; s.append(i, b, document.createTextNode(text)); return s; };
  const note = document.createElement('small');
  note.textContent = 'Se actualiza cada 30 s · ' + new Intl.DateTimeFormat('es-ES', { timeStyle: 'short' }).format(new Date());
  bar.append(part(count('online'), ' en línea', 'online'), part(count('away'), ' ausentes', 'away'), part(count('offline'), ' desconectados', 'offline'), note);
}

export function presenceBar() {
  const bar = document.createElement('div');
  bar.className = 'mt-presence-bar';
  bar.setAttribute('role', 'status');
  bar.setAttribute('aria-live', 'polite');
  bar.hidden = true;
  return bar;
}

// Loads the team status now and every 30 s while `alive` (default: host) stays on screen. Returns a getter for the last map.
export function watchTeamPresence(api, host, { team = [], bar = null, onUpdate = null, alive = host } = {}) {
  let map = new Map(), stopped = false, timer = null;
  const load = async () => {
    if (stopped) return;
    if (!alive.isConnected) { stop(); return; } // the team tab was closed
    if (document.visibilityState === 'hidden') return;
    try {
      const r = await api('/api/admin/team/presence');
      if (r.available === false) { stop(); return; }
      map = new Map((r.data || []).map(x => [x.user_id, x]));
      paint(host, map, Date.now());
      summary(bar, team, map);
      onUpdate?.(map);
    } catch { /* status is optional */ }
  };
  const stop = () => { stopped = true; clearInterval(timer); };
  timer = setInterval(load, REFRESH_MS);
  load();
  return { stop, get: () => map, repaint: () => paint(host, map, Date.now()) };
}
