// pipeline-english · v17. Normaliza al inglés los textos libres de la pipeline antes de que lleguen
// al Excel o al enlace compartido (convocatorias, materias, niveles, valores declarados, frases habituales).
const fold = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const foldChar = ch => { const f = ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); return f.length === 1 ? f : ch; };
const foldSame = s => Array.from(s).map(foldChar).join('');

const MONTHS = {
  enero: 'January', febrero: 'February', marzo: 'March', abril: 'April', mayo: 'May', junio: 'June', julio: 'July', agosto: 'August',
  septiembre: 'September', setiembre: 'September', octubre: 'October', noviembre: 'November', diciembre: 'December',
  janvier: 'January', fevrier: 'February', mars: 'March', avril: 'April', mai: 'May', juin: 'June', juillet: 'July', aout: 'August',
  septembre: 'September', octobre: 'October', novembre: 'November', decembre: 'December',
  ene: 'January', feb: 'February', abr: 'April', ago: 'August', sep: 'September', sept: 'September', oct: 'October', nov: 'November', dic: 'December'
};
const SEASONS = {otono: 'Autumn', primavera: 'Spring', verano: 'Summer', invierno: 'Winter', automne: 'Autumn', printemps: 'Spring', ete: 'Summer', hiver: 'Winter'};

// Frases y términos frecuentes (ES/FR → EN). Se aplican de la más larga a la más corta.
const PHRASES = [
  ['administracion y direccion de empresas', 'Business Administration'], ['administracion de empresas', 'Business Administration'],
  ['gestion de empresas', 'Business Management'], ['direccion de empresas', 'Business Management'], ['ciencia de datos', 'Data Science'],
  ['inteligencia artificial', 'Artificial Intelligence'], ['ingenieria informatica', 'Computer Engineering'], ['ingenieria civil', 'Civil Engineering'],
  ['ingenieria mecanica', 'Mechanical Engineering'], ['ingenieria electrica', 'Electrical Engineering'], ['ciberseguridad', 'Cyber Security'],
  ['informatica', 'Computer Science'], ['ingenieria', 'Engineering'], ['derecho internacional', 'International Law'], ['derecho', 'Law'],
  ['medicina', 'Medicine'], ['enfermeria', 'Nursing'], ['farmacia', 'Pharmacy'], ['psicologia', 'Psychology'], ['economia', 'Economics'],
  ['finanzas', 'Finance'], ['contabilidad', 'Accounting'], ['marketing digital', 'Digital Marketing'], ['educacion', 'Education'],
  ['arquitectura', 'Architecture'], ['turismo', 'Tourism'], ['hosteleria', 'Hospitality'], ['relaciones internacionales', 'International Relations'],
  ['negocios internacionales', 'International Business'], ['comunicacion', 'Communication'], ['periodismo', 'Journalism'], ['diseno', 'Design'],
  ['biotecnologia', 'Biotechnology'], ['biologia', 'Biology'], ['quimica', 'Chemistry'], ['fisica', 'Physics'], ['matematicas', 'Mathematics'],
  ['salud publica', 'Public Health'], ['logistica', 'Logistics'], ['recursos humanos', 'Human Resources'],
  ['gestion des entreprises', 'Business Management'], ['informatique', 'Computer Science'], ['droit', 'Law'], ['sciences des donnees', 'Data Science'],
  ['curso de ingles', 'English course'], ['cours d\'anglais', 'English course'], ['ano preparatorio', 'Foundation Year'], ['annee preparatoire', 'Foundation Year'],
  ['grado', 'Undergraduate degree'], ['licenciatura', 'Undergraduate degree'], ['maestria', 'Master\'s'],
  ['doctorado', 'PhD'], ['doctorat', 'PhD'], ['posgrado', 'Postgraduate'], ['postgrado', 'Postgraduate'],
  // pasos / estados habituales
  ['pendiente de documentos', 'Documents pending'], ['subir pasaporte', 'Upload passport'], ['subir documentos', 'Upload documents'],
  ['enviar documentos', 'Send documents'], ['carta de motivacion', 'Personal statement'], ['declaracion personal', 'Personal statement'],
  ['esperando respuesta de la universidad', 'Awaiting university decision'], ['esperando respuesta', 'Awaiting response'],
  ['esperando resultado', 'Awaiting result'], ['pagar deposito', 'Pay deposit'], ['pago del deposito', 'Deposit payment'], ['deposito', 'Deposit'],
  ['oferta recibida', 'Offer received'], ['oferta condicional', 'Conditional offer'], ['oferta incondicional', 'Unconditional offer'],
  ['solicitud enviada', 'Application submitted'], ['preparar solicitud', 'Prepare application'], ['llamada de evaluacion', 'Assessment call'],
  ['entrevista', 'Interview'], ['matriculado', 'Enrolled'], ['matricula', 'Enrolment'], ['visado', 'Visa'], ['pasaporte', 'Passport'],
  ['expediente academico', 'Academic transcript'], ['certificado', 'Certificate'], ['en curso', 'In progress'], ['en proceso', 'In progress'],
  ['completado', 'Completed'], ['terminado', 'Completed'], ['confirmado', 'Confirmed'], ['parcial', 'Partial'], ['pendiente', 'Pending'],
  ['revisar', 'Review'], ['llamar', 'Call'], ['enviar', 'Send'], ['recibido', 'Received'], ['beca', 'Scholarship'], ['prestamo', 'Loan'],
  ['financiado por la familia', 'Family funded'], ['autofinanciado', 'Self funded'], ['sin examen', 'No test'], ['sin definir', 'Not defined'],
  ['desconocido', 'Unknown'], ['disponible', 'Available'], ['no disponible', 'Not available'], [' y ', ' and '], [' de ', ' of '], [' en ', ' in ']
].map(([a, b]) => [foldSame(a), b]).sort((x, y) => y[0].trim().length - x[0].trim().length);
const CONNECTORS = new Set(['and', 'of', 'in']);
const titleCase = s => s.replace(/\b([a-z])/g, m => m.toUpperCase());

