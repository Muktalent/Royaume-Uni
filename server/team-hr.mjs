// team-hr-v16 · Equipo (alta completa, edición, foto, baja) y documentos del empleado con firma electrónica.
// Todo el acceso a datos privados pasa por la clave de servicio; los permisos se comprueban aquí
// (requireAdmin) y los cambios de ficha usan las RPC de administrador con la sesión del admin.
import {createClient} from '@supabase/supabase-js';
import {createHash, randomUUID} from 'node:crypto';
import {rateLimit} from 'express-rate-limit';
import {z} from 'zod';
import {validSignature} from './workspace-extras.mjs';

const bucket = 'mt-employee-private';
const MB = 1024 * 1024;
const DOC_MIMES = ['application/pdf', 'image/jpeg', 'image/png'];
const DOC_KINDS = ['contract', 'payslip', 'policy', 'certificate', 'id_document', 'other'];
const KIND_LABEL = {contract: 'Contract', payslip: 'Payslip', policy: 'Policy', certificate: 'Certificate', id_document: 'ID document', other: 'Document'};

function db() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw Error('Private services unavailable');
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {auth: {persistSession: false, autoRefreshToken: false, detectSessionInUrl: false}});
}
function check(r) { if (r.error) { const e = Error('Database operation failed'); e.code = r.error.code; e.detail = r.error.message; throw e; } return r.data; }
class Http extends Error { constructor(status, message) { super(message); this.status = status; } }
const uuid = z.string().uuid();
const ipOf = req => (process.env.VERCEL ? String(req.headers['x-vercel-forwarded-for'] || req.headers['x-forwarded-for'] || '').split(',')[0].trim() : req.ip) || '';
export const employeeCode = n => n == null ? null : 'UK-' + String(n).padStart(6, '0');

// ---------- Validación de la ficha ----------
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export function validDob(value, today = new Date()) {
  if (!value) return true;
  const d = new Date(value + 'T00:00:00Z');
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== value) return false;
  const age = (today - d) / (365.25 * 86400000);
  return age >= 16 && age <= 100;
}
const profileShape = {
  full_name: z.string().trim().min(2).max(200),
  job_title: z.string().trim().min(1).max(200),
  country_code: z.union([z.literal(''), z.string().regex(/^[A-Z]{2}$/)]).default(''),
  assigned_city: z.string().trim().max(200).default(''),
  languages: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  date_of_birth: z.union([z.literal(''), isoDate]).default(''),
  contact_phone: z.string().trim().max(100).default(''),
  contact_email: z.union([z.literal(''), z.string().trim().email().max(320)]).default(''),
  publish_contact: z.boolean().default(false),
  public_bio: z.string().trim().max(2000).default(''),
  base_salary: z.number().min(0).max(10000000).nullable().default(null),
  commission_rate: z.number().min(0).max(1000000).nullable().default(null),
  currency: z.string().regex(/^[A-Z]{3}$/).default('MAD'),
  active: z.boolean().default(false),          // tarjeta, QR y wallet
  web_visible: z.boolean().default(true)       // aparece en el equipo de la web pública
};
const languagesText = list => [...new Set(list.map(s => s.trim()).filter(Boolean))].join(', ').slice(0, 200);
const createSchema = z.object({...profileShape, email: z.string().trim().toLowerCase().email().max(320), password: z.string().min(14).max(128)}).strict()
  .refine(v => validDob(v.date_of_birth), {path: ['date_of_birth'], message: 'Invalid date of birth'})
  .refine(v => languagesText(v.languages).length <= 200, {path: ['languages'], message: 'Too many languages'});
const updateSchema = z.object({...profileShape, account_active: z.boolean().optional()}).strict()
  .refine(v => validDob(v.date_of_birth), {path: ['date_of_birth'], message: 'Invalid date of birth'})
  .refine(v => languagesText(v.languages).length <= 200, {path: ['languages'], message: 'Too many languages'});

// Guarda la ficha con las RPC de administrador (misma vía que el panel anterior) y asegura la tarjeta pública.
async function saveProfile(req, client, id, v) {
  check(await req.db.rpc('mt_admin_directory_update', {p_user: id, p_values: {
    full_name: v.full_name, job_title: v.job_title, assigned_city: v.assigned_city, languages: languagesText(v.languages),
    public_bio: v.public_bio, contact_phone: v.contact_phone, contact_email: v.contact_email, publish_contact: v.publish_contact,
    card_enabled: v.active, commission_rate: v.commission_rate, commission_currency: v.currency
  }}));
  check(await req.db.rpc('mt_admin_directory_extra', {p_user: id, p_values: {
    country_code: v.country_code, date_of_birth: v.date_of_birth, base_salary: v.base_salary == null ? '' : String(v.base_salary),
    salary_currency: v.currency, web_visible: v.web_visible
  }}));
  await ensureCard(client, id, v);
}
// La tarjeta (mt_public_cards) alimenta el QR, el wallet y el carrusel de la web. Se sincroniza siempre,
// aunque el trigger privado ya lo haga, para que "Activo" sea fiable.
async function ensureCard(client, id, v) {
  const fields = {display_name: v.full_name, job_title: v.job_title, assigned_city: v.assigned_city, languages: languagesText(v.languages),
    bio: v.public_bio, contact_phone: v.publish_contact ? v.contact_phone : '', contact_email: v.publish_contact ? v.contact_email : '', published: v.active, updated_at: new Date().toISOString()};
  const card = check(await client.from('mt_public_cards').select('owner_id,published,display_name').eq('owner_id', id).maybeSingle());
  if (!card) { check(await client.from('mt_public_cards').insert({owner_id: id, ...fields})); return; }
  if (card.published !== v.active || card.display_name !== v.full_name) check(await client.from('mt_public_cards').update({published: v.active, display_name: v.full_name, updated_at: fields.updated_at}).eq('owner_id', id));
}

