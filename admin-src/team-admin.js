// team-admin-v16 · Sección Equipo del administrador:
// Crear colaborador · Equipo (fotos → vista de su pantalla) · Empleados (editar, visibilidad, eliminar) · Documentos.
import {E, avatar, countryName, COUNTRIES} from './gp-ui.js';
import {combo, putFile, preparePhoto, openViewer, linkHrCss, norm, fmtBytes, fmtWhen} from './hr-common.js';
import {mountEmployee} from './employee.js';

const COUNTRY_CODES = String(COUNTRIES).split(/[\s,]+/).filter(c => /^[A-Z]{2}$/.test(c));
const countryOptions = () => COUNTRY_CODES.map(code => ({value: code, label: countryName(code, 'es'), keys: [countryName(code, 'en'), code]})).sort((a, b) => a.label.localeCompare(b.label, 'es'));
const LANGS = [['Arabic', 'Árabe'], ['Darija (Moroccan Arabic)', 'Darija'], ['Amazigh (Berber)', 'Amazigh'], ['French', 'Francés'], ['English', 'Inglés'], ['Spanish', 'Español'], ['German', 'Alemán'], ['Italian', 'Italiano'], ['Portuguese', 'Portugués'], ['Mandarin Chinese', 'Chino mandarín'], ['Cantonese', 'Cantonés'], ['Japanese', 'Japonés'], ['Korean', 'Coreano'], ['Hindi', 'Hindi'], ['Urdu', 'Urdu'], ['Bengali', 'Bengalí'], ['Punjabi', 'Panyabí'], ['Tamil', 'Tamil'], ['Turkish', 'Turco'], ['Russian', 'Ruso'], ['Ukrainian', 'Ucraniano'], ['Persian (Farsi)', 'Persa'], ['Dutch', 'Neerlandés'], ['Polish', 'Polaco'], ['Romanian', 'Rumano'], ['Greek', 'Griego'], ['Hebrew', 'Hebreo'], ['Swahili', 'Suajili'], ['Wolof', 'Wolof'], ['Hausa', 'Hausa'], ['Yoruba', 'Yoruba'], ['Igbo', 'Igbo'], ['Amharic', 'Amhárico'], ['Somali', 'Somalí'], ['Lingala', 'Lingala'], ['Tagalog (Filipino)', 'Tagalo'], ['Vietnamese', 'Vietnamita'], ['Thai', 'Tailandés'], ['Indonesian', 'Indonesio'], ['Malay', 'Malayo'], ['Catalan', 'Catalán'], ['Basque', 'Euskera'], ['Galician', 'Gallego'], ['Kurdish', 'Kurdo'], ['Pashto', 'Pastún'], ['Nepali', 'Nepalí'], ['Sinhala', 'Cingalés'], ['Uzbek', 'Uzbeko'], ['Kazakh', 'Kazajo'], ['Azerbaijani', 'Azerí']];
const langLabel = v => (LANGS.find(([en]) => norm(en) === norm(v)) || [])[1] || v;
const CURRENCIES = ['MAD', 'EUR', 'GBP', 'USD', 'AED', 'SAR', 'QAR', 'KWD', 'TND', 'DZD', 'EGP', 'XOF', 'XAF', 'NGN', 'KES', 'GHS', 'ZAR', 'INR', 'PKR', 'BDT', 'LKR', 'NPR', 'CNY', 'JPY', 'KRW', 'VND', 'THB', 'IDR', 'MYR', 'PHP', 'TRY', 'CAD', 'AUD', 'CHF', 'BRL', 'MXN', 'COP', 'PEN', 'CLP', 'ARS'];
const currencyName = c => { try { return new Intl.DisplayNames(['es'], {type: 'currency'}).of(c); } catch { return c; } };
const money = (v, c) => v == null ? '—' : new Intl.NumberFormat('es-ES', {maximumFractionDigits: 2}).format(v) + ' ' + c;
const DOC_KINDS = [['contract', 'Contrato'], ['payslip', 'Nómina'], ['policy', 'Política interna'], ['certificate', 'Certificado'], ['other', 'Otro documento']];
const DOC_KIND_ES = {contract: 'Contrato', payslip: 'Nómina', policy: 'Política', certificate: 'Certificado', id_document: 'Identificación', other: 'Documento'};
const STATUS_ES = {sent: ['Enviado · sin abrir', 'grey'], viewed: ['Abierto', 'blue'], signed: ['Firmado', 'green'], submitted: ['Por revisar', 'amber'], approved: ['Aprobado', 'green'], rejected: ['Rechazado', 'red']};

