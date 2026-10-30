import { parsePhoneNumberFromString, getCountryCallingCode } from "libphonenumber-js/max";
import {createClient} from '@supabase/supabase-js';
import {randomUUID} from 'node:crypto';
import {rateLimit,ipKeyGenerator} from 'express-rate-limit';
import {z} from 'zod';
import QRCode from 'qrcode';
import {cardLinkFor} from './card-links.mjs';
const bucket='mt-employee-private';
function admin(){if(!process.env.SUPABASE_SERVICE_ROLE_KEY)throw Error('Private services not configured');return createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});}
function checked(r){if(r.error)throw Error('Database operation failed');return r.data;}
const cardSchema=z.object({display_name:z.string().trim().min(1).max(200),job_title:z.string().trim().min(1).max(200),bio:z.string().trim().max(2000),languages:z.string().trim().max(200),published:z.boolean()}).strict();
const qualification=z.object({english_test:z.enum(['Not assessed','No test','IELTS','Other test']),english_score:z.number().min(0).max(9).nullable(),passport:z.enum(['Unknown','Available','In progress','Not available']),school_status:z.enum(['Unknown','In progress','Completed']),funding:z.enum(['Unknown','Confirmed','Partial','Not defined']),notes:z.string().trim().max(4000)}).strict();
// booking-phone-and-date-fix-v1
const bookingCountries=['MA','GB','FR','ES','DZ','TN','BE','DE','NL','IT','US','CA','AE','SA','QA','PT','CH','EG','TR','SN','CI'];
const booking=z.object({
 first_name:z.string().trim().min(1).max(150),last_name:z.string().trim().min(1).max(150),
 email:z.string().trim().email().max(320),phone:z.string().trim().min(4).max(40),phone_country:z.enum(bookingCountries),
 institution:z.string().trim().max(300),subject:z.string().trim().min(1).max(1000),mode:z.enum(['phone','in_person']),
 consent:z.literal(true),website:z.literal(''),starts_at:z.string().datetime({offset:true}).transform(value=>new Date(value).toISOString()),request_id:z.string().uuid()
}).strict().superRefine((value,ctx)=>{
 const parsed=parsePhoneNumberFromString(value.phone,{defaultCountry:value.phone_country,extract:false});
 if(!parsed||!parsed.isValid()||parsed.countryCallingCode!==getCountryCallingCode(value.phone_country))ctx.addIssue({code:'custom',path:['phone'],message:'Enter a valid phone number for the selected country code.'});
}).transform(value=>{
 const parsed=parsePhoneNumberFromString(value.phone,{defaultCountry:value.phone_country,extract:false});
 const {phone_country,...rest}=value;return {...rest,phone:parsed.number};
});