async function signedMap(client, paths, seconds = 900) {
  const list = paths.filter(Boolean);
  if (!list.length) return {};
  const r = await client.storage.from(bucket).createSignedUrls(list, seconds);
  const out = {};
  for (const item of r.data || []) if (item.signedUrl) out[item.path] = item.signedUrl;
  return out;
}

async function teamRows(client, {includeRemoved = false} = {}) {
  const staff = check(await client.from('crm_staff').select('user_id,full_name,role,active,created_at').order('full_name').limit(500));
  const ids = staff.map(s => s.user_id);
  if (!ids.length) return [];
  const [dirs, cards, avatars, docs] = await Promise.all([
    client.from('mt_employee_directory').select('*').in('user_id', ids),
    client.from('mt_public_cards').select('owner_id,slug,published').in('owner_id', ids),
    client.from('mt_employee_assets').select('owner_id,object_path,created_at').in('owner_id', ids).eq('category', 'avatar').eq('state', 'uploaded').order('created_at', {ascending: false}).limit(2000),
    client.from('mt_staff_documents').select('owner_id,status,direction,admin_seen_at').in('owner_id', ids).limit(5000)
  ]);
  const dir = new Map(check(dirs).map(d => [d.user_id, d])), card = new Map(check(cards).map(c => [c.owner_id, c]));
  const avatar = new Map();
  for (const a of check(avatars)) if (!avatar.has(a.owner_id)) avatar.set(a.owner_id, a.object_path);
  const urls = await signedMap(client, [...avatar.values()]);
  const attention = new Map();
  for (const d of docs.error ? [] : docs.data) if (needsAdmin(d)) attention.set(d.owner_id, (attention.get(d.owner_id) || 0) + 1);
  let emails = new Map();
  try {
    const listed = await client.auth.admin.listUsers({page: 1, perPage: 1000});
    emails = new Map((listed.data?.users || []).map(u => [u.id, u.email]));
  } catch { /* el email es informativo */ }
  return staff.map(s => {
    const d = dir.get(s.user_id) || {}, c = card.get(s.user_id);
    return {
      user_id: s.user_id, full_name: s.full_name, role: s.role, account_active: s.active, created_at: s.created_at,
      login_email: emails.get(s.user_id) || '', employee_code: employeeCode(d.employee_number),
      job_title: d.job_title || '', country_code: d.country_code || '', assigned_city: d.assigned_city || '',
      languages: String(d.languages || '').split(',').map(x => x.trim()).filter(Boolean), date_of_birth: d.date_of_birth || '',
      contact_phone: d.contact_phone || '', contact_email: d.contact_email || '', publish_contact: !!d.publish_contact, public_bio: d.public_bio || '',
      base_salary: d.base_salary == null ? null : Number(d.base_salary), commission_rate: d.commission_rate == null ? null : Number(d.commission_rate),
      currency: d.salary_currency || d.commission_currency || 'MAD',
      active: !!d.card_enabled, card_published: !!c?.published, card_slug: c?.slug || null, web_visible: d.web_visible !== false,
      removed_at: d.removed_at || null, avatar_url: urls[avatar.get(s.user_id)] || null, docs_attention: attention.get(s.user_id) || 0
    };
  }).filter(r => includeRemoved || !r.removed_at);
}

export const needsAdmin = d => (d.direction === 'from_employee' && d.status === 'submitted') || (d.status === 'signed' && !d.admin_seen_at);

// ---------- Firma de PDF ----------
export function cleanStrokes(input) {
  if (!Array.isArray(input) || !input.length || input.length > 80) return null;
  let total = 0;
  const out = [];
  for (const s of input) {
    if (!Array.isArray(s) || s.length < 1 || s.length > 1500) return null;
    const pts = [];
    for (const p of s) {
      if (!Array.isArray(p) || p.length !== 2) return null;
      const [x, y] = p.map(Number);
      if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || x > 1000 || y < 0 || y > 400) return null;
      pts.push([x, y]);
    }
    total += pts.length;
    out.push(pts);
  }
  return total >= 8 && total <= 4000 ? out : null;
}