function button(label, onClick, cls = 'th-btn') { const b = E('button', label, cls); b.type = 'button'; if (onClick) b.onclick = onClick; return b; }
function field(labelText, control, {hint = '', wide = false, required = false} = {}) {
  const wrap = E('div', undefined, 'th-field' + (wide ? ' th-wide' : '')), id = control.id || ('thf' + Math.random().toString(36).slice(2, 8));
  const target = control.matches?.('input,select,textarea') ? control : control.querySelector?.('input,select,textarea');
  if (target && !target.id) target.id = id;
  const label = E('label', labelText + (required ? ' *' : '')); if (target) label.htmlFor = target.id;
  wrap.append(label, control); if (hint) wrap.append(E('small', hint, 'th-hint'));
  return wrap;
}
function input(type, value = '', attrs = {}) { const i = E('input'); i.type = type; if (value != null) i.value = value; Object.assign(i, attrs); return i; }
function toggle(labelText, hint, checked) {
  const wrap = E('label', undefined, 'th-toggle'), box = input('checkbox'); box.checked = !!checked;
  const text = E('span'); text.append(E('b', labelText), E('small', hint));
  wrap.append(box, E('i'), text); return {el: wrap, box};
}
function chip(text, tone) { const c = E('span', text, 'th-chip'); c.dataset.tone = tone; return c; }
function sectionCard(title, subtitle) { const c = E('section', undefined, 'th-card'); const h = E('header', undefined, 'th-card-head'); h.append(E('h3', title)); if (subtitle) h.append(E('p', subtitle, 'th-muted')); c.append(h); return c; }
function dobLimits() { const t = new Date(), max = new Date(t.getFullYear() - 16, t.getMonth(), t.getDate()), min = new Date(t.getFullYear() - 100, t.getMonth(), t.getDate()); return {max: max.toISOString().slice(0, 10), min: min.toISOString().slice(0, 10)}; }
function strongPassword() { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%*?'; const b = new Uint32Array(18); crypto.getRandomValues(b); return [...b].map(n => a[n % a.length]).join(''); }

let teamCache = null;
async function loadTeam(api, force = false) { if (!force && teamCache && Date.now() - teamCache.at < 20000) return teamCache.data; const r = await api('/api/admin/team'); teamCache = {at: Date.now(), data: r.data}; return r.data; }
export function invalidateTeam() { teamCache = null; }

// ---------------------------------------------------------------- Formulario (alta y edición)
function profileForm({api, mode, person = {}, onDone, notice}) {
  const isEdit = mode === 'edit', form = E('form', undefined, 'th-form'); form.noValidate = false;
  const f = {};
  // Foto
  let photoFile = null;
  const photoBox = E('div', undefined, 'th-photo'), preview = avatar(person.full_name || '+', person.avatar_url, 'th-photo-img');
  const pick = input('file'); pick.accept = 'image/jpeg,image/png'; pick.hidden = true;
  const pickBtn = button(person.avatar_url ? 'Cambiar foto' : 'Añadir foto', () => pick.click(), 'th-btn');
  const photoNote = E('small', 'JPG o PNG. Se ajusta automáticamente.', 'th-hint');
  pick.onchange = async () => {
    const file = pick.files?.[0]; if (!file) return;
    try { photoFile = await preparePhoto(file); const url = URL.createObjectURL(photoFile); preview.replaceChildren(); const img = E('img'); img.alt = ''; img.src = url; preview.append(img); preview.classList.add('has-img'); photoNote.textContent = 'Foto lista: se guardará al ' + (isEdit ? 'guardar los cambios.' : 'crear el colaborador.'); photoNote.className = 'th-hint th-ok'; }
    catch (e) { photoFile = null; photoNote.textContent = e.message; photoNote.className = 'th-hint th-error'; }
  };
  const photoText = E('div'); photoText.append(E('b', 'Foto del colaborador'), photoNote, pickBtn);
  photoBox.append(preview, photoText, pick);

  // Identidad
  f.full_name = input('text', person.full_name || '', {required: true, maxLength: 200, autocomplete: 'off'});
  f.job_title = input('text', person.job_title || 'Student counsellor', {required: true, maxLength: 200});
  f.country = input('text', person.country_code ? countryName(person.country_code, 'es') : '', {placeholder: 'Escribe las primeras letras…'});
  let countryCode = person.country_code || '';
  const countryCombo = combo({input: f.country, options: countryOptions, label: 'Países', onPick: o => { countryCode = o.value; f.country.value = o.label; f.country.setCustomValidity(''); }});
  f.country.addEventListener('input', () => { countryCode = ''; });
  f.country.addEventListener('blur', () => setTimeout(() => {
    const v = norm(f.country.value); if (!v) { countryCode = ''; f.country.setCustomValidity(''); return; }
    if (!countryCode) { const exact = countryOptions().find(o => norm(o.label) === v || o.keys.some(k => norm(k) === v)); if (exact) { countryCode = exact.value; f.country.value = exact.label; } }
    f.country.setCustomValidity(countryCode ? '' : 'Elige un país de la lista.');
  }, 150));
  f.assigned_city = input('text', person.assigned_city || '', {maxLength: 200, placeholder: 'Ciudad o territorio asignado'});
  const lim = dobLimits();
  f.date_of_birth = input('date', person.date_of_birth || '', {min: lim.min, max: lim.max});
  // Idiomas (varios)
  let langs = [...(person.languages || [])];
  const langBox = E('div', undefined, 'th-chips-input'), chips = E('div', undefined, 'th-chips'), langInput = input('text', '', {placeholder: langs.length ? 'Añadir otro idioma…' : 'Escribe un idioma…', maxLength: 40});
  const paintLangs = () => {
    chips.replaceChildren();
    for (const l of langs) { const c = E('span', undefined, 'th-chip th-chip-x'); c.dataset.tone = 'ink'; c.append(E('span', langLabel(l))); const x = button('×', () => { langs = langs.filter(v => v !== l); paintLangs(); }, 'th-chip-del'); x.setAttribute('aria-label', 'Quitar ' + langLabel(l)); c.append(x); chips.append(c); }
    langInput.placeholder = langs.length ? 'Añadir otro idioma…' : 'Escribe un idioma…';
  };
  const addLang = v => { const value = String(v || '').trim(); if (!value) return; if (langs.some(x => norm(x) === norm(value))) { langInput.value = ''; return; } if (langs.length >= 12 || [...langs, value].join(', ').length > 200) { notice('Máximo 12 idiomas.', true); return; } langs.push(value); langInput.value = ''; paintLangs(); };
  const langCombo = combo({input: langInput, label: 'Idiomas', options: () => LANGS.filter(([en]) => !langs.some(x => norm(x) === norm(en))).map(([en, es]) => ({value: en, label: es, hint: es === en ? '' : en, keys: [en]})), onPick: o => addLang(o.value)});
  langInput.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ',') && langInput.value.trim()) { e.preventDefault(); const q = norm(langInput.value); const known = LANGS.find(([en, es]) => norm(en) === q || norm(es) === q); addLang(known ? known[0] : langInput.value.trim().replace(/^./, c => c.toUpperCase())); langCombo.close(); } else if (e.key === 'Backspace' && !langInput.value && langs.length) { langs.pop(); paintLangs(); } });
  langBox.append(chips, langCombo.wrap); paintLangs();

  // Acceso (solo alta)
  if (!isEdit) {
    f.email = input('email', '', {required: true, maxLength: 320, autocomplete: 'off', placeholder: 'nombre@muktalent.com'});
    f.password = input('text', strongPassword(), {required: true, minLength: 14, maxLength: 128, autocomplete: 'new-password'});
    f.password.spellcheck = false;
  }
  // Contacto
  f.contact_phone = input('tel', person.contact_phone || '', {maxLength: 100, placeholder: '+212 6…'});
  f.contact_email = input('email', person.contact_email || '', {maxLength: 320});
  const publish = toggle('Mostrar este contacto en su tarjeta', 'Teléfono y email visibles en la tarjeta pública.', person.publish_contact);
  f.public_bio = E('textarea'); f.public_bio.maxLength = 2000; f.public_bio.rows = 3; f.public_bio.value = person.public_bio || ''; f.public_bio.placeholder = 'Breve presentación que verán los estudiantes en su tarjeta.';
  // Salario
  f.base_salary = input('number', person.base_salary ?? '', {min: 0, max: 10000000, step: '0.01', placeholder: 'Ej. 3000'});
  f.commission_rate = input('number', person.commission_rate ?? '', {min: 0, max: 1000000, step: '0.01', placeholder: 'Ej. 2000'});
  f.currency = E('select'); for (const c of CURRENCIES) f.currency.append(new Option(c + ' · ' + currencyName(c), c)); f.currency.value = person.currency || 'MAD';
  // Estado
  const active = toggle('Activo', 'Activa su tarjeta digital, el código QR y el pase de wallet.', isEdit ? person.active : true);
  const web = toggle('Visible en la web', 'Aparece en la sección de equipo de muktalent.com (si además está activo).', isEdit ? person.web_visible : true);
  const access = isEdit ? toggle('Acceso a la plataforma', 'Puede iniciar sesión en su espacio de trabajo.', person.account_active) : null;

  const c1 = sectionCard('Datos personales', 'Ficha del colaborador. Los campos con * son obligatorios.');
  const g1 = E('div', undefined, 'th-grid');
  g1.append(field('Nombre completo', f.full_name, {required: true}), field('Puesto', f.job_title, {required: true}), field('País', countryCombo.wrap, {hint: 'Escribe las primeras letras y elige de la lista.'}), field('Ciudad / territorio', f.assigned_city), field('Fecha de nacimiento', f.date_of_birth, {hint: 'Selecciónala en el calendario.'}), field('Idiomas', langBox, {hint: 'Puedes añadir varios. Pulsa Intro para añadir uno que no esté en la lista.'}));
  c1.append(photoBox, g1);
  const cards = [c1];
  if (!isEdit) {
    const c2 = sectionCard('Acceso a la plataforma', 'Con este email y contraseña entrará en su espacio. Deberá cambiar la contraseña la primera vez.');
    const g2 = E('div', undefined, 'th-grid'), pw = E('div', undefined, 'th-inline');
    const regen = button('Generar otra', () => { f.password.value = strongPassword(); });
    const copy = button('Copiar', async () => { try { await navigator.clipboard.writeText(f.password.value); copy.textContent = 'Copiada'; setTimeout(() => { copy.textContent = 'Copiar'; }, 1500); } catch { f.password.select(); } });
    pw.append(f.password, regen, copy);
    g2.append(field('Email de acceso', f.email, {required: true}), field('Contraseña inicial', pw, {required: true, hint: 'Mínimo 14 caracteres. Compártela por un canal seguro.'}));
    c2.append(g2); cards.push(c2);
  }
  const c3 = sectionCard('Contacto de trabajo y presentación');
  const g3 = E('div', undefined, 'th-grid');
  g3.append(field('Teléfono de trabajo', f.contact_phone), field('Email de contacto', f.contact_email), field('Presentación pública', f.public_bio, {wide: true}));
  c3.append(g3, publish.el); cards.push(c3);
  const c4 = sectionCard('Salario', 'Se usa en su nómina y en la vista de nóminas del equipo.');
  const g4 = E('div', undefined, 'th-grid th-grid-3');
  g4.append(field('Salario base mensual', f.base_salary, {hint: 'Vacío = 3.000 MAD por defecto.'}), field('Comisión por lead verificado', f.commission_rate, {hint: 'Vacío = 2.000 MAD por defecto.'}), field('Moneda', f.currency));
  c4.append(g4); cards.push(c4);
  const c5 = sectionCard('Estado');
  c5.append(active.el, web.el); if (access) c5.append(access.el); cards.push(c5);

  const msg = E('p', '', 'th-msg'); msg.setAttribute('role', 'status');
  const save = E('button', isEdit ? 'Guardar cambios' : 'Crear colaborador', 'th-btn th-primary'); save.type = 'submit';
  const bar = E('div', undefined, 'th-form-bar'); bar.append(msg, save);
  form.append(...cards, bar);

  const fieldMap = {full_name: f.full_name, job_title: f.job_title, country_code: f.country, assigned_city: f.assigned_city, date_of_birth: f.date_of_birth, languages: langInput, email: f.email, password: f.password, contact_phone: f.contact_phone, contact_email: f.contact_email, public_bio: f.public_bio, base_salary: f.base_salary, commission_rate: f.commission_rate, currency: f.currency};
  let busy = false;
  form.onsubmit = async e => {
    e.preventDefault(); if (busy) return;
    if (langInput.value.trim()) { const q = norm(langInput.value); const known = LANGS.find(([en, es]) => norm(en) === q || norm(es) === q); addLang(known ? known[0] : langInput.value.trim()); }
    for (const el of Object.values(fieldMap)) el?.removeAttribute?.('aria-invalid');
    if (f.country.value && !countryCode) { const exact = countryOptions().find(o => norm(o.label) === norm(f.country.value)); if (exact) countryCode = exact.value; else { f.country.setCustomValidity('Elige un país de la lista.'); } }
    if (!form.reportValidity()) return;
    const num = el => el.value === '' ? null : Number(el.value);
    const v = {full_name: f.full_name.value.trim(), job_title: f.job_title.value.trim(), country_code: countryCode, assigned_city: f.assigned_city.value.trim(), languages: langs, date_of_birth: f.date_of_birth.value, contact_phone: f.contact_phone.value.trim(), contact_email: f.contact_email.value.trim(), publish_contact: publish.box.checked, public_bio: f.public_bio.value.trim(), base_salary: num(f.base_salary), commission_rate: num(f.commission_rate), currency: f.currency.value, active: active.box.checked, web_visible: web.box.checked};
    if (!isEdit) { v.email = f.email.value.trim(); v.password = f.password.value; }
    if (access) v.account_active = access.box.checked;
    busy = true; save.disabled = true; msg.className = 'th-msg'; msg.textContent = isEdit ? 'Guardando…' : 'Creando la cuenta…';
    let id = person.user_id, warning = '';
    try {
      if (isEdit) await api('/api/admin/team/' + id, {method: 'PATCH', body: JSON.stringify(v)});
      else { const r = await api('/api/admin/team', {method: 'POST', body: JSON.stringify(v)}); id = r.user_id; warning = r.warning || ''; }
      if (photoFile && id) {
        msg.textContent = 'Subiendo la foto…';
        try { const started = await api('/api/admin/team/' + id + '/photo/start', {method: 'POST', body: JSON.stringify({name: photoFile.name, mime: photoFile.type, bytes: photoFile.size})}); await putFile(started, photoFile); await api('/api/admin/team/' + id + '/photo/finish', {method: 'POST', body: JSON.stringify({id: started.id})}); photoFile = null; }
        catch (err) { warning = (warning ? warning + ' ' : '') + 'La foto no se pudo subir: ' + err.message; }
      }
      invalidateTeam();
      msg.className = warning ? 'th-msg th-error' : 'th-msg th-ok';
      msg.textContent = warning || (isEdit ? 'Cambios guardados.' : 'Colaborador creado.');
      onDone?.({id, values: v, warning, password: v.password});
    } catch (err) {
      msg.className = 'th-msg th-error'; msg.textContent = err.message;
      for (const k of err.fields || []) fieldMap[k.split('.')[0]]?.setAttribute('aria-invalid', 'true');
    } finally { busy = false; save.disabled = false; }
  };
  return form;
}

