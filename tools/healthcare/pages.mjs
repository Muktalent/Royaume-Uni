import { page, icon, img, kicker, crumbs, btn, note, BASE, COMPANY, SITE, esc } from "./layout.mjs";

const STEPS = [
  ["Initial Registration", "You register online and receive a candidate reference number."],
  ["Candidate Assessment", "A consultant reviews your experience, goals and eligibility."],
  ["Documentation and Qualification Verification", "We check qualifications, registration status and references."],
  ["Employer Matching", "Where appropriate, we present your profile to suitable employers."],
  ["Interviews and Selection", "We coordinate interviews and help you prepare."],
  ["Employment Offer", "The employer makes any offer directly; we help you understand it."],
  ["Pre-employment and Immigration Preparation", "Employer checks, sponsorship and visa steps."],
  ["Pre-departure Support", "Practical guidance before you travel, where offered."]
];
const journey = (cls = "") => `<ol class="hc-journey ${cls}">${STEPS.map(([h, p], i) => `<li class="hc-step hc-rv"><span class="dot" translate="no">${i + 1}</span><div><h3>${h}</h3><p>${p}</p></div></li>`).join("")}</ol>`;

export const PROFESSIONS = [
  { id: "registered-nurses", key: "registered_nurse", group: "nursing", tag: "Nursing", title: "Registered Nurses",
    intro: "Qualified nurses who want to practise in UK hospitals, community services and nursing homes.",
    qual: "A nursing qualification recognised by the NMC and current registration or good standing with your home regulator.",
    reg: "You must be registered with the Nursing and Midwifery Council (NMC) before you can work as a registered nurse in the UK. International applicants usually complete an eligibility check, the NMC Test of Competence (a computer-based test and a practical OSCE) and meet the NMC English language requirements.",
    link: ["Nursing and Midwifery Council (NMC)", "https://www.nmc.org.uk/registration/joining-the-register/register-nurse-midwife/trained-outside-uk/"],
    path: "Roles in NHS trusts, independent hospitals, community services and nursing homes. Some employers recruit before NMC registration is complete and support you through the OSCE." },
  { id: "adult-nurses", key: "adult_nurse", group: "nursing", tag: "Nursing", title: "Adult Nurses",
    intro: "Nurses caring for adults in acute, surgical, medical, community and older-people settings.",
    qual: "A qualification that the NMC accepts for the adult field of nursing, with recent clinical practice.",
    reg: "NMC registration in the adult nursing field is required. The NMC assesses your qualification and you complete its Test of Competence and English language requirements.",
    link: ["NMC – trained outside the UK", "https://www.nmc.org.uk/registration/joining-the-register/register-nurse-midwife/trained-outside-uk/"],
    path: "Ward, theatre, community and care-home nursing roles, usually starting at NHS Agenda for Change Band 4 or 5 or the equivalent in the independent sector while registration is completed." },
  { id: "mental-health-nurses", key: "mental_health_nurse", group: "nursing", tag: "Nursing", title: "Mental Health Nurses",
    intro: "Nurses supporting people with mental health needs in inpatient, community and specialist services.",
    qual: "A qualification accepted by the NMC for the mental health field, or evidence that meets its requirements.",
    reg: "NMC registration in the mental health field is required. Not every international qualification maps directly to this field, so the NMC decides which part of the register you can join.",
    link: ["Nursing and Midwifery Council (NMC)", "https://www.nmc.org.uk/registration/joining-the-register/register-nurse-midwife/trained-outside-uk/"],
    path: "Inpatient wards, community mental health teams, secure services and independent mental health providers." },
  { id: "learning-disability-nurses", key: "learning_disability_nurse", group: "nursing", tag: "Nursing", title: "Learning Disability Nurses",
    intro: "Nurses supporting people with learning disabilities to live healthy, independent lives.",
    qual: "A qualification accepted by the NMC for the learning disabilities field.",
    reg: "NMC registration in the learning disabilities field is required. Few countries train nurses in this field, so the NMC will assess whether your qualification is comparable.",
    link: ["Nursing and Midwifery Council (NMC)", "https://www.nmc.org.uk/registration/joining-the-register/register-nurse-midwife/trained-outside-uk/"],
    path: "Community teams, supported living, specialist inpatient and independent providers." },
  { id: "allied-health-professionals", key: "other_ahp", group: "ahp", tag: "Allied Health", title: "Allied Health Professionals",
    intro: "Professions such as physiotherapy, occupational therapy, radiography, speech and language therapy, dietetics and paramedicine.",
    qual: "A degree-level qualification in your profession and recent practice. Requirements differ by profession.",
    reg: "Most allied health professions are regulated by the Health and Care Professions Council (HCPC). You must be on the HCPC Register before using a protected title or practising in the UK. The HCPC assesses international applications individually.",
    link: ["HCPC – international applications", "https://www.hcpc-uk.org/registration/getting-on-the-register/international-applications/"],
    path: "NHS trusts, independent hospitals, community and rehabilitation services." },
  { id: "physiotherapists", key: "physiotherapist", group: "ahp", tag: "Allied Health", title: "Physiotherapists",
    intro: "Physiotherapists working in musculoskeletal, respiratory, neurological, rehabilitation and community care.",
    qual: "A physiotherapy degree and clinical experience. The HCPC checks that your training meets its standards.",
    reg: "HCPC registration as a physiotherapist is required. You apply through the HCPC international route and may need to provide evidence of English language ability.",
    link: ["HCPC – international applications", "https://www.hcpc-uk.org/registration/getting-on-the-register/international-applications/"],
    path: "Acute hospitals, community and rehabilitation teams, private practice and care providers." },
  { id: "occupational-therapists", key: "occupational_therapist", group: "ahp", tag: "Allied Health", title: "Occupational Therapists",
    intro: "Occupational therapists helping people carry out everyday activities after illness, injury or disability.",
    qual: "An occupational therapy qualification and relevant experience.",
    reg: "HCPC registration as an occupational therapist is required before you can practise in the UK.",
    link: ["HCPC – international applications", "https://www.hcpc-uk.org/registration/getting-on-the-register/international-applications/"],
    path: "Hospitals, community health, mental health services, social care and local authorities." },
  { id: "radiographers", key: "radiographer", group: "ahp", tag: "Allied Health", title: "Radiographers",
    intro: "Diagnostic and therapeutic radiographers in imaging and cancer services.",
    qual: "A radiography qualification in the diagnostic or therapeutic field.",
    reg: "HCPC registration as a radiographer (diagnostic or therapeutic) is required.",
    link: ["HCPC – international applications", "https://www.hcpc-uk.org/registration/getting-on-the-register/international-applications/"],
    path: "Imaging departments, radiotherapy centres and independent diagnostic providers." },
  { id: "biomedical-scientists", key: "biomedical_scientist", group: "ahp", tag: "Allied Health", title: "Biomedical Scientists",
    intro: "Laboratory scientists working in pathology, microbiology, haematology and blood sciences.",
    qual: "A relevant science degree and laboratory training. The HCPC assesses whether your education and training are comparable.",
    reg: "HCPC registration as a biomedical scientist is required to use the protected title and practise.",
    link: ["HCPC – international applications", "https://www.hcpc-uk.org/registration/getting-on-the-register/international-applications/"],
    path: "NHS pathology networks and independent laboratories." },
  { id: "pharmacists", key: "pharmacist", group: "pharmacy", tag: "Pharmacy", title: "Pharmacists",
    intro: "Pharmacists in hospital, community and primary care pharmacy.",
    qual: "A pharmacy degree and registration in your home country.",
    reg: "Pharmacists in Great Britain must register with the General Pharmaceutical Council (GPhC). Pharmacists who qualified outside the UK usually complete the Overseas Pharmacists’ Assessment Programme (OSPAP), foundation training and the registration assessment before they can register.",
    link: ["General Pharmaceutical Council (GPhC)", "https://www.pharmacyregulation.org/students-and-trainees/pharmacist-education-and-training/courses-and-qualifications-pharmacists"],
    path: "Because the route to registration is long, we discuss pharmacy opportunities case by case." },
  { id: "healthcare-support-workers", key: "healthcare_support_worker", group: "care", tag: "Support roles", title: "Healthcare Support Workers", restricted: true,
    intro: "Healthcare assistants and support workers helping nurses and therapists deliver care.",
    qual: "Care experience and relevant training. UK employers usually provide the Care Certificate or equivalent induction.",
    reg: "Support worker roles are not regulated by a professional body, but employers carry out DBS checks, references and training.",
    link: ["GOV.UK – Health and Care Worker visa", "https://www.gov.uk/health-care-worker-visa"],
    path: "UK immigration rules for care and support roles changed in July 2025 and recruitment of care workers and senior care workers from overseas has closed. We currently consider candidates for these roles only if they already have the right to work in the UK. We always check the current GOV.UK rules." },
  { id: "social-care-professionals", key: "social_care_professional", group: "care", tag: "Social care", title: "Social Care Professionals", restricted: true,
    intro: "Social workers, registered managers and other professionals in adult social care.",
    qual: "Requirements depend on the role. Social workers need a qualification that the regulator accepts.",
    reg: "Social workers in England must register with Social Work England. Other social care roles may need specific qualifications or registration with the Care Quality Commission (CQC) as a registered manager.",
    link: ["Social Work England", "https://www.socialworkengland.org.uk/"],
    path: "Local authorities and independent care providers. For care worker roles, the same immigration limits described for support workers apply." }
];

