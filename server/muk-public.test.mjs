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
