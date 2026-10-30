// card-links-v1 · short business-card links (muktalent.com/laura) and social profiles.
import { createClient } from "@supabase/supabase-js";
import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import { z } from "zod";
import { PLATFORMS, PLATFORM_ORDER, SocialError, normaliseSocialSet, publicSocials } from "./social-links.mjs";

export const HANDLE_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_HANDLES_PER_PERSON = 5;

// Top-level paths that belong to the website or could be used for impersonation.
export const RESERVED_HANDLES = new Set([
  "admin","administrator","api","app","apps","assets","static","public","book","booking","bookings","card","cards",
  "privacy","terms","legal","cookies","cookie","gdpr","services","service","portfolio","certificates","certificate",
  "personal-admin","pipeline-share","about","about-us","contact","contact-us","blog","news","press","careers","jobs",
  "login","logout","signin","sign-in","signup","sign-up","register","account","accounts","dashboard","team","teams",
  "staff","employee","employees","support","help","faq","home","index","www","mail","email","webmail","ftp","cdn",
  "status","health","robots","sitemap","favicon","manifest","security","well-known","muktalent","muk-talent","muk",
  "official","owner","root","system","null","undefined","test","demo","partners","partner","universities","students",
  "student","apply","evaluation","evaluate","pricing","fr","en","es","ar","uk","ma","new","edit","settings","profile",
  "me","you","agents","agent","info","hello","noreply","no-reply","billing","payments","pay","wallet","qr","share","link","links"
]);

export function siteOrigin() {
  const url = new URL(process.env.PUBLIC_SITE_URL || "https://muktalent.com");
  return url.origin;
}
export function displayHost() { return new URL(siteOrigin()).host.replace(/^www\./, ""); }

export function normaliseHandle(raw) {
  let value = String(raw ?? "").trim().toLowerCase();
  value = value.replace(/^https?:\/\//, "").replace(/^(www\.)?muktalent\.com\/?/, "").replace(/^[@/]+/, "").replace(/\/+$/, "");
  return value;
}
export function handleProblem(handle) {
  if (handle.length < 3) return "Use at least 3 characters.";
  if (handle.length > 30) return "Use 30 characters or fewer.";
  if (!HANDLE_RE.test(handle)) return "Use lowercase letters, numbers and single hyphens only (no spaces or accents).";
  if (UUID_RE.test(handle)) return "Choose a name, not an identifier.";
  if (RESERVED_HANDLES.has(handle)) return "This name is reserved by MUK Talent.";
  return null;
}
export function slugifyName(text) {
  return String(text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/-{2,}/g, "-");
}
function suggestionsFor(fullName) {
  const parts = slugifyName(fullName).split("-").filter(Boolean);
  const first = parts[0] || "", last = parts[parts.length - 1] || "";
  const list = [first, parts.length > 1 ? `${first}-${last}` : "", parts.length > 1 ? `${first}${last[0] || ""}` : "",
    parts.length > 1 ? `${first[0] || ""}${last}` : "", parts.length > 1 ? `${first}-${last[0] || ""}` : "", `${first}-muk`, `${first}-uk`];
  return [...new Set(list.filter(h => h && !handleProblem(h)))];
}

function admin() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw Object.assign(new Error("Private services unavailable"), { status: 503 });
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}
function checked(r) { if (r.error) throw Object.assign(new Error("Database operation failed"), { status: 503, code: r.error.code }); return r.data; }

export async function primaryHandle(client, ownerId) {
  const r = await client.from("mt_card_handles").select("handle").eq("owner_id", ownerId).eq("is_primary", true).maybeSingle();
  if (r.error) return null; // migration not yet applied: fall back to the long link
  return r.data?.handle || null;
}
// Public share URL for a card. Short link when the employee has claimed one.
export async function cardLinkFor(client, ownerId, slug) {
  const handle = await primaryHandle(client, ownerId);
  const origin = siteOrigin();
  return handle
    ? { handle, url: `${origin}/${handle}`, display: `${displayHost()}/${handle}`, long_url: `${origin}/book/?c=${slug}` }
    : { handle: null, url: `${origin}/book/?c=${slug}`, display: `${displayHost()}/book/?c=${String(slug).slice(0, 8)}…`, long_url: `${origin}/book/?c=${slug}` };
}
export async function socialsFor(client, ownerId, { publicOnly = false } = {}) {
  const r = await client.from("mt_employee_socials").select("links,show_on_card").eq("owner_id", ownerId).maybeSingle();
  if (r.error || !r.data) return publicOnly ? [] : { links: {}, show_on_card: true };
  if (publicOnly) return r.data.show_on_card ? publicSocials(r.data.links) : [];
  return { links: r.data.links || {}, show_on_card: r.data.show_on_card };
}

