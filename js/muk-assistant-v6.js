/* MUK Talent assistant v6 — type or talk, voice call mode, FR · EN · ES · AR */
(()=>{
"use strict";
if(window.__mukAssistant)return;window.__mukAssistant=true;
const d=document.documentElement,V="6.0.0",KEY="muk-assistant-v6",TEASE="muk-assistant-teaser";
const LANGS=["fr","en","es","ar"],VOICE={fr:"fr-FR",en:"en-GB",es:"es-ES",ar:"ar-SA"},REC={fr:"fr-FR",en:"en-GB",es:"es-ES",ar:"ar-MA"};
const lang=()=>{const l=(window.MUKSite&&window.MUKSite.lang)||(d.lang||"fr").slice(0,2);return LANGS.includes(l)?l:"fr";};
const UI={
 fr:{title:"Assistant MUK Talent",sub:"Écrire ou parler",open:"Ouvrir l’assistant",close:"Fermer l’assistant",reset:"Nouvelle conversation",call:"Appel vocal",ph:"Posez votre question…",send:"Envoyer",mic:"Dicter votre question",micStop:"Arrêter la dictée",listen:"Écouter la réponse",stop:"Arrêter la lecture",typing:"L’assistant écrit…",teaser:"Une question sur vos études au Royaume-Uni ?",teaserClose:"Masquer",disc:"Assistant automatique : il peut se tromper. Ne partagez pas de données sensibles.",privacy:"Confidentialité",micDenied:"Le micro n’est pas autorisé. Vous pouvez écrire votre question.",callTitle:"Appel avec l’assistant",callHello:"Je vous écoute. Posez votre question.",callListening:"Je vous écoute…",callThinking:"Je réfléchis…",callSpeaking:"Je réponds…",callPaused:"Micro en pause",callTap:"Touchez le cercle pour parler",callTapDone:"Parlez, puis touchez le cercle pour envoyer",noHear:"Je n’ai rien entendu. Réessayez en parlant près du micro.",callUnsupported:"La voix n’est pas disponible dans ce navigateur. Essayez Chrome, Edge ou Safari, ou réservez un échange avec un conseiller.",callEnd:"Raccrocher",callMute:"Couper le micro",callUnmute:"Réactiver le micro",book:"Réserver une visio avec un conseiller",phone:"Appeler un conseiller",suggest:"Suggestions",you:"Vous",bot:"Assistant",live:"IA"},
 en:{title:"MUK Talent assistant",sub:"Type or talk",open:"Open the assistant",close:"Close the assistant",reset:"New conversation",call:"Voice call",ph:"Ask your question…",send:"Send",mic:"Dictate your question",micStop:"Stop dictation",listen:"Listen to the answer",stop:"Stop reading",typing:"The assistant is typing…",teaser:"A question about studying in the UK?",teaserClose:"Hide",disc:"Automated assistant: it may make mistakes. Do not share sensitive data.",privacy:"Privacy",micDenied:"Microphone access is blocked. You can type your question.",callTitle:"Call with the assistant",callHello:"I’m listening. Ask your question.",callListening:"Listening…",callThinking:"Thinking…",callSpeaking:"Answering…",callPaused:"Microphone paused",callTap:"Tap the circle to speak",callTapDone:"Speak, then tap the circle to send",noHear:"I didn’t hear anything. Try again, speaking close to the microphone.",callUnsupported:"Voice is not available in this browser. Try Chrome, Edge or Safari, or book a call with an adviser.",callEnd:"Hang up",callMute:"Mute microphone",callUnmute:"Unmute microphone",book:"Book a video call with an adviser",phone:"Call an adviser",suggest:"Suggestions",you:"You",bot:"Assistant",live:"AI"},
 es:{title:"Asistente MUK Talent",sub:"Escribe o habla",open:"Abrir el asistente",close:"Cerrar el asistente",reset:"Nueva conversación",call:"Llamada de voz",ph:"Escribe tu pregunta…",send:"Enviar",mic:"Dictar tu pregunta",micStop:"Detener el dictado",listen:"Escuchar la respuesta",stop:"Detener la lectura",typing:"El asistente está escribiendo…",teaser:"¿Una pregunta sobre estudiar en el Reino Unido?",teaserClose:"Ocultar",disc:"Asistente automático: puede equivocarse. No compartas datos sensibles.",privacy:"Privacidad",micDenied:"El micrófono no está autorizado. Puedes escribir tu pregunta.",callTitle:"Llamada con el asistente",callHello:"Te escucho. Haz tu pregunta.",callListening:"Te escucho…",callThinking:"Pensando…",callSpeaking:"Respondiendo…",callPaused:"Micrófono en pausa",callTap:"Toca el círculo para hablar",callTapDone:"Habla y toca el círculo para enviar",noHear:"No he oído nada. Inténtalo de nuevo hablando cerca del micrófono.",callUnsupported:"La voz no está disponible en este navegador. Prueba Chrome, Edge o Safari, o reserva una cita con un asesor.",callEnd:"Colgar",callMute:"Silenciar micrófono",callUnmute:"Activar micrófono",book:"Reservar una videollamada con un asesor",phone:"Llamar a un asesor",suggest:"Sugerencias",you:"Tú",bot:"Asistente",live:"IA"},
 ar:{title:"مساعد MUK Talent",sub:"اكتب أو تحدث",open:"فتح المساعد",close:"إغلاق المساعد",reset:"محادثة جديدة",call:"مكالمة صوتية",ph:"اكتب سؤالك…",send:"إرسال",mic:"إملاء سؤالك",micStop:"إيقاف الإملاء",listen:"الاستماع إلى الإجابة",stop:"إيقاف القراءة",typing:"المساعد يكتب…",teaser:"هل لديك سؤال عن الدراسة في المملكة المتحدة؟",teaserClose:"إخفاء",disc:"مساعد آلي: قد يخطئ. لا تشارك بيانات حساسة.",privacy:"الخصوصية",micDenied:"الميكروفون غير مسموح. يمكنك كتابة سؤالك.",callTitle:"مكالمة مع المساعد",callHello:"أنا أستمع إليك. اطرح سؤالك.",callListening:"أستمع إليك…",callThinking:"أفكر…",callSpeaking:"أجيب…",callPaused:"الميكروفون متوقف",callTap:"المس الدائرة للتحدث",callTapDone:"تحدث ثم المس الدائرة للإرسال",noHear:"لم أسمع شيئًا. حاول مرة أخرى بالقرب من الميكروفون.",callUnsupported:"الصوت غير متاح في هذا المتصفح. جرّب Chrome أو Edge أو Safari، أو احجز موعدًا مع مستشار.",callEnd:"إنهاء المكالمة",callMute:"كتم الميكروفون",callUnmute:"تشغيل الميكروفون",book:"حجز مكالمة فيديو مع مستشار",phone:"الاتصال بمستشار",suggest:"اقتراحات",you:"أنت",bot:"المساعد",live:"ذكاء اصطناعي"}
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
 if(!kbPromise)kbPromise=new Promise((res,rej)=>{const s=document.createElement("script");s.src=`/js/muk-assistant-kb-v6.js?v=14.0.0`;s.async=true;s.onload=()=>{KB=prepare(window.MUK_ASSISTANT_KB);res(KB);};s.onerror=()=>{kbPromise=null;rej(new Error("kb"));};document.head.append(s);});
 return kbPromise;
}
const norm=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[\u064B-\u065F\u0670\u0640]/g,"").replace(/[أإآ]/g,"ا").replace(/ة/g,"ه").replace(/ى/g,"ي").replace(/[’'`´]/g," ").replace(/[^\p{L}\p{N}\s-]/gu," ").replace(/\s+/g," ").trim();
const STOP=new Set("le la les un une des de du d l au aux et ou en a est ce que qui quoi pour par sur avec dans je j me mon ma mes tu te ton vous votre vos il elle on nous ils y ne pas plus faut faire peux puis the a an of to in on for and or is are do does i my me you your it can how what which be el los las del al y o es son que para por con en mi mis tu se lo como cual un una unos unas me te nos hay".split(" "));
const stem=w=>w.length>4?w.replace(/(ements|ement|ments|ment|ations|ation|iones|cion|ions|ings|ing|ies|es|s|e)$/,""):w;
const words=s=>norm(s).split(" ").filter(w=>w&&!STOP.has(w));
function lev(a,b,max){if(Math.abs(a.length-b.length)>max)return max+1;let p=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){const c=[i];let m=i;for(let j=1;j<=b.length;j++){c[j]=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));if(c[j]<m)m=c[j];}if(m>max)return max+1;p=c;}return p[b.length];}
function prepare(kb){for(const i of kb.intents){const k=[...new Set(i.kw.map(norm).filter(Boolean))];i._ph=k.filter(x=>x.includes(" "));i._w=[...new Set(k.filter(x=>!x.includes(" ")).map(stem))];}return kb;}
function scoreAll(text){
 const t=` ${norm(text)} `,toks=words(text),st=toks.map(stem),scores={};
 for(const i of KB.intents){let s=0;
  for(const k of i._ph)if(t.includes(` ${k}`)||t.includes(k)&&k.length>7)s+=1.4+k.length/10;
  for(const k of i._w){if(st.includes(k)){s+=1+k.length/8;continue;}
   if(k.length>=5&&st.some(w=>w.length>=4&&(w.startsWith(k)||k.startsWith(w)&&w.length>=5))){s+=.8+k.length/12;continue;}
   if(k.length>=4){const max=k.length>=9?2:1;if(st.some(w=>w.length>=4&&lev(w,k,max)<=max))s+=k.length>=7?1:.6;}}
  scores[i.id]=s;}
 return scores;
}
function match(text){
 const scores=scoreAll(text);
 const ranked=KB.intents.filter(i=>scores[i.id]>0).sort((a,b)=>scores[b.id]-scores[a.id]);
 let best=ranked[0]||null;
 if(best&&(best.id==="greet"||best.id==="thanks")){const o=ranked.find(i=>i.id!=="greet"&&i.id!=="thanks");if(o)best=o;}
 match.score=best?scores[best.id]:0;
 match.related=ranked.filter(i=>(i!==best||match.score<1)&&i.id!=="greet"&&i.id!=="thanks").slice(0,3).map(i=>i.id);
 match.score=best?scores[best.id]:0;
 return best&&match.score>=1?best:null;
}
let misses=0;
function localAnswer(text){
 const l=lang(),i=match(text);
 if(!i){misses++;const rel=match.related||[];const F=KB.fallback;
  if(misses>=2&&KB.fallback2)return{t:KB.fallback2[l]||KB.fallback2.fr,links:["contact"],next:["talk",...rel.slice(0,2),"how"],id:"fallback"};
  const next=[...new Set([...rel,...F.next])].slice(0,10);
  return{t:F.a[l]||F.a.fr,links:F.links,next,id:"fallback"};}
 misses=0;
 return{t:i.a[l]||i.a.fr,links:i.links||[],next:i.next||[],id:i.id,talk:(KB.handoff||[]).includes(i.id)};
}
async function aiStatus(){
 if(aiEnabled!==null)return aiEnabled;
 try{const r=await fetch("/api/assistant/status",{headers:{accept:"application/json"},cache:"no-store"});const j=r.ok?await r.json():{};aiEnabled=!!j.enabled;voiceSrv=!!j.voice;}catch{aiEnabled=false;voiceSrv=false;}
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
 if(local.id!=="greet"&&local.id!=="thanks"&&!local.talk&&await aiStatus()){
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
const CAN_REC=!!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia&&window.MediaRecorder);
let voiceSrv=null;
const TTS="speechSynthesis" in window&&"SpeechSynthesisUtterance" in window;
if(!SR&&!CAN_REC)micBtn.hidden=true;

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
  if(TTS||MOBILE){const say=el("button",{type:"button",class:"v6a-say","aria-label":ui("listen")},icon("speaker"));say.addEventListener("click",()=>{if(say.classList.contains("is-on")){stopSpeak();}else speak(m.t,m.l||lang(),say);});foot.append(say);}
  if(m.ai)foot.append(el("span",{class:"v6a-ai",text:ui("live")}));
  bub.append(foot);
 }
 row.append(bub);log.append(row);
 return row;
}
function talkToTeam(){
 const msgs=state.msgs.filter(m=>(m.r==="u"||m.r==="a")&&!m.w).slice(-12).map(m=>({from:m.r==="u"?"user":"bot",text:String(m.t).slice(0,600)}));
 const lastQ=[...state.msgs].reverse().find(m=>{if(m.r!=="u")return false;const i=KB&&match(m.t);return !(i&&(KB.handoff||[]).includes(i.id));});
 if(window.MUKTalk){window.MUKTalk.open({source:"assistant",message:lastQ?lastQ.t:"",transcript:msgs});}
 else location.href="/contact/";
}
function renderChips(ids){
 chips.textContent="";if(!KB)return;
 const l=lang(),list=(ids&&ids.length?ids:KB.chips).slice(0,ids&&ids.length?(ids.length>5?10:4):10);
 for(const id of list){const lab=KB.chipLabels[id];if(!lab)continue;const b=el("button",{type:"button",class:id==="talk"?"v6a-chip v6a-chip-talk":"v6a-chip",text:lab[l]||lab.fr});b.addEventListener("click",()=>id==="talk"?talkToTeam():ask(lab[l]||lab.fr,id));chips.append(b);}
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
  if(chipId){const i=KB.intents.find(x=>x.id===chipId);res=i?{t:i.a[lang()]||i.a.fr,links:i.links||[],next:i.next||[],talk:(KB.handoff||[]).includes(i.id)}:await answer(text);}
  else res=await answer(text);
 }catch{res={t:KB.fallback.a[lang()],links:KB.fallback.links,next:KB.fallback.next};}
 await new Promise(r=>setTimeout(r,res.ai?0:380));
 typing.remove();
 const m={r:"a",t:res.t,links:res.links,next:res.next,ai:!!res.ai};push(m);renderChips(m.next);if(res.talk)setTimeout(talkToTeam,450);
 busy=false;return m;
}

