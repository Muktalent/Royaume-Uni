(()=>{
'use strict';
const $=id=>document.getElementById(id),form=$('evaluation-form'),steps=[...form.querySelectorAll('fieldset')];
let step=0,busy=false,selected=null,slotsEpoch=0,token=null,reference=null;
let submissionId=crypto.randomUUID();
try{submissionId=sessionStorage.getItem('muk-eval-submission')||submissionId;sessionStorage.setItem('muk-eval-submission',submissionId);
 const saved=JSON.parse(sessionStorage.getItem('muk-eval-receipt')||'null');if(saved){token=saved.token;reference=saved.reference;}}
catch{}
const val=n=>form.elements.namedItem(n).value.trim();
const notice=(id,text,error=false)=>{$(id).textContent=text;$(id).classList.toggle('error',error);};
function showStep(){steps.forEach((s,i)=>{s.hidden=i!==step;});$('previous').hidden=step===0;$('next').hidden=step===3;$('submit').hidden=step!==3;$('progress').value=step+1;$('step-label').textContent=`Étape ${step+1} sur 4`;notice('form-message','');if(step===3)review();}
function validateCurrent(){
 const country=form.elements.namedItem('other_country');country.required=val('residence_country_code')==='other';
 if(step===2){const cur=form.elements.namedItem('budget_currency');cur.required=val('budget_amount')!=='';}
 for(const field of steps[step].querySelectorAll('input,select,textarea'))if(!field.checkValidity()){field.reportValidity();return false;}
 return true;
}
function payload(){return {
 submission_id:submissionId,website:val('website'),privacy_acknowledged:form.elements.namedItem('privacy_acknowledged').checked,
 first_name:val('first_name'),last_name:val('last_name'),email:val('email'),whatsapp_phone_e164:val('whatsapp_phone_e164'),
 residence_country_code:val('residence_country_code')==='other'?val('other_country').toUpperCase():val('residence_country_code'),residence_city:val('residence_city'),
 target_study_level:val('target_study_level'),subject_interest:val('subject_interest'),intended_intake:val('intended_intake'),
 budget_amount:val('budget_amount')===''?null:Number(val('budget_amount')),budget_currency:val('budget_amount')===''?null:val('budget_currency')||null,
 funding_plan:val('funding_plan')||null,education:{institution_name:val('institution_name'),qualification:val('qualification'),
 field_of_study:val('field_of_study')||null,is_current:val('is_current')==='true',result_text:val('result_text')||null},
 english_level:val('english_level'),english_test:val('english_test')||null,message:val('message')||null
};}
function review(){
 const dl=document.createElement('dl');
 const display=n=>{const e=form.elements.namedItem(n);return e.tagName==='SELECT'?e.selectedOptions[0]?.textContent:e.value;};
 const pairs=[['Nom',val('first_name')+' '+val('last_name')],['E-mail',val('email')],['WhatsApp',val('whatsapp_phone_e164')],['Résidence',(val('residence_country_code')==='other'?val('other_country'):display('residence_country_code'))+' · '+val('residence_city')],['Établissement',val('institution_name')],['Diplôme',val('qualification')],['Spécialité',val('field_of_study')],['Études en cours',display('is_current')],['Résultats',val('result_text')],['Anglais',display('english_level')],['Test d’anglais',val('english_test')],['Niveau visé',display('target_study_level')],['Domaine',val('subject_interest')],['Rentrée',val('intended_intake')],['Budget annuel',val('budget_amount')?val('budget_amount')+' '+val('budget_currency'):'À définir'],['Financement',val('funding_plan')],['Précisions',val('message')]];
 for(const [label,value] of pairs){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value||'Non précisé';dl.append(dt,dd);}$('review').replaceChildren(dl);
}
async function api(url,body){
 const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store',signal:AbortSignal.timeout(25000)});
 let data;try{data=await response.json();}catch{throw new Error('Réponse inattendue du serveur. Votre demande n’est pas confirmée.');}
 if(!response.ok)throw new Error(data.error||'La demande n’a pas pu être enregistrée.');return data;
}
function success(){
 $('evaluation-panel').hidden=true;$('success-panel').hidden=false;$('reference').textContent='Votre référence : '+reference;
 $('booking').hidden=false;const d=dayInMorocco(new Date());$('booking-day').min=d;$('booking-day').value=d;
 const max=new Date();max.setUTCDate(max.getUTCDate()+60);$('booking-day').max=dayInMorocco(max);$('success-panel').focus();
}
function dayInMorocco(date){const parts=new Intl.DateTimeFormat('en',{timeZone:'Africa/Casablanca',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);return ['year','month','day'].map(k=>parts.find(p=>p.type===k).value).join('-');}
function timeText(iso,zone){return new Intl.DateTimeFormat('fr-FR',{timeZone:zone,dateStyle:'medium',timeStyle:'short'}).format(new Date(iso));}
$('next').addEventListener('click',()=>{if(!busy&&validateCurrent()){step++;showStep();steps[step].querySelector('input,select,textarea')?.focus();}});
$('previous').addEventListener('click',()=>{if(!busy){step--;showStep();}});
form.addEventListener('submit',async event=>{
 event.preventDefault();if(busy)return;
 if(step<3){$('next').click();return;}
 if(!validateCurrent())return;
 for(let i=0;i<3;i++){const bad=[...steps[i].querySelectorAll('input,select,textarea')].find(e=>!e.checkValidity());if(bad){step=i;showStep();bad.reportValidity();return;}}
 busy=true;$('submit').disabled=true;$('previous').disabled=true;notice('form-message','Enregistrement en cours…');
 try{const data=await api('/api/evaluation',payload());token=data.token;reference=data.reference;
 try{sessionStorage.setItem('muk-eval-receipt',JSON.stringify({token,reference}));}catch{}
 form.reset();success();
 }catch(e){notice('form-message',e.name==='TimeoutError'?'La réponse a pris trop de temps. Réessayez sans fermer cet onglet : le même envoi ne créera pas de doublon.':e.message,true);}
 finally{busy=false;$('submit').disabled=false;$('previous').disabled=false;}
});
function resetSlots(){slotsEpoch++;selected=null;$('slots').replaceChildren();$('confirm-booking').disabled=true;$('booking-consent').checked=false;}
$('booking-day').addEventListener('change',()=>{resetSlots();notice('booking-message','Affichez les disponibilités pour cette date.');});
$('load-slots').addEventListener('click',async()=>{
 if(busy||!$('booking-day').reportValidity())return;resetSlots();const epoch=slotsEpoch;
 $('load-slots').disabled=true;notice('booking-message','Recherche des disponibilités…');
 try{const result=await api('/api/evaluation/slots',{token,day:$('booking-day').value});if(epoch!==slotsEpoch)return;
 const slots=result.slots.filter((v,i,a)=>a.findIndex(t=>t.starts_at===v.starts_at)===i);
 for(const slot of slots){const b=document.createElement('button');b.type='button';b.className='slot';b.setAttribute('aria-pressed','false');
 b.textContent=timeText(slot.starts_at,'Africa/Casablanca')+' · Maroc';const small=document.createElement('small');small.textContent=timeText(slot.starts_at,'Europe/London')+' · Royaume-Uni';b.append(small);
 b.addEventListener('click',()=>{selected=slot;for(const n of $('slots').children)n.setAttribute('aria-pressed',String(n===b));$('confirm-booking').disabled=!$('booking-consent').checked;});$('slots').append(b);}
 notice('booking-message',slots.length?'Choisissez votre créneau.':'Aucun créneau disponible pour cette date. Essayez un autre jour ouvré.');
 }catch(e){if(epoch===slotsEpoch)notice('booking-message',e.message,true);}finally{$('load-slots').disabled=false;}
});
$('booking-consent').addEventListener('change',()=>{$('confirm-booking').disabled=!selected||!$('booking-consent').checked;});
$('confirm-booking').addEventListener('click',async()=>{
 if(busy||!selected||!$('booking-consent').checked)return;busy=true;$('confirm-booking').disabled=true;$('load-slots').disabled=true;$('booking-day').disabled=true;
 for(const b of $('slots').children)b.disabled=true;
 notice('booking-message','Réservation en cours…');
 try{const {data,email_confirmation}=await api('/api/evaluation/book',{token,...selected,privacy_acknowledged:true});
 const box=$('booking-confirmed');const title=document.createElement('h3');title.textContent='Votre entretien est réservé.';
 const p=document.createElement('p');p.textContent=timeText(data.starts_at,'Africa/Casablanca')+' (Maroc) · '+timeText(data.starts_at,'Europe/London')+' (Royaume-Uni). Durée : 30 minutes.';
 const note=document.createElement('p');note.textContent=(email_confirmation==='sent'?'Un e-mail de confirmation a été envoyé.':email_confirmation==='failed'?'Votre réservation est enregistrée, mais l’envoi de l’e-mail a échoué. Conservez cette confirmation.':'Conservez cette confirmation : l’envoi automatique d’e-mails n’est pas configuré.')+' Pour modifier ou annuler : agents@muktalent.com, référence '+data.reference+'.';
 box.replaceChildren(title,p,note);box.hidden=false;box.focus();$('slots').hidden=true;$('confirm-booking').hidden=true;$('load-slots').hidden=true;notice('booking-message','Réservation confirmée dans notre calendrier.');
 }catch(e){notice('booking-message',e.message,true);$('confirm-booking').disabled=false;$('load-slots').disabled=false;$('booking-day').disabled=false;for(const b of $('slots').children)b.disabled=false;}
 finally{busy=false;}
});
if(token&&reference)success();else showStep();
})();


// MUK_NEW_EVALUATION_BUTTON_V1
(() => {
  const panel = document.getElementById('success-panel');
  if (!panel || document.getElementById('new-evaluation')) return;

  const button = document.createElement('button');
  button.id = 'new-evaluation';
  button.type = 'button';
  button.className = 'secondary';
  button.textContent = 'Commencer une nouvelle \u00e9valuation';

  const wrapper = document.createElement('p');
  wrapper.append(button);
  panel.append(wrapper);

  button.addEventListener('click', () => {
    const confirmed = window.confirm(
      'Commencer une nouvelle \u00e9valuation ? ' +
      'La demande et le rendez-vous pr\u00e9c\u00e9dents resteront enregistr\u00e9s. ' +
      'Cette page ne permettra plus de reprendre la demande pr\u00e9c\u00e9dente.'
    );

    if (!confirmed) return;

    try {
      sessionStorage.removeItem('muk-eval-receipt');
      sessionStorage.removeItem('muk-eval-submission');
    } catch {
      window.alert(
        'Impossible de r\u00e9initialiser la session dans ce navigateur.'
      );
      return;
    }

    window.location.reload();
  });
})();