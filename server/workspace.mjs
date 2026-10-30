import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
const str = (n=2000) => z.string().trim().max(n).default("");
const url = z.union([z.literal(""),z.string().url().max(2000).refine(v=>v.startsWith("https://"))]).default("");
const specs = {
 partner: z.object({type:z.enum(["Language school","Lycee","Private teacher","University","Other"]),contact:str(200),email:str(320),phone:str(100),city:str(200),website:url,next_action:str(),notes:str(8000)}).strict(),
 task: z.object({priority:z.enum(["Low","Medium","High"]),notes:str(8000)}).strict(),
 content: z.object({asset_id:z.string().uuid().nullable().optional(),platform:z.enum(["Instagram","TikTok","LinkedIn","Facebook","YouTube","Other"]),format:z.enum(["Video","Image","Carousel","Story","Article","Other"]),asset_url:url,caption:str(8000),publication_url:url,notes:str(4000)}).strict(),
 report: z.object({work_done:str(8000),achievements:str(4000),difficulties:str(4000),support_needed:str(4000),tomorrow:str(4000)}).strict(),
 profile: z.object({job_title:str(200),phone:str(100),city:str(200),languages:str(200),bio:str(4000)}).strict()
};
const statuses={partner:["Identified","Contacted","Meeting planned","Negotiating","Active","Not interested"],task:["To do","In progress","Done"],content:["Idea","In progress","Pending review","Published"],report:["Draft","Submitted"],profile:["Active"]};
const entry=z.object({kind:z.enum(["partner","task","content","report","profile"]),title:z.string().trim().min(1).max(200),status:z.string(),record_date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),payload:z.record(z.string(),z.unknown()),version:z.string().optional()}).strict();
const lead=z.object({first_name:z.string().trim().min(1).max(150),last_name:z.string().trim().min(1).max(150),email:z.union([z.literal(""),z.string().email().max(320)]),whatsapp_phone_e164:z.union([z.literal(""),z.string().regex(/^\+[1-9][0-9]{6,14}$/)]),residence_city:str(200),status:z.enum(["new","contacted","assessment_in_progress","documents_pending","ready_for_review","on_hold","closed"]),target_study_level:z.enum(["","foundation","undergraduate","postgraduate","phd","english_course","other"]),subject_interest:str(500),funding_plan:str(2000),next_action:str(2000),next_action_at:z.union([z.literal(""),z.string().datetime()]),source:str(200),version:z.string().optional()}).strict();
function dbFail(result) { if(result.error) { const e=new Error(result.error.code==='23505'?"Duplicate record: a profile or daily report already exists. Edit the existing record.":"Database operation failed."); e.status=result.error.code==='23505'?409:503; throw e; } return result; }
export function mountWorkspace(app,{requireStaff}) {
 const wrap=fn=>async(req,res)=>{try {await fn(req,res);}catch(e){res.status(e instanceof z.ZodError?400:e.status||500).json({error:e instanceof z.ZodError?"Please check the form fields.":e.status?e.message:"Workspace operation failed.",requestId:req.requestId});}};
 const base='/api/workspace';
 app.get(base,requireStaff,wrap(async(req,res)=>{
   let owner=req.staff.user_id;
   if(req.query.owner){if(req.staff.role!=='admin')return res.status(403).json({error:'Administrator access required.'});owner=z.string().uuid().parse(req.query.owner);}
   const records=dbFail(await req.db.from('mt_workspace_records').select('*').eq('owner_id',owner).order('created_at',{ascending:false}).limit(500));
   const activity=dbFail(await req.db.from('mt_workspace_activity').select('*').eq('owner_id',owner).order('created_at',{ascending:false}).limit(100));
   const candidates=dbFail(await req.db.from('crm_candidates').select('id,reference,first_name,last_name,email,whatsapp_phone_e164,residence_city,status,target_study_level,subject_interest,funding_plan,next_action,next_action_at,source,updated_at').eq('assigned_to',owner).is('archived_at',null).order('created_at',{ascending:false}).limit(100));
   const appointments=dbFail(await req.db.from('crm_appointments').select('id,full_name,email,whatsapp_phone_e164,starts_at,ends_at,status,subject,meeting_mode,institution,updated_at').eq('advisor_id',owner).order('starts_at',{ascending:false}).limit(200));
   const summary=dbFail(await req.db.from('crm_staff').select('user_id,full_name').eq('user_id',owner).maybeSingle());
   res.json({records:records.data,activity:activity.data,leads:candidates.data,appointments:appointments.data,person:summary.data,limits:{records:500,leads:100,appointments:200,activity:100}});
 }));
 app.post(base+'/records',requireStaff,wrap(async(req,res)=>{
   const v=entry.parse(req.body);if(!statuses[v.kind].includes(v.status))return res.status(400).json({error:'Invalid status.'});
   if(v.kind==='report'&&!v.record_date)return res.status(400).json({error:'A report date is required.'});
   const payload=specs[v.kind].parse(v.payload);
   const r=dbFail(await req.db.from('mt_workspace_records').insert({owner_id:req.staff.user_id,kind:v.kind,title:v.title,status:v.status,record_date:v.record_date,payload}).select().single());res.status(201).json({data:r.data});
 }));
 app.patch(base+'/records/:id',requireStaff,wrap(async(req,res)=>{
   const id=z.string().uuid().parse(req.params.id),v=entry.parse(req.body);
   if(!v.version)return res.status(400).json({error:'Record version is required.'});
   if(!statuses[v.kind].includes(v.status))return res.status(400).json({error:'Invalid status.'});
   if(v.kind==='report'&&!v.record_date)return res.status(400).json({error:'A report date is required.'});
   const payload=specs[v.kind].parse(v.payload);
   const r=dbFail(await req.db.from('mt_workspace_records').update({title:v.title,status:v.status,record_date:v.record_date,payload}).eq('id',id).eq('owner_id',req.staff.user_id).eq('kind',v.kind).eq('updated_at',v.version).select().maybeSingle());
   if(!r.data)return res.status(409).json({error:'Record changed or unavailable. Refresh and reopen it.'});res.json({data:r.data});
 }));
 app.delete(base+'/records/:id',requireStaff,wrap(async(req,res)=>{
   const id=z.string().uuid().parse(req.params.id),version=z.string().parse(req.body?.version);
   const r=dbFail(await req.db.from('mt_workspace_records').delete().eq('id',id).eq('owner_id',req.staff.user_id).eq('updated_at',version).select('id').maybeSingle());
   if(!r.data)return res.status(409).json({error:'Record changed or unavailable.'});res.json({ok:true});
 }));
 async function saveLead(req,res,editing){
   const v=lead.parse(req.body),version=v.version;delete v.version;
   for(const key of ['email','whatsapp_phone_e164','target_study_level','next_action_at'])if(v[key]==='')v[key]=null;
   const key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!key)return res.status(503).json({error:'Lead editing is not configured on the server.'});
   const db=createClient(process.env.SUPABASE_URL,key,{auth:{persistSession:false,autoRefreshToken:false}});
   let query;
   if(editing){
     const id=z.string().uuid().parse(req.params.id);
     if(!version)return res.status(400).json({error:'Lead version is required.'});
     query=db.from('crm_candidates').update(v).eq('id',id).eq('assigned_to',req.staff.user_id).is('archived_at',null).eq('updated_at',version);
   }else query=db.from('crm_candidates').insert({...v,assigned_to:req.staff.user_id,created_by:req.staff.user_id});
   const r=dbFail(await query.select('id,reference').maybeSingle());
   if(!r.data)return res.status(409).json({error:'Lead changed or not assigned to you. Refresh and reopen it.'});res.status(editing?200:201).json({data:r.data});
 }
 app.post(base+'/leads',requireStaff,wrap((req,res)=>saveLead(req,res,false)));
 app.patch(base+'/leads/:id',requireStaff,wrap((req,res)=>saveLead(req,res,true)));
}
