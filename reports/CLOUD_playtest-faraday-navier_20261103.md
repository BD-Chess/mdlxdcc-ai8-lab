# CLOUD playtest: Faraday 1831 and Navier–Stokes 1845, 2026-11-03

Branch `cloud/playtest-faraday-navier-20261103`, stacked on `cloud/tesla-playtest-20261103` (#11, including f988638 and fe94035). **No model or API calls were made.** No file under `public/game/**` was changed: lane L4 owns those files, so every defect found there is listed in the section [For lane L4](#for-lane-l4-publicgame-owner).

## Done

- Browser playtests with `tools/game-playtest/playtest.mjs` (real `functions/game-guide.mjs`, real `public/assets/game-guide/*`, real game pages, deterministic mock agent). Each game was run at 1280 px and 360 px, at 360 px with `--log-fails`, and at 360 px with the new `--g3` probes. That is 8 runs.
- A content review of every challenge: every hint is mapped to the key ideas it gives away (tables below). Texts come from `game.json` and from `index.html` through `functions/lib/game-guide/content.mjs` `stepTexts`.
- Consistency check of `game.json` against `index.html`: ids, order, `data-kind/for/tier/act/step`, refs, questions, images, alt text, sources, and the R7 `key` block.
- Generic tool changes in `tools/game-playtest/**`. The reasons are under [Tool changes](#tool-changes).

### Dayton G3 reference

Zora asked for these playtests "after the Dayton G3 pattern". **The G3 scenario file itself is not in the repository.** `tests/fixtures/game-r35-playtest.observed.json` names it as `"scenario": "REPLAY_dayton1903_G3.json"`, but no such file exists in `tests/`, `docs/`, `tools/` or anywhere else outside `node_modules`. What does exist:

- the observed excerpt: 8 player moves (7, 20, 23, 25–28, 30) of playtest bb70266e;
- its regression test, `tests/game-guide-r35.test.mjs`.

I used the shapes of those moves as the reference and turned them into `--g3` probes:

| Probe | G3 source | Player message | Expected |
|---|---|---|---|
| S | move 7 | »Ok, prebral. Zakaj pa tega ni odkril že kdo pred njim?« | the next step opens, and the question gets an answer |
| A | move 23 | »Zanimivo. Koliko je pa to takrat stalo?« (inside a challenge) | an answer, and no step opens |
| B | move 26 | »Kako naj pa to naredim, saj nisem fizik? Namig prosim.« | exactly the first hint opens |
| C | R3.5 mention cases | »Iz prvega namiga razumem samo del.« | no hint opens, even though the mock tries to open one |

## Verified by test

| Run | Faraday 1831 | Navier–Stokes 1845 |
|---|---|---|
| 1280 px, logging works | 36 turns, 77 mock rounds, **all 32 steps in order**, **5 card lines**, 0 console/page errors, 0 failed requests, 0 overflow, 10/10 images load, 0 without alt, turn median 585 ms / max 813 ms | 36 turns, 78 rounds, **all 31 steps in order**, **6 card lines**, 0 errors, 0 failed, 0 overflow, 12/12 images, 0 without alt, 587 / 753 ms |
| 360 px (phone), logging works | same as 1280; turn time 575 / 735 ms; **guide panel = 42 % of the screen; latest guide reply 0 % visible** after every typed turn | same; 578 / 745 ms; panel 42 %; reply 0 % visible |
| 360 px, `--log-fails` | **stops after s1**: 3/3 requests `503 LOG_UNAVAILABLE`, 0 model rounds. The panel now says »Zasebno beleženje trenutno ni na voljo.« (f988638) | same: stops after s1 |
| 360 px, `--g3` | **16/16 probes kept the rule**; all steps, 5 cards | **17/17**; all steps, 6 cards (s25 and s28 have one hint each, so they get no C probe) |
| All hints | every hint opened in tier order (12 hints) | every hint opened (13 hints) |
| Reveal timing | all 5 reveals opened in the assessment turn (»Razlaga«) | all 6 reveals opened in the assessment turn |
| `tools/game-playtest/content-audit.mjs` | ids, order, `data-kind`, `data-for`, `data-tier`, `data-act`, `data-step`, refs, images, alt and sources all agree; **5 `question` drifts; no `key` block** | everything agrees; one harmless `question` prefix difference (s28) |
| Integrity | (no checksums in this game) | `SHA256SUMS.txt`: 14/14 OK. `key_commit` reproduced: sha3-256 of the JSON list of the challenge `key` objects (sorted keys, `,`/`:` separators, UTF-8) = `c6aa826d…` |
| Tool regression | `tesla1888` at 1280 px with the changed tool: all 38 steps, 5 cards, 0 errors (same as #11) | |
| `python3 scripts/verify_lab.py` | PASS (`VALIDATION_R1.json` restored before the commit) | |

The run JSON, the content-audit JSON and screenshots are in `reports/CLOUD_playtest-faraday-navier_20261103/` (1.1 MB).

## Findings, ranked

1. **High (Navier–Stokes, production today): a logging failure blocks the whole game.**
   - `supabase/migrations/20261029195424_game_guide_log.sql:7` allows only `dayton1903`, `faraday1831` and `_fixture`, so `logStore.start` fails for `navierstokes1845`.
   - The guide then returns `503 LOG_UNAVAILABLE` for every message, and the game stops at s1 (`navierstokes1845-360-logfail-06-end.jpg`).
   - Fix of the cause: apply #9.
   - Faraday is in the constraint. It is affected only during a real storage outage, and then it behaves the same way (fail-closed).
   - The design question from the Tesla report is still open.
2. **High (UX on phones, both games and probably all games; guide client, not `public/game`): the player does not see the guide's reply.**
   - At 360 px, after every typed turn (hint, assessment, reveal, epilogue), **0 %** of the latest reply is inside the visible panel. Only right after »Začni« is it visible (98 %).
   - The card line and the final summary are hidden too (`faraday1831-360-04-assessed.jpg`).
   - Cause:
     - `public/assets/game-guide/game-guide.js:147` and `:342` scroll `#gg-messages`.
     - Below 900 px the scroll container is `#gg-body` (`game-guide.css:60`), and `#gg-messages` is `overflow:visible; order:-1` above the controls (`game-guide.css:64`).
     - Focusing the textarea scrolls `#gg-body` down to the input, and nothing scrolls it back up to the reply.
   - The panel also covers 42 % of a 360×780 screen, and the step-jump row is cut at the panel's top edge, as in the Tesla report.
   - Measured in Playwright mobile emulation, as the owner (owner controls take extra room). Not checked on a real phone.
   - Proposal for the guide owner:
     - after `say()` or a `delta`, on narrow screens scroll `#gg-body` so that the last message is in view;
     - or put the messages after the controls;
     - or fold the owner and log controls on phones.
3. **Medium (Faraday): `game.json` has no R7 `key` block and no `key_commit`.** It is the only one of the four games without them. Consequences:
   - `hintCoverage` (`functions/lib/game-guide/assessment.mjs:48-57`) falls back to "every hint covers every key idea". Opening only Namig 1 therefore removes every ✦ for that challenge. In the same scripted play, Faraday ends with 0 ✦ and Navier–Stokes with 8 ✦ (`faraday1831-1280-06-end.jpg` vs `navierstokes1845-1280-06-end.jpg`).
   - The model gets no `key_idea_ids`.
   - The sealed key has no commitment.
4. **Medium (content, both games): several hints hand over key ideas.** Faraday: 7 of 12 hints, 3 borderline. Navier–Stokes: 4 of 13 hints, 3 borderline. See the tables. Good hints to copy from:
   - Navier–Stokes s6, s21, s4, s16;
   - Faraday s4, s11.

   They ask about an observation or a cause and do not name the mechanism.
5. **Low (Navier–Stokes): one author coverage claim is wider than the hint text.**
   - s22 declares `covers: [s20.k2, s20.k3]` (`game.json:942-946`), but its text gives only k3 (the factor 16 = 2⁴).
   - The parabolic profile (k2) is not touched.
   - A player who opens s22 and then finds k2 alone still loses that ✦.
6. **Low (Faraday): the `question` field in `game.json` differs from the page question in all 5 challenges.**
   - Where: `game.json:145/412/618/872/1036` vs `index.html:94/146/186/244/276`.
   - Example: s16 in `game.json` is "Avgust 1831: kako s tem, kar je na mizi (…)"; the page says "Iz magnetizma dobi električni tok, ki ga lahko izmeriš."
   - No effect at runtime: the guide reads the page text first (`runtime.mjs:269`, `s.text || s.question`). Anyone reading `game.json` sees outdated wording.
   - Navier–Stokes differs only in the »Bonus, neobvezno:« prefix of s28 (harmless).
7. **Low (guide, all games): the fixed invite line.**
   - »Na desni se je odprl nov korak. Preberi ga, nato napiši svojo zamisel.« (`runtime.mjs:330`) follows every opened step, including story steps, reveals and the epilogue, where there is nothing to answer.
   - On phones the new step is above the panel, not "na desni" (on the right).
8. **Low (guide, cosmetic): the card line has a double space when there is no ✦** (»mejniki 4/4  · 5/5«, `assessment.mjs:39`).
9. **Info: Tesla finding 5 (R3.6 opens the reveal on any message after a card) is not reachable in normal browser play.**
   - The server forces the reveal in the assessment turn (`OPEN_STEP_REQUIRED` while `needsReveal()`, `functions/game-guide.mjs:210`), and all 11 reveals opened in that turn.
   - R3.6 can matter only after an interrupted turn. It was not reproduced here.

## Hint tables

Verdicts:

- **gives away**: the hint states the idea, or its answer is one word away.
- **borderline**: it supplies the premise, and the step to the idea is short.
- **ok**: it asks about an observation or a cause.

"Author covers" is the `key.hints[].covers` entry from `game.json` (Navier–Stokes only; Faraday has none, so the runtime treats every hint as covering everything).

### Faraday 1831

| Challenge and key ideas | Hint | What the hint says | Gives away | Verdict |
|---|---|---|---|---|
| **s3** Sila, ki ne vleče naravnost. k1 force on a pole goes round the wire; k2 the poles cancel, only one pole may act; k3 free movement with constant contact (mercury); k4 continuous rotation | s4 t1 | follow only the north pole around the wire: where is it pushed? | leads to k1 by a question | ok |
| | s5 t2 | the two poles are pushed opposite ways, so the needle only turns; how do you make only one pole act? | **k2** stated | **gives away** |
| | s6 t3 | the wire must stay connected "even while it circles"; which conductor in your lab is liquid? | **k3** (mercury by riddle), presupposes **k4** | **gives away** |
| **s10** Zasnuj poskus. k1 separate galvanometer circuit with no battery; k2 source of magnetism close (magnet in coil, parallel wires); k3 the expectation of the time: steady deflection | s11 t1 | reverse Ørsted's experiment | direction only | ok |
| | s12 t2 | the galvanometer must be in a circuit with no battery of its own; what can you put next to it or into it? | **k1** nearly verbatim, half of k2 | **gives away** |
| **s16** Tok iz magnetizma. k1 electromagnet on soft iron; k2 sensitive detection; k3 watch the needle during switching; k4 core: current only on a change, opposite on/off | s17 t1 | how do you get the strongest magnetism? you have more than steel magnets | points hard at k1 | borderline |
| | s18 t2 | what if the way back works not in the state but at the moment of change? when do you watch the needle? | **k4** (the core of the game), **k3** | **gives away** |
| | s19 t3 | two separate coils on the same soft iron, one to the battery via a switch, one to the galvanometer; what at switch on/off? | **k1, k3** and the full ring set-up of the reveal | **gives away** |
| **s23** Samo magnet in tuljava. k1 motion changes the magnetism: push in, pull out; k2 opposite kicks; k3 a resting magnet gives nothing | s24 t1 | with the ring the needle moved only at on/off; how do you "switch" a magnet? | strong nudge to k1, restates k3 by analogy | borderline |
| | s25 t2 | the magnetism in the coil also changes if you move the magnet | **k1** stated | **gives away** |
| **s28** Tok, ki teče ves čas. k1 endless change: rotation; k2 copper disc between the poles; k3 sliding contacts on axle and rim; k4 Arago: currents in the disc pull the needle | s29 t1 | which motion never ends while the device stays in place? | k1 is a one-word answer | borderline |
| | s30 t2 | rotate Arago's disc between the poles and touch it with a wire at two places | **k2 + k3**: the 28 Oct 1831 device | **gives away** |

### Navier–Stokes 1845

| Challenge and key ideas | Hint | What the hint says | Gives away | Author covers | Verdict |
|---|---|---|---|---|---|
| **s3** Upor, ki ga ni. k1 perfect fluid: only normal pressure, no force along the contact; k2 mirror flow, pressures cancel (d'Alembert); k3 real layers drag each other; k4 friction depends on the velocity difference | s4 t1 | honey vs water with a spoon | nudge to k3 | k3 | ok |
| | s5 t2 | draw streamlines; where is pressure larger "if front and back are mirror images"? | the premise of k2 | k2 | borderline |
| | s6 t3 | what force can a parcel give its neighbour per Euler, and which way? friction in a glass on a uniformly moving cart? | questions only | k1, k4 | ok |
| **s9** Trenje v enačbi. k1 shear ∝ velocity gradient, material constant; k2 difference of face forces → second derivatives; k3 isotropy → sum of three directions, same constant; k4 constant measured per fluid | s10 t1 | Newton 1687: resistance between layers ∝ their velocity difference; write it for two thin layers | **k1** almost fully, in tier 1 | k1 | **gives away** |
| | s11 t2 | shear on the top and bottom faces of a cube: equal or not? | leads to k2 | k2 | ok |
| | s12 t3 | the same left/right and front/back; combine them "if none is special" | the premise of k3 | k3 | borderline |
| **s15** Enačba brez molekul. k1 translation + rotation + deformation, only deformation rubs; k2 stress ∝ rate of deformation; k3 isotropy → at most two constants; k4 incompressible → Navier's equation with measurable viscosity | s16 t1 | list what a small cube of water can do | question | k1 | ok |
| | s17 t2 | Cauchy: stress ∝ strain; what if for a fluid stress ∝ rate of strain? how many constants if it is the same in all directions? | **k2** stated, k3 set up | k2, k3 | **gives away** |
| **s20** Ob steni. k1 no slip; k2 parabolic profile; k3 flow ∝ Δp·r⁴; k4 wide pipes go turbulent | s21 t1 | dust stays on windmill sails | nudge to k1 | k1 | ok |
| | s22 t2 | halve the pipe: how many times less water? "what would an answer of 16 mean?" | **k3** (the answer is in the hint); not k2 | k2, k3 | **gives away** (covers too wide) |
| **s25** Počasna krogla. k1 inertia negligible, linear equation; k2 drag ∝ μ·a·V, not V²; k3 6π·μ·a·V; k4 droplets fall slowly | s26 t1 (only hint) | "the sphere doesn't throw water ahead": which term is small? build a force from μ's units | **k1** near-stated; dimensional recipe for **k2** | k1, k2 | **gives away** |
| **s28** Bonus: žogica za golf. k1 friction only in a thin layer; k2 drag from the wide low-pressure wake; k3 dimples → turbulent layer separates later; k4 narrower wake → flies further | s29 t1 (only hint) | draw the wake; "where behind the ball is the pressure low"? | the premise of k2 | k2 | borderline (bonus) |

Proposal (same as for Tesla): tier 2 and tier 3 should ask about the observation or the cause without naming the mechanism, the number or the device. Examples:

- s22: "measure how the flow changes when you halve the radius. What would the number tell you about the velocity profile?" (no 16);
- s18: "when exactly did the needle move in every failed attempt, and when did you look at it?";
- s30: "what would make Arago's currents leave the disc through two fixed points?"

Wording is BD's and the author's decision; nothing was changed.

## For lane L4 (public/game owner)

No objective page defect was found:

- both games: no broken image, no missing alt text, no id, order or `data-kind/for/tier/act/step` mismatch, no unknown ref or source, no horizontal overflow;
- Navier–Stokes: checksums and `key_commit` are valid.

Proposed changes, in priority order:

| # | Where | Problem | Proposed fix |
|---|---|---|---|
| 1 | `public/game/faraday1831/game.json`: challenges at :133 (s3), :402 (s10), :604 (s16), :863 (s23), :1026 (s28); top level | no R7 `key` block and no `key_commit` (finding 3) | Add a `key` to each challenge, as in `navierstokes1845`: `key_ideas` with ids `sN.kM`, `hints[].covers`, `alternatives`, `anachronisms`. Add `key_commit` = sha3-256 of the JSON list of the challenge `key` objects (sorted keys, `,`/`:` separators, UTF-8; this reproduces `navierstokes1845` `c6aa826d…`). A starting point for `covers`, from the "Gives away" column above: s4→k1, s5→k2, s6→k3+k4, s11→none, s12→k1+k2, s17→k1, s18→k3+k4, s19→k1+k3, s24→k1, s25→k1, s29→k1, s30→k2+k3. The author decides. |
| 2 | `public/game/faraday1831/game.json:145, :412, :618, :872, :1036` vs `index.html:94, :146, :186, :244, :276` | `question` differs from the page question (finding 6) | Copy the page wording into `question`, or drop the field. The page is what players and the guide see. |
| 3 | `public/game/navierstokes1845/game.json:942-946` (s20 `key.hints`, s22) vs `index.html:211` | `covers` lists `s20.k2`, which the hint text does not give (finding 5) | `covers: ["s20.k3"]`, or reword s22. Either way, recompute `key_commit` (`game.json`) and the `game.json` line in `SHA256SUMS.txt`. |
| 4 | Faraday `index.html`: :104 s5, :108 s6, :155 s12, :201 s18, :205 s19, :253 s25, :285 s30 | hints that hand over key ideas (finding 4) | Wording suggestions only; BD and the author decide. |
| 5 | Navier–Stokes `index.html`: :136 s10, :178 s17, :211 s22, :238 s26 | same | same |
| 6 | `public/game/navierstokes1845/game.json` `people_ids` | only `leonhard-euler`; Navier, Saint-Venant and Stokes are not in `public/people/people.json` | Open question for BD; `public/people` is outside this lane. |

## Tool changes

All changes are in `tools/game-playtest/**` and work for any game slug.

- `playtest.mjs`:
  - `--g3` probes (above). The mock answers a real player question (`playerQuestion`) with one neutral line, as a well-behaved model would. Runs without `--g3` send no questions, so they behave as before.
  - **Bug:** a `--log-fails` run at the same width overwrote the normal run's screenshots, because the names were equal. Runs now get a `-logfail` or `-g3` suffix.
  - **Bug:** lazy images (`loading="lazy"`) that were never scrolled into view were not checked, because they count as "not complete". All images are now forced to load first, and an empty `alt` counts as missing.
  - **Bug:** the reveal check was "something opened after »Naprej.«". The server opens the reveal already in the assessment turn, so »Naprej.« opened the next story step, and the `05-reveal` screenshot showed the wrong step. The check now looks for the reveal id and records which turn opened it.
  - New metrics: per-screenshot overflow, the guide panel's share of a phone screen, the share of the latest reply that is visible, and a turn-time summary.
- `content-audit.mjs` (new): the `game.json` vs `index.html` consistency check, and challenge, hint and reveal texts through `stepTexts` for the hint review.

Reproduce:

```
node tools/game-playtest/playtest.mjs <slug> <outDir> 360|1280 [--log-fails] [--g3]
node tools/game-playtest/content-audit.mjs <slug> [out.json]
```

## Not verified

- Real model behavior (Claude/GPT). The mock follows the rules and does not judge answers. Every run opens all hints, so scoring after partial hints was not exercised in the browser.
- A real phone. The 360 px results come from Playwright mobile emulation as the owner; a visitor's panel has fewer controls.
- Production pages and logging after #9.
- ZGODBA mode and the GPT provider path.
- The Navier–Stokes epilogue (s31) claims about September–October 2026: Buckmaster and Alpöge's Lean proof, the OpenAI Navier–Stokes claim, arXiv:2610.08144. `game.json` lists 12 sources for s31. I did not open them, and the events are after my knowledge cutoff. The text itself says that nothing is reviewed yet.

## Open questions

1. Logging failure: should it stop play (fail-closed, as now) or continue without logging and show a notice? (Carried over from the Tesla report.)
2. Faraday s10 k3 rewards the historical expectation (a steady deflection). A player who predicts the real, brief kick is "praised but not confirmed" (`alternatives_ok`). Is that intended?
3. Should a tier 3 hint ever state a key idea outright? A written rule would let the content audit flag such hints automatically.
4. Should Navier, Saint-Venant and Stokes get people entries, so the epilogue can link to them instead of to Euler only?