// ---------------- HOME ----------------
export function home() {
  const services = [
    ["International Healthcare Recruitment", "Structured, compliant recruitment of qualified professionals into UK roles."],
    ["Nursing Recruitment", "Adult, mental health and learning disability nurses for NHS and independent providers."],
    ["Allied Health Professional Recruitment", "Physiotherapists, occupational therapists, radiographers and biomedical scientists."],
    ["Social Care Recruitment", "Registered professionals for social care, within current immigration rules."],
    ["Candidate Assessment and Registration", "A careful review of experience, qualifications and eligibility."],
    ["Employer Recruitment Support", "Workforce planning, sourcing and screening tailored to your service."],
    ["Interview and Recruitment Coordination", "Interviews, feedback and offers managed with clear communication."],
    ["Pre-departure Guidance, where offered", "Practical information to help professionals prepare for life and work in the UK."]
  ];
  const body = `
<section class="hc-hero"><div class="hc-wrap"><div class="hc-hero-grid">
<div class="hc-hero-copy">${kicker("MUKTalent", "Healthcare recruitment division")}
<h1>Connecting Healthcare Professionals with <em>Opportunities</em> Across the UK.</h1>
<p class="hc-lead">MUKTalent Healthcare supports international healthcare professionals and UK employers through an ethical, transparent and professional recruitment process.</p>
<div class="hc-actions">${btn("Explore Opportunities", "/vacancies/", "hc-btn-teal")}${btn("For Healthcare Employers", "/employers/", "hc-btn-line")}</div></div>
<div class="hc-hero-media"><span class="hc-arch-line" aria-hidden="true"></span><div class="hc-arch">${img("hc-hero", "A nurse in teal scrubs walking along a bright hospital corridor", { eager: true, sizes: "(max-width: 980px) 90vw, 540px" })}</div>
<div class="hc-seal"><span class="hc-seal-ico">${icon("shield")}</span><div><b>No fees for candidates</b>Candidates are not charged recruitment or work-finding fees by MUKTalent Healthcare.</div></div></div>
</div>
<div class="hc-facts">
<div class="hc-fact">${icon("building")}<div><b>UK-based management</b><span>Operated from London by MAGHREB UK TALENT LTD</span></div></div>
<div class="hc-fact">${icon("scale")}<div><b>Code of Practice</b><span>We follow the international recruitment Code for England</span></div></div>
<div class="hc-fact">${icon("route")}<div><b>Transparent process</b><span>Eight clear stages, with a private candidate portal</span></div></div>
<div class="hc-fact">${icon("lock")}<div><b>Data protected</b><span>UK GDPR, role-based access and secure uploads</span></div></div>
</div></div></section>

<section class="hc-sec hc-sec-white"><div class="hc-wrap hc-split">
<div class="hc-split-media hc-rv">${img("hc-about", "A MUKTalent Healthcare team meeting in a London office")}</div>
<div class="hc-rv">${kicker("01", "Who We Are")}<h2>The healthcare recruitment division of <em>MUKTalent</em>, operating from the United Kingdom.</h2>
<p class="hc-lead" style="margin-top:22px">MUKTalent has supported international talent coming to the UK since its foundation. MUKTalent Healthcare applies the same care to healthcare and social care recruitment, with its own team, processes and standards.</p>
<p>We work with qualified professionals who want to build a career in the UK, and with UK employers who need reliable, ethically recruited staff. Our role is to make the process clear, fair and well organised for everyone involved.</p>
<p style="margin-top:26px">${`<a class="hc-link" href="${BASE}/about/">About MUKTalent Healthcare ${icon("arrow")}</a>`}</p></div>
</div></section>

<section class="hc-sec"><div class="hc-wrap">
<div class="hc-head-split"><div>${kicker("02", "Our Services")}<h2>Recruitment support from first conversation to <em>first day</em>.</h2></div><p class="hc-lead">Each service is delivered by our UK team and recorded in our recruitment management system, so candidates and employers always know where things stand.</p></div>
<div class="hc-services">${services.map(([h, p], i) => `<div class="hc-service hc-rv"><span class="n" translate="no">${String(i + 1).padStart(2, "0")}</span><div><h3>${h}</h3><p>${p}</p></div></div>`).join("")}</div>
</div></section>

<section class="hc-sec hc-sec-white"><div class="hc-wrap">
<div class="hc-center" style="margin-bottom:52px">${kicker("03", "Who We Support")}<h2>Two journeys, <em>one standard</em> of care.</h2></div>
<div class="hc-duo">
<article class="hc-aud hc-rv"><div class="hc-aud-media">${img("hc-candidates", "A consultant reviewing a candidate’s documents with a healthcare professional", { sizes: "(max-width: 980px) 100vw, 600px" })}</div><div class="hc-aud-body"><p class="hc-kicker">For healthcare professionals</p><h3>Build your career in UK healthcare.</h3><p>Honest guidance on registration, English language, interviews and visas, with a named consultant and a private portal to follow your progress.</p>
<ul class="hc-ticks"><li>No recruitment or work-finding fees</li><li>Accurate information about roles and conditions</li><li>Secure document uploads, only when requested</li></ul>
<div class="hc-actions">${btn("Register as a Candidate", "/register/", "hc-btn-gold")}${btn("For Candidates", "/candidates/", "hc-btn-ghost", "")}</div></div></article>
<article class="hc-aud navy hc-rv"><div class="hc-aud-media">${img("hc-employers", "A MUKTalent consultant meeting a UK care provider", { sizes: "(max-width: 980px) 100vw, 600px" })}</div><div class="hc-aud-body"><p class="hc-kicker">For UK employers</p><h3>Ethically recruited professionals for your service.</h3><p>NHS trusts, independent hospitals, care homes and community providers. We source, screen and coordinate, and you stay in control of every hiring decision.</p>
<ul class="hc-ticks"><li>Screening against your role requirements</li><li>Recruitment within the Code of Practice</li><li>One point of contact and regular updates</li></ul>
<div class="hc-actions">${btn("Discuss Your Recruitment Needs", "/employers/#enquiry", "hc-btn-gold")}${btn("For Employers", "/employers/", "hc-btn-ghost", "")}</div></div></article>
</div></div></section>

<section class="hc-sec"><div class="hc-wrap">
<div class="hc-head-split"><div>${kicker("04", "Our Recruitment Approach")}<h2>A clear path in <em>eight stages</em>.</h2></div><p class="hc-lead">Every candidate follows the same documented process. You can see your current stage at any time in the candidate portal.</p></div>
${journey()}
<p style="margin-top:40px;text-align:center"><a class="hc-link" href="${BASE}/recruitment-process/">Who does what at each stage ${icon("arrow")}</a></p>
</div></section>

<section class="hc-sec hc-sec-teal hc-pattern"><div class="hc-wrap hc-pledge">
<div class="hc-rv">${kicker("05", "Ethical Recruitment")}<p class="hc-quote">Candidates are not charged recruitment or work-finding fees by MUKTalent Healthcare.</p>
<p class="hc-lead">We follow the Code of Practice for the International Recruitment of Health and Social Care Personnel in England. We check the current red and amber country lists before any international recruitment, and we do not actively recruit from red-list countries.</p>
<div class="hc-actions" style="margin-top:30px">${btn("Our Commitment to Ethical Recruitment", "/ethical-recruitment/", "hc-btn-gold")}</div></div>
<div class="hc-pledge-list hc-rv">${["Fair and transparent recruitment", "Equal treatment and non-discrimination", "Accurate job and employment information", "No coercion, exploitation or misleading promises", "Qualification and reference verification", "An accessible complaints procedure"].map(x => `<div>${icon("check")}<span>${x}</span></div>`).join("")}</div>
</div></section>

<section class="hc-sec hc-sec-white"><div class="hc-wrap">
<div class="hc-center" style="margin-bottom:48px">${kicker("06", "Why MUKTalent Healthcare?")}<h2>Responsible recruitment, <em>managed in the UK</em>.</h2></div>
<div class="hc-why">
<div class="hc-rv"><span class="hc-ico">${icon("building")}</span><h3>UK-based management</h3><p>Our recruitment is managed from London, by people who understand UK healthcare employers and regulation.</p></div>
<div class="hc-rv"><span class="hc-ico">${icon("people")}</span><h3>Professional support</h3><p>A named consultant for each candidate and employer, with clear responsibilities and response times.</p></div>
<div class="hc-rv"><span class="hc-ico">${icon("route")}</span><h3>Transparent procedures</h3><p>Documented stages, recorded decisions and honest information at every step.</p></div>
<div class="hc-rv"><span class="hc-ico">${icon("shield")}</span><h3>Responsible recruitment</h3><p>No candidate fees, country checks before recruitment and an independent route for complaints.</p></div>
</div></div></section>

<section class="hc-sec-tight"><div class="hc-wrap hc-cta">
<div class="hc-pattern"><p class="hc-kicker">Healthcare professionals</p><h2>Ready to take the next step?</h2><p>Register in about ten minutes. You will receive a reference number and a consultant will review your profile.</p><div class="hc-actions">${btn("Register as a Candidate", "/register/", "hc-btn-gold")}${btn("View vacancies", "/vacancies/", "hc-btn-ghost", "")}</div></div>
<div><p class="hc-kicker">UK employers</p><h2>Let’s talk about your workforce.</h2><p>Tell us about your service and the roles you need to fill. We will reply within two working days.</p><div class="hc-actions">${btn("Discuss Your Recruitment Needs", "/employers/#enquiry", "hc-btn-teal")}${btn("Contact us", "/contact/", "hc-btn-line", "")}</div></div>
</div></section>`;
  return page({ path: "/", active: "home", title: "MUKTalent Healthcare · Ethical international healthcare recruitment for the UK", description: "MUKTalent Healthcare connects international nurses, allied health and social care professionals with UK employers through an ethical, transparent recruitment process. No fees for candidates.", body,
    jsonld: { "@context": "https://schema.org", "@type": "EmploymentAgency", name: "MUKTalent Healthcare", legalName: COMPANY.legal, url: SITE + BASE + "/", email: COMPANY.email, telephone: COMPANY.phone, parentOrganization: { "@type": "Organization", name: "MUKTalent", url: SITE + "/" }, address: { "@type": "PostalAddress", streetAddress: "Flat 3b Flitton House, The Sutton Estate", addressLocality: "London", postalCode: "N1 1UG", addressCountry: "GB" }, areaServed: "GB", identifier: { "@type": "PropertyValue", propertyID: "Companies House", value: COMPANY.number } } });
}

