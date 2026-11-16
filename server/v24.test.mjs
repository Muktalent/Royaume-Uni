// v24 · Lead ↔ Global Passport, foto en la lista, documentos para firmar del estudiante.
import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { mountGlobalPassport } from "./global-passport.mjs";
import { candidateFromStudent, likeExact, syncStudentFromCandidate } from "./student-link.mjs";

const STUDENT = "a1111111-1111-4111-8111-111111111111", COUNSELLOR = "c1111111-1111-4111-8111-111111111111", OTHER_C = "c2222222-2222-4222-8222-222222222222", ADMIN = "d1111111-1111-4111-8111-111111111111";

function fakeDb(tables, users, files) {
  const builder = name => {
    let filters = [], op = "select", payload = null, single = false;
    const rows = () => tables[name] || (tables[name] = []);
    const run = () => {
      let list = rows().filter(r => filters.every(f => f(r)));
      if (op === "insert") { const items = (Array.isArray(payload) ? payload : [payload]).map(x => ({ reference: "GP-00100" + rows().length, id: x.id || "id-" + Math.random().toString(36).slice(2), created_at: new Date().toISOString(), ...x })); rows().push(...items); list = items; }
      if (op === "update") list.forEach(r => Object.assign(r, payload));
      if (op === "delete") tables[name] = rows().filter(r => !list.includes(r));
      if (op === "select") list = list.map(r => ({ ...r }));
      return { data: single ? (list[0] ?? null) : list, error: null };
    };
    const q = {
      select() { return q; }, insert(v) { op = "insert"; payload = v; return q; }, update(v) { op = "update"; payload = v; return q; }, delete() { op = "delete"; return q; }, upsert(v) { op = "insert"; payload = v; return q; },
      eq(k, v) { filters.push(r => r[k] === v); return q; }, neq(k, v) { filters.push(r => r[k] !== v); return q; }, is(k, v) { filters.push(r => (r[k] ?? null) === v); return q; },
      in(k, v) { filters.push(r => v.includes(r[k])); return q; }, gte(k, v) { filters.push(r => r[k] >= v); return q; }, gt() { return q; },
      ilike(k, v) { const t = String(v).replace(/\\(.)/g, "$1").toLowerCase(); filters.push(r => String(r[k] ?? "").toLowerCase() === t); return q; },
      not(k, o, v) { const list = String(v).replace(/[()]/g, "").split(","); filters.push(r => !list.includes(r[k])); return q; },
      order() { return q; }, limit() { return q; },
      maybeSingle() { single = true; return Promise.resolve(run()); }, single() { single = true; return Promise.resolve(run()); },
      then(res, rej) { return Promise.resolve(run()).then(res, rej); }
    };
    return q;
  };
  return () => ({
    from: builder,
    auth: { getUser: async token => (users[token] ? { data: { user: users[token] }, error: null } : { data: null, error: { message: "bad" } }) },
    rpc: async (fn, args) => { const s = tables.gp_students.find(x => x.user_id === args.p_student); s.counsellor_id ||= COUNSELLOR; return { data: s.counsellor_id, error: null }; },
    storage: { from: () => ({
      createSignedUrl: async p => ({ data: { signedUrl: "https://files/" + p }, error: null }),
      createSignedUrls: async ps => ({ data: ps.map(p => ({ path: p, signedUrl: "https://files/" + p })), error: null }),
      createSignedUploadUrl: async p => ({ data: { signedUrl: "https://upload/" + p, token: "t" }, error: null }),
      download: async p => files[p] ? { data: { arrayBuffer: async () => files[p] }, error: null } : { data: null, error: { message: "missing" } },
      upload: async (p, bytes) => { files[p] = bytes; return { data: { path: p }, error: null }; },
      remove: async ps => { for (const p of ps) delete files[p]; return { data: [], error: null }; }
    }) }
  });
}
function server(tables) {
  tables.crm_staff ??= [
    { user_id: COUNSELLOR, full_name: "Laura Martínez", role: "collaborator", active: true },
    { user_id: OTHER_C, full_name: "Omar Haddad", role: "collaborator", active: true },
    { user_id: ADMIN, full_name: "Admin", role: "admin", active: true }];
  const users = { s: { id: STUDENT, email: "Amina@Example.com", email_confirmed_at: "2026-10-01" }, c: { id: COUNSELLOR }, o: { id: OTHER_C }, a: { id: ADMIN } };
  const files = {};
  const app = express(); app.use(express.json());
  const requireStaff = (req, res, next) => { const t = (req.get("authorization") || "").split(" ")[1]; const s = tables.crm_staff.find(x => users[t]?.id === x.user_id); if (!s) return res.status(403).json({ error: "staff only" }); req.staff = s; next(); };
  mountGlobalPassport(app, { requireStaff, db: fakeDb(tables, users, files) });
  return { app, tables, files };
}
async function call(app, method, url, token, body) {
  const srv = app.listen(0); const port = srv.address().port;
  try { const r = await fetch(`http://127.0.0.1:${port}${url}`, { method, headers: { ...(token ? { Authorization: "Bearer " + token } : {}), ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined }); return { status: r.status, body: await r.json().catch(() => ({})) }; }
  finally { srv.close(); }
}
const reg = { full_name: "Amina El Idrissi", phone: "+212 600 000 000", country_residence: "MA", nationality: "MA", destination: "UK", study_level: "Undergraduate", subject: "Computer Science", intake: "September 2027", consent: true };
async function pdf(pages = 2) { const { PDFDocument } = await import("pdf-lib"); const d = await PDFDocument.create(); for (let i = 0; i < pages; i++) d.addPage([595, 842]); return Buffer.from(await d.save()); }
const strokes = [[[10, 10], [40, 30], [80, 60], [120, 90], [160, 120], [200, 140], [240, 150], [280, 160], [320, 170]]];

test("a lead's responsable becomes the counsellor of the new Global Passport", async () => {
  const { app, tables } = server({ crm_candidates: [{ id: "lead1", email: "amina@example.com", assigned_to: OTHER_C, archived_at: null }] });
  const r = await call(app, "POST", "/api/passport/register", "s", reg);
  assert.equal(r.status, 201);
  assert.equal(tables.gp_students[0].counsellor_id, OTHER_C);
  assert.equal(tables.crm_candidates.length, 1, "no duplicate lead");
  // Visible en el flujo del counsellor (Control Centre) y no en el de otro counsellor
  assert.equal((await call(app, "GET", "/api/gp/students", "o")).body.data.length, 1);
  assert.equal((await call(app, "GET", "/api/gp/students", "c")).body.data.length, 0);
  assert.equal((await call(app, "GET", "/api/gp/students?scope=all", "a")).body.data.length, 1);
});
test("a Global Passport without a lead creates one in Leads y casos with the same counsellor", async () => {
  const { app, tables } = server({});
  assert.equal((await call(app, "POST", "/api/passport/register", "s", reg)).status, 201);
  const lead = tables.crm_candidates[0];
  assert.equal(lead.email, "amina@example.com"); assert.equal(lead.assigned_to, COUNSELLOR); assert.equal(lead.source, "global_passport");
  assert.equal(lead.first_name, "Amina"); assert.equal(lead.last_name, "El Idrissi"); assert.equal(lead.phone_e164, "+212600000000");
});
test("reassigning in Global Passport updates the lead; assigning the lead updates Global Passport", async () => {
  const { app, tables } = server({});
  await call(app, "POST", "/api/passport/register", "s", reg);
  assert.equal((await call(app, "PATCH", "/api/gp/students/" + STUDENT, "a", { counsellor_id: OTHER_C })).status, 200);
  assert.equal(tables.crm_candidates[0].assigned_to, OTHER_C);
  const client = fakeDb(tables, {}, {})();
  const out = await syncStudentFromCandidate(client, { email: "AMINA@example.com", assigned_to: COUNSELLOR }, { by: ADMIN });
  assert.equal(out.updated, 1); assert.equal(tables.gp_students[0].counsellor_id, COUNSELLOR);
  assert.ok(tables.gp_messages.some(m => /now managed by Laura/.test(m.body)));
});
test("lead helpers: exact e-mail match and safe lead values", () => {
  assert.equal(likeExact(" A_b%c@x.com "), "a\\_b\\%c@x.com");
  const c = candidateFromStudent({ full_name: "Sara", email: "S@X.com", phone: "0600", country_residence: "MA", study_level: "Postgraduate taught (Master's)" }, null);
  assert.equal(c.last_name, "-"); assert.equal(c.phone_e164, null); assert.equal(c.target_study_level, "postgraduate"); assert.equal(c.email, "s@x.com");
});
test("admin list returns the student photo", async () => {
  const { app, tables } = server({});
  await call(app, "POST", "/api/passport/register", "s", reg);
  tables.gp_students[0].photo_path = STUDENT + "/photo/me.jpg";
  const row = (await call(app, "GET", "/api/gp/students?scope=all", "a")).body.data[0];
  assert.equal(row.photo_url, "https://files/" + STUDENT + "/photo/me.jpg"); assert.equal(row.photo_path, undefined);
  const file = (await call(app, "GET", "/api/gp/students/" + STUDENT, "a")).body.data;
  assert.ok(file.photo_url);
});
test("documents to sign: counsellor sends, student signs by hand, signed copy returns", async () => {
  const { app, tables, files } = server({});
  await call(app, "POST", "/api/passport/register", "s", reg);
  // Otro counsellor no puede enviar a este estudiante
  assert.equal((await call(app, "POST", `/api/gp/students/${STUDENT}/sign-docs/start`, "o", { title: "Service agreement", name: "a.pdf", mime: "application/pdf", bytes: 1000 })).status, 403);
  const st = await call(app, "POST", `/api/gp/students/${STUDENT}/sign-docs/start`, "c", { title: "Service agreement", note: "Please sign", name: "agreement.pdf", mime: "application/pdf", bytes: 1000 });
  assert.equal(st.status, 200);
  files[st.body.data.path] = await pdf(2);
  assert.equal((await call(app, "POST", `/api/gp/sign-docs/${st.body.data.id}/finish`, "c")).status, 200);
  const me = (await call(app, "GET", "/api/passport/me", "s")).body.data;
  assert.equal(me.sign_docs.length, 1); assert.equal(me.sign_docs[0].status, "sent"); assert.equal(me.sign_docs[0].object_path, undefined);
  assert.ok(me.messages.some(m => /New document to sign/.test(m.body)));
  const f = await call(app, "GET", `/api/passport/sign-docs/${st.body.data.id}/file`, "s");
  assert.equal(f.status, 200); assert.equal(tables.gp_sign_requests[0].status, "viewed");
  assert.equal((await call(app, "POST", `/api/passport/sign-docs/${st.body.data.id}/sign`, "s", { full_name: "Amina El Idrissi", strokes: [[[1, 1]]], agree: true })).status, 400);
  const signed = await call(app, "POST", `/api/passport/sign-docs/${st.body.data.id}/sign`, "s", { full_name: "Amina El Idrissi", strokes, agree: true });
  assert.equal(signed.status, 200, JSON.stringify(signed.body));
  const row = tables.gp_sign_requests[0];
  assert.equal(row.status, "signed"); assert.ok(files[row.signed_path]);
  const { PDFDocument } = await import("pdf-lib"); assert.equal((await PDFDocument.load(files[row.signed_path])).getPageCount(), 3, "2 pages + certificate");
  assert.equal((await call(app, "POST", `/api/passport/sign-docs/${st.body.data.id}/sign`, "s", { full_name: "Amina El Idrissi", strokes, agree: true })).status, 409);
  // El counsellor ve la firma nueva en su lista y en el expediente; abrir la lista la marca como vista
  const list = (await call(app, "GET", "/api/gp/students", "c")).body.data[0];
  assert.equal(list.signed_new, 1);
  const docs = (await call(app, "GET", `/api/gp/students/${STUDENT}/sign-docs`, "c")).body.data;
  assert.equal(docs[0].has_signed, true); assert.equal(docs[0].signer_name, "Amina El Idrissi");
  assert.equal((await call(app, "GET", "/api/gp/students", "c")).body.data[0].signed_new, 0);
  const copy = await call(app, "GET", `/api/gp/sign-docs/${st.body.data.id}/file?variant=signed`, "a");
  assert.match(copy.body.url, /-signed\.pdf$/);
  assert.equal((await call(app, "DELETE", `/api/gp/sign-docs/${st.body.data.id}`, "c")).status, 409, "signed documents cannot be withdrawn");
});
test("documents to sign: a non-PDF upload is rejected and withdrawn requests disappear for the student", async () => {
  const { app, tables, files } = server({});
  await call(app, "POST", "/api/passport/register", "s", reg);
  const st = await call(app, "POST", `/api/gp/students/${STUDENT}/sign-docs/start`, "a", { title: "Form", name: "f.pdf", mime: "application/pdf", bytes: 10 });
  files[st.body.data.path] = Buffer.from("not a pdf");
  assert.equal((await call(app, "POST", `/api/gp/sign-docs/${st.body.data.id}/finish`, "a")).status, 400);
  assert.equal(tables.gp_sign_requests.length, 0);
  const st2 = await call(app, "POST", `/api/gp/students/${STUDENT}/sign-docs/start`, "a", { title: "Form", name: "f.pdf", mime: "application/pdf", bytes: 10 });
  files[st2.body.data.path] = await pdf(1);
  await call(app, "POST", `/api/gp/sign-docs/${st2.body.data.id}/finish`, "a");
  assert.equal((await call(app, "DELETE", `/api/gp/sign-docs/${st2.body.data.id}`, "a")).status, 200);
  assert.equal((await call(app, "GET", "/api/passport/me", "s")).body.data.sign_docs.length, 0);
  assert.equal((await call(app, "POST", `/api/passport/sign-docs/${st2.body.data.id}/sign`, "s", { full_name: "Amina El Idrissi", strokes, agree: true })).status, 400);
});
