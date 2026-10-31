/* MUK Talent v6 – runs in <head> before first paint: theme, language, motion. No data leaves the browser. */
(function(){
 "use strict";
 var d=document.documentElement,LANGS=["fr","en","es","ar"];
 function get(k){try{return localStorage.getItem(k);}catch(e){return null;}}
 function set(k,v){try{localStorage.setItem(k,v);}catch(e){}}
 // Theme: saved choice, otherwise the device preference.
 var t=get("muk-theme");
 if(t!=="dark"&&t!=="light")t=window.matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";
 d.setAttribute("data-theme",t);
 // Language: ?lang= link, saved choice, otherwise the browser language (never for search-engine robots, so French stays indexed).
 var l=null;try{l=new URLSearchParams(location.search).get("lang");}catch(e){}
 if(l&&LANGS.indexOf(l)>-1)set("muk-lang",l);else l=get("muk-lang");
 if(!l||LANGS.indexOf(l)<0){
  l="fr";
  if(!/bot|crawl|spider|slurp|google|bing|yandex|baidu|duckduck|lighthouse|headless|facebookexternalhit|preview/i.test(navigator.userAgent||"")){
   var list=navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||"fr"];
   for(var i=0;i<list.length;i++){var c=String(list[i]||"").slice(0,2).toLowerCase();if(LANGS.indexOf(c)>-1){l=c;break;}}
  }
 }
 d.setAttribute("data-lang",l);
 if(l!=="fr"){
  d.lang=l;d.dir=l==="ar"?"rtl":"ltr";d.className+=" v6-i18n-pending";
  var s=document.createElement("script");s.src="/i18n/"+l+".js?v=6.0.0";s.async=false;document.head.appendChild(s);
 }
 var reduce=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
 if(!reduce)d.className+=" v6-motion";
 d.className+=" v6-js";
})();
