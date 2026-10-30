import {createClient} from '@supabase/supabase-js';
import {createSign,createPrivateKey,X509Certificate} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {rateLimit,ipKeyGenerator} from 'express-rate-limit';
import {z} from 'zod';
import {primaryHandle,socialsFor} from './card-links.mjs';
// native-wallet-issuance-v2
let oauthCache=null;
function privateDatabase(){if(!process.env.SUPABASE_SERVICE_ROLE_KEY)throw Error('Database configuration unavailable');return createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});}
function encode(value){return Buffer.from(JSON.stringify(value)).toString('base64url');}
function signJWT(payload,key){const unsigned=encode({alg:'RS256',typ:'JWT'})+'.'+encode(payload),signer=createSign('RSA-SHA256');signer.update(unsigned);signer.end();return unsigned+'.'+signer.sign(key).toString('base64url');}
function site(){const url=new URL(process.env.PUBLIC_SITE_URL||'https://muktalent.com');if(url.protocol!=='https:')throw Error('Wallet requires a public HTTPS site URL');return url.origin;}
function googleConfig(){
 const issuer=process.env.GOOGLE_WALLET_ISSUER_ID,classId=process.env.GOOGLE_WALLET_CLASS_ID,email=process.env.GOOGLE_WALLET_CLIENT_EMAIL,key=process.env.GOOGLE_WALLET_PRIVATE_KEY?.replace(/\\n/g,'\n');
 if(!issuer||!classId||!email||!key)return null;
 if(!/^\d+$/.test(issuer)||!classId.startsWith(issuer+'.'))throw Error('Invalid Google issuer or class ID');
 const parsed=createPrivateKey(key);if(parsed.asymmetricKeyType!=='rsa')throw Error('Google requires an RSA service account key');
 site();return {issuer,classId,email,key};
}
function pem(name){const value=process.env[name];if(!value)return null;const content=Buffer.from(value,'base64');if(!content.toString('utf8').includes('-----BEGIN'))throw Error('Certificate or key must be PEM encoded before base64');return content;}
function appleConfig(){
 const passType=process.env.APPLE_PASS_TYPE_ID,team=process.env.APPLE_TEAM_ID,signerCert=pem('APPLE_PASS_CERT_PEM_BASE64'),signerKey=pem('APPLE_PASS_KEY_PEM_BASE64'),wwdr=pem('APPLE_WWDR_CERT_PEM_BASE64');
 if(!passType||!team||!signerCert||!signerKey||!wwdr)return null;
 const cert=new X509Certificate(signerCert),intermediate=new X509Certificate(wwdr),now=Date.now();
 for(const c of [cert,intermediate])if(now<Date.parse(c.validFrom)||now>Date.parse(c.validTo))throw Error('Apple certificate is expired or not yet valid');
 const attrs=Object.fromEntries(cert.subject.split('\n').map(line=>{const at=line.indexOf('=');return [line.slice(0,at),line.slice(at+1)];}));
 if(attrs.UID!==passType||attrs.OU!==team)throw Error('Apple certificate does not match Pass Type ID or Team ID');
 const passphrase=process.env.APPLE_PASS_KEY_PASSPHRASE;
 if(!cert.checkPrivateKey(createPrivateKey({key:signerKey,...(passphrase?{passphrase}:{})})))throw Error('Apple key does not match certificate');
 if(!cert.verify(intermediate.publicKey))throw Error('WWDR certificate does not match the signing certificate');
 site();return {passType,team,signerCert,signerKey,wwdr,...(passphrase?{signerKeyPassphrase:passphrase}:{})};
}
function capabilities(){let apple=false,google=false;try{apple=Boolean(appleConfig());}catch{}try{google=Boolean(googleConfig());}catch{}return {apple,google};}
async function publicCard(slug){const db=privateDatabase(),card=await db.from('mt_public_cards').select('owner_id,slug,display_name,job_title,assigned_city,contact_phone,contact_email').eq('slug',slug).eq('published',true).maybeSingle();if(card.error)throw Error('Could not read card');if(!card.data)return null;const person=await db.from('crm_staff').select('active').eq('user_id',card.data.owner_id).maybeSingle();if(person.error)throw Error('Could not check employee');if(!person.data?.active)return null;return card.data;}
async function oauth(config){
 if(oauthCache?.email===config.email&&oauthCache.expires>Date.now()+60000)return oauthCache.token;
 const now=Math.floor(Date.now()/1000),assertion=signJWT({iss:config.email,scope:'https://www.googleapis.com/auth/wallet_object.issuer',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600},config.key);
 const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',signal:AbortSignal.timeout(8000),headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion})}),result=await response.json();
 if(!response.ok||!result.access_token)throw walletStageError('google_oauth',response.status,result.error_description||result.error||'Google authentication failed');oauthCache={email:config.email,token:result.access_token,expires:Date.now()+(result.expires_in||3600)*1000};return result.access_token;
}
// google-visual-business-card-v3
// wallet-error-details-v1
function walletSafeReason(value){return String(value||'Request rejected').slice(0,1200)
 .replace(/Bearer\s+[^\s]+/gi,'Bearer [redacted]')
 .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,'[token]')
 .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'[email]');}
