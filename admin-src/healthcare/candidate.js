// MUKTalent Healthcare portal · private candidate portal (EN / ES / FR / AR).
import { S, h, clear, put, icon, t, T, api, go, parseRoute, field, input, select, textarea, formData, showFieldError, busy, toast, dialog, confirmBox, badge, empty, card, fmtDate, fmtDateTime, ago, country, countryOptions, initials, bytes, openSigned, LANGS, setLang } from './core.js';
import { PROF, REG, ENG, EMP, opts } from './auth.js';

const NAV = [
  ['application', 'n_application', 'home'], ['journey', 'n_journey', 'route'], ['documents', 'n_documents', 'folder'],
  ['opportunities', 'n_opportunities', 'briefcase'], ['interviews', 'n_interviews', 'calendar'], ['consultant', 'n_consultant', 'user'],
  ['messages', 'n_messages', 'chat'], ['notifications', 'n_notifications', 'bell'], ['profile', 'n_profile', 'users'], ['help', 'n_help', 'help']
];
const JOURNEY = {
  registration: ['Initial Registration', 'You register online and receive a candidate reference number.'],
  assessment: ['Candidate Assessment', 'A consultant reviews your experience, goals and eligibility.'],
  verification: ['Documentation and Qualification Verification', 'We check qualifications, registration status and references.'],
  matching: ['Employer Matching', 'Where appropriate, we present your profile to suitable employers.'],
  interviews: ['Interviews and Selection', 'We coordinate interviews and help you prepare.'],
  offer: ['Employment Offer', 'The employer makes any offer directly; we help you understand it.'],
  pre_employment: ['Pre-employment and Immigration Preparation', 'Employer checks, sponsorship and visa steps.'],
  pre_departure: ['Pre-departure Support', 'Practical guidance before you travel, where offered.']
};
const CONTRACT = { permanent: 'Permanent', fixed_term: 'Fixed term', bank: 'Bank', part_time: 'Part time', other: 'Other' };
const DOC_TONE = { requested: 'gold', uploaded: 'teal', approved: 'green', rejected: 'red' };
const APP_TONE = { applied: 'grey', under_review: 'teal', shortlisted: 'teal', submitted_to_employer: 'teal', interview: 'gold', offer: 'gold', accepted: 'green', unsuccessful: 'red', withdrawn: 'grey' };
const ACCEPT = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/webp';
const MIMES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

let B; // current bundle
const app = () => document.getElementById('app');
const salary = v => v.salary_text || (v.salary_min ? '£' + v.salary_min.toLocaleString('en-GB') + (v.salary_max ? '–£' + v.salary_max.toLocaleString('en-GB') : '') : '');
const unread = () => ({
  messages: B.messages.filter(m => m.sender_role !== 'candidate' && !m.read_by_candidate_at).length,
  notifications: B.notifications.filter(n => !n.read_at).length,
  documents: B.documents.filter(d => d.status === 'requested' || d.status === 'rejected').length,
  interviews: B.interviews.filter(i => i.status === 'scheduled' && new Date(i.scheduled_at) > Date.now()).length
});

export async function candidateApp(me) {
  B = me.data;
  const pref = B.candidate.preferred_language;
  if (!new URLSearchParams(location.search).get('lang') && !localStorage.getItem('hc-lang') && pref && pref !== S.lang) await setLang(pref);
  S.onRoute = render;
  render();
}
async function reload() { B = (await api('portal/bundle')).data; render(); }

