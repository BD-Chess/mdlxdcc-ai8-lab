# CLOUD sync bd-chessdb → lab (SYNC R2), 2026-11-03

Owner: Claude (cloud session). Assigned by Zarja (SESTRA_WORK) on BD's decision:
"all new things from bd-chessdb main go to the lab, except OmniCPQ and TS".
The reverse direction (lab → bd-chessdb) happens only for PRs BD reviews and confirms.

Branch `cloud/sync-from-chessdb-20261103`, stacked on PR #6 (OmniCPQ/TS removal).

## What was done

- Source range: `BD-Chess/bd-chessdb` `89276ce` (R1 snapshot, 2026-10-25) → `d9c0242` (main, 2026-11-03 15:00).
  That range has 406 upstream commits and 664 changed paths: 423 added, 241 modified, 0 deleted.
- Lab result: **241 files added, 104 updated, 5 conflicts resolved, 314 excluded**.
- The sync is reproducible with `scripts/sync_from_bdchessdb.py`. It reads the latest `lab-evidence/SOURCE_MANIFEST_R*.json` and writes the next `SYNC_R*` record. A dry run against `d9c0242` now reports 0 changes.
- New evidence files:
  - `lab-evidence/SYNC_R2.json` lists every path with its action, exclusion reason, newest upstream commit, upstream blob and resulting sha256.
  - `lab-evidence/SOURCE_MANIFEST_R2.json` is the new source manifest at `d9c0242`. R1 stays unchanged as history.
- `scripts/verify_lab.py` now uses the newest source manifest and adds the exclusions from each `SYNC_R*.json`.

## Content by group

| Group | Content | Files | Unlocks |
|---|---|---|---|
| S1 | Game platform: game guide (functions, lib, assets), game log, Supabase migrations, games Dayton 1903 / Faraday 1831 / Navier–Stokes 1845 / Tesla 1888, `/people/`, guide tests and fixtures | 97 added, 7.8 MB | P0-1, Supabase slugs, Tesla playtest |
| S2 | SEC-R1 owner-password rotation (#269, #273): re-encrypted protected pages (8ZT, BD trading, AIm3, Trip/Protected, WL) and their server verifiers | 58 updated, 13.4 MB | Before this sync, the lab served these pages encrypted for the pre-rotation password |
| S3 | AI8 pages: model results, CLI Loops, live | 13 added, 8 updated, 3 conflicts | Audit of current AI8 pages |
| S4 | Public content: Nara/Illuminara Daily, AI8 News, `/knjiga/`, `/gods/`, `/llms/`, `/code/`, 8Z OS, CRP (ToE, DGTE, LIFT-BELT), Start, search index, sitemap | 123 added, 24 updated, 2 conflicts, 32.7 MB | Audit coverage of the new pages |
| S5 | Private, transferred because BD said "all": Andaluzija private trip (sealed `.8zs` data and planner), `docs/andaluzija-mail-evidence-20261026.md`, private-image test, BD-AI-todo page (its sealed data stays excluded) | 4 added, 5 updated | — |
| S6 | Tests and tools: Start, landing search, LLM page, Nara editions, CLI Loops, AI8 live freshness; small function libraries | 4 added, 9 updated | Health check B |

The full file list and the upstream commit for each file are in `lab-evidence/SYNC_R2.json`.

## Excluded (314)

| Reason | Files |
|---|---|
| OmniCPQ / TS (REMOVALS_R1): they stay only in bd-chessdb | 164 |
| Encrypted or credential material that R1 also excluded (`*.enc*`, vault, Sef) | 97 |
| New encrypted material: BD/O dossiers and rekey files (`*.enc-NN.txt`), Sef sidecars, BD-AI-todo sealed data | 49 |
| Upstream automation (`.github/workflows`), root policy (`.gitignore`), routing (`public/_redirects`) | 4 |

Files that R1 deliberately included (for example `public/BD/O/vault.js`) keep R1's decision and are updated. Every transferred text file was also scanned for credential markers (Google, GitHub, OpenAI, Anthropic, private key, JWT service key), with 0 hits.

## Conflicts (5), each resolved explicitly

| Path | Lab | Upstream | Resolution |
|---|---|---|---|
| `public/AI8/model-results.{html,css,js}` | Created in lab PR #3 (`2d01fae`, 26. 10.) | Promoted to production and developed further up to `5e3f0ba` (28. 10.), about 2× larger; uses the same `ai8-toolbar` | **Upstream**. The lab version stays in history at `2d01fae`. |
| `public/crp/DGTE.html` | `2d8fd21` evidence status ("unmeasured target" labels) | `bdaeefb` links to the DGTE use-case map and research synthesis | **Line-level merge, both kept** |
| `public/index.html` | PR #4/#5 display controls (`lab-toolbar-normalize`, theme buttons) | Book link (`33a8d01`, `135fb8a`), WakeLab search (`e7e98ec`) | **Merge, both kept**. Both style blocks are kept, and the book icon is inserted at the start of the lab utilities row. |

## Verified by test

- `python scripts/verify_lab.py` reports 5,363 source files verified, 73 intentionally removed, and **FAIL with exactly the 7 known lab-change mismatches** (`public/crp/{APSV,DGTE,HTH,Maglev_Assisted_Takeoff,Modular_Hydrofoils,SORA}.html`, `public/index.html`). These are lab PR #1–#5 changes and are handled in the separate baseline PR. Nothing is missing and no excluded path is present.
- `python scripts/check_secret_boundary.py` passes (SECRET BOUNDARY PASS).
- `python scripts/build_pages.py`, built into a scratch directory, succeeds: 4,135 copied files, 774 offloaded media files, **877.4 MB published, of the 950 MB gate**.

## Not verified

- The synced application tests are not run in this PR. P0-1 and health check B run them on top of this branch.
- The live Pages result: `bd-chess.github.io` is blocked from this container (UNKNOWN).
- Pages whose data is excluded (BD-AI-todo, Sef dossiers) show their protected or empty state in the lab.
- Netlify functions (the game guide agent, game log) do not run on GitHub Pages. The guide works in the lab only with a local harness or a separate lab backend.

## Open questions for BD

1. The Pages artifact is at 92% of the 950 MB gate, so the next large sync will hit it. Backlog idea: lower the media offload threshold from 128 KB, or offload large HTML archives.
2. S5 private content is now in the public lab, because BD said "all". If any of it should not be public, it can be recorded as a removal like PR #6.
3. Old ciphertexts of the S2 protected pages stay in the git history of both the lab and bd-chessdb. Rotation protects only the current files.