// ---------------------------------------------------------------- Pestañas
function createTab({host, api, notice, navigate}) {
  const wrap = E('div', undefined, 'th-narrow');
  const render = () => {
    wrap.replaceChildren(profileForm({api, mode: 'create', notice, onDone: ({id, values, warning}) => {
      const done = E('section', undefined, 'th-card th-success');
      done.append(E('h3', warning ? 'Colaborador creado con avisos' : 'Colaborador creado'), E('p', `${values.full_name} ya puede entrar con ${values.email}. Comparte la contraseña inicial por un canal seguro; deberá cambiarla al entrar.`));
      if (warning) done.append(E('p', warning, 'th-error'));
      const pw = E('p', undefined, 'th-mono'); pw.append(E('span', 'Contraseña inicial: '), E('code', values.password)); done.append(pw);
      const row = E('div', undefined, 'th-inline');
      row.append(button('Ver en la lista de empleados', () => navigate('team-list'), 'th-btn th-primary'), button('Enviarle un contrato', () => { sessionStorage.setItem('th-doc-owner', id); navigate('team-docs'); }), button('Crear otro colaborador', render));
      done.append(row); wrap.replaceChildren(done); window.scrollTo({top: 0, behavior: 'smooth'});
    }}));
  };
  render(); host.append(wrap);
}

