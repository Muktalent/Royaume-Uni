// mk-badge-v4 · MUK Talent ID-badge business card, actions menu, social links.
// Every node is created with textContent / setAttribute on fixed attribute names. No innerHTML, no inline styles (CSP safe).
import {BRAND_PATHS,UI_PATHS} from './card-icons.js';
const SVG='http://www.w3.org/2000/svg';
export const E=(t,v,c)=>{const n=document.createElement(t);if(v!==undefined&&v!==null)n.textContent=String(v);if(c)n.className=c;return n;};
export function icon(name,cls='mk-icon'){const s=document.createElementNS(SVG,'svg');s.setAttribute('viewBox','0 0 24 24');s.setAttribute('aria-hidden','true');s.setAttribute('focusable','false');s.setAttribute('class',cls);s.setAttribute('fill','none');s.setAttribute('stroke','currentColor');s.setAttribute('stroke-width','1.7');s.setAttribute('stroke-linecap','round');s.setAttribute('stroke-linejoin','round');for(const d of UI_PATHS[name]||[]){const p=document.createElementNS(SVG,'path');p.setAttribute('d',d);s.append(p);}return s;}
export function brandIcon(platform,cls='mk-brand-icon'){const s=document.createElementNS(SVG,'svg');s.setAttribute('viewBox','0 0 24 24');s.setAttribute('aria-hidden','true');s.setAttribute('focusable','false');s.setAttribute('class',cls);s.setAttribute('fill','currentColor');const p=document.createElementNS(SVG,'path');p.setAttribute('d',BRAND_PATHS[platform]||'');s.append(p);return s;}
const initials=name=>String(name||'MT').trim().split(/\s+/).slice(0,2).map(v=>v[0]||'').join('').toUpperCase();
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const sameOrigin=value=>{try{const u=new URL(value,location.origin);return u.protocol==='https:'||u.origin===location.origin?u.href:null;}catch{return null;}};

// The card face. `link` = {display} short link text shown on the badge.
export function createBusinessCard({data={},photoUrl,link}={}){
 const name=data.display_name||data.full_name||'MUK Talent',title=(data.job_title||'Team member').toUpperCase();
 const scene=E('div',undefined,'biz-scene mk-scene'),badge=E('article',undefined,'mk-badge');badge.setAttribute('aria-label',name+', '+(data.job_title||'MUK Talent')+' · MUK Talent business card');
 const band=E('div',undefined,'mk-band'),bandText=E('span',title,'mk-band-title');bandText.setAttribute('aria-hidden','true');band.append(bandText);
 badge.style.setProperty('--title-len',String(Math.max(8,title.length)));badge.style.setProperty('--name-len',String(Math.max(10,name.length)));
 const panel=E('div',undefined,'mk-panel'),logo=E('img',undefined,'mk-logo');logo.src='/book/muk-badge-logo.png';logo.alt='MUK Talent';logo.width=500;logo.height=291;logo.decoding='async';
 const photo=E('div',undefined,'mk-photo');photo.append(E('span',initials(name),'mk-initials'));
 if(photoUrl){const img=E('img');img.alt='Photo of '+name;img.decoding='async';img.referrerPolicy='no-referrer';img.onload=()=>photo.classList.add('mk-has-photo');img.onerror=()=>img.remove();img.src=photoUrl;photo.append(img);}
 const id=E('div',undefined,'mk-id'),heading=E('h2',name,'mk-name');if(name.length>24)heading.classList.add('mk-name-long');id.append(heading);
 const lines=E('ul',undefined,'mk-lines');lines.append(E('li',data.employee_code?'ID '+data.employee_code:'MUK Talent team'));if(data.assigned_city)lines.append(E('li',data.assigned_city));const shown=link?.display||data.short_display;if(shown)lines.append(E('li',shown,'mk-link-line'));else lines.append(E('li','muktalent.com'));id.append(lines);
 const sheen=E('span',undefined,'mk-sheen');sheen.setAttribute('aria-hidden','true');
 panel.append(logo,photo,id);badge.append(band,panel,sheen);scene.append(badge);
 // Subtle 3D tilt on precise pointers only.
 if(matchMedia('(hover: hover) and (pointer: fine)').matches){let frame=0;
  scene.addEventListener('pointermove',e=>{if(reduced())return;const r=badge.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{badge.style.setProperty('--ry',(x*9).toFixed(2)+'deg');badge.style.setProperty('--rx',(-y*7).toFixed(2)+'deg');badge.style.setProperty('--gx',((x+.5)*100).toFixed(1)+'%');badge.classList.add('mk-tilting');});});
  scene.addEventListener('pointerleave',()=>{cancelAnimationFrame(frame);badge.style.setProperty('--rx','0deg');badge.style.setProperty('--ry','0deg');badge.classList.remove('mk-tilting');});}
 return scene;
}

