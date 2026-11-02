// pipeline-workbook-v2 · Excel profesional de la pipeline para universidades (y versión interna).
// Hojas: Summary · Case pipeline · Stage x level · Guide. Un único código de colores (pipeline-stages.mjs).
import ExcelJS from 'exceljs';
import {STAGE_META, STATUS_LEGEND, stageMeta} from './pipeline-stages.mjs';
import {englishRow} from './pipeline-english.mjs';

export const STAGES = ['Assessment', 'Documents pending', 'Application preparation', 'Application submitted', 'Offer received', 'Deposit pending', 'Enrolled', 'On hold', 'Closed'];
const ADVANCED = ['Application submitted', 'Offer received', 'Deposit pending', 'Enrolled'];
const OFFERS = ['Offer received', 'Deposit pending', 'Enrolled'];
const LEVELS = {foundation: 'Foundation', undergraduate: 'Undergraduate', postgraduate: 'Postgraduate', phd: 'PhD / Doctorate', english_course: 'English course', other: 'Other'};

const C = {
  ink: 'FF13312E', inkSoft: 'FF2B4A46', gold: 'FFC9A45C', goldSoft: 'FFF6EEDC', paper: 'FFFAF8F3', zebra: 'FFF4F2EC',
  line: 'FFDAD6CB', text: 'FF1F2A29', muted: 'FF6B7672', white: 'FFFFFFFF', red: 'FF8A2A22', redSoft: 'FFF5D9D6'
};
const TRAFFIC = {
  good: {fill: 'FFD8F0DF', font: 'FF1E6B3A'}, mid: {fill: 'FFFCEBC6', font: 'FF7A5410'},
  bad: {fill: 'FFF5D9D6', font: 'FF8A2A22'}, none: {fill: 'FFEDEBE6', font: 'FF6B6760'}
};
const READINESS = {
  english_test: {IELTS: 'good', 'Other test': 'good', 'No test': 'mid', 'Not assessed': 'none'},
  passport: {Available: 'good', 'In progress': 'mid', 'Not available': 'bad', Unknown: 'none'},
  school_status: {Completed: 'good', 'In progress': 'mid', Unknown: 'none'},
  funding: {Confirmed: 'good', Partial: 'mid', 'Not defined': 'bad', Unknown: 'none'}
};
const scoreTone = v => v == null || v === '' ? 'none' : Number(v) >= 6.5 ? 'good' : Number(v) >= 5.5 ? 'mid' : 'bad';

