// card-studio-v1 · Employee business card, short link (muktalent.com/name) and social profiles.
import {createBusinessCard,createCardMenu,createSocialLinks,createCardFaces,createActionTiles,createWalletPreview,brandIcon,icon} from '../book/business-card.js';
const E=(t,v,c)=>{const n=document.createElement(t);if(v!==undefined&&v!==null)n.textContent=String(v);if(c)n.className=c;return n;};
const editable=v=>!v?'':/^[@+]/.test(v.value||'')?v.value:v.url||v.value||'';
const q=owner=>owner?'?owner='+encodeURIComponent(owner):'';
function btn(text,fn,cls='lx-button'){const b=E('button',text,cls);b.type='button';b.onclick=fn;return b;}

export function cardData(d){return {display_name:d.full_name,job_title:d.job_title,assigned_city:d.assigned_city,employee_code:d.employee_code,contact_phone:d.publish_contact?d.contact_phone:'',contact_email:d.publish_contact?d.contact_email:'',short_display:d.card?.handle?d.card.display:null};}

// Small badge for the Home page.
export function miniBadge(d,photoUrl){const wrap=E('div',undefined,'cs-mini');wrap.append(createBusinessCard({data:cardData(d),photoUrl:photoUrl??d.avatar_url,link:{display:d.card?.handle?d.card.display:null}}));return wrap;}

export async function renderCardStudio({host,api,owner,readOnly,directory,openTab,onChanged}){
 const d=directory,layout=E('div',undefined,'cs-layout cs-designer'),show=E('section',undefined,'cs-showroom'),ident=E('div',undefined,'cs-ident'),stage=E('section',undefined,'cs-stage'),side=E('div',undefined,'cs-side');
 show.append(E('span',undefined,'cs-grid-bg'),ident,stage);layout.append(show,side);host.append(layout);
 let qr=null;
 if(d.card?.published){try{qr=await api('/api/workspace/card/qr'+q(owner));}catch{qr=null;}}
 if(!host.isConnected)return;
 const data=cardData(d);if(qr?.handle)data.short_display=qr.display;
 const socials=Array.isArray(d.socials)?d.socials:[];
 identity({host:ident,d,qr,socials,readOnly,openTab});
 let editor,menu=null;
 if(qr){const extras=readOnly?[]:[{icon:'edit',label:'Edit short link',hint:'Choose muktalent.com/your-name',onSelect:()=>{editor?.focus();editor?.scrollIntoView({block:'center',behavior:'smooth'});}},{icon:'users',label:'Edit social links',hint:'LinkedIn, Instagram, TikTok…',onSelect:()=>openTab('social')}];
  menu=createCardMenu({url:qr.url,display:qr.display,qrImage:qr.image,name:d.full_name,data,slug:qr.slug,socials,showOpen:true,extras});}
 // ClickCard layout: Wallet / Share / QR tiles, the card (two styles), then the full actions menu.
 if(menu)stage.append(createActionTiles(menu,{onEdit:readOnly?null:()=>openTab('profile')}));
 stage.append(createCardFaces({data,photoUrl:d.avatar_url,link:{display:data.short_display,url:qr?.url},socials,onSaveContact:menu?()=>menu.saveContact():null}));
 if(socials.length){const list=createSocialLinks(socials,d.full_name);list.classList.add('cs-badge-socials');stage.append(list);}
 if(menu)stage.append(menu);
 else stage.append(E('p','Preview only. Your administrator will publish your card once your professional details are ready. You can already reserve your short link.','cs-note'));
 const wallet=E('section',undefined,'lx-panel cs-panel cs-wallet');wallet.append(E('p','WALLET PASS','lx-overline'),E('h2','How it looks in Wallet'),E('p','Clients save your card to Google Wallet or Apple Wallet. The pass keeps your photo, QR code, booking and contact links.','lx-muted'),createWalletPreview({data,photoUrl:d.avatar_url,qrImage:qr?.image,display:data.short_display}));
 if(menu){const b=btn('Add to Wallet',()=>menu.openWallet(),'lx-button lx-primary');b.prepend(icon('wallet','lx-btn-icon'));wallet.append(b);}
 side.append(wallet);
 stage.append(E('p','Name, position, territory and ID are managed by MUK Talent. Your photo and work contact are in Profile.','cs-note'));
 editor=await shortLinkPanel({host:side,api,owner,readOnly,onChanged});
 side.append(socialSummary({socials,readOnly,openTab}));
}