async function openWorkspace(api, person) {
  document.getElementById('appShell').hidden = true;
  await mountEmployee({staff: {user_id: person.user_id, full_name: person.full_name, role: person.role, active: person.account_active}, api, owner: person.user_id, onBack: () => { document.getElementById('appShell').hidden = false; }});
}

async function peopleTab({host, api}) {
  const intro = E('p', 'Toca una foto para ver su pantalla en modo lectura, tal y como la ve el empleado.', 'th-muted');
  const grid = E('div', undefined, 'th-gallery'); grid.setAttribute('aria-busy', 'true');
  host.append(intro, grid);
  for (let i = 0; i < 8; i++) grid.append(E('div', undefined, 'th-person th-skeleton'));
  const team = await loadTeam(api, true);
  grid.replaceChildren(); grid.removeAttribute('aria-busy');
  if (!team.length) { grid.append(E('p', 'Todavía no hay colaboradores.', 'th-muted')); return; }
  for (const p of team) {
    const card = E('button', undefined, 'th-person'); card.type = 'button'; card.setAttribute('aria-label', 'Ver la pantalla de ' + p.full_name);
    const photo = avatar(p.full_name, p.avatar_url, 'th-person-photo');
    const dots = E('span', undefined, 'th-person-dots');
    if (!p.account_active) dots.append(chip('Sin acceso', 'red')); else if (!p.active) dots.append(chip('Inactivo', 'grey'));
    else dots.append(chip('Activo', 'green'));
    if (p.docs_attention) dots.append(chip(p.docs_attention + ' doc.', 'amber'));
    card.append(photo, E('strong', p.full_name), E('small', p.job_title || (p.role === 'admin' ? 'Administración' : 'Colaborador')), dots);
    card.onclick = () => openWorkspace(api, p);
    grid.append(card);
  }
}

