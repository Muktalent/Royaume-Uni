export function apiUrl(raw,query={}){
 const u=new URL(raw,"https://local.invalid");
 const candidates=u.searchParams.getAll("__crm_route");
 let route=candidates.length?candidates.length===1?candidates[0]:null:query.__crm_route;
 if(typeof route!=="string"||!route||route.length>250||!/^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/i.test(route))throw new Error("Invalid API route");
 u.searchParams.delete("__crm_route");
 const q=u.searchParams.toString();return "/api/"+route+(q?"?"+q:"");
}
