// MUKTalent Healthcare portal · shared core (DOM helper, API, i18n, router, UI primitives).
import { P } from './i18n.js';

export const S = { sb: null, session: null, me: null, lang: 'en', pub: {}, route: [], onRoute: null };

/* ---------- DOM ---------- */
export function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  if (attrs && (typeof attrs !== 'object' || attrs instanceof Node || Array.isArray(attrs))) { kids.unshift(attrs); attrs = null; }
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k === 'style') Object.assign(el.style, v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'value' && 'value' in el) el.value = v;
    else if (k === 'checked' || k === 'selected' || k === 'disabled' || k === 'hidden' || k === 'required' || k === 'multiple') el[k] = !!v;
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  add(el, kids);
  return el;
}
function add(el, kids) {
  for (const k of kids.flat(Infinity)) {
    if (k == null || k === false || k === '') continue;
    el.appendChild(k instanceof Node ? k : document.createTextNode(String(k)));
  }
}
export const clear = (el, ...kids) => { el.replaceChildren(); add(el, kids); return el; };
export const $ = (s, r = document) => r.querySelector(s);

/* ---------- icons (stroke, 24 grid) ---------- */
const IC = {
  home: 'M3 11.5 12 4l9 7.5M5.5 10v10h13V10',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7.5 8a7.5 7.5 0 0 1 15 0',
  users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6 9a6 6 0 0 1 12 0M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14.5a6 6 0 0 1 3 5.5',
  file: 'M14 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V8L14 3Zm0 0v5h5M8.5 13h7M8.5 16.5h5',
  folder: 'M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z',
  route: 'M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm12-10a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM8 17h7.5a3.5 3.5 0 0 0 0-7h-7a3.5 3.5 0 0 1 0-7H16',
  briefcase: 'M4 8h16v11H4zM9 8V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V8M4 13h16',
  calendar: 'M4.5 6h15v14h-15zM4.5 10.5h15M8.5 3.5V7M15.5 3.5V7',
  chat: 'M4 5h16v11H9l-5 4V5Z',
  bell: 'M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Zm4 4h4',
  help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-2.5-11.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  inbox: 'M3 13h5l1.5 3h5L16 13h5M5.5 5h13L21 13v6H3v-6l2.5-8Z',
  building: 'M4 21V5l8-2v18M12 8h8v13M7.5 8h1M7.5 12h1M7.5 16h1M15.5 12h1M15.5 16h1M2.5 21h19',
  columns: 'M4 4h4.5v16H4zM10 4h4.5v10H10zM16 4h4v13h-4z',
  shield: 'M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6L12 3Zm-3 9 2.2 2.2L15.5 10',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  cog: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7.5 7.5 0 0 0-2-1.2L14.5 3h-5l-.4 2.6a7.5 7.5 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7.5 7.5 0 0 0 2 1.2l.4 2.6h5l.4-2.6a7.5 7.5 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z',
  check: 'M5 12.5 10 17l9-10',
  task: 'M9 6h11M9 12h11M9 18h11M4 5.5l1 1 2-2M4 11.5l1 1 2-2M4 17.5l1 1 2-2',
  star: 'm12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5Z',
  upload: 'M12 16V4m0 0-4.5 4.5M12 4l4.5 4.5M4 15v4.5h16V15',
  out: 'M14.5 4H19v16h-4.5M10 8l-4 4 4 4M6 12h10',
  arrow: 'M5 12h14m-5-5 5 5-5 5',
  back: 'M19 12H5m5-5-5 5 5 5',
  menu: 'M4 7h16M4 12h16M4 17h16',
  x: 'M6 6l12 12M18 6 6 18',
  lock: 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 1 1 7 0v3',
  mail: 'M3.5 6h17v12h-17zM4 6.5l8 6 8-6',
  pin: 'M12 21s-6.5-6-6.5-11a6.5 6.5 0 1 1 13 0c0 5-6.5 11-6.5 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v4.5l3 2',
  video: 'M3.5 7h12v10h-12zM15.5 10.5 20.5 7.5v9l-5-3',
  phone: 'M5 4h3.5l1.5 4.5-2 1.5a11 11 0 0 0 6 6l1.5-2L20 15.5V19a1.5 1.5 0 0 1-1.6 1.5A16 16 0 0 1 3.5 5.6 1.5 1.5 0 0 1 5 4Z',
  flag: 'M5 21V4m0 0h11l-2 4 2 4H5',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-9-9h18M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3Z',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm9 3-4-4',
  plus: 'M12 5v14M5 12h14',
  eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Zm9.5 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  download: 'M12 4v12m0 0-4.5-4.5M12 16l4.5-4.5M4 20h16',
  alert: 'M12 4 2.5 20h19L12 4Zm0 6v4.5M12 17.5h.01'
};
export function icon(name, size = 18) {
  const ns = 'http://www.w3.org/2000/svg';
  const s = document.createElementNS(ns, 'svg');
  s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('width', size); s.setAttribute('height', size);
  s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor'); s.setAttribute('stroke-width', '1.6');
  s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round'); s.setAttribute('aria-hidden', 'true');
  const p = document.createElementNS(ns, 'path'); p.setAttribute('d', IC[name] || IC.file); s.appendChild(p);
  return s;
}

