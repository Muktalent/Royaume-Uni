// gp-ui-v1 · Shared Global Passport UI helpers (CSP safe: no inline styles, no innerHTML with data).
const SVG='http://www.w3.org/2000/svg';
export const E=(t,v,c)=>{const n=document.createElement(t);if(v!==undefined&&v!==null)n.textContent=String(v);if(c)n.className=c;return n;};
const P={
 globe:['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z','M3 12h18','M12 3c2.6 2.8 3.8 5.8 3.8 9s-1.2 6.2-3.8 9c-2.6-2.8-3.8-5.8-3.8-9S9.4 5.8 12 3Z'],
 cap:['m2 9 10-5 10 5-10 5L2 9Z','M6 11v5c3.5 2.6 8.5 2.6 12 0v-5','M22 9v6'],
 book:['M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Z','M19 19v2H6','M9 7h6'],
 gauge:['M4 15a8 8 0 1 1 16 0','m12 15 4-5','M12 15h.01'],
 doc:['M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z','M14 3v5h5','M9 13h6','M9 17h4'],
 upload:['M12 16V4','m7 9 5-5 5 5','M5 20h14'],
 calendar:['M7 3v3','M17 3v3','M4 8h16','M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z'],
 user:['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z','M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6'],
 users:['M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z','M2 21c1.2-3.6 3.8-5.5 7-5.5s5.8 1.9 7 5.5','M16 3.5a4 4 0 0 1 0 7','M18 15.5c2 .7 3.3 2.5 4 5.5'],
 chat:['M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.6A8 8 0 1 1 21 12Z'],
 send:['M22 2 11 13','M22 2 15 22l-4-9-9-4 20-7Z'],
 check:['m5 12 5 5L20 7'],
 dot:['M12 12h.01'],
 clock:['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z','M12 7v5l3 2'],
 alert:['M12 3 2 20h20L12 3Z','M12 10v4','M12 17h.01'],
 plane:['M10.5 13.5 3 11l1.5-1.5 8 1L17 6a2.1 2.1 0 0 1 3 3l-4.5 4.5 1 8L15 23l-2.5-7.5','M7 17l-3 3'],
 pin:['M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z','M12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z'],
 shield:['M12 3 4 6v6c0 5 3.4 8.4 8 9 4.6-.6 8-4 8-9V6l-8-3Z','m9 12 2 2 4-4'],
 passport:['M6 3h11a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6V3Z','M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z','M9 17h6'],
 visa:['M3 6h18v12H3z','M7 10h4','M7 14h7','M16 10h2'],
 flag:['M5 21V4','M5 4h11l-2 4 2 4H5'],
 note:['M5 4h10l4 4v12H5V4Z','M9 12h6','M9 16h4','M15 4v4h4'],
 lock:['M6 11h12v10H6z','M8 11V8a4 4 0 0 1 8 0v3'],
 logout:['M15 4h4v16h-4','M10 17l5-5-5-5','M15 12H4'],
 plus:['M12 5v14','M5 12h14'],
 x:['M6 6l12 12','M18 6 6 18'],
 eye:['M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z','M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z'],
 chevron:['m9 6 6 6-6 6'],
 back:['m15 6-6 6 6 6'],
 search:['M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z','m21 21-4.3-4.3'],
 refresh:['M20 11a8 8 0 0 0-14.9-3.9L4 9','M4 4v5h5','M4 13a8 8 0 0 0 14.9 3.9L20 15','M20 20v-5h-5'],
 spark:['M12 3v4','M12 17v4','M3 12h4','M17 12h4','m5.6 5.6 2.8 2.8','m15.6 15.6 2.8 2.8','m5.6 18.4 2.8-2.8','m15.6 8.4 2.8-2.8'],
 trash:['M4 7h16','M9 7V4h6v3','M6 7l1 13h10l1-13'],
 home:['M3 11 12 4l9 7','M5 10v10h14V10']
};
export function gi(name,cls='gp-i'){const s=document.createElementNS(SVG,'svg');s.setAttribute('viewBox','0 0 24 24');s.setAttribute('aria-hidden','true');s.setAttribute('focusable','false');s.setAttribute('class',cls);s.setAttribute('fill','none');s.setAttribute('stroke','currentColor');s.setAttribute('stroke-width','1.7');s.setAttribute('stroke-linecap','round');s.setAttribute('stroke-linejoin','round');for(const d of P[name]||[]){const p=document.createElementNS(SVG,'path');p.setAttribute('d',d);s.append(p);}return s;}
export function btn(label,fn,cls='gp-btn',ic){const b=E('button',undefined,cls);b.type='button';if(ic)b.append(gi(ic));if(label)b.append(E('span',label));if(fn)b.onclick=fn;return b;}
export function ring(pct,size='md'){const w=E('div',undefined,'gp-ring gp-ring-'+size);const s=document.createElementNS(SVG,'svg');s.setAttribute('viewBox','0 0 44 44');s.setAttribute('aria-hidden','true');for(const [cls,dash]of [['bg','100 100'],['fg',Math.max(0,Math.min(100,pct))+' 100']]){const c=document.createElementNS(SVG,'circle');c.setAttribute('cx','22');c.setAttribute('cy','22');c.setAttribute('r','18');c.setAttribute('pathLength','100');c.setAttribute('stroke-dasharray',dash);c.setAttribute('class','gp-ring-'+cls);s.append(c);}const v=E('strong',undefined);v.append(document.createTextNode(String(pct)),E('small','%'));w.append(s,v);w.setAttribute('role','img');w.setAttribute('aria-label',pct+'%');w.dataset.level=pct>=75?'high':pct>=45?'mid':'low';return w;}
export function initials(name){return String(name||'GP').trim().split(/\s+/).slice(0,2).map(v=>v[0]||'').join('').toUpperCase();}
export function avatar(name,url,cls='gp-avatar'){const a=E('span',undefined,cls);a.append(E('b',initials(name)));if(url){const i=E('img');i.alt='';i.decoding='async';i.referrerPolicy='no-referrer';i.onload=()=>a.classList.add('has-img');i.onerror=()=>i.remove();i.src=url;a.append(i);}return a;}
export const COUNTRIES='AF AL DZ AD AO AG AR AM AU AT AZ BS BH BD BB BY BE BZ BJ BT BO BA BW BR BN BG BF BI CV KH CM CA CF TD CL CN CO KM CG CD CR CI HR CU CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FJ FI FR GA GM GE DE GH GR GD GT GN GW GY HT HN HK HU IS IN ID IR IQ IE IL IT JM JP JO KZ KE KI KW KG LA LV LB LS LR LY LI LT LU MO MG MW MY MV ML MT MH MR MU MX FM MD MC MN ME MA MZ MM NA NR NP NL NZ NI NE NG KP MK NO OM PK PW PS PA PG PY PE PH PL PT PR QA RO RU RW KN LC VC WS SM ST SA SN RS SC SL SG SK SI SB SO ZA KR SS ES LK SD SR SE CH SY TW TJ TZ TH TL TG TO TT TN TR TM TV UG UA AE GB US UY UZ VU VA VE VN YE ZM ZW'.split(' ');
export function countryName(code,lang='en'){try{return new Intl.DisplayNames([lang],{type:'region'}).of(code)||code;}catch{return code;}}
export function countrySelect(id,lang,value,placeholder){const s=E('select');s.id=id;s.required=true;const ph=new Option(placeholder||'—','');ph.disabled=true;s.append(ph);const list=COUNTRIES.map(c=>[c,countryName(c,lang)]).sort((a,b)=>a[1].localeCompare(b[1],lang));for(const [c,n]of list)s.append(new Option(n,c));s.value=value||'';if(!value)ph.selected=true;return s;}
export function iso(code){const b=E('span',code||'—','gp-iso');return b;}
export function fmtDate(v,lang='en',opts={day:'numeric',month:'short',year:'numeric'}){if(!v)return '—';const d=new Date(String(v).length===10?v+'T12:00:00Z':v);return Number.isNaN(d.getTime())?'—':new Intl.DateTimeFormat(lang==='fr'?'fr-FR':'en-GB',{timeZone:'UTC',...opts}).format(d);}
export function ago(v,lang='en'){const s=(Date.now()-Date.parse(v))/1000;const rtf=new Intl.RelativeTimeFormat(lang,{numeric:'auto'});if(s<60)return rtf.format(0,'second');if(s<3600)return rtf.format(-Math.round(s/60),'minute');if(s<86400)return rtf.format(-Math.round(s/3600),'hour');if(s<86400*30)return rtf.format(-Math.round(s/86400),'day');return fmtDate(v,lang);}
export function daysUntil(day){return Math.round((Date.parse(day+'T12:00:00Z')-Date.parse(new Date().toISOString().slice(0,10)+'T12:00:00Z'))/86400000);}
export function linkCss(id,href){if(!document.getElementById(id)){const l=E('link');l.id=id;l.rel='stylesheet';l.href=href;document.head.append(l);}}
export const reducedMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;

