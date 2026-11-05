// muk-v17 · Capa común de los paneles (administración, equipo y estudiantes):
// tema de color, navegación inferior en móvil, avisos inteligentes, "desde tu última visita",
// progreso visual, microanimaciones y PWA (manifest + service worker).
const E = (t, v, c) => { const n = document.createElement(t); if (v !== undefined && v !== null) n.textContent = String(v); if (c) n.className = c; return n; };
const NS = 'http://www.w3.org/2000/svg';
const P = {
  user: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M4 21a8 8 0 0 1 16 0'], flow: ['M4 6h10', 'M4 12h16', 'M4 18h7', 'm17 3 3 3-3 3'],
  doc: ['M7 3h7l5 5v13H7z', 'M14 3v5h5', 'M10 13h6M10 17h4'], pen: ['M4 20h4L19 9l-4-4L4 16z', 'm13 7 4 4'], mail: ['M4 6h16v12H4z', 'm4 7 8 6 8-6'],
  chat: ['M4 5h16v11H8l-4 4V5Z'], task: ['m5 12 4 4 10-10'], cal: ['M7 3v3M17 3v3M4 8h16', 'M5 5h14v15H5z'], bell: ['M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z', 'M10 20a2 2 0 0 0 4 0'],
  more: ['M5 12h.01M12 12h.01M19 12h.01'], close: ['M6 6l12 12M18 6 6 18'], spark: ['M12 3v4M12 17v4M3 12h4M17 12h4', 'm6 6 2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6']
};
export function icon(name, cls = 'v17-i') { const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true'); s.setAttribute('class', cls); s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor'); s.setAttribute('stroke-width', '1.7'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round'); for (const d of P[name] || P.spark) { const p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); s.append(p); } return s; }
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const store = { get: k => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { } } };

const TX = {
  es: {
    since: 'Desde tu última visita', activity: 'Actividad reciente', first: 'Novedades de los últimos 7 días', upToDate: 'Todo al día. No hay cambios desde tu última visita.', ago: 'hace {t}', now: 'ahora mismo',
    morning: 'Buenos días', afternoon: 'Buenas tardes', evening: 'Buenas noches', alerts: 'Activar avisos', alertsOn: 'Avisos activados', more: 'Más', close: 'Cerrar', seeAll: 'Ver todo', fewer: 'Ver menos',
    t: {candidate: 'Nuevo candidato', stage: 'Cambio de etapa', enquiry: 'Nueva consulta', hrdoc: 'Documento de equipo', document: 'Documento', task: 'Nueva tarea', event: 'Nueva fecha', message: 'Mensajes nuevos'},
    msgToast: n => n === 1 ? 'Tienes 1 mensaje nuevo' : `Tienes ${n} mensajes nuevos`, open: 'Abrir', st: {signed: 'firmado', sent: 'enviado', submitted: 'recibido', approved: 'aprobado', rejected: 'rechazado', viewed: 'visto', uploaded: 'subido', requested: 'solicitado', done: 'completada', in_progress: 'en curso', pending: 'pendiente'}
  },
  en: {
    since: 'Since your last visit', activity: 'Recent activity', first: 'What changed in the last 7 days', upToDate: 'All caught up. Nothing has changed since your last visit.', ago: '{t} ago', now: 'just now',
    morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening', alerts: 'Turn on alerts', alertsOn: 'Alerts on', more: 'More', close: 'Close', seeAll: 'See all', fewer: 'Show less',
    t: {candidate: 'New candidate', stage: 'Stage update', enquiry: 'New enquiry', hrdoc: 'HR document', document: 'Document', task: 'New task', event: 'New date', message: 'New messages'},
    msgToast: n => n === 1 ? 'You have 1 new message' : `You have ${n} new messages`, open: 'Open', st: {signed: 'signed', sent: 'sent', submitted: 'received', approved: 'approved', rejected: 'needs changes', viewed: 'viewed', uploaded: 'uploaded', requested: 'requested', done: 'completed', in_progress: 'in progress', pending: 'pending'}
  },
  fr: {
    since: 'Depuis votre dernière visite', activity: 'Activité récente', first: 'Les nouveautés des 7 derniers jours', upToDate: 'Tout est à jour. Rien n’a changé depuis votre dernière visite.', ago: 'il y a {t}', now: 'à l’instant',
    morning: 'Bonjour', afternoon: 'Bon après-midi', evening: 'Bonsoir', alerts: 'Activer les alertes', alertsOn: 'Alertes activées', more: 'Plus', close: 'Fermer', seeAll: 'Tout voir', fewer: 'Voir moins',
    t: {candidate: 'Nouveau candidat', stage: 'Étape mise à jour', enquiry: 'Nouvelle demande', hrdoc: 'Document RH', document: 'Document', task: 'Nouvelle tâche', event: 'Nouvelle date', message: 'Nouveaux messages'},
    msgToast: n => n === 1 ? 'Vous avez 1 nouveau message' : `Vous avez ${n} nouveaux messages`, open: 'Ouvrir', st: {signed: 'signé', sent: 'envoyé', submitted: 'reçu', approved: 'validé', rejected: 'à corriger', viewed: 'vu', uploaded: 'déposé', requested: 'demandé', done: 'terminée', in_progress: 'en cours', pending: 'à venir'}
  }
};
const tx = l => TX[l] || TX.en;
const ICON_OF = {candidate: 'user', stage: 'flow', enquiry: 'mail', hrdoc: 'pen', document: 'doc', task: 'task', event: 'cal', message: 'chat'};
const TONE_OF = {candidate: 'teal', stage: 'sage', enquiry: 'champ', hrdoc: 'champ', document: 'teal', task: 'sage', event: 'champ', message: 'teal'};

