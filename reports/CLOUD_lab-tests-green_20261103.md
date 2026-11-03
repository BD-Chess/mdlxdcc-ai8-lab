# CLOUD lab tests green, 2026-11-03

Branch `cloud/lab-tests-green-20261103`, based on `cloud/p0-1-fix-20261103` (PR #10, `d18f9f1`). The input was the health report from PR #15, `reports/CLOUD_lab-health_20261103.md` on `cloud/lab-health-20261103`.

Only tests, test documentation and lab records change. No application code changes (`public/**` apart from `research/*.test.*`, `functions/**`, `scripts/**`). `package.json` and the lockfile are also unchanged.

## Summary

- **The JS suite on this base goes from 192 to 204 passing files out of 282.** Both runs used the same setup and runner.
- None of the remaining 78 failures is unexplained. Each is listed in `tests/LAB_EXPECTED_FAILURES.json` with a class and a reason.
- `python3 tests/run_lab_suite.py` runs the whole suite reproducibly. It exits 1 only on a failure that is not on the list.
- Tests no longer need to write `*-evidence/` folders into the repo: `AI8_TEST_EVIDENCE_DIR` moves them, and the runner sets it.
- 2 failures are probably real bugs. They are unchanged, and both were already reported in PR #15. See the last section.

## Done

**Commit `76c10d2`: tests.** 31 exported test files changed, and 3 files were added under `tests/`.

### Stale tests fixed (mechanical)

| File | Change | Result |
|---|---|---|
| `public/chess/research/gemini-endpoint.test.mjs`, `public/chess-lab/research/gemini-endpoint.test.mjs` | Import depth `../../../../functions/` → `../../../functions/`. The old path pointed outside the repo. The provider `fetch` is mocked. | 0/1 → **3/3** in each tree |
| `public/chess/research/versioning.test.mjs`, `public/chess-lab/research/versioning.test.mjs` | Same depth fix for all 6 paths | Still fails. The test is obsolete (see below). |
| `tests/chess-pwa-integration.test.cjs:11` | Declares `const path=require('node:path')` | It no longer crashes at load. The CURRENT lane now boots and fails on a stale expectation (see below). The LAB lane never settles (pending promise), like `chess-lab/research/lab-integration`. |
| `tests/trip-stops.test.mjs` | vm context gets `location:{hostname:'www.mdlxdcc.org'}`. A non-Pages host keeps server mode, as before `PAGES_ONLY` existed. | 0/7 → **7/7** |
| `tests/trip-new-stops.test.mjs` | The same `location` stub (in 2 contexts), plus no-op stubs: `removeAttribute`, `addEventListener`, `append`, `document.createTextNode`, `querySelectorAll` | 1/39 → **39/39** |
| `tests/llms-page.test.cjs` | The allowlist accepts `chats.html` (upstream `5e28075`, "Add AI chat comparison"). The secret-pattern check now also scans `chats.html`. | 2/3 → **3/3** |
| `tests/chess-top-picks-anchor.test.mjs` | Fixture paths `public/chess/new/` → `public/chess-lab/`, where the LAB tree now lives | 0/1 → **5/5** |
| `tests/chess-top-picks-pwa.test.cjs` | LAB lane `public/chess/new` → `public/chess-lab` (suffix `/chess-lab/`, as in `chess-pwa-integration`) | Both lanes now load. Both still fail on the catalog order (see below). |
| `tests/dualframe-lazy-browser.mjs:8` | `executablePath: process.env.CHROME_PATH \|\| <the Windows path>`. The default is unchanged. | It runs on Linux now. It times out like the other DualFrame browser tests (class `unknown`). |

No assertion was removed or loosened.

### The 9 outdated `public/chess/research` copies, decided per file

I traced each test with `strace` (openat) to find every file under `public/chess/` that it reads, and compared each of those files with its `public/chess-lab` twin.

| File | Code under test | Decision | Result |
|---|---|---|---|
| `deep-ui.test.cjs` | identical (`8zc-deep-ui.js`, `8zc-eval-bar.js`, `8zc-engine-registry.js`, `8zc-deep.css`, `chess.min.js`) | Replaced by the chess-lab copy | 6/8 → **17/17** |
| `engine-cards.test.cjs` | identical (`8zc-engine-cards.js`) | Replaced by the chess-lab copy | 14/16 → **17/17** |
| `eval-bar.test.cjs` | identical (`8zc-eval-bar.js`, `8zc-engine-registry.js`, `chess.min.js`) | Replaced by the chess-lab copy. Its WDL fixture is read from `../../chess-lab/research/fixtures/`, because `public/chess/research` has no `fixtures/` folder and adding one is outside test-file scope. | 9/10 → **14/14** |
| `r11-neural-overlay.test.cjs` | identical where it matters. `8zc-utils.js` differs between the trees, but the two slices the test runs (`annotateMove`…`highlightLast`, `showAnalysisCandidates`…`fetchAnnotations`) are byte-identical. | Replaced by the chess-lab copy | 1/4 → **6/6** |
| `tournament-core.test.cjs` | identical (`8zc-tournament-core.js`, `chess.min.js`, the PGN) | Replaced by the chess-lab copy | 7/8 → **8/8** |
| `analysis-session.test.cjs` | differs (`8zc-analysis-session.js`, `8zc-deep-engine.js`) | Unchanged. Class `current-lags-lab`. | 13/18 |
| `evidence.test.cjs` | differs (`8zc-evidence.js`) | Unchanged. `current-lags-lab`. | 6/7 |
| `game-review-ui.test.cjs` | differs (the whole page; 24 of the 43 files it reads) | Unchanged. `current-lags-lab`. | 0/2 |
| `mobile-unified.test.cjs` | differs (`index.html`, `app/index.html`, `app-mobile.{js,css}`, `8zc-language.js`) | Unchanged. `current-lags-lab`. | 2/6 |

In every row, the chess-lab twin passes on this base. The five aligned files are now byte-identical to their chess-lab copies. The one exception is the fixture path in `eval-bar`.

### Reproducible suite

- **`tests/README.md`** explains how to run the suite:
  - install the extra packages: `npm i --no-save fake-indexeddb@6.2.7 playwright-core@1.63.0`, then `npm ci --prefix functions`;
  - install the full `playwright` package, or use a global one;
  - set the five browser path variables, install WebKit, and start the preview server for the crosswords test;
  - Python: `pip install pytest cryptography`;
  - keep evidence out of the repo, and read the meaning of each expected-failure class.
- **`tests/run_lab_suite.py`** finds the 282 files the same way as the health run and runs each in its own process (`node --test` or `node`).
  - It sets `AI8_TEST_EVIDENCE_DIR`, `CW_BASE_URL` (it starts `scripts/serve_lab.py` on a free port) and, with `--chromium`, the five browser variables.
  - It compares the results with the list. Unexpected failures make it exit 1, and listed files that now pass are reported.
  - Entries marked `skip` are not started without `--all`: 3 live production smokes and 1 server that never exits.
- **`tests/LAB_EXPECTED_FAILURES.json`** has 79 entries: the 78 failing files plus 1 flaky file. Each has a `class` and a `reason`.

### Evidence folders

These 16 tests now honour `AI8_TEST_EVIDENCE_DIR`:

- `start-app`, `four-current`, `sudoku-app-boot-r4`, `sudoku-app-solve-playback-r5`, `multiapp-preview` and `bd-home-links` (all `-browser.cjs`);
- `browser-p0-smoke`;
- `dfc-cmarvel-source`, `dfc-reader`, `dfc-text`, `dfc-text-live`, `dualframe-lazy`, `dualframe-private-owner`, `dualframe-sync` and `andaluzija-portrait-corrections` (all `-browser.mjs`);
- `andaluzija-roads-live-smoke`.

When the variable is set, each test writes its folder (same name as before) under it. When it is unset, behaviour is unchanged. Per-test variables such as `START_QA_EVIDENCE` still take precedence.

Verified: the full run with the variable set left no folder in the repo root. All folders were created under the scratch folder.

### Records

- **`lab-evidence/LAB_CHANGES_R7.json`** records the 31 changed files that `SOURCE_MANIFEST_R2` lists, with commit `76c10d2` and PR #21.
- `tests/browser-p0-smoke.mjs` already has a row in `LAB_CHANGES_R2` (PR #10). The R7 row adds the new lab hash.
- The 3 new files are not in the manifest, so they need no row.

## Verified by test

**Setup, the same in all runs:**

- Node v22.23.4, one process per file, 4 workers, 300 s timeout.
- `fake-indexeddb@6.2.7` and `playwright-core@1.63.0` installed with `--no-save`, and `functions/node_modules` present.
- The browser variables point at Chromium 153 (Playwright `chromium-1243`), and `CW_BASE_URL` is served by `scripts/serve_lab.py`.
- WebKit is not installed (the proxy blocks the download).

**Before** is the base `d18f9f1`. The container disk was briefly full during that run: 2 files hit ENOSPC, and I re-ran them both (both pass). **After** is `76c10d2`.

### Before and after, by class

| Class | Before | After | What changed |
|---|---:|---:|---|
| **Pass** | **192** | **204** | +12 |
| Stale: wrong import depth | 4 | 0 | 2 pass (gemini). The 2 `versioning` tests moved to stale expectation (obsolete). |
| Stale: bug in the test code (`path`) | 1 | 0 | Fixed. The file moved to stale expectation. |
| Stale: fixture path | 7 | 0 | 1 passes (`top-picks-anchor`). `top-picks-pwa` moved to stale expectation. `trip-promotion` moved to lab exclusion. 4 moved to fixture-removed-upstream. |
| Stale: `public/chess` copy not updated | 9 | 0 | 5 pass (aligned). 4 moved to `current-lags-lab` because their code differs. |
| Stale: harness lacks globals (`stale-harness`) | 16 | 14 | 2 pass (Trip). The 14 chess research harnesses need more than a stub (see below). |
| Stale: expectation predates a change (`stale-expectation`) | 13 | 16 | `llms-page` passes. Added: `versioning` ×2, `chess-pwa-integration`, `chess-top-picks-pwa`. `browser-p0-smoke` (the "fixed by PR #10" row in PR #15) is counted in both columns. |
| `fixture-removed-upstream` | — | 4 | `study-w0` ×2, `sudoku-app-preview`, `trip-deep-search` |
| `lab-exclusion` | 9 | 10 | + `trip-promotion` (it reads the excluded `public/_redirects`) |
| `needs-upstream-history` | 3 | 3 | |
| `current-lags-lab` | 4 | 8 | + the 4 copies whose code differs |
| ENV `webkit` | 7 | 7 | |
| ENV `live-smoke` (skipped by the runner) | 3 | 3 | |
| ENV `not-a-test` (skipped by the runner) | 1 | 1 | |
| ENV hard-coded Windows path | 1 | 0 | It runs now and times out, so it moved to `unknown`. |
| `unknown` (focus/modal 4, browser timeout 3→4, layout 2) | 9 | 10 | |
| `real-bug` | 2 | 2 | Unchanged (see below) |
| `flaky` | 1 | 0 | `chess-lab/research/r11-dcc-link-score` failed once under load. It passes alone and passed in the after run. |
| **Not passing** | **90** | **78** | |

Notes on the before column:

- The base already contains PR #10, so the three `game-guide*` files pass in both columns.
- `crosswords-unified-browser` passes with its preview server, as in PR #15.

### Final run with the documented runner

`python3 tests/run_lab_suite.py --workers 4 --chromium <Chromium 153>` on `76c10d2`, with `AI8_TEST_EVIDENCE_DIR` pointed at a scratch folder:

- **278 run, 204 passed, 74 expected failures, 0 unexpected failures, 4 skipped**, exit code 0;
- the 4 skipped files are the 3 live smokes and the server that never exits;
- the flaky `r11-dcc-link-score` passed;
- no `*-evidence/` folder appeared in the repo.

### Other checks

- `node --check` passes for every `tests/*.mjs` and `tests/*.cjs` file.
- `python3 scripts/verify_lab.py` reports **PASS**. `lab-evidence/VALIDATION_R1.json` was restored with `git checkout --` before the commit.
- Python: `uvx --with cryptography pytest -q -p no:cacheprovider tests/test_*.py` gives **150 passed**. Nothing changed here; this only confirms the README instructions.
- `git status` was checked after each run. The untracked `*-evidence/` folders from the before run, an empty `roads-release-evidence/`, and the `__pycache__` folders were deleted before committing.

## Why some stale tests are left failing

These are judgement calls for BD or the code owner. A small stub or a path change does not fix them, and changing their expectations would mean rewriting the test.

- **`stale-harness` (14).** These are the chess research vm and jsdom harnesses in both trees: `analysis-source`, `top-five`, `cache-evidence`, `dcc-move-click`, `collection-dynamic`, `play-reliability` and `lab-integration`.
  - `analysis-source` and `top-five` would also need their expectations changed. They assert that Stockfish runs automatically in Auto mode, but the app keeps engines lazy on purpose, so a `window` stub alone does not make them pass.
- **`stale-expectation` (16), in particular:**
  - The `versioning` tests are obsolete. `tools/chess-versioning.mjs` no longer exports `nextArchive`, and `public/chess/{old,new}` are gone in bd-chessdb too. `tests/chess-versioning.test.mjs` replaces them.
  - `chess-pwa-integration` (CURRENT lane) and `chess/research/lab-integration`: `btnGames` no longer opens `popularGamesPanel`, because the library moved into the desktop view model (`8zc-lab-layout.js`). The LAB lane never settles.
  - `chess-top-picks-pwa`: the catalog gained "Dreev–Kasparov: whole-game review (V4)", so TCEC S27 is now result 9, not 6.
  - `browser-p0-smoke`: the scripted mock model predates the R3.3+ guide protocol, which PR #10 already noted.
    - The handler answers `ask_understanding` with `UNKNOWN_IDEA` ("call assess_challenge now").
    - The mock keeps asking until `ROUND_LIMIT`, so `r1` stays hidden.
    - This is a test-side problem. The handler follows its own rule.
  - The rest come from PR #15:
    - `source-context-integration`, `study-load-integration` and `r8-time-budget` (lazy engines);
    - `sudoku-picker-settings` (namespace unification);
    - `kdosva-reader` (23 highlights);
    - `dualframe-album` (re-encrypted file);
    - `preai8-wl-static` (the strings it asserts are no longer in `public/WL`);
    - `chess-lab-deep-gui` (markup).
- **`fixture-removed-upstream` (4).** No real file exists to point to.
  - `public/Trip/old/003/*.js` and `public/S/app/old/003/app.html` are reduced to `index.html` in bd-chessdb too.
  - `study-w0` needs the old 20-Study reader. Pointing it at `public/chess/js` was tried: that file is a newer reader, and `ChessStudyUI` is undefined after loading it. The change was reverted.

## Not verified

- The WebKit half of 7 browser tests. The Playwright WebKit download is blocked.
- The 3 live smoke tests. They are skipped by design. Only `node --check` was run on the 2 that I changed for `AI8_TEST_EVIDENCE_DIR`, `andaluzija-roads-live-smoke` and `dfc-text-live-browser`.
- Root causes of the 10 `unknown` files: jsdom focus/modal, browser timeouts and Linux layout. `dualframe-lazy-browser` now gets far enough to time out like `dualframe-sync-browser`. It was not debugged further.
- The same fixes would apply to bd-chessdb, whose test files are identical. They were not run there, because bd-chessdb is read-only.
- Whether the `public/chess` CURRENT code will be promoted from chess-lab. That decides whether the 8 `current-lags-lab` files are pending work or need their tests moved.

## Proposed changes needing BD approval

1. **`package.json` `devDependencies`:** `"fake-indexeddb": "6.2.7"`, `"playwright-core": "1.63.0"`, and optionally `"playwright": "1.63.0"` (about 40 browser scripts `require('playwright')`), plus a lockfile update.
   - Also `"scripts": {"test": "python3 tests/run_lab_suite.py"}` in place of the npm placeholder.
2. **`requirements-dev.txt`:** `pytest`, `cryptography`. Eight Python files need `cryptography`, and nothing declares it.
3. **A non-publishing check workflow.** `.gitignore` currently allows only `lab-pages.yml`, so it needs an exception there. It would run on pull requests and pushes to `lab/*`:
   ```yaml
   - run: npm ci && npm i --no-save fake-indexeddb@6.2.7 playwright-core@1.63.0 playwright@1.63.0 && npm ci --prefix functions
   - run: npx playwright install --with-deps chromium webkit
   - run: python3 scripts/verify_lab.py && git checkout -- lab-evidence/VALIDATION_R1.json && python3 scripts/check_secret_boundary.py
   - run: pip install pytest cryptography && python3 -m pytest -q -p no:cacheprovider tests/test_*.py
   - run: python3 tests/run_lab_suite.py --chromium "$(node -p "require('playwright-core').chromium.executablePath()")"
   ```
   - Pin the actions to SHAs, use `permissions: contents: read`, and set a 30-minute timeout.
   - The job is green when there are no unexpected failures.
4. **`.gitignore`:** add `/*-evidence/` and `/evidence/`, as a safety net for runs without `AI8_TEST_EVIDENCE_DIR`. Optionally make the variable the default in the tests, writing under `os.tmpdir()`.
   - `tests/andaluzija-acceptance.mjs` always writes to `../evidence`, outside the repo. It needs the same variable.
5. **Owner rewrites:** the 14 `stale-harness` and 16 `stale-expectation` files, with `browser-p0-smoke` first because it guards the game guide.
   - Decide whether `public/chess/research` should keep its own test copies, or whether they should be generated from chess-lab or deleted. 8 of them lag the code.
6. **Upstream:** port the mechanical fixes to bd-chessdb, where the same files are identical: the import depths, `path`, the Trip stubs, the `llms` allowlist and the top-picks paths.

## Remaining real-bug failures (application code, not changed here)

1. **`tests/landing-header-search-browser.cjs`, "One header row at 320". The lab introduced this.** With 9 utility controls, the lab atlas header wraps to 2 rows (127 px). Production has 8 controls on one row (80 px). The lab change is in `public/index.html` (`LAB_CHANGES_R1`, PR #5). This is PR #15 finding 1.
2. **`tests/nara-revisions.test.mjs:18`. Probably an upstream bug.** The Nara Daily page (`scripts/nara-daily.mjs`, `dailyCard`) shows no revision notice, while the monthly, archive and log pages do.

The 10 `unknown` files might hide more bugs, most plausibly the 4 chess-lab focus/modal a11y assertions (for example `p1-state.test.cjs:60`). Each needs one real-browser session to decide.
