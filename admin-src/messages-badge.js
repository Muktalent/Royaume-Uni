// v22 · "Mensajes" section in every Education dashboard (replaces the heart button).
// Paints the unread count on every element marked with data-msg-badge (sidebar item, mobile dock item…)
// and in the browser tab title, e.g. "(2) MUK Talent". The toast / system notification for new messages
// is still sent by messageNotifier (muk-v17.js).
let baseTitle = null;

export function badgeEl(cls = 'u-msg-badge') {
  const b = document.createElement('i');
  b.className = cls;
  b.dataset.msgBadge = '1';
  b.hidden = true;
  b.setAttribute('aria-hidden', 'true');
  return b;
}

export function paintUnread(count, root = document) {
  const n = Math.max(0, Number(count) || 0);
  const text = n > 99 ? '99+' : String(n);
  for (const b of root.querySelectorAll('[data-msg-badge]')) {
    b.textContent = n ? text : '';
    b.hidden = !n;
    const host = b.closest('button,a');
    if (host) {
      host.classList.toggle('has-unread', n > 0);
      const label = host.dataset.msgLabel || host.getAttribute('aria-label') || host.textContent.replace(text, '').trim();
      host.dataset.msgLabel = label;
      host.setAttribute('aria-label', n ? `${label} (${text})` : label);
    }
  }
  if (baseTitle === null) baseTitle = document.title.replace(/^\(\d+\+?\)\s*/, '');
  document.title = n ? `(${text}) ${baseTitle}` : baseTitle;
}

export function resetUnreadTitle() {
  if (baseTitle !== null) document.title = baseTitle;
}
