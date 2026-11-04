import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { randomUUID } from "node:crypto";
import { mountHealthcare } from "./healthcare.mjs";
import { stageAllowed, countryDecision, journeyIndex, slugify, registrationSchema, enquirySchema, STAGES } from "./healthcare-model.mjs";

// ---------- in-memory Supabase double (subset of PostgREST used by the routes) ----------
const DEFAULTS = {
  hc_candidates: () => ({ id: randomUUID(), reference: "MKH-C26-" + String(Math.floor(Math.random() * 99999)).padStart(5, "0"), stage: "new_registration", country_status: "unchecked", consultant_id: null, user_id: null, erased_at: null, archived_at: null, deletion_requested_at: null, created_at: new Date().toISOString(), priority: "normal", preferred_language: "en" }),
  hc_documents: () => ({ id: randomUUID(), created_at: new Date().toISOString(), status: "requested" }),
  hc_enquiries: () => ({ id: randomUUID(), reference: "MKH-E26-00001", status: "new", created_at: new Date().toISOString() }),
  hc_complaints: () => ({ id: randomUUID(), reference: "MKH-K26-00001", status: "received", created_at: new Date().toISOString() }),
  hc_applications: () => ({ id: randomUUID(), reference: "MKH-A26-00001", status: "applied", created_at: new Date().toISOString() }),
  hc_vacancies: () => ({ id: randomUUID(), status: "draft", created_at: new Date().toISOString(), updated_at: new Date().toISOString() }),
  hc_employers: () => ({ id: randomUUID(), status: "prospect", due_diligence_status: "not_started", archived_at: null }),
  hc_interviews: () => ({ id: randomUUID(), status: "scheduled" }),
  hc_tasks: () => ({ id: randomUUID(), status: "open" }),
  hc_notes: () => ({ id: Math.random() }),
  hc_messages: () => ({ id: Math.random(), created_at: new Date().toISOString(), read_by_team_at: null })
};
function fakeDb(tables, users, storage = new Set()) {
  const builder = name => {
    const rows = () => tables[name] || (tables[name] = []);
    let filters = [], op = "select", payload = null, single = false, head = false, cols = null;
    const like = (v, pat) => new RegExp("^" + String(pat).replace(/[.*+?^${}()|[\]]/g, "\\$&").replace(/%/g, ".*").replace(/_/g, ".") + "$", "i").test(String(v ?? ""));
    const run = () => {
      let list = rows().filter(r => filters.every(f => f(r)));
      if (op === "insert" || op === "upsert") {
        const items = (Array.isArray(payload) ? payload : [payload]).map(x => ({ ...(DEFAULTS[name]?.() || {}), ...x }));
        if (op === "upsert" && name === "hc_consultants") { for (const it of items) { const i = rows().findIndex(r => r.user_id === it.user_id); if (i >= 0) rows()[i] = { ...rows()[i], ...it }; else rows().push(it); } }
        else rows().push(...items);
        list = items;
      }
      if (op === "update") list.forEach(r => Object.assign(r, payload));
      if (op === "delete") tables[name] = rows().filter(r => !list.includes(r));
      if (head) return { data: null, count: list.length, error: null };
      if (cols) list = list.map(r => Object.fromEntries(cols.map(k => [k, r[k]])));
      return { data: single ? (list[0] ?? null) : list, count: list.length, error: null };
    };
    const q = {
      select(c, o) { if (o?.head) head = true; if (op === "select" && c && c !== "*" && !c.includes("(") && !c.includes("*")) cols = c.split(",").map(x => x.trim()); return q; }, insert(v) { op = "insert"; payload = v; return q; }, update(v) { op = "update"; payload = v; return q; }, delete() { op = "delete"; return q; }, upsert(v) { op = "upsert"; payload = v; return q; },
      eq(k, v) { if (!k.includes(".")) filters.push(r => r[k] === v); return q; }, neq(k, v) { filters.push(r => r[k] !== v); return q; }, is(k, v) { filters.push(r => (r[k] ?? null) === v); return q; },
      in(k, v) { filters.push(r => v.includes(r[k])); return q; }, gte(k, v) { filters.push(r => r[k] >= v); return q; }, lt(k, v) { filters.push(r => r[k] < v); return q; },
      ilike(k, v) { filters.push(r => like(r[k], v.replace(/\\([%_\\])/g, "$1"))); return q; }, like(k, v) { filters.push(r => like(r[k], v)); return q; },
      not(k, opr, v) { if (opr === "in") { const set = v.replace(/[()]/g, "").split(","); filters.push(r => !set.includes(r[k])); } else if (opr === "is") filters.push(r => r[k] != null); return q; },
      or() { return q; }, order() { return q; }, limit() { return q; }, range() { return q; },
      maybeSingle() { single = true; return Promise.resolve(run()); }, single() { single = true; return Promise.resolve(run()); },
      then(res, rej) { return Promise.resolve(run()).then(res, rej); }
    };
    return q;
  };
  return () => ({
    from: builder,
    auth: { getUser: async token => { const u = users[token]; return u ? { data: { user: u }, error: null } : { data: null, error: { message: "bad" } }; } },
    storage: { from: () => ({
      createSignedUploadUrl: async path => ({ data: { signedUrl: "https://storage.example/upload/" + path, token: "tok" }, error: null }),
      createSignedUrl: async () => ({ data: { signedUrl: "https://storage.example/dl" }, error: null }),
      list: async (dir, { search }) => ({ data: storage.has(dir + "/" + search) ? [{ name: search, metadata: { size: 1000 } }] : [], error: null }),
      remove: async paths => { paths.forEach(p => storage.delete(p)); return { data: [], error: null }; }
    }) }
  });
}
const jwt = (aal, id) => "h." + Buffer.from(JSON.stringify({ aal, sub: id })).toString("base64url") + ".s";
const ADMIN = "a0000000-0000-4000-8000-000000000001", CONS = "c0000000-0000-4000-8000-000000000002", CONS2 = "c0000000-0000-4000-8000-000000000003", CAND = "d0000000-0000-4000-8000-000000000004";
function server(extra = {}) {
  const tables = {
    hc_settings: [{ id: true, notify_email: "agents@muktalent.com", privacy_notice_version: "HC-CPN-2026-11", complaint_ack_days: 2, complaint_response_days: 20, retention_unsuccessful_months: 12 }],
    crm_staff: [{ user_id: ADMIN, full_name: "Admin User", role: "admin", active: true }, { user_id: CONS, full_name: "Sara Consultant", role: "collaborator", active: true }, { user_id: CONS2, full_name: "Other Consultant", role: "collaborator", active: true }],
    hc_consultants: [{ user_id: CONS, active: true, title: "Healthcare Recruitment Consultant" }, { user_id: CONS2, active: true }],
    hc_country_rules: [{ country_code: "NG", country_name: "Nigeria", status: "red" }, { country_code: "KE", country_name: "Kenya", status: "amber", agreement_note: "Bilateral agreement" }],
    hc_candidates: [], hc_audit_log: [], ...extra
  };
  const users = {
    [jwt("aal2", ADMIN)]: { id: ADMIN, email: "admin@muktalent.com", email_confirmed_at: "x" },
    [jwt("aal1", ADMIN)]: { id: ADMIN, email: "admin@muktalent.com", email_confirmed_at: "x" },
    [jwt("aal2", CONS)]: { id: CONS, email: "sara@muktalent.com", email_confirmed_at: "x" },
    [jwt("aal2", CONS2)]: { id: CONS2, email: "other@muktalent.com", email_confirmed_at: "x" },
    [jwt("aal1", CAND)]: { id: CAND, email: "nurse@example.com", email_confirmed_at: "x" }
  };
  const storage = new Set();
  const app = express(); app.use(express.json());
  mountHealthcare(app, { db: fakeDb(tables, users, storage) });
  return { app, tables, storage };
}
async function call(app, method, url, token, body) {
  const srv = app.listen(0); const port = srv.address().port;
  try {
    const r = await fetch(`http://127.0.0.1:${port}${url}`, { method, headers: { ...(token ? { Authorization: "Bearer " + token } : {}), ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
    const ct = r.headers.get("content-type") || "";
    return { status: r.status, body: ct.includes("json") ? await r.json() : await r.text() };
  } finally { srv.close(); }
}
const reg = { full_name: "Amina El Idrissi", email: "nurse@example.com", phone: "+212 600 000 000", country_residence: "MA", nationality: "MA", profession: "adult_nurse", experience_years: 4, registration_status: "registered_home", english_level: "preparing", employment_status: "employed", preferred_location: "London", privacy: true, elapsed: 9000, lang: "fr" };

// ---------- pure rules ----------
test("country decision follows the Code of Practice lists", () => {
  assert.deepEqual(countryDecision(null), { status: "green", activeRecruitment: true });
  assert.equal(countryDecision({ status: "red" }).activeRecruitment, false);
  assert.equal(countryDecision({ status: "amber" }).activeRecruitment, false);
});
test("matching is blocked for unchecked, red and unjustified amber candidates", () => {
  assert.match(stageAllowed({ country_status: "unchecked" }, "suitable_for_matching"), /country-of-residence check/);
  assert.match(stageAllowed({ country_status: "red" }, "submitted_to_employer"), /red list/);
  assert.match(stageAllowed({ country_status: "amber" }, "suitable_for_matching", { actorRole: "consultant" }), /administrator/);
  assert.match(stageAllowed({ country_status: "amber" }, "suitable_for_matching", { actorRole: "admin", note: "short" }), /record how/);
  assert.equal(stageAllowed({ country_status: "amber" }, "suitable_for_matching", { actorRole: "admin", note: "Within the UK–Kenya bilateral agreement, pilot employer" }), null);
  assert.equal(stageAllowed({ country_status: "red" }, "unsuccessful"), null);
  assert.equal(stageAllowed({ country_status: "green" }, "offer_received"), null);
});
test("journey maps all 15 pipeline stages onto 8 public steps", () => {
  assert.equal(STAGES.length, 15);
  assert.equal(journeyIndex("new_registration"), 0);
  assert.equal(journeyIndex("documentation_review"), 2);
  assert.equal(journeyIndex("recruitment_completed"), 7);
  assert.equal(slugify("Adult Nurse – Band 5, Manchester"), "adult-nurse-band-5-manchester");
});
test("schemas reject missing privacy consent and personal emails for employers", () => {
  assert.throws(() => registrationSchema.parse({ ...reg, privacy: false }));
  assert.throws(() => enquirySchema.parse({ route: "employer", name: "Jo Bloggs", email: "jo@gmail.com", organisation: "Care Ltd", organisation_type: "care_home", professions: ["adult_nurse"], privacy: true }));
  assert.ok(enquirySchema.parse({ route: "employer", name: "Jo Bloggs", email: "jo@carehomes.co.uk", organisation: "Care Ltd", organisation_type: "care_home", professions: ["adult_nurse"], privacy: true }));
});

// ---------- public forms ----------
test("registration creates a referenced candidate, CV upload slot and green status", async () => {
  const { app, tables, storage } = server();
  const r = await call(app, "POST", "/api/hc/public/register", null, { ...reg, cv: { name: "cv.pdf", type: "application/pdf", size: 120000 } });
  assert.equal(r.status, 201);
  assert.match(r.body.reference, /^MKH-C26-/);
  assert.equal(r.body.country_status, "green");
  assert.equal(tables.hc_candidates[0].preferred_language, "fr");
  assert.equal(tables.hc_stage_history.length, 1);
  assert.ok(r.body.upload.signedUrl.includes("/cv/"));
  // completing before the object exists fails; after upload succeeds
  const bad = await call(app, "POST", "/api/hc/public/register/complete-upload", null, { documentId: r.body.upload.documentId, path: r.body.upload.path });
  assert.equal(bad.status, 400);
  storage.add(r.body.upload.path);
  const good = await call(app, "POST", "/api/hc/public/register/complete-upload", null, { documentId: r.body.upload.documentId, path: r.body.upload.path });
  assert.equal(good.status, 200);
  assert.equal(tables.hc_documents[0].status, "uploaded");
  assert.ok(tables.hc_audit_log.some(a => a.action === "candidate.registered"));
});
test("red-list residence is accepted but flagged and signposted", async () => {
  const { app, tables } = server();
  const r = await call(app, "POST", "/api/hc/public/register", null, { ...reg, email: "x@example.com", country_residence: "NG" });
  assert.equal(r.status, 201);
  assert.equal(r.body.restricted, true);
  assert.equal(tables.hc_candidates[0].country_status, "red");
  assert.ok(tables.hc_messages[0].body.includes("NHS Jobs"));
});
test("duplicate email does not create a second profile; honeypot and speed checks reject bots", async () => {
  const { app, tables } = server();
  await call(app, "POST", "/api/hc/public/register", null, reg);
  const dup = await call(app, "POST", "/api/hc/public/register", null, { ...reg, email: "NURSE@example.com" });
  assert.equal(dup.status, 202);
  assert.equal(tables.hc_candidates.length, 1);
  assert.equal((await call(app, "POST", "/api/hc/public/register", null, { ...reg, email: "b@example.com", website: "spam" })).status, 400);
  assert.equal((await call(app, "POST", "/api/hc/public/register", null, { ...reg, email: "c@example.com", elapsed: 300 })).status, 400);
});
test("employer enquiries and complaints are stored with references and due dates", async () => {
  const { app, tables } = server();
  const e = await call(app, "POST", "/api/hc/public/enquiry", null, { route: "employer", name: "Jo Bloggs", email: "jo@carehomes.co.uk", organisation: "Care Ltd", organisation_type: "care_home", professions: ["adult_nurse", "physiotherapist"], vacancies_count: 6, requirements: "Six nurses for Q1", location: "Leeds", privacy: true, elapsed: 8000 });
  assert.equal(e.status, 201);
  assert.deepEqual(tables.hc_enquiries[0].details.professions, ["adult_nurse", "physiotherapist"]);
  const c = await call(app, "POST", "/api/hc/public/complaint", null, { complainant_name: "Amina", email: "a@example.com", complainant_role: "candidate", category: "fees", subject: "Asked for a fee", details: "An agent asked me to pay a placement fee.", privacy: true, elapsed: 8000 });
  assert.equal(c.status, 201);
  assert.equal(tables.hc_complaints[0].severity, "serious");
  assert.ok(tables.hc_complaints[0].response_due_at > tables.hc_complaints[0].ack_due_at);
});

// ---------- identity & portal ----------
test("first portal sign-in links the public registration by verified email", async () => {
  const { app, tables } = server();
  await call(app, "POST", "/api/hc/public/register", null, reg);
  const me = await call(app, "GET", "/api/hc/me", jwt("aal1", CAND));
  assert.equal(me.status, 200);
  assert.equal(me.body.role, "candidate");
  assert.equal(tables.hc_candidates[0].user_id, CAND);
  assert.equal(me.body.data.journey.length, 8);
  assert.equal(me.body.data.journey[0].state, "current");
  assert.equal(me.body.data.candidate.user_id, undefined);
  const msg = await call(app, "POST", "/api/hc/portal/messages", jwt("aal1", CAND), { body: "Hello, I have a question about NMC registration." });
  assert.equal(msg.status, 201);
  const up = await call(app, "POST", "/api/hc/portal/documents/upload-url", jwt("aal1", CAND), { kind: "passport", file: { name: "p.pdf", type: "application/pdf", size: 1000 } });
  assert.equal(up.status, 400, "identity documents only on request");
});
test("team access needs MFA (aal2) and a Healthcare role", async () => {
  const { app } = server();
  const r = await call(app, "GET", "/api/hc/team/overview", jwt("aal1", ADMIN));
  assert.equal(r.status, 401); assert.equal(r.body.code, "mfa_required");
  assert.equal((await call(app, "GET", "/api/hc/team/overview", jwt("aal1", CAND))).status, 403);
  assert.equal((await call(app, "GET", "/api/hc/team/overview", jwt("aal2", ADMIN))).status, 200);
});
test("consultants only see their own candidates and cannot reassign", async () => {
  const id1 = randomUUID(), id2 = randomUUID();
  const { app } = server({ hc_candidates: [
    { id: id1, reference: "MKH-C26-00001", full_name: "Mine", email: "m@x.com", stage: "initial_review", consultant_id: CONS, country_status: "green", erased_at: null, archived_at: null, created_at: "2026-11-01" },
    { id: id2, reference: "MKH-C26-00002", full_name: "Theirs", email: "t@x.com", stage: "initial_review", consultant_id: CONS2, country_status: "green", erased_at: null, archived_at: null, created_at: "2026-11-01" }
  ] });
  const list = await call(app, "GET", "/api/hc/team/candidates", jwt("aal2", CONS));
  assert.deepEqual(list.body.data.map(c => c.full_name), ["Mine"]);
  assert.equal((await call(app, "GET", `/api/hc/team/candidates/${id2}`, jwt("aal2", CONS))).status, 403);
  assert.equal((await call(app, "PATCH", `/api/hc/team/candidates/${id1}`, jwt("aal2", CONS), { consultant_id: CONS2 })).status, 403);
  const moved = await call(app, "PATCH", `/api/hc/team/candidates/${id1}`, jwt("aal2", CONS), { stage: "documentation_review", note: "CV reviewed" });
  assert.equal(moved.status, 200); assert.equal(moved.body.data.stage, "documentation_review");
});
test("stage changes into matching are blocked for red-list candidates and history is recorded", async () => {
  const id = randomUUID();
  const { app, tables } = server({ hc_candidates: [{ id, reference: "MKH-C26-00009", full_name: "Red", email: "r@x.com", stage: "professional_verification", consultant_id: CONS, country_status: "red", country_residence: "NG", erased_at: null, created_at: "2026-11-01" }] });
  const r = await call(app, "PATCH", `/api/hc/team/candidates/${id}`, jwt("aal2", ADMIN), { stage: "suitable_for_matching" });
  assert.equal(r.status, 409); assert.equal(r.body.code, "stage_blocked");
  const ok = await call(app, "PATCH", `/api/hc/team/candidates/${id}`, jwt("aal2", ADMIN), { stage: "unsuccessful", note: "Signposted to NHS Jobs" });
  assert.equal(ok.status, 200);
  assert.equal(tables.hc_stage_history.at(-1).to_stage, "unsuccessful");
  assert.equal(tables.hc_stage_history.at(-1).changed_by, ADMIN);
});
test("vacancies cannot be published without an authorised, due-diligenced employer", async () => {
  const { app, tables } = server();
  const emp = await call(app, "POST", "/api/hc/team/employers", jwt("aal2", ADMIN), { organisation_name: "Northside Care", organisation_type: "care_home" });
  assert.equal(emp.status, 201);
  const v = await call(app, "POST", "/api/hc/team/vacancies", jwt("aal2", ADMIN), { title: "Registered Nurse", employer_id: emp.body.data.id, employer_display: "Northside Care", profession: "registered_nurse", location: "Leeds", salary_min: 31000, salary_max: 36000, contract_type: "permanent", working_hours: "37.5 hours", qualifications: "NMC registration", registration_requirements: "NMC PIN required", description: "A genuine role in a nursing home in Leeds, England.", conditions: "Pension, 27 days leave", closes_on: "" });
  assert.equal(v.status, 201);
  const noAuth = await call(app, "PATCH", `/api/hc/team/vacancies/${v.body.data.id}`, jwt("aal2", ADMIN), { status: "published" });
  assert.equal(noAuth.status, 400);
  const noDD = await call(app, "PATCH", `/api/hc/team/vacancies/${v.body.data.id}`, jwt("aal2", ADMIN), { status: "published", authorised: true });
  assert.equal(noDD.status, 409);
  tables.hc_employers[0].due_diligence_status = "completed";
  const pub = await call(app, "PATCH", `/api/hc/team/vacancies/${v.body.data.id}`, jwt("aal2", ADMIN), { status: "published", authorised: true });
  assert.equal(pub.status, 200); assert.equal(pub.body.data.authorised_by, ADMIN);
  const list = await call(app, "GET", "/api/hc/public/vacancies");
  assert.equal(list.body.data.length, 1);
  assert.equal(list.body.data[0].authorised_by, undefined, "internal fields are not public");
});
test("erasure deletes files and anonymises the candidate, keeping the reference", async () => {
  const id = randomUUID();
  const { app, tables, storage } = server({ hc_candidates: [{ id, reference: "MKH-C26-00011", full_name: "Erase Me", email: "e@x.com", phone: "+44 7000 000000", stage: "unsuccessful", country_status: "green", erased_at: null, created_at: "2026-01-01" }], hc_documents: [{ id: randomUUID(), candidate_id: id, object_path: `${id}/cv/a.pdf`, status: "uploaded" }] });
  storage.add(`${id}/cv/a.pdf`);
  assert.equal((await call(app, "POST", `/api/hc/team/candidates/${id}/erase`, jwt("aal2", ADMIN), { confirm: "wrong" })).status, 400);
  assert.equal((await call(app, "POST", `/api/hc/team/candidates/${id}/erase`, jwt("aal2", CONS), { confirm: "MKH-C26-00011" })).status, 403);
  const r = await call(app, "POST", `/api/hc/team/candidates/${id}/erase`, jwt("aal2", ADMIN), { confirm: "MKH-C26-00011" });
  assert.equal(r.status, 200); assert.equal(r.body.files_deleted, 1);
  assert.equal(storage.size, 0);
  assert.equal(tables.hc_candidates[0].full_name, "Erased candidate");
  assert.equal(tables.hc_candidates[0].phone, null);
  assert.equal(tables.hc_documents.length, 0);
  assert.ok(tables.hc_audit_log.some(a => a.action === "candidate.erased"));
});
test("country rule changes re-evaluate resident candidates", async () => {
  const id = randomUUID();
  const { app, tables } = server({ hc_candidates: [{ id, reference: "R", full_name: "X", email: "x@x.com", country_residence: "MA", country_status: "green", erased_at: null }] });
  const r = await call(app, "PUT", "/api/hc/team/compliance/countries/MA", jwt("aal2", ADMIN), { country_name: "Morocco", status: "amber", agreement_note: "Hypothetical test" });
  assert.equal(r.status, 200);
  assert.equal(tables.hc_candidates[0].country_status, "amber");
});
