// pipeline-share-v1 · Read-only partner view of an accepted-case snapshot (token in the URL fragment, never sent to logs).
const META={'Assessment':['New','blue'],'Documents pending':['In progress','amber'],'Application preparation':['In progress','amber'],'Application submitted':['Submitted','violet'],'Offer received':['Ready','green'],'Deposit pending':['Action needed','orange'],'Enrolled':['Completed','teal'],'On hold':['On hold','grey'],'Closed':['Closed','red']};
const ORDER=Object.keys(META);
const $=id=>document.getElementById(id);
const E=(t,v,c)=>{const n=document.createElement(t);if(v!=null)n.textContent=String(v);if(c)n.className=c;return n;};
const fmt=(v,key)=>{if(v==null||v==='')return '—';if(/_at$|last_updated/.test(key)){const d=new Date(v);return isNaN(d)?String(v):d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});}return String(v);};
const order=c=>[...c.filter(x=>x[0]==='reference'),...c.filter(x=>x[0]==='stage'),['__status','Status'],...c.filter(x=>x[0]!=='reference'&&x[0]!=='stage')];
let report=null,filter='',q='';
async function start(){
 const token=location.hash.slice(1);history.replaceState(null,'',location.pathname);
 if(!/^[A-Za-z0-9_-]{40,100}$/.test(token)){fail('This link is incomplete. Ask MUK Talent for a new report link.');return;}
 try{const r=await fetch('/api/pipeline-share',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token}),cache:'no-store',credentials:'omit'});const j=await r.json().catch(()=>({}));if(!r.ok)throw Error(j.error||'This report is unavailable.');report=j;}catch(e){fail(e.message);return;}
 $('title').textContent=report.title||'Accepted case pipeline';
 $('meta').textContent=report.count+' accepted cases · as of '+new Date(report.as_of).toLocaleString('en-GB')+' · link expires '+new Date(report.expires_at).toLocaleString('en-GB');
 for(const s of new Set(Object.values(META).map(m=>m[0])))$('filter').append(new Option(s,s));
 $('filter').onchange=()=>{filter=$('filter').value;paint();};$('q').oninput=()=>{q=$('q').value.trim().toLowerCase();paint();};
 $('print').hidden=$('csv').hidden=$('tools').hidden=false;$('print').onclick=()=>print();$('csv').onclick=csv;
 paint();
}
function fail(text){$('title').textContent='Report unavailable';$('meta').textContent=text;$('meta').classList.add('ps-error');}
function rows(){return (report.rows||[]).filter(r=>(!filter||(META[r.stage]||[])[0]===filter)&&(!q||Object.values(r).join(' ').toLowerCase().includes(q)));}
function paint(){
 const board=$('board');board.replaceChildren();for(const st of ORDER){const n=(report.rows||[]).filter(r=>r.stage===st).length,c=E('article',undefined,'ps-stage');c.dataset.tone=META[st][1];c.append(E('span',META[st][0]),E('strong',n),E('small',st));board.append(c);}
 const legend=$('legend');legend.replaceChildren();for(const [st,[label,tone]]of Object.entries(META)){if([...legend.children].some(x=>x.dataset.label===label))continue;const i=E('span',undefined,'ps-legend-item');i.dataset.tone=tone;i.dataset.label=label;i.append(E('i'),E('span',label));legend.append(i);}
 const table=$('sheet');table.replaceChildren();const cols=order(report.columns||[]);const head=E('thead'),tr=E('tr');tr.append(E('th','#'));for(const [,label]of cols)tr.append(E('th',label));head.append(tr);
 const body=E('tbody'),list=rows();list.forEach((r,i)=>{const line=E('tr');line.dataset.tone=(META[r.stage]||[,'grey'])[1];line.append(E('td',i+1,'ps-num'));for(const [key]of cols){const td=E('td');if(key==='stage'||key==='__status'){const b=E('span',key==='stage'?r.stage:(META[r.stage]||['—'])[0],key==='stage'?'ps-badge':'ps-pill');b.dataset.tone=(META[r.stage]||[,'grey'])[1];td.append(b);}else td.textContent=fmt(r[key],key);if(key==='reference')td.className='ps-ref';line.append(td);}body.append(line);});
 if(!list.length)for(let i=0;i<6;i++){const line=E('tr',undefined,'ps-ghost');line.append(E('td',i+1,'ps-num'));for(const c of cols)line.append(E('td',''));body.append(line);}
 table.append(head,body);
}
function csv(){const cols=order(report.columns||[]);const esc=v=>{let s=String(v??'');if(/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};const lines=[cols.map(c=>esc(c[1])).join(',')];for(const r of rows())lines.push(cols.map(([k])=>esc(k==='__status'?(META[r.stage]||['—'])[0]:r[k])).join(','));const blob=new Blob(['\ufeff'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'}),a=E('a');a.href=URL.createObjectURL(blob);a.download='muk-talent-pipeline.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1500);}
start();
