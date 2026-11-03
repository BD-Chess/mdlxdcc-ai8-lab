"""Build a size-bounded GitHub Pages preview without changing source pages."""
from __future__ import annotations

import argparse
import html
import json
from pathlib import Path
import posixpath
import re
import shutil
import subprocess
from urllib.parse import quote, unquote, urlsplit, urlunsplit

ROOT = Path(__file__).resolve().parents[1]
PASSIVE = {'.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif', '.mp3', '.ogg', '.wav',
           '.flac', '.mp4', '.webm', '.pdf', '.zip', '.gz', '.7z', '.tar', '.docx', '.pptx', '.xlsx',
           '.ttf', '.otf', '.woff', '.woff2'}  # fonts: raw serves them with access-control-allow-origin: *
TEXT = {'.html', '.htm', '.css', '.js', '.mjs', '.json', '.webmanifest', '.svg'}
PRODUCTION = {'mdlxdcc.org', 'www.mdlxdcc.org', 'chessbest.org', 'www.chessbest.org'}
ATTR = re.compile(r'''(?P<p>\b(?:href|src|poster|action|data-src|data-href)\s*=\s*)(?P<q>["'])(?P<u>[^"']*)(?P=q)''', re.I)
CSS_URL = re.compile(r'''url\(\s*(?P<q>["']?)(?P<u>[^\s)'";]+)(?P=q)\s*\)''', re.I)
# In HTML, CSS url() is rewritten only inside <style> blocks and style="" attributes, never in scripts
# (a case-insensitive url( match there broke URL.createObjectURL(...) and new URL(...)).
STYLE_BLOCK = re.compile(r'(?P<open><style\b[^>]*>)(?P<body>.*?)(?P<close></style\s*>)', re.I | re.S)
SRCSET = re.compile(r'''(?P<p>\bsrcset\s*=\s*)(?P<q>["'])(?P<v>[^"']*)(?P=q)''', re.I)
STYLE_ATTR = re.compile(r'''(?P<p>\bstyle\s*=\s*)(?P<q>["'])(?P<v>.*?)(?P=q)''', re.I | re.S)
SCRIPT_BLOCK = re.compile(r'(<script\b[^>]*>.*?</script\s*>)', re.I | re.S)
ROOT_LITERAL = re.compile(r'''(?P<q>["'`])(?P<u>/(?!/)[^"'`\s\\<>]+)(?P=q)''')


