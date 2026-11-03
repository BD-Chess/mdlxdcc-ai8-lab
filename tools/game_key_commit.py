"""Compute and verify the key commitment ("key_commit", PRAVILO20 v0.2) of "Pred izumom" games.

The repo has no generator for key_commit; this procedure was reconstructed on 2026-11-03 and
reproduces every stored value:
  list form  (navierstokes1845, tesla1888):
      sha3_256(json.dumps([step["key"] for step in steps if "key" in step], **CANON))
  dict form  (dayton1903):
      sha3_256(json.dumps({step["id"]: step["key"] for step in steps if "key" in step}, **CANON))
  CANON = sort_keys=True, ensure_ascii=False, separators=(",", ":"), UTF-8 bytes.
Games without a "key" block (e.g. faraday1831) have no key_commit: reported as NO_KEY.

It also verifies SHA256SUMS.txt in a game folder when present. A file that matches only with CRLF
read as LF (Windows clone with core.autocrlf) counts as OK and is reported as a CRLF checkout.

Usage:  python3 tools/game_key_commit.py [--check] [slug ...]
        (default: every public/game/*/game.json; --check exits 1 on any mismatch)
        python3 tools/game_key_commit.py --print <slug> [list|dict]   # value to store after a key edit
"""
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CANON = dict(sort_keys=True, ensure_ascii=False, separators=(',', ':'))


def forms(game: dict) -> dict:
    keyed = [s for s in game.get('steps', []) if 'key' in s]
    if not keyed:
        return {}
    digest = lambda obj: hashlib.sha3_256(json.dumps(obj, **CANON).encode('utf-8')).hexdigest()
    return {'list': digest([s['key'] for s in keyed]), 'dict': digest({s['id']: s['key'] for s in keyed})}


def check_sums(folder: Path) -> tuple:
    """Return (bad, eol). eol lists files that match only with CRLF read as LF: a Windows clone
    with core.autocrlf converts text files on checkout, while the sums are taken from the stored
    (LF) bytes. Their content is the same, so they count as OK but are reported separately."""
    sums = folder / 'SHA256SUMS.txt'
    if not sums.is_file():
        return [], []
    bad, eol = [], []
    for line in sums.read_text(encoding='utf-8').splitlines():
        if not line.strip():
            continue
        digest, name = line.split(None, 1)
        name = name.strip()
        target = folder / name.lstrip('*')
        data = target.read_bytes() if target.is_file() else None
        if data is not None and hashlib.sha256(data).hexdigest() == digest:
            continue
        if data is not None and b'\r\n' in data and hashlib.sha256(data.replace(b'\r\n', b'\n')).hexdigest() == digest:
            eol.append(name)
            continue
        bad.append(name)
    return bad, eol


def audit(slug: str) -> dict:
    folder = ROOT / 'public/game' / slug
    game = json.loads((folder / 'game.json').read_text(encoding='utf-8'))
    stored = (game.get('key_commit') or {}).get('sha3')
    computed = forms(game)
    if not computed:
        status, form = ('NO_KEY' if not stored else 'MISMATCH'), None
    else:
        form = next((name for name, value in computed.items() if value == stored), None)
        status = 'MATCH' if form else 'MISMATCH'
    sums_bad, sums_eol = check_sums(folder)
    return {'slug': slug, 'status': status, 'form': form, 'stored': stored,
            'sums': 'NONE' if not (folder / 'SHA256SUMS.txt').is_file() else ('OK' if not sums_bad else 'BAD'),
            'sums_bad': sums_bad, 'sums_eol': sums_eol}


def main(argv):
    if argv[:1] == ['--print']:
        slug, form = argv[1], (argv[2] if len(argv) > 2 else 'list')
        print(forms(json.loads((ROOT / 'public/game' / slug / 'game.json').read_text(encoding='utf-8')))[form])
        return 0
    check = '--check' in argv
    slugs = [a for a in argv if not a.startswith('--')] or sorted(p.parent.name for p in (ROOT / 'public/game').glob('*/game.json'))
    results = [audit(s) for s in slugs]
    for r in results:
        print(f"{r['slug']:18} key_commit={r['status']:8} form={r['form'] or '-':4} sums={r['sums']}" + (f" bad={r['sums_bad']}" if r['sums_bad'] else '')
              + (f" (CRLF checkout, same content: {len(r['sums_eol'])} files)" if r['sums_eol'] else ''))
    failed = [r for r in results if r['status'] == 'MISMATCH' or r['sums'] == 'BAD']
    return 1 if check and failed else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