/* ---------- i18n ---------- */
export const LANGS = [['en', 'English'], ['es', 'Español'], ['fr', 'Français'], ['ar', 'العربية']];
export function t(key, vars) {
  let s = (P[S.lang] && P[S.lang][key]) ?? P.en[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split('{' + k + '}').join(v);
  return s;
}
// Public-site dictionary (same strings as /healthcare/ forms), keyed by English text.
export const T = en => (S.lang !== 'en' && S.pub[S.lang] && S.pub[S.lang][en]) || en;
export function loadPublicDict(lang) {
  if (lang === 'en' || S.pub[lang]) return Promise.resolve();
  return new Promise(res => {
    const s = document.createElement('script');
    s.src = `/healthcare/assets/i18n/${lang}.js?v=19`;
    s.onload = () => { S.pub[lang] = (window.HC_I18N || {})[lang] || {}; res(); };
    s.onerror = () => res();
    document.head.appendChild(s);
  });
}
export function pickLang() {
  const q = new URLSearchParams(location.search).get('lang');
  const saved = (() => { try { return localStorage.getItem('hc-lang'); } catch { return null; } })();
  return [q, saved].find(l => ['en', 'es', 'fr', 'ar'].includes(l)) || 'en';
}
export async function setLang(lang, { persist = true } = {}) {
  S.lang = lang;
  if (persist) try { localStorage.setItem('hc-lang', lang); } catch {}
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  await loadPublicDict(lang);
}
export const team = () => { document.documentElement.lang = 'en'; document.documentElement.dir = 'ltr'; };

/* ---------- formatting ---------- */
const loc = () => (S.lang === 'en' ? 'en-GB' : S.lang === 'ar' ? 'ar-u-nu-latn' : S.lang);
export const fmtDate = (d, o = { day: 'numeric', month: 'short', year: 'numeric' }) => (d ? new Intl.DateTimeFormat(loc(), o).format(new Date(d)) : '—');
export const fmtDateTime = d => fmtDate(d, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
export const fmtTime = d => fmtDate(d, { hour: '2-digit', minute: '2-digit' });
export function ago(d) {
  if (!d) return '—';
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(loc(), { numeric: 'auto' });
  if (s < 60) return rtf.format(0, 'second');
  if (s < 3600) return rtf.format(-Math.round(s / 60), 'minute');
  if (s < 86400) return rtf.format(-Math.round(s / 3600), 'hour');
  if (s < 86400 * 30) return rtf.format(-Math.round(s / 86400), 'day');
  return fmtDate(d);
}
export function country(code) {
  if (!code) return '—';
  try { return new Intl.DisplayNames([loc()], { type: 'region' }).of(code) || code; } catch { return code; }
}
export const ISO = 'AF AX AL DZ AS AD AO AI AQ AG AR AM AW AU AT AZ BS BH BD BB BY BE BZ BJ BM BT BO BQ BA BW BR IO BN BG BF BI CV KH CM CA KY CF TD CL CN CX CC CO KM CG CD CK CR CI HR CU CW CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FK FO FJ FI FR GF PF GA GM GE DE GH GI GR GL GD GP GU GT GG GN GW GY HT VA HN HK HU IS IN ID IR IQ IE IM IL IT JM JP JE JO KZ KE KI KP KR XK KW KG LA LV LB LS LR LY LI LT LU MO MG MW MY MV ML MT MH MQ MR MU YT MX FM MD MC MN ME MS MA MZ MM NA NR NP NL NC NZ NI NE NG NU NF MK MP NO OM PK PW PS PA PG PY PE PH PN PL PT PR QA RE RO RU RW BL SH KN LC MF PM VC WS SM ST SA SN RS SC SL SG SX SK SI SB SO ZA SS ES LK SD SR SJ SE CH SY TW TJ TZ TH TL TG TK TO TT TN TR TM TC TV UG UA AE GB US UY UZ VU VE VN VG VI WF EH YE ZM ZW'.split(' ');
export const countryOptions = () => ISO.map(c => [c, country(c)]).sort((a, b) => a[1].localeCompare(b[1], loc()));
export const initials = n => String(n || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
export const bytes = n => (n == null ? '' : n < 1024 * 1024 ? Math.max(1, Math.round(n / 1024)) + ' KB' : (n / 1048576).toFixed(1) + ' MB');

/* ---------- API ---------- */
export async function token() {
  const { data } = await S.sb.auth.getSession();
  S.session = data.session;
  return data.session?.access_token || '';
}
export async function api(path, { method = 'GET', body, raw = false } = {}) {
  const tk = await token();
  const r = await fetch('/api/hc/' + path.replace(/^\//, ''), {
    method, credentials: 'same-origin',
    headers: { ...(tk ? { Authorization: 'Bearer ' + tk } : {}), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  if (raw && r.ok) return r;
  let j = null; try { j = await r.json(); } catch {}
  if (!r.ok) {
    const e = new Error((j && j.error) || t('err'));
    e.status = r.status; e.code = j && j.code; e.field = j && j.field;
    if (e.code === 'mfa_required' && S.onMfa) S.onMfa();
    throw e;
  }
  return j;
}

/* ---------- router ---------- */
export function parseRoute() { return location.hash.replace(/^#\/?/, '').split('?')[0].split('/').filter(Boolean).map(decodeURIComponent); }
export function query() { return new URLSearchParams(location.hash.split('?')[1] || ''); }
export const go = path => { if (location.hash !== '#/' + path) location.hash = '#/' + path; else S.onRoute && S.onRoute(); };
window.addEventListener('hashchange', () => S.onRoute && S.onRoute());

/* ---------- UI primitives ---------- */
let toastBox;
export function toast(msg, err = false) {
  if (!toastBox) { toastBox = h('div', { class: 'pt-toasts', 'aria-live': 'polite' }); document.body.appendChild(toastBox); }
  const n = h('div', { class: 'pt-toast' + (err ? ' err' : ''), role: err ? 'alert' : 'status' }, icon(err ? 'alert' : 'check', 16), h('span', { text: msg }));
  toastBox.appendChild(n);
  setTimeout(() => n.classList.add('out'), 3600);
  setTimeout(() => n.remove(), 4100);
}
export function dialog({ title, body, okText, cancelText, danger = false, onOk, wide = false }) {
  return new Promise(resolve => {
    const err = h('p', { class: 'pt-msg err', hidden: true });
    const ok = h('button', { type: 'submit', class: 'hc-btn ' + (danger ? 'pt-btn-danger' : 'hc-btn-teal') }, okText || t('confirm'));
    const form = h('form', { method: 'dialog', class: 'pt-dialog-in' },
      h('div', { class: 'pt-dialog-h' }, h('h3', { text: title }), h('button', { type: 'button', class: 'pt-x', 'aria-label': t('close'), onclick: () => close(null) }, icon('x'))),
      h('div', { class: 'pt-dialog-b' }, body, err),
      h('div', { class: 'pt-actions' }, h('button', { type: 'button', class: 'hc-btn hc-btn-line', onclick: () => close(null) }, cancelText || t('cancel')), ok));
    const d = h('dialog', { class: 'pt-dialog' + (wide ? ' wide' : '') }, form);
    function close(v) { d.close(); d.remove(); resolve(v); }
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (!onOk) return close(true);
      ok.disabled = true; err.hidden = true;
      try { const v = await onOk(form); close(v === undefined ? true : v); }
      catch (x) { err.textContent = x.message || t('err'); err.hidden = false; ok.disabled = false; }
    });
    d.addEventListener('cancel', e => { e.preventDefault(); close(null); });
    document.body.appendChild(d); d.showModal();
    const first = form.querySelector('input,select,textarea'); if (first) first.focus();
  });
}
export const confirmBox = (title, text, opts = {}) => dialog({ title, body: h('p', { text }), ...opts });

export function field(label, input, { hint, full, err } = {}) {
  return h('label', { class: 'pt-field' + (full ? ' full' : '') },
    h('span', { text: label }), input,
    hint ? h('small', { text: hint }) : null,
    h('small', { class: 'err', dataset: { err: input.name || '' }, text: err || '' }));
}
export const input = (name, attrs = {}) => h('input', { name, ...attrs });
export function select(name, options, value, attrs = {}) {
  return h('select', { name, ...attrs }, options.map(o => {
    const [v, l] = Array.isArray(o) ? o : [o, o];
    return h('option', { value: v, selected: String(value ?? '') === String(v) }, l);
  }));
}
export const textarea = (name, value = '', attrs = {}) => { const ta = h('textarea', { name, rows: 4, ...attrs }); ta.value = value || ''; return ta; };
export function formData(form) {
  const o = {};
  for (const el of form.elements) {
    if (!el.name || el.disabled) continue;
    if (el.type === 'checkbox') o[el.name] = el.checked;
    else if (el.type === 'number') o[el.name] = el.value === '' ? null : Number(el.value);
    else o[el.name] = el.value.trim() === '' ? null : el.value.trim();
  }
  return o;
}
export function showFieldError(form, e) {
  form.querySelectorAll('.err[data-err]').forEach(x => (x.textContent = ''));
  if (e.field) { const x = form.querySelector(`.err[data-err="${e.field}"]`); if (x) { x.textContent = e.message; return true; } }
  return false;
}
export const badge = (text, tone = 'grey') => h('span', { class: 'pt-badge ' + tone, text });
export const empty = (ic, title, text, action) => h('div', { class: 'pt-empty' }, icon(ic, 30), h('b', { text: title }), text ? h('p', { text }) : null, action || null);
export const card = (title, kids, extra, cls = '') => h('section', { class: 'pt-card ' + cls }, title ? h('div', { class: 'pt-card-h' }, h('h3', { text: title }), extra || null) : null, kids);
export const loading = () => h('div', { class: 'pt-boot inline' }, h('span', { class: 'pt-spin' }), h('span', { text: t('loading') }));
export function busy(btn, on, label) {
  if (on) { btn.dataset.label = btn.textContent; btn.disabled = true; btn.replaceChildren(h('span', { class: 'pt-spin sm' }), label || t('wait')); }
  else { btn.disabled = false; btn.textContent = btn.dataset.label || btn.textContent; }
}
export async function openSigned(path) {
  const w = window.open('about:blank', '_blank');
  try { const r = await api(path); if (w) w.location = r.url; else location.href = r.url; }
  catch (e) { if (w) w.close(); toast(e.message, true); }
}
export const put = (el, ...kids) => { add(el, kids); return el; };
