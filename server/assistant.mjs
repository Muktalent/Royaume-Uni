// MUKTalent – optional AI assistant endpoint (v6).
// Disabled unless ASSISTANT_API_KEY (or OPENAI_API_KEY) is set. Nothing is stored.
import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import express from "express";

const LANGS = new Set(["fr", "en", "es", "ar"]);
const LANG_NAME = { fr: "French", en: "English", es: "Spanish", ar: "Arabic" };
const MAX_MESSAGES = 10;
const MAX_CHARS = 800;

export const SYSTEM_PROMPT = `You are the website assistant of MUKTalent (MUKTalent), a UK company (MAGHREB UK TALENT LTD, company 16987132) that helps students from the Maghreb and beyond prepare to study in the United Kingdom.
Services: university applications (course choice, application file, follow-up, UCAS or direct), English & IELTS guidance, budget and funding/scholarship research, student visa preparation (organisation and official information only, not legal advice), student accommodation search, and document translation into English coordinated with the partner Kings of Translation (quoted separately in MAD).
Positioning: UK-based management, local human support from counsellors in each region (Maghreb, Asia, Latin America), digital transparency through the Global Passport student area (stages, documents, messages; parents can follow key steps with the student's consent), and transparent fees. In the Maghreb there is no permanent physical office yet: counsellors meet families by video, WhatsApp and appointments, supervised by the UK team.
Fees: free for students = assessment, first call, guidance, university application support, Global Passport tracking and family contact. Optional and quoted in writing before agreement = certified translation (Kings of Translation) and extra services requested. Paid directly to the organisations = tuition and deposit to the university, visa and Immigration Health Surcharge to the UK government, English test to the test centre, rent to the residence. MUKTalent never collects tuition or visa fees. No hidden costs. Parents page: /parents/. If the visitor wants a human, tell them to use the "Speak to a counsellor" button in this chat: the request is sent to the team and the regional counsellor and logged with a reference.
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
    res.json({ enabled: !!key(), voice: !!key() && process.env.ASSISTANT_VOICE !== "off" });
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

  // v17 · Voz para móviles: transcripción (audio → texto) y síntesis (texto → mp3). Nada se guarda.
  const voiceLimited = rateLimit({
    windowMs: 10 * 60 * 1000, limit: 60, standardHeaders: "draft-7", legacyHeaders: false,
    keyGenerator: clientIp, validate: { xForwardedForHeader: false },
    message: { error: "Trop de demandes. Réessayez dans quelques minutes." },
  });
  const audioBase = () => (process.env.ASSISTANT_AUDIO_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const voiceOn = () => !!key() && process.env.ASSISTANT_VOICE !== "off";
  const EXT = { "audio/webm": "webm", "video/webm": "webm", "audio/mp4": "mp4", "video/mp4": "mp4", "audio/x-m4a": "m4a", "audio/m4a": "m4a", "audio/aac": "m4a", "audio/ogg": "ogg", "audio/wav": "wav", "audio/x-wav": "wav", "audio/mpeg": "mp3" };
  const rawAudio = express.raw({ type: ["audio/*", "video/webm", "video/mp4", "application/octet-stream"], limit: "4mb" });

  app.post("/api/assistant/transcribe", validOrigin, voiceLimited, rawAudio, async (req, res) => {
    res.set("Cache-Control", "no-store");
    if (!voiceOn()) return res.status(503).json({ error: "Service temporairement indisponible." });
    const buf = req.body;
    if (!Buffer.isBuffer(buf) || buf.length < 600) return res.status(400).json({ error: "Audio vide." });
    const mime = String(req.get("content-type") || "audio/webm").split(";")[0].trim().toLowerCase();
    const ext = EXT[mime] || "webm";
    const l = LANGS.has(String(req.query.lang)) ? String(req.query.lang) : "";
    try {
      const fd = new FormData();
      fd.append("file", new Blob([buf], { type: mime }), "speech." + ext);
      fd.append("model", process.env.ASSISTANT_STT_MODEL || "gpt-4o-mini-transcribe");
      if (l) fd.append("language", l);
      fd.append("response_format", "json");
      const r = await fetchImpl(audioBase() + "/audio/transcriptions", { method: "POST", headers: { authorization: `Bearer ${key()}` }, body: fd, signal: AbortSignal.timeout(25000) });
      if (!r.ok) throw new Error(`upstream ${r.status}`);
      const j = await r.json();
      res.json({ text: String(j?.text || "").replace(/\s+/g, " ").trim().slice(0, 600) });
    } catch (e) {
      console.error(JSON.stringify({ event: "assistant_stt", message: String(e && e.message).slice(0, 120) }));
      res.status(503).json({ error: "Service temporairement indisponible." });
    }
  });

  const VOICES = { fr: "nova", en: "nova", es: "nova", ar: "nova" };
  app.post("/api/assistant/speech", validOrigin, voiceLimited, async (req, res) => {
    res.set("Cache-Control", "no-store");
    if (!voiceOn()) return res.status(503).json({ error: "Service temporairement indisponible." });
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const text = typeof body.text === "string" ? body.text.replace(/https?:\/\/\S+/g, "").replace(/\s+/g, " ").trim().slice(0, 1500) : "";
    if (!text) return res.status(400).json({ error: "Texte vide." });
    const l = LANGS.has(body.lang) ? body.lang : "fr";
    try {
      const r = await fetchImpl(audioBase() + "/audio/speech", {
        method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${key()}` },
        body: JSON.stringify({ model: process.env.ASSISTANT_TTS_MODEL || "gpt-4o-mini-tts", voice: process.env.ASSISTANT_TTS_VOICE || VOICES[l], input: text, response_format: "mp3" }),
        signal: AbortSignal.timeout(25000),
      });
      if (!r.ok) throw new Error(`upstream ${r.status}`);
      const audio = Buffer.from(await r.arrayBuffer());
      res.set("Content-Type", "audio/mpeg");
      res.set("Content-Length", String(audio.length));
      res.send(audio);
    } catch (e) {
      console.error(JSON.stringify({ event: "assistant_tts", message: String(e && e.message).slice(0, 120) }));
      res.status(503).json({ error: "Service temporairement indisponible." });
    }
  });
}
