// global-passport-v1 · MUK Talent GLOBAL PASSPORT
// Student portal (My Global Journey) + Counsellor Control Centre.
// All data lives in private gp_* tables; only this server (service role) touches them,
// after verifying the Supabase session and the caller's relationship to the file.
import { createClient } from "@supabase/supabase-js";
import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import { randomUUID } from "node:crypto";
import { z } from "zod";

export const BUCKET = "passport-docs";
export const DESTINATIONS = { UK: { label: "United Kingdom", active: true }, CA: { label: "Canada", active: false }, US: { label: "United States", active: false } };
export const STAGES = [
  ["registration", "Registration & assessment"],
  ["university", "University selection"],
  ["documents", "Document preparation"],
  ["application", "Admission application"],
  ["offer", "University offer"],
  ["visa", "Visa preparation"],
  ["travel", "Travel preparation"],
  ["arrival", "Arrival at destination"]
];
const STAGE_KEYS = STAGES.map(s => s[0]);
export const STATUSES = ["profile", "preparing", "submitted", "awaiting", "offer", "visa", "travel", "enrolled", "on_hold", "withdrawn"];
export const STUDY_LEVELS = ["Foundation", "Undergraduate", "Postgraduate taught (Master's)", "Postgraduate research (PhD)", "English language course", "Not sure yet"];
const MIME = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX_BYTES = 10 * 1024 * 1024;

// UK checklist seeded for every new student.
export const UK_CHECKLIST = [
  ["passport", "Passport (photo page)", "documents"],
  ["transcripts", "Academic transcripts", "documents"],
  ["certificates", "Diplomas / certificates", "documents"],
  ["english", "English test (IELTS UKVI, PTE…) or waiver", "documents"],
  ["statement", "Personal statement", "application"],
  ["cv", "CV", "application"],
  ["references", "Reference letter(s)", "application"],
  ["funds", "Proof of funds (28-day bank statement)", "visa"]
];
export const UK_TASKS = [
  ["registration", "Complete your Global Passport profile"],
  ["university", "Confirm your shortlist of UK universities with your counsellor"],
  ["documents", "Upload your passport and academic transcripts"],
  ["application", "Write the first draft of your personal statement"],
  ["visa", "Book your TB test if your country requires it"]
];

const iso = z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/);
const text = (max, min = 0) => z.string().trim().min(min).max(max);
const optText = max => z.union([z.literal(""), z.null(), text(max)]).optional().transform(v => (v === "" || v == null ? null : v));
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => !Number.isNaN(Date.parse(v + "T12:00:00Z")), "Invalid date");
const optDate = z.union([z.literal(""), z.null(), date]).optional().transform(v => (v === "" || v == null ? null : v));
const phone = z.union([z.literal(""), z.null(), z.string().trim().regex(/^\+?[0-9 ().-]{6,24}$/)]).optional().transform(v => (v ? v.replace(/[^\d+]/g, "") : null));

const COUNTRY_NAMES = (() => { try { return new Intl.DisplayNames(["en"], { type: "region", fallback: "none" }); } catch { return null; } })();
export function validCountry(code) { if (!/^[A-Z]{2}$/.test(code) || ["AA", "QM", "QZ", "XX", "ZZ", "EU", "UN"].includes(code)) return false; const name = COUNTRY_NAMES?.of(code); return COUNTRY_NAMES ? Boolean(name) && name !== code : true; }