// ---------------- CANDIDATES ----------------
export function candidates() {
  const topics = [
    ["briefcase", "Available healthcare professions", "Nursing, allied health, pharmacy and social care. See the requirements for each profession before you apply.", "/professions/"],
    ["badge", "Qualification requirements", "UK employers and regulators need evidence of your qualifications, training and recent practice. We explain what is usually requested.", "/professions/"],
    ["shield", "Professional registration", "Regulated professions need UK registration, such as with the NMC or HCPC. Your qualification alone does not allow you to practise in the UK.", "/professions/"],
    ["chat", "English-language requirements", "Where applicable, regulators and the Home Office set English language requirements. We tell you which tests are accepted for your route.", "/professions/"],
    ["calendar", "Recruitment and interview stages", "You will know your stage at all times, and we help you prepare for each interview.", "/recruitment-process/"],
    ["doc", "Employment conditions", "We share accurate information from the employer on pay, hours, contract type and conditions before you accept anything.", "/vacancies/"],
    ["flag", "Visa and immigration considerations", "Most international professionals need a visa sponsored by the employer. The Home Office decides every application.", "https://www.gov.uk/health-care-worker-visa"],
    ["compass", "Relocation and pre-departure guidance", "Where offered, we share practical guidance on accommodation, travel and your first weeks in the UK.", "/recruitment-process/"]
  ];
  const body = `
<section class="hc-phero"><div class="hc-wrap">${crumbs([["Home", "/"], ["For Candidates"]])}<div class="hc-phero-grid">
<div>${kicker("For Candidates", "International healthcare professionals")}<h1>Your next role in UK healthcare, <em>with honest guidance</em>.</h1><p class="hc-lead">We support qualified nurses, allied health professionals and other healthcare staff who want to work in the UK. You will get clear information, a named consultant and a private portal to follow every step.</p>
<div class="hc-actions" style="margin-top:32px">${btn("Register as a Candidate", "/register/", "hc-btn-gold")}${btn("View vacancies", "/vacancies/", "hc-btn-line", "")}</div></div>
<div class="hc-phero-media">${img("hc-candidates", "A consultant and a healthcare professional reviewing documents together", { eager: true })}</div></div></div></section>

<section class="hc-sec-tight"><div class="hc-wrap">${note("<b>Please read before applying.</b> We cannot guarantee employment, visa approval, professional registration or a specific salary. Employers make hiring decisions, regulators decide registration and the Home Office decides visa applications. We will always be honest about your options.", "", "info")}</div></section>

<section class="hc-sec" style="padding-top:20px"><div class="hc-wrap">
<div class="hc-head-split"><div>${kicker("01", "What you need to know")}<h2>Everything we will discuss <em>with you</em>.</h2></div><p class="hc-lead">These are the topics your consultant will cover. Each one depends on your profession, your country of training and the role.</p></div>
<div class="hc-grid-4">${topics.map(([ic, h, p, l]) => `<a class="hc-card hc-rv" href="${l.startsWith("http") ? l : BASE + l}"${l.startsWith("http") ? ' target="_blank" rel="noopener"' : ""}><span class="hc-ico">${icon(ic)}</span><h3>${h}</h3><p>${p}</p></a>`).join("")}</div>
</div></section>

<section class="hc-sec hc-sec-white"><div class="hc-wrap hc-split">
<div class="hc-rv">${kicker("02", "Your candidate portal")}<h2>Follow your progress, <em>privately and securely</em>.</h2>
<p class="hc-lead" style="margin-top:20px">After you register, you can create an account with the same email address to access your private portal.</p>
<ul class="hc-ticks dark">${["See your current stage in the recruitment journey", "Update your details and preferences", "Upload documents securely when your consultant requests them", "Read and send messages to your consultant", "View interview dates and preparation notes", "Access recruitment guidance and support"].map(x => `<li>${x}</li>`).join("")}</ul>
<div class="hc-actions">${btn("Sign in to the portal", "/portal/", "hc-btn-teal")}</div></div>
<div class="hc-split-media hc-rv">${img("hc-portal", "A calm, modern hospital atrium")}</div>
</div></section>

<section class="hc-sec"><div class="hc-wrap">
<div class="hc-center" style="margin-bottom:40px">${kicker("03", "Our promise to you")}<h2>Fair recruitment is <em>not optional</em>.</h2></div>
<div class="hc-grid-3">
<div class="hc-card hc-rv"><span class="hc-ico">${icon("pound")}</span><h3>No candidate fees</h3><p>Candidates are not charged recruitment or work-finding fees by MUKTalent Healthcare. If anyone asks you for a fee in our name, tell us immediately.</p></div>
<div class="hc-card hc-rv"><span class="hc-ico">${icon("doc")}</span><h3>Only what is needed</h3><p>At registration we ask only for your CV and basic details. We request identity and qualification documents later, only when they are needed for a specific step.</p></div>
<div class="hc-card hc-rv"><span class="hc-ico">${icon("chat")}</span><h3>A voice if things go wrong</h3><p>You can raise a concern or complaint at any time, and we explain the independent organisations you can contact.</p></div>
</div></div></section>

<section class="hc-sec-tight"><div class="hc-wrap hc-cta">
<div class="hc-pattern"><p class="hc-kicker">Start today</p><h2>Register as a candidate.</h2><p>It takes about ten minutes. You will receive your reference number straight away.</p><div class="hc-actions">${btn("Register now", "/register/", "hc-btn-gold")}</div></div>
<div><p class="hc-kicker">Questions first?</p><h2>Talk to our team.</h2><p>Send us a candidate enquiry and a consultant will reply, usually within two working days.</p><div class="hc-actions">${btn("Candidate enquiry", "/contact/?route=candidate", "hc-btn-line")}</div></div>
</div></section>`;
  return page({ path: "/candidates/", active: "candidates", title: "For Candidates", description: "Guidance for international nurses and healthcare professionals: registration, English language, interviews, visas and our free candidate portal. No recruitment fees for candidates.", body });
}

// ---------------- EMPLOYERS ----------------
const orgTypes = [["nhs_trust", "NHS trust or foundation trust"], ["independent_hospital", "Independent hospital"], ["care_home", "Care home or nursing home"], ["home_care", "Home care provider"], ["gp_practice", "GP practice or primary care"], ["clinic", "Clinic or diagnostic centre"], ["local_authority", "Local authority"], ["other", "Other organisation"]];
export const PROF_OPTIONS = [["registered_nurse", "Registered Nurse"], ["adult_nurse", "Adult Nurse"], ["mental_health_nurse", "Mental Health Nurse"], ["learning_disability_nurse", "Learning Disability Nurse"], ["physiotherapist", "Physiotherapist"], ["occupational_therapist", "Occupational Therapist"], ["radiographer", "Radiographer"], ["biomedical_scientist", "Biomedical Scientist"], ["pharmacist", "Pharmacist"], ["other_ahp", "Other Allied Health Professional"], ["healthcare_support_worker", "Healthcare Support Worker"], ["social_care_professional", "Social Care Professional"], ["other", "Other healthcare role"]];
const field = (name, label, { type = "text", req = false, full = false, opt = false, hint = "", auto = "", attrs = "", wrap = "" } = {}) =>
  `<div class="hc-field${full ? " full" : ""}"${wrap ? " " + wrap : ""}><label for="f-${name}">${label}${opt ? ' <span class="opt">(optional)</span>' : ""}</label>${type === "textarea" ? `<textarea id="f-${name}" name="${name}"${req ? " required" : ""} ${attrs}></textarea>` : `<input id="f-${name}" name="${name}" type="${type}"${req ? " required" : ""}${auto ? ` autocomplete="${auto}"` : ""} ${attrs}>`}${hint ? `<span class="hint" id="h-${name}">${hint}</span>` : ""}<span class="err" data-err="${name}"></span></div>`;
const select = (name, label, opts, { req = false, full = false, opt = false, hint = "", placeholder = "Please select", attrs = "" } = {}) =>
  `<div class="hc-field${full ? " full" : ""}"><label for="f-${name}">${label}${opt ? ' <span class="opt">(optional)</span>' : ""}</label><select id="f-${name}" name="${name}"${req ? " required" : ""} ${attrs}><option value="">${placeholder}</option>${opts.map(([v, l]) => `<option value="${v}">${l}</option>`).join("")}</select>${hint ? `<span class="hint">${hint}</span>` : ""}<span class="err" data-err="${name}"></span></div>`;
