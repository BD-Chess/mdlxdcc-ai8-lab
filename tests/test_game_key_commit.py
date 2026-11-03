"""Every game's stored key_commit and SHA256SUMS must verify. Run: python3 tests/test_game_key_commit.py"""
import copy
import importlib.util
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('gkc', ROOT / 'tools/game_key_commit.py')
gkc = importlib.util.module_from_spec(spec); spec.loader.exec_module(gkc)

slugs = sorted(p.parent.name for p in (ROOT / 'public/game').glob('*/game.json'))
results = {s: gkc.audit(s) for s in slugs}
for slug, r in results.items():
    assert r['status'] in ('MATCH', 'NO_KEY'), r
    assert r['sums'] in ('OK', 'NONE'), r
keyed = [s for s, r in results.items() if r['status'] == 'MATCH']
assert keyed, 'at least one game carries a key_commit'

# Tampering with one key idea must break the commitment.
game = json.loads((ROOT / 'public/game' / keyed[0] / 'game.json').read_text(encoding='utf-8'))
stored = game['key_commit']['sha3']
tampered = copy.deepcopy(game)
step = next(s for s in tampered['steps'] if 'key' in s)
if isinstance(step['key'], dict):
    step['key']['_tamper'] = 1
else:
    step['key'] = [step['key'], '_tamper']
assert stored not in gkc.forms(tampered).values(), 'tampered key must not match'
# Windows clone with core.autocrlf: text files arrive with CRLF. Same content -> OK, reported as eol;
# a real content change in a CRLF file is still BAD.
import shutil, tempfile
with_sums = [s for s, r in results.items() if r['sums'] == 'OK']
assert with_sums, 'at least one game has SHA256SUMS.txt'
with tempfile.TemporaryDirectory() as tmp:
    folder = pathlib.Path(tmp, with_sums[0])
    shutil.copytree(ROOT / 'public/game' / with_sums[0], folder)
    converted = []
    for name in ('index.html', 'game.json'):
        data = (folder / name).read_bytes()
        assert b'\r\n' not in data
        (folder / name).write_bytes(data.replace(b'\n', b'\r\n')); converted.append(name)
    bad, eol = gkc.check_sums(folder)
    assert bad == [] and sorted(eol) == sorted(converted), (bad, eol)
    (folder / 'game.json').write_bytes((folder / 'game.json').read_bytes().replace(b'"', b"'", 1))
    bad, eol = gkc.check_sums(folder)
    assert bad == ['game.json'] and eol == ['index.html'], (bad, eol)
summary = ', '.join(f"{s}:{r['status']}" for s, r in results.items())
print(f'game key_commit tests passed: {len(slugs)} games ({summary})')
