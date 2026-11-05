import "./unified-theme.js";
import {createClient} from '@supabase/supabase-js';
// v22 · Personal admin (portfolio + certificates) with a guided flow:
//   1. Pick what to edit (Perfil y CV, Proyecto, Certificado, Experiencia, Estudios, Redes).
//   2. A form with ONLY the fields of that type, in plain language, with files chosen inside the form.
//   3. "Guardar" saves the entry and uploads the chosen files in one go. "Visible en la web" publishes it.
// Same table (mt_personal_items), same storage bucket (mt-personal) and same rules as before.
const $ = id => document.getElementById(id);
const E = (tag, text, cls) => { const n = document.createElement(tag); if (text != null) n.textContent = text; if (cls) n.className = cls; return n; };
let client, rows = [], current = null, kind = null, dirty = false, busy = false, pending = {}, removed = {}, filterText = '';

const KINDS = {
  profile: {label: 'Perfil y CV', icon: '👤', one: true, add: 'Editar perfil y CV', intro: 'Tu portada y la página de currículum. Solo hay una entrada de perfil.', fields: [
    ['title', 'Tu nombre', 'text', {required: true, hint: 'Aparece en la portada del portfolio.'}],
    ['subtitle', 'Titular profesional', 'text', {hint: 'Ej. Full-stack developer · Ciberseguridad'}],
    ['document_path', 'CV en PDF', 'pdf', {hint: 'Con un CV subido, el portfolio muestra el botón «Descargar CV».'}],
    ['cover_path', 'Tu foto', 'image'],
    ['category', 'Ahora mismo', 'text', {hint: 'Ej. Disponible para proyectos en remoto'}],
    ['issuer', 'Ciudad', 'text'],
    ['body', 'Biografía', 'textarea', {hint: 'Deja una línea en blanco entre párrafos.'}],
    ['tags', 'Competencias', 'text', {hint: 'Separadas por comas. Ej. React, Node.js, AWS'}],
    ['website_url', 'LinkedIn', 'url'], ['repository_url', 'GitHub', 'url'],
    ['verification_url', 'Enlace para reservar una llamada', 'url']]},
  project: {label: 'Proyectos', icon: '🗂️', add: 'Añadir proyecto', intro: 'Cada proyecto es una tarjeta del portfolio.', fields: [
    ['title', 'Nombre del proyecto', 'text', {required: true}],
    ['subtitle', 'Resumen corto', 'text', {hint: 'Una frase que aparece bajo el nombre.'}],
    ['cover_path', 'Imagen de portada', 'image'],
    ['category', 'Categoría', 'text', {hint: 'Crea las pestañas del portfolio. Ej. WEB, API, DESIGN'}],
    ['issuer', 'Tu rol o cliente', 'text'], ['issued_on', 'Fecha', 'date'],
    ['body', 'Descripción', 'textarea', {hint: 'Línea en blanco entre párrafos. «# Título» crea un subtítulo.'}],
    ['tags', 'Tecnologías', 'text', {hint: 'Separadas por comas.'}],
    ['website_url', 'Web del proyecto', 'url'], ['repository_url', 'Repositorio', 'url'],
    ['verification_url', 'Caso práctico', 'url'], ['gallery_paths', 'Galería de imágenes', 'gallery']]},
  certificate: {label: 'Certificados', icon: '🎓', add: 'Añadir certificado', intro: 'Aparecen en /certificates y en tu currículum.', fields: [
    ['title', 'Nombre del certificado', 'text', {required: true}],
    ['issuer', 'Entidad emisora', 'text', {hint: 'Ej. AWS, Google, CompTIA'}],
    ['issued_on', 'Fecha de expedición', 'date'],
    ['expires_on', 'Fecha de caducidad', 'date', {hint: 'Opcional. Se avisa «Renew soon» 90 días antes.'}],
    ['cover_path', 'Imagen del certificado', 'image'], ['document_path', 'Certificado en PDF', 'pdf'],
    ['subtitle', 'ID de la credencial', 'text'], ['category', 'Categoría', 'text', {hint: 'Crea las pestañas de la página de certificados.'}],
    ['verification_url', 'Enlace oficial de verificación', 'url']]},
  experience: {label: 'Experiencia', icon: '💼', add: 'Añadir experiencia', intro: 'Bloque «Dónde he trabajado» del currículum.', fields: [
    ['title', 'Puesto', 'text', {required: true}], ['issuer', 'Empresa', 'text'],
    ['issued_on', 'Inicio', 'date'], ['expires_on', 'Fin', 'date', {hint: 'Vacío = trabajo actual (aparece «since …»).'}],
    ['category', 'Ciudad o modalidad', 'text'], ['body', 'Logros', 'textarea'], ['tags', 'Herramientas', 'text', {hint: 'Separadas por comas.'}]]},
  education: {label: 'Estudios', icon: '📚', add: 'Añadir estudios', intro: 'Bloque «Dónde he estudiado» del currículum.', fields: [
    ['title', 'Titulación', 'text', {required: true}], ['issuer', 'Universidad o centro', 'text'],
    ['issued_on', 'Inicio', 'date'], ['expires_on', 'Fin', 'date'], ['body', 'Módulos o proyecto final', 'textarea']]},
  link: {label: 'Redes y contacto', icon: '🔗', add: 'Añadir red o email', intro: 'Iconos de la página de contacto. El icono se elige solo.', fields: [
    ['title', 'Nombre', 'text', {required: true, hint: 'Ej. GitHub, LinkedIn, TryHackMe o Email'}],
    ['website_url', 'Enlace', 'url', {hint: 'Dirección completa con https://'}],
    ['subtitle', 'Dirección de email', 'text', {hint: 'Solo para la entrada «Email»: activa la carta de contacto.'}]]}
};
const ORDER = ['profile', 'project', 'certificate', 'experience', 'education', 'link'];
const LIMITS = {slug: 160, title: 200, subtitle: 500, category: 80, body: 16000, tags: 600, issuer: 200, website_url: 2000, repository_url: 2000, verification_url: 2000};
const fmtDate = d => d ? new Intl.DateTimeFormat('es-ES', {dateStyle: 'medium', timeZone: 'UTC'}).format(new Date(d + 'T00:00:00Z')) : '';

