// MUKTalent Healthcare · v19 API
// Public forms (candidate registration, employer / candidate / general enquiries, complaints, vacancies),
// the private Candidate Portal, the Healthcare Consultant dashboard and Healthcare Management (admin).
// All data lives in hc_* tables (RLS on, no policies) and the private "healthcare-docs" bucket.
// Only this server touches them, with the service role, after checking who the caller is.
import { createClient } from "@supabase/supabase-js";
import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import {
  BUCKET, MIME, MAX_BYTES, PROFESSIONS, PROFESSION_LABELS, STAGES, STAGE_LABELS, MATCHING_STAGES, CLOSED_STAGES, JOURNEY,
  journeyIndex, DOC_KINDS, LANGS, registrationSchema, profileUpdateSchema, enquirySchema, complaintSchema, vacancySchema,
  employerSchema, fileMeta, text, optText, slugify, countryDecision, stageAllowed
} from "./healthcare-model.mjs";
import { sendMail, candidateMail, teamMail } from "./healthcare-mail.mjs";

export class HcError extends Error { constructor(message, status = 400, code) { super(message); this.status = status; this.code = code; } }

const serviceClient = () => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new HcError("The Healthcare service is not configured yet.", 503);
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
};
const ip = req => (process.env.VERCEL ? String(req.headers["x-vercel-forwarded-for"] || req.headers["x-forwarded-for"] || "").split(",")[0].trim() : req.ip) || "127.0.0.1";
const ipHash = req => createHash("sha256").update("hc:" + ip(req) + ":" + (process.env.SUPABASE_URL || "")).digest("hex").slice(0, 24);
const limiter = (limit, windowMs = 15 * 60 * 1000) => rateLimit({ windowMs, limit, keyGenerator: req => ipKeyGenerator(ip(req)), validate: { xForwardedForHeader: false }, standardHeaders: "draft-7", legacyHeaders: false, handler: (req, res) => res.status(429).json({ error: "Too many requests. Please wait a few minutes and try again." }) });
const ok = (r, message = "We could not complete the request. Please try again in a moment.") => {
  if (r.error) { console.error(JSON.stringify({ scope: "healthcare", code: r.error.code, message: r.error.message })); throw new HcError(r.error.code === "23505" ? "This record already exists." : message, r.error.code === "23505" ? 409 : 503); }
  return r.data;
};
const uuid = z.string().uuid();
const isoDate = z.preprocess(v => (v ? v : null), z.string().datetime({ offset: true }).nullable());
const mfaRequired = () => String(process.env.HC_REQUIRE_MFA || "on").toLowerCase() !== "off";
const now = () => new Date().toISOString();
const addWorkingDays = (from, days) => { const d = new Date(from); let n = 0; while (n < days) { d.setUTCDate(d.getUTCDate() + 1); const w = d.getUTCDay(); if (w !== 0 && w !== 6) n++; } return d.toISOString(); };
const candidateLabel = c => `${c.full_name} (${c.reference})`;

function wrap(fn) {
  return async (req, res) => {
    try { await fn(req, res); }
    catch (error) {
      if (error instanceof z.ZodError) {
        const issue = error.issues[0];
        return res.status(400).json({ error: issue?.message && !/^Invalid|^Expected/.test(issue.message) ? issue.message : `Please check the field: ${issue?.path?.join(".") || "form"}.`, field: issue?.path?.join(".") || null });
      }
      if (error instanceof HcError) return res.status(error.status).json({ error: error.message, code: error.code || null });
      console.error(JSON.stringify({ scope: "healthcare", message: error?.message }));
      res.status(500).json({ error: "Unexpected error. Please try again." });
    }
  };
}

