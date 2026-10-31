// muk-social-v1 · MUK Talent chat (WhatsApp style), notification feed, Cloudinary video library
// and Global Passport photo. Service-role only: every route verifies the Supabase session and the
// caller's relationship to the thread before touching data (tables have RLS with no policies).
import { createClient } from "@supabase/supabase-js";
import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { validSignature } from "./workspace-extras.mjs";

export const AUDIO_BUCKET = "mk-chat-audio";
export const PHOTO_BUCKET = "passport-docs";
export const AUDIO_MIME = { "audio/webm": "webm", "audio/ogg": "ogg", "audio/mp4": "m4a", "audio/mpeg": "mp3", "audio/aac": "aac" };
const PHOTO_MIME = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const AUDIO_MAX = 5 * 1024 * 1024, PHOTO_MAX = 5 * 1024 * 1024;

export class SocialError extends Error { constructor(message, status = 400) { super(message); this.status = status; } }
const uuid = z.string().uuid();
const httpsUrl = z.string().trim().max(800).url().refine(v => /^https:\/\//i.test(v), "HTTPS only");

// ---------- Pure helpers (unit tested) ----------
export function shortName(full) {
  const p = String(full || "").trim().split(/\s+/).filter(Boolean);
  if (!p.length) return "Student";
  return p.length > 1 ? `${p[0]} ${p[p.length - 1][0].toUpperCase()}.` : p[0];
}
export function directKey(a, b) { return [a, b].sort().join(":"); }
export function parseThread(id) {
  const m = /^(gp|mk):([0-9a-f-]{36})$/i.exec(String(id || ""));
  if (!m || !uuid.safeParse(m[2]).success) throw new SocialError("Conversation not found.", 404);
  return { kind: m[1].toLowerCase(), id: m[2].toLowerCase() };
}
export function cloudinarySignature(params, secret) {
  const base = Object.keys(params).filter(k => params[k] !== undefined && params[k] !== "" && k !== "file" && k !== "api_key" && k !== "cloud_name" && k !== "resource_type").sort().map(k => `${k}=${params[k]}`).join("&");
  return createHash("sha1").update(base + secret).digest("hex");
}
export function videoKind(url) {
  let u; try { u = new URL(url); } catch { return "link"; }
  if (u.protocol !== "https:") return "link";
  if (u.hostname === "res.cloudinary.com" || /\.(mp4|webm|mov|m4v)$/i.test(u.pathname)) return "video";
  if (/(^|\.)youtube\.com$|(^|\.)youtu\.be$|(^|\.)vimeo\.com$/i.test(u.hostname)) return "embed";
  return "link";
}
export function cloudinaryPoster(url) {
  // https://res.cloudinary.com/<cloud>/video/upload/v123/folder/id.mp4 → .../video/upload/so_1/v123/folder/id.jpg
  try { const u = new URL(url); if (u.hostname !== "res.cloudinary.com" || !u.pathname.includes("/video/upload/")) return null;
    return `https://res.cloudinary.com${u.pathname.replace("/video/upload/", "/video/upload/so_1,w_960,c_limit/").replace(/\.[a-z0-9]+$/i, ".jpg")}`; } catch { return null; }
}
export const messageSchema = z.union([
  z.object({ body: z.string().trim().min(1).max(2000) }).strict(),
  z.object({ audio_path: z.string().max(300), audio_ms: z.number().int().min(300).max(5 * 60000), mime: z.enum(Object.keys(AUDIO_MIME)).optional() }).strict()
]);
export const postSchema = z.object({
  kind: z.enum(["news", "live", "video"]),
  title: z.string().trim().min(2).max(140),
  body: z.union([z.literal(""), z.null(), z.string().trim().max(2000)]).optional().transform(v => v || null),
  media_url: z.union([z.literal(""), z.null(), httpsUrl]).optional().transform(v => v || null),
  poster_url: z.union([z.literal(""), z.null(), httpsUrl]).optional().transform(v => v || null),
  asset_id: z.union([z.null(), uuid]).optional().transform(v => v || null),
  media_id: z.union([z.null(), uuid]).optional().transform(v => v || null),
  live_at: z.union([z.literal(""), z.null(), z.string().datetime({ offset: true })]).optional().transform(v => v || null),
  audience: z.enum(["all", "mine"]).default("all")
}).strict().superRefine((v, ctx) => {
  if (v.kind === "video" && !v.media_url && !v.asset_id && !v.media_id) ctx.addIssue({ code: "custom", path: ["media_url"], message: "Video required" });
  if (v.kind === "live" && !v.live_at) ctx.addIssue({ code: "custom", path: ["live_at"], message: "Date required" });
});
export const mediaSchema = z.object({ url: httpsUrl, title: z.string().trim().min(1).max(140), poster_url: z.union([z.literal(""), z.null(), httpsUrl]).optional().transform(v => v || null), bytes: z.number().int().min(0).max(2e9).optional(), duration: z.number().min(0).max(36000).optional() }).strict();

function service() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new SocialError("Messaging is not active yet. Ask your administrator to finish the setup.", 503);
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}
function ok(r, what = "Database operation failed") {
  if (r.error) { const missing = r.error.code === "42P01" || r.error.code === "PGRST205" || r.error.code === "42703"; throw new SocialError(missing ? "Messaging database is not installed yet. Run supabase/muk-social.sql." : what, 503); }
  return r.data;
}
function bearer(req) { const m = /^Bearer ([^\s]+)$/i.exec(req.get("authorization") || ""); return m && m[1].length < 16384 ? m[1] : null; }
function ip(req) { return (process.env.VERCEL ? String(req.headers["x-vercel-forwarded-for"] || req.headers["x-forwarded-for"] || "").split(",")[0].trim() : req.ip) || "127.0.0.1"; }

