/* MUK Talent v13 · Our Team carousel, counsellor faces, "Speak to Our Team" form (parents + assistant hand-off). */
(() => {
  "use strict";
  const d = document, $ = (s, r = d) => r.querySelector(s), $$ = (s, r = d) => [...r.querySelectorAll(s)];
  const lang = () => (window.MUKSite && window.MUKSite.lang) || d.documentElement.dataset.lang || "fr";
  const t = s => (window.MUKSite && window.MUKSite.t ? window.MUKSite.t(s) : s);
  const el = (tag, cls, text) => { const n = d.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const initials = n => String(n || "").split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "M";
  const REGION_LABEL = { maghreb: "Maghreb", asia: "Asie", latam: "Amérique latine" };

  /* ---------------- Team data ---------------- */
  let teamPromise = null;
  const team = () => teamPromise || (teamPromise = fetch("/api/public/team", { headers: { accept: "application/json" } }).then(r => r.ok ? r.json() : { data: [] }).then(j => Array.isArray(j.data) ? j.data : []).catch(() => []));
  const photo = (m, cls) => {
    const box = el("div", cls);
    const ph = el("span", "v13-face-ph", initials(m.name)); ph.setAttribute("data-no-i18n", "");
    if (m.photo) { const img = el("img"); img.alt = ""; img.loading = "lazy"; img.decoding = "async"; img.src = m.photo; img.onerror = () => img.replaceWith(ph); box.append(img); } else box.append(ph);
    return box;
  };

  /* ---------------- Footer carousel ---------------- */
  function mountTeam(section) {
    const track = $("[data-v13-team]", section); if (!track) return;
    const tabs = $$(".v13-team-tabs [data-region]", section);
    const navs = $$(".v13-team-nav", section);
    let region = lang() === "es" ? "latam" : "maghreb", people = [];
    const card = m => {
      const a = el("a", "v13-tcard"); a.href = m.url || "#"; a.setAttribute("aria-label", `${m.name} · ${m.title}`);
      const ph = photo(m, "v13-tcard-photo"); const tag = el("span", "v13-tcard-region", REGION_LABEL[m.region] || ""); ph.append(tag);
      const body = el("div", "v13-tcard-body"); const nm = el("strong", "", m.name); nm.setAttribute("data-no-i18n", "");
      body.append(nm, el("span", "", m.title));
      if (m.city) { const c = el("span", "", m.city); c.setAttribute("data-no-i18n", ""); body.append(c); }
      body.append(el("em", "", "Voir la carte ↗"));
      a.append(ph, body); return a;
    };
    const soon = () => { const a = el("a", "v13-tcard v13-tcard-soon"); a.href = "/contact/"; a.append(el("strong", "", "L’équipe s’agrandit"), el("span", "", "De nouveaux counsellors rejoignent bientôt cette région. Écrivez-nous en attendant : nous vous répondons depuis le Royaume-Uni."), el("em", "", "Nous contacter ↗")); return a; };
    const updateNav = () => { const max = track.scrollWidth - track.clientWidth - 2; const x = Math.abs(track.scrollLeft); navs[0] && (navs[0].disabled = x <= 2); navs[1] && (navs[1].disabled = x >= max); };
    const render = () => {
      tabs.forEach(b => b.setAttribute("aria-selected", String(b.dataset.region === region)));
      const list = people.filter(p => p.region === region);
      track.replaceChildren(...(list.length ? list.map(card) : []), ...(list.length < 2 ? [soon()] : []));
      track.scrollLeft = 0; requestAnimationFrame(updateNav);
    };
    tabs.forEach(b => b.addEventListener("click", () => { region = b.dataset.region; render(); }));
    section.querySelector(".v13-team-tabs")?.addEventListener("keydown", e => { if (!/Arrow(Left|Right)/.test(e.key)) return; const i = tabs.findIndex(b => b.dataset.region === region); const dir = (e.key === "ArrowRight") !== (d.documentElement.dir === "rtl") ? 1 : -1; const n = tabs[(i + dir + tabs.length) % tabs.length]; region = n.dataset.region; render(); n.focus(); });
    navs.forEach(b => b.addEventListener("click", () => { const step = (track.querySelector(".v13-tcard")?.offsetWidth || 220) + 16; const rtl = d.documentElement.dir === "rtl"; track.scrollBy({ left: Number(b.dataset.dir) * step * (rtl ? -1 : 1) * Math.max(1, Math.floor(track.clientWidth / step)), behavior: "smooth" }); }));
    track.addEventListener("scroll", () => requestAnimationFrame(updateNav), { passive: true });
    addEventListener("resize", updateNav, { passive: true });
    team().then(list => { people = list; if (!list.some(p => p.region === region) && list.length) region = list[0].region; render(); });
  }

  /* ---------------- Home faces ---------------- */
  function mountFaces(box) {
    team().then(list => {
      const pick = list.slice(0, 4);
      const items = pick.length ? pick : [{ name: "M U" }, { name: "K T" }, { name: "U K" }];
      box.replaceChildren(...items.map(m => { const f = photo(m, "v13-face"); if (m.photo) { const b = el("b", "", m.name.split(" ")[0]); b.setAttribute("data-no-i18n", ""); f.append(b); } return f; }));
    });
  }

  /* ---------------- Speak to Our Team ---------------- */
  const COUNTRIES = [["Maghreb", ["Maroc", "Algérie", "Tunisie", "Libye", "Mauritanie"]], ["Asie", ["Inde", "Pakistan", "Bangladesh", "Népal", "Sri Lanka", "Chine", "Vietnam", "Indonésie", "Malaisie", "Philippines"]], ["Amérique latine", ["Mexique", "Colombie", "Pérou", "Chili", "Argentine", "Brésil", "Équateur"]], ["Europe", ["Royaume-Uni", "France", "Espagne"]]];
  const PRIOS = [["budget", "Budget et frais"], ["university", "Choix de l’université"], ["visa", "Visa"], ["housing", "Logement"], ["scholarships", "Bourses"], ["safety", "Sécurité et bien-être"], ["follow_up", "Suivi et communication"], ["english", "Anglais / IELTS"]];
  let dlg = null, lastFocus = null, ctx = {};
  function field(label, input) { const l = el("label", "v13-field"); l.append(el("span", "", label), input); return l; }
  function build() {
    dlg = el("dialog", "v13-talk"); dlg.setAttribute("aria-labelledby", "v13-talk-title");
    const head = el("div", "v13-talk-head"); const x = el("button", "v13-talk-x", "×"); x.type = "button"; x.setAttribute("aria-label", "Fermer"); x.onclick = close;
    const h2 = el("h2", "", "Vous n’avez pas à prendre cette décision seuls."); h2.id = "v13-talk-title";
    head.append(el("p", "", "Parler à notre équipe"), h2, el("span", "", "Laissez vos coordonnées : un membre de l’équipe et le counsellor de votre région vous recontactent."), x);
    const f = el("form"); f.noValidate = true;
    const name = el("input"); name.name = "name"; name.autocomplete = "name"; name.required = true; name.maxLength = 120;
    const email = el("input"); email.name = "email"; email.type = "email"; email.autocomplete = "email"; email.required = true; email.maxLength = 160;
    const phone = el("input"); phone.name = "phone"; phone.type = "tel"; phone.autocomplete = "tel"; phone.required = true; phone.maxLength = 40; phone.placeholder = "+212 6…"; phone.dir = "ltr";
    const country = el("select"); country.name = "country"; country.required = true;
    const o0 = el("option", "", "Choisir un pays"); o0.value = ""; country.append(o0);
    for (const [g, list] of COUNTRIES) { const og = el("optgroup"); og.label = g; for (const c of list) { const o = el("option", "", c); o.value = c; og.append(o); } country.append(og); }
    const oo = el("option", "", "Autre pays"); oo.value = "__other"; country.append(oo);
    const other = el("input"); other.name = "country_other"; other.maxLength = 80; other.placeholder = "Votre pays"; const otherWrap = field("Pays", other); otherWrap.hidden = true;
    country.onchange = () => { otherWrap.hidden = country.value !== "__other"; if (!otherWrap.hidden) other.focus(); };
    const rel = el("select"); rel.name = "relation"; for (const [v, l] of [["parent", "Parent ou famille"], ["student", "Étudiant(e)"], ["other", "Autre"]]) { const o = el("option", "", l); o.value = v; rel.append(o); }
    const prios = el("fieldset", "v13-chips"); const lg = el("legend", "v13-legend", "Vos priorités"); lg.style.marginBottom = "8px"; prios.append(lg);
    for (const [v, l] of PRIOS) { const lab = el("label"); const cb = el("input"); cb.type = "checkbox"; cb.name = "priorities"; cb.value = v; lab.append(cb, el("span", "", l)); prios.append(lab); }
    const msg = el("textarea"); msg.name = "message"; msg.maxLength = 1500; msg.placeholder = "Votre question ou ce qui compte le plus pour vous (facultatif)";
    const hp = el("input", "v13-hp"); hp.name = "website"; hp.tabIndex = -1; hp.autocomplete = "off"; hp.setAttribute("aria-hidden", "true");
    const consent = el("label", "v13-consent"); const cc = el("input"); cc.type = "checkbox"; cc.name = "consent"; cc.required = true;
    const ct = el("span"); ct.append(d.createTextNode("J’accepte que MUK Talent utilise ces informations pour me recontacter, conformément à la "), Object.assign(el("a", "", "politique de confidentialité"), { href: "/privacy/", target: "_blank" }), d.createTextNode("."));
    consent.append(cc, ct);
    const err = el("p", "v13-err"); err.hidden = true; err.setAttribute("role", "alert");
    const submit = el("button", "v13-submit", "Envoyer à l’équipe"); submit.type = "submit";
    const r1 = el("div", "v13-row"); r1.append(field("Nom complet", name), field("Vous êtes", rel));
    const r2 = el("div", "v13-row"); r2.append(field("Email", email), field("Téléphone / WhatsApp", phone));
    f.append(r1, r2, field("Pays", country), otherWrap, prios, field("Message", msg), hp, consent, err, submit);
    f.addEventListener("submit", async e => {
      e.preventDefault(); err.hidden = true; $$("[aria-invalid]", f).forEach(n => n.removeAttribute("aria-invalid"));
      const c = country.value === "__other" ? other.value.trim() : country.value;
      const body = { source: ctx.source || "parents", name: name.value.trim(), email: email.value.trim(), phone: phone.value.trim(), country: c, relation: rel.value, priorities: $$('input[name="priorities"]:checked', f).map(n => n.value), message: msg.value.trim(), lang: lang(), page: location.pathname, transcript: ctx.transcript || [], consent: cc.checked, website: hp.value };
      const bad = (n, m) => { n.setAttribute("aria-invalid", "true"); err.textContent = t(m); err.hidden = false; n.focus(); };
      if (body.name.length < 2) return bad(name, "Indiquez votre nom.");
      if (!/^\S+@\S+\.\S{2,}$/.test(body.email)) return bad(email, "Indiquez un email valide.");
      if (!/^[+()\d\s.-]{6,40}$/.test(body.phone)) return bad(phone, "Indiquez un numéro de téléphone valide.");
      if (body.country.length < 2) return bad(country.value === "__other" ? other : country, "Choisissez votre pays.");
      if (body.source !== "assistant" && !body.priorities.length && !body.message) { err.textContent = t("Choisissez au moins une priorité ou écrivez un message."); err.hidden = false; return; }
      if (!body.consent) return bad(cc, "Merci d’accepter la politique de confidentialité.");
      submit.disabled = true; submit.textContent = t("Envoi…");
      try {
        const r = await fetch("/api/inquiries", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || "L’envoi n’a pas abouti. Réessayez ou écrivez-nous sur WhatsApp.");
        done(j.reference);
        try { window.gtag && gtag("event", "generate_lead", { method: body.source === "assistant" ? "assistant_handoff" : "speak_to_team" }); } catch {}
      } catch (x) { err.textContent = t(x.message || "L’envoi n’a pas abouti. Réessayez ou écrivez-nous sur WhatsApp."); err.hidden = false; }
      finally { submit.disabled = false; submit.textContent = t("Envoyer à l’équipe"); }
    });
    dlg.append(head, f);
    dlg.addEventListener("close", () => { d.documentElement.classList.remove("v13-lock"); lastFocus?.focus?.(); });
    dlg.addEventListener("click", e => { if (e.target === dlg) close(); });
    d.body.append(dlg);
  }
  function done(ref) {
    const f = $("form", dlg); const box = el("div", "v13-done");
    const mark = el("span", "v13-done-mark"); mark.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.2 4.2L19 7"/></svg>';
    const p = el("p", "", "Merci. Votre demande est bien enregistrée : l’équipe et le counsellor de votre région vont vous recontacter par email ou WhatsApp.");
    const refP = el("p"); refP.append(d.createTextNode(t("Référence :") + " ")); const code = el("code", "", ref || "—"); code.setAttribute("data-no-i18n", ""); refP.append(code);
    const ok = el("button", "v13-submit", "Fermer"); ok.type = "button"; ok.onclick = close; ok.style.minWidth = "180px";
    box.append(mark, el("h3", "", "Demande envoyée"), p, refP, ok); f.replaceWith(box); ok.focus();
  }
  function open(opts = {}) {
    if (dlg && !$("form", dlg)) { dlg.remove(); dlg = null; }
    if (!dlg) build();
    ctx = opts; lastFocus = d.activeElement;
    const f = $("form", dlg);
    if (opts.message) $('textarea[name="message"]', f).value = String(opts.message).slice(0, 1500);
    $("h2", dlg).textContent = t(opts.source === "assistant" ? "Parler à un counsellor" : "Vous n’avez pas à prendre cette décision seuls.");
    if (opts.source === "assistant") $('select[name="relation"]', f).value = "student";
    if (opts.priority) { const cb = $(`input[name="priorities"][value="${opts.priority}"]`, f); if (cb) cb.checked = true; }
    d.documentElement.classList.add("v13-lock");
    dlg.showModal ? dlg.showModal() : dlg.setAttribute("open", "");
    setTimeout(() => $('input[name="name"]', f)?.focus(), 60);
  }
  function close() { dlg?.open ? dlg.close() : dlg?.removeAttribute("open"); d.documentElement.classList.remove("v13-lock"); }
  window.MUKTalk = Object.freeze({ open, close });

  function init() {
    $$("#notre-equipe").forEach(mountTeam);
    $$("[data-v13-faces]").forEach(mountFaces);
    d.addEventListener("click", e => { const b = e.target.closest("[data-v13-talk]"); if (!b) return; e.preventDefault(); open({ source: location.pathname.startsWith("/parents") ? "parents" : "home", priority: b.dataset.priority }); });
    if (location.hash === "#parler") open({ source: "parents" });
  }
  d.readyState === "loading" ? d.addEventListener("DOMContentLoaded", init) : init();
})();