export function mountHealthcare(app, { db: dbFactory = serviceClient } = {}) {
  let cached = null;
  const db = () => (cached ||= dbFactory());

  async function settings(client) { return ok(await client.from("hc_settings").select("*").eq("id", true).maybeSingle()) || {}; }
  async function audit(client, actor, action, entity, entityId, detail = {}, req) {
    await client.from("hc_audit_log").insert({ actor_id: actor?.id || null, actor_role: actor?.role || "system", action, entity, entity_id: entityId ? String(entityId) : null, detail, ip_hash: req ? ipHash(req) : null });
  }
  async function notifyTeam(client, key, title, rows, link) {
    const s = await settings(client);
    const to = s[key] || s.notify_email || process.env.HEALTHCARE_NOTIFY_EMAIL || "agents@muktalent.com";
    const m = teamMail(title, rows, link);
    return sendMail({ to, subject: m.subject, html: m.html });
  }
  async function countryRule(client, code) { return ok(await client.from("hc_country_rules").select("*").eq("country_code", code).maybeSingle()); }

  // ---------- identity ----------
  async function identify(req) {
    const match = /^Bearer ([^\s]+)$/i.exec(req.get("authorization") || "");
    if (!match || match[1].length > 16384) throw new HcError("Please sign in to continue.", 401);
    const client = db();
    const { data, error } = await client.auth.getUser(match[1]);
    if (error || !data?.user) throw new HcError("Your session has expired. Please sign in again.", 401);
    let aal = "aal1";
    try { aal = JSON.parse(Buffer.from(match[1].split(".")[1], "base64url").toString("utf8")).aal || "aal1"; } catch { /* token already verified */ }
    const [staff, consultant, candidate] = await Promise.all([
      client.from("crm_staff").select("user_id,full_name,role,active").eq("user_id", data.user.id).maybeSingle(),
      client.from("hc_consultants").select("*").eq("user_id", data.user.id).maybeSingle(),
      client.from("hc_candidates").select("*").eq("user_id", data.user.id).is("erased_at", null).maybeSingle()
    ]);
    const st = ok(staff), co = ok(consultant), ca = ok(candidate);
    let role = "user";
    if (st?.active && st.role === "admin") role = "admin";
    else if (st?.active && co?.active) role = "consultant";
    else if (ca) role = "candidate";
    return { client, user: data.user, aal, staff: st, consultant: co, candidate: ca, role, id: data.user.id };
  }
  const teamOnly = fn => wrap(async (req, res) => {
    const who = await identify(req);
    if (!["admin", "consultant"].includes(who.role)) throw new HcError("This area is reserved for the MUKTalent Healthcare team.", 403);
    if (mfaRequired() && who.aal !== "aal2") throw new HcError("Two-step verification is required for Healthcare team access.", 401, "mfa_required");
    req.hc = who; await fn(req, res);
  });
  const adminOnly = fn => teamOnly(async (req, res) => { if (req.hc.role !== "admin") throw new HcError("Only Healthcare administrators can do this.", 403); await fn(req, res); });
  const candidateOnly = fn => wrap(async (req, res) => {
    const who = await identify(req);
    if (who.role !== "candidate") throw new HcError("No candidate profile is linked to this account yet.", 403, "no_profile");
    req.hc = who; await fn(req, res);
  });
  async function scopedCandidate(req, id) {
    uuid.parse(id);
    const c = ok(await req.hc.client.from("hc_candidates").select("*").eq("id", id).maybeSingle());
    if (!c || c.erased_at) throw new HcError("Candidate not found.", 404);
    if (req.hc.role === "consultant" && c.consultant_id !== req.hc.id) throw new HcError("This candidate is not assigned to you.", 403);
    return c;
  }
  const scope = (req, q, column = "consultant_id") => (req.hc.role === "consultant" ? q.eq(column, req.hc.id) : q);

  // ---------- storage ----------
  const objectPath = (candidateId, kind, type) => `${candidateId}/${kind}/${randomUUID()}.${MIME[type]}`;
  async function signedUpload(client, path) {
    const { data, error } = await client.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error || !data) throw new HcError("Secure upload is unavailable right now. Please try again.", 503);
    return { signedUrl: data.signedUrl, token: data.token, path };
  }
  async function objectExists(client, path) {
    const dir = path.split("/").slice(0, -1).join("/"), name = path.split("/").pop();
    const { data, error } = await client.storage.from(BUCKET).list(dir, { search: name, limit: 5 });
    if (error) return false;
    return (data || []).some(o => o.name === name && (o.metadata?.size ?? 1) <= MAX_BYTES);
  }

  // ---------- candidate side helpers ----------
  async function stageChange(client, candidate, next, actor, note, { notify = true } = {}) {
    if (candidate.stage === next) return candidate;
    const updated = ok(await client.from("hc_candidates").update({ stage: next, stage_changed_at: now() }).eq("id", candidate.id).select("*").single());
    ok(await client.from("hc_stage_history").insert({ candidate_id: candidate.id, from_stage: candidate.stage, to_stage: next, changed_by: actor?.id || null, changed_by_role: actor?.role === "admin" || actor?.role === "consultant" || actor?.role === "candidate" ? actor.role : "system", note: note || null }));
    if (notify) {
      const label = STAGE_LABELS[next];
      await client.from("hc_notifications").insert({ candidate_id: candidate.id, title: "Recruitment journey updated", body: label, link: "journey" });
      if (candidate.user_id || candidate.email) { const m = candidateMail("stage", candidate.preferred_language || "en", { name: candidate.full_name.split(" ")[0], stage: label }); await sendMail({ to: candidate.email, subject: m.subject, html: m.html }); }
    }
    return updated;
  }
  async function consultantCard(client, userId) {
    if (!userId) return null;
    const [s, c, card] = await Promise.all([
      client.from("crm_staff").select("full_name").eq("user_id", userId).maybeSingle(),
      client.from("hc_consultants").select("title,languages,bio").eq("user_id", userId).maybeSingle(),
      client.from("mt_employee_directory").select("contact_email,publish_contact,languages").eq("user_id", userId).maybeSingle()
    ]);
    return { id: userId, full_name: s.data?.full_name || "MUKTalent consultant", title: c.data?.title || "Healthcare Recruitment Consultant", languages: c.data?.languages?.length ? c.data.languages : (card.data?.languages || []), bio: c.data?.bio || null, email: card.data?.publish_contact ? card.data.contact_email : null };
  }
  function publicCandidate(c) {
    const { user_id, country_checked_by, deletion_requested_at, erased_at, archived_at, priority, next_action, next_action_at, ...rest } = c;
    return { ...rest, deletion_requested: Boolean(deletion_requested_at), journey_index: journeyIndex(c.stage) };
  }
  async function candidateBundle(client, c) {
    const [docs, apps, interviews, messages, notifications, history, vacancies] = await Promise.all([
      client.from("hc_documents").select("id,kind,label,status,file_name,mime_type,size_bytes,note,uploaded_at,reviewed_at,created_at").eq("candidate_id", c.id).order("created_at"),
      client.from("hc_applications").select("id,reference,status,created_at,updated_at,vacancy:hc_vacancies(id,slug,title,employer_display,location,profession,salary_text,salary_min,salary_max,contract_type,status)").eq("candidate_id", c.id).order("created_at", { ascending: false }),
      client.from("hc_interviews").select("id,title,scheduled_at,duration_minutes,mode,location,status,candidate_note").eq("candidate_id", c.id).neq("status", "cancelled").order("scheduled_at"),
      client.from("hc_messages").select("id,sender_role,body,created_at,read_by_candidate_at").eq("candidate_id", c.id).order("created_at").limit(300),
      client.from("hc_notifications").select("id,title,body,link,read_at,created_at").eq("candidate_id", c.id).order("created_at", { ascending: false }).limit(50),
      client.from("hc_stage_history").select("to_stage,created_at").eq("candidate_id", c.id).order("created_at"),
      client.from("hc_vacancies").select("id,slug,title,employer_display,location,profession,salary_min,salary_max,salary_text,contract_type,working_hours,visa_sponsorship,closes_on,published_at").eq("status", "published").order("published_at", { ascending: false }).limit(60)
    ]);
    const journeyDates = {};
    for (const h of ok(history)) { const j = JOURNEY[journeyIndex(h.to_stage)][0]; journeyDates[j] ||= h.created_at; }
    journeyDates.registration ||= c.created_at;
    const all = ok(vacancies);
    const matching = all.filter(v => v.profession === c.profession);
    return {
      candidate: publicCandidate(c),
      consultant: await consultantCard(client, c.consultant_id),
      documents: ok(docs), applications: ok(apps), interviews: ok(interviews), messages: ok(messages), notifications: ok(notifications),
      journey: JOURNEY.map(([key], i) => ({ key, reached_at: journeyDates[key] || null, state: c.stage === "unsuccessful" || c.stage === "withdrawn" ? (i <= journeyIndex(c.stage) ? "done" : "closed") : i < journeyIndex(c.stage) ? "done" : i === journeyIndex(c.stage) ? "current" : "upcoming" })),
      closed: CLOSED_STAGES.has(c.stage) && c.stage !== "recruitment_completed" ? c.stage : null,
      opportunities: (matching.length ? matching : all).slice(0, 24),
      restricted: c.country_status === "red" || c.country_status === "amber"
    };
  }

  async function createCandidate(client, v, { userId = null, source = "website", req, actor }) {
    const s = await settings(client);
    const rule = await countryRule(client, v.country_residence);
    const decision = countryDecision(rule);
    const row = ok(await client.from("hc_candidates").insert({
      user_id: userId, full_name: v.full_name, email: v.email, phone: v.phone ?? null, country_residence: v.country_residence, nationality: v.nationality ?? null,
      profession: v.profession, experience_years: v.experience_years ?? null, registration_status: v.registration_status, registration_body: v.registration_body ?? null,
      registration_number: v.registration_number ?? null, english_level: v.english_level ?? null, employment_status: v.employment_status ?? null,
      preferred_location: v.preferred_location ?? null, right_to_work_uk: Boolean(v.right_to_work_uk), additional_info: v.additional_info ?? null,
      marketing_consent: Boolean(v.marketing), preferred_language: LANGS.includes(v.lang) ? v.lang : "en", privacy_notice_version: s.privacy_notice_version || "HC-CPN-2026-11", source,
      country_status: decision.status, country_checked_at: now()
    }).select("*").single(), "We could not save your registration. Please try again.");
    ok(await client.from("hc_stage_history").insert({ candidate_id: row.id, from_stage: null, to_stage: "new_registration", changed_by: userId, changed_by_role: actor?.role === "admin" ? "admin" : userId ? "candidate" : "system", note: `Registered via ${source}` }));
    await client.from("hc_notifications").insert({ candidate_id: row.id, title: "Welcome to MUKTalent Healthcare", body: `Your candidate reference is ${row.reference}.`, link: "journey" });
    if (!decision.activeRecruitment) await client.from("hc_messages").insert({ candidate_id: row.id, sender_role: "system", body: "Your country of residence is on the UK Code of Practice red or amber list. MUKTalent Healthcare cannot actively recruit from this country, so we will not put you forward to employers. You can still apply directly to advertised UK vacancies, for example on NHS Jobs (www.jobs.nhs.uk), or through employers' own career pages." });
    await audit(client, actor || { id: userId, role: userId ? "candidate" : "public" }, "candidate.registered", "candidate", row.id, { reference: row.reference, country_status: decision.status, source }, req);
    return { row, decision };
  }

  // =========================================================
  // PUBLIC
  // =========================================================
  app.get("/api/hc/public/meta", limiter(300, 60000), (req, res) => {
    res.set("Cache-Control", "public, max-age=300");
    res.json({ professions: PROFESSIONS, profession_labels: PROFESSION_LABELS, stages: STAGES, stage_labels: STAGE_LABELS, journey: JOURNEY.map(j => j[0]), doc_kinds: DOC_KINDS, max_bytes: MAX_BYTES, mime: Object.keys(MIME) });
  });

  const publicVacancyCols = "id,slug,title,employer_display,profession,location,salary_min,salary_max,salary_text,contract_type,working_hours,qualifications,registration_requirements,description,conditions,visa_sponsorship,closes_on,published_at";
  app.get("/api/hc/public/vacancies", limiter(300, 60000), wrap(async (req, res) => {
    const client = db();
    let q = client.from("hc_vacancies").select(publicVacancyCols).eq("status", "published").order("published_at", { ascending: false }).limit(100);
    if (req.query.profession && PROFESSIONS.includes(String(req.query.profession))) q = q.eq("profession", String(req.query.profession));
    const rows = ok(await q).filter(v => !v.closes_on || v.closes_on >= now().slice(0, 10));
    res.set("Cache-Control", "public, max-age=60");
    res.json({ data: rows });
  }));
  app.get("/api/hc/public/vacancies/:slug", limiter(300, 60000), wrap(async (req, res) => {
    const slug = z.string().regex(/^[a-z0-9][a-z0-9-]{2,90}$/).parse(req.params.slug);
    const v = ok(await db().from("hc_vacancies").select(publicVacancyCols).eq("slug", slug).eq("status", "published").maybeSingle());
    if (!v) throw new HcError("This vacancy is no longer available.", 404);
    res.json({ data: v });
  }));

  function antiSpam(v) {
    if (v.website) throw new HcError("Submission rejected.", 400);
    if (typeof v.elapsed === "number" && v.elapsed < 2500) throw new HcError("Please take a moment to review the form before sending.", 400);
  }

  app.post("/api/hc/public/register", limiter(8), wrap(async (req, res) => {
    const v = registrationSchema.parse(req.body);
    antiSpam(v);
    const client = db();
    const lang = v.lang || "en";
    const existing = ok(await client.from("hc_candidates").select("id,full_name,email").ilike("email", v.email.replace(/[%_\\]/g, "\\$&")).is("erased_at", null).limit(1));
    if (existing.length) {
      const m = candidateMail("duplicate", lang, { name: v.full_name.split(" ")[0] });
      await sendMail({ to: v.email, subject: m.subject, html: m.html });
      await audit(client, { role: "public" }, "candidate.duplicate_registration", "candidate", existing[0].id, {}, req);
      return res.status(202).json({ status: "check_email" });
    }
    let vacancy = null;
    if (v.vacancy) vacancy = ok(await client.from("hc_vacancies").select("id,title,slug").eq("slug", v.vacancy).eq("status", "published").maybeSingle());
    const { row, decision } = await createCandidate(client, v, { source: "website", req });
    let upload = null;
    if (v.cv) {
      const path = objectPath(row.id, "cv", v.cv.type);
      const doc = ok(await client.from("hc_documents").insert({ candidate_id: row.id, kind: "cv", label: "CV", status: "requested", object_path: path, file_name: v.cv.name, mime_type: v.cv.type, size_bytes: v.cv.size }).select("id").single());
      upload = { ...(await signedUpload(client, path)), documentId: doc.id };
    }
    if (vacancy) ok(await client.from("hc_applications").insert({ candidate_id: row.id, vacancy_id: vacancy.id, cover_note: v.additional_info ?? null }));
    const m = candidateMail("registered", lang, { name: v.full_name.split(" ")[0], reference: row.reference, restricted: !decision.activeRecruitment });
    const [mailed] = await Promise.all([
      sendMail({ to: v.email, subject: m.subject, html: m.html, idempotencyKey: `hc-reg-${row.id}` }),
      notifyTeam(client, "candidate_enquiries_email", `New candidate registration ${row.reference}`, [
        ["Reference", row.reference], ["Name", row.full_name], ["Email", row.email], ["Phone", row.phone], ["Profession", PROFESSION_LABELS[row.profession]],
        ["Experience (years)", row.experience_years], ["Country of residence", row.country_residence], ["Code of Practice status", decision.status.toUpperCase()],
        ["Vacancy", vacancy?.title], ["CV", v.cv ? "Uploading" : "Not provided"]
      ], `/healthcare/portal/#/hc/candidates/${row.id}`)
    ]);
    res.status(201).json({ status: "registered", reference: row.reference, country_status: decision.status, restricted: !decision.activeRecruitment, upload, email: mailed });
  }));

  app.post("/api/hc/public/register/complete-upload", limiter(20), wrap(async (req, res) => {
    const v = z.object({ documentId: uuid, path: z.string().max(300) }).parse(req.body);
    const client = db();
    const doc = ok(await client.from("hc_documents").select("id,object_path,status,created_at").eq("id", v.documentId).maybeSingle());
    if (!doc || doc.object_path !== v.path || doc.status !== "requested" || Date.now() - Date.parse(doc.created_at) > 2 * 3600 * 1000) throw new HcError("Upload link not valid.", 400);
    if (!(await objectExists(client, doc.object_path))) throw new HcError("We could not find the uploaded file. Please try again.", 400);
    ok(await client.from("hc_documents").update({ status: "uploaded", uploaded_at: now() }).eq("id", doc.id));
    res.json({ status: "uploaded" });
  }));

  app.post("/api/hc/public/enquiry", limiter(10), wrap(async (req, res) => {
    const v = enquirySchema.parse(req.body);
    antiSpam(v);
    const client = db();
    const details = v.route === "employer" ? { organisation_type: v.organisation_type, location: v.location, professions: v.professions || [], vacancies_count: v.vacancies_count ?? null, requirements: v.requirements ?? null } : {};
    const row = ok(await client.from("hc_enquiries").insert({ route: v.route, name: v.name, email: v.email, phone: v.phone ?? null, organisation: v.organisation ?? null, job_title: v.job_title ?? null, subject: v.subject ?? (v.route === "employer" ? "Recruitment needs" : null), message: v.message ?? v.requirements ?? null, details, marketing_consent: Boolean(v.marketing) }).select("id,reference").single());
    const key = v.route === "employer" ? "employer_enquiries_email" : v.route === "candidate" ? "candidate_enquiries_email" : "notify_email";
    const m = candidateMail("enquiry", v.lang || "en", { name: v.name.split(" ")[0], reference: row.reference });
    await Promise.all([
      sendMail({ to: v.email, subject: m.subject, html: m.html, idempotencyKey: `hc-enq-${row.id}` }),
      notifyTeam(client, key, `New ${v.route} enquiry ${row.reference}`, [
        ["Reference", row.reference], ["Route", v.route], ["Name", v.name], ["Email", v.email], ["Phone", v.phone], ["Organisation", v.organisation], ["Job title", v.job_title],
        ["Organisation type", details.organisation_type], ["Location", details.location], ["Professions required", (details.professions || []).map(p => PROFESSION_LABELS[p]).join(", ")],
        ["Number of vacancies", details.vacancies_count], ["Subject", v.subject], ["Message", v.message || v.requirements]
      ], `/healthcare/portal/#/hc/enquiries`)
    ]);
    await audit(client, { role: "public" }, "enquiry.received", "enquiry", row.id, { route: v.route }, req);
    res.status(201).json({ status: "received", reference: row.reference });
  }));

  app.post("/api/hc/public/complaint", limiter(6), wrap(async (req, res) => {
    const v = complaintSchema.parse(req.body);
    antiSpam(v);
    const client = db();
    const s = await settings(client);
    const created = now();
    const severity = v.category === "fees" || v.category === "discrimination" ? "serious" : "standard";
    const row = ok(await client.from("hc_complaints").insert({ complainant_name: v.complainant_name, email: v.email, phone: v.phone ?? null, complainant_role: v.complainant_role, candidate_reference: v.candidate_reference ?? null, category: v.category, subject: v.subject, details: v.details, severity, ack_due_at: addWorkingDays(created, s.complaint_ack_days || 2), response_due_at: addWorkingDays(created, s.complaint_response_days || 20) }).select("id,reference").single());
    const m = candidateMail("complaint", v.lang || "en", { name: v.complainant_name.split(" ")[0], reference: row.reference, days: { ack: s.complaint_ack_days || 2, resp: s.complaint_response_days || 20 } });
    await Promise.all([
      sendMail({ to: v.email, subject: m.subject, html: m.html, idempotencyKey: `hc-cmp-${row.id}` }),
      notifyTeam(client, "complaints_email", `Complaint received ${row.reference} (${severity})`, [["Reference", row.reference], ["Name", v.complainant_name], ["Email", v.email], ["Role", v.complainant_role], ["Candidate reference", v.candidate_reference], ["Category", v.category], ["Subject", v.subject], ["Details", v.details]], `/healthcare/portal/#/hc/compliance`)
    ]);
    await audit(client, { role: "public" }, "complaint.received", "complaint", row.id, { category: v.category, severity }, req);
    res.status(201).json({ status: "received", reference: row.reference });
  }));

  // =========================================================
  // IDENTITY (shared by portal + team app)
  // =========================================================
  app.get("/api/hc/me", limiter(240, 60000), wrap(async (req, res) => {
    const who = await identify(req);
    const confirmed = Boolean(who.user.email_confirmed_at || who.user.confirmed_at);
    // First sign-in of a candidate who registered on the public form: link the profile by verified email.
    if (who.role === "user" && confirmed && !who.staff) {
      const match = ok(await who.client.from("hc_candidates").select("*").ilike("email", String(who.user.email || "").replace(/[%_\\]/g, "\\$&")).is("user_id", null).is("erased_at", null).limit(1));
      if (match.length) {
        const linked = ok(await who.client.from("hc_candidates").update({ user_id: who.id }).eq("id", match[0].id).is("user_id", null).select("*").single());
        await audit(who.client, { id: who.id, role: "candidate" }, "candidate.portal_linked", "candidate", linked.id, {}, req);
        who.candidate = linked; who.role = "candidate";
      }
    }
    const base = { role: who.role, email: who.user.email, confirmed, aal: who.aal, mfa_required: mfaRequired() && ["admin", "consultant"].includes(who.role), name: who.staff?.full_name || who.candidate?.full_name || who.user.user_metadata?.full_name || null };
    if (who.role === "candidate") return res.json({ ...base, data: await candidateBundle(who.client, who.candidate) });
    if (who.role === "admin" || who.role === "consultant") return res.json({ ...base, staff: { user_id: who.id, full_name: who.staff.full_name, title: who.consultant?.title || (who.role === "admin" ? "Healthcare Administrator" : "Healthcare Recruitment Consultant") } });
    res.json({ ...base, is_education_staff: Boolean(who.staff?.active) });
  }));

  // =========================================================
  // CANDIDATE PORTAL
  // =========================================================
  app.post("/api/hc/portal/profile", limiter(10), wrap(async (req, res) => {
    const who = await identify(req);
    if (who.candidate) return res.json({ data: await candidateBundle(who.client, who.candidate) });
    if (who.staff) throw new HcError("Team accounts cannot create a candidate profile.", 403);
    if (!(who.user.email_confirmed_at || who.user.confirmed_at)) throw new HcError("Confirm your email address first, then sign in again.", 403);
    const v = registrationSchema.omit({ email: true, cv: true, vacancy: true }).parse(req.body);
    const { row, decision } = await createCandidate(who.client, { ...v, email: who.user.email }, { userId: who.id, source: "portal", req });
    const m = candidateMail("registered", v.lang || "en", { name: v.full_name.split(" ")[0], reference: row.reference, restricted: !decision.activeRecruitment });
    await Promise.all([
      sendMail({ to: who.user.email, subject: m.subject, html: m.html, idempotencyKey: `hc-reg-${row.id}` }),
      notifyTeam(who.client, "candidate_enquiries_email", `New candidate registration ${row.reference} (portal)`, [["Reference", row.reference], ["Name", row.full_name], ["Email", row.email], ["Profession", PROFESSION_LABELS[row.profession]], ["Country of residence", row.country_residence], ["Code of Practice status", decision.status.toUpperCase()]], `/healthcare/portal/#/hc/candidates/${row.id}`)
    ]);
    res.status(201).json({ data: await candidateBundle(who.client, row) });
  }));

  app.get("/api/hc/portal/bundle", candidateOnly(async (req, res) => res.json({ data: await candidateBundle(req.hc.client, req.hc.candidate) })));

  app.patch("/api/hc/portal/profile", limiter(30), candidateOnly(async (req, res) => {
    const v = profileUpdateSchema.parse(req.body);
    const patch = { ...v };
    if (v.country_residence && v.country_residence !== req.hc.candidate.country_residence) {
      const decision = countryDecision(await countryRule(req.hc.client, v.country_residence));
      Object.assign(patch, { country_status: decision.status, country_checked_at: now(), country_checked_by: null });
    }
    const row = ok(await req.hc.client.from("hc_candidates").update(patch).eq("id", req.hc.candidate.id).select("*").single());
    await audit(req.hc.client, { id: req.hc.id, role: "candidate" }, "candidate.profile_updated", "candidate", row.id, { fields: Object.keys(v) }, req);
    res.json({ data: await candidateBundle(req.hc.client, row) });
  }));

  app.post("/api/hc/portal/documents/upload-url", limiter(30), candidateOnly(async (req, res) => {
    const v = z.object({ documentId: uuid.nullable().optional(), kind: z.enum(DOC_KINDS).optional(), file: fileMeta }).parse(req.body);
    const c = req.hc.candidate, client = req.hc.client;
    let doc;
    if (v.documentId) {
      doc = ok(await client.from("hc_documents").select("*").eq("id", v.documentId).eq("candidate_id", c.id).maybeSingle());
      if (!doc) throw new HcError("Document request not found.", 404);
      if (doc.status === "approved") throw new HcError("This document has already been approved.", 409);
    } else {
      const kind = v.kind || "other";
      if (kind !== "cv" && kind !== "other") throw new HcError("Please upload identity and verification documents only when your consultant requests them.", 400);
      doc = ok(await client.from("hc_documents").insert({ candidate_id: c.id, kind, label: kind === "cv" ? "CV" : "Additional document", status: "requested" }).select("*").single());
    }
    const path = objectPath(c.id, doc.kind, v.file.type);
    ok(await client.from("hc_documents").update({ object_path: path, file_name: v.file.name, mime_type: v.file.type, size_bytes: v.file.size, status: doc.status === "rejected" ? "requested" : doc.status }).eq("id", doc.id));
    res.json({ upload: { ...(await signedUpload(client, path)), documentId: doc.id } });
  }));
  app.post("/api/hc/portal/documents/complete", limiter(30), candidateOnly(async (req, res) => {
    const v = z.object({ documentId: uuid }).parse(req.body);
    const client = req.hc.client;
    const doc = ok(await client.from("hc_documents").select("*").eq("id", v.documentId).eq("candidate_id", req.hc.candidate.id).maybeSingle());
    if (!doc?.object_path || !(await objectExists(client, doc.object_path))) throw new HcError("We could not find the uploaded file. Please try again.", 400);
    ok(await client.from("hc_documents").update({ status: "uploaded", uploaded_at: now(), reviewed_at: null, reviewed_by: null }).eq("id", doc.id));
    await audit(client, { id: req.hc.id, role: "candidate" }, "document.uploaded", "document", doc.id, { kind: doc.kind }, req);
    if (req.hc.candidate.consultant_id) await client.from("hc_tasks").insert({ candidate_id: req.hc.candidate.id, owner_id: req.hc.candidate.consultant_id, title: `Review ${doc.label} from ${req.hc.candidate.full_name}`, due_at: addWorkingDays(now(), 2), created_by: req.hc.id });
    res.json({ data: await candidateBundle(client, req.hc.candidate) });
  }));
  app.get("/api/hc/portal/documents/:id/url", limiter(60, 60000), candidateOnly(async (req, res) => {
    const doc = ok(await req.hc.client.from("hc_documents").select("id,object_path,status").eq("id", uuid.parse(req.params.id)).eq("candidate_id", req.hc.candidate.id).maybeSingle());
    if (!doc?.object_path || doc.status === "requested") throw new HcError("File not available.", 404);
    const { data, error } = await req.hc.client.storage.from(BUCKET).createSignedUrl(doc.object_path, 60);
    if (error) throw new HcError("File not available.", 404);
    res.json({ url: data.signedUrl });
  }));

  app.post("/api/hc/portal/messages", limiter(40), candidateOnly(async (req, res) => {
    const v = z.object({ body: text(4000, 1) }).parse(req.body);
    const c = req.hc.candidate;
    ok(await req.hc.client.from("hc_messages").insert({ candidate_id: c.id, sender_id: req.hc.id, sender_role: "candidate", body: v.body }));
    if (c.consultant_id) await req.hc.client.from("hc_tasks").insert({ candidate_id: c.id, owner_id: c.consultant_id, title: `Reply to message from ${c.full_name}`, due_at: addWorkingDays(now(), 1), created_by: req.hc.id });
    else await notifyTeam(req.hc.client, "candidate_enquiries_email", `Candidate message ${c.reference}`, [["Candidate", candidateLabel(c)], ["Message", v.body.slice(0, 500)]], `/healthcare/portal/#/hc/messages`);
    res.status(201).json({ data: await candidateBundle(req.hc.client, c) });
  }));
  app.post("/api/hc/portal/read", limiter(60, 60000), candidateOnly(async (req, res) => {
    const v = z.object({ what: z.enum(["messages", "notifications"]) }).parse(req.body);
    const t = now();
    if (v.what === "messages") await req.hc.client.from("hc_messages").update({ read_by_candidate_at: t }).eq("candidate_id", req.hc.candidate.id).is("read_by_candidate_at", null);
    else await req.hc.client.from("hc_notifications").update({ read_at: t }).eq("candidate_id", req.hc.candidate.id).is("read_at", null);
    res.json({ ok: true });
  }));
  app.post("/api/hc/portal/applications", limiter(20), candidateOnly(async (req, res) => {
    const v = z.object({ vacancyId: uuid, cover_note: optText(3000).optional() }).parse(req.body);
    const c = req.hc.candidate, client = req.hc.client;
    const vac = ok(await client.from("hc_vacancies").select("id,title,consultant_id,status").eq("id", v.vacancyId).maybeSingle());
    if (!vac || vac.status !== "published") throw new HcError("This vacancy is no longer open.", 404);
    const row = ok(await client.from("hc_applications").insert({ candidate_id: c.id, vacancy_id: vac.id, cover_note: v.cover_note ?? null }).select("id,reference").single(), "You have already applied for this vacancy.");
    const owner = vac.consultant_id || c.consultant_id;
    if (owner) await client.from("hc_tasks").insert({ candidate_id: c.id, owner_id: owner, title: `New application ${row.reference}: ${c.full_name} → ${vac.title}`, due_at: addWorkingDays(now(), 2), created_by: req.hc.id });
    await notifyTeam(client, "candidate_enquiries_email", `New application ${row.reference}`, [["Candidate", candidateLabel(c)], ["Vacancy", vac.title], ["Code of Practice status", c.country_status.toUpperCase()]], `/healthcare/portal/#/hc/applications`);
    await audit(client, { id: req.hc.id, role: "candidate" }, "application.created", "application", row.id, { vacancy: vac.id }, req);
    res.status(201).json({ data: await candidateBundle(client, c) });
  }));
  app.post("/api/hc/portal/applications/:id/withdraw", limiter(20), candidateOnly(async (req, res) => {
    const id = uuid.parse(req.params.id);
    ok(await req.hc.client.from("hc_applications").update({ status: "withdrawn" }).eq("id", id).eq("candidate_id", req.hc.candidate.id));
    await audit(req.hc.client, { id: req.hc.id, role: "candidate" }, "application.withdrawn", "application", id, {}, req);
    res.json({ data: await candidateBundle(req.hc.client, req.hc.candidate) });
  }));
  app.post("/api/hc/portal/data-request", limiter(5), candidateOnly(async (req, res) => {
    const v = z.object({ type: z.enum(["access", "rectification", "erasure", "restriction", "objection"]), note: optText(2000).optional() }).parse(req.body);
    const c = req.hc.candidate, client = req.hc.client;
    const row = ok(await client.from("hc_enquiries").insert({ route: "general", name: c.full_name, email: c.email, subject: `Data protection request: ${v.type}`, message: v.note || `Candidate ${c.reference} requests ${v.type}.`, details: { data_request: v.type, candidate_id: c.id, candidate_reference: c.reference } }).select("id,reference").single());
    if (v.type === "erasure") await client.from("hc_candidates").update({ deletion_requested_at: now() }).eq("id", c.id);
    await notifyTeam(client, "notify_email", `Data protection request (${v.type}) ${row.reference}`, [["Candidate", candidateLabel(c)], ["Request", v.type], ["Note", v.note], ["Statutory deadline", "One month from receipt (UK GDPR Art. 12)"]], `/healthcare/portal/#/hc/compliance`);
    await audit(client, { id: req.hc.id, role: "candidate" }, "data_request.created", "candidate", c.id, { type: v.type, enquiry: row.reference }, req);
    res.status(201).json({ reference: row.reference });
  }));

  // =========================================================
  // TEAM (admin + consultants)
  // =========================================================
  app.get("/api/hc/team/overview", teamOnly(async (req, res) => {
    const client = req.hc.client;
    const since = new Date(Date.now() - 7 * 864e5).toISOString();
    const cand = ok(await scope(req, client.from("hc_candidates").select("id,stage,country_status,profession,created_at,consultant_id,deletion_requested_at").is("archived_at", null).is("erased_at", null)).limit(5000));
    const byStage = Object.fromEntries(STAGES.map(s => [s, 0])); for (const c of cand) byStage[c.stage]++;
    const ids = cand.map(c => c.id);
    const inIds = q => (req.hc.role === "consultant" ? (ids.length ? q.in("candidate_id", ids) : q.eq("candidate_id", "00000000-0000-0000-0000-000000000000")) : q);
    const [docs, interviews, tasks, enquiries, complaints, vacancies, apps, unread] = await Promise.all([
      inIds(client.from("hc_documents").select("id", { count: "exact", head: true }).eq("status", "uploaded")),
      inIds(client.from("hc_interviews").select("id,title,scheduled_at,mode,candidate:hc_candidates(id,full_name,reference)").eq("status", "scheduled").gte("scheduled_at", now()).order("scheduled_at").limit(8)),
      client.from("hc_tasks").select("id,title,due_at,candidate_id").eq("owner_id", req.hc.id).eq("status", "open").order("due_at", { ascending: true, nullsFirst: false }).limit(10),
      req.hc.role === "admin" ? client.from("hc_enquiries").select("id", { count: "exact", head: true }).in("status", ["new", "in_progress"]) : Promise.resolve({ count: null }),
      req.hc.role === "admin" ? client.from("hc_complaints").select("id,reference,subject,status,response_due_at,severity").not("status", "in", "(resolved,closed)").order("response_due_at") : Promise.resolve({ data: [] }),
      client.from("hc_vacancies").select("id", { count: "exact", head: true }).eq("status", "published"),
      inIds(client.from("hc_applications").select("id", { count: "exact", head: true }).eq("status", "applied")),
      inIds(client.from("hc_messages").select("id", { count: "exact", head: true }).eq("sender_role", "candidate").is("read_by_team_at", null))
    ]);
    const s = req.hc.role === "admin" ? await settings(client) : null;
    res.json({
      role: req.hc.role,
      metrics: {
        active: cand.filter(c => !CLOSED_STAGES.has(c.stage)).length, new_7d: cand.filter(c => c.created_at >= since).length,
        unassigned: req.hc.role === "admin" ? cand.filter(c => !c.consultant_id && !CLOSED_STAGES.has(c.stage)).length : null,
        docs_to_review: docs.count ?? 0, new_applications: apps.count ?? 0, unread_messages: unread.count ?? 0,
        open_enquiries: enquiries.count ?? null, open_complaints: (complaints.data || []).length, published_vacancies: vacancies.count ?? 0,
        placed: byStage.recruitment_completed, restricted: cand.filter(c => c.country_status === "red" || c.country_status === "amber").length,
        unchecked_country: cand.filter(c => c.country_status === "unchecked").length, deletion_requests: cand.filter(c => c.deletion_requested_at).length
      },
      by_stage: byStage, interviews: ok(interviews), tasks: ok(tasks), complaints: ok(complaints),
      country_list_reviewed_at: s?.country_list_reviewed_at || null
    });
  }));

  // ----- candidates -----
  app.get("/api/hc/team/candidates", teamOnly(async (req, res) => {
    const q = z.object({ stage: z.enum(STAGES).optional(), q: z.string().max(100).optional(), consultant: z.union([uuid, z.literal("none")]).optional(), country: z.enum(["red", "amber", "green", "unchecked"]).optional(), profession: z.enum(PROFESSIONS).optional(), page: z.coerce.number().int().min(1).max(500).default(1), view: z.enum(["active", "closed", "all"]).default("active") }).parse(req.query);
    let query = scope(req, req.hc.client.from("hc_candidates").select("id,reference,full_name,email,phone,profession,experience_years,country_residence,nationality,registration_status,english_level,stage,stage_changed_at,consultant_id,country_status,priority,next_action,next_action_at,created_at,deletion_requested_at", { count: "exact" }).is("erased_at", null).is("archived_at", null));
    if (q.stage) query = query.eq("stage", q.stage);
    else if (q.view === "active") query = query.not("stage", "in", "(recruitment_completed,unsuccessful,withdrawn)");
    else if (q.view === "closed") query = query.in("stage", ["recruitment_completed", "unsuccessful", "withdrawn"]);
    if (q.consultant && req.hc.role === "admin") query = q.consultant === "none" ? query.is("consultant_id", null) : query.eq("consultant_id", q.consultant);
    if (q.country) query = query.eq("country_status", q.country);
    if (q.profession) query = query.eq("profession", q.profession);
    if (q.q) { const s = q.q.replace(/[%_,()\\]/g, " ").trim(); if (s) query = query.or(`full_name.ilike.%${s}%,email.ilike.%${s}%,reference.ilike.%${s}%`); }
    const from = (q.page - 1) * 50;
    const r = await query.order("created_at", { ascending: false }).range(from, from + 49);
    res.json({ data: ok(r), count: r.count ?? 0, page: q.page });
  }));
  app.post("/api/hc/team/candidates", adminOnly(async (req, res) => {
    const v = registrationSchema.omit({ privacy: true, cv: true, vacancy: true }).extend({ privacy: z.boolean().optional(), source: z.enum(["admin", "referral", "event"]).default("admin") }).parse(req.body);
    const exists = ok(await req.hc.client.from("hc_candidates").select("id").ilike("email", v.email.replace(/[%_\\]/g, "\\$&")).is("erased_at", null).limit(1));
    if (exists.length) throw new HcError("A candidate with this email already exists.", 409);
    const { row } = await createCandidate(req.hc.client, v, { source: v.source, req, actor: { id: req.hc.id, role: "admin" } });
    res.status(201).json({ data: row });
  }));
  app.get("/api/hc/team/candidates/:id", teamOnly(async (req, res) => {
    const c = await scopedCandidate(req, req.params.id), client = req.hc.client;
    const [docs, apps, interviews, messages, notes, tasks, history, auditRows] = await Promise.all([
      client.from("hc_documents").select("*").eq("candidate_id", c.id).order("created_at"),
      client.from("hc_applications").select("*,vacancy:hc_vacancies(id,title,employer_display,location)").eq("candidate_id", c.id).order("created_at", { ascending: false }),
      client.from("hc_interviews").select("*").eq("candidate_id", c.id).order("scheduled_at", { ascending: false }),
      client.from("hc_messages").select("*").eq("candidate_id", c.id).order("created_at").limit(500),
      client.from("hc_notes").select("*").eq("candidate_id", c.id).order("created_at", { ascending: false }).limit(200),
      client.from("hc_tasks").select("*").eq("candidate_id", c.id).order("created_at", { ascending: false }),
      client.from("hc_stage_history").select("*").eq("candidate_id", c.id).order("created_at", { ascending: false }),
      req.hc.role === "admin" ? client.from("hc_audit_log").select("*").eq("entity_id", c.id).order("created_at", { ascending: false }).limit(100) : Promise.resolve({ data: [] })
    ]);
    await client.from("hc_messages").update({ read_by_team_at: now() }).eq("candidate_id", c.id).eq("sender_role", "candidate").is("read_by_team_at", null);
    const rule = await countryRule(client, c.country_residence);
    await audit(client, { id: req.hc.id, role: req.hc.role }, "candidate.viewed", "candidate", c.id, {}, req);
    res.json({ data: { candidate: c, country_rule: rule, documents: ok(docs), applications: ok(apps), interviews: ok(interviews), messages: ok(messages), notes: ok(notes), tasks: ok(tasks), history: ok(history), audit: ok(auditRows), consultant: await consultantCard(client, c.consultant_id) } });
  }));
  app.patch("/api/hc/team/candidates/:id", teamOnly(async (req, res) => {
    const c = await scopedCandidate(req, req.params.id), client = req.hc.client;
    const v = z.object({
      stage: z.enum(STAGES).optional(), note: optText(1000).optional(), consultant_id: uuid.nullable().optional(), priority: z.enum(["low", "normal", "high"]).optional(),
      next_action: optText(240).optional(), next_action_at: isoDate.optional(), registration_status: registrationSchema.shape.registration_status.optional(),
      registration_body: optText(120).optional(), registration_number: optText(60).optional(), english_level: registrationSchema.shape.english_level, right_to_work_uk: z.boolean().optional(), archived: z.boolean().optional()
    }).strict().parse(req.body);
    const actor = { id: req.hc.id, role: req.hc.role };
    if (v.consultant_id !== undefined && req.hc.role !== "admin") throw new HcError("Only administrators can reassign candidates.", 403);
    if (v.consultant_id) { const co = ok(await client.from("hc_consultants").select("user_id,active").eq("user_id", v.consultant_id).maybeSingle()); if (!co?.active) throw new HcError("Choose an active Healthcare consultant.", 400); }
    if (v.archived !== undefined && req.hc.role !== "admin") throw new HcError("Only administrators can archive candidates.", 403);
    let current = c;
    if (v.stage && v.stage !== c.stage) {
      const blocked = stageAllowed(c, v.stage, { actorRole: req.hc.role, note: v.note });
      if (blocked) throw new HcError(blocked, 409, "stage_blocked");
      current = await stageChange(client, c, v.stage, actor, v.note);
      await audit(client, actor, "candidate.stage_changed", "candidate", c.id, { from: c.stage, to: v.stage, note: v.note || null }, req);
    }
    const { stage, note, archived, ...rest } = v;
    const patch = { ...rest };
    if (archived !== undefined) patch.archived_at = archived ? now() : null;
    if (Object.keys(patch).length) {
      current = ok(await client.from("hc_candidates").update(patch).eq("id", c.id).select("*").single());
      if (v.consultant_id !== undefined) {
        await client.from("hc_notifications").insert({ candidate_id: c.id, title: "Your consultant", body: v.consultant_id ? "A recruitment consultant has been assigned to you." : "Your consultant assignment has changed.", link: "consultant" });
        if (v.consultant_id) await client.from("hc_tasks").insert({ candidate_id: c.id, owner_id: v.consultant_id, title: `Introduce yourself to ${c.full_name} (${c.reference})`, due_at: addWorkingDays(now(), 2), created_by: req.hc.id });
      }
      await audit(client, actor, "candidate.updated", "candidate", c.id, { fields: Object.keys(patch) }, req);
    }
    res.json({ data: current });
  }));
  app.post("/api/hc/team/candidates/:id/country-check", teamOnly(async (req, res) => {
    const c = await scopedCandidate(req, req.params.id), client = req.hc.client;
    const rule = await countryRule(client, c.country_residence);
    const decision = countryDecision(rule);
    const row = ok(await client.from("hc_candidates").update({ country_status: decision.status, country_checked_at: now(), country_checked_by: req.hc.id }).eq("id", c.id).select("*").single());
    await audit(client, { id: req.hc.id, role: req.hc.role }, "candidate.country_checked", "candidate", c.id, { country: c.country_residence, status: decision.status }, req);
    res.json({ data: row, rule, decision });
  }));
  app.post("/api/hc/team/candidates/:id/notes", teamOnly(async (req, res) => {
    const c = await scopedCandidate(req, req.params.id);
    const v = z.object({ body: text(4000, 1), kind: z.enum(["note", "call", "follow_up", "interview"]).default("note") }).parse(req.body);
    const row = ok(await req.hc.client.from("hc_notes").insert({ candidate_id: c.id, author_id: req.hc.id, kind: v.kind, body: v.body }).select("*").single());
    await audit(req.hc.client, { id: req.hc.id, role: req.hc.role }, "candidate.note_added", "candidate", c.id, { kind: v.kind }, req);
    res.status(201).json({ data: row });
  }));
  app.post("/api/hc/team/candidates/:id/documents", teamOnly(async (req, res) => {
    const c = await scopedCandidate(req, req.params.id);
    const v = z.object({ kind: z.enum(DOC_KINDS), label: text(160, 2), note: optText(1000).optional() }).parse(req.body);
    const row = ok(await req.hc.client.from("hc_documents").insert({ candidate_id: c.id, kind: v.kind, label: v.label, note: v.note ?? null, status: "requested", requested_by: req.hc.id }).select("*").single());
    await req.hc.client.from("hc_notifications").insert({ candidate_id: c.id, title: "Document requested", body: v.label, link: "documents" });
    const m = candidateMail("document", c.preferred_language || "en", { name: c.full_name.split(" ")[0], label: v.label });
    await sendMail({ to: c.email, subject: m.subject, html: m.html });
    if (c.stage === "initial_review" || c.stage === "new_registration") await stageChange(req.hc.client, c, "awaiting_information", { id: req.hc.id, role: req.hc.role }, `Requested: ${v.label}`, { notify: false });
    await audit(req.hc.client, { id: req.hc.id, role: req.hc.role }, "document.requested", "candidate", c.id, { kind: v.kind, label: v.label }, req);
    res.status(201).json({ data: row });
  }));
  app.post("/api/hc/team/candidates/:id/messages", teamOnly(async (req, res) => {
    const c = await scopedCandidate(req, req.params.id);
    const v = z.object({ body: text(4000, 1) }).parse(req.body);
    const row = ok(await req.hc.client.from("hc_messages").insert({ candidate_id: c.id, sender_id: req.hc.id, sender_role: req.hc.role === "admin" ? "admin" : "consultant", body: v.body, read_by_team_at: now() }).select("*").single());
    await req.hc.client.from("hc_notifications").insert({ candidate_id: c.id, title: "New message", body: v.body.slice(0, 140), link: "messages" });
    const m = candidateMail("message", c.preferred_language || "en", { name: c.full_name.split(" ")[0] });
    await sendMail({ to: c.email, subject: m.subject, html: m.html });
    res.status(201).json({ data: row });
  }));
  app.post("/api/hc/team/candidates/:id/erase", adminOnly(async (req, res) => {
    const c = await scopedCandidate(req, req.params.id), client = req.hc.client;
    z.object({ confirm: z.literal(c.reference) }).parse(req.body);
    const docs = ok(await client.from("hc_documents").select("object_path").eq("candidate_id", c.id));
    const paths = docs.map(d => d.object_path).filter(Boolean);
    if (paths.length) { const { error } = await client.storage.from(BUCKET).remove(paths); if (error) throw new HcError("Files could not be deleted. Nothing was erased; please retry.", 503); }
    await Promise.all(["hc_documents", "hc_messages", "hc_notifications", "hc_notes", "hc_tasks"].map(t => client.from(t).delete().eq("candidate_id", c.id)));
    ok(await client.from("hc_candidates").update({ full_name: "Erased candidate", email: `erased+${c.reference.toLowerCase()}@invalid.muktalent`, phone: null, nationality: null, registration_number: null, registration_body: null, additional_info: null, preferred_location: null, user_id: null, marketing_consent: false, next_action: null, erased_at: now(), archived_at: now() }).eq("id", c.id));
    await audit(client, { id: req.hc.id, role: "admin" }, "candidate.erased", "candidate", c.id, { reference: c.reference, files_deleted: paths.length }, req);
    res.json({ status: "erased", files_deleted: paths.length });
  }));

  // ----- documents -----
  app.get("/api/hc/team/documents", teamOnly(async (req, res) => {
    const status = z.enum(["requested", "uploaded", "approved", "rejected"]).default("uploaded").parse(req.query.status || undefined);
    let q = req.hc.client.from("hc_documents").select("id,kind,label,status,file_name,mime_type,size_bytes,uploaded_at,created_at,note,candidate:hc_candidates!inner(id,full_name,reference,consultant_id)").eq("status", status).order("uploaded_at", { ascending: true, nullsFirst: false }).limit(200);
    if (req.hc.role === "consultant") q = q.eq("candidate.consultant_id", req.hc.id);
    res.json({ data: ok(await q) });
  }));
  app.patch("/api/hc/team/documents/:id", teamOnly(async (req, res) => {
    const v = z.object({ status: z.enum(["approved", "rejected"]), note: optText(1000).optional() }).parse(req.body);
    const doc = ok(await req.hc.client.from("hc_documents").select("*").eq("id", uuid.parse(req.params.id)).maybeSingle());
    if (!doc) throw new HcError("Document not found.", 404);
    const c = await scopedCandidate(req, doc.candidate_id);
    const row = ok(await req.hc.client.from("hc_documents").update({ status: v.status, note: v.note ?? doc.note, reviewed_by: req.hc.id, reviewed_at: now() }).eq("id", doc.id).select("*").single());
    await req.hc.client.from("hc_notifications").insert({ candidate_id: c.id, title: v.status === "approved" ? "Document approved" : "Document needs attention", body: `${doc.label}${v.note ? ": " + v.note : ""}`, link: "documents" });
    await audit(req.hc.client, { id: req.hc.id, role: req.hc.role }, `document.${v.status}`, "document", doc.id, { candidate: c.id }, req);
    res.json({ data: row });
  }));
  app.get("/api/hc/team/documents/:id/url", teamOnly(async (req, res) => {
    const doc = ok(await req.hc.client.from("hc_documents").select("*").eq("id", uuid.parse(req.params.id)).maybeSingle());
    if (!doc?.object_path || doc.status === "requested") throw new HcError("File not available.", 404);
    await scopedCandidate(req, doc.candidate_id);
    const { data, error } = await req.hc.client.storage.from(BUCKET).createSignedUrl(doc.object_path, 60);
    if (error) throw new HcError("File not available.", 404);
    await audit(req.hc.client, { id: req.hc.id, role: req.hc.role }, "document.viewed", "document", doc.id, { candidate: doc.candidate_id }, req);
    res.json({ url: data.signedUrl });
  }));

  // ----- messages (threads) -----
  app.get("/api/hc/team/messages", teamOnly(async (req, res) => {
    let q = req.hc.client.from("hc_messages").select("id,candidate_id,sender_role,body,created_at,read_by_team_at,candidate:hc_candidates!inner(id,full_name,reference,consultant_id)").order("created_at", { ascending: false }).limit(400);
    if (req.hc.role === "consultant") q = q.eq("candidate.consultant_id", req.hc.id);
    const rows = ok(await q);
    const threads = new Map();
    for (const m of rows) {
      const t = threads.get(m.candidate_id) || { candidate: m.candidate, last: m, unread: 0 };
      if (m.sender_role === "candidate" && !m.read_by_team_at) t.unread++;
      threads.set(m.candidate_id, t);
    }
    res.json({ data: [...threads.values()] });
  }));

  // ----- interviews -----
  const interviewSchema = z.object({ candidate_id: uuid, application_id: uuid.nullable().optional(), employer_id: uuid.nullable().optional(), title: text(160, 2), scheduled_at: z.string().datetime({ offset: true }), duration_minutes: z.coerce.number().int().min(10).max(480).default(45), mode: z.enum(["video", "in_person", "phone"]).default("video"), location: optText(400).optional(), candidate_note: optText(2000).optional() });
  app.get("/api/hc/team/interviews", teamOnly(async (req, res) => {
    let q = req.hc.client.from("hc_interviews").select("*,candidate:hc_candidates!inner(id,full_name,reference,consultant_id),employer:hc_employers(id,organisation_name)").order("scheduled_at", { ascending: req.query.past !== "1" }).limit(200);
    q = req.query.past === "1" ? q.lt("scheduled_at", now()) : q.gte("scheduled_at", new Date(Date.now() - 864e5).toISOString());
    if (req.hc.role === "consultant") q = q.eq("candidate.consultant_id", req.hc.id);
    res.json({ data: ok(await q) });
  }));
  app.post("/api/hc/team/interviews", teamOnly(async (req, res) => {
    const v = interviewSchema.parse(req.body);
    const c = await scopedCandidate(req, v.candidate_id);
    if (c.country_status === "red") throw new HcError("Red-list country of residence: interviews cannot be arranged through MUKTalent.", 409);
    const row = ok(await req.hc.client.from("hc_interviews").insert({ ...v, created_by: req.hc.id }).select("*").single());
    await req.hc.client.from("hc_notifications").insert({ candidate_id: c.id, title: "Interview scheduled", body: `${v.title} · ${new Date(v.scheduled_at).toUTCString()}`, link: "interviews" });
    if (["suitable_for_matching", "submitted_to_employer"].includes(c.stage)) await stageChange(req.hc.client, c, "interview_scheduled", { id: req.hc.id, role: req.hc.role }, v.title);
    await audit(req.hc.client, { id: req.hc.id, role: req.hc.role }, "interview.scheduled", "candidate", c.id, { interview: row.id }, req);
    res.status(201).json({ data: row });
  }));
  app.patch("/api/hc/team/interviews/:id", teamOnly(async (req, res) => {
    const v = z.object({ status: z.enum(["scheduled", "completed", "cancelled", "no_show"]).optional(), outcome: optText(2000).optional(), scheduled_at: z.string().datetime({ offset: true }).optional(), location: optText(400).optional(), candidate_note: optText(2000).optional() }).strict().parse(req.body);
    const iv = ok(await req.hc.client.from("hc_interviews").select("*").eq("id", uuid.parse(req.params.id)).maybeSingle());
    if (!iv) throw new HcError("Interview not found.", 404);
    const c = await scopedCandidate(req, iv.candidate_id);
    const row = ok(await req.hc.client.from("hc_interviews").update(v).eq("id", iv.id).select("*").single());
    if (v.status === "completed" && c.stage === "interview_scheduled") await stageChange(req.hc.client, c, "interview_completed", { id: req.hc.id, role: req.hc.role }, iv.title);
    await audit(req.hc.client, { id: req.hc.id, role: req.hc.role }, "interview.updated", "candidate", c.id, { interview: iv.id, ...v }, req);
    res.json({ data: row });
  }));

  // ----- tasks & follow-ups -----
  app.get("/api/hc/team/tasks", teamOnly(async (req, res) => {
    const status = req.query.status === "done" ? "done" : "open";
    let q = req.hc.client.from("hc_tasks").select("*,candidate:hc_candidates(id,full_name,reference)").eq("status", status).order("due_at", { ascending: true, nullsFirst: false }).limit(300);
    if (req.hc.role === "consultant" || req.query.mine === "1") q = q.eq("owner_id", req.hc.id);
    res.json({ data: ok(await q) });
  }));
  app.post("/api/hc/team/tasks", teamOnly(async (req, res) => {
    const v = z.object({ candidate_id: uuid.nullable().optional(), owner_id: uuid.optional(), title: text(200, 2), detail: optText(2000).optional(), due_at: isoDate.optional() }).parse(req.body);
    if (v.candidate_id) await scopedCandidate(req, v.candidate_id);
    const owner = req.hc.role === "admin" && v.owner_id ? v.owner_id : req.hc.id;
    res.status(201).json({ data: ok(await req.hc.client.from("hc_tasks").insert({ ...v, owner_id: owner, created_by: req.hc.id }).select("*").single()) });
  }));
  app.patch("/api/hc/team/tasks/:id", teamOnly(async (req, res) => {
    const v = z.object({ status: z.enum(["open", "done"]).optional(), title: text(200, 2).optional(), due_at: isoDate.optional() }).strict().parse(req.body);
    const t = ok(await req.hc.client.from("hc_tasks").select("*").eq("id", uuid.parse(req.params.id)).maybeSingle());
    if (!t || (req.hc.role === "consultant" && t.owner_id !== req.hc.id)) throw new HcError("Task not found.", 404);
    res.json({ data: ok(await req.hc.client.from("hc_tasks").update({ ...v, done_at: v.status === "done" ? now() : v.status === "open" ? null : t.done_at }).eq("id", t.id).select("*").single()) });
  }));

  // ----- applications -----
  app.get("/api/hc/team/applications", teamOnly(async (req, res) => {
    let q = req.hc.client.from("hc_applications").select("*,candidate:hc_candidates!inner(id,full_name,reference,consultant_id,country_status,profession),vacancy:hc_vacancies(id,title,employer_display,location,consultant_id)").order("created_at", { ascending: false }).limit(300);
    if (req.query.status) q = q.eq("status", z.enum(["applied", "under_review", "shortlisted", "submitted_to_employer", "interview", "offer", "accepted", "unsuccessful", "withdrawn"]).parse(req.query.status));
    if (req.hc.role === "consultant") q = q.eq("candidate.consultant_id", req.hc.id);
    res.json({ data: ok(await q) });
  }));
  app.patch("/api/hc/team/applications/:id", teamOnly(async (req, res) => {
    const v = z.object({ status: z.enum(["applied", "under_review", "shortlisted", "submitted_to_employer", "interview", "offer", "accepted", "unsuccessful", "withdrawn"]), internal_note: optText(3000).optional() }).parse(req.body);
    const a = ok(await req.hc.client.from("hc_applications").select("*").eq("id", uuid.parse(req.params.id)).maybeSingle());
    if (!a) throw new HcError("Application not found.", 404);
    const c = await scopedCandidate(req, a.candidate_id);
    if (["submitted_to_employer", "interview", "offer", "accepted"].includes(v.status)) {
      const blocked = stageAllowed(c, "submitted_to_employer", { actorRole: req.hc.role, note: v.internal_note || a.internal_note });
      if (blocked) throw new HcError(blocked, 409, "stage_blocked");
    }
    const row = ok(await req.hc.client.from("hc_applications").update(v).eq("id", a.id).select("*").single());
    const map = { submitted_to_employer: "submitted_to_employer", offer: "offer_received", accepted: "offer_accepted" };
    if (map[v.status] && STAGES.indexOf(map[v.status]) > STAGES.indexOf(c.stage)) await stageChange(req.hc.client, c, map[v.status], { id: req.hc.id, role: req.hc.role }, `Application ${a.reference}`);
    await audit(req.hc.client, { id: req.hc.id, role: req.hc.role }, "application.updated", "application", a.id, { status: v.status }, req);
    res.json({ data: row });
  }));

  // ----- vacancies -----
  app.get("/api/hc/team/vacancies", teamOnly(async (req, res) => {
    let q = req.hc.client.from("hc_vacancies").select("*,employer:hc_employers(id,organisation_name)").order("updated_at", { ascending: false }).limit(300);
    if (req.hc.role === "consultant") q = q.or(`consultant_id.eq.${req.hc.id},status.eq.published`);
    const rows = ok(await q);
    const counts = ok(await req.hc.client.from("hc_applications").select("vacancy_id").in("vacancy_id", rows.map(r => r.id).length ? rows.map(r => r.id) : ["00000000-0000-0000-0000-000000000000"]));
    const n = {}; for (const a of counts) n[a.vacancy_id] = (n[a.vacancy_id] || 0) + 1;
    res.json({ data: rows.map(r => ({ ...r, applications: n[r.id] || 0 })) });
  }));
  app.post("/api/hc/team/vacancies", adminOnly(async (req, res) => {
    const v = vacancySchema.parse(req.body);
    let slug = slugify(`${v.title}-${v.location}`).slice(0, 80);
    const clash = ok(await req.hc.client.from("hc_vacancies").select("slug").like("slug", `${slug}%`));
    if (clash.length) slug = `${slug}-${clash.length + 1}`;
    const row = ok(await req.hc.client.from("hc_vacancies").insert({ ...v, slug, status: "draft", created_by: req.hc.id }).select("*").single());
    await audit(req.hc.client, { id: req.hc.id, role: "admin" }, "vacancy.created", "vacancy", row.id, { title: v.title }, req);
    res.status(201).json({ data: row });
  }));
  app.patch("/api/hc/team/vacancies/:id", adminOnly(async (req, res) => {
    const id = uuid.parse(req.params.id);
    const body = req.body || {};
    const current = ok(await req.hc.client.from("hc_vacancies").select("*").eq("id", id).maybeSingle());
    if (!current) throw new HcError("Vacancy not found.", 404);
    let patch = {};
    if (body.status) {
      const status = z.enum(["draft", "published", "closed"]).parse(body.status);
      if (status === "published") {
        z.literal(true, { message: "Confirm that this vacancy is genuine and authorised by the employer." }).parse(body.authorised);
        if (!current.employer_id) throw new HcError("Link the vacancy to an employer record before publishing.", 400);
        const emp = ok(await req.hc.client.from("hc_employers").select("due_diligence_status,status").eq("id", current.employer_id).maybeSingle());
        if (emp?.due_diligence_status !== "completed") throw new HcError("Complete employer due diligence before publishing this vacancy.", 409);
        patch = { status, authorised_by: req.hc.id, authorised_at: now(), published_at: current.published_at || now() };
      } else patch = { status };
    } else {
      patch = vacancySchema.parse({ ...current, ...body });
    }
    const row = ok(await req.hc.client.from("hc_vacancies").update(patch).eq("id", id).select("*").single());
    await audit(req.hc.client, { id: req.hc.id, role: "admin" }, body.status ? `vacancy.${body.status}` : "vacancy.updated", "vacancy", id, {}, req);
    res.json({ data: row });
  }));

  // ----- employers -----
  app.get("/api/hc/team/employers", teamOnly(async (req, res) => {
    const rows = ok(await req.hc.client.from("hc_employers").select("*").is("archived_at", null).order("organisation_name").limit(500));
    res.json({ data: req.hc.role === "admin" ? rows : rows.map(({ due_diligence_notes, notes, ...r }) => r) });
  }));
  app.post("/api/hc/team/employers", adminOnly(async (req, res) => {
    const v = employerSchema.parse(req.body);
    const enquiryId = req.body?.from_enquiry ? uuid.parse(req.body.from_enquiry) : null;
    const row = ok(await req.hc.client.from("hc_employers").insert(v).select("*").single());
    if (enquiryId) await req.hc.client.from("hc_enquiries").update({ status: "converted", employer_id: row.id }).eq("id", enquiryId);
    await audit(req.hc.client, { id: req.hc.id, role: "admin" }, "employer.created", "employer", row.id, { from_enquiry: enquiryId }, req);
    res.status(201).json({ data: row });
  }));
  app.patch("/api/hc/team/employers/:id", adminOnly(async (req, res) => {
    const id = uuid.parse(req.params.id);
    const current = ok(await req.hc.client.from("hc_employers").select("*").eq("id", id).maybeSingle());
    if (!current) throw new HcError("Employer not found.", 404);
    const { id: _i, created_at, updated_at, archived_at, due_diligence_completed_at, ...rest } = current;
    const v = employerSchema.parse({ ...rest, ...req.body });
    if (v.due_diligence_status === "completed" && current.due_diligence_status !== "completed") v.due_diligence_completed_at = now();
    if (req.body?.archived === true) v.archived_at = now();
    const row = ok(await req.hc.client.from("hc_employers").update(v).eq("id", id).select("*").single());
    await audit(req.hc.client, { id: req.hc.id, role: "admin" }, "employer.updated", "employer", id, { fields: Object.keys(req.body || {}) }, req);
    res.json({ data: row });
  }));

  // ----- enquiries -----
  app.get("/api/hc/team/enquiries", adminOnly(async (req, res) => {
    let q = req.hc.client.from("hc_enquiries").select("*").order("created_at", { ascending: false }).limit(300);
    if (req.query.route) q = q.eq("route", z.enum(["candidate", "employer", "general"]).parse(req.query.route));
    if (req.query.status) q = q.eq("status", z.enum(["new", "in_progress", "responded", "converted", "closed"]).parse(req.query.status));
    res.json({ data: ok(await q) });
  }));
  app.patch("/api/hc/team/enquiries/:id", adminOnly(async (req, res) => {
    const v = z.object({ status: z.enum(["new", "in_progress", "responded", "converted", "closed"]).optional(), assigned_to: uuid.nullable().optional() }).strict().parse(req.body);
    const row = ok(await req.hc.client.from("hc_enquiries").update(v).eq("id", uuid.parse(req.params.id)).select("*").single());
    await audit(req.hc.client, { id: req.hc.id, role: "admin" }, "enquiry.updated", "enquiry", row.id, v, req);
    res.json({ data: row });
  }));

  // ----- complaints register -----
  app.get("/api/hc/team/complaints", adminOnly(async (req, res) => res.json({ data: ok(await req.hc.client.from("hc_complaints").select("*").order("created_at", { ascending: false }).limit(300)) })));
  app.patch("/api/hc/team/complaints/:id", adminOnly(async (req, res) => {
    const v = z.object({ status: z.enum(["received", "acknowledged", "investigating", "resolved", "escalated", "closed"]).optional(), severity: z.enum(["standard", "serious", "safeguarding"]).optional(), responsible_id: uuid.nullable().optional(), resolution: optText(6000).optional(), escalated_to: optText(200).optional() }).strict().parse(req.body);
    const cur = ok(await req.hc.client.from("hc_complaints").select("*").eq("id", uuid.parse(req.params.id)).maybeSingle());
    if (!cur) throw new HcError("Complaint not found.", 404);
    const patch = { ...v };
    if (v.status === "acknowledged" && !cur.acknowledged_at) patch.acknowledged_at = now();
    if ((v.status === "closed" || v.status === "resolved") && !cur.closed_at) { if (!(v.resolution || cur.resolution)) throw new HcError("Record the outcome before resolving or closing a complaint.", 400); patch.closed_at = now(); }
    const row = ok(await req.hc.client.from("hc_complaints").update(patch).eq("id", cur.id).select("*").single());
    await audit(req.hc.client, { id: req.hc.id, role: "admin" }, "complaint.updated", "complaint", cur.id, { status: v.status || null }, req);
    res.json({ data: row });
  }));

  // ----- consultants -----
  app.get("/api/hc/team/consultants", teamOnly(async (req, res) => {
    const client = req.hc.client;
    const [staff, cons, load] = await Promise.all([
      client.from("crm_staff").select("user_id,full_name,role,active").eq("active", true).order("full_name"),
      client.from("hc_consultants").select("*"),
      client.from("hc_candidates").select("consultant_id,stage").is("erased_at", null).is("archived_at", null).not("consultant_id", "is", null)
    ]);
    const byId = new Map(ok(cons).map(c => [c.user_id, c]));
    const counts = {}, placed = {};
    for (const c of ok(load)) { if (!CLOSED_STAGES.has(c.stage)) counts[c.consultant_id] = (counts[c.consultant_id] || 0) + 1; if (c.stage === "recruitment_completed") placed[c.consultant_id] = (placed[c.consultant_id] || 0) + 1; }
    const rows = ok(staff).map(s => ({ ...s, healthcare: byId.get(s.user_id) || null, active_candidates: counts[s.user_id] || 0, placed: placed[s.user_id] || 0 }));
    res.json({ data: req.hc.role === "admin" ? rows : rows.filter(r => r.healthcare?.active).map(({ role, ...r }) => r) });
  }));
  app.put("/api/hc/team/consultants/:userId", adminOnly(async (req, res) => {
    const userId = uuid.parse(req.params.userId);
    const v = z.object({ active: z.boolean(), title: text(120, 2).optional(), capacity: z.coerce.number().int().min(1).max(500).optional(), languages: z.array(z.string().max(30)).max(10).optional(), professions: z.array(z.enum(PROFESSIONS)).max(13).optional(), bio: optText(1200).optional() }).parse(req.body);
    const staff = ok(await req.hc.client.from("crm_staff").select("user_id,active").eq("user_id", userId).maybeSingle());
    if (!staff?.active) throw new HcError("Only active MUKTalent staff accounts can be Healthcare consultants.", 400);
    const row = ok(await req.hc.client.from("hc_consultants").upsert({ user_id: userId, ...v }).select("*").single());
    await audit(req.hc.client, { id: req.hc.id, role: "admin" }, v.active ? "consultant.enabled" : "consultant.disabled", "consultant", userId, {}, req);
    res.json({ data: row });
  }));

  // ----- compliance -----
  app.get("/api/hc/team/compliance", adminOnly(async (req, res) => {
    const client = req.hc.client;
    const [items, rules, flagged, requests, s] = await Promise.all([
      client.from("hc_compliance_items").select("*").order("sort"),
      client.from("hc_country_rules").select("*").order("status").order("country_name"),
      client.from("hc_candidates").select("id,reference,full_name,country_residence,country_status,stage,consultant_id").in("country_status", ["red", "amber", "unchecked"]).is("erased_at", null).is("archived_at", null).limit(300),
      client.from("hc_candidates").select("id,reference,full_name,deletion_requested_at").not("deletion_requested_at", "is", null).is("erased_at", null),
      settings(client)
    ]);
    res.json({ data: { items: ok(items), country_rules: ok(rules), flagged: ok(flagged), deletion_requests: ok(requests), settings: s } });
  }));
  app.patch("/api/hc/team/compliance/items/:key", adminOnly(async (req, res) => {
    const key = z.string().regex(/^[a-z0-9_]{2,60}$/).parse(req.params.key);
    const v = z.object({ status: z.enum(["not_started", "in_progress", "in_place", "needs_review"]).optional(), owner_name: optText(140).optional(), evidence: optText(4000).optional(), approved_at: z.preprocess(x => (x ? x : null), z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable()).optional(), review_due: z.preprocess(x => (x ? x : null), z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable()).optional() }).strict().parse(req.body);
    const row = ok(await req.hc.client.from("hc_compliance_items").update({ ...v, updated_by: req.hc.id, updated_at: now() }).eq("key", key).select("*").single());
    await audit(req.hc.client, { id: req.hc.id, role: "admin" }, "compliance.item_updated", "compliance", key, v, req);
    res.json({ data: row });
  }));
  app.put("/api/hc/team/compliance/countries/:code", adminOnly(async (req, res) => {
    const code = z.string().regex(/^[A-Z]{2}$/).parse(String(req.params.code).toUpperCase());
    const v = z.object({ country_name: text(80, 2), status: z.enum(["red", "amber", "green"]), agreement_note: optText(500).optional(), source_url: optText(300).optional() }).parse(req.body);
    const row = ok(await req.hc.client.from("hc_country_rules").upsert({ country_code: code, ...v, reviewed_at: now().slice(0, 10), reviewed_by: req.hc.id }).select("*").single());
    // Re-evaluate every live candidate resident in that country.
    await req.hc.client.from("hc_candidates").update({ country_status: v.status, country_checked_at: now(), country_checked_by: req.hc.id }).eq("country_residence", code).is("erased_at", null);
    await audit(req.hc.client, { id: req.hc.id, role: "admin" }, "compliance.country_rule_set", "country", code, v, req);
    res.json({ data: row });
  }));
  app.post("/api/hc/team/compliance/countries/reviewed", adminOnly(async (req, res) => {
    ok(await req.hc.client.from("hc_settings").update({ country_list_reviewed_at: now().slice(0, 10), updated_by: req.hc.id }).eq("id", true));
    await audit(req.hc.client, { id: req.hc.id, role: "admin" }, "compliance.country_list_reviewed", "settings", "country_list", {}, req);
    res.json({ ok: true });
  }));

  // ----- reports -----
  app.get("/api/hc/team/reports", teamOnly(async (req, res) => {
    const client = req.hc.client;
    const rows = ok(await scope(req, client.from("hc_candidates").select("id,stage,profession,country_residence,nationality,country_status,created_at,consultant_id,source").is("erased_at", null)).limit(10000));
    const tally = key => { const o = {}; for (const r of rows) { const k = r[key] || "unknown"; o[k] = (o[k] || 0) + 1; } return o; };
    const monthly = {}; for (const r of rows) { const m = r.created_at.slice(0, 7); monthly[m] = (monthly[m] || 0) + 1; }
    const placedIds = new Set(rows.filter(r => r.stage === "recruitment_completed").map(r => r.id));
    const placements = rows.filter(r => placedIds.has(r.id));
    const pTally = key => { const o = {}; for (const r of placements) { const k = r[key] || "unknown"; o[k] = (o[k] || 0) + 1; } return o; };
    const ids = rows.map(r => r.id).length ? rows.map(r => r.id).slice(0, 5000) : ["00000000-0000-0000-0000-000000000000"];
    const scoped = q => (req.hc.role === "consultant" ? q.in("candidate_id", ids) : q);
    const [apps, ints] = await Promise.all([scoped(client.from("hc_applications").select("status")), scoped(client.from("hc_interviews").select("status"))]);
    const appT = {}; for (const a of ok(apps)) appT[a.status] = (appT[a.status] || 0) + 1;
    const intT = {}; for (const a of ok(ints)) intT[a.status] = (intT[a.status] || 0) + 1;
    if (req.query.format === "csv") {
      const csv = ["stage,profession,country_of_application,nationality,code_status,registered_month,source", ...rows.map(r => [r.stage, r.profession, r.country_residence, r.nationality || "", r.country_status, r.created_at.slice(0, 7), r.source].join(","))].join("\n");
      await audit(client, { id: req.hc.id, role: req.hc.role }, "report.exported", "report", "recruitment_activity", { rows: rows.length }, req);
      res.set("Content-Type", "text/csv; charset=utf-8").set("Content-Disposition", `attachment; filename="healthcare-recruitment-activity-${now().slice(0, 10)}.csv"`);
      return res.send(csv);
    }
    res.json({ data: { total: rows.length, by_stage: tally("stage"), by_profession: tally("profession"), by_country: tally("country_residence"), by_nationality: tally("nationality"), by_code_status: tally("country_status"), by_source: tally("source"), monthly, placements: { total: placements.length, by_country: pTally("country_residence"), by_nationality: pTally("nationality"), by_profession: pTally("profession") }, applications: appT, interviews: intT } });
  }));

  // ----- settings & audit -----
  app.get("/api/hc/team/settings", adminOnly(async (req, res) => res.json({ data: await settings(req.hc.client) })));
  app.patch("/api/hc/team/settings", adminOnly(async (req, res) => {
    const em = z.preprocess(v => String(v || "").trim().toLowerCase(), z.string().email().max(320));
    const v = z.object({ notify_email: em.optional(), candidate_enquiries_email: em.optional(), employer_enquiries_email: em.optional(), complaints_email: em.optional(), compliance_lead_name: optText(140).optional(), compliance_lead_title: optText(140).optional(), data_protection_lead_name: optText(140).optional(), complaint_ack_days: z.coerce.number().int().min(1).max(10).optional(), complaint_response_days: z.coerce.number().int().min(5).max(60).optional(), retention_unsuccessful_months: z.coerce.number().int().min(1).max(84).optional(), retention_placed_years: z.coerce.number().int().min(1).max(10).optional(), privacy_notice_version: text(40, 3).optional() }).strict().parse(req.body);
    const row = ok(await req.hc.client.from("hc_settings").update({ ...v, updated_by: req.hc.id, updated_at: now() }).eq("id", true).select("*").single());
    await audit(req.hc.client, { id: req.hc.id, role: "admin" }, "settings.updated", "settings", "hc", { fields: Object.keys(v) }, req);
    res.json({ data: row });
  }));
  app.get("/api/hc/team/audit", adminOnly(async (req, res) => {
    let q = req.hc.client.from("hc_audit_log").select("*").order("created_at", { ascending: false }).limit(300);
    if (req.query.entity) q = q.eq("entity", z.string().max(40).parse(req.query.entity));
    const rows = ok(await q);
    const ids = [...new Set(rows.map(r => r.actor_id).filter(Boolean))];
    const names = ids.length ? ok(await req.hc.client.from("crm_staff").select("user_id,full_name").in("user_id", ids)) : [];
    const map = Object.fromEntries(names.map(n => [n.user_id, n.full_name]));
    res.json({ data: rows.map(r => ({ ...r, actor_name: map[r.actor_id] || null })) });
  }));
  // Retention review: candidates past the retention period (to be reviewed / erased by an admin).
  app.get("/api/hc/team/retention", adminOnly(async (req, res) => {
    const s = await settings(req.hc.client);
    const cutoffUnsuccessful = new Date(Date.now() - (s.retention_unsuccessful_months || 12) * 30.44 * 864e5).toISOString();
    const rows = ok(await req.hc.client.from("hc_candidates").select("id,reference,full_name,stage,stage_changed_at,updated_at").in("stage", ["unsuccessful", "withdrawn", "new_registration", "initial_review", "awaiting_information"]).lt("updated_at", cutoffUnsuccessful).is("erased_at", null).limit(300));
    res.json({ data: rows, policy: { unsuccessful_months: s.retention_unsuccessful_months, placed_years: s.retention_placed_years } });
  }));
}