/* ---------- speech out ---------- */
let speakingBtn=null;
function pickVoice(l){const vs=speechSynthesis.getVoices();const want=VOICE[l].toLowerCase(),pre=l;return vs.find(v=>v.lang.toLowerCase()===want&&/natural|google|premium|enhanced/i.test(v.name))||vs.find(v=>v.lang.toLowerCase()===want)||vs.find(v=>v.lang.toLowerCase().startsWith(pre));}
function clean(t){return String(t).replace(/https?:\/\/\S+/g,"").replace(/[•→↗]/g," ").replace(/\s+/g," ").trim();}
/* Mobile: iOS only plays speech started from a tap, so we "unlock" the engine on the first tap. Android reports speaking=false before the
   voice starts, which used to end the turn early and start the microphone on top of the voice (cutting it). */
let ttsUnlocked=false;
function unlockTTS(){unlockAudio();if(!TTS||ttsUnlocked)return;ttsUnlocked=true;try{const u=new SpeechSynthesisUtterance("\u00a0");u.volume=0.01;u.rate=10;speechSynthesis.speak(u);}catch{}}
/* v17 · Mobile voice: the browser's own speech engines are unreliable on phones (iOS Chrome / in-app browsers have no
   recognition, iOS drops speech not started from a tap, Android cuts the mic). On phones we record with MediaRecorder and
   play server-generated audio through one <audio> element unlocked on the first tap. Desktop keeps the native engines. */