// Social icons row (public page and dashboard preview).
export function createSocialLinks(socials=[],name=''){
 const list=E('ul',undefined,'mk-socials');list.setAttribute('aria-label','Social profiles');
 for(const s of socials){if(!BRAND_PATHS[s.platform])continue;let url;try{url=new URL(s.url);}catch{continue;}if(url.protocol!=='https:')continue;
  const li=E('li'),a=E('a',undefined,'mk-social mk-social-'+s.platform);a.href=url.href;a.target='_blank';a.rel='me noopener noreferrer';a.setAttribute('aria-label',(name?name+' on ':'')+s.label);a.title=s.label;a.append(brandIcon(s.platform));li.append(a);list.append(li);}
 return list;
}
// Call / email / WhatsApp chips.
export function createContactChips(data={},socials=[]){
 const box=E('div',undefined,'mk-chips');
 const phone=String(data.contact_phone||'').replace(/[^\d+]/g,'');
 if(/^\+?\d{6,16}$/.test(phone)){const a=E('a',undefined,'mk-chip');a.href='tel:'+phone;a.append(icon('phone'),E('span','Call'));box.append(a);}
 const email=String(data.contact_email||'').trim();
 if(/^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(email)){const a=E('a',undefined,'mk-chip');a.href='mailto:'+email;a.append(icon('mail'),E('span','Email'));box.append(a);}
 const wa=socials.find(s=>s.platform==='whatsapp');
 if(wa){try{const u=new URL(wa.url);if(u.protocol==='https:'){const a=E('a',undefined,'mk-chip mk-chip-wa');a.href=u.href;a.target='_blank';a.rel='noopener noreferrer';a.append(brandIcon('whatsapp','mk-icon'),E('span','WhatsApp'));box.append(a);}}catch{}}
 return box;
}

function vcard({name,data,url,socials}){
 const safe=v=>String(v||'').replace(/\\/g,'\\\\').replace(/[\r\n]+/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
 const parts=String(name||'').trim().split(/\s+/),last=parts.length>1?parts.pop():'',first=parts.join(' ');
 const lines=['BEGIN:VCARD','VERSION:3.0','N:'+safe(last)+';'+safe(first)+';;;','FN:'+safe(name),'ORG:MUK Talent','TITLE:'+safe(data.job_title),'URL;TYPE=WORK:'+url];
 if(data.contact_phone)lines.push('TEL;TYPE=WORK,VOICE:'+safe(data.contact_phone));if(data.contact_email)lines.push('EMAIL;TYPE=WORK:'+safe(data.contact_email));if(data.assigned_city)lines.push('ADR;TYPE=WORK:;;;'+safe(data.assigned_city)+';;;');
 for(const s of socials||[])lines.push('X-SOCIALPROFILE;TYPE='+safe(s.platform)+':'+s.url,'URL;TYPE='+safe(s.label)+':'+s.url);
 lines.push('END:VCARD');return lines.join('\r\n');
}
function download(href,filename){const a=E('a');a.href=href;a.download=filename;a.rel='noopener';document.body.append(a);a.click();a.remove();}
const fileName=name=>('muktalent-'+String(name||'card').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')).slice(0,60);

function qrDialog({qrImage,display,name}){
 const dialog=E('dialog',undefined,'mk-dialog');dialog.setAttribute('aria-label','QR code for '+name);
 const box=E('div',undefined,'mk-dialog-body'),close=E('button',undefined,'mk-dialog-close');close.type='button';close.setAttribute('aria-label','Close');close.append(icon('close'));
 const frame=E('div',undefined,'mk-qr-frame'),img=E('img');img.src=qrImage;img.alt='QR code that opens '+display;img.width=img.height=600;frame.append(img);
 const save=E('button',undefined,'mk-button mk-button-gold');save.type='button';save.append(icon('download'),E('span','Download QR'));save.onclick=()=>download(qrImage,fileName(name)+'-qr.png');
 box.append(close,E('p','SCAN TO CONNECT','mk-dialog-kicker'),frame,E('p',display,'mk-dialog-link'),E('p','Print it, add it to slides or show it from your phone.','mk-dialog-note'),save);dialog.append(box);
 close.onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});dialog.addEventListener('close',()=>dialog.remove());document.body.append(dialog);dialog.showModal();close.focus();
}

