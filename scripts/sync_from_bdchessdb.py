"""Bring bd-chessdb changes since the latest lab source manifest into the AI8 lab.

Read-only on upstream (a local clone of BD-Chess/bd-chessdb with history back to the
manifest's source_sha). Writes only the lab working tree and lab-evidence/.
Never transfers OmniCPQ/TS (REMOVALS_R*), automation, hosting config, encrypted or
credential material, or files whose text matches a credential marker.

Dry run:  python3 scripts/sync_from_bdchessdb.py <upstream_clone> . origin/main [changes.json]
Apply:    python3 scripts/sync_from_bdchessdb.py <upstream_clone> . origin/main --apply [--resolve resolve.json]
resolve.json maps a conflicting path to "upstream" or to a file holding the merged result.
Unresolved conflicts keep the lab version and are listed in the SYNC record.
"""
import hashlib, json, re, subprocess, sys, tempfile
from pathlib import Path, PurePosixPath

UP, LAB, REF = Path(sys.argv[1]), Path(sys.argv[2]), sys.argv[3]
APPLY = '--apply' in sys.argv
RES = json.loads(Path(sys.argv[sys.argv.index('--resolve') + 1]).read_text()) if '--resolve' in sys.argv else {}

def git(repo, *args, binary=False):
    r = subprocess.run(['git', '-C', str(repo), *args], capture_output=True, check=True)
    return r.stdout if binary else r.stdout.decode()

def blob(repo, rev, path):
    return git(repo, 'cat-file', 'blob', f'{rev}:{path}', binary=True)

HEAD = git(UP, 'rev-parse', REF).strip()
EV = LAB / 'lab-evidence'
rnum = lambda p: int(p.stem.split('_R')[1])
plan = json.loads((EV / 'LAB_EXPORT_PLAN_R1.json').read_text())
r1_excluded = {e['path']: e['reason'] for e in plan['excluded']}
for rec in sorted(EV.glob('SYNC_R*.json'), key=rnum):
    r1_excluded.update({e['path']: e['reason'].replace('R1 exclusion kept: ', '') for e in json.loads(rec.read_text())['excluded']})
latest = max(EV.glob('SOURCE_MANIFEST_R*.json'), key=rnum)
manifest = json.loads(latest.read_text())
SNAP = manifest['source_sha']
NEXT = rnum(latest) + 1
r1_included = {e['path'] for e in manifest['files']}
removed = set()
for rec in (LAB / 'lab-evidence').glob('REMOVALS_R*.json'):
    removed |= {r['path'] for r in json.loads(rec.read_text())['removed_files']}
case_map = {e['source_path']: e['lab_path'] for e in json.loads((LAB / 'lab-evidence/CASE_VARIANTS_R1.json').read_text())}
lab_files = set(git(LAB, 'ls-files').splitlines())
lab_lower = {}
for f in lab_files:
    lab_lower.setdefault(f.lower(), f)

MARKERS = {
    'Google OAuth secret': re.compile('GOC' + r'SPX-[A-Za-z0-9_-]{10,}'),
    'OAuth literal': re.compile(r'''(?i)(client[_ -]?secret|refresh[_ -]?token)\s*[:=]\s*["'][^"']{12,}["']'''),
    'Google API key': re.compile('AI' + r'za[0-9A-Za-z_-]{35}'),
    'GitHub token': re.compile('gh' + r'[pousr]_[0-9A-Za-z]{30,}'),
    'OpenAI token': re.compile(r'(?<![A-Za-z0-9_])' + 'sk' + r'-(?:proj-|svcacct-)?[A-Za-z0-9_-]{40,}'),
    'Anthropic token': re.compile('sk-' + r'ant-[A-Za-z0-9_-]{20,}'),
    'private key': re.compile('-----BEGIN ' + r'(?:RSA |EC |OPENSSH )?PRIVATE KEY-----'),
    'Supabase/JWT service key': re.compile(r'eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}'),
}
TEXT = {'.py', '.md', '.txt', '.json', '.html', '.js', '.mjs', '.cjs', '.bat', '.cmd', '.ps1', '.yml', '.yaml',
        '.toml', '.ini', '.cfg', '.mts', '.ts', '.svg', '.xml', '.sql', '.css', '.webmanifest', '.csv', '.env', ''}
