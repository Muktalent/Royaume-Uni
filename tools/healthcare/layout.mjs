// MUKTalent Healthcare · static page shell (header, footer, head). English source; translations applied client-side.
export const SITE = "https://www.muktalent.com";
export const BASE = "/healthcare";
export const V = "19.0.0";
export const COMPANY = {
  legal: "MAGHREB UK TALENT LTD",
  number: "16987132",
  office: "Flat 3b Flitton House, The Sutton Estate, London, England, N1 1UG",
  email: "agents@muktalent.com",
  phone: "+44 73 1187 4281",
  tel: "+447311874281",
  ch: "https://find-and-update.company-information.service.gov.uk/company/16987132"
};

const P = {
  arrow: '<path d="M5 12h13M13 6l6 6-6 6"/>',
  ext: '<path d="M7 17 17 7M9 7h8v8"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.6 3.9 5.6 3.9 9s-1.3 6.4-3.9 9c-2.6-2.6-3.9-5.6-3.9-9S9.4 5.6 12 3Z"/>',
  user: '<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c1.3-3.6 4.1-5.4 7.5-5.4s6.2 1.8 7.5 5.4"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m4 7 8 6 8-6"/>',
  phone: '<path d="M5 3.5h3.2l1.6 4.3-2.1 1.4a11.5 11.5 0 0 0 7.1 7.1l1.4-2.1 4.3 1.6V19a1.8 1.8 0 0 1-1.9 1.8A16.6 16.6 0 0 1 3.2 5.4 1.8 1.8 0 0 1 5 3.5Z"/>',
  pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.4"/>',
  shield: '<path d="M12 3 5 6v5c0 4.6 3 8.4 7 10 4-1.6 7-5.4 7-10V6Z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
  scale: '<path d="M12 4v16M7 20h10M5 8h14M5 8l-3 6a3 3 0 0 0 6 0Zm14 0-3 6a3 3 0 0 0 6 0Z"/>',
  doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
  check: '<path d="m5 12.5 4.2 4.2L19 7"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.6v.2"/>',
  people: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3 19c.9-3 3.2-4.6 6-4.6s5.1 1.6 6 4.6"/><path d="M15.5 5.6a3 3 0 0 1 0 5.8M17.6 14.6c1.6.6 2.8 2 3.4 4.4"/>',
  building: '<path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16M15 9h4a1 1 0 0 1 1 1v11M3 21h18M8 8h3M8 12h3M8 16h3"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5Z"/>',
  chat: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H11l-5 4v-4A2.5 2.5 0 0 1 4 13.5Z"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  pound: '<path d="M16 6.5A3.5 3.5 0 0 0 9.5 8v4.5c0 2.4-.8 4.6-2.5 6.5h11M7 12.5h7"/>',
  badge: '<circle cx="12" cy="9" r="5.5"/><path d="m9 14-1.5 7L12 19l4.5 2L15 14"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5M4 16v2.5A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5V16"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/>',
  lock: '<rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  route: '<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5"/>',
  close: '<path d="M5 5l14 14M19 5 5 19"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 12.5h18"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  star: '<path d="M12 3.5 14.6 9l6 .6-4.5 4 1.3 6-5.4-3.2L6.6 19.6l1.3-6-4.5-4 6-.6Z"/>'
};
export const icon = (n, cls = "") => `<svg${cls ? ` class="${cls}"` : ""} viewBox="0 0 24 24" aria-hidden="true" focusable="false">${P[n] || ""}</svg>`;
export const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const NAV = [
  ["home", "/", "Home"],
  ["candidates", "/candidates/", "For Candidates"],
  ["employers", "/employers/", "For Employers"],
  ["professions", "/professions/", "Healthcare Professions"],
  ["process", "/recruitment-process/", "Our Recruitment Process"],
  ["ethics", "/ethical-recruitment/", "Ethical Recruitment"],
  ["about", "/about/", "About Us"],
  ["contact", "/contact/", "Contact"]
];
const href = p => BASE + p;
export const img = (name, alt, { eager = false, sizes = "(max-width: 980px) 100vw, 50vw", w = 1600, h = 1067 } = {}) =>
  `<img src="${BASE}/assets/img/${name}-1600.webp" srcset="${BASE}/assets/img/${name}-800.webp 800w, ${BASE}/assets/img/${name}-1600.webp 1600w" sizes="${sizes}" width="${w}" height="${h}" alt="${esc(alt)}"${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async">`;

export const brand = (light = false) => `<a class="hc-brand" href="${BASE}/" aria-label="MUKTalent Healthcare – home"><img class="mark" src="${BASE}/assets/img/${light ? "mark-light" : "mark"}.svg" width="42" height="42" alt=""><span class="hc-brand-txt" translate="no"><b>MUKTALENT</b><span>Healthcare</span></span></a>`;

