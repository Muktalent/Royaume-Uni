// gateway-v1 · Unified login for MUK Talent team and Global Passport students.
// Matrix background with a slowly cycling hue, floating glass card, sign in / create account / reset.
const $=id=>document.getElementById(id);
export const GATE_TEXT={
 en:{back:'Back to website',chooseRole:'Who is signing in?',roleStudent:'Student',roleStudentSub:'Global Passport',roleTeam:'Team',roleTeamSub:'MUK Talent staff',welcomeStudent:'Welcome to your Global Passport',welcomeStudentText:'Track your application, documents and counsellor messages in one place.',welcomeTeam:'MUK Talent team access',welcomeTeamText:'Private workspace for MUK Talent staff. Use the email given by the administration.',remember:'Keep me signed in on this device today',noAccount:'New student?',createFree:'Create your free account',haveAccount:'Already have an account?',privacy:'Privacy',terms:'Terms',help:'Help',restoring:'Restoring your session…',dayEnded:'Your session ended for today. Please sign in again.',kicker:'GLOBAL PASSPORT · UNITED KINGDOM',headline:'The smart passport of the international student.',lede:'One secure file from your first university search to your first day on campus — with your counsellor beside you at every step.',open:'Open',soon:'Coming soon',secure:'Secure access',tabSignin:'Sign in',tabSignup:'Create account',welcome:'Welcome back',welcomeText:'Students and MUK Talent team use the same door. We open the right space for you.',email:'Email address',password:'Password',signin:'Sign in',forgot:'Forgot password?',start:'Start your Global Passport',startText:'Free for students. Your counsellor is assigned automatically.',fullName:'Full name (as in your passport)',newPassword:'Create a password',passHint:'At least 10 characters. A short sentence works well.',consent:'I accept the <a href="/terms/" target="_blank" rel="noopener">terms</a> and the <a href="/privacy/" target="_blank" rel="noopener">privacy policy</a>.',create:'Create my account',newPassTitle:'Choose a new password',savePass:'Save password',encrypted:'Encrypted session · stays open on this device until midnight',
  signingIn:'Signing in…',creating:'Creating your account…',checkInbox:'Almost there. We sent a confirmation link to {email}. Open it on this device to activate your Global Passport.',badCreds:'We could not sign you in. Check your email and password.',notConfirmed:'Confirm your email first: open the link we sent you.',weak:'Use at least 10 characters.',exists:'An account already exists with this email. Sign in instead.',resetSent:'If an account exists for {email}, a reset link is on its way.',typeEmail:'Type your email above first.',passSaved:'Password updated. You are signed in.',confirmed:'Email confirmed. Opening your Global Passport…',linkError:'This link has expired or was already used. Sign in or request a new one.'},
 fr:{back:'Retour au site',chooseRole:'Qui se connecte ?',roleStudent:'Étudiant',roleStudentSub:'Global Passport',roleTeam:'Équipe',roleTeamSub:'Personnel MUK',welcomeStudent:'Bienvenue dans votre Global Passport',welcomeStudentText:'Suivez votre candidature, vos documents et les messages de votre conseiller au même endroit.',welcomeTeam:'Accès équipe MUK Talent',welcomeTeamText:'Espace privé du personnel MUK Talent. Utilisez l’e-mail fourni par l’administration.',remember:'Rester connecté sur cet appareil aujourd’hui',noAccount:'Nouvel étudiant ?',createFree:'Créez votre compte gratuit',haveAccount:'Vous avez déjà un compte ?',privacy:'Confidentialité',terms:'Conditions',help:'Aide',restoring:'Restauration de la session…',dayEnded:'Votre session est terminée pour aujourd’hui. Reconnectez-vous.',kicker:'GLOBAL PASSPORT · ROYAUME-UNI',headline:'Le passeport intelligent de l’étudiant international.',lede:'Un dossier sécurisé, de la recherche d’université jusqu’à votre premier jour sur le campus — avec votre conseiller à chaque étape.',open:'Ouvert',soon:'Bientôt',secure:'Accès sécurisé',tabSignin:'Connexion',tabSignup:'Créer un compte',welcome:'Bon retour',welcomeText:'Étudiants et équipe MUK Talent utilisent la même porte. Nous ouvrons le bon espace pour vous.',email:'Adresse e-mail',password:'Mot de passe',signin:'Se connecter',forgot:'Mot de passe oublié ?',start:'Ouvrez votre Global Passport',startText:'Gratuit pour les étudiants. Votre conseiller est attribué automatiquement.',fullName:'Nom complet (comme sur le passeport)',newPassword:'Créez un mot de passe',passHint:'Au moins 10 caractères. Une courte phrase fonctionne bien.',consent:'J’accepte les <a href="/terms/" target="_blank" rel="noopener">conditions</a> et la <a href="/privacy/" target="_blank" rel="noopener">politique de confidentialité</a>.',create:'Créer mon compte',newPassTitle:'Choisissez un nouveau mot de passe',savePass:'Enregistrer',encrypted:'Session chiffrée · reste ouverte sur cet appareil jusqu’à minuit',
  signingIn:'Connexion…',creating:'Création du compte…',checkInbox:'Presque fini. Nous avons envoyé un lien de confirmation à {email}. Ouvrez-le sur cet appareil pour activer votre Global Passport.',badCreds:'Connexion impossible. Vérifiez votre e-mail et votre mot de passe.',notConfirmed:'Confirmez d’abord votre e-mail : ouvrez le lien reçu.',weak:'Au moins 10 caractères.',exists:'Un compte existe déjà avec cet e-mail. Connectez-vous.',resetSent:'Si un compte existe pour {email}, un lien de réinitialisation arrive.',typeEmail:'Saisissez d’abord votre e-mail.',passSaved:'Mot de passe mis à jour.',confirmed:'E-mail confirmé. Ouverture de votre Global Passport…',linkError:'Ce lien a expiré ou a déjà été utilisé. Connectez-vous ou demandez-en un nouveau.'}
};
let lang=(()=>{try{const s=localStorage.getItem('gp-lang');if(s==='fr'||s==='en')return s;}catch{}return /^fr/i.test(navigator.language||'')?'fr':'en';})();
export function gateLang(){return lang;}
export function t(key,vars={}){return String((GATE_TEXT[lang]||GATE_TEXT.en)[key]??GATE_TEXT.en[key]??key).replace(/\{(\w+)\}/g,(_,k)=>vars[k]??'');}
function paint(){const v=$('loginView');if(!v)return;v.lang=lang;v.querySelectorAll('[data-i18n]').forEach(n=>{n.textContent=t(n.dataset.i18n);});v.querySelectorAll('[data-i18n-html]').forEach(n=>{n.innerHTML=t(n.dataset.i18nHtml);});v.querySelectorAll('[data-lang]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lang===lang)));}

let role=(()=>{let r=null;try{r=localStorage.getItem('muk-login-role');}catch{}if(r==='team'||r==='student')return r;return /^\/admin/.test(location.pathname)?'team':'student';})();
function applyRole(){const v=$('loginView');if(!v)return;v.dataset.role=role;
 for(const b of v.querySelectorAll('.gp-role'))b.setAttribute('aria-checked',String(b.dataset.role===role));
 const h=v.querySelector('#loginForm .gp-title'),p=v.querySelector('#loginForm .gp-lede-role');
 if(h){h.dataset.i18n=role==='team'?'welcomeTeam':'welcomeStudent';h.textContent=t(h.dataset.i18n);}
 if(p){p.dataset.i18n=role==='team'?'welcomeTeamText':'welcomeStudentText';p.textContent=t(p.dataset.i18n);}
 if(role==='team'&&$('gpCard').dataset.tab==='signup')showTab('signin');}
export function setRole(r){role=r==='team'?'team':'student';try{localStorage.setItem('muk-login-role',role);}catch{}applyRole();}

// Login background is a static CSS illustration (Moroccan circuit map). Kept as no-ops for callers.
export function startMatrix(){}
export function stopMatrix(){}

export function showLoginMessage(text='',kind=''){const m=$('loginMessage');if(!m)return;m.textContent=text;m.classList.toggle('error',kind==='error');m.classList.toggle('ok',kind==='ok');}
function strength(v){let s=0;if(v.length>=10)s++;if(v.length>=14)s++;if(/[A-Z]/.test(v)&&/[a-z]/.test(v))s++;if(/\d/.test(v))s++;if(/[^A-Za-z0-9]/.test(v)||/\s/.test(v))s++;return Math.min(4,s);}
export function showTab(which){
 const signin=which!=='signup';$('loginForm').hidden=!signin;$('signupForm').hidden=signin;$('resetForm').hidden=true;
 $('tabSignin').setAttribute('aria-selected',String(signin));$('tabSignup').setAttribute('aria-selected',String(!signin));$('tabSignin').tabIndex=signin?0:-1;$('tabSignup').tabIndex=signin?-1:0;
 $('gpCard').dataset.tab=signin?'signin':'signup';showLoginMessage();
}
export function showReset(){$('loginForm').hidden=true;$('signupForm').hidden=true;$('resetForm').hidden=false;$('gpCard').dataset.tab='reset';}

// Wires every gateway control. getClient returns the Supabase client once the config is loaded.
export function initGateway({getClient,onSignedIn}){
 paint();startMatrix();applyRole();
 document.querySelectorAll('#loginView .gp-role').forEach(b=>b.addEventListener('click',()=>{setRole(b.dataset.role);$('email').focus();}));
 document.querySelectorAll('#loginView [data-go]').forEach(b=>b.addEventListener('click',()=>showTab(b.dataset.go)));
 document.querySelectorAll('#loginView [data-lang]').forEach(b=>b.addEventListener('click',()=>{lang=b.dataset.lang;try{localStorage.setItem('gp-lang',lang);}catch{}paint();document.dispatchEvent(new CustomEvent('gp-lang',{detail:lang}));}));
 $('tabSignin').addEventListener('click',()=>showTab('signin'));$('tabSignup').addEventListener('click',()=>showTab('signup'));
 for(const tab of [$('tabSignin'),$('tabSignup')])tab.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){const other=tab.id==='tabSignin'?$('tabSignup'):$('tabSignin');other.click();other.focus();}});
 document.querySelectorAll('#loginView .gp-eye').forEach(b=>b.addEventListener('click',()=>{const i=$(b.dataset.eye);const show=i.type==='password';i.type=show?'text':'password';b.classList.toggle('on',show);b.setAttribute('aria-label',show?'Hide password':'Show password');}));
 const meter=document.querySelector('#loginView .gp-meter');$('suPassword').addEventListener('input',e=>{meter.dataset.level=String(strength(e.target.value));});
 if(/[?&]team\b/.test(location.search))setRole('team');
 if(/^#?(signup|register)/.test(location.hash.replace('#',''))||/[?&]signup\b/.test(location.search)){setRole('student');showTab('signup');}
 $('signupForm').addEventListener('submit',async e=>{e.preventDefault();const client=getClient();if(!client)return;const btn=$('signupSubmit');if(btn.disabled)return;
  const name=$('suName').value.trim(),email=$('suEmail').value.trim().toLowerCase(),password=$('suPassword').value;
  if(password.length<10)return showLoginMessage(t('weak'),'error');if(!$('suConsent').checked)return;
  btn.disabled=true;showLoginMessage(t('creating'));
  try{const {data,error}=await client.auth.signUp({email,password,options:{emailRedirectTo:location.origin+'/portal/',data:{full_name:name,account:'student',lang}}});
   if(error)throw error;$('suPassword').value='';
   if(data.user&&Array.isArray(data.user.identities)&&data.user.identities.length===0){showTab('signin');$('email').value=email;return showLoginMessage(t('exists'),'error');}
   if(data.session){await onSignedIn(data.session);return;}
   $('signupForm').reset();showTab('signin');$('email').value=email;showLoginMessage(t('checkInbox',{email}),'ok');
  }catch(err){showLoginMessage(/registered|exists/i.test(err.message||'')?t('exists'):(err.message||'Error'),'error');}
  finally{btn.disabled=false;}
 });
 $('forgotPassword').addEventListener('click',async()=>{const client=getClient();const email=$('email').value.trim();if(!email){showLoginMessage(t('typeEmail'),'error');$('email').focus();return;}
  try{await client.auth.resetPasswordForEmail(email,{redirectTo:location.origin+'/portal/'});}catch{}showLoginMessage(t('resetSent',{email}),'ok');});
 $('resetForm').addEventListener('submit',async e=>{e.preventDefault();const client=getClient();const v=$('newPassword').value;if(v.length<10)return showLoginMessage(t('weak'),'error');
  const {error}=await client.auth.updateUser({password:v});$('newPassword').value='';if(error)return showLoginMessage(error.message,'error');showLoginMessage(t('passSaved'),'ok');const {data}=await client.auth.getSession();if(data.session)await onSignedIn(data.session);});
}
