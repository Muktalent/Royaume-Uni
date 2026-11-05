// staff-docs-v16 · Employee "Documents": read and sign contracts, receive HR documents, send documents to administration.
import {E} from './gp-ui.js';
import {putFile, openViewer, signaturePad, linkHrCss, fmtBytes, fmtWhen} from './hr-common.js';

const KIND = {contract: 'Contract', payslip: 'Payslip', policy: 'Policy', certificate: 'Certificate', id_document: 'Identity document', other: 'Document'};
const SEND_KINDS = [['id_document', 'Identity document'], ['certificate', 'Certificate / diploma'], ['other', 'Other document']];
const STATUS = {sent: ['New', 'amber'], viewed: ['Opened', 'blue'], signed: ['Signed', 'green'], submitted: ['Sent · awaiting review', 'blue'], approved: ['Approved', 'green'], rejected: ['Needs changes', 'red']};

const btn = (t, fn, cls = 'th-btn') => { const b = E('button', t, cls); b.type = 'button'; if (fn) b.onclick = fn; return b; };
const chip = (t, tone) => { const c = E('span', t, 'th-chip'); c.dataset.tone = tone; return c; };

export async function staffDocsSummary(api) {
  try { return (await api('/api/workspace/hr-docs/summary')).data; } catch { return {to_sign: 0, unread: 0}; }
}

export function signDialog({api, doc, staff, onSigned}) {
  return new Promise(resolve => {
    const dialog = E('dialog', undefined, 'th-confirm th-sign'); dialog.lang = 'en';
    const form = E('form', undefined, 'th-form');
    form.append(E('h2', 'Sign · ' + doc.title), E('p', 'Your signature, full name, date and time are added to every page of the PDF, together with a signature certificate.', 'th-muted'));
    const seg = E('div', undefined, 'th-seg'), drawB = btn('Draw signature', null, 'th-seg-btn'), typeB = btn('Type full name', null, 'th-seg-btn');
    seg.append(drawB, typeB);
    const pad = signaturePad(), typed = E('div', undefined, 'th-typed-sign'), preview = E('p', '', 'th-typed-preview');
    const name = E('input'); name.type = 'text'; name.required = true; name.maxLength = 200; name.value = staff?.full_name || ''; name.autocomplete = 'name'; name.id = 'thSignName';
    const nameLabel = E('label', 'Full legal name *'); nameLabel.htmlFor = name.id;
    typed.append(preview);
    let method = 'drawn';
    const paintMode = () => { drawB.setAttribute('aria-pressed', String(method === 'drawn')); typeB.setAttribute('aria-pressed', String(method === 'typed')); pad.el.hidden = method !== 'drawn'; typed.hidden = method !== 'typed'; preview.textContent = name.value || 'Your name'; };
    drawB.onclick = () => { method = 'drawn'; paintMode(); };
    typeB.onclick = () => { method = 'typed'; paintMode(); };
    name.oninput = () => { preview.textContent = name.value || 'Your name'; };
    const clear = btn('Clear', () => pad.clear(), 'th-btn th-ghost');
    pad.el.append(clear);
    const agreeL = E('label', undefined, 'th-check'), agree = E('input'); agree.type = 'checkbox'; agree.required = true;
    agreeL.append(agree, E('span', 'I have read this document and agree to sign it electronically.'));
    const msg = E('p', '', 'th-msg'), row = E('div', undefined, 'th-inline th-end'), go = E('button', 'Sign and submit', 'th-btn th-primary'); go.type = 'submit';
    row.append(btn('Cancel', () => dialog.close()), go);
    const nameField = E('div', undefined, 'th-field'); nameField.append(nameLabel, name);
    form.append(seg, pad.el, typed, nameField, agreeL, msg, row);
    dialog.append(form); document.body.append(dialog); paintMode();
    dialog.onclose = () => { dialog.remove(); resolve(); };
    dialog.showModal();
    form.onsubmit = async e => {
      e.preventDefault(); if (!form.reportValidity()) return;
      const strokes = method === 'drawn' ? pad.strokes() : [];
      if (method === 'drawn' && pad.empty()) { msg.className = 'th-msg th-error'; msg.textContent = 'Draw your signature, or choose "Type full name".'; return; }
      go.disabled = true; msg.className = 'th-msg'; msg.textContent = 'Signing…';
      try { await api('/api/workspace/hr-docs/' + doc.id + '/sign', {method: 'POST', body: JSON.stringify({full_name: name.value.trim(), method, strokes, agree: true})}); dialog.close(); onSigned?.(); }
      catch (err) { msg.className = 'th-msg th-error'; msg.textContent = err.message; go.disabled = false; }
    };
  });
}