const ipKey = req => ipKeyGenerator((process.env.VERCEL ? String(req.headers["x-vercel-forwarded-for"] || req.headers["x-forwarded-for"] || "").split(",")[0].trim() : req.ip) || "127.0.0.1");

export function mountCardLinks(app, { requireStaff }) {
  const lookupLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 120, keyGenerator: ipKey, validate: { xForwardedForHeader: false }, standardHeaders: "draft-7", legacyHeaders: false,
    handler: (req, res) => res.status(429).json({ error: "Too many requests. Please wait before trying again.", requestId: req.requestId }) });
  const checkLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 90, keyGenerator: req => req.staff.user_id, standardHeaders: "draft-7", legacyHeaders: false,
    handler: (req, res) => res.status(429).json({ error: "Too many checks. Please wait a few minutes.", requestId: req.requestId }) });
  const writeLimit = rateLimit({ windowMs: 60 * 60 * 1000, limit: 12, keyGenerator: req => req.staff.user_id, standardHeaders: "draft-7", legacyHeaders: false,
    handler: (req, res) => res.status(429).json({ error: "Too many changes. Please wait before trying again.", requestId: req.requestId }) });

  const wrap = fn => async (req, res, next) => {
    try { await fn(req, res, next); }
    catch (e) {
      const status = e instanceof z.ZodError || e instanceof SocialError ? 400 : e.status || 503;
      if (status >= 500) console.error(JSON.stringify({ event: "card_links_failed", requestId: req.requestId, code: e.code || e.name }));
      res.status(status).json({ error: e instanceof z.ZodError ? "Please check the form fields." : status < 500 ? e.message : "Service unavailable. Refresh and try again.", platform: e.platform, requestId: req.requestId });
    }
  };
  function scope(req) {
    if (!req.query.owner) return req.staff.user_id;
    const id = z.string().uuid().parse(String(req.query.owner));
    if (id !== req.staff.user_id && req.staff.role !== "admin") throw Object.assign(new Error("Administrator access required."), { status: 403 });
    return id;
  }

  // Resolve /api/business-card/<handle>/… and /api/counsellor/<handle>/… to the card's internal identifier.
  // Downstream handlers keep validating a UUID, so their behaviour and protections are unchanged.
  const cache = new Map();
  app.use(async (req, res, next) => {
    const m = /^\/api\/(business-card|counsellor)\/([^/?#]+)(.*)$/.exec(req.url);
    if (!m || UUID_RE.test(m[2])) return next();
    let handle;
    try { handle = normaliseHandle(decodeURIComponent(m[2])); } catch { return res.status(400).json({ error: "Invalid card link." }); }
    if (!HANDLE_RE.test(handle) || handle.length < 3 || handle.length > 30) return res.status(404).json({ error: "This business card is not available." });
    lookupLimit(req, res, async () => {
      try {
        const hit = cache.get(handle);
        let slug = hit && hit.expires > Date.now() ? hit.slug : null;
        if (!slug) {
          const client = admin();
          const owner = checked(await client.from("mt_card_handles").select("owner_id").eq("handle", handle).maybeSingle());
          if (!owner) return res.status(404).json({ error: "This business card is not available." });
          const card = checked(await client.from("mt_public_cards").select("slug").eq("owner_id", owner.owner_id).maybeSingle());
          if (!card?.slug) return res.status(404).json({ error: "This business card is not available." });
          slug = card.slug;
          if (cache.size > 500) cache.clear();
          cache.set(handle, { slug, expires: Date.now() + 60_000 });
        }
        req.url = `/api/${m[1]}/${slug}${m[3]}`;
        next();
      } catch { res.status(503).json({ error: "Card service unavailable. Refresh and try again.", requestId: req.requestId }); }
    });
  });

  app.get("/api/workspace/card-link", requireStaff, wrap(async (req, res) => {
    const owner = scope(req), client = admin();
    const staff = checked(await client.from("crm_staff").select("full_name").eq("user_id", owner).maybeSingle());
    const card = checked(await client.from("mt_public_cards").select("slug,published").eq("owner_id", owner).maybeSingle());
    const handles = checked(await client.from("mt_card_handles").select("handle,is_primary,created_at").eq("owner_id", owner).order("created_at", { ascending: false }));
    const current = handles.find(h => h.is_primary)?.handle || null;
    let suggestions = suggestionsFor(staff?.full_name);
    if (suggestions.length) {
      const taken = checked(await client.from("mt_card_handles").select("handle,owner_id").in("handle", suggestions));
      suggestions = suggestions.filter(s => !taken.some(t => t.handle === s && t.owner_id !== owner) && s !== current).slice(0, 4);
    }
    const origin = siteOrigin();
    res.json({ data: {
      handle: current, host: displayHost(), url: current ? `${origin}/${current}` : null,
      long_url: card?.slug ? `${origin}/book/?c=${card.slug}` : null, published: Boolean(card?.published),
      previous: handles.filter(h => !h.is_primary).map(h => h.handle), remaining: Math.max(0, MAX_HANDLES_PER_PERSON - handles.length), suggestions
    } });
  }));

  app.get("/api/workspace/card-link/check", requireStaff, checkLimit, wrap(async (req, res) => {
    const handle = normaliseHandle(String(req.query.handle || "").slice(0, 80));
    const problem = handleProblem(handle);
    if (problem) return res.json({ data: { handle, available: false, reason: problem } });
    const row = checked(await admin().from("mt_card_handles").select("owner_id").eq("handle", handle).maybeSingle());
    const mine = row?.owner_id === req.staff.user_id;
    res.json({ data: { handle, available: !row || mine, mine, reason: row && !mine ? "Already taken. Try another variation." : null } });
  }));

  app.put("/api/workspace/card-link", requireStaff, writeLimit, wrap(async (req, res) => {
    const owner = scope(req);
    const { handle: raw } = z.object({ handle: z.string().max(80) }).strict().parse(req.body);
    const handle = normaliseHandle(raw), problem = handleProblem(handle);
    if (problem) return res.status(400).json({ error: problem });
    const client = admin();
    const person = checked(await client.from("crm_staff").select("active").eq("user_id", owner).maybeSingle());
    if (!person?.active) return res.status(403).json({ error: "The employee account is not active." });
    const r = await client.rpc("mt_claim_card_handle", { p_owner: owner, p_handle: handle });
    if (r.error) {
      if (/handle_taken/.test(r.error.message || "")) return res.status(409).json({ error: "Already taken. Try another variation." });
      if (/handle_limit/.test(r.error.message || "")) return res.status(409).json({ error: `You have used all ${MAX_HANDLES_PER_PERSON} short links. Reuse a previous one or contact your administrator.` });
      checked(r);
    }
    cache.clear();
    res.json({ data: { handle, url: `${siteOrigin()}/${handle}`, display: `${displayHost()}/${handle}` } });
  }));

  app.get("/api/workspace/socials", requireStaff, wrap(async (req, res) => {
    const owner = scope(req), data = await socialsFor(admin(), owner);
    res.json({ data: { ...data, platforms: PLATFORM_ORDER.map(id => ({ id, label: PLATFORMS[id].label, placeholder: PLATFORMS[id].placeholder })) } });
  }));

  app.put("/api/workspace/socials", requireStaff, writeLimit, wrap(async (req, res) => {
    const body = z.object({ links: z.record(z.string(), z.string().max(200)), show_on_card: z.boolean() }).strict().parse(req.body);
    if (Object.keys(body.links).length > PLATFORM_ORDER.length) return res.status(400).json({ error: "Too many social links." });
    const links = normaliseSocialSet(body.links);
    checked(await admin().from("mt_employee_socials").upsert({ owner_id: req.staff.user_id, links, show_on_card: body.show_on_card, updated_at: new Date().toISOString() }, { onConflict: "owner_id" }));
    res.json({ data: { links, show_on_card: body.show_on_card } });
  }));
}