const regionNames = (() => { try { return new Intl.DisplayNames(['en'], {type: 'region'}); } catch { return null; } })();
export const countryName = code => /^[A-Z]{2}$/.test(String(code || '')) ? (regionNames?.of(code) || code) : 'Not specified';
export const levelName = v => LEVELS[v] || (v ? String(v) : 'Not specified');
const asDate = v => { if (!v) return null; const d = new Date(v); return Number.isNaN(d.getTime()) ? null : d; };
const fmtDate = d => new Intl.DateTimeFormat('en-GB', {day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC'}).format(d);

// Columnas: [clave, cabecera, ancho, grupo, tipo]
export const PARTNER_COLUMNS = [
  ['reference', 'Case ref.', 13, 'Case', 'text'],
  ['stage', 'Pipeline stage', 24, 'Case', 'stage'],
  ['status', 'Status', 15, 'Case', 'status'],
  ['country', 'Country of residence', 20, 'Student profile', 'text'],
  ['target_study_level', 'Study level', 17, 'Student profile', 'level'],
  ['subject_interest', 'Subject of interest', 26, 'Student profile', 'text'],
  ['intended_intake', 'Intended intake', 15, 'Student profile', 'text'],
  ['target_university', 'Target institution', 26, 'Application', 'text'],
  ['target_course', 'Target course', 28, 'Application', 'text'],
  ['external_next_step', 'Next admissions step', 36, 'Application', 'wrap'],
  ['english_test', 'English test', 14, 'Readiness (declared)', 'english_test'],
  ['english_score', 'IELTS overall', 11, 'Readiness (declared)', 'score'],
  ['passport', 'Passport', 13, 'Readiness (declared)', 'passport'],
  ['school_status', 'Secondary studies', 15, 'Readiness (declared)', 'school_status'],
  ['funding', 'Funding', 13, 'Readiness (declared)', 'funding'],
  ['case_accepted_at', 'Case opened', 13, 'Dates', 'date'],
  ['last_updated', 'Last update', 13, 'Dates', 'date']
];
const INTERNAL_EXTRA = [
  ['first_name', 'First name', 16, 'Contact (internal)', 'text'],
  ['last_name', 'Last name', 16, 'Contact (internal)', 'text'],
  ['email', 'Email', 28, 'Contact (internal)', 'text'],
  ['whatsapp_phone_e164', 'Phone / WhatsApp', 17, 'Contact (internal)', 'text'],
  ['residence_city', 'City', 15, 'Contact (internal)', 'text'],
  ['next_action', 'Internal next action', 32, 'Internal follow-up', 'wrap'],
  ['next_action_at', 'Follow-up date', 14, 'Internal follow-up', 'date'],
  ['budget_amount', 'Budget', 12, 'Internal follow-up', 'money'],
  ['budget_currency', 'Cur.', 7, 'Internal follow-up', 'text']
];
export const columnsFor = mode => mode === 'partners' ? PARTNER_COLUMNS : [...PARTNER_COLUMNS.slice(0, 3), ...INTERNAL_EXTRA, ...PARTNER_COLUMNS.slice(3)];
const GROUP_FILL = {'Case': C.ink, 'Student profile': 'FF2F5D58', 'Application': 'FF4B3A86', 'Readiness (declared)': 'FF7A5410', 'Dates': 'FF55524B', 'Contact (internal)': C.red, 'Internal follow-up': 'FF8A3F12'};

// Fila "pública" (lo que ve una universidad). También es el snapshot del enlace compartido.
export function partnerRow(input) {
  const row = englishRow(input);
  return {
    reference: row.reference || '', stage: row.stage || '', status: stageMeta(row.stage).status,
    country: row.residence_country_code !== undefined ? countryName(row.residence_country_code) : (row.country || 'Not specified'), target_study_level: levelName(row.target_study_level),
    subject_interest: row.subject_interest || '', intended_intake: row.intended_intake || '', target_university: row.target_university || '',
    target_course: row.target_course || '', external_next_step: row.external_next_step || '', english_test: row.english_test || 'Not assessed',
    english_score: row.english_score == null || row.english_score === '' ? '' : Number(row.english_score), passport: row.passport || 'Unknown',
    school_status: row.school_status || 'Unknown', funding: row.funding || 'Unknown', case_accepted_at: row.case_accepted_at || '', last_updated: row.last_updated || ''
  };
}
export const sortRows = rows => [...rows].sort((a, b) => STAGES.indexOf(a.stage) - STAGES.indexOf(b.stage) || String(b.last_updated || '').localeCompare(String(a.last_updated || '')) || String(a.reference).localeCompare(String(b.reference)));

const solid = argb => ({type: 'pattern', pattern: 'solid', fgColor: {argb}});
const thin = argb => ({style: 'thin', color: {argb}});
const font = (o = {}) => ({name: 'Calibri', size: 10.5, color: {argb: C.text}, ...o});

function band(ws, lastCol, title, subtitle, mode) {
  ws.mergeCells(1, 1, 1, lastCol); ws.mergeCells(2, 1, 2, lastCol);
  const t = ws.getCell(1, 1), s = ws.getCell(2, 1);
  t.value = {richText: [{text: 'MUK TALENT   ', font: font({bold: true, size: 15, color: {argb: C.gold}})}, {text: title, font: font({bold: true, size: 15, color: {argb: C.white}})}]};
  s.value = subtitle;
  s.font = font({size: 10, color: {argb: mode === 'partners' ? 'FFE7DFC9' : 'FFFFD7D2'}});
  for (const r of [1, 2]) for (let c = 1; c <= lastCol; c++) ws.getCell(r, c).fill = solid(C.ink);
  t.alignment = {vertical: 'middle', indent: 1}; s.alignment = {vertical: 'middle', indent: 1};
  ws.getRow(1).height = 34; ws.getRow(2).height = 22;
  ws.mergeCells(3, 1, 3, lastCol);
  for (let c = 1; c <= lastCol; c++) ws.getCell(3, c).fill = solid(C.gold);
  ws.getRow(3).height = 4;
}

function countBy(rows, fn) { const m = new Map(); for (const r of rows) { const k = fn(r); m.set(k, (m.get(k) || 0) + 1); } return [...m.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]))); }

