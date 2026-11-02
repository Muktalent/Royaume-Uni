// pipeline-reports-v16 · Informes: un flujo en 3 pasos.
// 1 Pipeline (revisar y gestionar casos) → 2 Preparar informe (Excel profesional o enlace) → 3 Enlaces enviados (vistas y retirada).
import {binary, dialog, field, display, demoRows} from './admin-experience.js';
import {linkHrCss} from './hr-common.js';

const E = (t, v, c) => { const n = document.createElement(t); if (v !== undefined) n.textContent = String(v); if (c) n.className = c; return n; };
const btn = (t, fn, cls = 'th-btn') => { const b = E('button', t, cls); b.type = 'button'; if (fn) b.onclick = fn; return b; };
const fmt = v => v ? new Intl.DateTimeFormat('es-ES', {day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'}).format(new Date(v)) : '—';
const COUNTRY_ES = (() => { try { return new Intl.DisplayNames(['es'], {type: 'region'}); } catch { return null; } })();
const countryEs = c => /^[A-Z]{2}$/.test(String(c || '')) ? (COUNTRY_ES?.of(c) || c) : '—';
const STATUS_ES = {New: 'Nuevo', 'In progress': 'En curso', Submitted: 'Enviado', Ready: 'Oferta', 'Action needed': 'Acción requerida', Completed: 'Matriculado', 'On hold': 'En pausa', Closed: 'Cerrado'};
const STAGE_ES = {'Assessment': 'Evaluación', 'Documents pending': 'Documentos pendientes', 'Application preparation': 'Preparando solicitud', 'Application submitted': 'Solicitud enviada', 'Offer received': 'Oferta recibida', 'Deposit pending': 'Depósito pendiente', 'Enrolled': 'Matriculado', 'On hold': 'En pausa', 'Closed': 'Cerrado'};

export async function renderAdminPipeline({api, getState, openRecord, host}) {
  linkHrCss();
  let page = 1, query = '', stage = '', result = null, busy = false, demo = false, step = 'pipeline', loadEpoch = 0;
  const selected = new Set();
  const report = {source: 'real', audience: 'partners', scope: 'filter', recipient: '', title: 'Student recruitment pipeline', days: 14};
  host.replaceChildren(); host.className = 'admin-report-view th-root pr-root'; host.lang = 'es';

  const notice = E('p', '', 'th-msg'); notice.setAttribute('role', 'status');
  const kpis = E('div', undefined, 'pr-kpis');
  const steps = E('nav', undefined, 'pr-steps'); steps.setAttribute('aria-label', 'Pasos del informe');
  const STEPS = [['pipeline', '1', 'Revisar pipeline', 'Casos aceptados y su etapa'], ['report', '2', 'Preparar informe', 'Excel o enlace para universidades'], ['links', '3', 'Enlaces enviados', 'Vistas y retirar acceso']];
  const stepBtns = {};
  for (const [id, n, t, s] of STEPS) { const b = E('button', undefined, 'pr-step'); b.type = 'button'; const txt = E('span'); txt.append(E('b', t), E('small', s)); b.append(E('i', n), txt); b.onclick = () => go(id); stepBtns[id] = b; steps.append(b); }
  const view = E('div', undefined, 'pr-view');
  host.append(kpis, steps, notice, view);

  function message(text, error = false) { if (!host.isConnected) return; notice.textContent = text; notice.className = 'th-msg' + (error ? ' th-error' : text ? ' th-ok' : ''); }
  function go(id) { step = id; for (const [k, b] of Object.entries(stepBtns)) { b.classList.toggle('is-on', k === id); if (k === id) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); } message(''); paint(); }
  const tone = st => result?.stage_meta?.[st]?.tone || 'grey', statusOf = st => result?.stage_meta?.[st]?.status || '—';

  async function load() {
    if (busy) return; const epoch = ++loadEpoch; busy = true;
    try {
      const p = new URLSearchParams({page: String(page)}); if (query) p.set('q', query); if (stage) p.set('stage', stage);
      const r = await api('/api/admin-pipeline?' + p); if (epoch !== loadEpoch || !host.isConnected) return;
      result = r; paintKpis(); paint();
    } catch (e) { message(e.message, true); } finally { busy = false; }
  }

  function paintKpis() {
    const c = result.stage_counts || {}, sum = keys => keys.reduce((a, k) => a + (c[k] || 0), 0);
    const total = Object.values(c).reduce((a, b) => a + b, 0);
    const active = sum(['Assessment', 'Documents pending', 'Application preparation', 'Application submitted', 'Deposit pending']);
    kpis.replaceChildren();
    for (const [v, l, t] of [[total, 'Casos aceptados', 'ink'], [active, 'En proceso', 'amber'], [sum(['Offer received']), 'Con oferta', 'green'], [sum(['Enrolled']), 'Matriculados', 'teal']]) { const k = E('article', undefined, 'pr-kpi'); k.dataset.tone = t; k.append(E('strong', v), E('span', l)); kpis.append(k); }
  }

  function paint() {
    if (!result || !host.isConnected) { view.replaceChildren(E('p', 'Cargando pipeline…', 'th-muted th-pad')); return; }
    view.replaceChildren();
    if (step === 'pipeline') pipelineStep(); else if (step === 'report') reportStep(); else linksStep();
  }

  // ------------------------------------------------ Paso 1
  function pipelineStep() {
    const board = E('div', undefined, 'admin-stage-board pr-board');
    for (const st of result.stages) { const n = result.stage_counts?.[st]; const b = E('button', undefined, 'admin-stage-card'); b.type = 'button'; b.dataset.tone = tone(st); b.setAttribute('aria-pressed', String(stage === st)); if (stage === st) b.classList.add('active'); b.append(E('span', STATUS_ES[statusOf(st)] || statusOf(st), 'admin-stage-status'), E('strong', n == null ? '—' : String(n)), E('small', STAGE_ES[st] || st)); b.title = st; b.onclick = () => { if (busy) return; stage = stage === st ? '' : st; page = 1; load(); }; board.append(b); }
    const tools = E('form', undefined, 'th-tools'), search = E('input'); search.type = 'search'; search.value = query; search.placeholder = 'Buscar referencia, nombre, institución, convocatoria…'; search.maxLength = 100; search.setAttribute('aria-label', 'Buscar casos');
    const apply = E('button', 'Buscar', 'th-btn'); apply.type = 'submit';
    tools.onsubmit = e => { e.preventDefault(); query = search.value.trim(); page = 1; load(); };
    const addMenu = E('details', undefined, 'pr-menu'), sum = E('summary', 'Añadir casos', 'th-btn th-primary'), menu = E('div', undefined, 'pr-menu-list');
    menu.append(btn('Incorporar un lead existente', () => { addMenu.open = false; acceptExisting(); }, 'th-btn th-ghost'), btn('Crear caso manual', () => { addMenu.open = false; manual(); }, 'th-btn th-ghost'));
    addMenu.append(sum, menu);
    const demoB = btn(demo ? 'Salir del ejemplo' : 'Ver ejemplo', () => { demo = !demo; paint(); }, 'th-btn th-ghost');
    tools.append(search, apply, demoB, addMenu);
    const filterNote = E('p', '', 'th-muted pr-filter-note');
    filterNote.textContent = (stage ? `Filtrado por etapa «${STAGE_ES[stage] || stage}». ` : '') + (query ? `Búsqueda «${query}». ` : '') + `${result.total} caso(s).` + (stage || query ? '' : ' Toca una etapa para filtrar.');
    if (stage || query) filterNote.append(' ', btn('Quitar filtros', () => { stage = ''; query = ''; page = 1; load(); }, 'th-link'));
    view.append(board, tools, filterNote);
    if (demo) view.append(E('p', 'EJEMPLO · datos ficticios para presentaciones. No se exportan ni se comparten.', 'admin-demo-banner'));
    // Tabla
    const rows = demo ? demoRows(result.stages) : result.data;
    const cols = [['reference', 'Referencia'], ['__name', 'Estudiante'], ['stage', 'Etapa'], ['target_study_level', 'Nivel'], ['target_university', 'Institución objetivo'], ['target_course', 'Curso'], ['intended_intake', 'Convocatoria'], ['__country', 'País'], ['last_updated', 'Actualizado']];
    const wrap = E('div', undefined, 'admin-sheet-wrap pr-sheet'), table = E('table', undefined, 'admin-sheet'), head = E('thead'), tr = E('tr');
    const all = E('input'); all.type = 'checkbox'; all.setAttribute('aria-label', 'Seleccionar esta página'); all.disabled = demo || !rows.length; all.checked = !demo && rows.length > 0 && rows.every(r => selected.has(r.candidate_id));
    all.onchange = () => { for (const r of rows) { if (all.checked) { if (selected.size < 300) selected.add(r.candidate_id); } else selected.delete(r.candidate_id); } paint(); };
    const thSel = E('th'); thSel.append(all); thSel.className = 'admin-col-select'; tr.append(thSel);
    for (const [, l] of cols) { const th = E('th', l); th.scope = 'col'; tr.append(th); }
    tr.append(E('th', '')); head.append(tr);
    const body = E('tbody');
    for (const row of rows) {
      const line = E('tr'); line.dataset.tone = tone(row.stage);
      const c = E('td', undefined, 'admin-col-select'), ck = E('input'); ck.type = 'checkbox'; ck.disabled = demo; ck.checked = !demo && selected.has(row.candidate_id); ck.setAttribute('aria-label', 'Seleccionar ' + row.reference);
      ck.onchange = () => { if (ck.checked && selected.size >= 300) { ck.checked = false; message('Máximo 300 casos por informe.', true); return; } ck.checked ? selected.add(row.candidate_id) : selected.delete(row.candidate_id); paintSelection(); };
      c.append(ck); line.append(c);
      for (const [k] of cols) {
        const td = E('td');
        if (k === 'stage') { const b = E('span', STAGE_ES[row.stage] || row.stage, 'admin-stage-badge'); b.dataset.tone = tone(row.stage); td.append(b); }
        else if (k === '__name') td.textContent = [row.first_name, row.last_name].filter(Boolean).join(' ') || '—';
        else if (k === '__country') td.textContent = countryEs(row.residence_country_code);
        else { td.textContent = k === 'last_updated' ? (row[k] ? new Date(row[k]).toLocaleDateString('es-ES') : '—') : display(row[k], k); if (k === 'reference') td.className = 'admin-col-ref'; }
        line.append(td);
      }
      const ctl = E('td', undefined, 'pr-row-actions');
      if (demo) ctl.append(E('span', 'Ejemplo', 'admin-demo-tag')); else ctl.append(btn('Gestionar', () => manage(row), 'th-btn th-sm'), btn('Expediente', () => openRecord('candidates', row.candidate_id), 'th-btn th-ghost th-sm'));
      line.append(ctl); body.append(line);
    }
    if (!rows.length) { const e = E('tr'), td = E('td'); td.colSpan = cols.length + 2; td.className = 'th-pad'; td.append(E('strong', 'Aún no hay casos con este filtro. '), E('span', 'Usa «Añadir casos» o «Ver ejemplo» para enseñar la pipeline.')); e.append(td); body.append(e); }
    table.append(head, body); wrap.append(table); view.append(wrap);
    const pager = E('div', undefined, 'pagination'), prev = btn('Anterior', () => { page--; load(); }), next = btn('Siguiente', () => { page++; load(); });
    prev.disabled = demo || page <= 1; next.disabled = demo || page * 50 >= result.total;
    pager.append(E('span', 'Página ' + page + ' de ' + Math.max(1, Math.ceil(result.total / 50))), prev, next); view.append(pager);
    const bar = E('div', undefined, 'pr-next'), sel = E('span', '', 'pr-sel');
    bar.append(sel, btn('Limpiar selección', () => { selected.clear(); paint(); }, 'th-btn th-ghost'), btn('Siguiente: preparar informe →', () => go('report'), 'th-btn th-primary'));
    view.append(bar);
    function paintSelection() { sel.textContent = selected.size ? `${selected.size} caso(s) seleccionados (puedes seleccionar en varias páginas)` : 'Sin selección: el informe incluirá todos los casos del filtro actual.'; bar.querySelector('.th-ghost').hidden = !selected.size; }
    paintSelection();
  }

  // ------------------------------------------------ Paso 2
  function reportStep() {
    const grid = E('div', undefined, 'pr-report');
    const left = E('section', undefined, 'th-card');
    left.append(E('h3', 'Configura el informe'));
    const choice = (name, options, current, onChange) => {
      const g = E('div', undefined, 'pr-choices'); g.setAttribute('role', 'radiogroup');
      for (const [v, t, s] of options) { const l = E('label', undefined, 'pr-choice'), r = E('input'); r.type = 'radio'; r.name = name; r.value = v; r.checked = v === current; r.onchange = () => { onChange(v); paint(); }; const tx = E('span'); tx.append(E('b', t), E('small', s)); l.append(r, tx); g.append(l); }
      return g;
    };
    left.append(E('p', 'Datos del informe', 'pr-label'), choice('src', [['real', 'Cartera real', `Casos aceptados de la pipeline (${result.total}).`], ['sample', 'Cartera de muestra · 15 estudiantes', 'Perfiles del Magreb (Marruecos, Argelia, Túnez) en todas las etapas, listos para presentar a una universidad.']], report.source, v => { report.source = v; }));
    left.append(E('p', 'Destino', 'pr-label'), choice('aud', [['partners', 'Universidad o partner', 'Sin nombres, teléfonos, emails ni notas internas. Listo para buscar partnerships.'], ['internal', 'Uso interno', 'Incluye contacto del estudiante y próxima acción interna. Solo para el equipo.']], report.audience, v => { report.audience = v; }));
    const filtTxt = (stage ? `etapa «${STAGE_ES[stage] || stage}»` : 'todas las etapas') + (query ? `, búsqueda «${query}»` : '');
    if (report.source !== 'sample') left.append(E('p', 'Casos incluidos', 'pr-label'), choice('scope', [['filter', `Todos los del filtro actual (${result.total})`, 'Filtro: ' + filtTxt + '. Máx. 300 casos.'], ['selected', `Solo los seleccionados (${selected.size})`, selected.size ? 'Seleccionados en el paso 1.' : 'Vuelve al paso 1 para marcar casos.']], selected.size ? report.scope : 'filter', v => { report.scope = v; }));
    if (!selected.size) report.scope = 'filter';
    const form = E('div', undefined, 'th-grid');
    const recipient = field(form, 'pr_recipient', report.audience === 'partners' ? 'Universidad / institución destinataria' : 'Destinatario (opcional)', 'text', null, report.recipient); recipient.maxLength = 200; recipient.placeholder = 'Ej. University of Leeds · International Office'; recipient.oninput = () => { report.recipient = recipient.value; };
    const title = field(form, 'pr_title', 'Título del informe', 'text', null, report.title); title.maxLength = 200; title.oninput = () => { report.title = title.value; };
    for (const w of form.children) w.classList.add('th-field');
    left.append(form);
    const actions = E('div', undefined, 'pr-actions');
    const dl = btn('Descargar Excel', () => download(), 'th-btn th-primary');
    actions.append(dl);
    if (report.audience === 'partners') actions.append(btn('Crear enlace para enviar', () => createLink(), 'th-btn'));
    left.append(actions);
    const right = E('section', undefined, 'th-card pr-preview');
    right.append(E('h3', 'Qué contiene el Excel'));
    const ul = E('ul', undefined, 'pr-sheets');
    const items = report.audience === 'partners'
      ? [['Summary', 'Portada con KPIs, embudo por etapa y perfil de los estudiantes (nivel, área, convocatoria, país).'], ['Case pipeline', 'Una fila por caso, agrupada por etapa, con código de colores, semáforos de preparación, filtros y paneles fijos.'], ['Stage × level', 'Mapa de calor de etapas por nivel de estudios.'], ['Guide', 'Leyenda de colores, definiciones y nota de privacidad.']]
      : [['Summary', 'KPIs y embudo por etapa.'], ['Case pipeline', 'Datos de contacto del estudiante y próxima acción interna, con colores por etapa.'], ['Stage × level', 'Mapa de calor.'], ['Guide', 'Leyenda y definiciones.']];
    for (const [t, d] of items) { const li = E('li'); li.append(E('b', t), E('span', d)); ul.append(li); }
    right.append(ul);
    const legend = E('div', undefined, 'admin-legend');
    for (const st of result.stages) { const i = E('span', undefined, 'admin-legend-item'); i.dataset.tone = tone(st); i.append(E('i', undefined, 'admin-dot'), E('span', STAGE_ES[st] || st)); legend.append(i); }
    right.append(E('p', 'Código de colores por etapa', 'pr-label'), legend);
    if (report.audience === 'partners') right.append(E('p', 'Todo el Excel se genera en inglés (convocatorias, materias y estados se traducen automáticamente). Las referencias son seudónimos; revisa los textos de curso y próximo paso antes de enviar.', 'th-hint'));
    grid.append(left, right); view.append(grid);
  }

  // Cuerpo común: cartera de muestra o casos reales seleccionados.
  async function payload() {
    if (report.source === 'sample') return {body: {sample: true}, count: 15};
    const ids = await caseIds(); return {body: {ids}, count: ids.length};
  }
  async function caseIds() {
    if (demo) throw Error('El ejemplo no se exporta. Sal del ejemplo en el paso 1.');
    if (report.scope === 'selected' && selected.size) return [...selected];
    const p = new URLSearchParams(); if (query) p.set('q', query); if (stage) p.set('stage', stage);
    const r = await api('/api/admin-pipeline/ids?' + p);
    if (!r.ids.length) throw Error('No hay casos en el filtro actual.');
    if (r.truncated) message('El filtro tiene más de 300 casos: se incluyen los 300 más recientes.', true);
    return r.ids;
  }
  async function download() {
    try {
      message('Preparando el Excel…');
      const {body, count} = await payload();
      await binary(getState, '/api/admin-pipeline/export', {method: 'POST', body: JSON.stringify({...body, mode: report.audience, title: (report.title || '').trim() || undefined, recipient: (report.recipient || '').trim() || undefined})});
      message(`Excel descargado con ${count} caso(s).`);
    } catch (e) { message(e.message, true); }
  }
  async function createLink() {
    const recipient = (report.recipient || '').trim(), title = (report.title || '').trim();
    if (!recipient) { message('Indica la universidad o institución destinataria.', true); view.querySelector('#report-field-pr_recipient')?.focus(); return; }
    if (!title) { message('Indica un título.', true); return; }
    let pl; try { pl = await payload(); } catch (e) { message(e.message, true); return; }
    const ids = {length: pl.count};
    const modal = dialog('Crear enlace para ' + recipient), form = E('form');
    const days = field(form, 'days', 'El enlace caduca en', 'select', [['7', '7 días'], ['14', '14 días'], ['30', '30 días']], String(report.days));
    const l = E('label', undefined, 'th-check'), ck = E('input'); ck.type = 'checkbox'; ck.required = true; l.append(ck, E('span', `He revisado los ${ids.length} casos y estoy autorizado a compartir esta información con ${recipient}.`));
    const msg = E('p', 'Quien tenga el enlace verá el informe (sin datos personales) y podrá descargar el Excel hasta que caduque o lo retires.', 'th-hint'), save = E('button', 'Crear enlace', 'th-btn th-primary'); save.type = 'submit';
    form.append(l, msg, save); modal.body.append(form);
    form.onsubmit = async e => {
      e.preventDefault(); if (!form.reportValidity()) return;
      report.days = Number(days.value); modal.lock(true); save.disabled = true;
      try {
        const r = await api('/api/admin-pipeline/shares', {method: 'POST', body: JSON.stringify({...pl.body, title, recipient, days: report.days, review_confirmed: true})});
        const link = E('input', undefined, 'pr-link'); link.readOnly = true; link.value = r.url; link.setAttribute('aria-label', 'Enlace del informe');
        const copy = btn('Copiar enlace', async () => { try { await navigator.clipboard.writeText(r.url); copy.textContent = 'Copiado'; } catch { link.select(); } }, 'th-btn th-primary');
        const mail = E('a', 'Abrir en el correo', 'th-btn'); mail.href = 'mailto:?subject=' + encodeURIComponent(title + ' · MUK Talent') + '&body=' + encodeURIComponent('Dear colleagues,\n\nPlease find our current student recruitment pipeline here:\n' + r.url + '\n\nThe link expires on ' + new Date(r.expires_at).toLocaleDateString('en-GB') + '.\n\nKind regards,\nMUK Talent');
        const row = E('div', undefined, 'th-inline'); row.append(copy, mail);
        form.replaceChildren(E('h3', 'Enlace creado'), link, row, E('p', 'Caduca el ' + fmt(r.expires_at) + '. Guarda el enlace ahora: por seguridad no se puede volver a mostrar. Puedes retirarlo en «Enlaces enviados».', 'th-hint'), btn('Ver enlaces enviados', () => { modal.d.remove(); go('links'); }));
      } catch (err) { msg.className = 'th-msg th-error'; msg.textContent = err.message; save.disabled = false; }
      finally { modal.lock(false); }
    };
  }

  // ------------------------------------------------ Paso 3
  async function linksStep() {
    const card = E('section', undefined, 'th-card'); card.append(E('h3', 'Enlaces enviados'), E('p', 'Retirar un enlace lo desactiva al instante. No elimina copias que ya se hayan descargado.', 'th-muted'));
    const list = E('div', undefined, 'pr-links'); list.append(E('p', 'Cargando…', 'th-muted th-pad')); card.append(list);
    const other = E('section', undefined, 'th-card'); other.append(E('h3', 'Otras exportaciones'));
    other.append(btn('CRM completo (uso interno)', async () => { if (!confirm('Este archivo contiene datos personales de todo el CRM. ¿Descargar para uso interno?')) return; try { await binary(getState, '/api/exports/internal'); } catch (e) { message(e.message, true); } }, 'th-btn'));
    view.append(card, other);
    try {
      const r = await api('/api/admin-pipeline/shares'); list.replaceChildren();
      if (!r.data.length) list.append(E('p', 'Todavía no has creado enlaces. Créalos en el paso 2.', 'th-muted th-pad'));
      for (const s of r.data) {
        const row = E('article', undefined, 'pr-link-row'), main = E('div');
        const live = !s.revoked_at && new Date(s.expires_at) > new Date();
        main.append(E('b', s.recipient || s.title), E('small', [s.title, s.count != null ? s.count + ' casos' : '', 'creado ' + fmt(s.created_at)].filter(Boolean).join(' · ')));
        const stats = E('div', undefined, 'pr-link-stats');
        stats.append(E('span', s.view_count == null ? 'Vistas: —' : `${s.view_count} vista(s)`), E('small', s.last_viewed_at ? 'Última: ' + fmt(s.last_viewed_at) : 'Aún no abierto'));
        const st = E('div'), ch = E('span', s.revoked_at ? 'Retirado' : live ? 'Activo hasta ' + new Date(s.expires_at).toLocaleDateString('es-ES') : 'Caducado', 'th-chip'); ch.dataset.tone = s.revoked_at ? 'red' : live ? 'green' : 'grey'; st.append(ch);
        const act = E('div');
        if (live) act.append(btn('Retirar enlace', async () => { if (!confirm(`¿Retirar el enlace enviado a ${s.recipient}? Dejará de funcionar inmediatamente.`)) return; try { await api('/api/admin-pipeline/shares/' + s.id + '/revoke', {method: 'POST'}); message('Enlace retirado.'); paint(); } catch (e) { message(e.message, true); } }, 'th-btn th-danger-btn'));
        row.append(main, stats, st, act); list.append(row);
      }
    } catch (e) { list.replaceChildren(E('p', e.message, 'th-error th-pad')); }
  }

  // ------------------------------------------------ Gestión de casos (sin cambios funcionales)
  function manage(row) {
    const modal = dialog('Gestionar ' + row.reference), form = E('form'), grid = E('div', undefined, 'form-grid');
    const st = field(grid, 'stage', 'Etapa académica', 'select', result.stages.map(s => [s, (STAGE_ES[s] || s) + ' · ' + s]), row.stage), university = field(grid, 'target_university', 'Institución objetivo', 'text', null, row.target_university), course = field(grid, 'target_course', 'Curso objetivo', 'text', null, row.target_course), next = field(grid, 'external_next_step', 'Próximo paso (visible en el informe externo)', 'textarea', null, row.external_next_step);
    university.maxLength = 200; course.maxLength = 300; next.maxLength = 500;
    const msg = E('p', 'No incluyas nombres ni información privada en los campos externos.', 'notice'), save = E('button', 'Guardar', 'primary'); save.type = 'submit';
    form.append(grid, msg, save); modal.body.append(form);
    form.onsubmit = async e => { e.preventDefault(); modal.lock(true); save.disabled = true; try { await api('/api/admin-pipeline/' + row.candidate_id, {method: 'PATCH', body: JSON.stringify({stage: st.value, target_university: university.value.trim(), target_course: course.value.trim(), external_next_step: next.value.trim(), version: row.version})}); modal.d.remove(); await load(); } catch (error) { msg.textContent = error.message; } finally { modal.lock(false); save.disabled = false; } };
  }
  async function acceptExisting() {
    const modal = dialog('Incorporar un lead existente'), form = E('form'), q = field(form, 'search', 'Buscar en leads'), choice = E('select'), msg = E('p', 'Busca el lead que administración acepta gestionar.', 'muted'), save = E('button', 'Aceptar como caso', 'primary');
    const find = btn('Buscar', async () => { find.disabled = true; choice.disabled = true; try { const p = new URLSearchParams({page: '1', page_size: '100'}); if (q.value.trim()) p.set('q', q.value.trim()); const r = await api('/api/candidates?' + p); choice.replaceChildren(); const rows = r.data.filter(c => !c.case_accepted_at); for (const c of rows) choice.append(new Option(c.reference + ' · ' + c.first_name + ' ' + c.last_name, c.id)); msg.textContent = rows.length ? 'Selecciona el lead. Se incorporará una sola vez a la pipeline.' : 'No hay leads pendientes entre los primeros 100 resultados. Ajusta la búsqueda.'; save.disabled = !rows.length; } catch (error) { msg.textContent = error.message; } finally { find.disabled = false; choice.disabled = false; } }, 'secondary');
    choice.setAttribute('aria-label', 'Lead a aceptar'); save.type = 'submit'; save.disabled = true;
    form.append(find, choice, msg, save); modal.body.append(form);
    form.onsubmit = async e => { e.preventDefault(); if (!choice.value || !confirm('¿Aceptar este lead como caso gestionado por MUK Talent?')) return; modal.lock(true); save.disabled = true; try { await api('/api/admin-pipeline/accept', {method: 'POST', body: JSON.stringify({candidate_id: choice.value})}); modal.d.remove(); page = 1; await load(); } catch (error) { msg.textContent = error.message; } finally { modal.lock(false); save.disabled = false; } };
  }
  async function manual() {
    const modal = dialog('Nuevo caso manual · solo administración'), form = E('form'), grid = E('div', undefined, 'form-grid'), inputs = {};
    for (const [key, label, type, options] of [['first_name', 'Nombre', 'text'], ['last_name', 'Apellidos', 'text'], ['email', 'Correo', 'email'], ['phone', 'Teléfono internacional (+...)', 'tel'], ['city', 'Ciudad', 'text'], ['study_level', 'Nivel previsto', 'select', [['', 'Sin definir'], ['foundation', 'Foundation'], ['undergraduate', 'Undergraduate'], ['postgraduate', 'Postgraduate'], ['phd', 'PhD'], ['english_course', 'English course'], ['other', 'Other']]], ['subject', 'Área de interés', 'text'], ['intake', 'Convocatoria prevista', 'text']]) { inputs[key] = field(grid, key, label, type, options || null); inputs[key].required = ['first_name', 'last_name'].includes(key); }
    inputs.first_name.maxLength = inputs.last_name.maxLength = 150; inputs.email.maxLength = 320; inputs.phone.maxLength = 16; inputs.city.maxLength = 200; inputs.subject.maxLength = 500; inputs.intake.maxLength = 100;
    inputs.assigned_to = field(grid, 'assigned_to', 'Responsable', 'select', [['', 'Sin asignar']]);
    try { const r = await api('/api/staff?page=1&page_size=100'); for (const s of r.data.filter(s => s.active)) inputs.assigned_to.append(new Option(s.full_name, s.user_id)); } catch {}
    const msg = E('p', 'Se creará el candidato y se aceptará como caso en una sola operación.', 'notice'), save = E('button', 'Crear y aceptar caso', 'primary'); save.type = 'submit';
    form.append(grid, msg, save); modal.body.append(form);
    form.onsubmit = async e => { e.preventDefault(); if (!form.reportValidity() || !confirm('¿Crear este expediente y aceptarlo como caso?')) return; modal.lock(true); save.disabled = true; try { await api('/api/admin-pipeline/manual', {method: 'POST', body: JSON.stringify(Object.fromEntries(Object.entries(inputs).map(([k, v]) => [k, v.value.trim()])))}); modal.d.remove(); page = 1; await load(); } catch (error) { msg.textContent = error.message; } finally { modal.lock(false); save.disabled = false; } };
  }

  go('pipeline');
  await load();
}
