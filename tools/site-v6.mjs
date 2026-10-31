// MUK Talent – public site v6 (motion, dark mode, FR/EN/ES/AR, assistant, new footer).
// Idempotent: run `node tools/site-v6.mjs` as many times as needed; pages already upgraded are refreshed, never duplicated.
import {readFile,writeFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import path from "node:path";
const root=fileURLToPath(new URL("../",import.meta.url));
const pages=["index.html","about-us/index.html","complaints/index.html","contact/index.html","cookies/index.html","evaluation/index.html","institutions/index.html","legal/index.html","privacy/index.html","services/index.html","services/accommodation-support/index.html","services/document-translation/index.html","services/student-visa-support/index.html","services/university-applications/index.html","terms/index.html"];
const V="6.0.0";
const icon={
 sun:'<svg class="v6-i-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6"/></svg>',
 moon:'<svg class="v6-i-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.2 14.6A8.5 8.5 0 0 1 9.4 3.8a8.5 8.5 0 1 0 10.8 10.8Z"/></svg>',
 globe:'<svg class="v6-i-globe" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.6 3.9 5.6 3.9 9s-1.3 6.4-3.9 9c-2.6-2.6-3.9-5.6-3.9-9S9.4 5.6 12 3Z"/></svg>',
 chev:'<svg class="v6-i-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>',
 mail:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m4 7 8 6 8-6"/></svg>',
 phone:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3.5h3.2l1.6 4.3-2.1 1.4a11.5 11.5 0 0 0 7.1 7.1l1.4-2.1 4.3 1.6V19a1.8 1.8 0 0 1-1.9 1.8A16.6 16.6 0 0 1 3.2 5.4 1.8 1.8 0 0 1 5 3.5Z"/></svg>',
 pin:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.4"/></svg>',
 linkedin:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8 10.5V16M8 7.6v.1M11.5 16v-5.5M11.5 13c0-1.6 1-2.6 2.4-2.6s2.1.9 2.1 2.6V16"/></svg>',
 instagram:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.2 6.8v.1"/></svg>',
 chat:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H11l-5 4v-4h0A2.5 2.5 0 0 1 4 13.5Z"/><path d="M8.5 8.5h7M8.5 11.5h4.5"/></svg>',
 arrow:'<svg class="v6-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg>'
};
const head=`<!-- MUK_V6_HEAD --><script src="/js/muk-boot-v6.js?v=${V}"></script><meta name="theme-color" content="#f6f4ef"><meta name="color-scheme" content="light dark"><link rel="stylesheet" href="/css/muk-dark-v6.css?v=${V}"><link rel="stylesheet" href="/css/muk-v6.css?v=${V}"><script src="/js/muk-site-v6.js?v=${V}" defer></script><script src="/js/muk-assistant-v6.js?v=${V}" defer></script><!-- /MUK_V6_HEAD -->`;
const controls=`<!-- MUK_V6_CONTROLS --><div class="v6-controls" data-no-i18n><button class="v6-icon-btn v6-theme" type="button" data-v6-theme aria-pressed="false" aria-label="Activer le mode sombre">${icon.sun}${icon.moon}</button><div class="v6-lang" data-v6-lang><button class="v6-icon-btn v6-lang-btn" type="button" aria-haspopup="true" aria-expanded="false" aria-label="Langue : Français">${icon.globe}<span class="v6-lang-code" data-no-i18n>FR</span>${icon.chev}</button><div class="v6-lang-menu" role="menu" hidden data-no-i18n><button type="button" role="menuitemradio" data-lang="fr" lang="fr"><b>FR</b>Français</button><button type="button" role="menuitemradio" data-lang="en" lang="en"><b>EN</b>English</button><button type="button" role="menuitemradio" data-lang="es" lang="es"><b>ES</b>Español</button><button type="button" role="menuitemradio" data-lang="ar" lang="ar" dir="rtl"><b>AR</b>العربية</button></div></div></div><!-- /MUK_V6_CONTROLS -->`;
const cta=`<!-- MUK_V6_CTA --><a class="v6-cta" href="/evaluation/"><span>Évaluer mon profil</span>${icon.arrow}</a><!-- /MUK_V6_CTA -->`;
const navTools=`<!-- MUK_V6_NAVTOOLS --><div class="v6-nav-tools"><div class="v6-nav-tools-row"><span class="v6-nav-tools-label">Affichage</span><span class="v6-nav-tools-slot" data-v6-slot></span></div><a class="v6-nav-login" href="/admin/">Connexion</a><a class="v6-nav-eval" href="/evaluation/"><span>Évaluer mon profil</span>${icon.arrow}</a></div><!-- /MUK_V6_NAVTOOLS -->`;
const footer=`<!-- MUK_V6_FOOTER --><footer class="v6-footer" aria-labelledby="v6-footer-title">
<div class="v6-footer-cta"><div class="v6-footer-cta-copy"><p class="v6-kicker">Rentrée 2027</p><h2 id="v6-footer-title">Votre projet au Royaume-Uni commence par une conversation.</h2><p>Évaluation et premier entretien gratuits. Une réponse claire sur vos prochaines étapes.</p></div><div class="v6-footer-cta-actions"><a class="v6-btn v6-btn-grad" href="/evaluation/"><span>Évaluer mon profil</span>${icon.arrow}</a><button class="v6-btn v6-btn-ghost" type="button" data-v6-open-assistant>${icon.chat}<span>Poser une question</span></button></div></div>
<div class="v6-footer-grid">
<div class="v6-footer-brand"><a class="v6-footer-logo" href="/" aria-label="Maghreb UK Talent – accueil"><img src="/assets/brand/logo.svg" alt="MUK Talent" width="309" height="72" loading="lazy" decoding="async"></a><span class="v6-footer-badge">Du Maghreb aux universités britanniques</span><p>Un projet clair, des étapes préparées. Nous accompagnons les étudiants dans leurs candidatures, leur anglais, leur visa et leur installation au Royaume-Uni.</p><ul class="v6-footer-contact"><li>${icon.mail}<a href="mailto:agents@muktalent.com">agents@muktalent.com</a></li><li>${icon.phone}<a href="tel:+447311874281" dir="ltr">+44 73 1187 4281</a></li><li>${icon.pin}<span>Londres · Marrakech</span></li></ul></div>
<nav class="v6-footer-col" aria-label="Explorer"><h3>Explorer</h3><a href="/">Accueil</a><a href="/about-us/">À propos</a><a href="/services/">Nos services</a><a href="/evaluation/">Évaluer mon projet</a><a href="/contact/">Contact</a><a href="/institutions/" lang="en">For institutions</a></nav>
<nav class="v6-footer-col" aria-label="Services"><h3>Services</h3><a href="/services/university-applications/">Candidatures universitaires</a><a href="/services/student-visa-support/">Visa étudiant UK</a><a href="/services/accommodation-support/">Logement étudiant</a><a href="/services/#anglais">Anglais &amp; IELTS</a><a href="/services/university-applications/#financement">Budget &amp; financement</a><a href="/services/document-translation/">Traduction de documents</a></nav>
<nav class="v6-footer-col" aria-label="Informations"><h3>Informations</h3><a href="/legal/">Informations légales</a><a href="/privacy/">Confidentialité</a><a href="/cookies/">Cookies</a><a href="/terms/">Conditions</a><a href="/complaints/">Réclamations</a><a href="https://agent-counsellor-ukhub.britishcouncil.org/gal" target="_blank" rel="noopener noreferrer">Annuaire British Council ↗</a></nav>
</div>
<div class="v6-footer-bottom"><p>© <span data-v6-year>2026</span> MAGHREB UK TALENT LTD. Tous droits réservés.</p><div class="v6-footer-social"><a href="https://www.linkedin.com/company/maghreb-uk-talent/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">${icon.linkedin}</a><a href="https://www.instagram.com/maghrebuktalent/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">${icon.instagram}</a></div><div class="v6-footer-legal"><a href="/privacy/">Confidentialité</a><span aria-hidden="true">·</span><a href="/terms/">Conditions</a><span aria-hidden="true">·</span><button type="button" data-privacy-settings>Cookies / préférences</button></div></div>
</footer><!-- /MUK_V6_FOOTER -->`;
const heroMedia=`<!-- MUK_V6_MEDIA --><div class="mt-photo-wrap v6-media" data-v6-media data-videos="" data-poster="/assets/hero.jpg"><img class="mt-hero-photo" src="/assets/hero.jpg" alt="Projet d’études au Royaume-Uni" fetchpriority="high" width="800" height="1000"><div class="v6-media-badge"><span class="v6-media-mark" aria-hidden="true">M</span><span><strong>Maghreb UK Talent</strong><small>Conseil études au Royaume-Uni</small></span></div></div><!-- /MUK_V6_MEDIA -->`;
const stats=`<!-- MUK_V6_STATS --><dl class="v6-stats"><div><dt><span data-v6-count="0">0</span> €</dt><dd>Évaluation et premier entretien</dd></div><div><dt><span data-v6-count="4">4</span></dt><dd>Étapes jusqu’au départ</dd></div><div><dt><span data-v6-count="2027">2027</span></dt><dd>Rentrée en préparation</dd></div></dl><!-- /MUK_V6_STATS -->`;
const strip=(s,tag)=>s.replace(new RegExp(`<!-- ${tag} -->[\\s\\S]*?<!-- /${tag} -->`,"g"),"");
let changed=0;
for(const rel of pages){
 const file=path.join(root,rel);let s=await readFile(file,"utf8");const before=s;
 for(const t of ["MUK_V6_HEAD","MUK_V6_CONTROLS","MUK_V6_CTA","MUK_V6_NAVTOOLS"])s=strip(s,t);
 // head
 s=s.replace(/(<meta charset="?utf-8"?\s*\/?>)/i,`$1${head}`);
 if(!s.includes("MUK_V6_HEAD"))throw new Error("charset not found in "+rel);
 // header controls
 if(s.includes('class="header-right"')){
  s=s.replace(/(<div class="header-right">\s*)/,`$1${controls}${cta}`);
 }else if(rel==="evaluation/index.html"){
  s=s.replace(/(<header>)([\s\S]*?)(<\/header>)/,(m,a,b,c)=>a+b.replace(/(<a href="\/">←)/,`${controls}$1`)+c);
 }
 if(!s.includes("MUK_V6_CONTROLS"))throw new Error("controls not inserted in "+rel);
 // mobile dialog tools
 s=s.replace(/(<div class="muk-nav-foot">)/,`${navTools}$1`);
 // footer
 if(s.includes("MUK_V6_FOOTER"))s=s.replace(/<!-- MUK_V6_FOOTER -->[\s\S]*?<!-- \/MUK_V6_FOOTER -->/,footer);
 else{
  s=s.replace(/<!-- FOOTER SIN CAMBIOS -->\s*/,"");
  const re=rel==="evaluation/index.html"?/<footer>[\s\S]*?<\/footer>/:/<footer class="mt-footer">[\s\S]*?<\/footer>/;
  if(!re.test(s))throw new Error("footer not found in "+rel);
  s=s.replace(re,footer);
 }
 // home hero
 if(rel==="index.html"){
  if(s.includes("MUK_V6_MEDIA"))s=s.replace(/<!-- MUK_V6_MEDIA -->[\s\S]*?<!-- \/MUK_V6_MEDIA -->/,heroMedia);
  else s=s.replace(/<div class="mt-photo-wrap">[\s\S]*?<\/div>/,heroMedia);
  if(s.includes("MUK_V6_STATS"))s=s.replace(/<!-- MUK_V6_STATS -->[\s\S]*?<!-- \/MUK_V6_STATS -->/,stats);
  else s=s.replace(/(<p class="mt-micro">[\s\S]*?<\/p>)/,`$1${stats}`);
  if(!s.includes("MUK_V6_MEDIA")||!s.includes("MUK_V6_STATS"))throw new Error("hero not upgraded");
 }
 if(s!==before){await writeFile(file,s);changed++;}
}
console.log(`MUK v6: ${changed} page(s) updated, ${pages.length} checked.`);
