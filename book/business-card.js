const E=(t,v,c)=>{const n=document.createElement(t);if(v!==undefined)n.textContent=String(v);if(c)n.className=c;return n;};
export function createBusinessCard({data,photoUrl,qrImage}){
 const scene=E('div',undefined,'biz-scene mk-scene'),card=E('article',undefined,'mk-card');card.setAttribute('aria-label','MUK Talent digital business card');
 const header=E('header',undefined,'mk-brand');header.append(E('span','MUK TALENT','mk-wordmark'),E('span','STUDENT COUNSELLING','mk-brand-caption'));
 const portrait=E('div',undefined,'mk-portrait'),circle=E('div',undefined,'mk-avatar'),name=data.display_name||data.full_name||'MUK Talent';
 circle.append(E('span',name.split(/\s+/).slice(0,2).map(v=>v[0]).join(''),'mk-initials'));
 if(photoUrl){const image=E('img');image.src=photoUrl;image.alt=name;image.width=image.height=132;image.decoding='async';image.onerror=()=>image.remove();circle.append(image);}portrait.append(circle);
 const identity=E('section',undefined,'mk-identity');identity.append(E('h2',name),E('p',data.job_title||'Team member','mk-position'));if(name.length>28)identity.classList.add('mk-long-name');if(data.assigned_city)identity.append(E('p',data.assigned_city,'mk-location'));
 const contacts=E('dl',undefined,'mk-contacts');for(const [label,value]of [['Work phone',data.contact_phone],['Work email',data.contact_email]])if(value){const row=E('div');row.append(E('dt',label),E('dd',value));contacts.append(row);}
 const connection=E('section',undefined,'mk-connect');connection.setAttribute('aria-label','Scan this card');
 if(qrImage){const qr=E('img');qr.src=qrImage;qr.alt='Scan to open this business card, book an appointment and save it to Wallet';qr.width=qr.height=160;connection.append(qr,E('p','SCAN TO CONNECT','mk-scan-label'));}else connection.append(E('p','Your QR is available once the public card is enabled.','mk-qr-pending'));
 const footer=E('footer','muktalent.com','mk-footer');card.append(header,portrait,identity);if(contacts.children.length)card.append(contacts);card.append(connection,footer);scene.append(card);return scene;
}

export function createShareTools({url,qrImage,name,data}){
 const box=E('div',undefined,'biz-share-tools'),message=E('p','', 'biz-share-message');message.setAttribute('role','status');message.setAttribute('aria-live','polite');
 const share=E('button','Share card','biz-action'),copy=E('button','Copy link','biz-action');share.type=copy.type='button';
 share.onclick=async()=>{try{if(navigator.share)await navigator.share({title:name+' · MUK Talent',url});else{await navigator.clipboard.writeText(url);message.textContent='Link copied.';}}catch(error){if(error.name!=='AbortError')message.textContent=url;}};
 copy.onclick=async()=>{try{await navigator.clipboard.writeText(url);message.textContent='Link copied.';}catch{message.textContent=url;}};box.append(share,copy);
 if(qrImage){const download=E('a','Download QR','biz-action');download.href=qrImage;download.download='muktalent-business-card-qr.png';box.append(download);}
 if(data){const save=E('button','Save contact','biz-action');save.type='button';save.onclick=()=>{const safe=v=>String(v||'').replace(/\\/g,'\\\\').replace(/[\r\n]+/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');const lines=['BEGIN:VCARD','VERSION:3.0','FN:'+safe(name),'ORG:MUK Talent','TITLE:'+safe(data.job_title),'URL:'+url];if(data.contact_phone)lines.push('TEL;TYPE=WORK:'+safe(data.contact_phone));if(data.contact_email)lines.push('EMAIL;TYPE=WORK:'+safe(data.contact_email));lines.push('END:VCARD');const blob=new Blob([lines.join('\r\n')],{type:'text/vcard;charset=utf-8'}),a=E('a'),link=URL.createObjectURL(blob);a.href=link;a.download='muktalent-contact.vcf';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(link),1000);};box.append(save);}
 // wallet-control-visible-v3: configuration/network failure must not silently remove the control.
 const wallet=E('button','Add to Wallet','biz-action biz-wallet biz-wallet-main');wallet.type='button';wallet.setAttribute('aria-expanded','false');const choices=E('section',undefined,'biz-wallet-options');choices.setAttribute('aria-label','Wallet options');choices.hidden=true;let busy=false;
 box.append(wallet,choices,message);
 async function readResponse(response){const text=await response.text();let value;try{value=JSON.parse(text);}catch{value={error:response.status===429?'Too many Wallet requests. Please wait before trying again.':'This server did not return the Wallet response expected. Check the public deployment.'};}if(!response.ok){const e=new Error(value.error||'Wallet is unavailable.');e.status=response.status;throw e;}return value;}
 wallet.onclick=async()=>{
  if(busy)return;if(!choices.hidden){choices.hidden=true;wallet.setAttribute('aria-expanded','false');return;}
  busy=true;wallet.disabled=true;wallet.textContent='Checking Wallet…';message.textContent='';choices.replaceChildren();choices.hidden=false;wallet.setAttribute('aria-expanded','true');
  try{
   const slug=new URL(url,location.origin).searchParams.get('c');if(!slug)throw Error('This card link has no card identifier. Reopen the public business card.');
   const info=await readResponse(await fetch('/api/business-card/'+encodeURIComponent(slug)+'/wallet',{cache:'no-store'}));
   if(info.version!==2)throw Error('This server is running an older Wallet integration. Publish the latest version.');
   if(info.apple){const apple=E('a','Add to Apple Wallet','biz-action biz-wallet');const target=new URL(info.appleUrl,location.origin);if(target.origin!==location.origin)throw Error('Unexpected Apple Wallet endpoint.');apple.href=target.href;choices.append(apple);}
   if(info.google){const google=E('button','Add to Google Wallet','biz-action biz-wallet');google.type='button';choices.append(google);google.onclick=async()=>{
    if(busy)return;busy=true;google.disabled=wallet.disabled=true;google.textContent='Preparing your card…';message.textContent='';
    try{const endpoint=new URL(info.googleEndpoint,location.origin);if(endpoint.origin!==location.origin)throw Error('Unexpected Google Wallet endpoint.');const result=await readResponse(await fetch(endpoint.href,{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},body:'{}'}));if(!result.url)throw Error('The server did not return a Wallet save link.');const target=new URL(result.url);if(target.origin!=='https://pay.google.com')throw Error('Unexpected Wallet save destination.');window.location.assign(target.href);}
    catch(error){message.textContent=error.message;}
    finally{busy=false;google.disabled=wallet.disabled=false;google.textContent='Add to Google Wallet';}
   };}
   if(!info.apple&&!info.google)message.textContent='Wallet is not enabled on the server serving this page. Check its issuer credentials and public HTTPS site URL. Local configuration does not configure the public deployment.';
  }catch(error){message.textContent=error.message;}
  finally{busy=false;wallet.disabled=false;wallet.textContent='Add to Wallet';}
 };
 return box;
}