export function mountWorkspaceExtras(app,{requireStaff}){
 const wrap=fn=>async(req,res)=>{try{await fn(req,res);}catch(e){
 const fields=e instanceof z.ZodError?[...new Set(e.issues.map(issue=>issue.path.join('.')).filter(Boolean))]:[];
 console.error(JSON.stringify({event:'workspace_extra_failed',requestId:req.requestId,code:e.code||e.name,fields}));
 res.status(e instanceof z.ZodError?400:503).json({error:e instanceof z.ZodError?'Please check the highlighted form fields.':'Operation unavailable. Refresh and try again.',fields,requestId:req.requestId});
 }};
 const publicLimit=rateLimit({windowMs:15*60*1000,limit:180,keyGenerator:req=>ipKeyGenerator((process.env.VERCEL?String(req.headers['x-vercel-forwarded-for']||req.headers['x-forwarded-for']||'').split(',')[0].trim():req.ip)||'127.0.0.1'),validate:{xForwardedForHeader:false},standardHeaders:'draft-7',legacyHeaders:false,handler:(req,res)=>res.status(429).json({error:'Too many requests. Please wait before trying again.',retry_after_seconds:Number(res.getHeader('Retry-After'))||60,requestId:req.requestId})});
 const bookingLimit=rateLimit({windowMs:60*60*1000,limit:8,skipFailedRequests:true,keyGenerator:req=>ipKeyGenerator((process.env.VERCEL?String(req.headers['x-vercel-forwarded-for']||req.headers['x-forwarded-for']||'').split(',')[0].trim():req.ip)||'127.0.0.1'),validate:{xForwardedForHeader:false},standardHeaders:'draft-7',legacyHeaders:false,handler:(req,res)=>res.status(429).json({error:'Too many requests. Please wait before trying again.',retry_after_seconds:Number(res.getHeader('Retry-After'))||60,requestId:req.requestId})});
 const writeLimit=rateLimit({windowMs:15*60*1000,limit:20,keyGenerator:req=>req.staff.user_id,standardHeaders:'draft-7',legacyHeaders:false});
 function scope(req){if(!req.query.owner)return req.staff.user_id;if(req.staff.role!=='admin')throw Error('Forbidden');return z.string().uuid().parse(req.query.owner);}
 app.get('/api/workspace/card',requireStaff,wrap(async(req,res)=>{const db=admin(),owner=scope(req),data=checked(await db.from('mt_public_cards').select('*').eq('owner_id',owner).maybeSingle());res.json({data});}));
 app.post('/api/workspace/card',requireStaff,writeLimit,wrap(async(req,res)=>{const v=cardSchema.parse(req.body),db=admin();const data=checked(await db.from('mt_public_cards').upsert({owner_id:req.staff.user_id,...v,updated_at:new Date().toISOString()},{onConflict:'owner_id'}).select().single());res.json({data});}));
 app.get('/api/workspace/card/qr',requireStaff,wrap(async(req,res)=>{const db=admin(),owner=scope(req),card=checked(await db.from('mt_public_cards').select('slug,published').eq('owner_id',owner).maybeSingle());if(!card?.published)return res.status(400).json({error:'Publish your card first.'});const link=await cardLinkFor(db,owner,card.slug),url=link.url;res.json({url,display:link.display,handle:link.handle,slug:card.slug,image:await QRCode.toDataURL(url,{width:600,margin:2,errorCorrectionLevel:'M'})});}));
 app.get('/api/workspace/assets',requireStaff,wrap(async(req,res)=>{const db=admin(),rows=checked(await db.from('mt_employee_assets').select('id,category,original_name,mime,created_at,object_path').eq('owner_id',scope(req)).eq('state','uploaded').order('created_at',{ascending:false}).limit(100));const data=[];for(const row of rows){const s=await db.storage.from(bucket).createSignedUrl(row.object_path,60,{download:row.category!=='avatar'});data.push({...row,url:s.data?.signedUrl||null});}res.json({data});}));
 app.post('/api/workspace/assets/start',requireStaff,writeLimit,wrap(async(req,res)=>{
 const v=z.object({category:z.enum(['avatar','identity','content']),name:z.string().min(1).max(200),mime:z.enum(['image/jpeg','image/png','application/pdf']),bytes:z.number().int().min(1).max(10485760)}).strict().parse(req.body);
 if(v.category==='avatar'&&(v.mime==='application/pdf'||v.bytes>2097152))return res.status(400).json({error:'Profile photo must be JPG/PNG, maximum 2 MB.'});
 const db=admin(),id=randomUUID(),ext={'image/jpeg':'jpg','image/png':'png','application/pdf':'pdf'}[v.mime],path=`${req.staff.user_id}/${v.category}/${id}.${ext}`;
 checked(await db.from('mt_employee_assets').insert({id,owner_id:req.staff.user_id,category:v.category,original_name:v.name,mime:v.mime,bytes:v.bytes,object_path:path}));
 const signed=await db.storage.from(bucket).createSignedUploadUrl(path);if(signed.error)throw Error('Upload could not be started');res.json({id,path,token:signed.data.token});
 }));
 app.post('/api/workspace/assets/finish',requireStaff,writeLimit,wrap(async(req,res)=>{
 const id=z.string().uuid().parse(req.body?.id),db=admin(),row=checked(await db.from('mt_employee_assets').select('*').eq('id',id).eq('owner_id',req.staff.user_id).eq('state','pending').maybeSingle());if(!row)throw Error('Upload not pending');
 const file=await db.storage.from(bucket).download(row.object_path);if(file.error)throw Error('Upload missing');const bytes=Buffer.from(await file.data.arrayBuffer());
 const valid=row.mime==='image/png'?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):row.mime==='image/jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:bytes.subarray(0,5).toString()==='%PDF-';
 if(!valid||bytes.length!==row.bytes){await db.storage.from(bucket).remove([row.object_path]);await db.from('mt_employee_assets').update({state:'rejected'}).eq('id',id);return res.status(400).json({error:'File size or signature did not match the declared file.'});}
 checked(await db.from('mt_employee_assets').update({state:'uploaded'}).eq('id',id));res.json({ok:true});
 }));
 app.delete('/api/workspace/assets/:id',requireStaff,writeLimit,wrap(async(req,res)=>{const id=z.string().uuid().parse(req.params.id),db=admin(),r=checked(await db.from('mt_employee_assets').select('object_path').eq('id',id).eq('owner_id',req.staff.user_id).maybeSingle());if(!r)return res.status(404).json({error:'File not found.'});const removed=await db.storage.from(bucket).remove([r.object_path]);if(removed.error)throw Error('Could not remove file');checked(await db.from('mt_employee_assets').delete().eq('id',id));res.json({ok:true});}));
 app.get('/api/workspace/qualification/:id',requireStaff,wrap(async(req,res)=>{const db=admin(),id=z.string().uuid().parse(req.params.id);let q=db.from('crm_candidates').select('id').eq('id',id);if(req.staff.role!=='admin')q=q.eq('assigned_to',req.staff.user_id);if(!checked(await q.maybeSingle()))return res.status(404).json({error:'Lead not available.'});res.json({data:checked(await db.from('mt_lead_qualification').select('*').eq('lead_id',id).maybeSingle())});}));
 app.post('/api/workspace/qualification/:id',requireStaff,writeLimit,wrap(async(req,res)=>{const db=admin(),id=z.string().uuid().parse(req.params.id),v=qualification.parse(req.body);if(!checked(await db.from('crm_candidates').select('id').eq('id',id).eq('assigned_to',req.staff.user_id).maybeSingle()))return res.status(404).json({error:'Lead not assigned to you.'});if(v.english_test!=='IELTS'&&v.english_score!==null)return res.status(400).json({error:'IELTS score is only available for IELTS.'});checked(await db.from('mt_lead_qualification').upsert({lead_id:id,...v,updated_at:new Date().toISOString()}));res.json({ok:true});}));
 app.post('/api/workspace/appointments/:id',requireStaff,writeLimit,wrap(async(req,res)=>{
 const v=z.object({status:z.enum(['completed','no_show','cancelled']),reason:z.string().trim().max(2000),version:z.string()}).strict().parse(req.body),id=z.string().uuid().parse(req.params.id),db=admin();
 const current=checked(await db.from('crm_appointments').select('id,status,updated_at,cancelled_at').eq('id',id).eq('advisor_id',req.staff.user_id).maybeSingle());
 if(!current)return res.status(404).json({error:'Appointment not assigned to you.'});
 if(current.status==='cancelled'&&v.status!=='cancelled')return res.status(409).json({error:'Cancelled appointments cannot be reactivated here.'});
 if(v.status==='cancelled'&&!v.reason)return res.status(400).json({error:'Enter a cancellation reason.'});
 const now=new Date().toISOString();const r=await db.from('crm_appointments').update({status:v.status,cancellation_reason:v.status==='cancelled'?v.reason:null,cancelled_at:v.status==='cancelled'?(current.cancelled_at||now):null,reviewed_at:now,reviewed_by:req.staff.user_id}).eq('id',id).eq('advisor_id',req.staff.user_id).eq('updated_at',v.version).select('id').maybeSingle();
 if(r.error||!r.data)return res.status(409).json({error:'Appointment changed or update rejected. Refresh before retrying.'});res.json({ok:true});
 }));
 async function publicCard(slug){const db=admin(),c=checked(await db.from('mt_public_cards').select('owner_id,slug,display_name,job_title,bio,languages,published').eq('slug',slug).eq('published',true).maybeSingle());if(!c)return null;const s=checked(await db.from('crm_staff').select('active').eq('user_id',c.owner_id).maybeSingle());return s?.active?c:null;}
 app.get('/api/counsellor/:slug',publicLimit,wrap(async(req,res)=>{const slug=z.string().uuid().parse(req.params.slug),c=await publicCard(slug);if(!c)return res.status(404).json({error:'This card is not available.'});const {owner_id,published,...safe}=c;res.json({data:safe});}));
 app.get('/api/counsellor/:slug/photo',publicLimit,wrap(async(req,res)=>{const c=await publicCard(z.string().uuid().parse(req.params.slug));if(!c)return res.sendStatus(404);const db=admin(),rows=checked(await db.from('mt_employee_assets').select('object_path,mime').eq('owner_id',c.owner_id).eq('category','avatar').eq('state','uploaded').order('created_at',{ascending:false}).limit(1));if(!rows.length)return res.sendStatus(404);const f=await db.storage.from(bucket).download(rows[0].object_path);if(f.error)return res.sendStatus(404);res.set('Content-Type',rows[0].mime);res.set('X-Content-Type-Options','nosniff');res.send(Buffer.from(await f.data.arrayBuffer()));}));
 app.get('/api/counsellor/:slug/slots',publicLimit,wrap(async(req,res)=>{const db=admin(),slug=z.string().uuid().parse(req.params.slug),day=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(req.query.day);const r=await db.rpc('mt_card_slots',{p_slug:slug,p_day:day});if(r.error)return res.status(400).json({error:'Choose an available date within the next 60 days.'});res.json(r.data);}));
 app.post('/api/counsellor/:slug/book',publicLimit,bookingLimit,wrap(async(req,res)=>{
 const slug=z.string().uuid().parse(req.params.slug),v=booking.parse(req.body),db=admin();
 const r=await db.rpc('mt_card_book',{p_slug:slug,p_start:v.starts_at,p_request:v.request_id,p_payload:v});
 if(r.error)return res.status(r.error.code==='23P01'?409:400).json({error:'This booking could not be completed. Refresh availability and choose another time.'});
 let email_confirmation='not_configured';if(process.env.RESEND_API_KEY&&process.env.BOOKING_FROM_EMAIL){try{const result=await fetch('https://api.resend.com/emails',{method:'POST',signal:AbortSignal.timeout(7000),headers:{Authorization:'Bearer '+process.env.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':'card-booking-'+r.data.id},body:JSON.stringify({from:process.env.BOOKING_FROM_EMAIL,to:v.email,subject:'Your MUK Talent appointment',text:`Your appointment is booked. Morocco: ${new Intl.DateTimeFormat('en-GB',{timeZone:'Africa/Casablanca',dateStyle:'full',timeStyle:'short'}).format(new Date(r.data.starts_at))}. UK: ${new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',dateStyle:'full',timeStyle:'short'}).format(new Date(r.data.starts_at))}. For changes contact agents@muktalent.com. Reference: ${r.data.id}.`})});email_confirmation=result.ok?'sent':'failed';}catch{email_confirmation='failed';}}
 res.status(201).json({data:r.data,email_confirmation});
 }));
}


