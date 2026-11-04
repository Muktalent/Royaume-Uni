// MUKTalent Healthcare · management sections (employers, vacancies, consultants, compliance, reports, settings).
import { S, h, clear, put, icon, api, go, query, toast, dialog, confirmBox, field, input, select, textarea, formData, badge, empty, card, fmtDate, fmtDateTime, ago, country, countryOptions, token } from './core.js';
import { STAGES, STAGE_LABELS, CLOSED, PROF, ORG_TYPES, CONTRACT, LANG_NAMES, entries, isAdmin, table, tabs, who, bars, kpi, toolbar, btn, csvDownload, due } from './team-kit.js';
import { rerender, consultants, consultantName, T } from './team.js';

const setQ = (sec, k, v) => { const q = query(); if (v) q.set(k, v); else q.delete(k); go('hc/' + sec + (q.toString() ? '?' + q : '')); };
const dd = { not_started: ['Not started', 'grey'], in_progress: ['In progress', 'amber'], completed: ['Completed', 'green'], failed: ['Failed', 'red'] };
const EMP_STATUS = { prospect: 'Prospect', due_diligence: 'Due diligence', active: 'Active', paused: 'Paused', closed: 'Closed' };
const VAC_TONE = { draft: 'grey', published: 'green', closed: 'red' };
const salary = v => v.salary_text || (v.salary_min ? '£' + v.salary_min.toLocaleString('en-GB') + (v.salary_max ? '–£' + v.salary_max.toLocaleString('en-GB') : '') : '—');
const strip = o => { for (const k of Object.keys(o)) if (o[k] === '') o[k] = null; return o; };

