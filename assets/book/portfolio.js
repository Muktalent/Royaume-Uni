import { $, $$, el, t, lang, items, safeUrl, isEmail, tagsOf, paragraphs, fmtDate, year, pad, icon, brandFor, ext, viewer, toolbar, certStatus, statusLabel } from './common.js';

const book = $('#book');
const D = { profile: null, projects: [], certs: [], exp: [], edu: [], links: [], error: false };
const mobile = () => matchMedia('(max-width: 980px)').matches;
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const byDate = (a, b) => String(b.issued_on || '').localeCompare(String(a.issued_on || ''));
let filter = '';
let viewerOpen = null;

/* ---------- Book state ---------- */
const PAGES = ['cv', 'work', 'contact'];
function setInert() {
  const open = book.dataset.state === 'open';
  $('#cover').inert = open;
  for (const id of PAGES) $('#' + id).inert = !open || (mobile() && book.dataset.page !== id);
  $$('#booknav a').forEach(a => a.setAttribute('aria-current', String(open ? a.dataset.go === book.dataset.page : a.dataset.go === 'cover')));
}
function openBook(page = 'cv', focus = true) {
  const was = book.dataset.state === 'open';
  book.dataset.state = 'open'; book.dataset.page = page; document.body.classList.add('book-open');
  setInert();
  if (mobile()) window.scrollTo({ top: 0, behavior: 'auto' });
  if (focus) setTimeout(() => { const h = $('#' + page); h && h.focus({ preventScroll: !mobile() }); }, was || reduced() || mobile() ? 0 : 900);
}
function closeBook() {
  book.dataset.state = 'closed'; document.body.classList.remove('book-open'); setInert();
  if (location.hash && location.hash !== '#cover') history.replaceState(null, '', location.pathname + location.search);
  $('#openBook').focus({ preventScroll: true });
}
function route() {
  let h = ''; try { h = decodeURIComponent(location.hash.slice(1)); } catch { return; }
  if (!h || h === 'cover') { if (book.dataset.state === 'open') closeBook(); return; }
  if (PAGES.includes(h)) { if (viewerOpen) viewerOpen.close(); openBook(h); return; }
  const p = D.projects.find(x => x.slug === h);
  if (p) { openBook('work', false); showProject(p); }
}
$('#openBook').addEventListener('click', () => { history.pushState(null, '', '#cv'); openBook('cv'); });
$('#closeBook').addEventListener('click', () => { history.pushState(null, '', location.pathname + location.search); closeBook(); });
window.addEventListener('hashchange', route);
window.addEventListener('popstate', route);
matchMedia('(max-width: 980px)').addEventListener('change', setInert);

/* ---------- Helpers ---------- */
const title = (id, text) => el('h2', { class: 'section-title', id }, el('span', { text }));
const sub = text => el('h3', { class: 'subtitle' }, el('span', { text }));
function range(it) {
  const s = year(it.issued_on), e = year(it.expires_on);
  if (!s && !e) return '';
  if (s && !e) return `${t('since')} ${s}`;
  if (s === e || !s) return e;
  return `${s} – ${e}`;
}
function fit(node, max, min) {
  node.style.fontSize = max + 'px';
  let size = max;
  while (size > min && node.scrollWidth > node.clientWidth + 1) { size -= 2; node.style.fontSize = size + 'px'; }
}
const firstName = n => String(n || '').trim().split(/\s+/)[0] || '';
function emailOf() {
  for (const l of D.links) { const c = [l.subtitle, l.title].find(isEmail); if (c) return c.trim(); }
  return '';
}

