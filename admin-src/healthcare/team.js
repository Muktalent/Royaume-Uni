// MUKTalent Healthcare · team shell (Healthcare Management for admins, Consultant dashboard for consultants).
import { S, h, clear, icon, api, go, parseRoute, query, toast, dialog, confirmBox, field, input, select, textarea, formData, showFieldError, badge, empty, card, loading, fmtDate, fmtDateTime, ago, country, countryOptions, initials, bytes, openSigned, team as teamLang, busy } from './core.js';
import { STAGES, STAGE_LABELS, CLOSED, PROF, REG, ENG, EMP, DOC_KINDS, APP_STATUS, entries, stageBadge, countryBadge, isAdmin, table, tabs, who, bars, kpi, due, toolbar, btn, LANG_NAMES } from './team-kit.js';
import { OPS } from './team-ops.js';
import { ADMIN } from './team-admin.js';

const ADMIN_NAV = [
  ['overview', 'Overview', 'grid'], ['candidates', 'Candidates', 'users'], ['applications', 'Applications', 'inbox'], ['employers', 'Employers', 'building'],
  ['vacancies', 'Vacancies', 'briefcase'], ['pipeline', 'Recruitment Pipeline', 'columns'], ['consultants', 'Consultants', 'user'], ['documents', 'Documents', 'folder'],
  ['interviews', 'Interviews', 'calendar'], ['messages', 'Messages', 'chat'], ['compliance', 'Ethical Recruitment & Compliance', 'shield'], ['reports', 'Reports & Analytics', 'chart'], ['settings', 'Healthcare Settings', 'cog']
];
const CONSULTANT_NAV = [
  ['candidates', 'My Candidates', 'users'], ['applications', 'New Applications', 'inbox'], ['documents', 'Candidate Documents', 'folder'], ['pipeline', 'Recruitment Pipeline', 'columns'],
  ['vacancies', 'Employer Opportunities', 'briefcase'], ['interviews', 'Interviews', 'calendar'], ['messages', 'Messages', 'chat'], ['tasks', 'Tasks & Follow-ups', 'task'], ['performance', 'My Performance', 'chart']
];
let counts = {};
export const T = { staff: null, consultants: null };

export async function teamApp(me) {
  teamLang();
  S.onRoute = render;
  if (!location.hash.startsWith('#/hc/')) history.replaceState(null, '', '#/hc/' + (isAdmin() ? 'overview' : 'candidates'));
  refreshCounts();
  render();
}
export async function refreshCounts() {
  try { const o = await api('team/overview'); counts = { documents: o.metrics.docs_to_review, applications: o.metrics.new_applications, messages: o.metrics.unread_messages, compliance: (o.metrics.deletion_requests || 0) + (o.metrics.open_complaints || 0), tasks: o.tasks.length, candidates: isAdmin() ? o.metrics.unassigned : null }; paintCounts(); } catch {}
}
function paintCounts() {
  document.querySelectorAll('.pt-nav a[data-k]').forEach(a => {
    a.querySelector('.pt-count')?.remove();
    const n = counts[a.dataset.k]; if (n) a.appendChild(h('span', { class: 'pt-count', text: n }));
  });
}
export async function consultants() {
  if (!T.consultants) { const r = await api('team/consultants'); T.consultants = r.data.filter(x => x.healthcare?.active); T.staff = r.data; }
  return T.consultants;
}
export const consultantName = id => (T.consultants || []).find(c => c.user_id === id)?.full_name || (id === S.me.staff.user_id ? S.me.staff.full_name : id ? 'Consultant' : 'Unassigned');

