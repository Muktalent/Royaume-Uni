// MUKTalent Healthcare · day-to-day recruitment sections shared by consultants and admins.
import { S, h, clear, icon, api, go, query, toast, badge, empty, card, fmtDate, fmtDateTime, ago, country } from './core.js';
import { STAGES, STAGE_LABELS, CLOSED, PROF, APP_STATUS, entries, stageBadge, countryBadge, isAdmin, table, tabs, who, bars, kpi, toolbar, btn } from './team-kit.js';
import { docRow, appStatusSelect, interviewStatus, thread, taskList, addTask, scheduleInterview, refreshCounts, rerender, consultants, consultantName } from './team.js';

const setQ = (sec, k, v) => { const q = query(); if (v) q.set(k, v); else q.delete(k); go('hc/' + sec + (q.toString() ? '?' + q : '')); };

export const OPS = {
  async applications(el) {
    const status = query().get('status') || (isAdmin() ? '' : 'applied');
    const r = await api('team/applications' + (status ? '?status=' + status : ''));
    const sel = h('select', { 'aria-label': 'Status', onchange: e => setQ('applications', 'status', e.target.value) }, [['', 'All statuses'], ...Object.entries(APP_STATUS)].map(([v, l]) => h('option', { value: v, selected: v === status }, l)));
    clear(el, h('p', { class: 'pt-muted pt-intro', text: 'Applications to specific vacancies. Moving to “Submitted to employer” or later is blocked for red-list countries and records that are not yet verified.' }),
      card(null, [toolbar(sel), table([
        ['Candidate', a => h('a', { href: '#/hc/candidates/' + a.candidate.id }, who(a.candidate.full_name, a.candidate.reference + ' · ' + (PROF[a.candidate.profession] || '')))],
        ['Vacancy', a => who(a.vacancy?.title, [a.vacancy?.employer_display, a.vacancy?.location].filter(Boolean).join(' · '))],
        ['Code of Practice', a => badge((a.candidate.country_status || '—').toUpperCase(), { red: 'red', amber: 'amber', green: 'green' }[a.candidate.country_status] || 'grey')],
        ['Applied', a => h('span', null, fmtDate(a.created_at), h('small', { text: a.reference }))],
        ['Status', a => appStatusSelect(a, rerender)]
      ], r.data, { emptyText: status === 'applied' ? 'No new applications.' : 'No applications.', emptyIcon: 'inbox' })]));
  },

  async documents(el) {
    const status = query().get('status') || 'uploaded';
    const r = await api('team/documents?status=' + status);
    clear(el, h('p', { class: 'pt-muted pt-intro', text: 'Review files uploaded by candidates. Opening a file creates a 60-second link and is recorded in the audit log.' }),
      card(null, [tabs([['uploaded', 'To review'], ['requested', 'Requested'], ['rejected', 'Needs new file'], ['approved', 'Approved']], status, v => setQ('documents', 'status', v)),
        r.data.length ? h('div', { class: 'pt-list' }, r.data.map(d => docRow(d, rerender))) : empty('folder', status === 'uploaded' ? 'Nothing to review. Well done.' : 'No documents.')]));
  },

  async interviews(el) {
    const past = query().get('past') === '1';
    const r = await api('team/interviews' + (past ? '?past=1' : ''));
    clear(el, card(null, [h('div', { class: 'pt-card-h' }, tabs([['0', 'Upcoming'], ['1', 'Past']], past ? '1' : '0', v => setQ('interviews', 'past', v === '1' ? '1' : '')), btn('Schedule interview', () => scheduleInterview(null, rerender, true), 'hc-btn-teal', 'plus')),
      table([
        ['When', i => h('span', { class: 'pt-when' }, h('b', { text: fmtDate(i.scheduled_at, { weekday: 'short', day: 'numeric', month: 'short' }) }), h('small', { text: fmtDate(i.scheduled_at, { hour: '2-digit', minute: '2-digit' }) + ' · ' + i.duration_minutes + ' min' }))],
        ['Candidate', i => h('a', { href: '#/hc/candidates/' + i.candidate.id }, who(i.candidate.full_name, i.candidate.reference))],
        ['Interview', i => who(i.title, [i.mode.replace('_', ' '), i.employer?.organisation_name, i.location].filter(Boolean).join(' · '))],
        ['Status', i => interviewStatus(i, rerender)]
      ], r.data, { emptyText: past ? 'No past interviews.' : 'No upcoming interviews.', emptyIcon: 'calendar' })]));
  },

  async messages(el, candidateId) {
    const r = await api('team/messages');
    const threads = r.data;
    const active = candidateId || threads[0]?.candidate.id;
    const listEl = h('div', { class: 'pt-thread-list' }, threads.length ? threads.map(t => h('button', { type: 'button', 'aria-current': String(t.candidate.id === active), onclick: () => go('hc/messages/' + t.candidate.id) },
      h('b', null, h('span', { text: t.candidate.full_name }), t.unread ? h('span', { class: 'pt-count', text: t.unread }) : h('small', { text: ago(t.last.created_at) })),
      h('small', { text: (t.last.sender_role === 'candidate' ? '' : 'You: ') + t.last.body }))) : empty('chat', 'No conversations yet.'));
    const pane = h('div', { class: 'pt-card' });
    clear(el, h('div', { class: 'pt-threads' }, h('div', null, listEl), pane));
    if (!active) { pane.appendChild(empty('chat', 'Select a conversation', 'Messages start from a candidate record or when a candidate writes from their portal.')); return; }
    const { data: d } = await api('team/candidates/' + active);
    clear(pane, h('div', { class: 'pt-card-h' }, h('h3', null, h('a', { href: '#/hc/candidates/' + active, text: d.candidate.full_name })), h('span', { class: 'pt-muted pt-small', text: d.candidate.reference + ' · ' + STAGE_LABELS[d.candidate.stage] })),
      thread(d.candidate, d.messages, () => OPS.messages(el, active)));
    refreshCounts();
  },

  async tasks(el) {
    const status = query().get('status') || 'open';
    const mine = isAdmin() ? query().get('mine') !== '0' : true;
    const r = await api('team/tasks?status=' + status + (mine ? '&mine=1' : ''));
    if (isAdmin()) await consultants();
    clear(el, card(null, [h('div', { class: 'pt-card-h' }, h('div', { class: 'pt-row-tabs' }, tabs([['open', 'Open'], ['done', 'Completed']], status, v => setQ('tasks', 'status', v === 'open' ? '' : v)),
      isAdmin() ? tabs([['1', 'Mine'], ['0', 'Everyone']], mine ? '1' : '0', v => setQ('tasks', 'mine', v === '0' ? '0' : '')) : null), btn('Add task', () => addTask(null, rerender), 'hc-btn-teal', 'plus')),
      status === 'open' ? taskList(r.data) : table([['Task', t => who(t.title, t.candidate ? t.candidate.full_name + ' · ' + t.candidate.reference : '')], ['Owner', t => consultantName(t.owner_id)], ['Completed', t => fmtDate(t.done_at)]], r.data, { emptyText: 'No completed tasks.' }),
      !mine && status === 'open' && r.data.length ? h('p', { class: 'pt-muted pt-small', text: 'Owners: ' + [...new Set(r.data.map(t => consultantName(t.owner_id)))].join(', ') }) : null]));
  },

  async performance(el) {
    const [o, rep] = await Promise.all([api('team/overview'), api('team/reports')]);
    const d = rep.data, m = o.metrics;
    const funnel = ['suitable_for_matching', 'submitted_to_employer', 'interview_scheduled', 'offer_received', 'recruitment_completed'];
    const reached = s => STAGES.slice(STAGES.indexOf(s)).filter(x => x !== 'unsuccessful' && x !== 'withdrawn').reduce((n, x) => n + (d.by_stage[x] || 0), 0);
    clear(el,
      h('section', { class: 'pt-hero' }, h('div', null, h('span', { class: 'k', text: 'My performance' }), h('h2', { text: S.me.staff.full_name }), h('p', { text: 'Your caseload and outcomes. Quality and compliance matter as much as volume.' }))),
      h('div', { class: 'pt-grid pt-g4' }, kpi('Active candidates', m.active), kpi('Total assigned', d.total), kpi('Recruitment completed', d.placements.total, { tone: 'gold' }), kpi('Open tasks', o.tasks.length, { href: '#/hc/tasks', tone: o.tasks.length > 10 ? 'warn' : '' })),
      h('div', { class: 'pt-grid pt-g2' },
        card('Recruitment funnel', bars(Object.fromEntries(funnel.map(s => [s, reached(s)])), STAGE_LABELS, { limit: 5 })),
        card('Caseload by stage', bars(Object.fromEntries(STAGES.filter(s => !CLOSED.has(s)).map(s => [s, d.by_stage[s] || 0])), STAGE_LABELS)),
        card('Applications by status', bars(d.applications, APP_STATUS)),
        card('By profession', bars(d.by_profession, PROF))));
  }
};
