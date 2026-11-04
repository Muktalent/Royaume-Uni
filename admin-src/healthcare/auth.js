// MUKTalent Healthcare portal · authentication screens (sign in, sign up, reset, profile completion, MFA).
import { S, h, clear, put, icon, t, T, LANGS, setLang, api, field, input, select, textarea, formData, showFieldError, busy, countryOptions, toast } from './core.js';
import { setRememberDevice, rememberDevice } from '../session-store.js';

export const PROF = { registered_nurse: 'Registered Nurse', adult_nurse: 'Adult Nurse', mental_health_nurse: 'Mental Health Nurse', learning_disability_nurse: 'Learning Disability Nurse', physiotherapist: 'Physiotherapist', occupational_therapist: 'Occupational Therapist', radiographer: 'Radiographer', biomedical_scientist: 'Biomedical Scientist', pharmacist: 'Pharmacist', other_ahp: 'Other Allied Health Professional', healthcare_support_worker: 'Healthcare Support Worker', social_care_professional: 'Social Care Professional', other: 'Other healthcare role' };
export const REG = { registered_uk: 'Registered with a UK regulator (NMC, HCPC, GPhC or other)', in_progress_uk: 'UK registration in progress', registered_home: 'Registered in my home country, not yet in the UK', not_started: 'Not registered yet', not_applicable: 'Not applicable to my role' };
export const ENG = { ielts_oet_passed: 'IELTS or OET passed at the required level', test_booked: 'English test booked', preparing: 'Preparing for an English test', native_or_exempt: 'English is my first language or I am exempt', not_sure: 'Not sure' };
export const EMP = { employed: 'Employed', self_employed: 'Self-employed', unemployed: 'Not currently working', studying: 'Studying', other: 'Other' };
export const opts = (map, ph) => [...(ph ? [['', ph]] : []), ...Object.entries(map).map(([k, v]) => [k, T(v)])];

const root = () => document.getElementById('app');

export function langSwitch(onChange) {
  const s = select('lang', LANGS, S.lang, { class: 'pt-lang', 'aria-label': 'Language' });
  s.addEventListener('change', async () => { await setLang(s.value); onChange(); });
  return s;
}

function shell(card, { mode = 'candidate' } = {}) {
  const art = h('aside', { class: 'pt-auth-art' },
    h('a', { class: 'pt-brand', href: '/healthcare/' + (S.lang === 'en' ? '' : '?lang=' + S.lang) },
      h('img', { src: '/healthcare/assets/img/mark-light.svg', alt: '', width: 40, height: 40 }),
      h('span', null, h('b', { text: 'MUKTalent Healthcare' }), h('small', { text: mode === 'team' ? 'Team access' : t('a_k') }))),
    h('div', null,
      h('h1', null, ...splitEm(t('a_h1'))),
      h('p', { text: t('a_p') }),
      h('ul', { class: 'pt-auth-points' }, ['a_pt1', 'a_pt2', 'a_pt3'].map(k => h('li', null, icon('check', 18), h('span', { text: t(k) }))))),
    h('p', { class: 'pt-auth-foot', text: 'MAGHREB UK TALENT LTD · Company no. 16987132 · London' }));
  const main = h('main', { class: 'pt-auth-main', id: 'main' },
    h('div', { class: 'pt-auth-top' },
      h('a', { href: '/healthcare/', class: 'pt-auth-back' }, icon('back', 16), h('span', { text: t('back_site') })),
      langSwitch(() => S.rerenderAuth && S.rerenderAuth())),
    card);
  clear(root(), h('div', { class: 'pt-auth' }, art, main));
}
// Put the last clause of a headline in italics: "Your journey, in one private place." → em on the part after the comma.
function splitEm(s) {
  const i = s.lastIndexOf(',') >= 0 ? s.lastIndexOf(',') : s.lastIndexOf('،');
  if (i < 0) return [s];
  return [s.slice(0, i + 1) + ' ', h('em', { text: s.slice(i + 1).trim() })];
}
const msg = (text, kind = '') => h('p', { class: 'pt-msg ' + kind, role: kind === 'err' ? 'alert' : 'status', text });
const alt = (label, linkText, fn) => h('p', { class: 'pt-auth-alt' }, label + ' ', h('button', { type: 'button', onclick: fn, text: linkText }));

