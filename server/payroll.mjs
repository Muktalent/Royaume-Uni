// payroll-v1 · Monthly salary view: fixed base (Mon–Fri) + commission per verified lead.
// "Verified lead" = a lead attributed to the employee that an administrator accepted as a case
// (crm_candidates.case_accepted_at). Employees cannot verify their own leads, so the total cannot be inflated.
import {createClient} from '@supabase/supabase-js';
import {z} from 'zod';

export const PAYROLL={currency:'MAD',base_monthly:3000,per_verified_lead:2000,zone:'Africa/Casablanca',workdays:'Monday–Friday'};
const monthText=z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);

export function dayKey(value,zone=PAYROLL.zone){const parts=new Intl.DateTimeFormat('en-GB',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(value)),get=k=>parts.find(p=>p.type===k).value;return get('year')+'-'+get('month')+'-'+get('day');}
export function shiftMonth(month,delta){const [y,m]=month.split('-').map(Number),d=new Date(Date.UTC(y,m-1+delta,1));return d.toISOString().slice(0,7);}
function days(month){const [y,m]=month.split('-').map(Number),n=new Date(Date.UTC(y,m,0)).getUTCDate(),out=[];for(let d=1;d<=n;d++){const date=new Date(Date.UTC(y,m-1,d));out.push({date:date.toISOString().slice(0,10),weekday:(date.getUTCDay()+6)%7});}return out;}

// Pure calculation, unit-tested. verifiedDates are Morocco calendar dates (YYYY-MM-DD).
export function computePayroll({month,today,verifiedDates=[],base=PAYROLL.base_monthly,perLead=PAYROLL.per_verified_lead}){
 const list=days(month),work=list.filter(d=>d.weekday<5),working_days=work.length;
 const elapsed_days=today<list[0].date?0:today>list[list.length-1].date?working_days:work.filter(d=>d.date<=today).length;
 const daily=working_days?base/working_days:0,inMonth=verifiedDates.filter(d=>d.startsWith(month)).sort();
 const commission=inMonth.length*perLead,base_accrued=Math.round(daily*elapsed_days*100)/100;
 const byDay={};for(const d of inMonth)byDay[d]=(byDay[d]||0)+1;
 return {month,currency:PAYROLL.currency,base_monthly:base,per_verified_lead:perLead,daily_rate:Math.round(daily*100)/100,working_days,elapsed_days,remaining_days:working_days-elapsed_days,
  verified_count:inMonth.length,commission,base_accrued,earned_to_date:Math.round((base_accrued+commission)*100)/100,projected_total:base+commission,
  days:list.map(d=>({date:d.date,workday:d.weekday<5,verified:byDay[d.date]||0}))};
}
export function history({month,today,verifiedDates,base,perLead,months=9}){const out=[];for(let i=months-1;i>=0;i--){const m=shiftMonth(month,-i),p=computePayroll({month:m,today,verifiedDates,base,perLead});out.push({month:m,verified_count:p.verified_count,commission:p.commission,total:m<today.slice(0,7)?p.projected_total:p.earned_to_date});}return out;}

function privileged(){if(!process.env.SUPABASE_SERVICE_ROLE_KEY)throw Error('Payroll unavailable');return createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});}
function check(r){if(r.error)throw Error('Database operation failed');return r.data;}
function bounds(month,months){const from=shiftMonth(month,-(months-1)),[fy,fm]=from.split('-').map(Number),[ty,tm]=month.split('-').map(Number);return {from:new Date(Date.UTC(fy,fm-1,1)-86400000).toISOString(),to:new Date(Date.UTC(ty,tm,1)+86400000).toISOString()};}
async function rate(client,id){const d=await client.from('mt_employee_directory').select('commission_rate,commission_currency').eq('user_id',id).maybeSingle();const r=d.data;return !d.error&&r&&r.commission_rate!=null&&r.commission_currency==='MAD'?Number(r.commission_rate):PAYROLL.per_verified_lead;}