function render() {
  const [sec = 'application'] = parseRoute();
  const cur = NAV.find(n => n[0] === sec) || NAV[0];
  const c = unread();
  const nav = h('nav', { class: 'pt-nav', 'aria-label': t('portal_label') }, NAV.map(([k, label, ic]) =>
    h('a', { href: '#/' + k, 'aria-current': k === cur[0] ? 'page' : null, onclick: () => shellEl.classList.remove('nav-open') }, icon(ic), h('span', { text: t(label) }), c[k] ? h('span', { class: 'pt-count', text: c[k] }) : null)));
  const side = h('aside', { class: 'pt-side', id: 'pt-side' },
    h('a', { class: 'pt-brand', href: '/healthcare/' }, h('img', { src: '/healthcare/assets/img/mark-light.svg', alt: '', width: 36, height: 36 }), h('span', null, h('b', { text: 'MUKTalent' }), h('small', { text: 'Healthcare' }))),
    h('p', { class: 'pt-side-label', text: t('portal_label') }), nav,
    h('div', { class: 'pt-side-foot' },
      h('a', { href: '/healthcare/' }, icon('globe'), h('span', { text: t('back_site') })),
      h('button', { type: 'button', onclick: () => S.signOut() }, icon('out'), h('span', { text: t('sign_out') }))));
  const langSel = select('lang', LANGS, S.lang, { class: 'pt-lang', 'aria-label': 'Language' });
  langSel.addEventListener('change', async () => {
    await setLang(langSel.value); render();
    api('portal/profile', { method: 'PATCH', body: { preferred_language: langSel.value } }).then(r => { B = r.data; }).catch(() => {});
  });
  const body = h('div', { class: 'pt-body', id: 'main', tabindex: '-1' });
  const top = h('header', { class: 'pt-top' },
    h('button', { class: 'pt-menu', type: 'button', 'aria-label': 'Menu', 'aria-controls': 'pt-side', onclick: () => shellEl.classList.toggle('nav-open') }, icon('menu', 20)),
    h('h1', { text: t(cur[1]) }), langSel,
    h('div', { class: 'pt-user' }, h('span', { class: 'pt-avatar', text: initials(B.candidate.full_name) }), h('span', { class: 'pt-user-tx' }, h('b', { text: B.candidate.full_name }), h('span', { text: B.candidate.reference }))));
  const shellEl = h('div', { class: 'pt-app candidate' }, side, h('div', { class: 'pt-main' }, top, body), h('div', { class: 'pt-scrim', onclick: () => shellEl.classList.remove('nav-open') }));
  clear(app(), shellEl);
  document.title = t(cur[1]) + ' · MUKTalent Healthcare';
  (SECTIONS[cur[0]] || SECTIONS.application)(body);
  window.scrollTo(0, 0);
}

/* ---------- shared bits ---------- */
const stageLabel = s => t('st_' + s);
function hero() {
  const c = B.candidate, idx = Math.min(c.journey_index, 7);
  const pct = B.closed ? 100 : Math.round(((idx + (c.stage === 'recruitment_completed' ? 1 : 0.5)) / 8) * 100);
  return h('section', { class: 'pt-hero' },
    h('div', null, h('span', { class: 'k', text: t('step_of', { n: idx + 1 }) }), h('h2', { text: t('welcome', { name: c.full_name.split(' ')[0] }) }), h('p', { text: t('hero_p') })),
    h('div', { class: 'pt-hero-side' }, h('span', { class: 'ref', text: t('ref') + ' · ' + c.reference }), h('div', { class: 'pt-progress', role: 'progressbar', 'aria-valuenow': pct, 'aria-valuemin': 0, 'aria-valuemax': 100 }, h('i', { style: { width: pct + '%' } }))));
}
function restrictedNotice() {
  return B.restricted ? h('div', { class: 'pt-notice warn', role: 'note' }, icon('flag'), h('span', null, t('ap_restricted') + ' ', h('a', { href: 'https://www.jobs.nhs.uk/', target: '_blank', rel: 'noopener', text: 'NHS Jobs' }))) : null;
}
function closedNotice() {
  if (!B.closed) return null;
  return h('div', { class: 'pt-notice' + (B.closed === 'unsuccessful' ? ' warn' : ''), role: 'note' }, icon('alert'), h('span', { text: t(B.closed === 'withdrawn' ? 'ap_closed_withdrawn' : 'ap_closed_unsuccessful') }));
}
function miniJourney() {
  return h('div', { class: 'pt-mini-journey', 'aria-hidden': 'true' }, B.journey.map(j => h('i', { class: j.state })));
}
function noFees() { return h('div', { class: 'pt-notice' }, icon('shield'), h('span', { text: T('Candidates are not charged recruitment or work-finding fees by MUKTalent Healthcare.') })); }
const dl = rows => h('dl', { class: 'pt-dl' }, rows.filter(Boolean).flatMap(([k, v]) => [h('dt', { text: k }), h('dd', null, v == null || v === '' ? t('not_provided') : v)]));

