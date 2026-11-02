// muk-chat-v1 · MUK Talent Messenger (WhatsApp style, voice notes), notification centre (heart),
// p3-style video viewer and team publishing composer (Cloudinary or link). CSP safe: DOM only.
const SVG = 'http://www.w3.org/2000/svg';
const E = (t, v, c) => { const n = document.createElement(t); if (v !== undefined && v !== null) n.textContent = String(v); if (c) n.className = c; return n; };
const P = {
  back: ['m15 5-7 7 7 7'], close: ['M6 6l12 12M18 6 6 18'], search: ['M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z', 'm20 20-4-4'],
  send: ['M4 12 20 4l-6 16-3-7-7-1Z'], mic: ['M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z', 'M5 11a7 7 0 0 0 14 0', 'M12 18v3'],
  trash: ['M5 7h14', 'M10 7V4h4v3', 'M7 7l1 13h8l1-13'], play: ['M8 5v14l11-7Z'], pause: ['M8 5v14', 'M16 5v14'],
  plus: ['M12 5v14M5 12h14'], heart: ['M12 20s-7-4.4-9-9a5 5 0 0 1 9-3.5A5 5 0 0 1 21 11c-2 4.6-9 9-9 9Z'],
  chat: ['M4 5h16v11H8l-4 4V5Z'], news: ['M5 4h11v16H6a2 2 0 0 1-2-2V5a1 1 0 0 1 1-1Z', 'M16 8h3v10a2 2 0 0 1-2 2', 'M8 8h5M8 12h5M8 16h3'],
  live: ['M12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z', 'M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4', 'M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14'],
  video: ['M4 6h11v12H4z', 'm15 10 5-3v10l-5-3'], share: ['M12 3v12', 'm7 8 5-5 5 5', 'M5 13v6h14v-6'], bookmark: ['M7 4h10v16l-5-4-5 4V4Z'],
  smile: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z', 'M8.5 14a4.5 4.5 0 0 0 7 0', 'M9 9.5h.01M15 9.5h.01'], down: ['m6 9 6 6 6-6'], lockc: ['M7 11V8a5 5 0 0 1 10 0v3', 'M5 11h14v10H5z'],
  check: ['m5 12 4 4 10-10'], checks: ['m2 12 4 4 9-9', 'm10 15 1 1 9-9'], upload: ['M12 16V4', 'm7 9 5-5 5 5', 'M5 20h14'], link: ['M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1', 'M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1'],
  calendar: ['M7 3v3M17 3v3M4 8h16', 'M5 5h14v15H5z'], globe: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z', 'M3 12h18', 'M12 3c2.6 2.8 3.8 5.8 3.8 9s-1.2 6.2-3.8 9c-2.6-2.8-3.8-5.8-3.8-9S9.4 5.8 12 3Z']
};
export function icon(name, cls = 'mkc-i') { const s = document.createElementNS(SVG, 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true'); s.setAttribute('class', cls); for (const d of P[name] || []) { const p = document.createElementNS(SVG, 'path'); p.setAttribute('d', d); s.append(p); } return s; }
const ibtn = (name, label, cls = 'mkc-ib') => { const b = E('button', undefined, cls); b.type = 'button'; b.setAttribute('aria-label', label); b.title = label; b.append(icon(name)); return b; };

const TX = {
  en: { chats: 'Chats', search: 'Search', newChat: 'New chat', write: 'Message', send: 'Send', record: 'Hold to record a voice note', recording: 'Recording…', cancel: 'Cancel', voice: 'Voice message', empty: 'No conversations yet. Start one with the + button.', emptyThread: 'Say hello. Messages are private between the people in this chat.', counsellor: 'Your counsellor', students: 'Students', team: 'MUK Talent team', you: 'You', today: 'Today', yesterday: 'Yesterday', online: 'MUK Talent', micDenied: 'Microphone access is blocked. Allow it in your browser settings.', noMic: 'Voice notes are not supported in this browser.', notif: 'Notifications', messages: 'Messages', unread: '{n} unread', allRead: 'You are up to date', news: 'News', live: 'Live', video: 'Video', noFeed: 'No news yet. The MUK Talent team will post updates, lives and videos here.', watch: 'Watch', ago: 'ago', share: 'Share', save: 'Save', saved: 'Saved', copied: 'Link copied', openLink: 'Open video', liveOn: 'Live on {d}', publish: 'Publish to students', title: 'Title', description: 'Description', kind: 'Type', when: 'Date and time', audience: 'Audience', all: 'All students', mine: 'My students', web: 'Website (public, home page)', pubWeb: 'Publish on the website', newProd: 'New production', saveProd: 'Save to Productions', prodSaved: 'Saved to Productions', needVideo: 'Paste a link, choose a Vimeo video or upload a file.', webNote: 'Shown to everyone on muktalent.com in “Our latest videos”. Students also see it.', videoSrc: 'Video', upload: 'Upload to Cloudinary', paste: 'Paste a link', urlPh: 'Vimeo, YouTube or Cloudinary link (or Vimeo embed code)', uploading: 'Uploading… {p}%', published: 'Published. Students will see it in their notifications.', remove: 'Delete', close: 'Close', fromLib: 'From your library', retry: 'Try again', loading: 'Loading…', vimeo: 'Choose from Vimeo', vimeoEmpty: 'No videos found in your Vimeo account.', vimeoMore: 'Load more', vimeoReady: 'Vimeo video ready', resolving: 'Reading the video…', hours: { s: 'Just now', m: '{n} min ago', h: '{n} hours ago', h1: '1 hour ago', d: '{n} days ago', d1: 'Yesterday' } },
  fr: { chats: 'Discussions', search: 'Rechercher', newChat: 'Nouvelle discussion', write: 'Message', send: 'Envoyer', record: 'Maintenez pour enregistrer un vocal', recording: 'Enregistrement…', cancel: 'Annuler', voice: 'Message vocal', empty: 'Aucune discussion. Commencez avec le bouton +.', emptyThread: 'Dites bonjour. Les messages restent privés entre les participants.', counsellor: 'Votre conseillère', students: 'Étudiants', team: 'Équipe MUK Talent', you: 'Vous', today: 'Aujourd’hui', yesterday: 'Hier', online: 'MUK Talent', micDenied: 'Le micro est bloqué. Autorisez-le dans les réglages du navigateur.', noMic: 'Les vocaux ne sont pas pris en charge par ce navigateur.', notif: 'Notifications', messages: 'Messages', unread: '{n} non lus', allRead: 'Vous êtes à jour', news: 'Actualité', live: 'Direct', video: 'Vidéo', noFeed: 'Pas encore d’actualités. L’équipe MUK Talent publiera ici infos, directs et vidéos.', watch: 'Regarder', ago: '', share: 'Partager', save: 'Enregistrer', saved: 'Enregistré', copied: 'Lien copié', openLink: 'Ouvrir la vidéo', liveOn: 'En direct le {d}', publish: 'Publier aux étudiants', title: 'Titre', description: 'Description', kind: 'Type', when: 'Date et heure', audience: 'Public', all: 'Tous les étudiants', mine: 'Mes étudiants', web: 'Site web (public, page d’accueil)', pubWeb: 'Publier sur le site', newProd: 'Nouvelle production', saveProd: 'Enregistrer dans Productions', prodSaved: 'Enregistré dans Productions', needVideo: 'Collez un lien, choisissez une vidéo Vimeo ou importez un fichier.', webNote: 'Visible par tous sur muktalent.com dans « Nos dernières vidéos ». Les étudiants la voient aussi.', videoSrc: 'Vidéo', upload: 'Envoyer sur Cloudinary', paste: 'Coller un lien', urlPh: 'Lien Vimeo, YouTube ou Cloudinary (ou code d’intégration Vimeo)', uploading: 'Envoi… {p} %', published: 'Publié. Les étudiants le verront dans leurs notifications.', remove: 'Supprimer', close: 'Fermer', fromLib: 'Depuis votre bibliothèque', retry: 'Réessayer', loading: 'Chargement…', vimeo: 'Choisir sur Vimeo', vimeoEmpty: 'Aucune vidéo dans votre compte Vimeo.', vimeoMore: 'Voir plus', vimeoReady: 'Vidéo Vimeo prête', resolving: 'Lecture de la vidéo…', hours: { s: 'À l’instant', m: 'Il y a {n} min', h: 'Il y a {n} heures', h1: 'Il y a 1 heure', d: 'Il y a {n} jours', d1: 'Hier' } },
  es: { chats: 'Chats', search: 'Buscar', newChat: 'Nuevo chat', write: 'Mensaje', send: 'Enviar', record: 'Mantén pulsado para grabar un audio', recording: 'Grabando…', cancel: 'Cancelar', voice: 'Mensaje de voz', empty: 'Aún no hay chats. Empieza uno con el botón +.', emptyThread: 'Saluda. Los mensajes son privados entre los participantes.', counsellor: 'Tu counsellor', students: 'Estudiantes', team: 'Equipo MUK Talent', you: 'Tú', today: 'Hoy', yesterday: 'Ayer', online: 'MUK Talent', micDenied: 'El micrófono está bloqueado. Permítelo en los ajustes del navegador.', noMic: 'Este navegador no permite grabar audios.', notif: 'Notificaciones', messages: 'Mensajes', unread: '{n} sin leer', allRead: 'Estás al día', news: 'Noticia', live: 'Directo', video: 'Vídeo', noFeed: 'Aún no hay novedades. El equipo publicará aquí noticias, directos y vídeos.', watch: 'Ver', ago: '', share: 'Compartir', save: 'Guardar', saved: 'Guardado', copied: 'Enlace copiado', openLink: 'Abrir vídeo', liveOn: 'En directo el {d}', publish: 'Publicar a estudiantes', title: 'Título', description: 'Descripción', kind: 'Tipo', when: 'Fecha y hora', audience: 'Público', all: 'Todos los estudiantes', mine: 'Mis estudiantes', web: 'Web (pública, página de inicio)', pubWeb: 'Publicar en la web', newProd: 'Nueva producción', saveProd: 'Guardar en Productions', prodSaved: 'Guardado en Productions', needVideo: 'Pega un enlace, elige un vídeo de Vimeo o sube un archivo.', webNote: 'Visible para todos en muktalent.com en «Nuestros últimos vídeos». Los estudiantes también lo ven.', videoSrc: 'Vídeo', upload: 'Subir a Cloudinary', paste: 'Pegar enlace', urlPh: 'Enlace de Vimeo, YouTube o Cloudinary (o código embed de Vimeo)', uploading: 'Subiendo… {p} %', published: 'Publicado. Los estudiantes lo verán en sus notificaciones.', remove: 'Eliminar', close: 'Cerrar', fromLib: 'De tu biblioteca', retry: 'Reintentar', loading: 'Cargando…', vimeo: 'Elegir de Vimeo', vimeoEmpty: 'No hay vídeos en tu cuenta de Vimeo.', vimeoMore: 'Ver más', vimeoReady: 'Vídeo de Vimeo listo', resolving: 'Leyendo el vídeo…', hours: { s: 'Ahora', m: 'Hace {n} min', h: 'Hace {n} horas', h1: 'Hace 1 hora', d: 'Hace {n} días', d1: 'Ayer' } }
};
const tx = lang => TX[lang] || TX.en;
// v17 · textos extra del chat estilo WhatsApp
const WA = {
  es: {all: 'Todos', unread: 'No leídos', groups: 'Grupos', introT: 'MUK Talent Messenger', introP: 'Envía y recibe mensajes y notas de voz con tu equipo y tus estudiantes. Elige un chat para empezar.', priv: 'Mensajes privados dentro de MUK Talent', emoji: 'Emojis', down: 'Ir al último mensaje', noUnread: 'No tienes chats sin leer.'},
  en: {all: 'All', unread: 'Unread', groups: 'Groups', introT: 'MUK Talent Messenger', introP: 'Send and receive messages and voice notes with your team and students. Pick a chat to start.', priv: 'Private messages inside MUK Talent', emoji: 'Emoji', down: 'Jump to latest message', noUnread: 'No unread chats.'},
  fr: {all: 'Tous', unread: 'Non lus', groups: 'Groupes', introT: 'MUK Talent Messenger', introP: 'Envoyez et recevez des messages et des notes vocales avec votre équipe et vos étudiants. Choisissez une discussion.', priv: 'Messages privés dans MUK Talent', emoji: 'Émojis', down: 'Aller au dernier message', noUnread: 'Aucune discussion non lue.'}
};
const wa = lang => WA[lang] || WA.en;
const EMOJI = '😀 😂 😊 😍 🙏 👍 👏 🙌 💪 🎉 🎓 📚 ✍️ 📝 📄 📎 ✅ ❌ ⏰ 📅 📞 💬 ❤️ 🔥 ⭐ 🤝 👋 😅 🤔 😢 😮 🇬🇧 🇲🇦 🇩🇿 🇹🇳 ✈️ 🏠 💷 🏆 👌'.split(' ');
function linkify(text) { const p = E('p'); const re = /(https?:\/\/[^\s<]+[^\s<.,;:!?)\]'"])/g; let last = 0, m; const s = String(text || ''); while ((m = re.exec(s))) { if (m.index > last) p.append(document.createTextNode(s.slice(last, m.index))); const a = E('a', m[0]); a.href = m[0]; a.target = '_blank'; a.rel = 'noopener noreferrer'; p.append(a); last = m.index + m[0].length; } if (last < s.length) p.append(document.createTextNode(s.slice(last))); return p; }
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');
const loc = lang => ({ fr: 'fr-FR', es: 'es-ES' }[lang] || 'en-GB');
export function since(iso, lang) { const L = tx(lang).hours, s = (Date.now() - new Date(iso).getTime()) / 1000; if (s < 60) return L.s; if (s < 3600) return fill(L.m, { n: Math.floor(s / 60) }); if (s < 7200) return L.h1; if (s < 86400) return fill(L.h, { n: Math.floor(s / 3600) }); if (s < 172800) return L.d1; return fill(L.d, { n: Math.floor(s / 86400) }); }
const clock = (iso, lang) => new Intl.DateTimeFormat(loc(lang), { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
function dayLabel(iso, lang) { const d = new Date(iso), t = new Date(); const k = x => x.toDateString(); if (k(d) === k(t)) return tx(lang).today; const y = new Date(t); y.setDate(t.getDate() - 1); if (k(d) === k(y)) return tx(lang).yesterday; return new Intl.DateTimeFormat(loc(lang), { day: 'numeric', month: 'long', year: d.getFullYear() === t.getFullYear() ? undefined : 'numeric' }).format(d); }
const listTime = (iso, lang) => { const d = new Date(iso); return d.toDateString() === new Date().toDateString() ? clock(iso, lang) : dayLabel(iso, lang); };
const mmss = ms => { const s = Math.max(0, Math.round(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const initials = n => String(n || 'M').split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
function avatar(name, url, cls = 'mkc-av') { const a = E('span', undefined, cls); a.dataset.tone = String([...String(name || '')].reduce((x, c) => x + c.charCodeAt(0), 0) % 5); if (url) { const i = E('img'); i.src = url; i.alt = ''; i.referrerPolicy = 'no-referrer'; i.onerror = () => { i.remove(); a.textContent = initials(name); }; a.append(i); } else a.textContent = initials(name); return a; }
export function linkChatCss() { if (document.getElementById('mukChatCss')) return; const l = E('link'); l.id = 'mukChatCss'; l.rel = 'stylesheet'; l.href = '/admin/muk-chat.css?v=17.0.0'; document.head.append(l); }
function toast(text) { const t = E('div', text, 'mkc-toast'); t.setAttribute('role', 'status'); document.body.append(t); setTimeout(() => t.remove(), 2600); }
function overlay(cls, label) { linkChatCss(); const o = E('div', undefined, 'mkc-layer ' + cls); o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); o.setAttribute('aria-label', label); document.body.append(o); document.documentElement.classList.add('mkc-lock'); const prev = document.activeElement; const close = () => { o.remove(); if (!document.querySelector('.mkc-layer')) document.documentElement.classList.remove('mkc-lock'); prev?.focus?.(); }; o.addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } }); return { o, close }; }

// ---------------- Instagram-style hide on scroll ----------------
export function hideOnScroll(el, { offset = 64 } = {}) {
  let last = scrollY, ticking = false;
  const onScroll = () => { if (!el.isConnected) { removeEventListener('scroll', onScroll); return; } if (ticking) return; ticking = true; requestAnimationFrame(() => { const y = Math.max(0, scrollY); if (document.documentElement.classList.contains('mkc-lock')) { ticking = false; return; } if (y > offset && y > last + 4) el.classList.add('is-hidden'); else if (y < last - 4 || y <= offset) el.classList.remove('is-hidden'); last = y; ticking = false; }); };
  addEventListener('scroll', onScroll, { passive: true }); return () => removeEventListener('scroll', onScroll);
}

// ---------------- Heart button + polling badge ----------------
export function heartButton(lang, onClick) { linkChatCss(); const b = E('button', undefined, 'mkc-heart'); b.type = 'button'; b.setAttribute('aria-label', tx(lang).notif); b.title = tx(lang).notif; b.append(icon('heart'), E('i', undefined, 'mkc-dot')); b.onclick = onClick; return b; }
export function watchNotifications(api, onChange) {
  let stopped = false, timer = null, last = null;
  const tick = async () => { if (stopped) return; if (!document.hidden) { try { const s = (await api('/api/notifications/summary')).data; last = s; onChange(s); } catch { } } timer = setTimeout(tick, 30000); };
  const vis = () => { if (!document.hidden) { clearTimeout(timer); tick(); } };
  document.addEventListener('visibilitychange', vis); tick();
  return { stop() { stopped = true; clearTimeout(timer); document.removeEventListener('visibilitychange', vis); }, refresh() { clearTimeout(timer); tick(); }, get last() { return last; } };
}
export function setDot(btn, s) { const n = (s?.chat_unread || 0) + (s?.feed_unread || 0); btn.classList.toggle('has-new', n > 0); btn.dataset.count = n > 9 ? '9+' : String(n); }

// ---------------- Messenger ----------------
export function openMessenger({ api, lang = 'en', threadId = null, onChange = () => { } }) {
  const L = tx(lang), W = wa(lang); const { o, close: closeLayer } = overlay('mkc-chat mkc-wa', L.chats); o.lang = lang;
  const close = () => { stopPoll(); closeLayer(); onChange(); };
  let threads = [], me = null, current = null, poll = null, filter = 'all';
  const stopPoll = () => { clearInterval(poll); poll = null; };
  const listView = E('section', undefined, 'mkc-list'); const convView = E('section', undefined, 'mkc-conv'); o.append(listView, convView);
  // list
  const lh = E('header', undefined, 'mkc-bar'); const back = ibtn('back', L.close); back.onclick = close; const h = E('h2', L.chats); const add = ibtn('plus', L.newChat); add.onclick = () => contacts(); lh.append(back, h, add);
  const sbox = E('label', undefined, 'mkc-search'); sbox.append(icon('search')); const q = E('input'); q.type = 'search'; q.placeholder = L.search; q.setAttribute('aria-label', L.search); sbox.append(q); q.oninput = () => drawList();
  const chipsBar = E('div', undefined, 'mkc-filters'); chipsBar.setAttribute('role', 'tablist');
  for (const [k, t] of [['all', W.all], ['unread', W.unread], ['group', W.groups]]) { const c = E('button', t, 'mkc-fchip'); c.type = 'button'; c.setAttribute('role', 'tab'); c.dataset.f = k; c.setAttribute('aria-selected', String(k === filter)); c.onclick = () => { filter = k; chipsBar.querySelectorAll('.mkc-fchip').forEach(x => x.setAttribute('aria-selected', String(x.dataset.f === k))); drawList(); }; chipsBar.append(c); }
  const ul = E('ul', undefined, 'mkc-threads'); listView.append(lh, sbox, chipsBar, ul);
  const intro = () => { const w = E('div', undefined, 'mkc-intro'); const art = E('div', undefined, 'mkc-intro-art'); art.append(icon('chat')); const foot = E('p', undefined, 'mkc-intro-foot'); foot.append(icon('lockc', 'mkc-i mkc-mini'), document.createTextNode(' ' + W.priv)); w.append(art, E('h3', W.introT), E('p', W.introP), foot); return w; };
  convView.append(intro());
  async function loadThreads() { try { const r = await api('/api/chat/threads'); threads = r.data; me = r.me; drawList(); } catch (e) { ul.replaceChildren(E('li', e.message, 'mkc-empty')); } }
  function drawList() {
    ul.replaceChildren(); const term = q.value.trim().toLowerCase(); const rows = threads.filter(t => (!term || t.title.toLowerCase().includes(term)) && (filter === 'all' || (filter === 'unread' ? t.unread > 0 : t.kind === 'group')));
    if (!rows.length) { ul.append(E('li', filter === 'unread' ? W.noUnread : L.empty, 'mkc-empty')); return; }
    for (const t of rows) {
      const li = E('li'); const b = E('button', undefined, 'mkc-trow' + (current?.id === t.id ? ' is-active' : '') + (t.unread ? ' has-unread' : '')); b.type = 'button'; b.append(avatar(t.title, t.avatar_url));
      const mid = E('span', undefined, 'mkc-tmid'); const top = E('span', undefined, 'mkc-ttop'); top.append(E('strong', t.title), E('small', t.last ? listTime(t.last.at, lang) : '', t.unread ? 'is-new' : ''));
      const bot = E('span', undefined, 'mkc-tbot'); const prev = E('span', undefined, 'mkc-prev'); if (t.last?.mine) prev.append(icon('checks', 'mkc-i mkc-tick')); if (t.last?.audio) { prev.append(icon('mic', 'mkc-i mkc-mini')); prev.append(document.createTextNode(L.voice)); } else prev.append(document.createTextNode(t.last?.body || t.subtitle || ''));
      bot.append(prev); if (t.unread) bot.append(E('b', t.unread > 99 ? '99+' : t.unread, 'mkc-badge'));
      mid.append(top, bot); b.append(mid); b.onclick = () => openThread(t); li.append(b); ul.append(li);
    }
  }
  // conversation
  async function openThread(t) {
    current = t; o.classList.add('is-conv'); convView.replaceChildren(); drawList();
    const bar = E('header', undefined, 'mkc-bar mkc-cbar'); const bk = ibtn('back', L.chats); bk.onclick = () => { stopPoll(); o.classList.remove('is-conv'); current = null; convView.replaceChildren(intro()); loadThreads(); onChange(); };
    const who = E('div', undefined, 'mkc-who'); who.append(avatar(t.title, t.avatar_url)); const nm = E('div'); nm.append(E('strong', t.title), E('small', t.subtitle || L.online)); who.append(nm); bar.append(bk, who);
    const scroller = E('div', undefined, 'mkc-wall'); scroller.setAttribute('aria-live', 'polite'); const list = E('div', undefined, 'mkc-msgs'); scroller.append(list);
    const comp = composer(t, async () => { await refresh(true); });
    const downB = E('button', undefined, 'mkc-down'); downB.type = 'button'; downB.setAttribute('aria-label', W.down); downB.title = W.down; downB.append(icon('down')); downB.hidden = true; downB.onclick = () => scroller.scrollTo({top: scroller.scrollHeight, behavior: 'smooth'});
    scroller.addEventListener('scroll', () => { downB.hidden = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 160; }, {passive: true});
    const wallWrap = E('div', undefined, 'mkc-wallwrap'); wallWrap.append(scroller, downB);
    convView.append(bar, wallWrap, comp);
    let sig = '';
    async function refresh(force) {
      try { const rows = (await api('/api/chat/threads/' + t.id + '/messages')).data; const s = rows.length + ':' + (rows.at(-1)?.id || '') + ':' + rows.filter(r => r.read).length; if (!force && s === sig) return; sig = s; const atEnd = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 80; drawMsgs(list, rows); if (atEnd || force) requestAnimationFrame(() => { scroller.scrollTop = scroller.scrollHeight; }); if (rows.some(r => !r.mine)) api('/api/chat/threads/' + t.id + '/read', { method: 'POST', body: '{}' }).then(onChange).catch(() => { }); }
      catch (e) { list.replaceChildren(E('p', e.message, 'mkc-sys')); }
    }
    list.append(E('p', L.loading, 'mkc-sys')); await refresh(true); stopPoll(); poll = setInterval(() => { if (!o.isConnected) return stopPoll(); if (!document.hidden) refresh(false); }, 6000);
    comp.querySelector('textarea')?.focus({ preventScroll: true });
  }
  function drawMsgs(list, rows) {
    list.replaceChildren(); if (!rows.length) { list.append(E('p', L.emptyThread, 'mkc-sys mkc-lock-note')); return; }
    let day = '', prevMine = null;
    for (const m of rows) {
      const dl = dayLabel(m.at, lang); if (dl !== day) { day = dl; list.append(E('p', dl, 'mkc-day')); prevMine = null; }
      if (m.system) { list.append(E('p', m.body, 'mkc-sys')); prevMine = null; continue; }
      const b = E('div', undefined, 'mkc-msg ' + (m.mine ? 'out' : 'in') + (prevMine === m.mine ? ' cont' : '')); prevMine = m.mine;
      if (!m.mine && current?.kind === 'group') b.append(E('span', m.sender, 'mkc-sender'));
      if (!b.classList.contains('cont')) b.classList.add('tail');
      if (m.audio) b.append(voicePlayer(m.audio)); else b.append(linkify(m.body));
      const meta = E('span', undefined, 'mkc-meta'); meta.append(document.createTextNode(clock(m.at, lang))); if (m.mine) meta.append(icon(m.read ? 'checks' : 'check', 'mkc-i mkc-tick' + (m.read ? ' is-read' : ''))); b.append(meta); list.append(b);
    }
  }
  function voicePlayer(a) {
    const w = E('div', undefined, 'mkc-voice'); const pb = ibtn('play', L.voice, 'mkc-vplay'); const track = E('span', undefined, 'mkc-vtrack'); const bars = E('span', undefined, 'mkc-vbars');
    let seed = (a.ms || 1000) % 97; for (let i = 0; i < 28; i++) { seed = (seed * 37 + 11) % 101; const s = E('i'); s.style.height = (28 + (seed % 72)) + '%'; bars.append(s); }
    const tm = E('small', mmss(a.ms || 0)); track.append(bars); w.append(pb, track, tm);
    let au = null; pb.onclick = () => {
      if (!a.url) return; if (!au) { au = new Audio(a.url); au.preload = 'auto'; au.ontimeupdate = () => { const d = (au.duration && isFinite(au.duration)) ? au.duration : (a.ms / 1000); const p = d ? au.currentTime / d : 0; [...bars.children].forEach((s, i) => s.classList.toggle('on', i / 28 < p)); tm.textContent = mmss(au.currentTime * 1000); }; au.onended = () => { pb.replaceChildren(icon('play')); [...bars.children].forEach(s => s.classList.remove('on')); tm.textContent = mmss(a.ms || 0); }; }
      document.querySelectorAll('.mkc-voice audio'); if (au.paused) { au.play().catch(() => { }); pb.replaceChildren(icon('pause')); } else { au.pause(); pb.replaceChildren(icon('play')); }
    };
    return w;
  }
  function composer(t, after) {
    const f = E('form', undefined, 'mkc-comp'); const pill = E('div', undefined, 'mkc-pill'); const ta = E('textarea'); ta.rows = 1; ta.maxLength = 2000; ta.placeholder = L.write; ta.setAttribute('aria-label', L.write);
    const emo = ibtn('smile', W.emoji, 'mkc-ib mkc-emo'); const pick = E('div', undefined, 'mkc-emoji'); pick.hidden = true; pick.setAttribute('role', 'listbox'); pick.setAttribute('aria-label', W.emoji);
    for (const ch of EMOJI) { const eb = E('button', ch); eb.type = 'button'; eb.onclick = () => { const a = ta.selectionStart ?? ta.value.length, z = ta.selectionEnd ?? a; ta.value = ta.value.slice(0, a) + ch + ta.value.slice(z); ta.selectionStart = ta.selectionEnd = a + ch.length; ta.dispatchEvent(new Event('input')); ta.focus({preventScroll: true}); }; pick.append(eb); }
    emo.onclick = () => { pick.hidden = !pick.hidden; emo.classList.toggle('is-on', !pick.hidden); };
    pill.append(emo, ta);
    const act = E('button', undefined, 'mkc-act'); act.type = 'button'; const setMode = () => { const txt = ta.value.trim().length > 0; act.replaceChildren(icon(txt ? 'send' : 'mic')); act.setAttribute('aria-label', txt ? L.send : L.record); act.title = txt ? L.send : L.record; act.dataset.mode = txt ? 'send' : 'mic'; }; setMode();
    ta.oninput = () => { ta.style.height = 'auto'; ta.style.height = Math.min(120, ta.scrollHeight) + 'px'; setMode(); };
    ta.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey && !matchMedia('(pointer: coarse)').matches) { e.preventDefault(); sendText(); } };
    const rec = E('div', undefined, 'mkc-rec'); rec.hidden = true; const recDot = E('i', undefined, 'mkc-recdot'); const recT = E('span', '0:00'); const recCancel = E('button', L.cancel, 'mkc-reccancel'); recCancel.type = 'button'; rec.append(recDot, recT, E('small', L.recording), recCancel);
    f.append(pick, rec, pill, act);
    async function sendText() { const body = ta.value.trim(); if (!body) return; act.disabled = true; try { await api('/api/chat/threads/' + t.id + '/messages', { method: 'POST', body: JSON.stringify({ body }) }); ta.value = ''; ta.style.height = 'auto'; pick.hidden = true; emo.classList.remove('is-on'); setMode(); await after(); } catch (e) { toast(e.message); } finally { act.disabled = false; ta.focus({ preventScroll: true }); } }
    f.onsubmit = e => { e.preventDefault(); sendText(); };
    // voice notes: tap to start, tap again to send (works on desktop + mobile); cancel discards.
    let mr = null, chunks = [], started = 0, tick = null, cancelled = false, stream = null;
    async function startRec() {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { toast(L.noMic); return; }
      try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); } catch { toast(L.micDenied); return; }
      const type = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/webm'].find(x => MediaRecorder.isTypeSupported?.(x)) || '';
      mr = new MediaRecorder(stream, type ? { mimeType: type, audioBitsPerSecond: 48000 } : undefined); chunks = []; cancelled = false;
      mr.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      mr.onstop = async () => { stream.getTracks().forEach(x => x.stop()); clearInterval(tick); rec.hidden = true; pill.hidden = false; f.classList.remove('is-rec'); setMode(); const ms = Date.now() - started; if (cancelled || ms < 600) return; const blob = new Blob(chunks, { type: (mr.mimeType || 'audio/webm').split(';')[0] }); await sendVoice(blob, Math.min(ms, 300000)); };
      mr.start(250); started = Date.now(); rec.hidden = false; pill.hidden = true; f.classList.add('is-rec'); act.replaceChildren(icon('send')); act.dataset.mode = 'rec'; act.setAttribute('aria-label', L.send);
      tick = setInterval(() => { const ms = Date.now() - started; recT.textContent = mmss(ms); if (ms >= 300000) mr.stop(); }, 250);
    }
    async function sendVoice(blob, ms) {
      act.disabled = true; try {
        const mime = blob.type || 'audio/webm'; const s = (await api('/api/chat/audio/start', { method: 'POST', body: JSON.stringify({ mime, size: blob.size }) })).data;
        const up = await fetch(s.signed_url, { method: 'PUT', headers: { 'Content-Type': s.mime, 'x-upsert': 'false' }, body: blob }); if (!up.ok) throw new Error(L.retry);
        await api('/api/chat/threads/' + t.id + '/messages', { method: 'POST', body: JSON.stringify({ audio_path: s.path, audio_ms: Math.max(300, Math.round(ms)) }) }); await after();
      } catch (e) { toast(e.message); } finally { act.disabled = false; }
    }
    recCancel.onclick = () => { cancelled = true; mr?.state === 'recording' && mr.stop(); };
    act.onclick = () => { if (act.dataset.mode === 'send') return sendText(); if (act.dataset.mode === 'rec') { mr?.state === 'recording' && mr.stop(); return; } startRec(); };
    return f;
  }
  async function contacts() {
    const sh = E('div', undefined, 'mkc-sheet'); const card = E('div', undefined, 'mkc-sheet-card'); const hd = E('header', undefined, 'mkc-bar'); const x = ibtn('back', L.close); x.onclick = () => sh.remove(); hd.append(x, E('h2', L.newChat), E('span')); card.append(hd);
    const sb = E('label', undefined, 'mkc-search'); sb.append(icon('search')); const qi = E('input'); qi.type = 'search'; qi.placeholder = L.search; qi.setAttribute('aria-label', L.search); sb.append(qi); card.append(sb);
    const box = E('div', undefined, 'mkc-contacts'); box.append(E('p', L.loading, 'mkc-sys')); card.append(box); sh.append(card); o.append(sh); qi.focus();
    let rows = []; try { rows = (await api('/api/chat/contacts')).data; } catch (e) { box.replaceChildren(E('p', e.message, 'mkc-sys')); return; }
    const draw = () => { box.replaceChildren(); const term = qi.value.trim().toLowerCase(); for (const [kind, label] of [['staff', L.team], ['student', L.students]]) { const g = rows.filter(r => r.kind === kind && (!term || r.name.toLowerCase().includes(term))); if (!g.length) continue; box.append(E('h3', label)); for (const c of g) { const b = E('button', undefined, 'mkc-trow'); b.type = 'button'; b.append(avatar(c.name)); const m = E('span', undefined, 'mkc-tmid'); m.append(E('strong', c.name), E('small', c.role || '')); b.append(m); b.onclick = async () => { b.disabled = true; try { const id = c.thread_id || (await api('/api/chat/direct', { method: 'POST', body: JSON.stringify({ user_id: c.user_id }) })).data.id; sh.remove(); await loadThreads(); openThread(threads.find(t => t.id === id) || { id, title: c.name, subtitle: c.role, kind: 'direct' }); } catch (e) { toast(e.message); b.disabled = false; } }; box.append(b); } } if (!box.children.length) box.append(E('p', L.empty, 'mkc-sys')); };
    qi.oninput = draw; draw();
  }
  loadThreads().then(() => { if (threadId) { const t = threads.find(x => x.id === threadId); if (t) openThread(t); } });
  back.focus();
  return { close };
}

