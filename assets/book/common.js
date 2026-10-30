// Shared helpers for /portfolio/ and /certificates/ (no inline scripts, no third-party code).
import BRANDS from './brands.js';

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export function el(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()) if (k !== null && k !== undefined && k !== false) e.append(k.nodeType ? k : document.createTextNode(String(k)));
  return e;
}

/* ---------- Language ---------- */
const STR = {
  en: {
    open: 'OPEN', close: 'Close book', cover: 'Cover', cv: 'Curriculum', work: 'Portfolio', contact: 'Contact', certs: 'Certificates',
    edition: 'PERSONAL EDITION', h1: 'SELECTED WORK', h2: 'CERTIFIED', h3: 'RIGHT NOW', latest: 'LATEST', allPosts: 'See all',
    iam: "I'm", downloadCv: 'DOWNLOAD CV', worked: "Where I've worked", studied: "Where I've studied", skills: 'What I work with',
    learning: 'Latest certificates', allCerts: 'All certificates', since: 'since', present: 'present',
    workIntro: 'Projects, labs and case studies.', all: 'ALL', viewProject: 'View project', noWork: 'Projects will appear here soon.',
    contactLead: 'Have a question or an opportunity? Send me a message.', social: 'Find me on my networks',
    letter: 'Or simply write me a letter', yourName: 'YOUR NAME', subject: 'SUBJECT', message: 'MESSAGE', send: 'SEND',
    sendHint: 'Opens your email app. Nothing is stored on this site.', bookCall: 'Book a call',
    soon: 'Coming soon', profileSoon: 'Profile coming soon.', site: 'Website', code: 'Source code', report: 'Report (PDF)', caseStudy: 'Case study',
    role: 'Role', date: 'Date', category: 'Category', prev: 'Previous image', next: 'Next image', closeD: 'Close',
    certTitle: 'CERTIFICATES', certIntro: 'Training, certifications and evidence of learning — each with a link to verify it with the issuer.',
    credentials: 'credentials', issuers: 'issuers', verifiable: 'verifiable', details: 'DETAILS', verify: 'VERIFY', pdf: 'PDF',
    active: 'Active', renew: 'Renew soon', expired: 'Expired', noExpiry: 'No expiry', issued: 'Issued', expires: 'Expires', issuer: 'Issuer',
    credId: 'Credential ID', verifyIssuer: 'Verify with issuer', index: 'Index of all credentials', noCerts: 'Certificates will appear here soon.',
    backBook: 'Back to portfolio', theme: 'Change theme', lang: 'Español', error: 'Content is not available right now. Please try again later.',
    projects: n => `${n} PROJECT${n === 1 ? '' : 'S'}`, certCount: n => `${n} CERTIFICATE${n === 1 ? '' : 'S'}`,
    themes: { dawn: 'Thames dawn', garden: 'Spring garden', circuit: 'Circuit coast' },
  },
  es: {
    open: 'ABRIR', close: 'Cerrar libro', cover: 'Portada', cv: 'Currículo', work: 'Portafolio', contact: 'Contacto', certs: 'Certificados',
    edition: 'EDICIÓN PERSONAL', h1: 'PROYECTOS DESTACADOS', h2: 'CERTIFICADO', h3: 'AHORA MISMO', latest: 'LO ÚLTIMO', allPosts: 'Ver todo',
    iam: 'Soy', downloadCv: 'DESCARGAR CV', worked: 'Dónde he trabajado', studied: 'Dónde he estudiado', skills: 'Con qué trabajo',
    learning: 'Últimos certificados', allCerts: 'Todos los certificados', since: 'desde', present: 'actualidad',
    workIntro: 'Proyectos, laboratorios y casos prácticos.', all: 'TODOS', viewProject: 'Ver proyecto', noWork: 'Pronto aparecerán aquí los proyectos.',
    contactLead: '¿Tienes una pregunta o una oportunidad? Envíame un mensaje.', social: 'Encuéntrame en mis redes',
    letter: 'O simplemente escríbeme una carta', yourName: 'TU NOMBRE', subject: 'ASUNTO', message: 'MENSAJE', send: 'ENVIAR',
    sendHint: 'Abre tu aplicación de correo. Esta web no guarda nada.', bookCall: 'Reservar llamada',
    soon: 'Próximamente', profileSoon: 'Perfil próximamente.', site: 'Web', code: 'Código fuente', report: 'Informe (PDF)', caseStudy: 'Caso práctico',
    role: 'Rol', date: 'Fecha', category: 'Categoría', prev: 'Imagen anterior', next: 'Imagen siguiente', closeD: 'Cerrar',
    certTitle: 'CERTIFICADOS', certIntro: 'Formación, certificaciones y evidencias de aprendizaje, cada una con su enlace de verificación del emisor.',
    credentials: 'credenciales', issuers: 'emisores', verifiable: 'verificables', details: 'DETALLES', verify: 'VERIFICAR', pdf: 'PDF',
    active: 'Vigente', renew: 'Renovar pronto', expired: 'Caducado', noExpiry: 'Sin caducidad', issued: 'Expedido', expires: 'Caduca', issuer: 'Emisor',
    credId: 'ID de credencial', verifyIssuer: 'Verificar con el emisor', index: 'Índice de credenciales', noCerts: 'Pronto aparecerán aquí los certificados.',
    backBook: 'Volver al portafolio', theme: 'Cambiar tema', lang: 'English', error: 'El contenido no está disponible ahora. Inténtalo más tarde.',
    projects: n => `${n} PROYECTO${n === 1 ? '' : 'S'}`, certCount: n => `${n} CERTIFICADO${n === 1 ? '' : 'S'}`,
    themes: { dawn: 'Amanecer en el Támesis', garden: 'Jardín de primavera', circuit: 'Costa de circuitos' },
  },
};
function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch { return null; } }
export let lang = (() => { const q = new URLSearchParams(location.search).get('lang'); const s = q || store('mt-book-lang') || (navigator.language || 'en').slice(0, 2); return s === 'es' ? 'es' : 'en'; })();
export const t = (k, ...a) => { const v = STR[lang][k] ?? STR.en[k] ?? k; return typeof v === 'function' ? v(...a) : v; };
export function setLang(l, rerender) { lang = l; store('mt-book-lang', l); document.documentElement.lang = l; rerender(); }

