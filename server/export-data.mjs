
export const phases={
 new:{fr:'Nouveau',en:'New enquiry',color:'FFE8EDF2'},
 contacted:{fr:'Contact établi',en:'Contact made',color:'FFDCEBFA'},
 assessment_in_progress:{fr:'Évaluation en cours',en:'Assessment in progress',color:'FFD7E4FC'},
 documents_pending:{fr:'Documents en attente',en:'Documents pending',color:'FFFFEDBF'},
 ready_for_review:{fr:'Prêt pour examen',en:'Ready for review',color:'FFD7EFE3'},
 on_hold:{fr:'En attente',en:'On hold',color:'FFF1E1D3'},
 closed:{fr:'Clôturé',en:'Closed',color:'FFE4E4E4'}
};
export function text(v,max=2000){return typeof v==='string'?v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').slice(0,max):v==null?'':String(v).slice(0,max);}
export function number(v){if(v===null||v===undefined||v==='')return null;const n=Number(v);return Number.isFinite(n)?n:null;}
export function fieldGroup(value){const s=text(value).toLowerCase();
 if(/informat|comput|software|data|cyber|intelligence artific|\bai\b/.test(s))return 'Computing & technology';
 if(/business|manage|gestion|finance|account|commerc|marketing|econom/.test(s))return 'Business & economics';
 if(/engineer|ingén|ingen|mechan|mécan|electr|civil/.test(s))return 'Engineering';
 if(/health|santé|medic|médec|nurs|pharm|biolog/.test(s))return 'Health & life sciences';
 if(/art|design|media|musique|music|architect/.test(s))return 'Arts & design';
 if(/droit|law|polit|social|psych|education|éducation|sociolog/.test(s))return 'Social sciences & humanities';
 return s?'Other / to review':'Not specified';
}
export function intakeYear(value){return text(value).match(/\b20\d{2}\b/)?.[0]||'To define';}
export function budgetBand(value){const n=number(value);if(n===null)return 'Not stated';if(n<10000)return '<10,000';if(n<20000)return '10,000–19,999';if(n<30000)return '20,000–29,999';return '30,000+';}
export function publicCountry(value){return /^[A-Z]{2}$/.test(String(value||''))?value:'Not specified';}
export function publicLevel(value){return ['foundation','undergraduate','postgraduate','phd','english_course','other'].includes(value)?value:'Not specified';}
export function publicEnglish(candidate){const v=candidate.evaluation_payload?.english_level;return ['beginner','intermediate','advanced','certified','unknown'].includes(v)?v:'Not specified';}
export function partnerRows(candidates){return candidates.filter(c=>!c.archived_at).map((c,i)=>[
 `PROFILE-${String(i+1).padStart(5,'0')}`,publicCountry(c.residence_country_code),publicLevel(c.target_study_level),
 fieldGroup(c.subject_interest),intakeYear(c.intended_intake),budgetBand(c.budget_amount),
 /^[A-Z]{3}$/.test(c.budget_currency||'')?c.budget_currency:'Not specified',publicEnglish(c),
 phases[c.status]?.en||'Unknown / review required'
]);}
export function overview(candidates){const active=candidates.filter(c=>!c.archived_at);return {active:active.length,archived:candidates.length-active.length,phases:Object.fromEntries(Object.keys(phases).map(k=>[k,active.filter(c=>c.status===k).length]))};}