async function listTab({host, api, notice, navigate}) {
  const tools = E('div', undefined, 'th-tools'), q = input('search', '', {placeholder: 'Buscar por nombre, puesto, país o idioma…'}); q.setAttribute('aria-label', 'Buscar empleados');
  const filter = E('select'); filter.setAttribute('aria-label', 'Filtrar');
  for (const [v, l] of [['', 'Todos'], ['active', 'Activos (tarjeta y QR)'], ['inactive', 'Inactivos'], ['hidden', 'Ocultos en la web'], ['docs', 'Con documentos pendientes']]) filter.append(new Option(l, v));
  const add = button('Crear colaborador', () => navigate('team-create'), 'th-btn th-primary');
  tools.append(q, filter, add);
  const list = E('div', undefined, 'th-list'); list.setAttribute('aria-live', 'polite');
  host.append(tools, list);
  let team = [];
  const paint = () => {
    const term = norm(q.value), mode = filter.value;
    const rows = team.filter(p => (!term || norm([p.full_name, p.job_title, p.employee_code, countryName(p.country_code || 'ZZ', 'es'), p.assigned_city, ...p.languages.map(langLabel), p.login_email].join(' ')).includes(term)) && (!mode || (mode === 'active' && p.active) || (mode === 'inactive' && !p.active) || (mode === 'hidden' && !p.web_visible) || (mode === 'docs' && p.docs_attention)));
    list.replaceChildren();
    const head = E('div', undefined, 'th-row th-row-head'); for (const h of ['Empleado', 'País · idiomas', 'Salario', 'Estado', '']) head.append(E('span', h)); list.append(head);
    if (!rows.length) list.append(E('p', 'No hay empleados con este filtro.', 'th-muted th-pad'));
    for (const p of rows) {
      const row = E('button', undefined, 'th-row'); row.type = 'button'; row.setAttribute('aria-label', 'Abrir ficha de ' + p.full_name);
      const who = E('span', undefined, 'th-who'); const names = E('span'); names.append(E('b', p.full_name), E('small', [p.job_title, p.employee_code].filter(Boolean).join(' · ')));
      who.append(avatar(p.full_name, p.avatar_url, 'th-avatar-sm'), names);
      const where = E('span', undefined, 'th-cell'); where.append(E('span', p.country_code ? countryName(p.country_code, 'es') : '—'), E('small', p.languages.map(langLabel).join(', ') || 'Sin idiomas'));
      const pay = E('span', undefined, 'th-cell'); pay.append(E('span', p.base_salary == null ? 'Por defecto' : money(p.base_salary, p.currency)), E('small', p.commission_rate == null ? '' : '+ ' + money(p.commission_rate, p.currency) + ' / lead'));
      const st = E('span', undefined, 'th-states');
      st.append(p.active ? chip('Activo', 'green') : chip('Inactivo', 'grey'), p.web_visible ? chip('Web', 'blue') : chip('Oculto en web', 'grey'));
      if (!p.account_active) st.append(chip('Sin acceso', 'red'));
      if (p.docs_attention) st.append(chip(p.docs_attention + ' doc. por revisar', 'amber'));
      if (p.role === 'admin') st.append(chip('Admin', 'ink'));
      row.append(who, where, pay, st, E('span', '›', 'th-chev'));
      row.onclick = () => openEditor({api, person: p, notice, navigate, onChange: async () => { team = await loadTeam(api, true); paint(); }});
      list.append(row);
    }
  };
  q.oninput = paint; filter.onchange = paint;
  list.append(E('p', 'Cargando empleados…', 'th-muted th-pad'));
  team = await loadTeam(api, true); paint();
}

