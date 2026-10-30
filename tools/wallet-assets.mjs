// Generates the static Wallet artwork (gold badge style) into server/wallet-assets/.
// Run: node tools/wallet-assets.mjs   (only needed if the logo changes)
import sharp from 'sharp';
import {mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const out=new URL('../server/wallet-assets/',import.meta.url);mkdirSync(out,{recursive:true});
const src='book/muk-badge-logo.png',W=500;
const crop=(left,top,width,height)=>sharp(src).extract({left,top,width,height}).png().toBuffer();
const mark=await crop(161,0,178,165),word=await crop(0,189,500,63),tag=await crop(35,266,419,25);
const BG={r:22,g:22,b:22,alpha:1};
const fit=(buf,o)=>sharp(buf).resize(o).png().toBuffer();
const meta=async b=>sharp(b).metadata();
const gold=`<stop offset="0" stop-color="#f4ecd6"/><stop offset=".14" stop-color="#efe3c2"/><stop offset=".30" stop-color="#e3cfa4"/><stop offset=".46" stop-color="#c9a575"/><stop offset=".55" stop-color="#b8925f"/><stop offset=".66" stop-color="#d2b78a"/><stop offset=".78" stop-color="#efe4c6"/><stop offset=".88" stop-color="#e6d4ad"/><stop offset="1" stop-color="#b48f5d"/>`;
async function save(name,img){await img.png({compressionLevel:9}).toFile(fileURLToPath(new URL(name,out)));}
// Google circular logo: gold mark on the card colour.
{const m=await fit(mark,{width:360});const {height}=await meta(m);
 await save('google-logo.png',sharp({create:{width:660,height:660,channels:4,background:BG}}).composite([{input:m,left:150,top:Math.round((660-height)/2)}]));}
// Google wide logo (1280x400): mark + MUK TALENT + tagline.
{const m=await fit(mark,{height:210}),w=await fit(word,{height:88}),t=await fit(tag,{height:34});const mw=(await meta(m)).width,ww=(await meta(w)).width,tw=(await meta(t)).width;const x=Math.round((1280-(mw+44+ww))/2);
 await save('google-wide-logo.png',sharp({create:{width:1280,height:400,channels:4,background:BG}}).composite([{input:m,left:x,top:95},{input:w,left:x+mw+44,top:128},{input:t,left:x+mw+44+Math.round((ww-tw)/2),top:236}]));}
// Apple logo (max 160x50 pt): mark + wordmark.
for(const [suffix,k]of [['',1],['@2x',2],['@3x',3]]){const m=await fit(mark,{height:34*k}),w=await fit(word,{height:14*k});const mw=(await meta(m)).width,ww=(await meta(w)).width;
 await save('apple-logo'+suffix+'.png',sharp({create:{width:mw+7*k+ww,height:50*k,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:m,left:0,top:8*k},{input:w,left:mw+7*k,top:Math.round(18*k)}]));
 const size=29*k,i=await fit(mark,{width:Math.round(size*.66)});const ih=(await meta(i)).height;
 await save('apple-icon'+suffix+'.png',sharp({create:{width:size,height:size,channels:4,background:BG}}).composite([{input:i,left:Math.round(size*.17),top:Math.round((size-ih)/2)}]));}
// Google hero banner 1032x336: gold band + black panel + logo; photo area on the right is filled at runtime.
for(const withPhoto of [true,false]){
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1032" height="336"><defs><linearGradient id="g" x1="0" y1="0" x2=".08" y2="1">${gold}</linearGradient><linearGradient id="s" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".72" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".12"/></linearGradient><linearGradient id="e" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e7d5ad"/><stop offset=".5" stop-color="#9b7745"/><stop offset="1" stop-color="#e8d7b2"/></linearGradient><radialGradient id="p" cx=".55" cy="0" r="1"><stop offset="0" stop-color="#2a2a2a"/><stop offset=".55" stop-color="#1d1d1d"/><stop offset="1" stop-color="#161616"/></radialGradient></defs><rect width="1032" height="336" fill="url(#p)"/><rect width="132" height="336" fill="url(#g)"/><rect width="132" height="336" fill="url(#s)"/><rect x="126" width="6" height="336" fill="url(#e)"/></svg>`;
 const logo=await fit(src,{width:withPhoto?300:360}),lm=await meta(logo);
 const left=withPhoto?Math.round(132+(560-132-lm.width)/2):Math.round(132+(1032-132-lm.width)/2);
 await save(withPhoto?'hero-base.png':'hero-nophoto.png',sharp(Buffer.from(svg)).composite([{input:logo,left,top:Math.round((336-lm.height)/2)}]));}
// v8 · ClickCard-style brand hero (1032x336): black, centred mark + wordmark + tagline, gold stripe at the bottom.
{const m=await fit(mark,{height:150}),w=await fit(word,{height:58}),mw=(await meta(m)).width,ww=(await meta(w)).width,x=Math.round((1032-(mw+34+ww))/2);
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1032" height="336"><defs><linearGradient id="b" x1="0" x2="1"><stop offset="0" stop-color="#a88446"/><stop offset=".5" stop-color="#f1d27a"/><stop offset="1" stop-color="#c8a464"/></linearGradient><radialGradient id="r" cx=".5" cy=".1" r=".9"><stop offset="0" stop-color="#22201c"/><stop offset="1" stop-color="#111111"/></radialGradient></defs><rect width="1032" height="336" fill="url(#r)"/><rect y="318" width="1032" height="18" fill="url(#b)"/><text x="${x+mw+34+ww/2}" y="236" text-anchor="middle" font-family="DejaVu Sans, Arial, sans-serif" font-size="20" letter-spacing="4" fill="#b7ad9a">YOUR DIGITAL BUSINESS CARD</text></svg>`;
 await save('hero-brand.png',sharp(Buffer.from(svg)).composite([{input:m,left:x,top:72},{input:w,left:x+mw+34,top:132}]));}
console.log('wallet assets written');
