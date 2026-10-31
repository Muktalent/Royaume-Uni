/* MUK Talent assistant v6 — type or talk, voice call mode, FR · EN · ES · AR */
(()=>{
"use strict";
if(window.__mukAssistant)return;window.__mukAssistant=true;
const d=document.documentElement,V="6.0.0",KEY="muk-assistant-v6",TEASE="muk-assistant-teaser";
const LANGS=["fr","en","es","ar"],VOICE={fr:"fr-FR",en:"en-GB",es:"es-ES",ar:"ar-SA"},REC={fr:"fr-FR",en:"en-GB",es:"es-ES",ar:"ar-MA"};
const lang=()=>{const l=(window.MUKSite&&window.MUKSite.lang)||(d.lang||"fr").slice(0,2);return LANGS.includes(l)?l:"fr";};
const UI={
 fr:{title:"Assistant MUK Talent",sub:"Écrire ou parler",open:"Ouvrir l’assistant",close:"Fermer l’assistant",reset:"Nouvelle conversation",call:"Appel vocal",ph:"Posez votre question…",send:"Envoyer",mic:"Dicter votre question",micStop:"Arrêter la dictée",listen:"Écouter la réponse",stop:"Arrêter la lecture",typing:"L’assistant écrit…",teaser:"Une question sur vos études au Royaume-Uni ?",teaserClose:"Masquer",disc:"Assistant automatique : il peut se tromper. Ne partagez pas de données sensibles.",privacy:"Confidentialité",micDenied:"Le micro n’est pas autorisé. Vous pouvez écrire votre question.",callTitle:"Appel avec l’assistant",callHello:"Je vous écoute. Posez votre question.",callListening:"Je vous écoute…",callThinking:"Je réfléchis…",callSpeaking:"Je réponds…",callPaused:"Micro en pause",callUnsupported:"La voix n’est pas disponible dans ce navigateur. Essayez Chrome, Edge ou Safari, ou réservez un échange avec un conseiller.",callEnd:"Raccrocher",callMute:"Couper le micro",callUnmute:"Réactiver le micro",book:"Réserver une visio avec un conseiller",phone:"Appeler un conseiller",suggest:"Suggestions",you:"Vous",bot:"Assistant",live:"IA"},
 en:{title:"MUK Talent assistant",sub:"Type or talk",open:"Open the assistant",close:"Close the assistant",reset:"New conversation",call:"Voice call",ph:"Ask your question…",send:"Send",mic:"Dictate your question",micStop:"Stop dictation",listen:"Listen to the answer",stop:"Stop reading",typing:"The assistant is typing…",teaser:"A question about studying in the UK?",teaserClose:"Hide",disc:"Automated assistant: it may make mistakes. Do not share sensitive data.",privacy:"Privacy",micDenied:"Microphone access is blocked. You can type your question.",callTitle:"Call with the assistant",callHello:"I’m listening. Ask your question.",callListening:"Listening…",callThinking:"Thinking…",callSpeaking:"Answering…",callPaused:"Microphone paused",callUnsupported:"Voice is not available in this browser. Try Chrome, Edge or Safari, or book a call with an adviser.",callEnd:"Hang up",callMute:"Mute microphone",callUnmute:"Unmute microphone",book:"Book a video call with an adviser",phone:"Call an adviser",suggest:"Suggestions",you:"You",bot:"Assistant",live:"AI"},
 es:{title:"Asistente MUK Talent",sub:"Escribe o habla",open:"Abrir el asistente",close:"Cerrar el asistente",reset:"Nueva conversación",call:"Llamada de voz",ph:"Escribe tu pregunta…",send:"Enviar",mic:"Dictar tu pregunta",micStop:"Detener el dictado",listen:"Escuchar la respuesta",stop:"Detener la lectura",typing:"El asistente está escribiendo…",teaser:"¿Una pregunta sobre estudiar en el Reino Unido?",teaserClose:"Ocultar",disc:"Asistente automático: puede equivocarse. No compartas datos sensibles.",privacy:"Privacidad",micDenied:"El micrófono no está autorizado. Puedes escribir tu pregunta.",callTitle:"Llamada con el asistente",callHello:"Te escucho. Haz tu pregunta.",callListening:"Te escucho…",callThinking:"Pensando…",callSpeaking:"Respondiendo…",callPaused:"Micrófono en pausa",callUnsupported:"La voz no está disponible en este navegador. Prueba Chrome, Edge o Safari, o reserva una cita con un asesor.",callEnd:"Colgar",callMute:"Silenciar micrófono",callUnmute:"Activar micrófono",book:"Reservar una videollamada con un asesor",phone:"Llamar a un asesor",suggest:"Sugerencias",you:"Tú",bot:"Asistente",live:"IA"},
 ar:{title:"مساعد MUK Talent",sub:"اكتب أو تحدث",open:"فتح المساعد",close:"إغلاق المساعد",reset:"محادثة جديدة",call:"مكالمة صوتية",ph:"اكتب سؤالك…",send:"إرسال",mic:"إملاء سؤالك",micStop:"إيقاف الإملاء",listen:"الاستماع إلى الإجابة",stop:"إيقاف القراءة",typing:"المساعد يكتب…",teaser:"هل لديك سؤال عن الدراسة في المملكة المتحدة؟",teaserClose:"إخفاء",disc:"مساعد آلي: قد يخطئ. لا تشارك بيانات حساسة.",privacy:"الخصوصية",micDenied:"الميكروفون غير مسموح. يمكنك كتابة سؤالك.",callTitle:"مكالمة مع المساعد",callHello:"أنا أستمع إليك. اطرح سؤالك.",callListening:"أستمع إليك…",callThinking:"أفكر…",callSpeaking:"أجيب…",callPaused:"الميكروفون متوقف",callUnsupported:"الصوت غير متاح في هذا المتصفح. جرّب Chrome أو Edge أو Safari، أو احجز موعدًا مع مستشار.",callEnd:"إنهاء المكالمة",callMute:"كتم الميكروفون",callUnmute:"تشغيل الميكروفون",book:"حجز مكالمة فيديو مع مستشار",phone:"الاتصال بمستشار",suggest:"اقتراحات",you:"أنت",bot:"المساعد",live:"ذكاء اصطناعي"}
};
const ui=k=>(UI[lang()]||UI.fr)[k]||UI.fr[k];
const SVG={
 close:'<path d="M6 6l12 12M18 6 6 18"/>',
 reset:'<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4.5h4.5"/>',
 call:'<rect x="3" y="6" width="13" height="12" rx="3"/><path d="m16 10.5 5-3v9l-5-3"/>',
 send:'<path d="M5 12h13M13 6l6 6-6 6"/>',
 mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
 micOff:'<path d="M15 10V6a3 3 0 0 0-5.7-1.3M9 9v2a3 3 0 0 0 4.6 2.5M5.5 11a6.5 6.5 0 0 0 10.4 5.2M18.5 11c0 .7-.1 1.4-.3 2M12 17.5V21M3 3l18 18"/>',
 speaker:'<path d="M4 10v4h3.5L12 18V6L7.5 10H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
 stop:'<rect x="7" y="7" width="10" height="10" rx="2"/>',
 phone:'<path d="M5 4h3l1.6 4-2 1.3a11 11 0 0 0 5.1 5.1l1.3-2L18 14v3a2 2 0 0 1-2 2A13 13 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
 hang:'<path d="M3 14.5c5-4.6 13-4.6 18 0l-2.3 2.6-3.3-1.4v-2.5a11.5 11.5 0 0 0-6.8 0v2.5l-3.3 1.4z"/>',
 video:'<rect x="3" y="6" width="13" height="12" rx="3"/><path d="m16 10.5 5-3v9l-5-3"/>',
 arrow:'<path d="M7 17 17 7M9 7h8v8"/>'
};
const icon=(n,c="")=>`<svg class="${c}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${SVG[n]}</svg>`;
const el=(tag,attrs={},html)=>{const e=document.createElement(tag);for(const[k,v]of Object.entries(attrs)){if(v==null||v===false)continue;if(k==="class")e.className=v;else if(k==="text")e.textContent=v;else e.setAttribute(k,v===true?"":v);}if(html!=null)e.innerHTML=html;return e;};
const store={load(){try{return JSON.parse(sessionStorage.getItem(KEY))||{msgs:[]};}catch{return{msgs:[]};}},save(s){try{sessionStorage.setItem(KEY,JSON.stringify({msgs:s.msgs.slice(-40)}));}catch{}}};
const state=store.load();
let KB=null,kbPromise=null,aiEnabled=null,busy=false;
function loadKB(){
 if(KB)return Promise.resolve(KB);
 if(window.MUK_ASSISTANT_KB){KB=prepare(window.MUK_ASSISTANT_KB);return Promise.resolve(KB);}
 if(!kbPromise)kbPromise=new Promise((res,rej)=>{const s=document.createElement("script");s.src=`/js/muk-assistant-kb-v6.js?v=${V}`;s.async=true;s.onload=()=>{KB=prepare(window.MUK_ASSISTANT_KB);res(KB);};s.onerror=()=>{kbPromise=null;rej(new Error("kb"));};document.head.append(s);});
 return kbPromise;
}
const norm=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[\u064B-\u065F\u0670\u0640]/g,"").replace(/[أإآ]/g,"ا").replace(/ة/g,"ه").replace(/ى/g,"ي").replace(/[’'`´]/g," ").replace(/[^\p{L}\p{N}\s-]/gu," ").replace(/\s+/g," ").trim();
function prepare(kb){for(const i of kb.intents)i._kw=[...new Set(i.kw.map(norm).filter(Boolean))];return kb;}
function match(text){
 const t=` ${norm(text)} `;let best=null,bestScore=0;const scores={};
 for(const i of KB.intents){let s=0;for(const k of i._kw){const hit=k.length<=3?t.includes(` ${k} `):t.includes(k);if(hit)s+=1+k.length/8;}scores[i.id]=s;if(s>bestScore){bestScore=s;best=i;}}
 if(best&&(best.id==="greet"||best.id==="thanks")){
  const other=KB.intents.filter(i=>i.id!=="greet"&&i.id!=="thanks"&&scores[i.id]>0).sort((a,b)=>scores[b.id]-scores[a.id])[0];
  if(other)best=other;
 }
 return best;
}
function localAnswer(text){
 const l=lang(),i=match(text);
 if(!i)return{t:KB.fallback.a[l],links:KB.fallback.links,next:KB.fallback.next,id:"fallback"};
 return{t:i.a[l]||i.a.fr,links:i.links||[],next:i.next||[],id:i.id};
}
async function aiStatus(){
 if(aiEnabled!==null)return aiEnabled;
 try{const r=await fetch("/api/assistant/status",{headers:{accept:"application/json"},cache:"no-store"});aiEnabled=r.ok&&!!(await r.json()).enabled;}catch{aiEnabled=false;}
 return aiEnabled;
}
async function aiAnswer(){
 const history=state.msgs.filter(m=>m.r==="u"||m.r==="a").slice(-10).map(m=>({role:m.r==="u"?"user":"assistant",content:String(m.t).slice(0,800)}));
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),20000);
 try{
  const r=await fetch("/api/assistant",{method:"POST",headers:{"content-type":"application/json",accept:"application/json"},body:JSON.stringify({lang:lang(),page:location.pathname,messages:history}),signal:ctrl.signal});
  if(!r.ok)throw new Error(String(r.status));
  const j=await r.json();if(!j||typeof j.reply!=="string"||!j.reply.trim())throw new Error("empty");
  return{t:j.reply.trim().slice(0,2400),links:[],next:[],ai:true};
 }finally{clearTimeout(timer);}
}
async function answer(text){
 await loadKB();
 const local=localAnswer(text);
 if(local.id!=="greet"&&local.id!=="thanks"&&await aiStatus()){
  try{const a=await aiAnswer();a.links=local.id==="fallback"?["eval"]:local.links.slice(0,2);a.next=local.next;return a;}catch{}
 }
 return local;
}

/* ---------- DOM ---------- */
const root=el("div",{class:"v6a","data-no-i18n":true});
const launch=el("button",{class:"v6a-launch",type:"button","aria-expanded":"false","aria-controls":"v6a-panel"});
launch.innerHTML='<img src="/assets/assistant-avatar.png?v=6.0.0" alt="" width="64" height="64" decoding="async"><span class="v6a-launch-dot" aria-hidden="true"></span>';
const teaser=el("div",{class:"v6a-teaser",hidden:true});
const teaserBtn=el("button",{class:"v6a-teaser-text",type:"button"});const teaserX=el("button",{class:"v6a-teaser-x",type:"button"},icon("close"));
teaser.append(teaserBtn,teaserX);
const panel=el("section",{class:"v6a-panel",id:"v6a-panel",role:"dialog","aria-modal":"false","aria-labelledby":"v6a-title",hidden:true});
panel.innerHTML=`<header class="v6a-head"><span class="v6a-avatar"><img src="/assets/assistant-avatar.png?v=6.0.0" alt="" width="40" height="40"><i aria-hidden="true"></i></span><div class="v6a-head-copy"><h2 id="v6a-title"></h2><p><span class="v6a-sub"></span><span class="v6a-langs"></span></p></div><div class="v6a-head-actions"><button type="button" class="v6a-hbtn" data-a="call">${icon("call")}</button><button type="button" class="v6a-hbtn" data-a="reset">${icon("reset")}</button><button type="button" class="v6a-hbtn" data-a="close">${icon("close")}</button></div></header>
<div class="v6a-log" role="log" aria-live="polite" aria-relevant="additions"></div>
<div class="v6a-chips" role="group"></div>
<form class="v6a-form" autocomplete="off"><label class="v6a-sr" for="v6a-input"></label><textarea id="v6a-input" rows="1" maxlength="600" enterkeyhint="send"></textarea><button type="button" class="v6a-ibtn v6a-mic" data-a="mic">${icon("mic")}</button><button type="submit" class="v6a-send">${icon("send")}</button></form>
<p class="v6a-disc"><span class="v6a-disc-text"></span> <a href="/privacy/" class="v6a-privacy"></a></p>
<div class="v6a-call" hidden><div class="v6a-call-top"><span class="v6a-call-title"></span><span class="v6a-call-live"><i></i>LIVE</span></div><div class="v6a-orb" aria-hidden="true"><span></span><span></span><span></span><img src="/assets/assistant-avatar.png?v=6.0.0" alt="" width="96" height="96"></div><p class="v6a-call-status" aria-live="polite"></p><p class="v6a-call-text"></p><div class="v6a-call-ctrl"><button type="button" class="v6a-cbtn" data-a="mute">${icon("mic")}</button><button type="button" class="v6a-cbtn v6a-hang" data-a="hang">${icon("hang")}</button></div><div class="v6a-call-links"><a class="v6a-call-link" href="/evaluation/">${icon("video")}<span data-k="book"></span></a><a class="v6a-call-link" href="tel:+447311874281">${icon("phone")}<span data-k="phone"></span></a></div></div>`;
root.append(teaser,panel,launch);
const $=s=>panel.querySelector(s);
const log=$(".v6a-log"),chips=$(".v6a-chips"),form=$(".v6a-form"),input=$("#v6a-input"),micBtn=$(".v6a-mic"),callBox=$(".v6a-call");

const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
const TTS="speechSynthesis" in window&&"SpeechSynthesisUtterance" in window;
if(!SR)micBtn.hidden=true;

function labels(){
 const l=lang();
 launch.setAttribute("aria-label",ui("open"));teaserBtn.textContent=ui("teaser");teaserX.setAttribute("aria-label",ui("teaserClose"));
 $("#v6a-title").textContent=ui("title");$(".v6a-sub").textContent=ui("sub");
 const langs=$(".v6a-langs");langs.textContent="";
 LANGS.forEach(c=>{langs.append(document.createTextNode(" · "));const b=el("button",{type:"button",class:"v6a-lang"+(c===l?" is-on":""),"aria-pressed":String(c===l),lang:c,text:c.toUpperCase()});b.addEventListener("click",()=>window.MUKSite&&window.MUKSite.setLang(c));langs.append(b);});
 for(const[a,k]of[["call","call"],["reset","reset"],["close","close"]]){const b=panel.querySelector(`[data-a="${a}"]`);b.setAttribute("aria-label",ui(k));b.title=ui(k);}
 $('label[for="v6a-input"]').textContent=ui("ph");input.placeholder=ui("ph");
 micBtn.setAttribute("aria-label",listening?ui("micStop"):ui("mic"));$(".v6a-send").setAttribute("aria-label",ui("send"));
 $(".v6a-disc-text").textContent=ui("disc");$(".v6a-privacy").textContent=ui("privacy");
 chips.setAttribute("aria-label",ui("suggest"));
 $(".v6a-call-title").textContent=ui("callTitle");
 callBox.querySelectorAll("[data-k]").forEach(s=>s.textContent=ui(s.dataset.k));
 const mute=panel.querySelector('[data-a="mute"]');mute.setAttribute("aria-label",callMuted?ui("callUnmute"):ui("callMute"));
 panel.querySelector('[data-a="hang"]').setAttribute("aria-label",ui("callEnd"));
 log.querySelectorAll(".v6a-say").forEach(b=>b.setAttribute("aria-label",b.classList.contains("is-on")?ui("stop"):ui("listen")));
}

/* ---------- messages ---------- */
const SAFE_EXT=/^https:\/\/(www\.)?(gov\.uk|ucas\.com|chevening\.org|study-uk\.britishcouncil\.org|agent-counsellor-ukhub\.britishcouncil\.org|britishcouncil\.org|ielts\.org)(\/|$)/i;
function linkTarget(a,href){if(/^https?:/i.test(href)){a.target="_blank";a.rel="noopener noreferrer";}}
function richText(container,text){
 const lines=String(text).split(/\n+/);let ul=null;
 for(const line of lines){
  const isLi=/^\s*[•\-–]\s+/.test(line);const content=line.replace(/^\s*[•\-–]\s+/,"");
  const node=el(isLi?"li":"p");inlineLinks(node,content);
  if(isLi){if(!ul){ul=el("ul");container.append(ul);}ul.append(node);}else{ul=null;container.append(node);}
 }
}
function inlineLinks(node,text){
 const re=/(https:\/\/[^\s)]+[^\s).,;:!?»”])|(^|\s)(\/(?:[a-z0-9-]+\/)+(?:#[a-z0-9-]+)?)|([a-z0-9._%+-]+@muktalent\.com)/gi;let last=0,m;
 while((m=re.exec(text))){
  const pre=m[2]||"",raw=m[1]||m[3]||m[4],start=m.index+pre.length;
  node.append(document.createTextNode(text.slice(last,start)));
  let href=null;
  if(m[1]){if(SAFE_EXT.test(raw))href=raw;}else if(m[3])href=raw;else if(m[4])href="mailto:"+raw;
  if(href){const a=el("a",{href,text:raw});linkTarget(a,href);node.append(a);}else node.append(document.createTextNode(raw));
  last=start+raw.length;
 }
 node.append(document.createTextNode(text.slice(last)));
}
function renderMsg(m){
 const row=el("div",{class:`v6a-msg v6a-${m.r}`});
 if(m.r==="a"){row.append(el("span",{class:"v6a-msg-av","aria-hidden":"true"},'<img src="/assets/assistant-avatar.png?v=6.0.0" alt="" width="28" height="28">'));}
 const bub=el("div",{class:"v6a-bubble"});
 bub.append(el("span",{class:"v6a-sr",text:(m.r==="u"?ui("you"):ui("bot"))+" : "}));
 richText(bub,m.t);
 if(m.r==="a"&&m.links&&m.links.length&&KB){
  const box=el("div",{class:"v6a-links"});
  for(const id of m.links){const L=KB.links[id];if(!L)continue;const a=el("a",{class:"v6a-link",href:L.href});a.append(document.createTextNode(L.l[m.l||lang()]||L.l.fr));a.insertAdjacentHTML("beforeend",icon("arrow"));linkTarget(a,L.href);box.append(a);}
  bub.append(box);
 }
 if(m.r==="a"){
  const foot=el("div",{class:"v6a-meta"});
  if(TTS){const say=el("button",{type:"button",class:"v6a-say","aria-label":ui("listen")},icon("speaker"));say.addEventListener("click",()=>{if(say.classList.contains("is-on")){stopSpeak();}else speak(m.t,m.l||lang(),say);});foot.append(say);}
  if(m.ai)foot.append(el("span",{class:"v6a-ai",text:ui("live")}));
  bub.append(foot);
 }
 row.append(bub);log.append(row);
 return row;
}
function renderChips(ids){
 chips.textContent="";if(!KB)return;
 const l=lang(),list=(ids&&ids.length?ids:KB.chips).slice(0,ids&&ids.length?4:10);
 for(const id of list){const lab=KB.chipLabels[id];if(!lab)continue;const b=el("button",{type:"button",class:"v6a-chip",text:lab[l]||lab.fr});b.addEventListener("click",()=>ask(lab[l]||lab.fr,id));chips.append(b);}
 chips.hidden=!chips.children.length;
}
function scrollEnd(){requestAnimationFrame(()=>{log.scrollTop=log.scrollHeight;});}
function renderAll(){
 log.textContent="";
 if(!state.msgs.length)state.msgs.push({r:"a",t:KB.welcome[lang()],l:lang(),w:true});
 for(const m of state.msgs)renderMsg(m);
 const lastA=[...state.msgs].reverse().find(m=>m.r==="a");
 renderChips(lastA&&!lastA.w?lastA.next:null);scrollEnd();
}
function push(m){m.l=m.l||lang();state.msgs.push(m);store.save(state);const row=renderMsg(m);scrollEnd();return row;}
async function ask(text,chipId){
 text=String(text||"").trim().slice(0,600);if(!text||busy)return null;
 busy=true;stopSpeak();await loadKB();
 push({r:"u",t:text});input.value="";autosize();chips.textContent="";
 const typing=el("div",{class:"v6a-msg v6a-a v6a-typing"},`<span class="v6a-msg-av" aria-hidden="true"><img src="/assets/assistant-avatar.png?v=6.0.0" alt="" width="28" height="28"></span><div class="v6a-bubble"><span class="v6a-sr">${ui("typing")}</span><i></i><i></i><i></i></div>`);
 log.append(typing);scrollEnd();
 let res;
 try{
  if(chipId){const i=KB.intents.find(x=>x.id===chipId);res=i?{t:i.a[lang()]||i.a.fr,links:i.links||[],next:i.next||[]}:await answer(text);}
  else res=await answer(text);
 }catch{res={t:KB.fallback.a[lang()],links:KB.fallback.links,next:KB.fallback.next};}
 await new Promise(r=>setTimeout(r,res.ai?0:380));
 typing.remove();
 const m={r:"a",t:res.t,links:res.links,next:res.next,ai:!!res.ai};push(m);renderChips(m.next);
 busy=false;return m;
}

/* ---------- speech out ---------- */
let speakingBtn=null;
function pickVoice(l){const vs=speechSynthesis.getVoices();const want=VOICE[l].toLowerCase(),pre=l;return vs.find(v=>v.lang.toLowerCase()===want&&/natural|google|premium|enhanced/i.test(v.name))||vs.find(v=>v.lang.toLowerCase()===want)||vs.find(v=>v.lang.toLowerCase().startsWith(pre));}
function clean(t){return String(t).replace(/https?:\/\/\S+/g,"").replace(/[•→↗]/g," ").replace(/\s+/g," ").trim();}
function speak(text,l,btn,onend){
 if(!TTS){onend&&onend();return;}
 stopSpeak();
 const u=new SpeechSynthesisUtterance(clean(text));u.lang=VOICE[l]||"fr-FR";const v=pickVoice(l);if(v)u.voice=v;u.rate=1.02;u.pitch=1;
 if(btn){speakingBtn=btn;btn.classList.add("is-on");btn.innerHTML=icon("stop");btn.setAttribute("aria-label",ui("stop"));}
 const done=()=>{if(btn){btn.classList.remove("is-on");btn.innerHTML=icon("speaker");btn.setAttribute("aria-label",ui("listen"));}if(speakingBtn===btn)speakingBtn=null;onend&&onend();onend=null;};
 u.onend=done;u.onerror=done;
 speechSynthesis.speak(u);
 // Chrome sometimes never fires onend for long texts.
 const guard=setInterval(()=>{if(!speechSynthesis.speaking){clearInterval(guard);done();}},600);
}
function stopSpeak(){if(TTS){speechSynthesis.cancel();}if(speakingBtn){speakingBtn.classList.remove("is-on");speakingBtn.innerHTML=icon("speaker");speakingBtn.setAttribute("aria-label",ui("listen"));speakingBtn=null;}}

/* ---------- dictation ---------- */
let rec=null,listening=false;
function startDictation(){
 if(!SR)return;if(listening){rec&&rec.stop();return;}
 stopSpeak();rec=new SR();rec.lang=REC[lang()];rec.interimResults=true;rec.continuous=false;rec.maxAlternatives=1;
 let finalText="";
 rec.onresult=e=>{let interim="";for(let i=e.resultIndex;i<e.results.length;i++){const r=e.results[i];if(r.isFinal)finalText+=r[0].transcript;else interim+=r[0].transcript;}input.value=(finalText+interim).trim();autosize();};
 rec.onerror=e=>{if(e.error==="not-allowed"||e.error==="service-not-allowed")notice(ui("micDenied"));};
 rec.onend=()=>{listening=false;micBtn.classList.remove("is-on");micBtn.innerHTML=icon("mic");micBtn.setAttribute("aria-label",ui("mic"));if(finalText.trim())ask(finalText.trim());};
 try{rec.start();listening=true;micBtn.classList.add("is-on");micBtn.innerHTML=icon("micOff");micBtn.setAttribute("aria-label",ui("micStop"));}catch{listening=false;}
}
function notice(t){const n=el("p",{class:"v6a-notice",role:"status",text:t});log.append(n);scrollEnd();setTimeout(()=>n.remove(),6000);}

/* ---------- voice call mode ---------- */
let inCall=false,callMuted=false,callRec=null;
const callStatus=$(".v6a-call-status"),callText=$(".v6a-call-text"),orb=$(".v6a-orb");
function setCall(stateName,text){callBox.dataset.state=stateName;callStatus.textContent=text||"";}
function startCall(){
 inCall=true;callMuted=false;callBox.hidden=false;panel.classList.add("v6a-in-call");callText.textContent="";
 labels();
 if(!SR||!TTS){setCall("idle",ui("callUnsupported"));return;}
 setCall("speaking",ui("callSpeaking"));
 speak(ui("callHello"),lang(),null,()=>{if(inCall)callListen();});
 setTimeout(()=>panel.querySelector('[data-a="hang"]').focus(),60);
}
function callListen(){
 if(!inCall||callMuted)return;
 setCall("listening",ui("callListening"));
 callRec=new SR();callRec.lang=REC[lang()];callRec.interimResults=true;callRec.continuous=false;
 let finalText="";
 callRec.onresult=e=>{let interim="";for(let i=e.resultIndex;i<e.results.length;i++){const r=e.results[i];if(r.isFinal)finalText+=r[0].transcript;else interim+=r[0].transcript;}callText.textContent=(finalText+interim).trim();};
 callRec.onerror=e=>{if(e.error==="not-allowed"||e.error==="service-not-allowed"){setCall("idle",ui("micDenied"));callMuted=true;}};
 callRec.onend=async()=>{
  callRec=null;if(!inCall)return;
  const q=finalText.trim();
  if(!q){if(!callMuted)setTimeout(callListen,250);return;}
  setCall("thinking",ui("callThinking"));
  const m=await ask(q);if(!inCall)return;
  if(!m){callListen();return;}
  callText.textContent=clean(m.t).slice(0,220)+(m.t.length>220?"…":"");
  setCall("speaking",ui("callSpeaking"));
  speak(m.t,lang(),null,()=>{if(inCall)callListen();});
 };
 try{callRec.start();}catch{setTimeout(callListen,400);}
}
function toggleMute(){
 callMuted=!callMuted;const b=panel.querySelector('[data-a="mute"]');b.classList.toggle("is-off",callMuted);b.innerHTML=icon(callMuted?"micOff":"mic");
 b.setAttribute("aria-label",callMuted?ui("callUnmute"):ui("callMute"));
 if(callMuted){callRec&&callRec.abort();stopSpeak();setCall("idle",ui("callPaused"));}else callListen();
}
function endCall(){inCall=false;callRec&&callRec.abort();callRec=null;stopSpeak();callBox.hidden=true;panel.classList.remove("v6a-in-call");panel.querySelector('[data-a="call"]').focus();}

/* ---------- open / close ---------- */
let opened=false;
async function open(){
 hideTeaser(true);
 try{await loadKB();}catch{}
 if(!opened){opened=true;labels();if(KB)renderAll();}
 panel.hidden=false;requestAnimationFrame(()=>panel.classList.add("is-open"));
 launch.setAttribute("aria-expanded","true");root.classList.add("is-open");
 if(matchMedia("(max-width:640px)").matches)d.classList.add("v6a-lock");
 setTimeout(()=>{if(!matchMedia("(pointer:coarse)").matches)input.focus();},120);
 aiStatus();
}
function close(){
 if(inCall)endCall();if(listening&&rec)rec.abort();stopSpeak();
 panel.classList.remove("is-open");root.classList.remove("is-open");launch.setAttribute("aria-expanded","false");d.classList.remove("v6a-lock");
 setTimeout(()=>{if(!panel.classList.contains("is-open"))panel.hidden=true;},260);
 launch.focus();
}
function reset(){if(inCall)endCall();stopSpeak();state.msgs=[];store.save(state);renderAll();input.focus();}
function hideTeaser(remember){teaser.classList.remove("is-on");setTimeout(()=>{teaser.hidden=true;},250);if(remember)try{sessionStorage.setItem(TEASE,"1");}catch{}}
function autosize(){input.style.height="auto";input.style.height=Math.min(input.scrollHeight,120)+"px";}

launch.addEventListener("click",()=>panel.classList.contains("is-open")?close():open());
launch.addEventListener("pointerenter",()=>{loadKB().catch(()=>{});},{once:true});
teaserBtn.addEventListener("click",open);teaserX.addEventListener("click",()=>hideTeaser(true));
panel.addEventListener("click",e=>{const b=e.target.closest("[data-a]");if(!b)return;const a=b.dataset.a;
 if(a==="close")close();else if(a==="reset")reset();else if(a==="call")inCall?endCall():startCall();else if(a==="mic")startDictation();else if(a==="mute")toggleMute();else if(a==="hang")endCall();});
form.addEventListener("submit",e=>{e.preventDefault();ask(input.value);});
input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey&&!e.isComposing){e.preventDefault();ask(input.value);}});
input.addEventListener("input",autosize);
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&panel.classList.contains("is-open")){if(inCall)endCall();else close();}});
window.addEventListener("muk:assistant-open",open);
document.addEventListener("visibilitychange",()=>{if(document.hidden&&inCall){callMuted=false;toggleMute();}});
const onLang=()=>{labels();if(!KB||!opened)return;
 if(state.msgs.length===1&&state.msgs[0].w){state.msgs=[];renderAll();}
 else{const lastA=[...state.msgs].reverse().find(m=>m.r==="a");renderChips(lastA&&!lastA.w?lastA.next:null);}
 if(inCall){callRec&&callRec.abort();}
};
function mount(){
 document.body.append(root);labels();
 if(window.MUKSite)window.MUKSite.onLang(onLang);else window.addEventListener("muk:lang",onLang);
 if(location.hash==="#assistant")open();
 let seen=false;try{seen=sessionStorage.getItem(TEASE)==="1";}catch{}
 const onEval=/^\/evaluation\/?/.test(location.pathname);
 if(!seen&&!onEval&&!state.msgs.length){setTimeout(()=>{if(panel.classList.contains("is-open"))return;teaser.hidden=false;requestAnimationFrame(()=>teaser.classList.add("is-on"));},5000);}
 if(TTS&&speechSynthesis.getVoices().length===0)speechSynthesis.addEventListener?.("voiceschanged",()=>{},{once:true});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
window.MUKAssistant=Object.freeze({open,close,ask:t=>open().then(()=>ask(t)),_match:t=>loadKB().then(()=>{const i=match(t);return i?i.id:null;})});
})();
