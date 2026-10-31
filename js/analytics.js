/* MUK Talent · Google Analytics 4 + Google Ads (Consent Mode v2, basic mode).
   Nothing is sent to Google until the visitor accepts in the cookie banner.
   1) Paste your GA4 Measurement ID below (G-...).
   2) Optional: paste your Google Ads tag ID (AW-...) to measure campaign conversions. */
(() => {
'use strict';
const GA_ID = 'G-NNKDFY3JW2';
const ADS_ID = 'AW-18547915772';
const KEY = 'muk-marketing-v2', TTL = 180 * 86400000;
if (/^\/(admin|api|portal|login|personal-admin)(\/|$)/.test(location.pathname)) return;
const ready = /^G-[A-Z0-9]{6,}$/.test(GA_ID);
window.dataLayer = window.dataLayer || [];
function gtag(){ window.dataLayer.push(arguments); }
window.gtag = window.gtag || gtag;
window.gtag('consent', 'default', {ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied', analytics_storage:'denied', functionality_storage:'granted', security_storage:'granted', wait_for_update:500});
window.gtag('set', 'url_passthrough', false);
window.gtag('set', 'ads_data_redaction', true);
function allowed(){
  try { const v = JSON.parse(localStorage.getItem(KEY)); const age = Date.now() - v.updatedAt;
    return v.version === 2 && v.marketing === true && age >= 0 && age < TTL; } catch { return false; }
}
let loaded = false;
function grant(){
  if (!ready) return;
  window.gtag('consent', 'update', {ad_storage:'granted', ad_user_data:'granted', ad_personalization:'granted', analytics_storage:'granted'});
  if (loaded) return;
  loaded = true;
  const s = document.createElement('script'); s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
  document.head.append(s);
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, {anonymize_ip: true});
  if (AW-18547915772) window.gtag('config', AW-18547915772);
}
function deny(){
  window.gtag('consent', 'update', {ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied', analytics_storage:'denied'});
  const parts = location.hostname.split('.');
  for (const c of document.cookie.split(';')) {
    const name = c.split('=')[0].trim();
    if (!/^(_ga|_gid|_gat|_gcl_)/.test(name)) continue;
    document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
    for (let i = 0; i < parts.length - 1; i++) { const d = parts.slice(i).join('.'); document.cookie = `${name}=; Max-Age=0; Path=/; Domain=.${d}; SameSite=Lax`; }
  }
}
function sync(){ allowed() ? grant() : deny(); }
function event(name, params = {}){ if (ready && allowed() && loaded) window.gtag('event', name, params); }
window.MUKAnalytics = Object.freeze({
  event,
  lead(id, source = 'evaluation'){ event('generate_lead', {lead_source: source, transaction_id: String(id || '').slice(0, 64), currency: 'GBP', value: 1}); },
  sync
});
document.addEventListener('muk-consent', sync);
window.addEventListener('storage', e => { if (e.key === KEY || e.key === null) sync(); });
document.addEventListener('click', e => {
  const a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
  const href = a.getAttribute('href') || '';
  if (/^(https?:\/\/)?(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)/i.test(href)) event('contact', {method: 'whatsapp', link_url: href.slice(0, 100)});
  else if (/^tel:/i.test(href)) event('contact', {method: 'phone'});
  else if (/^mailto:/i.test(href)) event('contact', {method: 'email'});
  else if (/^\/(evaluation|contact)\/?/.test(href)) event('select_content', {content_type: 'cta', item_id: href});
  else if (/^\/(login|portal)\/?/.test(href)) event('login_click', {});
}, {capture: true, passive: true});
sync();
})();