export function mountPayroll(app,{requireStaff,requireAdmin}){
 const wrap=fn=>async(req,res)=>{try{await fn(req,res);}catch(e){const forbidden=e.message==='Forbidden';res.status(e instanceof z.ZodError?400:forbidden?403:503).json({error:e instanceof z.ZodError?'Invalid month.':forbidden?'Not allowed.':'Payroll is temporarily unavailable.',requestId:req.requestId});}};
 const owner=req=>{const id=z.string().uuid().parse(req.query.owner||req.staff.user_id);if(id!==req.staff.user_id&&req.staff.role!=='admin')throw Error('Forbidden');return id;};
 const currentMonth=()=>dayKey(new Date()).slice(0,7);
 app.get('/api/workspace/payroll',requireStaff,wrap(async(req,res)=>{
  const id=owner(req),month=monthText.parse(req.query.month||currentMonth()),today=dayKey(new Date()),client=privileged(),{from,to}=bounds(month,9);
  const rows=check(await client.from('crm_candidates').select('id,reference,case_accepted_at').eq('assigned_to',id).not('case_accepted_at','is',null).gte('case_accepted_at',from).lt('case_accepted_at',to).is('archived_at',null).or(`created_by.eq.${id},source.eq.public_counsellor_card`).order('case_accepted_at',{ascending:true}).limit(1000));
  const verifiedDates=rows.map(r=>dayKey(r.case_accepted_at)),perLead=await rate(client,id),summary=computePayroll({month,today,verifiedDates,perLead});
  const leads=rows.filter(r=>dayKey(r.case_accepted_at).startsWith(month)).map(r=>({reference:r.reference,verified_on:dayKey(r.case_accepted_at),amount:perLead}));
  res.json({data:{...summary,today,zone:PAYROLL.zone,workdays:PAYROLL.workdays,leads,history:history({month,today,verifiedDates,perLead}),notice:'Estimate for information. Final pay is confirmed by MUK Talent administration.'}});
 }));
 // Team overview for administrators (one query for everyone, no personal data beyond name and totals).
 app.get('/api/admin/payroll',requireStaff,requireAdmin,wrap(async(req,res)=>{
  const month=monthText.parse(req.query.month||currentMonth()),today=dayKey(new Date()),client=privileged(),{from,to}=bounds(month,1);
  const team=check(await client.from('crm_staff').select('user_id,full_name,role,active').eq('active',true).eq('role','collaborator').order('full_name').limit(200));
  const ids=team.map(t=>t.user_id),rows=ids.length?check(await client.from('crm_candidates').select('assigned_to,created_by,source,case_accepted_at').in('assigned_to',ids).not('case_accepted_at','is',null).gte('case_accepted_at',from).lt('case_accepted_at',to).is('archived_at',null).limit(5000)):[];
  const dirs=ids.length?check(await client.from('mt_employee_directory').select('user_id,commission_rate,commission_currency').in('user_id',ids)):[];
  const data=team.map(t=>{const d=dirs.find(x=>x.user_id===t.user_id),perLead=d&&d.commission_rate!=null&&d.commission_currency==='MAD'?Number(d.commission_rate):PAYROLL.per_verified_lead;const dates=rows.filter(r=>r.assigned_to===t.user_id&&(r.created_by===t.user_id||r.source==='public_counsellor_card')).map(r=>dayKey(r.case_accepted_at));const p=computePayroll({month,today,verifiedDates:dates,perLead});return {user_id:t.user_id,full_name:t.full_name,verified_count:p.verified_count,commission:p.commission,base_accrued:p.base_accrued,earned_to_date:p.earned_to_date,projected_total:p.projected_total};});
  const totals=data.reduce((a,r)=>({verified_count:a.verified_count+r.verified_count,commission:a.commission+r.commission,projected_total:a.projected_total+r.projected_total}),{verified_count:0,commission:0,projected_total:0});
  res.json({data,totals,month,currency:PAYROLL.currency,base_monthly:PAYROLL.base_monthly,per_verified_lead:PAYROLL.per_verified_lead});
 }));
}