// ---------------- Notification centre ----------------
export function openNotifications({ api, lang = 'en', onOpenChat, onChange = () => { }, summary = null }) {
  const L = tx(lang); const { o, close } = overlay('mkc-notif', L.notif); o.lang = lang;
  const bar = E('header', undefined, 'mkc-bar'); const bk = ibtn('back', L.close); bk.onclick = () => { close(); onChange(); }; bar.append(bk, E('h2', L.notif), E('span')); o.append(bar);
  const body = E('div', undefined, 'mkc-nbody'); o.append(body);
  const msgRow = E('button', undefined, 'mkc-nmsg'); msgRow.type = 'button'; const ic = E('span', undefined, 'mkc-nic is-chat'); ic.append(icon('chat')); const t = E('span', undefined, 'mkc-tmid'); const st = E('small', summary ? (summary.chat_unread ? fill(L.unread, { n: summary.chat_unread }) : L.allRead) : ''); t.append(E('strong', L.messages), st); msgRow.append(ic, t); if (summary?.chat_unread) msgRow.append(E('b', summary.chat_unread, 'mkc-badge'));
  msgRow.onclick = () => { close(); onOpenChat?.(); }; body.append(msgRow);
  const feed = E('div', undefined, 'mkc-feed'); feed.append(E('p', L.loading, 'mkc-sys')); body.append(feed);
  (async () => {
    let posts = []; try { posts = (await api('/api/feed')).data; } catch (e) { feed.replaceChildren(E('p', e.message, 'mkc-sys')); return; }
    feed.replaceChildren(); if (!posts.length) { feed.append(E('p', L.noFeed, 'mkc-empty')); return; }
    for (const p of posts) {
      const card = E('button', undefined, 'mkc-post mkc-post-' + p.kind + (p.read ? '' : ' is-new')); card.type = 'button';
      const media = E('span', undefined, 'mkc-pmedia'); if (p.poster) { const i = E('img'); i.src = p.poster; i.alt = ''; i.loading = 'lazy'; i.referrerPolicy = 'no-referrer'; i.onerror = () => i.remove(); media.append(i); } const k = E('span', undefined, 'mkc-nic is-' + p.kind); k.append(icon(p.kind === 'video' ? 'play' : p.kind === 'live' ? 'live' : 'news')); media.append(k);
      const txt = E('span', undefined, 'mkc-ptxt'); const tag = E('small', (p.kind === 'video' ? L.video : p.kind === 'live' ? L.live : L.news) + ' · ' + since(p.at, lang), 'mkc-ptag'); txt.append(tag, E('strong', p.title)); if (p.kind === 'live' && p.live_at) txt.append(E('span', fill(L.liveOn, { d: new Intl.DateTimeFormat(loc(lang), { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(p.live_at)) }), 'mkc-plive')); else if (p.body) txt.append(E('span', p.body.slice(0, 120), 'mkc-pbody'));
      card.append(media, txt); card.onclick = () => { if (!p.read) { p.read = true; card.classList.remove('is-new'); api('/api/feed/read', { method: 'POST', body: JSON.stringify({ ids: [p.id] }) }).then(onChange).catch(() => { }); } openPost(p, { lang, api }); }; feed.append(card);
    }
  })();
  bk.focus(); return { close };
}

// ---------------- Post / video viewer (p3 style) ----------------
export function openPost(p, { lang = 'en', api = null, onDelete = null } = {}) {
  const L = tx(lang); const { o, close } = overlay('mkc-viewer', p.title); o.lang = lang;
  const top = E('header', undefined, 'mkc-vtop'); const bk = ibtn('back', L.close, 'mkc-glass'); bk.onclick = close; const brand = E('span', p.author || 'MUK Talent', 'mkc-vauthor'); top.append(bk, brand);
  if (p.mine && api) { const del = ibtn('trash', L.remove, 'mkc-glass'); del.onclick = async () => { if (!confirm(L.remove + '?')) return; try { await api('/api/feed/' + p.id, { method: 'DELETE' }); close(); onDelete?.(); } catch (e) { toast(e.message); } }; top.append(del); } else top.append(E('span'));
  const stage = E('div', undefined, 'mkc-vcard'); let vid = null;
  if (p.poster) { const i = E('img', undefined, 'mkc-vposter'); i.src = p.poster; i.alt = ''; i.referrerPolicy = 'no-referrer'; i.onerror = () => i.remove(); stage.append(i); } else stage.classList.add('no-poster');
  const play = E('button', undefined, 'mkc-vbig'); play.type = 'button'; play.setAttribute('aria-label', L.watch); play.append(icon(p.kind === 'news' ? 'news' : p.kind === 'live' ? 'live' : 'play')); stage.append(play);
  const prog = E('div', undefined, 'mkc-vprog'); const cur = E('span', '0:00', 'mkc-tpill'); const wave = E('span', undefined, 'mkc-vwave'); let seed = 7; for (let i = 0; i < 48; i++) { seed = (seed * 53 + 17) % 97; const s = E('i'); s.style.height = (25 + seed % 75) + '%'; wave.append(s); } const dur = E('span', '--:--', 'mkc-tpill');
  prog.append(cur, wave, dur);
  if (p.url && p.play === 'video') {
    vid = E('video', undefined, 'mkc-vvideo'); vid.src = p.url; vid.playsInline = true; vid.preload = 'metadata'; if (p.poster) vid.poster = p.poster; vid.controls = false; stage.prepend(vid);
    vid.onloadedmetadata = () => { if (isFinite(vid.duration)) dur.textContent = mmss(vid.duration * 1000); };
    vid.ontimeupdate = () => { const r = vid.duration ? vid.currentTime / vid.duration : 0; cur.textContent = mmss(vid.currentTime * 1000); [...wave.children].forEach((s, i) => s.classList.toggle('on', i / 48 < r)); };
    vid.onplay = () => { stage.classList.add('is-playing'); play.replaceChildren(icon('pause')); }; vid.onpause = () => { stage.classList.remove('is-playing'); play.replaceChildren(icon('play')); };
    vid.onended = () => { stage.classList.remove('is-playing'); play.replaceChildren(icon('play')); };
    play.onclick = () => { vid.paused ? vid.play().catch(() => { }) : vid.pause(); };
    stage.onclick = e => { if (e.target === stage || e.target === vid) play.click(); };
    wave.onclick = e => { const r = wave.getBoundingClientRect(); if (vid.duration) vid.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * vid.duration; };
    const fs = ibtn('video', 'Fullscreen', 'mkc-glass mkc-vfs'); fs.onclick = e => { e.stopPropagation(); (vid.requestFullscreen || vid.webkitEnterFullscreen)?.call(vid); }; stage.append(fs);
  } else if (p.url && p.embed) {
    stage.classList.add('is-embed'); prog.hidden = true;
    play.onclick = () => { const f = E('iframe', undefined, 'mkc-vframe'); f.src = p.embed + (p.embed.includes('?') ? '&' : '?') + 'autoplay=1'; f.title = p.title; f.allow = 'autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share'; f.allowFullscreen = true; f.referrerPolicy = 'strict-origin-when-cross-origin'; stage.classList.add('is-playing', 'has-frame'); stage.append(f); play.remove(); };
  } else if (p.url) { play.onclick = () => window.open(p.url, '_blank', 'noopener'); prog.hidden = true; }
  else { prog.hidden = true; play.classList.add('is-static'); play.disabled = true; }
  const actions = E('div', undefined, 'mkc-vactions'); actions.append(E('span', p.kind === 'live' && p.live_at ? fill(L.liveOn, { d: new Intl.DateTimeFormat(loc(lang), { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(p.live_at)) }) : since(p.at, lang), 'mkc-apill'));
  const savedKey = 'mkc-saved'; const saved = () => { try { return JSON.parse(localStorage.getItem(savedKey) || '[]'); } catch { return []; } };
  const sv = ibtn('bookmark', L.save, 'mkc-round'); const paint = () => sv.classList.toggle('is-on', saved().includes(p.id)); paint(); sv.onclick = () => { const s = saved(); const i = s.indexOf(p.id); i < 0 ? s.push(p.id) : s.splice(i, 1); try { localStorage.setItem(savedKey, JSON.stringify(s.slice(-100))); } catch { } paint(); toast(i < 0 ? L.saved : L.remove); };
  const sh = ibtn('share', L.share, 'mkc-round'); sh.onclick = async () => { const url = p.url && p.play !== 'video' && !p.embed ? p.url : location.origin + '/portal'; try { if (navigator.share) await navigator.share({ title: p.title, text: p.body || p.title, url }); else { await navigator.clipboard.writeText(url); toast(L.copied); } } catch { } };
  actions.append(E('span', undefined, 'mkc-grow'), sv, sh);
  const h = E('h1', p.title, 'mkc-vtitle'); const d = E('p', p.body || '', 'mkc-vdesc');
  const scroll = E('div', undefined, 'mkc-vscroll'); scroll.append(stage, prog, actions, h, d);
  if (p.url && p.play !== 'video' && !p.embed) { const a = E('a', L.openLink, 'mkc-vlink'); a.href = p.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.prepend(icon('link')); scroll.append(a); }
  o.append(top, scroll); bk.focus();
  return { close };
}

// ---------------- Team composer: news / live / video ----------------
export function openComposer({ api, lang = 'en', preset = {}, mode = 'publish', onDone = () => { } }) {
  const L = tx(lang), prod = mode === 'production', heading = prod ? L.newProd : L.publish; const { o, close } = overlay('mkc-compose', heading); o.lang = lang;
  const f = E('form', undefined, 'mkc-cform'); const hd = E('header', undefined, 'mkc-bar'); const x = ibtn('close', L.close); x.onclick = close; hd.append(x, E('h2', heading), E('span')); f.append(hd);
  const v = { kind: preset.kind || 'video', title: preset.title || '', body: '', media_url: preset.url || '', asset_id: preset.asset_id || null, media_id: preset.media_id || null, poster_url: preset.poster_url || '', live_at: '', audience: preset.audience || 'all' };
  const field = (label, ctl) => { const w = E('label', undefined, 'mkc-field'); w.append(E('span', label), ctl); return w; };
  const seg = E('div', undefined, 'mkc-seg'); seg.setAttribute('role', 'radiogroup'); seg.setAttribute('aria-label', L.kind);
  for (const [k, lab, ic] of [['video', L.video, 'video'], ['news', L.news, 'news'], ['live', L.live, 'live']]) { const b = E('button', undefined, ''); b.type = 'button'; b.setAttribute('role', 'radio'); b.append(icon(ic), E('span', lab)); b.onclick = () => { v.kind = k; draw(); }; b.dataset.k = k; seg.append(b); }
  const title = E('input'); title.maxLength = 140; title.required = true; title.value = v.title; title.oninput = () => v.title = title.value;
  const desc = E('textarea'); desc.rows = 3; desc.maxLength = 2000; desc.oninput = () => v.body = desc.value;
  const when = E('input'); when.type = 'datetime-local'; when.oninput = () => v.live_at = when.value;
  let go = null; const aud = E('select'); aud.append(new Option(L.all, 'all'), new Option(L.mine, 'mine'), new Option(L.web, 'web')); aud.value = v.audience; const audNote = E('small', L.webNote, 'mkc-audnote'); aud.onchange = () => { v.audience = aud.value; audNote.hidden = aud.value !== 'web'; const sp = go?.querySelector('span'); if (sp && !prod) sp.textContent = aud.value === 'web' ? (L.pubWeb || L.publish) : L.publish; }; audNote.hidden = v.audience !== 'web';
  // video source
  const src = E('div', undefined, 'mkc-src'); const lib = E('p', '', 'mkc-libnote'); const url = E('input'); url.type = 'text'; url.inputMode = 'url'; url.autocomplete = 'off'; url.placeholder = L.urlPh; url.value = v.media_url; url.oninput = () => { v.media_url = url.value.trim(); v.media_id = null; v.asset_id = null; v.poster_url = ''; lib.hidden = true; resolveSoon(); };
  const up = E('label', undefined, 'mkc-upbtn'); up.append(icon('upload'), E('span', L.upload)); const file = E('input'); file.type = 'file'; file.accept = 'video/*'; up.append(file);
  const bar = E('div', undefined, 'mkc-upbar'); bar.hidden = true; const fillEl = E('i'); const pct = E('small'); bar.append(fillEl, pct);
  if (v.asset_id || v.media_id) { lib.textContent = L.fromLib + ': ' + (preset.title || ''); } else lib.hidden = true;
  const vm = E('button', undefined, 'mkc-upbtn mkc-vimeobtn'); vm.type = 'button'; vm.append(icon('video'), E('span', L.vimeo));
  const grid = E('div', undefined, 'mkc-vmgrid'); grid.hidden = true; let vmPage = 1;
  const pickVimeo = it => { v.media_url = it.url; v.media_id = null; v.asset_id = null; v.poster_url = it.poster || ''; url.value = it.url; lib.hidden = false; lib.textContent = L.vimeoReady + ': ' + (it.title || it.id); if (!v.title && it.title) { v.title = it.title.slice(0, 140); title.value = v.title; } grid.hidden = true; };
  async function loadVimeo(more) {
    vm.classList.add('is-busy'); if (!more) { grid.replaceChildren(E('p', L.loading, 'mkc-vmnote')); vmPage = 1; } grid.hidden = false;
    try { const r = await api('/api/media/vimeo/list?page=' + vmPage); if (!more) grid.replaceChildren(); grid.querySelector('.mkc-vmmore')?.remove();
      if (!r.data.length && !more) grid.append(E('p', L.vimeoEmpty, 'mkc-vmnote'));
      for (const it of r.data) { const b = E('button', undefined, 'mkc-vmitem'); b.type = 'button'; if (it.poster) { const im = E('img'); im.src = it.poster; im.alt = ''; im.loading = 'lazy'; im.referrerPolicy = 'no-referrer'; b.append(im); } b.append(E('span', it.title || it.id, 'mkc-vmtitle'), E('small', it.duration ? mmss(it.duration * 1000) : '', 'mkc-vmdur')); b.onclick = () => pickVimeo(it); grid.append(b); }
      if (r.more) { const m = E('button', L.vimeoMore, 'mkc-vmmore'); m.type = 'button'; m.onclick = () => { vmPage++; loadVimeo(true); }; grid.append(m); }
    } catch (e) { grid.replaceChildren(E('p', e.message, 'mkc-vmnote is-error')); } finally { vm.classList.remove('is-busy'); }
  }
  vm.onclick = () => grid.hidden && !grid.childElementCount ? loadVimeo(false) : (grid.hidden = !grid.hidden);
  let rt = 0; function resolveSoon() { clearTimeout(rt); const raw = url.value.trim(); if (!/vimeo\.com|youtu\.?be/i.test(raw)) return; rt = setTimeout(async () => { lib.hidden = false; lib.textContent = L.resolving; try { const m = (await api('/api/media/vimeo?url=' + encodeURIComponent(raw))).data; if (url.value.trim() !== raw) return; v.media_url = m.url; v.poster_url = m.poster || ''; if (/<iframe/i.test(raw)) url.value = m.url; lib.textContent = (m.provider === 'vimeo' ? L.vimeoReady : 'YouTube') + (m.title ? ': ' + m.title : ''); if (!v.title && m.title) { v.title = m.title.slice(0, 140); title.value = v.title; } } catch (e) { lib.textContent = e.message; } }, 450); }
  src.append(lib, up, bar, vm, grid, field(L.paste, url));
  file.onchange = async () => {
    const fl = file.files?.[0]; if (!fl) return; bar.hidden = false; up.classList.add('is-busy');
    try {
      const s = (await api('/api/media/cloudinary-sign', { method: 'POST', body: '{}' })).data;
      const res = await new Promise((resolve, reject) => { const fd = new FormData(); fd.append('file', fl); fd.append('api_key', s.api_key); fd.append('timestamp', s.timestamp); fd.append('folder', s.folder); fd.append('signature', s.signature); const xhr = new XMLHttpRequest(); xhr.open('POST', s.upload_url); xhr.upload.onprogress = e => { if (e.lengthComputable) { const p = Math.round(e.loaded / e.total * 100); fillEl.style.width = p + '%'; pct.textContent = fill(L.uploading, { p }); } }; xhr.onload = () => { let j = {}; try { j = JSON.parse(xhr.responseText); } catch { } xhr.status < 300 ? resolve(j) : reject(new Error(j.error?.message || 'Cloudinary error')); }; xhr.onerror = () => reject(new Error('Network error')); xhr.send(fd); });
      const m = (await api('/api/media', { method: 'POST', body: JSON.stringify({ url: res.secure_url, title: (v.title || fl.name).slice(0, 140), bytes: res.bytes || fl.size, duration: res.duration || 0 }) })).data;
      v.media_id = m.id; v.media_url = ''; v.asset_id = null; url.value = ''; lib.hidden = false; lib.textContent = L.fromLib + ': ' + m.title; if (!v.title) { v.title = fl.name.replace(/\.[^.]+$/, '').slice(0, 140); title.value = v.title; } pct.textContent = '100%';
    } catch (e) { toast(e.message); bar.hidden = true; } finally { up.classList.remove('is-busy'); file.value = ''; }
  };
  const wTitle = field(L.title, title), wDesc = field(L.description, desc), wWhen = field(L.when, when), wAud = field(L.audience, aud), wSrc = field(L.videoSrc, src); wAud.append(audNote);
  const msg = E('p', '', 'mkc-fmsg'); msg.setAttribute('role', 'status'); go = E('button', undefined, 'mkc-primary'); go.type = 'submit'; go.append(icon(prod ? 'upload' : 'send'), E('span', prod ? L.saveProd : v.audience === 'web' ? L.pubWeb : L.publish));
  const fixed = Boolean(preset.media_id || preset.asset_id) && !prod;
  const scroll = E('div', undefined, 'mkc-cscroll'); scroll.append(...(prod ? [wSrc, wTitle, msg, go] : [seg, wSrc, wTitle, wDesc, wWhen, wAud, msg, go])); f.append(scroll);
  if (fixed) { seg.hidden = true; up.hidden = vm.hidden = true; url.closest('.mkc-field').hidden = true; }
  function draw() { for (const b of seg.children) b.setAttribute('aria-checked', String(b.dataset.k === v.kind)); wSrc.hidden = v.kind === 'news' && !fixed; wWhen.hidden = v.kind !== 'live'; when.required = v.kind === 'live'; [...aud.options].find(op => op.value === 'web').disabled = v.kind !== 'video'; if (v.kind !== 'video' && aud.value === 'web') { aud.value = 'all'; v.audience = 'all'; audNote.hidden = true; } }
  draw();
  f.onsubmit = async e => {
    e.preventDefault(); if (!f.reportValidity()) return; go.disabled = true; msg.textContent = ''; msg.className = 'mkc-fmsg';
    if (prod) {
      try {
        let m = null;
        if (v.media_id) m = { id: v.media_id };
        else if (v.media_url) m = (await api('/api/media', { method: 'POST', body: JSON.stringify({ url: v.media_url, title: v.title.trim().slice(0, 140), poster_url: v.poster_url || null }) })).data;
        else { msg.textContent = L.needVideo; msg.classList.add('error'); go.disabled = false; return; }
        toast(L.prodSaved); close(); onDone(m);
      } catch (err) { msg.textContent = err.message; msg.classList.add('error'); go.disabled = false; }
      return;
    }
    const payload = { kind: v.kind, title: v.title.trim(), body: v.body.trim() || null, audience: v.audience, media_url: v.kind === 'news' ? (v.media_url || null) : (v.media_id || v.asset_id ? null : v.media_url || null), asset_id: v.kind === 'news' && !fixed ? null : v.asset_id, media_id: v.kind === 'news' && !fixed ? null : v.media_id, poster_url: v.poster_url || null, live_at: v.live_at ? new Date(v.live_at).toISOString() : null };
    try { const r = await api('/api/feed', { method: 'POST', body: JSON.stringify(payload) }); toast(L.published); close(); onDone(r.data); } catch (err) { msg.textContent = err.message; msg.classList.add('error'); go.disabled = false; }
  };
  o.append(f); title.focus(); return { close };
}

// ---------------- Video library helper for Studio ----------------
export async function listMedia(api, owner = null) { try { return (await api('/api/media' + (owner ? '?owner=' + encodeURIComponent(owner) : ''))).data || []; } catch { return []; } }