const MOBILE=(matchMedia("(pointer:coarse)").matches&&matchMedia("(max-width:1024px)").matches)||/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const useSrvSpeak=()=>voiceSrv===true&&(MOBILE||!TTS);
const useSrvListen=()=>voiceSrv===true&&CAN_REC&&(MOBILE||!SR);
let player=null,audioCtx=null,silentURL="",playerURL="";
function silentWav(){const n=800,b=new ArrayBuffer(44+n*2),v=new DataView(b),w=(o,t)=>{for(let i=0;i<t.length;i++)v.setUint8(o+i,t.charCodeAt(i));};w(0,"RIFF");v.setUint32(4,36+n*2,true);w(8,"WAVE");w(12,"fmt ");v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,8000,true);v.setUint32(28,16000,true);v.setUint16(32,2,true);v.setUint16(34,16,true);w(36,"data");v.setUint32(40,n*2,true);return URL.createObjectURL(new Blob([b],{type:"audio/wav"}));}
function unlockAudio(){
 try{if(!player){player=new Audio();player.setAttribute("playsinline","");player.preload="auto";silentURL=silentWav();}
  if(player.paused&&!playerURL){player.src=silentURL;player.muted=false;const p=player.play();p&&p.catch(()=>{});}}catch{}
 try{const AC=window.AudioContext||window.webkitAudioContext;if(AC){audioCtx=audioCtx||new AC();if(audioCtx.state==="suspended")audioCtx.resume().catch(()=>{});}}catch{}
}
let speakSeq=0;
function speak(text,l,btn,onend){
 if(useSrvSpeak())return speakServer(text,l,btn,onend);
 return speakNative(text,l,btn,onend);
}
function speakNative(text,l,btn,onend){
 if(!TTS){onend&&onend();return;}
 const busyNow=speechSynthesis.speaking||speechSynthesis.pending;
 stopSpeak();
 const txt=clean(text);const u=new SpeechSynthesisUtterance(txt);u.lang=VOICE[l]||"fr-FR";const v=pickVoice(l);if(v)u.voice=v;u.rate=1.02;u.pitch=1;u.volume=1;
 if(btn){speakingBtn=btn;btn.classList.add("is-on");btn.innerHTML=icon("stop");btn.setAttribute("aria-label",ui("stop"));}
 let started=false,finished=false,guard=0,limit=0;
 const done=()=>{if(finished)return;finished=true;clearInterval(guard);clearTimeout(limit);if(btn){btn.classList.remove("is-on");btn.innerHTML=icon("speaker");btn.setAttribute("aria-label",ui("listen"));}if(speakingBtn===btn)speakingBtn=null;const f=onend;onend=null;f&&f();};
 u.onstart=()=>{started=true;};u.onend=done;u.onerror=done;
 // Speak in the same tick as the tap (iOS needs it). Only after cancelling a running voice do we wait one tick.
 const go=()=>{try{speechSynthesis.resume();speechSynthesis.speak(u);}catch{done();}};
 if(busyNow)setTimeout(go,60);else go();
 guard=setInterval(()=>{if(started&&!speechSynthesis.speaking&&!speechSynthesis.pending)done();},700);
 limit=setTimeout(done,Math.min(120000,5000+txt.length*90));
}
async function speakServer(text,l,btn,onend){
 stopSpeak();unlockAudio();
 const my=++speakSeq,txt=clean(text).slice(0,1500);
 if(btn){speakingBtn=btn;btn.classList.add("is-on");btn.innerHTML=icon("stop");btn.setAttribute("aria-label",ui("stop"));}
 let finished=false;
 const done=()=>{if(finished)return;finished=true;if(btn){btn.classList.remove("is-on");btn.innerHTML=icon("speaker");btn.setAttribute("aria-label",ui("listen"));}if(speakingBtn===btn)speakingBtn=null;const f=onend;onend=null;f&&f();};
 try{
  const r=await fetch("/api/assistant/speech",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({text:txt,lang:l})});
  if(!r.ok)throw new Error(String(r.status));
  const blob=await r.blob();if(my!==speakSeq){done();return;}
  if(playerURL)URL.revokeObjectURL(playerURL);playerURL=URL.createObjectURL(blob);
  player.onended=()=>{if(my===speakSeq)done();};player.onerror=()=>{if(my===speakSeq)done();};
  player.src=playerURL;await player.play();
 }catch{
  if(my!==speakSeq)return done();
  // Fallback: the phone's own voice.
  if(TTS){finished=true;speakNative(text,l,btn,onend);}else done();
 }
}
function stopSpeak(){speakSeq++;if(TTS){try{speechSynthesis.cancel();}catch{}}if(player&&!player.paused&&player.src!==silentURL){try{player.pause();}catch{}}if(speakingBtn){speakingBtn.classList.remove("is-on");speakingBtn.innerHTML=icon("speaker");speakingBtn.setAttribute("aria-label",ui("listen"));speakingBtn=null;}}