export function greeting(lang, name) {
  const L = tx(lang), h = new Date().getHours(); const g = h < 13 ? L.morning : h < 20 ? L.afternoon : L.evening;
  const first = String(name || '').trim().split(/\s+/)[0]; return first ? `${g}, ${first}` : g;
}
function ago(at, lang) {
  const L = tx(lang), s = Math.max(0, (Date.now() - new Date(at).getTime()) / 1000);
  if (s < 60) return L.now;
  const rtf = new Intl.RelativeTimeFormat(lang, {numeric: 'auto', style: 'short'});
  if (s < 3600) return rtf.format(-Math.round(s / 60), 'minute'); if (s < 86400) return rtf.format(-Math.round(s / 3600), 'hour'); return rtf.format(-Math.round(s / 86400), 'day');
}

// ---------------- Tema, PWA y microanimaciones ----------------
let applied = false;
export function applyV17({role = 'admin', lang = 'es'} = {}) {
  const html = document.documentElement; html.classList.add('v17'); html.dataset.v17Role = role;
  // v18 · Teclado abierto en el móvil: la barra inferior se oculta para no subir encima del teclado.
  if (!html.dataset.v17Kb && window.visualViewport) { html.dataset.v17Kb = '1'; const vv = window.visualViewport; let base = vv.height, bw = innerWidth; const kb = () => { if (innerWidth !== bw) { bw = innerWidth; base = vv.height; } base = Math.max(base, vv.height); const t = document.activeElement; const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable); html.classList.toggle('v17-kb', !!typing && vv.height < base * 0.8); }; vv.addEventListener('resize', kb); addEventListener('focusin', () => setTimeout(kb, 300)); addEventListener('focusout', () => setTimeout(kb, 120)); }
  if (!document.getElementById('mukV17Css')) { const l = E('link'); l.id = 'mukV17Css'; l.rel = 'stylesheet'; l.href = '/admin/muk-v17.css?v=21.0.0'; document.head.append(l); }
  else document.head.append(document.getElementById('mukV17Css')); // siempre la última hoja
  let m = document.querySelector('meta[name=theme-color]'); if (!m) { m = E('meta'); m.name = 'theme-color'; document.head.append(m); } m.content = '#2B2A28';
  let mf = document.querySelector('link[rel=manifest]'); if (!mf) { mf = E('link'); mf.rel = 'manifest'; document.head.append(mf); } mf.href = '/admin/team.webmanifest?v=17';
  for (const [n, c] of [['apple-mobile-web-app-capable', 'yes'], ['mobile-web-app-capable', 'yes'], ['apple-mobile-web-app-status-bar-style', 'black-translucent'], ['apple-mobile-web-app-title', 'MUK Talent']]) { let x = document.querySelector(`meta[name="${n}"]`); if (!x) { x = E('meta'); x.name = n; document.head.append(x); } x.content = c; }
  if (!document.querySelector('link[rel=apple-touch-icon]')) { const a = E('link'); a.rel = 'apple-touch-icon'; a.href = '/icon-192.png'; document.head.append(a); }
  if (applied) return; applied = true;
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('/sw.js', {scope: '/'}).catch(() => { });
  countUp();
}
// Números que "cuentan" al aparecer (métricas de los paneles).
function countUp() {
  if (reduced() || typeof MutationObserver === 'undefined') return;
  const seen = new WeakSet();
  const run = el => {
    if (seen.has(el)) return; const txt = el.textContent.trim(); if (!/^\d{1,6}$/.test(txt)) return; seen.add(el);
    const end = Number(txt); if (end < 2) return; const t0 = performance.now(), dur = Math.min(900, 300 + end * 12);
    const step = t => { if (!el.isConnected) return; const p = Math.min(1, (t - t0) / dur), v = Math.round(end * (1 - Math.pow(1 - p, 3))); el.textContent = String(v); if (p < 1) requestAnimationFrame(step); else el.textContent = txt; };
    requestAnimationFrame(step);
  };
  const scan = root => root.querySelectorAll?.('.metric strong, .lx-metric strong, .lx-metric .lx-value, .gp-ready strong').forEach(run);
  new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1) { if (n.matches?.('.metric strong,.lx-metric strong')) run(n); scan(n); } }).observe(document.body, {childList: true, subtree: true});
}

