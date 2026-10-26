
import {rateLimit} from 'express-rate-limit';
import {phases,text,number,partnerRows,overview} from './export-data.mjs';
const cap=20000;
async function all(db,table,select,key='id'){
 const first=await db.from(table).select(select,{count:'exact'}).order(key,{ascending:true}).range(0,999);
 if(first.error)throw new Error('database');
 if((first.count||0)>cap)throw Object.assign(new Error(`Export limité à ${cap} lignes par ressource. Aucun fichier partiel n’a été généré.`),{status:413});
 const data=[...(first.data||[])];
 for(let from=data.length;from<(first.count||0);){const r=await db.from(table).select(select).order(key,{ascending:true}).range(from,from+999);if(r.error||!r.data?.length)throw new Error('database');data.push(...r.data);from+=r.data.length;}
 return data;
}
function sheet(wb,name,headers,rows,widths=[],colors=null){
 const ws=wb.addWorksheet(name,{views:[{state:'frozen',xSplit:1,ySplit:1}]});
 ws.addRow(headers);for(const row of rows)ws.addRow(row.map(v=>typeof v==='string'?text(v,10000):v));
 ws.autoFilter={from:{row:1,column:1},to:{row:Math.max(1,ws.rowCount),column:headers.length}};
 headers.forEach((h,i)=>{ws.getColumn(i+1).width=widths[i]||24;});
 ws.getRow(1).height=30;ws.getRow(1).font={name:'Calibri',size:11,bold:true,color:{argb:'FFFFFFFF'}};
 ws.getRow(1).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF163B37'}};
 ws.getRow(1).alignment={vertical:'middle',wrapText:true};
 for(let r=2;r<=ws.rowCount;r++){
  const row=ws.getRow(r);row.font={name:'Calibri',size:11};row.alignment={vertical:'top',wrapText:true};
  const color=colors?.[r-2]||(r%2===0?'FFF2F5F1':'FFFFFFFF');
  row.eachCell({includeEmpty:true},cell=>{cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:color}};});
 }
 ws.pageSetup={paperSize:9,orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0};
 return ws;
}
function counts(rows,index){const m=new Map();for(const r of rows){const k=String(r[index]);m.set(k,(m.get(k)||0)+1);}return [...m.entries()].sort((a,b)=>b[1]-a[1]);}
export function mountExports(app){
 const limited=rateLimit({windowMs:60000,limit:4,keyGenerator:req=>req.staff.user_id,standardHeaders:'draft-7',legacyHeaders:false,message:{error:'Attendez une minute avant de relancer un export.'}});
 for(const mode of ['internal','partners'])app.get('/api/exports/'+mode,limited,async(req,res)=>{
  try{
   if(req.staff?.role!=='admin')return res.status(403).json({error:'Accès administrateur requis.'});
   const {default:ExcelJS}=await import('exceljs');
   const candidates=await all(req.db,'crm_candidates','id,reference,first_name,last_name,email,phone_e164,whatsapp_phone_e164,preferred_language,residence_country_code,residence_city,status,assigned_to,target_study_level,subject_interest,intended_intake,budget_amount,budget_currency,funding_plan,next_action,next_action_at,created_at,updated_at,archived_at,evaluation_payload');
   const partnerCandidates=candidates.filter(c=>c.status!=='closed');
   const stats=overview(mode==='partners'?partnerCandidates:candidates),wb=new ExcelJS.Workbook();
   wb.creator='Maghreb UK Talent';wb.created=new Date();wb.modified=new Date();
   const generated=new Date().toISOString();
   if(mode==='internal'){
    const [education,enquiries,staff]=await Promise.all([
     all(req.db,'crm_education','id,candidate_id,institution_name,qualification,field_of_study,country_code,is_current,result_text,grading_scale,start_date,end_date'),
     all(req.db,'crm_enquiries','id,candidate_id,full_name,email,whatsapp_phone_e164,enquiry_type,subject,status,next_action,next_action_at,created_at'),
     all(req.db,'crm_staff','user_id,full_name','user_id')]);
    const names=new Map(staff.map(s=>[s.user_id,s.full_name])),refs=new Map(candidates.map(c=>[c.id,c.reference]));
    sheet(wb,'Vue ensemble',['Indicateur','Valeur'],[
     ['Export généré (UTC)',generated],['Confidentialité','INTERNE — contient des données personnelles. Ne pas transmettre aux partenaires.'],
     ['Candidats actifs uniques',stats.active],['Candidats archivés',stats.archived],['Consultations, liées ou non',enquiries.length],
     ['Attention aux doublons','Une consultation liée et sa fiche candidat ne représentent pas deux personnes différentes.'],
     ...Object.entries(stats.phases).map(([k,v])=>[phases[k].fr,v]),
     ['Périmètre','Tous les candidats, y compris archivés. Filtres de la liste du panel non appliqués.'],
     ['Limites','Instantané de données collectées successivement ; pas une transaction de lecture unique. Les phases sont des états CRM, pas des résultats universitaires.']
    ],[35,105]);
    sheet(wb,'Candidats',['Référence','Prénom','Nom','E-mail','Téléphone','WhatsApp','Pays résidence','Ville','Niveau visé','Domaine déclaré','Rentrée déclarée','Budget déclaré','Devise','Financement déclaré','Anglais déclaré','Phase CRM','Responsable','Prochaine action','Suivi (UTC)','Créé (UTC)','Archivé (UTC)'],candidates.map(c=>[
     text(c.reference),text(c.first_name),text(c.last_name),text(c.email),text(c.phone_e164),text(c.whatsapp_phone_e164),text(c.residence_country_code),text(c.residence_city),text(c.target_study_level),text(c.subject_interest),text(c.intended_intake),number(c.budget_amount),text(c.budget_currency),text(c.funding_plan),text(c.evaluation_payload?.english_level),phases[c.status]?.fr||text(c.status),text(names.get(c.assigned_to)),text(c.next_action),text(c.next_action_at),text(c.created_at),text(c.archived_at)
    ]),[20,20,22,34,20,20,15,22,22,35,24,20,12,40,22,25,25,42,26,26,26],candidates.map(c=>c.archived_at?'FFE4E4E4':phases[c.status]?.color));
    sheet(wb,'Etudes',['Référence candidat','Établissement','Diplôme','Spécialité','Pays','En cours','Résultat déclaré','Barème','Début','Fin'],education.map(e=>[text(refs.get(e.candidate_id)||e.candidate_id),text(e.institution_name),text(e.qualification),text(e.field_of_study),text(e.country_code),e.is_current?'Oui':'Non',text(e.result_text),text(e.grading_scale),text(e.start_date),text(e.end_date)]),[22,40,35,35,12,12,30,20,18,18]);
    sheet(wb,'Consultations',['ID consultation','Référence candidat liée','Nom','E-mail','WhatsApp','Type','Objet','État consultation','Prochaine action','Suivi (UTC)','Créée (UTC)'],enquiries.map(e=>[text(e.id),text(refs.get(e.candidate_id)),text(e.full_name),text(e.email),text(e.whatsapp_phone_e164),text(e.enquiry_type),text(e.subject),text(e.status),text(e.next_action),text(e.next_action_at),text(e.created_at)]),[38,24,30,35,20,25,42,24,40,26,26]);
    const due=candidates.filter(c=>!c.archived_at&&c.status!=='closed'&&c.next_action_at).sort((a,b)=>String(a.next_action_at).localeCompare(String(b.next_action_at)));
    sheet(wb,'Suivi',['Référence','Nom','Phase','Responsable','Action','Date UTC','Situation à l’export'],due.map(c=>[text(c.reference),text(c.first_name)+' '+text(c.last_name),phases[c.status]?.fr||text(c.status),text(names.get(c.assigned_to)),text(c.next_action),text(c.next_action_at),Date.parse(c.next_action_at)<Date.now()?'Échéance dépassée':'À venir']),[20,30,25,25,50,26,25],due.map(c=>Date.parse(c.next_action_at)<Date.now()?'FFFFEDBF':phases[c.status]?.color));
   }else{
    const profiles=partnerRows(partnerCandidates);
    sheet(wb,'Read first',['Topic','Information'],[
     ['Report','MAGHREB UK TALENT — prospective student pipeline'],['Generated UTC',generated],
     ['Purpose','Draft for partnership discussions. Review the lawful basis, notice and recipient before external disclosure. No automatic sharing.'],
     ['Privacy','MINIMISED / PSEUDONYMISED, NOT ANONYMOUS. Do not attempt re-identification.'],
     ['Scope','Non-archived candidate records, excluding closed projects. General enquiries are excluded to avoid double counting.'],
     ['Unique records, not deduplicated people','Separate submissions by the same person may exist. Review duplicates and test records before presenting these numbers.'],
     ['Declared information','Budget, English level, intake and interests are self-reported unless independently verified outside this report.'],
     ['Field grouping','Study interests are grouped heuristically; they are indicative, not verified programme matches.'],
     ['Profile codes','PROFILE codes are regenerated for each export, are not stable candidate identifiers and must not be used for university applications.'],
     ['No admission claims','CRM phases do not demonstrate submitted applications, university offers, enrolments or partnerships.'],
     ['Status of this file','Static snapshot. Editing this workbook does not update the CRM.'],
     ['No embedded identity data','Names, email addresses, phones, city, institutions, exact grades, documents, free-text messages and internal notes are omitted.']
    ],[35,115]);
    sheet(wb,'Executive summary',['Metric','Count'],[['Active candidate records',stats.active],...Object.entries(stats.phases).map(([k,v])=>[phases[k].en,v])],[40,20]);
    sheet(wb,'Potential profiles',['Profile code','Residence country code','Target study level','Indicative field group','Intake year','Declared annual budget band','Budget currency','Declared English level','Current CRM phase'],profiles,[23,24,25,34,20,29,20,26,30],partnerCandidates.filter(c=>!c.archived_at).map(c=>phases[c.status]?.color));
    sheet(wb,'By market',['Residence country code','Candidate records'],counts(profiles,1),[30,25]);
    sheet(wb,'By study level',['Target study level','Candidate records'],counts(profiles,2),[30,25]);
    sheet(wb,'By field',['Indicative field group','Candidate records'],counts(profiles,3),[38,25]);
    sheet(wb,'By intake',['Declared intake year','Candidate records'],counts(profiles,4),[30,25]);
   }
   sheet(wb,mode==='internal'?'Legende':'Stage definitions',mode==='internal'?['Code CRM','Phase','Signification']:['CRM code','Label','Meaning'],Object.entries(phases).map(([k,v])=>[k,mode==='internal'?v.fr:v.en,{
    new:'Record received; not yet assessed.',contacted:'Contact marked in CRM; not a qualified application.',assessment_in_progress:'Assessment in progress; outcome not yet established.',documents_pending:'Documents pending; does not imply an application was submitted.',ready_for_review:'Ready for internal review; not a university offer.',on_hold:'Project on hold.',closed:'CRM record closed; does not mean enrolled.'
   }[k]]),[30,30,95],Object.values(phases).map(v=>v.color));
   const bytes=await wb.xlsx.writeBuffer();
   res.set('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
   res.set('Content-Disposition',`attachment; filename="muktalent-${mode}-${generated.slice(0,10)}.xlsx"`);
   res.set('Cache-Control','no-store');res.send(Buffer.from(bytes));
  }catch(e){console.error(JSON.stringify({event:'crm_export_failed',requestId:req.requestId,error:e.status?'limit':'export'}));res.status(e.status||503).json({error:e.status?e.message:'Export indisponible. Vérifiez les dépendances et le serveur.',requestId:req.requestId});}
 });
}