let toastTimer;
function message(s, error = false) {
  for (const id of ['status', 'editStatus']) { const el = $(id); if (el) { el.textContent = s; el.classList.toggle('error', error); } }
  const t = $('toast'); if (t && s) { t.textContent = s; t.className = 'a-toast show' + (error ? ' error' : ''); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.className = 'a-toast', error ? 9000 : 4000); }
}
function setBusy(v) { busy = v; for (const b of document.querySelectorAll('button,input,select,textarea')) if (!b.closest('#login')) b.disabled = v; }
function mayLeave() { return !dirty || confirm('¿Descartar los cambios sin guardar?'); }
function friendly(e) {
  const m = e.message || String(e);
  if (e.code === '23505') return 'Ya existe una entrada con ese identificador. Cambia el identificador en «Opciones avanzadas».';
  if (e.code === '23514') return 'Algún campo no tiene el formato correcto (enlaces con https://, fechas). ' + m;
  if (e.code === '42501' || /row-level security/i.test(m)) return 'Permiso denegado: inicia sesión con la cuenta propietaria.';
  if (/JWT|expired/i.test(m)) return 'Sesión caducada. Vuelve a iniciar sesión.';
  return m;
}
const slugify = t => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'entrada';

// ---------------------------------------------------------------- list
async function list() {
  const {data, error} = await client.from('mt_personal_items').select('*').order('sort_order').order('created_at', {ascending: false}).limit(500);
  if (error) throw error; rows = data || []; render();
}
function subline(r) {
  const parts = [r.issuer, r.category];
  if (r.kind === 'experience' || r.kind === 'education') parts.push([fmtDate(r.issued_on), r.expires_on ? fmtDate(r.expires_on) : (r.issued_on ? 'actualidad' : '')].filter(Boolean).join(' – '));
  else if (r.issued_on) parts.push(fmtDate(r.issued_on));
  if (r.kind === 'profile') parts.push(r.document_path ? 'CV subido ✓' : 'Sin CV');
  if (r.kind === 'link') parts.push(r.website_url || r.subtitle);
  return parts.filter(Boolean).join(' · ');
}
function render() {
  const q = filterText.toLowerCase();
  const start = $('start'); start.replaceChildren();
  for (const k of ORDER) {
    const cfg = KINDS[k], n = rows.filter(r => r.kind === k).length;
    const b = E('button', undefined, 'p-tile'); b.type = 'button';
    b.append(E('span', cfg.icon, 'p-tile-ico'), E('b', cfg.one ? cfg.label : cfg.add), E('small', cfg.one ? (n ? 'Editar' : 'Crear') : n + ' ' + (n === 1 ? 'entrada' : 'entradas')));
    b.onclick = () => { if (!mayLeave()) return; if (cfg.one) edit('profile', rows.find(r => r.kind === 'profile') || null); else edit(k, null); };
    start.append(b);
  }
  const host = $('records'); host.replaceChildren();
  for (const k of ORDER) {
    const cfg = KINDS[k];
    const items = rows.filter(r => r.kind === k && (!q || `${r.title} ${r.slug} ${r.issuer || ''} ${r.category || ''}`.toLowerCase().includes(q)));
    if (q && !items.length) continue;
    const sec = E('section', undefined, 'p-group');
    const head = E('div', undefined, 'p-group-head');
    head.append(E('h2', cfg.label), E('span', items.length ? items.length + (items.length === 1 ? ' entrada' : ' entradas') : 'Vacío', 'p-count'));
    if (!cfg.one || !items.length) { const add = E('button', cfg.one ? 'Crear perfil' : '+ ' + cfg.add.replace(/^Añadir /, 'Añadir '), 'btn p-add'); add.type = 'button'; add.onclick = () => { if (mayLeave()) edit(k, null); }; head.append(add); }
    sec.append(head);
    if (!items.length) sec.append(E('p', cfg.intro, 'a-muted p-empty'));
    for (const r of items) {
      const row = E('div', undefined, 'p-row');
      const txt = E('button', undefined, 'p-row-main'); txt.type = 'button'; txt.title = 'Editar';
      txt.append(E('b', r.title || '(sin título)'), E('small', subline(r)));
      txt.onclick = () => { if (mayLeave()) edit(r.kind, r); };
      const pub = E('button', r.published ? 'Visible' : 'Oculto', 'p-pub' + (r.published ? ' on' : '')); pub.type = 'button';
      pub.title = r.published ? 'Visible en la web · pulsa para ocultar' : 'Oculto · pulsa para publicar';
      pub.setAttribute('aria-pressed', String(!!r.published));
      pub.onclick = () => togglePublished(r);
      const ed = E('button', 'Editar', 'btn'); ed.type = 'button'; ed.onclick = () => { if (mayLeave()) edit(r.kind, r); };
      row.append(txt, pub, ed); sec.append(row);
    }
    host.append(sec);
  }
}
async function togglePublished(r) {
  if (busy) return; setBusy(true);
  try {
    const {data, error} = await client.from('mt_personal_items').update({published: !r.published}).eq('id', r.id).eq('updated_at', r.updated_at).select().maybeSingle();
    if (error) throw new Error(friendly(error));
    if (!data) throw Error('La entrada cambió en otra pestaña. Recarga la página.');
    await list(); message(data.published ? '«' + data.title + '» ya es visible en la web.' : '«' + data.title + '» está oculta.');
  } catch (e) { message(e.message, true); } finally { setBusy(false); }
}