export function signIn(prefill = {}) {
  S.rerenderAuth = () => signIn(prefill);
  const status = h('div');
  const email = input('email', { type: 'email', autocomplete: 'email', required: true, value: prefill.email || '' });
  const pw = input('password', { type: 'password', autocomplete: 'current-password', required: true });
  const rem = h('input', { type: 'checkbox', name: 'remember', checked: rememberDevice() });
  const btn = h('button', { class: 'hc-btn hc-btn-teal pt-btn-block', type: 'submit', text: t('signin_btn') });
  const form = h('form', { novalidate: true },
    h('h2', { text: t('signin_h') }), h('p', { class: 'lead', text: t('signin_p') }), status,
    field(t('email'), email), field(t('password'), pw),
    h('div', { class: 'pt-remember' }, h('label', { class: 'pt-check' }, rem, h('span', { text: t('remember') })),
      h('button', { type: 'button', class: 'pt-link', onclick: () => reset(email.value), text: t('forgot') })),
    btn,
    alt(t('no_account'), t('create_link'), () => signUp({ email: email.value })),
    h('p', { class: 'pt-auth-note' }, icon('lock', 14), h('span', { text: t('team_note') })));
  if (prefill.notice) status.appendChild(msg(prefill.notice, 'ok'));
  form.addEventListener('submit', async e => {
    e.preventDefault(); clear(status);
    if (!email.value || !pw.value) { status.appendChild(msg(t('err_login'), 'err')); return; }
    busy(btn, true);
    setRememberDevice(rem.checked);
    const { error } = await S.sb.auth.signInWithPassword({ email: email.value.trim(), password: pw.value });
    busy(btn, false);
    if (error) { status.appendChild(msg(/confirm/i.test(error.message) ? t('err_confirm') : t('err_login'), 'err')); return; }
    S.start();
  });
  shell(h('div', { class: 'pt-auth-card' }, form));
  (prefill.email ? pw : email).focus();
}

export function signUp(prefill = {}) {
  S.rerenderAuth = () => signUp(prefill);
  const status = h('div');
  const name = input('full_name', { autocomplete: 'name', required: true, value: prefill.name || '' });
  const email = input('email', { type: 'email', autocomplete: 'email', required: true, value: prefill.email || '' });
  const pw = input('password', { type: 'password', autocomplete: 'new-password', minlength: 10, required: true });
  const btn = h('button', { class: 'hc-btn hc-btn-teal pt-btn-block', type: 'submit', text: t('signup_btn') });
  const form = h('form', { novalidate: true },
    h('h2', { text: t('signup_h') }), h('p', { class: 'lead', text: t('signup_p') }), status,
    field(t('full_name'), name), field(t('email'), email), field(t('password'), pw, { hint: t('pw_hint') }),
    btn, alt(t('have_account'), t('signin_link'), () => signIn({ email: email.value })));
  form.addEventListener('submit', async e => {
    e.preventDefault(); clear(status);
    if (name.value.trim().length < 2 || !email.value.includes('@')) { status.appendChild(msg(t('err'), 'err')); return; }
    if (pw.value.length < 10) { status.appendChild(msg(t('err_pw_short'), 'err')); pw.focus(); return; }
    busy(btn, true);
    const { data, error } = await S.sb.auth.signUp({ email: email.value.trim(), password: pw.value, options: { emailRedirectTo: location.origin + '/healthcare/portal/?lang=' + S.lang, data: { full_name: name.value.trim(), division: 'healthcare', preferred_language: S.lang } } });
    busy(btn, false);
    if (error) { status.appendChild(msg(error.message || t('err'), 'err')); return; }
    if (data.session) return S.start();
    clear(form, h('div', { class: 'pt-sent' }, icon('mail', 34), h('h2', { text: t('signup_h') }), msg(t('check_email'), 'ok'),
      h('button', { type: 'button', class: 'hc-btn hc-btn-line pt-btn-block', onclick: () => signIn({ email: email.value }), text: t('back_signin') })));
  });
  shell(h('div', { class: 'pt-auth-card' }, form));
  (prefill.email ? name : email).focus();
}

