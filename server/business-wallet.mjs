import {createClient} from '@supabase/supabase-js';
import {createSign,createPrivateKey,X509Certificate} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {rateLimit,ipKeyGenerator} from 'express-rate-limit';
import {z} from 'zod';
// native-wallet-issuance-v2
let branding=null,appleImages=null,oauthCache=null;
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
async function walletPublicImage(url,stage){let response;try{response=await fetch(url,{method:'HEAD',redirect:'follow',signal:AbortSignal.timeout(6000)});}catch{throw walletStageError(stage,0,'The public image endpoint could not be reached. Publish the updated server at PUBLIC_SITE_URL.');}const type=response.headers.get('content-type')||'';if(!response.ok||!type.toLowerCase().startsWith('image/'))throw walletStageError(stage,response.status,'The public image endpoint did not return an image. Publish the updated server at PUBLIC_SITE_URL and ensure this URL is public, without login.');}

// google-single-face-contact-pass-v5
async function googleSave(card){
 const config=googleConfig();if(!config)throw Error('Google Wallet is not configured');
 const origin=site(),url=origin+'/book/?c='+card.slug,id=config.issuer+'.muktalent_'+card.slug.replaceAll('-',''),localized=value=>({defaultValue:{language:'en',value}}),image=(uri,label)=>({sourceUri:{uri},contentDescription:localized(label)});
 const body={id,classId:config.classId,genericType:'GENERIC_OTHER',state:'ACTIVE',hexBackgroundColor:'#14191c',cardTitle:localized('MUK TALENT'),header:localized(card.display_name),subheader:localized(card.job_title),
 logo:image(origin+'/api/business-card/'+card.slug+'/wallet/logo.png','MUK Talent'),
 barcode:{type:'QR_CODE',value:url,alternateText:'Scan for business card, booking and Wallet'},
 textModulesData:[{id:'territory',header:'Territory',body:card.assigned_city||'MUK Talent team'}],
 linksModuleData:{uris:[{id:'card',uri:url,description:'Open business card · Book · Add to Wallet'}]}};
 if(card.contact_phone){body.textModulesData.push({id:'phone',header:'Work phone',body:card.contact_phone});body.linksModuleData.uris.push({id:'phone',uri:'tel:'+card.contact_phone,description:'Call '+card.display_name});}
 if(card.contact_email){body.textModulesData.push({id:'email',header:'Work email',body:card.contact_email});body.linksModuleData.uris.push({id:'email',uri:'mailto:'+card.contact_email,description:'Email '+card.display_name});}
 const photo=await privateDatabase().from('mt_employee_assets').select('id').eq('owner_id',card.owner_id).eq('category','avatar').eq('state','uploaded').order('created_at',{ascending:false}).limit(1);if(photo.error)throw Error('Could not read photo status');
 if(photo.data?.length)body.heroImage=image(origin+'/api/business-card/'+card.slug+'/wallet/portrait.png?v='+photo.data[0].id+'&style=circle-v6',card.display_name+' · MUK Talent');
 // An actual public deployment is required; do not replace images with expiring URLs or localhost.
 await walletPublicImage(body.logo.sourceUri.uri,'public_logo');if(body.heroImage)await walletPublicImage(body.heroImage.sourceUri.uri,'public_photo');
 const token=await oauth(config),headers={Authorization:'Bearer '+token,'Content-Type':'application/json'},selector=id=>({firstValue:{fields:[{fieldPath:"object.textModulesData['"+id+"']"}]}});
 const template={classTemplateInfo:{cardTemplateOverride:{cardRowTemplateInfos:[{oneItem:{item:selector('territory')}},{twoItems:{startItem:selector('phone'),endItem:selector('email')}}]}}};
 const classResult=await fetch('https://walletobjects.googleapis.com/walletobjects/v1/genericClass/'+encodeURIComponent(config.classId),{method:'PATCH',headers,body:JSON.stringify(template),signal:AbortSignal.timeout(8000)});if(!classResult.ok)throw await walletHTTPError(classResult,'class_template');
 const base='https://walletobjects.googleapis.com/walletobjects/v1/genericObject',existing=await fetch(base+'/'+encodeURIComponent(id),{headers,signal:AbortSignal.timeout(8000)});
 if(existing.status===404){const created=await fetch(base,{method:'POST',headers,body:JSON.stringify(body),signal:AbortSignal.timeout(8000)});if(!created.ok)throw await walletHTTPError(created,'object_create');}
 else if(existing.ok){const updated=await fetch(base+'/'+encodeURIComponent(id),{method:'PUT',headers,body:JSON.stringify(body),signal:AbortSignal.timeout(8000)});if(!updated.ok)throw await walletHTTPError(updated,'object_update');}
 else throw await walletHTTPError(existing,'object_read');
 return 'https://pay.google.com/gp/v/save/'+signJWT({iss:config.email,aud:'google',typ:'savetowallet',iat:Math.floor(Date.now()/1000),origins:[origin],payload:{genericObjects:[{id}]}},config.key);
}

