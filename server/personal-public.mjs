import {createClient} from '@supabase/supabase-js';
const fields='id,kind,slug,title,subtitle,category,body,tags,issuer,issued_on,expires_on,website_url,repository_url,verification_url,cover_path,document_path,gallery_paths,sort_order';
export function mountPersonal(app){
 app.get('/api/personal/items',async(req,res)=>{
  const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_PUBLIC_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  const kind=String(req.query.kind||'');
  if(!['project','certificate','profile','experience','education','link'].includes(kind))return res.status(400).json({error:'Invalid content type.'});
  const {data,error}=await db.from('mt_personal_items').select(fields).eq('kind',kind).eq('published',true).order('sort_order').order('created_at',{ascending:false}).limit(200);
  if(error){console.error({requestId:req.requestId,code:error.code});return res.status(503).json({error:'Personal content is not available yet.'});}
  const paths=[...new Set(data.flatMap(i=>[i.cover_path,i.document_path,...i.gallery_paths.split('\n')]).map(p=>p.trim()).filter(Boolean))];
  const links={};
  if(paths.length){const r=await db.storage.from('mt-personal').createSignedUrls(paths,600);if(!r.error)for(const x of r.data||[])if(x.signedUrl)links[x.path]=x.signedUrl;}
  res.set('X-Robots-Tag','noindex, nofollow');
  res.json({data:data.map(i=>({...i,cover_url:links[i.cover_path]||'',document_url:links[i.document_path]||'',gallery_urls:i.gallery_paths.split('\n').map(p=>links[p.trim()]).filter(Boolean)}))});
 });
}


