import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { shortName, directKey, parseThread, cloudinarySignature, videoKind, cloudinaryPoster, messageSchema, postSchema } from "./muk-social.mjs";

test("student names are shortened for other students", () => {
  assert.equal(shortName("Amina Ben Salah"), "Amina S.");
  assert.equal(shortName("Youssef"), "Youssef");
  assert.equal(shortName(""), "Student");
});
test("direct key is order independent", () => { assert.equal(directKey("b", "a"), directKey("a", "b")); });
test("thread ids are strict", () => {
  const id = "3f2a8f1e-7c1b-4d2a-9a5b-0c6f4e1d2b3a";
  assert.deepEqual(parseThread("gp:" + id), { kind: "gp", id });
  assert.throws(() => parseThread("xx:" + id));
  assert.throws(() => parseThread("mk:../../etc"));
});
test("cloudinary signature follows the documented algorithm", () => {
  const sig = cloudinarySignature({ timestamp: 1315060510, folder: "muktalent/x", api_key: "k", file: "f" }, "abcd");
  assert.equal(sig, createHash("sha1").update("folder=muktalent/x&timestamp=1315060510abcd").digest("hex"));
});
test("video kinds and posters", () => {
  assert.equal(videoKind("https://res.cloudinary.com/demo/video/upload/v1/a.mp4"), "video");
  assert.equal(videoKind("https://youtu.be/abc"), "embed");
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
