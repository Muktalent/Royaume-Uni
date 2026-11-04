// MUKTalent Healthcare · shared helpers for the consultant and management dashboards (English only).
import { S, h, icon, badge, empty, fmtDate, country } from './core.js';

export const STAGES = ['new_registration', 'initial_review', 'awaiting_information', 'documentation_review', 'professional_verification', 'suitable_for_matching', 'submitted_to_employer', 'interview_scheduled', 'interview_completed', 'offer_received', 'offer_accepted', 'pre_employment_checks', 'recruitment_completed', 'unsuccessful', 'withdrawn'];
export const STAGE_LABELS = { new_registration: 'New Registration', initial_review: 'Initial Review', awaiting_information: 'Awaiting Information', documentation_review: 'Documentation Review', professional_verification: 'Professional Verification', suitable_for_matching: 'Suitable for Matching', submitted_to_employer: 'Submitted to Employer', interview_scheduled: 'Interview Scheduled', interview_completed: 'Interview Completed', offer_received: 'Offer Received', offer_accepted: 'Offer Accepted', pre_employment_checks: 'Pre-employment Checks', recruitment_completed: 'Recruitment Completed', unsuccessful: 'Unsuccessful', withdrawn: 'Withdrawn' };
export const CLOSED = new Set(['recruitment_completed', 'unsuccessful', 'withdrawn']);
export const PROF = { registered_nurse: 'Registered Nurse', adult_nurse: 'Adult Nurse', mental_health_nurse: 'Mental Health Nurse', learning_disability_nurse: 'Learning Disability Nurse', physiotherapist: 'Physiotherapist', occupational_therapist: 'Occupational Therapist', radiographer: 'Radiographer', biomedical_scientist: 'Biomedical Scientist', pharmacist: 'Pharmacist', other_ahp: 'Other Allied Health Professional', healthcare_support_worker: 'Healthcare Support Worker', social_care_professional: 'Social Care Professional', other: 'Other healthcare role' };
export const REG = { registered_uk: 'Registered with a UK regulator', in_progress_uk: 'UK registration in progress', registered_home: 'Registered in home country', not_started: 'Not registered yet', not_applicable: 'Not applicable' };
export const ENG = { ielts_oet_passed: 'IELTS / OET passed', test_booked: 'Test booked', preparing: 'Preparing', native_or_exempt: 'First language / exempt', not_sure: 'Not sure' };
export const EMP = { employed: 'Employed', self_employed: 'Self-employed', unemployed: 'Not working', studying: 'Studying', other: 'Other' };
export const DOC_KINDS = { cv: 'CV', passport: 'Passport or ID', qualification: 'Qualification certificate', registration: 'Proof of registration', english_test: 'English test result', reference: 'Reference', right_to_work: 'Right to work evidence', other: 'Other document' };
export const APP_STATUS = { applied: 'Applied', under_review: 'Under review', shortlisted: 'Shortlisted', submitted_to_employer: 'Submitted to employer', interview: 'Interview', offer: 'Offer', accepted: 'Accepted', unsuccessful: 'Unsuccessful', withdrawn: 'Withdrawn' };
export const ORG_TYPES = { nhs_trust: 'NHS trust', independent_hospital: 'Independent hospital', care_home: 'Care home', home_care: 'Home care provider', gp_practice: 'GP practice', clinic: 'Clinic', local_authority: 'Local authority', other: 'Other' };
export const CONTRACT = { permanent: 'Permanent', fixed_term: 'Fixed term', bank: 'Bank', part_time: 'Part time', other: 'Other' };
export const LANG_NAMES = { en: 'English', es: 'Spanish', fr: 'French', ar: 'Arabic' };

export const entries = (o, ph) => [...(ph !== undefined ? [['', ph]] : []), ...Object.entries(o)];
export function stageTone(s) { return s === 'recruitment_completed' ? 'green' : s === 'unsuccessful' || s === 'withdrawn' ? 'grey' : ['offer_received', 'offer_accepted', 'pre_employment_checks'].includes(s) ? 'gold' : s === 'new_registration' ? 'amber' : 'teal'; }
export const stageBadge = s => badge(STAGE_LABELS[s] || s, stageTone(s));
export function countryBadge(code, status) {
  const tone = { red: 'red', amber: 'amber', green: 'green', unchecked: 'grey' }[status] || 'grey';
  return h('span', { class: 'pt-ctry' }, h('span', { text: country(code) }), badge(status === 'unchecked' ? 'Unchecked' : (status || '—').replace(/^./, c => c.toUpperCase()), tone));
}
export const isAdmin = () => S.me?.role === 'admin';

export function table(cols, rows, { onRow, emptyText = 'Nothing here yet.', emptyIcon = 'inbox' } = {}) {
  if (!rows.length) return empty(emptyIcon, emptyText);
  return h('div', { class: 'pt-table-wrap' }, h('table', { class: 'pt-table' },
    h('thead', null, h('tr', null, cols.map(c => h('th', { scope: 'col', text: c[0] })))),
    h('tbody', null, rows.map(r => {
      const tr = h('tr', { class: onRow ? 'click' : null }, cols.map(c => h('td', null, c[1](r))));
      if (onRow) {
        tr.tabIndex = 0;
        tr.addEventListener('click', e => { if (!e.target.closest('a,button,select,input,label')) onRow(r); });
        tr.addEventListener('keydown', e => { if (e.key === 'Enter') onRow(r); });
      }
      return tr;
    }))));
}
export function tabs(list, current, onChange) {
  return h('div', { class: 'pt-tabs', role: 'tablist' }, list.map(([k, label, count]) =>
    h('button', { type: 'button', role: 'tab', 'aria-selected': String(k === current), onclick: () => onChange(k) }, label, count ? h('span', { class: 'pt-count', text: count }) : null)));
}
export const who = (name, sub) => h('span', { class: 'pt-who' }, h('b', { text: name || '—' }), sub ? h('small', { text: sub }) : null);
export function bars(obj, labels = {}, { limit = 12, tone = '' } = {}) {
  const rows = Object.entries(obj || {}).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, limit);
  if (!rows.length) return empty('chart', 'No data yet.');
  const max = Math.max(...rows.map(r => r[1]));
  return h('div', { class: 'pt-bars ' + tone }, rows.map(([k, v]) => h('div', null, h('span', { text: labels[k] || (k === 'unknown' ? 'Not stated' : /^[A-Z]{2}$/.test(k) ? country(k) : k) }), h('i', null, h('em', { style: { width: Math.max(3, (v / max) * 100) + '%' } })), h('b', { text: v }))));
}
export const kpi = (label, value, { href, tone = '', hint } = {}) => h(href ? 'a' : 'div', { class: 'pt-stat ' + tone, href }, h('small', { text: label }), h('b', { text: value ?? '—' }), hint ? h('span', { class: 'pt-stat-hint', text: hint }) : null);
export const due = d => { if (!d) return null; const late = new Date(d) < Date.now(); return badge((late ? 'Overdue · ' : 'Due ') + fmtDate(d), late ? 'red' : 'grey'); };
export function csvDownload(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  const a = h('a', { href: url, download: name }); document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
}
export const toolbar = (...kids) => h('div', { class: 'pt-filters' }, kids);
export const btn = (label, onclick, cls = 'hc-btn-teal', ic) => h('button', { type: 'button', class: 'hc-btn pt-btn-sm ' + cls, onclick }, ic ? icon(ic, 15) : null, label);