async function shortLinkPanel({host,api,owner,readOnly,onChanged}){
 const panel=E('section',undefined,'lx-panel cs-panel');panel.append(E('p','YOUR SHORT LINK','lx-overline'),E('h2','Easy to say, easy to remember'));host.append(panel);
 let info;try{info=(await api('/api/workspace/card-link'+q(owner))).data;}catch(error){panel.append(E('p',error.message.includes('Database')||error.message.includes('unavailable')?'Short links are not active yet. Ask your administrator to run the latest database update.':error.message,'lx-muted'));return null;}
 const current=E('div',undefined,'cs-current');const shown=E('strong',info.handle?info.host+'/'+info.handle:'Not set yet');current.append(icon('link'),shown);panel.append(current);
 if(readOnly){panel.append(E('p',info.previous.length?'Previous links still redirect: '+info.previous.map(h=>info.host+'/'+h).join(', '):'Read-only preview.','lx-muted'));return null;}
 const form=E('form',undefined,'cs-handle-form'),label=E('label','Choose your link','cs-label'),row=E('div',undefined,'cs-handle-row'),prefix=E('span',info.host+'/','cs-prefix'),input=E('input');input.id='cs-handle';label.htmlFor=input.id;input.autocomplete='off';input.spellcheck=false;input.autocapitalize='none';input.maxLength=30;input.placeholder='laura';input.value=info.handle||'';input.setAttribute('aria-describedby','cs-handle-hint');
 const save=E('button','Save link','lx-button lx-primary');save.type='submit';row.append(prefix,input);
 const hint=E('p','3–30 characters: letters, numbers and single hyphens.','cs-hint');hint.id='cs-handle-hint';hint.setAttribute('aria-live','polite');
 form.append(label,row,hint);
 if(info.suggestions?.length){const chips=E('div',undefined,'cs-suggestions');chips.append(E('span','Suggestions','cs-suggest-label'));for(const s of info.suggestions){const c=btn(s,()=>{input.value=s;check();},'cs-suggestion');chips.append(c);}form.append(chips);}
 form.append(save);panel.append(form);
 panel.append(E('p',(info.previous.length?'Previous links keep working and stay reserved for you: '+info.previous.map(h=>'/'+h).join(', ')+'. ':'Old QR codes and links keep working after a change. ')+info.remaining+' changes left.','cs-note'));
 let timer=0,seq=0,ok=false;
 const state=(text,kind)=>{hint.textContent=text;hint.dataset.state=kind||'';};
 async function check(){clearTimeout(timer);const value=input.value.trim().toLowerCase();input.value=value.replace(/[^a-z0-9-]/g,'');ok=false;save.disabled=true;
  if(!input.value){state('3–30 characters: letters, numbers and single hyphens.');return;}
  if(input.value===info.handle){state('This is your current link.','ok');return;}
  if(input.value.length<3){state('At least 3 characters.','bad');return;}
  state('Checking…');const mine=++seq;
  timer=setTimeout(async()=>{try{const r=(await api('/api/workspace/card-link/check?handle='+encodeURIComponent(input.value))).data;if(mine!==seq)return;ok=r.available;save.disabled=!ok;state(r.available?(r.mine?'Already yours. Save to make it your main link.':info.host+'/'+r.handle+' is available.'):r.reason||'Not available.',r.available?'ok':'bad');}catch(e){if(mine===seq)state(e.message,'bad');}},420);}
 input.addEventListener('input',check);save.disabled=true;
 form.onsubmit=async e=>{e.preventDefault();if(!ok)return;save.disabled=true;state('Saving…');try{const r=(await api('/api/workspace/card-link'+q(owner),{method:'PUT',body:JSON.stringify({handle:input.value})})).data;info.handle=r.handle;shown.textContent=r.display;state('Saved. Your card now uses '+r.display+'.','ok');onChanged?.('Short link saved · '+r.display+'. Old links keep working.');}catch(err){state(err.message,'bad');save.disabled=false;}};
 return input;
}

function socialSummary({socials,readOnly,openTab}){
 const panel=E('section',undefined,'lx-panel cs-panel');panel.append(E('p','SOCIAL PROFILES','lx-overline'),E('h2',socials.length?socials.length+' connected to your card':'Connect your social profiles'));
 if(socials.length){const list=E('div',undefined,'cs-social-mini');for(const s of socials){const chip=E('span',undefined,'cs-social-chip');chip.append(brandIcon(s.platform),E('span',s.value||s.label));list.append(chip);}panel.append(list);}
 else panel.append(E('p','Clients can follow you in one tap from your public card. Add LinkedIn, Instagram, TikTok and more.','lx-muted'));
 if(!readOnly)panel.append(btn(socials.length?'Manage social links':'Add social links',()=>openTab('social'),'lx-button lx-primary'));
 return panel;
}

