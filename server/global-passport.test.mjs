import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { mountGlobalPassport, readiness, seedStages, seedDocuments, seedTasks, caseload, registrationSchema, counsellorUpdateSchema, safeFileName, validCountry, STAGES } from "./global-passport.mjs";

// Minimal in-memory Supabase double: enough for the routes under test.
function fakeDb(tables, users) {
  const builder = (name) => {
    let rows = () => tables[name] || (tables[name] = []), filters = [], op = "select", payload = null, single = false;
    const run = () => {
      let list = rows().filter(r => filters.every(f => f(r)));
      if (op === "insert") { const items = (Array.isArray(payload) ? payload : [payload]).map(x => ({ reference: "GP-001001", ...x })); rows().push(...items); list = items; }
      if (op === "update") list.forEach(r => Object.assign(r, payload));
      if (op === "delete") tables[name] = rows().filter(r => !list.includes(r));
      const data = single ? (list[0] ?? null) : list;
      return { data, error: null };
    };
    const q = {
      select() { return q; }, insert(v) { op = "insert"; payload = v; return q; }, update(v) { op = "update"; payload = v; return q; }, delete() { op = "delete"; return q; }, upsert(v) { op = "insert"; payload = v; return q; },
      eq(k, v) { filters.push(r => r[k] === v); return q; }, neq(k, v) { filters.push(r => r[k] !== v); return q; }, is(k, v) { filters.push(r => (r[k] ?? null) === v); return q; },
      in(k, v) { filters.push(r => v.includes(r[k])); return q; }, gte(k, v) { filters.push(r => r[k] >= v); return q; }, order() { return q; }, limit() { return q; },
      maybeSingle() { single = true; return Promise.resolve(run()); }, single() { single = true; return Promise.resolve(run()); },
      then(res, rej) { return Promise.resolve(run()).then(res, rej); }
    };
    return q;
  };
  return () => ({
    from: builder,
    auth: { getUser: async token => (users[token] ? { data: { user: users[token] }, error: null } : { data: null, error: { message: "bad" } }) },
    rpc: async (fn, args) => { const s = tables.gp_students.find(x => x.user_id === args.p_student); s.counsellor_id = "c1111111-1111-4111-8111-111111111111"; return { data: s.counsellor_id, error: null }; },
    storage: { from: () => ({ createSignedUrl: async () => ({ data: { signedUrl: "https://x" }, error: null }) }) }
  });
}
const STUDENT = "a1111111-1111-4111-8111-111111111111", OTHER = "b1111111-1111-4111-8111-111111111111", COUNSELLOR = "c1111111-1111-4111-8111-111111111111";
function server(tables = {}) {
  tables.crm_staff ??= [{ user_id: COUNSELLOR, full_name: "Laura Martínez", role: "collaborator", active: true }];
  const users = { s: { id: STUDENT, email: "student@example.com", email_confirmed_at: "2026-10-01" }, u: { id: OTHER, email: "new@example.com", email_confirmed_at: null }, c: { id: COUNSELLOR, email: "laura@muktalent.com", email_confirmed_at: "x" } };
  const app = express(); app.use(express.json());
  const requireStaff = (req, res, next) => { const t = (req.get("authorization") || "").split(" ")[1]; const s = tables.crm_staff.find(x => users[t]?.id === x.user_id); if (!s) return res.status(403).json({ error: "staff only" }); req.staff = s; next(); };
  mountGlobalPassport(app, { requireStaff, db: fakeDb(tables, users) });
  return { app, tables };
}
async function call(app, method, url, token, body) {
  const srv = app.listen(0); const port = srv.address().port;
  try { const r = await fetch(`http://127.0.0.1:${port}${url}`, { method, headers: { ...(token ? { Authorization: "Bearer " + token } : {}), ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined }); return { status: r.status, body: await r.json() }; }
  finally { srv.close(); }
}
const valid = { full_name: "Amina El Idrissi", phone: "+212 600 000 000", country_residence: "ma", nationality: "MA", destination: "UK", study_level: "Undergraduate", subject: "Computer Science", intake: "September 2027", consent: true };

test("readiness weighs profile, documents and journey", () => {
  assert.equal(readiness({ student: {}, documents: [], stages: [] }), 0);
  const stages = seedStages(STUDENT); assert.equal(stages.length, 8); assert.equal(stages[0].status, "done"); assert.equal(stages[1].status, "in_progress");
  const docs = seedDocuments(STUDENT).map(d => ({ ...d, status: "approved" }));
  const full = { phone: 1, country_residence: 1, nationality: 1, date_of_birth: 1, study_level: 1, subject: 1, intake: 1, english_test: 1, university: 1, programme: 1 };
  assert.equal(readiness({ student: full, documents: docs, stages: STAGES.map(([k]) => ({ stage_key: k, status: "done" })) }), 100);
  const mid = readiness({ student: full, documents: docs.map((d, i) => ({ ...d, status: i % 2 ? "uploaded" : "approved" })), stages });
  assert.ok(mid > 50 && mid < 100);
});
test("seed tasks start with registration done and dated next steps", () => {
  const t = seedTasks(STUDENT, new Date("2026-10-31T10:00:00Z"));
  assert.equal(t[0].status, "done"); assert.equal(t[1].due_date, "2026-11-14");
});
test("caseload metrics flag urgent and overdue students", () => {
  const rows = [
    { user_id: "1", application_status: "preparing", docs_to_review: 2, overdue_tasks: 0, readiness: 80 },
    { user_id: "2", application_status: "awaiting", docs_to_review: 1, overdue_tasks: 1, readiness: 90 },
    { user_id: "3", application_status: "profile", urgent: true, docs_to_review: 0, overdue_tasks: 0, readiness: 20 },
    { user_id: "4", application_status: "enrolled", docs_to_review: 0, overdue_tasks: 0, readiness: 100 }
  ];
  const m = caseload(rows, "2026-10-31");
  assert.deepEqual([m.assigned, m.preparing, m.documents_review, m.awaiting, m.attention], [3, 2, 3, 1, 2]);
});
test("registration validation: countries, consent, levels", () => {
  assert.equal(registrationSchema.parse(valid).country_residence, "MA");
  assert.equal(registrationSchema.parse(valid).phone, "+212600000000");
  assert.throws(() => registrationSchema.parse({ ...valid, consent: false }));
  assert.throws(() => registrationSchema.parse({ ...valid, nationality: "ZZ" }));
  assert.throws(() => registrationSchema.parse({ ...valid, study_level: "Kindergarten" }));
  assert.throws(() => registrationSchema.parse({ ...valid, role: "admin" }), "unknown keys are rejected");
  assert.ok(validCountry("GB") && validCountry("CA") && !validCountry("XX"));
  assert.throws(() => counsellorUpdateSchema.parse({ application_status: "hacked" }));
  assert.equal(safeFileName("../../etc/passwd é.pdf").includes("/"), false);
});
test("whoami distinguishes staff, student and new accounts", async () => {
  const { app } = server({ gp_students: [] });
  assert.equal((await call(app, "GET", "/api/whoami", "c")).body.kind, "staff");
  assert.equal((await call(app, "GET", "/api/whoami", "s")).body.kind, "new");
  assert.equal((await call(app, "GET", "/api/whoami")).status, 401);
});
test("register opens the UK file, seeds the journey and assigns a counsellor", async () => {
  const { app, tables } = server({ gp_students: [] });
  assert.equal((await call(app, "POST", "/api/passport/register", "u", valid)).status, 403, "unconfirmed email");
  assert.equal((await call(app, "POST", "/api/passport/register", "s", { ...valid, destination: "CA" })).status, 400, "Canada is coming soon");
  assert.equal((await call(app, "POST", "/api/passport/register", "c", valid)).status, 403, "staff cannot open a student file");
  const r = await call(app, "POST", "/api/passport/register", "s", valid);
  assert.equal(r.status, 201);
  assert.equal(tables.gp_students[0].counsellor_id, COUNSELLOR);
  assert.equal(tables.gp_stages.length, 8); assert.equal(tables.gp_documents.length, 8);
  assert.match(tables.gp_messages[0].body, /Laura Martínez is your counsellor/);
  assert.equal(r.body.data.counsellor.full_name, "Laura Martínez");
});
test("counsellors only open their own students; admins see all", async () => {
  const tables = { gp_students: [{ user_id: STUDENT, counsellor_id: "d1111111-1111-4111-8111-111111111111", full_name: "A", application_status: "profile" }], gp_stages: [], gp_tasks: [], gp_documents: [], gp_events: [], gp_messages: [], gp_notes: [] };
  const { app } = server(tables);
  assert.equal((await call(app, "GET", `/api/gp/students/${STUDENT}`, "c")).status, 403);
  assert.equal((await call(app, "GET", "/api/gp/students", "c")).body.data.length, 0);
  tables.crm_staff[0].role = "admin";
  assert.equal((await call(app, "GET", `/api/gp/students/${STUDENT}`, "c")).status, 200);
  assert.equal((await call(app, "GET", "/api/gp/students?scope=all", "c")).body.data.length, 1);
  assert.equal((await call(app, "GET", "/api/passport/me", "c")).status, 403, "staff cannot use the student API");
});