export function reset(prefillEmail = '') {
  S.rerenderAuth = () => reset(prefillEmail);
  const status = h('div');
  const email = input('email', { type: 'email', autocomplete: 'email', required: true, value: prefillEmail });
  const btn = h('button', { class: 'hc-btn hc-btn-teal pt-btn-block', type: 'submit', text: t('reset_btn') });
  const form = h('form', { novalidate: true }, h('h2', { text: t('reset_h') }), h('p', { class: 'lead', text: t('reset_p') }), status, field(t('email'), email), btn,
    alt('', t('back_signin'), () => signIn({ email: email.value })));
  form.addEventListener('submit', async e => {
    e.preventDefault(); clear(status);
    busy(btn, true);
    await S.sb.auth.resetPasswordForEmail(email.value.trim(), { redirectTo: location.origin + '/healthcare/portal/?lang=' + S.lang });
    busy(btn, false);
    status.appendChild(msg(t('reset_sent'), 'ok'));
  });
  shell(h('div', { class: 'pt-auth-card' }, form));
  email.focus();
}

export function newPassword() {
  S.rerenderAuth = newPassword;
  const status = h('div');
  const pw = input('password', { type: 'password', autocomplete: 'new-password', minlength: 10, required: true });
  const btn = h('button', { class: 'hc-btn hc-btn-teal pt-btn-block', type: 'submit', text: t('newpw_btn') });
  const form = h('form', { novalidate: true }, h('h2', { text: t('newpw_h') }), status, field(t('password'), pw, { hint: t('pw_hint') }), btn);
  form.addEventListener('submit', async e => {
    e.preventDefault(); clear(status);
    if (pw.value.length < 10) { status.appendChild(msg(t('err_pw_short'), 'err')); return; }
    busy(btn, true);
    const { error } = await S.sb.auth.updateUser({ password: pw.value });
    busy(btn, false);
    if (error) { status.appendChild(msg(error.message || t('err'), 'err')); return; }
    toast(t('pw_saved'));
    S.start();
  });
  shell(h('div', { class: 'pt-auth-card' }, form));
  pw.focus();
}

export function unconfirmed() {
  S.rerenderAuth = unconfirmed;
  shell(h('div', { class: 'pt-auth-card' }, h('h2', { text: t('signin_h') }), msg(t('err_confirm'), 'err'),
    h('button', { class: 'hc-btn hc-btn-line pt-btn-block', type: 'button', onclick: () => S.signOut(), text: t('back_signin') })));
}

export function staffNoAccess() {
  S.rerenderAuth = staffNoAccess;
  shell(h('div', { class: 'pt-auth-card' }, h('h2', { text: t('staff_h') }), h('p', { class: 'lead', text: t('staff_p') }),
    h('a', { class: 'hc-btn hc-btn-teal pt-btn-block', href: '/admin/', text: t('to_edu') }),
    h('button', { class: 'hc-btn hc-btn-line pt-btn-block', type: 'button', onclick: () => S.signOut(), text: t('sign_out') })), { mode: 'team' });
}

// Signed-in account with no candidate record yet (e.g. created the account before registering).
export function completeProfile(me) {
  S.rerenderAuth = () => completeProfile(me);
  const status = h('div');
  const v = (n, o = {}) => input(n, o);
  const ctry = select('country_residence', [['', '—'], ...countryOptions()], '', { required: true });
  const nat = select('nationality', [['', T('Prefer not to say')], ...countryOptions()], '');
  const privacy = h('input', { type: 'checkbox', name: 'privacy', required: true });
  const btn = h('button', { class: 'hc-btn hc-btn-teal pt-btn-block', type: 'submit', text: t('cp_btn') });
  const form = h('form', { novalidate: true, class: 'pt-cp' },
    h('h2', { text: t('cp_h') }), h('p', { class: 'lead', text: t('cp_p') }), status,
    h('div', { class: 'pt-fields' },
      field(T('Full Name'), v('full_name', { required: true, autocomplete: 'name', value: me.name || '' }), { full: true }),
      field(T('Telephone Number'), v('phone', { type: 'tel', autocomplete: 'tel', required: true }), { hint: T('Include your country code, for example +212.') }),
      field(T('Country of Residence'), ctry), field(T('Nationality, where relevant'), nat),
      field(T('Healthcare Profession'), select('profession', opts(PROF, '—'), '', { required: true })),
      field(T('Years of Experience'), v('experience_years', { type: 'number', min: 0, max: 60, step: 0.5, inputmode: 'decimal', required: true })),
      field(T('Professional Registration'), select('registration_status', opts(REG, '—'), '', { required: true }), { full: true }),
      field(T('Regulator or registration body'), v('registration_body')), field(T('Registration number'), v('registration_number')),
      field(T('English Language Level'), select('english_level', opts(ENG, '—'), '', { required: true })),
      field(T('Current Employment Status'), select('employment_status', opts(EMP, '—'), '', { required: true })),
      field(T('Preferred UK Location'), v('preferred_location', { required: true }), { full: true }),
      h('label', { class: 'pt-check full' }, h('input', { type: 'checkbox', name: 'right_to_work_uk' }), h('span', { text: T('I already have the right to work in the UK') })),
      field(T('Additional Information'), textarea('additional_info'), { full: true })),
    h('label', { class: 'pt-check' }, privacy, h('span', null, t('cp_privacy') + ' ', h('a', { href: '/healthcare/candidate-privacy/', target: '_blank', rel: 'noopener', text: T('Candidate Privacy Notice') }))),
    h('small', { class: 'err pt-err', dataset: { err: 'privacy' } }),
    h('label', { class: 'pt-check' }, h('input', { type: 'checkbox', name: 'marketing' }), h('span', { text: t('p_marketing') })),
    h('p', { class: 'pt-notice' }, icon('shield', 18), h('span', { text: T('Candidates are not charged recruitment or work-finding fees by MUKTalent Healthcare.') })),
    btn, h('button', { type: 'button', class: 'hc-btn hc-btn-line pt-btn-block', onclick: () => S.signOut(), text: t('sign_out') }));
  form.addEventListener('submit', async e => {
    e.preventDefault(); clear(status);
    const body = formData(form);
    if (!body.privacy) { status.appendChild(msg(t('cp_privacy'), 'err')); return; }
    busy(btn, true);
    try { await api('portal/profile', { method: 'POST', body: { ...body, lang: S.lang } }); S.start(); }
    catch (x) { busy(btn, false); if (!showFieldError(form, x)) status.appendChild(msg(x.message, 'err')); status.scrollIntoView({ block: 'center' }); }
  });
  shell(h('div', { class: 'pt-auth-card wide' }, form));
}

