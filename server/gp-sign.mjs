// gp-sign-v24 · Documentos para firmar del estudiante (Global Passport).
// El admin o el counsellor asignado envía un PDF → el estudiante lo lee y lo firma a mano en la pantalla →
// el PDF firmado (firma en cada página + certificado) vuelve al admin y al counsellor.
// Tabla: gp_sign_requests (supabase/migrations/20261116110000_gp_sign_requests.sql). Archivos: bucket privado passport-docs.
import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { stampSignature, cleanStrokes } from "./team-hr.mjs";

export const SIGN_FIELDS = "id,student_id,title,note,original_name,bytes,status,created_at,sent_by,viewed_at,signed_at,signer_name,staff_seen_at,signed_path";
const MB = 1024 * 1024;
// Lo que ve cada lado (sin rutas internas de Storage).
export const signShape = (r, names = new Map()) => ({ id: r.id, title: r.title, note: r.note || "", original_name: r.original_name, bytes: r.bytes, status: r.status, created_at: r.created_at, viewed_at: r.viewed_at, signed_at: r.signed_at, signer_name: r.signer_name, has_signed: !!r.signed_path, sent_by_name: names.get(r.sent_by) || "", staff_seen: !!r.staff_seen_at });
export const signOpen = r => ["sent", "viewed"].includes(r.status);
export const startSchema = z.object({ title: z.string().trim().min(2).max(200), note: z.string().trim().max(1000).default(""), name: z.string().trim().min(1).max(200), mime: z.literal("application/pdf"), bytes: z.number().int().min(1).max(10 * MB) }).strict();
export const signSchema = z.object({ full_name: z.string().trim().min(3).max(200), strokes: z.array(z.any()).min(1).max(80), agree: z.literal(true) }).strict();

const missing = e => e && (e.code === "42P01" || e.code === "PGRST205");