const hp = `<div class="hc-hp" aria-hidden="true"><label>Website <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>`;
const successBlock = (title, text) => `<div class="hc-success" data-success hidden tabindex="-1"><div class="badge">${icon("check")}</div><h2>${title}</h2><p class="hc-lead" style="margin-inline:auto">${text}</p><div class="hc-ref"><small>Your reference</small><b data-ref translate="no">—</b></div><div data-success-extra></div></div>`;

export function employerForm(id = "enquiry") {
  return `<form class="hc-form" id="${id}" data-hc-form="enquiry" data-route="employer" novalidate>
<fieldset><legend><span class="n" translate="no">i</span><span>Your organisation</span></legend><div class="hc-fields">
${field("organisation", "Organisation Name", { req: true, auto: "organization" })}${select("organisation_type", "Organisation Type", orgTypes, { req: true })}
${field("name", "Contact Name", { req: true, auto: "name" })}${field("job_title", "Job Title", { req: true, auto: "organization-title" })}
${field("email", "Business Email", { type: "email", req: true, auto: "email", hint: "Please use your work email address." })}${field("phone", "Telephone Number", { type: "tel", req: true, auto: "tel" })}
${field("location", "Location", { req: true, full: true, hint: "Town or region where the roles are based." })}</div></fieldset>
<fieldset><legend><span class="n" translate="no">ii</span><span>Your recruitment needs</span></legend><div class="hc-fields">
<div class="hc-field full"><span class="lbl" id="lbl-prof">Healthcare Professions Required</span><div class="hc-checks" role="group" aria-labelledby="lbl-prof">${PROF_OPTIONS.map(([v, l]) => `<label class="hc-check"><input type="checkbox" name="professions" value="${v}"><span>${l}</span></label>`).join("")}</div><span class="err" data-err="professions"></span></div>
${field("vacancies_count", "Number of Vacancies", { type: "number", req: true, attrs: 'min="1" max="5000" inputmode="numeric"' })}
<div class="hc-field"></div>
${field("requirements", "Recruitment Requirements", { type: "textarea", req: true, full: true, hint: "Bands or grades, shift patterns, start dates, sponsorship, registration requirements and anything else we should know." })}
</div></fieldset>
<div class="hc-consent"><label class="hc-check"><input type="checkbox" name="privacy" required><span>I have read how MUKTalent Healthcare uses the information in this form, as explained in the <a href="${BASE}/privacy/" target="_blank">Privacy Policy</a>.</span></label><span class="err" data-err="privacy"></span>
<label class="hc-check"><input type="checkbox" name="marketing"><span>Optional: I would like to receive occasional updates from MUKTalent Healthcare. I can unsubscribe at any time.</span></label></div>
${hp}
<div class="hc-form-foot"><p>We store your enquiry in our recruitment system and reply within two working days.</p><button class="hc-btn hc-btn-teal" type="submit"><span>Send enquiry</span>${icon("arrow")}</button></div>
<div class="hc-form-msg err" data-msg hidden role="alert"></div>
${successBlock("Thank you. Your enquiry has been received.", "A member of our employer team will contact you within two working days. We have sent a confirmation to your email address.")}
</form>`;
}

export function employers() {
  const svc = [
    ["people", "Workforce requirements", "We start by understanding your service, staffing gaps, timelines and the roles you need."],
    ["search", "Candidate sourcing", "We source candidates only from permitted countries and through fair, transparent channels."],
    ["shield", "Candidate screening", "Structured screening against your requirements, including motivation, experience and communication."],
    ["badge", "Qualification and experience review", "We review qualifications, registration status and references before presenting candidates."],
    ["calendar", "Interview coordination", "We organise interviews, panels and feedback, and keep candidates informed."],
    ["doc", "Recruitment administration", "Offers, document collection and pre-employment steps, tracked in our system."],
    ["chat", "Ongoing communication", "A named consultant, regular updates and clear escalation routes."]
  ];
  const body = `
<section class="hc-phero"><div class="hc-wrap">${crumbs([["Home", "/"], ["For Employers"]])}<div class="hc-phero-grid">
<div>${kicker("For Employers", "UK healthcare and care providers")}<h1>International recruitment, <em>handled responsibly</em>.</h1><p class="hc-lead">We help NHS trusts, independent hospitals, care providers and community services recruit qualified international professionals. We do this ethically, transparently and in line with the Code of Practice.</p>
<div class="hc-actions" style="margin-top:32px">${btn("Discuss Your Recruitment Needs", "/employers/#enquiry", "hc-btn-gold")}${btn("Our recruitment process", "/recruitment-process/", "hc-btn-line", "")}</div></div>
<div class="hc-phero-media">${img("hc-employers", "A MUKTalent consultant in a meeting with a UK care provider", { eager: true })}</div></div></div></section>

<section class="hc-sec hc-sec-white"><div class="hc-wrap">
<div class="hc-head-split"><div>${kicker("01", "How we support you")}<h2>Seven parts of one <em>accountable</em> service.</h2></div><p class="hc-lead">You remain the employer and make every hiring decision. We take care of the work that makes international recruitment safe, organised and predictable.</p></div>
<div class="hc-grid-4">${svc.map(([ic, h, p], i) => `<div class="hc-card hc-rv"><span class="hc-card-num" translate="no">${String(i + 1).padStart(2, "0")}</span><span class="hc-ico">${icon(ic)}</span><h3>${h}</h3><p>${p}</p></div>`).join("")}
<div class="hc-card hc-rv" style="background:var(--teal);border-color:transparent"><h3 style="color:#fff">Ready to plan?</h3><p style="color:rgba(246,245,239,.8);margin-bottom:22px">Tell us about the roles you need and we will propose a plan.</p>${btn("Send an enquiry", "/employers/#enquiry", "hc-btn-gold hc-btn-sm")}</div></div>
</div></section>

<section class="hc-sec"><div class="hc-wrap hc-split rev">
<div class="hc-split-media hc-rv">${img("hc-process", "A recruitment consultant on a video interview with a candidate")}</div>
<div class="hc-rv">${kicker("02", "Working together")}<h2>What we ask of <em>our employer partners</em>.</h2>
<p class="hc-lead" style="margin-top:20px">Ethical recruitment depends on both sides. Before we recruit for you, we agree the following in writing.</p>
<ul class="hc-ticks dark">${["Accurate job descriptions, pay and employment conditions", "No fees or costs passed to candidates, and no unfair repayment clauses", "Recruitment only from countries permitted by the Code of Practice", "Fair, non-discriminatory selection and appropriate pastoral support", "Valid sponsor licence and CQC registration, where they apply"].map(x => `<li>${x}</li>`).join("")}</ul>
<p class="hc-small">Any recruitment fees are agreed with the employer in writing before work begins. Candidates are never charged.</p></div>
</div></section>

<section class="hc-sec hc-sec-grey" id="enquiry"><div class="hc-wrap hc-form-shell">
<aside class="hc-aside">${kicker("03", "Employer enquiry")}<h2>Discuss your <em>recruitment needs</em>.</h2><p class="hc-lead">Complete the form and a member of our employer team will contact you within two working days.</p>
${note(`We only display genuine partnerships and employer relationships. We will never publish your organisation’s name without your written agreement.`, "teal", "shield")}
<div class="hc-note">${icon("mail")}<div><b>Prefer email?</b><br><a href="mailto:${COMPANY.email}" translate="no">${COMPANY.email}</a> · <a href="tel:${COMPANY.tel}" dir="ltr" translate="no">${COMPANY.phone}</a></div></div></aside>
${employerForm("enquiry")}
</div></section>`;
  return page({ path: "/employers/", active: "employers", title: "For Employers", description: "Ethical international recruitment for NHS trusts, independent hospitals and care providers: sourcing, screening, interview coordination and administration in line with the Code of Practice.", body, scripts: ["hc-forms.js"] });
}

// ---------------- PROFESSIONS ----------------
export function professions() {
  const groups = [["all", "All professions"], ["nursing", "Nursing"], ["ahp", "Allied Health"], ["pharmacy", "Pharmacy"], ["care", "Support and social care"]];
  const body = `
<section class="hc-phero"><div class="hc-wrap">${crumbs([["Home", "/"], ["Healthcare Professions"]])}<div class="hc-phero-grid">
<div>${kicker("Healthcare Professions", "Who we recruit")}<h1>Professions we support, and <em>what each requires</em>.</h1><p class="hc-lead">Every profession has its own qualifications, registration and visa requirements. This page explains each one in plain language and links to the official UK regulator.</p></div>
<div class="hc-phero-media tall">${img("hc-professions", "A physiotherapist working with an older patient", { eager: true, w: 1600, h: 2133, sizes: "(max-width: 980px) 80vw, 420px" })}</div></div></div></section>

<section class="hc-sec-tight" style="padding-top:0"><div class="hc-wrap">${note("<b>Important:</b> an international qualification does not on its own authorise anyone to practise in the UK. Regulated professions require registration with the relevant UK regulator, such as the NMC, HCPC or GPhC, and the regulator makes that decision independently.", "", "info")}</div></section>

<section class="hc-sec" style="padding-top:24px"><div class="hc-wrap">
<div class="hc-prof-filter" role="group" aria-label="Filter professions">${groups.map(([k, l], i) => `<button class="hc-chip" type="button" data-prof-filter="${k}" aria-pressed="${i === 0}">${l}</button>`).join("")}</div>
${PROFESSIONS.map(p => `<article class="hc-prof${p.restricted ? " is-restricted" : ""} hc-rv" id="${p.id}" data-group="${p.group}">
<div class="hc-prof-head"><span class="tag">${p.restricted ? "Limited – UK right to work" : p.tag}</span><h3>${p.title}</h3><p>${p.intro}</p></div>
<div class="hc-prof-body"><div><h4>Qualifications</h4><p>${p.qual}</p></div><div><h4>Professional registration</h4><p>${p.reg}</p><a href="${p.link[1]}" target="_blank" rel="noopener">${p.link[0]} ↗</a></div><div><h4>Employment pathways</h4><p>${p.path}</p><a href="${BASE}/register/?profession=${p.key}">Register your interest →</a></div></div>
</article>`).join("")}
<div style="margin-top:44px">${note(`Visa routes and salary thresholds change. Before relying on any information, check the current rules for the <a href="https://www.gov.uk/health-care-worker-visa" target="_blank" rel="noopener">Health and Care Worker visa on GOV.UK</a>. The Home Office decides every visa application.`, "teal", "flag")}</div>
</div></section>`;
  return page({ path: "/professions/", active: "professions", title: "Healthcare Professions", description: "Nursing, allied health, pharmacy and social care roles: qualifications, UK registration with the NMC, HCPC, GPhC or Social Work England, and employment pathways.", body });
}

