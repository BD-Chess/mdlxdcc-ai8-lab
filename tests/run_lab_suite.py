"""Run the JS test files one node process per file and compare with tests/LAB_EXPECTED_FAILURES.json.

Usage (from the repo root):
  python3 tests/run_lab_suite.py [--workers 4] [--timeout 300] [--chromium PATH] [--out results.json]
                                 [--all] [files ...]

Discovery: tests/**/*.{mjs,cjs} and public/**/*.test.{mjs,cjs,js}, without fixtures/ and node_modules/.
A file named *.test.* runs as `node --test <file>`; any other file runs as `node <file>`.
Files whose expected-failure entry has "skip": true (live production smokes, a long-running server)
are not started unless --all is given. Test evidence goes to AI8_TEST_EVIDENCE_DIR (a new temp folder
unless it is already set), so the run leaves no *-evidence/ folders in the repo.
Exit code 1 when a file fails that is not listed as expected; files listed but now passing are reported
so the list can be shortened.
"""
import argparse
import json
import os
import re
import socket
import subprocess
import sys
import tempfile
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BROWSER_VARS = ('CHROME_PATH', 'ANDALUZIJA_TEST_CHROMIUM', 'CHESS_BROWSER_EXECUTABLE', 'CHESS_QA_CHROMIUM', 'GAME_GUIDE_BROWSER')


def discover():
    found = list((ROOT / 'tests').rglob('*')) + list((ROOT / 'public').rglob('*.test.*'))
    return sorted(p.relative_to(ROOT).as_posix() for p in found
                  if p.is_file() and re.search(r'\.(test\.(mjs|cjs|js)|mjs|cjs)$', p.name)
                  and 'fixtures' not in p.parts and 'node_modules' not in p.parts)


def free_port():
    with socket.socket() as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('files', nargs='*')
    ap.add_argument('--workers', type=int, default=4)
    ap.add_argument('--timeout', type=int, default=300)
    ap.add_argument('--chromium', help='browser binary for the five browser path variables')
    ap.add_argument('--out', help='write per-file results as JSON')
    ap.add_argument('--all', action='store_true', help='also start files marked skip')
    args = ap.parse_args()

    expected = {row['file']: row for row in json.loads((ROOT / 'tests/LAB_EXPECTED_FAILURES.json').read_text(encoding='utf-8'))['files']}
    files = args.files or discover()
    skipped = [f for f in files if expected.get(f, {}).get('skip') and not args.all]
    files = [f for f in files if f not in skipped]

    env = dict(os.environ)
    env.setdefault('AI8_TEST_EVIDENCE_DIR', tempfile.mkdtemp(prefix='ai8-test-evidence-'))
    if args.chromium:
        for name in BROWSER_VARS:
            env[name] = args.chromium
    server = None
    if 'CW_BASE_URL' not in env:  # tests/crosswords-unified-browser.cjs needs a static preview server
        port = free_port()
        env['CW_BASE_URL'] = f'http://127.0.0.1:{port}/CW'
        server = subprocess.Popen([sys.executable, 'scripts/serve_lab.py', '--port', str(port)], cwd=ROOT,
                                  stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        time.sleep(1)

    def run(f):
        started = time.time()
        cmd = ['node', '--test', f] if '.test.' in f else ['node', f]
        try:
            # Explicit UTF-8: on Windows text=True alone decodes with the ANSI code page and crashes on test output.
            r = subprocess.run(cmd, cwd=ROOT, env=env, capture_output=True, text=True,
                               encoding='utf-8', errors='replace', timeout=args.timeout)
            out = r.stdout + r.stderr
            count = lambda k: int((re.search(rf'^# {k} (\d+)', out, re.M) or [0, 0])[1])
            return {'file': f, 'rc': r.returncode, 'pass': count('pass'), 'fail': count('fail'),
                    'secs': round(time.time() - started, 1), 'tail': out[-1500:] if r.returncode else ''}
        except subprocess.TimeoutExpired:
            return {'file': f, 'rc': 'timeout', 'secs': args.timeout, 'tail': ''}

    try:
        with ThreadPoolExecutor(args.workers) as pool:
            results = list(pool.map(run, files))
    finally:
        if server:
            server.terminate()
            server.wait(10)

    passed = [r for r in results if r['rc'] == 0]
    failed = [r for r in results if r['rc'] != 0]
    unexpected = [r for r in failed if r['file'] not in expected]
    fixed = [r for r in passed if r['file'] in expected and expected[r['file']]['class'] != 'flaky']
    print(f"{len(results)} run, {len(passed)} passed, {len(failed) - len(unexpected)} expected failures, "
          f"{len(unexpected)} unexpected failures, {len(fixed)} listed but passing, {len(skipped)} skipped")
    print('evidence:', env['AI8_TEST_EVIDENCE_DIR'])
    for r in unexpected:
        print('UNEXPECTED FAIL', r['file'], r['rc'])
    for r in fixed:
        print('NOW PASSES (remove from LAB_EXPECTED_FAILURES.json)', r['file'])
    if args.out:
        Path(args.out).write_text(json.dumps({'skipped': skipped, 'results': results}, indent=1), encoding='utf-8')
    return 1 if unexpected else 0


if __name__ == '__main__':
    sys.exit(main())
