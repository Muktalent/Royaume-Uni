import { mountAdminPipeline } from "./admin-pipeline.mjs";
import { mountBusinessWallet } from "./business-wallet.mjs";
import { mountProfessionalWorkspace } from "./professional-workspace.mjs";
import { mountWorkspaceExtras } from "./workspace-extras.mjs";
import { mountEmployeeSecurity } from "./employee-security.mjs";
import { mountWorkspace } from "./workspace.mjs";
import { mountStaffAccounts } from "./staff-accounts.mjs";
import { mountPersonal } from "./personal-public.mjs";
import { mountExports } from "./exports.mjs";
import { mountEvaluation } from "./evaluation-public.mjs";
import { mountCardLinks } from "./card-links.mjs";
import "dotenv/config";
import express from "express";
import helmet from "helmet";
import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { InputError, validId, validateValues, validateRelations } from "./validation.mjs";

const config = JSON.parse(readFileSync(new URL("./crm-config.json", import.meta.url), "utf8"));
const { resources } = config;
const port = Number(process.env.PORT || 3001);
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLIC_KEY;
if (!Number.isInteger(port) || port < 1 || port > 65535 || !supabaseUrl || !supabaseKey) throw new Error("Revisa PORT, SUPABASE_URL y SUPABASE_PUBLIC_KEY en .env.");
if(supabaseKey.startsWith("sb_secret_"))throw new Error("Usa una clave pública, nunca una clave secreta.");
if(supabaseKey.split(".").length===3){
 let payload;try{payload=JSON.parse(Buffer.from(supabaseKey.split(".")[1],"base64url").toString("utf8"));}catch{throw new Error("SUPABASE_PUBLIC_KEY no tiene un formato válido.");}
 if(payload.role!=="anon")throw new Error("La clave JWT pública debe ser anon, no service_role.");
}
const origin = new URL(supabaseUrl).origin;
if (!origin.startsWith("https://")) throw new Error("SUPABASE_URL debe usar HTTPS.");
const root = fileURLToPath(new URL("../", import.meta.url));
const app = express();
app.disable("x-powered-by");
app.use(helmet({contentSecurityPolicy:{directives:{connectSrc:["'self'",origin],imgSrc:["'self'","data:",origin]}}}));
app.use((req,res,next)=>{req.requestId=randomUUID();res.set("X-Request-Id",req.requestId);res.set("Cache-Control","no-store");res.set("Permissions-Policy","camera=(), microphone=(), geolocation=(), payment=()");next();});
app.use("/api",rateLimit({keyGenerator:(req)=>ipKeyGenerator((process.env.VERCEL?String(req.headers["x-vercel-forwarded-for"]||req.headers["x-forwarded-for"]||"").split(",")[0].trim():req.ip)||"127.0.0.1"),validate:{xForwardedForHeader:false},windowMs:60000,limit:240,standardHeaders:"draft-7",legacyHeaders:false,message:{error:"Demasiadas peticiones. Espera un minuto."}}));
app.use(express.json({limit:"64kb",strict:true}));
function fail(req,res,status,message){return res.status(status).json({error:message,requestId:req.requestId});}
function dbError(error,req) {
  console.error(JSON.stringify({requestId:req.requestId,code:error.code,message:error.message,hint:error.hint}));
  if(error.code==="42501") throw new InputError("La política de permisos de la base de datos ha rechazado la operación.",403);
  if(["23505","23P01"].includes(error.code)) throw new InputError("Conflicto: registro duplicado o cita solapada.",409);
  if(["23503","23514","23502","22P02"].includes(error.code)) throw new InputError("Los datos no cumplen las restricciones de la base de datos. Revisa el registro y el ID de error.",400);
  throw new InputError("No se pudo completar la consulta a la base de datos.",503);
}
async function requireStaff(req,res,next){
  const match=/^Bearer ([^\s]+)$/i.exec(req.get("authorization")||"");
  if(!match || match[1].length>16384) return fail(req,res,401,"Inicia sesión para continuar.");
  const token=match[1];
  const db=createClient(supabaseUrl,supabaseKey,{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  const {data,error}=await db.auth.getUser(token);
  if(error || !data?.user) return fail(req,res,401,"Sesión no válida o caducada.");
  const staffResult=await db.from("crm_staff").select("user_id,full_name,role,active").eq("user_id",data.user.id).maybeSingle();
  if(staffResult.error) dbError(staffResult.error,req);
  if(!staffResult.data?.active) return fail(req,res,403,"El acceso del empleado no está activo.");
  const security=await db.from("mt_employee_security").select("must_change_password").eq("user_id",data.user.id).maybeSingle();
  if(security.error) dbError(security.error,req);
  if(!security.data)return fail(req,res,403,"Security configuration missing. Contact your administrator.");
  const mustChange=security.data.must_change_password;
  const route=req.originalUrl.split("?")[0];
  if(mustChange && !["/api/me","/api/employee-security/password"].includes(route))
    return fail(req,res,403,"Change your initial password before accessing your workspace. Sign out and sign in again.");
  req.db=db;req.staff={...staffResult.data,must_change_password:mustChange};next();
}
function requireAdmin(req,res,next){if(req.staff.role!=="admin")return fail(req,res,403,"Este panel requiere una cuenta de administrador.");next();}
app.get("/api/health",(req,res)=>res.json({status:"ok"}));
app.get("/api/public-config",(req,res)=>res.json({supabaseUrl,supabasePublicKey:supabaseKey}));
app.get("/api/me",requireStaff,(req,res)=>res.json({staff:req.staff}));
// Short card links must resolve before the public card routes are matched.
mountCardLinks(app, { requireStaff });
mountProfessionalWorkspace(app, { requireStaff, requireAdmin });
mountAdminPipeline(app, { requireStaff, requireAdmin });
mountEvaluation(app);
mountPersonal(app);
app.get("/api/employee/overview", requireStaff, async (req, res) => {
  const userId = req.staff.user_id;
  const now = new Date().toISOString();
  const results = await Promise.all([
    req.db.from("crm_candidates").select("id", { count: "exact", head: true })
      .eq("assigned_to", userId).is("archived_at", null),
    req.db.from("crm_appointments").select("id", { count: "exact", head: true })
      .eq("advisor_id", userId).eq("status", "confirmed").gte("starts_at", now),
    req.db.from("crm_candidates").select("id", { count: "exact", head: true })
      .eq("assigned_to", userId).is("archived_at", null)
      .neq("status", "closed").lt("next_action_at", now),
    req.db.from("crm_candidates")
      .select("id,reference,first_name,last_name,status,next_action,next_action_at")
      .eq("assigned_to", userId).is("archived_at", null)
      .order("created_at", { ascending: false }).order("id", { ascending: false }).limit(25),
    req.db.from("crm_appointments")
      .select("id,full_name,starts_at,ends_at,status,subject,whatsapp_phone_e164")
      .eq("advisor_id", userId).eq("status", "confirmed").gte("starts_at", now)
      .order("starts_at", { ascending: true }).order("id", { ascending: true }).limit(25)
  ]);
  for (const result of results) {
    if (result.error) dbError(result.error, req);
  }
  res.json({
    metrics: {
      candidates: results[0].count ?? 0,
      appointments: results[1].count ?? 0,
      overdue: results[2].count ?? 0
    },
    candidates: results[3].data ?? [],
    appointments: results[4].data ?? []
  });
});

mountStaffAccounts(app, { requireStaff, requireAdmin });
mountWorkspace(app, { requireStaff });
mountEmployeeSecurity(app, { requireStaff });
mountWorkspaceExtras(app, { requireStaff });
mountBusinessWallet(app);
app.use("/api",requireStaff,requireAdmin);
mountExports(app);
app.get("/api/admin-config",(req,res)=>res.json(config));

async function count(req,table,apply=(q)=>q){
  let query=req.db.from(table).select("id",{head:true,count:"exact"});
  const {count,error}=await apply(query);if(error)dbError(error,req);return count||0;
}
app.get("/api/overview",async(req,res)=>{
  const statuses=resources.candidates.columns.status.options;
  const results=await Promise.all(statuses.map(status=>count(req,"crm_candidates",q=>q.is("archived_at",null).eq("status",status))));
  const now=new Date().toISOString();
  const [enquiries,appointments,overdue,documents]=await Promise.all([
    count(req,"crm_enquiries",q=>q.in("status",["new","in_progress","awaiting_reply"])),
    count(req,"crm_appointments",q=>q.eq("status","confirmed").gte("starts_at",now)),
    count(req,"crm_candidates",q=>q.is("archived_at",null).neq("status","closed").lt("next_action_at",now)),
    count(req,"crm_documents",q=>q.eq("review_status","pending"))
  ]);
  res.json({data:{candidates:results.reduce((a,b)=>a+b,0),enquiries,appointments,overdue,documents,statuses:Object.fromEntries(statuses.map((s,i)=>[s,results[i]])),asOf:now}});
});

for(const [name,r] of Object.entries(resources)){
 const url=`/api/${name}`;
 app.get(url,async(req,res)=>{
   const page=Number(req.query.page||1),pageSize=Number(req.query.page_size||25);
   if(!Number.isInteger(page)||page<1||page>10000||!Number.isInteger(pageSize)||pageSize<1||pageSize>100)throw new InputError("Paginación no válida.");
   let q=req.db.from(r.table).select(r.select,{count:"exact"});
   if(r.nested && (req.query.candidate_id || !r.readonly)){const id=validId("candidates",String(req.query.candidate_id||""));q=q.eq("candidate_id",id);}
   if(name==="candidates"){
     if(req.query.archived==="true")q=q.not("archived_at","is",null);else q=q.is("archived_at",null);
     if(req.query.overdue==="true")q=q.neq("status","closed").lt("next_action_at",new Date().toISOString());
   }
   if(req.query.status){if(!r.columns.status?.options?.includes(req.query.status))throw new InputError("Estado no válido.");q=q.eq("status",req.query.status);}
   if(req.query.q && r.search.length){
     const text=String(req.query.q).trim();
     if(text.length>100||!/^[-\p{L}\p{N}\s@.+_]+$/u.test(text))throw new InputError("Búsqueda: utiliza letras, números, espacios o @ . + - _ (máximo 100 caracteres).");
     const literal=text.replaceAll("_","\\_");
     q=q.or(r.search.map(field=>`${field}.ilike.%${literal}%`).join(","));
   }
   const order=name==="appointments"||name==="blocks"?"starts_at":name==="settings"?"id":"created_at";
   q=q.order(order,{ascending:name==="appointments"||name==="blocks"}).order(r.key,{ascending:false}).range((page-1)*pageSize,page*pageSize-1);
   const {data,error,count}=await q;if(error)dbError(error,req);
   res.json({data,total:count,page,page_size:pageSize});
 });
 app.get(`${url}/:id`,async(req,res)=>{
   const id=validId(name,req.params.id);
   const {data,error}=await req.db.from(r.table).select(r.select).eq(r.key,id).maybeSingle();
   if(error)dbError(error,req);if(!data)return fail(req,res,404,"Registro no encontrado.");res.json({data});
 });
 if(r.create)app.post(url,async(req,res)=>{
   const payload=req.body?.values;
   const values=validateValues(name,r,payload,true);
   if(r.nested){values.candidate_id=validId("candidates",String(req.body.candidate_id||""));}
   if(["candidates","notes","admin-notes"].includes(name))values.created_by=req.staff.user_id;
   if(name==="staff")values.role="collaborator";
   validateRelations(name,values);
   if(values.assigned_to || values.advisor_id){
     const s=await req.db.from("crm_staff").select("active").eq("user_id",values.assigned_to||values.advisor_id).maybeSingle();
     if(s.error)dbError(s.error,req);if(!s.data?.active)throw new InputError("Selecciona un empleado activo.");
   }
   const {data,error}=await req.db.from(r.table).insert(values).select(r.select).single();
   if(error)dbError(error,req);res.status(201).json({data});
 });
 if(!r.readonly&&!r.immutable)app.patch(`${url}/:id`,async(req,res)=>{
   const id=validId(name,req.params.id);
   const current=await req.db.from(r.table).select(r.select).eq(r.key,id).maybeSingle();
   if(current.error)dbError(current.error,req);if(!current.data)return fail(req,res,404,"Registro no encontrado.");
   const values=validateValues(name,r,req.body?.values,false);
   if(name==="staff"&&current.data.role==="admin"&&values.active===false)throw new InputError("La desactivación de administradores no se permite desde este panel.",403);
   const merged={...current.data,...values};validateRelations(name,merged);
   if(["assigned_to","advisor_id"].some(k=>values[k])){
     const staffId=values.assigned_to||values.advisor_id;
     const s=await req.db.from("crm_staff").select("active").eq("user_id",staffId).maybeSingle();
     if(s.error)dbError(s.error,req);if(!s.data?.active)throw new InputError("Selecciona un empleado activo.");
   }
   const now=new Date().toISOString();
   if(name==="appointments"){
     if(merged.status==="cancelled"){
       if(!merged.cancellation_reason?.trim())throw new InputError("Indica un motivo de cancelación.");
       values.cancelled_at=current.data.cancelled_at||now;
     }else{values.cancelled_at=null;values.cancellation_reason=null;}
     if(merged.status==="confirmed"&&current.data.status!=="confirmed")throw new InputError("La reactivación de citas requiere el flujo de reservas; no está disponible aquí.");
     values.reviewed_at=now;values.reviewed_by=req.staff.user_id;
   }
   if(name==="enquiries"&&!current.data.read_at){values.read_at=now;values.read_by=req.staff.user_id;}
   let q=req.db.from(r.table).update({...values,...(r.select.split(",").includes("updated_at")?{updated_at:now}:{})}).eq(r.key,id);
   if(current.data.updated_at){
     if(req.body.version!==current.data.updated_at)throw new InputError("El registro ha cambiado. Ciérralo y ábrelo de nuevo antes de guardar.",409);
     q=q.eq("updated_at",req.body.version);
   }
   const {data,error}=await q.select(r.select).maybeSingle();if(error)dbError(error,req);
   if(!data)throw new InputError("Otro usuario modificó el registro. Vuelve a abrirlo.",409);
   res.json({data});
 });
}
app.post("/api/candidates/:id/archive",async(req,res)=>{
 const id=validId("candidates",req.params.id);
 if(typeof req.body?.archived!=="boolean"||typeof req.body?.version!=="string")throw new InputError("Confirmación de archivo no válida.");
 const now=new Date().toISOString();
 const {data,error}=await req.db.from("crm_candidates").update({archived_at:req.body.archived?now:null,updated_at:now}).eq("id",id).eq("updated_at",req.body.version).select(resources.candidates.select).maybeSingle();
 if(error)dbError(error,req);if(!data)throw new InputError("El registro cambió o ya no está disponible. Vuelve a abrirlo.",409);res.json({data});
});
app.get(["/admin","/admin/"],(req,res)=>res.sendFile(path.join(root,"admin","index.html")));
app.use("/admin",express.static(path.join(root,"admin"),{dotfiles:"deny",redirect:false,index:false,etag:false,maxAge:0}));
app.use((req,res)=>fail(req,res,404,"Endpoint no encontrado."));
app.use((error,req,res,next)=>{
 if(res.headersSent)return next(error);
 if(error instanceof InputError)return fail(req,res,error.status,error.message);
 if(error.type==="entity.too.large")return fail(req,res,413,"La petición es demasiado grande.");
 if(error.type==="entity.parse.failed")return fail(req,res,400,"JSON no válido.");
 console.error(JSON.stringify({requestId:req.requestId,error:error.message}));
 fail(req,res,500,"Error inesperado. Consulta el ID de error en la terminal.");
});

export default app;


