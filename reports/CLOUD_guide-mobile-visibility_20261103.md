# CLOUD guide mobile visibility, 2026-11-03

Branch `cloud/guide-mobile-visibility-20261103`, stacked on `cloud/playtest-faraday-navier-20261103` (#13, on #11). Draft PR #20. **No model or API calls were made.** No file under `public/game/**`, `public/people/**` or `functions/**` was changed. Nothing was written to `/home/user/bd-chessdb`.

## Done

The bug comes from finding 2 of the #13 playtest. On phones (360 px), 0 % of the guide's latest reply was visible after every typed turn, including the card line and the final summary. The cause has three parts:

1. **The client scrolled the wrong element.** `say()` and every stream `delta` set `#gg-messages.scrollTop`. Below 900 px, `#gg-messages` is `overflow:visible`, so that did nothing. The element that scrolls there is `#gg-body` (`game-guide.css:60/64`).
2. **Scroll anchoring kept the panel at the input.** Focusing the textarea scrolls `#gg-body` to the input. Chrome's scroll anchoring then keeps the controls and input still while messages grow above them (`#gg-messages` is `order:-1`, above the controls). Even after part 1 was fixed, anchoring pushed the player's own message out of view again (shown by a test, see below).
3. **The message list can collapse on short desktop windows.** On a 1280×480 desktop window, `#gg-messages` (`flex:1; min-height:0`) shrinks to its 40 px of padding, which leaves no room for content. Only 5 % of a short reply was visible. The new test found this. The tool does not measure it, because it runs at 1280×900.

Changes, all in `public/assets/game-guide/**`:

| File | Change | Why |
|---|---|---|
| `game-guide.js` | New `follow(item)`, used by `say()` and by the `delta` handler instead of `#gg-messages.scrollTop = scrollHeight`. It still scrolls the list to the end, as before. Then, for every panel ancestor that actually scrolls, it brings the message into view at the nearest edge. A message taller than the box shows its beginning. | Works in whichever element scrolls (`#gg-messages` on wide screens, `#gg-body` on phones, both on short windows), with no breakpoint in JS. It changes only `scrollTop` of elements inside `#game-guide`, never the page, so a player reading a step keeps their place. It does nothing while the panel is collapsed or the list is hidden. |
| `game-guide.css` | `#gg-body{…;overflow-anchor:none}` | Removes part 2. Safari has no scroll anchoring, so this makes Chrome/Android behave like iOS. |
| `game-guide.css` | `@media(min-width:900px){#gg-messages{min-height:120px}}`; the base rule keeps `min-height:0`, as in production | Removes part 3. At 1280×900 the list is 407 px high (measured), so normal desktop layout does not change. At 1280×480 it is now 120 px instead of 40 px. Phones keep their own `min-height:110px` in the phone query. Scoped to the desktop panel after Zora's review; computed styles are the same as with the earlier global rule at every width. Moving the 120 px into the phone query instead fails the short-desktop test (reply 5 % in view). |

Not changed:

- **The phone panel height (42 % of a 360×780 screen).** The reply now needs that room: `#gg-body` shows 244 px, and the final summary is 395–460 px tall. A smaller panel would cut more of every reply. See open question 1.
- **The clipped step-jump row.** It was cut only because `#gg-body` stayed pinned to the input. After the fix, the panel follows the conversation after each turn, and the row is whole in the after screenshots (`after/navierstokes1845-360-03-challenge-hints.jpg`). It can still be cut when the player scrolls the panel by hand, as with any scroll box. It is an owner-only control.

Tool and test:

- `tools/game-playtest/playtest.mjs`:
  - The visible share is now clipped by **every** clipping ancestor, not only `#gg-body`. The old measure overstated desktop: it reported 100 % for the final summary, which is really 80–93 % visible.
  - Visibility is now recorded after **every** turn: `replySeenPct`, `replyFitPct` and `userSeenPct`. `replyFitPct` is the share of the reply in view, or of the visible window when the reply is longer than the window.
  - **The tool exits 1 when any turn is below `--min-reply-seen` (default 60 %)**. `--log-fails` runs are exempt, because their turns add no reply.
- `tests/game-guide-mobile-visibility.test.mjs` (new):
  - Playwright, the real handler, the `_fixture` game and a mock agent.
  - Layouts: 360×780 phone, 1280×900 desktop and 1280×480 short desktop.
  - The page is first scrolled away from the panel. The test then checks that:
    - a short reply is ≥ 95 % in view;
    - the player's own message is in view where both fit;
    - a 30-line reply fills ≥ 60 % of the window and, on phones, shows its first line;
    - `scrollY` does not change;
    - there are 0 console errors.
  - It is skipped when Playwright is missing. `GAME_GUIDE_BROWSER` can name a Chromium executable.

## Verified by test

`node tools/game-playtest/playtest.mjs <slug> <out> 360|1280`. Before = original `game-guide.js`/`.css` (#13 head) with the new measurement. After = this branch. "Typed turns in view" counts turns where the latest reply is ≥ 60 % in view.

| Game | Width | Typed turns in view, before → after | Reply fully visible (≥ 99 %), before → after | Final summary (06-end) visible, before → after | Own message after the turn (median), before → after |
|---|---|---|---|---|---|
| tesla1888 | 360 | **0/41 → 41/41** | 0/41 → 40/41 | **0 % → 62 %** (395 px reply in a 244 px window, start shown; window 100 % filled) | 0 % → 100 % |
| faraday1831 | 360 | **0/35 → 35/35** | 0/35 → 34/35 | **0 % → 62 %** (395 px, window filled) | 0 % → 100 % |
| navierstokes1845 | 360 | **0/35 → 35/35** | 0/35 → 34/35 | **0 % → 53 %** (460 px, window filled) | 0 % → 100 % |
| tesla1888 | 1280 | 41/41 → 41/41 | 40/41 → 40/41 | 93 % → 93 % (end shown, as before) | 100 % → 100 % |
| faraday1831 | 1280 | 35/35 → 35/35 | 34/35 → 34/35 | 93 % → 93 % | 100 % → 100 % |
| navierstokes1845 | 1280 | 35/35 → 35/35 | 34/35 → 34/35 | 80 % → 80 % | 100 % → 100 % |

The only reply that is not fully visible after the fix is the final summary, which is taller than the window.

Also identical before and after, in all six runs:

- all steps open (38/32/31);
- card lines 5/5/6;
- 0 console or page errors;
- 0 failed requests;
- 0 horizontal overflow;
- 0 broken images.

The panel stays at 42 % of the phone screen. Turn time stays at a median of about 560 ms. All 1280 px numbers are equal before and after, so desktop did not regress.

Other runs on this branch:

- `faraday1831 360 --g3`: 16/16 probes keep the rule, all steps open, 5 cards, and the reply is in view after all 46 turns.
- `tesla1888 360 --log-fails`: stops after s1 with `503 LOG_UNAVAILABLE`, as in #11/#13.

When the tool runs on the original client, it exits 1 at 360 px, with 35–41 turns below the threshold.

Tests:

| Test | Result |
|---|---|
| `tests/game-guide-mobile-visibility.test.mjs` | 3/3 layouts pass. On the original client it **fails**: phone 0 % and short desktop 5 %. Without `overflow-anchor:none` it fails on the phone (own message 0 %). Without `min-height:120px` it fails on the short desktop (5 %). Each change is therefore needed. |
| `tests/game-guide-errors.test.mjs` | 2/2 pass |
| `tests/game-guide-r35.test.mjs` | 23/23 pass |
| `start-fixture`, `card-why`, `partial-reveal`, `r3`, `r33`, `r33-combined`, `r34`, `r4fix`, `mdlxdcc-guide-client` | all pass |
| `game-guide.test.mjs` (2 fail), `game-guide-p0.test.mjs` (1), `game-guide-r2.test.mjs` (1) | **Already failing before this change.** Same counts with the original client files. These are server-side assertions, e.g. `/Preberi in mi povej/` against the current invite line »Na desni se je odprl nov korak…«. Not touched here. |
| `python3 scripts/verify_lab.py` | PASS. `VALIDATION_R1.json` was restored before the commit. |

Evidence is in `reports/CLOUD_guide-mobile-visibility_20261103/` (0.9 MB):

- run JSON before and after;
- `faraday1831-360-04-assessed.jpg` before and after (card line hidden, then visible);
- `navierstokes1845-360-06-end.jpg` before and after (final summary);
- `after/tesla1888-360-logfail-06-end.jpg` (see open question 3).

## Not verified

- **Real phones.** All numbers come from Playwright Chromium mobile emulation (360×780, DPR 2, touch) as the owner. Untested:
  - iOS Safari, which has no scroll anchoring and handles `dvh` and the on-screen keyboard differently;
  - Android Chrome with the keyboard open, where the browser may scroll the focused input back into view;
  - a visitor's panel, which has fewer controls.
- Real model replies that stream in many small `delta`s. The mock sends one delta per round. `follow()` runs on every delta, and once a reply reaches the top of the window the window stops moving, so the player reads it from the start.
- Landscape phones (e.g. 780×360). The panel is then about 150 px high. `follow()` works, but the window is small.
- The production site itself. Production is judged by code identity (below), not by a run against production.

## Transfer readiness for bd-chessdb

- **Production has the same bug.** I compared with the read-only clone's `origin/main` ref, d9c0242 (2026-11-03 15:00 +0100, equal to `SOURCE_MANIFEST_R2` `source_sha`; not fetched). `game-guide.css` is byte-identical to the lab's #13 head. `game-guide.js` differs only by the lab's #11 line (`if (e.message === 'LOG_UNAVAILABLE') …`, f988638). Both lines this fix replaces (`say()` and the `delta` handler) are the same on main.
- **The fix applies cleanly to main.** I applied the patch with `patch -p1` to a `git archive` export of `origin/main` (`functions/`, `public/assets/game-guide/`, `public/game/_fixture/`) in the scratch directory:
  - it applies without fuzz;
  - the new test fails on unpatched main (phone 0 %, short desktop 5 %) and passes 3/3 on patched main.
- Files to transfer:
  1. `public/assets/game-guide/game-guide.js`: only the `follow()` hunk and the two call sites. Do **not** carry the #11 `LOG_UNAVAILABLE` line with it. It belongs to the separate #11 proposal, together with `errors.mjs` and `functions/game-guide.mjs`.
  2. `public/assets/game-guide/game-guide.css`: the two one-property changes.
  3. `tests/game-guide-mobile-visibility.test.mjs` (optional, needs Playwright). Its dependencies (`functions/game-guide.mjs` `makeHandler`, `runtime.mjs` `loadGame`, `public/game/_fixture`) exist on main.
- Lab-only, do not transfer:
  - `tools/game-playtest/**` (not on main);
  - `lab-evidence/LAB_CHANGES_R6.json`;
  - this report.
- Risk: low. The change affects only scroll positions inside the panel. Two cases change layout:
  - normal desktop layout changes only in windows where the controls leave the list less than 120 px;
  - Chrome/Android loses scroll anchoring inside `#gg-body`.

## Open questions

1. **Phone panel height.** Should the 42 % panel stay?
   - A smaller panel would shrink the 244 px reply window. The final summary already needs 395–460 px.
   - Alternatives for BD:
     - collapse the panel while the player reads a step;
     - fold the owner and log controls on phones;
     - put the controls after the input, so that the reply and the input are next to each other.
   - After a reply, the input is now about 250 px further down the panel for the owner (measured at 360×780: 246 px from the reply's bottom to the input's top). The owner's panel has more controls than a visitor's. Every option changes the layout, so I did not pick one.
2. **Long replies on desktop vs phone.** Desktop still shows the *end* of a reply taller than the list (unchanged legacy behavior: final summary 80–93 %, beginning cut off). Phones now show the *beginning*. Should desktop also show the beginning?
3. **Errors on phones.** `#gg-status` sits below the controls on phones. After a failed turn, for example `LOG_UNAVAILABLE`, the error line is at the cut edge of the panel (`after/tesla1888-360-logfail-06-end.jpg`). The log-info line above it does show »Zasebno beleženje trenutno ni na voljo.«. Should `follow()` also bring the status into view after an error, or should the status move next to the input on phones?