function render() {
  teamLang();
  const parts = parseRoute(); // ['hc', section, id]
  const nav = isAdmin() ? ADMIN_NAV : CONSULTANT_NAV;
  const sec = nav.find(n => n[0] === parts[1]) ? parts[1] : (parts[1] === 'tasks' || parts[1] === 'performance' ? parts[1] : nav[0][0]);
  const cur = nav.find(n => n[0] === sec) || [sec, sec === 'tasks' ? 'Tasks & Follow-ups' : 'My Performance'];
  const role = isAdmin() ? 'admin' : 'consultant';
  const navEl = h('nav', { class: 'pt-nav', 'aria-label': 'Healthcare' }, nav.map(([k, label, ic]) =>
    h('a', { href: '#/hc/' + k, dataset: { k }, 'aria-current': k === sec ? 'page' : null, onclick: () => shellEl.classList.remove('nav-open') }, icon(ic), h('span', { text: label }))));
  const side = h('aside', { class: 'pt-side', id: 'pt-side' },
    h('a', { class: 'pt-brand', href: '#/hc/' + nav[0][0] }, h('img', { src: '/healthcare/assets/img/mark-light.svg', alt: '', width: 36, height: 36 }), h('span', null, h('b', { text: 'MUKTalent' }), h('small', { text: 'Healthcare' }))),
    h('p', { class: 'pt-side-label', text: isAdmin() ? 'Healthcare Management' : 'Consultant workspace' }), navEl,
    h('div', { class: 'pt-side-foot' },
      isAdmin() ? h('a', { href: '#/hc/tasks' }, icon('task'), h('span', { text: 'My tasks' })) : null,
      h('a', { class: 'pt-back-edu', href: '/admin/' }, icon('back'), h('span', { text: 'Back to Education dashboard' })),
      h('a', { href: '/healthcare/', target: '_blank', rel: 'noopener' }, icon('globe'), h('span', { text: 'Healthcare website' })),
      h('button', { type: 'button', onclick: () => S.signOut() }, icon('out'), h('span', { text: 'Sign out' }))));
  const body = h('div', { class: 'pt-body', id: 'main', tabindex: '-1' });
  const top = h('header', { class: 'pt-top' },
    h('button', { class: 'pt-menu', type: 'button', 'aria-label': 'Menu', 'aria-controls': 'pt-side', onclick: () => shellEl.classList.toggle('nav-open') }, icon('menu', 20)),
    h('h1', { text: parts[1] === 'candidates' && parts[2] ? 'Candidate record' : cur[1] }),
    h('div', { class: 'pt-user' }, h('span', { class: 'pt-avatar', text: initials(S.me.staff.full_name) }), h('span', { class: 'pt-user-tx' }, h('b', { text: S.me.staff.full_name }), h('span', { text: S.me.staff.title }))));
  const shellEl = h('div', { class: 'pt-app ' + role }, side, h('div', { class: 'pt-main' }, top, body), h('div', { class: 'pt-scrim', onclick: () => shellEl.classList.remove('nav-open') }));
  clear(document.getElementById('app'), shellEl);
  paintCounts();
  document.title = cur[1] + ' · MUKTalent Healthcare';
  const fn = SECTIONS[sec] || OPS[sec] || ADMIN[sec];
  body.appendChild(loading());
  Promise.resolve(fn(body, parts[2])).catch(e => { clear(body, card(null, empty('alert', 'Could not load this section', e.message))); });
  window.scrollTo(0, 0);
}
export const rerender = () => S.onRoute && S.onRoute();