// ---------------- PROCESS ----------------
export function process() {
  const det = [
    ["Initial Registration", "You complete our online registration and upload your CV. You receive a reference number and a confirmation email.", "Registers and provides accurate information.", "Creates your record, checks your country of residence against the Code of Practice lists and assigns a consultant.", "", ""],
    ["Candidate Assessment", "Your consultant reviews your experience, goals, English language and registration status, and discusses realistic options with you.", "Takes part in an initial conversation.", "Assesses suitability and explains requirements honestly, including when a route is not currently possible.", "", ""],
    ["Documentation and Qualification Verification", "When needed, we ask you to upload specific documents securely, such as qualifications and registration evidence, and we contact referees.", "Provides genuine documents when requested.", "Checks documents and references.", "", "Regulators (NMC, HCPC, GPhC) assess your qualifications and decide on registration."],
    ["Employer Matching", "If your profile suits a genuine vacancy, we ask for your consent and present your profile to the employer.", "Chooses which roles to be considered for.", "Shares accurate job information and presents your profile only with your agreement.", "Reviews profiles and decides whom to interview.", ""],
    ["Interviews and Selection", "We arrange interviews, help you prepare and pass feedback both ways.", "Attends interviews.", "Coordinates dates, preparation and feedback.", "Interviews and makes the selection decision.", ""],
    ["Employment Offer", "The employer makes any offer directly. We make sure you understand the pay, hours, contract and conditions.", "Decides whether to accept.", "Explains the offer and answers questions.", "Issues the offer and the employment contract.", ""],
    ["Pre-employment and Immigration Preparation", "The employer completes pre-employment checks. If a visa is needed, the employer issues a Certificate of Sponsorship and you apply to the Home Office.", "Applies for the visa and any registration.", "Helps you understand each step and keeps the timeline on track.", "Carries out checks such as DBS and references, and sponsors the visa.", "The Home Office (UK Visas and Immigration) decides visa applications."],
    ["Pre-departure Support", "Where offered, we share practical guidance on travel, accommodation and your first weeks in the UK.", "Plans travel and arrival.", "Provides guidance and stays in touch.", "Provides induction and pastoral support.", ""]
  ];
  const body = `
<section class="hc-phero"><div class="hc-wrap">${crumbs([["Home", "/"], ["Our Recruitment Process"]])}<div class="hc-phero-grid">
<div>${kicker("Our Recruitment Process", "The candidate journey")}<h1>Eight stages, <em>clearly shared</em> responsibilities.</h1><p class="hc-lead">International recruitment involves several organisations. Here is what happens at each stage and who is responsible for each decision.</p></div>
<div class="hc-phero-media">${img("hc-process", "A consultant on a video call with an international candidate", { eager: true })}</div></div></div></section>

<section class="hc-sec hc-sec-white"><div class="hc-wrap">${journey()}</div></section>

<section class="hc-sec"><div class="hc-wrap"><div class="hc-proc">
${det.map(([h, p, you, us, emp, gov], i) => `<div class="hc-proc-step hc-rv"><span class="n" translate="no">${String(i + 1).padStart(2, "0")}</span><div><h3>${h}</h3><p>${p}</p></div><div class="hc-who"><div><b>You</b><span>${you}</span></div><div><b>MUKTalent</b><span>${us}</span></div>${emp ? `<div><b>Employer</b><span>${emp}</span></div>` : ""}${gov ? `<div><b>Authorities</b><span>${gov}</span></div>` : ""}</div></div>`).join("")}
</div></div></section>

<section class="hc-sec hc-sec-white"><div class="hc-wrap">
<div class="hc-center" style="margin-bottom:44px">${kicker("Responsibilities", "Who decides what")}<h2>We guide the process. <em>We do not make every decision.</em></h2></div>
<div class="hc-resp">
<div class="hc-card us hc-rv"><h3>MUKTalent Healthcare</h3><ul><li>Accurate information and advice</li><li>Assessment, screening and verification</li><li>Interview coordination and communication</li><li>Country checks under the Code of Practice</li><li>Protecting your personal data</li></ul></div>
<div class="hc-card hc-rv"><h3>Employers</h3><ul><li>Job offers and employment contracts</li><li>Pay, hours and employment conditions</li><li>Pre-employment checks, including DBS</li><li>Visa sponsorship, where applicable</li><li>Induction and pastoral support</li></ul></div>
<div class="hc-card hc-rv"><h3>Regulators</h3><ul><li>NMC: nurses and midwives</li><li>HCPC: allied health professions</li><li>GPhC: pharmacists</li><li>Social Work England: social workers</li><li>Decisions on professional registration</li></ul></div>
<div class="hc-card hc-rv"><h3>Government</h3><ul><li>Home Office and UK Visas and Immigration</li><li>Visa and immigration decisions</li><li>Sponsor licensing</li><li>Country lists in the Code of Practice, published by NHS Employers on behalf of the Department of Health and Social Care</li></ul></div>
</div></div></section>

<section class="hc-sec-tight"><div class="hc-wrap hc-cta"><div class="hc-pattern"><p class="hc-kicker">Begin at stage one</p><h2>Register as a candidate.</h2><p>Your reference number is created as soon as you submit the form.</p><div class="hc-actions">${btn("Register now", "/register/", "hc-btn-gold")}</div></div><div><p class="hc-kicker">Employers</p><h2>Plan a recruitment campaign.</h2><p>Tell us about your roles and timelines.</p><div class="hc-actions">${btn("Discuss Your Recruitment Needs", "/employers/#enquiry", "hc-btn-teal")}</div></div></div></section>`;
  return page({ path: "/recruitment-process/", active: "process", title: "Our Recruitment Process", description: "The eight stages of international healthcare recruitment with MUKTalent Healthcare, and the responsibilities of candidates, employers, regulators and the Home Office.", body });
}

