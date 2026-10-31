
const $=id=>document.getElementById(id);
const make=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
let returnFocus=null,observer=null;
function safeLink(text,url){try{if(new URL(url).protocol!=='https:')return null;}catch{return null;}const a=make('a',text);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;}
function dateText(value){if(!value)return '';const d=new Date(value+'T12:00:00Z');return Number.isNaN(d.getTime())?'':new Intl.DateTimeFormat('en-GB',{month:'short',year:'numeric',timeZone:'UTC'}).format(d);}
function openPreview(url,title,button){returnFocus=button;$('viewerTitle').textContent=title;$('viewerImage').src=url;$('viewerImage').alt=title;$('viewer').showModal();}
$('closeViewer').onclick=()=>$('viewer').close();$('viewer').addEventListener('close',()=>{$('viewerImage').removeAttribute('src');returnFocus?.focus();});
function render(items){$('certificates').replaceChildren();$('pageIndex').replaceChildren();$('count').textContent=`${String(items.length).padStart(2,'0')} CREDENTIAL${items.length===1?'':'S'}`;
if(!items.length){$('status').textContent='No certificates have been published yet.';return;}$('status').hidden=true;
for(const [index,item]of items.entries()){
 const section=make('section',undefined,'certificate');section.id=item.slug;section.setAttribute('aria-labelledby',`title-${item.id}`);
 const heading=make('div',undefined,'certificate-heading'),title=make('h2',item.title);title.id=`title-${item.id}`;heading.append(make('span',String(index+1).padStart(2,'0'),'number'),title);section.append(heading);
 const metadata=[item.issuer,dateText(item.issued_on)?`Issued ${dateText(item.issued_on)}`:'',dateText(item.expires_on)?`Expires ${dateText(item.expires_on)}`:''].filter(Boolean).join(' · ');section.append(make('p',metadata,'certificate-meta'));
 const preview=item.cover_url||item.gallery_urls?.[0];
 if(preview){const button=make('button',undefined,'document-preview');button.type='button';button.setAttribute('aria-label',`Enlarge certificate: ${item.title}`);const img=make('img');img.src=preview;img.alt=`Certificate — ${item.title}`;img.loading=index===0?'eager':'lazy';img.decoding='async';img.addEventListener('error',()=>{button.hidden=true;const p=make('p','The preview is unavailable. Try reloading this page or opening the document below.','no-preview');button.after(p);},{once:true});button.append(img);button.onclick=()=>openPreview(preview,item.title,button);section.append(button);}
 else{section.append(make('p',item.document_url?'The PDF is available below. Add a certificate image in the editor to display it directly on this page.':'Certificate image not added yet.','no-preview'));}
 const actions=make('div',undefined,'actions');for(const [label,url]of [['Open PDF ↗',item.document_url],['Verify with issuer ↗',item.verification_url]]){const a=safeLink(label,url);if(a)actions.append(a);}if(actions.childElementCount)section.append(actions);
 const note=[item.subtitle,item.body].filter(Boolean).join('\n\n');if(note)section.append(make('p',note,'note'));
 $('certificates').append(section);
 const a=make('a',undefined,'index-link');a.href='#'+encodeURIComponent(item.slug);a.setAttribute('aria-label',item.title);a.title=item.title;a.dataset.slug=item.slug;$('pageIndex').append(a);
}
if('IntersectionObserver' in window){observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){for(const a of $('pageIndex').children){if(a.dataset.slug===e.target.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');}}},{rootMargin:'-15% 0px -55% 0px',threshold:0});for(const s of document.querySelectorAll('.certificate'))observer.observe(s);}
if(location.hash){try{document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();}catch{}}
}
async function load(kind){const r=await fetch(`/api/personal/items?kind=${kind}`,{cache:'no-store'});let result;try{result=await r.json();}catch{throw Error('The server did not return certificate data.');}if(!r.ok)throw Error(result.error||'Could not load the archive.');if(!Array.isArray(result.data))throw Error('Unexpected archive response.');return result.data;}
try{render(await load('certificate'));}catch(e){$('status').textContent=e.message;$('status').classList.add('error');}
try{const profile=(await load('profile'))[0];if(profile?.title){$('pageTitle').textContent=`Certificates — ${profile.title}`;document.title=`Certificates | ${profile.title}`;}}catch{}