/* ---------- Theme ---------- */
export const THEMES = ['dawn', 'garden', 'circuit'];
export function applyTheme(name) {
  const n = THEMES.includes(name) ? name : 'dawn';
  for (const x of THEMES) document.documentElement.classList.toggle('theme-' + x, x === n);
  store('mt-book-theme', n);
  return n;
}
export function themePicker(button) {
  let current = applyTheme(store('mt-book-theme'));
  const menu = el('div', { class: 'theme-menu', role: 'menu', hidden: true });
  const draw = () => {
    menu.replaceChildren(...THEMES.map(n => el('button', {
      type: 'button', role: 'menuitemradio', 'aria-checked': String(n === current), class: 'theme-opt th-' + n,
      onclick: () => { current = applyTheme(n); draw(); toggle(false); },
    }, el('span', { class: 'swatch' }), el('span', { text: t('themes')[n] }))));
  };
  const toggle = v => { menu.hidden = !v; button.setAttribute('aria-expanded', String(v)); };
  button.setAttribute('aria-haspopup', 'menu'); button.setAttribute('aria-expanded', 'false');
  button.addEventListener('click', e => { e.stopPropagation(); draw(); toggle(menu.hidden); });
  document.addEventListener('click', e => { if (!menu.contains(e.target)) toggle(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') toggle(false); });
  button.after(menu); draw();
  return { redraw: draw };
}

/* ---------- Data ---------- */
export async function items(kind) {
  const r = await fetch('/api/personal/items?kind=' + encodeURIComponent(kind), { cache: 'no-store', credentials: 'same-origin' });
  let j = {}; try { j = await r.json(); } catch { /* ignore */ }
  if (!r.ok) { if (r.status === 400 && kind !== 'project' && kind !== 'certificate' && kind !== 'profile') return []; throw new Error(j.error || 'HTTP ' + r.status); }
  return Array.isArray(j.data) ? j.data : [];
}
export const safeUrl = u => { try { const x = new URL(u); return x.protocol === 'https:' ? x.href : ''; } catch { return ''; } };
export const isEmail = s => /^[^\s@<>()"',;:]{1,64}@[a-z0-9.-]{1,190}\.[a-z]{2,24}$/i.test(String(s || '').trim());
export const tagsOf = s => String(s || '').split(',').map(x => x.trim()).filter(Boolean).slice(0, 30);
export function paragraphs(text) {
  return String(text || '').split(/\n\s*\n/).map(x => x.trim()).filter(Boolean).map(b => {
    const h = /^#{1,3}\s+(.+)$/.exec(b); return h ? el('h4', { text: h[1] }) : el('p', { text: b });
  });
}
export function fmtDate(d, long = false) {
  if (!d) return '';
  const x = new Date(d + 'T12:00:00Z'); if (isNaN(x)) return '';
  return x.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-GB', long ? { day: 'numeric', month: 'long', year: 'numeric' } : { month: 'short', year: 'numeric' });
}
export const year = d => (d ? String(d).slice(0, 4) : '');
export const pad = n => String(n).padStart(2, '0');
export function certStatus(c) {
  if (!c.expires_on) return 'none';
  const days = (new Date(c.expires_on + 'T23:59:59Z') - Date.now()) / 864e5;
  return days < 0 ? 'expired' : days <= 90 ? 'soon' : 'ok';
}
export const statusLabel = s => ({ ok: t('active'), soon: t('renew'), expired: t('expired'), none: t('noExpiry') })[s];

/* ---------- Icons ---------- */
const P = {
  home: 'M3 11.5 12 4l9 7.5M5.5 9.5V20h13V9.5',
  cv: 'M7 3h7l4 4v14H7zM14 3v4h4M9.5 12h6M9.5 15.5h6M9.5 9h2.5',
  work: 'M4 7h16v12H4zM9 7V5h6v2M4 12h16',
  mail: 'M3.5 6h17v12h-17zM4 6.5l8 6.5 8-6.5',
  award: 'M12 3a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11ZM8.6 13 7 21l5-2.6 5 2.6-1.6-8',
  palette: 'M12 3a9 9 0 1 0 0 18c1.2 0 1.8-.9 1.8-1.8 0-1.2-1-1.6-1-2.6 0-.9.8-1.6 1.8-1.6H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3ZM7.5 11.5h.01M10 7.5h.01M15 7.5h.01',
  lang: 'M4 5h9M8.5 3v2M6 5c.5 3 2.5 5.5 5 7M11 5c-.8 3.5-3 6.5-6 8M13 21l4-10 4 10M14.4 17.5h5.2',
  x: 'M6 6l12 12M18 6 6 18',
  left: 'M15 5l-7 7 7 7', right: 'M9 5l7 7-7 7',
  ext: 'M8 16 16 8M10 8h6v6',
  check: 'M5 12.5 10 17l9-10',
  doc: 'M7 3h7l4 4v14H7zM14 3v4h4',
  globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM3 12h18M12 3c2.5 2.6 3.6 5.6 3.6 9s-1.1 6.4-3.6 9c-2.5-2.6-3.6-5.6-3.6-9S9.5 5.6 12 3Z',
  pin: 'M12 21s-6.5-6.1-6.5-11a6.5 6.5 0 0 1 13 0c0 4.9-6.5 11-6.5 11ZM12 12.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4Z',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  code: 'M8.5 8 4.5 12l4 4M15.5 8l4 4-4 4M13.5 5l-3 14',
  arrow: 'M5 12h14M13 6l6 6-6 6',
};
export function icon(name, size = 18) {
  const ns = 'http://www.w3.org/2000/svg', s = document.createElementNS(ns, 'svg');
  s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('width', size); s.setAttribute('height', size); s.setAttribute('aria-hidden', 'true'); s.setAttribute('focusable', 'false');
  const p = document.createElementNS(ns, 'path');
  if (BRANDS[name]) { s.setAttribute('fill', 'currentColor'); p.setAttribute('d', BRANDS[name]); }
  else { s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor'); s.setAttribute('stroke-width', '1.7'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round'); p.setAttribute('d', P[name] || P.globe); }
  s.append(p); return s;
}
const HOSTS = [['github.com', 'github'], ['linkedin.com', 'linkedin'], ['x.com', 'x'], ['twitter.com', 'x'], ['instagram.com', 'instagram'], ['youtube.com', 'youtube'], ['youtu.be', 'youtube'], ['medium.com', 'medium'], ['tryhackme.com', 'tryhackme'], ['hackthebox.com', 'hackthebox'], ['credly.com', 'credly'], ['wa.me', 'whatsapp'], ['whatsapp.com', 'whatsapp'], ['tiktok.com', 'tiktok'], ['facebook.com', 'facebook'], ['gitlab.com', 'gitlab'], ['stackoverflow.com', 'stackoverflow'], ['behance.net', 'behance'], ['dribbble.com', 'dribbble']];
export function brandFor(url) { try { const h = new URL(url).hostname.replace(/^www\./, ''); for (const [d, n] of HOSTS) if (h === d || h.endsWith('.' + d)) return n; } catch { /* */ } return 'globe'; }
export function ext(href, kids, cls) {
  const u = safeUrl(href); if (!u) return null;
  return el('a', { href: u, class: cls, target: '_blank', rel: 'noopener noreferrer' }, kids);
}

/* ---------- Viewer dialog (projects + certificates) ---------- */
export function viewer({ label, images = [], info, onClose }) {
  let i = 0;
  const img = el('img', { alt: '' });
  const count = el('span', { class: 'v-count' });
  const thumbs = el('div', { class: 'v-thumbs' });
  const show = n => {
    if (!images.length) return; i = (n + images.length) % images.length;
    img.src = images[i]; img.alt = `${label} — ${i + 1}/${images.length}`; count.textContent = `${pad(i + 1)} / ${pad(images.length)}`;
    $$('button', thumbs).forEach((b, k) => b.setAttribute('aria-current', String(k === i)));
  };
  const stage = el('div', { class: 'v-stage' + (images.length ? '' : ' empty') });
  if (images.length) {
    stage.append(el('div', { class: 'v-mat' }, img));
    if (images.length > 1) {
      stage.append(el('button', { type: 'button', class: 'v-nav v-prev', 'aria-label': t('prev'), onclick: () => show(i - 1) }, icon('left')),
        el('button', { type: 'button', class: 'v-nav v-next', 'aria-label': t('next'), onclick: () => show(i + 1) }, icon('right')), count);
      images.forEach((src, k) => thumbs.append(el('button', { type: 'button', 'aria-label': `${k + 1}`, onclick: () => show(k) }, el('img', { src, alt: '', loading: 'lazy' }))));
    }
  }
  const d = el('dialog', { class: 'viewer', 'aria-label': label },
    el('div', { class: 'v-paper' },
      el('button', { type: 'button', class: 'v-close ribbon-close', 'aria-label': t('closeD'), onclick: () => d.close() }, icon('x', 16)),
      el('div', { class: 'v-grid' }, el('div', { class: 'v-media' }, stage, images.length > 1 ? thumbs : null), el('div', { class: 'v-info' }, info))));
  d.addEventListener('keydown', e => { if (e.key === 'ArrowLeft' && images.length > 1) show(i - 1); if (e.key === 'ArrowRight' && images.length > 1) show(i + 1); });
  d.addEventListener('click', e => { if (e.target === d) d.close(); });
  d.addEventListener('close', () => { d.remove(); document.documentElement.classList.remove('modal-open'); onClose && onClose(); });
  document.body.append(d); show(0); d.showModal(); document.documentElement.classList.add('modal-open');
  return d;
}

/* ---------- Toolbar (language + theme) ---------- */
export function toolbar(rerender) {
  const langBtn = $('#langBtn'), themeBtn = $('#themeBtn');
  const label = () => { langBtn.setAttribute('aria-label', t('lang')); langBtn.title = t('lang'); themeBtn.setAttribute('aria-label', t('theme')); themeBtn.title = t('theme'); $('.lang-code', langBtn).textContent = lang === 'es' ? 'EN' : 'ES'; };
  langBtn.prepend(icon('lang', 18)); themeBtn.append(icon('palette', 18));
  const picker = themePicker(themeBtn);
  langBtn.addEventListener('click', () => setLang(lang === 'es' ? 'en' : 'es', () => { label(); picker.redraw(); rerender(); }));
  document.documentElement.lang = lang; label();
}
