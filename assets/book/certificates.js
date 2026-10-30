import { $, $$, el, t, items, safeUrl, tagsOf, paragraphs, fmtDate, year, pad, icon, ext, viewer, toolbar, certStatus, statusLabel } from './common.js';

const D = { certs: [], profile: null, error: false, loading: true };
let filter = '', open = null;
const byDate = (a, b) => String(b.issued_on || '').localeCompare(String(a.issued_on || ''));

function nav() {
  const map = { cover: ['home', t('cover')], cv: ['cv', t('cv')], work: ['work', t('work')], contact: ['mail', t('contact')], certs: ['award', t('certs')] };
  for (const a of $$('#booknav a')) { const [ic, label] = map[a.dataset.go]; a.replaceChildren(icon(ic, 19), el('span', { text: label })); a.title = label; }
}
const pill = c => { const s = certStatus(c); return el('span', { class: 'status-pill ' + s, text: statusLabel(s) }); };

function show(c) {
  if (open) open.close();
  const n = D.certs.indexOf(c) + 1;
  const rows = [[t('issuer'), c.issuer], [t('issued'), fmtDate(c.issued_on, true)], [t('expires'), c.expires_on ? fmtDate(c.expires_on, true) : t('noExpiry')], [t('credId'), c.subtitle], [t('category'), c.category]].filter(r => r[1]);
  const links = [ext(c.verification_url, [t('verifyIssuer'), icon('check', 15)], 'pill small'), ext(c.document_url, [t('pdf'), icon('doc', 15)], 'pill small ghost')].filter(Boolean);
  open = viewer({
    label: c.title, images: [c.cover_url, ...(c.gallery_urls || [])].filter(Boolean),
    info: [el('p', { class: 'kicker', text: `${t('certs')} · ${pad(n)}` }), el('h2', { text: c.title }), pill(c),
      el('dl', {}, rows.flatMap(([k, v]) => [el('dt', { text: k }), el('dd', { text: v })])),
      el('div', { class: 'prose' }, paragraphs(c.body)),
      tagsOf(c.tags).length ? el('ul', { class: 'skills small' }, tagsOf(c.tags).map(s => el('li', { text: s }))) : null,
      links.length ? el('p', { class: 'v-links' }, links) : null],
    onClose: () => { open = null; if (location.hash) history.replaceState(null, '', location.pathname + location.search); },
  });
}

function render() {
  nav();
  const name = D.profile?.title;
  document.title = name ? `${name} — ${t('certs')}` : t('certs');
  const out = [el('h1', { class: 'section-title' }, el('span', { text: t('certTitle') })), el('p', { class: 'intro center', text: t('certIntro') })];
  const list = D.certs;
  if (list.length) {
    const issuers = new Set(list.map(c => c.issuer).filter(Boolean)).size, ver = list.filter(c => safeUrl(c.verification_url)).length;
    const latest = list.map(c => year(c.issued_on)).filter(Boolean).sort().pop() || '—';
    out.push(el('div', { class: 'stats' }, [[pad(list.length), t('credentials')], [pad(issuers), t('issuers')], [pad(ver), t('verifiable')], [latest, t('latest')]].map(([b, s]) => el('div', {}, el('b', { text: b }), el('span', { text: s })))));
    const cats = [...new Set(list.map(c => c.category).filter(Boolean))];
    if (filter && !cats.includes(filter)) filter = '';
    if (cats.length > 1) out.push(el('div', { class: 'tabs', role: 'group', 'aria-label': t('category') },
      ['', ...cats].map(c => el('button', { type: 'button', 'aria-pressed': String(c === filter), text: c ? c.toUpperCase() : t('all'), onclick: () => { filter = c; render(); } }))));
    const shown = list.filter(c => !filter || c.category === filter);
    out.push(el('div', { class: 'cert-grid' }, shown.map(c => {
      const n = list.indexOf(c) + 1;
      const frame = el('button', { type: 'button', class: 'frame', 'aria-label': `${t('details')}: ${c.title}`, onclick: () => { location.hash = encodeURIComponent(c.slug); } },
        el('span', { class: 'tape', 'aria-hidden': 'true' }),
        el('span', { class: 'img' }, c.cover_url ? el('img', { src: c.cover_url, alt: '', loading: 'lazy', decoding: 'async' }) : el('span', { class: 'seal' }, el('span', {}, icon('award', 40), el('b', { text: c.issuer || t('certs') })))));
      const acts = [el('button', { type: 'button', onclick: () => { location.hash = encodeURIComponent(c.slug); } }, t('details'), icon('ext', 13)),
        ext(c.verification_url, [t('verify'), icon('check', 13)]), ext(c.document_url, [t('pdf'), icon('doc', 13)])].filter(Boolean);
      return el('article', { class: 'cert' }, frame,
        el('p', { class: 'k' }, el('span', { text: [pad(n), c.category].filter(Boolean).join(' · ') }), pill(c)),
        el('h3', { text: c.title }), el('p', { class: 'by', text: [c.issuer, fmtDate(c.issued_on)].filter(Boolean).join(' · ') }), el('div', { class: 'acts' }, acts));
    })));
    if (list.length >= 4) {
      out.push(el('h2', { class: 'subtitle' }, el('span', { text: t('index') })), el('div', { class: 'ledger-wrap' }, el('table', { class: 'ledger' },
        el('thead', {}, el('tr', {}, ['№', t('credentials'), t('issuer'), t('issued'), 'Status', t('verify')].map((h, k) => el('th', { class: k === 2 || k === 3 ? 'hide-s' : null, text: k === 4 ? '' : h })))),
        el('tbody', {}, list.map((c, k) => el('tr', {},
          el('td', { text: pad(k + 1) }),
          el('td', {}, el('a', { href: '#' + encodeURIComponent(c.slug), text: c.title })),
          el('td', { class: 'hide-s', text: c.issuer || '—' }),
          el('td', { class: 'hide-s', text: fmtDate(c.issued_on) || '—' }),
          el('td', {}, pill(c)),
          el('td', {}, ext(c.verification_url, [t('verify'), ' ↗']) || '—')))))));
    }
  } else out.push(el('p', { class: 'empty', text: D.loading ? '…' : D.error ? t('error') : t('noCerts') }));
  out.push(el('p', { class: 'sheet-foot' }, el('a', { class: 'pill small ghost', href: '/portfolio/#cv' }, icon('left', 15), t('backBook')), el('a', { class: 'pill small', href: '/portfolio/#contact' }, t('contact'), icon('mail', 15))));
  $('#sheetBody').replaceChildren(...out);
}

function route() {
  let h = ''; try { h = decodeURIComponent(location.hash.slice(1)); } catch { return; }
  const c = D.certs.find(x => x.slug === h);
  if (c) show(c); else if (open) open.close();
}
addEventListener('hashchange', route);
toolbar(render);
render();
try {
  const [certs, profile] = await Promise.all([items('certificate'), items('profile').catch(() => [])]);
  D.certs = certs.sort((a, b) => (a.sort_order - b.sort_order) || byDate(a, b)); D.profile = profile[0] || null;
} catch { D.error = true; }
D.loading = false;
render(); route();