// ---------------- ETHICS ----------------
export function ethics() {
  const commitments = [
    ["Fair and transparent recruitment", "Clear stages, honest timelines and documented decisions."],
    ["Equal treatment and non-discrimination", "Every candidate is assessed on merit, in line with the Equality Act 2010."],
    ["Accurate job descriptions and employment information", "We share the real pay, hours and conditions provided by the employer."],
    ["Candidate protection", "Safeguarding, support and a named contact for every candidate."],
    ["No coercion, exploitation or misleading promises", "No pressure to accept offers and no promises we cannot keep."],
    ["Appropriate qualification and reference verification", "Checks that protect patients, employers and candidates."],
    ["Transparent employer relationships", "We only display genuine partnerships, with written agreement."],
    ["Accessible complaints procedures", "A clear route to raise concerns, with independent escalation."]
  ];
  const policies = [["ethical-recruitment-policy", "Ethical Recruitment Policy"], ["candidate-rights", "Candidate Rights and Responsibilities"], ["complaints-policy", "Complaints Policy"], ["equality-diversity-inclusion", "Equality, Diversity and Inclusion Policy"], ["safeguarding", "Safeguarding Policy"], ["anti-bribery", "Anti-Bribery Policy"], ["recruitment-verification", "Recruitment Verification Policy"], ["data-protection", "Data Protection and Privacy Policy"]];
  const body = `
<section class="hc-phero"><div class="hc-wrap">${crumbs([["Home", "/"], ["Ethical Recruitment"]])}<div class="hc-phero-grid">
<div>${kicker("Ethical Recruitment", "Code of Practice")}<h1>Our Commitment to <em>Ethical International Recruitment</em></h1><p class="hc-lead">We follow the Code of Practice for the International Recruitment of Health and Social Care Personnel in England. Here we explain what that means in practice and how you can hold us to it.</p></div>
<div class="hc-phero-media tall">${img("hc-ethics", "A senior nurse looking out of a hospital window", { eager: true, w: 1600, h: 2133, sizes: "(max-width: 980px) 80vw, 420px" })}</div></div></div></section>

<section class="hc-sec hc-sec-teal hc-pattern"><div class="hc-wrap hc-pledge">
<div>${kicker("Candidate fees", "Our clearest promise")}<p class="hc-quote">Candidates are not charged recruitment or work-finding fees by MUKTalent Healthcare.</p><p class="hc-lead">Charging work-seekers for finding them work is prohibited by the Employment Agencies Act 1973 and is against the Code of Practice. If anyone asks you for money in our name, please report it to us straight away.</p></div>
<div class="hc-pledge-list"><div>${icon("check")}<span>No registration, placement or work-finding fees</span></div><div>${icon("check")}<span>No fees deducted from your salary by us</span></div><div>${icon("check")}<span>No unfair repayment or exit clauses agreed by us with employers</span></div><div>${icon("check")}<span>Report concerns to <a href="mailto:${COMPANY.email}" style="color:var(--gold-soft)" translate="no">${COMPANY.email}</a></span></div></div>
</div></section>

<section class="hc-sec hc-sec-white"><div class="hc-wrap">
<div class="hc-head-split"><div>${kicker("01", "Our commitments")}<h2>Eight principles we <em>apply every day</em>.</h2></div><p class="hc-lead">These principles are written into our policies, our training and the system our consultants use.</p></div>
<div class="hc-grid-4">${commitments.map(([h, p], i) => `<div class="hc-card hc-rv"><span class="hc-card-num" translate="no">${String(i + 1).padStart(2, "0")}</span><h3 style="margin-top:30px">${h}</h3><p>${p}</p></div>`).join("")}</div>
</div></section>

<section class="hc-sec"><div class="hc-wrap hc-split">
<div class="hc-rv">${kicker("02", "International recruitment restrictions")}<h2>We check country lists <em>before we recruit</em>.</h2>
<p class="hc-lead" style="margin-top:20px">The Code of Practice includes a list of countries, based on the World Health Organization’s health workforce support and safeguards list.</p>
<ul class="hc-ticks dark"><li><span><b>Red-list countries:</b> we do not undertake active recruitment.</span></li><li><span><b>Amber-list countries:</b> recruitment only follows the applicable government-to-government agreement and its conditions.</span></li><li><span>Our system checks the candidate’s country of residence at registration and blocks employer matching where recruitment is not permitted.</span></li><li><span>We review the official list regularly and whenever it is updated.</span></li></ul>
<p><a class="hc-link" href="https://www.nhsemployers.org/articles/code-practice-red-and-amber-list-countries" target="_blank" rel="noopener">Current red and amber list on NHS Employers ${icon("ext")}</a></p></div>
<div class="hc-rv"><div class="hc-card"><h3>If you live in a red-list country</h3><p style="margin-bottom:14px">We cannot actively recruit you or present you to employers. The Code allows you to apply directly to UK employers on your own initiative, for example through NHS Jobs.</p><p style="margin-bottom:18px">If you register with us, we will tell you this honestly and will not process your profile for matching.</p><a class="hc-link" href="https://www.jobs.nhs.uk/" target="_blank" rel="noopener">NHS Jobs ${icon("ext")}</a></div>
<div class="hc-card" style="margin-top:16px"><h3>Ethical Recruiters List</h3><p>NHS Employers publishes the Ethical Recruiters List of organisations that have committed to the Code. MUKTalent Healthcare is not currently on the list. Our policies and systems are designed to meet its requirements, and we will only state that we are listed once this has been formally confirmed.</p><p style="margin-top:14px"><a class="hc-link" href="https://www.nhsemployers.org/articles/ethical-recruiters-list" target="_blank" rel="noopener">Ethical Recruiters List ${icon("ext")}</a></p></div></div>
</div></section>

<section class="hc-sec hc-sec-white"><div class="hc-wrap">
<div class="hc-head-split"><div>${kicker("03", "Complaints and accountability")}<h2>Clear responsibility, <em>independent routes</em>.</h2></div><p class="hc-lead">Our Ethical Recruitment and Compliance Lead is responsible for this policy and for every complaint we receive.</p></div>
<div class="hc-grid-3">
<div class="hc-card hc-rv"><span class="hc-ico">${icon("mail")}</span><h3>Dedicated contact</h3><p>Complaints can be made online, by email to <span translate="no">${COMPANY.email}</span> or by phone. We acknowledge every complaint within 2 working days.</p></div>
<div class="hc-card hc-rv"><span class="hc-ico">${icon("doc")}</span><h3>Written procedure and register</h3><p>Every complaint receives a reference number, is recorded in our internal complaints register and is investigated by someone not involved in the matter.</p></div>
<div class="hc-card hc-rv"><span class="hc-ico">${icon("flag")}</span><h3>Escalation</h3><p>If you are not satisfied, you can contact the Employment Agency Standards Inspectorate or, for Code of Practice concerns, NHS Employers.</p></div></div>
<div class="hc-actions" style="margin-top:34px">${btn("Read the Complaints Procedure", "/complaints/", "hc-btn-teal")}${btn("Raise a concern", "/complaints/#complaint", "hc-btn-line", "")}</div>
</div></section>

<section class="hc-sec"><div class="hc-wrap">
<div class="hc-head-split"><div>${kicker("04", "Policies and documents")}<h2>Our <em>published</em> policies.</h2></div><p class="hc-lead">Each policy is approved by management, reviewed at least once a year and available to candidates, employers and staff.</p></div>
<div class="hc-docs">${policies.map(([s, t]) => `<a class="hc-doc hc-rv" href="${BASE}/policies/${s}/">${icon("doc")}<div><b>${t}</b><span>Read the policy</span></div></a>`).join("")}</div>
<p style="margin-top:28px"><a class="hc-link" href="${BASE}/policies/">All policies and data protection documents ${icon("arrow")}</a></p>
</div></section>`;
  return page({ path: "/ethical-recruitment/", active: "ethics", title: "Our Commitment to Ethical International Recruitment", description: "How MUKTalent Healthcare follows the Code of Practice for international recruitment: no candidate fees, red and amber country checks, complaints and published policies.", body });
}

// ---------------- ABOUT ----------------
export function about() {
  const body = `
<section class="hc-phero"><div class="hc-wrap">${crumbs([["Home", "/"], ["About Us"]])}<div class="hc-phero-grid">
<div>${kicker("About Us", "MUKTalent Healthcare")}<h1>A UK organisation built on <em>trust and accountability</em>.</h1><p class="hc-lead">MUKTalent Healthcare is the healthcare and social care recruitment division of MUKTalent, a UK company that supports international talent coming to the United Kingdom.</p></div>
<div class="hc-phero-media">${img("hc-about", "MUKTalent Healthcare colleagues in a meeting", { eager: true })}</div></div></div></section>

<section class="hc-sec hc-sec-white"><div class="hc-wrap hc-grid-2">
<div class="hc-rv">${kicker("01", "One company, two divisions")}<h2>MUKTalent and <em>MUKTalent Healthcare</em>.</h2></div>
<div class="hc-rv hc-prose"><p class="hc-lead">MUKTalent operates two divisions under one company and one set of values.</p>
<p><b>MUKTalent Education</b> supports international students applying to UK universities.</p>
<p><b>MUKTalent Healthcare</b> connects international healthcare professionals with UK employers. It has its own team, its own recruitment procedures and its own candidate and employer records, kept separate from the Education division.</p>
<p>Both divisions are managed from the United Kingdom and share the same commitment to honest information, fair treatment and the protection of personal data.</p></div>
</div></section>

<section class="hc-sec"><div class="hc-wrap">
<div class="hc-head-split"><div>${kicker("02", "How we are organised")}<h2>Clear roles and <em>responsibilities</em>.</h2></div><p class="hc-lead">Our structure makes sure every decision has an owner and every concern has somewhere to go.</p></div>
<div class="hc-grid-4">
<div class="hc-card hc-rv"><span class="hc-ico">${icon("building")}</span><h3>Management</h3><p>UK-based directors are accountable for the division, its policies and its compliance with UK law.</p></div>
<div class="hc-card hc-rv"><span class="hc-ico">${icon("shield")}</span><h3>Ethical Recruitment and Compliance Lead</h3><p>Responsible for the Code of Practice, country checks, complaints and policy reviews.</p></div>
<div class="hc-card hc-rv"><span class="hc-ico">${icon("people")}</span><h3>Recruitment consultants</h3><p>Each candidate and employer has a named consultant who sees only the records they are authorised to manage.</p></div>
<div class="hc-card hc-rv"><span class="hc-ico">${icon("lock")}</span><h3>Data protection</h3><p>A designated person oversees privacy, data rights requests, retention and security incidents.</p></div>
</div></div></section>

<section class="hc-sec hc-sec-white" data-team-section hidden><div class="hc-wrap">
<div class="hc-head-split"><div>${kicker("03", "Our team")}<h2>The people <em>behind the process</em>.</h2></div><p class="hc-lead">Meet the management and recruitment team of MUKTalent Healthcare.</p></div>
<div class="hc-grid-3" data-team></div></div></section>

<section class="hc-sec"><div class="hc-wrap hc-grid-2">
<div class="hc-rv">${kicker("04", "Professional standards")}<h2>How we <em>work</em>.</h2><ul class="hc-ticks dark" style="margin-top:24px">${["We follow the Code of Practice for international recruitment in England", "We comply with the Employment Agencies Act 1973 and the Conduct of Employment Agencies and Employment Businesses Regulations 2003", "We protect personal data under the UK GDPR and the Data Protection Act 2018", "We train our team in ethical recruitment, safeguarding and data protection", "We record and review complaints, and learn from them"].map(x => `<li>${x}</li>`).join("")}</ul></div>
<div class="hc-rv">${kicker("05", "Company details")}<h2>Verified <em>company information</em>.</h2>
<div class="hc-company" style="margin-top:24px">
<div><small>Registered legal entity</small><b translate="no">${COMPANY.legal}</b></div>
<div><small>Trading name</small><b translate="no">MUKTalent Healthcare</b></div>
<div><small>Company number</small><b><a href="${COMPANY.ch}" target="_blank" rel="noopener" translate="no">${COMPANY.number}</a></b></div>
<div><small>Registered in</small><b>England and Wales</b></div>
<div style="grid-column:1/-1"><small>Registered office</small><b translate="no">${COMPANY.office}</b></div>
<div><small>Email</small><b><a href="mailto:${COMPANY.email}" translate="no">${COMPANY.email}</a></b></div>
<div><small>Telephone</small><b><a href="tel:${COMPANY.tel}" dir="ltr" translate="no">${COMPANY.phone}</a></b></div>
</div></div>
</div></section>`;
  return page({ path: "/about/", active: "about", title: "About Us", description: "MUKTalent Healthcare is the healthcare recruitment division of MUKTalent (MAGHREB UK TALENT LTD, company 16987132), managed from London.", body });
}

