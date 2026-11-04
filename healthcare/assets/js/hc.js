/* MUKTalent Healthcare – site runtime: languages, navigation, cookie consent, reveal, filters. */
(() => {
"use strict";
const d = document, root = d.documentElement, BASE = "/healthcare";
const LANGS = { en: "English", es: "Español", fr: "Français", ar: "العربية" };
const GA_ID = "G-NNKDFY3JW2";
const params = new URLSearchParams(location.search);
let lang = "en";
try { lang = params.get("lang") || localStorage.getItem("hc_lang") || "en"; } catch {}
if (!LANGS[lang]) lang = "en";
if (params.get("lang")) try { localStorage.setItem("hc_lang", lang); } catch {}
window.HC_LANG = lang;
window.HC_I18N = window.HC_I18N || {};

/* ---------- i18n ---------- */
const INLINE = new Set(["B", "STRONG", "EM", "I", "A", "SPAN", "SMALL", "BR", "CODE", "ABBR", "TIME", "SUP"]);
const SKIP = "script,style,svg,noscript,[translate=no],[data-no-i18n],template";
const norm = s => s.replace(/\s+/g, " ").trim();
const collect = params.has("hc_collect");
const keys = collect ? (window.__HC_KEYS = new Set()) : null;
let dict = {};
const fmt = (s, v) => v ? s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? "") : s;
window.hcT = (s, v) => { if (keys) keys.add(s); return fmt(dict[s] || s, v); };
const hasText = el => !el.children.length ? /[A-Za-z]/.test(el.textContent) : [...el.childNodes].some(c => c.nodeType === 3 && /[A-Za-z]/.test(c.nodeValue));
function isUnit(el) {
  for (const c of el.childNodes) {
    if (c.nodeType === 3) continue;
    if (c.nodeType !== 1) continue;
    if (!INLINE.has(c.tagName)) return false;
    if (c.tagName !== "BR" && !isUnit(c)) return false;
  }
  return true;
}
function tr(key) { if (keys) { keys.add(key); return null; } return dict[key] || null; }
function walk(el) {
  if (el.nodeType !== 1 || el.matches(SKIP)) return;
  attrs(el);
  if (el.childNodes.length && isUnit(el) && hasText(el)) {
    const raw = el.children.length ? norm(el.innerHTML) : norm(el.textContent);
    const t = tr(raw);
    if (t) { if (el.children.length || /<[a-z]/i.test(t)) el.innerHTML = t; else el.textContent = t; }
    el.querySelectorAll("*").forEach(attrs);
    return;
  }
  for (const c of [...el.childNodes]) {
    if (c.nodeType === 1) walk(c);
    else if (c.nodeType === 3 && /[A-Za-z]/.test(c.nodeValue)) {
      const k = norm(c.nodeValue), t = tr(k);
      if (t) c.nodeValue = c.nodeValue.replace(k, t);
    }
  }
}
function attrs(el) {
  for (const a of ["placeholder", "aria-label", "title", "alt"]) {
    const v = el.getAttribute(a);
    if (v && /[A-Za-z]/.test(v)) { const t = tr(norm(v)); if (t) el.setAttribute(a, t); }
  }
}
window.hcTranslate = node => { if (lang !== "en" || keys) walk(node); };
function loadDict() {
  return new Promise(res => {
    if (lang === "en") return res();
    const s = d.createElement("script");
    s.src = `${BASE}/assets/i18n/${lang}.js?v=19.0.0`;
    s.onload = () => { dict = window.HC_I18N[lang] || {}; res(); };
    s.onerror = () => res();
    d.head.appendChild(s);
  });
}
const ready = loadDict().then(() => {
  root.lang = lang; root.dir = lang === "ar" ? "rtl" : "ltr";
  if (lang !== "en" || collect) {
    walk(d.body);
    const t = tr(norm(d.title.replace(/ · MUKTalent Healthcare$/, "")));
    if (t) d.title = d.title.includes(" · ") ? `${t} · MUKTalent Healthcare` : t;
    d.querySelectorAll("[data-lang-note]").forEach(n => n.hidden = false);
  }
  root.classList.remove("hc-i18n-wait");
  d.dispatchEvent(new CustomEvent("hc:i18n-ready"));
});
window.hcReady = ready;

/* ---------- language menu ---------- */
const lbtn = d.querySelector("[data-lang-btn]"), lmenu = d.querySelector("[data-lang-menu]");
const cur = d.querySelector("[data-lang-current]");
if (cur) cur.textContent = LANGS[lang];
if (lbtn && lmenu) {
  const close = () => { lmenu.hidden = true; lbtn.setAttribute("aria-expanded", "false"); };
  lbtn.addEventListener("click", e => { e.stopPropagation(); const o = lmenu.hidden; lmenu.hidden = !o; lbtn.setAttribute("aria-expanded", String(o)); if (o) lmenu.querySelector(`[data-set-lang="${lang}"]`)?.focus(); });
  d.addEventListener("click", e => { if (!lmenu.contains(e.target)) close(); });
  d.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
  lmenu.querySelectorAll("[data-set-lang]").forEach(b => {
    if (b.dataset.setLang === lang) b.setAttribute("aria-current", "true");
    b.addEventListener("click", () => {
      try { localStorage.setItem("hc_lang", b.dataset.setLang); } catch {}
      const u = new URL(location.href); u.searchParams.delete("lang"); location.href = u.toString();
    });
  });
}

/* ---------- header and drawer ---------- */
const head = d.querySelector("[data-head]");
if (head) { const on = () => head.classList.toggle("is-scrolled", scrollY > 40); on(); addEventListener("scroll", on, { passive: true }); }
const drawer = d.querySelector("[data-drawer]"), burger = d.querySelector("[data-burger]");
if (drawer && burger) {
  const set = o => { drawer.classList.toggle("open", o); drawer.setAttribute("aria-hidden", String(!o)); burger.setAttribute("aria-expanded", String(o)); d.body.style.overflow = o ? "hidden" : ""; if (o) drawer.querySelector(".hc-drawer-close")?.focus(); else burger.focus(); };
  burger.addEventListener("click", () => set(true));
  drawer.querySelectorAll("[data-close]").forEach(b => b.addEventListener("click", () => set(false)));
  d.addEventListener("keydown", e => { if (e.key === "Escape" && drawer.classList.contains("open")) set(false); });
}
ready.then(() => d.querySelectorAll("[data-year]").forEach(n => n.textContent = new Date().getFullYear()));

/* ---------- cookie consent ---------- */
const KEY = "hc_consent", TTL = 180 * 864e5;
const getC = () => { try { const v = JSON.parse(localStorage.getItem(KEY)); return v && Date.now() - v.at < TTL ? v : null; } catch { return null; } };
let gaLoaded = false;
function analytics() {
  if (gaLoaded || !/^G-[A-Z0-9]{6,}$/.test(GA_ID)) return;
  gaLoaded = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { dataLayer.push(arguments); };
  gtag("js", new Date()); gtag("config", GA_ID, { anonymize_ip: true, page_path: location.pathname });
  const s = d.createElement("script"); s.async = true; s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`; d.head.appendChild(s);
}
const banner = d.querySelector("[data-cookie]");
const save = a => { try { localStorage.setItem(KEY, JSON.stringify({ analytics: !!a, at: Date.now(), v: 1 })); } catch {} if (banner) banner.hidden = true; if (a) analytics(); };
const c = getC();
if (c?.analytics) analytics();
if (banner) {
  const opts = banner.querySelector("[data-cookie-opts]"), box = banner.querySelector("[data-cookie-analytics]"), custom = banner.querySelector("[data-cookie-custom]");
  if (!c) ready.then(() => setTimeout(() => banner.hidden = false, 600));
  banner.querySelector("[data-cookie-accept]")?.addEventListener("click", () => save(opts && !opts.hidden ? box.checked : true));
  banner.querySelector("[data-cookie-reject]")?.addEventListener("click", () => save(false));
  custom?.addEventListener("click", () => { opts.hidden = false; custom.hidden = true; const a = banner.querySelector("[data-cookie-accept]"); a.textContent = hcT("Save choices"); });
  d.querySelectorAll("[data-cookie-settings]").forEach(b => b.addEventListener("click", () => { const v = getC(); box.checked = !!v?.analytics; opts.hidden = false; if (custom) custom.hidden = true; banner.querySelector("[data-cookie-accept]").textContent = hcT("Save choices"); banner.hidden = false; }));
}

/* ---------- reveal ---------- */
const rv = d.querySelectorAll(".hc-rv");
if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px", threshold: .08 });
  rv.forEach(n => io.observe(n));
} else rv.forEach(n => n.classList.add("in"));

/* ---------- profession filter ---------- */
const chips = d.querySelectorAll("[data-prof-filter]");
chips.forEach(b => b.addEventListener("click", () => {
  chips.forEach(x => x.setAttribute("aria-pressed", String(x === b)));
  const g = b.dataset.profFilter;
  d.querySelectorAll(".hc-prof[data-group]").forEach(p => { p.hidden = g !== "all" && p.dataset.group !== g; p.classList.add("in"); });
}));

/* ---------- team (filled only with real, approved staff in assets/team.json) ---------- */
const team = d.querySelector("[data-team]");
if (team) fetch(`${BASE}/assets/team.json`, { cache: "no-cache" }).then(r => r.ok ? r.json() : []).then(list => {
  if (!Array.isArray(list) || !list.length) return;
  const e = s => String(s ?? "").replace(/[&<>"]/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
  team.innerHTML = list.map(p => `<article class="hc-card hc-person">${p.photo ? `<img src="${e(p.photo)}" alt="${e(p.name)}" width="400" height="400" loading="lazy">` : ""}<h3 translate="no">${e(p.name)}</h3><p class="role">${e(p.role)}</p>${p.bio ? `<p>${e(p.bio)}</p>` : ""}${p.linkedin ? `<a class="hc-link" href="${e(p.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>` : ""}</article>`).join("");
  ready.then(() => hcTranslate(team));
  team.closest("[data-team-section]").hidden = false;
}).catch(() => {});
})();