export async function renderSocialEditor({host,api,owner,readOnly,onSaved}){
 const panel=E('section',undefined,'lx-panel cs-panel cs-social-editor');panel.append(E('p','SOCIAL PROFILES','lx-overline'),E('h2','Your social links'),E('p','Paste your profile link or @username. Only official profile addresses are accepted, so your card always opens the right account.','lx-muted'));host.append(panel);
 let info;try{info=(await api('/api/workspace/socials'+q(owner))).data;}catch(error){panel.append(E('p',/unavailable|Database/.test(error.message)?'Social links are not active yet. Ask your administrator to run the latest database update.':error.message,'lx-muted'));return;}
 const form=E('form',undefined,'cs-social-form'),inputs={},preview=E('div',undefined,'cs-social-preview');
 for(const p of info.platforms){const row=E('div',undefined,'cs-social-row'),ic=E('span',undefined,'cs-social-icon cs-'+p.id),label=E('label',p.label,'cs-label'),input=E('input');ic.append(brandIcon(p.id));input.id='cs-social-'+p.id;label.htmlFor=input.id;input.placeholder=p.placeholder;input.maxLength=200;input.autocomplete='off';input.spellcheck=false;input.autocapitalize='none';input.value=editable(info.links?.[p.id]);input.readOnly=readOnly;input.type=p.id==='whatsapp'?'tel':'text';const field=E('div',undefined,'cs-social-field');field.append(label,input);row.append(ic,field);form.append(row);inputs[p.id]=input;}
 const toggleRow=E('label',undefined,'cs-toggle'),toggle=E('input');toggle.type='checkbox';toggle.checked=info.show_on_card!==false;toggle.disabled=readOnly;toggleRow.append(toggle,E('span','Show these icons on my public business card'));form.append(toggleRow);
 const message=E('p','','lx-status');message.setAttribute('role','status');message.setAttribute('aria-live','polite');
 if(!readOnly){const save=E('button','Save social links','lx-button lx-primary');save.type='submit';form.append(save,message);
  form.onsubmit=async e=>{e.preventDefault();save.disabled=true;message.textContent='Saving…';for(const i of Object.values(inputs))i.removeAttribute('aria-invalid');
   try{const links=Object.fromEntries(Object.entries(inputs).map(([k,i])=>[k,i.value.trim()]));const r=(await api('/api/workspace/socials',{method:'PUT',body:JSON.stringify({links,show_on_card:toggle.checked})})).data;for(const [k,i]of Object.entries(inputs))i.value=editable(r.links[k]);paint(r.links);message.textContent='Saved. Your public card is updated.';onSaved?.();}
   catch(err){message.textContent=err.message;const bad=err.platform&&inputs[err.platform];if(bad){bad.setAttribute('aria-invalid','true');bad.focus();}}finally{save.disabled=false;}};}
 else form.append(E('p','Read-only preview.','lx-muted'));
 function paint(links){preview.replaceChildren(E('p','PREVIEW','lx-overline'),createSocialLinks(Object.entries(links||{}).map(([platform,v])=>({platform,label:platform,value:v.value,url:v.url}))));}
 paint(info.links);panel.append(form,preview);
 const note=E('details',undefined,'cs-details');note.append(E('summary','Why links and not a login with each network?'),E('p','Signing in with Instagram, TikTok or LinkedIn would give MUK Talent access to your private account data and requires approval from each platform. Linking your public profile gives clients the same one-tap access without sharing your passwords or permissions.','lx-muted'));panel.append(note);
}

// Designer identity column: editorial name, credentials, live short link and card health.
function identity({host,d,qr,socials,readOnly,openTab}){
 const name=d.full_name||'MUK Talent',parts=name.trim().split(/\s+/),first=parts.shift()||name,rest=parts.join(' ');
 host.append(E('p','MY CARD · DIGITAL IDENTITY','cs-kicker'));
 const h=E('h2',undefined,'cs-name');h.append(E('span',first),E('em',rest||''));host.append(h,E('p',d.job_title||'MUK Talent team','cs-role'));
 const meta=E('ul',undefined,'cs-meta');for(const [ic,v]of [['card',d.employee_code?'ID '+d.employee_code:null],['home',d.assigned_city||null],['users',d.languages||null]])if(v){const li=E('li');li.append(icon(ic),E('span',v));meta.append(li);}host.append(meta);
 const display=qr?.display||(d.card?.handle?d.card.display:null);const link=E('div',undefined,'cs-live');const dot=E('i',undefined,d.card?.published?'on':'');link.append(dot,E('span',display||'Short link not set'));
 if(display&&qr?.url){const copy=btn('Copy',async()=>{try{await navigator.clipboard.writeText(qr.url);copy.textContent='Copied';setTimeout(()=>{copy.textContent='Copy';},1600);}catch{}},'cs-live-copy');link.append(copy);}host.append(link);
 const items=[Boolean(d.avatar_url),Boolean(d.contact_phone||d.contact_email),Boolean(d.card?.handle),Boolean(socials.length),Boolean(d.card?.published)],pct=Math.round(items.filter(Boolean).length/items.length*100);
 const stats=E('dl',undefined,'cs-stats');for(const [k,v]of [['Card strength',pct+'%'],['Socials',String(socials.length)],['Status',d.card?.published?'Live':'Preview']]){const w=E('div');w.append(E('dt',k),E('dd',v));stats.append(w);}host.append(stats);
 if(!readOnly){const row=E('div',undefined,'cs-ident-actions');row.append(btn('Edit profile',()=>openTab('profile'),'lx-button'),btn('Socials',()=>openTab('social'),'lx-button'));host.append(row);}
}
