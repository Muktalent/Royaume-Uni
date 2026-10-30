function el(tag, text, cls) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (cls) node.className = cls;
  return node;
}
export function mountStaffAccounts({ api, onCreated }) {
  if (document.getElementById("teamAccountControls")) return;
  const host = document.querySelector("#appShell .page-header");
  if (!host) return;
  const controls = el("div", undefined, "form-actions");
  controls.id = "teamAccountControls";
  const open = el("button", "Create collaborator", "secondary");
  open.type = "button";
  controls.append(open);
  host.after(controls);
  const dialog = el("dialog", undefined, "record-dialog");
  dialog.lang = "en";
  dialog.setAttribute("aria-labelledby", "teamAccountTitle");
  const header = el("header", undefined, "dialog-header");
  const title = el("h2", "Create collaborator");
  title.id = "teamAccountTitle";
  const close = el("button", "Close", "secondary");
  close.type = "button";
  header.append(title, close);
  const body = el("div", undefined, "dialog-body");
  body.append(el("p", "Creates a Supabase Auth account and links it to Team as an active collaborator. No invitation email is sent. Automatic password change at first login is not enabled yet.", "notice"));
  const form = el("form");
  const fields = {};
  for (const [name, label, type, max] of [
    ["full_name", "Full name", "text", 200],
    ["email", "Work email", "email", 320],
    ["password", "Initial password (at least 14 characters)", "password", 128]
  ]) {
    const wrapper = el("div", undefined, "field");
    const caption = el("label", label);
    const input = el("input");
    input.id = `team-account-${name}`;
    caption.htmlFor = input.id;
    input.name = name;
    input.type = type;
    input.required = true;
    input.maxLength = max;
    input.autocomplete = name === "password" ? "new-password" : name === "email" ? "email" : "name";
    if (name === "password") input.minLength = 14;
    fields[name] = input;
    wrapper.append(caption, input);
    form.append(wrapper);
  }
  const submit = el("button", "Create account", "primary");
  submit.type = "submit";
  const actions = el("div", undefined, "form-actions");
  actions.append(submit);
  form.append(actions);
  const status = el("p", "", "message");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  body.append(form, status);
  dialog.append(header, body);
  // Keep this dialog inside appShell: logging out also hides its contents.
  document.getElementById("appShell").append(dialog);
  let busy = false;
  let completed = false;
  function dismiss() {
    if (busy) return;
    fields.password.value = "";
    dialog.close();
  }
  close.addEventListener("click", dismiss);
  dialog.addEventListener("cancel", event => { event.preventDefault(); dismiss(); });
  open.addEventListener("click", () => {
    form.reset();
    completed = false;
    submit.disabled = false;
    status.textContent = "";
    status.classList.remove("error");
    dialog.showModal();
    fields.full_name.focus();
  });
  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (busy || completed || !form.reportValidity()) return;
    if (!window.confirm(`Create an active collaborator account for ${fields.email.value.trim()}?`)) return;
    busy = true;
    submit.disabled = true;
    close.disabled = true;
    status.classList.remove("error");
    status.textContent = "Creating account. Do not close this window…";
    try {
      const result = await api("/api/team-accounts", {
        method: "POST", body: JSON.stringify({
          full_name: fields.full_name.value.trim(),
          email: fields.email.value.trim(),
          password: fields.password.value
        })
      });
      completed = true;
      status.textContent = `Account created for ${result.email}. Role: collaborator. Share the password securely. You can now sign in with this account.`;
      if (onCreated) {
        try { await onCreated(); }
        catch { status.textContent += " Refresh Team to update the list."; }
      }
    } catch (error) {
      status.textContent = `${error.message} If the request was interrupted, check Supabase Auth and Team before retrying.`;
      status.classList.add("error");
    } finally {
      fields.password.value = "";
      busy = false;
      close.disabled = false;
      submit.disabled = completed;
    }
  });
  // Auth sign-out can occur while the dialog is open.
  const observer = new MutationObserver(() => {
    if (document.getElementById("appShell").hidden) {
      fields.password.value = "";
      if (dialog.open) dialog.close();
      status.textContent = "";
    }
  });
  observer.observe(document.getElementById("appShell"), { attributes: true, attributeFilter: ["hidden"] });
}
