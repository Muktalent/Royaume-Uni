import test from "node:test";
import assert from "node:assert/strict";
import { regionOf, inquirySchema, inquiryBody, routeInquiry, reference } from "./muk-public.mjs";

test("regions are detected from cities and countries in any language", () => {
  assert.equal(regionOf("Casablanca, Morocco"), "maghreb");
  assert.equal(regionOf("Algérie"), "maghreb");
  assert.equal(regionOf("Lahore, Pakistan"), "asia");
  assert.equal(regionOf("Bogotá, Colombia"), "latam");
  assert.equal(regionOf("México"), "latam");
  assert.equal(regionOf("London"), null);
});
const base = { name: "Fatima Zahra", email: "f@example.com", phone: "+212 600 000 000", country: "Maroc", priorities: ["budget", "visa"], consent: true };
test("enquiry form is validated", () => {
  assert.equal(inquirySchema.parse(base).source, "parents");
  assert.throws(() => inquirySchema.parse({ ...base, consent: false }));
  assert.throws(() => inquirySchema.parse({ ...base, email: "nope" }));
  assert.throws(() => inquirySchema.parse({ ...base, priorities: [] }));
  assert.throws(() => inquirySchema.parse({ ...base, website: "spam" }));
  assert.equal(inquirySchema.parse({ ...base, source: "assistant", priorities: [], message: "" }).source, "assistant");
  assert.match(reference(), /^MK-[0-9A-F]{6}$/);
});
test("message body lists everything the team needs", () => {
  const b = inquiryBody(inquirySchema.parse({ ...base, message: "Is the accommodation safe?" }), "MK-ABC123");
  assert.match(b, /MK-ABC123/); assert.match(b, /Budget & fees, Visa/); assert.match(b, /accommodation safe/);
  assert.ok(b.length <= 2000);
});
test("enquiries go to admins and counsellors of the same region", async () => {
  const tables = {
    crm_staff: [{ user_id: "a1", role: "admin", active: true }, { user_id: "c1", role: "collaborator", active: true }, { user_id: "c2", role: "collaborator", active: true }],
    mt_public_cards: [{ owner_id: "c1", assigned_city: "Rabat, Morocco", region: null, published: true }, { owner_id: "c2", assigned_city: "Lima, Peru", region: null, published: true }]
  };
  const q = rows => { const o = { rows, select() { return o; }, eq(k, v) { o.rows = o.rows.filter(r => r[k] === v); return o; }, in(k, v) { o.rows = o.rows.filter(r => v.includes(r[k])); return o; }, limit() { return o; }, then(f) { return Promise.resolve({ data: o.rows, error: null }).then(f); } }; return o; };
  const db = { from: t => q([...tables[t]]) };
  const r = await routeInquiry(db, inquirySchema.parse(base));
  assert.equal(r.region, "maghreb"); assert.deepEqual(r.recipients.sort(), ["a1", "c1"]);
  const r2 = await routeInquiry(db, inquirySchema.parse({ ...base, country: "France" }));
  assert.deepEqual(r2.recipients, ["a1"]);
});

test("v14 /api/public/videos returns the 3 latest website videos with player data", async () => {
  const { default: express } = await import("express");
  const { mountMukPublic } = await import("./muk-public.mjs");
  const rows = {
    mk_posts: [
      { id: "p1", title: "Guide", kind: "video", audience: "web", media_url: null, poster_url: null, asset_id: null, media_id: "m1", author_id: "u1", created_at: "2026-11-01T10:00:00Z" },
      { id: "p2", title: "Campus", kind: "video", audience: "web", media_url: null, poster_url: null, asset_id: "a1", media_id: null, author_id: "u2", created_at: "2026-10-30T10:00:00Z" }
    ],
    mt_employee_assets: [{ id: "a1", object_path: "c/1.mp4", mime: "video/mp4" }],
    mk_media: [{ id: "m1", url: "https://vimeo.com/1241983353", poster_url: "https://i.vimeocdn.com/p.jpg" }],
    crm_staff: [{ user_id: "u1", full_name: "Laura" }]
  };
  const q = t => { const b = { data: rows[t], select() { return b; }, eq(k, v) { b.data = b.data.filter(r => r[k] === undefined || r[k] === v); return b; }, in(k, v) { b.data = b.data.filter(r => v.includes(r[k])); return b; }, order() { return b; }, limit(n) { b.data = b.data.slice(0, n); return b; }, then(r) { return Promise.resolve({ data: b.data, error: null }).then(r); } }; return b; };
  const db = () => ({ from: q, storage: { from: () => ({ createSignedUrl: async () => ({ data: { signedUrl: "https://x.supabase.co/signed.mp4" } }) }) } });
  const app = express(); mountMukPublic(app, { db });
  const srv = app.listen(0); const port = srv.address().port;
  try {
    const j = await (await fetch(`http://127.0.0.1:${port}/api/public/videos`)).json();
    assert.equal(j.data.length, 2);
    assert.equal(j.data[0].play, "vimeo"); assert.match(j.data[0].embed, /player\.vimeo\.com\/video\/1241983353/); assert.equal(j.data[0].author, "Laura");
    assert.equal(j.data[1].play, "video"); assert.equal(j.data[1].url, "https://x.supabase.co/signed.mp4"); assert.equal(j.data[1].author, "MUKTalent");
  } finally { srv.close(); }
});