function header(active) {
  const links = NAV.map(([k, p, l]) => `<li><a href="${href(p)}"${k === active ? ' aria-current="page"' : ""}>${l}</a></li>`).join("");
  const drawer = NAV.map(([k, p, l], i) => `<a href="${href(p)}"${k === active ? ' aria-current="page"' : ""}><span>${l}</span><small>0${i + 1}</small></a>`).join("");
  return `<a class="hc-skip" href="#main">Skip to content</a>
<div class="hc-top"><div class="hc-wrap"><div class="hc-top-div"><span class="long">A division of</span> <a href="/" translate="no"><b>MUKTalent</b></a><span class="long" aria-hidden="true">·</span><span class="long">UK-based recruitment, London</span></div>
<div class="hc-top-tools"><a href="mailto:${COMPANY.email}" class="long" translate="no">${COMPANY.email}</a><div class="hc-lang"><button class="hc-lang-btn" type="button" aria-haspopup="true" aria-expanded="false" data-lang-btn>${icon("globe")}<span data-lang-current translate="no">English</span></button><ul class="hc-lang-menu" hidden data-lang-menu translate="no">
<li><button type="button" data-set-lang="en" lang="en">English <small>EN</small></button></li><li><button type="button" data-set-lang="es" lang="es">Español <small>ES</small></button></li><li><button type="button" data-set-lang="fr" lang="fr">Français <small>FR</small></button></li><li><button type="button" data-set-lang="ar" lang="ar" dir="rtl">العربية <small>AR</small></button></li></ul></div></div></div></div>
<header class="hc-head" data-head><div class="hc-wrap"><div class="hc-head-row">${brand()}
<div class="hc-head-cta"><a class="hc-btn hc-btn-line hc-btn-sm" href="${href("/employers/#enquiry")}">Discuss Your Recruitment Needs</a><a class="hc-btn hc-btn-gold hc-btn-sm" href="${href("/register/")}">Register as a Candidate</a><button class="hc-burger" type="button" aria-expanded="false" aria-controls="hcDrawer" data-burger><span class="bars" aria-hidden="true"><i></i><i></i><i></i></span><span>Menu</span></button></div></div>
<nav class="hc-nav" aria-label="Healthcare navigation"><ul>${links}<li class="push"><a class="hc-nav-portal" href="${href("/portal/")}">${icon("user")}<span>Sign in</span></a></li></ul></nav></div></header>
<div class="hc-drawer" id="hcDrawer" data-drawer aria-hidden="true"><div class="hc-drawer-bg" data-close></div><div class="hc-drawer-panel" role="dialog" aria-modal="true" aria-label="Menu"><div class="hc-drawer-top">${brand()}<button class="hc-drawer-close" type="button" data-close aria-label="Close menu">${icon("close")}</button></div><nav aria-label="Healthcare navigation (mobile)">${drawer}<a href="${href("/vacancies/")}"><span>Vacancies</span><small>—</small></a><a href="${href("/portal/")}"><span>Sign in</span><small>—</small></a></nav><div class="hc-drawer-cta"><a class="hc-btn hc-btn-gold" href="${href("/register/")}">Register as a Candidate</a><a class="hc-btn hc-btn-line" href="${href("/employers/#enquiry")}">Discuss Your Recruitment Needs</a></div></div></div>`;
}

