import {readdir,mkdir,cp,rm} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import path from "node:path";
const root=fileURLToPath(new URL("../",import.meta.url)),out=path.join(root,"web-dist");
const skip=new Set(["node_modules","admin-src","server","api","lib","tools","supabase","web-dist","dist","output","coverage"]);
const allowed=/\.(html?|css|js|xml|txt|ico|png|jpe?g|gif|svg|webp|avif|woff2?|ttf|otf|webmanifest|pdf)$/i;
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});let count=0;
async function visit(dir,relative=""){
 for(const e of await readdir(dir,{withFileTypes:true})){
  if(e.name.startsWith(".")||/backup|instalador|installer/i.test(e.name)||e.isSymbolicLink())continue;
  const next=path.join(relative,e.name),source=path.join(dir,e.name);
  if(e.isDirectory()){if(!skip.has(e.name))await visit(source,next);}
  else if(allowed.test(e.name)&&!/^LEEME|README|VERIFICACION/i.test(e.name)){const target=path.join(out,next);await mkdir(path.dirname(target),{recursive:true});await cp(source,target);count++;}
 }
}
await visit(root);console.log(`Public build: ${count} static files, including the protected admin interface. Server source, credentials and backups excluded.`);