// ---------------- Navegación inferior (móvil) ----------------
// items: [{id,label,icon(Node),onClick,badge?}] · máx. 4 + "Más" (hoja con el resto).
export function bottomNav({host = document.body, items, more = [], lang = 'es', id = 'v17Dock'}) {
  document.getElementById(id)?.remove();
  const L = tx(lang); const nav = E('nav', undefined, 'v17-dock'); nav.id = id; nav.setAttribute('aria-label', 'Navegación');
  const btns = {};
  const make = (it) => { const b = E('button', undefined, 'v17-dock-btn'); b.type = 'button'; b.dataset.id = it.id; b.append(it.icon?.cloneNode ? it.icon.cloneNode(true) : icon(it.icon || 'spark', 'v17-dock-i'), E('span', it.label)); b.onclick = () => { it.onClick(); }; btns[it.id] = b; return b; };
  for (const it of items) nav.append(make(it));
  if (more.length) {
    const b = E('button', undefined, 'v17-dock-btn'); b.type = 'button'; b.dataset.id = '__more'; b.append(icon('more', 'v17-dock-i'), E('span', L.more)); b.setAttribute('aria-haspopup', 'dialog');
    b.onclick = () => sheet(L.more, more.map(m => ({...m, onClick: () => { m.onClick(); }})), lang); nav.append(b); btns.__more = b;
  }
  host.append(nav);
  return {
    el: nav,
    setActive(idv) { const inMore = more.some(m => m.id === idv); for (const [k, b] of Object.entries(btns)) { const on = k === idv || (k === '__more' && inMore); b.classList.toggle('is-on', on); if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); } },
    badge(idv, n) { const b = btns[idv]; if (!b) return; let d = b.querySelector('.v17-dock-badge'); if (!d) { d = E('i', undefined, 'v17-dock-badge'); b.append(d); } d.textContent = n > 99 ? '99+' : String(n || ''); d.hidden = !n; }
  };
}
export function sheet(title, items, lang = 'es') {
  const L = tx(lang); document.getElementById('v17Sheet')?.remove();
  const o = E('div', undefined, 'v17-sheet'); o.id = 'v17Sheet'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); o.setAttribute('aria-label', title);
  const card = E('div', undefined, 'v17-sheet-card'); const grip = E('span', undefined, 'v17-grip'); const h = E('h2', title);
  const list = E('div', undefined, 'v17-sheet-list');
  const close = () => { o.classList.remove('in'); setTimeout(() => o.remove(), reduced() ? 0 : 220); document.removeEventListener('keydown', esc); };
  const esc = e => { if (e.key === 'Escape') close(); };
  for (const it of items) { const b = E('button', undefined, 'v17-sheet-btn'); b.type = 'button'; b.append(it.icon?.cloneNode ? it.icon.cloneNode(true) : icon(it.icon || 'spark'), E('span', it.label)); b.onclick = () => { close(); it.onClick(); }; list.append(b); }
  const x = E('button', L.close, 'v17-sheet-close'); x.type = 'button'; x.onclick = close;
  card.append(grip, h, list, x); o.append(card); o.onclick = e => { if (e.target === o) close(); };
  document.body.append(o); document.addEventListener('keydown', esc); requestAnimationFrame(() => o.classList.add('in')); list.querySelector('button')?.focus({preventScroll: true});
  return close;
}

