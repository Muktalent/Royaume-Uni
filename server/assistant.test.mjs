import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { mountAssistant, sanitizeMessages, buildRequest } from "./assistant.mjs";

async function serve(fetchImpl) {
  const app = express(); app.use(express.json());
  mountAssistant(app, { fetchImpl });
  const server = await new Promise((r) => { const s = app.listen(0, () => r(s)); });
  return { url: `http://127.0.0.1:${server.address().port}`, close: () => server.close() };
}

test("sanitizeMessages limits size and requires a final user message", () => {
  assert.equal(sanitizeMessages("x"), null);
  assert.equal(sanitizeMessages([{ role: "assistant", content: "hi" }]), null);
  const many = Array.from({ length: 30 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: "a".repeat(2000) }));
  many.push({ role: "user", content: "last" });
  const out = sanitizeMessages(many);
  assert.ok(out.length <= 10);
  assert.ok(out.every((m) => m.content.length <= 800));
  assert.equal(out.at(-1).content, "last");
  assert.deepEqual(sanitizeMessages([{ role: "system", content: "x" }, { role: "user", content: "ok" }]), [{ role: "user", content: "ok" }]);
});

test("buildRequest uses safe defaults", () => {
  const r = buildRequest({ lang: "zz", page: "javascript:alert(1)", messages: [{ role: "user", content: "hi" }] }, {});
  assert.equal(r.model, "gpt-4o-mini");
  assert.equal(r.max_tokens, 350);
  assert.equal(r.messages[0].role, "system");
  assert.match(r.messages[0].content, /French/);
  assert.match(r.messages[0].content, /Current page: \/\./);
});

test("status disabled and 503 without key", async () => {
  delete process.env.ASSISTANT_API_KEY; delete process.env.OPENAI_API_KEY;
  const s = await serve(async () => { throw new Error("should not call"); });
  try {
    assert.deepEqual(await (await fetch(s.url + "/api/assistant/status")).json(), { enabled: false, voice: false });
    const r = await fetch(s.url + "/api/assistant", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: [{ role: "user", content: "hi" }] }) });
    assert.equal(r.status, 503);
  } finally { s.close(); }
});

test("replies through upstream and rejects foreign origins", async () => {
  process.env.ASSISTANT_API_KEY = "test-key";
  let sent;
  const s = await serve(async (url, opts) => { sent = { url, opts }; return { ok: true, json: async () => ({ choices: [{ message: { content: "**Bonjour** !" } }] }) }; });
  try {
    assert.deepEqual(await (await fetch(s.url + "/api/assistant/status")).json(), { enabled: true, voice: true });
    const ok = await fetch(s.url + "/api/assistant", { method: "POST", headers: { "content-type": "application/json", origin: "https://www.muktalent.com" }, body: JSON.stringify({ lang: "es", page: "/", messages: [{ role: "user", content: "Hola" }] }) });
    assert.equal(ok.status, 200);
    assert.equal((await ok.json()).reply, "Bonjour !");
    assert.equal(sent.opts.headers.authorization, "Bearer test-key");
    assert.match(JSON.parse(sent.opts.body).messages[0].content, /Spanish/);
    const bad = await fetch(s.url + "/api/assistant", { method: "POST", headers: { "content-type": "application/json", origin: "https://evil.example" }, body: JSON.stringify({ messages: [{ role: "user", content: "x" }] }) });
    assert.equal(bad.status, 403);
    const empty = await fetch(s.url + "/api/assistant", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: [] }) });
    assert.equal(empty.status, 400);
  } finally { s.close(); delete process.env.ASSISTANT_API_KEY; }
});

test("upstream failure returns 503", async () => {
  process.env.ASSISTANT_API_KEY = "k";
  const s = await serve(async () => ({ ok: false, status: 500, json: async () => ({}) }));
  try {
    const r = await fetch(s.url + "/api/assistant", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: [{ role: "user", content: "x" }] }) });
    assert.equal(r.status, 503);
  } finally { s.close(); delete process.env.ASSISTANT_API_KEY; }
});

test("v17 mobile voice: transcribe and speech proxy to the audio API", async () => {
  const prev = process.env.ASSISTANT_API_KEY; process.env.ASSISTANT_API_KEY = "test-key";
  const calls = [];
  const fake = async (url, init) => {
    calls.push(url);
    if (url.endsWith("/audio/transcriptions")) { assert.ok(init.body instanceof FormData); assert.equal(init.body.get("language"), "es"); return new Response(JSON.stringify({ text: " Hola,  quiero estudiar " }), { status: 200 }); }
    if (url.endsWith("/audio/speech")) { const b = JSON.parse(init.body); assert.equal(b.response_format, "mp3"); return new Response(new Uint8Array([1, 2, 3, 4]), { status: 200 }); }
    return new Response("{}", { status: 404 });
  };
  const s = await serve(fake);
  try {
    const st = await (await fetch(s.url + "/api/assistant/status")).json();
    assert.equal(st.voice, true);
    const t = await fetch(s.url + "/api/assistant/transcribe?lang=es", { method: "POST", headers: { "content-type": "audio/webm" }, body: new Uint8Array(2000) });
    assert.equal(t.status, 200); assert.equal((await t.json()).text, "Hola, quiero estudiar");
    const empty = await fetch(s.url + "/api/assistant/transcribe", { method: "POST", headers: { "content-type": "audio/webm" }, body: new Uint8Array(10) });
    assert.equal(empty.status, 400);
    const sp = await fetch(s.url + "/api/assistant/speech", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: "Bonjour", lang: "fr" }) });
    assert.equal(sp.status, 200); assert.equal(sp.headers.get("content-type"), "audio/mpeg");
    const bad = await fetch(s.url + "/api/assistant/speech", { method: "POST", headers: { "content-type": "application/json", origin: "https://evil.example" }, body: JSON.stringify({ text: "x" }) });
    assert.equal(bad.status, 403);
  } finally { s.close(); if (prev === undefined) delete process.env.ASSISTANT_API_KEY; else process.env.ASSISTANT_API_KEY = prev; }
});