function walletStageError(stage,status,reason){const e=new Error(walletSafeReason(reason));e.walletStage=stage;e.upstreamStatus=status;return e;}
async function walletHTTPError(response,stage){let reason='Request rejected';try{const body=await response.json();reason=body.error?.message||body.error_description||(typeof body.error==='string'?body.error:'Request rejected');}catch{}return walletStageError(stage,response.status,reason);}
async function walletPublicImage(url,stage){
 const probe=async method=>{const r=await fetch(url,{method,redirect:'follow',cache:'no-store',headers:{'User-Agent':'MUK-Talent-Wallet-Check'},signal:AbortSignal.timeout(8000)});if(method==='GET')await r.arrayBuffer().catch(()=>{});return r;};
 let response;try{response=await probe('HEAD');if(!response.ok||!(response.headers.get('content-type')||'').toLowerCase().startsWith('image/'))response=await probe('GET');}
 catch{throw walletStageError(stage,0,'Could not reach '+new URL(url).pathname+' on '+new URL(url).host+'. Check PUBLIC_SITE_URL and that the latest deployment is live.');}
 const type=response.headers.get('content-type')||'';
 if(!response.ok||!type.toLowerCase().startsWith('image/'))throw walletStageError(stage,response.status,'GET '+new URL(url).pathname+' on '+new URL(url).host+' returned HTTP '+response.status+' ('+(type||'no content type')+'). Open that URL in a browser: it must show an image without login.');
}

