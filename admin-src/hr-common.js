// hr-common-v16 · Utilidades compartidas por Equipo (admin) y Documentos (empleado):
// autocompletado, subida a Storage con URL firmada, visor de PDF/imagen y lienzo de firma.
import {createClient} from '@supabase/supabase-js';
import {E, linkCss} from './gp-ui.js';

export const CSS_VERSION = '23.0.0';
export function linkHrCss() { linkCss('teamHrCss', '/admin/team-hr.css?v=' + CSS_VERSION); }

export const norm = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

let storageClient = null;
async function storage() {
  if (storageClient) return storageClient;
  const r = await fetch('/api/public-config', {cache: 'no-store'});
  if (!r.ok) throw Error('Upload configuration unavailable.');
  const cfg = await r.json();
  storageClient = createClient(cfg.supabaseUrl, cfg.supabasePublicKey, {auth: {persistSession: false, autoRefreshToken: false, detectSessionInUrl: false}});
  return storageClient;
}
export async function putFile(started, file) {
  const s = await storage();
  const r = await s.storage.from('mt-employee-private').uploadToSignedUrl(started.path, started.token, file, {contentType: file.type});
  if (r.error) throw Error('Upload interrupted. Try again.');
}

// Reescala la foto (máx. 1000 px, JPEG) para que siempre quepa en el límite de 2 MB.
export async function preparePhoto(file) {
  if (!/^image\/(jpeg|png)$/.test(file.type)) throw Error('La foto debe ser JPG o PNG.');
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1000 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale); canvas.height = Math.round(bmp.height * scale);
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.88));
    if (blob && blob.size <= 2 * 1024 * 1024) return new File([blob], 'photo.jpg', {type: 'image/jpeg'});
  } catch { /* se usa el archivo original */ }
  if (file.size > 2 * 1024 * 1024) throw Error('La foto no puede superar 2 MB.');
  return file;
}

// Autocompletado accesible: primero coincidencias por inicio, luego por contenido.
export function combo({input, options, onPick, max = 8, label = 'Sugerencias'}) {
  const wrap = E('div', undefined, 'th-combo');
  input.replaceWith?.(wrap);
  const list = E('ul', undefined, 'th-combo-list');
  const id = 'thc' + Math.random().toString(36).slice(2, 8);
  list.id = id; list.setAttribute('role', 'listbox'); list.setAttribute('aria-label', label); list.hidden = true;
  input.setAttribute('role', 'combobox'); input.setAttribute('aria-autocomplete', 'list'); input.setAttribute('aria-expanded', 'false'); input.setAttribute('aria-controls', id); input.autocomplete = 'off';
  wrap.append(input, list);
  let items = [], active = -1;
  const close = () => { list.hidden = true; input.setAttribute('aria-expanded', 'false'); active = -1; };
  const paint = () => {
    list.replaceChildren();
    items.forEach((o, i) => {
      const li = E('li', o.label, 'th-combo-item'); li.id = id + '-' + i; li.setAttribute('role', 'option'); li.setAttribute('aria-selected', String(i === active));
      if (o.hint) li.append(E('small', o.hint));
      li.onmousedown = e => { e.preventDefault(); pick(i); };
      list.append(li);
    });
    list.hidden = !items.length; input.setAttribute('aria-expanded', String(!!items.length));
    if (active >= 0) input.setAttribute('aria-activedescendant', id + '-' + active); else input.removeAttribute('aria-activedescendant');
  };
  const filter = () => {
    const q = norm(input.value);
    if (!q) { items = []; paint(); return; }
    const all = typeof options === 'function' ? options() : options;
    const starts = [], contains = [];
    for (const o of all) { const keys = [o.label, ...(o.keys || [])].map(norm); if (keys.some(k => k.startsWith(q) || k.split(/[\s(-]+/).some(w => w.startsWith(q)))) starts.push(o); else if (keys.some(k => k.includes(q))) contains.push(o); }
    items = [...starts, ...contains].slice(0, max); active = items.length ? 0 : -1; paint();
  };
  const pick = i => { const o = items[i]; if (!o) return; close(); onPick(o); };
  input.addEventListener('input', filter);
  input.addEventListener('focus', () => { if (input.value) filter(); });
  input.addEventListener('blur', () => setTimeout(close, 120));
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' && items.length) { e.preventDefault(); active = (active + 1) % items.length; paint(); }
    else if (e.key === 'ArrowUp' && items.length) { e.preventDefault(); active = (active - 1 + items.length) % items.length; paint(); }
    else if (e.key === 'Enter' && !list.hidden && active >= 0) { e.preventDefault(); pick(active); }
    else if (e.key === 'Escape') close();
  });
  return {wrap, close, refresh: filter};
}