/* ---------- server recording (mobile) ---------- */
const CAN_REC_TYPES=["audio/webm;codecs=opus","audio/webm","audio/mp4","audio/ogg;codecs=opus","audio/aac"];
let srvRec=null;
// Records one utterance. Ends on silence after speech, on stop(), or at maxMs. Resolves {blob,heard,vad} or null if aborted.
// v22 · iPhone: a call keeps ONE microphone stream open (reopening it every turn made iOS switch the audio route and
// return silent or very quiet audio). The silence detector resumes the AudioContext first and adapts to the room noise;
// if iOS still blocks it, the user ends the turn by tapping the circle instead of waiting for the time limit.
let callStream=null,callSource=null;
function micConstraints(){return {audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true,channelCount:1}};}
function setAudioSession(type){try{if(navigator.audioSession)navigator.audioSession.type=type;}catch{}}
async function getCallStream(){
 const live=callStream&&callStream.getAudioTracks().some(t=>t.readyState==="live");
 if(live)return callStream;
 releaseCallStream();
 setAudioSession("play-and-record");
 callStream=await navigator.mediaDevices.getUserMedia(micConstraints());
 for(const t of callStream.getAudioTracks())t.addEventListener("ended",()=>{if(callStream&&!callStream.getAudioTracks().some(x=>x.readyState==="live")){callStream=null;callSource=null;}});
 return callStream;
}
function releaseCallStream(){try{callSource&&callSource.disconnect();}catch{}callSource=null;if(callStream){callStream.getTracks().forEach(t=>t.stop());callStream=null;}setAudioSession("auto");}
function recordOnce({maxMs=15000,silenceMs=1300,quietMs=8000,onLevel,stream:shared=null}={}){
 let stopFn=()=>{},abortFn=()=>{};
 const pr=(async()=>{
  const stream=shared||await navigator.mediaDevices.getUserMedia(micConstraints());
  if(player&&!player.paused){try{player.pause();}catch{}}
  if(audioCtx&&audioCtx.state!=="running"){try{await audioCtx.resume();}catch{}}
  const type=CAN_REC_TYPES.find(t=>MediaRecorder.isTypeSupported&&MediaRecorder.isTypeSupported(t))||"";
  const mr=new MediaRecorder(stream,type?{mimeType:type}:undefined),chunks=[];
  let heard=false,aborted=false,timer=0,raf=0,src=null,an=null,t0=Date.now(),loud=0,floor=0,samples=0;
  const vad=!!(audioCtx&&audioCtx.state==="running");
  if(vad){try{src=shared?(callSource||(callSource=audioCtx.createMediaStreamSource(stream))):audioCtx.createMediaStreamSource(stream);an=audioCtx.createAnalyser();an.fftSize=1024;src.connect(an);}catch{an=null;}}
  if(!an)heard=true;
  const buf=an?new Uint8Array(an.fftSize):null;
  const tick=()=>{if(!an)return;an.getByteTimeDomainData(buf);let sum=0;for(let i=0;i<buf.length;i++){const x=(buf[i]-128)/128;sum+=x*x;}const rms=Math.sqrt(sum/buf.length);onLevel&&onLevel(rms);const now=Date.now();
   if(now-t0<450){floor=(floor*samples+rms)/(++samples);return;}   // learn the room noise for the first ~0.4 s
   const threshold=Math.max(0.012,Math.min(0.05,floor*2.6+0.006));
   if(rms>threshold){heard=true;loud=now;}
   if(heard&&loud&&now-loud>silenceMs)finish();else if(!heard&&now-t0>quietMs)finish();};
  const finish=()=>{clearInterval(raf);clearTimeout(timer);if(mr.state!=="inactive")mr.stop();};
  stopFn=finish;abortFn=()=>{aborted=true;finish();};
  const out=new Promise(res=>{mr.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data);};mr.onstop=()=>{if(!shared)stream.getTracks().forEach(t=>t.stop());try{an&&src&&src.disconnect(an);if(!shared&&src)src.disconnect();}catch{}res(aborted?null:{blob:new Blob(chunks,{type:mr.mimeType||type||"audio/webm"}),heard,vad:!!an});};});
  mr.start(250);timer=setTimeout(finish,an?maxMs:Math.min(maxMs,12000));raf=setInterval(tick,90);
  return out;
 })();
 return {promise:pr,stop:()=>stopFn(),abort:()=>abortFn()};
}
async function transcribe(blob){
 const r=await fetch("/api/assistant/transcribe?lang="+lang(),{method:"POST",headers:{"content-type":blob.type||"audio/webm"},body:blob});
 if(!r.ok)throw new Error(String(r.status));const j=await r.json();return String(j.text||"").replace(/\s+/g," ").trim();
}
const micErr=e=>e&&(e.name==="NotAllowedError"||e.name==="SecurityError"||e.name==="NotFoundError");

