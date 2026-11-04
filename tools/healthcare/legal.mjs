import { page, icon, kicker, crumbs, BASE, COMPANY } from "./layout.mjs";

const UPDATED = "4 November 2026";
const ctrl = `<b>${COMPANY.legal}</b> (company number ${COMPANY.number}), trading as MUKTalent Healthcare, registered office ${COMPANY.office}. Contact: <a href="mailto:${COMPANY.email}">${COMPANY.email}</a>, <span dir="ltr">${COMPANY.phone}</span>`;
const PROCESSORS = `<table><thead><tr><th>Provider</th><th>Purpose</th></tr></thead><tbody>
<tr><td>Supabase</td><td>Secure database, authentication and encrypted document storage for our recruitment system</td></tr>
<tr><td>Vercel</td><td>Website hosting and secure (HTTPS) delivery</td></tr>
<tr><td>Resend</td><td>Sending confirmation and notification emails</td></tr>
<tr><td>Google Analytics (only with your consent)</td><td>Anonymous website usage statistics</td></tr></tbody></table>`;
const RIGHTS = `<ul><li>the right to be informed about how we use your information;</li><li>the right of access to a copy of your information;</li><li>the right to rectification of inaccurate or incomplete information;</li><li>the right to erasure, where applicable;</li><li>the right to restrict processing, where applicable;</li><li>the right to data portability, where applicable;</li><li>the right to object to processing based on legitimate interests or for direct marketing;</li><li>rights in relation to automated decision-making (we do not make recruitment decisions solely by automated means);</li><li>the right to withdraw consent at any time, where we rely on consent.</li></ul>
<p>To exercise any right, email <a href="mailto:${COMPANY.email}">${COMPANY.email}</a> or, if you are a candidate, use <b>Help &amp; Support → My data</b> in the candidate portal. We respond within one month. You also have the right to complain to the Information Commissioner’s Office (ICO) at <a href="https://ico.org.uk/make-a-complaint/" target="_blank" rel="noopener">ico.org.uk</a> or on 0303 123 1113.</p>`;
const TRANSFERS = `<p>Some of our service providers may process information outside the UK. Where this happens we assess the applicable legal requirements and rely on UK adequacy regulations, the UK International Data Transfer Agreement or the UK Addendum to the EU Standard Contractual Clauses, together with additional safeguards where needed. When you ask us to, and only with your agreement, we may also share your profile with an employer in the UK.</p>`;