function openEditor({api, person, notice, navigate, onChange}) {
  linkHrCss();
  const dialog = E('dialog', undefined, 'th-drawer'); dialog.lang = 'es';
  const head = E('header', undefined, 'th-drawer-head'), who = E('div', undefined, 'th-who');
  const names = E('div'); names.append(E('h2', person.full_name), E('p', [person.employee_code, person.login_email].filter(Boolean).join(' · '), 'th-muted'));
  who.append(avatar(person.full_name, person.avatar_url, 'th-avatar-md'), names);
  const close = button('Cerrar', () => dialog.close()); head.append(who, close);
  const quick = E('div', undefined, 'th-inline th-quick');
  quick.append(button('Ver su pantalla', () => { dialog.close(); openWorkspace(api, person); }), button('Documentos' + (person.docs_attention ? ` (${person.docs_attention})` : ''), () => { dialog.close(); sessionStorage.setItem('th-doc-owner', person.user_id); navigate('team-docs'); }));
  const idDoc = E('span'); quick.append(idDoc);
  api('/api/team-directory?owner=' + encodeURIComponent(person.user_id)).then(r => { const d = r.data; for (const item of d.documents || []) if (item.url) { const a = E('a', 'Documento de identidad', 'th-btn'); a.href = item.url; a.rel = 'noopener noreferrer'; a.target = '_blank'; idDoc.replaceWith(a); break; } }).catch(() => {});
  const body = E('div', undefined, 'th-drawer-body');
  body.append(quick, profileForm({api, mode: 'edit', person, notice, onDone: () => onChange?.()}));
  if (person.role !== 'admin') {
    const danger = sectionCard('Eliminar perfil', 'Bloquea su acceso, desactiva tarjeta, QR y wallet y lo oculta de la web. Su historial (expedientes, notas, citas) se conserva.');
    danger.classList.add('th-danger');
    danger.append(button('Eliminar perfil…', () => confirmRemove({api, person, dialog, onChange}), 'th-btn th-danger-btn'));
    body.append(danger);
  }
  dialog.append(head, body); document.body.append(dialog);
  dialog.onclose = () => dialog.remove();
  dialog.showModal();
}

async function confirmRemove({api, person, dialog: parent, onChange}) {
  const dialog = E('dialog', undefined, 'th-confirm'); dialog.lang = 'es';
  const body = E('form', undefined, 'th-form'); body.method = 'dialog';
  body.append(E('h2', 'Eliminar a ' + person.full_name), E('p', 'Comprobando qué tiene asignado…', 'th-muted'));
  dialog.append(body); document.body.append(dialog); dialog.onclose = () => dialog.remove(); dialog.showModal();
  let impact = {leads: 0, enquiries: 0, students: 0, appointments: 0}, team = [];
  try { [impact, team] = await Promise.all([api('/api/admin/team/' + person.user_id + '/impact').then(r => r.data), loadTeam(api)]); } catch (e) { body.lastChild.textContent = e.message; }
  const pending = impact.leads + impact.enquiries + impact.students;
  body.lastChild.remove();
  const ul = E('ul', undefined, 'th-impact');
  for (const [n, l] of [[impact.leads, 'leads y casos abiertos'], [impact.enquiries, 'consultas abiertas'], [impact.students, 'estudiantes de Global Passport'], [impact.appointments, 'citas futuras confirmadas (no se mueven)']]) ul.append(E('li', `${n} ${l}`));
  body.append(ul);
  const target = E('select'); target.append(new Option(pending ? 'Elige a quién reasignar…' : 'No hace falta reasignar', ''));
  for (const p of team.filter(p => p.user_id !== person.user_id && p.account_active)) target.append(new Option(p.full_name, p.user_id));
  target.required = pending > 0;
  if (pending) body.append(field('Reasignar sus leads, consultas y estudiantes a', target, {required: true}));
  const confirmName = input('text', '', {required: true, placeholder: person.full_name, autocomplete: 'off'});
  body.append(field('Escribe su nombre completo para confirmar', confirmName, {required: true}));
  const msg = E('p', '', 'th-msg'), row = E('div', undefined, 'th-inline th-end');
  const cancel = button('Cancelar', () => dialog.close()), go = E('button', 'Eliminar perfil definitivamente', 'th-btn th-danger-btn'); go.type = 'submit';
  row.append(cancel, go); body.append(msg, row);
  body.onsubmit = async e => {
    e.preventDefault(); if (!body.reportValidity()) return;
    if (norm(confirmName.value) !== norm(person.full_name)) { msg.className = 'th-msg th-error'; msg.textContent = 'El nombre no coincide.'; return; }
    go.disabled = true; msg.className = 'th-msg'; msg.textContent = 'Eliminando…';
    try { await api('/api/admin/team/' + person.user_id, {method: 'DELETE', body: JSON.stringify({reassign_to: target.value || null, confirm_name: confirmName.value.trim()})}); invalidateTeam(); dialog.close(); parent.close(); onChange?.(); }
    catch (err) { msg.className = 'th-msg th-error'; msg.textContent = err.message; go.disabled = false; }
  };
}

