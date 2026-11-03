# CLOUD backlog (lane L1, Claude cloud), updated 2026-11-03 ~20:20 UTC

This is a living list for BD, Zarja, Zora and the next writer (GPT/Lan or Claude). Rules: one branch, one PR and one short report per improvement; draft PRs only; **merge = BD**, because a merge into `lab/bootstrap-r1` republishes the lab. Value: ★★★ high · ★★ medium · ★ low.

## Merge order (stacked PRs)

`#6 → #7 → #8`, then on top of #8 in any order: `#9`, `#12`, `#15`, `#16 → #17`, `#18`, `#10 → #14`, `#10 → #21`, `#11 → #13 → #20`.

## Done (draft PRs, waiting for BD)

| PR | What | Value |
|---|---|---|
| #6 | Remove work projects OmniCPQ/TS from the lab (73 files, `REMOVALS_R1`, verify guard) | ★★★ BD order |
| #7 | Sync R2: bd-chessdb `d9c0242` into the lab (241 added, 104 updated, 5 conflicts resolved); OmniCPQ content links cleaned (Zora); **vault/sealed files are a BD decision** | ★★★ |
| #8 | Baseline: `LAB_CHANGES` records, so `verify_lab` passes; CRLF restored; skips `node_modules` | ★★★ |
| #9 | Supabase migration for the `tesla1888` and `navierstokes1845` slugs (**no apply**; apply steps for BD) | ★★★ unblocks the Tesla and Navier–Stokes guide in production |
| #10 | P0-1: four guide tests left stale by R3.6 (guide tests 100/100) | ★★ |
| #11 | Tesla 1888 browser playtest tool and report; clear `LOG_UNAVAILABLE` message; game-load errors separated from logging errors | ★★★ |
| #12 | Build size report (877.6 of 950 MB; 382 MB identical duplicates) | ★★ |
| #13 | Faraday 1831 and Navier–Stokes 1845 playtests; phone visibility bug found; Faraday has no R7 key; strong hints | ★★★ |
| #14 | Guide cost R4: stable prompt prefix and Claude `cache_control` (ESTIMATE: Opus input 1.89–3.72 → 0.36–0.71 USD per game when the cache is warm) | ★★★ needs one real measured game (BD) |
| #15 | Health report: tests 190/282 green once the environment is set up; 0 vulnerabilities; 0 secrets in history | ★★ |
| #16 | Audit A: `build_pages` broke JS on 73 pages (fixed); `404.html` router (501 links fixed, 210 point to production); compact lab badge | ★★★ |
| #17 | Fonts moved out of the Pages artifact (877.6 → 828.0 MB) | ★★ |
| #18 | Lab atlas header back to one row on phones (compact theme toggle) | ★★ |
| #20 | Guide on phones: the latest reply is visible after every turn (0/41 → 41/41 turns at 360 px); also short desktop windows; regression test. **Production has the same bug, and the fix is ready to transfer** (the `follow()` hunk plus 2 CSS properties, without the #11 `LOG_UNAVAILABLE` line) | ★★★ BD: transfer? |
| #21 | Lab tests runnable from a clean clone: 192 → 204/282 green, runner `tests/run_lab_suite.py` (0 unexpected failures), `tests/README.md`, `LAB_EXPECTED_FAILURES.json`; tests only | ★★ |

## In progress (lane L1, own worktrees)

- Lab tests green from a clean clone (tests only, on #10). Mechanical stale tests, `tests/README.md`, an expected-failures list.

- Rewrite `tests/browser-p0-smoke.mjs` to the current protocol (on #21).
- PROPOSAL: softer Tesla 1888 hints s6, s13, s20, s21, s28, s29, s36, with `key_commit` recomputed (on #11). This is a content decision for BD or the author.

## Decisions waiting for BD

1. ★★★ **Apply #9 in production.** Until then the Tesla 1888 and Navier–Stokes 1845 guide stops after s1 (503) for the owner and for consenting players.
2. ★★★ **Vault/sealed manifests in #7:** keep them (as R1 did) or exclude them.
3. ★★★ **OmniCPQ/TS back into the lab?** The read-only review was sent to Zarja (not in the repo). In short: partial import only, after redaction. Urgent in production: check the sharing of the Drive file named in the code.
4. ★★ **R3.6 reveal behaviour:** after card A, *any* next message opens the reveal, including "Namig, prosim" or a new idea. Keep it, or require an explicit choice (code comment) plus a test.
5. ★★★ **Transfer #20 to bd-chessdb** (the phone visibility fix; production has the same code). Also decide the phone panel layout (panel at 42% of the screen, input lower after a reply).
6. ★★ **One real measured game** per provider to confirm #14 (needs a key and BD's agreement).
7. ★★ **Chess engine deduplication** in the Pages artifact (about −320 MB, medium risk, needs browser tests).
8. ★ Playwright, fake-indexeddb, playwright-core and cryptography as declared dev dependencies (lockfile change).
9. ★ An optional light theme toggle on all lab pages (716 pages are always dark).

## Ideas, ranked (not started)

| # | Idea | Value | Lane | Note |
|---|---|---|---|---|
| 1 | Faraday 1831: add the R7 `key` block and `key_commit` (no ✦ today) | ★★★ | L4 | content and key; game author |
| 2 | Weaker hints: Tesla s6, s13, s20, s21, s28, s29, s36; Faraday 7 of 12; Navier–Stokes 4 of 13 | ★★★ | L4 / L1 (Tesla) | wording is BD's or the author's call; proposals are in #11/#13 |
| 3 | Mechanical link fixes where exactly one candidate file exists (254 occurrences, e.g. `OS/BD_8Z_OS_Story1.html` → `BD/`) | ★★ | unassigned public/ | likely broken in production too |
| 4 | Accessibility, critical: form labels in the 8ZT traders, viewport zoom on 13 pages | ★★ | unassigned public/ | axe report in #16 |
| 5 | Wide tables on phones: `overflow-x:auto` wrappers (36 pages) | ★★ | unassigned public/ | |
| 7 | Add `scripts/lab_404_router.js` and `scripts/lab_routes_r2.json` to the `paths` of `lab-pages.yml` | ★ | L1 | workflow change; BD |
| 8 | A non-publishing CI check job (`verify_lab`, secret boundary, green test list) | ★★ | L1 | `.gitignore` blocks new workflows; BD |
| 9 | Nara Daily page shows no revision notice (`scripts/nara-daily.mjs:186`), probably upstream | ★ | unassigned | |
| 10 | 50 "Arhiv je preseljen" stubs share one title | ★ | unassigned | |

## Lane map (agreed via Zarja)

| Lane | Owner | Paths |
|---|---|---|
| L1 | Claude cloud (this session) | stack #6–#18, `functions/**`, `tests/**`, `tools/**`, `scripts/**`, `supabase/**`, `lab-evidence/**`, `public/assets/game-guide/**`, `public/game/tesla1888/**`, own reports |
| L2 | GitHub repo session | `public/people/**` |
| L3 | new session | `public/gods/**`, `public/code/**` |
| L4 | new session | `public/game/**`, `public/igra/**` (except tesla1888) |
| L5 | Fable (Lan) | `/knjiga/` and book sources |
