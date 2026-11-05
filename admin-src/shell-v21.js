// v21 · Same frame as the Healthcare portal for every Education dashboard
// (admin, team workspace, Global Passport). Adds only presentational pieces:
//   · brand block at the top of the sidebar (mark + "MUKTalent" + area name), like .pt-brand
//   · user chip (initials + name + role) at the right of the top bar, like .pt-user
//   · Global Passport: the page title is shown in the top bar, like .pt-top h1
// No feature code is changed; existing buttons, links and handlers stay where they are.
const MARK = '/assets/brand/mark-light.svg';

function el(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
export function initials(name = '') { return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('') || '·'; }

function brand(area, href = '/') {
  const a = el('a', 'u-brand'); a.href = href; a.setAttribute('aria-label', 'MUKTalent ' + area);
  const img = el('img'); img.src = MARK; img.alt = ''; img.width = 38; img.height = 38;
  const t = el('span'); t.append(el('b', null, 'MUKTalent'), el('small', null, area));
  a.append(img, t); return a;
}

function userChip(name, role) {
  const box = el('div', 'u-user'); box.setAttribute('aria-label', name);
  const av = el('span', 'u-avatar', initials(name)); av.setAttribute('aria-hidden', 'true');
  const t = el('span', 'u-user-tx'); t.append(el('b', null, name), el('small', null, role));
  box.append(av, t); return box;
}

function setChip(host, name, role, before = null) {
  if (!host || !name) return;
  let chip = host.querySelector(':scope > .u-user');
  if (chip && chip.dataset.name === name) return;
  chip?.remove();
  chip = userChip(name, role); chip.dataset.name = name;
  if (before && before.parentNode === host) host.insertBefore(chip, before); else host.append(chip);
}

function enhanceAdmin() {
  const shell = document.getElementById('appShell');
  if (!shell || shell.hidden) return;
  shell.classList.add('u-shell');
  const side = shell.querySelector('.sidebar');
  if (side && !side.querySelector('.u-brand')) side.prepend(brand('Education', '/admin/'));
  const name = document.getElementById('staffName')?.textContent.trim();
  setChip(shell.querySelector('.page-header'), name, 'Administración');
}

function enhanceEmployee() {
  const root = document.getElementById('employeeWorkspace');
  if (!root) return;
  root.classList.add('u-shell');
  const side = root.querySelector('.lx-sidebar');
  if (side && !side.querySelector('.u-brand')) side.prepend(brand('Team workspace'));
  const name = root.querySelector('.lx-sidebar-footer strong')?.textContent.trim();
  const role = root.querySelector('.lx-sidebar-footer small')?.textContent.trim() || 'MUK Talent team';
  const header = root.querySelector('.lx-header');
  setChip(header, name, role);
}

function enhanceStudent() {
  const root = document.getElementById('studentPortal');
  if (!root) return;
  root.classList.add('u-shell');
  const side = root.querySelector('.gp-side');
  if (side && !side.querySelector('.u-brand')) {
    side.prepend(brand('Global Passport'));
    side.querySelector('.u-brand').insertAdjacentElement('afterend', el('p', 'u-side-label', 'Global Passport'));
  }
  const top = root.querySelector('.gp-top');
  const h1 = root.querySelector('.gp-page-head h1');
  if (top) {
    let title = top.querySelector('.u-top-title');
    if (!title) { title = el('p', 'u-top-title'); title.setAttribute('aria-hidden', 'true'); top.querySelector('.gp-top-brand')?.after(title); }
    const text = h1?.textContent.trim() || 'Global Passport';
    if (title.textContent !== text) title.textContent = text;
  }
  const name = root.querySelector('.gp-pp2-sig')?.textContent.trim();
  if (name && top) setChip(top.querySelector('.gp-top-right'), name, 'Global Passport');
}

let queued = false;
function run() {
  queued = false;
  try { enhanceAdmin(); enhanceEmployee(); enhanceStudent(); } catch { /* presentation only */ }
}
export function mountShell() {
  run();
  if (typeof MutationObserver !== 'function') return;
  new MutationObserver(() => { if (!queued) { queued = true; requestAnimationFrame(run); } })
    .observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['hidden'] });
}

if (document.body) mountShell(); else document.addEventListener('DOMContentLoaded', mountShell, { once: true });