export function mountGpSign(app, { wrap, limiter, requireStaff, requireStudent, caseFor, post, db, ok, PassportError, BUCKET, ip }) {
  const uuid = z.string().uuid();
  const need = r => { if (missing(r.error)) throw new PassportError("Documents to sign are not installed yet. Run the migration 20261116110000_gp_sign_requests.sql in Supabase.", 503); return ok(r); };
  async function staffNames(client, rows) {
    const ids = [...new Set(rows.map(r => r.sent_by).filter(Boolean))]; if (!ids.length) return new Map();
    const r = await client.from("crm_staff").select("user_id,full_name").in("user_id", ids);
    return new Map((r.data || []).map(x => [x.user_id, x.full_name]));
  }
  async function rowFor(client, id) {
    const r = need(await client.from("gp_sign_requests").select("*").eq("id", uuid.parse(id)).maybeSingle());
    if (!r || r.status === "uploading") throw new PassportError("Document not found.", 404);
    return r;
  }

  // ---------- Equipo (admin o counsellor asignado) ----------
  app.get("/api/gp/students/:id/sign-docs", requireStaff, wrap(async (req, res) => {
    const { client, student } = await caseFor(req, req.params.id);
    const r = await client.from("gp_sign_requests").select(SIGN_FIELDS).eq("student_id", student.user_id).neq("status", "uploading").order("created_at", { ascending: false }).limit(100);
    if (missing(r.error)) return res.json({ data: [], installed: false });
    const rows = ok(r), names = await staffNames(client, rows);
    // Abrir la lista marca como vistas las firmas nuevas.
    const fresh = rows.filter(x => x.status === "signed" && !x.staff_seen_at).map(x => x.id);
    if (fresh.length) await client.from("gp_sign_requests").update({ staff_seen_at: new Date().toISOString() }).in("id", fresh);
    res.json({ data: rows.map(x => signShape(x, names)), installed: true });
  }));
  app.post("/api/gp/students/:id/sign-docs/start", limiter(30), requireStaff, wrap(async (req, res) => {
    const { client, student } = await caseFor(req, req.params.id);
    const v = startSchema.parse(req.body), id = randomUUID(), path = `${student.user_id}/sign/${id}.pdf`;
    need(await client.from("gp_sign_requests").insert({ id, student_id: student.user_id, title: v.title, note: v.note, original_name: v.name, bytes: v.bytes, object_path: path, status: "uploading", sent_by: req.staff.user_id }));
    const signed = ok(await client.storage.from(BUCKET).createSignedUploadUrl(path), "Upload is not available.");
    res.json({ data: { id, path, token: signed.token, signed_url: signed.signedUrl, bucket: BUCKET } });
  }));
  app.post("/api/gp/sign-docs/:id/finish", requireStaff, wrap(async (req, res) => {
    const client = db(), row = need(await client.from("gp_sign_requests").select("*").eq("id", uuid.parse(req.params.id)).maybeSingle());
    if (!row || row.status !== "uploading") throw new PassportError("Document not found.", 404);
    await caseFor(req, row.student_id);
    const file = await client.storage.from(BUCKET).download(row.object_path);
    const bytes = file.data ? Buffer.from(await file.data.arrayBuffer()) : null;
    if (!bytes || bytes.subarray(0, 5).toString("latin1") !== "%PDF-") { await client.storage.from(BUCKET).remove([row.object_path]); await client.from("gp_sign_requests").delete().eq("id", row.id); throw new PassportError("Upload a valid PDF.", 400); }
    try { const { PDFDocument } = await import("pdf-lib"); await PDFDocument.load(bytes, { updateMetadata: false }); }
    catch { await client.storage.from(BUCKET).remove([row.object_path]); await client.from("gp_sign_requests").delete().eq("id", row.id); throw new PassportError("This PDF is protected or damaged. Export it again as a normal PDF.", 400); }
    ok(await client.from("gp_sign_requests").update({ status: "sent", sha256: createHash("sha256").update(bytes).digest("hex"), bytes: bytes.length, updated_at: new Date().toISOString() }).eq("id", row.id));
    await post(client, row.student_id, "system", req.staff.user_id, `New document to sign: ${row.title}. Open Documents to read and sign it.`, "update");
    res.json({ ok: true });
  }));
  app.get("/api/gp/sign-docs/:id/file", requireStaff, wrap(async (req, res) => {
    const client = db(), row = await rowFor(client, req.params.id); await caseFor(req, row.student_id);
    const signed = req.query.variant === "signed" && row.signed_path;
    const path = signed ? row.signed_path : row.object_path, name = signed ? `${row.title} (signed).pdf` : row.original_name;
    const view = ok(await client.storage.from(BUCKET).createSignedUrl(path, 300)), dl = ok(await client.storage.from(BUCKET).createSignedUrl(path, 300, { download: name }));
    res.json({ url: view.signedUrl, download_url: dl.signedUrl, mime: "application/pdf" });
  }));
  app.delete("/api/gp/sign-docs/:id", requireStaff, wrap(async (req, res) => {
    const client = db(), row = await rowFor(client, req.params.id); await caseFor(req, row.student_id);
    if (row.status === "signed") throw new PassportError("A signed document cannot be withdrawn.", 409);
    ok(await client.from("gp_sign_requests").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", row.id));
    await client.storage.from(BUCKET).remove([row.object_path]);
    res.json({ ok: true });
  }));

  // ---------- Estudiante ----------
  app.get("/api/passport/sign-docs/:id/file", requireStudent(async (req, res) => {
    const { client, student } = req.gp; if (!student) throw new PassportError("Create your Global Passport first.", 404);
    const row = await rowFor(client, req.params.id);
    if (row.student_id !== student.user_id || row.status === "cancelled") throw new PassportError("Document not found.", 404);
    const signed = req.query.variant === "signed" && row.signed_path;
    const path = signed ? row.signed_path : row.object_path, name = signed ? `${row.title} (signed).pdf` : row.original_name;
    const view = ok(await client.storage.from(BUCKET).createSignedUrl(path, 300)), dl = ok(await client.storage.from(BUCKET).createSignedUrl(path, 300, { download: name }));
    if (row.status === "sent") await client.from("gp_sign_requests").update({ status: "viewed", viewed_at: new Date().toISOString() }).eq("id", row.id).eq("status", "sent");
    res.json({ url: view.signedUrl, download_url: dl.signedUrl, mime: "application/pdf" });
  }));
  app.post("/api/passport/sign-docs/:id/sign", limiter(10), requireStudent(async (req, res) => {
    const { client, student, user: u } = req.gp; if (!student) throw new PassportError("Create your Global Passport first.", 404);
    const v = signSchema.parse(req.body), strokes = cleanStrokes(v.strokes);
    if (!strokes) throw new PassportError("Please draw your signature in the box.", 400);
    const row = await rowFor(client, req.params.id);
    if (row.student_id !== student.user_id) throw new PassportError("Document not found.", 404);
    if (row.status === "signed") throw new PassportError("This document is already signed.", 409);
    if (!signOpen(row)) throw new PassportError("This document can no longer be signed.", 400);
    const file = await client.storage.from(BUCKET).download(row.object_path);
    const original = file.data ? Buffer.from(await file.data.arrayBuffer()) : null;
    const hash = original ? createHash("sha256").update(original).digest("hex") : "";
    if (!original || (row.sha256 && row.sha256 !== hash)) throw new PassportError("The document changed. Ask your counsellor to send it again.", 409);
    const signedAt = new Date();
    let signed;
    try { signed = await stampSignature(original, { title: row.title, originalName: row.original_name, documentId: row.id, signerName: v.full_name, signerEmail: u.email, employeeCode: student.reference, codeLabel: "Student file", signedAt, method: "drawn", strokes, ip: ip(req).slice(0, 64), originalHash: hash }); }
    catch { throw new PassportError("This PDF could not be signed. Ask your counsellor to send an unprotected PDF.", 400); }
    const path = `${student.user_id}/sign/${row.id}-signed.pdf`;
    const up = await client.storage.from(BUCKET).upload(path, signed, { contentType: "application/pdf", upsert: false });
    if (up.error) throw new PassportError("The signed file could not be saved. Try again.", 503);
    const done = ok(await client.from("gp_sign_requests").update({ status: "signed", signed_path: path, signed_sha256: createHash("sha256").update(signed).digest("hex"), signed_at: signedAt.toISOString(), signer_name: v.full_name, signer_ip: ip(req).slice(0, 64), signer_user_agent: String(req.get("user-agent") || "").slice(0, 300), staff_seen_at: null, updated_at: signedAt.toISOString() }).eq("id", row.id).in("status", ["sent", "viewed"]).select("id"));
    if (!done.length) { await client.storage.from(BUCKET).remove([path]); throw new PassportError("This document is already signed.", 409); }
    await post(client, student.user_id, "student", u.id, `Signed: ${row.title}`, "update");
    res.json({ ok: true });
  }));
}

// Para el bundle del Global Passport (estudiante y equipo).
export async function signDocsFor(client, studentId) {
  const r = await client.from("gp_sign_requests").select(SIGN_FIELDS).eq("student_id", studentId).not("status", "in", "(uploading,cancelled)").order("created_at", { ascending: false }).limit(100);
  return r.error ? [] : r.data.map(x => signShape(x));
}