/**
 * Hamburger ("sandwich") menu with every card action.
 * {url, display, qrImage, name, data, slug, socials, showOpen, extras:[{icon,label,hint,onSelect}]}
 */
export function createCardMenu({url,display,qrImage,name,data={},slug,socials=[],showOpen=false,extras=[]}){
 const safeUrl=sameOrigin(url)||location.href,shown=display||safeUrl.replace(/^https?:\/\//,'');
 const box=E('div',undefined,'mk-actions'),bar=E('div',undefined,'mk-bar'),message=E('p','','mk-status');message.setAttribute('role','status');message.setAttribute('aria-live','polite');
 let clear=0;const say=t=>{message.textContent=t;clearTimeout(clear);clear=setTimeout(()=>{message.textContent='';},4000);};
 const copyNow=async()=>{try{await navigator.clipboard.writeText(safeUrl);say('Link copied · '+shown);return true;}catch{say(shown);return false;}};
 const linkButton=E('button',undefined,'mk-linkpill');linkButton.type='button';linkButton.setAttribute('aria-label','Copy card link '+shown);linkButton.append(icon('link'),E('span',shown,'mk-linkpill-text'),E('span','Copy','mk-linkpill-cta'));linkButton.onclick=copyNow;
 const toggle=E('button',undefined,'mk-burger');toggle.type='button';toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Card actions');toggle.title='Card actions';const lines=E('span',undefined,'mk-burger-lines');lines.setAttribute('aria-hidden','true');lines.append(E('i'),E('i'),E('i'));toggle.append(lines);
 const menuId='mk-menu-'+Math.random().toString(36).slice(2,9);const menu=E('div',undefined,'mk-menu');menu.id=menuId;menu.hidden=true;toggle.setAttribute('aria-controls',menuId);
 bar.append(linkButton,toggle);box.append(bar,menu,message);
 const item=(ic,label,hint,onSelect,cls='')=>{const b=E('button',undefined,'mk-item '+cls);b.type='button';const t=E('span',undefined,'mk-item-text');t.append(E('strong',label));if(hint)t.append(E('small',hint));const i=E('span',undefined,'mk-item-icon');i.append(typeof ic==='string'?icon(ic):ic);b.append(i,t);b.onclick=async()=>{await onSelect(b);};menu.append(b);return b;};
 const group=label=>menu.append(E('p',label,'mk-menu-label'));
 group('Share');
 item('share','Share card','Send by WhatsApp, email or any app',async()=>{try{if(navigator.share){await navigator.share({title:name+' · MUK Talent',text:name+' · '+(data.job_title||'MUK Talent'),url:safeUrl});close();}else{await copyNow();close();}}catch(e){if(e.name!=='AbortError')say(shown);}});
 item('link','Copy short link',shown,async()=>{await copyNow();close();});
 if(qrImage)item('qr','QR code','Show full screen or download',()=>{close();qrDialog({qrImage,display:shown,name});});
 group('Save');
 item('contact','Save contact','Adds this card to the phone contacts',()=>{const blob=new Blob([vcard({name,data,url:safeUrl,socials})],{type:'text/vcard;charset=utf-8'}),href=URL.createObjectURL(blob);download(href,fileName(name)+'.vcf');setTimeout(()=>URL.revokeObjectURL(href),1500);close();});
 const walletBox=E('div',undefined,'mk-wallet-options');walletBox.hidden=true;
 const wallet=item('wallet','Add to Wallet','Apple Wallet or Google Wallet',()=>walletFlow());menu.append(walletBox);
 if(showOpen||extras.length)group('Manage');
 if(showOpen)item('open','Open public card','See it as your clients do',()=>{window.open(safeUrl,'_blank','noopener,noreferrer');close();});
 for(const x of extras)item(x.icon||'edit',x.label,x.hint,async()=>{close();await x.onSelect();});

 let walletBusy=false;
 async function readResponse(response){const text=await response.text();let value;try{value=JSON.parse(text);}catch{value={error:response.status===429?'Too many Wallet requests. Please wait before trying again.':'Wallet is temporarily unavailable.'};}if(!response.ok){const e=new Error(value.error||'Wallet is unavailable.');e.status=response.status;throw e;}return value;}
 async function walletFlow(){
  if(walletBusy)return;if(!walletBox.hidden){walletBox.hidden=true;return;}
  walletBusy=true;wallet.disabled=true;wallet.querySelector('strong').textContent='Checking Wallet…';walletBox.replaceChildren();
  try{
   const id=slug||new URL(safeUrl,location.origin).searchParams.get('c');if(!id)throw Error('Publish your card to enable Wallet.');
   const info=await readResponse(await fetch('/api/business-card/'+encodeURIComponent(id)+'/wallet',{cache:'no-store'}));
   if(info.version!==2)throw Error('Wallet needs the latest server version.');
   const ua=navigator.userAgent||'',ios=/iPhone|iPad|iPod/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1),android=/Android/i.test(ua);
   // Show the Wallet that matches the device; desktops see both.
   if(ios&&info.apple)info.google=false;else if(android&&info.google)info.apple=false;
   if(info.apple){const target=new URL(info.appleUrl,location.origin);if(target.origin!==location.origin)throw Error('Unexpected Apple Wallet endpoint.');const a=E('a',undefined,'mk-wallet-btn mk-wallet-apple');a.href=target.href;a.append(E('span','Add to Apple Wallet'));walletBox.append(a);}
   if(info.google){const g=E('button',undefined,'mk-wallet-btn mk-wallet-google');g.type='button';g.append(E('span','Add to Google Wallet'));walletBox.append(g);g.onclick=async()=>{if(walletBusy)return;walletBusy=true;g.disabled=true;g.firstChild.textContent='Preparing…';
    try{const endpoint=new URL(info.googleEndpoint,location.origin);if(endpoint.origin!==location.origin)throw Error('Unexpected Google Wallet endpoint.');const result=await readResponse(await fetch(endpoint.href,{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},body:'{}'}));const target=new URL(result.url||'about:blank');if(target.origin!=='https://pay.google.com')throw Error('Unexpected Wallet save destination.');window.location.assign(target.href);}
    catch(e){say(e.message);}finally{walletBusy=false;g.disabled=false;g.firstChild.textContent='Add to Google Wallet';}};}
   if(!info.apple&&!info.google)say('Wallet is not enabled yet on this server.');else walletBox.hidden=false;
  }catch(e){say(e.message);}
  finally{walletBusy=false;wallet.disabled=false;wallet.querySelector('strong').textContent='Add to Wallet';}
 }
 function onDoc(e){if(!box.contains(e.target))close();}
 function onKey(e){if(e.key==='Escape'){close();toggle.focus();}if(e.key==='ArrowDown'||e.key==='ArrowUp'){const items=[...menu.querySelectorAll('button:not([disabled]),a')];const i=items.indexOf(document.activeElement);if(i<0)return;e.preventDefault();items[(i+(e.key==='ArrowDown'?1:items.length-1))%items.length].focus();}}
 function open(){menu.hidden=false;toggle.setAttribute('aria-expanded','true');box.classList.add('mk-open');document.addEventListener('pointerdown',onDoc);document.addEventListener('keydown',onKey);menu.querySelector('button')?.focus({preventScroll:true});}
 function close(){if(menu.hidden)return;menu.hidden=true;walletBox.hidden=true;toggle.setAttribute('aria-expanded','false');box.classList.remove('mk-open');document.removeEventListener('pointerdown',onDoc);document.removeEventListener('keydown',onKey);}
 toggle.onclick=()=>menu.hidden?open():close();
 box.openWallet=async()=>{if(menu.hidden)open();if(walletBox.hidden)await walletFlow();wallet.scrollIntoView({block:'nearest',behavior:'smooth'});};
 return box;
}
// Backwards compatible name used by older imports.
export function createShareTools(options){return createCardMenu(options);}