export function mountMukSocial(app, { db = service } = {}) {
  const limiter = (limit, minutes = 15) => rateLimit({ windowMs: minutes * 60000, limit, keyGenerator: req => ipKeyGenerator(ip(req)), validate: { xForwardedForHeader: false }, standardHeaders: "draft-7", legacyHeaders: false, message: { error: "Too many requests. Wait a few minutes and try again." } });
  const route = fn => async (req, res) => {
    try { req.me = await identify(req); await fn(req, res, req.me); } catch (e) {
      if (e instanceof z.ZodError) return res.status(400).json({ error: "Please check the highlighted fields.", fields: e.issues.map(i => i.path.join(".")), requestId: req.requestId });
      const status = e.status || 503; if (status >= 500) console.error(JSON.stringify({ requestId: req.requestId, scope: "muk-social", error: e.message }));
      res.status(status).json({ error: e instanceof SocialError ? e.message : "Messaging is temporarily unavailable. Try again.", requestId: req.requestId });
    }
  };
  async function identify(req) {
    const token = bearer(req); if (!token) throw new SocialError("Sign in to continue.", 401);
    const client = db(); const { data, error } = await client.auth.getUser(token);
    if (error || !data?.user) throw new SocialError("Session expired. Sign in again.", 401);
    const u = data.user;
    const staff = ok(await client.from("crm_staff").select("user_id,full_name,role,active").eq("user_id", u.id).maybeSingle());
    if (staff) { if (!staff.active) throw new SocialError("This account is inactive.", 403); return { client, id: u.id, kind: "staff", admin: staff.role === "admin", name: staff.full_name }; }
    const st = ok(await client.from("gp_students").select("user_id,full_name,counsellor_id,reference,chat_visible").eq("user_id", u.id).maybeSingle());
    if (!st) throw new SocialError("Create your Global Passport first.", 403);
    return { client, id: u.id, kind: "student", admin: false, name: st.full_name, counsellor_id: st.counsellor_id, chat_visible: st.chat_visible !== false };
  }
  // Names: staff full name; students full name for staff, "First L." for other students.
  async function people(client, ids, me) {
    const list = [...new Set(ids.filter(Boolean))]; const out = new Map(); if (!list.length) return out;
    const [s, g] = await Promise.all([
      client.from("crm_staff").select("user_id,full_name,role").in("user_id", list),
      client.from("gp_students").select("user_id,full_name,reference").in("user_id", list)
    ]);
    for (const r of ok(s)) out.set(r.user_id, { user_id: r.user_id, name: r.full_name, kind: "staff", role: r.role === "admin" ? "MUK Talent" : "Counsellor" });
    for (const r of ok(g)) out.set(r.user_id, { user_id: r.user_id, name: me.kind === "staff" || r.user_id === me.id ? r.full_name : shortName(r.full_name), kind: "student", role: me.kind === "staff" ? r.reference : "Student" });
    return out;
  }
  async function gpAccess(client, me, studentId) {
    if (me.kind === "student") { if (studentId !== me.id) throw new SocialError("Conversation not found.", 404); return { student_id: me.id, counsellor_id: me.counsellor_id }; }
    const st = ok(await client.from("gp_students").select("user_id,counsellor_id").eq("user_id", studentId).maybeSingle());
    if (!st) throw new SocialError("Conversation not found.", 404);
    if (!me.admin && st.counsellor_id !== me.id) throw new SocialError("This student is assigned to another counsellor.", 403);
    return { student_id: st.user_id, counsellor_id: st.counsellor_id };
  }
  async function mkAccess(client, me, convId) {
    const m = ok(await client.from("mk_members").select("conversation_id,last_read_at").eq("conversation_id", convId).eq("user_id", me.id).maybeSingle());
    if (!m) throw new SocialError("Conversation not found.", 404);
    return m;
  }
  async function audioUrl(client, path) { if (!path) return null; const r = await client.storage.from(AUDIO_BUCKET).createSignedUrl(path, 3600); return r.data?.signedUrl || null; }

  // ---------- Threads ----------
  app.get("/api/chat/threads", limiter(600), route(async (req, res, me) => {
    const { client } = me; const threads = [];
    // Counsellor threads (gp_messages)
    let students = [];
    if (me.kind === "student") students = [{ user_id: me.id, counsellor_id: me.counsellor_id }];
    else { let q = client.from("gp_students").select("user_id,counsellor_id,full_name,reference").order("updated_at", { ascending: false }).limit(300); if (!me.admin) q = q.eq("counsellor_id", me.id); students = ok(await q); }
    if (students.length) {
      const ids = students.map(s => s.user_id);
      const msgs = ok(await client.from("gp_messages").select("student_id,sender_role,body,audio_path,read_at,created_at").in("student_id", ids).order("created_at", { ascending: false }).limit(1500));
      const last = new Map(), unread = new Map();
      for (const m of msgs) {
        if (!last.has(m.student_id)) last.set(m.student_id, m);
        const theirs = me.kind === "student" ? m.sender_role !== "student" : m.sender_role === "student";
        if (theirs && !m.read_at) unread.set(m.student_id, (unread.get(m.student_id) || 0) + 1);
      }
      const names = await people(client, students.flatMap(s => [s.user_id, s.counsellor_id]), me);
      for (const s of students) {
        if (me.kind === "staff" && !last.has(s.user_id)) continue; // staff: only active conversations; new ones via contacts
        const peer = me.kind === "student" ? (names.get(s.counsellor_id) || { name: "MUK Talent", kind: "staff", role: "Counsellor" }) : (names.get(s.user_id) || { name: "Student", kind: "student" });
        const l = last.get(s.user_id);
        threads.push({ id: `gp:${s.user_id}`, kind: "counsellor", title: peer.name, subtitle: me.kind === "student" ? "Counsellor · MUK Talent" : peer.role, peer_id: me.kind === "student" ? s.counsellor_id : s.user_id, pinned: me.kind === "student", last: l ? { body: l.audio_path ? null : l.body, audio: Boolean(l.audio_path), mine: me.kind === "student" ? l.sender_role === "student" : l.sender_role === "counsellor", at: l.created_at } : null, unread: unread.get(s.user_id) || 0 });
      }
    }
    // Direct / group conversations
    const mine = ok(await client.from("mk_members").select("conversation_id,last_read_at").eq("user_id", me.id).limit(400));
    if (mine.length) {
      const ids = mine.map(m => m.conversation_id); const readAt = new Map(mine.map(m => [m.conversation_id, m.last_read_at]));
      const [convs, members, msgs] = await Promise.all([
        client.from("mk_conversations").select("id,title,kind,created_at").in("id", ids),
        client.from("mk_members").select("conversation_id,user_id").in("conversation_id", ids),
        client.from("mk_messages").select("conversation_id,sender_id,body,audio_path,created_at").in("conversation_id", ids).order("created_at", { ascending: false }).limit(2000)
      ]);
      const mem = ok(members), names = await people(client, mem.map(m => m.user_id), me);
      const last = new Map(), unread = new Map();
      for (const m of ok(msgs)) {
        if (!last.has(m.conversation_id)) last.set(m.conversation_id, m);
        const r = readAt.get(m.conversation_id);
        if (m.sender_id !== me.id && (!r || m.created_at > r)) unread.set(m.conversation_id, (unread.get(m.conversation_id) || 0) + 1);
      }
      for (const c of ok(convs)) {
        const others = mem.filter(m => m.conversation_id === c.id && m.user_id !== me.id).map(m => names.get(m.user_id)).filter(Boolean);
        const peer = others[0]; const l = last.get(c.id);
        threads.push({ id: `mk:${c.id}`, kind: c.kind, title: c.title || peer?.name || "MUK Talent", subtitle: peer ? (peer.kind === "staff" ? peer.role : "Student") : "", peer_id: peer?.user_id || null, last: l ? { body: l.audio_path ? null : l.body, audio: Boolean(l.audio_path), mine: l.sender_id === me.id, at: l.created_at } : null, unread: unread.get(c.id) || 0, created_at: c.created_at });
      }
    }
    threads.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || String(b.last?.at || b.created_at || "").localeCompare(String(a.last?.at || a.created_at || "")));
    res.json({ data: threads, me: { id: me.id, kind: me.kind, admin: me.admin, name: me.name } });
  }));

  app.get("/api/chat/threads/:id/messages", limiter(900), route(async (req, res, me) => {
    const { client } = me; const t = parseThread(req.params.id); let rows = [];
    if (t.kind === "gp") {
      const a = await gpAccess(client, me, t.id);
      const msgs = ok(await client.from("gp_messages").select("id,sender_role,sender_id,kind,body,audio_path,audio_ms,read_at,created_at").eq("student_id", a.student_id).order("created_at", { ascending: false }).limit(200)).reverse();
      const names = await people(client, msgs.map(m => m.sender_id).concat([a.counsellor_id, a.student_id]), me);
      rows = await Promise.all(msgs.map(async m => ({ id: m.id, mine: me.kind === "student" ? m.sender_role === "student" : (m.sender_role === "counsellor" && (m.sender_id === me.id || !m.sender_id)), system: m.sender_role === "system" || m.kind === "system", sender: m.sender_role === "system" ? "MUK Talent" : (names.get(m.sender_id)?.name || (m.sender_role === "student" ? names.get(a.student_id)?.name : names.get(a.counsellor_id)?.name) || "MUK Talent"), body: m.body, audio: m.audio_path ? { url: await audioUrl(client, m.audio_path), ms: m.audio_ms || 0 } : null, read: Boolean(m.read_at), at: m.created_at })));
    } else {
      await mkAccess(client, me, t.id);
      const [msgs, members] = await Promise.all([
        client.from("mk_messages").select("id,sender_id,body,audio_path,audio_ms,created_at").eq("conversation_id", t.id).order("created_at", { ascending: false }).limit(200),
        client.from("mk_members").select("user_id,last_read_at").eq("conversation_id", t.id)
      ]);
      const list = ok(msgs).reverse(), mem = ok(members); const names = await people(client, mem.map(m => m.user_id), me);
      const othersRead = mem.filter(m => m.user_id !== me.id).map(m => m.last_read_at).filter(Boolean).sort()[0] || null;
      rows = await Promise.all(list.map(async m => ({ id: m.id, mine: m.sender_id === me.id, system: false, sender: names.get(m.sender_id)?.name || "MUK Talent", body: m.body, audio: m.audio_path ? { url: await audioUrl(client, m.audio_path), ms: m.audio_ms || 0 } : null, read: Boolean(othersRead && othersRead >= m.created_at), at: m.created_at })));
    }
    res.json({ data: rows });
  }));

  app.post("/api/chat/threads/:id/messages", limiter(240), route(async (req, res, me) => {
    const { client } = me; const t = parseThread(req.params.id); const v = messageSchema.parse(req.body);
    let audio_path = null, audio_ms = null, body = v.body || "Voice message";
    if (v.audio_path) {
      if (!v.audio_path.startsWith(`${me.id}/`) || v.audio_path.includes("..")) throw new SocialError("Invalid audio.", 400);
      const folder = v.audio_path.slice(0, v.audio_path.lastIndexOf("/")), name = v.audio_path.slice(v.audio_path.lastIndexOf("/") + 1);
      const listed = ok(await client.storage.from(AUDIO_BUCKET).list(folder, { search: name, limit: 3 }), "Voice notes are not available yet.");
      if (!listed?.some(f => f.name === name)) throw new SocialError("We could not find the voice note. Try again.", 400);
      audio_path = v.audio_path; audio_ms = v.audio_ms;
    }
    if (t.kind === "gp") {
      const a = await gpAccess(client, me, t.id);
      ok(await client.from("gp_messages").insert({ student_id: a.student_id, sender_role: me.kind === "student" ? "student" : "counsellor", sender_id: me.id, kind: "message", body, audio_path, audio_ms }));
      await client.from("gp_students").update({ updated_at: new Date().toISOString() }).eq("user_id", a.student_id);
    } else {
      await mkAccess(client, me, t.id);
      ok(await client.from("mk_messages").insert({ conversation_id: t.id, sender_id: me.id, body: audio_path ? null : body, audio_path, audio_ms }));
      await client.from("mk_members").update({ last_read_at: new Date().toISOString() }).eq("conversation_id", t.id).eq("user_id", me.id);
    }
    res.status(201).json({ ok: true });
  }));

  app.post("/api/chat/threads/:id/read", limiter(900), route(async (req, res, me) => {
    const { client } = me; const t = parseThread(req.params.id); const now = new Date().toISOString();
    if (t.kind === "gp") {
      const a = await gpAccess(client, me, t.id);
      let q = client.from("gp_messages").update({ read_at: now }).eq("student_id", a.student_id).is("read_at", null);
      q = me.kind === "student" ? q.neq("sender_role", "student") : q.eq("sender_role", "student");
      ok(await q);
    } else { await mkAccess(client, me, t.id); ok(await client.from("mk_members").update({ last_read_at: now }).eq("conversation_id", t.id).eq("user_id", me.id)); }
    res.json({ ok: true });
  }));

  app.get("/api/chat/contacts", limiter(240), route(async (req, res, me) => {
    const { client } = me; const out = [];
    const staff = ok(await client.from("crm_staff").select("user_id,full_name,role,active").eq("active", true).limit(300));
    if (me.kind === "student") {
      const st = ok(await client.from("gp_students").select("user_id,full_name,country_residence").neq("user_id", me.id).neq("chat_visible", false).order("created_at", { ascending: false }).limit(400));
      if (me.counsellor_id) { const c = staff.find(s => s.user_id === me.counsellor_id); if (c) out.push({ user_id: c.user_id, name: c.full_name, kind: "staff", role: "Counsellor", thread_id: `gp:${me.id}` }); }
      for (const s of st) out.push({ user_id: s.user_id, name: shortName(s.full_name), kind: "student", role: s.country_residence || "Student" });
    } else {
      for (const s of staff) if (s.user_id !== me.id) out.push({ user_id: s.user_id, name: s.full_name, kind: "staff", role: s.role === "admin" ? "Admin · MUK Talent" : "Counsellor" });
      let q = client.from("gp_students").select("user_id,full_name,reference").order("updated_at", { ascending: false }).limit(400); if (!me.admin) q = q.eq("counsellor_id", me.id);
      for (const s of ok(await q)) out.push({ user_id: s.user_id, name: s.full_name, kind: "student", role: s.reference, thread_id: `gp:${s.user_id}` });
    }
    res.json({ data: out });
  }));

  app.post("/api/chat/direct", limiter(60), route(async (req, res, me) => {
    const { client } = me; const target = uuid.parse(req.body?.user_id); if (target === me.id) throw new SocialError("Choose another person.", 400);
    const tStaff = ok(await client.from("crm_staff").select("user_id,active").eq("user_id", target).maybeSingle());
    const tStudent = tStaff ? null : ok(await client.from("gp_students").select("user_id,chat_visible,counsellor_id").eq("user_id", target).maybeSingle());
    if (!tStaff && !tStudent) throw new SocialError("Person not found.", 404);
    if (tStaff && !tStaff.active) throw new SocialError("This account is inactive.", 403);
    if (me.kind === "student") {
      if (tStaff) { if (tStaff.user_id === me.counsellor_id) return res.json({ data: { id: `gp:${me.id}` } }); throw new SocialError("Write to your counsellor from your counsellor chat.", 403); }
      if (tStudent.chat_visible === false || !me.chat_visible) throw new SocialError("This student does not receive messages.", 403);
    } else if (tStudent) {
      if (!me.admin && tStudent.counsellor_id !== me.id) throw new SocialError("This student is assigned to another counsellor.", 403);
      return res.json({ data: { id: `gp:${target}` } });
    }
    const key = directKey(me.id, target);
    let conv = ok(await client.from("mk_conversations").select("id").eq("direct_key", key).maybeSingle());
    if (!conv) {
      const ins = await client.from("mk_conversations").insert({ kind: "direct", direct_key: key, created_by: me.id }).select("id").single();
      if (ins.error?.code === "23505") conv = ok(await client.from("mk_conversations").select("id").eq("direct_key", key).single());
      else { conv = ok(ins); ok(await client.from("mk_members").insert([{ conversation_id: conv.id, user_id: me.id }, { conversation_id: conv.id, user_id: target }])); }
    }
    res.json({ data: { id: `mk:${conv.id}` } });
  }));

  app.post("/api/chat/audio/start", limiter(120), route(async (req, res, me) => {
    const { client } = me; const v = z.object({ mime: z.string().max(80), size: z.number().int().min(200).max(AUDIO_MAX) }).strict().parse(req.body);
    const base = v.mime.split(";")[0].trim().toLowerCase(); const ext = AUDIO_MIME[base]; if (!ext) throw new SocialError("Unsupported audio format.", 400);
    const path = `${me.id}/${new Date().toISOString().slice(0, 7)}/${randomUUID()}.${ext}`;
    const signed = ok(await client.storage.from(AUDIO_BUCKET).createSignedUploadUrl(path), "Voice notes are not available yet. Run supabase/muk-social.sql.");
    res.json({ data: { path, signed_url: signed.signedUrl, token: signed.token, mime: base } });
  }));

  // ---------- Feed & notifications ----------
  function visiblePosts(q, me) { return me.kind === "student" ? q.or(me.counsellor_id ? `audience.eq.all,author_id.eq.${me.counsellor_id}` : "audience.eq.all") : q; }
  async function decorate(client, posts, me) {
    const ids = posts.map(p => p.id);
    const [reads, authors, assets, media] = await Promise.all([
      ids.length ? client.from("mk_post_reads").select("post_id").eq("user_id", me.id).in("post_id", ids) : { data: [] },
      people(client, posts.map(p => p.author_id), me),
      posts.some(p => p.asset_id) ? client.from("mt_employee_assets").select("id,object_path,mime").in("id", posts.filter(p => p.asset_id).map(p => p.asset_id)) : { data: [] },
      posts.some(p => p.media_id) ? client.from("mk_media").select("id,url,poster_url").in("id", posts.filter(p => p.media_id).map(p => p.media_id)) : { data: [] }
    ]);
    const read = new Set((reads.data || []).map(r => r.post_id)); const amap = new Map((assets.data || []).map(a => [a.id, a])); const mmap = new Map((media.data || []).map(m => [m.id, m]));
    return Promise.all(posts.map(async p => {
      let url = p.media_url, poster = p.poster_url;
      if (p.media_id && mmap.get(p.media_id)) { const m = mmap.get(p.media_id); url = url || m.url; poster = poster || m.poster_url; }
      if (p.asset_id && amap.get(p.asset_id)) url = (await client.storage.from("mt-employee-private").createSignedUrl(amap.get(p.asset_id).object_path, 7200)).data?.signedUrl || url;
      if (!poster && url) poster = cloudinaryPoster(url);
      const a = authors.get(p.author_id);
      return { id: p.id, kind: p.kind, title: p.title, body: p.body, url, poster, play: url ? (p.asset_id ? "video" : videoKind(url)) : null, live_at: p.live_at, audience: p.audience, author: a?.name || "MUK Talent", author_id: p.author_id, at: p.created_at, read: read.has(p.id), mine: p.author_id === me.id };
    }));
  }
  app.get("/api/feed", limiter(600), route(async (req, res, me) => {
    const { client } = me;
    const posts = ok(await visiblePosts(client.from("mk_posts").select("*").order("created_at", { ascending: false }).limit(60), me));
    res.json({ data: await decorate(client, posts, me) });
  }));
  app.post("/api/feed", limiter(60, 60), route(async (req, res, me) => {
    const { client } = me; if (me.kind !== "staff") throw new SocialError("Only the MUK Talent team can publish.", 403);
    const v = postSchema.parse(req.body);
    if (v.asset_id) { const a = ok(await client.from("mt_employee_assets").select("id,owner_id,mime,state").eq("id", v.asset_id).maybeSingle()); if (!a || a.state !== "uploaded" || (!me.admin && a.owner_id !== me.id) || !/^video\//.test(a.mime || "")) throw new SocialError("Video not found in your library.", 404); }
    if (v.media_id) { const m = ok(await client.from("mk_media").select("id,owner_id").eq("id", v.media_id).maybeSingle()); if (!m || (!me.admin && m.owner_id !== me.id)) throw new SocialError("Video not found in your library.", 404); }
    const row = ok(await client.from("mk_posts").insert({ ...v, author_id: me.id }).select("*").single(), "Unable to publish.");
    res.status(201).json({ data: (await decorate(client, [row], me))[0] });
  }));
  app.delete("/api/feed/:id", limiter(60), route(async (req, res, me) => {
    const { client } = me; if (me.kind !== "staff") throw new SocialError("Not allowed.", 403);
    let q = client.from("mk_posts").delete().eq("id", uuid.parse(req.params.id)); if (!me.admin) q = q.eq("author_id", me.id);
    const r = ok(await q.select("id")); if (!r?.length) throw new SocialError("Post not found.", 404); res.json({ ok: true });
  }));
  app.post("/api/feed/read", limiter(600), route(async (req, res, me) => {
    const { client } = me; const ids = z.object({ ids: z.array(uuid).min(1).max(60) }).strict().parse(req.body).ids;
    ok(await client.from("mk_post_reads").upsert(ids.map(post_id => ({ post_id, user_id: me.id })), { onConflict: "post_id,user_id", ignoreDuplicates: true }));
    res.json({ ok: true });
  }));
  app.get("/api/notifications/summary", limiter(900), route(async (req, res, me) => {
    const { client } = me; let chat = 0;
    const gpCount = me.kind === "student"
      ? await client.from("gp_messages").select("id", { count: "exact", head: true }).eq("student_id", me.id).neq("sender_role", "student").is("read_at", null)
      : await (async () => { let q = client.from("gp_students").select("user_id").limit(400); if (!me.admin) q = q.eq("counsellor_id", me.id); const ids = ok(await q).map(s => s.user_id); return ids.length ? client.from("gp_messages").select("id", { count: "exact", head: true }).in("student_id", ids).eq("sender_role", "student").is("read_at", null) : { count: 0 }; })();
    if (gpCount.error) ok(gpCount); chat = gpCount.count || 0;
    const mine = ok(await client.from("mk_members").select("conversation_id,last_read_at").eq("user_id", me.id).limit(400));
    if (mine.length) {
      const msgs = ok(await client.from("mk_messages").select("conversation_id,created_at").in("conversation_id", mine.map(m => m.conversation_id)).neq("sender_id", me.id).order("created_at", { ascending: false }).limit(500));
      const r = new Map(mine.map(m => [m.conversation_id, m.last_read_at])); chat += msgs.filter(m => !r.get(m.conversation_id) || m.created_at > r.get(m.conversation_id)).length;
    }
    const posts = ok(await visiblePosts(client.from("mk_posts").select("id,author_id").order("created_at", { ascending: false }).limit(40), me)).filter(p => p.author_id !== me.id);
    let feed = 0; if (posts.length) { const reads = ok(await client.from("mk_post_reads").select("post_id").eq("user_id", me.id).in("post_id", posts.map(p => p.id))); feed = posts.length - reads.length; }
    res.json({ data: { chat_unread: chat, feed_unread: Math.max(0, feed) } });
  }));

  // ---------- Video library (Cloudinary + links) ----------
  app.post("/api/media/cloudinary-sign", limiter(60), route(async (req, res, me) => {
    if (me.kind !== "staff") throw new SocialError("Not allowed.", 403);
    const { CLOUDINARY_CLOUD_NAME: cloud, CLOUDINARY_API_KEY: key, CLOUDINARY_API_SECRET: secret } = process.env;
    if (!cloud || !key || !secret) throw new SocialError("Cloudinary is not configured yet. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in Vercel.", 503);
    const params = { timestamp: Math.floor(Date.now() / 1000), folder: `muktalent/${me.id.slice(0, 8)}` };
    res.json({ data: { cloud_name: cloud, api_key: key, ...params, signature: cloudinarySignature(params, secret), upload_url: `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloud)}/video/upload` } });
  }));
  app.get("/api/media", limiter(300), route(async (req, res, me) => {
    if (me.kind !== "staff") throw new SocialError("Not allowed.", 403);
    let q = me.client.from("mk_media").select("*").order("created_at", { ascending: false }).limit(200); if (!me.admin) q = q.eq("owner_id", me.id);
    res.json({ data: ok(await q).map(m => ({ ...m, poster_url: m.poster_url || cloudinaryPoster(m.url), play: videoKind(m.url) })) });
  }));
  app.post("/api/media", limiter(60), route(async (req, res, me) => {
    if (me.kind !== "staff") throw new SocialError("Not allowed.", 403);
    const v = mediaSchema.parse(req.body);
    const row = ok(await me.client.from("mk_media").insert({ ...v, poster_url: v.poster_url || cloudinaryPoster(v.url), owner_id: me.id, kind: videoKind(v.url) }).select("*").single());
    res.status(201).json({ data: { ...row, play: videoKind(row.url) } });
  }));
  app.delete("/api/media/:id", limiter(60), route(async (req, res, me) => {
    if (me.kind !== "staff") throw new SocialError("Not allowed.", 403);
    let q = me.client.from("mk_media").delete().eq("id", uuid.parse(req.params.id)); if (!me.admin) q = q.eq("owner_id", me.id);
    const r = ok(await q.select("id")); if (!r?.length) throw new SocialError("Video not found.", 404); res.json({ ok: true });
  }));

  // ---------- Global Passport photo ----------
  app.post("/api/passport/photo/start", limiter(30), route(async (req, res, me) => {
    if (me.kind !== "student") throw new SocialError("Only students have a Global Passport.", 403);
    const v = z.object({ mime: z.enum(Object.keys(PHOTO_MIME)), size: z.number().int().min(1).max(PHOTO_MAX) }).strict().parse(req.body);
    const path = `${me.id}/photo/${randomUUID()}.${PHOTO_MIME[v.mime]}`;
    const signed = ok(await me.client.storage.from(PHOTO_BUCKET).createSignedUploadUrl(path), "Upload is not available.");
    res.json({ data: { path, signed_url: signed.signedUrl, token: signed.token } });
  }));
  app.post("/api/passport/photo/finish", limiter(30), route(async (req, res, me) => {
    if (me.kind !== "student") throw new SocialError("Only students have a Global Passport.", 403);
    const v = z.object({ path: z.string().max(300), mime: z.enum(Object.keys(PHOTO_MIME)) }).strict().parse(req.body);
    if (!v.path.startsWith(`${me.id}/photo/`) || v.path.includes("..")) throw new SocialError("Invalid upload.", 400);
    const file = await me.client.storage.from(PHOTO_BUCKET).download(v.path);
    if (file.error || !file.data) throw new SocialError("We could not find the photo. Try again.", 400);
    const buf = Buffer.from(await file.data.slice(0, 64).arrayBuffer());
    if (!validSignature(v.mime, buf)) { await me.client.storage.from(PHOTO_BUCKET).remove([v.path]); throw new SocialError("This file is not a valid image.", 400); }
    const prev = ok(await me.client.from("gp_students").select("photo_path").eq("user_id", me.id).single());
    ok(await me.client.from("gp_students").update({ photo_path: v.path, updated_at: new Date().toISOString() }).eq("user_id", me.id));
    if (prev?.photo_path && prev.photo_path !== v.path) await me.client.storage.from(PHOTO_BUCKET).remove([prev.photo_path]);
    const url = (await me.client.storage.from(PHOTO_BUCKET).createSignedUrl(v.path, 3600)).data?.signedUrl || null;
    res.json({ data: { photo_url: url } });
  }));
  app.post("/api/chat/visibility", limiter(30), route(async (req, res, me) => {
    if (me.kind !== "student") throw new SocialError("Not allowed.", 403);
    const visible = z.object({ visible: z.boolean() }).strict().parse(req.body).visible;
    ok(await me.client.from("gp_students").update({ chat_visible: visible }).eq("user_id", me.id)); res.json({ ok: true });
  }));
}