/* ---------- Cover ---------- */
function renderCover() {
  const p = D.profile, name = p?.title || 'Portfolio';
  document.title = p ? `${p.title} — ${t('work')}` : t('work');
  $('#coverEdition').textContent = `${t('edition')} · ${new Date().getFullYear()}`;
  const nm = $('#coverName'); nm.textContent = name.toUpperCase();
  $('#coverSub').textContent = p?.subtitle || '';
  const art = $('#coverArt'); art.replaceChildren(); art.classList.toggle('has-photo', !!p?.cover_url);
  if (p?.cover_url) { const im = el('img', { src: p.cover_url, alt: '', decoding: 'async' }); im.addEventListener('error', () => { im.remove(); art.classList.remove('has-photo'); }); art.append(im); }
  const stories = [];
  if (D.projects[0]) stories.push([t('h1'), D.projects[0].title]);
  const c = [...D.certs].sort(byDate)[0]; if (c) stories.push([t('h2'), c.title]);
  if (p?.category) stories.push([t('h3'), p.category]);
  if (!stories.length) stories.push([t('h1'), t('soon')]);
  $('#coverStories').replaceChildren(...stories.slice(0, 3).map(([k, v]) => el('div', { class: 'story' }, el('span', { class: 'story-k', text: k }), el('span', { class: 'story-v', text: v }))));
  $('#openLabel').textContent = t('open'); $('#openBook').setAttribute('aria-label', `${t('open')} — ${t('cv')}`);
  const latest = [...D.projects.map(x => ({ x, k: 'p' })), ...D.certs.map(x => ({ x, k: 'c' }))].sort((a, b) => byDate(a.x, b.x))[0];
  $('#coverLatest').hidden = !latest;
  if (latest) {
    $('#latestLabel').textContent = t('latest'); $('#latestAll').textContent = t('allPosts');
    const bar = $('#latestBar'); bar.textContent = latest.x.title;
    bar.onclick = () => { if (latest.k === 'p') location.hash = latest.x.slug; else location.href = '/certificates/#' + encodeURIComponent(latest.x.slug); };
  }
  $('#coverIssue').textContent = `${t('projects', D.projects.length)} · ${t('certCount', D.certs.length)}`;
  const go = () => fit(nm, mobile() ? 46 : 58, 22); requestAnimationFrame(go); document.fonts && document.fonts.ready.then(go);
}

/* ---------- Curriculum ---------- */
function timeline(list) {
  return el('ol', { class: 'timeline' }, list.map(it => el('li', { class: 'tl-item' },
    el('p', { class: 'tl-date', text: range(it) || '—' }),
    el('div', { class: 'tl-desc' },
      el('h4', { text: it.title }),
      it.issuer || it.category ? el('h5', {}, el('span', { class: 'arrow', text: '→ ' }), [it.issuer, it.category].filter(Boolean).join(' · ')) : null,
      ...paragraphs(it.body || it.subtitle),
      tagsOf(it.tags).length ? el('p', { class: 'tl-tags', text: tagsOf(it.tags).join(' · ') }) : null))));
}
function renderCv() {
  const p = D.profile, box = $('#cvBody');
  const out = [title('cvTitle', t('cv'))];
  if (!p) out.push(el('p', { class: 'about', text: D.error ? t('error') : t('profileSoon') }));
  else {
    out.push(el('p', { class: 'about' }, `${t('iam')} `, el('mark', { text: firstName(p.title) || p.title }), p.subtitle ? `. ${p.subtitle.replace(/^\s*[—-]\s*/, '')}` : '.'));
    const meta = [p.issuer && el('span', {}, icon('pin', 15), p.issuer), p.category && el('span', { class: 'now' }, el('i'), p.category)].filter(Boolean);
    if (meta.length) out.push(el('p', { class: 'meta' }, meta));
    const cv = safeUrl(p.document_url);
    if (cv) out.push(el('p', { class: 'launch' }, el('a', { class: 'pill', href: cv, target: '_blank', rel: 'noopener noreferrer' }, t('downloadCv'))));
    const body = paragraphs(p.body); if (body.length) out.push(el('div', { class: 'prose' }, body));
  }
  if (D.exp.length) out.push(sub(t('worked')), timeline(D.exp));
  if (D.edu.length) out.push(sub(t('studied')), timeline(D.edu));
  const skills = tagsOf(p?.tags);
  if (skills.length) out.push(sub(t('skills')), el('ul', { class: 'skills' }, skills.map(s => el('li', { text: s }))));
  if (D.certs.length) {
    const top = [...D.certs].sort(byDate).slice(0, 4);
    out.push(sub(t('learning')), el('ul', { class: 'mini-certs' }, top.map(c => el('li', {},
      el('a', { href: '/certificates/#' + encodeURIComponent(c.slug) }, icon('award', 20), el('span', {}, el('strong', { text: c.title }), el('small', { text: [c.issuer, year(c.issued_on)].filter(Boolean).join(' · ') })))))),
      el('p', { class: 'more' }, el('a', { href: '/certificates/', class: 'link-arrow' }, t('allCerts'), icon('arrow', 15))));
  }
  box.replaceChildren(...out);
}