let googleLogoCache=null;
async function googleLogoImage(){
 if(googleLogoCache)return googleLogoCache;
 const brand=JSON.parse(readFileSync(new URL('./wallet-brand.json',import.meta.url),'utf8')),sharp=(await import('sharp')).default;
 googleLogoCache=await sharp(Buffer.from(brand.logoBase64,'base64'),{limitInputPixels:25000000}).resize(256,256,{fit:'contain',background:{r:17,g:21,b:24,alpha:1}}).png().toBuffer();return googleLogoCache;
}
// circular-wallet-portrait-v6
async function googlePortraitImage(card){
 const db=privateDatabase(),row=await db.from('mt_employee_assets').select('object_path').eq('owner_id',card.owner_id).eq('category','avatar').eq('state','uploaded').order('created_at',{ascending:false}).limit(1);
 if(row.error||!row.data?.length)return null;const downloaded=await db.storage.from('mt-employee-private').download(row.data[0].object_path);if(downloaded.error)return null;
 const bytes=Buffer.from(await downloaded.data.arrayBuffer());if(bytes.length>2097152)throw Error('Profile photo exceeds supported size');const sharp=(await import('sharp')).default;
 const mask=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="280" height="280"><circle cx="140" cy="140" r="140" fill="white"/></svg>');
 const photo=await sharp(bytes,{limitInputPixels:16000000}).resize(280,280,{fit:'cover',position:'attention'}).ensureAlpha().composite([{input:mask,blend:'dest-in'}]).png().toBuffer();
 const ring=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="288" height="288"><circle cx="144" cy="144" r="143" fill="none" stroke="#b99d5b" stroke-width="1.5"/></svg>');
 return sharp({create:{width:1032,height:336,channels:4,background:{r:20,g:25,b:28,alpha:1}}}).composite([{input:ring,left:372,top:24},{input:photo,left:376,top:28}]).png().toBuffer();
}