export async function renderStaffDocs({host, api, readOnly = false, owner = null, staff, notice = () => {}, onChange}) {
  linkHrCss();
  const root = E('div', undefined, 'th-root th-ws'); root.lang = 'en'; host.append(root);
  const q = owner ? '?owner=' + encodeURIComponent(owner) : '';
  const todo = E('section', undefined, 'th-card'), received = E('section', undefined, 'th-card'), sent = E('section', undefined, 'th-card');
  root.append(todo, received);
  if (!readOnly) root.append(sent);
  const load = async () => {
    let docs = [];
    try { docs = (await api('/api/workspace/hr-docs' + q)).data; }
    catch (e) { root.replaceChildren(E('p', e.message, 'th-error th-pad')); return; }
    const inbox = docs.filter(d => d.direction === 'to_employee'), mine = docs.filter(d => d.direction === 'from_employee');
    const toSign = inbox.filter(d => (d.requires_signature && d.status !== 'signed') || (d.requires_ack && !d.acknowledged_at && !d.requires_signature));
    const nSign = toSign.filter(d => d.requires_signature).length, nAck = toSign.length - nSign;
    todo.replaceChildren(); received.replaceChildren(); sent.replaceChildren();
    const th = E('header', undefined, 'th-card-head'); const plural = n => n === 1 ? '' : 's';
    const todoText = [nSign ? `${nSign} document${plural(nSign)} to sign` : '', nAck ? `${nAck} document${plural(nAck)} to read and confirm` : ''].filter(Boolean).join(' and ');
    th.append(E('h3', toSign.length ? (nSign && nAck ? 'To sign or confirm' : nSign ? 'To sign' : 'To read and confirm') : 'All done'), E('p', toSign.length ? todoText + '. Open each one, read it to the end and complete it here.' : 'Nothing is waiting for your signature or confirmation.', 'th-muted'));
    todo.append(th); if (toSign.length) todo.classList.add('th-attention'); else todo.classList.remove('th-attention');
    for (const d of toSign) todo.append(row(d, true));
    const rh = E('header', undefined, 'th-card-head'); rh.append(E('h3', 'From MUKTalent'), E('p', 'Contracts, payslips and documents shared with you by administration.', 'th-muted'));
    received.append(rh);
    const rest = inbox.filter(d => !toSign.includes(d));
    if (!rest.length) received.append(E('p', 'No documents yet.', 'th-muted th-pad'));
    for (const d of rest) received.append(row(d, false));
    if (!readOnly) {
      const sh = E('header', undefined, 'th-card-head'); sh.append(E('h3', 'Send a document to administration'), E('p', 'Administration is notified when you send a new document.', 'th-muted'));
      sent.append(sh, uploadForm());
      for (const d of mine) sent.append(row(d, false));
    }
    onChange?.(toSign.length + inbox.filter(d => d.status === 'sent' && !toSign.includes(d)).length);
  };
  function row(d, primary) {
    const r = E('article', undefined, 'th-doc' + (d.status === 'sent' ? ' is-new' : ''));
    const main = E('div', undefined, 'th-doc-main');
    main.append(E('b', d.title), E('small', [KIND[d.kind] || 'Document', fmtWhen(d.created_at, 'en'), fmtBytes(d.bytes)].join(' · ')));
    if (d.note) main.append(E('small', '“' + d.note + '”', 'th-doc-note'));
    if (d.status === 'signed') main.append(E('small', `Signed by ${d.signer_name} · ${fmtWhen(d.signed_at, 'en')}`, 'th-ok'));
    if (d.acknowledged_at) main.append(E('small', 'You confirmed you read it · ' + fmtWhen(d.acknowledged_at, 'en'), 'th-ok'));
    if (d.expires_at && d.status !== 'signed') main.append(E('small', 'Available until ' + new Date(d.expires_at).toLocaleDateString('en-GB', {day: 'numeric', month: 'long', year: 'numeric'}), 'th-muted'));
    if (d.review_note) main.append(E('small', 'Administration: ' + d.review_note, d.status === 'rejected' ? 'th-error' : 'th-muted'));
    const [label, tone] = STATUS[d.status] || [d.status, 'grey'];
    const st = E('div', undefined, 'th-doc-state'); st.append(chip(label, tone)); if (d.requires_signature && d.status !== 'signed') st.append(chip('Signature required', 'ink'));
    if (d.requires_ack && !d.acknowledged_at && !d.requires_signature) st.append(chip('Confirm reading', 'amber'));
    if (d.view_only) st.append(chip('Read-only', 'ink'));
    const acts = E('div', undefined, 'th-doc-actions');
    const canSign = !readOnly && d.direction === 'to_employee' && d.requires_signature && d.status !== 'signed';
    const canAck = !readOnly && d.direction === 'to_employee' && d.requires_ack && !d.acknowledged_at && !d.requires_signature;
    const ackBar = dlg => {
      const bar = E('div', undefined, 'th-inline th-end'), hint = E('span', 'Scroll to the end of the document to confirm.', 'th-ack-hint');
      const b = btn('I have read and understood this document', async () => {
        b.disabled = true;
        try { await api('/api/workspace/hr-docs/' + d.id + '/ack', {method: 'POST', body: '{}'}); dlg.close(); notice('Thank you. Your confirmation has been recorded.'); load(); }
        catch (err) { hint.textContent = err.message; b.disabled = false; }
      }, 'th-btn th-primary');
      b.disabled = true;
      const ready = () => { b.disabled = false; hint.textContent = 'You reached the end of the document.'; };
      if (dlg.dataset.ended) ready(); else dlg.addEventListener('th-viewer-end', ready, {once: true});
      bar.append(hint, b); return bar;
    };
    const view = variant => openViewer({lang: 'en', title: d.title, subtitle: KIND[d.kind] || '', load: async () => { const r = await api('/api/workspace/hr-docs/' + d.id + '/file' + (variant ? '?variant=' + variant : '') + (owner ? (variant ? '&' : '?') + 'owner=' + encodeURIComponent(owner) : '')); if (!readOnly && d.status === 'sent') { d.status = 'viewed'; setTimeout(load, 300); } return r; }, actions: canAck ? [ackBar] : canSign ? [dlg => { const b = btn('Sign this document', async () => { dlg.close(); await signDialog({api, doc: d, staff, onSigned: () => { notice('Signed. Administration has received your signed copy.'); load(); }}); }, 'th-btn th-primary'); return b; }] : []});
    if (d.status === 'signed' && d.has_signed) acts.append(btn('Open signed copy', () => view('signed'), 'th-btn th-primary'));
    else acts.append(btn(canSign ? 'Read and sign' : canAck ? 'Read and confirm' : 'Open', () => view(), primary ? 'th-btn th-primary' : 'th-btn'));
    r.append(main, st, acts); return r;
  }
  function uploadForm() {
    const form = E('form', undefined, 'th-grid'), kind = E('select'), title = E('input'), file = E('input'), note = E('input');
    for (const [v, l] of SEND_KINDS) kind.append(new Option(l, v));
    title.type = 'text'; title.required = true; title.maxLength = 200; title.placeholder = 'e.g. Passport copy';
    file.type = 'file'; file.required = true; file.accept = 'application/pdf,image/jpeg,image/png';
    note.type = 'text'; note.maxLength = 2000; note.placeholder = 'Optional message';
    const f = (l, c, wide) => { const w = E('div', undefined, 'th-field' + (wide ? ' th-wide' : '')); c.id = 'thws' + Math.random().toString(36).slice(2, 7); const lab = E('label', l); lab.htmlFor = c.id; w.append(lab, c); return w; };
    const msg = E('p', '', 'th-msg'), go = E('button', 'Send', 'th-btn th-primary'); go.type = 'submit';
    const bar = E('div', undefined, 'th-form-bar th-wide'); bar.append(msg, go);
    form.append(f('Type', kind), f('Title', title), f('File (PDF, JPG or PNG · max 10 MB)', file), f('Message', note), bar);
    form.onsubmit = async e => {
      e.preventDefault(); if (!form.reportValidity()) return;
      const fl = file.files?.[0]; if (!fl) return;
      if (!['application/pdf', 'image/jpeg', 'image/png'].includes(fl.type)) { msg.className = 'th-msg th-error'; msg.textContent = 'Use a PDF, JPG or PNG file.'; return; }
      if (fl.size > 10 * 1024 * 1024) { msg.className = 'th-msg th-error'; msg.textContent = 'The file is larger than 10 MB.'; return; }
      go.disabled = true; msg.className = 'th-msg'; msg.textContent = 'Uploading…';
      try {
        const started = await api('/api/workspace/hr-docs/start', {method: 'POST', body: JSON.stringify({kind: kind.value, title: title.value.trim(), note: note.value.trim(), name: fl.name.slice(0, 200), mime: fl.type, bytes: fl.size})});
        await putFile(started, fl);
        await api('/api/workspace/hr-docs/finish', {method: 'POST', body: JSON.stringify({id: started.id})});
        notice('Document sent to administration.'); form.reset(); await load();
      } catch (err) { msg.className = 'th-msg th-error'; msg.textContent = err.message; go.disabled = false; return; }
      go.disabled = false;
    };
    return form;
  }
  root.append(E('p', 'Loading documents…', 'th-muted th-pad'));
  await load();
  root.querySelector(':scope > .th-pad')?.remove();
}