// Visor de documentos v23: PDF dibujado página a página con pdf.js (todas las páginas también en iPhone),
// imágenes en lienzo y modo «solo lectura» sin descargar, imprimir ni abrir en otra pestaña.
const PDFJS = '/assets/vendor/pdfjs/';
let pdfjsLib = null;
async function loadPdfJs() {
  if (pdfjsLib) return pdfjsLib;
  const url = PDFJS + 'pdf.min.js';
  const lib = await import(url);
  lib.GlobalWorkerOptions.workerSrc = PDFJS + 'pdf.worker.min.js';
  return (pdfjsLib = lib);
}
const isPdf = (blob, r) => blob.type === 'application/pdf' || r?.mime === 'application/pdf';

async function renderPdf(stage, blob, {onEnd, labels}) {
  const lib = await loadPdfJs();
  const doc = await lib.getDocument({data: new Uint8Array(await blob.arrayBuffer()), isEvalSupported: false, enableScripting: false, standardFontDataUrl: PDFJS + 'standard_fonts/', wasmUrl: PDFJS + 'wasm/'}).promise;
  const pages = E('div', undefined, 'th-pages'); stage.replaceChildren(pages);
  let zoom = 1, ended = false;
  const slots = [];
  for (let n = 1; n <= doc.numPages; n++) { const slot = E('div', undefined, 'th-page'); slot.dataset.page = n; slot.setAttribute('aria-label', labels.page + ' ' + n); pages.append(slot); slots.push(slot); }
  const draw = async slot => {
    const n = +slot.dataset.page, page = await doc.getPage(n);
    const width = Math.max(240, pages.clientWidth - 32) * zoom, base = page.getViewport({scale: 1});
    const scale = width / base.width, ratio = Math.min(window.devicePixelRatio || 1, 2), vp = page.getViewport({scale: scale * ratio});
    const canvas = E('canvas'); canvas.width = Math.floor(vp.width); canvas.height = Math.floor(vp.height);
    canvas.style.width = Math.floor(vp.width / ratio) + 'px'; canvas.style.height = Math.floor(vp.height / ratio) + 'px';
    await page.render({canvas, viewport: vp}).promise;
    slot.replaceChildren(canvas); slot.dataset.done = '1'; slot.style.minHeight = '';
  };
  const sizeSlots = async () => { const first = await doc.getPage(1), base = first.getViewport({scale: 1}); const h = (Math.max(240, pages.clientWidth - 32) * zoom) * base.height / base.width; for (const s of slots) if (!s.dataset.done) s.style.minHeight = Math.round(h) + 'px'; };
  await sizeSlots();
  const io = new IntersectionObserver(entries => {
    for (const e of entries) if (e.isIntersecting) {
      const slot = e.target; if (!slot.dataset.busy) { slot.dataset.busy = '1'; draw(slot).catch(() => slot.replaceChildren(E('p', labels.fail, 'th-error th-center'))); }
    }
  }, {root: pages, rootMargin: '600px 0px'});
  for (const s of slots) io.observe(s);
  // «Fin del documento» solo cuando la última página se ve de verdad en pantalla (no por precarga).
  const endIo = new IntersectionObserver(entries => { if (!ended && entries.some(e => e.isIntersecting)) { ended = true; endIo.disconnect(); onEnd?.(); } }, {root: pages, threshold: .35});
  endIo.observe(slots[slots.length - 1]);
  const redraw = async () => { for (const s of slots) { delete s.dataset.done; delete s.dataset.busy; s.replaceChildren(); io.unobserve(s); } await sizeSlots(); for (const s of slots) io.observe(s); };
  return {pages: doc.numPages, zoom: async d => { zoom = Math.min(3, Math.max(.5, +(zoom + d).toFixed(2))); await redraw(); return zoom; }, destroy: () => { io.disconnect(); endIo.disconnect(); doc.destroy(); }};
}