/* ---------- dictation ---------- */
let rec=null,listening=false;
function micState(on){micBtn.classList.toggle("is-on",on);micBtn.innerHTML=icon(on?"micOff":"mic");micBtn.setAttribute("aria-label",on?ui("micStop"):ui("mic"));}
async function startDictationServer(){
 if(listening){srvRec&&srvRec.stop();return;}
 listening=true;micState(true);
 const h=recordOnce({maxMs:30000,silenceMs:1600,quietMs:9000});srvRec=h;let res=null;
 try{res=await h.promise;}catch(e){srvRec=null;listening=false;micState(false);notice(micErr(e)?ui("micDenied"):ui("noHear"));return;}
 srvRec=null;listening=false;micState(false);if(!res)return;
 if(!res.heard||res.blob.size<1200){notice(ui("noHear"));return;}
 const ph=input.placeholder;input.placeholder=ui("callThinking");input.disabled=true;
 let q="";try{q=await transcribe(res.blob);}catch{}
 input.placeholder=ph;input.disabled=false;
 if(q)ask(q);else notice(ui("noHear"));
}
async function startDictation(){
 unlockTTS();
 if(listening&&srvRec){srvRec.stop();return;}
 if(listening){rec&&rec.stop();return;}
 if(voiceSrv===null)await aiStatus();
 if(useSrvListen()){stopSpeak();return startDictationServer();}
 if(!SR){notice(ui("callUnsupported"));return;}
 stopSpeak();rec=new SR();rec.lang=REC[lang()];rec.interimResults=true;rec.continuous=false;rec.maxAlternatives=1;
 let finalText="",interim="",failed="";
 rec.onresult=e=>{interim="";for(let i=e.resultIndex;i<e.results.length;i++){const r=e.results[i];if(r.isFinal)finalText+=r[0].transcript+" ";else interim+=r[0].transcript;}input.value=(finalText+interim).trim();autosize();};
 rec.onerror=e=>{failed=e.error;if(e.error==="not-allowed"||e.error==="service-not-allowed"||e.error==="audio-capture")notice(ui("micDenied"));};
 // Android and iOS often end without a "final" result: keep what was heard.
 rec.onend=()=>{listening=false;micBtn.classList.remove("is-on");micBtn.innerHTML=icon("mic");micBtn.setAttribute("aria-label",ui("mic"));const q=(finalText+interim).replace(/\s+/g," ").trim();if(q)ask(q);else if(!failed||failed==="no-speech")notice(ui("noHear"));};
 try{rec.start();listening=true;micBtn.classList.add("is-on");micBtn.innerHTML=icon("micOff");micBtn.setAttribute("aria-label",ui("micStop"));}catch{listening=false;}
}
function notice(t){const n=el("p",{class:"v6a-notice",role:"status",text:t});log.append(n);scrollEnd();setTimeout(()=>n.remove(),6000);}

