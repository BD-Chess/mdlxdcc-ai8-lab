# LAB fix set (b): critical accessibility (axe), 2026-11-03

Branch `cloud/lab-a11y-critical-20261103`, based on `cloud/lab-audit-20261103` (PR #16, finding 2).

**Result:** on the 65 pages that had axe **critical** violations, critical nodes went from **451 to 10**. The 10 that remain are on 8 pages I skipped on purpose (see "Skipped"). No new violations of any impact, and no new console or page errors.

Only attributes changed: no layout, styling, visible text or page logic. On the 8ZT trader pages the only change is `for="…"` on labels that already exist, so no new text was added there. The encrypted payloads (`bd-access-data` on SM/ZZ, the `_8Z_BLOB` engine on DCC) were not touched. Their AAD covers only path, pair, unit id and kind, so editing the outer HTML does not invalidate them.

## Done

| Page(s) | axe rule | Attribute change |
|---|---|---|
| `8ZT/DCC_trader.html`, `BD/DCC_trader.html` | label, select-name | `for` on the 12 existing labels (Preset, Symbol, Timeframe (s), History bars, MDL Window, Warmup, DCC Update (bars), Position ($), Leverage, Fee (%), Max units, Sync symbol) |
| `8ZT/SM_trader.html`, `BD/SM_trader.html` (also covers the `8ZT/sm.html` redirect) | select-name | `for` on the existing labels: Asset Class and Style, plus 40 controls in collapsed sections |
| `8ZT/ZZ_trader.html`, `BD/ZZ_trader.html` (also covers `8ZT/zz.html`) | label, select-name | `for` on the existing labels: the 12 flagged controls plus 38 in collapsed sections |
| `F4M/F4M_rDCC_Tournament.html`, `_v2_`, `_v3_`, `_v3_…1`, `_v4_`, `BD/F4M_rDCC_v3_Tournament*.html` | label, select-name | `for` on the existing labels Games, Time/Move, Flips, Magnets, Strength, Mode |
| `S/8zS1.html`, `S/8zS2.html`, `S/8zSudoku.html`, `S/index1.html`, `S/index2.html`, `S/legacy.html`, `BD/BD_Sudoku_Phase0.html` | label | `<label for="speedSlider">Speed</label>` |
| `BD/BD_Hedge_Separation_PiX_Strategy_Explainer_REFERENCE.html` | label | `for` on Leverage, Loss trigger ROE %, Profit/lock ROE % |
| `crp/AIM3_MentalArena_Lab.html` | label, select-name | `for` on 11 existing labels (Title, BD seed / problem, Protocol profile, Output type, Council target group, Active stage (auto), Provider/name, Manual stage, Provider, Model, Endpoint) |
| `crp/PiX.html` | label, select-name | `for` on 13 existing labels (Family, k, scale, offset, rows, rounding, Swing low/high, …) |
| `crp/Top100P.html`, `crp/Top100T.html` | select-name | `for` on Domain, Lane, Minimum fit, and on Group, Band |
| `BD/wifi.html` | label, select-name | `id="setting-…"` on the 4 settings controls and `for` on their existing SL/HR labels |
| `BD/How_LLMs_Actually_Work*.html` (3), `crp/How_LLMs_Actually_Work.html` | label, select-name | `aria-label` from the card heading: "Toy tokenizer demo", "Next-token distribution demo" / "Demo porazdelitve naslednjega tokena" (EN and the hidden SL twin) |
| `CW/8z_CW.html`, `_v1`, `_v2`, `_v3`, `CW/index.html`, `CW/old/index.html` | select-name | language select `aria-label="Language / Jezik"`; `CW/8z_CW.html` engine select `aria-label="Engine"`; `CW/index.html` pack select `aria-labelledby="packTitle"` (the visible "Prepared Puzzles" title) |
| `CW/8z_CW_viewer.html` | label | the grid-cell inputs created in JS get `aria-label` "Row r, column c" (one `setAttribute` line) |
| `BD/Promo.html` | label | the 55 checkboxes get `aria-labelledby`, pointing to an `id` added to each checkbox's own text `<span>` |
| `BD/op.html` | label | the 9 sliders get `aria-labelledby`, pointing to an `id` added to their question `<p class="q-text">` |
| `Someone/Someone.html`, `Someone/index.html` | button-name, label | `aria-label`: "Play <song title>" on the 10 song buttons; "Play / pause", "Previous track", "Next track" on the player buttons; "Volume" on the slider |
| `F4M/F4Pro.html`, `F4_CLA`, `F4_DSE`, `F4_GEM`, `F4_GPT`, `F4_QWE`, `index2`, `index3`, `index4` | meta-viewport | viewport is now `width=device-width,initial-scale=1,viewport-fit=cover` (dropped `maximum-scale=1,user-scalable=no`) |
| `BD/Kayak.html` | aria-allowed-attr | removed `th.setAttribute('role','button')`. Sortable `<th>` keep their native columnheader role, where `aria-sort` is allowed; `tabindex`, `title` and Enter/Space sorting are unchanged |
| `Trip/travel.html`, `Trip/new/travel.html`, `Trip/PWA/travel.html` | aria-allowed-attr | in `travel.js` (3 copies): `aria-pressed` is set on `button[data-lang]` instead of on every `[data-lang]`. `locale.js` puts `data-lang` on `<html>`, so `<html>` also received `aria-pressed` |
| `crp/projects-are-evidence.html` | aria-required-children | `test-table`: `role="row"`, `columnheader` and `cell` on its existing rows and cells. `model-table` is a flat CSS grid with no row elements, so `role="table"` became `role="group"` and keeps its `aria-label` (EN and SL) |

**Collapsed sections:** axe only sees controls that are visible. The trader pages and AIM3 also have parameter panels that are collapsed (`display:none`) by default, and they have the same problem: existing labels without `for`. In the 55 files above I added `for` to the existing label directly before each such control (162 controls). This adds no text.

## Verified

axe-core **4.10.2**, tags `wcag2a`, `wcag2aa`, `wcag21a` and `wcag21aa`, 768 px. The same 65 pages were checked on a GitHub-Pages-like server, on a build of the base commit (`e228ce8`) and on a build with this change. The "before" build reproduces the PR #16 audit numbers exactly.

| Rule (critical) | Pages before → after | Nodes before → after |
|---|---|---|
| label | 34 → 2 | 224 → 2 |
| select-name | 32 → 2 | 97 → 4 |
| meta-viewport | 13 → 4 | 13 → 4 |
| aria-allowed-attr | 4 → 0 | 89 → 0 |
| button-name | 2 → 0 | 26 → 0 |
| aria-required-children | 1 → 0 | 2 → 0 |
| **Total** | **65 → 8** | **451 → 10** |

- **Remaining violations:** all 10 are on the skipped pages below. `color-contrast` (658 nodes) and `scrollable-region-focusable` (41) are unchanged; they belong to fix set (c) and other work.
- **Regressions:** none. For each page I compared every rule of every impact, plus console errors, page errors, HTTP status and final URL: no rule increased, there are no new errors, and status and URL are the same.
- **Collapsed sections:** I also ran axe with the hidden containers that hold controls forced visible (collapsed panels, SL language twins). Critical nodes went from 708 to 23: 22 are on skipped pages, and 1 is `#batchStage` in AIM3, a compatibility select that is never shown.
- **Smoke test:**
  - Kayak: sorting by click and by Enter still works, and `aria-sort` toggles.
  - Trip: the language buttons toggle `aria-pressed`, and `<html>` no longer gets it.
  - CW viewer: 89 grid cells are named and typing works.
  - ZZ trader: clicking a label focuses its control.
- **Static check:** in the changed HTML, controls with no name source went from 426 to 18. The 18 are file inputs that are `display:none` behind buttons, and `#batchStage`.
- `python3 scripts/verify_lab.py`: **PASS** (5,363 source files). `lab-evidence/LAB_CHANGES_R12.json` records the 55 changed exported files with commit `787064a` (rebased from `4e7053f` onto #16 `ead4c80`, which contains the OmniCPQ cleanup; file hashes unchanged).

## Skipped

I skipped these because their exact bytes are pinned by a hash or a test. Editing them would break a release record or a test, so they need a decision from BD:

| Page | Violation left | Pinned by |
|---|---|---|
| `Trip/old/index.html` | meta-viewport | `tests/trip-promotion.test.mjs`: PREVIOUS must equal immutable archive `Trip/old/001` (gitBlobSha in `Trip/versions.json`) plus the selector |
| `Trip/old2/index.html` | meta-viewport | `tests/fixtures/trip-old2-manifest.json` (byte-for-byte sha) |
| `F4M/old/F4M.html` (also loaded by `F4M/old/index.html`) | meta-viewport | `F4M/old/release.json` `source_game_blob` fc8993a, and the provenance note in `f4m-core.js`; `old/index.html` is pinned in `scripts/flip4m_violet/verify_unified_260.py` |
| `S/PWA/app.html` | label (#speedSlider) | sha256 in `S/PWA/release.json`, `S/PWA/sw.js` and `tests/sudoku-pwa.test.cjs` |
| `S/old/index.html` | label (#speedSlider) | sha256 in `tests/sudoku-app-preview.test.cjs` |
| `CW/new/index.html` | select-name (#langSel, #packSelect) | generated by CW-UNIFIED-R1; `CW/new/release.json` `package_sha256`, which is also the `sw.js` release id |
| `CW/8z_CW_v4.html` | select-name (#langSel, #packSelect) | `CW/new/release.json` `source_v4_blob` efc5203 |

The fixes for these are the same as for their siblings above (`for="speedSlider"`, the language and pack select names, the viewport). If BD approves, they should be made together with the archive or release record (a new archive, release or hash) rather than as a lab edit.

Not in scope:
- 10 pages where axe could not run in the audit (CSP or a navigation during the scan), e.g. `AI8/api-check.html` and `Nara/dualframe-lab/*`.
- Trip `travel.js` line 166 also attaches the language click handler to `<html data-lang>`. That is a harmless re-render, but it is a logic matter, so I left it.

**Production:** all 62 files (55 changed and 7 skipped) are byte-identical in bd-chessdb `d9c0242`, so production has the same violations. I did not write to bd-chessdb.

## Files touched

- **Source, 55 files under `public/`:**
  - `8ZT/{DCC,SM,ZZ}_trader.html`
  - `BD/{DCC,SM,ZZ}_trader.html`, `BD/BD_Hedge_Separation_PiX_Strategy_Explainer_REFERENCE.html`, `BD/BD_Sudoku_Phase0.html`, `BD/F4M_rDCC_v3_Tournament{,1}.html`, `BD/How_LLMs_Actually_Work{,_v1_2_workflow_evidence,_v1_3_2_NAS_evidence}.html`, `BD/Kayak.html`, `BD/Promo.html`, `BD/op.html`, `BD/wifi.html`
  - `CW/8z_CW{,_v1,_v2,_v3,_viewer}.html`, `CW/index.html`, `CW/old/index.html`
  - `F4M/F4M_rDCC_{Tournament,v2_Tournament,v3_Tournament,v3_Tournament1,v4_Tournament}.html`, `F4M/F4Pro.html`, `F4M/F4_{CLA,DSE,GEM,GPT,QWE}.html`, `F4M/index{2,3,4}.html`
  - `S/8zS1.html`, `S/8zS2.html`, `S/8zSudoku.html`, `S/index1.html`, `S/index2.html`, `S/legacy.html`
  - `Someone/Someone.html`, `Someone/index.html`
  - `Trip/travel.js`, `Trip/new/travel.js`, `Trip/PWA/travel.js`
  - `crp/AIM3_MentalArena_Lab.html`, `crp/How_LLMs_Actually_Work.html`, `crp/PiX.html`, `crp/Top100P.html`, `crp/Top100T.html`, `crp/projects-are-evidence.html`
- **Lab evidence:** `lab-evidence/LAB_CHANGES_R12.json`
- **Report:** `reports/CLOUD_lab-a11y-critical_20261103.md`

Nothing was changed under `people/`, `gods/`, `code/`, `game/`, `igra/`, `knjiga/`, `BD/O/impulz-2026.html`, vault, `.enc`/`.8zs` or OmniCPQ/TS. No paid model calls were made.