// ---------------------------------------------------------------- editor
function fileField(key, label, type, opts) {
  const wrap = E('div', undefined, 'p-file' + (type === 'gallery' ? ' wide' : ''));
  wrap.append(E('span', label, 'p-label'));
  const state = E('p', '', 'p-file-state'); const prev = E('div', undefined, 'p-file-prev');
  const input = E('input'); input.type = 'file'; input.accept = type === 'pdf' ? 'application/pdf' : 'image/jpeg,image/png,image/webp'; input.multiple = type === 'gallery'; input.className = 'p-file-input'; input.id = 'f_' + key;
  const pick = E('label', type === 'pdf' ? 'Elegir PDF' : type === 'gallery' ? 'Añadir imágenes' : 'Elegir imagen', 'btn'); pick.htmlFor = input.id;
  const clear = E('button', 'Quitar', 'btn p-file-clear'); clear.type = 'button';
  const paint = () => {
    const cur = type === 'gallery' ? (current?.gallery_paths || '').split('\n').filter(Boolean) : (current?.[key] && !removed[key] ? [current[key]] : []);
    const add = [].concat(pending[key] || []);
    const parts = [];
    if (cur.length) parts.push(type === 'gallery' ? cur.length + ' imagen(es) guardada(s)' : (type === 'pdf' ? 'PDF guardado ✓' : 'Imagen guardada ✓'));
    if (add.length) parts.push('Nuevo: ' + add.map(f => f.name).join(', ') + ' (se sube al guardar)');
    if (removed[key]) parts.push('Se quitará al guardar');
    state.textContent = parts.join(' · ') || (type === 'pdf' ? 'Ningún PDF' : 'Ninguna imagen');
    clear.hidden = !(cur.length || add.length) || type === 'gallery' && !add.length;
    prev.replaceChildren();
    if (add.length && type !== 'pdf') for (const f of add.slice(0, 6)) { const img = E('img'); img.alt = ''; img.src = URL.createObjectURL(f); prev.append(img); }
  };
  input.onchange = () => {
    const files = [...input.files]; if (!files.length) return;
    for (const f of files) { if (f.size > 10485760) { message(f.name + ': máximo 10 MB.', true); input.value = ''; return; } }
    pending[key] = type === 'gallery' ? [...(pending[key] || []), ...files] : files[0]; delete removed[key]; dirty = true; input.value = ''; paint();
  };
  clear.onclick = () => { if (pending[key]) delete pending[key]; else removed[key] = true; dirty = true; paint(); };
  const actions = E('div', undefined, 'p-file-actions'); actions.append(pick, clear);
  wrap.append(input, actions, state, prev);
  if (opts?.hint) wrap.append(E('small', opts.hint, 'p-hint'));
  paint(); return wrap;
}
function edit(k, r) {
  current = r; kind = k; dirty = false; pending = {}; removed = {};
  const cfg = KINDS[k], box = $('fields'); box.replaceChildren();
  $('editKind').textContent = cfg.label;
  $('editTitle').textContent = r ? r.title : (cfg.one ? 'Perfil y CV' : cfg.add);
  $('editIntro').textContent = cfg.intro;
  $('fPublished').checked = r ? !!r.published : true;
  for (const [key, label, type, opts] of cfg.fields) {
    if (['image', 'pdf', 'gallery'].includes(type)) { box.append(fileField(key, label, type, opts)); continue; }
    const wrap = E('label', undefined, type === 'textarea' ? 'wide' : ''); wrap.append(E('span', label + (opts?.required ? ' *' : ''), 'p-label'));
    const f = E(type === 'textarea' ? 'textarea' : 'input'); f.name = key; if (f.tagName === 'INPUT') f.type = type;
    f.value = r?.[key] ?? ''; if (opts?.required) f.required = true; if (LIMITS[key]) f.maxLength = LIMITS[key];
    if (type === 'url') f.placeholder = 'https://';
    f.addEventListener('input', () => { dirty = true; });
    wrap.append(f); if (opts?.hint) wrap.append(E('small', opts.hint, 'p-hint')); box.append(wrap);
  }
  $('fSlug').value = r?.slug || ''; $('fSlug').placeholder = 'se genera desde el nombre'; $('fOrder').value = r?.sort_order ?? 0;
  $('editStatus').textContent = ''; $('editStatus').classList.remove('error');
  $('delete').hidden = !r;
  $('editor').hidden = false; $('shade').hidden = false; document.body.classList.add('a-lock'); $('editor').scrollTop = 0;
  setTimeout(() => (box.querySelector('input,textarea'))?.focus(), 40);
}
function closeEditor() { $('editor').hidden = true; $('shade').hidden = true; document.body.classList.remove('a-lock'); current = null; kind = null; dirty = false; pending = {}; removed = {}; }
function values() {
  const cfg = KINDS[kind], v = {kind, published: $('fPublished').checked, sort_order: Number($('fOrder').value) || 0};
  for (const [key, label, type] of cfg.fields) {
    if (['image', 'pdf', 'gallery'].includes(type)) continue;
    const f = $('editor').elements.namedItem(key); let val = f.value.trim();
    if (type === 'date' && !val) val = null;
    if (type === 'url' && val) { let u; try { u = new URL(val); } catch { throw Error('«' + label + '» no es un enlace válido.'); } if (u.protocol !== 'https:') throw Error('«' + label + '» debe empezar por https://'); }
    v[key] = val;
  }
  let slug = $('fSlug').value.trim() || slugify(v.title || kind);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) throw Error('El identificador solo puede tener minúsculas, números y guiones.');
  v.slug = slug;
  if (v.expires_on && v.issued_on && v.expires_on < v.issued_on) throw Error('La fecha de fin no puede ser anterior a la de inicio.');
  for (const key of Object.keys(removed)) v[key] = '';
  return v;
}
async function write(v, retry = true) {
  let q = current ? client.from('mt_personal_items').update(v).eq('id', current.id).eq('updated_at', current.updated_at) : client.from('mt_personal_items').insert(v);
  const {data, error} = await q.select().maybeSingle();
  if (error) throw new Error(friendly(error));
  if (!data && current && retry) { const r = await client.from('mt_personal_items').select('updated_at').eq('id', current.id).maybeSingle(); if (r.data) { current = {...current, updated_at: r.data.updated_at}; return write(v, false); } }
  if (!data) throw Error('No se pudo guardar: la entrada ya no existe o tu sesión no es la propietaria. Recarga la página.');
  return data;
}
async function uploadPending(row) {
  const keys = Object.keys(pending); if (!keys.length) return row;
  const {data: {user}, error: ue} = await client.auth.getUser(); if (ue || !user) throw Error('Sesión caducada.');
  const patch = {};
  for (const key of keys) {
    const files = [].concat(pending[key]), paths = [];
    for (const file of files) {
      const ext = {'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf'}[file.type];
      if (!ext) throw Error(file.name + ': tipo de archivo no permitido.');
      if ((key === 'document_path') !== (ext === 'pdf')) throw Error(file.name + ': el tipo no corresponde a este campo.');
      message('Subiendo ' + file.name + '…');
      const path = `${user.id}/${row.id}/${crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2)}.${ext}`;
      const {error} = await client.storage.from('mt-personal').upload(path, file, {contentType: file.type, upsert: false});
      if (error) throw new Error(friendly(error));
      paths.push(path);
    }
    patch[key] = key === 'gallery_paths' ? [row.gallery_paths || '', ...paths].map(s => s.trim()).filter(Boolean).join('\n') : paths[0];
  }
  current = row;
  return write(patch);
}
async function save() {
  const v = values();
  let row = await write(v);
  current = row;
  if (Object.keys(pending).length) { row = await uploadPending(row); }
  current = row; pending = {}; removed = {}; dirty = false;
  await list();
  return row;
}
function bind() {
  $('editor').onsubmit = async e => {
    e.preventDefault(); if (busy) return;
    if (!$('editor').reportValidity()) return;
    setBusy(true);
    try {
      const d = await save();
      edit(d.kind, d);
      message(d.published ? 'Guardado. Ya es visible en la web.' : 'Guardado como oculto. Activa «Visible en la web» para publicarlo.');
    } catch (e) { message(friendly(e) + (Object.keys(pending).length ? ' Los datos de texto se han guardado; vuelve a elegir el archivo.' : ''), true); }
    finally { setBusy(false); }
  };
  $('editor').addEventListener('invalid', e => { message('Falta rellenar: ' + (e.target.closest('label')?.querySelector('.p-label')?.textContent || e.target.name), true); }, true);
  $('editor').addEventListener('input', () => { dirty = true; });
  $('cancel').onclick = $('xClose').onclick = () => { if (mayLeave()) closeEditor(); };
  $('shade').onclick = () => { if (mayLeave()) closeEditor(); };
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('editor').hidden && mayLeave()) closeEditor(); });
  $('search').oninput = () => { filterText = $('search').value.trim(); render(); };
  $('cvBtn').onclick = () => { if (!mayLeave()) return; edit('profile', rows.find(r => r.kind === 'profile') || null); setTimeout(() => $('f_document_path')?.closest('.p-file')?.scrollIntoView({block: 'center'}), 60); };
  $('delete').onclick = async () => {
    if (!current || !confirm('¿Eliminar «' + current.title + '»? Los archivos subidos no se borran automáticamente.')) return;
    setBusy(true);
    try {
      const {data, error} = await client.from('mt_personal_items').delete().eq('id', current.id).eq('updated_at', current.updated_at).select('id');
      if (error) throw new Error(friendly(error)); if (!data.length) throw Error('La entrada cambió. Vuelve a abrirla.');
      closeEditor(); await list(); message('Entrada eliminada.');
    } catch (e) { message(e.message, true); } finally { setBusy(false); }
  };
  $('logout').onclick = async () => { if (!mayLeave()) return; await client.auth.signOut({scope: 'local'}); reset(); message('Sesión cerrada.'); };
  $('login').onsubmit = async e => {
    e.preventDefault(); if (busy) return; setBusy(true);
    try {
      const f = e.currentTarget;
      const {error} = await client.auth.signInWithPassword({email: f.email.value.trim(), password: f.password.value}); f.password.value = '';
      if (error) throw error;
      const r = await client.from('mt_personal_owner').select('user_id').maybeSingle();
      if (r.error) throw r.error;
      if (!r.data) { await client.auth.signOut({scope: 'local'}); throw Error('Esta cuenta no es la propietaria del contenido personal.'); }
      $('login').hidden = true; $('panel').hidden = false; await list(); message('Sesión iniciada.');
    } catch (e) { reset(); message(e.message, true); } finally { setBusy(false); }
  };
  window.addEventListener('beforeunload', e => { if (dirty || busy) { e.preventDefault(); e.returnValue = ''; } });
}
function reset() { closeEditor(); $('panel').hidden = true; $('login').hidden = false; $('records').replaceChildren(); }

bind();
try {
  const r = await fetch('/api/public-config', {cache: 'no-store'});
  if (!r.ok) throw Error('Configuración no disponible.');
  const c = await r.json();
  client = createClient(c.supabaseUrl, c.supabasePublicKey, {auth: {persistSession: false, autoRefreshToken: true, detectSessionInUrl: false}});
  client.auth.onAuthStateChange(event => { if (event === 'SIGNED_OUT') { reset(); message('La sesión ha terminado.'); } });
} catch (e) { message(e.message, true); $('login').hidden = true; }