/* ---------- voice call mode ---------- */
let inCall=false,callMuted=false,callRec=null;
const callStatus=$(".v6a-call-status"),callText=$(".v6a-call-text"),orb=$(".v6a-orb");
function setCall(stateName,text){callBox.dataset.state=stateName;callStatus.textContent=text||"";}
async function startCall(){
 inCall=true;callMuted=false;callBox.hidden=false;panel.classList.add("v6a-in-call");callText.textContent="";
 labels();unlockTTS();
 if(voiceSrv===null)await aiStatus();if(!inCall)return;
 const srv=useSrvListen();
 if(!srv&&(!SR||!TTS)&&!(useSrvSpeak()&&SR)){setCall("idle",ui("callUnsupported"));return;}
 if(srv){try{await getCallStream();}catch(e){setCall("idle",micErr(e)?ui("micDenied"):ui("callTap"));callMuted=true;callBox.classList.add("v6a-tap");return;}if(!inCall){releaseCallStream();return;}}
 setCall("speaking",ui("callSpeaking"));
 speak(ui("callHello"),lang(),null,()=>{if(inCall)callListen();});
 setTimeout(()=>panel.querySelector('[data-a="hang"]').focus(),60);
}
let callMisses=0;
async function callListenServer(){
 if(!inCall||callMuted||srvRec)return;
 callText.textContent="";
 let stream=null;
 try{stream=await getCallStream();}catch(e){setCall("idle",micErr(e)?ui("micDenied"):ui("callTap"));callMuted=true;callBox.classList.add("v6a-tap");return;}
 if(!inCall||callMuted)return;
 if(audioCtx&&audioCtx.state!=="running"){try{await audioCtx.resume();}catch{}}
 const manual=!(audioCtx&&audioCtx.state==="running");
 setCall("listening",manual?ui("callTapDone"):ui("callListening"));
 const h=recordOnce({stream,maxMs:20000,silenceMs:1200,quietMs:7000,onLevel:v=>{orb.style.setProperty("--lvl",Math.min(1,v*9).toFixed(2));}});srvRec=h;let res=null;
 try{res=await h.promise;}catch(e){srvRec=null;releaseCallStream();setCall("idle",micErr(e)?ui("micDenied"):ui("callTap"));callMuted=true;callBox.classList.add("v6a-tap");return;}
 srvRec=null;orb.style.removeProperty("--lvl");
 if(!res||!inCall||callMuted)return;
 if(!res.heard||res.blob.size<1200){callMisses++;if(callMisses>=3){callMuted=true;callBox.classList.add("v6a-tap");setCall("idle",ui("callTap"));return;}setTimeout(callListenServer,250);return;}
 setCall("thinking",ui("callThinking"));
 let q="";try{q=await transcribe(res.blob);}catch{}
 if(!inCall)return;
 if(!q){callMisses++;if(callMisses>=3){callMuted=true;callBox.classList.add("v6a-tap");setCall("idle",ui("callTap"));return;}setTimeout(callListenServer,250);return;}
 callMisses=0;callText.textContent=q;
 const m=await ask(q);if(!inCall)return;
 if(!m){callListenServer();return;}
 callText.textContent=clean(m.t).slice(0,220)+(m.t.length>220?"…":"");
 setCall("speaking",ui("callSpeaking"));
 speak(m.t,lang(),null,()=>{if(inCall)setTimeout(callListenServer,200);});
}
function callListen(){
 if(useSrvListen())return callListenServer();
 if(!inCall||callMuted||callRec)return;
 if(TTS&&(speechSynthesis.speaking||speechSynthesis.pending)){setTimeout(callListen,300);return;}
 setCall("listening",ui("callListening"));
 const r=new SR();callRec=r;r.lang=REC[lang()];r.interimResults=true;r.continuous=false;r.maxAlternatives=1;
 let finalText="",interim="",failed="";
 r.onresult=e=>{interim="";for(let i=e.resultIndex;i<e.results.length;i++){const x=e.results[i];if(x.isFinal)finalText+=x[0].transcript+" ";else interim+=x[0].transcript;}callText.textContent=(finalText+interim).trim();};
 r.onerror=e=>{failed=e.error;if(e.error==="not-allowed"||e.error==="service-not-allowed"||e.error==="audio-capture"){/* iOS refuses to restart the mic without a tap */setCall("idle",callMisses||e.error!=="not-allowed"?ui("callTap"):ui("micDenied"));callMuted=true;callBox.classList.add("v6a-tap");}};
 r.onend=async()=>{
  if(callRec===r)callRec=null;if(!inCall||callMuted)return;
  const q=(finalText+interim).replace(/\s+/g," ").trim();
  if(!q){callMisses++;if(callMisses>=3){callMuted=true;callBox.classList.add("v6a-tap");setCall("idle",ui("callTap"));return;}setTimeout(callListen,350);return;}
  callMisses=0;setCall("thinking",ui("callThinking"));
  const m=await ask(q);if(!inCall)return;
  if(!m){callListen();return;}
  callText.textContent=clean(m.t).slice(0,220)+(m.t.length>220?"…":"");
  setCall("speaking",ui("callSpeaking"));
  speak(m.t,lang(),null,()=>{if(inCall)setTimeout(callListen,250);});
 };
 try{r.start();}catch{callRec=null;setTimeout(callListen,500);}
}
// Tap the orb to talk again (needed on iPhone after a pause).
orb.addEventListener("click",()=>{if(!inCall)return;unlockTTS();if(srvRec&&!callMuted&&callBox.dataset.state==="listening"){srvRec.stop();return;}callBox.classList.remove("v6a-tap");callMisses=0;if(callMuted){callMuted=false;const b=panel.querySelector('[data-a="mute"]');b.classList.remove("is-off");b.innerHTML=icon("mic");b.setAttribute("aria-label",ui("callMute"));}stopSpeak();srvRec&&srvRec.abort();srvRec=null;callRec&&callRec.abort();callRec=null;callListen();});
function toggleMute(){
 callMuted=!callMuted;const b=panel.querySelector('[data-a="mute"]');b.classList.toggle("is-off",callMuted);b.innerHTML=icon(callMuted?"micOff":"mic");
 b.setAttribute("aria-label",callMuted?ui("callUnmute"):ui("callMute"));
 if(callMuted){srvRec&&srvRec.abort();srvRec=null;callRec&&callRec.abort();stopSpeak();releaseCallStream();setCall("idle",ui("callPaused"));}else{callBox.classList.remove("v6a-tap");callMisses=0;callListen();}
}
function endCall(){inCall=false;callBox.classList.remove("v6a-tap");srvRec&&srvRec.abort();srvRec=null;releaseCallStream();callRec&&callRec.abort();callRec=null;stopSpeak();callBox.hidden=true;panel.classList.remove("v6a-in-call");panel.querySelector('[data-a="call"]').focus();}

