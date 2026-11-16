// student-link-v24 · Une el lead (Leads y casos · crm_candidates) con la cuenta del estudiante (Global Passport · gp_students).
// Clave común: el correo electrónico (sin distinguir mayúsculas).
// - Si el admin asigna un responsable en Leads y casos, el Global Passport del estudiante pasa a ese counsellor.
// - Si el admin reasigna el counsellor en Global Passport, el lead cambia de responsable.
// - Cuando un estudiante crea su Global Passport, se usa el responsable que ya tenga su lead; si no tiene lead, se crea uno
//   (origen «global_passport») para que aparezca en Leads y casos y en el flujo de trabajo del counsellor.

export const normEmail = e => String(e || '').trim().toLowerCase();
// Para .ilike(): escapa los comodines de LIKE, así la comparación es exacta salvo mayúsculas.
export const likeExact = e => normEmail(e).replace(/[\\%_]/g, c => '\\' + c);
const LEVELS = ['foundation', 'undergraduate', 'postgraduate', 'phd', 'english_course', 'other'];
const PHONE = /^\+[1-9][0-9]{6,14}$/;

// Valores del lead creado a partir de un Global Passport (solo campos permitidos por la tabla).
export function candidateFromStudent(s, counsellorId) {
  const parts = String(s.full_name || '').trim().split(/\s+/);
  const first = parts.shift() || 'Student', last = parts.join(' ') || '-';
  const phone = String(s.phone || '').replace(/[\s().-]/g, '');
  const level = String(s.study_level || '').toLowerCase();
  const guess = LEVELS.find(l => level.includes(l.replace('_', ' '))) || (/master|postgraduate taught/.test(level) ? 'postgraduate' : /phd|doctor/.test(level) ? 'phd' : /english|anglais/.test(level) ? 'english_course' : /licence|bachelor|undergraduate/.test(level) ? 'undergraduate' : /foundation/.test(level) ? 'foundation' : null);
  return {
    first_name: first.slice(0, 150), last_name: last.slice(0, 150), email: normEmail(s.email),
    phone_e164: PHONE.test(phone) ? phone : null, whatsapp_phone_e164: PHONE.test(phone) ? phone : null,
    residence_country_code: /^[A-Z]{2}$/.test(s.country_residence || '') ? s.country_residence : null,
    target_study_level: guess, subject_interest: s.subject ? String(s.subject).slice(0, 500) : null,
    intended_intake: s.intake ? String(s.intake).slice(0, 80) : null,
    source: 'global_passport', preferred_language: 'en', assigned_to: counsellorId || null,
    next_action: 'Global Passport ' + (s.reference || '') + ' · first contact'
  };
}

export async function candidateFor(client, email) {
  if (!normEmail(email)) return null;
  try {
  const r = await client.from('crm_candidates').select('id,assigned_to,archived_at,updated_at').ilike('email', likeExact(email)).is('archived_at', null).order('created_at', {ascending: false}).limit(1);
  return r.error ? null : r.data?.[0] || null;
  } catch { return null; }
}

async function activeStaff(client, id) {
  if (!id) return false;
  const r = await client.from('crm_staff').select('active').eq('user_id', id).maybeSingle();
  return !!r.data?.active;
}

// Global Passport → lead: deja el lead con el mismo responsable (o lo crea si no existe).
export async function syncCandidateFromStudent(client, student, counsellorId) {
  try {
    const c = await candidateFor(client, student.email);
    if (c) {
      if (counsellorId && c.assigned_to !== counsellorId && await activeStaff(client, counsellorId))
        await client.from('crm_candidates').update({assigned_to: counsellorId, updated_at: new Date().toISOString()}).eq('id', c.id);
      return {candidate_id: c.id, created: false};
    }
    const ins = await client.from('crm_candidates').insert(candidateFromStudent(student, counsellorId)).select('id').single();
    return ins.error ? {error: ins.error.message} : {candidate_id: ins.data.id, created: true};
  } catch (e) { return {error: e.message}; }
}

// Lead → Global Passport: el counsellor del estudiante pasa a ser el responsable del lead.
export async function syncStudentFromCandidate(client, candidate, {by = null} = {}) {
  try {
    if (!candidate?.email || !candidate.assigned_to) return {updated: 0};
    const r = await client.from('gp_students').select('user_id,counsellor_id').ilike('email', likeExact(candidate.email)).limit(5);
    if (r.error || !r.data?.length) return {updated: 0};
    let updated = 0;
    const who = await client.from('crm_staff').select('full_name').eq('user_id', candidate.assigned_to).maybeSingle();
    for (const s of r.data) {
      if (s.counsellor_id === candidate.assigned_to) continue;
      const u = await client.from('gp_students').update({counsellor_id: candidate.assigned_to, updated_at: new Date().toISOString()}).eq('user_id', s.user_id);
      if (u.error) continue;
      updated++;
      await client.from('gp_messages').insert({student_id: s.user_id, sender_role: 'system', sender_id: by, body: `Your file is now managed by ${who.data?.full_name || 'a new counsellor'}.`, kind: 'update'});
    }
    return {updated};
  } catch (e) { return {error: e.message}; }
}