// ---------------- CONTACT ----------------
export function contact() {
  const body = `
<section class="hc-phero-plain"><div class="hc-wrap">${crumbs([["Home", "/"], ["Contact"]])}${kicker("Contact", "We are here to help")}<h1>Talk to <em>the right team</em>.</h1><p class="hc-lead">Choose the route that best describes your enquiry. We reply within two working days.</p></div></section>
<section class="hc-sec" style="padding-top:20px"><div class="hc-wrap hc-form-shell">
<aside class="hc-aside">
<div class="hc-card"><h3>Contact details</h3><ul class="hc-meta" style="flex-direction:column;gap:12px;margin-top:14px;font-size:15px"><li>${icon("mail")}<a href="mailto:${COMPANY.email}" translate="no">${COMPANY.email}</a></li><li>${icon("phone")}<a href="tel:${COMPANY.tel}" dir="ltr" translate="no">${COMPANY.phone}</a></li><li>${icon("pin")}<span>London, United Kingdom</span></li><li>${icon("clock")}<span>Monday to Friday, 9:00–17:30 (UK time)</span></li></ul></div>
${note(`Want to register as a candidate? Use our <a href="${BASE}/register/">registration form</a>, so we can create your record and reference number.`, "teal", "user")}
${note(`To make a complaint, please use our <a href="${BASE}/complaints/">Complaints Procedure</a>.`, "", "flag")}
</aside>
<div>
<div class="hc-routes" role="tablist" aria-label="Enquiry type">
<button class="hc-route" type="button" role="tab" aria-selected="true" data-route-tab="candidate"><b>Candidate Enquiries</b><span>Healthcare professionals with a question</span></button>
<button class="hc-route" type="button" role="tab" aria-selected="false" data-route-tab="employer"><b>Employer Enquiries</b><span>Recruitment needs for UK services</span></button>
<button class="hc-route" type="button" role="tab" aria-selected="false" data-route-tab="general"><b>General Business Enquiries</b><span>Partnerships, media and other matters</span></button>
</div>
<form class="hc-form" data-hc-form="enquiry" data-route="candidate" data-route-form novalidate>
<fieldset><legend><span class="n" translate="no">i</span><span data-route-title>Candidate enquiry</span></legend><div class="hc-fields">
${field("name", "Full Name", { req: true, auto: "name" })}${field("email", "Email Address", { type: "email", req: true, auto: "email" })}
${field("phone", "Telephone Number", { type: "tel", opt: true, auto: "tel" })}
${field("organisation", "Organisation", { opt: true, auto: "organization", wrap: 'data-only="general" hidden' })}
${field("subject", "Subject", { req: true, full: true })}
${field("message", "Message", { type: "textarea", req: true, full: true })}
</div></fieldset>
<div class="hc-consent"><label class="hc-check"><input type="checkbox" name="privacy" required><span>I have read how MUKTalent Healthcare uses the information in this form, as explained in the <a href="${BASE}/privacy/" target="_blank">Privacy Policy</a>.</span></label><span class="err" data-err="privacy"></span>
<label class="hc-check"><input type="checkbox" name="marketing"><span>Optional: I would like to receive occasional updates from MUKTalent Healthcare. I can unsubscribe at any time.</span></label></div>
${hp}
<div class="hc-form-foot"><p>Your enquiry is stored securely and forwarded to the relevant team.</p><button class="hc-btn hc-btn-teal" type="submit"><span>Send message</span>${icon("arrow")}</button></div>
<div class="hc-form-msg err" data-msg hidden role="alert"></div>
${successBlock("Thank you. Your message has been received.", "We have sent a confirmation to your email address and will reply within two working days.")}
</form>
<div data-employer-form hidden>${employerForm("contact-employer")}</div>
</div></div></section>`;
  return page({ path: "/contact/", active: "contact", title: "Contact", description: "Contact MUKTalent Healthcare: candidate enquiries, employer enquiries and general business enquiries. London, United Kingdom.", body, scripts: ["hc-forms.js"] });
}

// ---------------- REGISTER ----------------
export function register() {
  const reg = [["registered_uk", "Registered with a UK regulator (NMC, HCPC, GPhC or other)"], ["in_progress_uk", "UK registration in progress"], ["registered_home", "Registered in my home country, not yet in the UK"], ["not_started", "Not registered yet"], ["not_applicable", "Not applicable to my role"]];
  const eng = [["ielts_oet_passed", "IELTS or OET passed at the required level"], ["test_booked", "English test booked"], ["preparing", "Preparing for an English test"], ["native_or_exempt", "English is my first language or I am exempt"], ["not_sure", "Not sure"]];
  const emp = [["employed", "Employed"], ["self_employed", "Self-employed"], ["unemployed", "Not currently working"], ["studying", "Studying"], ["other", "Other"]];
  const body = `
<section class="hc-phero-plain"><div class="hc-wrap">${crumbs([["Home", "/"], ["For Candidates", "/candidates/"], ["Register"]])}${kicker("Candidate registration", "About ten minutes")}<h1>Register as <em>a candidate</em>.</h1><p class="hc-lead">Tell us about your profession and experience. You will receive a reference number immediately, and a consultant will review your profile.</p></div></section>
<section class="hc-sec" style="padding-top:20px"><div class="hc-wrap hc-form-shell">
<aside class="hc-aside">
<div class="hc-card" data-vacancy-box hidden><p class="hc-kicker" style="margin-bottom:10px">Applying for</p><h3 data-vacancy-title>—</h3><p data-vacancy-meta class="hc-small"></p></div>
<div class="hc-card"><h3>What happens next</h3><div class="hc-next" style="margin:14px 0 0">
<div><b translate="no">1</b><span>You receive your reference number and a confirmation email.</span></div>
<div><b translate="no">2</b><span>We check your country of residence against the Code of Practice lists.</span></div>
<div><b translate="no">3</b><span>A consultant is assigned and reviews your profile.</span></div>
<div><b translate="no">4</b><span>Create your portal account with the same email to follow your progress.</span></div></div></div>
${note("<b>No sensitive documents now.</b> We only ask for your CV at this stage. Please do not upload your passport, medical information or other sensitive documents unless your consultant asks you to through the portal.", "", "lock")}
${note("Candidates are not charged recruitment or work-finding fees by MUKTalent Healthcare.", "teal", "shield")}
</aside>
<form class="hc-form" data-hc-form="register" novalidate>
<fieldset><legend><span class="n" translate="no">i</span><span>About you</span></legend><div class="hc-fields">
${field("full_name", "Full Name", { req: true, auto: "name", full: true })}
${field("email", "Email Address", { type: "email", req: true, auto: "email" })}${field("phone", "Telephone Number", { type: "tel", req: true, auto: "tel", hint: "Include your country code, for example +212." })}
${select("country_residence", "Country of Residence", [], { req: true, attrs: "data-countries" })}${select("nationality", "Nationality, where relevant", [], { opt: true, attrs: "data-countries", placeholder: "Prefer not to say" })}
</div></fieldset>
<fieldset><legend><span class="n" translate="no">ii</span><span>Your profession</span></legend><div class="hc-fields">
${select("profession", "Healthcare Profession", PROF_OPTIONS, { req: true })}${field("experience_years", "Years of Experience", { type: "number", req: true, attrs: 'min="0" max="60" step="0.5" inputmode="decimal"' })}
${select("registration_status", "Professional Registration", reg, { req: true, full: true })}
${field("registration_body", "Regulator or registration body", { opt: true, hint: "For example, NMC, HCPC or your home country regulator." })}${field("registration_number", "Registration number", { opt: true })}
${select("english_level", "English Language Level", eng, { req: true })}${select("employment_status", "Current Employment Status", emp, { req: true })}
${field("preferred_location", "Preferred UK Location", { req: true, hint: "A city, a region or ‘anywhere in the UK’." })}
<div class="hc-field"><span class="lbl">Right to work in the UK</span><label class="hc-check"><input type="checkbox" name="right_to_work_uk"><span>I already have the right to work in the UK</span></label></div>
</div></fieldset>
<fieldset><legend><span class="n" translate="no">iii</span><span>Your CV</span></legend><div class="hc-fields">
<div class="hc-field full"><span class="lbl" id="lbl-cv">CV Upload</span><label class="hc-file" data-file><input type="file" name="cv" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" aria-labelledby="lbl-cv" aria-describedby="h-cv"><span class="ico">${icon("upload")}</span><span><b data-file-name>Choose a file or drag it here</b><span id="h-cv">PDF or Word, up to 10 MB.</span></span></label><div class="hc-progress" data-file-progress hidden><i></i></div><span class="err" data-err="cv"></span></div>
${field("additional_info", "Additional Information", { type: "textarea", opt: true, full: true, hint: "Anything else you would like us to know, such as specialisms, availability or questions." })}
</div></fieldset>
<div class="hc-consent">
<label class="hc-check"><input type="checkbox" name="privacy" required><span>I have read the <a href="${BASE}/candidate-privacy/" target="_blank">Candidate Privacy Notice</a> and understand how MUKTalent Healthcare will use my information for recruitment purposes.</span></label><span class="err" data-err="privacy"></span>
<label class="hc-check"><input type="checkbox" name="marketing"><span>Optional: I would like to receive news about relevant opportunities and events from MUKTalent Healthcare. This is separate from my registration and I can unsubscribe at any time.</span></label></div>
${hp}<input type="hidden" name="vacancy">
<div class="hc-form-foot"><p>By registering you are not committing to any role, and we will not share your profile with an employer without your agreement.</p><button class="hc-btn hc-btn-gold" type="submit"><span>Submit registration</span>${icon("arrow")}</button></div>
<div class="hc-form-msg err" data-msg hidden role="alert"></div>
${successBlock("Thank you for registering.", "We have created your candidate record and sent a confirmation email. A consultant will review your profile shortly.")}
</form></div></section>`;
  return page({ path: "/register/", active: "candidates", title: "Register as a Candidate", description: "Register with MUKTalent Healthcare in about ten minutes. Receive a candidate reference number and a named consultant. No recruitment fees for candidates.", body, scripts: ["hc-forms.js"] });
}

