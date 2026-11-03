# CLOUD lab audit (public site), 2026-11-03

Branch `cloud/lab-audit-20261103`, stacked on #8 (rebased on `cb589d1`, which contains the OmniCPQ cleanup). Lane L1: fixes were made only in `scripts/` and `tests/`. Findings in other lanes are reported, not fixed.

## Method

- **Build:** `scripts/build_pages.py`, run locally on the state after sync R2 (#7/#8). The audit covered **735 pages**; OmniCPQ/TS are absent. The crawl ran before #7's cleanup commit `0a10249`, so `audit-data.json` still lists two broken links to the removed work project (`/ai8/omnicpq-origin/` and `OmniCPQ/`). Since this branch was rebased on #8 (`cb589d1`), neither link exists in the lab.
- **Crawl:** Playwright Chromium visited every page at **360 px** (phone) and **768 px**. It recorded horizontal overflow and the offending element, console and page errors, failed same-origin requests, title, `lang`, viewport, `h1` count and missing alt.
- **Accessibility:** **axe-core 4.10.2** ran at 768 px with tags `wcag2a`, `wcag2aa`, `wcag21a` and `wcag21aa`.
- **Theme:** each page was rendered with the light and the dark color scheme, and the body backgrounds were compared.
- **Links:** a static check of all **24,660** `href`/`src`/`srcset` links. Every broken one was then opened in a browser against a **GitHub-Pages-like server**, which serves `404.html` with status 404, the same way Pages does.
- **Network:** external hosts are blocked from this container except `raw.githubusercontent.com` and Google Fonts. External links (458 hosts) and the live `bd-chess.github.io` site are therefore **UNKNOWN**.

## Fixed in this PR (lab-caused problems)

1. **The lab build broke JavaScript on 73 pages.**
   - Cause: `build_pages.py` applied the CSS `url(...)` rewrite, case-insensitive, to the whole HTML file, inline scripts included. `URL.createObjectURL(blob)` became `createObjecturl(/mdlxdcc-ai8-lab/…/blob)`, and `new URL(x)` became `new url(/…)`, which produced `Invalid regular expression flags` and similar errors.
   - A second path: the `href=`/`src=` rewrite also changed a JS regex literal.
   - Fix: CSS `url()` is rewritten only in `<style>` blocks and `style=""` attributes outside `<script>`. Attribute values with regex syntax (`[`, `]`, `\`, `^`, `|`) are not treated as URLs.
   - Result: pages with JS page errors went from **84 to 16**. `Invalid regular expression flags` went from **108 occurrences to 0**. All 73 affected pages were re-checked in the browser.
   - The remaining 16 are not caused by the lab:
     - 7 archived `index-bck*` pages fail the same way on the source page;
     - 7 pages need Chart.js or Leaflet from a CDN that this container blocks; they should work on Pages (UNKNOWN);
     - 2 pages need a service worker, which is blocked in this crawl.
   - Tests: `tests/test_build_pages.py` has 7 checks. The old builder fails them; the new one passes.
2. **Links broken only in the lab, fixed by a `404.html` router.**
   - Why they break: GitHub Pages is case-sensitive, has no Netlify `_redirects`, and the lab snapshot leaves out a few pages.
   - `build_pages.py` now writes a `404.html`. On a missing path, `scripts/lab_404_router.js` tries, in order:
     1. the production redirect rule, replayed inside the lab (`scripts/lab_routes_r2.json`: 126 rules from bd-chessdb `public/_redirects` at d9c0242, with the OmniCPQ/TS rules dropped);
     2. the same file with different letter case or without `.html`;
     3. for pages the lab excludes, a page with an explicit link to mdlxdcc.org.
   - Browser result for the **1,393 broken link occurrences** (757 targets):

     | Before | After the router | Occurrences |
     |---|---|---|
     | Letter case or missing `.html` | **resolved in the lab** | 416 |
     | Covered by a production redirect rule | **resolved in the lab** (85), or a link to production (3) | 91 |
     | Page excluded in R1 (`/BD/`, `index-atlas.html`) | **link to production** (`lab-404-bd.png`) | 207 |
     | Missing everywhere in the lab | 404 page with atlas, portfolio and lab links (`lab-404-missing.png`) | 679 |

   - Tests: `tests/lab-404-router.test.cjs` has 4 tests.
3. **The lab badge covered page controls on phones.** "AI8 LAB · v nastajanju" sat on top of the bottom-right buttons of pages. Below 600 px it is now compact; the label stays.

The Pages artifact stays at 877.6 MB; `404.html` adds 212 KB.

## Findings not fixed, ranked

| # | Finding | Count | Owner |
|---|---|---|---|
| 1 | **Real missing link targets** that the lab cannot resolve: 254 occurrences point to a file with the same name in another folder (wrong relative path), 124 have several candidates, 301 have no such file. Top folders: `crp` 298, `Nara` 156, `F4M` 50, `BD` 49, `OS` 43, `Birds` 29. Example: `OS/BD_8Z_OS_Story1.html` links 7 pages as `OS/BD_*.html`, but they live in `BD/`. These are very likely broken in production too (UNKNOWN). | 679 | BD (content), unassigned lane |
| 2 | **Accessibility, critical** (axe): missing form labels in the 8ZT trader pages (`label` on 34 pages / 224 nodes, `select-name` on 32 / 97); `meta-viewport` disables zoom on 13 pages; `aria-allowed-attr` on 4 pages; `button-name` on 2. | 288 of 728 pages have at least one violation | BD / content |
| 3 | **Accessibility, serious:** `color-contrast` on 186 pages (5,480 nodes; mostly dark-theme muted text); `scrollable-region-focusable` on 87 pages; `document-title` on 17; `html-has-lang` on 11; `link-in-text-block` on 11 | — | BD / content |
| 4 | **Mobile overflow** on 36 live pages, mostly wide tables. Worst: `crp/MDLxDCC-Arena-ARC.html` (+647 px at 360 px), `BD/WFERA.html` (+330 px, header and nav pills, `overflow-360-wfera.jpg`), `BD/BD_8Z_Reasoning.html` (+405 px at 768 px). Fix pattern: `overflow-x:auto` wrappers around tables. | 36 | BD / content |
| 5 | **Basics:** no `<title>` on 19 pages, no viewport meta on 21, no `lang` on 11, no `h1` on 48, several `h1` on 54 | — | content |
| 6 | **Theme consistency:** 716 pages are always dark, 9 follow the system light/dark setting, 3 are always light. The lab display toolbar (PR #3–#5) exists only on the atlas, portfolio and AI8 pages. A shared, optional theme toggle would make the site consistent. | — | proposal for BD |
| 7 | **The lab CSP blocks external data calls by design:** `ipapi.co` (34 pages) and `www.chessdb.cn` (14 pages, chess cloud evaluation). These features degrade in the lab. The 239 Google Fonts CSP messages are only from `<link rel="preconnect">`; fonts **do** load (checked against the source page). | — | lab policy, BD |
| 8 | **Phone header of the lab atlas** wraps to 2 rows (127 px, 9 controls) where production has 1 row (80 px). This is a lab change from PR #5; health report #15 confirmed it with `tests/landing-header-search-browser.cjs`. | 1 page | L1 follow-up |
| 9 | **Duplicate titles:** 50 pages "Arhiv je preseljen · BD Chess" (redirect stubs) and 23 "MDL×DCC — Less describes more." | — | content |

**Lanes L2–L5** (`people`, `gods`/`code`, `game`/`igra`, `knjiga`): no missing-link occurrences and no overflow pages. One `game/**` page has an axe violation. Nothing to hand over beyond what the playtest reports (#11, #13) already list.

## Verified by test

- `python3 tests/test_build_pages.py`: 7/7 pass; the old `build_pages.py` fails them.
- `node --test tests/lab-404-router.test.cjs`: 4/4 pass.
- Browser checks against the GitHub-Pages-like server: all 1,393 broken occurrences replayed with the results in the table above, all 73 regex-error pages re-checked (0 remain), and a full re-crawl of 728 pages after the fix.
- `python3 scripts/verify_lab.py`: PASS. No exported files were changed.

## Not verified

- The live `bd-chess.github.io` site and every external link (blocked here).
- Real phones (Playwright phone emulation only) and screen readers (axe covers about 30–40% of WCAG).
- Whether the remaining 679 missing targets are also broken in production.

## Open questions for BD

1. `.github/workflows/lab-pages.yml` republishes only when `public/**`, `build_pages.py`, `lab_pages_runtime.js` or the workflow change. If later only `scripts/lab_404_router.js` or `scripts/lab_routes_r2.json` change, add them to `paths`. This PR changes `build_pages.py`, so the merge itself republishes.
2. Should the lab get an optional light theme toggle on all pages (finding 6), or stay dark by design?
3. Who fixes the 679 real missing link targets? The top 20 targets cover about 25% of the occurrences, and a mechanical fix is possible where exactly one candidate file exists (254 occurrences).
