// MUKTalent Healthcare · private portal entry (candidates, consultants, administrators).
import { createClient } from '@supabase/supabase-js';
import { AUTH_OPTIONS, watchDayEnd, stopWatch } from '../session-store.js';
import { S, h, clear, $, api, setLang, pickLang, t } from './core.js';
import { signIn, signUp, newPassword, unconfirmed, staffNoAccess, completeProfile, mfa } from './auth.js';
import { candidateApp } from './candidate.js';
import { teamApp } from './team.js';
import { startPresence, stopPresence } from '../presence.js';

const app = () => $('#app');
const authHash = () => /(^|[#&])(access_token|error_description|type=recovery)/.test(location.hash) || new URLSearchParams(location.search).has('code');
let recovering = /type=recovery/.test(location.hash);

function cleanUrl() {
  const q = new URLSearchParams(location.search); q.delete('code'); q.delete('signup'); q.delete('email');
  history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : '') + (authHash() ? '' : location.hash));
}

function fatal(msg) {
  clear(app(), h('div', { class: 'pt-boot' }, h('div', { class: 'pt-auth-card', role: 'alert' },
    h('img', { src: '/healthcare/assets/img/mark.svg', alt: '', width: 40, height: 40 }),
    h('h1', { text: 'MUKTalent Healthcare' }), h('p', { class: 'pt-err', text: msg }),
    h('button', { class: 'hc-btn hc-btn-teal pt-btn-block', type: 'button', onclick: () => location.reload(), text: 'Try again' }))));
}

S.signOut = async () => {
  stopWatch(); stopPresence();
  try { await S.sb.auth.signOut(); } catch {}
  S.session = null; S.me = null; S.onRoute = null;
  history.replaceState(null, '', location.pathname + location.search);
  document.body.className = 'pt';
  signIn();
};
S.onMfa = () => mfa();

S.start = async () => {
  const { data } = await S.sb.auth.getSession();
  S.session = data.session;
  if (!S.session) {
    S.onRoute = null;
    const q = new URLSearchParams(location.search);
    if (q.get('signup') === '1') return signUp({ email: q.get('email') || '' });
    return signIn({ email: q.get('email') || '' });
  }
  if (recovering) { recovering = false; return newPassword(); }
  if (authHash()) cleanUrl();
  clear(app(), h('div', { class: 'pt-boot' }, h('span', { class: 'pt-spin' })));
  let me;
  try { me = await api('me'); } catch (e) {
    if (e.status === 401) { await S.sb.auth.signOut().catch(() => {}); return signIn(); }
    if (e.code === 'mfa_required') return; // handled by S.onMfa
    return fatal(e.message);
  }
  S.me = me;
  watchDayEnd(() => S.signOut());
  if (me.role === 'candidate') { document.body.className = 'pt pt-is-candidate'; return candidateApp(me); }
  if (me.role === 'admin' || me.role === 'consultant') {
    document.body.className = 'pt pt-is-team';
    if (me.mfa_required && me.aal !== 'aal2') return mfa();
    // v20 · Team members working in Healthcare also appear as online in Admin → Equipo.
    startPresence(presenceApi);
    return teamApp(me);
  }
  if (!me.confirmed) return unconfirmed();
  if (me.is_education_staff) return staffNoAccess();
  return completeProfile(me);
};

// Minimal authenticated call for the shared presence heartbeat (/api/presence).
async function presenceApi(url, opts = {}) {
  const token = (await S.sb.auth.getSession()).data.session?.access_token;
  if (!token) throw new Error('no session');
  const r = await fetch(url, { ...opts, cache: 'no-store', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' } });
  if (!r.ok) throw new Error('presence ' + r.status);
  return r.json();
}

async function boot() {
  await setLang(pickLang(), { persist: false });
  let cfg;
  try {
    const r = await fetch('/api/public-config', { cache: 'no-store' });
    if (!r.ok) throw new Error();
    cfg = await r.json();
    if (!cfg.supabaseUrl || !cfg.supabasePublicKey) throw new Error();
  } catch { return fatal('The portal is temporarily unavailable. Please try again in a few minutes.'); }
  S.sb = createClient(cfg.supabaseUrl, cfg.supabasePublicKey, { auth: { ...AUTH_OPTIONS, detectSessionInUrl: authHash() } });
  S.sb.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') { recovering = false; setTimeout(newPassword, 0); }
  });
  await S.start();
}

boot().catch(e => { console.error(e); fatal('Something went wrong while opening the portal. Please reload the page.'); });