export const DOCS = [
  { slug: "privacy", path: "/privacy/", title: "Website Privacy Policy", group: "data", summary: "How we use information when you visit this website or contact us.", body: `
<h2>1. Who we are</h2><p>The controller of your personal information is ${ctrl}.</p>
<h2>2. Information we collect through this website</h2><ul><li><b>Enquiry forms</b> (candidate, employer, general and complaints): your name, contact details, organisation, job title and the content of your message.</li><li><b>Candidate registration</b>: the information described in our <a href="${BASE}/candidate-privacy/">Candidate Privacy Notice</a>.</li><li><b>Technical information</b>: limited security logs created by our hosting provider (such as IP address and browser type) to protect the website against abuse.</li><li><b>Analytics</b>: only if you accept analytics cookies, anonymous statistics about the pages you visit.</li></ul>
<h2>3. Why we use it and our lawful bases</h2><table><thead><tr><th>Purpose</th><th>Lawful basis (UK GDPR)</th></tr></thead><tbody><tr><td>Responding to enquiries and providing our recruitment services</td><td>Legitimate interests; steps taken at your request before entering into a contract</td></tr><tr><td>Handling complaints</td><td>Legitimate interests; legal obligation</td></tr><tr><td>Website security and spam protection</td><td>Legitimate interests</td></tr><tr><td>Marketing updates</td><td>Consent, which you can withdraw at any time</td></tr><tr><td>Analytics</td><td>Consent</td></tr></tbody></table>
<h2>4. Who we share it with</h2><p>Your information is accessible only to authorised MUKTalent Healthcare personnel who need it for their role. We use the following service providers, who act on our instructions under written contracts:</p>${PROCESSORS}<p>We do not sell personal information.</p>
<h2>5. International transfers</h2>${TRANSFERS}
<h2>6. How long we keep it</h2><p>Enquiries are kept for up to 24 months after our last contact. Complaints are kept for 6 years. Full details are in our <a href="${BASE}/policies/data-retention/">Data Retention and Deletion Policy</a>.</p>
<h2>7. Security</h2><p>The website uses HTTPS throughout. Our recruitment system uses individual user accounts, role-based permissions, multi-factor authentication for team access, private encrypted storage for documents and activity logs. See <a href="${BASE}/policies/data-protection/">How we protect personal information</a>.</p>
<h2>8. Your rights</h2>${RIGHTS}
<h2>9. Changes</h2><p>We review this policy at least once a year and publish any changes on this page.</p>` },

  { slug: "candidate-privacy", path: "/candidate-privacy/", title: "Candidate Privacy Notice", group: "data", summary: "How we use the information of healthcare candidates who register or apply with us.", body: `
<h2>1. Who we are</h2><p>The controller of your personal information is ${ctrl}. MUKTalent Healthcare acts as an employment agency when it introduces candidates to employers.</p>
<h2>2. Information we collect</h2><p><b>At registration</b> we ask only for what we need to assess your profile: your name, email address, telephone number, country of residence, nationality (optional), healthcare profession, years of experience, professional registration status, English language level, current employment status, preferred UK location, your CV and any additional information you choose to give.</p>
<p><b>Later in the process, only when needed</b>, your consultant may ask you to upload specific documents through the secure portal, for example qualification certificates, registration evidence, English test results, references, or identity and right-to-work documents requested by an employer. We do not ask for sensitive documents at registration.</p>
<p><b>Special category and criminal offence information.</b> We do not ask for health information or criminal records. These checks, such as occupational health and DBS checks, are carried out by the employer. If you choose to tell us something sensitive, we will only use it where necessary, for example to make reasonable adjustments for an interview.</p>
<h2>3. How we use it</h2><table><thead><tr><th>Purpose</th><th>Lawful basis</th></tr></thead><tbody>
<tr><td>Creating your candidate record and reference number, assessing your suitability and assigning a consultant</td><td>Steps at your request before a contract; legitimate interests</td></tr>
<tr><td>Checking your country of residence against the Code of Practice red and amber lists</td><td>Legitimate interests; compliance with the Code of Practice</td></tr>
<tr><td>Verifying qualifications, registration and references</td><td>Legitimate interests; legal obligations under the Conduct of Employment Agencies and Employment Businesses Regulations 2003</td></tr>
<tr><td>Introducing you to employers, with your agreement, and coordinating interviews and offers</td><td>Steps at your request before a contract; legitimate interests</td></tr>
<tr><td>Communicating with you by email, phone and through the portal</td><td>Legitimate interests</td></tr>
<tr><td>Handling complaints and maintaining audit records</td><td>Legal obligation; legitimate interests</td></tr>
<tr><td>Sending news about opportunities and events (optional)</td><td>Consent</td></tr></tbody></table>
<h2>4. Who we share it with</h2><ul><li><b>Prospective employers</b>: only after you have agreed to be considered for a specific role or employer.</li><li><b>Professional verification providers and referees</b>: to confirm qualifications, registration and employment history.</li><li><b>Authorised recruitment partners</b>: only where necessary, under written agreements and appropriate safeguards.</li><li><b>Our service providers</b>:</li></ul>${PROCESSORS}<ul><li><b>Regulators and authorities</b>: where the law requires it.</li></ul>
<h2>5. International transfers</h2>${TRANSFERS}
<h2>6. How long we keep it</h2><p>If you are not placed, we keep your record for 12 months after our last meaningful contact, then securely delete or anonymise it unless you ask us to keep it. If you are placed, we keep the records the law requires for at least one year after our last supply of services, and up to 6 years after the placement ends to deal with legal claims. Details: <a href="${BASE}/policies/data-retention/">Data Retention and Deletion Policy</a>.</p>
<h2>7. Security</h2><p>Your documents are stored in private, encrypted storage and can only be opened through short-lived secure links by you and by the authorised team members managing your application. Each consultant can see only the candidates assigned to them. Every access to documents and every change to your record is logged.</p>
<h2>8. Your rights</h2>${RIGHTS}
<h2>9. Fees</h2><p>Candidates are not charged recruitment or work-finding fees by MUKTalent Healthcare.</p>` },

  { slug: "employee-privacy", path: "/employee-privacy/", title: "Employee Privacy Notice", group: "data", summary: "How we use information about our own employees, contractors and job applicants.", body: `
<h2>1. Scope</h2><p>This notice applies to employees, workers, contractors and job applicants of ${COMPANY.legal} working in or applying to MUKTalent Healthcare. It does not apply to healthcare candidates, who are covered by the <a href="${BASE}/candidate-privacy/">Candidate Privacy Notice</a>.</p>
<h2>2. Information we hold</h2><ul><li>identity and contact details, emergency contacts;</li><li>recruitment information, such as CVs, references and interview notes;</li><li>right-to-work documents and records of checks;</li><li>contract, pay, pension, tax and bank details;</li><li>working time, absence, training, performance and disciplinary records;</li><li>system account information, access logs and multi-factor authentication settings;</li><li>where necessary and lawful, health information (for example sickness absence or reasonable adjustments) and, for certain roles, criminal records checks.</li></ul>
<h2>3. Why we use it</h2><p>To recruit and employ you, pay you, meet our legal obligations (including employment, tax, right-to-work, health and safety and equality law), manage performance and training, protect our systems and maintain records of who accessed recruitment data. Lawful bases: performance of the employment contract, legal obligation and legitimate interests. Special category data is processed under the employment and social security conditions in Schedule 1 of the Data Protection Act 2018, with an appropriate policy document.</p>
<h2>4. Sharing</h2><p>HMRC, pension providers, payroll and IT service providers, professional advisers, insurers and authorities where the law requires. Our system providers are listed below.</p>${PROCESSORS}
<h2>5. International transfers</h2>${TRANSFERS}
<h2>6. Retention</h2><p>Unsuccessful applicants: 6 months after the decision. Employee records: for the duration of employment plus 6 years. Payroll and tax records: at least 3 years after the end of the tax year to which they relate, normally 6 years. Right-to-work records: for the duration of employment plus 2 years.</p>
<h2>7. Security and access</h2><p>Personnel records are restricted to authorised managers. Access to the recruitment system requires an individual account and multi-factor authentication, and is logged.</p>
<h2>8. Your rights</h2>${RIGHTS}` },

  { slug: "cookies", path: "/cookies/", title: "Cookie Policy", group: "data", summary: "The cookies and similar technologies used on this website and how to control them.", body: `
<h2>1. What we use</h2><p>Cookies and similar technologies (such as browser local storage) are small pieces of information saved on your device. We use as few as possible.</p>
<table><thead><tr><th>Name</th><th>Type</th><th>Purpose</th><th>Duration</th></tr></thead><tbody>
<tr><td>hc_consent</td><td>Essential (local storage)</td><td>Remembers your cookie choices</td><td>6 months</td></tr>
<tr><td>hc_lang</td><td>Essential (local storage)</td><td>Remembers your chosen language</td><td>Until you change it</td></tr>
<tr><td>Supabase session (sb-…)</td><td>Essential (local storage)</td><td>Keeps you signed in to the candidate portal or team area</td><td>Until you sign out</td></tr>
<tr><td>_ga, _ga_*</td><td>Analytics – only with consent</td><td>Google Analytics 4: anonymous statistics about page visits</td><td>Up to 13 months</td></tr></tbody></table>
<h2>2. Your choices</h2><p>When you first visit, analytics stays off until you choose. You can change your choice at any time with the <b>Cookie settings</b> link at the bottom of every page, or by clearing your browser storage.</p>
<h2>3. Contact</h2><p>Questions: <a href="mailto:${COMPANY.email}">${COMPANY.email}</a>.</p>` },

  { slug: "terms", path: "/terms/", title: "Terms and Conditions", group: "legal", summary: "Terms of use for this website and the basis on which we provide services to candidates.", body: `
<h2>1. About us</h2><p>This website is operated by ${ctrl}.</p>
<h2>2. Our services to candidates</h2><p>We act as an employment agency under the Employment Agencies Act 1973 and the Conduct of Employment Agencies and Employment Businesses Regulations 2003. Before we provide work-finding services, we will agree terms with you in writing. Candidates are not charged recruitment or work-finding fees by MUKTalent Healthcare.</p>
<h2>3. No guarantees</h2><p>We do not guarantee employment, visa approval, professional registration or any specific salary. Employers make hiring decisions, UK regulators decide professional registration and the Home Office decides visa applications.</p>
<h2>4. Your responsibilities</h2><p>You agree to provide accurate and genuine information and documents, to tell us about changes and to use the candidate portal only for your own application. We may withdraw our services if information is knowingly false.</p>
<h2>5. Employers</h2><p>Services to employers are provided under separate written terms agreed before recruitment begins.</p>
<h2>6. Use of this website</h2><p>Content is provided for general information and may change. Links to official sources are provided for convenience; please check the current guidance from GOV.UK and the relevant regulator. You must not misuse the website, attempt to gain unauthorised access or submit automated or false information.</p>
<h2>7. Liability</h2><p>Nothing in these terms limits liability that cannot be limited by law. We are not responsible for the content of external websites.</p>
<h2>8. Law</h2><p>These terms are governed by the laws of England and Wales, and the courts of England and Wales have jurisdiction.</p>` },

  { slug: "ethical-recruitment-policy", path: "/policies/ethical-recruitment-policy/", title: "Ethical Recruitment Policy", group: "policy", summary: "Our commitment to the Code of Practice for international recruitment.", body: `
<h2>1. Purpose</h2><p>This policy sets out how MUKTalent Healthcare recruits international health and social care personnel in line with the Code of Practice for the International Recruitment of Health and Social Care Personnel in England, UK employment agency law and the WHO Global Code of Practice principles on which it is based.</p>
<h2>2. Principles</h2><ul><li>Fair and transparent recruitment, with accurate information about roles, pay and conditions.</li><li>Equal treatment and non-discrimination.</li><li>No coercion, exploitation or misleading promises.</li><li>Candidates are not charged recruitment or work-finding fees by MUKTalent Healthcare.</li><li>Appropriate verification of qualifications, registration and references.</li><li>Transparent relationships with employers, and no display of partnerships that have not been formally agreed.</li><li>An accessible complaints procedure.</li></ul>
<h2>3. Country restrictions</h2><p>Before any international recruitment activity, we check the current red and amber country list published by NHS Employers. We do not undertake active recruitment from red-list countries. Recruitment from amber-list countries follows only the applicable government-to-government agreement and its conditions, and must be approved by the Ethical Recruitment and Compliance Lead. Our recruitment system records each candidate’s country status and prevents matching where recruitment is not permitted. Candidates resident in red-list countries who contact us are told honestly that we cannot recruit them and are signposted to direct application routes.</p>
<h2>4. Employers</h2><p>We carry out due diligence on employers before recruiting for them, including CQC registration and sponsor licence status where relevant, and we require written agreement to the principles in this policy.</p>
<h2>5. Responsibilities</h2><p>The Ethical Recruitment and Compliance Lead owns this policy, monitors compliance, maintains evidence of implementation and reports to the directors. All staff receive training on this policy at induction and annually.</p>
<h2>6. Breaches</h2><p>Suspected breaches can be reported to us, to the Employment Agency Standards Inspectorate or to NHS Employers at internationalrecruitment@nhsconfed.org.</p>` },

  { slug: "candidate-rights", path: "/policies/candidate-rights/", title: "Candidate Rights and Responsibilities", group: "policy", summary: "What candidates can expect from us, and what we ask of candidates.", body: `
<h2>Your rights</h2><ul><li>Not to be charged recruitment or work-finding fees by MUKTalent Healthcare.</li><li>To receive accurate, honest information about roles, employers, pay and conditions before you agree to anything.</li><li>To be treated fairly and without discrimination.</li><li>To decide freely whether to apply for, accept or decline any role, without pressure.</li><li>To know your current stage and to have a named consultant.</li><li>To withdraw from the process at any time.</li><li>To have your personal data protected and to exercise your data protection rights.</li><li>To raise concerns or complaints and to contact independent organisations.</li></ul>
<h2>Your responsibilities</h2><ul><li>Provide truthful information and genuine documents.</li><li>Tell us promptly about changes, such as new contact details, registration outcomes or offers from elsewhere.</li><li>Attend interviews you have agreed to, or let us know in good time.</li><li>Keep your portal account secure and use it only for your own application.</li><li>Tell us immediately if anyone asks you to pay a fee in our name.</li></ul>` },

  { slug: "complaints-policy", path: "/policies/complaints-policy/", title: "Complaints Policy", group: "policy", summary: "How complaints are received, recorded, investigated and escalated.", body: `
<h2>1. Who can complain</h2><p>Candidates, employers, employees and anyone affected by our services.</p>
<h2>2. How</h2><p>Online at <a href="${BASE}/complaints/">${BASE}/complaints/</a>, by email to ${COMPANY.email} or by phone on <span dir="ltr">${COMPANY.phone}</span>.</p>
<h2>3. Timescales</h2><ul><li>Acknowledgement with a reference number within 2 working days.</li><li>Full written response within 20 working days, or an explanation of the delay.</li><li>Review by a director on request.</li></ul>
<h2>4. Register and investigation</h2><p>Every complaint is recorded in the internal complaints register with its category, severity, owner, deadlines, actions and outcome. Investigations are carried out by the Ethical Recruitment and Compliance Lead or a senior person not involved in the matter. Complaints about fees, discrimination, exploitation or safeguarding are classed as serious and escalated immediately.</p>
<h2>5. No detriment</h2><p>Making a complaint will never affect a candidate’s application or treatment.</p>
<h2>6. External escalation</h2><p>Employment Agency Standards Inspectorate; NHS Employers (Code of Practice); Information Commissioner’s Office (data protection); Acas; Gangmasters and Labour Abuse Authority; Modern Slavery and Exploitation Helpline (08000 121 700); Care Quality Commission.</p>
<h2>7. Learning</h2><p>Complaints are reviewed quarterly by management to identify trends and improvements.</p>` },

  { slug: "equality-diversity-inclusion", path: "/policies/equality-diversity-inclusion/", title: "Equality, Diversity and Inclusion Policy", group: "policy", summary: "Fair treatment of every candidate, employee and client.", body: `
<h2>1. Commitment</h2><p>We are committed to equality of opportunity and to preventing discrimination, harassment and victimisation, in line with the Equality Act 2010.</p>
<h2>2. Protected characteristics</h2><p>Age, disability, gender reassignment, marriage and civil partnership, pregnancy and maternity, race (including nationality and ethnic origin), religion or belief, sex and sexual orientation.</p>
<h2>3. In practice</h2><ul><li>Candidates are assessed on their skills, qualifications and experience against the genuine requirements of a role.</li><li>We will not accept or act on discriminatory instructions from any employer.</li><li>We make reasonable adjustments to our process when asked, for example for interviews.</li><li>Our information is available in English, French, Spanish and Arabic, and we will help candidates understand important documents.</li><li>Staff are trained on equality and unconscious bias.</li></ul>
<h2>4. Concerns</h2><p>Any concern can be raised through our complaints procedure and will be treated as serious.</p>` },

  { slug: "safeguarding", path: "/policies/safeguarding/", title: "Safeguarding Policy", group: "policy", summary: "Protecting candidates and the people they will care for.", body: `
<h2>1. Purpose</h2><p>To protect candidates from exploitation, abuse and modern slavery, and to support employers in protecting patients and people who use care services.</p>
<h2>2. Candidate protection</h2><ul><li>No fees, no retention of candidates’ identity documents and no pressure to accept offers.</li><li>Clear information about rights and where to get independent help.</li><li>Concerns of exploitation or trafficking are escalated immediately to management and, where appropriate, to the police, the GLAA or the Modern Slavery and Exploitation Helpline (08000 121 700).</li></ul>
<h2>3. Protecting people who use services</h2><p>We verify qualifications, registration and references and pass relevant information to employers, who carry out DBS and other pre-employment checks. We will not knowingly introduce a candidate whose registration has been restricted or removed without disclosing it to the employer.</p>
<h2>4. Responsibilities</h2><p>The Ethical Recruitment and Compliance Lead acts as the designated safeguarding lead for the division. All staff are trained at induction and annually.</p>` },

  { slug: "anti-bribery", path: "/policies/anti-bribery/", title: "Anti-Bribery Policy", group: "policy", summary: "Zero tolerance of bribery and corruption under the Bribery Act 2010.", body: `
<h2>1. Commitment</h2><p>We do not offer, pay, request or accept bribes or improper payments of any kind, in the UK or abroad, in line with the Bribery Act 2010.</p>
<h2>2. Rules</h2><ul><li>No payments to officials, regulators, employers or intermediaries to influence decisions about registration, visas, interviews or offers.</li><li>No facilitation payments.</li><li>Gifts and hospitality above £50 must be approved and recorded in the gifts register.</li><li>Agents and partners must agree in writing to this policy and to the Code of Practice.</li><li>Candidates will never be asked to pay anyone to secure an interview or a job.</li></ul>
<h2>3. Reporting</h2><p>Concerns should be reported to a director or the Ethical Recruitment and Compliance Lead. We protect anyone who raises a concern in good faith.</p>` },

  { slug: "recruitment-verification", path: "/policies/recruitment-verification/", title: "Recruitment Verification Policy", group: "policy", summary: "How we verify qualifications, registration, experience and references.", body: `
<h2>1. Purpose</h2><p>To make sure candidates are suitable for the roles we introduce them to, as required by the Conduct of Employment Agencies and Employment Businesses Regulations 2003, and to protect patients, employers and candidates.</p>
<h2>2. What we verify, and when</h2><table><thead><tr><th>Check</th><th>Stage</th></tr></thead><tbody><tr><td>Profession, experience and CV review</td><td>Candidate Assessment</td></tr><tr><td>Country of residence against the Code of Practice lists</td><td>Initial Registration</td></tr><tr><td>Qualifications and professional registration status</td><td>Documentation and Qualification Verification</td></tr><tr><td>Employment references (at least two, including the most recent employer)</td><td>Documentation and Qualification Verification</td></tr><tr><td>English language evidence, where applicable</td><td>Documentation and Qualification Verification</td></tr><tr><td>Identity and right-to-work documents, only when requested by the employer</td><td>Pre-employment</td></tr></tbody></table>
<h2>3. Standards</h2><ul><li>Documents are reviewed by an authorised consultant and the outcome recorded with the reviewer and date.</li><li>Registration status is checked on the regulator’s online register where available.</li><li>We never alter documents and never encourage a candidate to misrepresent their qualifications.</li><li>Suspected fraudulent documents are escalated to management and may be reported to the relevant authority.</li></ul>
<h2>4. Responsibilities of others</h2><p>Regulators decide registration, employers carry out pre-employment checks such as DBS, and the Home Office decides visa applications.</p>` },

  { slug: "data-protection", path: "/policies/data-protection/", title: "Data Protection and Privacy Policy", group: "policy", summary: "How employee and candidate information is collected, stored, shared, retained and securely disposed of.", body: `
<h2>Our data protection practices</h2>
<blockquote><p>MUKTalent Healthcare is committed to protecting the personal information of its employees, contractors, job applicants and healthcare candidates.</p>
<p>Personal information is collected only where necessary for legitimate recruitment, employment, administration and business purposes. This may include contact details, employment history, professional qualifications, references and other information relevant to recruitment or employment.</p>
<p>Information is stored using secure digital systems, with access restricted to authorised personnel according to their responsibilities. Appropriate technical and organisational measures are implemented to protect information against unauthorised access, loss, alteration or disclosure.</p>
<p>Personal information may be shared with relevant prospective employers, authorised recruitment partners, professional verification providers and service providers where necessary for legitimate purposes and subject to appropriate safeguards.</p>
<p>Information is retained only for as long as necessary, taking account of applicable legal, regulatory and contractual requirements. Retention periods are reviewed periodically.</p>
<p>When information is no longer required, electronic records are securely deleted or anonymised, and physical documents are securely destroyed in accordance with the organisation’s retention and disposal procedures.</p>
<p>Individuals may exercise their applicable data protection rights, including requesting access to or correction of their personal information and, where applicable, requesting erasure or restriction of processing.</p>
<p>MUKTalent Healthcare aims to comply with applicable UK data protection legislation, including the UK GDPR and Data Protection Act 2018. Where personal information is transferred internationally, the organisation assesses the applicable legal requirements and implements appropriate safeguards where required.</p></blockquote>
<h2>Technical and organisational measures</h2><ul><li>Secure HTTPS hosting for the website and all systems.</li><li>Individual user accounts for every team member; no shared logins.</li><li>Role-based access permissions: administrators, consultants (who see only their assigned candidates) and candidates (who see only their own record).</li><li>Multi-factor authentication for all administrative and consultant access to Healthcare records.</li><li>Secure document uploads to private, encrypted storage, opened only through short-lived signed links.</li><li>Encrypted backups managed by our database provider.</li><li>Access and activity logs recording changes, the responsible user and the date.</li><li>Secure deletion procedures, including deletion of stored files and anonymisation of records.</li><li>Appropriate safeguards for international data transfers.</li></ul>
<h2>Related documents</h2><ul><li><a href="${BASE}/candidate-privacy/">Candidate Privacy Notice</a></li><li><a href="${BASE}/employee-privacy/">Employee Privacy Notice</a></li><li><a href="${BASE}/privacy/">Website Privacy Policy</a></li><li><a href="${BASE}/cookies/">Cookie Policy</a></li><li><a href="${BASE}/policies/data-retention/">Data Retention and Deletion Policy</a></li><li><a href="${BASE}/policies/data-subject-rights/">Data Subject Rights Procedure</a></li><li><a href="${BASE}/policies/data-breach-response/">Data Breach Response Procedure</a></li></ul>` },

  { slug: "data-retention", path: "/policies/data-retention/", title: "Data Retention and Deletion Policy", group: "data", summary: "How long we keep information and how it is securely disposed of.", body: `
<h2>1. Retention schedule</h2><table><thead><tr><th>Record</th><th>Retention</th></tr></thead><tbody>
<tr><td>Candidates not placed</td><td>12 months after the last meaningful contact, unless the candidate asks us to keep their profile</td></tr>
<tr><td>Candidates placed with an employer</td><td>At least 1 year after our last supply of services (Conduct Regulations 2003); up to 6 years after the placement ends for legal claims</td></tr>
<tr><td>Candidate documents (identity, qualifications, references)</td><td>Deleted when no longer needed for the purpose requested, and at the latest with the candidate record</td></tr>
<tr><td>Employer and general enquiries</td><td>24 months after the last contact</td></tr>
<tr><td>Complaints register</td><td>6 years after closure</td></tr>
<tr><td>Audit and access logs</td><td>6 years</td></tr>
<tr><td>Marketing consent records</td><td>Until consent is withdrawn, plus 2 years as evidence</td></tr>
<tr><td>Employee records</td><td>See the Employee Privacy Notice</td></tr></tbody></table>
<h2>2. Review</h2><p>Our recruitment system flags records that have reached the end of their retention period. An administrator reviews the list each month and deletes or anonymises records that are no longer required.</p>
<h2>3. Secure disposal</h2><ul><li>Electronic files are permanently deleted from storage.</li><li>Database records are deleted or irreversibly anonymised, keeping only the reference number and non-identifying statistics.</li><li>Physical documents are shredded by cross-cut shredder or a certified confidential waste service.</li><li>Each deletion is recorded in the audit log.</li></ul>
<h2>4. Ownership</h2><p>The person responsible for data protection reviews this schedule at least once a year.</p>` },

  { slug: "data-subject-rights", path: "/policies/data-subject-rights/", title: "Data Subject Rights Procedure", group: "data", summary: "How we handle requests to access, correct, erase or restrict personal information.", body: `
<h2>1. Receiving a request</h2><p>Requests can be made in any form: by email to ${COMPANY.email}, by phone, in writing or through the candidate portal (<b>Help &amp; Support → My data</b>). Any member of staff who receives a request passes it immediately to the person responsible for data protection.</p>
<h2>2. Verifying identity</h2><p>We confirm the requester’s identity using information we already hold. Portal requests from a verified account need no further checks.</p>
<h2>3. Timescales</h2><p>We respond without undue delay and within one month. Complex or numerous requests can be extended by up to two further months; we will tell the requester within the first month.</p>
<h2>4. Handling each right</h2><ul><li><b>Access:</b> a copy of the personal information, with the purposes, recipients, retention and source.</li><li><b>Rectification:</b> corrections made and confirmed. Candidates can also update most details in the portal.</li><li><b>Erasure:</b> files deleted and the record anonymised, unless we must keep certain records by law.</li><li><b>Restriction and objection:</b> processing paused or stopped and the record flagged.</li><li><b>Portability:</b> a machine-readable export.</li></ul>
<h2>5. Records</h2><p>Every request, decision and response date is recorded in the audit log.</p>` },

  { slug: "data-breach-response", path: "/policies/data-breach-response/", title: "Data Breach Response Procedure", group: "data", summary: "How we contain, assess, report and learn from personal data breaches.", body: `
<h2>1. Report immediately</h2><p>Any member of staff who suspects a personal data breach (for example a lost device, an email sent to the wrong person or unauthorised access) reports it immediately to the person responsible for data protection and a director.</p>
<h2>2. Contain</h2><p>Revoke access, reset credentials, recall or delete misdirected information and preserve evidence, including audit logs.</p>
<h2>3. Assess</h2><p>Establish what data, how many people and the likely risk to their rights and freedoms.</p>
<h2>4. Notify</h2><ul><li>Report to the Information Commissioner’s Office within 72 hours of becoming aware, unless the breach is unlikely to result in a risk to individuals.</li><li>Tell affected individuals without undue delay when the risk is high, explaining what happened and what they can do.</li><li>Inform affected employers or partners where their data is involved.</li></ul>
<h2>5. Record and learn</h2><p>Every breach, including those not reported to the ICO, is recorded in the breach log with facts, effects and remedial action. Management reviews each incident and updates controls and training.</p>` }
];

