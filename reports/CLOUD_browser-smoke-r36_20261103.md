# CLOUD browser smoke on guide r3.6, 2026-11-03

Branch `cloud/browser-smoke-r36-20261103`, PR #23 (draft). It is based on `cloud/lab-tests-green-20261103` (PR #21, which sits on #10). Only `tests/browser-p0-smoke.mjs`, `tests/LAB_EXPECTED_FAILURES.json`, `lab-evidence/LAB_CHANGES_R9.json` and this report change. There are no application changes, and no model or API calls are made.

## Done

- **Commit `0bebf57`:** `tests/browser-p0-smoke.mjs` is rewritten to the current tool protocol. The browser is still one bounded loopback session with the real `functions/game-guide.mjs`, the real `public/assets/game-guide/*` and a mock provider.
  - The mock now sends R3.3 `assess_challenge` arguments, as the r2 test's helper does: `{ step, path, achieved: [key_ideas], why, advantages: [] }`.
  - It gives `ask_understanding` an `idea`.
  - It follows `question_closed` and `next: offer_continue_or_reveal`.
  - Each turn must end without a refused tool call, a suppressed reply, a stopped turn or a recovered answer.
- **Browser path.** The test uses `GAME_GUIDE_BROWSER` if it is set. Otherwise it uses Playwright's Chromium (`playwright`, then `playwright-core`, through `createRequire`), and then `/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`.
  - A missing browser gives a clean `FAIL` report. Before, it crashed with an unhandled `ENOENT` on the hard-coded Windows path.
  - `AI8_TEST_EVIDENCE_DIR` handling from PR #21 is unchanged. The temporary browser profile is removed after the run.
- **`tests/LAB_EXPECTED_FAILURES.json`:** the `browser-p0-smoke` entry is removed, and `stale-expectation` goes from 16 to 15. The counts still match the 78 entries.
- **`lab-evidence/LAB_CHANGES_R9.json`:** a new row for `tests/browser-p0-smoke.mjs` with commit `0bebf57`, PR #23 and lab sha256 `a184f7d2…`. `verify_lab.py` needs this row.

## Verified by test

| Check | Before (`dbb7f22`) | After |
|---|---|---|
| `node tests/browser-p0-smoke.mjs`, no browser variable | crash: `spawn C:\Users\iemcc\…\chrome-headless-shell.exe ENOENT` | **`"status":"PASS"`**, 41 mock model calls, 4 runs in a row. Playwright resolves `/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`. |
| same, with `GAME_GUIDE_BROWSER=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` | `FAIL` at line 91: `r1` stays hidden | `PASS`. It also passes with `GAME_GUIDE_BROWSER` set to `chrome-headless-shell`. |
| `node --test tests/game-guide*.test.mjs` | 100 pass, 1 skip | 100 pass, 1 skip (the same skip as before: "R3 database constraint …") |
| `tests/run_lab_suite.py` on the smoke test and the 11 guide test files | – | 12 run, 12 passed, 0 unexpected |
| `python3 scripts/verify_lab.py` | – | **PASS**; FAIL (`source hash mismatch`) without `LAB_CHANGES_R9` |

The turn log shows why the old test failed:
- `Moja zamisel.` ended in `ROUND_LIMIT` recovery. `ask_understanding` had no `idea`, so the server answered `UNKNOWN_IDEA` and then `question_closed`, and the mock kept asking.
- `Razlaga…` ended in `TOOL_LIMIT` recovery. The pre-R3.3 assessment arguments were rejected twice, so no card was made.

Three mutations of the new file each fail:
- the old assessment arguments;
- c4 with all milestones, so the card is not low;
- `ask_understanding` without `idea`.

Full Chromium made its own background connections (`www.google.com`), and the container proxy refused them. The fixture page and the guide assets make no external requests.

All runs wrote their evidence to the scratchpad through `AI8_TEST_EVIDENCE_DIR`. `lab-evidence/VALIDATION_R1.json` was restored with `git checkout --`. No `*-evidence/` folder was created in the worktree.

## Changed checks, with reasons

No original check was dropped.

| Original check | Now | Why |
|---|---|---|
| A/B cards (`Kartica A`, c2 `Kartica B`) | Kept. c2 is B through `path: 'own'`. | **R3.3:** the server derives the card. `card`, `stars` and a numeric `achieved` are rejected. |
| c3 has no stars after the hint (the mock sent `stars: 0`) | Kept, now asserted on the server's card line: c1 has `mejniki 2/2 ✦✦ · 5/5`, c3 has no ✦ | **R3.3:** milestones covered by an opened hint get no ✦. The server computes this. |
| Understanding before reveal | Kept. The question names `idea: key_ideas[1]`, and the panel shows exactly that question. | **R3.3/R3.4:** a question needs the missing key idea. Without one the result is `UNKNOWN_IDEA`, then `question_closed`, and the model must assess. |
| Reveal opens in the same turn as the assessment | Kept for c1, c2, c3 and c5 (full A and B cards). **Changed for c4**: a low card (1 of 3 milestones) holds the reveal. The server appends the add-or-reveal line, the panel shows Dopolni/Razkrij, and clicking Razkrij opens `r4` with **0 model calls** in one request. | **R3.5** holds the reveal after a low card while the player is still answering. **R3.6** opens it on the player's choice without a model call. The fixture's c4 gets a third key idea, so its low card is still a coded `Kartica A … (delno)` and the summary check below keeps its meaning. |
| Requested hint only | Stronger: of h1–h5, only `h3` is visible at the end | Same intent. The old test only checked that h3 opened. |
| Reload restores conversation, open steps and game_session_id | Stronger: the visible step ids are compared too | The label claimed open steps, but the test only compared the message count and the session id. |
| Development produces no `mark_result` | Kept, plus: the tool list offered to the model has no `mark_result`, and all 5 assessments return `record_result: false` | Same intent, now with checks at the protocol level. |
| Other checks unchanged: start buttons dispatch once, actual visible receipt, title glow, one-line invitation, exact input label, Invent default, five Razlaga posts, coded final summary with all five cards, markdown escaping and no executable HTML, a no-op adds no assistant bubble, anonymous reader | Unchanged | – |

Smaller harness changes:
- `/favicon.ico` answers 404, so it no longer shows up as `server_error`.
- Wait bounds are raised: a turn from 2.5 s to 5 s, browser start from 3 s to 10 s.
- The gpt-shaped mock response is fixed (`arguments` as a string). The test only plays `claude`.

**A correction to the task brief and to the #21 report:** R3.6 does not hold every reveal. Only a low card is held, meaning `none`, or A with fewer than half of the milestones. Full and partial-but-not-low cards still need the reveal in the assessment turn, as `game-guide-r35` "SESTRA_0217 stays" shows. The smoke test now covers both paths.

## Transfer note for bd-chessdb

In `/home/user/bd-chessdb` (`d9c0242`, read only, not written), the guide code is byte-identical to the lab:
- `functions/game-guide.mjs`;
- `functions/lib/game-guide/`;
- `functions/lib/mdlxdcc-guide/`;
- `public/assets/game-guide/`.

Its `tests/browser-p0-smoke.mjs` differs from the lab base in two places: the old invitation text, and no `AI8_TEST_EVIDENCE_DIR`. The same rewrite applies there unchanged. When the variable is unset, the test writes to `<repo>/evidence` as before. On Windows, either set `GAME_GUIDE_BROWSER` or make `playwright` resolvable, because the `/opt/pw-browsers` fallback is Linux only. The test has not been run on Windows.
