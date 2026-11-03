# CLOUD lab atlas phone header, 2026-11-03

Branch `cloud/lab-atlas-phone-header-20261103`, stacked on #8. This is the lab bug that health report #15 found and audit #16 lists as finding 8.

## Cause

Lab PR #5 (`4eafe65`, `d3880f4`) replaced production's single theme control with two 42 px buttons (`#theme-dark` and `#theme-light`). It also forced the header to wrap below 700 px. Measured in Chromium:
- at 320–430 px the header had **2 rows, 127 px**, with 9 controls;
- at 768 px the theme buttons wrapped to a second row as well.

Production has **one 80 px row** with 8 controls.

## Done

- `public/index.html` (style `lab-toolbar-normalize`): up to 768 px only the button that switches the theme is visible, compact (min 30 px). The two buttons act as one toggle, the way production's control does, and the forced wrap is removed. Desktop (>768 px) keeps both buttons, as in PR #5.
- `tests/landing-header-search-browser.cjs`, lab-aware changes:
  - it counts only visible controls;
  - it expects 8 controls up to 768 px and 9 above;
  - it clicks `#theme` or the visible lab toggle.
- `lab-evidence/LAB_CHANGES_R8.json` records both files.

## Verified

- Chromium probe: the header is **one row, 80 px**, at 320, 360, 402 and 430 px, and 87 px at 768 px. No horizontal overflow. Toggling dark → light → dark switches the theme and the visible button each time (`atlas-360-before.jpg`, `atlas-360-after.jpg`).
- `tests/landing-header-search-browser.cjs`: **Chromium PASS** at 320, 390, 402, 430, 700 and 1440 px, in EN/SL, dark/light, at 100% and 150%, with 13 searches, Chess LAB Enter and Start logo navigation, and the offline search fallback.
- `python3 scripts/verify_lab.py`: PASS.

## Not verified

- The WebKit half of the test: WebKit is not installed in this container (download blocked).
- Real phones.

## Transfer

This is lab-only. Production never had the two-button control, so nothing needs to go to bd-chessdb.