function smallTable(ws, top, left, title, entries, total, {limit = 8, color = C.inkSoft} = {}) {
  // 6 columnas: categoría (2) · casos · % · barra (2)
  const right = left + 5;
  ws.mergeCells(top, left, top, right);
  const h = ws.getCell(top, left); h.value = title; h.font = font({bold: true, size: 11, color: {argb: C.ink}});
  for (let c = left; c <= right; c++) ws.getCell(top, c).border = {bottom: {style: 'medium', color: {argb: C.gold}}};
  ws.mergeCells(top + 1, left, top + 1, left + 1); ws.mergeCells(top + 1, left + 4, top + 1, right);
  [['Category', left, 'left'], ['Cases', left + 2, 'center'], ['%', left + 3, 'center']].forEach(([v, c, al]) => { const cell = ws.getCell(top + 1, c); cell.value = v; cell.font = font({bold: true, size: 9, color: {argb: C.muted}}); cell.alignment = {horizontal: al}; });
  let r = top + 2;
  const list = entries.slice(0, limit), rest = entries.slice(limit).reduce((a, e) => a + e[1], 0);
  if (rest) list.push(['Other', rest]);
  if (!list.length) list.push(['No cases', 0]);
  for (const [label, n] of list) {
    const pct = total ? n / total : 0;
    ws.mergeCells(r, left, r, left + 1); ws.mergeCells(r, left + 4, r, right);
    ws.getCell(r, left).value = label; ws.getCell(r, left).font = font(); ws.getCell(r, left).alignment = {vertical: 'middle', shrinkToFit: true};
    ws.getCell(r, left + 2).value = n; ws.getCell(r, left + 2).font = font({bold: true}); ws.getCell(r, left + 2).alignment = {horizontal: 'center'};
    ws.getCell(r, left + 3).value = pct; ws.getCell(r, left + 3).numFmt = '0%'; ws.getCell(r, left + 3).font = font({color: {argb: C.muted}}); ws.getCell(r, left + 3).alignment = {horizontal: 'center'};
    ws.getCell(r, left + 4).value = '█'.repeat(Math.max(n ? 1 : 0, Math.round(pct * 16))); ws.getCell(r, left + 4).font = font({color: {argb: color}, size: 9});
    for (let c = left; c <= right; c++) ws.getCell(r, c).border = {bottom: thin(C.line)};
    r++;
  }
  return r;
}