CRED_NAME = re.compile(r'(sef|vault|rclone\.conf)|\.(enc|age|gpg|pem|key|p12|pfx)([.-]|$)|^\.env', re.I)

def exclusion(path):
    name = PurePosixPath(path).name
    if path in r1_excluded:
        return 'earlier exclusion kept: ' + r1_excluded[path]
    if path in removed or 'omnicpq' in path.lower() or path.startswith('public/TS/'):
        return 'work project (REMOVALS_R1): stays only in bd-chessdb'
    if path.startswith('.github/'):
        return 'upstream automation or generated metadata'
    if '/' not in path and (name.endswith('.bat') or name in {'.gitignore', 'README.md', 'AGENTS.md'}):
        return 'upstream launcher or root policy; replaced in lab'
    if re.match(r'netlify.*\.toml$', name) or name == 'CNAME':
        return 'upstream hosting configuration'
    if path in {'public/_headers', 'public/_redirects'}:
        return 'upstream routing or production marker'
    if CRED_NAME.search(name) and path not in r1_included:
        return 'encrypted or credential-related path'
    if path.startswith('scripts/') and re.search(r'deploy|release', name, re.I):
        return 'upstream release tooling'
    return None

# newest upstream commit per path in the range
last_commit = {}
cur = None
for line in git(UP, 'log', '--format=>%h %ad', '--date=short', '--name-only', '--no-renames', f'{SNAP}..{HEAD}').splitlines():
    if line.startswith('>'):
        cur = line[1:]
    elif line.strip() and line not in last_commit:
        last_commit[line] = cur

changes = []
for line in git(UP, 'diff', '--name-status', '--no-renames', SNAP, HEAD).splitlines():
    status, path = line.split('\t', 1)
    rec = {'path': path, 'status': status, 'upstream_commit': last_commit.get(path)}
    reason = exclusion(path)
    if status == 'D':
        rec.update(action='upstream-deleted (not applied)', note='review manually')
        changes.append(rec); continue
    new = blob(UP, HEAD, path)
    rec['upstream_blob'] = git(UP, 'rev-parse', f'{HEAD}:{path}').strip()
    if reason is None and PurePosixPath(path).suffix.lower() in TEXT:
        text = new.decode('utf-8', 'ignore')
        hit = [k for k, p in MARKERS.items() if p.search(text)]
        if hit:
            reason = 'credential marker in content: ' + ', '.join(hit)
    if reason:
        rec.update(action='excluded', reason=reason)
        changes.append(rec); continue
    lab_path = case_map.get(path, path)
    if lab_path == path and path not in lab_files and path.lower() in lab_lower:
        rec.update(action='excluded', reason=f'case-insensitive collision with lab path {lab_lower[path.lower()]}')
        changes.append(rec); continue
    rec['lab_path'] = lab_path
    target = LAB / lab_path
    result = new
    if status == 'M' and lab_path in lab_files:
        base = blob(UP, SNAP, path)
        ours = target.read_bytes()
        if ours == base:
            rec['action'] = 'updated'
        elif ours == new:
            rec['action'] = 'already-identical'
        else:
            with tempfile.TemporaryDirectory() as d:
                o, b, t = Path(d, 'ours'), Path(d, 'base'), Path(d, 'theirs')
                o.write_bytes(ours); b.write_bytes(base); t.write_bytes(new)
                r = subprocess.run(['git', 'merge-file', '-p', str(o), str(b), str(t)], capture_output=True)
            if r.returncode == 0:
                rec['action'] = 'merged (lab change + upstream change)'; result = r.stdout
            elif path in RES and RES[path] == 'upstream':
                rec['action'] = 'conflict resolved: upstream (lab version superseded)'; result = new
            elif path in RES:
                result = Path(RES[path]).read_bytes(); rec['action'] = 'conflict resolved: merged lab + upstream'
            else:
                rec['action'] = 'conflict: lab version kept'; result = None
    elif status == 'M':
        rec['action'] = 'added (missing in lab)'
    else:
        if lab_path in lab_files and target.read_bytes() != new:
            if RES.get(path) == 'upstream':
                rec['action'] = 'conflict resolved: upstream (lab version superseded)'
            else:
                rec['action'] = 'conflict: lab already has a different file; lab version kept'; result = None
        else:
            rec['action'] = 'added'
    if result is not None:
        rec['sha256'] = hashlib.sha256(result).hexdigest(); rec['bytes'] = len(result)
        if APPLY:
            target.parent.mkdir(parents=True, exist_ok=True); target.write_bytes(result)
    changes.append(rec)

