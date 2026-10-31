// admin-soft-v1 · MUK Soft look for the administration panel: overview hero, team payroll and mobile dock.
const E=(t,v,c)=>{const n=document.createElement(t);if(v!==undefined&&v!==null)n.textContent=String(v);if(c)n.className=c;return n;};
const mad=v=>new Intl.NumberFormat('es-ES',{maximumFractionDigits:0,useGrouping:'always'}).format(Math.round(v||0))+' MAD';
function chrome(){document.documentElement.classList.add('mt-soft');let m=document.querySelector('meta[name=theme-color]');if(!m){m=E('meta');m.name='theme-color';document.head.append(m);}m.content='#f6f4ef';for(const [n,c]of [['apple-mobile-web-app-capable','yes'],['mobile-web-app-capable','yes'],['apple-mobile-web-app-status-bar-style','default']])if(!document.querySelector('meta[name='+n+']')){const x=E('meta');x.name=n;x.content=c;document.head.append(x);}}
export function mountAdminSoft({api,getState,navigate}){
 chrome();const shell=document.getElementById('appShell');shell.classList.add('admin-soft');
 const overview=document.getElementById('overview'),metrics=document.getElementById('metrics');let busy=false,stamp=0;
 const monthKey=()=>{const p=new Intl.DateTimeFormat('en-GB',{timeZone:'Africa/Casablanca',year:'numeric',month:'2-digit'}).formatToParts(new Date());return p.find(x=>x.type==='year').value+'-'+p.find(x=>x.type==='month').value;};
 function hero(){let h=document.getElementById('adminSoftHero');if(h)return h;h=E('section',undefined,'as-hero');h.id='adminSoftHero';h.setAttribute('aria-label','Resumen del día');overview.prepend(h);return h;}
 async function paint(){const s=getState();if(!s.staff||s.staff.role!=='admin'||busy)return;const id=++stamp;busy=true;const h=hero();
  const first=String(s.staff.full_name||'').split(/\s+/)[0]||'equipo';
  const greet=E('article',undefined,'as-greet');greet.append(E('p','MUK TALENT · ADMINISTRACIÓN','as-overline'),E('h2','Hola, '+first),E('p',new Intl.DateTimeFormat('es-ES',{timeZone:'Africa/Casablanca',weekday:'long',day:'numeric',month:'long'}).format(new Date())+' · Africa/Casablanca','as-muted'));
  const quick=E('div',undefined,'as-quick');for(const [label,section]of [['Leads y casos','candidates'],['Pipeline e informes','intelligence'],['Equipo','staff'],['Citas','appointments']]){const b=E('button',label,'as-quick-btn');b.type='button';b.onclick=()=>navigate(section);quick.append(b);}greet.append(quick);
  const pay=E('article',undefined,'as-pay');pay.append(E('p','NÓMINA DEL EQUIPO · '+new Intl.DateTimeFormat('es-ES',{month:'long',year:'numeric'}).format(new Date()).toUpperCase(),'as-overline'));
  h.replaceChildren(greet,pay);
  try{const r=await api('/api/admin/payroll?month='+monthKey());if(id!==stamp)return;
   const tot=E('div',undefined,'as-pay-total');tot.append(E('strong',mad(r.totals.projected_total)),E('span','previsto este mes'));pay.append(tot);
   const pills=E('div',undefined,'as-pills');for(const [label,value,tone]of [['Base',mad(r.base_monthly)+' / persona','gold'],['Leads verificados',String(r.totals.verified_count),'dark'],['Comisiones',mad(r.totals.commission),'grey']]){const p=E('span',undefined,'as-pill as-pill-'+tone);p.append(E('span',label),E('b',value));pills.append(p);}pay.append(pills);
   const list=E('div',undefined,'as-pay-list');const max=Math.max(1,...r.data.map(x=>x.projected_total));for(const row of r.data.slice(0,6)){const line=E('div',undefined,'as-pay-row'),bar=E('i');bar.style.setProperty('--w',Math.round(row.projected_total/max*100)+'%');const name=E('span',row.full_name,'as-pay-name');line.append(name,E('span',row.verified_count+' leads','as-pay-leads'),E('b',mad(row.projected_total)),bar);list.append(line);}
   if(!r.data.length)list.append(E('p','Aún no hay colaboradores activos.','as-muted'));pay.append(list,E('p','Base '+mad(r.base_monthly)+' (lunes a viernes) + '+mad(r.per_verified_lead)+' por lead verificado. Un lead cuenta cuando administración lo acepta como caso.','as-foot'));
  }catch(e){if(id===stamp)pay.append(E('p','Nómina no disponible ahora mismo.','as-muted'));}
  finally{busy=false;}
 }
 new MutationObserver(()=>{if(!overview.hidden&&metrics.children.length)paint();}).observe(metrics,{childList:true});
}
