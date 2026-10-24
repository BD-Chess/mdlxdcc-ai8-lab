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
errors = []
plan = json.loads((ROOT / 'lab-evidence/LAB_EXPORT_PLAN_R1.json').read_text(encoding='utf-8'))
manifest = json.loads((ROOT / 'lab-evidence/SOURCE_MANIFEST_R1.json').read_text(encoding='utf-8'))
for entry in plan['excluded']:
    replaced = {'AGENTS.md', 'README.md', '.gitignore'}
    if entry['path'] not in replaced and (ROOT / entry['path']).exists():
        errors.append({'path': entry['path'], 'kind': 'excluded upstream path present'})
checked_bytes = 0
for entry in manifest['files']:
    path = ROOT / entry['path']
    if not path.is_file():
        errors.append({'path': entry['path'], 'kind': 'missing exported file'})
        continue
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(chunk)
            checked_bytes += len(chunk)
    if digest.hexdigest() != entry['sha256']:
        errors.append({'path': entry['path'], 'kind': 'source hash mismatch'})
text_count = 0
for path in ROOT.rglob('*'):
    rel = path.relative_to(ROOT)
    if '.git' in rel.parts or not path.is_file() or path.suffix.lower() not in TEXT:
        continue
    if path == Path(__file__).resolve() or rel.as_posix() == 'scripts/check_secret_boundary.py':
        continue
    text = path.read_text(encoding='utf-8', errors='ignore')
    text_count += 1
    for kind, pattern in MARKERS.items():
        if pattern.search(text):
            errors.append({'path': rel.as_posix(), 'kind': kind})
report = {'schema': 'ai8.lab-validation.v1', 'source_sha': manifest['source_sha'],
          'status': 'PASS' if not errors else 'FAIL', 'source_files_verified': len(manifest['files']),
          'source_bytes_hashed': checked_bytes, 'text_files_scanned': text_count, 'errors': errors,
          'not_run': ['full application tests', 'browser acceptance', 'research', 'benchmarks', 'deployment']}
(ROOT / 'lab-evidence/VALIDATION_R1.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps(report, indent=2))
sys.exit(bool(errors))
