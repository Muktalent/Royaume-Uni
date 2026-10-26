import http from "node:http";
import {readFile,stat} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import path from "node:path";
const root=fileURLToPath(new URL("../web-dist/",import.meta.url));
const types={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"application/javascript; charset=utf-8",".svg":"image/svg+xml",".png":"image/png",".jpg":"image/jpeg",".webp":"image/webp",".ico":"image/x-icon",".woff2":"font/woff2"};
http.createServer(async(req,res)=>{
 if(req.url.startsWith("/api/")){const remote=http.request({hostname:"127.0.0.1",port:3001,path:req.url,method:req.method,headers:{...req.headers,host:"127.0.0.1:3001"}},r=>{res.writeHead(r.statusCode,r.headers);r.pipe(res);});remote.on("error",()=>{res.writeHead(503,{"Content-Type":"application/json"});res.end(JSON.stringify({error:"Arranca npm run dev:api en otra terminal."}));});req.pipe(remote);return;}
 try{
  const u=new URL(req.url,"http://local.invalid"),relative=decodeURIComponent(u.pathname);
  let file=path.resolve(root,"."+relative);if(file!==root.slice(0,-1)&&!file.startsWith(root))throw new Error();
  if((await stat(file)).isDirectory())file=path.join(file,"index.html");
  const data=await readFile(file);res.writeHead(200,{"Content-Type":types[path.extname(file)]||"application/octet-stream","Cache-Control":"no-store"});res.end(data);
 }catch{res.writeHead(404);res.end("Not found");}
}).listen(3000,"127.0.0.1",()=>console.log("Vista previa: http://127.0.0.1:3000/ — requiere API local en 3001 para el admin."));
