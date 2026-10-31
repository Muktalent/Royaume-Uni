// MUK Talent – optional AI assistant endpoint (v6).
// Disabled unless ASSISTANT_API_KEY (or OPENAI_API_KEY) is set. Nothing is stored.
import { rateLimit, ipKeyGenerator } from "express-rate-limit";

const LANGS = new Set(["fr", "en", "es", "ar"]);
const LANG_NAME = { fr: "French", en: "English", es: "Spanish", ar: "Arabic" };
const MAX_MESSAGES = 10;
const MAX_CHARS = 800;

export const SYSTEM_PROMPT = `You are the website assistant of Maghreb UK Talent (MUK Talent), a UK company (MAGHREB UK TALENT LTD, company 16987132) that helps students from the Maghreb and beyond prepare to study in the United Kingdom.
Services: university applications (course choice, application file, follow-up, UCAS or direct), English & IELTS guidance, budget and funding/scholarship research, student visa preparation (organisation and official information only, not legal advice), student accommodation search, and document translation into English coordinated with the partner Kings of Translation (quoted separately in MAD).
Facts: the profile assessment at /evaluation/ and the first call (30 minutes, WhatsApp call or private email) are free. Students are not charged university placement fees. Tuition is paid directly to the university. Contact: agents@muktalent.com, UK phone +44 7311 874281.
Rules:
- Never guarantee admission, scholarships, visas, processing times, scores or accommodation. Decisions belong to universities, funders and UK authorities.
- Never invent fees, prices, deadlines or rules. For visa rules, fees, work rights and the Graduate route, point to GOV.UK (https://www.gov.uk/student-visa) and say rules can change.
- Do not give individual immigration legal advice; suggest an authorised adviser for complex cases.
- Never ask for passports, bank details or sensitive documents.
- Encourage the next step: the free assessment at https://www.muktalent.com/evaluation/.
- Reply in plain text (no markdown), short (max ~120 words), friendly and precise.`;

export function sanitizeMessages(input) {
  if (!Array.isArray(input)) return null;
  const out = [];
  for (const m of input.slice(-MAX_MESSAGES)) {
    if (!m || typeof m !== "object") continue;
    const role = m.role === "assistant" || m.role === "bot" ? "assistant" : m.role === "user" ? "user" : null;
    const raw = typeof m.content === "string" ? m.content : typeof m.t === "string" ? m.t : typeof m.text === "string" ? m.text : "";
    const content = raw.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, MAX_CHARS);
    if (!role || !content) continue;
    out.push({ role, content });
  }
  if (!out.length || out[out.length - 1].role !== "user") return null;
  return out;
}

export function buildRequest({ lang, page, messages }, env = process.env) {
  const l = LANGS.has(lang) ? lang : "fr";
  const p = typeof page === "string" && /^\/[a-z0-9\-/]{0,80}$/i.test(page) ? page : "/";
  return {
    model: env.ASSISTANT_MODEL || "gpt-4o-mini",
    temperature: 0.3,
    max_tokens: 350,
    messages: [
      { role: "system", content: `${SYSTEM_PROMPT}\nThe visitor's interface language is ${LANG_NAME[l]}; reply in the language of the visitor's last message (default ${LANG_NAME[l]}). Current page: ${p}.` },
      ...messages,
    ],
  };
}

const clientIp = (req) =>
  ipKeyGenerator((process.env.VERCEL ? String(req.headers["x-vercel-forwarded-for"] || req.headers["x-forwarded-for"] || "").split(",")[0].trim() : req.ip) || "127.0.0.1");

export function mountAssistant(app, { fetchImpl = globalThis.fetch } = {}) {
  const key = () => process.env.ASSISTANT_API_KEY || process.env.OPENAI_API_KEY || "";
  const limited = rateLimit({
    windowMs: 10 * 60 * 1000, limit: 15, standardHeaders: "draft-7", legacyHeaders: false,
    keyGenerator: clientIp, validate: { xForwardedForHeader: false },
    message: { error: "Trop de demandes. Réessayez dans quelques minutes." },
  });
  const validOrigin = (req, res, next) => {
    const incoming = req.get("origin");
    const allowed = new Set(["https://muktalent.com", "https://www.muktalent.com", "http://localhost:3000", "http://127.0.0.1:3000",
      ...(process.env.EVALUATION_ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean)]);
    if (incoming && !allowed.has(incoming)) return res.status(403).json({ error: "Origine non autorisée." });
    next();
  };

  app.get("/api/assistant/status", (req, res) => {
    res.set("Cache-Control", "no-store");
    res.json({ enabled: !!key() });
  });

  app.post("/api/assistant", validOrigin, limited, async (req, res) => {
    res.set("Cache-Control", "no-store");
    const apiKey = key();
    if (!apiKey) return res.status(503).json({ error: "Service temporairement indisponible." });
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const messages = sanitizeMessages(body.messages);
    if (!messages) return res.status(400).json({ error: "Vérifiez les champs du formulaire." });
    try {
      const r = await fetchImpl(process.env.ASSISTANT_API_URL || "https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(buildRequest({ lang: body.lang, page: body.page, messages })),
        signal: AbortSignal.timeout(20000),
      });
      if (!r.ok) throw new Error(`upstream ${r.status}`);
      const j = await r.json();
      const reply = String(j?.choices?.[0]?.message?.content || "").replace(/\*\*|__|^#+\s*/gm, "").trim().slice(0, 2400);
      if (!reply) throw new Error("empty");
      res.json({ reply });
    } catch (e) {
      console.error(JSON.stringify({ event: "assistant_upstream", message: String(e && e.message).slice(0, 120) }));
      res.status(503).json({ error: "Service temporairement indisponible." });
    }
  });
}
