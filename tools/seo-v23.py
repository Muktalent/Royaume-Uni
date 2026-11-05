#!/usr/bin/env python3
"""MUKTalent · v23 · SEO.
- Añade datos estructurados FAQPage a las páginas que ya muestran preguntas frecuentes
  (se generan a partir del texto visible de la propia página, como pide Google).
- Completa la organización (redes sociales, sede registrada, número de empresa).
Uso: python3 tools/seo-v23.py <raíz>   (idempotente)"""
import html, json, os, re, sys
ROOT = sys.argv[1] if len(sys.argv) > 1 else '.'
PAGES = ['index.html', 'parents/index.html', 'contact/index.html', 'services/university-applications/index.html',
         'services/student-visa-support/index.html', 'services/accommodation-support/index.html']
BASE = 'https://www.muktalent.com/'
text = lambda frag: html.unescape(re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', frag))).strip()

def faq_section(s):
    m = re.search(r'<section[^>]*class="[^"]*\b(?:mt-faq|ip-faq)\b[^"]*"[^>]*>(.*?)</section>', s, re.S)
    if m: return m.group(1)
    m = re.search(r'<div[^>]*class="[^"]*\bmt-questions\b[^"]*"[^>]*>(.*?)</div>\s*</div>', s, re.S)
    return m.group(1) if m else ''

for rel in PAGES:
    p = os.path.join(ROOT, rel); s = open(p, encoding='utf-8').read()
    s = re.sub(r'<script type="application/ld\+json" id="muk-faq-ld">.*?</script>', '', s, flags=re.S)
    qa = []
    for d in re.findall(r'<details[^>]*>(.*?)</details>', faq_section(s), re.S):
        m = re.match(r'\s*<summary[^>]*>(.*?)</summary>(.*)', d, re.S)
        if not m: continue
        q, a = text(m.group(1)), text(m.group(2))
        if q and a: qa.append({'@type': 'Question', 'name': q.rstrip(' +−'), 'acceptedAnswer': {'@type': 'Answer', 'text': a}})
    if not qa: print('· sin FAQ', rel); continue
    url = BASE + (rel[:-len('index.html')])
    ld = {'@context': 'https://schema.org', '@type': 'FAQPage', '@id': url + '#faq', 'url': url, 'inLanguage': 'fr', 'mainEntity': qa}
    tag = '<script type="application/ld+json" id="muk-faq-ld">' + json.dumps(ld, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/') + '</script>'
    s = s.replace('</head>', tag + '</head>', 1)
    open(p, 'w', encoding='utf-8').write(s); print('·', rel, len(qa), 'preguntas')

# Organización: redes, sede registrada e identificador de empresa
p = os.path.join(ROOT, 'index.html'); s = open(p, encoding='utf-8').read()
m = re.search(r'(<script type="application/ld\+json" id="muk-ld">)(.*?)(</script>)', s, re.S)
data = json.loads(m.group(2))
org = next(n for n in data['@graph'] if n.get('@id', '').endswith('#organization'))
org['sameAs'] = ['https://www.linkedin.com/company/maghreb-uk-talent/', 'https://www.instagram.com/maghrebuktalent/',
                 'https://find-and-update.company-information.service.gov.uk/company/16987132']
org['address'] = {'@type': 'PostalAddress', 'streetAddress': 'Flat 3b Flitton House, The Sutton Estate', 'addressLocality': 'London',
                  'postalCode': 'N1 1UG', 'addressCountry': 'GB'}
org['identifier'] = {'@type': 'PropertyValue', 'propertyID': 'Companies House', 'value': '16987132'}
s = s[:m.start(2)] + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + s[m.end(2):]
open(p, 'w', encoding='utf-8').write(s); print('· organización completada')

# Título de /parents/ más corto (Google corta hacia 60 caracteres)
p = os.path.join(ROOT, 'parents/index.html'); s = open(p, encoding='utf-8').read()
s = s.replace('Pour les parents — un projet d’études en toute confiance | MUKTalent', 'Parents : un projet d’études en confiance | MUKTalent')
open(p, 'w', encoding='utf-8').write(s)