// executive-business-card-pass-v7
// Shared details for both Wallets: short link, booking deep link, employee ID and public socials only.
async function passDetails(card){
 const db=privateDatabase(),origin=site(),handle=await primaryHandle(db,card.owner_id),url=handle?origin+'/'+handle:origin+'/book/?c='+card.slug,display=handle?new URL(origin).host.replace(/^www\./,'')+'/'+handle:'muktalent.com';
 const book=url+(url.includes('?')?'&':'?')+'book=1';
 const dir=await db.from('mt_employee_directory').select('employee_number').eq('user_id',card.owner_id).maybeSingle();
 const code=!dir.error&&dir.data?.employee_number!=null?'UK-'+String(dir.data.employee_number).padStart(6,'0'):null;
 const socials=await socialsFor(db,card.owner_id,{publicOnly:true});
 const photo=await db.from('mt_employee_assets').select('id,object_path').eq('owner_id',card.owner_id).eq('category','avatar').eq('state','uploaded').order('created_at',{ascending:false}).limit(1);
 return {origin,url,display,book,code,socials:Array.isArray(socials)?socials:[],photo:!photo.error&&photo.data?.length?photo.data[0]:null};
}
const telHref=value=>'tel:'+String(value).replace(/[^\d+]/g,'');
async function googleSave(card){
 const config=googleConfig();if(!config)throw Error('Google Wallet is not configured');
 const d=await passDetails(card),origin=d.origin,id=config.issuer+'.muktalent_'+card.slug.replaceAll('-',''),localized=value=>({defaultValue:{language:'en',value}}),image=(uri,label)=>({sourceUri:{uri},contentDescription:localized(label)}),asset=name=>origin+'/api/business-card/'+card.slug+'/wallet/'+name;
 const text=[{id:'role',header:'Position',body:card.job_title||'MUK Talent'},{id:'territory',header:'Territory',body:card.assigned_city||'United Kingdom'}];
 if(d.code)text.push({id:'staff_id',header:'Staff ID',body:d.code});
 text.push({id:'link',header:'Business card',body:d.display});
 if(card.contact_phone)text.push({id:'phone',header:'Direct line',body:card.contact_phone});
 if(card.contact_email)text.push({id:'email',header:'Email',body:card.contact_email});
 text.push({id:'about',header:'MUK Talent',body:'Maghreb UK Talent connects students and partners with UK universities. Scan the code or tap “Book an appointment” to arrange a 30-minute consultation.'});
 const uris=[{id:'book',uri:d.book,description:'Book an appointment with '+card.display_name}];
 if(card.contact_phone)uris.push({id:'call',uri:telHref(card.contact_phone),description:'Call '+card.display_name});
 const wa=d.socials.find(x=>x.platform==='whatsapp');if(wa)uris.push({id:'whatsapp',uri:wa.url,description:'WhatsApp'});
 if(card.contact_email)uris.push({id:'mail',uri:'mailto:'+card.contact_email,description:'Email '+card.display_name});
 uris.push({id:'card',uri:d.url,description:'Open business card · Share · Add to Wallet'});
 for(const x of d.socials)if(x.platform!=='whatsapp'&&uris.length<9)uris.push({id:'social_'+x.platform,uri:x.url,description:x.label});
 uris.push({id:'site',uri:'https://muktalent.com',description:'muktalent.com'});
 const body={id,classId:config.classId,genericType:'GENERIC_OTHER',state:'ACTIVE',hexBackgroundColor:'#161616',
  cardTitle:localized('MUK TALENT'),header:localized(card.display_name),subheader:localized((card.job_title||'MUK Talent').toUpperCase()),
  logo:image(asset('logo.png?style=gold-v7'),'MUK Talent'),wideLogo:image(asset('wide-logo.png?style=gold-v7'),'MUK Talent · Maghreb UK Talent'),
  barcode:{type:'QR_CODE',value:d.url,alternateText:d.display},
  heroImage:image(asset('portrait.png?v='+(d.photo?.id||'none')+'&style=badge-v7'),card.display_name+' · MUK Talent'),
  textModulesData:text,linksModuleData:{uris}};
 // An actual public deployment is required; do not replace images with expiring URLs or localhost.
 await walletPublicImage(body.logo.sourceUri.uri,'public_logo');
 // Decorative images are optional: if Google could not fetch them, issue the pass without them instead of failing.
 for(const key of ['wideLogo','heroImage']){try{await walletPublicImage(body[key].sourceUri.uri,key==='heroImage'?'public_photo':'public_logo');}catch(error){delete body[key];console.warn(JSON.stringify({event:'wallet_optional_image_skipped',image:key,reason:walletSafeReason(error.message)}));}}
 const token=await oauth(config),headers={Authorization:'Bearer '+token,'Content-Type':'application/json'},selector=id=>({firstValue:{fields:[{fieldPath:"object.textModulesData['"+id+"']"}]}});
 // Front of the card: Territory | Staff ID, then the short link. MULTIPLE_HOLDERS lets every partner save the same card.
 const template={multipleDevicesAndHoldersAllowedStatus:'MULTIPLE_HOLDERS',hexBackgroundColor:'#161616',classTemplateInfo:{cardTemplateOverride:{cardRowTemplateInfos:[{twoItems:{startItem:selector('territory'),endItem:selector(d.code?'staff_id':'link')}},...(card.contact_phone?[{twoItems:{startItem:selector('phone'),endItem:selector('link')}}]:d.code?[{oneItem:{item:selector('link')}}]:[])]}}};
 const classResult=await fetch('https://walletobjects.googleapis.com/walletobjects/v1/genericClass/'+encodeURIComponent(config.classId),{method:'PATCH',headers,body:JSON.stringify(template),signal:AbortSignal.timeout(8000)});if(!classResult.ok)throw await walletHTTPError(classResult,'class_template');
 const base='https://walletobjects.googleapis.com/walletobjects/v1/genericObject',existing=await fetch(base+'/'+encodeURIComponent(id),{headers,signal:AbortSignal.timeout(8000)});
 if(existing.status===404){const created=await fetch(base,{method:'POST',headers,body:JSON.stringify(body),signal:AbortSignal.timeout(8000)});if(!created.ok)throw await walletHTTPError(created,'object_create');}
 else if(existing.ok){const updated=await fetch(base+'/'+encodeURIComponent(id),{method:'PUT',headers,body:JSON.stringify(body),signal:AbortSignal.timeout(8000)});if(!updated.ok)throw await walletHTTPError(updated,'object_update');}
 else throw await walletHTTPError(existing,'object_read');
 return 'https://pay.google.com/gp/v/save/'+signJWT({iss:config.email,aud:'google',typ:'savetowallet',iat:Math.floor(Date.now()/1000),origins:[origin],payload:{genericObjects:[{id}]}},config.key);
}