summary = {}
for c in changes:
    k = c['action'].split(':')[0]
    summary[k] = summary.get(k, 0) + 1
excluded_reasons = {}
for c in changes:
    if c['action'] == 'excluded':
        excluded_reasons[c['reason']] = excluded_reasons.get(c['reason'], 0) + 1
print(json.dumps({'upstream_head': HEAD, 'changes': len(changes), 'summary': summary, 'excluded': excluded_reasons}, indent=1))
for c in changes:
    if c['action'].startswith(('conflict', 'merged', 'upstream-deleted')) or 'collision' in c.get('reason', '') or 'marker' in c.get('reason', ''):
        print(' ', c['action'], '|', c['path'], '|', c.get('reason', ''))

if not APPLY and len(sys.argv) > 4 and sys.argv[4].endswith('.json'):
    Path(sys.argv[4]).write_text(json.dumps(changes, indent=1, ensure_ascii=False))

if APPLY:
    applied = {c['lab_path']: c for c in changes if 'sha256' in c}
    files = []
    seen = set()
    for e in manifest['files']:
        c = applied.get(e['path'])
        if c and not c['action'].startswith(('merged', 'conflict resolved: merged')):
            e = {**e, 'source_blob': c['upstream_blob'], 'bytes': c['bytes'], 'sha256': c['sha256']}
        elif c:  # merged: manifest keeps upstream truth; lab difference is a recorded lab change
            up = blob(UP, HEAD, c['path'])
            e = {**e, 'source_blob': c['upstream_blob'], 'bytes': len(up), 'sha256': hashlib.sha256(up).hexdigest()}
        files.append(e); seen.add(e['path'])
    for c in changes:
        if 'sha256' in c and c['lab_path'] not in seen:
            files.append({'path': c['lab_path'], 'original_path': c['path'], 'source_blob': c['upstream_blob'],
                          'bytes': c['bytes'], 'sha256': c['sha256']})
    files.sort(key=lambda e: e['path'])
    ev = LAB / 'lab-evidence'
    (ev / f'SOURCE_MANIFEST_R{NEXT}.json').write_text(json.dumps({'source_sha': HEAD, 'previous': latest.name, 'files': files}, indent=1) + '\n')
    sync = {'schema': 'ai8.lab-sync.v1', 'sync_id': f'R{NEXT}', 'source_repo': 'BD-Chess/bd-chessdb',
            'from_source_sha': SNAP, 'to_source_sha': HEAD, 'decided_by': 'BD', 'decided_on': '2026-11-03',
            'rule': 'Copy what is new or changed in bd-chessdb main into the lab; improve in the lab; transfer back only after BD confirms a specific PR.',
            'summary': summary, 'excluded_reasons': excluded_reasons,
            'excluded': [{'path': c['path'], 'reason': c['reason']} for c in changes if c['action'] == 'excluded'],
            'changes': changes}
    (ev / f'SYNC_R{NEXT}.json').write_text(json.dumps(sync, indent=1, ensure_ascii=False) + '\n')
    print('written', len(files), 'manifest entries')
