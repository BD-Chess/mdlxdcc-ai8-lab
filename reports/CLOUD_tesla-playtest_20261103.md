# CLOUD Tesla 1888 playtest, 2026-11-03

Branch `cloud/tesla-playtest-20261103`, stacked on #8 → #7 → #6. **No model or API calls were made.**

## Method

`tools/game-playtest/playtest.mjs` is new and reusable for any game slug:

- It runs the **real** guide handler (`functions/game-guide.mjs`), the real browser client (`public/assets/game-guide/*`) and the real game page `public/game/tesla1888/`, served on loopback.
- The model is replaced by a deterministic mock agent that reacts to the server's game context:
  - it opens the next step;
  - it opens the next hint when the player asks;
  - it asks one understanding question;
  - it assesses with all key ideas;
  - it opens the reveal.
- A scripted player in Playwright starts the game, opens all 3 hints for every challenge, gives an idea and an explanation, then moves on, until the epilogue.
- `--log-fails` makes `logStore.start` fail the way production does before the slug migration (`game_sessions_slug_check`).

```
node tools/game-playtest/playtest.mjs tesla1888 <outDir> 360 [--log-fails]
```

## Verified by test

| Run | Result |
|---|---|
| 1280 px, logging works (state after the #9 migration) | 42 turns, 89 mock model rounds, **all 38 steps opened in order**, final summary with **5 card lines**, 0 console errors, 0 failed requests, no horizontal overflow, 0 broken images, longest turn 783 ms |
| 360 px (phone), logging works | Same result: all 38 steps, 5 cards, 0 errors, no overflow, longest turn 653 ms |
| 360 px, logging fails (production **today** for Tesla) | **The game stops after s1.** Every message returns `503 LOG_UNAVAILABLE`. |
| `node --test tests/game-guide-errors.test.mjs` | 1/1 pass |
| `python scripts/verify_lab.py` | PASS. `errors.mjs` is recorded in `lab-evidence/LAB_CHANGES_R3.json`. |

Screenshots and raw JSON are in `reports/CLOUD_tesla-playtest_20261103/`.

## Bugs and findings, ranked

1. **High: the logging failure blocks the whole game, not only logging.**
   - `functions/game-guide.mjs:71` and `:80` return `LOG_UNAVAILABLE` (503) when `logStore.start` fails.
   - The owner's play is always logged ("Lastnikov potek se zasebno beleži"), and consenting players are logged too. In production, therefore, **the guide does not work for Tesla 1888 or Navier–Stokes 1845** until the migration from #9 is applied.
   - Fix of the cause: apply #9.
   - Design question for BD: should a logging failure stop play (fail-closed, as now) or continue without logging, with a visible notice?
2. **Medium (fixed in this PR): unclear message.**
   - After the 503, the player saw only "Odgovor ni dokončan. Tvoje sporočilo je ostalo v polju.", and the panel still said "Lastnikov potek se zasebno beleži".
   - `public/assets/game-guide/errors.mjs` now gives `LOG_UNAVAILABLE` its own message: "Zasebno beleženje trenutno ni na voljo, zato vodnik ne more nadaljevati. Tvoje sporočilo je ostalo v polju." (and the English equivalent). Verified in the browser: `tesla1888-360-logfail.jpg`.
3. **Medium (UX, not changed): on a 360 px phone the guide panel covers about 45% of the screen height,** and the step-jump row is cut at the top of the panel's inner scroll (`tesla1888-360-03-challenge-hints.jpg`). Proposal: a smaller default height on phones, or a collapsed panel while the player reads a step.
4. **Content (not changed, BD and the game author decide): some hints give away the key ideas** (Zora's list, confirmed):

   | Hint | Challenge | What it gives away |
   |---|---|---|
   | s6 (t3) | s3 Neprijetna cena vrtenja | K3 directly: use the alternating current instead of commutating it |
   | s13 (t3) | s10 Gibanje brez dotika | K3: time-shifted maxima in spaced windings, i.e. the rotating field |
   | s20 (t2) | s18 Nevidna povezava | K2: induced current in a closed path, no wire needed |
   | s21 (t3) | s18 | K3 and K4 (slip), almost the whole reveal |
   | s28 (t2) | s26 Od izuma do uporabnega sistema | The full K2 and K3 solution: two perpendicular windings, 90° |
   | s29 (t3) | s26 | K4 and K5: conductor count, the common return carries the sum, about 1.41× current |
   | s36 (t3) | s33 Trideset kilometrov do mesta | Points to the transformer (K3/K4); still phrased as a question, borderline |

   Proposal: t2 and t3 should ask about the cause or the observation without naming the mechanism. For example, s29 could ask "how many conductors does each closed path need, and what happens if two paths share one?" without the count or the 1.41 factor.
5. **Finding from the P0-1 investigation (all games): after a good assessment (card A), any next player message opens the reveal without a model call,** including a hint request or a new idea. `functions/game-guide.mjs` R3.6 checks only `session.needsReveal()`, while the comment says "an explicit choice". This needs a separate PR with a test.

## Not verified

- Real model behavior (Claude/GPT). The mock agent follows the rules; it does not judge answers.
- The production page and production logging after the migration.
- ZGODBA mode and the GPT provider path in the browser (only Claude / IZUMLJAJ were run).

## Next (backlog)

- The same playtest for Faraday 1831, Navier–Stokes 1845 and Dayton 1903: `node tools/game-playtest/playtest.mjs <slug> ...`.
