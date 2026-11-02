// student-portal-v1 · GLOBAL PASSPORT — MY GLOBAL JOURNEY (student side).
import {E,gi,btn,ring,avatar,countrySelect,countryName,iso,fmtDate,ago,daysUntil,linkCss,idleLogout,reducedMotion} from './gp-ui.js';
import {gateLang} from './gateway.js';
import {applyV17,mountUpdates,messageNotifier} from './muk-v17.js';
import {openMessenger,openNotifications,heartButton,watchNotifications,setDot,hideOnScroll,linkChatCss} from './muk-chat.js';

const TX={
 en:{photoAdd:'Add photo',photoChange:'Change photo',photoBusy:'Uploading…',photoHint:'JPG, PNG or WebP · max 5 MB',ppType:'Type',ppCode:'Code',ppNo:'Passport No.',surname:'Surname',given:'Given names',ppNat:'Nationality',ppDob:'Date of birth',ppDest:'Destination',ppIssue:'Date of issue',ppAuth:'Authority',ppSign:'Holder’s signature',ppFile:'File',language:'Language',notifications:'Notifications',brand:'GLOBAL PASSPORT',journeyTitle:'My Global Journey',pages:{journey:'Journey',documents:'Documents',plan:'Plan',messages:'Messages',profile:'Profile'},
  destination:'Destination',university:'University',programme:'Programme',intake:'Intake',status:'Application status',readiness:'Application readiness',counsellor:'Your counsellor',noCounsellor:'Being assigned',noCounsellorText:'We are matching you with the right counsellor. You will hear from us within 2 working days.',
  toChoose:'To be selected with your counsellor',pendingDocs:'Pending documents',nextDates:'Upcoming dates',noDates:'No dates yet. Your counsellor will add deadlines here.',latest:'Latest from your counsellor',message:'Message',write:'Write a message…',send:'Send',
  stage:{done:'Completed',in_progress:'In progress',pending:'Pending'},doc:{requested:'To upload',uploaded:'In review',approved:'Approved',rejected:'Needs changes'},upload:'Upload',replace:'Replace',view:'View',uploading:'Uploading…',uploaded:'Uploaded. Your counsellor will review it.',fileRule:'PDF, JPG, PNG or WebP · max 10 MB',tooBig:'This file is larger than 10 MB.',badType:'Use PDF, JPG, PNG or WebP.',
  tasks:'Tasks',noTasks:'No tasks in this stage.',due:'Due',overdue:'Overdue',today:'Today',inDays:'in {n} days',docsDone:'{a} of {b} approved',
  st:{profile:'Profile in progress',preparing:'Preparing application',submitted:'Application submitted',awaiting:'Awaiting university response',offer:'Offer received',visa:'Visa in progress',travel:'Preparing travel',enrolled:'Enrolled',on_hold:'On hold',withdrawn:'Withdrawn'},
  profileTitle:'Your profile',save:'Save changes',saved:'Saved.',fullName:'Full name',phone:'Phone (with country code)',residence:'Country of residence',nationality:'Nationality',dob:'Date of birth',level:'Study level',subject:'Subject area',english:'English test / level',preferred:'Preferred university',preferredProg:'Preferred programme',
  destinations:'Destinations',active:'Active',soon:'Coming soon',signOut:'Sign out',website:'Back to website',refresh:'Refresh',swipe:'Swipe left or right to move between sections',updated:'Updated',you:'You',system:'Update',empty:'No messages yet. Say hello to your counsellor.',
  ob:{step:'Step {a} of {b}',where:'Where do you want to study?',whereText:'Global Passport opens with the United Kingdom. Canada and the USA are on the way.',from:'Where are you from?',fromText:'We are preparing MUK Talent for students from every country. This helps us assign the right counsellor and documents.',
   plan:'Your study plan',planText:'A first idea is enough. Your counsellor will refine it with you.',confirm:'Open my Global Passport',confirmText:'Your counsellor is assigned automatically as soon as your file is created.',consent:'I agree that MUK Talent stores my file to support my application, as described in the privacy policy.',next:'Continue',back:'Back',create:'Create my Global Passport',creating:'Creating your file…',assigned:'Your counsellor',welcome:'Welcome, {name}',chooseLevel:'Choose a level',intakePh:'e.g. September 2027',subjectPh:'e.g. Computer Science',englishPh:'e.g. IELTS 6.5 / not yet',choose:'Choose…'}},
 fr:{photoAdd:'Ajouter photo',photoChange:'Changer la photo',photoBusy:'Envoi…',photoHint:'JPG, PNG ou WebP · 5 Mo max',ppType:'Type',ppCode:'Code',ppNo:'N° de passeport',surname:'Nom',given:'Prénoms',ppNat:'Nationalité',ppDob:'Date de naissance',ppDest:'Destination',ppIssue:'Date de délivrance',ppAuth:'Autorité',ppSign:'Signature du titulaire',ppFile:'Dossier',language:'Langue',notifications:'Notifications',brand:'GLOBAL PASSPORT',journeyTitle:'Mon parcours international',pages:{journey:'Parcours',documents:'Documents',plan:'Plan',messages:'Messages',profile:'Profil'},
  destination:'Destination',university:'Université',programme:'Programme',intake:'Rentrée',status:'Statut de la candidature',readiness:'Préparation du dossier',counsellor:'Votre conseiller',noCounsellor:'Attribution en cours',noCounsellorText:'Nous vous attribuons le bon conseiller. Vous aurez de nos nouvelles sous 2 jours ouvrés.',
  toChoose:'À choisir avec votre conseiller',pendingDocs:'Documents en attente',nextDates:'Dates importantes',noDates:'Pas encore de dates. Votre conseiller ajoutera vos échéances ici.',latest:'Dernières nouvelles',message:'Message',write:'Écrire un message…',send:'Envoyer',
  stage:{done:'Terminé',in_progress:'En cours',pending:'En attente'},doc:{requested:'À envoyer',uploaded:'En vérification',approved:'Validé',rejected:'À corriger'},upload:'Envoyer',replace:'Remplacer',view:'Voir',uploading:'Envoi…',uploaded:'Envoyé. Votre conseiller va le vérifier.',fileRule:'PDF, JPG, PNG ou WebP · 10 Mo max',tooBig:'Le fichier dépasse 10 Mo.',badType:'Utilisez PDF, JPG, PNG ou WebP.',
  tasks:'Tâches',noTasks:'Aucune tâche dans cette étape.',due:'Échéance',overdue:'En retard',today:'Aujourd’hui',inDays:'dans {n} jours',docsDone:'{a} sur {b} validés',
  st:{profile:'Profil en cours',preparing:'Candidature en préparation',submitted:'Candidature envoyée',awaiting:'En attente de l’université',offer:'Offre reçue',visa:'Visa en cours',travel:'Préparation du voyage',enrolled:'Inscrit',on_hold:'En pause',withdrawn:'Retiré'},
  profileTitle:'Votre profil',save:'Enregistrer',saved:'Enregistré.',fullName:'Nom complet',phone:'Téléphone (avec indicatif)',residence:'Pays de résidence',nationality:'Nationalité',dob:'Date de naissance',level:'Niveau d’études',subject:'Domaine',english:'Test / niveau d’anglais',preferred:'Université souhaitée',preferredProg:'Programme souhaité',
  destinations:'Destinations',active:'Actif',soon:'Bientôt',signOut:'Se déconnecter',website:'Retour au site',refresh:'Actualiser',swipe:'Glissez à gauche ou à droite pour changer de section',updated:'Mis à jour',you:'Vous',system:'Mise à jour',empty:'Pas encore de message. Dites bonjour à votre conseiller.',
  ob:{step:'Étape {a} sur {b}',where:'Où voulez-vous étudier ?',whereText:'Global Passport ouvre avec le Royaume-Uni. Le Canada et les États-Unis arrivent.',from:'D’où venez-vous ?',fromText:'MUK Talent se prépare à accueillir des étudiants de tous les pays. Cela nous aide à choisir le bon conseiller et les bons documents.',
   plan:'Votre projet d’études',planText:'Une première idée suffit. Votre conseiller l’affinera avec vous.',confirm:'Ouvrir mon Global Passport',confirmText:'Votre conseiller est attribué automatiquement dès la création du dossier.',consent:'J’accepte que MUK Talent conserve mon dossier pour accompagner ma candidature, comme décrit dans la politique de confidentialité.',next:'Continuer',back:'Retour',create:'Créer mon Global Passport',creating:'Création du dossier…',assigned:'Votre conseiller',welcome:'Bienvenue, {name}',chooseLevel:'Choisir un niveau',intakePh:'ex. septembre 2027',subjectPh:'ex. Informatique',englishPh:'ex. IELTS 6.5 / pas encore',choose:'Choisir…'}}
};
const LEVELS={en:["Foundation","Undergraduate","Postgraduate taught (Master's)","Postgraduate research (PhD)","English language course","Not sure yet"],fr:["Foundation (année préparatoire)","Licence (Undergraduate)","Master (Postgraduate taught)","Doctorat (PhD)","Cours d’anglais","Je ne sais pas encore"]};
const LEVEL_VALUES=LEVELS.en;
const STAGE_ICON={registration:'user',university:'cap',documents:'doc',application:'send',offer:'spark',visa:'visa',travel:'plane',arrival:'pin'};
const STAGE_FR={registration:'Inscription et évaluation',university:'Choix de l’université',documents:'Préparation des documents',application:'Candidature',offer:'Offre universitaire',visa:'Préparation du visa',travel:'Préparation du voyage',arrival:'Arrivée à destination'};
const DEST_FR={UK:'Royaume-Uni',CA:'Canada',US:'États-Unis'};
const MAX=10*1024*1024,MIMES=['application/pdf','image/jpeg','image/png','image/webp'];