const notice = `<div class="hc-lang-note" data-lang-note hidden>${`<div class="hc-note teal">${icon("info")}<div>This document is published in English. If you need help understanding it, please contact us and we will explain it in your language.</div></div>`}</div>`;

export function docPage(d) {
  const isPolicy = d.path.startsWith("/policies/");
  const trail = isPolicy ? [["Home", "/"], ["Policies", "/policies/"], [d.title]] : [["Home", "/"], [d.title]];
  const heads = [...d.body.matchAll(/<h2>(.*?)<\/h2>/g)].map((m, i) => [m[1], "s" + (i + 1)]);
  let i = 0;
  const body = d.body.replace(/<h2>/g, () => `<h2 id="s${++i}">`);
  const html = `
<section class="hc-phero-plain"><div class="hc-wrap">${crumbs(trail)}${kicker(isPolicy ? "Policy" : "Legal", d.group === "data" ? "Data protection" : d.group === "policy" ? "Responsible recruitment" : "Information")}<h1>${d.title}</h1><p class="hc-lead">${d.summary}</p></div></section>
<section class="hc-sec hc-pt-s"><div class="hc-wrap hc-legal">
<nav class="hc-toc" aria-label="On this page" data-no-i18n>${heads.map(([t, id]) => `<a href="#${id}">${t.replace(/<[^>]+>/g, "")}</a>`).join("")}</nav>
<article>${notice}<div class="hc-legal-meta"><span>Version <b translate="no">1.0</b></span><span>Last updated <b translate="no">${UPDATED}</b></span><span>Owner <b>MUKTalent Healthcare management</b></span></div>
<div class="hc-prose" data-no-i18n lang="en">${body}</div>
<p style="margin-top:40px"><a class="hc-link" href="${BASE}/policies/">All policies and documents ${icon("arrow")}</a></p></article>
</div></section>`;
  return page({ path: d.path, active: isPolicy ? "ethics" : "", title: d.title, description: `${d.title} – MUKTalent Healthcare. ${d.summary}`, body: html });
}

export function policiesIndex() {
  const groups = [["policy", "Responsible recruitment policies"], ["data", "Data protection documents"], ["legal", "Website terms"]];
  const body = `
<section class="hc-phero-plain"><div class="hc-wrap">${crumbs([["Home", "/"], ["Ethical Recruitment", "/ethical-recruitment/"], ["Policies"]])}${kicker("Policies", "Published documents")}<h1>Policies and <em>documents</em>.</h1><p class="hc-lead">The policies that govern how we recruit, how we treat candidates and how we protect personal information.</p></div></section>
<section class="hc-sec hc-pt-s"><div class="hc-wrap">
${groups.map(([g, t]) => `<h2 style="font-size:28px;margin:30px 0 22px">${t}</h2><div class="hc-docs" style="margin-bottom:30px">${DOCS.filter(d => d.group === g).map(d => `<a class="hc-doc" href="${BASE}${d.path}">${icon("doc")}<div><b>${d.title}</b><span>${d.summary}</span></div></a>`).join("")}</div>`).join("")}
</div></section>`;
  return page({ path: "/policies/", active: "ethics", title: "Policies and documents", description: "Ethical recruitment, complaints, safeguarding, equality, anti-bribery, verification and data protection policies of MUKTalent Healthcare.", body });
}
