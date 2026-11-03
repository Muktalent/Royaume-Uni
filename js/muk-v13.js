/* MUK Talent v13–v14 · Our Team gallery (About), new-content videos (home), counsellor faces, "Speak to Our Team" form (parents + assistant hand-off). */
(() => {
  "use strict";
  const d = document, $ = (s, r = d) => r.querySelector(s), $$ = (s, r = d) => [...r.querySelectorAll(s)];
  const lang = () => (window.MUKSite && window.MUKSite.lang) || d.documentElement.dataset.lang || "fr";
  const t = s => (window.MUKSite && window.MUKSite.t ? window.MUKSite.t(s) : s);
  const el = (tag, cls, text) => { const n = d.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const initials = n => String(n || "").split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "M";

  /* ---------------- Team data ---------------- */
  let teamPromise = null;
  const team = () => teamPromise || (teamPromise = fetch("/api/public/team", { headers: { accept: "application/json" } }).then(r => r.ok ? r.json() : { data: [] }).then(j => Array.isArray(j.data) ? j.data : []).catch(() => []));
  const photo = (m, cls) => {
    const box = el("div", cls);
    const ph = el("span", "v13-face-ph", initials(m.name)); ph.setAttribute("data-no-i18n", "");
    if (m.photo) { const img = el("img"); img.alt = ""; img.loading = "lazy"; img.decoding = "async"; img.src = m.photo; img.onerror = () => img.replaceWith(ph); box.append(img); } else box.append(ph);
    return box;
  };

  /* ---------------- Team gallery (About page) ---------------- */
  function mountTeam(section) {
    const track = $("[data-v13-team]", section); if (!track) return;
    const navs = $$(".v13-team-nav", section);
    const card = m => {
      const a = el("a", "v13-tcard"); a.href = m.url || "#"; a.setAttribute("aria-label", `${m.name} · ${m.title}`);
      const ph = photo(m, "v13-tcard-photo");
      const body = el("div", "v13-tcard-body"); const nm = el("strong", "", m.name); nm.setAttribute("data-no-i18n", "");
      body.append(nm, el("span", "", m.title));
      if (m.city) { const c = el("span", "", m.city); c.setAttribute("data-no-i18n", ""); body.append(c); }
      body.append(el("em", "", "Voir la carte ↗"));
      a.append(ph, body); return a;
    };
    const soon = () => { const a = el("a", "v13-tcard v13-tcard-soon"); a.href = "/contact/"; a.append(el("strong", "", "L’équipe s’agrandit"), el("span", "", "De nouveaux counsellors nous rejoignent bientôt. Écrivez-nous en attendant : nous vous répondons depuis le Royaume-Uni."), el("em", "", "Nous contacter ↗")); return a; };
    const updateNav = () => { const max = track.scrollWidth - track.clientWidth - 2; const x = Math.abs(track.scrollLeft); navs[0] && (navs[0].disabled = x <= 2); navs[1] && (navs[1].disabled = x >= max); navs.forEach(b => b.hidden = max <= 2); };
    navs.forEach(b => b.addEventListener("click", () => { const step = (track.querySelector(".v13-tcard")?.offsetWidth || 220) + 16; const rtl = d.documentElement.dir === "rtl"; track.scrollBy({ left: Number(b.dataset.dir) * step * (rtl ? -1 : 1) * Math.max(1, Math.floor(track.clientWidth / step)), behavior: "smooth" }); }));
    track.addEventListener("scroll", () => requestAnimationFrame(updateNav), { passive: true });
    addEventListener("resize", updateNav, { passive: true });
    team().then(list => { track.replaceChildren(...list.map(card), ...(list.length < 2 ? [soon()] : [])); track.scrollLeft = 0; requestAnimationFrame(updateNav); });
  }

  /* ---------------- v18 · Our counsellors gallery (About): one photo in colour, the rest in black and white ---------------- */
  function mountGallery(box) {
    const gal = $("[data-v18-gallery]", box); if (!gal) return;
    const nameEl = $("[data-v18-name]", box), roleEl = $("[data-v18-role]", box), metaEl = $("[data-v18-meta]", box), idBox = $(".v18-member-id", box);
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let shots = [], list = [], current = -1;
    const show = (i, focus) => {
      if (i === current || !list[i]) return; current = i; const m = list[i];
      shots.forEach((b, k) => { const on = k === i; b.classList.toggle("is-active", on); b.setAttribute("aria-pressed", String(on)); });
      const paint = () => { nameEl.textContent = m.name; roleEl.textContent = m.title || "Student counsellor"; metaEl.textContent = [m.city, (m.languages || []).join(" · ")].filter(Boolean).join(" · "); idBox.classList.remove("is-out"); };
      if (reduce || !nameEl.textContent) paint(); else { idBox.classList.add("is-out"); setTimeout(paint, 180); }
      if (focus) shots[i].focus({ preventScroll: true });
      const b = shots[i]; if (gal.scrollWidth > gal.clientWidth) gal.scrollTo({ left: Math.max(0, b.offsetLeft - 8), behavior: reduce ? "auto" : "smooth" });
    };
    team().then(data => {
      list = data;
      if (!list.length) { box.classList.add("is-empty"); nameEl.textContent = "L’équipe s’agrandit"; nameEl.removeAttribute("data-no-i18n"); roleEl.textContent = ""; gal.hidden = true; return; }
      shots = list.map((m, i) => {
        const b = el("button", "v18-shot"); b.type = "button"; b.setAttribute("aria-label", `${m.name} · ${m.title || ""}`); b.setAttribute("aria-pressed", "false"); b.setAttribute("data-no-i18n", "");
        b.append(photo(m, "v18-shot-photo"));
        b.addEventListener("click", () => show(i));
        b.addEventListener("keydown", e => { const rtl = d.documentElement.dir === "rtl"; const k = e.key === "ArrowRight" ? (rtl ? -1 : 1) : e.key === "ArrowLeft" ? (rtl ? 1 : -1) : 0; if (k) { e.preventDefault(); show((i + k + list.length) % list.length, true); } });
        return b;
      });
      gal.replaceChildren(...shots); gal.style.setProperty("--n", String(list.length)); current = -1; show(0);
    });
  }

  /* ---------------- New content (home): floating banner + full-screen latest videos ---------------- */
  function mountLatest() {
    if (!/^\/(index\.html)?$/.test(location.pathname)) return;
    fetch("/api/public/videos", { headers: { accept: "application/json" } }).then(r => r.ok ? r.json() : { data: [] }).then(j => {
      const list = (Array.isArray(j.data) ? j.data : []).filter(v => v && v.url).slice(0, 3); if (!list.length) return;
      const seenKey = "muk_latest_seen", seen = (() => { try { return localStorage.getItem(seenKey); } catch { return null; } })();
      const fmt = iso => { try { return new Intl.DateTimeFormat(({ fr: "fr-FR", en: "en-GB", es: "es-ES", ar: "ar-MA" })[lang()] || "fr-FR", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso)); } catch { return ""; } };
      const thumb = (v, cls) => { const b = el("span", cls); if (v.poster) { const im = el("img"); im.src = v.poster; im.alt = ""; im.loading = "lazy"; im.decoding = "async"; im.referrerPolicy = "no-referrer"; im.onerror = () => im.remove(); b.append(im); } b.insertAdjacentHTML("beforeend", '<i aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z"/></svg></i>'); return b; };
      /* banner */
      const ban = el("div", "v14-new"), go = el("button", "v14-new-open"); go.type = "button"; go.setAttribute("aria-haspopup", "dialog");
      if (seen !== list[0].id) ban.classList.add("is-fresh");
      go.append(thumb(list[0], "v14-new-thumb"));
      const txt = el("span", "v14-new-txt"); txt.append(el("small", "", "Nouveau contenu"), el("strong", "", "Nos dernières vidéos"));
      go.append(txt);
      const x = el("button", "v14-new-x"); x.type = "button"; x.setAttribute("aria-label", "Masquer"); x.textContent = "×";
      ban.append(go, x);
      let hidden = false; try { hidden = sessionStorage.getItem("muk_latest_hide") === "1"; } catch {}
      // Wait for the cookie choice to be made so the banner is never hidden behind it.
      const cookieOpen = () => [...d.querySelectorAll(".muk-cookie-info,[class*=muk-cookie]")].some(n => n.offsetParent !== null && n.getBoundingClientRect().height > 0);
      const reveal = () => { if (cookieOpen()) return setTimeout(reveal, 700); d.body.append(ban); setTimeout(() => ban.classList.add("is-in"), 400); };
      if (!hidden) setTimeout(reveal, 300);
      x.addEventListener("click", () => { ban.classList.remove("is-in"); try { sessionStorage.setItem("muk_latest_hide", "1"); } catch {} setTimeout(() => ban.remove(), 300); });
      /* full-screen viewer */
      let dlg = null, current = 0;
      const player = v => {
        if (v.play === "vimeo" || v.play === "youtube") { const f = el("iframe"); const src = new URL(v.embed || v.url); src.searchParams.set("autoplay", "1"); f.src = src.toString(); f.title = v.title; f.allow = "autoplay; fullscreen; picture-in-picture; encrypted-media"; f.allowFullscreen = true; f.loading = "lazy"; f.referrerPolicy = "strict-origin-when-cross-origin"; return f; }
        if (v.play === "video") { const vid = el("video"); vid.src = v.url; vid.controls = true; vid.playsInline = true; vid.autoplay = true; vid.preload = "metadata"; if (v.poster) vid.poster = v.poster; return vid; }
        const a = el("a", "v14-lv-link", "Ouvrir la vidéo ↗"); a.href = v.url; a.target = "_blank"; a.rel = "noopener noreferrer"; return a;
      };
      const build = () => {
        dlg = el("dialog", "v14-lv"); dlg.setAttribute("aria-labelledby", "v14-lv-title");
        const top = el("div", "v14-lv-top"); const hd = el("div"); hd.append(el("p", "v14-lv-kicker", "#MUKTalent"), Object.assign(el("h2", "", "Dernières vidéos"), { id: "v14-lv-title" }));
        const cl = el("button", "v14-lv-close"); cl.type = "button"; cl.setAttribute("aria-label", "Fermer"); cl.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg><span>Fermer</span>'; cl.onclick = () => dlg.close();
        top.append(hd, cl);
        const grid = el("div", "v14-lv-grid"), stage = el("div", "v14-lv-stage"), side = el("ol", "v14-lv-list");
        const info = el("div", "v14-lv-info");
        const show = i => {
          current = i; stage.querySelectorAll("video").forEach(v => v.pause()); stage.replaceChildren(player(list[i]));
          info.replaceChildren(); const h = el("h3", "", list[i].title); h.setAttribute("data-no-i18n", ""); info.append(h);
          if (list[i].body) { const p = el("p", "", list[i].body); p.setAttribute("data-no-i18n", ""); info.append(p); }
          [...side.children].forEach((li, k) => li.querySelector("button").setAttribute("aria-current", String(k === i)));
        };
        list.forEach((v, i) => {
          const li = el("li"), b = el("button", "v14-lv-card"); b.type = "button";
          b.append(thumb(v, "v14-lv-thumb"));
          const t = el("span", "v14-lv-meta"); const tt = el("strong", "", v.title); tt.setAttribute("data-no-i18n", "");
          const m = el("span", "v14-lv-sub"); m.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>'; const dt = el("span", "", fmt(v.at)); dt.setAttribute("data-no-i18n", ""); m.append(dt);
          const au = el("span", "v14-lv-sub"); au.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>'; const an = el("span", "", v.author || "MUK Talent"); an.setAttribute("data-no-i18n", ""); au.append(an);
          const row = el("span", "v14-lv-row"); row.append(m, au); t.append(el("small", "", i === 0 ? "Nouveau" : "Vidéo"), tt, row); b.append(t);
          b.onclick = () => show(i); li.append(b); side.append(li);
        });
        const left = el("div", "v14-lv-main"); left.append(stage, info);
        grid.append(left, side); dlg.append(top, grid); d.body.append(dlg);
        dlg.addEventListener("close", () => { stage.replaceChildren(); d.documentElement.classList.remove("v13-lock"); go.isConnected && go.focus(); });
        dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });
        dlg._show = show;
      };
      go.addEventListener("click", () => {
        if (!dlg) build(); dlg._show(0);
        try { localStorage.setItem(seenKey, list[0].id); } catch {} ban.classList.remove("is-fresh");
        d.documentElement.classList.add("v13-lock"); dlg.showModal ? dlg.showModal() : dlg.setAttribute("open", "");
        setTimeout(() => dlg.querySelector(".v14-lv-close")?.focus(), 50);
      });
    }).catch(() => {});
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
    $$("#notre-equipe:not(.v18-team)").forEach(mountTeam);
    $$("[data-v18-team]").forEach(mountGallery);
    $$("[data-v13-faces]").forEach(mountFaces);
    mountLatest();
    d.addEventListener("click", e => { const b = e.target.closest("[data-v13-talk]"); if (!b) return; e.preventDefault(); open({ source: location.pathname.startsWith("/parents") ? "parents" : "home", priority: b.dataset.priority }); });
    if (location.hash === "#parler") open({ source: "parents" });
  }
  d.readyState === "loading" ? d.addEventListener("DOMContentLoaded", init) : init();
})();