async function baseImages(){
 if(appleImages)return appleImages;const sharp=(await import('sharp')).default;
 if(!branding)branding=JSON.parse(readFileSync(new URL('./wallet-brand.json',import.meta.url),'utf8'));
 const original=Buffer.from(branding.logoBase64,'base64'),buffers={};
 for(const [suffix,size]of [['',29],['@2x',58],['@3x',87]])buffers['icon'+suffix+'.png']=await sharp(original,{limitInputPixels:25000000}).resize(size,size,{fit:'contain',background:{r:17,g:21,b:24,alpha:1}}).png().toBuffer();
 appleImages=buffers;return buffers;
}
async function applePass(card){
 const cfg=appleConfig();if(!cfg)throw Error('Apple Wallet is not configured');const {PKPass}=await import('passkit-generator'),url=site()+'/book/?c='+card.slug,buffers={...await baseImages()};
 // Only the employee's deliberately public profile-photo category is eligible.
 const db=privateDatabase(),photo=await db.from('mt_employee_assets').select('object_path').eq('owner_id',card.owner_id).eq('category','avatar').eq('state','uploaded').order('created_at',{ascending:false}).limit(1);
 if(!photo.error&&photo.data?.length){try{const downloaded=await db.storage.from('mt-employee-private').download(photo.data[0].object_path);if(!downloaded.error){const bytes=Buffer.from(await downloaded.data.arrayBuffer());if(bytes.length<=2097152){const sharp=(await import('sharp')).default;for(const [suffix,multiplier]of [['',1],['@2x',2],['@3x',3]])buffers['thumbnail'+suffix+'.png']=await sharp(bytes,{limitInputPixels:16000000}).resize(90*multiplier,90*multiplier,{fit:'cover'}).png().toBuffer();}}}catch{}}
 const pass=new PKPass(buffers,{wwdr:cfg.wwdr,signerCert:cfg.signerCert,signerKey:cfg.signerKey,...(cfg.signerKeyPassphrase?{signerKeyPassphrase:cfg.signerKeyPassphrase}:{})},{passTypeIdentifier:cfg.passType,teamIdentifier:cfg.team,serialNumber:card.slug,organizationName:'MUK Talent',description:'MUK Talent · '+card.display_name,logoText:'MUK TALENT',foregroundColor:'rgb(243,239,227)',backgroundColor:'rgb(17,21,24)',labelColor:'rgb(200,170,114)',sharingProhibited:false});
 pass.type='generic';pass.primaryFields.push({key:'name',label:'YOUR MUK TALENT REPRESENTATIVE',value:card.display_name});pass.secondaryFields.push({key:'position',label:'POSITION',value:card.job_title});if(card.assigned_city)pass.auxiliaryFields.push({key:'territory',label:'TERRITORY',value:card.assigned_city});
 pass.backFields.push({key:'business_card',label:'BUSINESS CARD & APPOINTMENTS',value:url});if(card.contact_phone)pass.backFields.push({key:'phone',label:'WORK PHONE',value:card.contact_phone});if(card.contact_email)pass.backFields.push({key:'email',label:'WORK EMAIL',value:card.contact_email});pass.backFields.push({key:'notice',label:'ABOUT THIS CARD',value:'This is a professional contact card, not an identity or access credential. For current details and availability, open the linked business card.'});
 pass.setBarcodes({format:'PKBarcodeFormatQR',message:url,messageEncoding:'iso-8859-1',altText:'MUK Talent · Business card'});
 return pass.getAsBuffer();
}
export function mountBusinessWallet(app){
 const limit=rateLimit({windowMs:15*60*1000,limit:30,keyGenerator:req=>ipKeyGenerator((process.env.VERCEL?String(req.headers['x-vercel-forwarded-for']||req.headers['x-forwarded-for']||'').split(',')[0].trim():req.ip)||'127.0.0.1'),validate:{xForwardedForHeader:false},standardHeaders:'draft-7',legacyHeaders:false,handler:(req,res)=>res.status(429).json({error:'Too many Wallet requests. Please wait before trying again.',requestId:req.requestId})});
 const handle=fn=>async(req,res)=>{try{const slug=z.string().uuid().parse(req.params.slug),card=await publicCard(slug);if(!card)return res.status(404).json({error:'This business card is not available.'});await fn(req,res,card);}catch(error){const stage=error.walletStage||'unclassified';
console.error(JSON.stringify({event:'wallet_issuance_failed',requestId:req.requestId,stage,httpStatus:error.upstreamStatus??null,reason:error.walletStage?walletSafeReason(error.message):'Unclassified error. Credential values were not logged.',code:error.name||'WalletError'}));
const imageError=stage==='public_logo'||stage==='public_photo';
res.status(error instanceof z.ZodError?400:503).json({error:imageError?'Wallet images are not publicly accessible yet. Publish the updated server at PUBLIC_SITE_URL.':'Wallet issuance failed at '+stage+'. Check the server log using the error reference.',stage,requestId:req.requestId});}};
 app.get('/api/business-card/:slug/wallet/logo.png',limit,handle(async(req,res,card)=>{const bytes=await googleLogoImage();res.set('Content-Type','image/png');res.set('X-Content-Type-Options','nosniff');res.set('Cache-Control','public, max-age=300');res.send(bytes);}));
 app.get('/api/business-card/:slug/wallet/portrait.png',limit,handle(async(req,res,card)=>{const bytes=await googlePortraitImage(card);if(!bytes)return res.sendStatus(404);res.set('Content-Type','image/png');res.set('X-Content-Type-Options','nosniff');res.set('Cache-Control','public, max-age=300');res.send(bytes);}));
 app.get('/api/business-card/:slug/wallet',limit,handle(async(req,res,card)=>res.json({version:2,...capabilities(),appleUrl:'/api/business-card/'+card.slug+'/wallet/apple.pkpass',googleEndpoint:'/api/business-card/'+card.slug+'/wallet/google'})));
 app.post('/api/business-card/:slug/wallet/google',limit,handle(async(req,res,card)=>res.json({url:await googleSave(card)})));
 app.get('/api/business-card/:slug/wallet/apple.pkpass',limit,handle(async(req,res,card)=>{const buffer=await applePass(card);res.set('Content-Type','application/vnd.apple.pkpass');res.set('Content-Disposition','attachment; filename="muktalent-business-card.pkpass"');res.set('Cache-Control','no-store');res.send(buffer);}));
}