// ---------------- VACANCIES ----------------
export function vacancies() {
  const body = `
<section class="hc-phero-plain" data-vac-hero><div class="hc-wrap">${crumbs([["Home", "/"], ["Vacancies"]])}${kicker("Vacancies", "Genuine, authorised roles")}<h1>Current <em>opportunities</em>.</h1><p class="hc-lead">Every vacancy here is a genuine role that the employer has authorised us to publish. Salary and conditions are provided by the employer.</p></div></section>
<section class="hc-sec" style="padding-top:20px"><div class="hc-wrap">
<div data-vac-list-view>
<div class="hc-vac-tools"><label class="hc-sr" for="vacFilter">Filter by profession</label><select id="vacFilter" data-vac-filter><option value="">All professions</option>${PROF_OPTIONS.map(([v, l]) => `<option value="${v}">${l}</option>`).join("")}</select><span class="hc-small" data-vac-count aria-live="polite"></span></div>
<div class="hc-vac-list" data-vac-list><div class="hc-skel"></div><div class="hc-skel"></div><div class="hc-skel"></div></div>
<div class="hc-empty" data-vac-empty hidden><h3>No vacancies are published right now</h3><p>We only publish roles that employers have authorised. Register your profile and we will contact you when a suitable genuine opportunity becomes available.</p>${btn("Register as a Candidate", "/register/", "hc-btn-gold")}</div>
</div>
<div data-vac-detail-view hidden></div>
<div style="margin-top:44px">${note("We do not guarantee employment, visa approval, professional registration or a specific salary. The employer makes every hiring decision.", "", "info")}</div>
</div></section>`;
  return page({ path: "/vacancies/", active: "", title: "Vacancies", description: "Genuine healthcare vacancies in the UK published by MUKTalent Healthcare with employer authorisation. Apply securely online.", body, scripts: ["hc-forms.js"] });
}

// ---------------- COMPLAINTS ----------------
export function complaints() {
  const cats = [["recruitment_process", "The recruitment process"], ["fees", "A request for fees or payment"], ["information", "Inaccurate or misleading information"], ["discrimination", "Discrimination or unfair treatment"], ["data_protection", "Data protection or privacy"], ["staff_conduct", "Conduct of a member of our team"], ["employer", "An employer we introduced"], ["other", "Something else"]];
  const body = `
<section class="hc-phero-plain"><div class="hc-wrap">${crumbs([["Home", "/"], ["Ethical Recruitment", "/ethical-recruitment/"], ["Complaints Procedure"]])}${kicker("Complaints Procedure", "We want to know")}<h1>Raise a concern or <em>make a complaint</em>.</h1><p class="hc-lead">Candidates, employers, staff and members of the public can complain about any part of our service. Complaints are handled fairly, confidentially and without any negative effect on your application.</p></div></section>
<section class="hc-sec hc-sec-white"><div class="hc-wrap hc-grid-2">
<div class="hc-prose">
<h2 style="margin-top:0">How we handle complaints</h2>
<ol><li><b>Make your complaint</b> using the form on this page, by email to <span translate="no">${COMPANY.email}</span> or by phone on <span dir="ltr" translate="no">${COMPANY.phone}</span>. You can ask someone to complain on your behalf.</li>
<li><b>Acknowledgement within 2 working days.</b> You will receive a complaint reference number and the name of the person handling it.</li>
<li><b>Investigation.</b> Our Ethical Recruitment and Compliance Lead, or a senior person not involved in the matter, investigates. Every complaint is recorded in our internal complaints register.</li>
<li><b>Written response within 20 working days.</b> We explain what we found, what we will do and how to escalate if you are not satisfied. If we need more time, we will tell you why.</li>
<li><b>Review.</b> You can ask a director to review the outcome. We use every complaint to improve our service.</li></ol>
<h3>Serious concerns</h3><p>Reports of fees charged to candidates, discrimination, exploitation or safeguarding concerns are treated as serious and escalated immediately to management.</p></div>
<div class="hc-prose">
<h2 style="margin-top:0">Independent organisations</h2><p>You can contact these organisations at any stage:</p>
<ul>
<li><a href="https://www.gov.uk/government/organisations/employment-agency-standards-inspectorate" target="_blank" rel="noopener">Employment Agency Standards Inspectorate (EAS)</a> – for concerns about employment agencies, including fees charged to work-seekers.</li>
<li>NHS Employers – for breaches of the Code of Practice: <a href="mailto:internationalrecruitment@nhsconfed.org" translate="no">internationalrecruitment@nhsconfed.org</a>.</li>
<li><a href="https://ico.org.uk/make-a-complaint/" target="_blank" rel="noopener">Information Commissioner’s Office (ICO)</a> – for data protection concerns.</li>
<li><a href="https://www.acas.org.uk/" target="_blank" rel="noopener">Acas</a> – free advice on employment rights.</li>
<li><a href="https://www.gla.gov.uk/" target="_blank" rel="noopener">Gangmasters and Labour Abuse Authority (GLAA)</a> and the Modern Slavery and Exploitation Helpline, <span dir="ltr" translate="no">08000 121 700</span> – if you think someone is being exploited.</li>
<li><a href="https://www.cqc.org.uk/" target="_blank" rel="noopener">Care Quality Commission (CQC)</a> – for concerns about a care provider.</li>
</ul></div>
</div></section>
<section class="hc-sec" id="complaint"><div class="hc-wrap hc-form-shell">
<aside class="hc-aside">${kicker("Complaint form", "Confidential")}<h2>Tell us <em>what happened</em>.</h2><p class="hc-lead">Please include as much detail as you can. We will not share your complaint with anyone outside the people who need to investigate it.</p></aside>
<form class="hc-form" data-hc-form="complaint" novalidate>
<fieldset><legend><span class="n" translate="no">i</span><span>Your details</span></legend><div class="hc-fields">
${field("complainant_name", "Full Name", { req: true, auto: "name" })}${field("email", "Email Address", { type: "email", req: true, auto: "email" })}
${field("phone", "Telephone Number", { type: "tel", opt: true, auto: "tel" })}${select("complainant_role", "I am a", [["candidate", "Candidate"], ["employer", "Employer"], ["employee", "Member of staff"], ["other", "Other"]], { req: true })}
${field("candidate_reference", "Candidate reference", { opt: true, hint: "If you have one, for example MKH-C26-00012." })}
</div></fieldset>
<fieldset><legend><span class="n" translate="no">ii</span><span>Your complaint</span></legend><div class="hc-fields">
${select("category", "What is it about?", cats, { req: true, full: true })}
${field("subject", "Subject", { req: true, full: true })}
${field("details", "What happened?", { type: "textarea", req: true, full: true, hint: "Dates, names and any steps you have already taken." })}
</div></fieldset>
<div class="hc-consent"><label class="hc-check"><input type="checkbox" name="privacy" required><span>I understand that MUKTalent Healthcare will use this information to investigate my complaint, as explained in the <a href="${BASE}/privacy/" target="_blank">Privacy Policy</a>.</span></label><span class="err" data-err="privacy"></span></div>
${hp}
<div class="hc-form-foot"><p>We acknowledge every complaint within 2 working days.</p><button class="hc-btn hc-btn-teal" type="submit"><span>Submit complaint</span>${icon("arrow")}</button></div>
<div class="hc-form-msg err" data-msg hidden role="alert"></div>
${successBlock("Your complaint has been received.", "We have sent an acknowledgement to your email address. We will respond in writing within 20 working days.")}
</form></div></section>`;
  return page({ path: "/complaints/", active: "ethics", title: "Complaints Procedure", description: "How to make a complaint to MUKTalent Healthcare, our timescales, and the independent organisations you can contact.", body, scripts: ["hc-forms.js"] });
}
