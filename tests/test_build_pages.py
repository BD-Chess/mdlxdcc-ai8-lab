"""Rewrite rules of scripts/build_pages.py. Run: python3 tests/test_build_pages.py"""
import importlib.util, pathlib, sys
spec = importlib.util.spec_from_file_location('build_pages', pathlib.Path(__file__).resolve().parents[1] / 'scripts/build_pages.py')
bp = importlib.util.module_from_spec(spec); spec.loader.exec_module(bp)

class Fake(bp.Builder):
    def __init__(self):
        self.base, self.roots, self.media, self.public = '/mdlxdcc-ai8-lab/', {'BD', 'img'}, set(), pathlib.Path('/nonexistent')
        self.raw = 'https://raw.githubusercontent.com/x/y/z/public/'

b = Fake()
html = ('<style>body{background:url(/img/a.png)}</style><div style="background:url(\'/img/b.png\')"></div>'
        '<script>const u=URL.createObjectURL(blob);const p=new URL(full);fetch(new URL(x, location.href));'
        'const sig=[...h.matchAll(/<style[^>]*data-x="([^"]+)"/g)];const q=new URL(raw);const end="</style>";</script>')
out = b.rewrite(html, 'BD/page.html', '.html')
assert 'URL.createObjectURL(blob)' in out, out
assert 'new URL(full)' in out and 'new URL(x, location.href)' in out and 'new URL(raw)' in out, out
assert 'url(/mdlxdcc-ai8-lab/img/a.png)' in out, out
assert "url('/mdlxdcc-ai8-lab/img/b.png')" in out, out
assert b.rewrite('a{background:url(/img/c.png)}', 'x.css', '.css') == 'a{background:url(/mdlxdcc-ai8-lab/img/c.png)}'
rx = '<script>[...h.matchAll(/href="[^"]*\\/(h_[a-f0-9]{12})"/gi)];el.innerHTML=\'<a href="/BD/x.html">x</a>\';</script>'
out = b.rewrite(rx, 'BD/page.html', '.html')
assert 'href="[^"]*\\/(h_[a-f0-9]{12})"' in out, out
assert 'href="/mdlxdcc-ai8-lab/BD/x.html"' in out, out
print('build_pages rewrite tests: 7 passed')
