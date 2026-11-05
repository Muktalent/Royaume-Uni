# Genera supabase/personal-seed.sql y las portadas SVG de certificados (assets/book/seed/certs).
import json, os, html
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEED='/assets/book/seed'
profile=dict(kind='profile',slug='profile',title='Your Name',
 subtitle='Cybersecurity engineer focused on LLM and AI application security, AI red teaming and explainable risk assessment',
 category='Open to MSc and AI security roles · 2027',issuer='London, United Kingdom',
 website_url='https://www.linkedin.com/in/your-profile',repository_url='https://github.com/your-username',verification_url='',
 body="""I am a final-year BSc (Hons) Cybersecurity and Networks student at the University of East London and the founder of MUKTalent. My work sits where security engineering meets machine learning: I break LLM applications to learn how to defend them, I design guardrails for RAG and agentic systems, and I build risk models that explain their decisions in plain language.

My final-year project, AegisGate, is an AI-driven network detection and response platform that learns normal network behaviour, correlates evidence across events and turns anomalies into explainable, actionable alerts. Alongside it I maintain a set of open-source labs for prompt-injection testing, retrieval poisoning and agent tool-call control, mapped to the OWASP Top 10 for LLM Applications and MITRE ATLAS.

I am preparing for a master's degree in cybersecurity and artificial intelligence and for a career in AI security engineering and adversarial testing.""",
 tags='LLM security, Prompt injection, AI red teaming, RAG security, Agentic AI, MITRE ATLAS, OWASP LLM Top 10, Threat modelling, Python, PyTorch, scikit-learn, SHAP, Network security, Wireshark, Nmap, Burp Suite, Kali Linux, Docker, Supabase, Node.js, SQL',sort_order=0)
