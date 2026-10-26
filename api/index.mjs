import app from "../server/app.mjs";
import { apiUrl } from "../server/vercel-route.mjs";
export default function handler(req,res){
 try{req.url=apiUrl(req.url,req.query);return app(req,res);}
 catch{res.statusCode=400;res.setHeader("Content-Type","application/json");res.end(JSON.stringify({error:"Ruta de API no válida."}));}
}
