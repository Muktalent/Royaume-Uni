(() => {
'use strict';
if (/^\/(admin|api)(\/|$)/.test(location.pathname)) return;
const ID='1826090698815504', KEY='muk-marketing-v2', TTL=180*86400000;
let initialized=false, pageSent=false;
function choice(){
 try {const v=JSON.parse(localStorage.getItem(KEY));const age=Date.now()-v.updatedAt;
 return v.version===2 && typeof v.marketing==='boolean' && age>=0 && age<TTL ? v : null;}catch{return null;}
}
function allowed(){return choice()?.marketing===true;}
function start(){
 if(!allowed())return;
 if(!initialized){
  if(window.fbq){console.warn('Another Meta installation exists. Check for duplicates.');return;}
  const q=window.fbq=function(){q.callMethod?q.callMethod.apply(q,arguments):q.queue.push(arguments);};
  window._fbq=q;q.push=q;q.loaded=true;q.version='2.0';q.queue=[];
  q('consent','grant');q('set','autoConfig',false,ID);q('init',ID);
  const s=document.createElement('script');s.async=true;s.src='https://connect.facebook.net/en_US/fbevents.js';
  document.head.append(s);initialized=true;
 }else window.fbq('consent','grant');
 if(!pageSent){window.fbq('trackSingle',ID,'PageView');pageSent=true;}
}
function stop(){
 if(initialized)window.fbq('consent','revoke');
 for(const name of ['_fbp','_fbc']){
  const parts=location.hostname.split('.');
  document.cookie=`${name}=; Max-Age=0; Path=/; SameSite=Lax`;
  for(let i=0;i<parts.length-1;i++){
   const d=parts.slice(i).join('.');
   document.cookie=`${name}=; Max-Age=0; Path=/; Domain=${d}; SameSite=Lax`;
   document.cookie=`${name}=; Max-Age=0; Path=/; Domain=.${d}; SameSite=Lax`;
  }
 }
}
const seen=new Set();
window.MUKMarketing=Object.freeze({lead(id){
 try{window.MUKAnalytics?.lead(id);}catch{}
 try{
  if(!allowed()){stop();return;}
  if(!initialized || typeof id!=='string')return;
  const key='muk-meta-lead:'+id;
  if(seen.has(id))return;
  try{if(sessionStorage.getItem(key))return;}catch{}
  window.fbq('trackSingle',ID,'Lead');seen.add(id);
  try{sessionStorage.setItem(key,'1');}catch{}
 }catch{}
}});
function init(){
 const en=document.documentElement.lang==='en';
 const tr=(fr,eng)=>en?eng:fr;
 const style=document.createElement('style');
 style.textContent='.muk-cookie-info[hidden]{display:none!important}.muk-cookie-actions{display:flex;flex-wrap:wrap;gap:10px}.muk-cookie-actions button{background:#17283b!important;color:#fff!important;border:1px solid #17283b!important;padding:12px 16px!important;border-radius:4px;cursor:pointer;font:inherit}.muk-privacy-panel{max-width:640px;width:calc(100% - 40px);padding:24px;border:1px solid #ccc}.muk-privacy-panel::backdrop{background:rgba(0,0,0,.45)}';
 document.head.append(style);
 function el(tag,text){const n=document.createElement(tag);if(text)n.textContent=text;return n;}
 function link(url,text){const a=el('a',text);a.href=url;return a;}
 const text=tr('Avec votre accord, Muktalent utilise Google Analytics, Google Ads et le pixel Meta pour mesurer les visites et les demandes issues de ses publicités. Des informations de navigation et des identifiants peuvent être transmis à Google et à Meta pour la mesure d’audience et publicitaire. Refuser ne bloque ni le formulaire ni la réservation.','With your consent, Muktalent uses Google Analytics, Google Ads and the Meta pixel to measure visits and enquiries from advertising. Browsing information and identifiers may be shared with Google and Meta for analytics and advertising measurement. Rejecting does not block forms or bookings.');
 const banner=el('section');banner.className='muk-cookie-info';banner.setAttribute('aria-label',tr('Choix des cookies','Cookie choices'));
 banner.append(el('p',text));
 const links=el('p');links.append(link('/cookies/',tr('Cookies et durées','Cookies and retention')),document.createTextNode(' · '),link('/privacy/',tr('Confidentialité','Privacy')));banner.append(links);
 const dialog=el('dialog');dialog.className='muk-privacy-panel';dialog.setAttribute('aria-labelledby','mukPrivacyTitle');
 const h=el('h2',tr('Préférences de confidentialité','Privacy preferences'));h.id='mukPrivacyTitle';
 const status=el('p');dialog.append(h,el('p',text),status,link('/cookies/',tr('Consulter les détails','Read the details')));
 function statusText(){status.textContent=allowed()?tr('Publicité : autorisée. Vous pouvez retirer votre accord.','Advertising: allowed. You can withdraw consent.'):tr('Publicité : désactivée. Le stockage nécessaire reste actif.','Advertising: disabled. Necessary storage remains active.');}
 function save(marketing){
  try{localStorage.setItem(KEY,JSON.stringify({version:2,updatedAt:Date.now(),marketing}));}
  catch{stop();window.alert(tr('Votre choix ne peut pas être enregistré. Le pixel reste désactivé.','Your choice cannot be saved. The pixel remains disabled.'));return;}
  marketing?start():stop();try{document.dispatchEvent(new CustomEvent('muk-consent',{detail:{marketing}}));}catch{}banner.hidden=true;statusText();if(dialog.open)dialog.close();
 }
 function buttons(parent){
  const actions=el('div');actions.className='muk-cookie-actions';
  const accept=el('button',tr('Accepter la publicité','Accept advertising'));
  const reject=el('button',tr('Refuser la publicité','Reject advertising'));
  accept.type=reject.type='button';accept.onclick=()=>save(true);reject.onclick=()=>save(false);
  actions.append(accept,reject);parent.append(actions);return actions;
 }
 const actions=buttons(banner);const details=el('button',tr('Préférences','Preferences'));details.type='button';actions.append(details);
 const controls=buttons(dialog);const close=el('button',tr('Fermer sans modifier','Close without changes'));close.type='button';close.onclick=()=>dialog.close();controls.append(close);
 document.body.append(banner,dialog);
 function open(){statusText();if(typeof dialog.showModal==='function'){if(!dialog.open)dialog.showModal();}else{banner.hidden=false;banner.scrollIntoView();}}
 details.onclick=open;
 document.querySelectorAll('[data-privacy-settings]').forEach(n=>n.addEventListener('click',e=>{e.preventDefault();open();}));
 function sync(){const v=choice();banner.hidden=!!v;allowed()?start():stop();statusText();}
 window.addEventListener('storage',e=>{if(e.key===KEY||e.key===null)sync();});
 window.addEventListener('pageshow',sync);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync();});
 sync();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
