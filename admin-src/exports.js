
export function mountExportButtons(getSession){
 const host=document.querySelector('#appShell .page-header');if(!host||document.getElementById('crmExportControls'))return;
 const box=document.createElement('div');box.id='crmExportControls';box.className='form-actions';
 const msg=document.createElement('p');msg.className='message';msg.setAttribute('role','status');
 const buttons=[];
 for(const [mode,label] of [['internal','Exporter le CRM (.xlsx)'],['partners','Rapport partenaires (.xlsx)']]){
  const b=document.createElement('button');b.type='button';b.className='secondary';b.textContent=label;buttons.push(b);
  b.addEventListener('click',async()=>{
   const warning=mode==='internal'?'Cet export contient des données personnelles. Usage interne uniquement. Continuer ?':'Ce rapport minimise les données mais n’est pas anonyme. Vérifiez le cadre de partage et retirez les doublons et profils de test avant toute transmission à une université. Télécharger pour révision ?';
   if(!window.confirm(warning))return;
   buttons.forEach(v=>v.disabled=true);msg.textContent='Génération du fichier…';
   try{
    const session=await getSession();if(!session)throw new Error('Reconnectez-vous au panel.');
    const r=await fetch('/api/exports/'+mode,{headers:{Authorization:'Bearer '+session.access_token},cache:'no-store'});
    if(!r.ok){let data;try{data=await r.json();}catch{}throw new Error(data?.error||'Export impossible.');}
    const blob=await r.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=`muktalent-${mode}-${new Date().toISOString().slice(0,10)}.xlsx`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
    msg.textContent='Fichier généré. Vérifiez son contenu avant de l’utiliser.';
   }catch(e){msg.textContent=e.message;}finally{buttons.forEach(v=>v.disabled=false);}
  });box.append(b);
 }
 host.after(box,msg);
}