export const registrationSchema = z.object({
  full_name: text(120, 2),
  phone,
  country_residence: iso.refine(validCountry, "Unknown country"),
  nationality: iso.refine(validCountry, "Unknown country"),
  date_of_birth: optDate,
  destination: z.enum(["UK", "CA", "US"]).default("UK"),
  study_level: z.enum(STUDY_LEVELS),
  subject: text(120, 2),
  intake: optText(40),
  english_test: optText(80),
  consent: z.literal(true)
}).strict();
export const studentUpdateSchema = z.object({
  full_name: text(120, 2).optional(), phone, date_of_birth: optDate, study_level: z.enum(STUDY_LEVELS).optional(),
  subject: text(120, 2).optional(), intake: optText(40), english_test: optText(80), university: optText(160), programme: optText(160),
  country_residence: iso.refine(validCountry).optional(), nationality: iso.refine(validCountry).optional()
}).strict();
export const counsellorUpdateSchema = z.object({
  university: optText(160), programme: optText(160), intake: optText(40), study_level: z.enum(STUDY_LEVELS).optional(), subject: text(120, 2).optional(),
  english_test: optText(80), application_status: z.enum(STATUSES).optional(), urgent: z.boolean().optional(), counsellor_id: z.string().uuid().nullable().optional()
}).strict();
const messageSchema = z.object({ body: text(2000, 1), kind: z.enum(["message", "update"]).default("message") }).strict();
const taskSchema = z.object({ title: text(160, 2), detail: optText(2000), due_date: optDate, stage_key: z.enum(STAGE_KEYS) }).strict();
const docRequestSchema = z.object({ label: text(160, 2), doc_type: z.string().trim().regex(/^[a-z0-9_-]{2,40}$/).default("other"), stage_key: z.enum(STAGE_KEYS).default("documents"), message: optText(600) }).strict();
const reviewSchema = z.object({ status: z.enum(["approved", "rejected"]), note: optText(1000) }).strict();
const eventSchema = z.object({ title: text(160, 2), starts_on: date, kind: z.enum(["deadline", "meeting", "intake", "visa", "travel", "other"]).default("deadline") }).strict();
const uploadSchema = z.object({ file_name: text(160, 1), mime: z.enum(Object.keys(MIME)), size: z.number().int().min(1).max(MAX_BYTES) }).strict();
const settingsSchema = z.object({ accepting: z.boolean(), capacity: z.number().int().min(0).max(1000) }).strict();
const uuid = z.string().uuid();

export class PassportError extends Error { constructor(message, status = 400) { super(message); this.status = status; } }

// Application readiness: profile 25% · documents 45% · journey 30%.
export function readiness({ student, documents = [], stages = [] }) {
  const fields = ["phone", "country_residence", "nationality", "date_of_birth", "study_level", "subject", "intake", "english_test", "university", "programme"];
  const profile = fields.filter(f => student?.[f]).length / fields.length;
  const required = documents.filter(d => d.required && d.stage_key !== "visa" && d.stage_key !== "travel");
  const docScore = required.length ? required.reduce((n, d) => n + (d.status === "approved" ? 1 : d.status === "uploaded" ? 0.5 : 0), 0) / required.length : 0;
  const stageScore = stages.length ? stages.reduce((n, s) => n + (s.status === "done" ? 1 : s.status === "in_progress" ? 0.4 : 0), 0) / STAGES.length : 0;
  return Math.max(0, Math.min(100, Math.round(profile * 25 + docScore * 45 + stageScore * 30)));
}
export function stageTitle(key) { return STAGES.find(s => s[0] === key)?.[1] || key; }
export function seedStages(studentId) {
  return STAGES.map(([key], i) => ({ student_id: studentId, stage_key: key, position: i + 1, status: i === 0 ? "done" : i === 1 ? "in_progress" : "pending" }));
}
export function seedDocuments(studentId) { return UK_CHECKLIST.map(([doc_type, label, stage_key]) => ({ student_id: studentId, doc_type, label, stage_key, required: true, status: "requested" })); }
export function seedTasks(studentId, now = new Date()) {
  return UK_TASKS.map(([stage_key, title], i) => {
    const due = new Date(now.getTime() + (i + 1) * 7 * 86400000).toISOString().slice(0, 10);
    return { student_id: studentId, stage_key, title, status: i === 0 ? "done" : "open", due_date: i === 0 ? null : due, done_at: i === 0 ? now.toISOString() : null };
  });
}
// Caseload summary for the Control Centre.
export function caseload(rows, today = new Date().toISOString().slice(0, 10)) {
  const soon = new Date(Date.parse(today + "T12:00:00Z") + 7 * 86400000).toISOString().slice(0, 10);
  const attention = r => r.urgent || r.overdue_tasks > 0 || (r.next_event && r.next_event.starts_on <= soon && r.readiness < 60) || r.unread > 0 && r.unread_since && (Date.now() - Date.parse(r.unread_since)) > 48 * 3600000;
  return {
    assigned: rows.filter(r => !["enrolled", "withdrawn"].includes(r.application_status)).length,
    preparing: rows.filter(r => ["profile", "preparing"].includes(r.application_status)).length,
    documents_review: rows.reduce((n, r) => n + (r.docs_to_review || 0), 0),
    awaiting: rows.filter(r => ["submitted", "awaiting"].includes(r.application_status)).length,
    attention: rows.filter(attention).length,
    attention_ids: rows.filter(attention).map(r => r.user_id)
  };
}
export function safeFileName(name) { return String(name).normalize("NFKD").replace(/[^\w.\- ]+/g, "").replace(/\s+/g, "-").slice(0, 120) || "document"; }