// Static gold artwork, generated by tools/wallet-assets.mjs and bundled with the server function.
const assetCache=new Map();
function walletAsset(name){if(!assetCache.has(name))assetCache.set(name,readFileSync(new URL('./wallet-assets/'+name,import.meta.url)));return assetCache.get(name);}
// If the artwork folder was not deployed, fall back to the previous brand logo so Wallet keeps working.
async function walletImage(name,size){try{return walletAsset(name);}catch{const brand=JSON.parse(readFileSync(new URL('./wallet-brand.json',import.meta.url),'utf8')),sharp=(await import('sharp')).default;console.warn(JSON.stringify({event:'wallet_asset_missing',asset:name}));return sharp(Buffer.from(brand.logoBase64,'base64'),{limitInputPixels:25000000}).resize(size[0],size[1],{fit:'contain',background:{r:22,g:22,b:22,alpha:1}}).png().toBuffer();}}
async function avatarBytes(card){
 const db=privateDatabase(),row=await db.from('mt_employee_assets').select('object_path').eq('owner_id',card.owner_id).eq('category','avatar').eq('state','uploaded').order('created_at',{ascending:false}).limit(1);
 if(row.error||!row.data?.length)return null;const downloaded=await db.storage.from('mt-employee-private').download(row.data[0].object_path);if(downloaded.error)return null;
 const bytes=Buffer.from(await downloaded.data.arrayBuffer());return bytes.length>2097152?null:bytes;
}
// Badge-style hero (1032x336): gold band, MUK logo and the employee photo fading into the black panel.
async function googlePortraitImage(card){
 const bytes=await avatarBytes(card);if(!bytes)return walletImage('hero-nophoto.png',[1032,336]);
 const sharp=(await import('sharp')).default,W=430,H=336;
 const fade=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><linearGradient id="h" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".34" stop-color="#fff" stop-opacity="1"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#h)"/></svg>`);
 const photo=await sharp(bytes,{limitInputPixels:16000000}).rotate().resize(W,H,{fit:'cover',position:'attention'}).ensureAlpha().composite([{input:fade,blend:'dest-in'}]).png().toBuffer();
 return sharp(await walletImage('hero-base.png',[1032,336])).composite([{input:photo,left:1032-W,top:0}]).png().toBuffer();
}
async function applePass(card){
 const cfg=appleConfig();if(!cfg)throw Error('Apple Wallet is not configured');const {PKPass}=await import('passkit-generator'),d=await passDetails(card),buffers={};
 for(const suffix of ['','@2x','@3x']){const k=suffix?Number(suffix[1]):1;buffers['icon'+suffix+'.png']=await walletImage('apple-icon'+suffix+'.png',[29*k,29*k]);buffers['logo'+suffix+'.png']=await walletImage('apple-logo'+suffix+'.png',[50*k,50*k]);}
 // Only the employee's deliberately public profile-photo category is eligible.
 try{const bytes=await avatarBytes(card);if(bytes){const sharp=(await import('sharp')).default;for(const [suffix,k]of [['',1],['@2x',2],['@3x',3]]){const w=90*k,h=90*k,r=12*k;const mask=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${r}" fill="#fff"/></svg>`),ring=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect x="${k*.75}" y="${k*.75}" width="${w-k*1.5}" height="${h-k*1.5}" rx="${r}" fill="none" stroke="#c9b48a" stroke-width="${k*1.5}"/></svg>`);buffers['thumbnail'+suffix+'.png']=await sharp(bytes,{limitInputPixels:16000000}).rotate().resize(w,h,{fit:'cover',position:'attention'}).ensureAlpha().composite([{input:mask,blend:'dest-in'},{input:ring}]).png().toBuffer();}}}catch{}
 const pass=new PKPass(buffers,{wwdr:cfg.wwdr,signerCert:cfg.signerCert,signerKey:cfg.signerKey,...(cfg.signerKeyPassphrase?{signerKeyPassphrase:cfg.signerKeyPassphrase}:{})},{passTypeIdentifier:cfg.passType,teamIdentifier:cfg.team,serialNumber:card.slug,organizationName:'MUK Talent',description:'Business card · '+card.display_name+' · MUK Talent',foregroundColor:'rgb(240,232,214)',backgroundColor:'rgb(22,22,22)',labelColor:'rgb(201,180,138)',sharingProhibited:false});
 pass.type='generic';
 pass.headerFields.push({key:'territory',label:'TERRITORY',value:card.assigned_city||'UK'});
 pass.primaryFields.push({key:'name',label:(card.job_title||'MUK Talent').toUpperCase(),value:card.display_name});
 if(card.contact_phone)pass.secondaryFields.push({key:'phone',label:'DIRECT LINE',value:card.contact_phone});
 if(card.contact_email)pass.secondaryFields.push({key:'email',label:'EMAIL',value:card.contact_email});
 if(d.code)pass.auxiliaryFields.push({key:'staff_id',label:'STAFF ID',value:d.code});
 pass.auxiliaryFields.push({key:'link',label:'BUSINESS CARD',value:d.display});
 const link=(key,label,href,text)=>pass.backFields.push({key,label,value:text,attributedValue:'<a href="'+href.replace(/"/g,'%22')+'">'+text.replace(/[<>&"]/g,'')+'</a>'});
 link('book','BOOK AN APPOINTMENT',d.book,'Book a 30-minute consultation');
 if(card.contact_phone)pass.backFields.push({key:'call',label:'CALL',value:card.contact_phone,dataDetectorTypes:['PKDataDetectorTypePhoneNumber']});
 const wa=d.socials.find(x=>x.platform==='whatsapp');if(wa)link('whatsapp','WHATSAPP',wa.url,wa.value||'Message on WhatsApp');
 if(card.contact_email)link('mail','EMAIL','mailto:'+card.contact_email,card.contact_email);
 link('card','BUSINESS CARD · SHARE · WALLET',d.url,d.display);
 for(const x of d.socials)if(x.platform!=='whatsapp')link('social_'+x.platform,x.label.toUpperCase(),x.url,x.value||x.label);
 link('site','WEBSITE','https://muktalent.com','muktalent.com');
 pass.backFields.push({key:'about',label:'MUK TALENT',value:'Maghreb UK Talent connects students and partners with UK universities. Share this card from Wallet, or scan the code to open it, book an appointment and add it to your own Wallet.'});
 pass.backFields.push({key:'notice',label:'ABOUT THIS CARD',value:'Professional contact card. It is not an identity or access credential.'});
 pass.setBarcodes({format:'PKBarcodeFormatQR',message:d.url,messageEncoding:'iso-8859-1',altText:d.display});
 return pass.getAsBuffer();
}
export function mountBusinessWallet(app){
 const limit=rateLimit({windowMs:15*60*1000,limit:30,keyGenerator:req=>ipKeyGenerator((process.env.VERCEL?String(req.headers['x-vercel-forwarded-for']||req.headers['x-forwarded-for']||'').split(',')[0].trim():req.ip)||'127.0.0.1'),validate:{xForwardedForHeader:false},standardHeaders:'draft-7',legacyHeaders:false,handler:(req,res)=>res.status(429).json({error:'Too many Wallet requests. Please wait before trying again.',requestId:req.requestId})});
 // Google's image servers share IPs, so artwork has its own, wider limit.
 const imageLimit=rateLimit({windowMs:15*60*1000,limit:600,keyGenerator:req=>ipKeyGenerator((process.env.VERCEL?String(req.headers['x-vercel-forwarded-for']||req.headers['x-forwarded-for']||'').split(',')[0].trim():req.ip)||'127.0.0.1'),validate:{xForwardedForHeader:false},standardHeaders:'draft-7',legacyHeaders:false,handler:(req,res)=>res.sendStatus(429)});
 const handle=fn=>async(req,res)=>{try{const slug=z.string().uuid().parse(req.params.slug),card=await publicCard(slug);if(!card)return res.status(404).json({error:'This business card is not available.'});await fn(req,res,card);}catch(error){const stage=error.walletStage||'unclassified';
console.error(JSON.stringify({event:'wallet_issuance_failed',requestId:req.requestId,stage,httpStatus:error.upstreamStatus??null,reason:error.walletStage?walletSafeReason(error.message):'Unclassified error. Credential values were not logged.',code:error.name||'WalletError'}));
const imageError=stage==='public_logo'||stage==='public_photo';
res.status(error instanceof z.ZodError?400:503).json({error:imageError?'Wallet logo is not publicly reachable yet. '+walletSafeReason(error.message):'Wallet issuance failed at '+stage+'. Check the server log using the error reference.',stage,requestId:req.requestId});}};
 const png=(res,bytes,age=86400)=>{res.set('Content-Type','image/png');res.set('X-Content-Type-Options','nosniff');res.set('Cache-Control','public, max-age='+age);res.send(bytes);};
 app.get('/api/business-card/:slug/wallet/wide-logo.png',imageLimit,handle(async(req,res)=>png(res,await walletImage('google-wide-logo.png',[1280,400]))));
 app.get('/api/business-card/:slug/wallet/logo.png',imageLimit,handle(async(req,res,card)=>{const bytes=await walletImage('google-logo.png',[660,660]);res.set('Content-Type','image/png');res.set('X-Content-Type-Options','nosniff');res.set('Cache-Control','public, max-age=300');res.send(bytes);}));
 app.get('/api/business-card/:slug/wallet/portrait.png',imageLimit,handle(async(req,res,card)=>{const bytes=await googlePortraitImage(card);if(!bytes)return res.sendStatus(404);res.set('Content-Type','image/png');res.set('X-Content-Type-Options','nosniff');res.set('Cache-Control','public, max-age=300');res.send(bytes);}));
 app.get('/api/business-card/:slug/wallet',limit,handle(async(req,res,card)=>res.json({version:2,...capabilities(),appleUrl:'/api/business-card/'+card.slug+'/wallet/apple.pkpass',googleEndpoint:'/api/business-card/'+card.slug+'/wallet/google'})));
 app.post('/api/business-card/:slug/wallet/google',limit,handle(async(req,res,card)=>res.json({url:await googleSave(card)})));
 app.get('/api/business-card/:slug/wallet/apple.pkpass',limit,handle(async(req,res,card)=>{const buffer=await applePass(card);res.set('Content-Type','application/vnd.apple.pkpass');res.set('Content-Disposition','attachment; filename="muktalent-business-card.pkpass"');res.set('Cache-Control','no-store');res.send(buffer);}));
}


