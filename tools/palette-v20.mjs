// MUK Talent · v20 · Unified palette (Education + Healthcare, web and dashboards).
// Rewrites every colour in the site's own CSS / HTML / SVG / UI scripts to the brand palette:
//   Elegant Black #171717 · Soft Black #292929 · Pure White #FFFFFF
//   Warm Ivory #F7F5F0 · Champagne #B7A078 · Silver Grey #D9D9D6
// Status colours (errors, warnings, success) are kept so their meaning does not change.
// Third-party logos (certificates, partner brands, wallet passes) are never touched.
//
// Usage:  node tools/palette-v20.mjs          → rewrite files in place
//         node tools/palette-v20.mjs --check  → list files that still contain off-palette brand colours
// The script is idempotent: running it twice gives the same result.
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const CHECK = process.argv.includes("--check");

export const PALETTE = { black: "#171717", soft: "#292929", white: "#FFFFFF", ivory: "#F7F5F0", champagne: "#B7A078", silver: "#D9D9D6" };

const SKIP_DIRS = new Set(["node_modules", "web-dist", ".git", "supabase", "server", "seed", "fonts", "video", "i18n"]);
const SKIP_FILES = new Set([
  "admin/app.js", "personal-admin/app.js", "healthcare/portal/app.js", // bundles (rebuilt from admin-src)
  "assets/book/brands.js", "book/card-icons.js", // third-party brand colours
  "tools/palette-v20.mjs", "tools/wallet-assets.mjs", "tools/wallet-configure.mjs", "tools/wallet-create-google-class.mjs", "package-lock.json"
]);
const EXTRA_FILES = ["server/healthcare-mail.mjs"]; // e-mail template colours
const EXT = /\.(css|html|svg|js|mjs|webmanifest)$/i;

// ---------- colour maths ----------
function hexToRgb(h) {
  h = h.slice(1);
  if (h.length === 3 || h.length === 4) h = [...h].map(c => c + c).join("");
  const n = parseInt(h.slice(0, 6), 16);
  return { r: n >> 16 & 255, g: n >> 8 & 255, b: n & 255, a: h.length === 8 ? h.slice(6) : "" };
}
function rgbToHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: l * 100 };
  const d = max - min, s = l > .5 ? d / (2 - max - min) : d / (max + min);
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: h * 60, s: s * 100, l: l * 100 };
}
function hslToRgb({ h, s, l }) {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255) };
}
const toHex = ({ r, g, b }) => "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("").toUpperCase();
const P = Object.fromEntries(Object.entries(PALETTE).map(([k, v]) => [k, hexToRgb(v)]));
const isPalette = rgb => Object.values(P).some(p => p.r === rgb.r && p.g === rgb.g && p.b === rgb.b);

// Returns the palette version of an {r,g,b} colour (or the same colour when it is a status colour).
export function mapColour(rgb) {
  if (isPalette(rgb)) return rgb;
  const { r, g, b } = rgb;
  if (r === g && g === b) return rgb;                       // pure greys / black / white stay
  const { h, s, l } = rgbToHsl(rgb);
  // Colours this script already produced (keeps it idempotent).
  if (Math.abs(h - 60) < 3 && Math.abs(s - 3) < 1.5) return rgb;
  if (l >= 88 && Math.abs(h - 42) < 7 && s > 14 && s < 35) return rgb;
  if (Math.abs(h - 38) < 3 && Math.abs(s - 31) < 2.5) return rgb;
  const status =
    (s > 35 && (h < 25 || h >= 330) && l > 15 && l < 97) ||   // reds, oranges (errors, alerts)
    (s > 50 && h >= 25 && h < 58 && l < 96 && !(l > 30 && l < 75 && s <= 62) && !(l >= 86 && s < 65)) || // ambers / yellows (warnings)
    (s > 18 && h >= 85 && h < 158 && l > 12);                  // greens (success, online)
  if (status) return rgb;
  const warm = h >= 25 && h < 58 && s > 18;                   // golds → champagne family
  if (l >= 99) return P.white;
  if (l >= 90) {                                              // light tints → white / ivory family
    if (l >= 97.6) return P.white;
    if (l >= 94.2) return P.ivory;
    return hslToRgb({ h: 43, s: warm ? 30 : 22, l });
  }
  if (warm && l >= 82) return hslToRgb({ h: 38, s: 31, l });  // light champagne tints
  if (warm && l > 26 && l < 82) {                             // golds
    if (Math.abs(l - 59) <= 7) return P.champagne;
    return hslToRgb({ h: 38, s: 31, l });
  }
  if (s > 25 && l < 60 && h >= 158 && h < 300 && l >= 21) return P.soft; // brand accents (teal, navy, blue links) → Soft Black
  if (l < 13) return P.black;                                 // brand darks (teal, navy, ink)
  if (l < 21) return P.soft;
  if (l >= 82 && l <= 88) return P.silver;                    // lines and separators
  return hslToRgb({ h: 60, s: 3, l });                        // everything else → warm neutral grey
}

// ---------- rewriting ----------
function mapHex(match) {
  const rgb = hexToRgb(match), out = mapColour(rgb);
  if (out === rgb) return match;
  const hex = toHex(out);
  return match.length === 9 ? hex + rgb.a.toUpperCase() : hex;
}
function mapRgba(match, fn, body) {
  const parts = body.split(/\s*,\s*|\s+(?=[\d.])/).filter(Boolean);
  if (parts.length < 3 || parts.slice(0, 3).some(p => !/^\d+(\.\d+)?$/.test(p))) return match;
  const rgb = { r: +parts[0], g: +parts[1], b: +parts[2] }, out = mapColour(rgb);
  if (out === rgb) return match;
  const alpha = parts[3] !== undefined ? "," + parts[3].replace(/^\//, "") : "";
  return `${fn}(${out.r},${out.g},${out.b}${alpha})`;
}
const HEX_ANY = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/g;
const HEX6 = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6})\b/g;
const RGBA = /(rgba?)\(\s*([\d.\s,/%]+?)\s*\)/g;

export function rewrite(text, ext) {
  if (ext === ".css" || ext === ".svg") return text.replace(HEX_ANY, mapHex).replace(RGBA, mapRgba);
  if (ext === ".html") return text
    .replace(HEX6, mapHex)
    .replace(/((?::|content=")\s*)(#[0-9a-fA-F]{3})\b/g, (m, pre, hex) => pre + mapHex(hex))
    .replace(RGBA, mapRgba);
  return text.replace(HEX6, mapHex).replace(RGBA, mapRgba); // scripts: 6/8-digit hex only (3-digit could be an id)
}

async function* walk(dir, rel = "") {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".")) continue;
    const r = path.posix.join(rel, e.name);
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) yield* walk(path.join(dir, e.name), r); }
    else if (EXT.test(e.name) && !SKIP_FILES.has(r) && !/\.test\.mjs$/.test(e.name)) yield r;
  }
}

async function main() {
  let changed = 0;
  const files = [];
  for await (const f of walk(root)) files.push(f);
  files.push(...EXTRA_FILES);
  for (const f of files) {
    const full = path.join(root, f), before = await readFile(full, "utf8"), after = rewrite(before, path.extname(f).toLowerCase());
    if (after !== before) { changed++; if (CHECK) console.log("off-palette:", f); else await writeFile(full, after); }
  }
  console.log(CHECK ? `${changed} file(s) still need the v20 palette.` : `v20 palette applied to ${changed} file(s).`);
  if (CHECK && changed) process.exitCode = 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
