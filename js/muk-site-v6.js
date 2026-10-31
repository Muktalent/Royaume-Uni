/* MUK Talent v6 – theme, FR/EN/ES/AR, motion, hero video. Plain JS, no third-party code, CSP friendly. */
(()=>{
"use strict";
const d=document.documentElement,LANGS=["fr","en","es","ar"],NAMES={fr:"Français",en:"English",es:"Español",ar:"العربية"};
const reduce=matchMedia("(prefers-reduced-motion: reduce)");
const UI={
 fr:{dark:"Activer le mode sombre",light:"Activer le mode clair",lang:"Langue",play:"Lire la vidéo",pause:"Mettre la vidéo en pause",soundOn:"Activer le son",soundOff:"Couper le son",video:"Vidéo de présentation Maghreb UK Talent"},
 en:{dark:"Switch to dark mode",light:"Switch to light mode",lang:"Language",play:"Play video",pause:"Pause video",soundOn:"Turn sound on",soundOff:"Mute",video:"Maghreb UK Talent introduction video"},
 es:{dark:"Activar modo oscuro",light:"Activar modo claro",lang:"Idioma",play:"Reproducir vídeo",pause:"Pausar vídeo",soundOn:"Activar sonido",soundOff:"Silenciar",video:"Vídeo de presentación de Maghreb UK Talent"},
 ar:{dark:"تفعيل الوضع الداكن",light:"تفعيل الوضع الفاتح",lang:"اللغة",play:"تشغيل الفيديو",pause:"إيقاف الفيديو مؤقتًا",soundOn:"تشغيل الصوت",soundOff:"كتم الصوت",video:"فيديو تعريفي بـ Maghreb UK Talent"}
};
const store={get(k){try{return localStorage.getItem(k);}catch{return null;}},set(k,v){try{localStorage.setItem(k,v);}catch{}}};
let lang=LANGS.includes(d.dataset.lang)?d.dataset.lang:"fr";
const ui=k=>(UI[lang]||UI.fr)[k];
const listeners=new Set();

/* ---------------- Theme ---------------- */
const themeMeta=document.querySelector('meta[name="theme-color"]');
function applyTheme(t,save){
 d.dataset.theme=t;if(save)store.set("muk-theme",t);
 if(themeMeta)themeMeta.content=t==="dark"?"#0b1413":"#f6f4ef";
 for(const b of document.querySelectorAll("[data-v6-theme]")){b.setAttribute("aria-pressed",String(t==="dark"));b.setAttribute("aria-label",t==="dark"?ui("light"):ui("dark"));}
}
function toggleTheme(){
 const next=d.dataset.theme==="dark"?"light":"dark";
 d.classList.add("v6-theme-anim");applyTheme(next,true);setTimeout(()=>d.classList.remove("v6-theme-anim"),450);
}
matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change",e=>{if(!store.get("muk-theme"))applyTheme(e.matches?"dark":"light",false);});

/* ---------------- i18n engine ---------------- */
const SKIP=new Set(["SCRIPT","STYLE","NOSCRIPT","TEXTAREA","CODE","PRE","svg","SVG","TEMPLATE"]);
const ATTRS=["placeholder","aria-label","title","alt"];
const originals=new WeakMap(),attrOriginals=new WeakMap(),lastSet=new WeakMap(),lastAttr=new WeakMap();
const missing=window.__mukI18nMissing=new Set();
let applying=false,packPromises={};
const docOriginal={title:document.title,desc:document.querySelector('meta[name="description"]')?.content||""};
const norm=s=>s.replace(/\s+/g," ").trim();
function pack(l){return (window.MUK_I18N_PACKS||{})[l]||null;}
function loadPack(l){
 if(l==="fr"||pack(l))return Promise.resolve(pack(l));
 if(packPromises[l])return packPromises[l];
 const existing=[...document.scripts].find(s=>s.src.includes(`/i18n/${l}.js`));
 packPromises[l]=new Promise(res=>{
  const done=()=>res(pack(l));
  if(existing){if(pack(l))return done();existing.addEventListener("load",done,{once:true});existing.addEventListener("error",()=>res(null),{once:true});setTimeout(done,4000);return;}
  const s=document.createElement("script");s.src=`/i18n/${l}.js?v=6.0.0`;s.onload=done;s.onerror=()=>res(null);document.head.append(s);
 });
 return packPromises[l];
}
function skipped(node){for(let n=node.nodeType===1?node:node.parentElement;n&&n!==d;n=n.parentElement){if(SKIP.has(n.tagName)||n.hasAttribute("data-no-i18n"))return true;}return false;}
const ARROWS_AR={"→":"←","↗":"↖","←":"→","↘":"↙"};
function flip(s){return lang==="ar"?s.replace(/[→↗←↘]/g,c=>ARROWS_AR[c]):s;}
function lookup(src,p){
 const key=norm(src);if(!key)return null;
 if(!/[A-Za-zÀ-ÿ]/.test(key))return flip(key)===key?null:flip(key);
 let t=p.t[key];if(t!=null)return t;
 const m=key.match(/^(.*?)([\s↗→←↘+×·:]+)$/);
 if(m&&m[1]&&p.t[m[1]]!=null)return p.t[m[1]]+flip(m[2]);
 for(const [re,rep] of p.re||[]){if(re.test(key))return key.replace(re,rep);}
 missing.add(key);return null;
}
function trText(node,p){
 if(!originals.has(node))originals.set(node,node.nodeValue);
 const src=originals.get(node);let out=src;
 if(p){const t=lookup(src,p);if(t!=null){const lead=src.match(/^\s*/)[0],trail=src.match(/\s*$/)[0];out=lead+t+trail;}}
 if(node.nodeValue!==out)node.nodeValue=out;
 lastSet.set(node,out);
}
function trAttrs(el,p){
 let o=attrOriginals.get(el);
 for(const a of ATTRS){if(!el.hasAttribute(a))continue;if(!o){o={};attrOriginals.set(el,o);}if(!(a in o))o[a]=el.getAttribute(a);
  let v=o[a];if(p){const t=lookup(v,p);if(t!=null)v=t;}if(el.getAttribute(a)!==v)el.setAttribute(a,v);
  let la=lastAttr.get(el);if(!la){la={};lastAttr.set(el,la);}la[a]=v;}
}
function walk(root,p){
 if(root.nodeType===3){if(!skipped(root))trText(root,p);return;}
 if(root.nodeType!==1||skipped(root))return;
 trAttrs(root,p);
 const tw=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT,{acceptNode:n=>n.nodeType===1?(SKIP.has(n.tagName)||n.hasAttribute("data-no-i18n")?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT):(n.nodeValue.trim()?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_SKIP)});
 let n;while((n=tw.nextNode())){if(n.nodeType===3)trText(n,p);else trAttrs(n,p);}
}
function applyDoc(p){
 const tTitle=p&&p.meta&&p.meta.titles&&p.meta.titles[location.pathname.replace(/index\.html$/,"")];
 document.title=tTitle||(p?lookup(docOriginal.title,p):null)||docOriginal.title;
 const md=document.querySelector('meta[name="description"]');if(md){md.content=(p?lookup(docOriginal.desc,p):null)||docOriginal.desc;}
}
async function setLang(l,save){
 if(!LANGS.includes(l))l="fr";
 const p=l==="fr"?null:await loadPack(l);
 if(l!=="fr"&&!p){l="fr";}
 lang=l;d.dataset.lang=l;d.lang=l;d.dir=l==="ar"?"rtl":"ltr";if(save)store.set("muk-lang",l);
 applying=true;try{walk(document.body,p);applyDoc(p);}finally{applying=false;}
 d.classList.remove("v6-i18n-pending");
 syncControls();legalNotice(p);
 for(const f of listeners)try{f(l);}catch{}
 window.dispatchEvent(new CustomEvent("muk:lang",{detail:{lang:l}}));
}
const mo=new MutationObserver(list=>{
 if(applying)return;const p=lang==="fr"?null:pack(lang);
 applying=true;
 try{for(const m of list){
  if(m.type==="characterData"){const n=m.target;if(!n.isConnected||skipped(n)||lastSet.get(n)===n.nodeValue)continue;originals.set(n,n.nodeValue);trText(n,p);}
  else if(m.type==="attributes"){const el=m.target,a=m.attributeName,v=el.getAttribute(a);if(!el.isConnected||skipped(el)||(lastAttr.get(el)||{})[a]===v)continue;const o=attrOriginals.get(el);if(o)o[a]=v;trAttrs(el,p);}
  else for(const n of m.addedNodes){if(n.isConnected)walk(n,p);}
 }}finally{applying=false;}
});

/* ---------------- Controls (theme + language) ---------------- */
function syncControls(){
 for(const b of document.querySelectorAll("[data-v6-theme]")){b.setAttribute("aria-label",d.dataset.theme==="dark"?ui("light"):ui("dark"));}
 for(const box of document.querySelectorAll("[data-v6-lang]")){
  const btn=box.querySelector(".v6-lang-btn");btn.setAttribute("aria-label",`${ui("lang")} : ${NAMES[lang]}`);
  box.querySelector(".v6-lang-code").textContent=lang.toUpperCase();
  for(const it of box.querySelectorAll("[data-lang]"))it.setAttribute("aria-checked",String(it.dataset.lang===lang));
 }
}
function closeMenus(except){for(const box of document.querySelectorAll("[data-v6-lang]")){if(box===except)continue;const m=box.querySelector(".v6-lang-menu");if(!m.hidden){m.hidden=true;box.classList.remove("open");box.querySelector(".v6-lang-btn").setAttribute("aria-expanded","false");}}}
function wireControls(scope){
 for(const b of scope.querySelectorAll("[data-v6-theme]"))b.addEventListener("click",toggleTheme);
 for(const box of scope.querySelectorAll("[data-v6-lang]")){
  const btn=box.querySelector(".v6-lang-btn"),menu=box.querySelector(".v6-lang-menu"),items=[...menu.querySelectorAll("[data-lang]")];
  const open=()=>{closeMenus(box);menu.hidden=false;box.classList.add("open");btn.setAttribute("aria-expanded","true");(items.find(i=>i.dataset.lang===lang)||items[0]).focus();};
  const close=(focus)=>{menu.hidden=true;box.classList.remove("open");btn.setAttribute("aria-expanded","false");if(focus)btn.focus();};
  btn.addEventListener("click",e=>{e.stopPropagation();menu.hidden?open():close(false);});
  btn.addEventListener("keydown",e=>{if(e.key==="ArrowDown"){e.preventDefault();open();}});
  menu.addEventListener("keydown",e=>{const i=items.indexOf(document.activeElement);
   if(e.key==="Escape"){e.preventDefault();close(true);}
   else if(e.key==="ArrowDown"){e.preventDefault();items[(i+1)%items.length].focus();}
   else if(e.key==="ArrowUp"){e.preventDefault();items[(i-1+items.length)%items.length].focus();}
   else if(e.key==="Tab")close(false);});
  for(const it of items)it.addEventListener("click",e=>{e.stopPropagation();close(true);if(it.dataset.lang!==lang)setLang(it.dataset.lang,true);});
 }
}
document.addEventListener("click",()=>closeMenus(null));

/* ---------------- Header, reveal, spotlight ---------------- */
function header(){
 const h=document.querySelector("body > header");if(!h)return;h.classList.add("v6-header");
 let last=-1;const on=()=>{const y=scrollY>12;if(y!==last){h.classList.toggle("v6-scrolled",y);last=y;}};
 addEventListener("scroll",on,{passive:true});on();
 // highlight current page in the desktop nav
 const here=location.pathname.replace(/index\.html$/,"");
 for(const a of h.querySelectorAll(".nav > a, .nav .dropdown > a")){try{const u=new URL(a.href);if(!u.hash&&u.pathname===here)a.setAttribute("aria-current","page");}catch{}}
}
const CARDS=".mt-service-card,.ip-card,.ip-contact-card,.muk-partner-card,.mt-value-grid article,.mt-process-grid li,.mt-questions details,.ip-note,.v6-stats>div,.ip-side,.mt-path-card,.v6-footer-cta";
function reveal(){
 const els=new Set();
 document.querySelectorAll("main section:not(.mt-hero):not(.ip-hero) .mt-wrap > *").forEach(el=>{if(!el.querySelector(CARDS))els.add(el);});
 document.querySelectorAll(`main ${CARDS.split(",").join(",main ")}`).forEach(el=>{if(!el.closest(".mt-hero,.ip-hero"))els.add(el);});
 document.querySelectorAll(".v6-footer-cta,.v6-footer-grid > *").forEach(el=>els.add(el));
 if(!("IntersectionObserver" in window)||reduce.matches)return;
 const show=el=>{el.classList.add("v6-in");const ms=parseInt(el.style.getPropertyValue("--v6-delay"))||0;setTimeout(()=>{el.classList.remove("v6-reveal","v6-in");el.style.removeProperty("--v6-delay");},ms+950);};
 const io=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){show(e.target);io.unobserve(e.target);}},{rootMargin:"0px 0px -8% 0px",threshold:.08});
 for(const el of els){
  const sib=el.parentElement?[...el.parentElement.children].filter(c=>els.has(c)):[];
  el.style.setProperty("--v6-delay",`${Math.min(sib.indexOf(el),6)*70}ms`);
  el.classList.add("v6-reveal");
  if(el.getBoundingClientRect().top<innerHeight*0.92)requestAnimationFrame(()=>requestAnimationFrame(()=>show(el)));else io.observe(el);
 }
}
function spotlight(){
 if(!matchMedia("(hover:hover) and (pointer:fine)").matches)return;
 const sel=CARDS+",.v6-btn,.v6-cta,.mt-button";
 document.addEventListener("pointermove",e=>{const el=e.target.closest?.(sel);if(!el)return;const r=el.getBoundingClientRect();
  el.style.setProperty("--v6-x",`${e.clientX-r.left}px`);el.style.setProperty("--v6-y",`${e.clientY-r.top}px`);},{passive:true});
 document.querySelectorAll(CARDS).forEach(c=>c.classList.add("v6-spot"));
}