function footer() {
  return `<footer class="hc-foot"><div class="hc-wrap"><div class="hc-foot-grid"><div class="hc-foot-brand">${brand(true)}<p>The healthcare recruitment division of MUKTalent. We connect international healthcare professionals with UK employers through an ethical, transparent and professional process.</p>
<ul class="hc-foot-contact"><li>${icon("mail")}<a href="mailto:${COMPANY.email}" translate="no">${COMPANY.email}</a></li><li>${icon("phone")}<a href="tel:${COMPANY.tel}" dir="ltr" translate="no">${COMPANY.phone}</a></li><li>${icon("pin")}<span>London, United Kingdom</span></li></ul></div>
<nav aria-label="Healthcare"><h3>Healthcare</h3><a href="${href("/about/")}">About Us</a><a href="${href("/candidates/")}">For Candidates</a><a href="${href("/employers/")}">For Employers</a><a href="${href("/professions/")}">Healthcare Professions</a><a href="${href("/recruitment-process/")}">Our Recruitment Process</a><a href="${href("/vacancies/")}">Vacancies</a><a href="${href("/contact/")}">Contact</a></nav>
<nav aria-label="Responsible recruitment"><h3>Responsible recruitment</h3><a href="${href("/ethical-recruitment/")}">Ethical Recruitment</a><a href="${href("/policies/")}">Policies</a><a href="${href("/complaints/")}">Complaints Procedure</a><a href="${href("/policies/data-protection/")}">How we protect your data</a><a href="${href("/portal/")}">Candidate portal</a></nav>
<nav aria-label="Legal"><h3>Legal</h3><a href="${href("/privacy/")}">Privacy Policy</a><a href="${href("/candidate-privacy/")}">Candidate Privacy Notice</a><a href="${href("/employee-privacy/")}">Employee Privacy Notice</a><a href="${href("/cookies/")}">Cookie Policy</a><a href="${href("/terms/")}">Terms and Conditions</a></nav></div>
<nav class="hc-divisions" aria-label="Our Divisions"><span>Our Divisions</span><a href="/" translate="no">Education${icon("ext")}</a><i aria-hidden="true"></i><a href="${href("/")}" class="is-current" aria-current="true" translate="no">Healthcare</a></nav>
<div class="hc-foot-legal"><p>© <span data-year>2026</span> <span translate="no">${COMPANY.legal}</span>, trading as MUKTalent Healthcare. Registered in England and Wales, company number <a href="${COMPANY.ch}" rel="noopener" target="_blank" translate="no">${COMPANY.number}</a>. Registered office: <span translate="no">${COMPANY.office}</span>.</p>
<nav aria-label="Footer legal"><a href="${href("/privacy/")}">Privacy</a><a href="${href("/cookies/")}">Cookies</a><button type="button" data-cookie-settings>Cookie settings</button><a href="${href("/complaints/")}">Complaints</a></nav></div></div></footer>
<div class="hc-cookie" data-cookie hidden role="dialog" aria-labelledby="hcCookieT" aria-live="polite"><h2 id="hcCookieT">Your privacy choices</h2><p>We use essential cookies to run this website and remember your language. With your permission we would also use analytics to understand how pages are used. <a href="${href("/cookies/")}">Cookie Policy</a></p>
<div class="hc-cookie-opts" data-cookie-opts hidden><label><input type="checkbox" checked disabled> <span>Essential – always on (security, language, this choice)</span></label><label><input type="checkbox" data-cookie-analytics> <span>Analytics – anonymous usage measurement</span></label></div>
<div class="hc-cookie-actions"><button class="hc-btn hc-btn-line" type="button" data-cookie-custom>Manage</button><button class="hc-btn hc-btn-line" type="button" data-cookie-reject>Essential only</button><button class="hc-btn hc-btn-teal" type="button" data-cookie-accept>Accept all</button></div></div>`;
}

export function page({ path, active = "", title, description, body, jsonld = null, noindex = false, scripts = [] }) {
  const url = SITE + BASE + path;
  const fullTitle = path === "/" ? title : `${title} · MUKTalent Healthcare`;
  return `<!doctype html>
<html lang="en" dir="ltr" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
${noindex ? '<meta name="robots" content="noindex, follow">' : '<meta name="robots" content="index, follow, max-image-preview:large">'}
<meta name="theme-color" content="#F6F5EF">
<meta property="og:type" content="website"><meta property="og:site_name" content="MUKTalent Healthcare"><meta property="og:title" content="${esc(fullTitle)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${SITE}${BASE}/assets/img/og.jpg"><meta property="og:locale" content="en_GB">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${BASE}/assets/img/mark.svg" type="image/svg+xml">
<link rel="preload" href="${BASE}/assets/fonts/fraunces-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${BASE}/assets/fonts/instrument-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${BASE}/assets/css/hc.css?v=${V}">
<link rel="stylesheet" href="/assets/brand/muk-mobile.css?v=21.0.0">
<script src="${BASE}/assets/js/hc-pre.js?v=${V}"></script>
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ""}
</head>
<body data-page="${active}">
${header(active)}
<main id="main">
${body}
</main>
${footer()}
<script src="${BASE}/assets/js/hc.js?v=${V}" defer></script>
${scripts.map(s => `<script src="${BASE}/assets/js/${s}?v=${V}" defer></script>`).join("\n")}
</body>
</html>
`;
}

export const kicker = (n, label) => `<p class="hc-kicker"><span class="n"${/^[0-9ivx]+$/.test(n) ? ' translate="no"' : ""}>${n}</span><span>${label}</span></p>`;
export const crumbs = items => `<ol class="hc-crumbs">${items.map(([l, p]) => p ? `<li><a href="${BASE}${p}">${l}</a></li>` : `<li aria-current="page">${l}</li>`).join("")}</ol>`;
export const btn = (label, p, cls = "hc-btn-teal", ic = "arrow") => `<a class="hc-btn ${cls}" href="${p.startsWith("http") || p.startsWith("mailto") ? p : BASE + p}">${label}${ic ? icon(ic) : ""}</a>`;
export const note = (html, cls = "", ic = "info") => `<div class="hc-note ${cls}">${icon(ic)}<div>${html}</div></div>`;
