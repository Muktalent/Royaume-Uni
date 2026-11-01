// MUK Talent v13 · public team carousel + family / assistant enquiries routed to the team messenger.
import { createClient } from "@supabase/supabase-js";
import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { cardLinkFor } from "./card-links.mjs";

export class PublicError extends Error { constructor(message, status = 400) { super(message); this.status = status; } }
const service = () => {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new PublicError("This service is not available yet.", 503);
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
};
const ok = r => { if (r.error) throw new PublicError("We could not complete the request. Try again in a moment.", 503); return r.data; };
const ip = req => (process.env.VERCEL ? String(req.headers["x-vercel-forwarded-for"] || req.headers["x-forwarded-for"] || "").split(",")[0].trim() : req.ip) || "127.0.0.1";
const limiter = (limit, windowMs = 15 * 60 * 1000) => rateLimit({ windowMs, limit, keyGenerator: req => ipKeyGenerator(ip(req)), validate: { xForwardedForHeader: false }, standardHeaders: "draft-7", legacyHeaders: false, handler: (req, res) => res.status(429).json({ error: "Too many requests. Please wait a few minutes and try again." }) });
const route = fn => async (req, res) => {
  try { await fn(req, res); }
  catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.issues[0]?.message || "Check the form and try again.", field: e.issues[0]?.path?.[0] || null });
    res.status(e.status || 500).json({ error: e.status ? e.message : "Something went wrong. Try again in a moment." });
  }
};

/* ---------- Regions ---------- */
export const REGIONS = ["maghreb", "asia", "latam"];
const REGION_WORDS = {
  maghreb: ["maroc", "morocco", "marruecos", "algerie", "algeria", "argelia", "tunisie", "tunisia", "tunez", "libye", "libya", "mauritanie", "mauritania", "casablanca", "rabat", "marrakech", "marrakesh", "fes", "fez", "tanger", "tangier", "agadir", "oujda", "kenitra", "meknes", "tetouan", "alger", "algiers", "oran", "constantine", "tunis", "sfax", "sousse", "tripoli", "nouakchott", "maghreb"],
  asia: ["asia", "asie", "india", "inde", "pakistan", "bangladesh", "sri lanka", "nepal", "china", "chine", "hong kong", "vietnam", "viet nam", "thailand", "thailande", "malaysia", "malaisie", "indonesia", "indonesie", "philippines", "singapore", "singapour", "japan", "japon", "korea", "coree", "uzbekistan", "ouzbekistan", "kazakhstan", "delhi", "mumbai", "karachi", "lahore", "dhaka", "kathmandu", "hanoi", "jakarta", "manila", "kuala lumpur", "bangkok", "shanghai", "beijing"],
  latam: ["latin america", "amerique latine", "latinoamerica", "america latina", "mexico", "mexique", "colombia", "colombie", "peru", "perou", "chile", "chili", "argentina", "argentine", "brazil", "bresil", "brasil", "ecuador", "equateur", "venezuela", "bolivia", "bolivie", "paraguay", "uruguay", "guatemala", "honduras", "costa rica", "panama", "dominican", "dominicaine", "el salvador", "nicaragua", "cuba", "bogota", "medellin", "lima", "santiago", "buenos aires", "sao paulo", "quito", "caracas", "ciudad de mexico", "guadalajara", "monterrey"]
};
const fold = s => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
export function regionOf(text) {
  const t = ` ${fold(text).replace(/[^a-z ]+/g, " ")} `;
  for (const r of REGIONS) if (REGION_WORDS[r].some(w => t.includes(` ${w} `))) return r;
  return null;
}