// TOTP two-factor for consultants and administrators.
export async function mfa() {
  S.rerenderAuth = mfa;
  const status = h('div');
  const code = input('code', { inputmode: 'numeric', autocomplete: 'one-time-code', pattern: '[0-9]{6}', maxlength: 6, required: true, class: 'pt-otp' });
  const btn = h('button', { class: 'hc-btn hc-btn-teal pt-btn-block', type: 'submit', text: 'Verify' });
  const body = h('div');
  const form = h('form', { novalidate: true }, h('h2', { text: 'Two-step verification' }), status, body,
    field('6-digit code from your authenticator app', code), btn,
    h('button', { type: 'button', class: 'hc-btn hc-btn-line pt-btn-block', onclick: () => S.signOut(), text: 'Sign out' }));
  shell(h('div', { class: 'pt-auth-card' }, form), { mode: 'team' });
  document.documentElement.lang = 'en';
  let factorId;
  const { data: list } = await S.sb.auth.mfa.listFactors();
  const verified = (list?.totp || []).find(f => f.status === 'verified');
  if (verified) {
    factorId = verified.id;
    body.appendChild(h('p', { class: 'lead', text: 'Healthcare candidate records are protected with a second step. Enter the code shown in your authenticator app.' }));
  } else {
    for (const f of list?.all || []) if (f.factor_type === 'totp' && f.status !== 'verified') await S.sb.auth.mfa.unenroll({ factorId: f.id });
    const { data, error } = await S.sb.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'MUKTalent Healthcare' });
    if (error) { status.appendChild(msg(error.message, 'err')); return; }
    factorId = data.id;
    put(body, 
      h('p', { class: 'lead', text: 'Healthcare Management holds sensitive candidate information, so team accounts need two-step verification. Scan this code with Google Authenticator, Microsoft Authenticator or 1Password, then enter the 6-digit code.' }),
      h('div', { class: 'pt-qr' }, h('img', { src: data.totp.qr_code, alt: 'QR code for your authenticator app', width: 180, height: 180 }), h('small', { text: 'Cannot scan? Enter this key manually:' }), h('code', { text: data.totp.secret })));
  }
  code.focus();
  form.addEventListener('submit', async e => {
    e.preventDefault(); clear(status);
    if (!/^\d{6}$/.test(code.value.trim())) { status.appendChild(msg('Enter the 6-digit code.', 'err')); return; }
    busy(btn, true);
    const { error } = await S.sb.auth.mfa.challengeAndVerify({ factorId, code: code.value.trim() });
    busy(btn, false);
    if (error) { status.appendChild(msg('That code did not work. Check the time on your phone and try again.', 'err')); code.select(); return; }
    await S.sb.auth.refreshSession();
    S.start();
  });
}
