/* MUKTalent Healthcare – forms, registration with secure CV upload, enquiries, complaints and vacancies. */
(() => {
"use strict";
const d = document, BASE = "/healthcare", T = (s, v) => (window.hcT ? window.hcT(s, v) : s);
const lang = () => window.HC_LANG || "en";
const ready = window.hcReady || Promise.resolve();
const esc = s => String(s ?? "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
const MAX = 10 * 1024 * 1024;
const MIME = { pdf: "application/pdf", doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };
const PROF = { registered_nurse: "Registered Nurse", adult_nurse: "Adult Nurse", mental_health_nurse: "Mental Health Nurse", learning_disability_nurse: "Learning Disability Nurse", physiotherapist: "Physiotherapist", occupational_therapist: "Occupational Therapist", radiographer: "Radiographer", biomedical_scientist: "Biomedical Scientist", pharmacist: "Pharmacist", other_ahp: "Other Allied Health Professional", healthcare_support_worker: "Healthcare Support Worker", social_care_professional: "Social Care Professional", other: "Other healthcare role" };
const CONTRACT = { permanent: "Permanent", fixed_term: "Fixed term", bank: "Bank", locum: "Locum", part_time: "Part time", full_time: "Full time" };

/* ---------- countries ---------- */
const ISO = "AF AX AL DZ AS AD AO AI AQ AG AR AM AW AU AT AZ BS BH BD BB BY BE BZ BJ BM BT BO BQ BA BW BR IO BN BG BF BI CV KH CM CA KY CF TD CL CN CX CC CO KM CG CD CK CR CI HR CU CW CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FK FO FJ FI FR GF PF GA GM GE DE GH GI GR GL GD GP GU GT GG GN GW GY HT VA HN HK HU IS IN ID IR IQ IE IM IL IT JM JP JE JO KZ KE KI KP KR XK KW KG LA LV LB LS LR LY LI LT LU MO MG MW MY MV ML MT MH MQ MR MU YT MX FM MD MC MN ME MS MA MZ MM NA NR NP NL NC NZ NI NE NG NU NF MK MP NO OM PK PW PS PA PG PY PE PH PN PL PT PR QA RE RO RU RW BL SH KN LC MF PM VC WS SM ST SA SN RS SC SL SG SX SK SI SB SO ZA SS ES LK SD SR SJ SE CH SY TW TJ TZ TH TL TG TK TO TT TN TR TM TC TV UG UA AE GB US UY UZ VU VE VN VG VI WF EH YE ZM ZW".split(" ");
function fillCountries() {
  let dn = null;
  try { dn = new Intl.DisplayNames([lang() === "en" ? "en-GB" : lang()], { type: "region" }); } catch {}
  const list = ISO.map(c => [c, (dn && dn.of(c)) || c]).sort((a, b) => a[1].localeCompare(b[1], lang()));
  d.querySelectorAll("select[data-countries]").forEach(s => {
    const first = s.options[0];
    s.innerHTML = ""; s.appendChild(first);
    for (const [c, n] of list) { const o = d.createElement("option"); o.value = c; o.textContent = n; o.setAttribute("translate", "no"); s.appendChild(o); }
  });
}

/* ---------- helpers ---------- */
async function api(path, body) {
  const r = await fetch(`/api/hc/public/${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), credentials: "same-origin" });
  let j = {}; try { j = await r.json(); } catch {}
  if (!r.ok) { const e = new Error(j.error || T("Something went wrong. Please try again or email agents@muktalent.com.")); e.field = j.field; throw e; }
  return j;
}
function put(url, file, onProgress) {
  return new Promise((res, rej) => {
    const x = new XMLHttpRequest();
    x.open("PUT", url); x.setRequestHeader("Content-Type", file.type); x.setRequestHeader("x-upsert", "false");
    x.upload.onprogress = e => e.lengthComputable && onProgress(e.loaded / e.total);
    x.onload = () => (x.status >= 200 && x.status < 300 ? res() : rej(new Error("upload")));
    x.onerror = () => rej(new Error("upload"));
    x.send(file);
  });
}
const fileType = f => f.type && Object.values(MIME).includes(f.type) ? f.type : MIME[(f.name.split(".").pop() || "").toLowerCase()] || "";
function setErr(form, name, msg) {
  const e = form.querySelector(`[data-err="${name}"]`); if (e) e.textContent = msg || "";
  const inp = form.querySelector(`[name="${name}"]`);
  if (inp) { inp.toggleAttribute("aria-invalid", !!msg); if (msg && e) { e.id ||= `e-${name}-${Math.random().toString(36).slice(2, 7)}`; inp.setAttribute("aria-describedby", [inp.getAttribute("aria-describedby"), e.id].filter(Boolean).join(" ")); } }
}
function validate(form) {
  let first = null;
  form.querySelectorAll("[data-err]").forEach(e => setErr(form, e.dataset.err, ""));
  for (const el of form.querySelectorAll("input[required],select[required],textarea[required]")) {
    if (el.closest("[hidden]")) continue;
    let m = "";
    if (el.type === "checkbox" && !el.checked) m = el.name === "privacy" ? T("Please confirm to continue.") : T("This field is required.");
    else if (el.type !== "checkbox" && !el.value.trim()) m = T("This field is required.");
    else if (el.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value.trim())) m = T("Please enter a valid email address.");
    else if (el.type === "tel" && el.value.replace(/\D/g, "").length < 7) m = T("Please enter a valid telephone number.");
    else if (el.type === "number" && el.value !== "" && !el.checkValidity()) m = T("Please enter a valid number.");
    if (m) { setErr(form, el.name, m); first ||= el; }
  }
  for (const el of form.querySelectorAll('input[type="tel"]:not([required])')) if (el.value && el.value.replace(/\D/g, "").length < 7) { setErr(form, el.name, T("Please enter a valid telephone number.")); first ||= el; }
  return first;
}
function data(form) {
  const o = {};
  for (const el of form.elements) {
    if (!el.name || el.type === "file" || el.closest("[hidden]") && el.name !== "website") continue;
    if (el.type === "checkbox") { if (el.name === "professions") { (o.professions ||= []); if (el.checked) o.professions.push(el.value); } else o[el.name] = el.checked; }
    else if (el.value.trim() !== "") o[el.name] = el.value.trim();
  }
  o.lang = lang();
  return o;
}
function busy(form, on) {
  const b = form.querySelector('button[type="submit"]'); if (!b) return;
  b.disabled = on; b.classList.toggle("is-busy", on);
  const s = b.querySelector("span");
  if (on) { b.dataset.label = s.textContent; s.textContent = T("Sending…"); } else if (b.dataset.label) s.textContent = b.dataset.label;
}
function fail(form, err) {
  const m = form.querySelector("[data-msg]");
  if (err.field && form.querySelector(`[data-err="${err.field}"]`)) { setErr(form, err.field, T(err.message)); form.querySelector(`[name="${err.field}"]`)?.focus(); }
  m.textContent = T(err.message); m.hidden = false;
}
function success(form, ref, extra = "") {
  const s = form.querySelector("[data-success]");
  [...form.children].forEach(c => { if (c !== s) c.hidden = true; });
  s.querySelector("[data-ref]").textContent = ref || "—";
  s.querySelector("[data-success-extra]").innerHTML = extra;
  s.hidden = false; s.focus({ preventScroll: true });
  s.scrollIntoView({ behavior: "smooth", block: "center" });
}

/* ---------- file input ---------- */
function initFile(form) {
  const box = form.querySelector("[data-file]"); if (!box) return;
  const inp = box.querySelector('input[type="file"]'), name = box.querySelector("[data-file-name]");
  const def = name.textContent;
  const show = () => {
    setErr(form, "cv", "");
    const f = inp.files[0];
    if (!f) { name.textContent = def; box.classList.remove("has-file"); return; }
    if (!fileType(f)) { setErr(form, "cv", T("Please upload a PDF or Word document.")); inp.value = ""; name.textContent = def; return; }
    if (f.size > MAX) { setErr(form, "cv", T("The file is larger than 10 MB.")); inp.value = ""; name.textContent = def; return; }
    name.textContent = `${f.name} · ${(f.size / 1048576).toFixed(1)} MB`; box.classList.add("has-file");
  };
  inp.addEventListener("change", show);
  ["dragenter", "dragover"].forEach(e => box.addEventListener(e, ev => { ev.preventDefault(); box.classList.add("drag"); }));
  ["dragleave", "drop"].forEach(e => box.addEventListener(e, ev => { ev.preventDefault(); box.classList.remove("drag"); }));
  box.addEventListener("drop", ev => { if (ev.dataTransfer.files.length) { inp.files = ev.dataTransfer.files; show(); } });
}

/* ---------- forms ---------- */
function initForm(form) {
  const kind = form.dataset.hcForm, t0 = Date.now();
  initFile(form);
  form.addEventListener("submit", async e => {
    e.preventDefault();
    form.querySelector("[data-msg]").hidden = true;
    const bad = validate(form);
    if (bad) { bad.focus(); return; }
    const body = { ...data(form), elapsed: Date.now() - t0 };
    busy(form, true);
    try {
      if (kind === "register") {
        const f = form.querySelector('input[type="file"]')?.files[0];
        if (f) body.cv = { name: f.name.slice(0, 200), type: fileType(f), size: f.size };
        if (body.experience_years != null) body.experience_years = Number(body.experience_years);
        const r = await api("register", body);
        if (r.status === "check_email") return success(form, "—", `<p>${T("You are already registered with this email address. We have sent you an email with the next steps and a link to the candidate portal.")}</p>`);
        let extra = "";
        if (r.upload && f) {
          const bar = form.querySelector("[data-file-progress]"), i = bar.querySelector("i"); bar.hidden = false;
          try {
            await put(r.upload.signedUrl, f, p => i.style.width = `${Math.round(p * 100)}%`);
            await api("register/complete-upload", { documentId: r.upload.documentId, path: r.upload.path });
          } catch { extra += `<p class="hc-small">${T("Your registration is saved, but your CV could not be uploaded. You can upload it later in the candidate portal.")}</p>`; }
        }
        if (r.restricted) extra += `<div class="hc-note">${T("Your country of residence is on the Code of Practice red or amber list. We cannot actively recruit from this country, but you can apply directly to UK employers, for example on <a href=\"https://www.jobs.nhs.uk/\" target=\"_blank\" rel=\"noopener\">NHS Jobs</a>.")}</div>`;
        extra += `<p style="margin-top:22px"><a class="hc-btn hc-btn-teal" href="${BASE}/portal/?signup=1&email=${encodeURIComponent(body.email)}">${T("Create your portal account")}</a></p>`;
        success(form, r.reference, extra);
      } else {
        if (kind === "enquiry") body.route = form.dataset.route;
        if (body.vacancies_count) body.vacancies_count = Number(body.vacancies_count);
        const r = await api(kind === "complaint" ? "complaint" : "enquiry", body);
        success(form, r.reference);
      }
      window.gtag?.("event", "generate_lead", { form: kind });
    } catch (err) { fail(form, err); }
    finally { busy(form, false); }
  });
  form.addEventListener("input", e => { if (e.target.name) setErr(form, e.target.name, ""); });
}

/* ---------- contact routes ---------- */
function initRoutes() {
  const tabs = d.querySelectorAll("[data-route-tab]"); if (!tabs.length) return;
  const form = d.querySelector("[data-route-form]"), emp = d.querySelector("[data-employer-form]"), title = d.querySelector("[data-route-title]");
  const titles = { candidate: "Candidate enquiry", general: "General business enquiry" };
  const set = r => {
    tabs.forEach(t => t.setAttribute("aria-selected", String(t.dataset.routeTab === r)));
    emp.hidden = r !== "employer"; form.hidden = r === "employer";
    if (r !== "employer") { form.dataset.route = r; title.textContent = T(titles[r]); form.querySelectorAll("[data-only]").forEach(n => n.hidden = n.dataset.only !== r); }
  };
  tabs.forEach(t => t.addEventListener("click", () => set(t.dataset.routeTab)));
  const q = new URLSearchParams(location.search).get("route") || location.hash.slice(1);
  if (["candidate", "employer", "general"].includes(q)) set(q);
}

/* ---------- vacancies ---------- */
const salary = v => v.salary_text || (v.salary_min ? `£${Number(v.salary_min).toLocaleString("en-GB")}${v.salary_max ? `–£${Number(v.salary_max).toLocaleString("en-GB")}` : ""}` : T("Salary provided by the employer"));
const dateFmt = s => { try { return new Date(s).toLocaleDateString(lang() === "ar" ? "ar" : lang(), { day: "numeric", month: "long", year: "numeric" }); } catch { return s; } };
async function initVacancies() {
  const list = d.querySelector("[data-vac-list]"); if (!list) return;
  const filter = d.querySelector("[data-vac-filter]"), count = d.querySelector("[data-vac-count]"), empty = d.querySelector("[data-vac-empty]");
  const listView = d.querySelector("[data-vac-list-view]"), detail = d.querySelector("[data-vac-detail-view]"), hero = d.querySelector("[data-vac-hero]");
  const slug = new URLSearchParams(location.search).get("v");
  if (slug && /^[a-z0-9][a-z0-9-]{2,90}$/.test(slug)) {
    listView.hidden = true; detail.hidden = false; hero.hidden = true;
    detail.innerHTML = `<div class="hc-skel" style="height:320px"></div>`;
    try {
      const r = await fetch(`/api/hc/public/vacancies/${slug}`); if (!r.ok) throw 0;
      const v = (await r.json()).data;
      d.title = `${v.title} · MUKTalent Healthcare`;
      const block = (h, t) => t ? `<h3>${T(h)}</h3><p>${esc(t).replace(/\n/g, "<br>")}</p>` : "";
      detail.innerHTML = `<p class="hc-crumbs-back"><a class="hc-link" href="${BASE}/vacancies/">← ${T("All vacancies")}</a></p>
<div class="hc-vac-detail"><article class="hc-prose" lang="en"><p class="hc-kicker"><span>${T(PROF[v.profession] || "Healthcare")}</span></p><h1 class="hc-vac-title">${esc(v.title)}</h1>
${block("About the role", v.description)}${block("Qualifications", v.qualifications)}${block("Registration requirements", v.registration_requirements)}${block("Conditions", v.conditions)}</article>
<aside class="hc-vac-facts hc-card"><dl>
<div><dt>${T("Employer")}</dt><dd>${esc(v.employer_display || T("Confidential UK employer"))}</dd></div>
<div><dt>${T("Location")}</dt><dd>${esc(v.location || "—")}</dd></div>
<div><dt>${T("Salary")}</dt><dd>${esc(salary(v))}</dd></div>
${v.contract_type ? `<div><dt>${T("Contract")}</dt><dd>${T(CONTRACT[v.contract_type] || v.contract_type)}</dd></div>` : ""}
${v.working_hours ? `<div><dt>${T("Working hours")}</dt><dd>${esc(v.working_hours)}</dd></div>` : ""}
<div><dt>${T("Visa sponsorship")}</dt><dd>${T(v.visa_sponsorship ? "Available from the employer, subject to eligibility" : "Not offered for this role")}</dd></div>
${v.closes_on ? `<div><dt>${T("Closing date")}</dt><dd>${dateFmt(v.closes_on)}</dd></div>` : ""}</dl>
<a class="hc-btn hc-btn-gold" href="${BASE}/register/?vacancy=${encodeURIComponent(v.slug)}">${T("Apply for this role")}</a>
<p class="hc-small">${T("No fees are charged to candidates. Applying does not guarantee an interview or an offer.")}</p></aside></div>`;
    } catch {
      detail.innerHTML = `<div class="hc-empty"><h3>${T("This vacancy is no longer available.")}</h3><p><a class="hc-link" href="${BASE}/vacancies/">${T("See all vacancies")}</a></p></div>`;
    }
    return;
  }
  let all = [];
  const render = () => {
    const f = filter.value, rows = all.filter(v => !f || v.profession === f);
    count.textContent = rows.length ? T("{n} vacancies", { n: rows.length }) : "";
    empty.hidden = rows.length > 0; list.hidden = !rows.length;
    list.innerHTML = rows.map(v => `<a class="hc-vac hc-rv in" href="${BASE}/vacancies/?v=${encodeURIComponent(v.slug)}"><div><span class="tag">${T(PROF[v.profession] || "Healthcare")}</span><h3 lang="en">${esc(v.title)}</h3><p>${esc(v.employer_display || T("Confidential UK employer"))} · ${esc(v.location || "")}</p></div><div class="hc-vac-side"><b>${esc(salary(v))}</b>${v.closes_on ? `<small>${T("Closes {d}", { d: dateFmt(v.closes_on) })}</small>` : ""}<span class="hc-link">${T("View role")} →</span></div></a>`).join("");
  };
  try { const r = await fetch("/api/hc/public/vacancies"); all = r.ok ? (await r.json()).data || [] : []; } catch { all = []; }
  const p = new URLSearchParams(location.search).get("profession"); if (p && PROF[p]) filter.value = p;
  filter.addEventListener("change", render); render();
}

/* ---------- register: vacancy and profession preselect ---------- */
async function initRegister() {
  const form = d.querySelector('[data-hc-form="register"]'); if (!form) return;
  const q = new URLSearchParams(location.search);
  const p = q.get("profession"); if (p && PROF[p]) form.profession.value = p;
  const slug = q.get("vacancy");
  if (slug && /^[a-z0-9][a-z0-9-]{2,90}$/.test(slug)) {
    try {
      const r = await fetch(`/api/hc/public/vacancies/${slug}`); if (!r.ok) return;
      const v = (await r.json()).data;
      form.vacancy.value = v.slug; if (PROF[v.profession]) form.profession.value = v.profession;
      const box = d.querySelector("[data-vacancy-box]");
      box.querySelector("[data-vacancy-title]").textContent = v.title;
      box.querySelector("[data-vacancy-meta]").textContent = [v.employer_display, v.location].filter(Boolean).join(" · ");
      box.hidden = false;
    } catch {}
  }
}

ready.then(() => {
  fillCountries();
  d.querySelectorAll("form[data-hc-form]").forEach(initForm);
  initRoutes(); initVacancies(); initRegister();
});
})();