async function renderImage(stage, blob, {viewOnly, title, onEnd, src}) {
  if (!viewOnly) { const img = E('img'); img.alt = title; img.src = src; stage.replaceChildren(img); onEnd?.(); return {pages: 1}; }
  const bmp = await createImageBitmap(blob), canvas = E('canvas'); canvas.width = bmp.width; canvas.height = bmp.height;
  canvas.getContext('2d').drawImage(bmp, 0, 0); canvas.className = 'th-img-canvas'; canvas.setAttribute('aria-label', title);
  stage.replaceChildren(canvas); onEnd?.(); return {pages: 1};
}

export async function openViewer({title, subtitle = '', load, actions = [], lang = 'es'}) {
  linkHrCss();
  const t = lang === 'es'
    ? {loading: 'Cargando documento…', close: 'Cerrar', open: 'Abrir en otra pestaña', download: 'Descargar', fail: 'No se pudo abrir el documento.', page: 'Página', pages: n => n === 1 ? '1 página' : n + ' páginas', ro: 'Solo lectura', roHint: 'Este documento se puede leer aquí, pero no descargar ni imprimir.', zin: 'Ampliar', zout: 'Reducir'}
    : {loading: 'Loading document…', close: 'Close', open: 'Open in a new tab', download: 'Download', fail: 'The document could not be opened.', page: 'Page', pages: n => n === 1 ? '1 page' : n + ' pages', ro: 'Read-only', roHint: 'You can read this document here, but it cannot be downloaded or printed.', zin: 'Zoom in', zout: 'Zoom out'};
  const dialog = E('dialog', undefined, 'th-viewer'); dialog.lang = lang;
  const head = E('header', undefined, 'th-viewer-head'), titles = E('div');
  const sub = E('p', subtitle, 'th-muted');
  titles.append(E('h2', title), sub);
  const tools = E('div', undefined, 'th-viewer-tools'), close = E('button', t.close, 'th-btn'); close.type = 'button';
  tools.append(close); head.append(titles, tools);
  const stage = E('div', undefined, 'th-viewer-stage'); stage.append(E('p', t.loading, 'th-muted th-center'));
  const foot = E('footer', undefined, 'th-viewer-foot');
  dialog.append(head, stage, foot); document.body.append(dialog);
  let blobUrl = null, view = null, viewOnly = false;
  const block = e => { if (viewOnly) e.preventDefault(); };
  const keys = e => { if (viewOnly && (e.ctrlKey || e.metaKey) && /^[spc]$/i.test(e.key)) e.preventDefault(); };
  const done = () => { if (blobUrl) URL.revokeObjectURL(blobUrl); view?.destroy?.(); document.removeEventListener('keydown', keys, true); document.body.classList.remove('th-noprint'); dialog.remove(); };
  close.onclick = () => dialog.close(); dialog.onclose = done;
  dialog.showModal();
  try {
    const r = await load();
    if (!r?.url) throw Error(t.fail);
    viewOnly = !!r.view_only;
    if (viewOnly) {
      dialog.classList.add('is-viewonly'); document.body.classList.add('th-noprint');
      dialog.addEventListener('contextmenu', block); dialog.addEventListener('dragstart', block); document.addEventListener('keydown', keys, true);
      const ro = E('span', t.ro, 'th-chip'); ro.dataset.tone = 'ink'; ro.title = t.roHint; titles.append(ro);
    }
    const res = await fetch(r.url, {cache: 'no-store'});
    if (!res.ok) throw Error(t.fail);
    const blob = await res.blob();
    const onEnd = () => { dialog.dataset.ended = '1'; dialog.dispatchEvent(new CustomEvent('th-viewer-end')); };
    if (isPdf(blob, r)) {
      try { view = await renderPdf(stage, blob, {onEnd, labels: t}); }
      catch (err) {
        if (viewOnly) throw err;
        blobUrl = URL.createObjectURL(blob); const frame = E('iframe'); frame.title = title; frame.src = blobUrl; stage.replaceChildren(frame); onEnd();
      }
    } else { if (!viewOnly) blobUrl = URL.createObjectURL(blob); view = await renderImage(stage, blob, {viewOnly, title, onEnd, src: blobUrl}); }
    if (view?.pages) sub.textContent = [subtitle, t.pages(view.pages)].filter(Boolean).join(' · ');
    if (view?.zoom) {
      const z = E('div', undefined, 'th-zoom'), out = E('button', '−', 'th-btn th-ghost'), lab = E('span', '100%'), inn = E('button', '+', 'th-btn th-ghost');
      out.type = inn.type = 'button'; out.setAttribute('aria-label', t.zout); inn.setAttribute('aria-label', t.zin);
      const go = async d => { const v = await view.zoom(d); lab.textContent = Math.round(v * 100) + '%'; };
      out.onclick = () => go(-.25); inn.onclick = () => go(.25);
      z.append(out, lab, inn); tools.prepend(z);
    }
    if (!viewOnly) {
      if (!blobUrl) blobUrl = URL.createObjectURL(blob);
      const open = E('a', t.open, 'th-btn'); open.href = blobUrl; open.target = '_blank'; open.rel = 'noopener';
      tools.prepend(open);
      if (r.download_url) { const dl = E('a', t.download, 'th-btn'); dl.href = r.download_url; dl.rel = 'noopener'; tools.prepend(dl); }
    }
  } catch (e) { stage.replaceChildren(E('p', e.message || t.fail, 'th-error th-center')); }
  for (const a of actions) if (a) foot.append(a(dialog));
  foot.hidden = !foot.children.length;
  return dialog;
}