/* ================= sections ================= */
const SECTIONS = {
  async overview(el) {
    const o = await api('team/overview'); const m = o.metrics;
    const reviewed = o.country_list_reviewed_at, stale = !reviewed || Date.now() - new Date(reviewed) > 90 * 864e5;
    clear(el,
      h('section', { class: 'pt-hero' }, h('div', null, h('span', { class: 'k', text: 'Healthcare Management' }), h('h2', { text: 'Good ' + (new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening') + ', ' + S.me.staff.full_name.split(' ')[0] }),
        h('p', { text: 'International healthcare recruitment, run ethically and in line with the Code of Practice.' })), h('div', { class: 'pt-hero-side' }, h('span', { class: 'ref', text: fmtDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long' }) }))),
      stale ? h('div', { class: 'pt-notice warn' }, icon('flag'), h('span', null, 'The Code of Practice red and amber country list ' + (reviewed ? 'was last reviewed on ' + fmtDate(reviewed) : 'has not been reviewed yet') + '. ', h('a', { href: '#/hc/compliance?tab=countries', text: 'Review the country list' }))) : null,
      h('div', { class: 'pt-grid pt-g4' },
        kpi('Active candidates', m.active, { href: '#/hc/candidates' }), kpi('New this week', m.new_7d, { href: '#/hc/candidates' }),
        kpi('Unassigned', m.unassigned, { href: '#/hc/candidates?consultant=none', tone: m.unassigned ? 'warn' : '' }), kpi('Documents to review', m.docs_to_review, { href: '#/hc/documents', tone: m.docs_to_review ? 'warn' : '' }),
        kpi('New applications', m.new_applications, { href: '#/hc/applications' }), kpi('Unread messages', m.unread_messages, { href: '#/hc/messages', tone: m.unread_messages ? 'gold' : '' }),
        kpi('Open enquiries', m.open_enquiries, { href: '#/hc/employers?tab=enquiries' }), kpi('Recruitment completed', m.placed, { href: '#/hc/reports', tone: 'gold' })),
      h('div', { class: 'pt-grid pt-g21' },
        card('Candidates by stage', bars(Object.fromEntries(STAGES.filter(s => !CLOSED.has(s)).map(s => [s, o.by_stage[s]])), STAGE_LABELS, { limit: 15 }), h('a', { class: 'pt-link', href: '#/hc/pipeline', text: 'Open pipeline →' })),
        h('div', { class: 'pt-stack' },
          card('Compliance watch', h('div', { class: 'pt-list' },
            watch('flag', 'Red or amber country of residence', m.restricted, '#/hc/compliance?tab=flagged'),
            watch('alert', 'Country not yet checked', m.unchecked_country, '#/hc/compliance?tab=flagged'),
            watch('shield', 'Open complaints', m.open_complaints, '#/hc/compliance?tab=complaints'),
            watch('lock', 'Data deletion requests', m.deletion_requests, '#/hc/compliance?tab=requests'))),
          card('Upcoming interviews', o.interviews.length ? h('div', { class: 'pt-list' }, o.interviews.slice(0, 5).map(i => h('a', { class: 'pt-item link', href: '#/hc/candidates/' + i.candidate?.id }, h('span', { class: 'ic' }, icon('calendar')), h('span', { class: 'tx' }, h('b', { text: i.candidate?.full_name }), h('small', { text: i.title + ' · ' + fmtDateTime(i.scheduled_at) }))))) : empty('calendar', 'No interviews scheduled.')),
          card('My open tasks', taskList(o.tasks), h('a', { class: 'pt-link', href: '#/hc/tasks', text: 'All tasks →' })))));
  },

  async candidates(el, id) {
    if (id) return candidateDetail(el, id);
    const q = query();
    const f = { q: q.get('q') || '', stage: q.get('stage') || '', country: q.get('country') || '', profession: q.get('profession') || '', consultant: q.get('consultant') || '', view: q.get('view') || 'active', page: Number(q.get('page') || 1) };
    if (isAdmin()) await consultants();
    const params = new URLSearchParams(Object.entries(f).filter(([, v]) => v !== '' && v != null));
    const r = await api('team/candidates?' + params);
    const set = (k, v) => { const p = new URLSearchParams(Object.entries({ ...f, [k]: v, page: k === 'page' ? v : 1 }).filter(([, x]) => x !== '' && x != null)); go('hc/candidates?' + p); };
    const search = input('q', { type: 'search', placeholder: 'Search name, email or reference', value: f.q, 'aria-label': 'Search candidates' });
    search.addEventListener('keydown', e => { if (e.key === 'Enter') set('q', search.value.trim()); });
    const sel = (k, o, label) => { const s = select(k, o, f[k], { 'aria-label': label }); s.addEventListener('change', () => set(k, s.value)); return s; };
    const metrics = isAdmin() ? null : await api('team/overview').then(o => o.metrics).catch(() => null);
    clear(el,
      metrics ? h('div', { class: 'pt-grid pt-g4' }, kpi('My active candidates', metrics.active), kpi('New this week', metrics.new_7d), kpi('Documents to review', metrics.docs_to_review, { href: '#/hc/documents', tone: metrics.docs_to_review ? 'warn' : '' }), kpi('Unread messages', metrics.unread_messages, { href: '#/hc/messages', tone: metrics.unread_messages ? 'gold' : '' })) : null,
      card(null, [
        h('div', { class: 'pt-card-h' }, tabs([['active', 'Active'], ['closed', 'Closed'], ['all', 'All']], f.view, v => set('view', v)), isAdmin() ? btn('Add candidate', addCandidate, 'hc-btn-teal', 'plus') : null),
        toolbar(search, sel('stage', entries(STAGE_LABELS, 'All stages'), 'Stage'), sel('country', [['', 'All country statuses'], ['green', 'Green'], ['amber', 'Amber'], ['red', 'Red'], ['unchecked', 'Unchecked']], 'Country status'),
          sel('profession', entries(PROF, 'All professions'), 'Profession'), isAdmin() ? sel('consultant', [['', 'All consultants'], ['none', 'Unassigned'], ...T.consultants.map(c => [c.user_id, c.full_name])], 'Consultant') : null),
        table([
          ['Candidate', c => who(c.full_name, c.reference + ' · ' + c.email)],
          ['Profession', c => h('span', null, PROF[c.profession] || c.profession, h('small', { text: c.experience_years != null ? c.experience_years + ' yrs' : '' }))],
          ['Country of residence', c => countryBadge(c.country_residence, c.country_status)],
          ['Stage', c => h('span', null, stageBadge(c.stage), h('small', { text: ago(c.stage_changed_at) }))],
          isAdmin() ? ['Consultant', c => c.consultant_id ? consultantName(c.consultant_id) : badge('Unassigned', 'amber')] : ['Next action', c => c.next_action ? h('span', null, c.next_action, due(c.next_action_at)) : '—'],
          ['Registered', c => fmtDate(c.created_at)]
        ].filter(Boolean), r.data, { onRow: c => go('hc/candidates/' + c.id), emptyText: 'No candidates match these filters.', emptyIcon: 'users' }),
        r.count > 50 ? h('div', { class: 'pt-pager' }, btn('Previous', () => set('page', f.page - 1), 'hc-btn-line'), h('span', { text: `Page ${f.page} of ${Math.ceil(r.count / 50)} · ${r.count} candidates` }), btn('Next', () => set('page', f.page + 1), 'hc-btn-line')) : h('p', { class: 'pt-muted pt-small', text: r.count + ' candidate' + (r.count === 1 ? '' : 's') })
      ]));
    el.querySelector('.pt-pager button')?.toggleAttribute('disabled', f.page <= 1);
    const nextB = el.querySelectorAll('.pt-pager button')[1]; if (nextB && f.page * 50 >= r.count) nextB.disabled = true;
  },

  async pipeline(el) {
    const pages = await Promise.all([1, 2, 3, 4].map(p => api('team/candidates?view=active&page=' + p).catch(() => ({ data: [] }))));
    const all = [...new Map(pages.flatMap(p => p.data).map(c => [c.id, c])).values()];
    const cols = STAGES.filter(s => !CLOSED.has(s));
    clear(el, h('p', { class: 'pt-muted pt-intro', text: 'Every active candidate by recruitment stage. Open a card to move a candidate; stage changes are recorded in the candidate history and notified to the candidate.' }),
      h('div', { class: 'pt-board' }, cols.map(s => {
        const list = all.filter(c => c.stage === s);
        return h('section', { class: 'pt-col' }, h('h4', null, STAGE_LABELS[s], h('span', { text: list.length })),
          list.map(c => h('a', { class: 'pt-mini', href: '#/hc/candidates/' + c.id }, h('b', { text: c.full_name }), h('small', { text: (PROF[c.profession] || '') + ' · ' + country(c.country_residence) }),
            c.country_status === 'red' || c.country_status === 'amber' ? badge(c.country_status.toUpperCase(), c.country_status) : null)));
      })));
  }
};
function watch(ic, label, n, href) {
  return h('a', { class: 'pt-item link', href }, h('span', { class: 'ic' }, icon(ic)), h('span', { class: 'tx' }, h('b', { text: label })), badge(String(n ?? 0), n ? 'amber' : 'green'));
}
export function taskList(tasks, onDone) {
  if (!tasks.length) return empty('task', 'No open tasks.');
  return h('div', { class: 'pt-list' }, tasks.map(t => h('div', { class: 'pt-item' },
    h('button', { type: 'button', class: 'pt-tick', 'aria-label': 'Mark as done', onclick: async () => { await api('team/tasks/' + t.id, { method: 'PATCH', body: { status: 'done' } }); toast('Task completed'); refreshCounts(); onDone ? onDone() : rerender(); } }, icon('check', 14)),
    h('span', { class: 'tx' }, h('b', { text: t.title }), t.candidate ? h('small', null, h('a', { href: '#/hc/candidates/' + (t.candidate.id || t.candidate_id), text: t.candidate.full_name + ' · ' + t.candidate.reference })) : t.candidate_id ? h('small', null, h('a', { href: '#/hc/candidates/' + t.candidate_id, text: 'Open candidate' })) : null),
    due(t.due_at))));
}

/* ================= add candidate (admin) ================= */
async function addCandidate() {
  const f = h('div', { class: 'pt-fields' },
    field('Full name', input('full_name', { required: true })), field('Email', input('email', { type: 'email', required: true })),
    field('Telephone', input('phone', { type: 'tel' })), field('Country of residence', select('country_residence', [['', '—'], ...countryOptions()], '')),
    field('Nationality', select('nationality', [['', 'Not stated'], ...countryOptions()], '')), field('Profession', select('profession', entries(PROF, '—'), '')),
    field('Years of experience', input('experience_years', { type: 'number', min: 0, max: 60, step: 0.5 })), field('Registration', select('registration_status', entries(REG), 'not_started')),
    field('English level', select('english_level', entries(ENG, '—'), '')), field('Employment status', select('employment_status', entries(EMP, '—'), '')),
    field('Preferred UK location', input('preferred_location')), field('Source', select('source', [['admin', 'Added by admin'], ['referral', 'Referral'], ['event', 'Event']], 'admin')),
    field('Notes for the record', textarea('additional_info'), { full: true }),
    h('p', { class: 'pt-notice full' }, icon('shield', 16), h('span', { text: 'Only add a candidate who has agreed to be registered and has been given the Candidate Privacy Notice.' })));
  const r = await dialog({ title: 'Add candidate', wide: true, okText: 'Create candidate', body: f, onOk: async form => {
    const b = formData(form); for (const k of ['english_level', 'employment_status']) if (!b[k]) delete b[k];
    return (await api('team/candidates', { method: 'POST', body: b })).data;
  } });
  if (r && r.id) { toast('Candidate ' + r.reference + ' created'); go('hc/candidates/' + r.id); }
}

/* ================= candidate record ================= */
async function candidateDetail(el, id) {
  const [{ data: d }] = await Promise.all([api('team/candidates/' + id), isAdmin() ? consultants() : null]);
  const c = d.candidate, tab = query().get('tab') || 'profile';
  const restricted = c.country_status === 'red' || c.country_status === 'amber';
  const reload = () => candidateDetail(el, id).catch(e => toast(e.message, true));
  const setTab = k => { history.replaceState(null, '', '#/hc/candidates/' + id + '?tab=' + k); reload(); };
  const openTasks = d.tasks.filter(t => t.status === 'open');
  const head = h('section', { class: 'pt-card pt-rec-head' },
    h('a', { class: 'pt-link pt-back', href: '#/hc/candidates' }, icon('back', 15), ' All candidates'),
    h('div', { class: 'pt-rec-top' },
      h('span', { class: 'pt-avatar lg', text: initials(c.full_name) }),
      h('div', { class: 'pt-rec-id' }, h('h2', { text: c.full_name }),
        h('p', { class: 'pt-muted' }, [c.reference, PROF[c.profession] || c.profession, c.experience_years != null ? c.experience_years + ' years' : null, 'Registered ' + fmtDate(c.created_at)].filter(Boolean).join(' · ')),
        h('div', { class: 'pt-badges' }, stageBadge(c.stage), countryBadge(c.country_residence, c.country_status), c.priority === 'high' ? badge('High priority', 'red') : null, c.deletion_requested_at ? badge('Deletion requested', 'red') : null, c.archived_at ? badge('Archived', 'grey') : null)),
      h('div', { class: 'pt-actions pt-rec-actions' },
        btn('Move stage', () => moveStage(c, reload), 'hc-btn-teal', 'route'),
        btn('Request document', () => requestDoc(c, reload), 'hc-btn-line', 'file'),
        btn('Schedule interview', () => scheduleInterview(c, reload), 'hc-btn-line', 'calendar'),
        btn('Add task', () => addTask(c, reload), 'hc-btn-line', 'task'))),
    restricted ? h('div', { class: 'pt-notice ' + (c.country_status === 'red' ? 'red' : 'warn') }, icon('flag'), h('span', null, h('b', { text: (c.country_status === 'red' ? 'Red list' : 'Amber list') + ' country of residence. ' }),
      c.country_status === 'red' ? 'Active recruitment is not permitted. Do not approach, shortlist or submit this candidate to employers unless they applied directly to an advertised vacancy and your compliance lead has recorded the justification.' : 'Recruitment is only permitted within the terms of the government-to-government agreement for this country.',
      d.country_rule?.agreement_note ? ' ' + d.country_rule.agreement_note : '')) : null,
    c.country_status === 'unchecked' ? h('div', { class: 'pt-notice warn' }, icon('alert'), h('span', null, 'Country of residence not checked against the Code of Practice list. ', h('button', { type: 'button', class: 'pt-link', text: 'Run country check', onclick: async () => { const r = await api('team/candidates/' + id + '/country-check', { method: 'POST', body: {} }); toast('Country status: ' + r.decision.status.toUpperCase()); reload(); } }))) : null);
  const T2 = [['profile', 'Profile'], ['documents', 'Documents', d.documents.filter(x => x.status === 'uploaded').length], ['applications', 'Applications', d.applications.length], ['interviews', 'Interviews', d.interviews.filter(i => i.status === 'scheduled').length],
    ['messages', 'Messages'], ['notes', 'Notes', d.notes.length], ['tasks', 'Tasks', openTasks.length], ['history', 'History'], isAdmin() ? ['audit', 'Audit'] : null].filter(Boolean);
  const pane = h('div', { class: 'pt-pane' });
  clear(el, head, tabs(T2, tab, setTab), pane);
  (TABS[tab] || TABS.profile)(pane, d, reload);
}

const TABS = {
  profile(el, d, reload) {
    const c = d.candidate;
    const dl = rows => h('dl', { class: 'pt-dl' }, rows.flatMap(([k, v]) => [h('dt', { text: k }), h('dd', null, v == null || v === '' ? '—' : v)]));
    const nextForm = h('form', { class: 'pt-fields' },
      field('Next action', input('next_action', { value: c.next_action || '', maxlength: 240 }), { full: true }), field('Due', input('next_action_at', { type: 'date', value: (c.next_action_at || '').slice(0, 10) })),
      field('Priority', select('priority', [['low', 'Low'], ['normal', 'Normal'], ['high', 'High']], c.priority || 'normal')),
      h('div', { class: 'pt-actions full' }, h('button', { class: 'hc-btn hc-btn-teal pt-btn-sm', type: 'submit', text: 'Save' })));
    nextForm.addEventListener('submit', async e => { e.preventDefault(); const b = formData(nextForm); b.next_action_at = b.next_action_at ? new Date(b.next_action_at + 'T09:00:00Z').toISOString() : null; try { await api('team/candidates/' + c.id, { method: 'PATCH', body: b }); toast('Saved'); reload(); } catch (x) { toast(x.message, true); } });
    const assign = isAdmin() ? (() => {
      const s = select('consultant_id', [['', 'Unassigned'], ...T.consultants.map(x => [x.user_id, `${x.full_name} (${x.active_candidates}/${x.healthcare.capacity})`])], c.consultant_id || '');
      s.addEventListener('change', async () => { try { await api('team/candidates/' + c.id, { method: 'PATCH', body: { consultant_id: s.value || null } }); toast('Consultant updated'); T.consultants = null; reload(); } catch (x) { toast(x.message, true); } });
      return card('Consultant', [field('Assigned consultant', s), h('p', { class: 'pt-muted pt-small', text: 'The consultant is notified and the candidate sees their name in the portal. Consultants only see candidates assigned to them.' })]);
    })() : card('Consultant', h('p', { text: d.consultant?.full_name || 'Unassigned' }));
    clear(el, h('div', { class: 'pt-grid pt-g21' },
      h('div', { class: 'pt-stack' },
        card('Contact and eligibility', dl([['Email', h('a', { href: 'mailto:' + c.email, text: c.email })], ['Telephone', c.phone ? h('a', { href: 'tel:' + c.phone.replace(/\s/g, ''), text: c.phone, dir: 'ltr' }) : null], ['Country of residence', country(c.country_residence)], ['Nationality', c.nationality ? country(c.nationality) : 'Not stated'],
          ['Right to work in the UK', c.right_to_work_uk ? 'Yes, stated by candidate' : 'No'], ['Preferred UK location', c.preferred_location], ['Preferred language', LANG_NAMES[c.preferred_language] || c.preferred_language], ['Source', c.source], ['Marketing consent', c.marketing_consent ? 'Yes' : 'No']])),
        card('Professional', dl([['Profession', PROF[c.profession]], ['Experience', c.experience_years != null ? c.experience_years + ' years' : null], ['Registration status', REG[c.registration_status]], ['Regulator', c.registration_body], ['Registration number', c.registration_number], ['English level', ENG[c.english_level]], ['Employment status', EMP[c.employment_status]]])),
        c.additional_info ? card('Additional information', h('p', { class: 'pt-pre', text: c.additional_info })) : null),
      h('div', { class: 'pt-stack' }, assign, card('Next action', nextForm),
        isAdmin() ? card('Record management', h('div', { class: 'pt-actions' },
          btn(c.archived_at ? 'Restore' : 'Archive', async () => { await api('team/candidates/' + c.id, { method: 'PATCH', body: { archived: !c.archived_at } }); toast(c.archived_at ? 'Restored' : 'Archived'); reload(); }, 'hc-btn-line', 'folder'),
          btn('Erase personal data', () => erase(c), 'pt-btn-danger', 'x'))) : null)));
  },
  documents(el, d, reload) {
    const c = d.candidate;
    clear(el, card('Documents', [h('div', { class: 'pt-card-h' }, h('p', { class: 'pt-muted', text: 'Request only what is needed for the current stage. Every view of a file is recorded in the audit log.' }), btn('Request document', () => requestDoc(c, reload), 'hc-btn-teal', 'plus')),
      d.documents.length ? h('div', { class: 'pt-list' }, d.documents.map(x => docRow({ ...x, candidate: c }, reload))) : empty('folder', 'No documents yet.')]));
  },
  applications(el, d, reload) {
    clear(el, card('Applications', table([['Vacancy', a => who(a.vacancy?.title, [a.reference, a.vacancy?.employer_display, a.vacancy?.location].filter(Boolean).join(' · '))], ['Status', a => appStatusSelect(a, reload)], ['Applied', a => fmtDate(a.created_at)], ['Cover note', a => a.cover_note ? h('small', { class: 'pt-clip', text: a.cover_note }) : '—']], d.applications, { emptyText: 'No vacancy applications.', emptyIcon: 'briefcase' })));
  },
  interviews(el, d, reload) {
    clear(el, card('Interviews', [h('div', { class: 'pt-card-h' }, h('span'), btn('Schedule interview', () => scheduleInterview(d.candidate, reload), 'hc-btn-teal', 'plus')),
      table([['Interview', i => who(i.title, i.mode.replace('_', ' ') + (i.location ? ' · ' + i.location : ''))], ['When', i => fmtDateTime(i.scheduled_at)], ['Status', i => interviewStatus(i, reload)]], d.interviews, { emptyText: 'No interviews.', emptyIcon: 'calendar' })]));
  },
  messages(el, d, reload) { clear(el, card('Messages with ' + d.candidate.full_name.split(' ')[0], thread(d.candidate, d.messages, reload))); },
  notes(el, d, reload) {
    const ta = textarea('body', '', { rows: 3, placeholder: 'Internal note (not visible to the candidate)', required: true });
    const kind = select('kind', [['note', 'Note'], ['call', 'Call'], ['follow_up', 'Follow-up'], ['interview', 'Interview feedback']], 'note');
    const form = h('form', { class: 'pt-note-form' }, ta, h('div', { class: 'pt-actions' }, kind, h('button', { class: 'hc-btn hc-btn-teal pt-btn-sm', type: 'submit', text: 'Add note' })));
    form.addEventListener('submit', async e => { e.preventDefault(); if (!ta.value.trim()) return; await api('team/candidates/' + d.candidate.id + '/notes', { method: 'POST', body: { body: ta.value.trim(), kind: kind.value } }); toast('Note added'); reload(); });
    clear(el, card('Internal notes', [form, d.notes.length ? h('div', { class: 'pt-timeline' }, d.notes.map(n => h('div', { class: 'pt-tl' }, h('small', null, badge(n.kind.replace('_', ' '), 'grey'), ' ' + consultantName(n.author_id) + ' · ' + fmtDateTime(n.created_at)), h('p', { class: 'pt-pre', text: n.body })))) : empty('file', 'No notes yet.')]));
  },
  tasks(el, d, reload) {
    clear(el, card('Tasks & follow-ups', [h('div', { class: 'pt-card-h' }, h('span'), btn('Add task', () => addTask(d.candidate, reload), 'hc-btn-teal', 'plus')), taskList(d.tasks.filter(t => t.status === 'open').map(t => ({ ...t, candidate: null })), reload),
      d.tasks.some(t => t.status === 'done') ? h('details', { class: 'pt-more' }, h('summary', { text: 'Completed tasks' }), h('div', { class: 'pt-list' }, d.tasks.filter(t => t.status === 'done').map(t => h('div', { class: 'pt-item done' }, icon('check'), h('span', { class: 'tx' }, h('b', { text: t.title }), h('small', { text: 'Done ' + fmtDate(t.done_at) })))))) : null]));
  },
  history(el, d) {
    clear(el, card('Stage history', d.history.length ? h('div', { class: 'pt-timeline' }, d.history.map(x => h('div', { class: 'pt-tl' },
      h('small', { text: fmtDateTime(x.created_at) + ' · ' + (x.changed_by_role === 'system' ? 'System' : x.changed_by_role === 'candidate' ? 'Candidate' : consultantName(x.changed_by)) }),
      h('p', null, x.from_stage ? STAGE_LABELS[x.from_stage] + ' → ' : '', h('b', { text: STAGE_LABELS[x.to_stage] })), x.note ? h('p', { class: 'pt-muted pt-small', text: x.note }) : null))) : empty('route', 'No history.')));
  },
  audit(el, d) {
    clear(el, card('Audit trail', table([['When', a => fmtDateTime(a.created_at)], ['Action', a => h('code', { text: a.action })], ['By', a => a.actor_role === 'admin' || a.actor_role === 'consultant' ? consultantName(a.actor_id) : a.actor_role], ['Detail', a => h('small', { class: 'pt-clip', text: JSON.stringify(a.detail) })]], d.audit, { emptyText: 'No audit entries.' })));
  }
};

/* ================= shared candidate actions ================= */
export async function moveStage(c, done) {
  const s = select('stage', STAGES.map(x => [x, STAGE_LABELS[x]]), c.stage);
  const note = textarea('note', '', { rows: 3, placeholder: 'Reason or context (visible to the team only)' });
  const r = await dialog({ title: 'Move ' + c.full_name.split(' ')[0] + ' to a new stage', okText: 'Update stage',
    body: h('div', null, field('New stage', s), field('Note', note, { hint: 'The candidate is notified by email and in the portal. Submission to employers is blocked for red-list countries and unverified records.' })),
    onOk: async () => { if (s.value === c.stage) return true; await api('team/candidates/' + c.id, { method: 'PATCH', body: { stage: s.value, note: note.value.trim() || null } }); } });
  if (r) { toast('Stage updated'); done && done(); }
}
export async function requestDoc(c, done) {
  const kind = select('kind', entries(DOC_KINDS), 'qualification');
  const label = input('label', { value: DOC_KINDS.qualification, required: true });
  kind.addEventListener('change', () => { label.value = DOC_KINDS[kind.value]; });
  const note = textarea('note', '', { rows: 3, placeholder: 'What exactly should the candidate send?' });
  const r = await dialog({ title: 'Request a document', okText: 'Send request',
    body: h('div', null, h('p', { class: 'pt-notice' }, icon('lock', 16), h('span', { text: 'Ask only for documents needed at this stage of recruitment (data minimisation). The candidate uploads them securely through the portal.' })), field('Document type', kind), field('Label shown to the candidate', label), field('Instructions', note)),
    onOk: async () => { await api('team/candidates/' + c.id + '/documents', { method: 'POST', body: { kind: kind.value, label: label.value.trim(), note: note.value.trim() || null } }); } });
  if (r) { toast('Document requested'); done && done(); }
}
export async function scheduleInterview(c, done, pick) {
  let cand = select('candidate_id', [], '');
  if (pick) { const r = await api('team/candidates?view=active'); cand = select('candidate_id', [['', 'Choose a candidate'], ...r.data.filter(x => x.country_status !== 'red').map(x => [x.id, `${x.full_name} · ${x.reference}`])], ''); }
  const when = input('when', { type: 'datetime-local', required: true });
  const r = await dialog({ title: 'Schedule interview', okText: 'Schedule', wide: true,
    body: h('div', { class: 'pt-fields' }, pick ? field('Candidate', cand, { full: true }) : null,
      field('Title', input('title', { required: true, value: 'Interview', maxlength: 160 }), { full: true }), field('Date and time (UK)', when),
      field('Duration (minutes)', input('duration_minutes', { type: 'number', min: 10, max: 480, value: 45 })), field('Format', select('mode', [['video', 'Video'], ['in_person', 'In person'], ['phone', 'Phone']], 'video')),
      field('Link or address', input('location', { maxlength: 400 })), field('Preparation notes for the candidate', textarea('candidate_note'), { full: true })),
    onOk: async form => {
      const b = formData(form); const id = pick ? b.candidate_id : c.id;
      if (!id) throw new Error('Choose a candidate.');
      if (!b.when) throw new Error('Choose a date and time.');
      await api('team/interviews', { method: 'POST', body: { candidate_id: id, title: b.title, scheduled_at: new Date(b.when).toISOString(), duration_minutes: b.duration_minutes || 45, mode: b.mode, location: b.location, candidate_note: b.candidate_note } });
    } });
  if (r) { toast('Interview scheduled and candidate notified'); done && done(); }
}
export async function addTask(c, done) {
  const owners = isAdmin() ? await consultants() : [];
  const r = await dialog({ title: 'Add task', okText: 'Add task',
    body: h('div', null, field('Task', input('title', { required: true, maxlength: 200 })), field('Due date', input('due', { type: 'date' })),
      isAdmin() ? field('Owner', select('owner_id', [[S.me.staff.user_id, 'Me'], ...owners.filter(o => o.user_id !== S.me.staff.user_id).map(o => [o.user_id, o.full_name])], S.me.staff.user_id)) : null,
      field('Detail', textarea('detail'))),
    onOk: async form => { const b = formData(form); if (!b.title) throw new Error('Describe the task.'); await api('team/tasks', { method: 'POST', body: { candidate_id: c?.id || null, title: b.title, detail: b.detail, owner_id: b.owner_id || undefined, due_at: b.due ? new Date(b.due + 'T17:00:00Z').toISOString() : null } }); } });
  if (r) { toast('Task added'); refreshCounts(); done && done(); }
}
async function erase(c) {
  const conf = input('confirm', { required: true, placeholder: c.reference, autocomplete: 'off' });
  const r = await dialog({ title: 'Erase personal data', danger: true, okText: 'Erase permanently',
    body: h('div', null, h('p', { text: 'This deletes all files, messages, notes and tasks and anonymises the candidate record. Use it for valid erasure requests or at the end of the retention period. It cannot be undone.' }), field('Type the reference ' + c.reference + ' to confirm', conf)),
    onOk: async () => { if (conf.value.trim() !== c.reference) throw new Error('The reference does not match.'); return api('team/candidates/' + c.id + '/erase', { method: 'POST', body: { confirm: c.reference } }); } });
  if (r) { toast('Candidate data erased (' + r.files_deleted + ' files)'); go('hc/candidates'); }
}
export function docRow(x, reload) {
  const tone = { requested: 'gold', uploaded: 'teal', approved: 'green', rejected: 'red' }[x.status];
  return h('div', { class: 'pt-item' }, h('span', { class: 'ic' }, icon(x.status === 'approved' ? 'check' : 'file')),
    h('span', { class: 'tx' }, h('b', { text: x.label }), h('small', { text: [x.candidate && x.candidate.full_name ? x.candidate.full_name + ' · ' + x.candidate.reference : null, DOC_KINDS[x.kind], x.file_name, bytes(x.size_bytes), x.uploaded_at ? 'uploaded ' + ago(x.uploaded_at) : 'requested ' + ago(x.created_at)].filter(Boolean).join(' · ') }), x.note ? h('small', { class: 'pt-note', text: x.note }) : null),
    badge(x.status.replace(/^./, s => s.toUpperCase()), tone),
    x.file_name && x.status !== 'requested' ? btn('View', () => openSigned('team/documents/' + x.id + '/url'), 'hc-btn-line', 'eye') : null,
    x.status === 'uploaded' ? btn('Approve', async () => { await api('team/documents/' + x.id, { method: 'PATCH', body: { status: 'approved' } }); toast('Approved'); refreshCounts(); reload(); }, 'hc-btn-teal', 'check') : null,
    x.status === 'uploaded' ? btn('Reject', async () => {
      const note = textarea('note', '', { rows: 3, required: true, placeholder: 'Tell the candidate what is wrong and what to upload instead.' });
      const ok = await dialog({ title: 'Ask for a new file', okText: 'Send to candidate', body: field('Reason', note), onOk: async () => { if (!note.value.trim()) throw new Error('Add a reason.'); await api('team/documents/' + x.id, { method: 'PATCH', body: { status: 'rejected', note: note.value.trim() } }); } });
      if (ok) { toast('Candidate asked for a new file'); refreshCounts(); reload(); }
    }, 'hc-btn-line', 'x') : null);
}
export function appStatusSelect(a, reload) {
  const s = select('status', entries(APP_STATUS), a.status, { 'aria-label': 'Application status', class: 'pt-inline-select' });
  s.addEventListener('change', async () => {
    try { await api('team/applications/' + a.id, { method: 'PATCH', body: { status: s.value } }); toast('Application updated'); refreshCounts(); reload && reload(); }
    catch (x) { s.value = a.status; toast(x.message, true); }
  });
  return s;
}
export function interviewStatus(i, reload) {
  const s = select('status', [['scheduled', 'Scheduled'], ['completed', 'Completed'], ['no_show', 'No show'], ['cancelled', 'Cancelled']], i.status, { 'aria-label': 'Interview status', class: 'pt-inline-select' });
  s.addEventListener('change', async () => { try { await api('team/interviews/' + i.id, { method: 'PATCH', body: { status: s.value } }); toast('Interview updated'); reload && reload(); } catch (x) { s.value = i.status; toast(x.message, true); } });
  return s;
}
export function thread(c, messages, reload) {
  const list = h('div', { class: 'pt-thread', role: 'log' }, messages.length ? messages.map(m => h('div', { class: 'pt-bubble' + (m.sender_role === 'candidate' ? '' : m.sender_role === 'system' ? ' sys' : ' me') }, m.body,
    h('small', { text: (m.sender_role === 'candidate' ? c.full_name : m.sender_role === 'system' ? 'System' : m.sender_id === S.me.staff.user_id ? 'You' : consultantName(m.sender_id)) + ' · ' + fmtDateTime(m.created_at) }))) : empty('chat', 'No messages yet.'));
  const ta = textarea('body', '', { rows: 2, placeholder: 'Write to ' + c.full_name.split(' ')[0] + '… (they receive an email notification)', maxlength: 4000, 'aria-label': 'Message' });
  const b = h('button', { class: 'hc-btn hc-btn-teal', type: 'submit', text: 'Send' });
  const form = h('form', { class: 'pt-compose' }, ta, b);
  form.addEventListener('submit', async e => { e.preventDefault(); if (!ta.value.trim()) return; busy(b, true); try { await api('team/candidates/' + c.id + '/messages', { method: 'POST', body: { body: ta.value.trim() } }); reload(); } catch (x) { busy(b, false); toast(x.message, true); } });
  requestAnimationFrame(() => { list.scrollTop = list.scrollHeight; });
  return h('div', null, list, form);
}
