import { mountAdminExperience, renderAdminPipeline } from "./admin-experience.js";
import { mountProfessionalAdmin } from "./professional-workspace.js";
import { requirePasswordChange } from "./employee-security.js";
import { mountStaffAccounts } from "./staff-accounts.js";
import { mountEmployee, mountWorkspaceAdmin } from "./employee.js";
import { initGateway, showLoginMessage, startMatrix, stopMatrix, showReset, t } from "./gateway.js";
import { mountStudentPortal } from "./student-portal.js";
import { renderControlCentre } from "./counsellor.js";
import { UI_PATHS } from "../book/card-icons.js";
import { mountExportButtons } from "./exports.js";
import { createClient } from "@supabase/supabase-js";
import { mountAdminSoft } from "./admin-soft.js";
const $ = id => document.getElementById(id);
const state = {client:null,session:null,staff:null,config:null,section:"overview",page:1,total:0,epoch:0,listRequest:0,detailRequest:0,relatedRequest:0,busy:false,loading:false,detail:null,dirty:false,related:"notes",relatedPage:1,staffOptions:[]};
const titles={overview:"Resumen",passport:"Global Passport",candidates:"Leads y casos",enquiries:"Consultas",appointments:"Citas",staff:"Equipo",documents:"Documentos",intelligence:"Pipeline e informes"};
const statusText={new:"Nuevo",contacted:"Contactado",assessment_in_progress:"Evaluación en curso",documents_pending:"Documentos pendientes",ready_for_review:"Listo para revisión",on_hold:"En espera",closed:"Cerrado",in_progress:"En curso",awaiting_reply:"Esperando respuesta",resolved:"Resuelto",archived:"Archivado",confirmed:"Confirmada",completed:"Completada",cancelled:"Cancelada",no_show:"No se presentó",pending:"Pendiente",accepted:"Aceptado",rejected:"Rechazado",clean:"Limpio",infected:"Infectado",failed:"Fallido",open:"Abierta",revoked:"Revocada",admin:"Administrador",collaborator:"Colaborador",fr:"Francés",en:"Inglés"};
const descriptions={overview:"Una vista global de la actividad y los próximos pasos.",candidates:"Leads y expedientes. Acepta como caso los leads que MUK Talent vaya a gestionar.",enquiries:"Revisa las consultas recibidas y organiza su seguimiento.",appointments:"Consulta las citas existentes y registra su resultado. Horas mostradas en Africa/Casablanca.",blocks:"Gestiona indisponibilidades de los asesores. No cancela citas existentes.",staff:"Cuentas, identidad profesional, territorios y acceso de los miembros del equipo.",settings:"Horario de apertura. Duración fija: 30 minutos y margen de 10 minutos.",documents:"Inventario de documentos existentes. No incluye descarga, subida ni análisis antivirus.","document-requests":"Consulta de solicitudes existentes. No genera enlaces privados."};
function el(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(cls)n.className=cls;return n;}
function message(id,text="",error=false){$(id).textContent=text;$(id).classList.toggle("error",error);}
function label(key){return state.config?.labels[key]||key;}
function valueText(key,value){
 if(value && typeof value === "object") return JSON.stringify(value,null,2);
 if(value===null||value===undefined||value==="")return "—";
 if(typeof value==="boolean")return value?"Sí":"No";
 if(["assigned_to","advisor_id","created_by"].includes(key))return state.staffOptions.find(s=>s.user_id===value)?.full_name||value;
 if(/(_at|expires_at)$/.test(key)){
   const d=new Date(value);if(!Number.isNaN(d.getTime()))return new Intl.DateTimeFormat("es-ES",{dateStyle:"medium",timeStyle:"short",timeZone:"Africa/Casablanca"}).format(d);
 }
 return statusText[value]||String(value).replaceAll("_"," ");
}
function resetLogin(text=""){
 document.getElementById("employeeWorkspace")?.remove();document.getElementById("studentPortal")?.remove();document.getElementById("gpControlOverlay")?.remove();
 state.epoch++;state.session=null;state.staff=null;state.config=null;state.staffOptions=[];state.detail=null;state.dirty=false;state.busy=false;state.loading=false;
 if($("recordDialog").open)$("recordDialog").close();
 $("tableBody").replaceChildren();$("metrics").replaceChildren();$("pipeline").replaceChildren();$("formFields").replaceChildren();$("relatedRows").replaceChildren();$("detailMetadata").replaceChildren();
 $("appShell").hidden=true;$("loginView").hidden=false;$("password").value="";showLoginMessage(text,text?"error":"");startMatrix();
}
async function api(url,options={}){
 const epoch=state.epoch;if(!state.session)throw new Error("Inicia sesión para continuar.");
 const {data,error}=await state.client.auth.getSession();
 if(epoch!==state.epoch)throw new Error("La sesión ha cambiado.");
 if(error||!data.session){resetLogin("La sesión ha terminado. Vuelve a entrar.");throw new Error("Sesión no disponible.");}
 state.session=data.session;
 const response=await fetch(url,{...options,cache:"no-store",headers:{Authorization:`Bearer ${state.session.access_token}`,...(options.body?{"Content-Type":"application/json"}:{})}});
 if(epoch!==state.epoch)throw new Error("La sesión ha cambiado.");
 let result;try{result=await response.json();}catch{throw new Error("Respuesta inesperada del servidor.");}
 if(response.status===401){resetLogin("La sesión ha caducado. Vuelve a entrar.");throw new Error("Sesión caducada.");}
 if(!response.ok)throw Object.assign(new Error(`${result.error||"No se pudo completar la operación."}${result.requestId&&response.status>=500?` · ID: ${result.requestId}`:""}`),{status:response.status,platform:result.platform,fields:result.fields});
 return result;
}
function resource(){return state.config.resources[state.section];}
const GROUPS=[["home","Inicio","home",["overview"]],["students","Estudiantes","users",["candidates","enquiries","passport"]],["agenda","Agenda","calendar",["appointments"]],["team","Equipo","card",["staff","documents"]],["reports","Informes","chart",["intelligence"]]];
const groupOf=name=>GROUPS.find(g=>g[3].includes(name))||GROUPS[0];
function navIcon(name){const s=document.createElementNS("http://www.w3.org/2000/svg","svg");s.setAttribute("viewBox","0 0 24 24");s.setAttribute("aria-hidden","true");s.setAttribute("class","nav-icon");s.setAttribute("fill","none");s.setAttribute("stroke","currentColor");s.setAttribute("stroke-width","1.7");s.setAttribute("stroke-linecap","round");s.setAttribute("stroke-linejoin","round");for(const d of UI_PATHS[name]||[]){const p=document.createElementNS("http://www.w3.org/2000/svg","path");p.setAttribute("d",d);s.append(p);}return s;}
function nav(){
 const nav=$("navigation");nav.replaceChildren();
 let dock=document.getElementById("adminDock");if(!dock){dock=el("nav",undefined,"admin-dock");dock.id="adminDock";dock.setAttribute("aria-label","Secciones");$("appShell").append(dock);}dock.replaceChildren();
 for(const [id,label,ic,sections]of GROUPS){
  const b=el("button",undefined,"nav-button");b.type="button";b.dataset.group=id;b.append(navIcon(ic),el("span",label));b.addEventListener("click",()=>navigate(sections[0]));nav.append(b);
  const d=el("button",undefined,"dock-button");d.type="button";d.dataset.group=id;d.append(navIcon(ic),el("small",label));d.addEventListener("click",()=>navigate(sections[0]));dock.append(d);
 }
 if(!document.getElementById("mobileLogout")){const o=el("button",undefined,"mobile-logout");o.id="mobileLogout";o.type="button";o.setAttribute("aria-label","Cerrar sesión");o.append(navIcon("logout"));o.addEventListener("click",()=>$("logout").click());document.querySelector("#appShell .page-header").append(o);}
 if(!document.getElementById("adminTabs")){const t=el("div",undefined,"admin-tabs");t.id="adminTabs";t.setAttribute("role","tablist");$("globalMessage").before(t);}
}
function markNav(name){
 const g=groupOf(name);
 for(const b of document.querySelectorAll("#navigation .nav-button,#adminDock .dock-button")){const on=b.dataset.group===g[0];b.classList.toggle("active",on);if(on)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current");}
 const t=$("adminTabs");t.replaceChildren();t.hidden=g[3].length<2;
 for(const sec of g[3]){const b=el("button",titles[sec],"admin-tab");b.type="button";b.setAttribute("role","tab");b.setAttribute("aria-selected",String(sec===name));b.addEventListener("click",()=>navigate(sec));t.append(b);}
 const ex=document.getElementById("crmExportControls");if(ex)ex.hidden=!["candidates","enquiries","appointments","intelligence"].includes(name);
}
async function navigate(name,overdue=false){
 if(!state.session||!state.config)return;
 document.getElementById("adminPipelineView")?.remove();document.getElementById("adminPassportView")?.remove();
 if(name==="passport"){
  state.section=name;state.page=1;state.listRequest++;state.loading=false;
  $("overview").hidden=true;$("listView").hidden=true;$("createRecord").hidden=true;
  $("pageTitle").textContent="Global Passport";$("pageDescription").textContent="Centro de control de estudiantes: expedientes, documentos, tareas y mensajes.";message("globalMessage");
  markNav(name);
  const host=document.createElement("section");host.id="adminPassportView";host.lang="en";$("globalMessage").after(host);
  return renderControlCentre({host,api,admin:true,notice:(t,err)=>message("globalMessage",t,Boolean(err))});
 }
 if(name==="intelligence"){
  state.section=name;state.page=1;state.listRequest++;state.loading=false;
  $("overview").hidden=true;$("listView").hidden=true;$("createRecord").hidden=true;
  $("pageTitle").textContent="Pipeline e informes";$("pageDescription").textContent="Casos aceptados, hoja interna e informes de pipeline para universidades y partners.";message("globalMessage");
  markNav(name);
  const host=document.createElement("section");host.id="adminPipelineView";$("globalMessage").after(host);
  return renderAdminPipeline({api,getState:()=>state,openRecord,host});
 }
 state.section=name;state.page=1;state.listRequest++;state.loading=false;message("globalMessage");
 $("pageTitle").textContent=titles[name];$("pageDescription").textContent=descriptions[name]||"";
 markNav(name);
 $("overview").hidden=name!=="overview";$("listView").hidden=name==="overview";
 $("createRecord").hidden=name==="overview"||!resource()?.create;
 if(name==="overview")return loadOverview();
 const r=resource();$("search").value="";$("search").disabled=!r.search.length;
 $("archiveFilter").value="false";$("overdueFilter").checked=overdue;
 $("archiveField").hidden=name!=="candidates";$("overdueField").hidden=name!=="candidates";
 $("statusField").hidden=!r.columns.status?.options;$("statusFilter").replaceChildren(new Option("Todos los estados",""));
 for(const v of r.columns.status?.options||[])$("statusFilter").append(new Option(valueText("status",v),v));
 $("createRecord").textContent=name==="staff"?"Vincular colaborador":"Añadir registro";
 await loadList();
}
async function loadOverview(){
 const epoch=state.epoch,request=++state.listRequest;
 message("globalMessage","Cargando resumen…");$("metrics").replaceChildren();$("pipeline").replaceChildren();
 try{
  const {data}=await api("/api/overview");if(epoch!==state.epoch||request!==state.listRequest)return;
  for(const[key,title]of [["candidates","Candidatos activos"],["enquiries","Consultas abiertas"],["appointments","Próximas citas"],["overdue","Seguimientos vencidos"],["documents","Documentos pendientes"]]){
   const card=el("article",undefined,"metric");card.append(el("p",title,"muted"),el("strong",data[key]));$("metrics").append(card);
  }
  for(const [status,count]of Object.entries(data.statuses)){
   const row=el("div",undefined,"pipeline-row");const info=el("div");info.append(el("span",valueText("status",status)),el("strong",count));
   const meter=el("progress");meter.max=Math.max(data.candidates,1);meter.value=count;meter.setAttribute("aria-label",valueText("status",status));row.append(info,meter);$("pipeline").append(row);
  }
  $("asOf").textContent=`Actualizado: ${valueText("created_at",data.asOf)} · Africa/Casablanca`;message("globalMessage");
 }catch(e){if(epoch===state.epoch&&request===state.listRequest)message("globalMessage",e.message,true);}
}
async function loadList(){
 const name=state.section,r=resource();if(!r)return;
 const request=++state.listRequest,epoch=state.epoch;state.loading=true;
 $("previous").disabled=true;$("next").disabled=true;$("refresh").disabled=true;$("tableBody").replaceChildren();message("listMessage","Cargando registros…");
 try{
  const params=new URLSearchParams({page:String(state.page),page_size:"25"});
  if($("search").value.trim())params.set("q",$("search").value.trim());
  if(r.columns.status?.options&&$("statusFilter").value)params.set("status",$("statusFilter").value);
  if(name==="candidates"){params.set("archived",$("archiveFilter").value);if($("overdueFilter").checked)params.set("overdue","true");}
  const result=await api(`/api/${name}?${params}`);if(request!==state.listRequest||epoch!==state.epoch)return;
  state.total=result.total||0;const head=el("tr");for(const f of r.summary){const th=el("th",label(f));th.scope="col";head.append(th);}head.append(el("th","Acción"));$("tableHead").replaceChildren(head);$("tableCaption").textContent=r.title;
  for(const record of result.data||[]){
   const tr=el("tr");for(const f of r.summary){const td=el("td");const text=valueText(f,record[f]);td.append(el("span",text,f==="status"?"badge":"cell-text"));tr.append(td);}
   const td=el("td"),button=el("button","Abrir","table-action");button.type="button";button.setAttribute("aria-label",`Abrir ${record.reference||record.full_name||r.title}`);button.addEventListener("click",()=>openRecord(name,record[r.key]));td.append(button);tr.append(td);$("tableBody").append(tr);
  }
  message("listMessage",state.total?`${state.total} registro${state.total===1?"":"s"}.`:"No hay registros para estos filtros.");
  $("pageInfo").textContent=`Página ${state.page} de ${Math.max(1,Math.ceil(state.total/25))}`;
  $("previous").disabled=state.page<=1;$("next").disabled=state.page*25>=state.total;
 }catch(e){if(request===state.listRequest&&epoch===state.epoch){message("listMessage",e.message,true);$("pageInfo").textContent="";}}
 finally{if(request===state.listRequest&&epoch===state.epoch){state.loading=false;$("refresh").disabled=false;}}
}
function closeDialog(){
 if(state.busy)return;
 if(state.dirty&&!window.confirm("Hay cambios sin guardar. ¿Quieres descartarlos?"))return;
 state.detailRequest++;state.relatedRequest++;state.detail=null;state.dirty=false;$("recordDialog").close();
}
function inputFor(name,key,rule,record,create){
 let field;
 if(["assigned_to","advisor_id"].includes(key)){
   field=el("select");field.append(new Option("Sin asignar",""));
   for(const staff of state.staffOptions.filter(s=>s.active||s.user_id===record[key]))field.append(new Option(`${staff.full_name}${staff.active?"":" (inactivo)"}`,staff.user_id));
 }else if(rule.options){field=el("select");if(rule.nullable)field.append(new Option("No especificado",""));for(const v of rule.options)field.append(new Option(valueText(key,v),v));}
 else if(rule.type==="boolean"){field=el("input");field.type="checkbox";field.checked=record[key]??(key==="active");}
 else if(["body","message","funding_plan","next_action","result_text"].includes(key)){field=el("textarea");field.rows=key==="body"||key==="message"?5:3;}
 else{
   field=el("input");field.type=rule.format==="email"?"email":rule.type==="timestamp with time zone"?"datetime-local":rule.type==="date"?"date":rule.type==="time without time zone"?"time":["numeric","integer","bigint"].includes(rule.type)?"number":key.endsWith("_e164")?"tel":"text";
   if(field.type==="number"){field.min="0";field.step=rule.type==="numeric"?"0.01":"1";}
 }
 field.id=`edit-${key}`;field.name=key;
 if(rule.type!=="boolean"){
  let value=record[key];
  if(value&&rule.type==="timestamp with time zone"){
   const date=new Date(value);value=new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16);
  }
  if(value!=null)field.value=String(value);else if(field.tagName!=="SELECT")field.value="";
 }
 field.required=!rule.nullable&&(rule.required||!create)&&rule.type!=="boolean";
 if(field.tagName==="INPUT"&&["text","email","tel"].includes(field.type)||field.tagName==="TEXTAREA")field.maxLength=rule.maxLength;
 if(name==="staff"&&!create&&key==="active"&&record.role==="admin")field.disabled=true;
 field.addEventListener("input",()=>{state.dirty=true;});
 const wrap=el("div",undefined,rule.type==="boolean"?"boolean-field":"field");const title=el("label",`${rule.label}${field.required?" *":""}`);title.htmlFor=field.id;wrap.append(title,field);
 if(rule.type==="timestamp with time zone")wrap.append(el("small",`Introduce la hora en tu zona del navegador: ${Intl.DateTimeFormat().resolvedOptions().timeZone}. Se guardará con zona horaria.`));
 if(rule.format==="uuid"&&!["assigned_to","advisor_id"].includes(key))wrap.append(el("small","Identificador UUID del registro existente; no es un correo electrónico."));
 return wrap;
}
async function openRecord(name,id=null,candidateId=null){
 if(state.busy)return;
 if(state.dirty&&!window.confirm("¿Descartar los cambios sin guardar?"))return;
 const request=++state.detailRequest,epoch=state.epoch;state.relatedRequest++;state.dirty=false;state.detail=null;
 $("formFields").replaceChildren();$("detailMetadata").replaceChildren();$("candidateRelated").hidden=true;$("recordForm").hidden=true;$("archiveRecord").hidden=true;$("detailNotice").textContent="";
 $("backCandidate").hidden=true;$("detailTitle").textContent="Cargando…";message("detailMessage");if(!$("recordDialog").open)$("recordDialog").showModal();
 try{
   const r=state.config.resources[name];let record={};if(id!==null)record=(await api(`/api/${name}/${encodeURIComponent(id)}`)).data;
   if(request!==state.detailRequest||epoch!==state.epoch)return;
   state.detail={name,id,record,candidateId};$("backCandidate").hidden=!candidateId;
   $("detailEyebrow").textContent=r.title;$("detailTitle").textContent=record.reference||record.full_name||record.title||record.original_filename||(id===null?"Nuevo registro":r.title);
   $("detailNotice").textContent=r.readonly?"Vista de consulta. Esta entrega no sube, descarga ni revisa archivos ni genera enlaces privados.":name==="staff"?"Vincula colaboradores mediante el UUID de un usuario ya creado en Authentication. No crea cuentas, contraseñas ni administradores. No permite desactivar administradores.":name==="appointments"?"Gestión de citas existentes. Aquí no se crean, reactivan ni reprograman reservas.":name==="blocks"?"Un bloqueo registra una indisponibilidad. No cancela ni modifica citas existentes.":name==="settings"?"Se mantienen Africa/Casablanca, citas de 30 minutos y margen de 10 minutos. Cambiar este horario no modifica citas existentes.":name==="notes"?"Notas compartidas: se añaden como historial, sin edición ni borrado.":"";
   if(id!==null){for(const key of r.select.split(",").filter(k=>!r.fields.includes(k))){if(record[key]===undefined)continue;const item=el("div");item.append(el("small",label(key)),el("p",valueText(key,record[key])));$("detailMetadata").append(item);}}
   const editable=!r.readonly&&!(id!==null&&r.immutable);
   $("recordForm").hidden=!editable;
   if(editable){
     const fields=[...r.fields];if(name==="staff"&&id===null)fields.unshift("user_id");
     for(const key of fields)$("formFields").append(inputFor(name,key,r.columns[key],record,id===null));
     $("saveRecord").textContent=id===null?"Crear registro":"Guardar cambios";$("saveRecord").disabled=false;
   }else if(r.immutable){for(const key of r.fields){const item=el("div");item.append(el("small",label(key)),el("p",valueText(key,record[key])));$("detailMetadata").append(item);}}
   $("archiveRecord").hidden=name!=="candidates"||id===null;$("archiveRecord").textContent=record.archived_at?"Restaurar candidato":"Archivar candidato";
   if(name==="candidates"&&id!==null){$("candidateRelated").hidden=false;state.related="notes";state.relatedPage=1;renderRelatedTabs();await loadRelated();}
 }catch(e){if(request===state.detailRequest&&epoch===state.epoch){$("detailTitle").textContent="No se pudo abrir el registro";message("detailMessage",e.message,true);}}
}
function renderRelatedTabs(){
 $("relatedTabs").replaceChildren();for(const name of ["notes","admin-notes","education","documents"]){const r=state.config.resources[name];const b=el("button",r.title,"tab");b.type="button";b.classList.toggle("active",state.related===name);b.addEventListener("click",()=>{state.related=name;state.relatedPage=1;renderRelatedTabs();loadRelated();});$("relatedTabs").append(b);}
}
async function loadRelated(){
 const context=state.detail;if(context?.name!=="candidates")return;
 const name=state.related,r=state.config.resources[name],request=++state.relatedRequest,epoch=state.epoch;
 $("relatedRows").replaceChildren();message("relatedMessage","Cargando…");$("addRelated").hidden=!r.create;$("relatedPrevious").disabled=true;$("relatedNext").disabled=true;
 $("relatedDescription").textContent=name==="admin-notes"?"Solo administradores. No se mezclan con las notas compartidas.":r.readonly?"Consulta de registros existentes; sin acciones sobre archivos ni enlaces.":"Registros vinculados a este candidato.";
 try{
   const result=await api(`/api/${name}?candidate_id=${encodeURIComponent(context.id)}&page=${state.relatedPage}&page_size=10`);
   if(request!==state.relatedRequest||epoch!==state.epoch||state.detail!==context)return;
   for(const record of result.data||[]){const card=el("article",undefined,"related-card");for(const f of r.summary){const line=el("p");line.append(el("small",`${label(f)}: `),el("span",valueText(f,record[f])));card.append(line);}const b=el("button",r.readonly||r.immutable?"Ver registro":"Ver / editar","ghost");b.type="button";b.addEventListener("click",()=>openRecord(name,record[r.key],context.id));card.append(b);$("relatedRows").append(card);}
   message("relatedMessage",result.total?`${result.total} registro(s).`:"Todavía no hay registros en este apartado.");$("relatedPage").textContent=`Página ${state.relatedPage}`;$("relatedPrevious").disabled=state.relatedPage<=1;$("relatedNext").disabled=state.relatedPage*10>=result.total;
 }catch(e){if(request===state.relatedRequest&&epoch===state.epoch)message("relatedMessage",e.message,true);}
}
$("recordForm").addEventListener("submit",async event=>{
 event.preventDefault();if(state.busy||!state.detail)return;
 const context=state.detail,{name,id,record,candidateId}=context,r=state.config.resources[name],values={};
 try{
  for(const field of $("formFields").querySelectorAll("input,select,textarea")){
   if(field.disabled)continue;const rule=r.columns[field.name];let v=field.type==="checkbox"?field.checked:field.value.trim();
   if(v===""){if(id===null)continue;v=rule.nullable?null:"";}
   else if(rule.type==="timestamp with time zone")v=new Date(v).toISOString();
   else if(["numeric","integer","bigint"].includes(rule.type))v=Number(v);
   values[field.name]=v;
  }
  state.busy=true;$("saveRecord").disabled=true;message("detailMessage","Guardando…");const epoch=state.epoch;
  const result=await api(`/api/${name}${id===null?"":`/${encodeURIComponent(id)}`}`,{method:id===null?"POST":"PATCH",body:JSON.stringify({values,version:record.updated_at,candidate_id:candidateId})});
  if(epoch!==state.epoch||state.detail!==context)return;
  state.dirty=false;state.busy=false;
  if(name==="staff")await loadStaffOptions();
  if(candidateId){await openRecord("candidates",candidateId);}else await openRecord(name,result.data[r.key]);
  if(state.session)message("detailMessage","Guardado correctamente.");
 }catch(e){if(state.detail===context)message("detailMessage",e.message,true);}
 finally{state.busy=false;$("saveRecord").disabled=false;}
});
$("archiveRecord").addEventListener("click",async()=>{
 const context=state.detail;if(!context||state.busy)return;
 if(state.dirty){message("detailMessage","Guarda o descarta los cambios antes de archivar.",true);return;}
 const archived=!context.record.archived_at;if(!window.confirm(archived?"¿Archivar este candidato? Se conservará su expediente.":"¿Restaurar este candidato?"))return;
 const epoch=state.epoch;state.busy=true;$("archiveRecord").disabled=true;
 try{await api(`/api/candidates/${context.id}/archive`,{method:"POST",body:JSON.stringify({archived,version:context.record.updated_at})});if(epoch!==state.epoch)return;state.busy=false;closeDialog();await loadList();}
 catch(e){if(epoch===state.epoch)message("detailMessage",e.message,true);}
 finally{state.busy=false;$("archiveRecord").disabled=false;}
});
async function loadStaffOptions(){
 const all=[];for(let page=1;page<=100;page++){const r=await api(`/api/staff?page=${page}&page_size=100`);all.push(...r.data);if(all.length>=r.total)break;}state.staffOptions=all;
}
$("loginForm").addEventListener("submit", async event => {
  event.preventDefault();
  if (!state.client || $("loginSubmit").disabled) return;
  $("loginSubmit").disabled = true;
  showLoginMessage(t("signingIn"));
  try {
    const { data, error } = await state.client.auth.signInWithPassword({
      email: $("email").value.trim(),
      password: $("password").value
    });
    $("password").value = "";
    if (error) throw new Error(/confirm/i.test(error.message || "") ? t("notConfirmed") : t("badCreds"));
    if (!data.session) throw new Error(t("badCreds"));
    await enter(data.session);
  } catch (error) {
    resetLogin(error.message);
    await state.client.auth.signOut({ scope: "local" }).catch(() => {});
  } finally {
    $("loginSubmit").disabled = false;
  }
});
// One door for everyone: whoami decides between the team workspace and the student Global Passport.
async function enter(session){
  state.session = session;
  state.epoch++;
  const who = await api("/api/whoami");
  if (who.kind === "inactive") throw new Error("Esta cuenta del equipo no está activa.");
  if (who.kind === "student" || who.kind === "new") {
    $("loginView").hidden = true; $("appShell").hidden = true; stopMatrix();
    await mountStudentPortal({ api, client: state.client, who, onLogout: async () => {
      await state.client.auth.signOut({ scope: "local" }).catch(() => {});
      resetLogin(); startMatrix();
    } });
    return;
  }
  state.staff = (await api("/api/me")).staff;
  if(state.staff.must_change_password){
    await requirePasswordChange({api,mandatory:true});
    state.staff = (await api("/api/me")).staff;
  }
  if (!["admin", "collaborator"].includes(state.staff.role)) {
    throw new Error("Esta cuenta no tiene un rol de acceso válido.");
  }
  stopMatrix();
  if (state.staff.role === "collaborator") {
    $("loginView").hidden = true;
    $("appShell").hidden = true;
    await mountEmployee({
      staff: state.staff,
      api,
      onLogout: async () => {
        const { error } = await state.client.auth.signOut({ scope: "local" });
        if (error) throw error;
        resetLogin();
        startMatrix();
        showLoginMessage("Signed out.", "ok");
      }
    });
    return;
  }
  state.config = await api("/api/admin-config");
  await loadStaffOptions();
  nav();
  $("staffName").textContent = state.staff.full_name;
  $("loginView").hidden = true;
  $("appShell").hidden = false;
  await navigate("overview");
}
$("logout").addEventListener("click",async()=>{if(state.busy)return;if(state.dirty&&!window.confirm("¿Descartar los cambios y cerrar sesión?"))return;resetLogin();await state.client.auth.signOut({scope:"local"}).catch(()=>{});});
$("filters").addEventListener("submit",event=>{event.preventDefault();state.page=1;loadList();});
$("refresh").addEventListener("click",()=>loadList());
$("previous").addEventListener("click",()=>{if(!state.loading&&state.page>1){state.page--;loadList();}});
$("next").addEventListener("click",()=>{if(!state.loading&&state.page*25<state.total){state.page++;loadList();}});
$("createRecord").addEventListener("click",()=>openRecord(state.section));
$("closeDialog").addEventListener("click",closeDialog);
$("backCandidate").addEventListener("click",()=>{if(state.detail?.candidateId)openRecord("candidates",state.detail.candidateId);});
$("recordDialog").addEventListener("cancel",event=>{event.preventDefault();closeDialog();});
$("recordDialog").addEventListener("close",()=>{if(state.session&&state.staff?.role==="admin"&&state.config){if(state.section==="overview")loadOverview();else loadList();}});
$("addRelated").addEventListener("click",()=>{if(state.detail?.name==="candidates")openRecord(state.related,null,state.detail.id);});
$("relatedPrevious").addEventListener("click",()=>{if(state.relatedPage>1){state.relatedPage--;loadRelated();}});
$("relatedNext").addEventListener("click",()=>{state.relatedPage++;loadRelated();});
$("openOverdue").addEventListener("click",()=>navigate("candidates",true));
window.addEventListener("beforeunload",event=>{if(state.dirty||state.busy){event.preventDefault();event.returnValue="";}});
async function initialise(){
 initGateway({getClient:()=>state.client,onSignedIn:async session=>{try{await enter(session);}catch(e){resetLogin(e.message);}}});
 try{
  const response=await fetch("/api/public-config",{cache:"no-store"});if(!response.ok)throw new Error("Configuration unavailable.");const cfg=await response.json();if(!cfg.supabaseUrl||!cfg.supabasePublicKey)throw new Error("Incomplete configuration.");
  const fromLink=/(access_token|error_description|type=recovery|type=signup)/.test(location.hash)||/[?&]code=/.test(location.search);
  const linkError=/error_description=([^&]+)/.exec(location.hash);
  state.client=createClient(cfg.supabaseUrl,cfg.supabasePublicKey,{auth:{persistSession:false,autoRefreshToken:true,detectSessionInUrl:fromLink}});
  let recovery=/type=recovery/.test(location.hash);
  state.client.auth.onAuthStateChange((event,session)=>{state.session=session;if(event==="PASSWORD_RECOVERY"){recovery=true;showReset();}if(event==="SIGNED_OUT"&&(state.staff||document.getElementById("studentPortal")))resetLogin("Session ended.");});
  showLoginMessage();$("loginSubmit").disabled=false;$("signupSubmit").disabled=false;
  if(linkError){showLoginMessage(t("linkError"),"error");history.replaceState(null,"",location.pathname);}
  else if(fromLink){const {data}=await state.client.auth.getSession();history.replaceState(null,"",location.pathname);
   if(data.session&&recovery)showReset();
   else if(data.session){showLoginMessage(t("confirmed"),"ok");try{await enter(data.session);}catch(e){resetLogin(e.message);}}}
 }catch(e){showLoginMessage(`Unable to connect. ${e.message}`,"error");}
}
mountStaffAccounts({
  api,
  onCreated: async () => {
    if (state.staff?.role !== "admin") return;
    await loadStaffOptions();
    if (state.section === "staff") await loadList();
  }
});
mountWorkspaceAdmin({ api, getStaff: () => state.staff });
mountProfessionalAdmin({ api, getStaff: () => state.staff });
initialise();

mountExportButtons(async()=>{
 if(!state.staff||state.staff.role!=="admin"||!state.client)return null;
 const {data,error}=await state.client.auth.getSession();if(error)return null;return data.session;
});

mountAdminExperience({api,getState:()=>state,openRecord});
mountAdminSoft({api,getState:()=>state,navigate});


