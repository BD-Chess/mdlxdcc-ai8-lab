# CLOUD lab build: srcset and forced production routes, 2026-11-03

Branch `cloud/lab-build-srcset-forced-20261103`, stacked on #17 → #16 (all `build_pages.py` changes stay in one chain). Lane L1 (`scripts/`, `tests/`). No source page changes. Both problems were found by the links PR #25.

## Fixed

1. **`srcset` was never rewritten.**
   - `build_pages.py` moves images over 128 KB to commit-pinned `raw.githubusercontent.com` URLs and rewrites `href`/`src`, but `srcset` kept the old local paths. Those files are not in the Pages artifact, so the lab showed missing images, mostly on Nara pages.
   - Fix: each candidate URL in `srcset` is rewritten the same way; descriptors (`2x`, `480w`) stay, and `data:` sets are left alone.
   - Result: of **316** `srcset` candidates, **313** now point to raw, **0** point to a missing local file, and 3 are local files that exist. A sample of 5 raw URLs answered `200 image/webp`.
2. **Forced production redirects over existing files were ignored.**
   - In production, Netlify rules with `!` serve the target even when a file exists at the old path. GitHub Pages serves the old file.
   - The build now replaces each such shadowed file with a small redirect page (meta refresh + `location.replace`) to the target, as production does. There are **13** stubs, listed in `__lab__/build.json` as `forced_route_stubs`:
     - `crp/lab.html` → `lab.html`. This page has 187 relative links that were written for the root and only work there. In production it is never shown; in the lab its broken links are now gone.
     - `PWA/index.html` and `index-pwa.html` → atlas root (production retired that PWA homepage).
     - `BD-work-at-a-glance.html` → `w/`.
     - 9 `BD/*.html` trading pages → their `BD/private-trading/` versions, which is what production serves at those URLs.
   - Identity rules (for example `/chess/` → `/chess/index.html`) are skipped.

## Verified

- `python3 tests/test_build_pages.py`: **11/11**. New tests:
  - `srcset` with offloaded and local candidates;
  - `data:` sets are left alone;
  - a mini build that writes the `crp/lab.html` stub and records it.
- Full build: 827.5 MB (−0.5 MB, because the stubs are smaller than the pages they replace). 13 stubs; `srcset` counts as above.

## Note for BD

- The a11y PR #26 also edited `BD/{DCC,SM,ZZ}_trader.html`. With this build change, those three paths become redirects to their `private-trading` versions in the lab, the same as in production, so those particular edits are not visible on the lab site. They still matter if the forced rules ever change.
- Lab and production serve `BD/private-trading/{SM,ZZ,DCC}_trader.html` as unencrypted page shells. The protected part (`data-engine-pending`) loads only after the password through `js/trading-password-shield.js`. This is the same in production (the files are byte-identical) and is not caused by the lab. Whether the shells themselves reveal anything is BD's call; the trading code was not inspected further.

## Not verified

- The live Pages run (blocked here). A merge republishes the lab, because `build_pages.py` changes.
