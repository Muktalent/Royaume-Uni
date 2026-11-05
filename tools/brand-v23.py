#!/usr/bin/env python3
"""MUKTalent · v23 · Unificación de marca.
Marca comercial única: «MUKTalent» (como el dominio y la división Healthcare).
Se mantienen a propósito:
  - «MAGHREB UK TALENT LTD»: nombre legal (Companies House, avisos legales, copyright).
  - «Maghreb UK Talent» cuando se pide buscarlo en el directorio de agentes del British Council
    (es el nombre con el que figura allí la organización).
  - En datos estructurados: name = MUKTalent, alternateName = [Maghreb UK Talent, MUK Talent],
    para que Google asocie los nombres antiguos a la marca.
Uso: python3 tools/brand-v23.py <raíz del proyecto>   (idempotente)"""
import os, re, sys
ROOT = sys.argv[1] if len(sys.argv) > 1 else '.'
EXT = {'.svg', '.html', '.js', '.mjs', '.css', '.webmanifest', '.json', '.py', '.txt', '.xml'}
SKIP_DIRS = {'node_modules', 'vendor', '.git', 'supabase'}
SKIP_FILES = {'brand-v23.py', 'package-lock.json', 'package.json', 'robots.txt'}
ALT = '["Maghreb UK Talent","MUK Talent"]'

def convert(s):
    keep = []
    def hold(t): keep.append(t); return f'\x00{len(keep)-1}\x00'
    # 1. Datos estructurados (JSON-LD de la organización y del sitio web)
    s = re.sub(r'"name":"(?:MUK Talent|Maghreb UK Talent|MUKTalent)","alternateName":(\[[^\]]*\]|"[^"]*")',
               lambda m: hold('"name":"MUKTalent","alternateName":' + ALT), s)
    # 2. Búsqueda en el directorio del British Council («Maghreb UK Talent» entre comillas): se conserva
    s = re.sub(r'[«“"]\s?Maghreb UK Talent\s?[»”"]', lambda m: hold(m.group(0)), s)
    # 3. Variantes → MUKTalent
    s = s.replace('MUK Talent Ltd', 'MAGHREB UK TALENT LTD')
    s = re.sub(r'MAGHREB UK TALENT(?! LTD)', 'MUKTALENT', s)
    for a, b in [('Maghreb UK Talent', 'MUKTalent'), ('MUK Talent', 'MUKTalent'), ('MUK TALENT', 'MUKTALENT'),
                 ('Muktalent', 'MUKTalent'), ('MUK-Talent-pipeline', 'MUKTalent-pipeline'), ("'muk-talent-pipeline.csv'", "'muktalent-pipeline.csv'")]:
        s = s.replace(a, b)
    return re.sub(r'\x00(\d+)\x00', lambda m: keep[int(m.group(1))], s)

changed = 0
for d, dirs, files in os.walk(ROOT):
    dirs[:] = [x for x in dirs if x not in SKIP_DIRS]
    for f in files:
        if os.path.splitext(f)[1] not in EXT or f in SKIP_FILES or f.startswith('CAMBIOS'): continue
        p = os.path.join(d, f)
        try: s = open(p, encoding='utf-8').read()
        except UnicodeDecodeError: continue
        n = convert(s)
        if n != s: open(p, 'w', encoding='utf-8').write(n); changed += 1; print('·', os.path.relpath(p, ROOT))
print(changed, 'files updated')