/* ---------- sections ---------- */
const SECTIONS = {
  application(el) {
    const c = B.candidate, cn = B.consultant, n = unread();
    const next = B.documents.find(d => d.status === 'requested' || d.status === 'rejected');
    const nextIv = B.interviews.find(i => i.status === 'scheduled' && new Date(i.scheduled_at) > Date.now());
    put(el, hero(), restrictedNotice(), closedNotice(),
      h('div', { class: 'pt-grid pt-g4' },
        stat(t('ap_status'), stageLabel(c.stage), '#/journey', 'small'),
        stat(t('n_documents'), String(n.documents), '#/documents', n.documents ? 'warn' : ''),
        stat(t('n_messages'), String(n.messages), '#/messages', n.messages ? 'gold' : ''),
        stat(t('n_interviews'), String(n.interviews), '#/interviews')),
      h('div', { class: 'pt-grid pt-g21' },
        card(t('ap_h'), [
          miniJourney(),
          dl([[t('ap_status'), h('span', null, badge(stageLabel(c.stage), B.closed ? 'grey' : 'teal'), h('small', { class: 'pt-since', text: t('ap_since', { date: fmtDate(c.stage_changed_at || c.created_at) }) }))],
            [T('Healthcare Profession'), T(PROF[c.profession] || c.profession)], [T('Country of Residence'), country(c.country_residence)],
            [t('ap_registered'), fmtDate(c.created_at)], [t('ap_consultant'), cn ? cn.full_name : t('ap_assigning')]]),
          h('div', { class: 'pt-actions' }, h('a', { class: 'hc-btn hc-btn-line pt-btn-sm', href: '#/journey' }, t('n_journey'), icon('arrow', 16)))]),
        h('div', { class: 'pt-stack' },
          next ? card(t('d_req_h'), h('div', { class: 'pt-item' }, h('span', { class: 'ic' }, icon('file')), h('span', { class: 'tx' }, h('b', { text: docName(next) }), h('small', { text: next.note || t('d_' + next.status) })), h('a', { class: 'hc-btn hc-btn-gold pt-btn-sm', href: '#/documents', text: t('d_upload') }))) : null,
          nextIv ? card(t('n_interviews'), interviewItem(nextIv)) : null,
          consultantCard(true)))
    , card(t('ap_vac_h'), B.applications.length ? h('div', { class: 'pt-list' }, B.applications.map(appItem)) : empty('briefcase', t('ap_vac_none'), null, h('a', { class: 'hc-btn hc-btn-line pt-btn-sm', href: '#/opportunities', text: t('n_opportunities') }))), noFees());
  },

  journey(el) {
    const c = B.candidate;
    put(el, restrictedNotice(), closedNotice(), h('div', { class: 'pt-grid pt-g21' },
      card(t('j_h'), [h('p', { class: 'pt-muted', text: t('j_p') }),
        h('ol', { class: 'pt-journey' }, B.journey.map((j, i) => {
          const [title, desc] = JOURNEY[j.key];
          return h('li', { class: j.state, 'aria-current': j.state === 'current' ? 'step' : null },
            h('span', { class: 'dot', text: j.state === 'done' ? '' : String(i + 1) }, j.state === 'done' ? icon('check', 18) : null),
            h('div', null, h('h4', { text: T(title) }), h('p', { text: T(desc) }),
              j.state === 'current' ? h('p', { class: 'pt-j-meta' }, badge(t('j_current'), 'gold'), ' ', stageLabel(c.stage)) :
              j.reached_at && j.state === 'done' ? h('p', { class: 'pt-j-meta', text: t('j_reached', { date: fmtDate(j.reached_at) }) }) : null));
        }))]),
      h('div', { class: 'pt-stack' }, card(t('ap_status'), [h('p', { class: 'pt-big', text: stageLabel(c.stage) }), h('p', { class: 'pt-muted', text: t('ap_since', { date: fmtDate(c.stage_changed_at || c.created_at) }) })]), consultantCard(true), noFees())));
  },

  documents(el) {
    const requested = B.documents.filter(d => !['cv', 'other'].includes(d.kind) || d.status === 'requested' && d.label !== 'CV' && d.label !== 'Additional document');
    const own = B.documents.filter(d => !requested.includes(d));
    put(el, h('div', { class: 'pt-notice' }, icon('lock'), h('span', { text: t('d_p') })),
      card(t('d_req_h'), requested.length ? h('div', { class: 'pt-list' }, requested.map(docItem)) : empty('folder', t('d_none'))),
      card(t('d_cv_h'), [own.length ? h('div', { class: 'pt-list' }, own.map(docItem)) : null,
        h('div', { class: 'pt-grid pt-g2 pt-drops' }, dropZone('cv', t('d_cv_add')), dropZone('other', t('d_other_add')))]));
  },

  opportunities(el) {
    const applied = new Set(B.applications.filter(a => a.status !== 'withdrawn').map(a => a.vacancy?.id));
    put(el, h('p', { class: 'pt-muted pt-intro', text: t('o_p') }), B.restricted ? h('div', { class: 'pt-notice warn' }, icon('flag'), h('span', null, t('o_restricted') + ' ', h('a', { href: 'https://www.jobs.nhs.uk/', target: '_blank', rel: 'noopener', text: 'NHS Jobs' }))) : null);
    if (!B.opportunities.length) { put(el, card(null, empty('briefcase', t('o_h'), t('o_none')))); return; }
    put(el, h('div', { class: 'pt-grid pt-g2' }, B.opportunities.map(v => {
      const done = applied.has(v.id);
      return h('article', { class: 'pt-card pt-opp' },
        h('span', { class: 'pt-badge teal', text: T(PROF[v.profession] || 'Healthcare') }),
        h('h4', { lang: 'en', text: v.title }),
        h('div', { class: 'meta' }, h('span', null, icon('building', 15), v.employer_display || T('Confidential UK employer')), h('span', null, icon('pin', 15), v.location || '—'),
          v.contract_type ? h('span', null, icon('briefcase', 15), T(CONTRACT[v.contract_type] || v.contract_type)) : null, salary(v) ? h('span', null, icon('star', 15), salary(v)) : null,
          v.closes_on ? h('span', null, icon('clock', 15), T('Closes {d}').replace('{d}', fmtDate(v.closes_on))) : null),
        h('div', { class: 'pt-actions' },
          h('a', { class: 'hc-btn hc-btn-line pt-btn-sm', href: '/healthcare/vacancies/?v=' + encodeURIComponent(v.slug) + (S.lang === 'en' ? '' : '&lang=' + S.lang), target: '_blank', rel: 'noopener', text: t('o_view') }),
          done ? badge(t('o_applied'), 'green') : B.restricted || B.closed ? null : h('button', { class: 'hc-btn hc-btn-teal pt-btn-sm', type: 'button', onclick: () => applyTo(v), text: t('o_apply') })));
    })));
  },

  interviews(el) {
    const list = [...B.interviews].sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at));
    put(el, card(t('i_h'), list.length ? h('div', { class: 'pt-list' }, list.map(interviewItem)) : empty('calendar', t('i_none'))));
  },

  consultant(el) { put(el, h('div', { class: 'pt-grid pt-g21' }, consultantCard(false), noFees())); },

  messages(el) {
    const thread = h('div', { class: 'pt-thread', role: 'log', 'aria-live': 'polite' },
      B.messages.length ? B.messages.map(bubble) : empty('chat', t('m_h'), t('m_none')));
    const ta = textarea('body', '', { rows: 2, placeholder: t('m_ph'), 'aria-label': t('m_ph'), maxlength: 4000 });
    const btn = h('button', { class: 'hc-btn hc-btn-teal', type: 'submit' }, t('m_send'));
    const form = h('form', { class: 'pt-compose' }, ta, btn);
    form.addEventListener('submit', async e => {
      e.preventDefault(); if (!ta.value.trim()) return;
      busy(btn, true);
      try { B = (await api('portal/messages', { method: 'POST', body: { body: ta.value.trim() } })).data; render(); }
      catch (x) { busy(btn, false); toast(x.message, true); }
    });
    ta.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) form.requestSubmit(); });
    put(el, card(t('m_h'), [h('p', { class: 'pt-muted', text: t('m_p') }), thread, form], B.consultant ? h('span', { class: 'pt-muted', text: B.consultant.full_name }) : null));
    requestAnimationFrame(() => { thread.scrollTop = thread.scrollHeight; });
    if (unread().messages) api('portal/read', { method: 'POST', body: { what: 'messages' } }).then(() => { B.messages.forEach(m => { m.read_by_candidate_at ||= new Date().toISOString(); }); }).catch(() => {});
  },

  notifications(el) {
    put(el, card(t('nt_h'), B.notifications.length ? h('div', { class: 'pt-list' }, B.notifications.map(n =>
      h('div', { class: 'pt-item' + (n.read_at ? '' : ' unread') }, h('span', { class: 'ic' }, icon(NT_ICON[n.link] || 'bell')),
        h('span', { class: 'tx' }, h('b', { text: ntTitle(n.title) }), h('small', { text: ntBody(n) + ' · ' + ago(n.created_at) })),
        n.link && SECTIONS[n.link] ? h('a', { class: 'hc-btn hc-btn-line pt-btn-sm', href: '#/' + n.link, text: t('nt_open') }) : null))) : empty('bell', t('nt_none'))));
    if (unread().notifications) api('portal/read', { method: 'POST', body: { what: 'notifications' } }).then(() => { B.notifications.forEach(n => { n.read_at ||= new Date().toISOString(); }); }).catch(() => {});
  },

  profile(el) { profileView(el); },

  help(el) {
    const L = S.lang === 'en' ? '' : '?lang=' + S.lang;
    const faq = [['q1', null, T('Candidates are not charged recruitment or work-finding fees by MUKTalent Healthcare.')], ['q2', 'a2'], ['q3', 'a3'], ['q4', 'a4'], ['q5', 'a5']];
    put(el, h('div', { class: 'pt-grid pt-g21' },
      card(t('h_faq'), h('div', { class: 'pt-faq' }, faq.map(([q, a, txt]) => h('details', null, h('summary', { text: t(q) }), h('p', { text: txt || t(a) }))))),
      h('div', { class: 'pt-stack' },
        card(t('h_contact'), [dl([[t('email'), h('a', { href: 'mailto:agents@muktalent.com', text: 'agents@muktalent.com', translate: 'no' })], ['☎', h('a', { href: 'tel:+447311874281', text: '+44 73 1187 4281', translate: 'no', dir: 'ltr' })]]),
          h('div', { class: 'pt-actions' }, h('a', { class: 'hc-btn hc-btn-teal pt-btn-sm', href: '#/messages', text: t('c_msg') }))]),
        card(t('h_complaint'), [h('p', { class: 'pt-muted', text: T('Complaints can be made online, by email to <span translate="no">agents@muktalent.com</span> or by phone. We acknowledge every complaint within 2 working days.').replace(/<[^>]+>/g, '') }),
          h('a', { class: 'hc-btn hc-btn-line pt-btn-sm', href: '/healthcare/complaints/' + L, target: '_blank', rel: 'noopener', text: T('Complaints Procedure') })]),
        card(t('h_policies'), h('ul', { class: 'pt-links' }, [['/healthcare/candidate-privacy/', 'Candidate Privacy Notice'], ['/healthcare/privacy/', 'Privacy Policy'], ['/healthcare/ethical-recruitment/', 'Ethical Recruitment'], ['/healthcare/policies/', 'Policies']].map(([href, l]) =>
          h('li', null, h('a', { href: href + L, target: '_blank', rel: 'noopener' }, T(l), icon('arrow', 14)))))))));
  }
};

