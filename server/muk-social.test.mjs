import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { shortName, directKey, parseThread, cloudinarySignature, videoKind, embedInfo, vimeoMeta, cloudinaryPoster, messageSchema, postSchema } from "./muk-social.mjs";

test("student names are shortened for other students", () => {
  assert.equal(shortName("Amina Ben Salah"), "Amina S.");
  assert.equal(shortName("Youssef"), "Youssef");
  assert.equal(shortName(""), "Student");
});
test("direct key is order independent", () => { assert.equal(directKey("b", "a"), directKey("a", "b")); });
test("thread ids are strict", () => {
  const id = "3f2a8f1e-7c1b-4d2a-9a5b-0c6f4e1d2b3a";
  assert.deepEqual(parseThread("gp:" + id), { kind: "gp", id });
  assert.deepEqual(parseThread("gp_" + id), { kind: "gp", id });
  assert.deepEqual(parseThread("mk%3A" + id), { kind: "mk", id });
  assert.throws(() => parseThread("%E0%A4%A"));
  assert.throws(() => parseThread("xx:" + id));
  assert.throws(() => parseThread("mk:../../etc"));
});
test("cloudinary signature follows the documented algorithm", () => {
  const sig = cloudinarySignature({ timestamp: 1315060510, folder: "muktalent/x", api_key: "k", file: "f" }, "abcd");
  assert.equal(sig, createHash("sha1").update("folder=muktalent/x&timestamp=1315060510abcd").digest("hex"));
});
test("video kinds and posters", () => {
  assert.equal(videoKind("https://res.cloudinary.com/demo/video/upload/v1/a.mp4"), "video");
  assert.equal(videoKind("https://youtu.be/abc"), "link");
  assert.equal(videoKind("http://x.com/a.mp4"), "link");
  assert.equal(cloudinaryPoster("https://res.cloudinary.com/demo/video/upload/v1/f/a.mp4"), "https://res.cloudinary.com/demo/video/upload/so_1,w_960,c_limit/v1/f/a.jpg");
  assert.equal(cloudinaryPoster("https://example.com/a.mp4"), null);
});
test("message and post validation", () => {
  assert.ok(messageSchema.safeParse({ body: "Hola" }).success);
  assert.ok(messageSchema.safeParse({ audio_path: "u/a.webm", audio_ms: 4000 }).success);
  assert.ok(!messageSchema.safeParse({ body: "" }).success);
  assert.ok(!postSchema.safeParse({ kind: "video", title: "Sin vídeo" }).success);
  assert.ok(!postSchema.safeParse({ kind: "live", title: "Directo" }).success);
  assert.ok(postSchema.safeParse({ kind: "video", title: "Visa", media_url: "https://res.cloudinary.com/d/video/upload/a.mp4" }).success);
  assert.ok(!postSchema.safeParse({ kind: "news", title: "x", media_url: "javascript:alert(1)" }).success);
});

test("vimeo and youtube links become safe embeds", () => {
  const snippet = '<div style="padding:56.25% 0 0 0;position:relative;"><iframe src="https://player.vimeo.com/video/1241983353?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479" frameborder="0"></iframe></div><script src="https://player.vimeo.com/api/player.js"></script>';
  assert.equal(embedInfo(snippet).id, "1241983353");
  assert.equal(embedInfo(snippet).url, "https://player.vimeo.com/video/1241983353");
  const unlisted = embedInfo("https://vimeo.com/1241983353/ab12cd34ef");
  assert.equal(unlisted.hash, "ab12cd34ef"); assert.match(unlisted.src, /h=ab12cd34ef/);
  assert.equal(embedInfo("https://player.vimeo.com/video/123456?h=9f8e7d").hash, "9f8e7d");
  assert.equal(embedInfo("https://youtu.be/dQw4w9WgXcQ").provider, "youtube");
  assert.equal(embedInfo("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=3").id, "dQw4w9WgXcQ");
  assert.equal(embedInfo("http://vimeo.com/123456"), null);
  assert.equal(embedInfo("https://evil.com/vimeo.com/123456"), null);
  assert.equal(videoKind("https://vimeo.com/1241983353"), "vimeo");
  assert.equal(videoKind("https://youtu.be/dQw4w9WgXcQ"), "youtube");
});
test("vimeo metadata uses the API token, then oEmbed", async () => {
  const calls = [];
  const fetchImpl = async (u, o) => { calls.push([u, o?.headers?.authorization]); return { ok: true, json: async () => ({ name: "Campus tour", duration: 1830, player_embed_url: "https://player.vimeo.com/video/1241983353?h=abc123", pictures: { sizes: [{ width: 640, link: "https://i.vimeocdn.com/x_640.jpg" }] } }) }; };
  const m = await vimeoMeta("https://vimeo.com/1241983353", { fetchImpl, token: "t0k" });
  assert.equal(m.title, "Campus tour"); assert.equal(m.duration, 1830); assert.equal(m.hash, "abc123"); assert.equal(calls[0][1], "bearer t0k");
  const o = await vimeoMeta("https://vimeo.com/1241983353", { fetchImpl: async () => ({ ok: true, json: async () => ({ title: "Tour", thumbnail_url: "https://i.vimeocdn.com/v_295x166", duration: 60 }) }), token: "" });
  assert.equal(o.title, "Tour"); assert.equal(o.poster, "https://i.vimeocdn.com/v_960");
});