/* ---------- open / close ---------- */
let opened=false;
async function open(){
 hideTeaser(true);unlockAudio();
 try{await loadKB();}catch{}
 if(!opened){opened=true;labels();if(KB)renderAll();}
 panel.hidden=false;requestAnimationFrame(()=>panel.classList.add("is-open"));
 launch.setAttribute("aria-expanded","true");root.classList.add("is-open");
 if(matchMedia("(max-width:640px)").matches){d.classList.add("v6a-lock");pinPanel();}
 setTimeout(()=>{if(!matchMedia("(pointer:coarse)").matches)input.focus();},120);
 aiStatus();
}
/* v18 · Phones: keep the panel on the visible area when the keyboard opens and freeze the page behind it. */
let unpinPanel=()=>{};
function pinPanel(){unpinPanel();const vv=window.visualViewport,b=document.body,y=scrollY;b.style.position="fixed";b.style.top=-y+"px";b.style.left="0";b.style.right="0";b.style.width="100%";
 const fit=()=>{if(!vv)return;panel.style.setProperty("top",vv.offsetTop+"px","important");panel.style.setProperty("height",vv.height+"px","important");panel.style.setProperty("bottom","auto","important");};
 fit();vv&&vv.addEventListener("resize",fit);vv&&vv.addEventListener("scroll",fit);
 unpinPanel=()=>{vv&&vv.removeEventListener("resize",fit);vv&&vv.removeEventListener("scroll",fit);["top","height","bottom"].forEach(k=>panel.style.removeProperty(k));b.style.position=b.style.top=b.style.left=b.style.right=b.style.width="";scrollTo(0,y);unpinPanel=()=>{};};}
function close(){
 if(inCall)endCall();if(listening&&srvRec){srvRec.abort();srvRec=null;listening=false;micState(false);}if(listening&&rec)rec.abort();stopSpeak();
 panel.classList.remove("is-open");root.classList.remove("is-open");launch.setAttribute("aria-expanded","false");d.classList.remove("v6a-lock");unpinPanel();
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