exp=[
 dict(slug='exp-muk-talent',title='Founder & Director',issuer='MUKTalent (MUKTalent Ltd)',category='London · Company no. 16987132',issued_on='2025-11-01',
  body='Founded a UK student-recruitment and talent company and built its full digital platform myself: public website, student portal, team workspace, media studio and digital business cards. Designed the authentication, row-level security policies and audit trail on Supabase, and run the security reviews before every release.',
  tags='Leadership, Secure architecture, Supabase RLS, Node.js, Vercel',sort_order=1),
 dict(slug='exp-cisco-ethical-hacker',title='Ethical Hacker · Work-Based Learning placement',issuer='Cisco Networking Academy · Skills for All',category='Remote · 4 weeks',issued_on='2026-02-08',expires_on='2026-03-08',
  body='Completed a structured offensive-security placement: reconnaissance, vulnerability scanning, web and network exploitation, social-engineering simulations and professional penetration-test reporting in guided lab environments.',
  tags='Penetration testing, Nmap, Metasploit, OWASP Top 10, Reporting',sort_order=2),
 dict(slug='exp-ai-security-research',title='Independent AI Security Researcher',issuer='Open-source labs',category='Self-directed',issued_on='2025-09-01',
  body='Build and publish small, reproducible labs on LLM attack and defence: automated jailbreak and prompt-injection test suites, retrieval-poisoning experiments on RAG pipelines and policy enforcement for AI agents. Results are documented as short write-ups with mitigations.',
  tags='Red teaming, garak, PyRIT, LangChain, Evaluation',sort_order=3),
]
edu=[
 dict(slug='edu-uel-bsc',title='BSc (Hons) Cybersecurity and Networks',issuer='University of East London',category='Expected First Class Honours',issued_on='2023-09-01',expires_on='2026-07-01',
  body='Network security, ethical hacking, digital forensics, secure software development, cloud security and machine learning for security. Final-year project: AegisGate, an explainable AI network detection and response platform.',
  tags='Network security, Forensics, Secure development, Machine learning',sort_order=1),
 dict(slug='edu-msc-ai-security',title='MSc Cybersecurity & Artificial Intelligence (applying)',issuer='Target: KAUST · MBZUAI · HBKU · Erasmus Mundus · GKS',category='Scholarship applications',issued_on='2027-09-01',
  body='Planned research focus: adversarial robustness of LLM applications, security of retrieval-augmented and agentic systems, and explainable risk assessment for security operations.',
  tags='Research, Adversarial ML, AI safety',sort_order=2),
]
proj=[
 dict(slug='aegisgate',title='AegisGate',subtitle='AI-driven network detection and response with explainable alerts',category='AI Security',issuer='Final-year project · Lead developer',issued_on='2026-05-01',cover='aegisgate',
  body="""AegisGate learns the normal behaviour of a network and flags what does not fit. It ingests flow and packet telemetry, scores anomalies with an ensemble of unsupervised models and correlates evidence across hosts and time windows before it raises an alert.

Every alert comes with an explanation: the features that drove the score, the related events and a recommended response, so an analyst can trust or reject it in seconds. Responses such as blocking an IP address run through a policy engine with human approval.

The system was validated on synthetic and public datasets and is designed to connect to real networks through switch port mirroring (SPAN).""",
  tags='Python, Isolation Forest, Autoencoders, SHAP, Zeek, Suricata, FastAPI, React',repository_url='https://github.com/your-username/aegisgate',sort_order=1),
 dict(slug='promptbreaker',title='PromptBreaker',subtitle='Automated red-teaming harness for LLM applications',category='AI Red Teaming',issuer='Open-source · Author',issued_on='2026-08-01',cover='promptbreaker',
  body="""PromptBreaker runs repeatable adversarial test campaigns against chat assistants and LLM-powered APIs. It ships attack packs for direct and indirect prompt injection, jailbreaks, system-prompt leakage, sensitive data disclosure and insecure output handling.

Each run produces a scored report mapped to the OWASP Top 10 for LLM Applications and MITRE ATLAS techniques, and a regression baseline so teams can see whether a new model or prompt made things better or worse.""",
  tags='Python, OWASP LLM Top 10, MITRE ATLAS, garak, PyRIT, CI pipelines',repository_url='https://github.com/your-username/promptbreaker',sort_order=2),
 dict(slug='rag-shield',title='RAG Shield',subtitle='Defence-in-depth for retrieval-augmented generation',category='RAG & Agents',issuer='Research lab · Author',issued_on='2026-07-01',cover='ragshield',
  body="""RAG Shield is a reference pipeline that shows how to keep a retrieval-augmented assistant safe. Documents are tagged with access labels at ingestion, so retrieval respects the permissions of the person asking.

Retrieved chunks are screened for embedded instructions and poisoning before they reach the model, and every answer carries its sources so it can be audited. A test suite measures leakage and injection success before and after each control.""",
  tags='LangChain, pgvector, Access control, Prompt injection detection, Provenance',repository_url='https://github.com/your-username/rag-shield',sort_order=3),
 dict(slug='agentgate',title='AgentGate',subtitle='Policy firewall for AI agent tool calls',category='RAG & Agents',issuer='Prototype · Author',issued_on='2026-09-01',cover='agentgate',
  body="""AgentGate sits between an AI agent and the tools it can use. Every tool call is checked against declarative policies: which tools, which arguments, how much data and how often. Risky actions pause for human approval.

The result is a full audit trail of what the agent tried to do and why it was allowed or blocked, plus detection of tool-poisoning and confused-deputy patterns described in the OWASP Top 10 for Agentic Applications.""",
  tags='Agentic AI, MCP, Policy as code, Human in the loop, Audit logging',repository_url='https://github.com/your-username/agentgate',sort_order=4),
 dict(slug='clearrisk',title='ClearRisk',subtitle='Explainable cyber risk assessment for small organisations',category='Risk Engineering',issuer='Coursework · Lead',issued_on='2025-12-01',cover='clearrisk',
  body="""ClearRisk turns asset inventories, vulnerability scans and configuration checks into a single risk score per asset and per business process. A gradient-boosted model estimates likelihood and SHAP values explain which factors drive each score.

The dashboard writes the explanation in plain language and ranks remediation steps by risk reduction per hour of work, so non-specialists can decide what to fix first.""",
  tags='XGBoost, SHAP, CVSS, NIST CSF, Streamlit',repository_url='https://github.com/your-username/clearrisk',sort_order=5),
 dict(slug='ethical-hacker-lab',title='Penetration Test Report',subtitle='Full-scope assessment of a simulated SME network',category='Security Engineering',issuer='Cisco Skills for All placement',issued_on='2026-03-01',cover='ethicalhacker',
  body="""End-to-end penetration test of a simulated small-business environment: scoping, reconnaissance, vulnerability discovery, exploitation of web and network services and privilege escalation.

Delivered as a professional report with an executive summary, CVSS-rated findings, evidence and prioritised remediation.""",
  tags='Nmap, Burp Suite, Metasploit, Hydra, CVSS, Reporting',sort_order=6),
 dict(slug='muk-talent-platform',title='MUKTalent Platform',subtitle='Secure student-recruitment platform built end to end',category='Secure Web',issuer='Founder · Full-stack developer',issued_on='2026-10-01',cover='muktalent',
  body="""Designed and built the complete MUKTalent platform: multilingual public website, student portal, team workspace with media studio and chat, and digital business cards with Apple and Google Wallet passes.

Security by design: Supabase row-level security on every table, signed storage URLs, strict content-security policy, rate limiting and an automated test suite run before each deployment.""",
  tags='Node.js, Supabase, PostgreSQL RLS, Vercel, CSP, i18n',website_url='https://www.muktalent.com',sort_order=7),
]
# Certificates: (slug, title, issuer, category, issued_on(target if future), expires, colour, code, body, tags, url)
C=[
 ('cisco-ethical-hacker','Ethical Hacker','Cisco Networking Academy','Security Engineering','2026-03-06',None,'#049fd9','CISCO','Offensive security fundamentals: reconnaissance, vulnerability analysis, exploitation of networks, web applications, IoT and cloud, and penetration-test reporting.','Penetration testing, Social engineering, Reporting','https://www.netacad.com/courses/ethical-hacker'),
 ('isc2-certified-in-cybersecurity','Certified in Cybersecurity (CC)','ISC2','Security Engineering','2025-06-15','2028-06-15','#00a3a1','ISC2','Entry-level ISC2 certification covering security principles, incident response, business continuity, access control, network security and security operations.','Security principles, Access control, Incident response','https://www.isc2.org/certifications/cc'),
 ('google-cybersecurity','Google Cybersecurity Professional Certificate','Google · Coursera','Security Engineering','2025-03-20',None,'#4285f4','GOOGLE','Eight-course programme: security frameworks, SIEM tools, network security, Linux and SQL, Python automation, threat detection and incident response.','SIEM, Python, Linux, SQL','https://www.coursera.org/professional-certificates/google-cybersecurity'),
 ('comptia-security-plus','CompTIA Security+ (SY0-701)','CompTIA','Security Engineering','2026-12-15','2029-12-15','#c8102e','COMPTIA','Core vendor-neutral security certification: threats and vulnerabilities, security architecture, operations, and governance, risk and compliance.','Security architecture, Operations, GRC','https://www.comptia.org/en-gb/certifications/security/'),
 ('secops-c-ai-mlpen','Certified AI/ML Pentester (C-AI/MLPen)','The SecOps Group','AI Red Teaming','2026-12-20',None,'#e4572e','SECOPS','Four-hour practical exam on LLM application pentesting: jailbreaks, direct and indirect prompt injection, tool and file abuse, information leakage and agent behaviour.','Prompt injection, Jailbreaks, LLM pentesting','https://pentestingexams.com/certifications/professional/certified-ai-ml-pentester/'),
 ('caisp','Certified AI Security Professional (CAISP)','Practical DevSecOps','LLM & AI App Security','2027-01-31',None,'#6c3fc5','PDSO','Hands-on AI security: OWASP LLM Top 10, AI supply-chain security, MITRE ATLAS, STRIDE threat modelling of AI systems and governance under NIST AI RMF, ISO 42001 and the EU AI Act.','OWASP LLM Top 10, MITRE ATLAS, Threat modelling','https://www.practical-devsecops.com/certified-ai-security-professional/'),
 ('comptia-secai-plus','CompTIA SecAI+ (CY0-001)','CompTIA','LLM & AI App Security','2027-02-28','2030-02-28','#c8102e','COMPTIA','Securing AI systems across their lifecycle, AI-assisted security operations, and AI governance, risk and compliance. Launched February 2026.','AI security controls, Guardrails, AI GRC','https://www.comptia.org/en-gb/certifications/secai/'),
 ('htb-ai-red-teamer-path','AI Red Teamer Job-Role Path','Hack The Box · Google','AI Red Teaming','2027-03-31',None,'#4f7d00','HTB','Twelve modules built with Google and aligned to SAIF: prompt injection, model privacy attacks, adversarial AI, supply-chain and deployment threats.','SAIF, Adversarial ML, Prompt injection','https://academy.hackthebox.com/path/preview/ai-red-teamer'),
 ('htb-coae','HTB Certified Offensive AI Expert (COAE)','Hack The Box','AI Red Teaming','2027-05-31',None,'#4f7d00','HTB','Seven-day practical AI offensive assessment with a commercial-grade report: adversarial ML, data poisoning, LLM output exploitation, MCP vulnerabilities and AI privacy attacks.','AI red teaming, MCP security, Reporting','https://academy.hackthebox.com/preview/certifications/htb-certified-offensive-ai-expert'),
 ('caase','Certified Agentic AI Security Expert (CAASE)','Practical DevSecOps','RAG & Agentic Security','2027-06-30',None,'#6c3fc5','PDSO','Attacking and defending AI agents end to end: tool abuse, memory poisoning, multi-agent trust and guardrails. Six-hour practical exam.','Agentic AI, Tool security, Guardrails','https://www.practical-devsecops.com/'),
 ('giac-gaips','GIAC AI Platform Security (GAIPS)','GIAC · SANS SEC545','RAG & Agentic Security','2027-09-30','2031-09-30','#1b365d','GIAC','Auditing and securing generative AI applications and LLM development pipelines, including retrieval-augmented generation, vector stores and model deployment.','GenAI security, RAG, LLM pipelines','https://www.giac.org/certifications'),
 ('offsec-oscp','OffSec Certified Professional (OSCP+)','OffSec · PEN-200','Security Engineering','2027-08-31','2030-08-31','#d6112c','OFFSEC','Industry-standard hands-on penetration testing certification: 24-hour practical exam across Active Directory and standalone targets.','Exploitation, Active Directory, Privilege escalation','https://www.offsec.com/courses/pen-200/'),
 ('giac-gmle','GIAC Machine Learning Engineer (GMLE)','GIAC · SANS SEC595','Explainable Risk','2027-11-30','2031-11-30','#1b365d','GIAC','Applied data science and machine learning for security: feature engineering on security data, anomaly detection, model evaluation and explainability.','Machine learning, Anomaly detection, Explainability','https://www.giac.org/certifications'),
 ('iapp-aigp','Artificial Intelligence Governance Professional (AIGP)','IAPP','Explainable Risk','2027-12-15','2029-12-15','#2a6ebb','IAPP','Governing AI across its lifecycle: risk assessment, transparency and explainability, EU AI Act, NIST AI RMF and ISO/IEC 42001.','AI governance, EU AI Act, NIST AI RMF','https://iapp.org/certify/aigp/'),
 ('iso-42001-lead-implementer','ISO/IEC 42001 Lead Implementer','PECB','Explainable Risk','2028-02-28','2031-02-28','#003c71','PECB','Implementing and managing an AI management system (AIMS) under ISO/IEC 42001, including AI risk and impact assessment.','AIMS, Risk assessment, Compliance','https://pecb.com/en/education-and-certification-for-individuals/iso-iec-42001'),
 ('isc2-cissp','CISSP','ISC2','Security Engineering','2030-06-30',None,'#00a3a1','ISC2','Long-term goal once five years of experience are met: security and risk management, architecture, network security, identity, assessment, operations and software security.','Security leadership, Risk management','https://www.isc2.org/certifications/cissp'),
 ('isaca-aaism','Advanced in AI Security Management (AAISM)','ISACA','Explainable Risk','2030-12-31',None,'#00539b','ISACA','AI-centric security management for CISSP and CISM holders: AI governance and programme management, AI risk management, and AI technologies and controls.','AI risk management, AI governance','https://www.isaca.org/credentialing/aaism'),
]
os.makedirs(f'{ROOT}/assets/book/seed/certs',exist_ok=True)
def e(s): return html.escape(s,quote=True)
def wrap(s,n):
    w=s.split();lines=[];cur=''
    for x in w:
        if len(cur)+len(x)+1>n and cur: lines.append(cur);cur=x
        else: cur=(cur+' '+x).strip()
    lines.append(cur);return lines