/* ---------- pieces ---------- */
function stat(label, value, href, tone = '') {
  return h('a', { class: 'pt-stat ' + tone, href }, h('small', { text: label }), h('b', { text: value }));
}
const docName = d => (d.label && d.label !== 'CV' && d.label !== 'Additional document' ? d.label : t('dk_' + d.kind));
function docItem(d) {
  const canUpload = d.status !== 'approved' && d.status !== 'uploaded' || d.status === 'uploaded';
  const fileBtn = h('label', { class: 'hc-btn pt-btn-sm ' + (d.status === 'requested' || d.status === 'rejected' ? 'hc-btn-gold' : 'hc-btn-line') },
    icon('upload', 15), h('span', { text: d.status === 'requested' ? t('d_upload') : t('d_replace') }),
    h('input', { type: 'file', accept: ACCEPT, class: 'pt-sr', onchange: e => upload(e.target.files[0], { documentId: d.id }, e.target.closest('.pt-item')) }));
  return h('div', { class: 'pt-item' },
    h('span', { class: 'ic' }, icon(d.status === 'approved' ? 'check' : 'file')),
    h('span', { class: 'tx' }, h('b', { text: docName(d) }),
      h('small', { text: [d.file_name, bytes(d.size_bytes), d.uploaded_at ? fmtDate(d.uploaded_at) : null].filter(Boolean).join(' · ') || t('d_types') }),
      d.note && (d.status === 'rejected' || d.status === 'requested') ? h('small', { class: 'pt-note', text: d.note }) : null),
    badge(t('d_' + d.status), DOC_TONE[d.status] || 'grey'),
    d.file_name && d.status !== 'requested' ? h('button', { class: 'hc-btn hc-btn-line pt-btn-sm', type: 'button', onclick: () => openSigned('portal/documents/' + d.id + '/url') }, icon('eye', 15), t('d_view')) : null,
    d.status !== 'approved' && canUpload ? fileBtn : null);
}
function dropZone(kind, label) {
  const inp = h('input', { type: 'file', accept: ACCEPT, onchange: e => upload(e.target.files[0], { kind }, zone) });
  const zone = h('label', { class: 'pt-drop' }, icon('upload', 22), h('b', { text: label }), h('span', { text: t('d_types') }), inp);
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('over'));
  zone.addEventListener('drop', e => { e.preventDefault(); zone.classList.remove('over'); if (e.dataTransfer.files[0]) upload(e.dataTransfer.files[0], { kind }, zone); });
  return zone;
}
async function upload(file, target, host) {
  if (!file) return;
  if (!MIMES.includes(file.type)) return toast(t('d_bad_type'), true);
  if (file.size > 10 * 1024 * 1024) return toast(t('d_types'), true);
  host?.classList.add('busy');
  const bar = h('div', { class: 'pt-upbar' }, h('span', { class: 'pt-spin sm' }), t('d_uploading'));
  host?.appendChild(bar);
  try {
    const { upload: u } = await api('portal/documents/upload-url', { method: 'POST', body: { ...target, file: { name: file.name.slice(0, 200), type: file.type, size: file.size } } });
    const { error } = await S.sb.storage.from('healthcare-docs').uploadToSignedUrl(u.path, u.token, file, { contentType: file.type });
    if (error) throw error;
    B = (await api('portal/documents/complete', { method: 'POST', body: { documentId: u.documentId } })).data;
    toast(t('d_done')); render();
  } catch (x) { bar.remove(); host?.classList.remove('busy'); toast(x.message || t('err'), true); }
}
function appItem(a) {
  const v = a.vacancy || {};
  return h('div', { class: 'pt-item' }, h('span', { class: 'ic' }, icon('briefcase')),
    h('span', { class: 'tx' }, h('b', { lang: 'en', text: v.title || '—' }), h('small', { text: [a.reference, v.employer_display, v.location, fmtDate(a.created_at)].filter(Boolean).join(' · ') })),
    badge(t('as_' + a.status), APP_TONE[a.status]),
    ['applied', 'under_review', 'shortlisted'].includes(a.status) ? h('button', { class: 'hc-btn hc-btn-line pt-btn-sm', type: 'button', onclick: async () => {
      if (!(await confirmBox(t('withdraw'), t('withdraw_confirm'), { okText: t('withdraw'), danger: true }))) return;
      try { B = (await api('portal/applications/' + a.id + '/withdraw', { method: 'POST', body: {} })).data; render(); } catch (x) { toast(x.message, true); }
    }, text: t('withdraw') }) : null);
}
async function applyTo(v) {
  const ta = textarea('cover_note', '', { rows: 4, maxlength: 3000 });
  const ok = await dialog({ title: t('o_confirm', { title: v.title }), okText: t('o_apply'),
    body: h('div', null, h('p', { class: 'pt-muted', text: t('o_p') }), field(t('o_note'), ta)),
    onOk: async () => { B = (await api('portal/applications', { method: 'POST', body: { vacancyId: v.id, cover_note: ta.value.trim() || null } })).data; } });
  if (ok) { toast(t('o_sent')); render(); }
}
function interviewItem(i) {
  const past = new Date(i.scheduled_at) < Date.now();
  const tone = i.status === 'completed' ? 'green' : i.status === 'no_show' ? 'red' : past ? 'grey' : 'gold';
  return h('div', { class: 'pt-item pt-iv' },
    h('span', { class: 'pt-date' }, h('b', { text: fmtDate(i.scheduled_at, { day: 'numeric' }) }), h('small', { text: fmtDate(i.scheduled_at, { month: 'short' }) })),
    h('span', { class: 'tx' }, h('b', { lang: 'en', text: i.title }),
      h('small', { text: [fmtDateTime(i.scheduled_at), t('i_minutes', { n: i.duration_minutes || 30 }), t('im_' + i.mode)].join(' · ') }),
      i.location ? h('small', { class: 'pt-note' }, icon(i.mode === 'video' ? 'video' : i.mode === 'phone' ? 'phone' : 'pin', 14), ' ', /^https?:\/\//.test(i.location) ? h('a', { href: i.location, target: '_blank', rel: 'noopener', text: i.location }) : i.location) : null,
      i.candidate_note ? h('small', { class: 'pt-note' }, h('strong', { text: t('i_prep') + ': ' }), i.candidate_note) : null),
    badge(t('is_' + i.status) || i.status, tone));
}
function consultantCard(compact) {
  const c = B.consultant;
  if (!c) return card(t('c_h'), h('div', { class: 'pt-consultant' }, h('span', { class: 'pt-avatar lg' }, icon('user', 24)), h('div', null, h('h3', { text: t('c_none_h') }), h('p', { class: 'pt-muted', text: t('c_none_p') }))));
  const langs = (c.languages || []).map(l => (LANGS.find(x => x[0] === l) || [l, l.toUpperCase()])[1]).join(', ');
  return card(t('c_h'), h('div', { class: 'pt-consultant' },
    h('span', { class: 'pt-avatar lg', text: initials(c.full_name) }),
    h('div', null, h('h3', { text: c.full_name }), h('p', { class: 'pt-muted', lang: 'en', text: c.title }),
      !compact && c.bio ? h('p', { lang: 'en', text: c.bio }) : null,
      langs ? h('p', { class: 'pt-small' }, h('strong', { text: t('c_langs') + ': ' }), langs) : null,
      h('div', { class: 'pt-actions' }, h('a', { class: 'hc-btn hc-btn-teal pt-btn-sm', href: '#/messages' }, icon('chat', 15), t('c_msg')),
        c.email ? h('a', { class: 'hc-btn hc-btn-line pt-btn-sm', href: 'mailto:' + c.email }, icon('mail', 15), c.email) : null))));
}
function bubble(m) {
  const me = m.sender_role === 'candidate', sys = m.sender_role === 'system';
  let body = m.body;
  if (sys && /red or amber list/i.test(body)) body = t('ap_restricted');
  return h('div', { class: 'pt-bubble' + (me ? ' me' : sys ? ' sys' : '') }, body,
    h('small', { text: (me ? t('m_you') : sys ? t('m_sys') : B.consultant?.full_name || t('m_team')) + ' · ' + fmtDateTime(m.created_at) }));
}
const NT_ICON = { journey: 'route', documents: 'folder', messages: 'chat', interviews: 'calendar', consultant: 'user' };
const NT = { 'Welcome to MUKTalent Healthcare': 'ntf_welcome', 'Recruitment journey updated': 'ntf_stage', 'Your consultant': 'ntf_consultant', 'Document requested': 'ntf_doc_req', 'Document approved': 'ntf_doc_ok', 'Document needs attention': 'ntf_doc_bad', 'New message': 'ntf_msg', 'Interview scheduled': 'ntf_iv' };
const STAGE_EN = { 'New Registration': 'new_registration', 'Initial Review': 'initial_review', 'Awaiting Information': 'awaiting_information', 'Documentation Review': 'documentation_review', 'Professional Verification': 'professional_verification', 'Suitable for Matching': 'suitable_for_matching', 'Submitted to Employer': 'submitted_to_employer', 'Interview Scheduled': 'interview_scheduled', 'Interview Completed': 'interview_completed', 'Offer Received': 'offer_received', 'Offer Accepted': 'offer_accepted', 'Pre-employment Checks': 'pre_employment_checks', 'Recruitment Completed': 'recruitment_completed', 'Unsuccessful': 'unsuccessful', 'Withdrawn': 'withdrawn' };
const ntTitle = s => (NT[s] ? t(NT[s]) : s);
function ntBody(n) {
  const b = n.body || '';
  if (STAGE_EN[b]) return stageLabel(STAGE_EN[b]);
  if (b === 'A recruitment consultant has been assigned to you.') return t('ntf_assigned');
  if (b === 'Your consultant assignment has changed.') return t('ntf_changed');
  const m = /^Your candidate reference is (.+)\.$/.exec(b); if (m) return t('ntf_ref', { ref: m[1] });
  return b;
}

/* ---------- profile ---------- */
function profileView(el) {
  const c = B.candidate;
  const status = h('div');
  const btn = h('button', { class: 'hc-btn hc-btn-teal', type: 'submit', text: t('save') });
  const langSel = select('preferred_language', LANGS, c.preferred_language || S.lang);
  const form = h('form', { novalidate: true },
    card(t('p_personal'), [h('p', { class: 'pt-notice' }, icon('lock', 16), h('span', { text: t('p_readonly') })),
      dl([[T('Full Name'), c.full_name], [t('email'), h('span', { translate: 'no', text: c.email })], [T('Healthcare Profession'), T(PROF[c.profession] || c.profession)], [t('ref'), c.reference]]),
      h('div', { class: 'pt-fields pt-mt' },
        field(T('Telephone Number'), input('phone', { type: 'tel', value: c.phone || '', autocomplete: 'tel' })),
        field(T('Country of Residence'), select('country_residence', countryOptions(), c.country_residence)),
        field(T('Nationality, where relevant'), select('nationality', [['', T('Prefer not to say')], ...countryOptions()], c.nationality || '')))]),
    card(t('p_prof'), h('div', { class: 'pt-fields' },
      field(T('Years of Experience'), input('experience_years', { type: 'number', min: 0, max: 60, step: 0.5, value: c.experience_years ?? '' })),
      field(T('Current Employment Status'), select('employment_status', opts(EMP, '—'), c.employment_status || '')),
      field(T('Professional Registration'), select('registration_status', opts(REG), c.registration_status), { full: true }),
      field(T('Regulator or registration body'), input('registration_body', { value: c.registration_body || '' })),
      field(T('Registration number'), input('registration_number', { value: c.registration_number || '' })),
      field(T('English Language Level'), select('english_level', opts(ENG, '—'), c.english_level || '')),
      field(T('Preferred UK Location'), input('preferred_location', { value: c.preferred_location || '' })),
      field(T('Additional Information'), textarea('additional_info', c.additional_info || ''), { full: true }))),
    card(t('p_prefs'), [field(t('p_lang'), langSel),
      h('label', { class: 'pt-check' }, h('input', { type: 'checkbox', name: 'marketing_consent', checked: !!c.marketing_consent }), h('span', { text: t('p_marketing') }))]),
    status, h('div', { class: 'pt-actions pt-sticky' }, btn));
  form.addEventListener('submit', async e => {
    e.preventDefault(); clear(status);
    const body = formData(form);
    if (body.english_level == null) delete body.english_level;
    if (body.employment_status == null) delete body.employment_status;
    busy(btn, true);
    try {
      B = (await api('portal/profile', { method: 'PATCH', body })).data;
      if (body.preferred_language && body.preferred_language !== S.lang) await setLang(body.preferred_language);
      toast(t('saved')); render();
    } catch (x) { busy(btn, false); if (!showFieldError(form, x)) toast(x.message, true); }
  });
  const rights = card(t('p_data_h'), [h('p', { class: 'pt-muted', text: t('p_data_p') }),
    c.deletion_requested ? h('div', { class: 'pt-notice warn' }, icon('alert'), h('span', { text: t('dr_pending') })) : null,
    h('div', { class: 'pt-actions' },
      h('button', { class: 'hc-btn hc-btn-line pt-btn-sm', type: 'button', onclick: () => dataRequest('access') }, icon('download', 15), t('dr_access')),
      h('button', { class: 'hc-btn hc-btn-line pt-btn-sm', type: 'button', onclick: () => dataRequest('rectification') }, icon('file', 15), t('dr_rect')),
      c.deletion_requested ? null : h('button', { class: 'hc-btn pt-btn-danger pt-btn-sm', type: 'button', onclick: () => dataRequest('erasure') }, icon('x', 15), t('dr_erasure')))]);
  put(el, h('div', { class: 'pt-grid pt-g21' }, form, h('div', { class: 'pt-stack' }, rights,
    card(T('Candidate Privacy Notice'), h('a', { class: 'hc-btn hc-btn-line pt-btn-sm', href: '/healthcare/candidate-privacy/' + (S.lang === 'en' ? '' : '?lang=' + S.lang), target: '_blank', rel: 'noopener' }, T('Candidate Privacy Notice'), icon('arrow', 14))))));
}
async function dataRequest(type) {
  const note = textarea('note', '', { rows: 3, maxlength: 2000 });
  const label = { access: t('dr_access'), rectification: t('dr_rect'), erasure: t('dr_erasure') }[type];
  let ref;
  const ok = await dialog({ title: label, danger: type === 'erasure', okText: t('confirm'),
    body: h('div', null, h('p', { text: type === 'erasure' ? t('dr_confirm') : t('p_data_p') }), field(t('o_note').replace(/\s*\(.*\)$/, ''), note)),
    onOk: async () => { ref = (await api('portal/data-request', { method: 'POST', body: { type, note: note.value.trim() || null } })).reference; } });
  if (ok) { toast(t('dr_sent', { ref })); if (type === 'erasure') await reload(); }
}