export const ADMIN = {
  /* ---------- employers + employer enquiries ---------- */
  async employers(el) {
    const tab = isAdmin() ? query().get('tab') || 'employers' : 'employers';
    if (tab === 'enquiries') {
      const route = query().get('route') || 'employer';
      const r = await api('team/enquiries?route=' + route);
      const EQ = { new: ['New', 'amber'], in_progress: ['In progress', 'teal'], responded: ['Responded', 'green'], converted: ['Converted', 'gold'], closed: ['Closed', 'grey'] };
      clear(el, tabs([['employers', 'Employers'], ['enquiries', 'Enquiries']], tab, v => setQ('employers', 'tab', v === 'employers' ? '' : v)),
        card(null, [tabs([['employer', 'Employer'], ['candidate', 'Candidate'], ['general', 'General']], route, v => setQ('employers', 'route', v)),
          table([
            ['Received', e => h('span', null, fmtDate(e.created_at), h('small', { text: e.reference }))],
            ['From', e => who(e.name, [e.organisation, e.job_title, e.email].filter(Boolean).join(' · '))],
            ['Subject', e => h('span', null, e.subject || '—', h('small', { class: 'pt-clip', text: e.message || '' }))],
            ['Status', e => { const s = select('status', Object.entries(EQ).map(([k, v]) => [k, v[0]]), e.status, { class: 'pt-inline-select', 'aria-label': 'Status' }); s.addEventListener('change', async () => { await api('team/enquiries/' + e.id, { method: 'PATCH', body: { status: s.value } }); toast('Enquiry updated'); }); return s; }],
            ['', e => route === 'employer' && e.status !== 'converted' ? btn('Create employer', () => editEmployer({ organisation_name: e.organisation || '', contact_name: e.name, job_title: e.job_title, email: e.email, phone: e.phone, location: e.location, organisation_type: e.organisation_type || 'other' }, e.id), 'hc-btn-line', 'plus') : h('a', { href: 'mailto:' + e.email, class: 'pt-link', text: 'Reply' })]
          ], r.data, { emptyText: 'No enquiries.', emptyIcon: 'inbox', onRow: e => enquiryView(e) })]));
      return;
    }
    const r = await api('team/employers');
    clear(el, isAdmin() ? tabs([['employers', 'Employers'], ['enquiries', 'Enquiries']], tab, v => setQ('employers', 'tab', v === 'employers' ? '' : v)) : null,
      h('div', { class: 'pt-notice' }, icon('shield'), h('span', { text: 'Only list organisations with a genuine relationship. Vacancies can only be published for employers whose due diligence is completed (identity, CQC or NHS status, sponsor licence where relevant, and agreed terms).' })),
      card(null, [isAdmin() ? h('div', { class: 'pt-card-h' }, h('span', { class: 'pt-muted', text: r.data.length + ' employers' }), btn('Add employer', () => editEmployer({}), 'hc-btn-teal', 'plus')) : null,
        table([
          ['Organisation', e => who(e.organisation_name, ORG_TYPES[e.organisation_type] + (e.location ? ' · ' + e.location : ''))],
          ['Contact', e => who(e.contact_name, e.email)],
          ['Status', e => badge(EMP_STATUS[e.status], e.status === 'active' ? 'green' : e.status === 'closed' ? 'grey' : 'teal')],
          ['Due diligence', e => badge(...(dd[e.due_diligence_status] || ['—', 'grey']))],
          ['Sponsor licence', e => e.sponsor_licence == null ? '—' : e.sponsor_licence ? 'Yes' : 'No'],
          ['Terms signed', e => e.terms_signed_at ? fmtDate(e.terms_signed_at) : '—']
        ], r.data, { emptyText: 'No employers yet.', emptyIcon: 'building', onRow: isAdmin() ? e => editEmployer(e) : null })]));
  },

  /* ---------- vacancies ---------- */
  async vacancies(el) {
    const [r, emps] = await Promise.all([api('team/vacancies'), isAdmin() ? api('team/employers') : { data: [] }]);
    const status = query().get('status') || '';
    const rows = r.data.filter(v => !status || v.status === status);
    clear(el, h('p', { class: 'pt-muted pt-intro', text: isAdmin() ? 'Publish only genuine vacancies authorised by the employer. Published roles appear on the Healthcare website and in matching candidates’ portals.' : 'Published opportunities and roles you manage. Share them with suitable candidates in your caseload.' }),
      card(null, [h('div', { class: 'pt-card-h' }, tabs([['', 'All'], ['published', 'Published'], ['draft', 'Draft'], ['closed', 'Closed']], status, v => setQ('vacancies', 'status', v)), isAdmin() ? btn('New vacancy', () => editVacancy({}, emps.data), 'hc-btn-teal', 'plus') : null),
        table([
          ['Vacancy', v => who(v.title, [PROF[v.profession], v.location].filter(Boolean).join(' · '))],
          ['Employer', v => who(v.employer?.organisation_name || v.employer_display, v.employer ? 'Shown as: ' + v.employer_display : 'Not linked')],
          ['Salary', v => salary(v)],
          ['Status', v => badge(v.status.replace(/^./, c => c.toUpperCase()), VAC_TONE[v.status])],
          ['Applications', v => String(v.applications || 0)],
          ['Closes', v => v.closes_on ? fmtDate(v.closes_on) : '—'],
          ['', v => h('div', { class: 'pt-actions' },
            v.status === 'published' ? h('a', { class: 'pt-link', href: '/healthcare/vacancies/?v=' + encodeURIComponent(v.slug), target: '_blank', rel: 'noopener', text: 'View' }) : null,
            isAdmin() && v.status !== 'published' ? btn('Publish', () => publish(v), 'hc-btn-teal') : null,
            isAdmin() && v.status === 'published' ? btn('Close', async () => { if (await confirmBox('Close vacancy', 'Remove “' + v.title + '” from the website? Existing applications are kept.')) { await api('team/vacancies/' + v.id, { method: 'PATCH', body: { status: 'closed' } }); toast('Vacancy closed'); rerender(); } }, 'hc-btn-line') : null)]
        ], rows, { emptyText: 'No vacancies.', emptyIcon: 'briefcase', onRow: isAdmin() ? v => editVacancy(v, emps.data) : v => window.open('/healthcare/vacancies/?v=' + encodeURIComponent(v.slug), '_blank', 'noopener') })]));
  },

  /* ---------- consultants ---------- */
  async consultants(el) {
    T.consultants = null; await consultants();
    const rows = T.staff;
    clear(el, h('div', { class: 'pt-notice' }, icon('lock'), h('span', { text: 'Healthcare access is separate from Education. Only staff enabled here can open Healthcare records, and each consultant only sees the candidates assigned to them. Team accounts must use two-step verification.' })),
      card(null, table([
        ['Staff member', s => who(s.full_name, s.healthcare?.title || 'Education staff (' + s.role + ')')],
        ['Healthcare access', s => s.healthcare?.active ? badge('Enabled', 'green') : badge('No access', 'grey')],
        ['Caseload', s => s.healthcare?.active ? h('span', { class: 'pt-load' }, h('i', null, h('em', { style: { width: Math.min(100, (s.active_candidates / (s.healthcare.capacity || 40)) * 100) + '%' } })), h('small', { text: s.active_candidates + ' / ' + s.healthcare.capacity })) : '—'],
        ['Placed', s => String(s.placed || 0)],
        ['Languages', s => (s.healthcare?.languages || []).map(l => LANG_NAMES[l] || l).join(', ') || '—'],
        ['', s => btn(s.healthcare?.active ? 'Edit' : 'Enable', () => editConsultant(s), s.healthcare?.active ? 'hc-btn-line' : 'hc-btn-teal')]
      ], rows, { emptyText: 'No active staff accounts.', emptyIcon: 'users' })));
  },

  /* ---------- ethical recruitment & compliance ---------- */
  async compliance(el) {
    const tab = query().get('tab') || 'checklist';
    const [{ data: d }, complaints, requests] = await Promise.all([api('team/compliance'), tab === 'complaints' ? api('team/complaints') : null, tab === 'requests' ? api('team/enquiries?route=general') : null]);
    const done = d.items.filter(i => i.status === 'in_place').length;
    const head = h('div', null,
      h('section', { class: 'pt-hero' }, h('div', null, h('span', { class: 'k', text: 'Ethical Recruitment & Compliance' }), h('h2', { text: done + ' of ' + d.items.length + ' controls in place' }),
        h('p', { text: 'Evidence for the Code of Practice for the international recruitment of health and social care personnel in England, UK GDPR and the Conduct of Employment Agencies Regulations.' })),
        h('div', { class: 'pt-hero-side' }, h('div', { class: 'pt-progress' }, h('i', { style: { width: Math.round((done / Math.max(1, d.items.length)) * 100) + '%' } })))),
      tabs([['checklist', 'Controls'], ['countries', 'Country list'], ['flagged', 'Flagged candidates', d.flagged.length], ['requests', 'Data requests', d.deletion_requests.length], ['complaints', 'Complaints']], tab, v => setQ('compliance', 'tab', v === 'checklist' ? '' : v)));
    const body = h('div', { class: 'pt-pane' });
    clear(el, head, body);
    if (tab === 'checklist') {
      const ST = { not_started: ['Not started', 'grey'], in_progress: ['In progress', 'amber'], in_place: ['In place', 'green'], needs_review: ['Needs review', 'red'] };
      const cats = { code_of_practice: 'Code of Practice', policy: 'Policies', data_protection: 'Data protection', operations: 'Operations' };
      put(body, ...Object.entries(cats).map(([k, label]) => {
        const items = d.items.filter(i => i.category === k); if (!items.length) return null;
        return card(label, table([['Control', i => who(i.title, i.evidence ? i.evidence.slice(0, 120) : 'No evidence recorded')], ['Owner', i => i.owner_name || '—'], ['Status', i => badge(...ST[i.status])], ['Review due', i => i.review_due ? due(i.review_due) : '—']], items, { onRow: i => editItem(i, ST) }));
      }));
    } else if (tab === 'countries') {
      const reviewed = d.settings.country_list_reviewed_at;
      put(body, h('div', { class: 'pt-notice ' + (!reviewed || Date.now() - new Date(reviewed) > 90 * 864e5 ? 'warn' : '') }, icon('flag'), h('span', null,
        'Check this list against the official ', h('a', { href: d.settings.country_list_source || 'https://www.nhsemployers.org/articles/code-practice-red-and-amber-list-countries', target: '_blank', rel: 'noopener', text: 'NHS Employers red and amber list' }),
        ' at least monthly. Last reviewed: ' + (reviewed ? fmtDate(reviewed) : 'never') + '. Changing a country re-evaluates every candidate resident there.')),
        card(null, [h('div', { class: 'pt-card-h' }, h('span', { class: 'pt-muted', text: d.country_rules.length + ' countries recorded · countries not listed are treated as green' }),
          h('div', { class: 'pt-actions' }, btn('Add or change country', () => editCountry({}), 'hc-btn-teal', 'plus'), btn('Mark list as reviewed today', async () => { await api('team/compliance/countries/reviewed', { method: 'POST', body: {} }); toast('Country list marked as reviewed'); rerender(); }, 'hc-btn-line', 'check'))),
          table([['Country', r => who(r.country_name, r.country_code)], ['Status', r => badge(r.status.toUpperCase(), r.status)], ['Agreement / note', r => h('small', { class: 'pt-clip', text: r.agreement_note || '—' })], ['Reviewed', r => fmtDate(r.reviewed_at)]], d.country_rules, { onRow: r => editCountry(r), emptyText: 'No countries recorded yet.' })]));
    } else if (tab === 'flagged') {
      put(body, card('Candidates needing a Code of Practice decision', table([
        ['Candidate', c => who(c.full_name, c.reference)], ['Country of residence', c => country(c.country_residence)], ['Status', c => badge(c.country_status.toUpperCase(), c.country_status === 'unchecked' ? 'grey' : c.country_status)],
        ['Stage', c => STAGE_LABELS[c.stage]], ['Consultant', c => consultantName(c.consultant_id)]
      ], d.flagged, { onRow: c => go('hc/candidates/' + c.id), emptyText: 'No flagged candidates.', emptyIcon: 'shield' })));
    } else if (tab === 'requests') {
      const dp = requests.data.filter(e => e.details?.data_request);
      put(body, card('Erasure requests', table([['Candidate', c => who(c.full_name, c.reference)], ['Requested', c => fmtDate(c.deletion_requested_at)], ['Respond by', c => due(new Date(new Date(c.deletion_requested_at).getTime() + 30 * 864e5).toISOString())]], d.deletion_requests, { onRow: c => go('hc/candidates/' + c.id), emptyText: 'No erasure requests.', emptyIcon: 'lock' })),
        card('All data protection requests', table([['Received', e => h('span', null, fmtDate(e.created_at), h('small', { text: e.reference }))], ['Candidate', e => who(e.name, e.details.candidate_reference)], ['Request', e => badge(e.details.data_request, 'teal')], ['Note', e => h('small', { class: 'pt-clip', text: e.message || '' })], ['Status', e => e.status]], dp, { emptyText: 'No data protection requests.', onRow: e => e.details.candidate_id && go('hc/candidates/' + e.details.candidate_id) })));
    } else if (tab === 'complaints') {
      const CS = { received: ['Received', 'amber'], acknowledged: ['Acknowledged', 'teal'], investigating: ['Investigating', 'teal'], resolved: ['Resolved', 'green'], escalated: ['Escalated', 'red'], closed: ['Closed', 'grey'] };
      put(body, card('Complaints register', table([
        ['Received', c => h('span', null, fmtDate(c.created_at), h('small', { text: c.reference }))], ['Complainant', c => who(c.complainant_name, c.complainant_role + (c.candidate_reference ? ' · ' + c.candidate_reference : ''))],
        ['Subject', c => who(c.subject, c.category.replace(/_/g, ' '))], ['Severity', c => badge(c.severity, c.severity === 'standard' ? 'grey' : 'red')], ['Status', c => badge(...CS[c.status])],
        ['Deadline', c => c.closed_at ? 'Closed ' + fmtDate(c.closed_at) : !c.acknowledged_at ? due(c.ack_due_at) : due(c.response_due_at)]
      ], complaints.data, { onRow: c => editComplaint(c, CS), emptyText: 'No complaints recorded.', emptyIcon: 'shield' })));
    }
  },

  /* ---------- reports ---------- */
  async reports(el) {
    const { data: d } = await api('team/reports');
    const months = Object.keys(d.monthly).sort().slice(-12);
    clear(el, h('div', { class: 'pt-card-h' }, h('p', { class: 'pt-muted', text: 'Recruitment activity, including country of application and nationality, as needed for Code of Practice reporting. Exports contain no names or contact details.' }),
        btn('Export CSV', async () => { const tk = await token(); const r = await fetch('/api/hc/team/reports?format=csv', { headers: { Authorization: 'Bearer ' + tk } }); if (!r.ok) return toast('Export failed', true); csvDownload('healthcare-recruitment-activity.csv', await r.text()); }, 'hc-btn-teal', 'download')),
      h('div', { class: 'pt-grid pt-g4' }, kpi('Candidates', d.total), kpi('Active', STAGES.filter(s => !CLOSED.has(s)).reduce((n, s) => n + (d.by_stage[s] || 0), 0)), kpi('Recruitment completed', d.placements.total, { tone: 'gold' }), kpi('Interviews held', d.interviews.completed || 0)),
      h('div', { class: 'pt-grid pt-g2' },
        card('Registrations per month', months.length ? h('div', { class: 'pt-cols' }, months.map(m => { const max = Math.max(...months.map(x => d.monthly[x])); return h('div', { class: 'pt-colbar', title: m + ': ' + d.monthly[m] }, h('i', { style: { height: Math.max(4, (d.monthly[m] / max) * 100) + '%' } }), h('b', { text: d.monthly[m] }), h('small', { text: fmtDate(m + '-01', { month: 'short' }) })); })) : empty('chart', 'No data yet.')),
        card('By stage', bars(d.by_stage, STAGE_LABELS, { limit: 15 })),
        card('Country of application', bars(d.by_country)), card('Nationality', bars(d.by_nationality)),
        card('Code of Practice status', bars(d.by_code_status, { green: 'Green', amber: 'Amber', red: 'Red', unchecked: 'Unchecked' })), card('Profession', bars(d.by_profession, PROF)),
        card('Placements by country of application', bars(d.placements.by_country)), card('Source', bars(d.by_source, { website: 'Website', portal: 'Portal', admin: 'Added by admin', referral: 'Referral', event: 'Event' }))));
  },

  /* ---------- settings ---------- */
  async settings(el) {
    const tab = query().get('tab') || 'general';
    const head = tabs([['general', 'General'], ['audit', 'Audit log'], ['retention', 'Retention review']], tab, v => setQ('settings', 'tab', v === 'general' ? '' : v));
    if (tab === 'audit') {
      const r = await api('team/audit');
      clear(el, head, card('Activity log', table([['When', a => fmtDateTime(a.created_at)], ['Who', a => a.actor_name || a.actor_role], ['Action', a => h('code', { text: a.action })], ['Record', a => h('small', { text: a.entity + (a.entity_id ? ' · ' + String(a.entity_id).slice(0, 8) : '') })]], r.data, { emptyText: 'No activity yet.' })));
      return;
    }
    if (tab === 'retention') {
      const r = await api('team/retention');
      clear(el, head, h('div', { class: 'pt-notice' }, icon('clock'), h('span', { text: `Policy: unsuccessful or inactive records are reviewed after ${r.policy.unsuccessful_months} months; placed candidates are kept for ${r.policy.placed_years} years. Review each record, then erase or archive it from the candidate page.` })),
        card('Records due for review', table([['Candidate', c => who(c.full_name, c.reference)], ['Stage', c => STAGE_LABELS[c.stage]], ['Last activity', c => fmtDate(c.updated_at)]], r.data, { onRow: c => go('hc/candidates/' + c.id), emptyText: 'No records are past the retention period.', emptyIcon: 'clock' })));
      return;
    }
    const { data: s } = await api('team/settings');
    const f = (k, l, o = {}) => field(l, input(k, { value: s[k] ?? '', ...o }));
    const form = h('form', null,
      card('Where form submissions are sent', h('div', { class: 'pt-fields' }, f('notify_email', 'General notifications', { type: 'email' }), f('candidate_enquiries_email', 'Candidate registrations and messages', { type: 'email' }), f('employer_enquiries_email', 'Employer enquiries', { type: 'email' }), f('complaints_email', 'Complaints', { type: 'email' }))),
      card('Responsible people', h('div', { class: 'pt-fields' }, f('compliance_lead_name', 'Compliance lead'), f('compliance_lead_title', 'Compliance lead title'), f('data_protection_lead_name', 'Data protection lead'))),
      card('Service standards and retention', h('div', { class: 'pt-fields' }, f('complaint_ack_days', 'Acknowledge complaints within (working days)', { type: 'number', min: 1, max: 10 }), f('complaint_response_days', 'Respond to complaints within (working days)', { type: 'number', min: 5, max: 60 }),
        f('retention_unsuccessful_months', 'Review unsuccessful records after (months)', { type: 'number', min: 1, max: 84 }), f('retention_placed_years', 'Keep placed candidate records for (years)', { type: 'number', min: 1, max: 10 }), f('privacy_notice_version', 'Candidate Privacy Notice version'))),
      h('div', { class: 'pt-actions pt-sticky' }, h('button', { class: 'hc-btn hc-btn-teal', type: 'submit', text: 'Save settings' })));
    form.addEventListener('submit', async e => { e.preventDefault(); try { const b = formData(form); for (const k of Object.keys(b)) if (b[k] == null) delete b[k]; await api('team/settings', { method: 'PATCH', body: b }); toast('Settings saved'); } catch (x) { toast(x.message, true); } });
    clear(el, head, h('div', { class: 'pt-grid pt-g21' }, form, h('div', { class: 'pt-stack' },
      card('Security', [h('p', { class: 'pt-muted', text: 'Healthcare data is kept separate from Education. Team accounts use two-step verification; files are stored in a private bucket and opened with short-lived links; every view and change is logged.' }), h('p', { class: 'pt-small', text: 'Last updated ' + (s.updated_at ? ago(s.updated_at) : '—') })]),
      card('Public website', h('ul', { class: 'pt-links' }, [['/healthcare/', 'Healthcare home'], ['/healthcare/vacancies/', 'Vacancies'], ['/healthcare/policies/', 'Policies']].map(([href, l]) => h('li', null, h('a', { href, target: '_blank', rel: 'noopener' }, l, icon('arrow', 14)))))))));
  }
};

