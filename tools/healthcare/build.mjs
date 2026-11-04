// Builds the static MUKTalent Healthcare website into /healthcare/.
import { mkdir, writeFile, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import * as P from "./pages.mjs";
import { DOCS, docPage, policiesIndex } from "./legal.mjs";
import { SITE, BASE } from "./layout.mjs";

const root = fileURLToPath(new URL("../../healthcare/", import.meta.url));
const pages = [
  ["/", P.home], ["/candidates/", P.candidates], ["/employers/", P.employers], ["/professions/", P.professions],
  ["/recruitment-process/", P.process], ["/ethical-recruitment/", P.ethics], ["/about/", P.about], ["/contact/", P.contact],
  ["/register/", P.register], ["/vacancies/", P.vacancies], ["/complaints/", P.complaints], ["/policies/", policiesIndex],
  ...DOCS.map(d => [d.path, () => docPage(d)])
];
const urls = [];
for (const [p, fn] of pages) {
  const html = fn();
  const m = html.match(/<link rel="canonical" href="([^"]+)"/);
  if (!m || !m[1].endsWith(BASE + p)) throw new Error(`Path mismatch for ${p}: ${m && m[1]}`);
  const dir = path.join(root, p);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "index.html"), html);
  if (!/noindex/.test(html)) urls.push(SITE + BASE + p);
}
const today = new Date().toISOString().slice(0, 10);
await writeFile(path.join(root, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `<url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join("\n")}\n</urlset>\n`);
const team = path.join(root, "assets/team.json");
try { await access(team); } catch { await writeFile(team, "[]\n"); }
const og = path.join(root, "assets/img/og.jpg");
try { await access(og); } catch {
  try {
    const sharp = (await import("sharp")).default;
    await sharp(path.join(root, "assets/img/hc-hero-1600.webp")).resize(1200, 630, { fit: "cover", position: "attention" }).jpeg({ quality: 82, mozjpeg: true }).toFile(og);
  } catch (e) { console.warn("og.jpg not generated:", e.message); }
}
console.log(`Healthcare build: ${pages.length} pages, sitemap with ${urls.length} URLs.`);

// ---------- translations: keys.json + <lang>.tsv  ->  assets/i18n/<lang>.js ----------
{
  const { readFile } = await import("node:fs/promises");
  const dir = fileURLToPath(new URL("./i18n/", import.meta.url));
  const keys = JSON.parse(await readFile(path.join(dir, "keys.json"), "utf8"));
  const tags = s => (s.match(/<[^>]+>/g) || []).map(t => t.replace(/\s+/g, " ")).sort().join("|");
  await mkdir(path.join(root, "assets/i18n"), { recursive: true });
  for (const lang of ["es", "fr", "ar"]) {
    let tsv; try { tsv = await readFile(path.join(dir, `${lang}.tsv`), "utf8"); } catch { console.warn(`No ${lang}.tsv yet`); continue; }
    const dict = {}, problems = [];
    for (const line of tsv.split("\n")) {
      if (!line.trim()) continue;
      const tab = line.indexOf("\t"), i = Number(line.slice(0, tab)), val = line.slice(tab + 1).trim();
      const key = keys[i];
      if (key === undefined) { problems.push(`#${i} unknown index`); continue; }
      if (tags(key) !== tags(val)) problems.push(`#${i} tag mismatch`);
      if ((key.match(/\{\w+\}/g) || []).join() !== (val.match(/\{\w+\}/g) || []).join()) problems.push(`#${i} placeholder mismatch`);
      dict[key] = val;
    }
    const missing = keys.filter(k => !(k in dict)).length;
    if (problems.length) throw new Error(`${lang}: ${problems.join(", ")}`);
    await writeFile(path.join(root, `assets/i18n/${lang}.js`), `/* MUKTalent Healthcare – ${lang} */\nwindow.HC_I18N=window.HC_I18N||{};window.HC_I18N[${JSON.stringify(lang)}]=${JSON.stringify(dict)};\n`);
    console.log(`i18n ${lang}: ${Object.keys(dict).length} strings${missing ? `, ${missing} missing` : ""}`);
  }
}
