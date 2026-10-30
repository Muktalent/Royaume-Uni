import test from "node:test";
import assert from "node:assert/strict";
import { normaliseSocial, normaliseSocialSet, publicSocials } from "./social-links.mjs";
import { normaliseHandle, handleProblem, slugifyName } from "./card-links.mjs";

test("social usernames become canonical HTTPS profile links", () => {
  assert.equal(normaliseSocial("instagram", "@laura.muk").url, "https://www.instagram.com/laura.muk/");
  assert.equal(normaliseSocial("tiktok", "laura_muk").url, "https://www.tiktok.com/@laura_muk");
  assert.equal(normaliseSocial("x", "https://twitter.com/laura").url, "https://x.com/laura");
  assert.equal(normaliseSocial("linkedin", "https://www.linkedin.com/in/laura-martin-123/").url, "https://www.linkedin.com/in/laura-martin-123");
  assert.equal(normaliseSocial("youtube", "@MukTalent").url, "https://www.youtube.com/@MukTalent");
  assert.equal(normaliseSocial("whatsapp", "+212 6 12 34 56 78").url, "https://wa.me/212612345678");
  assert.equal(normaliseSocial("facebook", "facebook.com/profile.php?id=1000123456").url, "https://www.facebook.com/profile.php?id=1000123456");
  assert.equal(normaliseSocial("instagram", ""), null);
});

test("social links reject foreign hosts and script payloads", () => {
  for (const [platform, value] of [
    ["instagram", "https://evil.example/instagram.com"], ["linkedin", "javascript:alert(1)"],
    ["x", "<img src=x onerror=alert(1)>"], ["facebook", "https://facebook.com.evil.io/me"],
    ["whatsapp", "https://wa.me.evil.io/212600000000"], ["tiktok", "a b"], ["instagram", "https://user:pw@instagram.com/x"]
  ]) assert.throws(() => normaliseSocial(platform, value), undefined, platform + " " + value);
  assert.throws(() => normaliseSocialSet({ myspace: "x" }));
});

test("stored socials are re-validated before publication", () => {
  const out = publicSocials({ instagram: { value: "@a", url: "https://www.instagram.com/a/" }, x: { value: "@b", url: "javascript:alert(1)" }, tiktok: { url: "https://evil.io/@c" } });
  assert.deepEqual(out.map(s => s.platform), ["instagram"]);
});

test("short handles are normalised and validated", () => {
  assert.equal(normaliseHandle(" https://www.muktalent.com/Laura/ "), "laura");
  assert.equal(normaliseHandle("@Laura-M"), "laura-m");
  assert.equal(handleProblem("laura"), null);
  assert.ok(handleProblem("admin"));
  assert.ok(handleProblem("api"));
  assert.ok(handleProblem("la"));
  assert.ok(handleProblem("laura--m"));
  assert.ok(handleProblem("laura m"));
  assert.ok(handleProblem("lauría"));
  assert.ok(handleProblem("0c6f1b2e-1111-4111-8111-111111111111"));
  assert.equal(slugifyName("Laura Martín Núñez"), "laura-martin-nunez");
});
