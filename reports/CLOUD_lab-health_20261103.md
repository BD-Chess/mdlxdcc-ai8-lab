# CLOUD lab health report, 2026-11-03

Branch `cloud/lab-health-20261103`, based on `cloud/lab-baseline-fix-20261103` (PR #8, commit `2547f47`).
This PR only adds this report and `CLOUD_lab-health_20261103.json`. It changes no code and no tests.

## Findings, most valuable first

1. **The lab broke the atlas header on phones. This is a real bug that the lab introduced.**
   `tests/landing-header-search-browser.cjs:26` checks "One header row". In Chromium it fails on the lab's `public/` and passes on `bd-chessdb` d9c0242 `public/`. Both were served by the same static server.
   - Measured with Chromium at 320, 360, 390, 402 and 430 px. The lab header has 9 utility controls and wraps to 2 rows, so it is 127 px tall. The brand and the tools are 56 px apart vertically.
   - Production has 8 controls on one row, and the header is 80 px tall.
   - `public/index.html` is the only lab change on this page (`LAB_CHANGES_R1`, commits `4eafe65` and `d3880f4` from PR #5, merged in `fb39acd`).
2. **Most failing tests are out of date. They are not product bugs.** There are 282 JS test files.
   - The coordinator's run on the p0 branch passed 164 of them.
   - After the environment setup described below, 190 pass on this base.
   - Of the 92 that still fail: 53 are stale tests, 12 depend on paths the lab excludes on purpose (or on upstream git history), 12 cannot run in this container, and 4 are "CURRENT lags LAB" drift between the two chess trees.
   - 10 are UNKNOWN, 1 is the lab regression above, and 1 is a likely upstream bug (Nara Daily drops revision notices).
   - The lab files are byte-identical to production (`verify_lab` PASS). So every failure except the header regression should also occur on `bd-chessdb` d9c0242. This is inferred, not run.
3. **Some dependencies are undeclared, so a fresh clone cannot run the tests.**
   - `fake-indexeddb` and `playwright-core` are missing from `package.json`. Installing them makes 24 test files pass.
   - Root tests import `functions/` packages (`sharp` and others). They need `npm ci` in `functions/`, and nothing documents this. 13 or more files fail without it.
   - Eight Python files need `cryptography` (directly or through `wl_codec`), and no requirements file declares it. Without it, 3 pytest files fail to collect. With it, all 150 Python tests pass.
4. **CI publishes but checks nothing.**
   - The only workflow builds and deploys Pages. No workflow runs `verify_lab.py`, `check_secret_boundary.py` or any test on push or PR.
   - `.gitignore` excludes every other workflow file, so adding a check job needs a BD decision.
   - The workflow pins its actions to a major version tag, not to a commit SHA.
5. **The two chess trees drift apart.** `public/chess` (CURRENT) and `public/chess-lab` (LAB) each have their own copy of most tests.
   - 9 `public/chess/research` tests are older copies of chess-lab tests that were updated and now pass.
   - 4 tests are byte-identical in both trees but pass only against chess-lab code.
   - The two trees share 360.8 MB of duplicate files.
6. **Some housekeeping problems can cause accidental commits or noise.**
   - Tests write 9 untracked `*-evidence/` folders into the repo root, and none of them are gitignored.
   - `verify_lab.py` rewrites the tracked `lab-evidence/VALIDATION_R1.json` on every run.
   - Two browser tests hard-code Windows paths.
   - The README does not describe the R2 records that `verify_lab` now reads, or how to run the tests.
7. **No secrets were found** (high-confidence formats) in the full history of all 25 refs. All 37 generic matches are false positives. **`npm audit` reports 0 vulnerabilities** in root and in `functions/`.

## Done

- Installed `fake-indexeddb@6.2.7` and `playwright-core@1.63.0` with `npm i --no-save`. `package.json` and `package-lock.json` were not changed. The `playwright-core` version matches the Playwright that ships Chromium 1243.
- Run 1: all 282 JS test files on this base, with the same method as the coordinator (one `node` or `node --test` process per file).
- Run 2: the 109 files that failed in run 1 again, this time with:
  - `functions/node_modules` available;
  - the browser path variables the tests read (`CHROME_PATH`, `ANDALUZIJA_TEST_CHROMIUM`, `CHESS_BROWSER_EXECUTABLE`, `CHESS_QA_CHROMIUM`, `GAME_GUIDE_BROWSER`) pointed at Chromium 153.
- Classified each remaining failure. The per-file list is in `reports/CLOUD_lab-health_20261103.json`.
- Ran `npm outdated` and `npm audit` (root and `functions/`), plus a Python import inventory.
- Fetched all branches from origin again, then re-ran the full-history secret scan.
- CI review with the REST API (`gh api .../actions/runs`).
- Hygiene checks:
  - `verify_lab.py`;
  - `check_secret_boundary.py`;
  - large and duplicate files;
  - case collisions;
  - backup files;
  - README and AGENTS.md compared with the scripts.
- Deleted the untracked test output (9 `*-evidence/` folders, `__pycache__`) before committing.

## Verified by test

### Test failures by class

| Class | Files | Example (file:line) |
|---|---:|---|
| Pass with no setup (same as the coordinator's run) | 148 | — |
| Pass after root dev deps installed (`fake-indexeddb`, `playwright-core`) | 24 | `public/chess-lab/research/full-game-resume.test.cjs`, `tests/dualframe-sync.test.mjs` |
| Pass, but a fresh worktree also needs `functions/` deps | 13 | `tests/dualframe-v3.test.mjs` fails with "Cannot find package 'sharp'" without them |
| Pass after browser path env vars (3 files) or `functions/` deps (1 file) | 4 | `tests/andaluzija-page-browser.mjs` (default `/tmp/andaluzija-test-runtime/chromium`) |
| Pass with a local preview server | 1 | `tests/crosswords-unified-browser.cjs` with `CW_BASE_URL` pointing at `scripts/serve_lab.py` |
| **Subtotal passing** | **190** | |
| Stale: vm/jsdom harness lacks globals the app now uses | 16 | `public/Trip/app.js:10` reads `location.hostname`, but the harness at `tests/trip-stops.test.mjs:25` has no `location`. With a 1-line stub (scratch copy): trip-stops 7/7 and trip-new-stops 26/39 pass. Also `public/chess-lab/js/8zc-utils.js:1768` calls `window.ChessEngineRegistry` inside a source slice that has no `window`. |
| Stale: the expectation predates an intentional change | 12 | `tests/llms-page.test.cjs:61` has an allowlist without `chats.html`, which upstream ships. `tests/sudoku-picker-settings.test.cjs:150` expects lane separation that `public/S/new/presentation/bootstrap.js:3` removes on purpose (namespace unification). `public/chess-lab/research/source-context-integration.test.cjs:118` expects SF to start when the selector changes; the app keeps engines lazy, which the passing chess-lab `analysis-session` test requires. |
| Stale: `public/chess` copy not updated (the chess-lab twin was updated and passes) | 9 | `public/chess/research/eval-bar.test.cjs:17` expects `qToCp(0.3)=57`. `public/chess-lab/research/eval-bar.test.cjs:62` expects 22. `8zc-eval-bar.js` is identical in both trees. |
| Stale: fixture path does not exist upstream either | 7 | `public/chess-lab/research/study-w0.test.cjs:154` resolves `public/js/chess.min.js`. `tests/trip-deep-search.test.mjs` reads `public/Trip/old/003/*`, but upstream keeps only `index.html` there. |
| Stale: wrong relative import depth | 4 | `public/chess/research/gemini-endpoint.test.mjs:3` uses `../../../../functions/...`, which points outside the repo. The same line is in bd-chessdb. |
| Stale: already fixed by PR #10 (not in this base) | 4 | `tests/game-guide*.test.mjs` and `tests/browser-p0-smoke.mjs` expect the old invitation text. |
| Stale: bug in the test code | 1 | `tests/chess-pwa-integration.test.cjs:11` uses `path`, which is never declared. |
| Lab exclusion: the file is excluded on purpose | 9 | `tests/mdlxdcc-root-pwa.test.cjs` needs `public/_redirects`. `tests/dfc-hybrid-ui.test.mjs` needs `public/Nara/dualframe-lab/release.json`. Both are listed in `LAB_EXPORT_PLAN_R1` or `SYNC_R2` `excluded`. |
| Lab exclusion: needs upstream git history | 3 | `tests/dfc-text-layers.test.mjs` runs `git show` on upstream commit `73353ef`. The lab is a snapshot without history. |
| Environment: Playwright WebKit not installed (download blocked) | 7 | `tests/bd-home-links-browser.cjs`. Its Chromium part printed 16 PASS lines before the WebKit launch failed. |
| Environment: live or production smoke test | 3 | `tests/andaluzija-roads-live-smoke.mjs` needs a release receipt and the live site. |
| Environment: hard-coded Windows browser path, no override | 1 | `tests/dualframe-lazy-browser.mjs:8` |
| Environment: not a test (a server that never exits) | 1 | `tests/andaluzija-local-server.mjs` |
| CURRENT lags LAB: the same test passes on chess-lab code but fails on `public/chess` code | 4 | `public/chess/research/sim-store.test.cjs` (the test is identical in both trees; `js/8zc-sim-store.js` differs) |
| UNKNOWN: focus/modal assertions (a real a11y bug, or a jsdom limit) | 4 | `public/chess-lab/research/p1-state.test.cjs:60`: after ArrowRight on a tab, the focused element no longer has `aria-selected`. Failed the same way in both runs. |
| UNKNOWN: browser `waitForFunction` timeout (not debugged) | 3 | `tests/andaluzija-ai-browser.mjs`, `tests/dfc-text-browser.mjs`, `tests/dualframe-sync-browser.mjs` |
| UNKNOWN: browser layout (a real bug, or Linux font metrics) | 2 | `tests/chess-current-browser.cjs`: "520-500-14px-light-compact reachable library". `tests/multiapp-preview-browser.cjs`: chess `#main` overflows its parent at 375×874. |
| **Real bug, introduced by the lab** | 1 | `tests/landing-header-search-browser.cjs:26` (see finding 1) |
| **Probable upstream bug** | 1 | `tests/nara-revisions.test.mjs:18`: the Daily page (`scripts/nara-daily.mjs:186`, `dailyCard`) shows no revision notice. The monthly, archive and log pages do. |
| **Total** | **282** | 190 pass, 92 do not |

What happened to the coordinator's two largest classes:

- **"Missing dev dependency" (44 files):**
  - 24 now pass;
  - 1 passes once `functions/` deps are present;
  - 4 are UNKNOWN focus tests;
  - 4 are stale expectations;
  - 1 is a stale `public/chess` copy;
  - 1 is a stale fixture path;
  - 2 are CURRENT lags LAB;
  - 3 are lab exclusions (2 excluded files, 1 needs history);
  - 1 is a live test;
  - 1 is a Windows path;
  - 2 are browser timeouts.
- **"Assertion failure" (41 files):**
  - 16 have stale harnesses;
  - 8 have stale expectations;
  - 8 are stale `public/chess` copies;
  - 2 are stale fixture paths;
  - 1 is a test code bug;
  - 2 are CURRENT lags LAB;
  - 3 are lab exclusions (2 excluded files, 1 needs history);
  - 1 is the probable Nara bug.

On this base, 3 `tests/game-guide*` files fail that passed in the coordinator's run. That is expected: the coordinator ran on the PR #10 branch, which fixes them.

### Other checks

- **Python:** `pytest` on `tests/test_*.py` (5 files):
  - Without `cryptography`, 3 files fail at collection with `ModuleNotFoundError`.
  - With `cryptography` supplied by `uvx --with cryptography pytest`, all 150 tests pass.
- **Lab scripts:**
  - `python scripts/verify_lab.py` reports PASS: 5,363 source files hash-verified, 73 intentionally removed, 3,788 text files scanned.
  - `python scripts/check_secret_boundary.py` reports PASS.
- **Secret scan:** the full history of 25 refs was scanned again after `git fetch origin '+refs/heads/*:refs/remotes/origin/*'`. The tool was `history_secrets.py`, which prints no values.
  - 4,585 unique blobs; 3,633 text blobs scanned. The 40 blobs of 6 MB or more were skipped; all are binary (`.wasm`, `.mp3`, `.nnue`, `.nn`, `.png`, chunk parts).
  - 0 matches for AWS, GitHub, Google, OpenAI, Anthropic, Slack, Stripe or Netlify keys, private keys, JWTs, or credentials in a database URL.
  - The 37 generic matches are exactly the coordinator's set. All are false positives:
    - 11 are a `secret` key that maps to a page path, in `public/index.html` and its 7 `index*bck2x` backups;
    - 1 is an `autocomplete` value in `public/assets/mdlxdcc-guide/guide.js:102`;
    - 25 are synthetic fixtures in tests, including 1 placeholder database URL. One of these sits in a path that PR #6 removes.
- **npm audit:** 0 vulnerabilities in root (100 deps) and in `functions/` (100 deps). Re-run today.
- **Header regression:** confirmed twice. The test was pointed at a static server for each `public/`, and a separate Chromium probe measured the header (numbers in finding 1).

### Dependencies (`npm outdated`, 2026-11-03)

| Location | Package | Pinned | Latest |
|---|---|---|---|
| root | `@electric-sql/pglite` (dev) | 0.5.10 | 0.5.15 |
| root | `@netlify/blobs` | 8.2.0 | 11.1.7 (major) |
| root | `@netlify/blobs-andaluzija` (alias of `@netlify/blobs`) | 11.1.4 | 11.1.7 |
| root | `jsdom` (dev) | 27.4.0 | 30.1.3 (major) |
| root | `node-fetch` | ^2.7.0 (2.7.0) | 3.3.2 (major, ESM-only) |
| functions | `@anthropic-ai/sdk` | 0.135.0 | 1.4.0 (major) |
| functions | `@netlify/blobs` | 11.1.4 | 11.1.7 |
| functions | `openai` | 7.39.0 | 7.47.0 |
| functions | `@netlify/identity`, `pg`, `sharp` | 2.0.0 / 8.23.1 / 0.35.5 | current |

Undeclared dependencies:

- **Node:**
  - `fake-indexeddb` (31 imports) and `playwright-core` (7 imports) are not in `package.json`.
  - `require('playwright')` (37 imports) works here only because Playwright is installed globally.
- **Python, `cryptography`:**
  - Direct imports: `scripts/wl_codec.py`, `scripts/wl_rules_guard.py`, `tests/test_wl_rules.py`.
  - Through `wl_codec`: `scripts/wl_legacy_step.py`, `tests/test_wl_codec.py`, `tests/test_wl_recovery.py`, `tests/test_wl_legacy_probe.py`, `scripts/wl_legacy_probe.py`.
- **Python, others:** `pytest`, `playwright` (7 files: 5 under `scripts/flip4m_violet/`, `tests/wl_live_test.py`, `tools/ai8_vision_r2/test_browser.py`) and `cairosvg` are also undeclared.
- **Python requirements files:** only `tools/chessbest_power/requirements.txt` (`chess`) and `tools/dualframe-ai-lab/requirements.txt` (`Pillow`) exist.

### CI and publishing

- **Workflow:** `.github/workflows/lab-pages.yml` is the only workflow.
  - It runs on push to `lab/bootstrap-r1` when `public/**`, `scripts/build_pages.py`, `scripts/lab_pages_runtime.js` or the workflow file changes, and on `workflow_dispatch`.
  - Permissions: `contents: read`, `pages: write`, `id-token: write`. Concurrency group `ai8-lab-pages`; 15-minute timeout.
  - Actions are pinned to a major version tag, not a SHA: `checkout@v4`, `setup-python@v5`, `configure-pages@v5`, `upload-pages-artifact@v3`, `deploy-pages@v4`.
  - It runs no tests and does not run `verify_lab`.
- **Runs** (`gh api repos/BD-Chess/mdlxdcc-ai8-lab/actions/runs`):
  - 8 runs in total. All were pushes to `lab/bootstrap-r1` between 2026-10-24 and 2026-10-26, and all succeeded.
  - The latest run (2026-10-26 17:34Z) built `fbdc1c8`, which is the current head of `origin/lab/bootstrap-r1`. The sync (PR #7) and the later PRs are not published yet.
- **Pages size:** the Pages artifact is 877.6 MB, against the 950 MB gate in `scripts/build_pages.py:132`. This is the coordinator's number, not re-measured here. See the separate Pages size report.
- **Pre-push hook:**
  - `.githooks/pre-push` allows only `https://github.com/BD-Chess/mdlxdcc-ai8-lab.git` and the SSH form. A remote URL without `.git` is rejected.
  - The hook only works if `core.hooksPath=.githooks` is set in each clone. It is set in this clone.

### Repository hygiene

- **Test output in the repo root:** one test run created 9 untracked folders: `bd-home-evidence/`, `browser-evidence/`, `corrections-release-evidence/`, `current-promotion-evidence/`, `evidence/`, `multiapp-evidence/`, `start-qa-evidence/`, `sudoku-r4-evidence/`, `sudoku-r5-evidence/`. None is gitignored, so `git add -A` would commit them.
- **`verify_lab.py` side effect:** every run writes `lab-evidence/VALIDATION_R1.json`, a tracked file. Today that changed `text_files_scanned` from 3787 to 3788. The name says R1, but the manifest is now R2.
- **README and AGENTS.md versus the scripts:**
  - The README still describes only the R1 snapshot. It does not mention `SOURCE_MANIFEST_R2`, `SYNC_R2`, `LAB_CHANGES_R*` or `REMOVALS_R*`, which `verify_lab.py` now reads.
  - Neither file says how to run the tests or which ones are expected to fail in the lab. `npm test` is the npm placeholder.
  - AGENTS.md says `TESTING = MINIMAL_REQUIRED_ONLY` and `LONG_TEST_GATE = EXPLICIT_BD_APPROVAL_REQUIRED`. This run was approved by the coordinator for this task.
- **Platform-specific paths:**
  - `tests/dualframe-lazy-browser.mjs:8` hard-codes `C:\Program Files\...\chrome.exe` with no override.
  - `tests/browser-p0-smoke.mjs:74` defaults to a Windows user-profile path; `GAME_GUIDE_BROWSER` overrides it.
  - Several other tests default to `/tmp/chromium` or `/usr/bin/google-chrome`.
- **Large and duplicate files:**
  - HEAD has 5,399 files and 1,558 MB. 16 files are over 10 MB, the largest are 20 MB chunk parts, and nothing is over 50 MB. The packfiles are 919.6 MiB.
  - 1,058 duplicate copies hold 450.8 MB of redundant bytes in HEAD:
    - 360.8 MB between `public/chess` and `public/chess-lab`;
    - 71.0 MB inside `public/Nara`.
  - Git stores each duplicate once, but the Pages artifact copies every duplicate.
- **Published leftovers:**
  - 30 backup HTML files are tracked (29 `public/index*bck*` pages plus `public/BD/O/index-bck1.html`, 4.9 MB). `build_pages.py` publishes all of them.
  - 184 research and test files (2.1 MB) under `public/*/research/` are also published; 182 of them are in the two chess trees.
- **Other:**
  - The root `index.html` is byte-identical to `IM3_MentalArena_MALm.html`.
  - No case collisions and no tracked files matched by `.gitignore` were found.

## Not verified

- The WebKit half of 7 browser tests. The Playwright WebKit download is blocked by the proxy. This status is UNKNOWN.
- Live and production smoke tests (3 files), which are out of scope for the lab.
- No tests were run inside `bd-chessdb`, because it is read-only and the tests write into the repo. "Also fails upstream" is inferred from hash equality. The one exception is the header test, which ran against production `public/` through a read-only static server.
- Root causes of the 10 UNKNOWN files: focus/modal, browser timeouts and layout. Each needs one real-browser session on BD's machine.
- `tests/browser-p0-smoke.mjs` after PR #10. It was not re-run on that branch with a Linux browser.
- GitHub Pages state from the Pages API. `/pages` and GraphQL are blocked by the proxy, so this is UNKNOWN. Only the Actions run conclusions were checked.
- Pages artifact size. The coordinator's 877.6 MB figure was reused, not rebuilt.
- Whether the chess-lab code is due to be promoted to `public/chess`. This decides whether the 13 chess drift files are stale tests or pending work.

## Open questions

1. Is the second header row in the lab atlas an accepted trade-off of PR #5 (a 9th display control)? If it is, `tests/landing-header-search-browser.cjs` should change. If not, `public/index.html` should.
2. Should `public/chess/research` keep its own copies of the chess tests? The alternatives are to generate them from `public/chess-lab/research` or to delete them, since 13 of them already drift.
3. May `package.json` gain `devDependencies` (`fake-indexeddb`, `playwright-core`)? May a `requirements-dev.txt` (`cryptography`, `pytest`) be added? Both mean small changes to exported files, which `LAB_CHANGES` would record.
4. May a non-publishing check workflow be added? It would run `verify_lab` and the secret boundary check, plus a list of tests known to pass. AGENTS.md names only the publishing workflow, and `.gitignore` blocks other workflow files.
5. Nara Daily has no revision notice (`dailyCard`). Is this intended in the redesign, or a regression? The fix would belong upstream.
6. Encrypted private payloads (`public/BD/O/izleti/*.8zs.json`, 2 files) are published through `public/`, as in production. Is that acceptable for the lab Pages site?

## Reproduction

```
npm i --no-save fake-indexeddb@6.2.7 playwright-core@1.63.0   # in the checkout that owns node_modules
(cd functions && npm ci)                                      # root tests import functions/ packages
CH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome
CHROME_PATH=$CH ANDALUZIJA_TEST_CHROMIUM=$CH CHESS_BROWSER_EXECUTABLE=$CH CHESS_QA_CHROMIUM=$CH GAME_GUIDE_BROWSER=$CH \
  node --test tests/<file>.test.mjs        # or: node tests/<file>-browser.cjs
uvx --with cryptography pytest -q -p no:cacheprovider tests/test_*.py
git status --short                          # then delete the *-evidence/ folders the tests leave behind
```