/* ---------------- Home hero: typed headline + counters ---------------- */
function typeHeadline(){
 const h1=document.querySelector(".mt-hero h1");if(!h1||reduce.matches)return;
 const node=[...h1.childNodes].find(n=>n.nodeType===3&&n.nodeValue.trim());if(!node)return;
 const full=node.nodeValue,typed=document.createElement("span"),caret=document.createElement("span"),ghost=document.createElement("span");
 typed.className="v6-typed";caret.className="v6-caret";caret.setAttribute("aria-hidden","true");ghost.className="v6-ghost";ghost.setAttribute("aria-hidden","true");
 const wrap=document.createElement("span");wrap.className="v6-type-wrap";wrap.setAttribute("aria-label",full.trim());wrap.setAttribute("data-no-i18n","");
 typed.setAttribute("aria-hidden","true");wrap.append(typed,caret,ghost);
 applying=true;h1.replaceChild(wrap,node);applying=false;ghost.textContent=full;
 let i=0,timer=0;const chars=[...full];
 const finish=()=>{clearTimeout(timer);applying=true;if(wrap.parentNode)wrap.parentNode.replaceChild(node,wrap);applying=false;listeners.delete(finish);};
 listeners.add(finish);
 const step=()=>{i++;typed.textContent=chars.slice(0,i).join("");ghost.textContent=chars.slice(i).join("");if(i<chars.length)timer=setTimeout(step,i<3?120:38+Math.random()*40);else setTimeout(finish,350);};
 timer=setTimeout(step,450);
}
function counters(){
 const els=document.querySelectorAll("[data-v6-count]");if(!els.length)return;
 const run=el=>{const to=+el.dataset.v6Count;if(!to||reduce.matches){el.textContent=String(to);return;}
  const from=to>1000?to-27:0,t0=performance.now(),dur=1100;
  const f=t=>{const k=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-k,3);el.textContent=String(Math.round(from+(to-from)*e));if(k<1)requestAnimationFrame(f);};requestAnimationFrame(f);};
 if(!("IntersectionObserver" in window))return;
 const io=new IntersectionObserver(es=>{for(const e of es)if(e.isIntersecting){run(e.target);io.unobserve(e.target);}},{threshold:.6});
 els.forEach(el=>io.observe(el));
}