function service() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new PassportError("Global Passport is not active yet. Ask your administrator to finish the setup.", 503);
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}
function ok(r, what = "Database operation failed") {
  if (r.error) { const missing = r.error.code === "42P01" || r.error.code === "PGRST205"; throw new PassportError(missing ? "Global Passport database is not installed yet. Run supabase/global-passport.sql." : what, 503); }
  return r.data;
}
function bearer(req) { const m = /^Bearer ([^\s]+)$/i.exec(req.get("authorization") || ""); return m && m[1].length < 16384 ? m[1] : null; }
function ip(req) { return (process.env.VERCEL ? String(req.headers["x-vercel-forwarded-for"] || req.headers["x-forwarded-for"] || "").split(",")[0].trim() : req.ip) || "127.0.0.1"; }

export function mountGlobalPassport(app, { requireStaff, db = service }) {
  const wrap = fn => async (req, res) => {
    try { await fn(req, res); } catch (e) {
      if (e instanceof z.ZodError) return res.status(400).json({ error: "Please check the highlighted fields.", fields: e.issues.map(i => i.path.join(".")), requestId: req.requestId });
      const status = e.status || 503; if (status >= 500) console.error(JSON.stringify({ requestId: req.requestId, scope: "global-passport", error: e.message }));
      res.status(status).json({ error: e instanceof PassportError ? e.message : "Global Passport is temporarily unavailable. Try again.", requestId: req.requestId });
    }
  };
  const limiter = (limit, minutes = 15) => rateLimit({ windowMs: minutes * 60000, limit, keyGenerator: req => ipKeyGenerator(ip(req)), validate: { xForwardedForHeader: false }, standardHeaders: "draft-7", legacyHeaders: false, message: { error: "Too many requests. Wait a few minutes and try again." } });

  async function user(req) {
    const token = bearer(req); if (!token) throw new PassportError("Sign in to continue.", 401);
    const client = db(); const { data, error } = await client.auth.getUser(token);
    if (error || !data?.user) throw new PassportError("Session expired. Sign in again.", 401);
    return { client, user: data.user };
  }
  const requireStudent = fn => wrap(async (req, res) => {
    const { client, user: u } = await user(req);
    const staff = ok(await client.from("crm_staff").select("user_id").eq("user_id", u.id).maybeSingle());
    if (staff) throw new PassportError("Team accounts use the Counsellor Control Centre.", 403);
    if (!u.email_confirmed_at && !u.confirmed_at) throw new PassportError("Confirm your email address first. Check your inbox.", 403);
    const student = ok(await client.from("gp_students").select("*").eq("user_id", u.id).maybeSingle());
    req.gp = { client, user: u, student };
    await fn(req, res);
  });
  // Counsellor guard: assigned counsellor or administrator.
  async function caseFor(req, id) {
    const client = db(); const studentId = uuid.parse(id);
    const student = ok(await client.from("gp_students").select("*").eq("user_id", studentId).maybeSingle());
    if (!student) throw new PassportError("Student not found.", 404);
    if (req.staff.role !== "admin" && student.counsellor_id !== req.staff.user_id) throw new PassportError("This student is assigned to another counsellor.", 403);
    return { client, student };
  }
  async function counsellorCard(client, id) {
    if (!id) return null;
    const s = ok(await client.from("crm_staff").select("user_id,full_name,active").eq("user_id", id).maybeSingle()); if (!s) return null;
    const d = await client.from("mt_employee_directory").select("job_title,assigned_city,contact_email,contact_phone,publish_contact,languages").eq("user_id", id).maybeSingle();
    let avatar_url = null;
    const a = await client.from("mt_employee_assets").select("object_path").eq("owner_id", id).eq("category", "avatar").eq("state", "uploaded").order("created_at", { ascending: false }).limit(1);
    if (!a.error && a.data?.[0]) avatar_url = (await client.storage.from("mt-employee-private").createSignedUrl(a.data[0].object_path, 600)).data?.signedUrl || null;
    const dir = d.error ? {} : d.data || {};
    return { user_id: s.user_id, full_name: s.full_name, job_title: dir.job_title || "Student Recruitment Counsellor", city: dir.assigned_city || null, languages: dir.languages || null, email: dir.publish_contact ? dir.contact_email || null : null, phone: dir.publish_contact ? dir.contact_phone || null : null, avatar_url };
  }
  async function bundle(client, student, { forStaff = false } = {}) {
    const id = student.user_id;
    const [stages, tasks, documents, events, messages, notes] = await Promise.all([
      client.from("gp_stages").select("stage_key,position,status,updated_at").eq("student_id", id).order("position"),
      client.from("gp_tasks").select("id,stage_key,title,detail,due_date,status,created_at,done_at").eq("student_id", id).order("created_at"),
      client.from("gp_documents").select("id,stage_key,doc_type,label,required,status,file_name,mime,size_bytes,review_note,uploaded_at,reviewed_at,created_at").eq("student_id", id).order("created_at"),
      client.from("gp_events").select("id,title,starts_on,kind").eq("student_id", id).order("starts_on"),
      client.from("gp_messages").select("id,sender_role,kind,body,read_at,created_at").eq("student_id", id).order("created_at", { ascending: false }).limit(120),
      forStaff ? client.from("gp_notes").select("id,body,created_at,author_id").eq("student_id", id).order("created_at", { ascending: false }).limit(100) : Promise.resolve({ data: [] })
    ]);
    const out = { student, stages: ok(stages), tasks: ok(tasks), documents: ok(documents), events: ok(events), messages: ok(messages).reverse(), counsellor: await counsellorCard(client, student.counsellor_id) };
    out.readiness = readiness(out);
    out.stage_titles = Object.fromEntries(STAGES);
    out.destinations = DESTINATIONS;
    if (forStaff) out.notes = ok(notes);
    return out;
  }
  async function post(client, studentId, sender_role, sender_id, body, kind = "message") {
    ok(await client.from("gp_messages").insert({ student_id: studentId, sender_role, sender_id, body: body.slice(0, 2000), kind }));
  }
  async function touch(client, id) { ok(await client.from("gp_students").update({ updated_at: new Date().toISOString() }).eq("user_id", id)); }

  // ---------- Shared: who is signed in ----------
  app.get("/api/whoami", limiter(240), wrap(async (req, res) => {
    const { client, user: u } = await user(req);
    const staff = ok(await client.from("crm_staff").select("role,active").eq("user_id", u.id).maybeSingle());
    if (staff) return res.json({ kind: staff.active ? "staff" : "inactive", email: u.email });
    const student = ok(await client.from("gp_students").select("reference,full_name").eq("user_id", u.id).maybeSingle());
    res.json({ kind: student ? "student" : "new", email: u.email, confirmed: Boolean(u.email_confirmed_at || u.confirmed_at), name: student?.full_name || u.user_metadata?.full_name || null, destinations: DESTINATIONS, levels: STUDY_LEVELS });
  }));

  // ---------- Student portal ----------
  app.post("/api/passport/register", limiter(10, 60), requireStudent(async (req, res) => {
    const { client, user: u } = req.gp;
    if (req.gp.student) return res.json({ data: await bundle(client, req.gp.student) });
    const v = registrationSchema.parse(req.body);
    if (!DESTINATIONS[v.destination].active) throw new PassportError(DESTINATIONS[v.destination].label + " is coming soon. Choose United Kingdom for now.", 400);
    const { consent, ...values } = v;
    const row = ok(await client.from("gp_students").insert({ ...values, user_id: u.id, email: u.email, application_status: "profile" }).select("*").single(), "Unable to create your Global Passport.");
    ok(await client.from("gp_stages").insert(seedStages(u.id)));
    ok(await client.from("gp_documents").insert(seedDocuments(u.id)));
    ok(await client.from("gp_tasks").insert(seedTasks(u.id)));
    const assigned = ok(await client.rpc("gp_assign_counsellor", { p_student: u.id }));
    const counsellor = assigned ? await counsellorCard(client, assigned) : null;
    await post(client, u.id, "system", null, `Welcome to your Global Passport, ${values.full_name.split(" ")[0]}. Your file ${row.reference} is open for the United Kingdom.` + (counsellor ? ` ${counsellor.full_name} is your counsellor and will contact you within 2 working days.` : " A counsellor will be assigned to you shortly."), "system");
    const fresh = ok(await client.from("gp_students").select("*").eq("user_id", u.id).single());
    res.status(201).json({ data: await bundle(client, fresh) });
  }));
  app.get("/api/passport/me", requireStudent(async (req, res) => {
    const { client, student } = req.gp; if (!student) throw new PassportError("Create your Global Passport first.", 404);
    const now = new Date().toISOString();
    await client.from("gp_messages").update({ read_at: now }).eq("student_id", student.user_id).neq("sender_role", "student").is("read_at", null);
    await client.from("gp_students").update({ student_seen_at: now }).eq("user_id", student.user_id);
    res.json({ data: await bundle(client, student) });
  }));
  app.patch("/api/passport/me", requireStudent(async (req, res) => {
    const { client, student } = req.gp; if (!student) throw new PassportError("Create your Global Passport first.", 404);
    const v = studentUpdateSchema.parse(req.body);
    const row = ok(await client.from("gp_students").update({ ...v, updated_at: new Date().toISOString() }).eq("user_id", student.user_id).select("*").single());
    res.json({ data: await bundle(client, row) });
  }));
  app.post("/api/passport/tasks/:id", requireStudent(async (req, res) => {
    const { client, student } = req.gp; if (!student) throw new PassportError("Create your Global Passport first.", 404);
    const done = z.object({ done: z.boolean() }).strict().parse(req.body).done;
    const r = ok(await client.from("gp_tasks").update({ status: done ? "done" : "open", done_at: done ? new Date().toISOString() : null }).eq("id", uuid.parse(req.params.id)).eq("student_id", student.user_id).select("id,title").maybeSingle());
    if (!r) throw new PassportError("Task not found.", 404);
    if (done) await post(client, student.user_id, "system", null, `Task completed: ${r.title}`, "system");
    await touch(client, student.user_id); res.json({ ok: true });
  }));
  app.post("/api/passport/documents/:id/upload-url", limiter(60), requireStudent(async (req, res) => {
    const { client, student } = req.gp; if (!student) throw new PassportError("Create your Global Passport first.", 404);
    const v = uploadSchema.parse(req.body);
    const doc = ok(await client.from("gp_documents").select("id,status").eq("id", uuid.parse(req.params.id)).eq("student_id", student.user_id).maybeSingle());
    if (!doc) throw new PassportError("Document not found.", 404);
    if (doc.status === "approved") throw new PassportError("This document is already approved.", 409);
    const path = `${student.user_id}/${doc.id}/${randomUUID()}.${MIME[v.mime]}`;
    const signed = ok(await client.storage.from(BUCKET).createSignedUploadUrl(path), "Upload is not available. The storage bucket may be missing.");
    res.json({ data: { path, token: signed.token, signed_url: signed.signedUrl, bucket: BUCKET } });
  }));
  app.post("/api/passport/documents/:id/uploaded", requireStudent(async (req, res) => {
    const { client, student } = req.gp; if (!student) throw new PassportError("Create your Global Passport first.", 404);
    const v = z.object({ path: z.string().max(400), file_name: text(160, 1), mime: z.enum(Object.keys(MIME)), size: z.number().int().min(1).max(MAX_BYTES) }).strict().parse(req.body);
    const docId = uuid.parse(req.params.id);
    if (!v.path.startsWith(`${student.user_id}/${docId}/`) || v.path.includes("..")) throw new PassportError("Invalid upload.", 400);
    const folder = v.path.slice(0, v.path.lastIndexOf("/")), name = v.path.slice(v.path.lastIndexOf("/") + 1);
    const listed = ok(await client.storage.from(BUCKET).list(folder, { search: name, limit: 5 }));
    if (!listed?.some(f => f.name === name)) throw new PassportError("We could not find the uploaded file. Try again.", 400);
    const r = ok(await client.from("gp_documents").update({ status: "uploaded", object_path: v.path, file_name: safeFileName(v.file_name), mime: v.mime, size_bytes: v.size, uploaded_at: new Date().toISOString(), review_note: null }).eq("id", docId).eq("student_id", student.user_id).neq("status", "approved").select("label").maybeSingle());
    if (!r) throw new PassportError("Document not found.", 404);
    const stage = ok(await client.from("gp_stages").select("status").eq("student_id", student.user_id).eq("stage_key", "documents").maybeSingle());
    if (stage?.status === "pending") ok(await client.from("gp_stages").update({ status: "in_progress", updated_at: new Date().toISOString() }).eq("student_id", student.user_id).eq("stage_key", "documents"));
    if (student.application_status === "profile") ok(await client.from("gp_students").update({ application_status: "preparing" }).eq("user_id", student.user_id));
    await post(client, student.user_id, "system", null, `Document uploaded for review: ${r.label}`, "system");
    await touch(client, student.user_id); res.json({ ok: true });
  }));
  app.get("/api/passport/documents/:id/url", requireStudent(async (req, res) => {
    const { client, student } = req.gp; if (!student) throw new PassportError("Create your Global Passport first.", 404);
    const doc = ok(await client.from("gp_documents").select("object_path,file_name").eq("id", uuid.parse(req.params.id)).eq("student_id", student.user_id).maybeSingle());
    if (!doc?.object_path) throw new PassportError("No file uploaded yet.", 404);
    const s = ok(await client.storage.from(BUCKET).createSignedUrl(doc.object_path, 300, { download: doc.file_name || true }));
    res.json({ data: { url: s.signedUrl } });
  }));
  app.post("/api/passport/messages", limiter(40), requireStudent(async (req, res) => {
    const { client, student, user: u } = req.gp; if (!student) throw new PassportError("Create your Global Passport first.", 404);
    const v = z.object({ body: text(2000, 1) }).strict().parse(req.body);
    await post(client, student.user_id, "student", u.id, v.body, "message"); await touch(client, student.user_id);
    res.status(201).json({ ok: true });
  }));

  // ---------- Counsellor Control Centre ----------
  app.get("/api/gp/students", requireStaff, wrap(async (req, res) => {
    const client = db(), all = req.staff.role === "admin" && req.query.scope === "all";
    let q = client.from("gp_students").select("user_id,reference,full_name,email,country_residence,nationality,destination,study_level,subject,intake,university,programme,phone,date_of_birth,english_test,counsellor_id,application_status,urgent,created_at,updated_at,counsellor_seen_at").order("updated_at", { ascending: false }).limit(500);
    if (!all) q = q.eq("counsellor_id", req.staff.user_id);
    const students = ok(await q), ids = students.map(s => s.user_id);
    const today = new Date().toISOString().slice(0, 10);
    const [docs, stages, tasks, events, unread] = ids.length ? await Promise.all([
      client.from("gp_documents").select("student_id,status,required,stage_key").in("student_id", ids),
      client.from("gp_stages").select("student_id,stage_key,status,position").in("student_id", ids),
      client.from("gp_tasks").select("student_id,status,due_date").in("student_id", ids).eq("status", "open"),
      client.from("gp_events").select("student_id,title,starts_on,kind").in("student_id", ids).gte("starts_on", today).order("starts_on"),
      client.from("gp_messages").select("student_id,created_at").in("student_id", ids).eq("sender_role", "student").is("read_at", null)
    ]).then(rs => rs.map(r => ok(r))) : [[], [], [], [], []];
    const by = (list, id) => list.filter(x => x.student_id === id);
    const rows = students.map(s => {
      const sd = by(docs, s.user_id), st = by(stages, s.user_id).sort((a, b) => a.position - b.position), un = by(unread, s.user_id);
      const current = st.find(x => x.status === "in_progress") || st.find(x => x.status === "pending") || st[st.length - 1];
      return { ...s, readiness: readiness({ student: s, documents: sd, stages: st }), docs_to_review: sd.filter(d => d.status === "uploaded").length, docs_missing: sd.filter(d => d.required && ["requested", "rejected"].includes(d.status)).length,
        overdue_tasks: by(tasks, s.user_id).filter(t => t.due_date && t.due_date < today).length, open_tasks: by(tasks, s.user_id).length, next_event: by(events, s.user_id)[0] || null,
        unread: un.length, unread_since: un.map(m => m.created_at).sort()[0] || null, current_stage: current?.stage_key || "registration", stages_done: st.filter(x => x.status === "done").length };
    });
    const counsellors = req.staff.role === "admin" ? ok(await client.from("crm_staff").select("user_id,full_name,role,active").eq("active", true).order("full_name")) : [];
    const settings = ok(await client.from("gp_counsellor_settings").select("accepting,capacity").eq("user_id", req.staff.user_id).maybeSingle()) || { accepting: true, capacity: 60 };
    res.json({ data: rows, metrics: caseload(rows, today), counsellors, settings, scope: all ? "all" : "mine", stage_titles: Object.fromEntries(STAGES) });
  }));
  app.get("/api/gp/students/:id", requireStaff, wrap(async (req, res) => {
    const { client, student } = await caseFor(req, req.params.id);
    const now = new Date().toISOString();
    if (student.counsellor_id === req.staff.user_id) {
      await client.from("gp_messages").update({ read_at: now }).eq("student_id", student.user_id).eq("sender_role", "student").is("read_at", null);
      await client.from("gp_students").update({ counsellor_seen_at: now }).eq("user_id", student.user_id);
    }
    const out = await bundle(client, student, { forStaff: true });
    if (req.staff.role === "admin") out.counsellors = ok(await client.from("crm_staff").select("user_id,full_name,role").eq("active", true).order("full_name"));
    res.json({ data: out });
  }));
  app.patch("/api/gp/students/:id", requireStaff, wrap(async (req, res) => {
    const { client, student } = await caseFor(req, req.params.id);
    const v = counsellorUpdateSchema.parse(req.body);
    if ("counsellor_id" in v && req.staff.role !== "admin") throw new PassportError("Only administrators can reassign students.", 403);
    if (v.counsellor_id) { const s = ok(await client.from("crm_staff").select("active").eq("user_id", v.counsellor_id).maybeSingle()); if (!s?.active) throw new PassportError("Choose an active team member.", 400); }
    const row = ok(await client.from("gp_students").update({ ...v, updated_at: new Date().toISOString() }).eq("user_id", student.user_id).select("*").single());
    if (v.application_status && v.application_status !== student.application_status) await post(client, student.user_id, "system", req.staff.user_id, `Application status updated: ${v.application_status.replace("_", " ")}`, "update");
    if (v.university && v.university !== student.university) await post(client, student.user_id, "system", req.staff.user_id, `University selected: ${v.university}${v.programme ? " · " + v.programme : ""}`, "update");
    if (v.counsellor_id && v.counsellor_id !== student.counsellor_id) { const c = await counsellorCard(client, v.counsellor_id); await post(client, student.user_id, "system", req.staff.user_id, `Your file is now managed by ${c?.full_name || "a new counsellor"}.`, "update"); }
    res.json({ data: await bundle(client, row, { forStaff: true }) });
  }));
  app.put("/api/gp/students/:id/stages/:key", requireStaff, wrap(async (req, res) => {
    const { client, student } = await caseFor(req, req.params.id);
    const key = z.enum(STAGE_KEYS).parse(req.params.key), { status } = z.object({ status: z.enum(["done", "in_progress", "pending"]) }).strict().parse(req.body);
    ok(await client.from("gp_stages").update({ status, updated_at: new Date().toISOString() }).eq("student_id", student.user_id).eq("stage_key", key));
    if (status === "done") { const next = STAGE_KEYS[STAGE_KEYS.indexOf(key) + 1]; if (next) ok(await client.from("gp_stages").update({ status: "in_progress", updated_at: new Date().toISOString() }).eq("student_id", student.user_id).eq("stage_key", next).eq("status", "pending")); }
    await post(client, student.user_id, "system", req.staff.user_id, `${stageTitle(key)} · ${status === "done" ? "completed" : status === "in_progress" ? "in progress" : "pending"}`, "update");
    await touch(client, student.user_id); res.json({ ok: true });
  }));
  app.post("/api/gp/students/:id/tasks", requireStaff, wrap(async (req, res) => {
    const { client, student } = await caseFor(req, req.params.id); const v = taskSchema.parse(req.body);
    ok(await client.from("gp_tasks").insert({ ...v, student_id: student.user_id, created_by: req.staff.user_id }));
    await post(client, student.user_id, "system", req.staff.user_id, `New task from your counsellor: ${v.title}${v.due_date ? " · due " + v.due_date : ""}`, "update");
    await touch(client, student.user_id); res.status(201).json({ ok: true });
  }));
  app.patch("/api/gp/tasks/:id", requireStaff, wrap(async (req, res) => {
    const client = db(); const t = ok(await client.from("gp_tasks").select("student_id").eq("id", uuid.parse(req.params.id)).maybeSingle()); if (!t) throw new PassportError("Task not found.", 404);
    await caseFor(req, t.student_id);
    const v = z.object({ status: z.enum(["open", "done"]).optional(), remove: z.literal(true).optional() }).strict().parse(req.body);
    if (v.remove) ok(await client.from("gp_tasks").delete().eq("id", req.params.id));
    else if (v.status) ok(await client.from("gp_tasks").update({ status: v.status, done_at: v.status === "done" ? new Date().toISOString() : null }).eq("id", req.params.id));
    res.json({ ok: true });
  }));
  app.post("/api/gp/students/:id/documents", requireStaff, wrap(async (req, res) => {
    const { client, student } = await caseFor(req, req.params.id); const v = docRequestSchema.parse(req.body);
    ok(await client.from("gp_documents").insert({ student_id: student.user_id, label: v.label, doc_type: v.doc_type, stage_key: v.stage_key, requested_by: req.staff.user_id }));
    await post(client, student.user_id, "counsellor", req.staff.user_id, `Document requested: ${v.label}.${v.message ? " " + v.message : ""}`, "update");
    await touch(client, student.user_id); res.status(201).json({ ok: true });
  }));
  app.post("/api/gp/documents/:id/review", requireStaff, wrap(async (req, res) => {
    const client = db(); const d = ok(await client.from("gp_documents").select("student_id,label,status").eq("id", uuid.parse(req.params.id)).maybeSingle()); if (!d) throw new PassportError("Document not found.", 404);
    await caseFor(req, d.student_id); const v = reviewSchema.parse(req.body);
    if (d.status !== "uploaded" && d.status !== v.status) throw new PassportError("Only uploaded documents can be reviewed.", 409);
    if (v.status === "rejected" && !v.note) throw new PassportError("Explain what needs to change so the student can fix it.", 400);
    ok(await client.from("gp_documents").update({ status: v.status, review_note: v.note, reviewed_by: req.staff.user_id, reviewed_at: new Date().toISOString() }).eq("id", req.params.id));
    await post(client, d.student_id, "system", req.staff.user_id, v.status === "approved" ? `Document approved: ${d.label}` : `Document needs changes: ${d.label} · ${v.note}`, "update");
    await touch(client, d.student_id); res.json({ ok: true });
  }));
  app.get("/api/gp/documents/:id/url", requireStaff, wrap(async (req, res) => {
    const client = db(); const d = ok(await client.from("gp_documents").select("student_id,object_path,file_name").eq("id", uuid.parse(req.params.id)).maybeSingle()); if (!d?.object_path) throw new PassportError("No file uploaded yet.", 404);
    await caseFor(req, d.student_id);
    const s = ok(await client.storage.from(BUCKET).createSignedUrl(d.object_path, 300));
    res.json({ data: { url: s.signedUrl } });
  }));
  app.post("/api/gp/students/:id/notes", requireStaff, wrap(async (req, res) => {
    const { client, student } = await caseFor(req, req.params.id); const v = z.object({ body: text(4000, 1) }).strict().parse(req.body);
    ok(await client.from("gp_notes").insert({ student_id: student.user_id, author_id: req.staff.user_id, body: v.body })); res.status(201).json({ ok: true });
  }));
  app.post("/api/gp/students/:id/messages", limiter(120), requireStaff, wrap(async (req, res) => {
    const { client, student } = await caseFor(req, req.params.id); const v = messageSchema.parse(req.body);
    await post(client, student.user_id, "counsellor", req.staff.user_id, v.body, v.kind); await touch(client, student.user_id); res.status(201).json({ ok: true });
  }));
  app.post("/api/gp/students/:id/events", requireStaff, wrap(async (req, res) => {
    const { client, student } = await caseFor(req, req.params.id); const v = eventSchema.parse(req.body);
    ok(await client.from("gp_events").insert({ ...v, student_id: student.user_id, created_by: req.staff.user_id }));
    await post(client, student.user_id, "system", req.staff.user_id, `New important date: ${v.title} · ${v.starts_on}`, "update");
    res.status(201).json({ ok: true });
  }));
  app.delete("/api/gp/events/:id", requireStaff, wrap(async (req, res) => {
    const client = db(); const e = ok(await client.from("gp_events").select("student_id").eq("id", uuid.parse(req.params.id)).maybeSingle()); if (!e) throw new PassportError("Date not found.", 404);
    await caseFor(req, e.student_id); ok(await client.from("gp_events").delete().eq("id", req.params.id)); res.json({ ok: true });
  }));
  app.put("/api/gp/settings", requireStaff, wrap(async (req, res) => {
    const v = settingsSchema.parse(req.body);
    ok(await db().from("gp_counsellor_settings").upsert({ user_id: req.staff.user_id, ...v, updated_at: new Date().toISOString() })); res.json({ data: v });
  }));
}
