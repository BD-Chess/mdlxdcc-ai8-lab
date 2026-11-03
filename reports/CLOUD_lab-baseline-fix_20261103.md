# CLOUD lab baseline fix, 2026-11-03

Branch `cloud/lab-baseline-fix-20261103`, stacked on #7 (sync), which is stacked on #6.

## Done

- `scripts/verify_lab.py` failed on `lab/bootstrap-r1` with 7 `source hash mismatch` errors, because lab PRs #1, #2 and #5 changed exported files without recording them.
- New record `lab-evidence/LAB_CHANGES_R1.json`. For each changed file it lists the upstream sha256 (from `SOURCE_MANIFEST_R2`), the accepted lab sha256, and the lab PRs and commits that changed it.
- `verify_lab.py` accepts exactly the recorded lab hash for those paths. Any other change is still a mismatch.
- `lab-evidence/VALIDATION_R1.json` is regenerated, and its status is now PASS.

| File | Changed by lab PR | Lab commits |
|---|---|---|
| `public/crp/APSV.html` | #1 | `1ab116f`, `f1dc545` |
| `public/crp/DGTE.html` | #1, then merged with upstream in #7 | `2d8fd21`, `fb39acd` |
| `public/crp/HTH.html` | #1, #2 | `1ab116f`, `5054c02`, `446a3ba`, `f3e2ec0` |
| `public/crp/Maglev_Assisted_Takeoff.html` | #1 | `1ab116f`, `150899a`, `3f82687`, `2b2cee6` |
| `public/crp/Modular_Hydrofoils.html` | #1, #2 | `1ab116f`, `1ad3027`, `f3e2ec0` |
| `public/crp/SORA.html` | #1, #2 | `fbd0410`, `79cf6c2`, `f3e2ec0` |
| `public/index.html` | #5, then merged with upstream in #7 | `4eafe65`, `d3880f4`, `fb39acd` |

PR titles: #1 "Lab: review six inventions and fix navigation/mobile layout"; #2 "Lab: restore BD origin narrative and attribution"; #5 "LAB atlas: ordered display controls and dark default".

## Verified by test

- `python scripts/verify_lab.py` reports **PASS**: 5,363 source files verified, 73 intentionally removed, 0 errors.
- Negative test: appending one line to `public/crp/SORA.html` produces `source hash mismatch` (FAIL). The file was restored afterwards.

## Not verified / open

- BD confirms that these 7 changes were intended by merging this PR. Merging is the confirmation.
- A future lab PR that changes an exported file must add a row to a `LAB_CHANGES_R*.json`, or `verify_lab.py` fails. This is intended: every lab change stays visible.