export async function buildPipelineWorkbook(rawRows, {mode = 'partners', title = 'Student recruitment pipeline', recipient = '', asOf = new Date().toISOString(), sample = false} = {}) {
  const preparedBy = 'MUK Talent';
  const partners = mode === 'partners';
  // Sólo datos de estudiantes: se descartan campos del personal (responsable, creador, etc.).
  const rows = sortRows(rawRows.map(r => { const {owner_name, owner_id, assigned_to, created_by, ...rest} = englishRow(r); return {...rest, ...partnerRow(r)}; }));
  const total = rows.length, when = fmtDate(new Date(asOf));
  const wb = new ExcelJS.Workbook();
  wb.creator = preparedBy; wb.company = 'MUK Talent'; wb.created = new Date(asOf); wb.modified = new Date(asOf);
  wb.title = title; wb.subject = partners ? 'Partner pipeline report' : 'Internal pipeline report';
  const subtitle = `${recipient ? 'Prepared for ' + recipient + '   ·   ' : ''}Snapshot ${when}   ·   ${total} accepted case${total === 1 ? '' : 's'}   ·   ${partners ? 'Pseudonymised: no names or contact details' : 'CONFIDENTIAL · internal use only'}`;
  wb.calcProperties.fullCalcOnLoad = true;

  // ---------- 1 · Summary ----------
  const sum = wb.addWorksheet('Summary', {views: [{showGridLines: false}], properties: {tabColor: {argb: C.ink}}});
  sum.columns = [{width: 2}, ...Array.from({length: 12}, () => ({width: 12.5})), {width: 2}];
  band(sum, 14, title, subtitle, mode);
  sum.mergeCells('B5:M5');
  sum.getCell('B5').value = partners ? 'Executive summary of the applicants MUK Talent is currently progressing. Each row in "Case pipeline" is one accepted student case.' : 'Internal view of every accepted case, including contact details and internal follow-up. Do not share outside MUK Talent.';
  sum.getCell('B5').font = font({italic: true, color: {argb: C.muted}}); sum.getRow(5).height = 20;
  // KPI tiles
  const kpis = [
    ['ACCEPTED CASES', total, 'in the current pipeline'],
    ['APPLICATIONS SUBMITTED', rows.filter(r => ADVANCED.includes(r.stage)).length, 'submitted, offer, deposit or enrolled'],
    ['OFFERS RECEIVED', rows.filter(r => OFFERS.includes(r.stage)).length, 'offer, deposit or enrolled'],
    ['ENROLLED', rows.filter(r => r.stage === 'Enrolled').length, 'completed enrolment']
  ];
  kpis.forEach(([label, value, note], i) => {
    const c1 = 2 + i * 3, c2 = c1 + 2;
    sum.mergeCells(7, c1, 7, c2); sum.mergeCells(8, c1, 9, c2); sum.mergeCells(10, c1, 10, c2);
    const L = sum.getCell(7, c1), V = sum.getCell(8, c1), N = sum.getCell(10, c1);
    L.value = label; L.font = font({bold: true, size: 9, color: {argb: i === 0 ? C.gold : C.muted}});
    V.value = value; V.font = font({bold: true, size: 26, color: {argb: i === 0 ? C.white : C.ink}});
    N.value = i === 0 ? note : `${total ? Math.round(value / total * 100) : 0}% · ${note}`; N.font = font({size: 9, color: {argb: i === 0 ? 'FFD9D4C5' : C.muted}});
    for (let r = 7; r <= 10; r++) for (let c = c1; c <= c2; c++) {
      const cell = sum.getCell(r, c); cell.fill = solid(i === 0 ? C.ink : C.goldSoft);
      cell.alignment = {vertical: 'middle', horizontal: 'left', indent: 1, wrapText: r === 10};
    }
    for (let c = c1; c <= c2; c++) sum.getCell(7, c).border = {top: {style: 'medium', color: {argb: C.gold}}};
  });
  sum.getRow(8).height = 22; sum.getRow(9).height = 22; sum.getRow(10).height = 26;
  // Stage table
  let r = 12;
  sum.mergeCells(r, 2, r, 13); sum.getCell(r, 2).value = 'Pipeline by stage'; sum.getCell(r, 2).font = font({bold: true, size: 12, color: {argb: C.ink}});
  r++;
  const head = [['Stage', 2, 4], ['Status', 5, 6], ['Cases', 7, 7], ['Share', 8, 8], ['Distribution', 9, 13]];
  for (const [label, a, b] of head) { if (b > a) sum.mergeCells(r, a, r, b); const c = sum.getCell(r, a); c.value = label; c.font = font({bold: true, size: 9.5, color: {argb: C.white}}); for (let k = a; k <= b; k++) sum.getCell(r, k).fill = solid(C.inkSoft); c.alignment = {vertical: 'middle', horizontal: label === 'Cases' || label === 'Share' ? 'center' : 'left', indent: label === 'Cases' || label === 'Share' ? 0 : 1}; }
  sum.getRow(r).height = 20; r++;
  const maxStage = Math.max(1, ...STAGES.map(s => rows.filter(x => x.stage === s).length));
  for (const s of STAGES) {
    const n = rows.filter(x => x.stage === s).length, m = stageMeta(s);
    sum.mergeCells(r, 2, r, 4); sum.mergeCells(r, 5, r, 6); sum.mergeCells(r, 9, r, 13);
    const st = sum.getCell(r, 2); st.value = `${m.step ? m.step + '. ' : ''}${s}`; st.font = font({bold: true, color: {argb: m.font}});
    for (let k = 2; k <= 4; k++) sum.getCell(r, k).fill = solid(m.fill);
    sum.getCell(r, 5).value = m.status; sum.getCell(r, 5).font = font({color: {argb: m.font}});
    sum.getCell(r, 7).value = n; sum.getCell(r, 7).font = font({bold: true}); sum.getCell(r, 7).alignment = {horizontal: 'center'};
    sum.getCell(r, 8).value = total ? n / total : 0; sum.getCell(r, 8).numFmt = '0%'; sum.getCell(r, 8).alignment = {horizontal: 'center'}; sum.getCell(r, 8).font = font({color: {argb: C.muted}});
    sum.getCell(r, 9).value = n ? '█'.repeat(Math.max(1, Math.round(n / maxStage * 30))) : ''; sum.getCell(r, 9).font = font({size: 9, color: {argb: m.font}});
    for (let k = 2; k <= 13; k++) { sum.getCell(r, k).border = {bottom: thin(C.line)}; if (k > 4) sum.getCell(r, k).alignment = {...(sum.getCell(r, k).alignment || {}), vertical: 'middle'}; }
    sum.getCell(r, 2).alignment = {vertical: 'middle', indent: 1}; sum.getCell(r, 5).alignment = {vertical: 'middle', indent: 1};
    sum.getRow(r).height = 19; r++;
  }
  sum.mergeCells(r, 2, r, 6); sum.getCell(r, 2).value = 'Total'; sum.getCell(r, 7).value = total; sum.getCell(r, 8).value = total ? 1 : 0; sum.getCell(r, 8).numFmt = '0%';
  for (let k = 2; k <= 13; k++) { const c = sum.getCell(r, k); c.font = font({bold: true, color: {argb: C.ink}}); c.border = {top: {style: 'medium', color: {argb: C.ink}}}; }
  sum.getCell(r, 2).alignment = {indent: 1}; sum.getCell(r, 7).alignment = {horizontal: 'center'}; sum.getCell(r, 8).alignment = {horizontal: 'center'};
  r += 2;
  // Profile tables (two per row)
  const english = rows.map(x => x.english_score === '' || x.english_score == null ? (x.english_test === 'No test' ? 'No test yet' : 'Not assessed') : Number(x.english_score) >= 6.5 ? 'IELTS 6.5 or above' : Number(x.english_score) >= 5.5 ? 'IELTS 5.5 – 6.0' : 'IELTS below 5.5');
  const a1 = smallTable(sum, r, 2, 'By study level', countBy(rows, x => x.target_study_level), total);
  const b1 = smallTable(sum, r, 8, 'By intended intake', countBy(rows, x => x.intended_intake || 'To be defined'), total, {color: 'FF4B3A86'});
  r = Math.max(a1, b1) + 1;
  const a2 = smallTable(sum, r, 2, 'By country of residence', countBy(rows, x => x.country), total, {color: 'FF2F5D58'});
  const b2 = smallTable(sum, r, 8, 'English readiness (declared)', countBy(english, x => x), total, {color: 'FF7A5410'});
  r = Math.max(a2, b2) + 1;
  const a3 = smallTable(sum, r, 2, 'Top subjects of interest', countBy(rows, x => x.subject_interest || 'Not specified'), total, {limit: 7});
  const b3 = smallTable(sum, r, 8, 'Funding readiness (declared)', countBy(rows, x => x.funding), total, {color: 'FF1E6B3A'});
  r = Math.max(a3, b3) + 1;
  const notes = [
    'How to read this report',
    '• Stages follow the order of the admissions journey (1 → 7). "On hold" and "Closed" cases are shown separately.',
    '• Readiness columns are declared by the student or counsellor and are not document verification.',
    partners ? '• No names, emails or phone numbers are included. Downloaded copies cannot be withdrawn, so share them only with authorised staff.' : '• This version contains personal data. Keep it inside MUK Talent and delete local copies when no longer needed.',
    '• Pipeline stages are a progress indicator, not a guarantee of admission or enrolment.'
  ];
  notes.forEach((t, i) => { sum.mergeCells(r, 2, r, 13); const c = sum.getCell(r, 2); c.value = t; c.font = i ? font({size: 9.5, color: {argb: C.muted}}) : font({bold: true, size: 10.5, color: {argb: C.ink}}); c.alignment = {wrapText: true, vertical: 'top'}; sum.getRow(r).height = i ? 16 : 20; r++; });
  sum.pageSetup = {paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: {left: 0.4, right: 0.4, top: 0.5, bottom: 0.6, header: 0.2, footer: 0.3}, horizontalCentered: true};

  // ---------- 2 · Case pipeline ----------
  const cols = columnsFor(mode), last = cols.length;
  const ws = wb.addWorksheet('Case pipeline', {properties: {tabColor: {argb: C.gold}}, views: [{state: 'frozen', xSplit: 1, ySplit: 5, showGridLines: false, zoomScale: 100}]});
  ws.columns = cols.map(([key, , width]) => ({key, width}));
  band(ws, last, title, subtitle, mode);
  // fila 4: grupos · fila 5: cabeceras
  let start = 1;
  for (let i = 1; i <= last; i++) {
    const g = cols[i - 1][3];
    if (i === last || cols[i][3] !== g) {
      if (i > start) ws.mergeCells(4, start, 4, i);
      const cell = ws.getCell(4, start); cell.value = g.toUpperCase(); cell.font = font({bold: true, size: 8.5, color: {argb: C.white}});
      cell.alignment = {horizontal: 'center', vertical: 'middle'};
      for (let k = start; k <= i; k++) { ws.getCell(4, k).fill = solid(GROUP_FILL[g] || C.ink); ws.getCell(4, k).border = {left: thin(C.white), right: thin(C.white)}; }
      start = i + 1;
    }
  }
  ws.getRow(4).height = 18;
  cols.forEach(([, header], i) => {
    const cell = ws.getCell(5, i + 1); cell.value = header;
    cell.font = font({bold: true, size: 10, color: {argb: C.ink}}); cell.fill = solid(C.goldSoft);
    cell.alignment = {vertical: 'middle', horizontal: 'left', wrapText: true, indent: 0};
    cell.border = {bottom: {style: 'medium', color: {argb: C.gold}}, right: thin(C.line)};
  });
  ws.getRow(5).height = 32;
  rows.forEach((row, idx) => {
    const values = cols.map(([key, , , , type]) => {
      const v = row[key];
      if (type === 'date' || key === 'next_action_at') return asDate(v);
      if (type === 'score') return v === '' || v == null ? null : Number(v);
      if (type === 'money') return v === '' || v == null ? null : Number(v);
      return v == null ? '' : v;
    });
    const added = ws.addRow(values), m = stageMeta(row.stage), zebra = idx % 2 === 1;
    added.height = 30;
    cols.forEach(([key, , , , type], i) => {
      const cell = added.getCell(i + 1);
      cell.font = font(); cell.alignment = {vertical: 'middle', wrapText: true};
      cell.border = {bottom: thin(C.line), right: thin('FFEAE7DF')};
      if (zebra) cell.fill = solid(C.zebra);
      if (type === 'stage' || type === 'status') { cell.fill = solid(m.fill); cell.font = font({bold: type === 'stage', color: {argb: m.font}}); }
      else if (READINESS[type]) { const t = TRAFFIC[READINESS[type][row[key]] || 'none']; cell.fill = solid(t.fill); cell.font = font({color: {argb: t.font}}); cell.alignment = {vertical: 'middle', horizontal: 'center', wrapText: true}; }
      else if (type === 'score') { const t = TRAFFIC[scoreTone(row[key])]; cell.fill = solid(t.fill); cell.font = font({bold: true, color: {argb: t.font}}); cell.numFmt = '0.0'; cell.alignment = {vertical: 'middle', horizontal: 'center'}; if (cell.value == null) cell.value = '—'; }
      else if (type === 'date') { cell.numFmt = 'dd mmm yyyy'; cell.alignment = {vertical: 'middle', horizontal: 'center'}; }
      else if (type === 'money') { cell.numFmt = '#,##0'; }
      if (key === 'reference') { cell.font = font({bold: true, color: {argb: C.ink}}); cell.border = {...cell.border, left: {style: 'thick', color: {argb: m.font}}}; }
    });
  });
  if (!rows.length) { ws.mergeCells(6, 1, 6, last); ws.getCell(6, 1).value = 'No cases selected.'; ws.getCell(6, 1).font = font({italic: true, color: {argb: C.muted}}); }
  ws.autoFilter = {from: {row: 5, column: 1}, to: {row: Math.max(5, rows.length + 5), column: last}};
  ws.pageSetup = {paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: '4:5', margins: {left: 0.3, right: 0.3, top: 0.45, bottom: 0.55, header: 0.2, footer: 0.25}};

  // ---------- 3 · Stage x level ----------
  const mx = wb.addWorksheet('Stage x level', {views: [{showGridLines: false}], properties: {tabColor: {argb: 'FF2F5D58'}}});
  const levels = [...new Set([...Object.values(LEVELS), ...rows.map(x => x.target_study_level)])].filter(l => rows.some(x => x.target_study_level === l));
  const lv = levels.length ? levels : ['Not specified'];
  mx.columns = [{width: 30}, ...lv.map(() => ({width: 16})), {width: 12}];
  const mLast = lv.length + 2;
  band(mx, mLast, 'Stage by study level', subtitle, mode);
  const hdr = mx.getRow(5);
  ['Stage', ...lv, 'Total'].forEach((v, i) => { const c = hdr.getCell(i + 1); c.value = v; c.font = font({bold: true, color: {argb: C.white}, size: 10}); c.fill = solid(C.inkSoft); c.alignment = {horizontal: i ? 'center' : 'left', vertical: 'middle', wrapText: true, indent: i ? 0 : 1}; });
  hdr.height = 30;
  const maxCell = Math.max(1, ...STAGES.flatMap(s => lv.map(l => rows.filter(x => x.stage === s && x.target_study_level === l).length)));
  const heat = n => !n ? C.white : ['FFE3F0EE', 'FFC6E2DD', 'FF9CCBC3', 'FF6DB0A5', 'FF3F8F83'][Math.min(4, Math.floor(n / maxCell * 4.999))];
  STAGES.forEach((s, i) => {
    const m = stageMeta(s), rr = mx.getRow(6 + i);
    rr.getCell(1).value = s; rr.getCell(1).fill = solid(m.fill); rr.getCell(1).font = font({bold: true, color: {argb: m.font}}); rr.getCell(1).alignment = {indent: 1, vertical: 'middle'};
    let t = 0;
    lv.forEach((l, j) => { const n = rows.filter(x => x.stage === s && x.target_study_level === l).length; t += n; const c = rr.getCell(j + 2); c.value = n || null; c.fill = solid(heat(n)); c.font = font({bold: !!n, color: {argb: n / maxCell > 0.6 ? C.white : C.text}}); c.alignment = {horizontal: 'center', vertical: 'middle'}; });
    const tc = rr.getCell(mLast); tc.value = t; tc.font = font({bold: true}); tc.alignment = {horizontal: 'center'}; tc.fill = solid(C.goldSoft);
    for (let k = 1; k <= mLast; k++) rr.getCell(k).border = {bottom: thin(C.line), right: thin(C.line)};
    rr.height = 20;
  });
  const tr = mx.getRow(6 + STAGES.length);
  tr.getCell(1).value = 'Total'; lv.forEach((l, j) => { tr.getCell(j + 2).value = rows.filter(x => x.target_study_level === l).length; }); tr.getCell(mLast).value = total;
  for (let k = 1; k <= mLast; k++) { const c = tr.getCell(k); c.font = font({bold: true, color: {argb: C.ink}}); c.border = {top: {style: 'medium', color: {argb: C.ink}}}; c.alignment = {horizontal: k === 1 ? 'left' : 'center', indent: k === 1 ? 1 : 0}; }
  mx.pageSetup = {paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0};

  // ---------- 4 · Guide ----------
  const g = wb.addWorksheet('Guide', {views: [{showGridLines: false}], properties: {tabColor: {argb: 'FF55524B'}}});
  g.columns = [{width: 30}, {width: 18}, {width: 90}];
  band(g, 3, 'Guide to this report', subtitle, mode);
  let gr = 5;
  const section = text => { g.mergeCells(gr, 1, gr, 3); const c = g.getCell(gr, 1); c.value = text; c.font = font({bold: true, size: 12, color: {argb: C.ink}}); for (let k = 1; k <= 3; k++) g.getCell(gr, k).border = {bottom: {style: 'medium', color: {argb: C.gold}}}; g.getRow(gr).height = 22; gr++; };
  const line = (a, b, cc, style) => { const rr = g.getRow(gr); rr.getCell(1).value = a; rr.getCell(2).value = b; rr.getCell(3).value = cc; for (let k = 1; k <= 3; k++) { rr.getCell(k).font = font(); rr.getCell(k).alignment = {vertical: 'middle', wrapText: true}; rr.getCell(k).border = {bottom: thin(C.line)}; } if (style) style(rr); rr.height = 20; gr++; };
  section('Pipeline stages and colours');
  for (const s of STAGES) { const m = stageMeta(s); const meaning = (STATUS_LEGEND.find(([st]) => st === m.status) || [])[1] || ''; line(s, m.status, meaning, rr => { rr.getCell(1).fill = solid(m.fill); rr.getCell(1).font = font({bold: true, color: {argb: m.font}}); rr.getCell(2).fill = solid(m.fill); rr.getCell(2).font = font({color: {argb: m.font}}); }); }
  gr++;
  section('Readiness colours (declared information)');
  for (const [tone, label, meaning] of [['good', 'Green', 'Available / confirmed / completed, or IELTS 6.5 and above.'], ['mid', 'Amber', 'In progress or partial, or IELTS 5.5 – 6.0.'], ['bad', 'Red', 'Not available / not defined, or IELTS below 5.5.'], ['none', 'Grey', 'Not yet assessed or unknown.']]) line(label, '', meaning, rr => { rr.getCell(1).fill = solid(TRAFFIC[tone].fill); rr.getCell(1).font = font({bold: true, color: {argb: TRAFFIC[tone].font}}); });
  gr++;
  section('Columns');
  const defs = {reference: 'MUK Talent case reference. Quote it when asking about a student.', stage: 'Current step in the admissions journey.', status: 'Short status derived from the stage (same colour code).', country: 'Country where the student currently lives.', target_study_level: 'Level of study the student is applying for.', subject_interest: 'Subject or field the student wants to study.', intended_intake: 'Intake the student is aiming for.', target_university: 'Institution recorded as the current target.', target_course: 'Course recorded as the current target.', external_next_step: 'Next admissions step, written for partners.', english_test: 'English test declared by the student.', english_score: 'Declared IELTS overall band (or equivalent).', passport: 'Passport availability (declared).', school_status: 'Status of secondary studies (declared).', funding: 'Funding readiness (declared).', case_accepted_at: 'Date MUK Talent opened the case.', last_updated: 'Date of the latest change to the case.', first_name: 'Internal only.', last_name: 'Internal only.', email: 'Internal only.', whatsapp_phone_e164: 'Internal only.', residence_city: 'Internal only.', owner_name: 'MUK Talent employee responsible for the case.', next_action: 'Internal follow-up task.', next_action_at: 'Internal follow-up date.', budget_amount: 'Declared budget.', budget_currency: 'Budget currency.'};
  for (const [key, header, , group] of cols) line(header, group, defs[key] || '');
  gr++;
  section('About this report');
  for (const t of [`Prepared by ${preparedBy} on ${when}${recipient ? ' for ' + recipient : ''}.`, sample ? 'Illustrative portfolio prepared for partnership presentations.' : 'Only cases accepted by MUK Talent and not archived are included.', 'Stages and readiness are a progress indicator, not a guarantee of admission or enrolment.', partners ? 'Direct identifiers are excluded. The report is pseudonymised, not guaranteed anonymous.' : 'Contains personal data: confidential, internal use only.', 'Questions: agents@muktalent.com · muktalent.com']) { g.mergeCells(gr, 1, gr, 3); g.getCell(gr, 1).value = t; g.getCell(gr, 1).font = font({color: {argb: C.muted}}); g.getCell(gr, 1).alignment = {wrapText: true}; gr++; }
  g.pageSetup = {paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0};

  for (const sheet of wb.worksheets) {
    sheet.headerFooter.oddFooter = `&L&8MUK Talent · ${partners ? 'Partner report' : 'CONFIDENTIAL – internal'}&C&8${when}&R&8Page &P of &N`;
  }
  return wb.xlsx.writeBuffer();
}
