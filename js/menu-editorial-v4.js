
document.addEventListener('DOMContentLoaded',()=>{
 const trigger=document.getElementById('mobileMenuToggle'),dialog=document.getElementById('mobileMenu');
 if(!trigger||!dialog||typeof dialog.showModal!=='function')return;
 const closeButton=dialog.querySelector('.muk-nav-close'),mobile=matchMedia('(max-width:768px)'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
 const english=document.documentElement.lang==='en';let timer=null,closing=false,oldOverflow=null;
 trigger.setAttribute('aria-controls','mobileMenu');trigger.setAttribute('aria-haspopup','dialog');trigger.setAttribute('aria-expanded','false');
 const langLabel=open=>english?(open?'Close menu':'Open menu'):(open?'Fermer le menu':'Ouvrir le menu');trigger.setAttribute('aria-label',langLabel(false));
 function reset(){clearTimeout(timer);timer=null;closing=false;dialog.classList.remove('muk-nav-leaving');document.body.classList.remove('menu-open');if(oldOverflow!==null){document.body.style.overflow=oldOverflow;oldOverflow=null;}trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-label',langLabel(false));}
 function finish(returnFocus=true,navigate=null){if(dialog.open)dialog.close();reset();if(returnFocus&&mobile.matches)trigger.focus({preventScroll:true});if(navigate)window.location.assign(navigate);}
 function close(returnFocus=true,navigate=null,immediate=false){if(!dialog.open||closing)return;closing=true;if(immediate||reduced.matches){finish(returnFocus,navigate);return;}dialog.classList.add('muk-nav-leaving');timer=setTimeout(()=>finish(returnFocus,navigate),180);}
 function open(){if(!mobile.matches||dialog.open)return;reset();oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';document.body.classList.add('menu-open');dialog.showModal();trigger.setAttribute('aria-expanded','true');trigger.setAttribute('aria-label',langLabel(true));closeButton.focus({preventScroll:true});dialog.scrollTop=0;}
 trigger.addEventListener('click',event=>{event.preventDefault();dialog.open?close():open();});
 closeButton.addEventListener('click',()=>close());
 dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
 dialog.addEventListener('close',()=>{if(!closing)reset();});
 dialog.addEventListener('click',event=>{if(event.target===dialog)close();});
 for(const link of dialog.querySelectorAll('a[href]'))link.addEventListener('click',event=>{
  if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  event.preventDefault();close(false,link.href);
 });
 const current=window.location.pathname.replace(/\/$/,'')||'/';
 for(const link of dialog.querySelectorAll('a[href]')){const u=new URL(link.href);if(!u.hash&&(u.pathname.replace(/\/$/,'')||'/')===current)link.setAttribute('aria-current','page');}
 mobile.addEventListener('change',event=>{if(!event.matches&&dialog.open)finish(false);});
 window.addEventListener('pagehide',()=>{if(dialog.open)finish(false);});
 window.addEventListener('pageshow',()=>{if(!dialog.open)reset();});
});
