// candidate-profile-v24 · Ficha estructurada de un lead / caso (Admin → Leads y casos).
// Sustituye el volcado «Évaluation reçue · formulaire complet» por bloques claros con lo necesario.
const el = (tag, text, cls) => { const n = document.createElement(tag); if (text !== undefined && text !== null) n.textContent = text; if (cls) n.className = cls; return n; };
const LEVEL = {foundation: 'Foundation (año preparatorio)', undergraduate: 'Grado (Undergraduate)', postgraduate: 'Máster (Postgraduate)', phd: 'Doctorado (PhD)', english_course: 'Curso de inglés', other: 'Otro'};
const ENGLISH = {beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado', certified: 'Con certificado', unknown: 'No lo sabe'};
const STATUS = {new: 'Nuevo', contacted: 'Contactado', assessment_in_progress: 'Evaluación en curso', documents_pending: 'Documentos pendientes', ready_for_review: 'Listo para revisión', on_hold: 'En espera', closed: 'Cerrado'};
const SOURCE = {global_passport: 'Cuenta Global Passport', evaluation: 'Formulario de evaluación', manual: 'Alta manual', website: 'Web'};
let regions;
const country = code => { if (!code) return ''; try { regions ||= new Intl.DisplayNames(['es'], {type: 'region'}); return regions.of(code) || code; } catch { return code; } };
const when = v => { if (!v) return ''; const d = new Date(v); return Number.isNaN(d.getTime()) ? '' : new Intl.DateTimeFormat('es-ES', {dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Casablanca'}).format(d); };
const clean = v => (v === null || v === undefined || String(v).trim() === '' ? '' : String(v).trim());

function card(title, rows, {wide = false} = {}) {
  const shown = rows.filter(r => r && clean(r[1]) !== '');
  if (!shown.length) return null;
  const c = el('section', undefined, 'cp-card' + (wide ? ' cp-wide' : '')); c.append(el('h4', title));
  const dl = el('dl');
  for (const [k, v, href] of shown) {
    const dt = el('dt', k), dd = el('dd');
    if (href) { const a = el('a', v); a.href = href; a.rel = 'noopener'; if (/^https?:/.test(href)) a.target = '_blank'; dd.append(a); } else dd.textContent = v;
    dl.append(dt, dd);
  }
  c.append(dl); return c;
}

export function renderCandidateProfile(record, {staffName = id => id} = {}) {
  const r = record || {}, p = (r.evaluation_payload && typeof r.evaluation_payload === 'object') ? r.evaluation_payload : {}, edu = p.education || {};
  const wrap = el('div', undefined, 'cp');
  // Cabecera: estado, responsable, origen y fechas clave
  const head = el('div', undefined, 'cp-head');
  const chip = (t, tone) => { const c = el('span', t, 'cp-chip'); if (tone) c.dataset.tone = tone; return c; };
  head.append(chip(STATUS[r.status] || r.status || 'Nuevo', r.status === 'closed' ? 'grey' : r.status === 'ready_for_review' ? 'green' : 'gold'));
  head.append(chip(r.assigned_to ? 'Responsable: ' + staffName(r.assigned_to) : 'Sin responsable', r.assigned_to ? '' : 'red'));
  if (r.case_accepted_at) head.append(chip('Caso aceptado · ' + when(r.case_accepted_at), 'green'));
  if (r.archived_at) head.append(chip('Archivado', 'grey'));
  const src = SOURCE[r.source] || r.source;
  if (src) head.append(chip('Origen: ' + src));
  wrap.append(head);

  const grid = el('div', undefined, 'cp-grid');
  const wa = clean(r.whatsapp_phone_e164 || p.whatsapp_phone_e164);
  const place = [clean(r.residence_city || p.residence_city), country(r.residence_country_code || p.residence_country_code)].filter(Boolean).join(', ');
  const email = clean(r.email || p.email);
  const cards = [
    card('Contacto', [
      ['Correo', email, email ? 'mailto:' + email : null],
      ['WhatsApp', wa, wa ? 'https://wa.me/' + wa.replace(/\D/g, '') : null],
      ['Teléfono', r.phone_e164 && r.phone_e164 !== wa ? r.phone_e164 : '', r.phone_e164 ? 'tel:' + r.phone_e164 : null],
      ['Residencia', place],
      ['Idioma', r.preferred_language === 'en' ? 'Inglés' : r.preferred_language === 'fr' ? 'Francés' : r.preferred_language]
    ]),
    card('Proyecto de estudios', [
      ['Nivel', LEVEL[r.target_study_level || p.target_study_level] || r.target_study_level || p.target_study_level],
      ['Área', r.subject_interest || p.subject_interest],
      ['Convocatoria', r.intended_intake || p.intended_intake],
      ['Financiación', r.funding_plan || p.funding_plan],
      ['Presupuesto', r.budget_amount != null ? Number(r.budget_amount).toLocaleString('es-ES') + ' ' + (r.budget_currency || '') : '']
    ]),
    card('Formación actual', [
      ['Centro', edu.institution_name],
      ['Titulación', edu.qualification],
      ['Especialidad', edu.field_of_study],
      ['Situación', edu.is_current === true ? 'En curso' : edu.is_current === false ? 'Terminada' : ''],
      ['Resultados', edu.result_text]
    ]),
    card('Inglés', [
      ['Nivel', ENGLISH[p.english_level] || p.english_level],
      ['Test / certificado', p.english_test]
    ]),
    card('Seguimiento', [
      ['Próxima acción', r.next_action],
      ['Fecha', when(r.next_action_at)],
      ['Alta', when(r.created_at)],
      ['Última actualización', when(r.updated_at)]
    ])
  ].filter(Boolean);
  grid.append(...cards);
  if (clean(p.message)) { const m = el('section', undefined, 'cp-card cp-wide cp-message'); m.append(el('h4', 'Mensaje del estudiante'), el('blockquote', p.message)); grid.append(m); }
  wrap.append(grid);
  return wrap;
}
