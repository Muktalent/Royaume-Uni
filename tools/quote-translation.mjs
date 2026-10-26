
import{readFile}from'node:fs/promises';
const config=JSON.parse(await readFile(new URL('../server/translation-pricing.json',import.meta.url),'utf8'));
const args=Object.fromEntries(process.argv.slice(2).map(v=>v.split('=')));
const pages=Number(args.pages),rate=Number(args.rate);if(!Number.isInteger(pages)||pages<1||!Number.isFinite(rate)||rate<=0)throw new Error('Uso: node tools/quote-translation.mjs pages=2 rate=TIPO_GBP_MAD_CONFIRMADO');
const base=config.supplierPricePerPage*pages,management=base*config.managementMarkupPercent/100;
console.log(JSON.stringify({status:'INTERNAL_ESTIMATE_NOT_FINAL_QUOTE',confirmedSupplierPages:pages,managementMarkupPercent:config.managementMarkupPercent,totalMAD:Math.round((base+management)*rate*100)/100,exchangeRateGBPtoMAD:rate,warning:'Confirmar VAT, suplementos, paginas facturables y condiciones antes de emitir el total final al cliente. No publicar el coste interno del proveedor.'},null,2));
