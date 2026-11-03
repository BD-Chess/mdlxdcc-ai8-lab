# Running the lab test suite

The JavaScript suite is 282 files. Each file runs in its own `node` process:

- `tests/**/*.mjs` and `tests/**/*.cjs`;
- `public/**/*.test.{mjs,cjs,js}` (the two chess trees keep their own research tests).

Fixtures and `node_modules` are skipped. A file named `*.test.*` runs as `node --test <file>`; every other file runs as `node <file>`.
The browser scripts in `public/*/research/*-browser.cjs` are not run directly. `tests/chess-current-browser.cjs` drives three of them.

AGENTS.md says `LONG_TEST_GATE = EXPLICIT_BD_APPROVAL_REQUIRED`. A full run takes about 10 minutes with 4 workers, so ask first.

## 1. Install what the tests need

```sh
npm ci                                               # jsdom, @electric-sql/pglite (declared devDependencies)
npm i --no-save fake-indexeddb@6.2.7 playwright-core@1.63.0   # used by tests, not declared in package.json
npm ci --prefix functions                            # tests import functions/*.mjs, which need sharp, openai, pg, ...
```

- `--no-save` keeps `package.json` and `package-lock.json` unchanged. Adding these two as `devDependencies` needs BD's approval.
- About 40 browser scripts `require('playwright')`, the full package. Install it the same way (`npm i --no-save playwright@1.63.0`) unless a global install is on `NODE_PATH`.
- Provider SDKs are imported, but every provider call in the suite is mocked. A run makes no paid model or API calls.

Browsers:

- **Chromium.** Point the browser tests at a Chromium or Chrome binary. Each test reads one of these variables:
  ```sh
  CH=/path/to/chrome     # e.g. $PLAYWRIGHT_BROWSERS_PATH/chromium-1243/chrome-linux64/chrome
  export CHROME_PATH=$CH ANDALUZIJA_TEST_CHROMIUM=$CH CHESS_BROWSER_EXECUTABLE=$CH CHESS_QA_CHROMIUM=$CH GAME_GUIDE_BROWSER=$CH
  ```
  `tests/run_lab_suite.py --chromium "$CH"` sets all five for you.
- **WebKit.** Seven tests also launch Playwright WebKit (`npx playwright install webkit`). Without it they fail after their Chromium part.
- **Preview server.** `tests/crosswords-unified-browser.cjs` needs `scripts/serve_lab.py` and reads its URL from `CW_BASE_URL`. The runner starts that server on a free port.

Python tests (`tests/test_*.py`): `pip install pytest cryptography`, then:

```sh
python3 -m pytest -q -p no:cacheprovider tests/test_*.py
```

## 2. Run

```sh
python3 tests/run_lab_suite.py --chromium "$CH" --out /tmp/lab-tests.json   # whole suite, 4 workers
python3 tests/run_lab_suite.py tests/llms-page.test.cjs                      # selected files
node --test tests/llms-page.test.cjs                                         # one file by hand
```

The runner compares each result with `tests/LAB_EXPECTED_FAILURES.json`:

- **exit code 1:** a file failed that is not on the list;
- **"NOW PASSES":** a listed file passed. Remove its entry from the list.

The list marks some entries `"skip": true`: the live production smokes and a server that never exits. The runner does not start those unless you pass `--all`.

## 3. Keep test output out of the repo

Many browser tests save screenshots and receipts in `*-evidence/` folders, by default in the current directory (the repo root).

- Set `AI8_TEST_EVIDENCE_DIR=/some/tmp/dir` to put all of them under that folder instead. The runner does this with a new temp folder unless you set it yourself.
- Per-test variables still win: `START_QA_EVIDENCE`, `CURRENT_PROMOTION_EVIDENCE`, `SUDOKU_EVIDENCE_DIR`, `MULTIAPP_EVIDENCE_DIR`, `BD_HOME_TEST_EVIDENCE`, `CW_EVIDENCE_DIR`, `LANDING_QA_EVIDENCE`, `CHESS_CURRENT_EVIDENCE_DIR`.
- The Andaluzija browser tests write to `../evidence`, `../navigation-evidence` and `../roads-evidence`, which is outside the repo. Use `ANDALUZIJA_EVIDENCE_DIR` to move them. `tests/andaluzija-acceptance.mjs` always writes to `../evidence`.

After any run, check `git status --short` and delete leftover `*-evidence/` folders before committing. None of them is in `.gitignore`.

## 4. Expected failures in the lab

`tests/LAB_EXPECTED_FAILURES.json` lists every file that fails in the lab, each with a `class` and a `reason`.

| `class` | Meaning |
|---|---|
| `lab-exclusion` | The test reads a file that the lab leaves out on purpose (`LAB_EXPORT_PLAN_R1` and `SYNC_R2` `excluded`, for example `public/_redirects`). |
| `needs-upstream-history` | The test runs `git show` on bd-chessdb commits. The lab is a snapshot without history. |
| `fixture-removed-upstream` | The test reads an archive file that bd-chessdb itself no longer ships, such as `public/Trip/old/003/*`. |
| `stale-expectation` | The app changed on purpose, and the test still expects the old behaviour. The test needs an owner rewrite. |
| `stale-harness` | The vm or jsdom harness no longer matches the app structure, and a small stub does not fix it. |
| `current-lags-lab` | A `public/chess` test fails because `public/chess/js` is older than `public/chess-lab/js`. It passes once LAB is promoted. |
| `live-smoke` | The test contacts the production site or needs a release receipt (`skip`). |
| `not-a-test` | A helper server that never exits (`skip`). |
| `webkit` | Needs Playwright WebKit. |
| `unknown` | Not debugged yet: a focus or modal assertion in jsdom, a browser timeout, or a layout check. |
| `real-bug` | Most likely a product bug. See the report for details. |
| `flaky` | Fails only sometimes, for example when the machine is under load. |
