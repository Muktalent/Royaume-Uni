// MUKTalent v14 · "Install the app" sheet for students and counsellors on phones. Disappears for good once the app is installed.
const KEY = 'muk-app-installed', SNOOZE = 'muk-app-snooze';
let deferred = null;
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: minimal-ui)').matches || navigator.standalone === true;
const isPhone = () => matchMedia('(pointer:coarse)').matches && Math.min(screen.width, screen.height) < 820;
const ios = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const mark = () => { try { localStorage.setItem(KEY, '1'); } catch { } document.getElementById('mukInstall')?.remove(); };
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; });
  window.addEventListener('appinstalled', mark);
  if (isStandalone()) { try { localStorage.setItem(KEY, '1'); } catch { } }
}
const TX = {
  en: { t: 'Install the MUKTalent app', s: 'Open your space in one tap, full screen, like any other app.', go: 'Install app', later: 'Not now', iosT: 'Add MUKTalent to your Home Screen', ios1: 'Tap the Share button', ios2: 'Choose “Add to Home Screen”', ios3: 'Tap “Add”', andT: 'Install from your browser menu', and1: 'Open the browser menu ⋮', and2: 'Choose “Install app” or “Add to Home screen”', ok: 'Got it' },
  fr: { t: 'Installez l’application MUKTalent', s: 'Ouvrez votre espace en un geste, en plein écran, comme une application.', go: 'Installer l’app', later: 'Plus tard', iosT: 'Ajoutez MUKTalent à l’écran d’accueil', ios1: 'Touchez le bouton Partager', ios2: 'Choisissez « Sur l’écran d’accueil »', ios3: 'Touchez « Ajouter »', andT: 'Installez depuis le menu du navigateur', and1: 'Ouvrez le menu du navigateur ⋮', and2: 'Choisissez « Installer l’application » ou « Ajouter à l’écran d’accueil »', ok: 'Compris' },
  es: { t: 'Instala la app de MUKTalent', s: 'Abre tu espacio con un toque, a pantalla completa, como cualquier app.', go: 'Instalar app', later: 'Ahora no', iosT: 'Añade MUKTalent a tu pantalla de inicio', ios1: 'Toca el botón Compartir', ios2: 'Elige «Añadir a pantalla de inicio»', ios3: 'Toca «Añadir»', andT: 'Instala desde el menú del navegador', and1: 'Abre el menú del navegador ⋮', and2: 'Elige «Instalar aplicación» o «Añadir a pantalla de inicio»', ok: 'Entendido' },
  ar: { t: 'ثبّت تطبيق MUKTalent', s: 'افتح مساحتك بلمسة واحدة وبملء الشاشة مثل أي تطبيق.', go: 'تثبيت التطبيق', later: 'ليس الآن', iosT: 'أضف MUKTalent إلى الشاشة الرئيسية', ios1: 'المس زر المشاركة', ios2: 'اختر «إضافة إلى الشاشة الرئيسية»', ios3: 'المس «إضافة»', andT: 'ثبّت من قائمة المتصفح', and1: 'افتح قائمة المتصفح ⋮', and2: 'اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية»', ok: 'حسنًا' }
};
const E = (t, v, c) => { const n = document.createElement(t); if (v !== undefined) n.textContent = String(v); if (c) n.className = c; return n; };
function css() {
  if (document.getElementById('mukInstallCss')) return; const s = E('style'); s.id = 'mukInstallCss';
  s.textContent = `.mki{position:fixed;z-index:9500;left:12px;right:12px;bottom:max(12px,env(safe-area-inset-bottom));display:grid;gap:12px;padding:16px;border-radius:22px;background:#2B2A28;color:#F1EEE9;border:1px solid rgba(180,155,108,.4);box-shadow:0 24px 60px -20px rgba(22,21,20,.6);font:14px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif;transform:translateY(130%);transition:transform .4s cubic-bezier(.2,.8,.2,1)}
.mki.in{transform:none}.mki-top{display:grid;grid-template-columns:52px minmax(0,1fr) auto;gap:12px;align-items:center}.mki img{width:52px;height:52px;border-radius:14px;display:block}
.mki strong{display:block;font-size:15.5px}.mki p{margin:2px 0 0;color:#B8B5B0;font-size:13px}.mki-x{width:34px;height:34px;border:0;border-radius:50%;background:rgba(255,255,255,.08);color:#D3D1CE;font-size:20px;line-height:1;cursor:pointer}
.mki-row{display:flex;gap:10px}.mki-row button{flex:1;min-height:46px;border-radius:14px;border:1px solid rgba(233,240,236,.18);background:transparent;color:#F1EEE9;font:inherit;font-weight:650;cursor:pointer}
.mki-row .mki-go{background:#B49B6C;border-color:#B49B6C;color:#2B2A28}.mki ol{margin:0;padding:0;list-style:none;display:grid;gap:8px}.mki li{display:flex;gap:10px;align-items:center;color:#e9f0ec}
.mki li b{flex:none;display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:rgba(180,155,108,.18);color:#CFBFA3;font-size:12px}.mki li svg{width:18px;height:18px;fill:none;stroke:#CFBFA3;stroke-width:2;vertical-align:-3px}
.mki button:focus-visible{outline:2px solid #B49B6C;outline-offset:2px}@media(min-width:700px){.mki{left:auto;right:20px;width:380px}}@media(prefers-reduced-motion:reduce){.mki{transition:none}}`;
  document.head.append(s);
}
export function offerInstall({ lang = 'en' } = {}) {
  try {
    if (isStandalone()) { mark(); return; }
    if (localStorage.getItem(KEY) === '1' || sessionStorage.getItem(SNOOZE) === '1' || !isPhone() || document.getElementById('mukInstall')) return;
  } catch { return; }
  const L = TX[lang] || TX.en;
  const show = () => {
    css(); const box = E('section', undefined, 'mki'); box.id = 'mukInstall'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', L.t); box.lang = lang; if (lang === 'ar') box.dir = 'rtl';
    const top = E('div', undefined, 'mki-top'), img = E('img'); img.src = '/icon-192.png'; img.alt = ''; const txt = E('div'); txt.append(E('strong', L.t), E('p', L.s));
    const x = E('button', '\u00d7', 'mki-x'); x.type = 'button'; x.setAttribute('aria-label', L.later); top.append(img, txt, x); box.append(top);
    const row = E('div', undefined, 'mki-row'), later = E('button', L.later), go = E('button', L.go, 'mki-go'); later.type = go.type = 'button'; row.append(later, go); box.append(row);
    const close = () => { try { sessionStorage.setItem(SNOOZE, '1'); } catch { } box.classList.remove('in'); setTimeout(() => box.remove(), 350); };
    x.onclick = later.onclick = close;
    const steps = (title, items) => { txt.replaceChildren(E('strong', title)); const ol = E('ol'); items.forEach((t, i) => { const li = E('li'); li.append(E('b', i + 1)); const sp = E('span', t); if (i === 0 && ios()) sp.insertAdjacentHTML('beforeend', ' <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>'); li.append(sp); ol.append(li); }); row.before(ol); go.remove(); later.textContent = L.ok; later.onclick = close; };
    go.onclick = async () => {
      if (deferred) { go.disabled = true; try { deferred.prompt(); const r = await deferred.userChoice; deferred = null; if (r?.outcome === 'accepted') mark(); else close(); } catch { close(); } return; }
      if (ios()) steps(L.iosT, [L.ios1, L.ios2, L.ios3]); else steps(L.andT, [L.and1, L.and2]);
    };
    document.body.append(box); requestAnimationFrame(() => requestAnimationFrame(() => box.classList.add('in')));
  };
  const check = navigator.getInstalledRelatedApps ? navigator.getInstalledRelatedApps().then(a => { if (a?.length) { mark(); return false; } return true; }).catch(() => true) : Promise.resolve(true);
  check.then(okToShow => { if (okToShow) setTimeout(show, 1200); });
}