/* ---------- Portfolio ---------- */
function renderWork() {
  const box = $('#workBody');
  const cats = [...new Set(D.projects.map(p => p.category).filter(Boolean))];
  if (filter && !cats.includes(filter)) filter = '';
  const out = [title('workTitle', t('work')), el('p', { class: 'intro', text: t('workIntro') })];
  if (cats.length > 1) out.push(el('div', { class: 'tabs', role: 'group', 'aria-label': t('category') },
    ['', ...cats].map(c => el('button', { type: 'button', 'aria-pressed': String(c === filter), text: c ? c.toUpperCase() : t('all'), onclick: () => { filter = c; renderWork(); } }))));
  const list = D.projects.filter(p => !filter || p.category === filter);
  if (!list.length) out.push(el('p', { class: 'empty', text: D.error ? t('error') : t('noWork') }));
  else out.push(el('div', { class: 'cards' }, list.map(p => {
    const n = D.projects.indexOf(p) + 1;
    const photo = el('span', { class: 'photo' + (p.cover_url ? '' : ' none') }, p.cover_url ? el('img', { src: p.cover_url, alt: '', loading: 'lazy', decoding: 'async' }) : el('b', { text: (p.title || '?').slice(0, 1) }));
    return el('article', { class: 'card' },
      el('a', { href: '#' + encodeURIComponent(p.slug), class: 'card-link', 'aria-label': `${t('viewProject')}: ${p.title}` }, photo,
        el('span', { class: 'card-k', text: [pad(n), p.category, year(p.issued_on)].filter(Boolean).join(' · ') }),
        el('h3', { text: p.title }), p.subtitle ? el('p', { text: p.subtitle }) : null));
  })));
  box.replaceChildren(...out);
}
function showProject(p) {
  if (viewerOpen) viewerOpen.close();
  const n = D.projects.indexOf(p) + 1;
  const links = [
    ext(p.website_url, [t('site'), icon('ext', 15)], 'pill small'),
    ext(p.repository_url, [t('code'), icon('code', 15)], 'pill small ghost'),
    ext(p.verification_url, [t('caseStudy'), icon('ext', 15)], 'pill small ghost'),
    ext(p.document_url, [t('report'), icon('doc', 15)], 'pill small ghost'),
  ].filter(Boolean);
  const rows = [[t('role'), p.issuer], [t('date'), fmtDate(p.issued_on)], [t('category'), p.category]].filter(r => r[1]);
  const info = [
    el('p', { class: 'kicker', text: `${t('work')} · ${pad(n)}` }),
    el('h2', { text: p.title }),
    p.subtitle ? el('p', { class: 'lede', text: p.subtitle }) : null,
    el('div', { class: 'prose' }, paragraphs(p.body)),
    rows.length ? el('dl', {}, rows.flatMap(([k, v]) => [el('dt', { text: k }), el('dd', { text: v })])) : null,
    tagsOf(p.tags).length ? el('ul', { class: 'skills small' }, tagsOf(p.tags).map(s => el('li', { text: s }))) : null,
    links.length ? el('p', { class: 'v-links' }, links) : null,
  ];
  viewerOpen = viewer({
    label: p.title, images: [p.cover_url, ...(p.gallery_urls || [])].filter(Boolean), info,
    onClose: () => { viewerOpen = null; if (location.hash.slice(1) === encodeURIComponent(p.slug)) history.replaceState(null, '', '#work'); },
  });
}

