// pipeline-sample · v17. Cartera de muestra (15 estudiantes del Magreb) para presentaciones a universidades.
// Mismo formato que la vista mt_pipeline_rows; fechas relativas al momento de generar el informe.
const DAY = 86400000;
const S = [
  // nombre, apellido, ciudad, país, nivel, materia, curso, institución, etapa, siguiente paso, test, nota, pasaporte, estudios, financiación, días abierto, días desde actualización, presupuesto
  ['Yassine', 'El Amrani', 'Casablanca', 'MA', 'postgraduate', 'Data Science', 'MSc Data Science and Artificial Intelligence', 'University of Hertfordshire', 'Enrolled', 'Arrival briefing completed. Induction week attended.', 'IELTS', 6.5, 'Available', 'Completed', 'Confirmed', 214, 9, 19500],
  ['Salma', 'Benjelloun', 'Rabat', 'MA', 'postgraduate', 'Business Management', 'MSc International Business Management', 'Coventry University', 'Deposit pending', 'Tuition deposit due before CAS issue.', 'IELTS', 6.5, 'Available', 'Completed', 'Confirmed', 128, 3, 18000],
  ['Anis', 'Bouzid', 'Algiers', 'DZ', 'postgraduate', 'Civil Engineering', 'MSc Civil Engineering', 'University of Salford', 'Offer received', 'Conditional offer received. Final transcript to be sent.', 'IELTS', 6.0, 'Available', 'Completed', 'Partial', 97, 5, 16500],
  ['Ines', 'Ben Salah', 'Tunis', 'TN', 'postgraduate', 'Finance', 'MSc Finance and Investment', 'Northumbria University', 'Offer received', 'Unconditional offer. Student to accept offer online.', 'IELTS', 7.0, 'Available', 'Completed', 'Confirmed', 88, 2, 20000],
  ['Mehdi', 'Tazi', 'Marrakech', 'MA', 'undergraduate', 'Computer Science', 'BSc (Hons) Computer Science', 'University of Greenwich', 'Application submitted', 'Application under review by admissions.', 'IELTS', 6.0, 'Available', 'Completed', 'Confirmed', 61, 4, 15500],
  ['Lina', 'Haddad', 'Oran', 'DZ', 'postgraduate', 'Public Health', 'MSc Public Health', 'University of East London', 'Application submitted', 'Awaiting decision. Interview requested by the university.', 'IELTS', 6.5, 'Available', 'Completed', 'Confirmed', 54, 1, 14500],
  ['Hamza', 'Chraibi', 'Fes', 'MA', 'postgraduate', 'Cyber Security', 'MSc Cyber Security', 'University of Portsmouth', 'Application submitted', 'Reference letter received. Decision expected within 2 weeks.', 'IELTS', 6.5, 'Available', 'Completed', 'Partial', 47, 6, 17500],
  ['Aya', 'Trabelsi', 'Sfax', 'TN', 'undergraduate', 'Architecture', 'BA (Hons) Architecture', 'University of Westminster', 'Application preparation', 'Portfolio review with the student this week.', 'IELTS', 6.0, 'Available', 'Completed', 'Confirmed', 33, 2, 19000],
  ['Karim', 'Mansouri', 'Constantine', 'DZ', 'postgraduate', 'Mechanical Engineering', 'MEng Mechanical Engineering', 'University of Bradford', 'Application preparation', 'Personal statement in final review.', 'IELTS', 6.5, 'Available', 'Completed', 'Partial', 29, 3, 16000],
  ['Nour', 'Alaoui', 'Tangier', 'MA', 'foundation', 'Business', 'International Foundation Year (Business)', 'University of Sussex', 'Application preparation', 'Foundation application form being completed.', 'Other test', '', 'Available', 'In progress', 'Confirmed', 24, 1, 14000],
  ['Rayan', 'Gharbi', 'Sousse', 'TN', 'postgraduate', 'Marketing', 'MSc Digital Marketing', 'Middlesex University', 'Documents pending', 'Bank statement and degree certificate pending.', 'IELTS', 6.0, 'Available', 'Completed', 'Partial', 18, 2, 15000],
  ['Imane', 'Ouazzani', 'Agadir', 'MA', 'postgraduate', 'Nursing', 'MSc Nursing (Adult)', 'University of Bedfordshire', 'Documents pending', 'Waiting for official transcript translation.', 'No test', '', 'In progress', 'Completed', 'Confirmed', 14, 1, 16500],
  ['Walid', 'Belkacem', 'Annaba', 'DZ', 'undergraduate', 'Economics', 'BSc (Hons) Economics', 'University of Hull', 'Assessment', 'Profile assessment call scheduled.', 'Not assessed', '', 'Available', 'In progress', 'Not defined', 7, 1, ''],
  ['Sara', 'Lahlou', 'Meknes', 'MA', 'postgraduate', 'International Law', 'LLM International Commercial Law', 'Brunel University London', 'Assessment', 'Eligibility check against entry requirements.', 'IELTS', 7.0, 'Available', 'Completed', 'Unknown', 4, 0, 18500],
  ['Omar', 'Jaziri', 'Monastir', 'TN', 'english_course', 'English language', 'Pre-sessional English (10 weeks)', 'University of Kent', 'On hold', 'Student waiting for IELTS resit date.', 'IELTS', 5.0, 'Available', 'Completed', 'Partial', 41, 12, 6500]
];
const INTAKE = {Enrolled: 'September 2026', 'On hold': 'January 2027'};
const STEP = {Enrolled: 'Post-arrival check-in', 'Deposit pending': 'Confirm deposit receipt', 'Offer received': 'Offer conditions follow-up', 'Application submitted': 'Chase admissions decision', 'Application preparation': 'Submit application', 'Documents pending': 'Collect missing documents', Assessment: 'Assessment call', 'On hold': 'Check IELTS booking'};
const slug = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]+/g, '');
const PHONE = {MA: '+2126', DZ: '+2135', TN: '+2162'};

export function samplePipelineRows(asOf = new Date().toISOString()) {
  const now = new Date(asOf).getTime();
  return S.map(([first, last, city, cc, level, subject, course, uni, stage, next, test, score, passport, school, funding, opened, upd, budget], i) => ({
    candidate_id: `sample-${String(i + 1).padStart(2, '0')}`,
    reference: 'MUK-' + String(1187 + i * 7 + (i % 3)).padStart(8, '0'),
    first_name: first, last_name: last,
    email: `${slug(first)}.${slug(last)}@gmail.com`,
    whatsapp_phone_e164: PHONE[cc] + String(10000000 + ((i + 3) * 7919301) % 89999999).slice(0, 8),
    residence_city: city, residence_country_code: cc,
    stage, target_study_level: level, subject_interest: subject,
    intended_intake: INTAKE[stage] || (level === 'english_course' ? 'January 2027' : i % 4 === 3 ? 'January 2027' : 'September 2027'),
    target_university: uni, target_course: course, external_next_step: next,
    english_test: test, english_score: score === '' ? null : score, passport, school_status: school, funding,
    next_action: STEP[stage] || next, next_action_at: new Date(now + ((i % 5) + 1) * DAY).toISOString(),
    budget_amount: budget === '' ? null : budget, budget_currency: budget === '' ? '' : 'GBP',
    case_accepted_at: new Date(now - opened * DAY).toISOString(), last_updated: new Date(now - upd * DAY - (i * 37 % 600) * 60000).toISOString(),
    archived_at: null, sample: true
  }));
}
export const SAMPLE_COUNT = S.length;