class Builder:
    def __init__(self, public: Path, base: str, commit: str):
        self.public, self.base, self.commit = public, '/' + base.strip('/') + '/', commit
        self.files = sorted(path for path in public.rglob('*') if path.is_file())
        self.roots = {path.parts[0] for path in (file.relative_to(public) for file in self.files)}
        self.media = {file.relative_to(public).as_posix() for file in self.files
                      if file.stat().st_size > 128 * 1024 and
                      (file.suffix.lower() in PASSIVE or '.tar.gz.part' in file.name)}
        self.raw = f'https://raw.githubusercontent.com/BD-Chess/mdlxdcc-ai8-lab/{commit}/public/'

    def url(self, value: str, relative: str, root_only=False) -> str:
        if not value or value.startswith(('#', '//', 'data:', 'blob:', 'mailto:', 'javascript:')):
            return value
        if re.search(r'[\[\]\\^|]', value):  # regex syntax inside script code, not a URL
            return value
        parsed = urlsplit(html.unescape(value))
        path = parsed.path
        if parsed.scheme or parsed.netloc:
            if parsed.hostname not in PRODUCTION:
                return value
        elif root_only and not path.startswith('/'):
            return value
        if path.startswith(self.base):
            return value
        if path.startswith('/'):
            candidate = unquote(path.lstrip('/'))
            first = candidate.split('/')[0]
            if candidate and first not in self.roots:
                return value
        else:
            candidate = posixpath.normpath(posixpath.join(posixpath.dirname(relative), unquote(path)))
        if candidate.startswith('../'):
            return value
        if parsed.hostname in PRODUCTION:
            # A new production-only page is an intentional external reference,
            # not a missing page inside this older lab snapshot.
            local = self.public / candidate
            if candidate and not local.is_file() and not (local / 'index.html').is_file():
                return value
        if candidate in self.media:
            target = self.raw + quote(candidate, safe='/')
        else:
            target = self.base + quote(candidate, safe='/$:{}')
            if path.endswith('/') and not target.endswith('/'):
                target += '/'
        return urlunsplit(('', '', target, parsed.query, parsed.fragment))

    def rewrite(self, text: str, relative: str, suffix: str) -> str:
        if suffix in {'.html', '.htm', '.svg'}:
            text = ATTR.sub(lambda m: m['p'] + m['q'] + self.url(m['u'], relative) + m['q'], text)
            text = SRCSET.sub(lambda m: m['p'] + m['q'] + self.srcset(m['v'], relative) + m['q'], text)
        css = lambda t: CSS_URL.sub(lambda m: 'url(' + m['q'] + self.url(m['u'], relative) + m['q'] + ')', t)
        if suffix in {'.html', '.htm'}:
            def styles(t):
                t = STYLE_BLOCK.sub(lambda m: m['open'] + css(m['body']) + m['close'], t)
                return STYLE_ATTR.sub(lambda m: m['p'] + m['q'] + css(m['v']) + m['q'], t)
            # Script blocks are skipped as a whole: '<style' or 'style=' inside JS code is not CSS.
            text = ''.join(part if i % 2 else styles(part) for i, part in enumerate(SCRIPT_BLOCK.split(text)))
        if suffix in {'.css', '.svg'}:
            text = css(text)
        if suffix in {'.js', '.mjs', '.json', '.webmanifest', '.html', '.htm'}:
            text = ROOT_LITERAL.sub(lambda m: m['q'] + self.url(m['u'], relative, True) + m['q'], text)
        return text

    def srcset(self, value: str, relative: str) -> str:
        """Rewrite each candidate URL of a srcset; descriptors (1x, 480w) stay as they are."""
        if 'data:' in value:
            return value
        parts = []
        for candidate in value.split(','):
            bits = candidate.strip().split(None, 1)
            if not bits:
                continue
            parts.append(' '.join([self.url(bits[0], relative)] + bits[1:]))
        return ', '.join(parts)

    def forced_route_stubs(self, output: Path) -> list:
        """Production forced rules (status ending in '!') shadow files that exist at the old path.
        GitHub Pages would serve the shadowed file, so it is replaced by a redirect to the target."""
        rules = json.loads((ROOT / 'scripts/lab_routes_r2.json').read_text(encoding='utf-8'))['rules']
        def built(path):
            rel = path.lstrip('/')
            for cand in ([rel + 'index.html'] if rel == '' or rel.endswith('/') else [rel, rel + '.html', rel + '/index.html']):
                if (output / cand).is_file():
                    return cand
            return None
        stubs = []
        for rule in rules:
            if not rule['status'].endswith('!'):
                continue
            source, target = built(rule['from']), built(rule['to'])
            if not source or not target or source == target or source in {s for s, _ in stubs}:
                continue
            href = self.base + (target[:-len('index.html')] if target.endswith('index.html') else target)
            (output / source).write_text(f'''<!doctype html><html lang="sl"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<meta http-equiv="refresh" content="0;url={href}"><link rel="canonical" href="{href}"><title>AI8 Lab — preusmeritev</title>
<script>location.replace({json.dumps(href)}+location.search+location.hash)</script>
<p>Ta stran je preseljena (enako kot na glavni strani): <a href="{href}">{href}</a></p></html>''', encoding='utf-8')
            stubs.append((source, href))
        return stubs

    def write_404(self, output: Path) -> None:
        """GitHub Pages serves 404.html for every missing path: replay production routes and fix case."""
        plan = json.loads((ROOT / 'lab-evidence/LAB_EXPORT_PLAN_R1.json').read_text(encoding='utf-8'))
        excluded = sorted(e['path'][len('public/'):] for e in plan['excluded']
                          if e['path'].startswith('public/') and e['path'].endswith(('.html', '.htm')))
        data = {'base': self.base, 'production': 'https://www.mdlxdcc.org', 'excluded': excluded,
                'rules': json.loads((ROOT / 'scripts/lab_routes_r2.json').read_text(encoding='utf-8'))['rules'],
                'files': sorted(p.relative_to(output).as_posix() for p in output.rglob('*') if p.is_file())}
        router = (ROOT / 'scripts/lab_404_router.js').read_text(encoding='utf-8')
        payload = json.dumps(data, ensure_ascii=True, separators=(',', ':')).replace('</', '<\\/')
        (output / '404.html').write_text(f'''<!doctype html><html lang="sl"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>AI8 Lab — stran ni najdena</title>
<style>body{{margin:0;background:#0b1419;color:#edf3ed;font:18px/1.6 system-ui}}main{{max-width:760px;margin:10vh auto;padding:24px}}h1{{font-size:clamp(32px,7vw,56px);line-height:1.1;margin:.2em 0}}a{{color:#aaf0d1}}small,code{{color:#a4b7be}}nav{{display:flex;gap:12px;flex-wrap:wrap;margin-top:24px}}nav a{{border:1px solid #35515a;padding:10px 16px;border-radius:12px;text-decoration:none}}</style>
<main><small>AI8 LAB · 404</small><h1 id="t">Iščem stran …</h1><p id="m">Lab poskuša najti pravo pot.</p>
<nav><a href="{self.base}">Izvorni atlas</a><a href="{self.base}portfolio/">Portfelj</a><a href="{self.base}__lab__/">O labu</a></nav></main>
<script>{router}</script>
<script>(function(){{var r=labRoute(location.pathname,{payload});
if(r.kind==='local'&&r.href!==location.pathname){{location.replace(r.href+location.search+location.hash);return;}}
var t=document.getElementById('t'),m=document.getElementById('m');
if(r.kind==='production'){{document.title='AI8 Lab — stran je na glavni strani';t.textContent='Ta stran je samo na glavni strani.';m.innerHTML='Lab je ne vsebuje. <a rel="noopener" href="'+r.href+'">Odpri jo na mdlxdcc.org ↗</a>';}}
else{{t.textContent='Stran ni najdena.';m.textContent='Poti /'+r.path+' v labu ni. Lab je delovna kopija; nekatere strani so samo na glavni strani.';}}}})();</script></html>''', encoding='utf-8')

    def build(self, output: Path) -> dict:
        if output.exists():
            raise RuntimeError('Use a new output directory; source and existing artifacts are never overwritten')
        if output.resolve() == self.public.resolve() or self.public.resolve() in output.resolve().parents:
            raise RuntimeError('Output must be outside source public/')
        output.mkdir(parents=True)
        runtime = (ROOT / 'scripts/lab_pages_runtime.js').read_text(encoding='utf-8')
        for key, value in {'__LAB_BASE__': self.base, '__LAB_RAW__': self.raw,
                           '__LAB_ROOTS__': sorted(self.roots), '__LAB_MEDIA__': sorted(self.media)}.items():
            runtime = runtime.replace(key, json.dumps(value, ensure_ascii=True))
        meta = ('<meta http-equiv="Content-Security-Policy" content="connect-src \'self\' https://raw.githubusercontent.com; '
                'form-action \'self\'; object-src \'none\'">'
                f'<script src="{self.base}__lab__/runtime.js"></script>')
        badge = (f'<style>@media(max-width:600px){{#ai8-lab-badge{{padding:3px 8px!important;font-size:10px!important;right:6px!important;bottom:6px!important;opacity:.82}}}}</style>'
                 f'<a id="ai8-lab-badge" href="{self.base}__lab__/" style="position:fixed;right:12px;bottom:12px;z-index:2147483647;'
                 'background:#10272c;color:#aaf0d1;border:1px solid #7bcab1;border-radius:20px;'
                 'padding:8px 13px;font:600 12px system-ui;text-decoration:none">AI8 LAB · v nastajanju ↗</a>')
        copied = 0
        for file in self.files:
            relative = file.relative_to(self.public).as_posix()
            if relative in self.media:
                continue
            if 'sef' in file.name.lower() or re.search(r'\.(enc|age|gpg|pem|key)(\.|$)', file.name, re.I):
                raise RuntimeError(f'Unexpected credential-related public path: {relative}')
            target = output / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            if file.suffix.lower() in TEXT:
                text = self.rewrite(file.read_text(encoding='utf-8', errors='strict'), relative, file.suffix.lower())
                if file.suffix.lower() in {'.html', '.htm'}:
                    text = re.sub(r'<head\b[^>]*>', lambda m: m[0] + meta, text, count=1, flags=re.I)
                    text = re.sub(r'<body\b[^>]*>', lambda m: m[0] + badge, text, count=1, flags=re.I)
                if file.suffix.lower() in {'.js', '.mjs'}:
                    text = runtime + '\n' + text
                target.write_text(text, encoding='utf-8')
            else:
                shutil.copyfile(file, target)
            copied += 1
        info = output / '__lab__'
        info.mkdir(exist_ok=True)
        (info / 'runtime.js').write_text(runtime, encoding='utf-8')
        (output / '.nojekyll').write_text('', encoding='utf-8')
        stubs = self.forced_route_stubs(output)
        self.write_404(output)
        (output / 'robots.txt').write_text('User-agent: *\nDisallow: /\n', encoding='utf-8')
        (info / 'index.html').write_text(f'''<!doctype html><html lang="sl"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>AI8 Lab — otrok v nastajanju</title><style>body{{margin:0;background:#0b1419;color:#edf3ed;font:18px/1.6 system-ui}}main{{max-width:900px;margin:8vh auto;padding:24px}}h1{{font-size:clamp(40px,8vw,76px);line-height:1.05}}a{{color:#aaf0d1}}nav{{display:flex;gap:14px;flex-wrap:wrap}}nav a{{border:1px solid #35515a;padding:12px 18px;border-radius:14px;text-decoration:none}}small{{color:#a4b7be}}section{{margin:40px 0}}code{{font-size:14px}}</style>
<main><small>BD × CLI Code × CLI Codex · EKSPERIMENTALNI LABORATORIJ</small><h1>Otrok<br>v nastajanju.</h1>
<p>To je dejanska delovna kopija projektov. Tukaj lahko odpiraš aplikacije in spremljaš, kaj skupaj gradiva.</p>
<nav><a href="{self.base}portfolio/">Nov portfelj →</a><a href="{self.base}">Izvorni atlas</a><a href="{self.base}chess/">Šah</a><a href="{self.base}Trip/">Trip</a><a href="{self.base}CW/">Crosswords</a></nav>
<section><h2>Prva različica</h2><p>Ločena izvorna kopija je preverjena. Produkcijske objave in poverilnice so izločene. Na vseh straneh oznaka AI8 LAB pokaže, da si v poskusu.</p><p>Zunanji AI klici v tem predogledu niso povezani. Večje slike in prenosi se odpirajo iz istega GitHub repozitorija.</p></section>
<section><h2>Spremljaj razvoj</h2><p><a href="https://github.com/BD-Chess/mdlxdcc-ai8-lab">Izvorna koda in spremembe</a> · <a href="https://www.mdlxdcc.org/ai8/live/">Povzetki najinega dela</a></p><small>Izvorna različica: <code>{self.commit[:12]}</code>. To je objavljen posnetek; nove spremembe se pokažejo po naslednji uspešni objavi.</small></section></main></html>''', encoding='utf-8')
        report = {'schema': 'ai8.pages-build.v1', 'source_commit': self.commit, 'base': self.base,
                  'copied_source_files': copied, 'offloaded_media_files': len(self.media),
                  'offloaded_bytes': sum((self.public / path).stat().st_size for path in self.media),
                  'offloaded_paths': sorted(self.media), 'provider_calls_connected': False,
                  'forced_route_stubs': [{'path': p, 'to': h} for p, h in stubs]}
        report['published_bytes'] = sum(path.stat().st_size for path in output.rglob('*') if path.is_file())
        if report['published_bytes'] >= 950_000_000:
            raise RuntimeError(f"Pages artifact exceeds conservative size gate: {report['published_bytes']}")
        (info / 'build.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
        print(json.dumps({key: value for key, value in report.items() if key != 'offloaded_paths'}))
        return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--base', default='/mdlxdcc-ai8-lab/')
    args = parser.parse_args()
    commit = subprocess.run(['git', '-C', str(ROOT), 'rev-parse', 'HEAD'], check=True,
                            stdout=subprocess.PIPE, text=True).stdout.strip()
    Builder(ROOT / 'public', args.base, commit).build(args.output)