export async function stampSignature(originalBytes, info) {
  const {PDFDocument, StandardFonts, rgb} = await import('pdf-lib');
  const pdf = await PDFDocument.load(originalBytes, {updateMetadata: false});
  const font = await pdf.embedFont(StandardFonts.Helvetica), bold = await pdf.embedFont(StandardFonts.HelveticaBold), script = await pdf.embedFont(StandardFonts.TimesRomanItalic);
  const when = info.signedAt.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  const safe = s => String(s || '').replace(/[^\x20-\x7E\u00A0-\u00FF]/g, '?');
  for (const page of pdf.getPages()) {
    const {width} = page.getSize();
    const line = safe(`Signed electronically by ${info.signerName} · ${when} · Ref ${info.documentId.slice(0, 8).toUpperCase()}`);
    page.drawText(line, {x: 28, y: 12, size: 7, font, color: rgb(0.35, 0.38, 0.4), maxWidth: width - 56});
  }
  const page = pdf.addPage([595.28, 841.89]);
  const ink = rgb(0.05, 0.13, 0.14), gold = rgb(0.72, 0.56, 0.24), grey = rgb(0.4, 0.43, 0.45);
  page.drawRectangle({x: 0, y: 781, width: 595.28, height: 61, color: ink});
  page.drawText('MUK TALENT', {x: 48, y: 812, size: 16, font: bold, color: gold});
  page.drawText('Electronic signature certificate', {x: 48, y: 794, size: 11, font, color: rgb(1, 1, 1)});
  let y = 740;
  const row = (label, value) => {
    page.drawText(safe(label), {x: 48, y, size: 9, font: bold, color: grey});
    page.drawText(safe(value), {x: 190, y, size: 10, font, color: ink, maxWidth: 360});
    y -= 22;
  };
  row('Document', info.title);
  row('Original file', info.originalName);
  row('Document ID', info.documentId);
  row('Signed by', info.signerName);
  row('Account', info.signerEmail || '-');
  row('Employee code', info.employeeCode || '-');
  row('Signed at', when);
  row('Method', info.method === 'drawn' ? 'Handwritten signature drawn on screen' : 'Typed full legal name');
  row('IP address', info.ip || '-');
  row('Original SHA-256', info.originalHash.slice(0, 32));
  page.drawText(safe(info.originalHash.slice(32)), {x: 190, y: y + 10, size: 10, font, color: ink});
  y -= 18;
  page.drawText('Signature', {x: 48, y, size: 9, font: bold, color: grey});
  const box = {x: 48, y: y - 150, w: 500, h: 140};
  page.drawRectangle({x: box.x, y: box.y, width: box.w, height: box.h, borderColor: rgb(0.8, 0.82, 0.83), borderWidth: 1, color: rgb(0.985, 0.98, 0.97)});
  if (info.method === 'drawn' && info.strokes) {
    const all = info.strokes.flat(), minX = Math.min(...all.map(p => p[0])), maxX = Math.max(...all.map(p => p[0])), minY = Math.min(...all.map(p => p[1])), maxY = Math.max(...all.map(p => p[1]));
    const scale = Math.min((box.w - 40) / Math.max(1, maxX - minX), (box.h - 30) / Math.max(1, maxY - minY), 0.9);
    const ox = box.x + (box.w - (maxX - minX) * scale) / 2, oy = box.y + box.h - (box.h - (maxY - minY) * scale) / 2;
    for (const s of info.strokes) {
      if (s.length === 1) { page.drawCircle({x: ox + (s[0][0] - minX) * scale, y: oy - (s[0][1] - minY) * scale, size: 1.2, color: ink}); continue; }
      for (let i = 1; i < s.length; i++) page.drawLine({start: {x: ox + (s[i - 1][0] - minX) * scale, y: oy - (s[i - 1][1] - minY) * scale}, end: {x: ox + (s[i][0] - minX) * scale, y: oy - (s[i][1] - minY) * scale}, thickness: 1.6, color: ink});
    }
  } else {
    const size = Math.min(34, 460 / Math.max(6, info.signerName.length) * 1.7);
    page.drawText(safe(info.signerName), {x: box.x + 24, y: box.y + box.h / 2 - size / 3, size, font: script, color: ink});
  }
  y = box.y - 30;
  const statement = [
    `${info.signerName} confirmed that they read this document in full and agreed to sign it electronically.`,
    'The signature, time, account and IP address above were recorded by the MUK Talent workspace at the moment of signing.',
    'The SHA-256 fingerprint identifies the exact original file that was signed. Any later change to the file produces a different fingerprint.'
  ];
  for (const s of statement) { page.drawText(safe(s), {x: 48, y, size: 9, font, color: grey, maxWidth: 500, lineHeight: 12}); y -= 30; }
  pdf.setTitle(safe(info.title + ' (signed)'));
  pdf.setProducer('MUK Talent workspace');
  return Buffer.from(await pdf.save());
}

async function emailSigned({doc, owner, bytes}) {
  const to = process.env.HR_NOTIFY_EMAIL, key = process.env.RESEND_API_KEY, from = process.env.BOOKING_FROM_EMAIL;
  if (!to || !key || !from) return false;
  try {
    const r = await fetch('https://api.resend.com/emails', {method: 'POST', headers: {Authorization: `Bearer ${key}`, 'Content-Type': 'application/json'}, body: JSON.stringify({
      from, to: [to], subject: `Documento firmado: ${doc.title} · ${owner}`,
      text: `${owner} ha firmado "${doc.title}".\n\nEl PDF firmado va adjunto y también está en Admin > Equipo > Documentos.`,
      attachments: bytes.length < 9 * MB ? [{filename: doc.title.replace(/[^\w.-]+/g, '_').slice(0, 80) + '_signed.pdf', content: bytes.toString('base64')}] : undefined
    })});
    return r.ok;
  } catch { return false; }
}