// ---------------------------------------------------------------- Documentos
async function docsTab({host, api, notice}) {
  const counters = E('div', undefined, 'th-counters');
  const send = sectionCard('Enviar un documento', 'Contratos (para firmar en la plataforma), nóminas, políticas u otros. El empleado lo verá en su sección Documentos.');
  const list = sectionCard('Documentos del equipo');
  host.append(counters, send, list);
  const team = (await loadTeam(api)).filter(p => p.account_active);
  // Formulario de envío
  const form = E('form', undefined, 'th-grid'), owner = E('select'), kind = E('select'), title = input('text', '', {required: true, maxLength: 200, placeholder: 'Ej. Contrato de colaboración 2027'}), note = E('textarea'), file = input('file');
  owner.required = true; owner.append(new Option('Elige un empleado…', '')); for (const p of team) owner.append(new Option(p.full_name, p.user_id));
  const preset = sessionStorage.getItem('th-doc-owner'); if (preset) { owner.value = preset; sessionStorage.removeItem('th-doc-owner'); }
  for (const [v, l] of DOC_KINDS) kind.append(new Option(l, v));
  note.maxLength = 2000; note.rows = 2; note.placeholder = 'Mensaje opcional para el empleado';
  file.accept = 'application/pdf,image/jpeg,image/png'; file.required = true;
  const sign = toggle('Requiere firma', 'El empleado podrá leerlo y firmarlo aquí mismo (dibujando su firma o escribiendo su nombre). Solo PDF.', true);
  const syncKind = () => { if (kind.value === 'contract') { sign.box.checked = true; sign.box.disabled = true; } else sign.box.disabled = false; if (!title.value || title.dataset.auto) { title.value = kind.value === 'contract' ? 'Contrato' : ''; title.dataset.auto = '1'; } };
  title.oninput = () => { delete title.dataset.auto; };
  kind.onchange = syncKind; syncKind();
  const msg = E('p', '', 'th-msg'), go = E('button', 'Enviar documento', 'th-btn th-primary'); go.type = 'submit';
  const bar = E('div', undefined, 'th-form-bar th-wide'); bar.append(msg, go);
  form.append(field('Empleado', owner, {required: true}), field('Tipo', kind), field('Título', title, {required: true}), field('Archivo', file, {required: true, hint: 'PDF, JPG o PNG · máx. 10 MB'}), field('Mensaje', note, {wide: true}));
  const signWrap = E('div', undefined, 'th-wide'); signWrap.append(sign.el); form.append(signWrap, bar);
  send.append(form);
  form.onsubmit = async e => {
    e.preventDefault(); if (!form.reportValidity()) return;
    const f = file.files?.[0]; if (!f) return;
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(f.type)) { msg.className = 'th-msg th-error'; msg.textContent = 'Usa PDF, JPG o PNG.'; return; }
    if (f.size > 10 * 1024 * 1024) { msg.className = 'th-msg th-error'; msg.textContent = 'El archivo supera 10 MB.'; return; }
    if (sign.box.checked && f.type !== 'application/pdf') { msg.className = 'th-msg th-error'; msg.textContent = 'Para pedir firma, el archivo debe ser PDF.'; return; }
    go.disabled = true; msg.className = 'th-msg'; msg.textContent = 'Subiendo…';
    try {
      const started = await api('/api/admin/hr-docs/start', {method: 'POST', body: JSON.stringify({owner_id: owner.value, kind: kind.value, title: title.value.trim(), note: note.value.trim(), name: f.name.slice(0, 200), mime: f.type, bytes: f.size, requires_signature: sign.box.checked})});
      await putFile(started, f);
      await api('/api/admin/hr-docs/finish', {method: 'POST', body: JSON.stringify({id: started.id})});
      msg.className = 'th-msg th-ok'; msg.textContent = 'Enviado a ' + owner.selectedOptions[0].textContent + '.';
      form.reset(); syncKind(); refreshDocBadge(api); await paintList();
    } catch (err) { msg.className = 'th-msg th-error'; msg.textContent = err.message; }
    finally { go.disabled = false; }
  };
  // Lista
  const tools = E('div', undefined, 'th-tools'), filt = E('div', undefined, 'th-seg'), who = E('select');
  who.append(new Option('Todo el equipo', '')); for (const p of team) who.append(new Option(p.full_name, p.user_id));
  if (preset) who.value = preset;
  let mode = 'attention', docs = [];
  const modes = [['attention', 'Requieren mi atención'], ['pending', 'Pendientes de firma'], ['received', 'Recibidos'], ['sent', 'Enviados'], ['all', 'Todo']];
  for (const [id, l] of modes) { const b = button(l, () => { mode = id; paintRows(); }, 'th-seg-btn'); b.dataset.mode = id; filt.append(b); }
  who.onchange = () => paintRows();
  tools.append(filt, who);
  const rowsBox = E('div', undefined, 'th-doc-list');
  list.append(tools, rowsBox);
  function paintCounters() {
    const n = {review: docs.filter(d => d.direction === 'from_employee' && d.status === 'submitted').length, signed: docs.filter(d => d.status === 'signed' && d.needs_admin).length, pending: docs.filter(d => d.requires_signature && ['sent', 'viewed'].includes(d.status)).length};
    counters.replaceChildren();
    for (const [v, l, tone, m] of [[n.review, 'Por revisar', 'amber', 'attention'], [n.signed, 'Firmados nuevos', 'green', 'attention'], [n.pending, 'Esperando firma', 'blue', 'pending']]) { const c = E('button', undefined, 'th-counter'); c.type = 'button'; c.dataset.tone = tone; c.append(E('strong', v), E('span', l)); c.onclick = () => { mode = m; paintRows(); }; counters.append(c); }
  }
  function paintRows() {
    for (const b of filt.children) b.setAttribute('aria-pressed', String(b.dataset.mode === mode));
    const rows = docs.filter(d => (!who.value || d.owner_id === who.value) && (mode === 'all' || (mode === 'attention' && d.needs_admin) || (mode === 'pending' && d.requires_signature && ['sent', 'viewed'].includes(d.status)) || (mode === 'received' && d.direction === 'from_employee') || (mode === 'sent' && d.direction === 'to_employee')));
    rowsBox.replaceChildren();
    if (!rows.length) rowsBox.append(E('p', mode === 'attention' ? 'Nada pendiente. Los documentos nuevos y firmados aparecerán aquí.' : 'No hay documentos con este filtro.', 'th-muted th-pad'));
    for (const d of rows) {
      const row = E('article', undefined, 'th-doc' + (d.needs_admin ? ' is-new' : ''));
      const icon = E('span', d.direction === 'from_employee' ? '↓' : '↑', 'th-doc-dir'); icon.title = d.direction === 'from_employee' ? 'Recibido del empleado' : 'Enviado al empleado';
      const main = E('div', undefined, 'th-doc-main');
      main.append(E('b', d.title), E('small', [DOC_KIND_ES[d.kind] || 'Documento', d.owner_name, fmtWhen(d.created_at), fmtBytes(d.bytes)].join(' · ')));
      if (d.note) main.append(E('small', '“' + d.note + '”', 'th-doc-note'));
      if (d.status === 'signed') main.append(E('small', `Firmado por ${d.signer_name} · ${fmtWhen(d.signed_at)} · ${d.signature_method === 'drawn' ? 'firma dibujada' : 'nombre escrito'}`, 'th-ok'));
      if (d.review_note) main.append(E('small', 'Nota: ' + d.review_note, 'th-muted'));
      const [label, tone] = STATUS_ES[d.status] || [d.status, 'grey'];
      const st = E('div', undefined, 'th-doc-state'); st.append(chip(label, tone)); if (d.requires_signature && d.status !== 'signed') st.append(chip('Requiere firma', 'ink'));
      const acts = E('div', undefined, 'th-doc-actions');
      const view = variant => openViewer({title: d.title, subtitle: d.owner_name + ' · ' + (DOC_KIND_ES[d.kind] || ''), load: () => api('/api/admin/hr-docs/' + d.id + '/file' + (variant ? '?variant=' + variant : '')), actions: d.direction === 'from_employee' && d.status === 'submitted' ? [dlg => reviewBar(dlg, d)] : []}).then(dlg => dlg.addEventListener('close', () => { if (d.status === 'signed' && d.needs_admin) { d.needs_admin = false; paintCounters(); paintRows(); refreshDocBadge(api); } }));
      if (d.status === 'signed') acts.append(button('Ver firmado', () => view('signed'), 'th-btn th-primary'), button('Original', () => view()));
      else acts.append(button('Ver', () => view(), d.needs_admin ? 'th-btn th-primary' : 'th-btn'));
      if (d.direction === 'to_employee' && d.status !== 'signed') acts.append(button('Retirar', async () => { if (!confirm('¿Retirar este documento? El empleado dejará de verlo.')) return; try { await api('/api/admin/hr-docs/' + d.id, {method: 'DELETE'}); await paintList(); } catch (e) { notice(e.message, true); } }, 'th-btn th-ghost'));
      row.append(icon, main, st, acts); rowsBox.append(row);
    }
  }
  function reviewBar(dlg, d) {
    const bar = E('div', undefined, 'th-inline th-end'), noteIn = input('text', '', {maxLength: 1000, placeholder: 'Nota para el empleado (opcional)'});
    const decide = async decision => { try { await api('/api/admin/hr-docs/' + d.id + '/review', {method: 'POST', body: JSON.stringify({decision, note: noteIn.value.trim()})}); dlg.close(); refreshDocBadge(api); await paintList(); } catch (e) { notice(e.message, true); } };
    bar.append(noteIn, button('Rechazar', () => decide('rejected'), 'th-btn th-danger-btn'), button('Aprobar', () => decide('approved'), 'th-btn th-primary'));
    return bar;
  }
  async function paintList() {
    try { docs = (await api('/api/admin/hr-docs')).data; } catch (e) { rowsBox.replaceChildren(E('p', e.message, 'th-error th-pad')); return; }
    if (preset && !docs.some(d => d.owner_id === preset && d.needs_admin)) mode = 'all';
    paintCounters(); paintRows();
  }
  rowsBox.append(E('p', 'Cargando documentos…', 'th-muted th-pad'));
  await paintList();
}

