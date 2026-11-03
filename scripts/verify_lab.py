"""Bounded offline validation for the AI8 snapshot; prints no secret values."""
import hashlib
import json
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
TEXT = {'.py', '.md', '.txt', '.json', '.html', '.js', '.mjs', '.cjs', '.bat',
        '.cmd', '.ps1', '.yml', '.yaml', '.toml', '.ini', '.cfg', '.mts', '.ts', '.svg', '.xml'}
MARKERS = {
    'Google OAuth secret': re.compile('GOC' + r'SPX-[A-Za-z0-9_-]{10,}'),
    'OAuth literal': re.compile(r'''(?i)(client[_ -]?secret|refresh[_ -]?token)\s*[:=]\s*["'][^"']{12,}["']'''),
    'Google API key': re.compile('AI' + r'za[0-9A-Za-z_-]{35}'),
    'GitHub token': re.compile('gh' + r'[pousr]_[0-9A-Za-z]{30,}'),
    'OpenAI token': re.compile(r'(?<![A-Za-z0-9_])' + 'sk' + r'-(?:proj-|svcacct-)?[A-Za-z0-9_-]{40,}'),
    'private key': re.compile('-----BEGIN ' + r'(?:RSA |EC |OPENSSH )?PRIVATE KEY-----'),
}
# Removed work projects must not come back through links in content (REMOVALS_R1).
REMOVED_REF = re.compile(r'''(?i)(?:href|src)\s*=\s*["'][^"']*(?:omnicpq|/TS/)|["']\.\./OmniCPQ/|/ai8/omnicpq-origin''')
errors = []
# Intentional lab changes to exported files (LAB_CHANGES_R*): path -> accepted lab sha256 values.
accepted = {}
for record in sorted((ROOT / 'lab-evidence').glob('LAB_CHANGES_R*.json')):
    for row in json.loads(record.read_text(encoding='utf-8'))['files']:
        accepted.setdefault(row['path'], set()).add(row['lab_sha256'])
plan = json.loads((ROOT / 'lab-evidence/LAB_EXPORT_PLAN_R1.json').read_text(encoding='utf-8'))
# Later syncs from bd-chessdb add their own exclusions and a newer source manifest; older ones stay as history.
for record in sorted((ROOT / 'lab-evidence').glob('SYNC_R*.json'), key=lambda p: int(p.stem.split('_R')[1])):
    plan['excluded'] += json.loads(record.read_text(encoding='utf-8'))['excluded']
latest = max((ROOT / 'lab-evidence').glob('SOURCE_MANIFEST_R*.json'), key=lambda p: int(p.stem.split('_R')[1]))
manifest = json.loads(latest.read_text(encoding='utf-8'))
# Explicit, BD-decided removals after the snapshot: absent is expected, presence is an error.
removed = set()
for record in sorted((ROOT / 'lab-evidence').glob('REMOVALS_R*.json')):
    removed.update(row['path'] for row in json.loads(record.read_text(encoding='utf-8'))['removed_files'])
for rel in sorted(removed):
    if (ROOT / rel).exists():
        errors.append({'path': rel, 'kind': 'removed path present'})
for entry in plan['excluded']:
    replaced = {'AGENTS.md', 'README.md', '.gitignore'}
    if entry['path'] not in replaced and (ROOT / entry['path']).exists():
        errors.append({'path': entry['path'], 'kind': 'excluded upstream path present'})
checked_bytes = 0
for entry in manifest['files']:
    if entry['path'] in removed:
        continue
    path = ROOT / entry['path']
    if not path.is_file():
        errors.append({'path': entry['path'], 'kind': 'missing exported file'})
        continue
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(chunk)
            checked_bytes += len(chunk)
    if digest.hexdigest() != entry['sha256'] and digest.hexdigest() not in accepted.get(entry['path'], ()):
        errors.append({'path': entry['path'], 'kind': 'source hash mismatch'})
text_count = 0
for path in ROOT.rglob('*'):
    rel = path.relative_to(ROOT)
    if '.git' in rel.parts or 'node_modules' in rel.parts or not path.is_file() or path.suffix.lower() not in TEXT:
        continue
    if path == Path(__file__).resolve() or rel.as_posix() == 'scripts/check_secret_boundary.py':
        continue
    text = path.read_text(encoding='utf-8', errors='ignore')
    text_count += 1
    for kind, pattern in MARKERS.items():
        if pattern.search(text):
            errors.append({'path': rel.as_posix(), 'kind': kind})
    if not rel.as_posix().startswith(('lab-evidence/', 'reports/', 'scripts/sync_from_bdchessdb.py')) and REMOVED_REF.search(text):
        errors.append({'path': rel.as_posix(), 'kind': 'link to removed work project'})
report = {'schema': 'ai8.lab-validation.v1', 'source_sha': manifest['source_sha'],
          'status': 'PASS' if not errors else 'FAIL',
          'source_files_verified': len([e for e in manifest['files'] if e['path'] not in removed]),
          'intentionally_removed': len(removed),
          'source_bytes_hashed': checked_bytes, 'text_files_scanned': text_count, 'errors': errors,
          'not_run': ['full application tests', 'browser acceptance', 'research', 'benchmarks', 'deployment']}
(ROOT / 'lab-evidence/VALIDATION_R1.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps(report, indent=2))
sys.exit(bool(errors))