import datetime
today=datetime.date(2026,11,2)
certs=[]
for i,(slug,title,issuer,cat,iss,exp_,col,code,body,tags,url) in enumerate(C):
    planned=datetime.date.fromisoformat(iss)>today
    lines=wrap(title,30)[:3]
    ty=470-(len(lines)-1)*34
    tl=''.join(f'<text x="707" y="{ty+k*68}" text-anchor="middle" font-family="Georgia,\'Times New Roman\',serif" font-size="54" fill="#152e36">{e(l)}</text>' for k,l in enumerate(lines))
    d=datetime.date.fromisoformat(iss).strftime('%B %Y')
    foot=('TARGET · '+d.upper()) if planned else ('ISSUED · '+d.upper())
    lc='#2b5b6e' if planned else '#2f7a45'
    svg=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1414 1000" width="1414" height="1000">
<defs><linearGradient id="p" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffdf8"/><stop offset="1" stop-color="#f3ede0"/></linearGradient>
<pattern id="g" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M0 11h22M11 0v22" stroke="#152e36" stroke-opacity=".035"/></pattern></defs>
<rect width="1414" height="1000" fill="url(#p)"/><rect width="1414" height="1000" fill="url(#g)"/>
<rect x="34" y="34" width="1346" height="932" fill="none" stroke="#c9a45c" stroke-width="3"/>
<rect x="50" y="50" width="1314" height="900" fill="none" stroke="#c9a45c" stroke-opacity=".5" stroke-width="1.2"/>
<rect x="50" y="50" width="1314" height="14" fill="{col}"/>
<text x="707" y="168" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="26" letter-spacing="9" font-weight="700" fill="{col}">{e(code)}</text>
<text x="707" y="222" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="22" letter-spacing="6" fill="#6b7c80">{e(issuer.upper())}</text>
<text x="707" y="330" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="30" fill="#8a6d3b">{'Certification roadmap' if planned else 'Certificate of achievement'}</text>
<line x1="557" y1="362" x2="857" y2="362" stroke="#c9a45c" stroke-width="2"/>
{tl}
<text x="707" y="{ty+len(lines)*68+40}" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="22" letter-spacing="5" fill="#6b7c80">{e(cat.upper())}</text>
<g transform="translate(707 790)"><circle r="74" fill="{col}" fill-opacity=".12"/><circle r="58" fill="none" stroke="{col}" stroke-width="3" {'stroke-dasharray="8 7"' if planned else ''}/>
<text y="10" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="{26 if len(code)<=5 else 20}" font-weight="700" fill="{col}">{e(code)}</text></g>
<text x="707" y="912" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="20" letter-spacing="5" font-weight="700" fill="{lc}">{e(foot)}</text>
</svg>'''
    open(f'{ROOT}/assets/book/seed/certs/{slug}.svg','w').write(svg)
    certs.append(dict(kind='certificate',slug=slug,title=title,issuer=issuer,category=cat,issued_on=iss,expires_on=exp_,body=body,tags=tags,verification_url='' if planned else url,website_url=url,cover_path=f'{SEED}/certs/{slug}.svg',subtitle='',sort_order=i+1))
links=[dict(kind='link',slug='link-email',title='Email',subtitle='agents@muktalent.com',sort_order=1),
 dict(kind='link',slug='link-linkedin',title='LinkedIn',website_url='https://www.linkedin.com/in/your-profile',sort_order=2),
 dict(kind='link',slug='link-github',title='GitHub',website_url='https://github.com/your-username',sort_order=3),
 dict(kind='link',slug='link-htb',title='Hack The Box',website_url='https://app.hackthebox.com/profile/your-id',sort_order=4),
 dict(kind='link',slug='link-muktalent',title='MUKTalent',website_url='https://www.muktalent.com',sort_order=5)]
rows=[profile]+[dict(kind='experience',**x) for x in exp]+[dict(kind='education',**x) for x in edu]
for p in proj:
    p=dict(p);c=p.pop('cover');p['cover_path']=f'{SEED}/projects/{c}.webp';rows.append(dict(kind='project',**p))
rows+=certs+links
cols=['kind','slug','title','subtitle','category','body','tags','issuer','issued_on','expires_on','website_url','repository_url','verification_url','cover_path','sort_order']
def q(v):
    if v is None: return 'null'
    if isinstance(v,int): return str(v)
    return "'"+str(v).replace("'","''")+"'"
out=['-- MUKTalent · contenido inicial del portfolio y certificados (datos de ejemplo, editables en /personal-admin/).',
 '-- Ejecutar UNA vez en Supabase > SQL Editor. No sobrescribe nada: si un identificador (slug) ya existe, lo deja como está.',
 '-- Requiere haber ejecutado antes supabase/personal.sql y supabase/personal-book.sql.','begin;']
for r in rows:
    vals=[q(r.get(c, None if c in ('issued_on','expires_on') else ('' if c!='sort_order' else 0))) for c in cols]
    out.append(f"insert into public.mt_personal_items ({','.join(cols)},published) values ({','.join(vals)},true) on conflict (slug) do nothing;")
out+=['commit;','-- Comprobación','select kind, count(*) from public.mt_personal_items group by kind order by kind;']
open(f'{ROOT}/supabase/personal-seed.sql','w').write('\n'.join(out)+'\n')
json.dump(rows,open('/tmp/seed-rows.json','w'))
print(len(rows),'rows')
