// v20 · Unified dashboard design (same look as the Healthcare portal, new MUK palette).
// Several modules add their own stylesheet when they open (team, chat, workspace…).
// This keeps /assets/brand/muk-unified.css as the LAST stylesheet so the shared look always wins,
// without touching any feature code.
export const UNIFIED_CSS = '/assets/brand/muk-unified.css?v=23.0.0';

export function mountUnifiedTheme(doc = document) {
  const head = doc.head;
  if (!head) return null;
  let link = doc.getElementById('mukUnifiedCss');
  if (!link) {
    link = doc.createElement('link');
    link.id = 'mukUnifiedCss';
    link.rel = 'stylesheet';
    link.href = UNIFIED_CSS;
  }
  const keepLast = () => {
    const last = head.lastElementChild;
    if (last !== link && [...head.querySelectorAll('link[rel="stylesheet"],style')].pop() !== link) head.append(link);
  };
  keepLast();
  if (typeof MutationObserver === 'function') {
    const observer = new MutationObserver(records => {
      if (records.some(r => [...r.addedNodes].some(n => n !== link && (n.tagName === 'LINK' || n.tagName === 'STYLE')))) keepLast();
    });
    observer.observe(head, { childList: true });
    return observer;
  }
  return null;
}

mountUnifiedTheme();