// Lienzo de firma (ratón, dedo o lápiz). Coordenadas normalizadas a 1000 x 400.
export function signaturePad() {
  const box = E('div', undefined, 'th-sign-pad'), canvas = E('canvas'), hint = E('span', 'Sign here', 'th-sign-hint');
  canvas.width = 1000; canvas.height = 400; canvas.setAttribute('aria-label', 'Signature drawing area');
  box.append(canvas, hint);
  const ctx = canvas.getContext('2d'); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 4.5; ctx.strokeStyle = '#2B2A28';
  let strokes = [], current = null;
  const point = e => { const r = canvas.getBoundingClientRect(); return [Math.max(0, Math.min(1000, Math.round((e.clientX - r.left) / r.width * 1000))), Math.max(0, Math.min(400, Math.round((e.clientY - r.top) / r.height * 400)))]; };
  canvas.addEventListener('pointerdown', e => { e.preventDefault(); canvas.setPointerCapture(e.pointerId); current = [point(e)]; strokes.push(current); hint.hidden = true; ctx.beginPath(); ctx.arc(current[0][0], current[0][1], 2, 0, Math.PI * 2); ctx.fillStyle = '#2B2A28'; ctx.fill(); });
  canvas.addEventListener('pointermove', e => {
    if (!current) return; e.preventDefault();
    const p = point(e), last = current[current.length - 1];
    if (Math.abs(p[0] - last[0]) + Math.abs(p[1] - last[1]) < 3) return;
    if (current.length >= 1400) return;
    current.push(p); ctx.beginPath(); ctx.moveTo(last[0], last[1]); ctx.lineTo(p[0], p[1]); ctx.stroke();
  });
  const end = () => { current = null; };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end); canvas.addEventListener('pointerleave', end);
  canvas.style.touchAction = 'none';
  return {
    el: box,
    clear() { strokes = []; ctx.clearRect(0, 0, 1000, 400); hint.hidden = false; },
    empty() { return strokes.reduce((a, s) => a + s.length, 0) < 8; },
    // Limita el tamaño para que la petición sea pequeña (≤ 4000 puntos).
    strokes() { let total = 0; const out = []; for (const s of strokes.slice(0, 80)) { const step = Math.max(1, Math.ceil(strokes.reduce((a, x) => a + x.length, 0) / 3800)); const pts = s.filter((_, i) => i % step === 0 || i === s.length - 1); total += pts.length; if (total > 4000) break; out.push(pts); } return out; }
  };
}

export const fmtBytes = n => n < 1024 * 1024 ? Math.max(1, Math.round(n / 1024)) + ' KB' : (n / 1024 / 1024).toFixed(1) + ' MB';
export function fmtWhen(v, lang = 'es') { if (!v) return '—'; const d = new Date(v); return Number.isNaN(d.getTime()) ? '—' : new Intl.DateTimeFormat(lang === 'es' ? 'es-ES' : 'en-GB', {day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'}).format(d); }