/* ---------- Contact ---------- */
function renderContact() {
  const p = D.profile, box = $('#contactBody'), email = emailOf();
  const out = [title('contactTitle', t('contact')), el('p', { class: 'intro center', text: t('contactLead') })];
  const seen = new Set(), socials = [];
  const add = (url, label) => { const u = safeUrl(url); if (!u || seen.has(u)) return; seen.add(u); socials.push([u, label]); };
  for (const l of D.links) add(l.website_url, l.title);
  if (p) { add(p.website_url, 'LinkedIn'); add(p.repository_url, 'GitHub'); }
  if (email) socials.push(['mailto:' + email, email]);
  if (socials.length) out.push(sub(t('social')), el('ul', { class: 'socials' }, socials.map(([u, label]) => el('li', {},
    el('a', { href: u, target: u.startsWith('mailto:') ? null : '_blank', rel: 'noopener noreferrer', 'aria-label': label, title: label }, icon(u.startsWith('mailto:') ? 'mail' : brandFor(u), 20))))));
  const contactUrl = safeUrl(p?.verification_url);
  if (email || p) {
    out.push(sub(t('letter')));
    const stamp = el('div', { class: 'stamp' }, el('span', { class: 'stamp-img' + (p?.cover_url ? '' : ' art') }, p?.cover_url ? el('img', { src: p.cover_url, alt: '', loading: 'lazy' }) : null), el('span', { class: 'stamp-val', text: '1st' }));
    const head = el('div', { class: 'letter-head' },
      el('div', {}, el('p', { class: 'signature', text: p?.title || '' }),
        email ? el('p', {}, el('a', { href: 'mailto:' + email, text: email })) : null,
        p?.issuer ? el('p', { class: 'muted', text: '— ' + p.issuer }) : null),
      el('div', { class: 'post' }, el('span', { class: 'postmark', 'aria-hidden': 'true' }, el('span', { text: 'MUK' }), el('span', { text: new Date().getFullYear() })), stamp));
    const letter = el('div', { class: 'letter' }, head);
    if (email) {
      const f = el('form', { class: 'letter-form', novalidate: true },
        el('label', {}, el('span', { text: t('yourName') }), el('input', { name: 'n', maxlength: 80, autocomplete: 'name', required: true })),
        el('label', {}, el('span', { text: t('subject') }), el('input', { name: 's', maxlength: 120, required: true })),
        el('label', { class: 'msg' }, el('span', { text: t('message') }), el('textarea', { name: 'm', rows: 5, maxlength: 1500, required: true })),
        el('p', { class: 'send' }, el('small', { text: t('sendHint') }), el('button', { type: 'submit', class: 'pill' }, t('send'), icon('arrow', 15))));
      f.addEventListener('submit', e => {
        e.preventDefault();
        const v = k => f.elements[k].value.replace(/[\r\n]+/g, k === 'm' ? '\n' : ' ').trim();
        for (const k of ['n', 's', 'm']) if (!v(k)) { f.elements[k].focus(); return; }
        const href = `mailto:${email}?subject=${encodeURIComponent(v('s'))}&body=${encodeURIComponent(v('m') + '\n\n— ' + v('n'))}`;
        location.href = href.slice(0, 1900);
      });
      letter.append(f);
    } else if (contactUrl) letter.append(el('p', { class: 'send' }, ext(contactUrl, [t('bookCall'), icon('calendar', 15)], 'pill')));
    out.push(el('div', { class: 'airmail' }, letter));
  }
  out.push(el('a', { class: 'cert-card', href: '/certificates/' }, icon('award', 26), el('span', {}, el('strong', { text: t('certs') }), el('small', { text: t('certCount', D.certs.length) })), icon('arrow', 18)));
  box.replaceChildren(...out);
  $('#closeLabel').textContent = t('close'); $('#closeBook').setAttribute('aria-label', t('close')); $('#closeBook').title = t('close');
}

/* ---------- Nav ---------- */
function renderNav() {
  const map = { cover: ['home', t('cover')], cv: ['cv', t('cv')], work: ['work', t('work')], contact: ['mail', t('contact')], certs: ['award', t('certs')] };
  for (const a of $$('#booknav a')) { const [ic, label] = map[a.dataset.go]; a.replaceChildren(icon(ic, 19), el('span', { text: label })); a.title = label; }
}

function renderAll() { renderNav(); renderCover(); renderCv(); renderWork(); renderContact(); setInert(); }

toolbar(renderAll);
renderAll();
book.classList.add('loading');
try {
  const settle = k => items(k).catch(e => { if (['project', 'profile'].includes(k)) throw e; return []; });
  const [profile, projects, certs, exp, edu, links] = await Promise.all(['profile', 'project', 'certificate', 'experience', 'education', 'link'].map(settle));
  Object.assign(D, { profile: profile[0] || null, projects, certs, exp, edu, links });
} catch { D.error = true; }
book.classList.remove('loading');
renderAll();
route();
let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => fit($('#coverName'), mobile() ? 46 : 58, 24), 150); });