// ---------------- Avisos (toasts) ----------------
function toastHost() { let h = document.getElementById('v17Toasts'); if (!h) { h = E('div', undefined, 'v17-toasts'); h.id = 'v17Toasts'; h.setAttribute('role', 'status'); h.setAttribute('aria-live', 'polite'); document.body.append(h); } return h; }
export function toast({title, body = '', tone = 'teal', iconName = 'bell', action = null, actionLabel = '', ms = 6000}) {
  const h = toastHost(); while (h.children.length >= 3) h.firstChild.remove();
  const t = E('div', undefined, 'v17-toast v17-tone-' + tone); const ic = E('span', undefined, 'v17-toast-ic'); ic.append(icon(iconName));
  const tx_ = E('div', undefined, 'v17-toast-tx'); tx_.append(E('strong', title)); if (body) tx_.append(E('span', body));
  t.append(ic, tx_);
  if (action) { const b = E('button', actionLabel, 'v17-toast-go'); b.type = 'button'; b.onclick = () => { dismiss(); action(); }; t.append(b); }
  const x = E('button', undefined, 'v17-toast-x'); x.type = 'button'; x.setAttribute('aria-label', 'Cerrar'); x.append(icon('close')); x.onclick = () => dismiss(); t.append(x);
  h.append(t); requestAnimationFrame(() => t.classList.add('in'));
  let timer = setTimeout(() => dismiss(), ms); t.onmouseenter = () => clearTimeout(timer); t.onmouseleave = () => { timer = setTimeout(() => dismiss(), 2500); };
  function dismiss() { clearTimeout(timer); t.classList.remove('in'); t.classList.add('out'); setTimeout(() => t.remove(), reduced() ? 0 : 260); }
  return dismiss;
}
async function systemNotify(title, body) {
  try {
    if (!('Notification' in window) || Notification.permission !== 'granted' || !document.hidden) return false;
    const reg = await navigator.serviceWorker?.getRegistration?.();
    if (reg) await reg.showNotification(title, {body, icon: '/icon-192.png', badge: '/icon-192.png', tag: 'muk-' + title}); else new Notification(title, {body, icon: '/icon-192.png'});
    return true;
  } catch { return false; }
}

