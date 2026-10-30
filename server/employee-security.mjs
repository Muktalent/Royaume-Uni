import { createClient } from "@supabase/supabase-js";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
const input=z.object({current_password:z.string().min(1).max(1024),new_password:z.string().min(14).max(128)}).strict();
export function mountEmployeeSecurity(app,{requireStaff}){
 const limited=rateLimit({windowMs:15*60*1000,limit:8,keyGenerator:req=>req.staff.user_id,
 standardHeaders:'draft-7',legacyHeaders:false,message:{error:'Too many password change attempts. Try again in 15 minutes.'}});
 app.post('/api/employee-security/password',requireStaff,limited,async(req,res)=>{
  const parsed=input.safeParse(req.body);
  if(!parsed.success)return res.status(400).json({error:'Enter your current password and a new password between 14 and 128 characters.'});
  const {current_password,new_password}=parsed.data;
  if(current_password===new_password)return res.status(400).json({error:'Choose a password different from your current password.'});
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!key)return res.status(503).json({error:'Password changes are not configured on this server.'});
  const current=await req.db.auth.getUser();
  if(current.error||!current.data.user?.email)return res.status(401).json({error:'Sign in again before changing your password.'});
  const verifier=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_PUBLIC_KEY,
   {auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  const proof=await verifier.auth.signInWithPassword({email:current.data.user.email,password:current_password});
  if(proof.error||proof.data.user?.id!==req.staff.user_id)return res.status(400).json({error:'Your current password could not be verified.'});
  // Revoke only the temporary verification session, not the dashboard session.
  await verifier.auth.signOut({scope:'local'}).catch(()=>{});
  const admin=createClient(process.env.SUPABASE_URL,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const changed=await admin.auth.admin.updateUserById(req.staff.user_id,{password:new_password});
  if(changed.error)return res.status(400).json({error:'Password not changed. It may not meet your Supabase Auth password policy.'});
  const saved=await admin.from('mt_employee_security').update({must_change_password:false,password_changed_at:new Date().toISOString()})
   .eq('user_id',req.staff.user_id).select('user_id').maybeSingle();
  if(saved.error||!saved.data)return res.status(503).json({error:'Your password was changed, but the security status could not be saved. Keep the NEW password. Sign in again with it and contact your administrator if access remains blocked.'});
  res.json({ok:true,message:'Password changed successfully.'});
 });
}