/** Convocatoria → "September 2027", "January 2027", "Autumn 2027"… */
export function englishIntake(v) {
  const raw = String(v ?? '').trim(); if (!raw) return '';
  const f = fold(raw).replace(/[\/,._-]+/g, ' ').replace(/\s+/g, ' ').trim();
  const year = (f.match(/\b(20\d{2})\b/) || [])[1] || '';
  const num = f.match(/^(\d{1,2}) (20\d{2})$/) || f.match(/^(20\d{2}) (\d{1,2})$/);
  if (num) { const m = Number(num[1].length === 4 ? num[2] : num[1]); if (m >= 1 && m <= 12) return new Date(Date.UTC(2000, m - 1, 1)).toLocaleString('en-GB', {month: 'long', timeZone: 'UTC'}) + ' ' + year; }
  for (const w of f.split(' ')) { if (MONTHS[w]) return (MONTHS[w] + ' ' + year).trim(); if (SEASONS[w]) return (SEASONS[w] + ' ' + year).trim(); }
  if (/^[a-z]+ 20\d{2}$/.test(f) && /^(january|february|march|april|may|june|july|august|september|october|november|december|autumn|spring|summer|winter)/.test(f)) return titleCase(f);
  return englishText(raw);
}

/** Texto libre: traduce términos frecuentes ES/FR; deja intacto lo que ya está en inglés o no se reconoce. */
export function englishText(v) {
  const raw = String(v ?? '').trim().replace(/\bM[áa]ster(?:ado)?\s+(?:en|de|in)\s+/gi, "Master's in ").replace(/\bMáster\b/g, "Master's"); if (!raw) return '';
  const spans = []; let low = foldSame(raw);
  for (const [src, en] of PHRASES) {
    const word = src.trim(); let i = 0;
    while ((i = low.indexOf(word, i)) !== -1) {
      const end = i + word.length, before = low[i - 1], after = low[end];
      const okB = before === undefined || !/[a-z0-9]/.test(before), okA = after === undefined || !/[a-z0-9]/.test(after);
      if (okB && okA && !spans.some(([a, b]) => i < b && end > a)) spans.push([i, end, en]);
      i = end;
    }
  }
  if (!spans.some(([, , en]) => !CONNECTORS.has(en.trim()))) return raw.charAt(0).toUpperCase() + raw.slice(1);
  let out = raw; spans.sort((x, y) => y[0] - x[0]);
  for (const [a, b, en] of spans) out = out.slice(0, a) + en + out.slice(b);
  out = out.replace(/\s+/g, ' ').trim();
  return out.charAt(0).toUpperCase() + out.slice(1);
}

const READY = {
  english_test: {ielts: 'IELTS', 'otro examen': 'Other test', 'otro test': 'Other test', 'sin examen': 'No test', 'no test': 'No test', 'sin evaluar': 'Not assessed'},
  passport: {disponible: 'Available', 'en curso': 'In progress', 'en proceso': 'In progress', 'no disponible': 'Not available', desconocido: 'Unknown'},
  school_status: {completado: 'Completed', terminado: 'Completed', 'en curso': 'In progress', desconocido: 'Unknown'},
  funding: {confirmado: 'Confirmed', parcial: 'Partial', 'sin definir': 'Not defined', 'no definido': 'Not defined', desconocido: 'Unknown'}
};
export const englishReadiness = (key, v) => { const k = fold(v).trim(); return READY[key]?.[k] || (v ? englishText(v) : v); };

/** Aplica la normalización a una fila de mt_pipeline_rows (no toca nombres, emails ni referencias). */
export function englishRow(row) {
  const r = {...row};
  if ('intended_intake' in r) r.intended_intake = englishIntake(r.intended_intake);
  for (const k of ['subject_interest', 'target_course', 'external_next_step', 'next_action']) if (k in r) r[k] = englishText(r[k]);
  for (const k of Object.keys(READY)) if (k in r && r[k]) r[k] = englishReadiness(k, r[k]);
  return r;
}
