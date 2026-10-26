import { createClient } from '@supabase/supabase-js';
import { createHash,createHmac } from 'node:crypto';
import { rateLimit,ipKeyGenerator } from 'express-rate-limit';
import { evaluationSchema,bookingSchema,tokenSchema,dateSchema } from './evaluation-validation.mjs';
const hash=v=>createHash('sha256').update(v).digest('hex');
export function mountEvaluation(app){
 let db;
 function database(){
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY,secret=process.env.EVALUATION_TOKEN_SECRET;
  if(!key||!secret||secret.length<32)throw Object.assign(new Error('Configuration indisponible.'),{status:503});
  db ||=createClient(process.env.SUPABASE_URL,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  return db;
 }
 const limited=rateLimit({windowMs:15*60*1000,limit:30,standardHeaders:'draft-7',legacyHeaders:false,
  keyGenerator:req=>ipKeyGenerator((process.env.VERCEL?String(req.headers['x-vercel-forwarded-for']||req.headers['x-forwarded-for']||'').split(',')[0].trim():req.ip)||'127.0.0.1'),
  validate:{xForwardedForHeader:false},message:{error:'Trop de demandes. Réessayez dans quelques minutes.'}});
 const validOrigin=(req,res,next)=>{
  const incoming=req.get('origin');
  const allowed=new Set(['https://muktalent.com','https://www.muktalent.com',...(process.env.EVALUATION_ALLOWED_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean)]);
  if(incoming&&!allowed.has(incoming))return res.status(403).json({error:'Origine non autorisée.'});
  next();
 };
 async function rpc(name,args){
  const {data,error}=await database().rpc(name,args);
  if(error){
   const status=error.code==='23P01'||error.code==='23505'?409:error.code==='P0002'?410:503;
   console.error(JSON.stringify({event:'evaluation_rpc',name,code:error.code}));
   throw Object.assign(new Error(status===409?'Ce créneau vient d’être réservé. Choisissez-en un autre.':status===410?'Votre lien a expiré. Contactez agents@muktalent.com.':'Service temporairement indisponible. Réessayez plus tard.'),{status});
  }
  return data;
 }
 const wrap=fn=>async(req,res)=>{try{await fn(req,res);}catch(e){
  if(e.name==='ZodError')return res.status(400).json({error:'Vérifiez les champs du formulaire.',fields:e.issues.map(i=>i.path.join('.'))});
  res.status(e.status||503).json({error:e.status?e.message:'Service temporairement indisponible.',requestId:req.requestId});
 }};
 app.post('/api/evaluation',validOrigin,limited,wrap(async(req,res)=>{
  const parsed=evaluationSchema.parse(req.body);database();
  const {submission_id,website,...payload}=parsed;
  const token=submission_id+'.'+createHmac('sha256',process.env.EVALUATION_TOKEN_SECRET).update('evaluation-v1:'+submission_id).digest('base64url');
  const data=await rpc('muk_eval_submit_v1',{p_submission_id:submission_id,p_payload:payload,p_token_hash:hash(token)});
  res.status(201).json({...data,token});
 }));
 app.post('/api/evaluation/slots',validOrigin,limited,wrap(async(req,res)=>{
  const token=tokenSchema.parse(req.body?.token),day=dateSchema.parse(req.body?.day);
  res.json(await rpc('muk_eval_slots_v1',{p_token_hash:hash(token),p_day:day}));
 }));
 app.post('/api/evaluation/book',validOrigin,limited,wrap(async(req,res)=>{
  const v=bookingSchema.parse(req.body);
  const data=await rpc('muk_eval_book_v1',{p_token_hash:hash(v.token),p_advisor_id:v.advisor_id,p_starts_at:v.starts_at});
  let email_confirmation='not_configured';
  if(process.env.RESEND_API_KEY&&process.env.BOOKING_FROM_EMAIL){
   const fmt=zone=>new Intl.DateTimeFormat('fr-FR',{timeZone:zone,dateStyle:'full',timeStyle:'short'}).format(new Date(data.starts_at));
   try{
    const sent=await fetch('https://api.resend.com/emails',{method:'POST',signal:AbortSignal.timeout(7000),
     headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':`evaluation-booking-${data.id}`},
     body:JSON.stringify({from:process.env.BOOKING_FROM_EMAIL,to:[data.email],reply_to:'agents@muktalent.com',
      subject:'Votre entretien avec Maghreb UK Talent',text:`Bonjour ${data.full_name},\n\nVotre entretien de 30 minutes est réservé.\nMaroc : ${fmt('Africa/Casablanca')}\nRoyaume-Uni : ${fmt('Europe/London')}\nRéférence : ${data.reference}\n\nPour modifier ou annuler, écrivez à agents@muktalent.com.\nMaghreb UK Talent`})});
    email_confirmation=sent.ok?'sent':'failed';
   }catch{email_confirmation='failed';}
  }
  const {email,full_name,...publicData}=data;
  res.status(201).json({data:publicData,email_confirmation});
 }));
}