export function mountTeamHr(app, {requireStaff, requireAdmin}) {
  const wrap = fn => async (req, res) => {
    try { await fn(req, res); } catch (e) {
      if (e instanceof Http) return res.status(e.status).json({error: e.message, requestId: req.requestId});
      if (e instanceof z.ZodError) {
        const fields = [...new Set(e.issues.map(i => i.path.join('.')).filter(Boolean))];
        return res.status(400).json({error: 'Revisa los campos marcados.', fields, requestId: req.requestId});
      }
      console.error(JSON.stringify({event: 'team_hr_failed', requestId: req.requestId, route: req.route?.path, code: e.code || e.name, detail: String(e.detail || e.message || '').slice(0, 200)}));
      const missing = e.code === '42P01' || e.code === '42703' || e.code === 'PGRST202' || e.code === 'PGRST204' || e.code === 'PGRST205';
      res.status(503).json({error: missing ? 'Falta aplicar la migración de base de datos 20261102_team_documents_reports.sql.' : 'Operación no disponible. Actualiza la página e inténtalo de nuevo.', requestId: req.requestId});
    }
  };
  const createLimit = rateLimit({windowMs: 15 * 60 * 1000, limit: 10, keyGenerator: req => req.staff.user_id, standardHeaders: 'draft-7', legacyHeaders: false, message: {error: 'Demasiados intentos de alta. Espera unos minutos.'}});
  const writeLimit = rateLimit({windowMs: 15 * 60 * 1000, limit: 60, keyGenerator: req => req.staff.user_id, standardHeaders: 'draft-7', legacyHeaders: false, message: {error: 'Demasiadas operaciones seguidas. Espera unos minutos.'}});
  const signLimit = rateLimit({windowMs: 15 * 60 * 1000, limit: 10, keyGenerator: req => req.staff.user_id, standardHeaders: 'draft-7', legacyHeaders: false, message: {error: 'Too many signing attempts. Please wait a few minutes.'}});

  // ===== Equipo =====
  app.get('/api/admin/team', requireStaff, requireAdmin, wrap(async (req, res) => {
    res.json({data: await teamRows(db(), {includeRemoved: req.query.removed === '1'})});
  }));

  app.post('/api/admin/team', requireStaff, requireAdmin, createLimit, wrap(async (req, res) => {
    const v = createSchema.parse(req.body), client = db();
    const created = await client.auth.admin.createUser({email: v.email, password: v.password, email_confirm: true, user_metadata: {full_name: v.full_name}});
    if (created.error || !created.data?.user) throw new Http(400, 'No se pudo crear la cuenta. Puede que el email ya exista o que la contraseña no cumpla la política de Supabase Auth.');
    const id = created.data.user.id;
    const linked = await req.db.from('crm_staff').insert({user_id: id, full_name: v.full_name, role: 'collaborator', active: true}).select('user_id').single();
    if (linked.error) {
      await client.auth.admin.deleteUser(id).catch(() => {});
      throw new Http(503, 'No se pudo vincular la cuenta al equipo. No se ha creado nada; inténtalo de nuevo.');
    }
    // El trigger privado crea la fila del directorio; si aún no existe, se crea aquí.
    const dir = check(await client.from('mt_employee_directory').select('user_id').eq('user_id', id).maybeSingle());
    if (!dir) await client.from('mt_employee_directory').insert({user_id: id});
    try { await saveProfile(req, client, id, v); }
    catch (e) { return res.status(207).json({user_id: id, warning: 'La cuenta se creó, pero parte de la ficha no se guardó. Ábrela en la lista de empleados y guarda de nuevo.', requestId: req.requestId}); }
    res.status(201).json({user_id: id});
  }));

  app.patch('/api/admin/team/:id', requireStaff, requireAdmin, writeLimit, wrap(async (req, res) => {
    const id = uuid.parse(req.params.id), v = updateSchema.parse(req.body), client = db();
    const person = check(await client.from('crm_staff').select('user_id,role,active').eq('user_id', id).maybeSingle());
    if (!person) throw new Http(404, 'Empleado no encontrado.');
    if (v.account_active === false && id === req.staff.user_id) throw new Http(400, 'No puedes desactivar tu propio acceso.');
    await saveProfile(req, client, id, v);
    if (typeof v.account_active === 'boolean' && v.account_active !== person.active) check(await client.from('crm_staff').update({active: v.account_active}).eq('user_id', id));
    res.json({ok: true});
  }));

  // Foto del empleado subida por el administrador (misma tabla y bucket que la del propio empleado).
  app.post('/api/admin/team/:id/photo/start', requireStaff, requireAdmin, writeLimit, wrap(async (req, res) => {
    const id = uuid.parse(req.params.id), v = z.object({name: z.string().min(1).max(200), mime: z.enum(['image/jpeg', 'image/png']), bytes: z.number().int().min(1).max(2 * MB)}).strict().parse(req.body), client = db();
    if (!check(await client.from('crm_staff').select('user_id').eq('user_id', id).maybeSingle())) throw new Http(404, 'Empleado no encontrado.');
    const assetId = randomUUID(), path = `${id}/avatar/${assetId}.${v.mime === 'image/png' ? 'png' : 'jpg'}`;
    check(await client.from('mt_employee_assets').insert({id: assetId, owner_id: id, category: 'avatar', original_name: v.name, mime: v.mime, bytes: v.bytes, object_path: path}));
    const signed = await client.storage.from(bucket).createSignedUploadUrl(path);
    if (signed.error) throw Error('Upload could not be started');
    res.json({id: assetId, path, token: signed.data.token});
  }));
  app.post('/api/admin/team/:id/photo/finish', requireStaff, requireAdmin, writeLimit, wrap(async (req, res) => {
    const id = uuid.parse(req.params.id), assetId = uuid.parse(req.body?.id), client = db();
    const row = check(await client.from('mt_employee_assets').select('*').eq('id', assetId).eq('owner_id', id).eq('category', 'avatar').eq('state', 'pending').maybeSingle());
    if (!row) throw new Http(400, 'La subida no está pendiente.');
    const file = await client.storage.from(bucket).download(row.object_path);
    const bytes = file.data ? Buffer.from(await file.data.arrayBuffer()) : null;
    if (!bytes || bytes.length !== row.bytes || !validSignature(row.mime, bytes)) {
      await client.storage.from(bucket).remove([row.object_path]);
      check(await client.from('mt_employee_assets').update({state: 'rejected'}).eq('id', assetId));
      throw new Http(400, 'La imagen no es un JPG/PNG válido.');
    }
    check(await client.from('mt_employee_assets').update({state: 'uploaded'}).eq('id', assetId));
    res.json({ok: true});
  }));

  // Resumen antes de eliminar: qué tiene asignado esta persona.
  app.get('/api/admin/team/:id/impact', requireStaff, requireAdmin, wrap(async (req, res) => {
    const id = uuid.parse(req.params.id), client = db(), now = new Date().toISOString();
    const count = async q => { const r = await q; return r.error ? 0 : r.count || 0; };
    const [leads, enquiries, students, appointments] = await Promise.all([
      count(client.from('crm_candidates').select('id', {count: 'exact', head: true}).eq('assigned_to', id).is('archived_at', null)),
      count(client.from('crm_enquiries').select('id', {count: 'exact', head: true}).eq('assigned_to', id).not('status', 'in', '(resolved,archived)')),
      count(client.from('gp_students').select('user_id', {count: 'exact', head: true}).eq('counsellor_id', id)),
      count(client.from('crm_appointments').select('id', {count: 'exact', head: true}).eq('advisor_id', id).eq('status', 'confirmed').gte('starts_at', now))
    ]);
    res.json({data: {leads, enquiries, students, appointments}});
  }));

  // "Eliminar perfil": baja definitiva sin borrar el historial (los expedientes y notas siguen referenciando a la persona).
  app.delete('/api/admin/team/:id', requireStaff, requireAdmin, writeLimit, wrap(async (req, res) => {
    const id = uuid.parse(req.params.id), body = z.object({reassign_to: uuid.nullable().optional(), confirm_name: z.string().trim().min(1).max(200)}).strict().parse(req.body || {}), client = db();
    if (id === req.staff.user_id) throw new Http(400, 'No puedes eliminar tu propio perfil.');
    const person = check(await client.from('crm_staff').select('user_id,full_name,role').eq('user_id', id).maybeSingle());
    if (!person) throw new Http(404, 'Empleado no encontrado.');
    if (person.role === 'admin') throw new Http(400, 'Los perfiles de administrador no se pueden eliminar desde aquí.');
    if (body.confirm_name.toLowerCase() !== person.full_name.trim().toLowerCase()) throw new Http(400, 'El nombre de confirmación no coincide.');
    if (body.reassign_to) {
      if (body.reassign_to === id) throw new Http(400, 'Elige otra persona para reasignar.');
      const target = check(await client.from('crm_staff').select('user_id,active').eq('user_id', body.reassign_to).maybeSingle());
      if (!target?.active) throw new Http(400, 'La persona elegida para reasignar no está activa.');
      check(await client.from('crm_candidates').update({assigned_to: body.reassign_to}).eq('assigned_to', id).is('archived_at', null));
      check(await client.from('crm_enquiries').update({assigned_to: body.reassign_to}).eq('assigned_to', id).not('status', 'in', '(resolved,archived)'));
      check(await client.from('gp_students').update({counsellor_id: body.reassign_to}).eq('counsellor_id', id));
    }
    const now = new Date().toISOString();
    check(await client.from('mt_employee_directory').update({card_enabled: false, web_visible: false, removed_at: now, removed_by: req.staff.user_id}).eq('user_id', id));
    check(await client.from('mt_public_cards').update({published: false, updated_at: now}).eq('owner_id', id));
    await client.from('mt_card_handles').delete().eq('owner_id', id);
    await client.from('gp_counsellor_settings').update({accepting: false}).eq('user_id', id);
    check(await client.from('crm_staff').update({active: false}).eq('user_id', id));
    await client.auth.admin.updateUserById(id, {ban_duration: '876000h'}).catch(() => {});
    console.info(JSON.stringify({event: 'team_member_removed', requestId: req.requestId, by: req.staff.user_id, user: id}));
    res.json({ok: true});
  }));

  // ===== Documentos =====
  const docFields = 'id,owner_id,direction,kind,title,note,original_name,mime,bytes,requires_signature,status,viewed_at,signed_at,signer_name,signature_method,reviewed_at,review_note,admin_seen_at,created_at,created_by,signed_path';
  const shape = (d, names = new Map()) => ({...d, signed_path: undefined, has_signed: !!d.signed_path, kind_label: KIND_LABEL[d.kind] || 'Document', owner_name: names.get(d.owner_id) || '', needs_admin: needsAdmin(d)});
  async function startUpload(client, {owner, by, direction, v}) {
    const id = randomUUID(), ext = {'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png'}[v.mime], path = `${owner}/hr/${id}.${ext}`;
    check(await client.from('mt_staff_documents').insert({id, owner_id: owner, direction, kind: v.kind, title: v.title, note: v.note || '', original_name: v.name, mime: v.mime, bytes: v.bytes, object_path: path, requires_signature: !!v.requires_signature, status: 'uploading', created_by: by}));
    const signed = await client.storage.from(bucket).createSignedUploadUrl(path);
    if (signed.error) throw Error('Upload could not be started');
    return {id, path, token: signed.data.token};
  }
  async function finishUpload(client, row, nextStatus) {
    const file = await client.storage.from(bucket).download(row.object_path);
    const bytes = file.data ? Buffer.from(await file.data.arrayBuffer()) : null;
    let ok = !!bytes && bytes.length === row.bytes && validSignature(row.mime, bytes), reason = 'El archivo no coincide con el tipo indicado (PDF, JPG o PNG).';
    if (ok && row.requires_signature) {
      try { const {PDFDocument} = await import('pdf-lib'); await PDFDocument.load(bytes, {updateMetadata: false}); }
      catch { ok = false; reason = 'Este PDF está protegido o dañado y no se puede firmar. Sube una versión sin contraseña.'; }
    }
    if (!ok) {
      await client.storage.from(bucket).remove([row.object_path]);
      await client.from('mt_staff_documents').delete().eq('id', row.id);
      throw new Http(400, reason);
    }
    check(await client.from('mt_staff_documents').update({status: nextStatus, sha256: createHash('sha256').update(bytes).digest('hex'), updated_at: new Date().toISOString()}).eq('id', row.id));
  }
  const uploadSchema = z.object({title: z.string().trim().min(1).max(200), note: z.string().trim().max(2000).default(''), kind: z.enum(DOC_KINDS).default('other'), name: z.string().min(1).max(200), mime: z.enum(DOC_MIMES), bytes: z.number().int().min(1).max(10 * MB), requires_signature: z.boolean().default(false)}).strict();

  // --- administración ---
  app.get('/api/admin/hr-docs/summary', requireStaff, requireAdmin, wrap(async (req, res) => {
    const r = await db().from('mt_staff_documents').select('direction,status,admin_seen_at').in('status', ['submitted', 'signed']).limit(5000);
    if (r.error) return res.json({data: {attention: 0, to_review: 0, signed_new: 0, available: false}});
    const to_review = r.data.filter(d => d.direction === 'from_employee' && d.status === 'submitted').length, signed_new = r.data.filter(d => d.status === 'signed' && !d.admin_seen_at).length;
    res.json({data: {attention: to_review + signed_new, to_review, signed_new, available: true}});
  }));
  app.get('/api/admin/hr-docs', requireStaff, requireAdmin, wrap(async (req, res) => {
    const client = db();
    let q = client.from('mt_staff_documents').select(docFields).neq('status', 'uploading').order('created_at', {ascending: false}).limit(500);
    if (req.query.owner) q = q.eq('owner_id', uuid.parse(req.query.owner));
    const rows = check(await q), ids = [...new Set(rows.map(r => r.owner_id))];
    const names = new Map(ids.length ? check(await client.from('crm_staff').select('user_id,full_name').in('user_id', ids)).map(s => [s.user_id, s.full_name]) : []);
    res.json({data: rows.map(r => shape(r, names))});
  }));
  app.post('/api/admin/hr-docs/start', requireStaff, requireAdmin, writeLimit, wrap(async (req, res) => {
    const {owner_id, ...rest} = req.body || {}, owner = uuid.parse(owner_id), v = uploadSchema.parse(rest), client = db();
    if (v.requires_signature && v.mime !== 'application/pdf') throw new Http(400, 'Solo los PDF se pueden enviar para firmar.');
    const person = check(await client.from('crm_staff').select('user_id,active').eq('user_id', owner).maybeSingle());
    if (!person?.active) throw new Http(400, 'El empleado no está activo.');
    res.json(await startUpload(client, {owner, by: req.staff.user_id, direction: 'to_employee', v}));
  }));
  app.post('/api/admin/hr-docs/finish', requireStaff, requireAdmin, writeLimit, wrap(async (req, res) => {
    const id = uuid.parse(req.body?.id), client = db();
    const row = check(await client.from('mt_staff_documents').select('*').eq('id', id).eq('direction', 'to_employee').eq('status', 'uploading').maybeSingle());
    if (!row) throw new Http(400, 'La subida no está pendiente.');
    await finishUpload(client, row, 'sent');
    res.json({ok: true});
  }));
  app.get('/api/admin/hr-docs/:id/file', requireStaff, requireAdmin, wrap(async (req, res) => {
    const id = uuid.parse(req.params.id), variant = req.query.variant === 'signed' ? 'signed' : 'original', client = db();
    const row = check(await client.from('mt_staff_documents').select('id,object_path,signed_path,original_name,title,status,admin_seen_at').eq('id', id).maybeSingle());
    if (!row || row.status === 'uploading') throw new Http(404, 'Documento no encontrado.');
    const path = variant === 'signed' && row.signed_path ? row.signed_path : row.object_path;
    const view = await client.storage.from(bucket).createSignedUrl(path, 300), download = await client.storage.from(bucket).createSignedUrl(path, 300, {download: variant === 'signed' && row.signed_path ? `${row.title}_signed.pdf` : row.original_name});
    if (row.status === 'signed' && !row.admin_seen_at) await client.from('mt_staff_documents').update({admin_seen_at: new Date().toISOString()}).eq('id', id);
    res.json({url: view.data?.signedUrl || null, download_url: download.data?.signedUrl || null});
  }));
  app.post('/api/admin/hr-docs/:id/review', requireStaff, requireAdmin, writeLimit, wrap(async (req, res) => {
    const id = uuid.parse(req.params.id), v = z.object({decision: z.enum(['approved', 'rejected']), note: z.string().trim().max(1000).default('')}).strict().parse(req.body), client = db();
    const row = check(await client.from('mt_staff_documents').select('id,direction,status').eq('id', id).maybeSingle());
    if (!row || row.direction !== 'from_employee' || row.status === 'uploading') throw new Http(400, 'Solo se revisan documentos enviados por el empleado.');
    check(await client.from('mt_staff_documents').update({status: v.decision, review_note: v.note, reviewed_at: new Date().toISOString(), reviewed_by: req.staff.user_id, admin_seen_at: new Date().toISOString(), updated_at: new Date().toISOString()}).eq('id', id));
    res.json({ok: true});
  }));
  app.post('/api/admin/hr-docs/:id/seen', requireStaff, requireAdmin, wrap(async (req, res) => {
    const id = uuid.parse(req.params.id);
    check(await db().from('mt_staff_documents').update({admin_seen_at: new Date().toISOString()}).eq('id', id).is('admin_seen_at', null));
    res.json({ok: true});
  }));
  // Retirar un documento enviado (los firmados no se pueden retirar: son el justificante).
  app.delete('/api/admin/hr-docs/:id', requireStaff, requireAdmin, writeLimit, wrap(async (req, res) => {
    const id = uuid.parse(req.params.id), client = db();
    const row = check(await client.from('mt_staff_documents').select('id,status,object_path,direction').eq('id', id).maybeSingle());
    if (!row) throw new Http(404, 'Documento no encontrado.');
    if (row.status === 'signed') throw new Http(400, 'Un documento firmado no se puede retirar.');
    await client.storage.from(bucket).remove([row.object_path]);
    check(await client.from('mt_staff_documents').delete().eq('id', id));
    res.json({ok: true});
  }));

  // --- empleado (también lo usa el admin en modo vista con ?owner=) ---
  const ownerScope = req => { if (!req.query.owner) return req.staff.user_id; if (req.staff.role !== 'admin') throw new Http(403, 'Not allowed.'); return uuid.parse(req.query.owner); };
  app.get('/api/workspace/hr-docs/summary', requireStaff, wrap(async (req, res) => {
    const r = await db().from('mt_staff_documents').select('status,requires_signature,direction').eq('owner_id', ownerScope(req)).eq('direction', 'to_employee').in('status', ['sent', 'viewed']).limit(500);
    if (r.error) return res.json({data: {to_sign: 0, unread: 0}});
    res.json({data: {to_sign: r.data.filter(d => d.requires_signature).length, unread: r.data.filter(d => d.status === 'sent').length}});
  }));
  app.get('/api/workspace/hr-docs', requireStaff, wrap(async (req, res) => {
    const rows = check(await db().from('mt_staff_documents').select(docFields).eq('owner_id', ownerScope(req)).neq('status', 'uploading').order('created_at', {ascending: false}).limit(300));
    res.json({data: rows.map(r => { const s = shape(r); delete s.admin_seen_at; delete s.needs_admin; return s; })});
  }));
  app.post('/api/workspace/hr-docs/start', requireStaff, writeLimit, wrap(async (req, res) => {
    const v = uploadSchema.parse({...(req.body || {}), requires_signature: false});
    res.json(await startUpload(db(), {owner: req.staff.user_id, by: req.staff.user_id, direction: 'from_employee', v}));
  }));
  app.post('/api/workspace/hr-docs/finish', requireStaff, writeLimit, wrap(async (req, res) => {
    const id = uuid.parse(req.body?.id), client = db();
    const row = check(await client.from('mt_staff_documents').select('*').eq('id', id).eq('owner_id', req.staff.user_id).eq('direction', 'from_employee').eq('status', 'uploading').maybeSingle());
    if (!row) throw new Http(400, 'Upload not pending.');
    await finishUpload(client, row, 'submitted');
    res.json({ok: true});
  }));
  app.get('/api/workspace/hr-docs/:id/file', requireStaff, wrap(async (req, res) => {
    const id = uuid.parse(req.params.id), owner = ownerScope(req), client = db(), variant = req.query.variant === 'signed' ? 'signed' : 'original';
    const row = check(await client.from('mt_staff_documents').select('id,owner_id,object_path,signed_path,original_name,title,status,direction').eq('id', id).eq('owner_id', owner).maybeSingle());
    if (!row || row.status === 'uploading') throw new Http(404, 'Document not found.');
    const path = variant === 'signed' && row.signed_path ? row.signed_path : row.object_path;
    const view = await client.storage.from(bucket).createSignedUrl(path, 300), download = await client.storage.from(bucket).createSignedUrl(path, 300, {download: variant === 'signed' && row.signed_path ? `${row.title}_signed.pdf` : row.original_name});
    // Solo el propio empleado marca como leído (no el admin en modo vista).
    if (!req.query.owner && row.direction === 'to_employee' && row.status === 'sent') await client.from('mt_staff_documents').update({status: 'viewed', viewed_at: new Date().toISOString(), updated_at: new Date().toISOString()}).eq('id', id).eq('status', 'sent');
    res.json({url: view.data?.signedUrl || null, download_url: download.data?.signedUrl || null});
  }));
  app.post('/api/workspace/hr-docs/:id/sign', requireStaff, signLimit, wrap(async (req, res) => {
    const id = uuid.parse(req.params.id), client = db();
    const v = z.object({full_name: z.string().trim().min(3).max(200), method: z.enum(['drawn', 'typed']), strokes: z.array(z.any()).max(80).optional(), agree: z.literal(true)}).strict().parse(req.body);
    const strokes = v.method === 'drawn' ? cleanStrokes(v.strokes) : null;
    if (v.method === 'drawn' && !strokes) throw new Http(400, 'Please draw your signature in the box, or type your full name instead.');
    const row = check(await client.from('mt_staff_documents').select('*').eq('id', id).eq('owner_id', req.staff.user_id).maybeSingle());
    if (!row || row.direction !== 'to_employee' || !row.requires_signature) throw new Http(404, 'Document not found.');
    if (row.status === 'signed') throw new Http(409, 'This document is already signed.');
    if (!['sent', 'viewed'].includes(row.status)) throw new Http(400, 'This document cannot be signed.');
    const file = await client.storage.from(bucket).download(row.object_path);
    const original = file.data ? Buffer.from(await file.data.arrayBuffer()) : null;
    const hash = original ? createHash('sha256').update(original).digest('hex') : '';
    if (!original || (row.sha256 && row.sha256 !== hash)) throw new Http(409, 'The document changed. Ask your administrator to send it again.');
    const [person, dir, user] = await Promise.all([
      client.from('crm_staff').select('full_name').eq('user_id', req.staff.user_id).maybeSingle(),
      client.from('mt_employee_directory').select('employee_number').eq('user_id', req.staff.user_id).maybeSingle(),
      client.auth.admin.getUserById(req.staff.user_id).catch(() => ({}))
    ]);
    const signedAt = new Date(), ip = ipOf(req).slice(0, 64), ua = String(req.get('user-agent') || '').slice(0, 300);
    let signed;
    try {
      signed = await stampSignature(original, {title: row.title, originalName: row.original_name, documentId: row.id, signerName: v.full_name, signerEmail: user?.data?.user?.email, employeeCode: employeeCode(dir.data?.employee_number), signedAt, method: v.method, strokes, ip, originalHash: hash});
    } catch { throw new Http(400, 'This PDF could not be signed. Ask your administrator to upload an unprotected PDF.'); }
    const path = `${row.owner_id}/hr/${row.id}-signed.pdf`;
    const up = await client.storage.from(bucket).upload(path, signed, {contentType: 'application/pdf', upsert: false});
    if (up.error) throw Error('Signed file could not be stored');
    const updated = check(await client.from('mt_staff_documents').update({status: 'signed', signed_path: path, signed_sha256: createHash('sha256').update(signed).digest('hex'), signed_at: signedAt.toISOString(), signer_name: v.full_name, signature_method: v.method, signer_ip: ip, signer_user_agent: ua, admin_seen_at: null, viewed_at: row.viewed_at || signedAt.toISOString(), updated_at: signedAt.toISOString()}).eq('id', id).in('status', ['sent', 'viewed']).select('id'));
    if (!updated.length) { await client.storage.from(bucket).remove([path]); throw new Http(409, 'This document is already signed.'); }
    const emailed = await emailSigned({doc: row, owner: person.data?.full_name || v.full_name, bytes: signed});
    res.json({ok: true, emailed});
  }));
}