export async function mountStudentPortal({api,client,who,onLogout}){
 linkCss('gpPortalCss','/admin/student-portal.css');
 let mainEl=null;
 document.getElementById('studentPortal')?.remove();
 let lang=gateLang();const tx=()=>TX[lang]||TX.en;const L=k=>k.split('.').reduce((o,p)=>o?.[p],tx())??k.split('.').reduce((o,p)=>o?.[p],TX.en)??k;const fill=(s,v)=>String(s).replace(/\{(\w+)\}/g,(_,k)=>v[k]??'');
 const root=E('div',undefined,'gp-app');root.id='studentPortal';root.lang=lang;document.body.append(root);
 applyV17({role:'student',lang});let updates=null,updatesLang=null,msgNotify=null;
 const logout=async()=>{watcher?.stop();root.remove();await onLogout();};
 idleLogout(root,logout);linkChatCss();
 let summary=null,watcher=null,dockEl=null;
 const paintDots=()=>{root.querySelectorAll('.mkc-heart').forEach(b=>setDot(b,summary));const n=summary?.chat_unread||0;root.querySelectorAll('[data-gp-msg]').forEach(b=>{b.querySelector('.gp-badge')?.remove();if(n)b.append(E('i',n>9?'9+':n,'gp-badge'));});};
 const openChat=()=>openMessenger({api,lang,onChange:()=>watcher?.refresh()});
 const openNotif=()=>openNotifications({api,lang,summary,onOpenChat:openChat,onChange:()=>watcher?.refresh()});
 let data=null,page='journey',openStage=null;const pages=()=>['journey','documents','plan','messages','profile'].map(id=>[id,L('pages.'+id)]);
 const stageName=k=>lang==='fr'?STAGE_FR[k]:(data?.stage_titles?.[k]||k);
 const destName=k=>lang==='fr'?DEST_FR[k]:({UK:'United Kingdom',CA:'Canada',US:'United States'}[k]);
 const levelLabel=v=>{const i=LEVEL_VALUES.indexOf(v);return i<0?v:LEVELS[lang][i];};

 if(who.kind==='new'){onboarding();return;}
 await load();

 async function load(silent){try{data=(await api('/api/passport/me')).data;render();if(!watcher){msgNotify=messageNotifier({lang,onOpen:()=>openChat()});watcher=watchNotifications(api,x=>{summary=x;paintDots();msgNotify(x);});}}catch(e){if(!silent){root.replaceChildren(errorView(e.message));}}}
 function errorView(text){const w=E('div',undefined,'gp-error');w.append(gi('alert'),E('h2','Global Passport'),E('p',text),btn(L('refresh'),()=>load(),'gp-btn gp-primary','refresh'),btn(L('signOut'),logout,'gp-btn gp-ghost','logout'));return w;}

 // ---------------- Onboarding ----------------
 function onboarding(){
  const v={destination:'UK',full_name:who.name||'',country_residence:'',nationality:'',phone:'',study_level:'',subject:'',intake:'',english_test:'',consent:false};let step=0;
  const shell=E('section',undefined,'gp-onboard');root.replaceChildren(shell);
  const draw=()=>{shell.replaceChildren();const total=4;
   const top=E('header',undefined,'gp-ob-top');top.append(E('span',L('brand'),'gp-brand'),langToggle(()=>draw()));
   const bar=E('div',undefined,'gp-ob-progress');for(let i=0;i<total;i++){const s=E('i');if(i<=step)s.className='on';bar.append(s);}
   const card=E('form',undefined,'gp-ob-card');card.noValidate=false;card.append(E('p',fill(L('ob.step'),{a:step+1,b:total}),'gp-kicker'));
   const actions=E('div',undefined,'gp-ob-actions');
   if(step===0){card.append(E('h1',L('ob.where')),E('p',L('ob.whereText'),'gp-muted'));const g=E('div',undefined,'gp-dest-grid');
    for(const [code,flagCls,on] of [['UK','uk',true],['CA','ca',false],['US','us',false]]){const o=E('button',undefined,'gp-dest'+(on?'':' is-soon')+(v.destination===code?' is-on':''));o.type='button';o.disabled=!on;o.setAttribute('aria-pressed',String(v.destination===code));const f=E('span',undefined,'gp-flag gp-flag-'+flagCls);f.setAttribute('aria-hidden','true');o.append(f,E('strong',destName(code)),E('small',on?L('active'):L('soon')));if(on)o.onclick=()=>{v.destination=code;draw();};g.append(o);}card.append(g);}
   if(step===1){card.append(E('h1',L('ob.from')),E('p',L('ob.fromText'),'gp-muted'));
    card.append(field(L('fullName'),input('obName',v.full_name,x=>v.full_name=x,{autocomplete:'name',required:true,minLength:2,maxLength:120})));
    const r=countrySelect('obRes',lang,v.country_residence,L('ob.choose'));r.onchange=()=>{v.country_residence=r.value;if(!v.nationality){v.nationality=r.value;n.value=r.value;}};card.append(field(L('residence'),r));
    const n=countrySelect('obNat',lang,v.nationality,L('ob.choose'));n.onchange=()=>{v.nationality=n.value;};card.append(field(L('nationality'),n));
    card.append(field(L('phone'),input('obPhone',v.phone,x=>v.phone=x,{type:'tel',autocomplete:'tel',placeholder:'+212 6 00 00 00 00',pattern:'\\+?[0-9 ().-]{6,24}'})));}
   if(step===2){card.append(E('h1',L('ob.plan')),E('p',L('ob.planText'),'gp-muted'));const lv=E('select');lv.id='obLevel';lv.required=true;lv.append(new Option(L('ob.chooseLevel'),''));LEVEL_VALUES.forEach((x,i)=>lv.append(new Option(LEVELS[lang][i],x)));lv.value=v.study_level;lv.onchange=()=>v.study_level=lv.value;card.append(field(L('level'),lv));
    card.append(field(L('subject'),input('obSubject',v.subject,x=>v.subject=x,{required:true,minLength:2,maxLength:120,placeholder:L('ob.subjectPh')})));
    const two=E('div',undefined,'gp-two');two.append(field(L('intake'),input('obIntake',v.intake,x=>v.intake=x,{maxLength:40,placeholder:L('ob.intakePh')})),field(L('english'),input('obEnglish',v.english_test,x=>v.english_test=x,{maxLength:80,placeholder:L('ob.englishPh')})));card.append(two);}
   if(step===3){card.append(E('h1',L('ob.confirm')),E('p',L('ob.confirmText'),'gp-muted'));const sum=E('dl',undefined,'gp-summary');for(const [k,val]of [[L('destination'),destName(v.destination)],[L('residence'),countryName(v.country_residence,lang)],[L('nationality'),countryName(v.nationality,lang)],[L('level'),levelLabel(v.study_level)],[L('subject'),v.subject],[L('intake'),v.intake||'—']]){sum.append(E('dt',k),E('dd',val));}card.append(sum);
    const c=E('label',undefined,'gp-check');const cb=E('input');cb.type='checkbox';cb.required=true;cb.checked=v.consent;cb.onchange=()=>v.consent=cb.checked;c.append(cb,E('span',L('ob.consent')));card.append(c);}
   const msg=E('p','','gp-form-msg');msg.setAttribute('role','status');
   if(step>0)actions.append(btn(L('ob.back'),()=>{step--;draw();},'gp-btn gp-ghost','back'));
   const next=E('button',undefined,'gp-btn gp-primary');next.type='submit';next.append(E('span',step===3?L('ob.create'):L('ob.next')),gi('chevron'));actions.append(next);card.append(actions,msg);
   card.onsubmit=async e=>{e.preventDefault();if(!card.reportValidity())return;if(step<3){step++;draw();shell.querySelector('input,select')?.focus();return;}
    next.disabled=true;msg.textContent=L('ob.creating');
    try{const body={...v};for(const k of ['phone','intake','english_test'])if(!body[k])body[k]=null;data=(await api('/api/passport/register',{method:'POST',body:JSON.stringify(body)})).data;celebrate();}
    catch(err){msg.textContent=err.message;msg.classList.add('error');next.disabled=false;}};
   shell.append(top,bar,card);
  };
  draw();
 }
 function celebrate(){const s=E('section',undefined,'gp-welcome');const c=data.counsellor;const card=E('div',undefined,'gp-welcome-card');card.append(ring(data.readiness,'lg'),E('p',data.student.reference,'gp-kicker'),E('h1',fill(L('ob.welcome'),{name:data.student.full_name.split(' ')[0]})));
  if(c){const who=E('div',undefined,'gp-welcome-c');who.append(avatar(c.full_name,c.avatar_url,'gp-avatar gp-avatar-lg'),E('small',L('ob.assigned')),E('strong',c.full_name),E('span',c.job_title,'gp-muted'));card.append(who);}else card.append(E('p',L('noCounsellorText'),'gp-muted'));
  card.append(btn(L('journeyTitle'),()=>render(),'gp-btn gp-primary','chevron'));s.append(card);root.replaceChildren(s);}
 function input(id,value,set,attrs={}){const i=E('input');i.id=id;i.value=value||'';for(const [k,val]of Object.entries(attrs))i[k]=val;i.oninput=()=>set(i.value);return i;}
 function field(label,control){const w=E('div',undefined,'gp-field');const l=E('label',label);l.htmlFor=control.id;w.append(l,control);return w;}
 function langMenu(after){const box=E('div',undefined,'gp-langm');const b=E('button',undefined,'gp-langm-btn');b.type='button';b.setAttribute('aria-haspopup','true');b.setAttribute('aria-expanded','false');b.setAttribute('aria-label',L('language')+' : '+(lang==='fr'?'Français':'English'));b.append(gi('globe'),E('span',lang.toUpperCase(),'gp-langm-code'));const menu=E('div',undefined,'gp-langm-menu');menu.setAttribute('role','menu');menu.hidden=true;
  for(const [code,name] of [['en','English'],['fr','Français']]){const o=E('button',undefined);o.type='button';o.setAttribute('role','menuitemradio');o.setAttribute('aria-checked',String(lang===code));o.lang=code;o.append(E('b',code.toUpperCase()),E('span',name));o.onclick=()=>{lang=code;try{localStorage.setItem('gp-lang',code);}catch{}root.lang=code;after();};menu.append(o);}
  const shut=e=>{if(!box.contains(e.target)){menu.hidden=true;b.setAttribute('aria-expanded','false');document.removeEventListener('click',shut,true);}};b.onclick=()=>{menu.hidden=!menu.hidden;b.setAttribute('aria-expanded',String(!menu.hidden));if(!menu.hidden)document.addEventListener('click',shut,true);};box.onkeydown=e=>{if(e.key==='Escape'){menu.hidden=true;b.setAttribute('aria-expanded','false');b.focus();}};box.append(b,menu);return box;}
 function langToggle(after){const g=E('div',undefined,'gp-lang');g.setAttribute('role','group');g.setAttribute('aria-label','Language');for(const code of ['en','fr']){const b=E('button',code.toUpperCase());b.type='button';b.setAttribute('aria-pressed',String(lang===code));b.onclick=()=>{lang=code;try{localStorage.setItem('gp-lang',code);}catch{}root.lang=code;after();};g.append(b);}return g;}

 // ---------------- Dashboard shell ----------------
 // mainEl declared at mount start
 function render(dir){
  const s=data.student;root.replaceChildren();root.lang=lang;
  const top=E('header',undefined,'gp-top gp-top-ig');const brand=E('a',undefined,'gp-top-brand');brand.href='/';brand.setAttribute('aria-label',L('website'));const wm=E('img',undefined,'gp-logo');wm.src='/assets/brand/logo-ivory.svg';wm.alt='MUK Talent';wm.width=374;wm.height=72;brand.append(wm);
  const right=E('div',undefined,'gp-top-right');const heart=heartButton(lang,openNotif);heart.classList.add('gp-heart');right.append(langMenu(()=>render()),heart);top.append(brand,right);hideOnScroll(top);
  const side=E('nav',undefined,'gp-side');side.setAttribute('aria-label','Global Passport');for(const [id,label]of pages()){const b=btn(label,()=>go(id),'gp-side-btn',{journey:'globe',documents:'doc',plan:'calendar',messages:'chat',profile:'user'}[id]);if(id===page)b.setAttribute('aria-current','page');if(id==='messages')b.dataset.gpMsg='1';side.append(b);}
  const webSide=E('a','\u2190 '+L('website'),'gp-side-btn gp-side-web');webSide.href='/';side.append(webSide);const out=btn(L('signOut'),logout,'gp-side-btn gp-side-out','logout');side.append(out);
  mainEl=E('main',undefined,'gp-main');mainEl.dataset.page=page;if(dir&&!reducedMotion())mainEl.classList.add('enter-'+dir);
  const head=E('div',undefined,'gp-page-head');head.append(E('p',page==='journey'?L('brand')+' · '+destName(s.destination).toUpperCase():L('journeyTitle').toUpperCase(),'gp-kicker'),E('h1',page==='journey'?L('journeyTitle'):L('pages.'+page)));mainEl.append(head);
  ({journey,documents,plan,messages,profile})[page]();
  if(!dockEl){dockEl=E('nav',undefined,'gp-dock gp-dock-ig');}const dock=dockEl;dock.replaceChildren();dock.setAttribute('aria-label','Global Passport');for(const [id,label]of pages()){const b=E('button',undefined);b.type='button';b.setAttribute('aria-label',label);b.title=label;b.append(gi({journey:'globe',documents:'doc',plan:'calendar',messages:'chat',profile:'user'}[id]),E('small',label));if(id===page)b.setAttribute('aria-current','page');if(id==='messages')b.dataset.gpMsg='1';b.onclick=()=>go(id);dock.append(b);}
  root.append(top,side,mainEl,dock);paintDots();
 }
 function step(d){const ids=pages().map(p=>p[0]);const i=ids.indexOf(page)+d;if(i<0||i>=ids.length)return;go(ids[i],d>0?'left':'right');}
 function go(id,dir){if(id==='messages'){openChat();return;}if(id===page)return;const ids=pages().map(p=>p[0]);dir=dir||(ids.indexOf(id)>ids.indexOf(page)?'left':'right');page=id;render(dir);window.scrollTo({top:0});if(id==='messages')load(true);}
 function unreadCount(){return 0;}
 function statusPill(st){const p=E('span',L('st.'+st),'gp-status gp-status-'+st);p.prepend(E('i'));return p;}

 // ---------------- Journey (home) ----------------
 function journey(){
  const s=data.student,c=data.counsellor;
  const hero=E('section',undefined,'gp-hero');
  const pass=passportPage(s);
  const ready=E('article',undefined,'gp-ready');ready.append(E('p',L('readiness'),'gp-kicker'),ring(data.readiness,'xl'));const done=data.documents.filter(d=>d.required&&d.status==='approved').length,req=data.documents.filter(d=>d.required).length;ready.append(E('p',fill(L('docsDone'),{a:done,b:req}),'gp-muted'),statusPill(s.application_status));
  hero.append(pass,ready);mainEl.append(hero);
  {const st=data.stages||[],sd=st.filter(x=>x.status==='done').length;const prog=st.length?{label:lang==='fr'?'Étapes terminées':'Stages completed',value:sd,max:st.length,text:sd+' / '+st.length}:null;
   if(!updates||updatesLang!==lang){updates?.stop();updatesLang=lang;updates=mountUpdates({api,userKey:'student:'+(s.reference||s.id||'me'),lang,name:s.first_name||who.name,progress:prog,labels:{stage:stageName},onOpen:it=>{if(it.type==='message')openChat();else if(it.type==='document')go('documents');else if(it.type==='task'||it.type==='event')go('plan');else if(it.type==='stage'){openStage=it.key;go('plan');}}});}else{updates.setProgress(prog);updates.refresh();}
   mainEl.append(updates.el);}
  const facts=E('section',undefined,'gp-facts');
  facts.append(fact('globe',L('destination'),destName(s.destination)),fact('cap',L('university'),s.university||L('toChoose'),!s.university),fact('book',L('programme'),s.programme||s.subject||L('toChoose'),!s.programme),fact('calendar',L('intake'),s.intake||'—'));
  mainEl.append(facts);
  const grid=E('div',undefined,'gp-grid');
  const cc=E('section',undefined,'gp-panel gp-counsellor');cc.append(E('p',L('counsellor'),'gp-kicker'));
  if(c){const row=E('div',undefined,'gp-c-row');const txt=E('div');txt.append(E('strong',c.full_name),E('span',c.job_title,'gp-muted'));if(c.languages)txt.append(E('small',[].concat(c.languages).join(' · '),'gp-muted'));row.append(avatar(c.full_name,c.avatar_url,'gp-avatar gp-avatar-lg'),txt);cc.append(row);const acts=E('div',undefined,'gp-actions');acts.append(btn(L('message'),()=>go('messages'),'gp-btn gp-primary','chat'));if(c.email){const a=E('a',undefined,'gp-btn gp-ghost');a.href='mailto:'+c.email;a.append(gi('send'),E('span',c.email));acts.append(a);}cc.append(acts);}
  else{cc.append(E('strong',L('noCounsellor')),E('p',L('noCounsellorText'),'gp-muted'));}
  grid.append(cc);
  const pend=E('section',undefined,'gp-panel');pend.append(panelHead(L('pendingDocs'),()=>go('documents')));const pd=data.documents.filter(d=>['requested','rejected'].includes(d.status)).slice(0,4);for(const d of pd)pend.append(docRow(d,true));if(!pd.length)pend.append(E('p',fill(L('docsDone'),{a:done,b:req}),'gp-muted'));grid.append(pend);
  const dates=E('section',undefined,'gp-panel');dates.append(panelHead(L('nextDates'),()=>go('plan')));const upcoming=upcomingItems().slice(0,4);for(const u of upcoming)dates.append(dateRow(u));if(!upcoming.length)dates.append(E('p',L('noDates'),'gp-muted'));grid.append(dates);
  mainEl.append(grid);
  const map=E('section',undefined,'gp-panel gp-map-panel');map.append(E('p',L('journeyTitle'),'gp-kicker'));map.append(journeyMap(false));mainEl.append(map);
  const last=data.messages.filter(m=>m.sender_role!=='student').slice(-1)[0];if(last){const l=E('section',undefined,'gp-panel gp-latest');l.append(E('p',L('latest'),'gp-kicker'),E('p',last.body,'gp-latest-body'),E('small',ago(last.created_at,lang),'gp-muted'));l.onclick=()=>go('messages');mainEl.append(l);}
 }
 function passportPage(s){
  const pass=E('article',undefined,'gp-passport gp-pp2');pass.setAttribute('aria-label','Global Passport '+s.reference);
  const band=E('header',undefined,'gp-pp2-band');const t=E('div',undefined,'gp-pp2-issuer');t.append(E('strong','MUK TALENT'),E('span','GLOBAL PASSPORT · PASSEPORT'));const f=E('span',undefined,'gp-flag gp-flag-'+s.destination.toLowerCase());f.setAttribute('aria-hidden','true');band.append(t,f);
  const grid=E('div',undefined,'gp-pp2-grid');
  const ph=E('figure',undefined,'gp-pp2-photo');if(data.photo_url){const img=E('img');img.src=data.photo_url;img.alt=s.full_name;img.decoding='async';img.onerror=()=>{img.remove();ph.classList.add('is-empty');};ph.append(img);}else ph.classList.add('is-empty');
  const sil=E('span',undefined,'gp-pp2-sil');sil.setAttribute('aria-hidden','true');sil.append(gi('user'));ph.append(sil);
  const up=E('label',undefined,'gp-pp2-up');const fi=E('input');fi.type='file';fi.accept='image/jpeg,image/png,image/webp';fi.setAttribute('aria-label',data.photo_url?L('photoChange'):L('photoAdd'));const upTxt=E('span',data.photo_url?L('photoChange'):L('photoAdd'));up.append(gi('upload'),upTxt,fi);up.title=L('photoHint');ph.append(up);
  fi.onchange=async()=>{const file=fi.files?.[0];if(!file)return;const mime=file.type;if(!['image/jpeg','image/png','image/webp'].includes(mime)||file.size>5*1024*1024){alert(L('photoHint'));fi.value='';return;}up.classList.add('is-busy');upTxt.textContent=L('photoBusy');
   try{const st=(await api('/api/passport/photo/start',{method:'POST',body:JSON.stringify({mime,size:file.size})})).data;const r=await fetch(st.signed_url,{method:'PUT',headers:{'Content-Type':mime,'x-upsert':'false'},body:file});if(!r.ok)throw new Error(L('photoHint'));const fin=(await api('/api/passport/photo/finish',{method:'POST',body:JSON.stringify({path:st.path,mime})})).data;data.photo_url=fin.photo_url;render();}
   catch(err){alert(err.message);up.classList.remove('is-busy');upTxt.textContent=data.photo_url?L('photoChange'):L('photoAdd');}finally{fi.value='';}};
  const parts=String(s.full_name||'').trim().split(/\s+/);const surname=(parts.length>1?parts.slice(-1):parts).join(' ').toUpperCase(),given=(parts.length>1?parts.slice(0,-1).join(' '):'').toUpperCase()||'—';
  const dfmt=v=>{if(!v)return '—';const d=new Date(String(v).length===10?v+'T12:00:00Z':v);return Number.isNaN(d.getTime())?'—':new Intl.DateTimeFormat(lang==='fr'?'fr-FR':'en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'}).format(d).toUpperCase().replace(/\./g,'');};
  const dl=E('div',undefined,'gp-pp2-fields');const cell=(k,v,cls='')=>{const c=E('div',undefined,'gp-pp2-f '+cls);c.append(E('small',k),E('b',v));dl.append(c);};
  cell(L('ppType')+' / Type','P','is-s');cell(L('ppCode')+' / Code','MUK','is-s');cell(L('ppNo')+' / No.',s.reference,'is-no');
  cell(L('surname')+' / Surname',surname,'is-w');cell(L('given')+' / Given names',given,'is-w');
  cell(L('ppNat'),(countryName(s.nationality,lang)||s.nationality||'—').toUpperCase(),'is-w');cell(L('ppDob'),dfmt(s.date_of_birth));cell(L('ppDest'),(destName(s.destination)||'').toUpperCase());
  cell(L('ppIssue'),dfmt(s.created_at));cell(L('ppAuth'),'MUK TALENT UK');
  const sig=E('div',undefined,'gp-pp2-sign');sig.append(E('small',L('ppSign')),E('span',s.full_name,'gp-pp2-sig'));
  const info=E('div',undefined,'gp-pp2-info');info.append(dl,sig);grid.append(ph,info);
  const mrz=E('div',undefined,'gp-pp2-mrz');mrz.setAttribute('aria-hidden','true');for(const line of mrz2(s))mrz.append(E('span',line));
  const seal=E('span',undefined,'gp-pp2-seal');seal.setAttribute('aria-hidden','true');const sm=E('img');sm.src='/assets/brand/mark-gold.svg';sm.alt='';seal.append(sm);
  pass.append(band,grid,mrz,seal,E('span',undefined,'gp-pp-holo'));return pass;}
 function mrz2(s){const cl=v=>String(v||'').normalize('NFKD').replace(/[^A-Za-z0-9 ]/g,'').toUpperCase().trim().replace(/\s+/g,'<');const w=[7,3,1];const val=c=>c==='<'?0:/\d/.test(c)?+c:c.charCodeAt(0)-55;const chk=v=>String([...v].reduce((a,c,i)=>a+val(c)*w[i%3],0)%10);
  const n=cl(s.full_name).split('<').filter(Boolean);const sur=n.length>1?n.slice(-1)[0]:n[0]||'';const giv=n.length>1?n.slice(0,-1).join('<'):'';const l1=('P<MUK'+sur+'<<'+giv).padEnd(44,'<').slice(0,44);
  const no=cl(s.reference).replace(/</g,'').padEnd(9,'<').slice(0,9);const nat=(cl(s.nationality)+'<').padEnd(3,'<').slice(0,3);const dob=s.date_of_birth?s.date_of_birth.slice(2,4)+s.date_of_birth.slice(5,7)+s.date_of_birth.slice(8,10):'<<<<<<';const exp=(()=>{const d=new Date(s.created_at||Date.now());d.setUTCFullYear(d.getUTCFullYear()+5);return d.toISOString().slice(2,4)+d.toISOString().slice(5,7)+d.toISOString().slice(8,10);})();
  const body=no+chk(no)+nat+dob+chk(dob)+'<'+exp+chk(exp);const l2=(body+'MUKTALENT').padEnd(42,'<').slice(0,42);return [l1,l2+chk(l2.slice(0,10)+l2.slice(13,20)+l2.slice(21,43))+'<'];}
 function mrzLine(s){const clean=v=>String(v||'').normalize('NFKD').replace(/[^A-Za-z ]/g,'').toUpperCase().trim().replace(/\s+/g,'<');const n=clean(s.full_name).split('<');return ('P<'+(s.destination==='UK'?'GBR':s.destination)+(n.slice(-1)[0]||'')+'<<'+n.slice(0,-1).join('<')).padEnd(44,'<').slice(0,44)+'\n'+(s.reference.replace(/-/g,'')+'<'+s.nationality+'<MUKTALENT').padEnd(44,'<').slice(0,44);}
 function fact(ic,label,value,muted){const a=E('article',undefined,'gp-fact'+(muted?' is-muted':''));const i=E('span',undefined,'gp-fact-i');i.append(gi(ic));a.append(i,E('small',label),E('strong',value));return a;}
 function panelHead(title,more){const h=E('div',undefined,'gp-panel-head');h.append(E('h2',title));if(more)h.append(btn('',more,'gp-icon-btn','chevron'));return h;}
 function upcomingItems(){const items=[...data.events.map(e=>({title:e.title,date:e.starts_on,kind:e.kind})),...data.tasks.filter(t=>t.status==='open'&&t.due_date).map(t=>({title:t.title,date:t.due_date,kind:'task'}))];return items.sort((a,b)=>a.date.localeCompare(b.date)).filter(x=>daysUntil(x.date)>=-14);}
 function dateRow(u){const r=E('div',undefined,'gp-date-row');const d=new Date(u.date+'T12:00:00Z');const cal=E('span',undefined,'gp-cal');cal.append(E('b',d.getUTCDate()),E('small',new Intl.DateTimeFormat(lang==='fr'?'fr-FR':'en-GB',{month:'short',timeZone:'UTC'}).format(d)));const n=daysUntil(u.date);const when=n<0?L('overdue'):n===0?L('today'):fill(L('inDays'),{n});const t=E('div');t.append(E('strong',u.title),E('small',when,n<0?'gp-bad':'gp-muted'));r.append(cal,t);if(n<0)r.classList.add('is-overdue');return r;}
 function journeyMap(detailed){const ol=E('ol',undefined,'gp-journey'+(detailed?' is-detailed':''));
  for(const st of data.stages){const li=E('li',undefined,'gp-stage is-'+st.status);const node=E('span',undefined,'gp-node');node.append(gi(st.status==='done'?'check':STAGE_ICON[st.stage_key]));const txt=E('div',undefined,'gp-stage-txt');txt.append(E('strong',stageName(st.stage_key)),E('small',L('stage.'+st.status)));li.append(node,txt);
   if(detailed){const tasks=data.tasks.filter(t=>t.stage_key===st.stage_key),docs=data.documents.filter(d=>d.stage_key===st.stage_key),ev=data.events.filter(e=>e.kind===({visa:'visa',travel:'travel',arrival:'travel',application:'deadline'})[st.stage_key]);
    const count=E('span',tasks.filter(t=>t.status==='done').length+'/'+tasks.length,'gp-stage-count');if(tasks.length)txt.append(count);
    const open=openStage===st.stage_key||(openStage===null&&st.status==='in_progress');li.classList.toggle('is-open',open);
    const tog=E('button',undefined,'gp-stage-toggle');tog.type='button';tog.setAttribute('aria-expanded',String(open));tog.setAttribute('aria-label',stageName(st.stage_key));tog.append(gi('chevron'));tog.onclick=()=>{openStage=open?'':st.stage_key;render();};li.append(tog);
    if(open){const body=E('div',undefined,'gp-stage-body');body.append(E('h3',L('tasks')));for(const t of tasks)body.append(taskRow(t));if(!tasks.length)body.append(E('p',L('noTasks'),'gp-muted'));if(docs.length){body.append(E('h3',L('pages.documents')));for(const d of docs)body.append(docRow(d,true));}for(const e of ev)body.append(dateRow({title:e.title,date:e.starts_on}));li.append(body);}}
   ol.append(li);}
  return ol;}
 function taskRow(t){const r=E('label',undefined,'gp-task'+(t.status==='done'?' is-done':''));const cb=E('input');cb.type='checkbox';cb.checked=t.status==='done';cb.onchange=async()=>{cb.disabled=true;try{await api('/api/passport/tasks/'+t.id,{method:'POST',body:JSON.stringify({done:cb.checked})});t.status=cb.checked?'done':'open';r.classList.toggle('is-done',cb.checked);load(true);}catch(e){cb.checked=!cb.checked;alert(e.message);}finally{cb.disabled=false;}};const box=E('span',undefined,'gp-box');box.append(gi('check'));const txt=E('span',undefined,'gp-task-txt');txt.append(E('strong',t.title));if(t.detail)txt.append(E('small',t.detail,'gp-muted'));if(t.due_date&&t.status!=='done'){const n=daysUntil(t.due_date);txt.append(E('small',L('due')+' · '+fmtDate(t.due_date,lang),n<0?'gp-bad':'gp-muted'));}r.append(cb,box,txt);return r;}

 // ---------------- Documents ----------------
 function documents(){
  const done=data.documents.filter(d=>d.status==='approved').length;const sum=E('section',undefined,'gp-doc-summary');const bar=E('div',undefined,'gp-bar');const fillEl=E('i');fillEl.style.setProperty('--w',(data.documents.length?Math.round(done/data.documents.length*100):0)+'%');bar.append(fillEl);sum.append(E('strong',fill(L('docsDone'),{a:done,b:data.documents.length})),bar,E('small',L('fileRule'),'gp-muted'));mainEl.append(sum);
  for(const st of data.stages){const docs=data.documents.filter(d=>d.stage_key===st.stage_key);if(!docs.length)continue;const p=E('section',undefined,'gp-panel');p.append(E('h2',stageName(st.stage_key)));for(const d of docs)p.append(docRow(d));mainEl.append(p);}
 }
 function docRow(d,compact){const r=E('div',undefined,'gp-doc is-'+d.status);const i=E('span',undefined,'gp-doc-i');i.append(gi(d.status==='approved'?'check':d.status==='rejected'?'alert':'doc'));const txt=E('div',undefined,'gp-doc-txt');txt.append(E('strong',d.label));const meta=E('small',L('doc.'+d.status),'gp-doc-state');txt.append(meta);if(d.status==='rejected'&&d.review_note)txt.append(E('small',d.review_note,'gp-bad'));if(!compact&&d.file_name)txt.append(E('small',d.file_name,'gp-muted'));r.append(i,txt);
  const acts=E('div',undefined,'gp-doc-acts');if(d.file_name&&!compact)acts.append(btn('',async()=>{try{const u=(await api('/api/passport/documents/'+d.id+'/url')).data.url;window.open(u,'_blank','noopener');}catch(e){alert(e.message);}},'gp-icon-btn','eye'));
  if(d.status!=='approved'&&(!compact||d.status!=='uploaded')){const f=E('input');f.type='file';f.accept=MIMES.join(',');f.hidden=true;f.id='f-'+d.id;const up=btn(d.status==='requested'?L('upload'):L('replace'),()=>f.click(),'gp-btn gp-sm'+(d.status==='requested'||d.status==='rejected'?' gp-primary':' gp-ghost'),'upload');f.onchange=()=>upload(d,f.files[0],up,meta);acts.append(f,up);}
  r.append(acts);return r;}
 async function upload(d,file,b,meta){if(!file)return;if(!MIMES.includes(file.type))return alert(L('badType'));if(file.size>MAX)return alert(L('tooBig'));
  b.disabled=true;meta.textContent=L('uploading');
  try{const u=(await api('/api/passport/documents/'+d.id+'/upload-url',{method:'POST',body:JSON.stringify({file_name:file.name.slice(0,160),mime:file.type,size:file.size})})).data;
   const r=await client.storage.from(u.bucket).uploadToSignedUrl(u.path,u.token,file,{contentType:file.type});if(r.error)throw new Error(r.error.message);
   await api('/api/passport/documents/'+d.id+'/uploaded',{method:'POST',body:JSON.stringify({path:u.path,file_name:file.name.slice(0,160),mime:file.type,size:file.size})});
   meta.textContent=L('uploaded');await load(true);}
  catch(e){meta.textContent=e.message;b.disabled=false;}}

 // ---------------- Plan ----------------
 function plan(){const p=E('section',undefined,'gp-panel');p.append(journeyMap(true));mainEl.append(p);const d=E('section',undefined,'gp-panel');d.append(E('h2',L('nextDates')));const u=upcomingItems();for(const x of u)d.append(dateRow(x));if(!u.length)d.append(E('p',L('noDates'),'gp-muted'));mainEl.append(d);}

 // ---------------- Messages ----------------
 function messages(){const wrap=E('section',undefined,'gp-panel gp-thread-panel');const c=data.counsellor;const head=E('div',undefined,'gp-thread-head');head.append(avatar(c?.full_name||'MUK Talent',c?.avatar_url),E('div'));head.lastChild.append(E('strong',c?.full_name||L('noCounsellor')),E('small',c?.job_title||'MUK Talent','gp-muted'));wrap.append(head);
  const list=E('div',undefined,'gp-thread');list.setAttribute('aria-live','polite');for(const m of data.messages)list.append(bubble(m));if(!data.messages.length)list.append(E('p',L('empty'),'gp-muted gp-empty'));wrap.append(list);
  const form=E('form',undefined,'gp-composer');const ta=E('textarea');ta.rows=1;ta.maxLength=2000;ta.placeholder=L('write');ta.setAttribute('aria-label',L('write'));ta.oninput=()=>{ta.style.height='auto';ta.style.height=Math.min(140,ta.scrollHeight)+'px';};ta.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey&&!matchMedia('(pointer: coarse)').matches){e.preventDefault();form.requestSubmit();}};const send=E('button',undefined,'gp-send');send.type='submit';send.setAttribute('aria-label',L('send'));send.append(gi('send'));form.append(ta,send);
  form.onsubmit=async e=>{e.preventDefault();const body=ta.value.trim();if(!body)return;send.disabled=true;try{await api('/api/passport/messages',{method:'POST',body:JSON.stringify({body})});ta.value='';await load(true);document.querySelector('.gp-composer textarea')?.focus();}catch(err){alert(err.message);}finally{send.disabled=false;}};
  wrap.append(form);mainEl.append(wrap);requestAnimationFrame(()=>{list.scrollTop=list.scrollHeight;});
  const poll=setInterval(()=>{if(!root.isConnected||page!=='messages'){clearInterval(poll);return;}if(!document.hidden&&!ta.value)load(true);},30000);}
 function bubble(m){const b=E('div',undefined,'gp-msg gp-msg-'+m.sender_role+(m.kind==='update'?' is-update':''));if(m.sender_role==='system'||m.kind==='update'){const i=E('span',undefined,'gp-msg-i');i.append(gi(m.sender_role==='system'?'spark':'flag'));b.append(i);}const t=E('div',undefined,'gp-msg-body');t.append(E('p',m.body),E('small',(m.sender_role==='student'?L('you'):m.sender_role==='system'?L('system'):(data.counsellor?.full_name||'MUK Talent'))+' · '+ago(m.created_at,lang)));b.append(t);return b;}

 // ---------------- Profile ----------------
 function profile(){const s=data.student;const f=E('form',undefined,'gp-panel gp-profile');f.append(E('h2',L('profileTitle')));const v={};const add=(k,label,control)=>{f.append(field(label,control));};
  const text=(k,label,attrs={})=>{const i=input('pf-'+k,s[k],x=>v[k]=x,attrs);add(k,label,i);};
  text('full_name',L('fullName'),{required:true,minLength:2,maxLength:120});text('phone',L('phone'),{type:'tel',pattern:'\\+?[0-9 ().-]{6,24}'});
  const two=E('div',undefined,'gp-two');const r=countrySelect('pf-res',lang,s.country_residence);r.onchange=()=>v.country_residence=r.value;const n=countrySelect('pf-nat',lang,s.nationality);n.onchange=()=>v.nationality=n.value;two.append(field(L('residence'),r),field(L('nationality'),n));f.append(two);
  const dob=input('pf-dob',s.date_of_birth,x=>v.date_of_birth=x,{type:'date'});add('dob',L('dob'),dob);
  const lv=E('select');lv.id='pf-level';LEVEL_VALUES.forEach((x,i)=>lv.append(new Option(LEVELS[lang][i],x)));lv.value=s.study_level||LEVEL_VALUES[5];lv.onchange=()=>v.study_level=lv.value;add('level',L('level'),lv);
  text('subject',L('subject'),{required:true,minLength:2,maxLength:120});const t2=E('div',undefined,'gp-two');t2.append(field(L('intake'),input('pf-intake',s.intake,x=>v.intake=x,{maxLength:40})),field(L('english'),input('pf-eng',s.english_test,x=>v.english_test=x,{maxLength:80})));f.append(t2);
  text('university',L('preferred'),{maxLength:160});text('programme',L('preferredProg'),{maxLength:160});
  const msg=E('p','','gp-form-msg');msg.setAttribute('role','status');const save=E('button',L('save'),'gp-btn gp-primary');save.type='submit';f.append(save,msg);
  f.onsubmit=async e=>{e.preventDefault();if(!Object.keys(v).length)return;save.disabled=true;try{data=(await api('/api/passport/me',{method:'PATCH',body:JSON.stringify(v)})).data;msg.textContent=L('saved');msg.className='gp-form-msg ok';for(const k of Object.keys(v))delete v[k];}catch(err){msg.textContent=err.message;msg.className='gp-form-msg error';}finally{save.disabled=false;}};
  mainEl.append(f);
  const d=E('section',undefined,'gp-panel');d.append(E('h2',L('destinations')));const g=E('div',undefined,'gp-dest-grid gp-dest-mini');for(const [code,on]of [['UK',true],['CA',false],['US',false]]){const o=E('div',undefined,'gp-dest'+(on?' is-on':' is-soon'));const fl=E('span',undefined,'gp-flag gp-flag-'+code.toLowerCase());fl.setAttribute('aria-hidden','true');o.append(fl,E('strong',destName(code)),E('small',on?L('active'):L('soon')));g.append(o);}d.append(g);mainEl.append(d);
  const acc=E('section',undefined,'gp-panel gp-account');acc.append(E('h2','Account'),E('p',data.student.email,'gp-muted'),btn(L('signOut'),logout,'gp-btn gp-ghost','logout'));mainEl.append(acc);}
}