/* ---------------- Hero media: photo or organic videos ---------------- */
function heroMedia(){
 const box=document.querySelector("[data-v6-media]");if(!box)return;
 const list=(box.dataset.videos||"").split(",").map(s=>s.trim()).filter(s=>/^(\/(?!\/)|https:\/\/)[^\s"'<>]+\.(mp4|webm|m4v|mov)(\?[^\s"'<>]*)?$/i.test(s));
 if(!list.length)return;
 const saveData=navigator.connection&&navigator.connection.saveData;
 const auto=!reduce.matches&&!saveData;
 const mk=()=>{const v=document.createElement("video");v.muted=true;v.defaultMuted=true;v.playsInline=true;v.setAttribute("playsinline","");v.setAttribute("muted","");v.preload=auto?"auto":"metadata";v.disablePictureInPicture=true;v.setAttribute("disableremoteplayback","");if(box.dataset.poster)v.poster=box.dataset.poster;return v;};
 const video=mk(),back=mk();video.className="v6-video";back.className="v6-video-back";back.setAttribute("aria-hidden","true");back.tabIndex=-1;
 video.setAttribute("aria-label",ui("video"));
 let idx=0,userPaused=!auto,visible=true,failures=0;
 const bar=document.createElement("div");bar.className="v6-media-controls";bar.setAttribute("data-no-i18n","");
 const bPlay=document.createElement("button"),bSound=document.createElement("button");bPlay.type=bSound.type="button";
 bPlay.className="v6-media-btn";bSound.className="v6-media-btn";
 const svgPlay='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5Z"/></svg>',svgPause='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5h3v14H8zM13.5 5h3v14h-3z"/></svg>',svgMute='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4Z"/><path d="m16 9.5 5 5m0-5-5 5"/></svg>',svgSound='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4Z"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a7.8 7.8 0 0 1 0 11"/></svg>';
 const sync=()=>{const playing=!video.paused;bPlay.innerHTML=playing?svgPause:svgPlay;bPlay.setAttribute("aria-label",playing?ui("pause"):ui("play"));
  bSound.innerHTML=video.muted?svgMute:svgSound;bSound.setAttribute("aria-label",video.muted?ui("soundOn"):ui("soundOff"));bSound.setAttribute("aria-pressed",String(!video.muted));};
 const load=i=>{idx=(i+list.length)%list.length;video.src=list[idx];back.src=list[idx];video.loop=back.loop=list.length===1;video.load();back.load();};
 const play=()=>{if(userPaused||!visible||document.hidden)return;video.play().then(()=>{back.play().catch(()=>{});}).catch(()=>{});};
 const pause=()=>{video.pause();back.pause();};
 video.addEventListener("loadedmetadata",()=>{box.classList.toggle("v6-portrait",video.videoHeight>video.videoWidth*1.05);});
 video.addEventListener("playing",()=>{box.classList.add("v6-has-video");failures=0;sync();});
 video.addEventListener("pause",sync);
 video.addEventListener("ended",()=>{if(list.length>1){load(idx+1);play();}});
 video.addEventListener("error",()=>{failures++;if(failures>=list.length){box.classList.remove("v6-has-video");video.remove();back.remove();bar.remove();return;}load(idx+1);play();});
 video.addEventListener("timeupdate",()=>{if(Math.abs(back.currentTime-video.currentTime)>.4)back.currentTime=video.currentTime;});
 bPlay.addEventListener("click",()=>{if(video.paused){userPaused=false;play();}else{userPaused=true;pause();}sync();});
 bSound.addEventListener("click",()=>{video.muted=!video.muted;if(!video.muted&&video.paused){userPaused=false;play();}sync();});
 bar.append(bPlay,bSound);
 box.prepend(back);box.insertBefore(video,box.querySelector(".v6-media-badge"));box.append(bar);
 load(0);sync();
 if("IntersectionObserver" in window)new IntersectionObserver(([e])=>{visible=e.isIntersecting;visible?play():pause();},{threshold:.25}).observe(box);
 document.addEventListener("visibilitychange",()=>document.hidden?pause():play());
 listeners.add(sync);
 if(auto)play();
}

/* ---------------- Legal notice for translated views ---------------- */
function legalNotice(p){
 const legal=/^\/(legal|privacy|cookies|terms|complaints)\/?$/.test(location.pathname);
 let n=document.getElementById("v6-legal-note");
 if(!legal||!p){n?.remove();return;}
 if(!n){n=document.createElement("p");n.id="v6-legal-note";n.className="v6-legal-note";n.setAttribute("data-no-i18n","");n.setAttribute("role","note");document.querySelector("main")?.prepend(n);}
 n.textContent=p.meta&&p.meta.legal||"";
}

/* ---------------- Boot ---------------- */
function init(){
 // Mobile menu gets its own copy of the controls.
 const slot=document.querySelector("[data-v6-slot]"),src=document.querySelector(".v6-controls");
 if(slot&&src&&!slot.firstChild){const c=src.cloneNode(true);c.classList.add("v6-controls-menu");slot.append(c);}
 wireControls(document);
 applyTheme(d.dataset.theme==="dark"?"dark":"light",false);
 for(const y of document.querySelectorAll("[data-v6-year]"))y.textContent=String(new Date().getFullYear());
 for(const b of document.querySelectorAll("[data-v6-open-assistant]"))b.addEventListener("click",()=>window.dispatchEvent(new CustomEvent("muk:assistant-open")));
 for(const h of document.querySelectorAll(".mt-home .mt-hero,.ip-hero")){if(!h.querySelector(".v6-blobs")){const b=document.createElement("div");b.className="v6-blobs";b.setAttribute("aria-hidden","true");b.innerHTML="<i></i><i></i>";h.prepend(b);}}
 header();spotlight();heroMedia();counters();
 mo.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:ATTRS});
 const first=lang;
 const ready=first==="fr"?Promise.resolve():setLang(first,false);
 ready.then(()=>{d.classList.remove("v6-i18n-pending");syncControls();reveal();typeHeadline();});
}
window.MUKSite=Object.freeze({get lang(){return lang;},t:s=>{const p=lang==="fr"?null:pack(lang);if(!p)return s;const r=lookup(String(s),p);return r==null?s:r;},setLang:l=>setLang(l,true),onLang:f=>{listeners.add(f);return()=>listeners.delete(f);},toggleTheme});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
