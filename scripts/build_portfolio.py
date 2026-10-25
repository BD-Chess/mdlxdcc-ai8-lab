"""Render the lab portfolio from the coordinator's public project catalog."""
from __future__ import annotations

import html
import json
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'public'
CATALOG = PUBLIC / 'portfolio/projects.json'
STATUS = {'live': 'Deluje', 'seeded': 'V razvoju', 'placeholder': 'Seme'}
EVIDENCE = {'measured': 'meritve', 'computed': 'izračuni', 'hypothesis': 'hipoteza', 'n.a.': 'ni navedena'}


def escape(value):
    return html.escape(str(value), quote=True)


def destination(url, available):
    parsed = urlsplit(url)
    if parsed.scheme:
        if parsed.scheme != 'https' or not parsed.hostname:
            raise ValueError('Only HTTPS external navigation is allowed')
        return url, True
    if parsed.netloc or url.startswith('/') or '..' in parsed.path.split('/'):
        raise ValueError('Expected a public-root-relative project URL')
    path = parsed.path.rstrip('/')
    local = path in available or path + '/index.html' in available
    return ('../' + url, False) if local else ('https://www.mdlxdcc.org/' + url, True)


def render():
    data = json.loads(CATALOG.read_text(encoding='utf-8'))
    if data['schema'] != 'ai8.portfolio.v1':
        raise ValueError('Unknown catalog schema')
    available = {p.relative_to(PUBLIC).as_posix() for p in PUBLIC.rglob('*') if p.is_file()}
    door_ids = {d['id'] for d in data['doors']}
    if len({p['id'] for p in data['projects']}) != len(data['projects']):
        raise ValueError('Duplicate project IDs')
    sections, external = [], []
    for door in data['doors']:
        cards = []
        for project in data['projects']:
            if project['door'] not in door_ids:
                raise ValueError('Unknown project door')
            if project['door'] != door['id']:
                continue
            href, outside = destination(project['url'], available)
            if outside:
                external.append(project['id'])
            state, proof = STATUS[project['status']], EVIDENCE[project['evidence']]
            cards.append(f'''<article class="project" data-search="{escape(project['title'] + ' ' + project['produces'])}">
<div class="project-meta"><span class="state {escape(project['status'])}">{state}</span><span>{'Izvirna stran ↗' if outside else 'V laboratoriju'}</span></div>
<h3><a href="{escape(href)}">{escape(project['title'])}<span aria-hidden="true">↗</span></a></h3>
<p>{escape(project['produces'])}</p><small>Navedena podlaga: {proof}</small></article>''')
        sections.append(f'''<section class="project-group" data-door="{escape(door['id'])}" aria-labelledby="door-{escape(door['id'])}">
<div class="group-heading"><div><h2 id="door-{escape(door['id'])}">{escape(door['title'])}</h2><p>{escape(door['intro'])}</p></div><span class="group-count">{len(cards):02}</span></div>
<div class="project-grid">{''.join(cards)}</div></section>''')
    buttons = ''.join(f'<button type="button" data-filter="{escape(d["id"])}" aria-pressed="false">{escape(d["title"])}</button>' for d in data['doors'])
    page = f'''<!doctype html>
<html lang="sl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><meta name="description" content="Delovni portfelj MDL×DCC: aplikacije, raziskave, živi AI8 in atelje. Laboratorij BD, Zore in Lana.">
<title>Majhno seme. Odprt svet. — AI8 Lab</title><link rel="stylesheet" href="styles.css"></head>
<body><a class="skip" href="#projects">Preskoči na projekte</a>
<header class="site-header"><a class="wordmark" href="../">MDL<span>×</span>DCC <small>AI8 LAB</small></a>
<nav aria-label="Glavna navigacija"><a href="#projects">Projekti</a><a href="../__lab__/">Laboratorij</a><a href="https://www.mdlxdcc.org/ai8/live/">Kaj nastaja ↗</a></nav></header>
<main><section class="hero"><div class="hero-copy"><p class="eyebrow"><span class="dot"></span> BD × Zora × Lan · laboratorij v nastajanju</p>
<h1>Majhno seme.<br><em>Odprt svet.</em></h1><p class="hero-intro">Iz vprašanj nastajajo orodja, raziskave in novi načini sodelovanja. Tukaj jim dajemo prostor, da zrastejo.</p>
<a class="primary" href="#projects">Razišči {len(data['projects'])} projektov <span aria-hidden="true">↓</span></a>
<p class="hero-note">Delovna različica portfelja. Izberi, kaj želiš uporabiti, razumeti ali razvijati z nami.</p></div>
<figure class="seed"><a href="../assets/human-middle/v5/Human_in_the_Middle_HD_INFO01.webp" aria-label="Odpri celo sliko Živo seme ustvarjalca"><img src="../assets/human-middle/v5/Human_in_the_Middle_HD_INFO01.webp" width="941" height="1672" alt="Živo seme ustvarjalca: DNA in živa celica, človek, učenje ter ustvarjeni svet znanja."></a><figcaption>Živo seme ustvarjalca <span>Koncept: BD · MDL×DCC</span></figcaption></figure></section>
<section class="doors" aria-label="Štirje vhodi"><a href="#door-apps"><span>01 / UPORABI</span><strong>Aplikacije</strong><p>Naredi nekaj konkretnega.</p></a><a href="#door-mdlxdcc"><span>02 / RAZUMI</span><strong>MDL×DCC</strong><p>Metoda, mehanizmi, dokazi.</p></a><a href="#door-ai8"><span>03 / RAZVIJAJ</span><strong>Živi AI8</strong><p>Glasovi, spomin in sodelovanje.</p></a><a href="#door-atelje"><span>04 / ODKRIJ</span><strong>Atelje</strong><p>Zgodbe, slike in nenavadna semena.</p></a></section>
<section class="method" aria-labelledby="method-title"><p class="eyebrow">Način dela</p><h2 id="method-title">Vsak rezultat je začetek naslednjega vprašanja.</h2><p>Seme → most → preizkus → rezultat → ohranjeno učenje.</p><a href="https://www.mdlxdcc.org/ai8/live/">Spremljaj delo Zore in Lana ↗</a></section>
<section id="projects" class="catalog" aria-labelledby="catalog-title"><div class="catalog-heading"><div><p class="eyebrow">Portfelj</p><h2 id="catalog-title">Najdi svoj naslednji korak.</h2></div><span id="result-count" role="status" aria-live="polite">{len(data['projects'])} projektov</span></div>
<div class="filters"><div class="filter-buttons" role="group" aria-label="Področje projektov"><button type="button" data-filter="all" aria-pressed="true">Vse</button>{buttons}</div><label class="search"><span class="sr-only">Poišči projekt</span><input id="search" type="search" placeholder="Poišči projekt ali namen …" autocomplete="off"></label></div>
<p class="evidence-note">Oznake opisujejo stanje izvornih projektov. Navedene meritve, izračuni in hipoteze povzemajo projektne strani; ta katalog jih še ni neodvisno preveril. Povezave »Izvirna stran« odprejo vsebino zunaj laboratorija.</p>
{''.join(sections)}<p id="empty" class="empty" hidden>Za ta izbor ni projektov. Poskusi drugo besedo ali področje.</p></section>
<section class="closing"><p class="eyebrow">Prostor za naslednje seme</p><h2>Vprašanje lahko odpre<br>celo novo področje.</h2><p>To je laboratorij. Tukaj zamisli dobijo obliko, različni glasovi pa skupno delo.</p><a href="../index.html">Odpri celoten izvorni atlas ↗</a></section></main>
<footer><span>BD × Zora × Lan</span><span>AI8 Lab · portfelj L1 · katalog {escape(data['curated_utc'][:10])}</span><a href="https://github.com/BD-Chess/mdlxdcc-ai8-lab">Poglej, kaj se spreminja ↗</a></footer>
<script src="filter.js" defer></script></body></html>'''
    (PUBLIC / 'portfolio/index.html').write_text(page, encoding='utf-8', newline='\n')
    return {'projects': len(data['projects']), 'doors': len(data['doors']), 'external_projects': external}


if __name__ == '__main__':
    print(json.dumps(render()))