/* ---------- dialogs ---------- */
function enquiryView(e) {
  const rows = [['Reference', e.reference], ['Received', fmtDateTime(e.created_at)], ['Name', e.name], ['Email', e.email], ['Phone', e.phone], ['Organisation', e.organisation], ['Job title', e.job_title], ['Location', e.location], ['Subject', e.subject], ['Message', e.message], ...Object.entries(e.details || {}).map(([k, v]) => [k.replace(/_/g, ' '), Array.isArray(v) ? v.join(', ') : typeof v === 'object' ? JSON.stringify(v) : String(v)])];
  dialog({ title: 'Enquiry ' + e.reference, okText: 'Close', wide: true, body: h('dl', { class: 'pt-dl' }, rows.filter(r => r[1]).flatMap(([k, v]) => [h('dt', { text: k }), h('dd', { class: 'pt-pre', text: v })])) });
}
async function editEmployer(e, fromEnquiry) {
  const v = k => e[k] ?? '';
  const body = h('div', { class: 'pt-fields' },
    field('Organisation name', input('organisation_name', { value: v('organisation_name'), required: true })), field('Type', select('organisation_type', entries(ORG_TYPES), e.organisation_type || 'other')),
    field('Contact name', input('contact_name', { value: v('contact_name') })), field('Job title', input('job_title', { value: v('job_title') })),
    field('Email', input('email', { type: 'email', value: v('email') })), field('Phone', input('phone', { type: 'tel', value: v('phone') })),
    field('Location', input('location', { value: v('location') })), field('CQC provider ID', input('cqc_provider_id', { value: v('cqc_provider_id') })),
    field('Sponsor licence', select('sponsor_licence', [['', 'Unknown'], ['true', 'Yes'], ['false', 'No']], e.sponsor_licence == null ? '' : String(e.sponsor_licence))),
    field('Relationship status', select('status', entries(EMP_STATUS), e.status || 'prospect')),
    field('Due diligence', select('due_diligence_status', Object.entries(dd).map(([k, x]) => [k, x[0]]), e.due_diligence_status || 'not_started')),
    field('Terms signed on', input('terms_signed_at', { type: 'date', value: v('terms_signed_at') })),
    field('Due diligence notes', textarea('due_diligence_notes', v('due_diligence_notes')), { full: true, hint: 'Record what was checked and where: Companies House, CQC register, Home Office sponsor register, references.' }),
    field('Internal notes', textarea('notes', v('notes')), { full: true }));
  const r = await dialog({ title: e.id ? e.organisation_name : 'Add employer', wide: true, okText: 'Save employer', body, onOk: async form => {
    const b = strip(formData(form)); b.sponsor_licence = b.sponsor_licence == null ? null : b.sponsor_licence === 'true';
    if (fromEnquiry) b.from_enquiry = fromEnquiry;
    return e.id ? api('team/employers/' + e.id, { method: 'PATCH', body: b }) : api('team/employers', { method: 'POST', body: b });
  } });
  if (r) { toast('Employer saved'); rerender(); }
}
async function editVacancy(v, employers) {
  const g = k => v[k] ?? '';
  const empSel = select('employer_id', [['', 'Choose employer'], ...employers.map(e => [e.id, e.organisation_name + (e.due_diligence_status === 'completed' ? '' : ' (due diligence ' + e.due_diligence_status.replace('_', ' ') + ')')])], v.employer_id || '');
  const disp = input('employer_display', { value: g('employer_display'), required: true });
  empSel.addEventListener('change', () => { if (!disp.value) disp.value = employers.find(e => e.id === empSel.value)?.organisation_name || ''; });
  const cons = await consultants();
  const body = h('div', { class: 'pt-fields' },
    field('Job title', input('title', { value: g('title'), required: true }), { full: true }),
    field('Employer record', empSel), field('Employer name shown publicly', disp, { hint: 'Use “Confidential UK employer” only if the employer has asked to stay anonymous.' }),
    field('Profession', select('profession', entries(PROF), v.profession || 'registered_nurse')), field('Location', input('location', { value: g('location'), required: true })),
    field('Salary from (£)', input('salary_min', { type: 'number', min: 0, value: g('salary_min') })), field('Salary to (£)', input('salary_max', { type: 'number', min: 0, value: g('salary_max') })),
    field('Salary wording', input('salary_text', { value: g('salary_text'), placeholder: 'e.g. NHS Band 5, £31,049–£37,796' }), { full: true }),
    field('Contract', select('contract_type', entries(CONTRACT), v.contract_type || 'permanent')), field('Working hours', input('working_hours', { value: g('working_hours'), required: true })),
    field('Visa sponsorship', select('visa_sponsorship', [['not_stated', 'Not stated'], ['available', 'Available (confirmed by employer)'], ['not_available', 'Not available']], v.visa_sponsorship || 'not_stated')),
    field('Closing date', input('closes_on', { type: 'date', value: g('closes_on') })),
    field('Responsible consultant', select('consultant_id', [['', 'None'], ...cons.map(c => [c.user_id, c.full_name])], v.consultant_id || ''), { full: true }),
    field('Role description', textarea('description', g('description'), { rows: 6, required: true, minlength: 20 }), { full: true }),
    field('Qualifications and experience', textarea('qualifications', g('qualifications'), { required: true }), { full: true }),
    field('Registration requirements', textarea('registration_requirements', g('registration_requirements'), { required: true }), { full: true, hint: 'State the UK regulator registration needed (NMC, HCPC, GPhC) and whether it must be in place before starting.' }),
    field('Conditions and support', textarea('conditions', g('conditions'), { required: true }), { full: true }));
  const r = await dialog({ title: v.id ? 'Edit vacancy' : 'New vacancy', wide: true, okText: v.id ? 'Save changes' : 'Save as draft', body, onOk: async form => {
    const b = strip(formData(form));
    return v.id ? api('team/vacancies/' + v.id, { method: 'PATCH', body: b }) : api('team/vacancies', { method: 'POST', body: b });
  } });
  if (r) { toast('Vacancy saved'); rerender(); }
}
async function publish(v) {
  const cb = h('input', { type: 'checkbox', name: 'authorised' });
  const r = await dialog({ title: 'Publish “' + v.title + '”', okText: 'Publish',
    body: h('div', null, h('p', { class: 'pt-muted', text: 'The vacancy will appear on the Healthcare website and in matching candidates’ portals.' }),
      h('label', { class: 'pt-check' }, cb, h('span', { text: 'I confirm this is a genuine vacancy, authorised in writing by the employer, and that the salary, conditions and sponsorship details are accurate.' }))),
    onOk: async () => { if (!cb.checked) throw new Error('Please confirm the vacancy is genuine and authorised.'); await api('team/vacancies/' + v.id, { method: 'PATCH', body: { status: 'published', authorised: true } }); } });
  if (r) { toast('Vacancy published'); rerender(); }
}
async function editConsultant(s) {
  const hc = s.healthcare || {};
  const langs = h('div', { class: 'pt-checks' }, Object.entries(LANG_NAMES).map(([k, l]) => h('label', { class: 'pt-check' }, h('input', { type: 'checkbox', name: 'lang_' + k, checked: (hc.languages || []).includes(k) }), h('span', { text: l }))));
  const profs = h('div', { class: 'pt-checks' }, Object.entries(PROF).map(([k, l]) => h('label', { class: 'pt-check' }, h('input', { type: 'checkbox', name: 'prof_' + k, checked: (hc.professions || []).includes(k) }), h('span', { text: l }))));
  const body = h('div', null,
    h('label', { class: 'pt-check pt-switch' }, h('input', { type: 'checkbox', name: 'active', checked: hc.active !== false }), h('span', { text: 'Healthcare access enabled' })),
    h('div', { class: 'pt-fields' }, field('Title shown to candidates', input('title', { value: hc.title || 'Healthcare Recruitment Consultant' })), field('Caseload capacity', input('capacity', { type: 'number', min: 1, max: 500, value: hc.capacity || 40 }))),
    h('fieldset', { class: 'pt-fs' }, h('legend', { text: 'Languages' }), langs), h('fieldset', { class: 'pt-fs' }, h('legend', { text: 'Professions covered' }), profs),
    field('Short bio shown to candidates', textarea('bio', hc.bio || ''), { hint: 'Factual only: experience and languages. Do not mention qualifications or memberships that cannot be evidenced.' }));
  const r = await dialog({ title: s.full_name, wide: true, okText: 'Save', body, onOk: async form => {
    const b = formData(form);
    const payload = { active: !!b.active, title: b.title || undefined, capacity: b.capacity || 40, bio: b.bio, languages: Object.keys(LANG_NAMES).filter(k => b['lang_' + k]), professions: Object.keys(PROF).filter(k => b['prof_' + k]) };
    return api('team/consultants/' + s.user_id, { method: 'PUT', body: payload });
  } });
  if (r) { toast('Consultant updated'); T.consultants = null; rerender(); }
}
async function editItem(i, ST) {
  const r = await dialog({ title: i.title, wide: true, okText: 'Save', body: h('div', { class: 'pt-fields' },
    field('Status', select('status', Object.entries(ST).map(([k, v]) => [k, v[0]]), i.status)), field('Owner', input('owner_name', { value: i.owner_name || '' })),
    field('Approved on', input('approved_at', { type: 'date', value: i.approved_at || '' })), field('Next review', input('review_due', { type: 'date', value: i.review_due || '' })),
    field('Evidence', textarea('evidence', i.evidence || '', { rows: 5 }), { full: true, hint: 'Where the evidence is kept: policy document and version, training record, contract clause, register entry.' })),
    onOk: async form => api('team/compliance/items/' + i.key, { method: 'PATCH', body: strip(formData(form)) }) });
  if (r) { toast('Control updated'); rerender(); }
}
async function editCountry(r0) {
  const code = select('code', countryOptions(), r0.country_code || '', { disabled: !!r0.country_code });
  const r = await dialog({ title: r0.country_code ? r0.country_name : 'Set a country rule', okText: 'Save and re-check candidates', body: h('div', null,
    field('Country', code), field('Status', select('status', [['red', 'Red: no active recruitment'], ['amber', 'Amber: only under the government agreement'], ['green', 'Green']], r0.status || 'red')),
    field('Agreement / note', textarea('agreement_note', r0.agreement_note || '')), field('Source URL', input('source_url', { type: 'url', value: r0.source_url || 'https://www.nhsemployers.org/articles/code-practice-red-and-amber-list-countries' }))),
    onOk: async form => { const b = strip(formData(form)); const c = r0.country_code || code.value; return api('team/compliance/countries/' + c, { method: 'PUT', body: { country_name: country(c), status: b.status, agreement_note: b.agreement_note, source_url: b.source_url } }); } });
  if (r) { toast('Country rule saved'); rerender(); }
}
async function editComplaint(c, CS) {
  const r = await dialog({ title: 'Complaint ' + c.reference, wide: true, okText: 'Save', body: h('div', null,
    h('dl', { class: 'pt-dl' }, [['From', c.complainant_name + ' · ' + c.email + (c.phone ? ' · ' + c.phone : '')], ['Role', c.complainant_role], ['Category', c.category.replace(/_/g, ' ')], ['Subject', c.subject], ['Details', c.details], ['Acknowledge by', fmtDate(c.ack_due_at)], ['Respond by', fmtDate(c.response_due_at)]].flatMap(([k, v]) => [h('dt', { text: k }), h('dd', { class: 'pt-pre', text: v })])),
    h('div', { class: 'pt-fields pt-mt' }, field('Status', select('status', Object.entries(CS).map(([k, v]) => [k, v[0]]), c.status)), field('Severity', select('severity', [['standard', 'Standard'], ['serious', 'Serious'], ['safeguarding', 'Safeguarding']], c.severity)),
      field('Escalated to', input('escalated_to', { value: c.escalated_to || '', placeholder: 'e.g. EAS Inspectorate, ICO' }), { full: true }), field('Outcome and response', textarea('resolution', c.resolution || '', { rows: 5 }), { full: true }))),
    onOk: async form => api('team/complaints/' + c.id, { method: 'PATCH', body: strip(formData(form)) }) });
  if (r) { toast('Complaint updated'); rerender(); }
}