// ---------------- Desde tu última visita ----------------
const describe = (it, lang, labels = {}) => {
  const L = tx(lang), st = s => L.st[s] || s || '';
  switch (it.type) {
    case 'candidate': return [it.name, it.ref].filter(Boolean).join(' · ');
    case 'stage': return [it.name || labels.stage?.(it.key) || it.key, labels.stageName?.(it.stage) || it.stage || st(it.status)].filter(Boolean).join(' → ');
    case 'enquiry': return it.name || '';
    case 'hrdoc': return [it.title, st(it.status), it.name].filter(Boolean).join(' · ');
    case 'document': return [it.name, it.label, st(it.status)].filter(Boolean).join(' · ');
    case 'task': return it.title || ''; case 'event': return [it.title, it.date].filter(Boolean).join(' · ');
    case 'message': return L.msgToast(it.count || 1);
    default: return it.title || '';
  }
};
/**
 * Tarjeta de novedades + avisos inteligentes.
 * opts: {api, host, before?, userKey, lang, name, progress:{label,value,max,hint}|null, labels, onOpen(it), onMessages()}
 */
export function mountUpdates(opts) {
  const {api, userKey, lang = 'es'} = opts; const L = tx(lang);
  const KEY = 'muk-lv:' + userKey, SKEY = 'muk-lv-s:' + userKey;
  // "since" estable durante la sesión: la visita anterior queda fija hasta cerrar la pestaña.
  let since = null; try { since = sessionStorage.getItem(SKEY); } catch { }
  const prev = store.get(KEY);
  if (!since) { since = prev || ''; try { sessionStorage.setItem(SKEY, since || 'first'); } catch { } }
  if (since === 'first') since = '';
  const first = !since;
  const markSeen = () => store.set(KEY, new Date().toISOString());
  addEventListener('pagehide', markSeen); document.addEventListener('visibilitychange', () => { if (document.hidden) markSeen(); });
  setTimeout(markSeen, 45000);

  const card = E('section', undefined, 'v17-updates'); card.id = 'v17Updates'; card.setAttribute('aria-label', L.since);
  const head = E('header', undefined, 'v17-up-head'); const hgroup = E('div');
  hgroup.append(E('p', first ? L.first : L.since, 'v17-overline'), E('h2', opts.title === 'activity' ? L.activity : (opts.title || greeting(lang, opts.name))));
  const alertsB = E('button', undefined, 'v17-chip'); alertsB.type = 'button';
  const paintAlerts = () => { const on = 'Notification' in window && Notification.permission === 'granted'; alertsB.replaceChildren(icon('bell'), E('span', on ? L.alertsOn : L.alerts)); alertsB.classList.toggle('is-on', on); alertsB.disabled = on || !('Notification' in window) || Notification.permission === 'denied'; alertsB.hidden = !('Notification' in window); };
  alertsB.onclick = async () => { try { await Notification.requestPermission(); } catch { } paintAlerts(); }; paintAlerts();
  head.append(hgroup, alertsB); card.append(head);
  const prog = E('div', undefined, 'v17-progress'); card.append(prog);
  const list = E('ul', undefined, 'v17-up-list'); card.append(list);
  const toggle = E('button', L.seeAll, 'v17-link'); toggle.type = 'button'; toggle.hidden = true; card.append(toggle);
  let expanded = false; toggle.onclick = () => { expanded = !expanded; toggle.textContent = expanded ? L.fewer : L.seeAll; list.classList.toggle('is-open', expanded); };

  const setProgress = p => {
    prog.replaceChildren(); prog.hidden = !p; if (!p) return;
    const pct = Math.max(0, Math.min(100, Math.round((p.value / Math.max(1, p.max)) * 100)));
    const top = E('div', undefined, 'v17-progress-top'); top.append(E('span', p.label), E('b', p.text || pct + '%'));
    const bar = E('div', undefined, 'v17-bar'); bar.setAttribute('role', 'progressbar'); bar.setAttribute('aria-valuemin', '0'); bar.setAttribute('aria-valuemax', '100'); bar.setAttribute('aria-valuenow', String(pct)); bar.setAttribute('aria-label', p.label);
    const fill = E('i'); bar.append(fill); prog.append(top, bar); if (p.hint) prog.append(E('small', p.hint));
    requestAnimationFrame(() => requestAnimationFrame(() => { fill.style.width = pct + '%'; }));
  };
  setProgress(opts.progress || null);

  const draw = items => {
    list.replaceChildren();
    if (!items.length) { const li = E('li', undefined, 'v17-up-empty'); li.append(icon('task'), E('span', L.upToDate)); list.append(li); toggle.hidden = true; return; }
    items.forEach((it, i) => {
      const li = E('li', undefined, 'v17-up-item v17-tone-' + (TONE_OF[it.type] || 'teal')); li.style.setProperty('--i', String(i));
      const b = E(opts.onOpen ? 'button' : 'div', undefined, 'v17-up-row'); if (b.tagName === 'BUTTON') { b.type = 'button'; b.onclick = () => opts.onOpen(it); }
      const ic = E('span', undefined, 'v17-up-ic'); ic.append(icon(ICON_OF[it.type] || 'spark'));
      const tx_ = E('span', undefined, 'v17-up-tx'); tx_.append(E('strong', L.t[it.type] || it.type), E('span', describe(it, lang, opts.labels)));
      b.append(ic, tx_, E('time', ago(it.at, lang))); li.append(b); list.append(li);
    });
    toggle.hidden = items.length <= 4;
  };
  list.append(E('li', '…', 'v17-up-empty'));
  let known = new Set();
  const keyOf = it => [it.type, it.ref || it.name || it.key || it.title || it.label, it.stage || it.status || '', it.at].join('|');
  async function fetchItems(from) { const r = await api('/api/updates' + (from ? '?since=' + encodeURIComponent(from) : '')); return r.data?.items || []; }
  (async () => { try { const items = await fetchItems(since); items.forEach(i => known.add(keyOf(i))); draw(items); } catch { draw([]); } })();

  // Avisos inteligentes: sólo lo nuevo desde que se abrió la sesión, agrupado, sin repetir.
  const started = new Date().toISOString(); let busy = false;
  const poll = async () => {
    if (busy || document.hidden && !('Notification' in window && Notification.permission === 'granted')) return; busy = true;
    try {
      const fresh = (await fetchItems(started)).filter(i => !known.has(keyOf(i)) && i.type !== 'message');
      fresh.forEach(i => known.add(keyOf(i)));
      if (fresh.length) {
        const all = await fetchItems(since).catch(() => null); if (all) draw(all);
        if (fresh.length === 1) { const it = fresh[0]; const t = L.t[it.type], d = describe(it, lang, opts.labels); if (!(await systemNotify(t, d))) toast({title: t, body: d, tone: TONE_OF[it.type], iconName: ICON_OF[it.type], action: opts.onOpen ? () => opts.onOpen(it) : null, actionLabel: L.open}); }
        else { const t = `${fresh.length} · ${L.since}`; const d = fresh.slice(0, 3).map(i => L.t[i.type]).join(' · '); if (!(await systemNotify(t, d))) toast({title: t, body: d, tone: 'champ', iconName: 'bell'}); }
      }
    } catch { } finally { busy = false; }
  };
  const timer = setInterval(() => { if (!card.isConnected && !document.getElementById('v17Updates')) return; poll(); }, 90000);
  return {el: card, setProgress, refresh: async () => { try { draw(await fetchItems(since)); } catch { } }, stop: () => clearInterval(timer)};
}

// Mensajes nuevos → aviso agrupado (se alimenta del resumen de notificaciones ya existente).
export function messageNotifier({lang = 'es', onOpen}) {
  const L = tx(lang); let last = null;
  return summary => {
    const n = summary?.chat_unread || 0;
    if (last !== null && n > last) { const t = L.msgToast(n); systemNotify(L.t.message, t).then(done => { if (!done) toast({title: L.t.message, body: t, tone: 'teal', iconName: 'chat', action: onOpen, actionLabel: L.open}); }); }
    last = n;
  };
}