// Horizontal swipe between pages (touch only). Ignores form fields and horizontally scrollable areas.
export function attachSwipe(el,{onNext,onPrev,canSwipe=()=>true}){
 let x0=0,y0=0,t0=0,active=false,locked=null,dx=0;
 const skip=t=>t.closest('input,textarea,select,[contenteditable],dialog,[data-noswipe],.gp-hscroll,.lx-tabs,.lx-gallery,.lx-calendar,.cs-suggestions');
 el.addEventListener('touchstart',e=>{if(e.touches.length!==1||!canSwipe()||skip(e.target)){active=false;return;}const p=e.touches[0];x0=p.clientX;y0=p.clientY;t0=Date.now();active=true;locked=null;dx=0;},{passive:true});
 el.addEventListener('touchmove',e=>{if(!active)return;const p=e.touches[0],mx=p.clientX-x0,my=p.clientY-y0;if(locked===null&&(Math.abs(mx)>10||Math.abs(my)>10))locked=Math.abs(mx)>Math.abs(my)*1.3?'x':'y';if(locked!=='x')return;dx=mx;if(!reducedMotion())el.style.setProperty('--swipe-x',(dx*.35).toFixed(1)+'px');el.classList.add('is-swiping');},{passive:true});
 const end=()=>{if(!active)return;active=false;el.classList.remove('is-swiping');el.style.removeProperty('--swipe-x');if(locked!=='x')return;const fast=Date.now()-t0<450;if(Math.abs(dx)>(fast?45:90)){if(dx<0)onNext?.();else onPrev?.();}};
 el.addEventListener('touchend',end,{passive:true});el.addEventListener('touchcancel',()=>{active=false;el.classList.remove('is-swiping');el.style.removeProperty('--swipe-x');},{passive:true});
}
// Page indicator for swipe navigation: dots + current label, tappable.
export function pager(items,current,go,cls='gp-pager'){const nav=E('nav',undefined,cls);nav.setAttribute('aria-label','Sections');const label=E('span',undefined,'gp-pager-label');const dots=E('div',undefined,'gp-pager-dots');items.forEach(([id,text],i)=>{const d=E('button',undefined,'gp-pager-dot');d.type='button';d.setAttribute('aria-label',text);if(id===current){d.setAttribute('aria-current','page');label.textContent=text;}d.onclick=()=>go(id);dots.append(d);});nav.append(label,dots);return nav;}
export function hintOnce(key,text,host=document.body){try{if(localStorage.getItem(key))return;localStorage.setItem(key,'1');}catch{return;}const h=E('div',undefined,'gp-swipe-hint');h.setAttribute('role','status');const hand=E('span',undefined,'gp-swipe-hand');hand.append(gi('back'),gi('chevron'));h.append(hand,E('span',text));host.append(h);setTimeout(()=>h.classList.add('out'),3600);setTimeout(()=>h.remove(),4300);}
export function idleLogout(root,onLogout,minutes=30){let last=Date.now();const bump=()=>{last=Date.now();};for(const ev of ['pointerdown','keydown','touchstart','scroll'])addEventListener(ev,bump,{passive:true});const timer=setInterval(()=>{if(!root.isConnected){clearInterval(timer);return;}if(Date.now()-last>minutes*60000){clearInterval(timer);onLogout();}},30000);}