// ---------------------------------------------------------------- Aviso de documentos (menú lateral y pestaña)
let lastAttention = 0;
export async function refreshDocBadge(api) {
  try { const r = await api('/api/admin/hr-docs/summary'); lastAttention = r.data.attention || 0; } catch { return; }
  for (const b of document.querySelectorAll('#navigation .nav-button[data-group=team],#adminDock .dock-button[data-group=team]')) {
    let dot = b.querySelector('.th-nav-badge'); if (!dot) { dot = E('i', undefined, 'th-nav-badge'); b.append(dot); }
    dot.textContent = lastAttention > 99 ? '99+' : String(lastAttention); dot.hidden = !lastAttention;
    b.title = lastAttention ? `${lastAttention} documento(s) por revisar` : '';
  }
  paintTabBadge();
}
export function paintTabBadge() {
  for (const t of document.querySelectorAll('#adminTabs .admin-tab')) if (/^Documentos/.test(t.textContent)) t.textContent = 'Documentos' + (lastAttention ? ` (${lastAttention})` : '');
}
export function mountTeamBadge({api, getState}) {
  let timer = null;
  const tick = () => { const s = getState(); if (s.staff?.role === 'admin' && s.session) refreshDocBadge(api); };
  const start = () => { if (timer) return; tick(); timer = setInterval(() => { if (!document.hidden) tick(); }, 90000); };
  const obs = new MutationObserver(() => { if (document.querySelector('#navigation .nav-button[data-group=team]')) { const b = document.querySelector('#navigation .nav-button[data-group=team]'); if (!b.querySelector('.th-nav-badge')) { start(); tick(); } } });
  obs.observe(document.body, {childList: true, subtree: true});
}

export async function renderTeamAdmin({host, api, tab, navigate, notice}) {
  linkHrCss();
  host.classList.add('th-root'); host.lang = 'es';
  const ctx = {host, api, navigate, notice: notice || (() => {})};
  try {
    if (tab === 'team-create') createTab(ctx);
    else if (tab === 'team-people') await peopleTab(ctx);
    else if (tab === 'team-list') await listTab(ctx);
    else if (tab === 'team-docs') await docsTab(ctx);
  } catch (e) { host.append(E('p', e.message, 'th-error th-pad')); }
  paintTabBadge();
}