/* ---------- Enquiries ---------- */
const clean = s => String(s ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim();
const text = (max, msg) => z.preprocess(clean, z.string().max(max, msg));
export const PRIORITIES = ["budget", "university", "visa", "housing", "scholarships", "safety", "follow_up", "english"];
const PRIORITY_LABEL = { budget: "Budget & fees", university: "Choice of university", visa: "Visa", housing: "Accommodation", scholarships: "Scholarships", safety: "Safety & wellbeing", follow_up: "Follow-up & communication", english: "English / IELTS" };
export const inquirySchema = z.object({
  source: z.enum(["parents", "assistant", "home"]).default("parents"),
  name: text(120, "Name is too long.").pipe(z.string().min(2, "Please enter your name.")),
  email: text(160, "Email is too long.").pipe(z.string().email("Please enter a valid email.")),
  phone: text(40, "Phone is too long.").pipe(z.string().regex(/^[+()\d\s.-]{6,40}$/, "Please enter a valid phone number.")),
  country: text(80, "Country is too long.").pipe(z.string().min(2, "Please choose your country.")),
  priorities: z.array(z.enum(PRIORITIES)).max(PRIORITIES.length).default([]),
  message: text(1500, "Your message is too long (1500 characters max).").default(""),
  relation: z.enum(["parent", "student", "other"]).default("parent"),
  lang: z.enum(["fr", "en", "es", "ar"]).default("fr"),
  page: text(200, "").default(""),
  transcript: z.array(z.object({ from: z.enum(["user", "bot"]), text: text(600, "") })).max(12).default([]),
  consent: z.literal(true, { errorMap: () => ({ message: "Please accept the privacy notice." }) }),
  website: z.string().max(0).optional().default("")
}).superRefine((v, ctx) => { if (v.source !== "assistant" && !v.priorities.length && !v.message) ctx.addIssue({ code: "custom", path: ["priorities"], message: "Tell us at least one priority." }); });

export const reference = () => "MK-" + randomBytes(3).toString("hex").toUpperCase();
export function inquiryBody(v, ref) {
  const head = v.source === "assistant" ? "New question from the website assistant" : "New family enquiry (For Parents)";
  const lines = [`${head} · ${ref}`, "", `Name: ${v.name}${v.relation !== "parent" ? ` (${v.relation})` : ""}`, `Email: ${v.email}`, `Phone / WhatsApp: ${v.phone}`, `Country: ${v.country}`];
  if (v.priorities.length) lines.push(`Priorities: ${v.priorities.map(p => PRIORITY_LABEL[p]).join(", ")}`);
  if (v.message) lines.push("", `Message: ${v.message}`);
  if (v.transcript.length) { lines.push("", "Conversation:"); for (const t of v.transcript.slice(-6)) lines.push(`${t.from === "user" ? "Visitor" : "Assistant"}: ${t.text.slice(0, 280)}`); }
  lines.push("", `Language: ${v.lang.toUpperCase()}${v.page ? ` · Page: ${v.page}` : ""}`, "Reply by email or WhatsApp, then update the follow-up status.");
  return lines.join("\n").slice(0, 2000);
}

export async function routeInquiry(db, v) {
  const region = regionOf(v.country);
  const staff = ok(await db.from("crm_staff").select("user_id,role,active").eq("active", true).limit(300));
  const admins = staff.filter(s => s.role === "admin").map(s => s.user_id);
  let counsellors = [];
  if (region) {
    const ids = staff.filter(s => s.role !== "admin").map(s => s.user_id);
    if (ids.length) {
      const cards = ok(await db.from("mt_public_cards").select("owner_id,assigned_city,region,published").in("owner_id", ids));
      counsellors = cards.filter(c => c.published && (c.region || regionOf(c.assigned_city)) === region).map(c => c.owner_id);
    }
  }
  return { region, recipients: [...new Set([...admins, ...counsellors])], counsellors };
}

export function mountMukPublic(app, { db = service } = {}) {
  /* Team carousel: every published counsellor card, grouped by region. New counsellors appear automatically. */
  let cache = { at: 0, data: null };
  app.get("/api/public/team", limiter(300), route(async (req, res) => {
    if (cache.data && Date.now() - cache.at < 5 * 60 * 1000) { res.set("Cache-Control", "public, max-age=300"); return res.json({ data: cache.data }); }
    const client = db();
    const staff = ok(await client.from("crm_staff").select("user_id,role,active").eq("active", true).limit(300));
    const active = new Set(staff.map(s => s.user_id));
    const cards = ok(await client.from("mt_public_cards").select("*").eq("published", true).limit(200)).filter(c => active.has(c.owner_id));
    const out = [];
    for (const c of cards) {
      const region = REGIONS.includes(c.region) ? c.region : regionOf(c.assigned_city) || "maghreb";
      const link = await cardLinkFor(client, c.owner_id, c.slug).catch(() => null);
      out.push({ slug: c.slug, name: c.display_name, title: c.job_title || "Student Recruitment Counsellor", city: c.assigned_city || null, languages: Array.isArray(c.languages) ? c.languages.slice(0, 4) : [], region, photo: `/api/counsellor/${c.slug}/photo`, url: link?.url || `/book/?c=${c.slug}` });
    }
    out.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    cache = { at: Date.now(), data: out };
    res.set("Cache-Control", "public, max-age=300");
    res.json({ data: out });
  }));

  /* Family / assistant enquiries: stored, then posted to a team conversation so admins and the matching counsellors get a red dot. */
  app.post("/api/inquiries", limiter(12), route(async (req, res) => {
    const origin = String(req.headers.origin || "");
    if (origin && process.env.VERCEL && !/^https:\/\/(www\.)?muktalent\.com$|\.vercel\.app$/.test(origin)) throw new PublicError("Not allowed.", 403);
    const v = inquirySchema.parse(req.body || {});
    const client = db(); const ref = reference();
    const { region, recipients, counsellors } = await routeInquiry(client, v);
    let conversation_id = null;
    if (recipients.length) {
      const first = v.name.split(/\s+/)[0];
      const conv = ok(await client.from("mk_conversations").insert({ kind: "group", title: `${v.source === "assistant" ? "Assistant" : "Parents"} · ${first} (${v.country})`.slice(0, 120) }).select("id").single());
      conversation_id = conv.id;
      ok(await client.from("mk_members").insert(recipients.map(user_id => ({ conversation_id, user_id }))));
      ok(await client.from("mk_messages").insert({ conversation_id, sender_id: null, body: inquiryBody(v, ref) }));
    }
    ok(await client.from("mk_inquiries").insert({ reference: ref, source: v.source, relation: v.relation, name: v.name, email: v.email.toLowerCase(), phone: v.phone, country: v.country, region, priorities: v.priorities, message: v.message || null, transcript: v.transcript.length ? v.transcript : null, lang: v.lang, page: v.page || null, conversation_id, assigned_to: counsellors, status: "new" }));
    res.status(201).json({ ok: true, reference: ref });
  }));
}
