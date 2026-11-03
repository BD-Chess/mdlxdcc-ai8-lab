# CLOUD lab links: broken links with exactly one candidate, 2026-11-03

Branch `cloud/lab-links-unique-20261103`, stacked on `cloud/lab-a11y-critical-20261103` (PR #26, which is stacked on #16). Merge order: #16 → #26 → #25. This is fix set (a) from finding 1 of `reports/CLOUD_lab-audit_20261103.md`. Only `href`/`src` values in `public/` changed. Text and layout did not change.

**Rule.** A link was changed only when all three conditions held:

1. Its target is missing in the lab and the 404 router (`scripts/lab_404_router.js`) does not resolve it.
2. Exactly one file in `public/` has that file name (case-insensitive), not counting the target itself.
3. The new relative link is unambiguous.

Every occurrence was recounted from the source.

**Result.** 62 broken (page, target) links were fixed: **209 attribute values on 18 pages**, now pointing to 18 distinct files. Of the 681 router-missing pairs (1,097 occurrences), 253 had exactly one candidate. The other 191 one-candidate pairs were left alone for the reasons below. 187 of them are on `crp/lab.html`, which production never shows.

## Done

Each row is one page and one old → new value. "Count" is the number of attribute values replaced on that page. Absolute vs relative style, `./` prefixes, queries and fragments were kept.

| Source file | Old href → new href | Count |
|---|---|---|
| `BD/AC_01_Flagship.html` | `AC_02_Operational_Bridge.html` → `../acp/AC_02_Operational_Bridge.html` | 2 |
| `BD/AC_01_Flagship.html` | `AC_03_Discrete_Physics_Companion.html` → `../acp/AC_03_Discrete_Physics_Companion.html` | 1 |
| `BD/AC_01_Flagship.html` | `AC_04_Zero_Framework_Companion.html` → `../acp/AC_04_Zero_Framework_Companion.html` | 1 |
| `BD/AC_01_Flagship.html` | `AC_05_Massless_Carriers_Companion.html` → `../acp/AC_05_Massless_Carriers_Companion.html` | 1 |
| `BD/AC_01_Flagship.html` | `AC_06_Method_Resonance_in_Action.html` → `../acp/AC_06_Method_Resonance_in_Action.html` | 1 |
| `BD/AC_01_Flagship.html` | `AC_07_Resonance_Communications.html` → `../acp/AC_07_Resonance_Communications.html` | 3 |
| `BD/BD_8Z_ssMDL_DCC.html` | `BD_8Z_DCC_Trading_Governor.html` → `../8ZT/BD_8Z_DCC_Trading_Governor.html` | 1 |
| `BD/MDLxDCC-Arena-NAS.html` | `MDLxDCC-Arena-AMR.html` → `../crp/MDLxDCC-Arena-AMR.html` | 1 |
| `BD/MDLxDCC-Arena-NAS.html` | `MDLxDCC-Arena-ARC.html` → `../crp/MDLxDCC-Arena-ARC.html` | 1 |
| `BD/MDLxDCC-Arena-NAS.html` | `MDLxDCC-Arenas.html` → `../crp/MDLxDCC-Arenas.html` | 2 |
| `F4M/BD_8Z_Flip4M_DCC.html` | `BD_8ZRP.html` → `../BD/BD_8ZRP.html` | 2 |
| `F4M/BD_8Z_Flip4M_DCC.html` | `BD_8Z_DCC7_Testbed.html` → `../BD/BD_8Z_DCC7_Testbed.html` | 3 |
| `F4M/BD_8Z_Flip4M_DCC.html` | `BD_8Z_DCC_Recursive.html` → `../BD/BD_8Z_DCC_Recursive.html` | 2 |
| `F4M/BD_8Z_Flip4M_DCC.html` | `BD_CCH_Science.html` → `../BD/BD_CCH_Science.html` | 2 |
| `F4M/BD_8Z_Flip4M_DCC1.html` | `BD_8ZRP.html` → `../BD/BD_8ZRP.html` | 2 |
| `F4M/BD_8Z_Flip4M_DCC1.html` | `BD_8Z_DCC7_Testbed.html` → `../BD/BD_8Z_DCC7_Testbed.html` | 3 |
| `F4M/BD_8Z_Flip4M_DCC1.html` | `BD_8Z_DCC_Recursive.html` → `../BD/BD_8Z_DCC_Recursive.html` | 2 |
| `F4M/BD_8Z_Flip4M_DCC1.html` | `BD_CCH_Science.html` → `../BD/BD_CCH_Science.html` | 2 |
| `F4M/BD_8Z_Flip4M_DCC2.html` | `BD_8ZRP.html` → `../BD/BD_8ZRP.html` | 2 |
| `F4M/BD_8Z_Flip4M_DCC2.html` | `BD_8Z_DCC7_Testbed.html` → `../BD/BD_8Z_DCC7_Testbed.html` | 3 |
| `F4M/BD_8Z_Flip4M_DCC2.html` | `BD_8Z_DCC_Recursive.html` → `../BD/BD_8Z_DCC_Recursive.html` | 2 |
| `F4M/BD_8Z_Flip4M_DCC2.html` | `BD_CCH_Science.html` → `../BD/BD_CCH_Science.html` | 2 |
| `F4M/f4m/document.html` | `BD_8ZRP.html` → `../../BD/BD_8ZRP.html` | 2 |
| `F4M/f4m/document.html` | `BD_8Z_DCC7_Testbed.html` → `../../BD/BD_8Z_DCC7_Testbed.html` | 3 |
| `F4M/f4m/document.html` | `BD_8Z_DCC_Recursive.html` → `../../BD/BD_8Z_DCC_Recursive.html` | 2 |
| `F4M/f4m/document.html` | `BD_CCH_Science.html` → `../../BD/BD_CCH_Science.html` | 2 |
| `F4M/f4m/index.html` | `BD_8ZRP.html` → `../../BD/BD_8ZRP.html` | 2 |
| `F4M/f4m/index.html` | `BD_8Z_DCC7_Testbed.html` → `../../BD/BD_8Z_DCC7_Testbed.html` | 3 |
| `F4M/f4m/index.html` | `BD_8Z_DCC_Recursive.html` → `../../BD/BD_8Z_DCC_Recursive.html` | 2 |
| `F4M/f4m/index.html` | `BD_CCH_Science.html` → `../../BD/BD_CCH_Science.html` | 2 |
| `OS/BD_8Z_OS_Story1.html` | `BD_8ZRP.html` → `../BD/BD_8ZRP.html` | 3 |
| `OS/BD_8Z_OS_Story1.html` | `BD_8Z_DCC7_Testbed.html` → `../BD/BD_8Z_DCC7_Testbed.html` | 3 |
| `OS/BD_8Z_OS_Story1.html` | `BD_8Z_DCC_Recursive.html` → `../BD/BD_8Z_DCC_Recursive.html` | 2 |
| `OS/BD_8Z_OS_Story1.html` | `BD_CCH_Science.html` → `../BD/BD_CCH_Science.html` | 3 |
| `OS/BD_8Z_OS_Story1.html` | `BD_portfolio.html` → `../BD/BD_portfolio.html` | 3 |
| `OS/BD_8Z_OS_Story2.html` | `BD_8ZRP.html` → `../BD/BD_8ZRP.html` | 3 |
| `OS/BD_8Z_OS_Story2.html` | `BD_8Z_DCC7_Testbed.html` → `../BD/BD_8Z_DCC7_Testbed.html` | 13 |
| `OS/BD_8Z_OS_Story2.html` | `BD_8Z_DCC_Recursive.html` → `../BD/BD_8Z_DCC_Recursive.html` | 2 |
| `OS/BD_8Z_OS_Story2.html` | `BD_CCH_Science.html` → `../BD/BD_CCH_Science.html` | 3 |
| `OS/BD_8Z_OS_Story3.html` | `BD_8ZRP.html` → `../BD/BD_8ZRP.html` | 3 |
| `OS/BD_8Z_OS_Story3.html` | `BD_8Z_DCC7_Testbed.html` → `../BD/BD_8Z_DCC7_Testbed.html` | 13 |
| `OS/BD_8Z_OS_Story3.html` | `BD_8Z_DCC_Recursive.html` → `../BD/BD_8Z_DCC_Recursive.html` | 2 |
| `OS/BD_8Z_OS_Story3.html` | `BD_CCH_Science.html` → `../BD/BD_CCH_Science.html` | 3 |
| `OS/BD_8Z_OS_Story4.html` | `BD_8ZRP.html` → `../BD/BD_8ZRP.html` | 3 |
| `OS/BD_8Z_OS_Story4.html` | `BD_8Z_DCC7_Testbed.html` → `../BD/BD_8Z_DCC7_Testbed.html` | 13 |
| `OS/BD_8Z_OS_Story4.html` | `BD_8Z_DCC_Recursive.html` → `../BD/BD_8Z_DCC_Recursive.html` | 2 |
| `OS/BD_8Z_OS_Story4.html` | `BD_CCH_Science.html` → `../BD/BD_CCH_Science.html` | 3 |
| `OS/BD_8Z_OS_Story5.html` | `BD_8ZRP.html` → `../BD/BD_8ZRP.html` | 3 |
| `OS/BD_8Z_OS_Story5.html` | `BD_8Z_DCC7_Testbed.html` → `../BD/BD_8Z_DCC7_Testbed.html` | 13 |
| `OS/BD_8Z_OS_Story5.html` | `BD_8Z_DCC_Recursive.html` → `../BD/BD_8Z_DCC_Recursive.html` | 2 |
| `OS/BD_8Z_OS_Story5.html` | `BD_CCH_Science.html` → `../BD/BD_CCH_Science.html` | 3 |
| `OS/BD_8Z_OS_Story6.html` | `BD_8ZRP.html` → `../BD/BD_8ZRP.html` | 3 |
| `OS/BD_8Z_OS_Story6.html` | `BD_8Z_DCC7_Testbed.html` → `../BD/BD_8Z_DCC7_Testbed.html` | 13 |
| `OS/BD_8Z_OS_Story6.html` | `BD_8Z_DCC_Recursive.html` → `../BD/BD_8Z_DCC_Recursive.html` | 2 |
| `OS/BD_8Z_OS_Story6.html` | `BD_CCH_Science.html` → `../BD/BD_CCH_Science.html` | 3 |
| `OS/index-O.html` | `BD_8ZRP.html` → `../BD/BD_8ZRP.html` | 3 |
| `OS/index-O.html` | `BD_8Z_DCC7_Testbed.html` → `../BD/BD_8Z_DCC7_Testbed.html` | 13 |
| `OS/index-O.html` | `BD_8Z_DCC_Recursive.html` → `../BD/BD_8Z_DCC_Recursive.html` | 2 |
| `OS/index-O.html` | `BD_CCH_Science.html` → `../BD/BD_CCH_Science.html` | 3 |
| `c/MDLxDCC_Outreach.html` | `./C/AI8_MoM_Outreach.html` → `./AI8_MoM_Outreach.html` | 3 |
| `crp/AC.html` | `Less Describes More (formulas).png` → `../BD/Less Describes More (formulas).png` | 1 |
| `crp/How_LLMs_Actually_Work.html` | `How_LLMs_Actually_Work_Comparison_Report.html` → `../BD/How_LLMs_Actually_Work_Comparison_Report.html` | 6 |

## Stacking on #26 (Zora review)

- Rebased from #16 onto #26 (`1c7c189`). The fix commit `8e788ed` is now `b7ae474`; `LAB_CHANGES_R11` names the new commit.
- The only file both PRs change is `public/crp/How_LLMs_Actually_Work.html` (#26: attributes for accessibility; #25: 6 `href` values). The rebase had no conflict. Its `lab_sha256` in `LAB_CHANGES_R11` is recomputed for the file with both changes (`191b8dc7…` → `19151f55…`); `LAB_CHANGES_R12` keeps the #26-only value.
- Check: compared with #26, the 18 changed `public/` files differ only in `href`/`src` values (byte-identical with those values blanked; line and CRLF counts unchanged). `verify_lab.py` passes on the stacked branch.
- The before/after measurements below were taken on `e228ce8` / `8e788ed`, before the rebase. #26 changes no `href`/`src` value, so the link counts do not depend on it.

## Verified

Two fresh builds were made with `scripts/build_pages.py`, both outside the repo: **before** = `e228ce8` (base) and **after** = `8e788ed` (this fix). The static link check is the audit's `linkcheck.py`. Every broken target was then replayed through the real `labRoute()` taken from each build's `404.html`.

| Measure | Before | After | Change |
|---|---|---|---|
| Static check `internal_broken`: targets / (target, page) pairs / occurrences | 515 / 918 / 1,633 | 490 / 856 / 1,424 | −25 / −62 / −209 |
| Router replay, **missing everywhere in the lab** (what this set targets): pairs / occurrences / targets | 681 / 1,097 / 498 | 619 / 888 / 473 | −62 / −209 / −25 |
| One candidate, still broken (all skipped on purpose, see below) | 253 pairs | 191 pairs | −62 |
| Case/extension (`local` via router) / production page / production rule | 455 / 208 / 29 pairs | 455 / 208 / 29 pairs | unchanged |

- **No regressions.** No broken pair appeared after the change, and no other count changed. The 62 resolved pairs are exactly the 62 edits.
- **Edit check.** The committed files equal `e228ce8` plus exactly these replacements. With every `href=""`/`src=""` value blanked, each old and new file is byte-identical. Line counts and CRLF counts are unchanged.
- **Browser spot-check.** Playwright Chromium ran against `ghpages_server.mjs` (GitHub-Pages-like, serves `404.html` with status 404) on ports 8901 (before) and 8902 (after). It opened 13 fixed links by clicking the anchor on the source page:
  - pages: `OS/BD_8Z_OS_Story1` (2 links), `OS/BD_8Z_OS_Story4`, `OS/index-O`, `F4M/BD_8Z_Flip4M_DCC`, `F4M/BD_8Z_Flip4M_DCC2`, `F4M/f4m/document`, `F4M/f4m/index`, `BD/AC_01_Flagship`, `BD/BD_8Z_ssMDL_DCC`, `BD/MDLxDCC-Arena-NAS`, `c/MDLxDCC_Outreach`, `crp/How_LLMs_Actually_Work`;
  - before: **13/13 landed on "AI8 Lab — stran ni najdena"**;
  - after: **13/13 landed on the intended page**, with the expected title (for example "DCC-7: A Seven-Thread Consciousness Testbed", "MDLxDCC Arenas — Grand Challenge Hub").
- **Image.** The `crp/AC.html` image (`Less Describes More (formulas).png`, 7.6 MB) is now rewritten by the build to its `raw.githubusercontent.com` URL. The URL returned 200 `image/png` for a build at the pushed base commit. Before, it pointed to a missing lab path.
- **`python3 scripts/verify_lab.py`: PASS** (5,363 source files, 0 errors) with `lab-evidence/LAB_CHANGES_R11.json`. `lab-evidence/VALIDATION_R1.json` was restored with `git checkout --`.
- **Production (read-only `/home/user/bd-chessdb`, at `d9c0242`, the commit the lab synced from).** All 62 fixed hrefs appear unchanged in production's source. Their targets are absent there at the resolved path, and no rule in `public/_redirects` or `netlify.toml` matches them. **These links are broken in production's source as well**; the live site was not checked (blocked here).
  - Production also serves `F4M/f4m/document.html` at `/f4m/f4m` and `/f4m/f4m/` (`netlify.toml`, 200 force). The new `../../BD/…` links resolve to the same files from those URLs.

## Skipped with reason

All numbers are (page, target) pairs from the **before** build. None of the skipped targets exists at its resolved path in production's `public/` either, except group B, where the files exist in both.

### A. Exactly one candidate, but not changed (191 pairs)

#### A1. `crp/lab.html`: 187 pairs, 219 values, all with one candidate

Not changed:

- Production force-redirects this page: `/crp/lab.html → /lab.html 301!` and `/crp/lab → /lab.html 301!` in `public/_redirects`, under "Hygiene Batch 1: keep legacy URLs and correct relative-link bases". This is BD's own fix for exactly these links.
- Production never displays `crp/lab.html`. The current page is `public/lab.html`, whose links resolve from the root.
- No lab page links to `crp/lab.html`. GitHub Pages serves it only because the file exists; the router replays rules only for missing paths.
- The right lab fix is in the build or router lane (honour forced `!` rules for files that exist), not in content. The same applies to other forced rules on existing files, for example `/BD-work-at-a-glance.html → /w/` and `/index-pwa.html → /`.

<details><summary>The 187 one-candidate links on crp/lab.html (old href → only file)</summary>

- `8Z/8Z_compression.html` → `8Z/8Z_compression.html`
- `8Z/8Z_project_files_manager.html` → `8Z/8Z_project_files_manager.html`
- `8ZT/BD_8Z_DCC_Trading_Governor.html` → `8ZT/BD_8Z_DCC_Trading_Governor.html`
- `8ZT/BD_8Z_Trading_ChatGPT_Review.html` → `8ZT/BD_8Z_Trading_ChatGPT_Review.html`
- `8ZT/BD_8Z_Trading_Gemini_Review.html` → `8ZT/BD_8Z_Trading_Gemini_Review.html`
- `8ZT/BD_8Z_Trading_Grok_Review.html` → `8ZT/BD_8Z_Trading_Grok_Review.html`
- `8ZT/MDL_DCC_Trading.html` → `8ZT/MDL_DCC_Trading.html`
- `8ZT/MDL_DCC_Trading_Reference.html` → `8ZT/MDL_DCC_Trading_Reference.html`
- `8ZT/sm.html` → `8ZT/sm.html`
- `8ZT/zz.html` → `8ZT/zz.html`
- `AC/8Z-AC_Appendix_M.html` → `AC/8Z-AC_Appendix_M.html`
- `AC/8Z-AC_BD_CLA_Story.html` → `AC/8Z-AC_BD_CLA_Story.html`
- `AC/8Z-AC_BD_GEM_Story.html` → `AC/8Z-AC_BD_GEM_Story.html`
- `AC/8Z-AC_BD_GPT_Story.html` → `AC/8Z-AC_BD_GPT_Story.html`
- `AC/8Z-AC_BD_GRO_Story.html` → `AC/8Z-AC_BD_GRO_Story.html`
- `AC/8Z-AC_Classical_Max_Roadmap.html` → `AC/8Z-AC_Classical_Max_Roadmap.html`
- `AC/8Z-AC_evolution.html` → `AC/8Z-AC_evolution.html`
- `AC/8Z-AC_main.html` → `AC/8Z-AC_main.html`
- `AC/8Z-AC_main_page.html` → `AC/8Z-AC_main_page.html`
- `AC/8Z-Audio_Benchmark.html` → `AC/8Z-Audio_Benchmark.html`
- `AC/8Z-Audio_Master_Plan.html` → `AC/8Z-Audio_Master_Plan.html`
- `AC/8Z-Audio_v.8_Master_Plan.html` → `AC/8Z-Audio_v.8_Master_Plan.html`
- `AC/8Z-xFLAC_Optimization_Sprint.html` → `AC/8Z-xFLAC_Optimization_Sprint.html`
- `AC/8Z_Audio_Master_Plan.html` → `AC/8Z_Audio_Master_Plan.html`
- `AC/mp3.html` → `AC/mp3.html`
- `BD/AC3.html` → `BD/AC3.html`
- `BD/AC4.html` → `BD/AC4.html`
- `BD/BD_8ZRP.html` → `BD/BD_8ZRP.html`
- `BD/BD_8ZRP_arena.html` → `BD/BD_8ZRP_arena.html`
- `BD/BD_8ZRP_nu3496_status.html` → `BD/BD_8ZRP_nu3496_status.html`
- `BD/BD_8ZRP_qa194_map.html` → `BD/BD_8ZRP_qa194_map.html`
- `BD/BD_8ZRP_qa194_map2.html` → `BD/BD_8ZRP_qa194_map2.html`
- `BD/BD_8ZRP_v1_0.html` → `BD/BD_8ZRP_v1_0.html`
- `BD/BD_8ZRP_v1_1.html` → `BD/BD_8ZRP_v1_1.html`
- `BD/BD_8Z_AI_Storm_Challenge.html` → `BD/BD_8Z_AI_Storm_Challenge.html`
- `BD/BD_8Z_Birth_of_Thought.html` → `BD/BD_8Z_Birth_of_Thought.html`
- `BD/BD_8Z_DCC7_Testbed.html` → `BD/BD_8Z_DCC7_Testbed.html`
- `BD/BD_8Z_DCC_ActionPlan.html` → `BD/BD_8Z_DCC_ActionPlan.html`
- `BD/BD_8Z_DCC_Meta_Architecture.html` → `BD/BD_8Z_DCC_Meta_Architecture.html`
- `BD/BD_8Z_DCC_Recursive.html` → `BD/BD_8Z_DCC_Recursive.html`
- `BD/BD_8Z_Fifth_Mind.html` → `BD/BD_8Z_Fifth_Mind.html`
- `BD/BD_8Z_Fifth_Mind_Asks.html` → `BD/BD_8Z_Fifth_Mind_Asks.html`
- `BD/BD_8Z_OS_Story.html` → `BD/BD_8Z_OS_Story.html`
- `BD/BD_8Z_Pact.html` → `BD/BD_8Z_Pact.html`
- `BD/BD_8Z_Publish3.html` → `BD/BD_8Z_Publish3.html`
- `BD/BD_8Z_Reasoning_Examples.html` → `BD/BD_8Z_Reasoning_Examples.html`
- `BD/BD_8Z_Reasoning_Principles.html` → `BD/BD_8Z_Reasoning_Principles.html`
- `BD/BD_8Z_Resonance_Hybrid_Protocol.html` → `BD/BD_8Z_Resonance_Hybrid_Protocol.html`
- `BD/BD_8Z_ssMDL_DCC.html` → `BD/BD_8Z_ssMDL_DCC.html`
- `BD/BD_8Z_ssMDL_DCC_Challenge.html` → `BD/BD_8Z_ssMDL_DCC_Challenge.html`
- `BD/BD_AIM3.html` → `BD/BD_AIM3.html`
- `BD/BD_AIM3_RHP.html` → `BD/BD_AIM3_RHP.html`
- `BD/BD_AIM3_RHP_Story.html` → `BD/BD_AIM3_RHP_Story.html`
- `BD/BD_AIM3_RHPr.html` → `BD/BD_AIM3_RHPr.html`
- `BD/BD_ASI_Origin.html` → `BD/BD_ASI_Origin.html`
- `BD/BD_CCH_Consciousness_Field.html` → `BD/BD_CCH_Consciousness_Field.html`
- `BD/BD_CCH_Foundations.html` → `BD/BD_CCH_Foundations.html`
- `BD/BD_CCH_Science.html` → `BD/BD_CCH_Science.html`
- `BD/BD_Evaluation_Protocol.html` → `BD/BD_Evaluation_Protocol.html`
- `BD/BD_portfolio.html` → `BD/BD_portfolio.html`
- `BD/BD_portfolio_NCI1.html` → `BD/BD_portfolio_NCI1.html`
- `BD/BD_portfolio_NCI2.html` → `BD/BD_portfolio_NCI2.html`
- `BD/BD_portfolio_NCI3.html` → `BD/BD_portfolio_NCI3.html`
- `BD/BD_portfolio_NCI4.html` → `BD/BD_portfolio_NCI4.html`
- `BD/BD_portfolio_OK.html` → `BD/BD_portfolio_OK.html`
- `BD/Interventni_zakon_2026_Slovenija.html` → `BD/Interventni_zakon_2026_Slovenija.html`
- `BD/LessDescribesMore.html` → `BD/LessDescribesMore.html`
- `BD/NCI_PL_BD_Interactive.html` → `BD/NCI_PL_BD_Interactive.html`
- `BD/NCI_PL_legacy.html` → `BD/NCI_PL_legacy.html`
- `BD/NCO_stats.html` → `BD/NCO_stats.html`
- `BD/NCO_statsW.html` → `BD/NCO_statsW.html`
- `BD/Promo.html` → `BD/Promo.html`
- `BD/bdc4.html` → `BD/bdc4.html`
- `BD/c.html` → `BD/c.html`
- `BD/cbd3.html` → `BD/cbd3.html`
- `BD/index-bd.html` → `index-bd.html`
- `BD/lastovo.html` → `BD/lastovo.html`
- `BD/wifi.html` → `BD/wifi.html`
- `CW/8z_CW.html` → `CW/8z_CW.html`
- `CW/8z_CW_v1.html` → `CW/8z_CW_v1.html`
- `CW/8z_CW_v2.html` → `CW/8z_CW_v2.html`
- `CW/8z_CW_v3.html` → `CW/8z_CW_v3.html`
- `CW/8z_CW_v4.html` → `CW/8z_CW_v4.html`
- `CW/8z_CW_viewer.html` → `CW/8z_CW_viewer.html`
- `F4M/BD_8Z_Flip4M_DCC1.html` → `F4M/BD_8Z_Flip4M_DCC1.html`
- `F4M/BD_8Z_Flip4M_DCC2.html` → `F4M/BD_8Z_Flip4M_DCC2.html`
- `F4M/CCH_AI_v1.4.html` → `F4M/CCH_AI_v1.4.html`
- `F4M/F4M_paper_CLA.html` → `F4M/F4M_paper_CLA.html`
- `F4M/F4M_paper_GRO.html` → `F4M/F4M_paper_GRO.html`
- `F4M/F4M_paper_GRO2.html` → `F4M/F4M_paper_GRO2.html`
- `F4M/F4M_paper_QWE.html` → `F4M/F4M_paper_QWE.html`
- `F4M/F4M_paper_QWE2.html` → `F4M/F4M_paper_QWE2.html`
- `F4M/F4M_rDCC_Tournament.html` → `F4M/F4M_rDCC_Tournament.html`
- `F4M/F4M_rDCC_v2_Tournament.html` → `F4M/F4M_rDCC_v2_Tournament.html`
- `F4M/F4M_rDCC_v4_Tournament.html` → `F4M/F4M_rDCC_v4_Tournament.html`
- `F4M/F4Pro.html` → `F4M/F4Pro.html`
- `F4M/F4_CLA.html` → `F4M/F4_CLA.html`
- `F4M/F4_DSE.html` → `F4M/F4_DSE.html`
- `F4M/F4_GEM.html` → `F4M/F4_GEM.html`
- `F4M/F4_GPT.html` → `F4M/F4_GPT.html`
- `F4M/F4_QWE.html` → `F4M/F4_QWE.html`
- `F4M/imdex.html` → `F4M/imdex.html`
- `F4M/index4.html` → `F4M/index4.html`
- `LO/8Z-FE_report.html` → `LO/8Z-FE_report.html`
- `LO/8Z_DNA_FASTA.html` → `LO/8Z_DNA_FASTA.html`
- `LO/8Z_FASTA_Manifest.html` → `LO/8Z_FASTA_Manifest.html`
- `Mix/Heroes.html` → `Mix/Heroes.html`
- `Mix/MP3_Resurrection.html` → `Mix/MP3_Resurrection.html`
- `Mix/Olympics2026.html` → `Mix/Olympics2026.html`
- `OS/BD_8Z_OS_Story1.html` → `OS/BD_8Z_OS_Story1.html`
- `OS/BD_8Z_OS_Story2.html` → `OS/BD_8Z_OS_Story2.html`
- `OS/BD_8Z_OS_Story3.html` → `OS/BD_8Z_OS_Story3.html`
- `OS/BD_8Z_OS_Story4.html` → `OS/BD_8Z_OS_Story4.html`
- `OS/BD_8Z_OS_Story6.html` → `OS/BD_8Z_OS_Story6.html`
- `S/8zSudoku-investor.html` → `S/8zSudoku-investor.html`
- `S/8zSudoku.html` → `S/8zSudoku.html`
- `SLO/Interventni_zakon_2026.html` → `SLO/Interventni_zakon_2026.html`
- `SLO/Krozenje_talentov.html` → `SLO/Krozenje_talentov.html`
- `acp/AC_01_Flagship_En.html` → `acp/AC_01_Flagship_En.html`
- `acp/AC_02_Operational_Bridge.html` → `acp/AC_02_Operational_Bridge.html`
- `acp/AC_03_Discrete_Physics_Companion.html` → `acp/AC_03_Discrete_Physics_Companion.html`
- `acp/AC_04_Zero_Framework_Companion.html` → `acp/AC_04_Zero_Framework_Companion.html`
- `acp/AC_05_Massless_Carriers_Companion.html` → `acp/AC_05_Massless_Carriers_Companion.html`
- `acp/AC_06_Method_Resonance_in_Action.html` → `acp/AC_06_Method_Resonance_in_Action.html`
- `acp/AC_07_Resonance_Communications.html` → `acp/AC_07_Resonance_Communications.html`
- `acp/AC_Atlas.html` → `acp/AC_Atlas.html`
- `acp/AC_Kardashev.html` → `acp/AC_Kardashev.html`
- `acp/Reality.html` → `acp/Reality.html`
- `acp/RealityPhysics.html` → `acp/RealityPhysics.html`
- `acp/RealityQA.html` → `acp/RealityQA.html`
- `crp/AI8_AGI_Positioning.html` → `crp/AI8_AGI_Positioning.html`
- `crp/AI8_Nothingness.html` → `crp/AI8_Nothingness.html`
- `crp/AI8_Review.html` → `crp/AI8_Review.html`
- `crp/APSV.html` → `crp/APSV.html`
- `crp/CodeCapsules.html` → `crp/CodeCapsules.html`
- `crp/DGTE-HTH.html` → `crp/DGTE-HTH.html`
- `crp/DGTE.html` → `crp/DGTE.html`
- `crp/DNA.html` → `crp/DNA.html`
- `crp/GoodAndEvil.html` → `crp/GoodAndEvil.html`
- `crp/HTH.html` → `crp/HTH.html`
- `crp/Humanity.html` → `crp/Humanity.html`
- `crp/Justice.html` → `crp/Justice.html`
- `crp/MDLxDCC-Arena-AMR.html` → `crp/MDLxDCC-Arena-AMR.html`
- `crp/MDLxDCC-Arena-ARC.html` → `crp/MDLxDCC-Arena-ARC.html`
- `crp/MDLxDCC-Arena-DGTE.html` → `crp/MDLxDCC-Arena-DGTE.html`
- `crp/MDLxDCC-Arena-Millennium.html` → `crp/MDLxDCC-Arena-Millennium.html`
- `crp/MDLxDCC-Arena-Poincare.html` → `crp/MDLxDCC-Arena-Poincare.html`
- `crp/MDLxDCC-Arena-RH.html` → `crp/MDLxDCC-Arena-RH.html`
- `crp/MDLxDCC-Arenas.html` → `crp/MDLxDCC-Arenas.html`
- `crp/MDLxDCC-Demon.html` → `crp/MDLxDCC-Demon.html`
- `crp/MGHB.html` → `crp/MGHB.html`
- `crp/Maglev_Assisted_Takeoff.html` → `crp/Maglev_Assisted_Takeoff.html`
- `crp/Meat_Ethics.html` → `crp/Meat_Ethics.html`
- `crp/Modular_Hydrofoils.html` → `crp/Modular_Hydrofoils.html`
- `crp/People.html` → `crp/People.html`
- `crp/Physics_CFH_MDLxDCC.html` → `crp/Physics_CFH_MDLxDCC.html`
- `crp/PiC.html` → `crp/PiC.html`
- `crp/PiX.html` → `crp/PiX.html`
- `crp/Religions.html` → `crp/Religions.html`
- `crp/SORA.html` → `crp/SORA.html`
- `crp/SeedBank.html` → `crp/SeedBank.html`
- `crp/TalkingToAliens.html` → `crp/TalkingToAliens.html`
- `crp/Top100.html` → `crp/Top100.html`
- `crp/Top100I.html` → `crp/Top100I.html`
- `crp/Top100P.html` → `crp/Top100P.html`
- `crp/Top100T.html` → `crp/Top100T.html`
- `crp/Training.html` → `crp/Training.html`
- `history/01_deep_humanity_300000_20000_bce.html` → `history/01_deep_humanity_300000_20000_bce.html`
- `history/02_ice_age_transition_20000_10000_bce.html` → `history/02_ice_age_transition_20000_10000_bce.html`
- `history/03_agriculture_10000_3000_bce.html` → `history/03_agriculture_10000_3000_bce.html`
- `history/04_ancient_world_3000_1000_bce.html` → `history/04_ancient_world_3000_1000_bce.html`
- `history/05_classical_world_1000_bce_500_ce.html` → `history/05_classical_world_1000_bce_500_ce.html`
- `history/06_medieval_world_500_1500.html` → `history/06_medieval_world_500_1500.html`
- `history/07_early_modern_1500_1800.html` → `history/07_early_modern_1500_1800.html`
- `history/08_industrial_age_1800_1900.html` → `history/08_industrial_age_1800_1900.html`
- `history/09_machine_age_1900_2000.html` → `history/09_machine_age_1900_2000.html`
- `history/10_digital_ai_age_2000_2026.html` → `history/10_digital_ai_age_2000_2026.html`
- `history/11_one_possible_branch_2026_2036.html` → `history/11_one_possible_branch_2026_2036.html`
- `history/about.html` → `history/about.html`
- `history/changelog.html` → `history/changelog.html`
- `history/glossary.html` → `history/glossary.html`
- `history/methodology.html` → `history/methodology.html`
- `history/timeline.html` → `history/timeline.html`
- `llms-full.txt` → `llms-full.txt`
- `llms.txt` → `llms.txt`
- `site_inventory.csv` → `site_inventory.csv`
- `site_organization_audit.json` → `site_organization_audit.json`
</details>

#### A2. Other pages (4 pairs)

| Page | Old href → only file | Values | Reason |
|---|---|---|---|
| `BD/BD_8Z_DCC_Recursive.html` | `BD_8Z_DCC_Trading_Governor.html` → `8ZT/BD_8Z_DCC_Trading_Governor.html` | 2 | bd-access-data encrypted payload |
| `BD/SM_trader.html` | `ZZ.html` → `8ZT/zz.html` | 2 | bd-access-data encrypted payload |
| `S/app.html` | `../8zSudoku-investor.html` → `S/8zSudoku-investor.html` | 2 | SHA-256 of the page is pinned in S/new/release.json, S/new/sw.js, S/release.json, S/sw.js |
| `chess/engines/reckless/v0.10.0-a6fa482c-r8/source-download.html` | `../../../research/reckless-adapter.test.cjs` → `chess-lab/research/reckless-adapter.test.cjs` | 1 | SHA-256 of the page is pinned in chess-lab/engines/reckless/v0.10.0-a6fa482c-r8/manifest.json, chess/engines/reckless/v0.10.0-a6fa482c-r8/manifest.json; chess/ is also its own publish root (_redirects); link would leave it |

`S/app.html`: the Sudoku PWA service worker (`S/sw.js`) checks the SHA-256 of `app.html` against `S/release.json` before it installs a release. `tests/sudoku-pwa.test.cjs` checks the same hashes. Editing the page would break the release, so the fix needs a new Sudoku release. `chess/`: `chess/_redirects` says `public/chess` also becomes its own Netlify publish root (ChessBest), so a link from `chess/` into `chess-lab/` would not resolve there. The page is also hash-pinned in both `manifest.json` files.

### B. The file exists at that exact path: a lab build issue, not a wrong link (157 pairs, 313 occurrences, 73 targets)

These targets exist in `public/` exactly where the link points. All 157 are `srcset` entries for images larger than 128 KB, which `build_pages.py` moves out of the Pages artifact to `raw.githubusercontent.com`. Its URL rewrite (`ATTR`) does not cover `srcset`, so these candidates stay pointing at a lab path that no longer exists.

- 156 are under `Nara/assets/img/daily/…`; 1 is `crp/assets/dgte/dgte-render-module-r4-1536.webp` in `crp/DGTE.html`.
- They work in production. They should be fixed in the build lane by rewriting `srcset` entries for offloaded media.

<details><summary>73 targets</summary>

`Nara/assets/img/daily/2026-10-13/S2/moment-01-P-HD.webp`, `Nara/assets/img/daily/2026-10-13/S2/moment-02-P-HD.webp`, `Nara/assets/img/daily/2026-10-13/S2/moment-03-P-HD.webp`, `Nara/assets/img/daily/2026-10-14/S1/moment-01-P-HD.webp`, `Nara/assets/img/daily/2026-10-14/S1/moment-02-P-HD.webp`, `Nara/assets/img/daily/2026-10-14/S1/moment-03-P-HD.webp`, `Nara/assets/img/daily/2026-10-15/S3/moment-01-P-HD.webp`, `Nara/assets/img/daily/2026-10-15/S3/moment-02-P-HD.webp`, `Nara/assets/img/daily/2026-10-15/S3/moment-03-P-HD.webp`, `Nara/assets/img/daily/2026-10-16/S1/moment-01-P-HD.webp`, `Nara/assets/img/daily/2026-10-16/S1/moment-02-P-HD-handfix-r2.webp`, `Nara/assets/img/daily/2026-10-16/S1/moment-03-P-HD.webp`, `Nara/assets/img/daily/2026-10-17/S2/moment-01-P-HD.webp`, `Nara/assets/img/daily/2026-10-17/S2/moment-02-P-HD.webp`, `Nara/assets/img/daily/2026-10-17/S2/moment-03-P-HD.webp`, `Nara/assets/img/daily/2026-10-18/S1/moment-01-P-HD.webp`, `Nara/assets/img/daily/2026-10-18/S1/moment-02-P-HD.webp`, `Nara/assets/img/daily/2026-10-18/S1/moment-03-P-HD.webp`, `Nara/assets/img/daily/2026-10-19/S1/moment-01-P-HD-v1.webp`, `Nara/assets/img/daily/2026-10-19/S1/moment-02-P-HD-v1.webp`, `Nara/assets/img/daily/2026-10-19/S1/moment-03-P-HD-v1.webp`, `Nara/assets/img/daily/2026-10-23/S3/M01_P.webp`, `Nara/assets/img/daily/2026-10-23/S3/M02_P.webp`, `Nara/assets/img/daily/2026-10-23/S3/M03_P.webp`, `Nara/assets/img/daily/2026-10-24/S1/M01_P.webp`, `Nara/assets/img/daily/2026-10-24/S1/M02_P.webp`, `Nara/assets/img/daily/2026-10-24/S1/M03_P.webp`, `Nara/assets/img/daily/2026-10-25/S2/M01_P.webp`, `Nara/assets/img/daily/2026-10-25/S2/M02_P.webp`, `Nara/assets/img/daily/2026-10-25/S2/M03_P.webp`, `Nara/assets/img/daily/2026-10-29/S1/M01_P.webp`, `Nara/assets/img/daily/2026-10-29/S1/M02_P.webp`, `Nara/assets/img/daily/2026-10-29/S1/M03_P.webp`, `Nara/assets/img/daily/2026-11-01/S1/M01_P.webp`, `Nara/assets/img/daily/2026-11-01/S1/M02_P.webp`, `Nara/assets/img/daily/2026-11-01/S1/M03_P.webp`, `Nara/assets/img/daily/2026-10-20/S3/moment-01-P_HD-v1.webp`, `Nara/assets/img/daily/2026-10-20/S3/moment-02-P_HD-v1.webp`, `Nara/assets/img/daily/2026-10-20/S3/moment-03-P_HD-v1.webp`, `Nara/assets/img/daily/2026-10-21/S3/moment-01-P_HD-v1.webp`, `Nara/assets/img/daily/2026-10-21/S3/moment-02-P_HD-v2.webp`, `Nara/assets/img/daily/2026-10-21/S3/moment-03-P_HD-v1.webp`, `Nara/assets/img/daily/2026-10-22/S2/M01_P.webp`, `Nara/assets/img/daily/2026-10-22/S2/M02_P.webp`, `Nara/assets/img/daily/2026-10-22/S2/M03_P.webp`, `Nara/assets/img/daily/2026-10-28/S1/M01_P.webp`, `Nara/assets/img/daily/2026-10-28/S1/M02_P.webp`, `Nara/assets/img/daily/2026-10-28/S1/M03_P.webp`, `Nara/assets/img/daily/2026-10-05/R1-responsive/moment-01-P-HD-R1.webp`, `Nara/assets/img/daily/2026-10-05/R1-responsive/moment-02-P-HD-R1.webp`, `Nara/assets/img/daily/2026-10-05/R1-responsive/moment-03-P-HD-R1.webp`, `Nara/assets/img/daily/2026-10-06/R1-responsive/moment-01-P-HD-R1.webp`, `Nara/assets/img/daily/2026-10-06/R1-responsive/moment-02-P-HD-R1.webp`, `Nara/assets/img/daily/2026-10-06/R1-responsive/moment-03-P-HD-R1.webp`, `Nara/assets/img/daily/2026-10-07/R1-responsive/moment-01-P-HD-R1.webp`, `Nara/assets/img/daily/2026-10-07/R1-responsive/moment-02-P-HD-R1.webp`, `Nara/assets/img/daily/2026-10-07/R1-responsive/moment-03-P-HD-R1.webp`, `Nara/assets/img/daily/2026-10-08/R1-responsive/moment-01-P-HD-R4.webp`, `Nara/assets/img/daily/2026-10-08/R1-responsive/moment-02-P-HD-R4.webp`, `Nara/assets/img/daily/2026-10-08/R1-responsive/moment-03-P-HD-R4.webp`, `Nara/assets/img/daily/2026-10-09/S1/R1-responsive/moment-01-P-HD-R4.webp`, `Nara/assets/img/daily/2026-10-09/S1/R1-responsive/moment-02-P-HD-R4.webp`, `Nara/assets/img/daily/2026-10-09/S1/R1-responsive/moment-03-P-HD-R4.webp`, `Nara/assets/img/daily/2026-10-10/S2/R1-responsive/moment-01-P-HD-R4.webp`, `Nara/assets/img/daily/2026-10-10/S2/R1-responsive/moment-02-P-HD-R4.webp`, `Nara/assets/img/daily/2026-10-10/S2/R1-responsive/moment-03-P-HD-R4.webp`, `Nara/assets/img/daily/2026-10-11/S1/R1-responsive/moment-01-P-HD-R1.webp`, `Nara/assets/img/daily/2026-10-11/S1/R1-responsive/moment-02-P-HD-R1.webp`, `Nara/assets/img/daily/2026-10-11/S1/R1-responsive/moment-03-P-HD-R1.webp`, `Nara/assets/img/daily/2026-10-12/S3/R1-responsive/moment-01-P-HD-R6.webp`, `Nara/assets/img/daily/2026-10-12/S3/R1-responsive/moment-02-P-HD-R6.webp`, `Nara/assets/img/daily/2026-10-12/S3/R1-responsive/moment-03-P-HD-R6.webp`, `crp/assets/dgte/dgte-render-module-r4-1536.webp`
</details>

### C. Several candidates (102 pairs, 125 occurrences, 77 targets)

These were not changed, because choosing a candidate would be a guess. Examples:

- `OS/BD_8Z_Reasoning.html` (7 pages): the candidates are `BD/` and `crp/`.
- `index-o.html` (10 archived `index-bck*` pages): the candidates are `OS/index-O.html` and `8zS/index-o.html`.
- `BD/8Z OS VMs.PNG`: the only difference from `BD/8Z OS VMs.png` is the case of the extension. The router cannot see that file because it is offloaded media. This one belongs with the build lane's case handling.

<details><summary>77 targets (target · pages · candidates · example pages)</summary>

| Target (lab path) | Pages | Candidates | Example pages |
|---|---|---|---|
| `index-o.html` | 10 | `8zS/index-o.html`, `OS/index-O.html` | `index-bck10.html`, `index-bck2.html`, `index-bck3.html` +7 more |
| `OS/BD_8Z_Flip4M_DCC.html` | 7 | `BD/BD_8Z_Flip4M_DCC.html`, `F4M/BD_8Z_Flip4M_DCC.html` | `OS/BD_8Z_OS_Story1.html`, `OS/BD_8Z_OS_Story2.html`, `OS/BD_8Z_OS_Story3.html` +4 more |
| `OS/BD_8Z_Reasoning.html` | 7 | `BD/BD_8Z_Reasoning.html`, `crp/BD_8Z_Reasoning.html` | `OS/BD_8Z_OS_Story1.html`, `OS/BD_8Z_OS_Story2.html`, `OS/BD_8Z_OS_Story3.html` +4 more |
| `F4M/BD_8Z_Reasoning.html` | 3 | `BD/BD_8Z_Reasoning.html`, `crp/BD_8Z_Reasoning.html` | `F4M/BD_8Z_Flip4M_DCC.html`, `F4M/BD_8Z_Flip4M_DCC1.html`, `F4M/BD_8Z_Flip4M_DCC2.html` |
| `BD/8Z OS VMs.PNG` | 2 | `BD/8Z OS VMs.png`, `OS/8Z OS VMs.PNG` | `BD/BD_8Z_OS_Story.html`, `BD/BD_8Z_OS_Story5.html` |
| `F4M/f4m/BD_8Z_Reasoning.html` | 2 | `BD/BD_8Z_Reasoning.html`, `crp/BD_8Z_Reasoning.html` | `F4M/f4m/document.html`, `F4M/f4m/index.html` |
| `8zS/8z_shield_landing.html` | 1 | `8ZT/8z_shield_landing.html`, `BD/8z_shield_landing.html` | `8zS/index-o.html` |
| `8zS/BD_8Z_Auth.html` | 1 | `8ZT/BD_8z_auth.html`, `BD/BD_8Z_Auth.html` | `8zS/index-o.html` |
| `8zS/BD_8z_publish.html` | 1 | `8ZT/BD_8Z_Publish.html`, `BD/BD_8Z_Publish.html` | `8zS/index-o.html` |
| `8zc-about.html` | 1 | `chess-lab/8zc-about.html`, `chess-lab/old/8zc-about.html`, `chess/8zc-about.html` | `AI8/index.html` |
| `8zc-why.html` | 1 | `chess-lab/8zc-why.html`, `chess-lab/old/8zc-why.html`, `chess/8zc-why.html` | `index-search.html` |
| `BD/assets/app.js` | 1 | `Start/app.js`, `Trip/PWA/app.js`, `Trip/app.js`, `Trip/new/app.js`, `Trip/old/app.js`, `Trip/old2/app.js`, `acp/assets/app.js`, `news/app.js` | `BD/AC_01_Flagship.html` |
| `crp/8ZT/8z_shield_landing.html` | 1 | `8ZT/8z_shield_landing.html`, `BD/8z_shield_landing.html` | `crp/lab.html` |
| `crp/8ZT/8z_shield_smart.html` | 1 | `8ZT/8z_shield_smart.html`, `BD/8z_shield_smart.html` | `crp/lab.html` |
| `crp/8ZT/BD_8Z_DCC_Trading.html` | 1 | `8ZT/BD_8Z_DCC_Trading.html`, `BD/BD_8Z_DCC_Trading.html` | `crp/lab.html` |
| `crp/8ZT/BD_8Z_Trading_Book.html` | 1 | `8ZT/BD_8Z_Trading_Book.html`, `BD/BD_8Z_Trading_Book.html` | `crp/lab.html` |
| `crp/8ZT/BD_8z_auth.html` | 1 | `8ZT/BD_8z_auth.html`, `BD/BD_8Z_Auth.html` | `crp/lab.html` |
| `crp/8ZT/BD_8z_publish.html` | 1 | `8ZT/BD_8Z_Publish.html`, `BD/BD_8Z_Publish.html` | `crp/lab.html` |
| `crp/8ZT/DCC_trader.html` | 1 | `8ZT/DCC_trader.html`, `BD/DCC_trader.html`, `BD/private-trading/DCC_trader.html` | `crp/lab.html` |
| `crp/8ZT/SM_trader.html` | 1 | `8ZT/SM_trader.html`, `BD/SM_trader.html`, `BD/private-trading/SM_trader.html` | `crp/lab.html` |
| `crp/8ZT/ZZ_trader.html` | 1 | `8ZT/ZZ_trader.html`, `BD/ZZ_trader.html`, `BD/private-trading/ZZ_trader.html` | `crp/lab.html` |
| `crp/AC/index2.html` | 1 | `AC/index2.html`, `F4M/index2.html`, `S/index2.html` | `crp/lab.html` |
| `crp/AC/index3.html` | 1 | `AC/index3.html`, `F4M/index3.html` | `crp/lab.html` |
| `crp/BD/8z_shield_landing.html` | 1 | `8ZT/8z_shield_landing.html`, `BD/8z_shield_landing.html` | `crp/lab.html` |
| `crp/BD/8z_shield_smart.html` | 1 | `8ZT/8z_shield_smart.html`, `BD/8z_shield_smart.html` | `crp/lab.html` |
| `crp/BD/AC.html` | 1 | `BD/AC.html`, `crp/AC.html` | `crp/lab.html` |
| `crp/BD/AC_AA.html` | 1 | `BD/AC_AA.html`, `crp/AC_AA.html` | `crp/lab.html` |
| `crp/BD/AI8_Architecture.html` | 1 | `BD/AI8_Architecture.html`, `crp/AI8_Architecture.html` | `crp/lab.html` |
| `crp/BD/AI8_Companion.html` | 1 | `BD/AI8_Companion.html`, `crp/AI8_Companion.html` | `crp/lab.html` |
| `crp/BD/AI8_Components.html` | 1 | `BD/AI8_Components.html`, `crp/AI8_Components.html` | `crp/lab.html` |
| `crp/BD/BD_8Z_DCC_Trading.html` | 1 | `8ZT/BD_8Z_DCC_Trading.html`, `BD/BD_8Z_DCC_Trading.html` | `crp/lab.html` |
| `crp/BD/BD_8Z_Flip4M_DCC.html` | 1 | `BD/BD_8Z_Flip4M_DCC.html`, `F4M/BD_8Z_Flip4M_DCC.html` | `crp/lab.html` |
| `crp/BD/BD_8Z_OS_Story5.html` | 1 | `BD/BD_8Z_OS_Story5.html`, `OS/BD_8Z_OS_Story5.html` | `crp/lab.html` |
| `crp/BD/BD_8Z_Reasoning.html` | 1 | `BD/BD_8Z_Reasoning.html`, `crp/BD_8Z_Reasoning.html` | `crp/lab.html` |
| `crp/BD/BD_8Z_Trading_Book.html` | 1 | `8ZT/BD_8Z_Trading_Book.html`, `BD/BD_8Z_Trading_Book.html` | `crp/lab.html` |
| `crp/BD/BD_8z_auth.html` | 1 | `8ZT/BD_8z_auth.html`, `BD/BD_8Z_Auth.html` | `crp/lab.html` |
| `crp/BD/BD_8z_publish.html` | 1 | `8ZT/BD_8Z_Publish.html`, `BD/BD_8Z_Publish.html` | `crp/lab.html` |
| `crp/BD/BD_Hedge_Separation_PiX_Strategy_Explainer.html` | 1 | `8ZT/BD_Hedge_Separation_PiX_Strategy_Explainer.html`, `BD/BD_Hedge_Separation_PiX_Strategy_Explainer.html`, `BD/private-trading/BD_Hedge_Separation_PiX_Strategy_Explainer.html` | `crp/lab.html` |
| `crp/BD/BD_Idea_Atlas_AI_Reviews.html` | 1 | `BD/BD_Idea_Atlas_AI_Reviews.html`, `crp/BD_Idea_Atlas_AI_Reviews.html` | `crp/lab.html` |
| `crp/BD/BD_trading_2026.html` | 1 | `8ZT/BD_trading_2026.html`, `BD/BD_trading_2026.html`, `BD/private-trading/BD_trading_2026.html` | `crp/lab.html` |
| `crp/BD/DCC_trader.html` | 1 | `8ZT/DCC_trader.html`, `BD/DCC_trader.html`, `BD/private-trading/DCC_trader.html` | `crp/lab.html` |
| `crp/BD/F4M_rDCC_v3_Tournament.html` | 1 | `BD/F4M_rDCC_v3_Tournament.html`, `F4M/F4M_rDCC_v3_Tournament.html` | `crp/lab.html` |
| `crp/BD/F4M_rDCC_v3_Tournament1.html` | 1 | `BD/F4M_rDCC_v3_Tournament1.html`, `F4M/F4M_rDCC_v3_Tournament1.html` | `crp/lab.html` |
| `crp/BD/MDLxDCC.html` | 1 | `BD/MDLxDCC.html`, `crp/MDLxDCC.html` | `crp/lab.html` |
| `crp/BD/RH.html` | 1 | `BD/RH.html`, `Mix/RH.html`, `crp/RH.html` | `crp/lab.html` |
| `crp/BD/RouteSignal_Prompt_Method_Study.html` | 1 | `BD/RouteSignal_Prompt_Method_Study.html`, `crp/RouteSignal_Prompt_Method_Study.html` | `crp/lab.html` |
| `crp/BD/RouteSignal_Scout.html` | 1 | `BD/RouteSignal_Scout.html`, `crp/RouteSignal_Scout.html` | `crp/lab.html` |
| `crp/BD/SM_trader.html` | 1 | `8ZT/SM_trader.html`, `BD/SM_trader.html`, `BD/private-trading/SM_trader.html` | `crp/lab.html` |
| `crp/BD/ZZ_trader.html` | 1 | `8ZT/ZZ_trader.html`, `BD/ZZ_trader.html`, `BD/private-trading/ZZ_trader.html` | `crp/lab.html` |
| `crp/CW/Origin.html` | 1 | `CW/Origin.html`, `crp/Origin.html` | `crp/lab.html` |
| `crp/F4M/BD_8Z_Flip4M_DCC.html` | 1 | `BD/BD_8Z_Flip4M_DCC.html`, `F4M/BD_8Z_Flip4M_DCC.html` | `crp/lab.html` |
| `crp/F4M/F4M.html` | 1 | `F4M/F4M.html`, `F4M/old/F4M.html` | `crp/lab.html` |
| `crp/F4M/F4M_paper.html` | 1 | `F4M/F4M_paper.html`, `F4M/old/F4M_paper.html` | `crp/lab.html` |
| `crp/F4M/F4M_rDCC_v3_Tournament.html` | 1 | `BD/F4M_rDCC_v3_Tournament.html`, `F4M/F4M_rDCC_v3_Tournament.html` | `crp/lab.html` |
| `crp/F4M/F4M_rDCC_v3_Tournament1.html` | 1 | `BD/F4M_rDCC_v3_Tournament1.html`, `F4M/F4M_rDCC_v3_Tournament1.html` | `crp/lab.html` |
| `crp/F4M/index2.html` | 1 | `AC/index2.html`, `F4M/index2.html`, `S/index2.html` | `crp/lab.html` |
| `crp/F4M/index3.html` | 1 | `AC/index3.html`, `F4M/index3.html` | `crp/lab.html` |
| `crp/Mix/RH.html` | 1 | `BD/RH.html`, `Mix/RH.html`, `crp/RH.html` | `crp/lab.html` |
| `crp/OS/BD_8Z_OS_Story5.html` | 1 | `BD/BD_8Z_OS_Story5.html`, `OS/BD_8Z_OS_Story5.html` | `crp/lab.html` |
| `crp/Trip/index.html` | 1 | `8Z/index.html`, `8ZT/index.html`, `8zS/index.html`, `AC/index.html`, `AI8/about/index.html`, `AI8/index.html`, `AI8/live/index.html`, `AIm3/index.html`, `Art/index.html`, `BD/O/index.html`, `BD/O/izleti/index.html`, `Birds/index.html`, `CW/index.html`, `CW/new/index.html`, `CW/old/001/index.html`, `CW/old/index.html`, `F4M/PWA/index.html`, `F4M/app/index.html`, `F4M/app/old/001/index.html`, `F4M/app/old/002/index.html`, `F4M/app/old/003/index.html`, `F4M/app/old/index.html`, `F4M/f4m/app/index.html`, `F4M/f4m/index.html`, `F4M/index.html`, `F4M/lab/index.html`, `F4M/lab/plus/index.html`, `F4M/new/index.html`, `F4M/new/old/001/index.html`, `F4M/new/old/002/index.html`, `F4M/new/old/003/index.html`, `F4M/new/old/index.html`, `F4M/old/001/index.html`, `F4M/old/002/index.html`, `F4M/old/index.html`, `LO/index.html`, `Nara/dualframe-lab/cmarvel-01/index.html`, `Nara/dualframe-lab/index.html`, `Nara/index.html`, `OS/index.html`, `PWA/index.html`, `S/PWA/index.html`, `S/app/index.html`, `S/app/old/001/index.html`, `S/app/old/002/index.html`, `S/app/old/003/index.html`, `S/app/old/index.html`, `S/current/index.html`, `S/index.html`, `S/new/index.html`, `S/new/old/001/index.html`, `S/new/old/002/index.html`, `S/new/old/003/index.html`, `S/new/old/index.html`, `S/old/001/index.html`, `S/old/002/index.html`, `S/old/index.html`, `SLO/index.html`, `Someone/index.html`, `Start/index.html`, `Trip/PWA/index.html`, `Trip/Protected/index.html`, `Trip/index.html`, `Trip/new/index.html`, `Trip/old/001/index.html`, `Trip/old/002/index.html`, `Trip/old/003/index.html`, `Trip/old/004/index.html`, `Trip/old/005/index.html`, `Trip/old/006/index.html`, `Trip/old/007/index.html`, `Trip/old/008/index.html`, `Trip/old/009/index.html`, `Trip/old/010/index.html`, `Trip/old/Protected/index.html`, `Trip/old/index.html`, `Trip/old2/Protected/index.html`, `Trip/old2/index.html`, `WL/BD/index.html`, `WL/index.html`, `acp/index.html`, `c/index.html`, `chess-lab/app/index.html`, `chess-lab/index.html`, `chess-lab/old/001/index.html`, `chess-lab/old/002/index.html`, `chess-lab/old/003/index.html`, `chess-lab/old/004/index.html`, `chess-lab/old/005/index.html`, `chess-lab/old/006/index.html`, `chess-lab/old/007/index.html`, `chess-lab/old/008/index.html`, `chess-lab/old/009/index.html`, `chess-lab/old/010/index.html`, `chess-lab/old/011/index.html`, `chess-lab/old/012/index.html`, `chess-lab/old/013/index.html`, `chess-lab/old/014/index.html`, `chess-lab/old/app/002/index.html`, `chess-lab/old/app/index.html`, `chess-lab/old/app/old/001/index.html`, `chess-lab/old/app/old/index.html`, `chess-lab/old/index.html`, `chess-lab/old/lab/001/index.html`, `chess-lab/old/lab/index.html`, `chess/PWA/index.html`, `chess/app/index.html`, `chess/index.html`, `code/index.html`, `crp/index.html`, `game/_fixture/index.html`, `game/dayton1903/index.html`, `game/faraday1831/index.html`, `game/index.html`, `game/navierstokes1845/index.html`, `game/tesla1888/index.html`, `gods/index.html`, `history/index.html`, `hmal/index.html`, `igra/index.html`, `index.html`, `knjiga/index.html`, `llms/index.html`, `news/index.html`, `people/index.html`, `portfolio/index.html`, `w/index.html` | `crp/lab.html` |
| `crp/acp/AC_01_Flagship.html` | 1 | `BD/AC_01_Flagship.html`, `acp/AC_01_Flagship.html` | `crp/lab.html` |
| `crp/acp/index-acp.html` | 1 | `acp/index-acp.html`, `index-acp.html` | `crp/lab.html` |
| `crp/crp/AC.html` | 1 | `BD/AC.html`, `crp/AC.html` | `crp/lab.html` |
| `crp/crp/AC_AA.html` | 1 | `BD/AC_AA.html`, `crp/AC_AA.html` | `crp/lab.html` |
| `crp/crp/AI8_Architecture.html` | 1 | `BD/AI8_Architecture.html`, `crp/AI8_Architecture.html` | `crp/lab.html` |
| `crp/crp/AI8_Companion.html` | 1 | `BD/AI8_Companion.html`, `crp/AI8_Companion.html` | `crp/lab.html` |
| `crp/crp/AI8_Components.html` | 1 | `BD/AI8_Components.html`, `crp/AI8_Components.html` | `crp/lab.html` |
| `crp/crp/AI8_Reasoning.html` | 1 | `BD/AI8_Reasoning.html`, `crp/AI8_Reasoning.html` | `crp/lab.html` |
| `crp/crp/AliensOnEarth.html` | 1 | `BD/AliensOnEarth.html`, `crp/AliensOnEarth.html` | `crp/lab.html` |
| `crp/crp/MDLxDCC-Arena-NAS.html` | 1 | `BD/MDLxDCC-Arena-NAS.html`, `crp/MDLxDCC-Arena-NAS.html` | `crp/lab.html` |
| `crp/crp/MDLxDCC.html` | 1 | `BD/MDLxDCC.html`, `crp/MDLxDCC.html` | `crp/lab.html` |
| `crp/crp/Origin.html` | 1 | `CW/Origin.html`, `crp/Origin.html` | `crp/lab.html` |
| `crp/crp/RH.html` | 1 | `BD/RH.html`, `Mix/RH.html`, `crp/RH.html` | `crp/lab.html` |
| `crp/crp/RouteSignal_Prompt_Method_Study.html` | 1 | `BD/RouteSignal_Prompt_Method_Study.html`, `crp/RouteSignal_Prompt_Method_Study.html` | `crp/lab.html` |
| `crp/crp/RouteSignal_Scout.html` | 1 | `BD/RouteSignal_Scout.html`, `crp/RouteSignal_Scout.html` | `crp/lab.html` |
| `crp/crp/index-crp.html` | 1 | `crp/index-CRP.html`, `index-crp.html` | `crp/lab.html` |
| `crp/sitemap.xml` | 1 | `chess-lab/old/sitemap.xml`, `sitemap.xml` | `crp/lab.html` |
</details>

### D. No file with that name anywhere in public/ (148 pairs, 187 occurrences, 114 targets)

There is nothing to link to. BD decides whether to restore, remove or retarget these.

- Largest groups: `F4M/F4M_about.html` (7 pages), `F4M/CCH__v1.4.txt` (5), and `BD_Model_Assessments.html` (8 pages in `BD/`, `F4M/` and `F4M/f4m/`).
- The saved-page leftovers `cdn-cgi/l/email-protection` and `cdn-cgi/…/email-decode.min.js` are on 5 `BD/BD_portfolio*` pages.

<details><summary>114 targets (target · pages · example pages)</summary>

| Target (lab path) | Pages | Example pages |
|---|---|---|
| `F4M/F4M_about.html` | 7 | `F4M/F4M_paper.html`, `F4M/F4M_paper_CLA.html`, `F4M/F4M_paper_GRO.html` +4 more |
| `F4M/CCH__v1.4.txt` | 5 | `F4M/CCH_AI_v1.4.html`, `F4M/F4M_paper.html`, `F4M/F4M_paper_GRO.html` +2 more |
| `cdn-cgi/l/email-protection` | 5 | `BD/BD_portfolio.html`, `BD/BD_portfolio_NCI1.html`, `BD/BD_portfolio_NCI2.html` +2 more |
| `cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js` | 5 | `BD/BD_portfolio.html`, `BD/BD_portfolio_NCI1.html`, `BD/BD_portfolio_NCI2.html` +2 more |
| `F4M/8Z-DCC_Flip4M.txt` | 4 | `F4M/F4M_paper.html`, `F4M/F4M_paper_QWE.html`, `F4M/F4M_paper_QWE2.html` +1 more |
| `BD/BD_Model_Assessments.html` | 3 | `BD/BD_8Z_Flip4M_DCC.html`, `BD/BD_Evaluation_Protocol.html`, `BD/BD_portfolio.html` |
| `F4M/BD_Model_Assessments.html` | 3 | `F4M/BD_8Z_Flip4M_DCC.html`, `F4M/BD_8Z_Flip4M_DCC1.html`, `F4M/BD_8Z_Flip4M_DCC2.html` |
| `bd-favicon.svg` | 3 | `index-intro-bck1.html`, `index-intro-bck2.html`, `index-intro.html` |
| `8ZT/8z_shield_GEM.html` | 2 | `8ZT/8z_shield_landing.html`, `8ZT/BD_8Z_Publish.html` |
| `8ZT/8z_shield_GPT.html` | 2 | `8ZT/8z_shield_landing.html`, `8ZT/BD_8Z_Publish.html` |
| `8ZT/8z_shield_GRO.html` | 2 | `8ZT/8z_shield_landing.html`, `8ZT/BD_8Z_Publish.html` |
| `8ZT/SM_BTCUSDT_1s_2026-03-08T2001.png` | 2 | `8ZT/BD_8Z_Trading_Book.html`, `8ZT/index.html` |
| `BD/BD × AI — 30 Years of Ideas, 18 Months of Execution_files/css2` | 2 | `BD/BD_portfolio_NCI1.html`, `BD/BD_portfolio_OK.html` |
| `F4M/f4m/BD_Model_Assessments.html` | 2 | `F4M/f4m/document.html`, `F4M/f4m/index.html` |
| `crp/AIM3_MentalArena_mRHP_trading_benchmark_v0_6.html` | 2 | `crp/AIM3_MentalArena_mRHP.html`, `crp/AIM3_MentalArena_mRHP_world_applications_20260619.html` |
| `8ZT/AIM3_MentalArena_mRHP_trading_benchmark_v0_6.html` | 1 | `8ZT/AIM3_MentalArena_mRHP_world_applications_20260619.html` |
| `8Z_TSP_vNext_Master_Plan.md` | 1 | `history/11_one_possible_branch_2026_2036.html` |
| `8zS/[^` | 1 | `8zS/index-o.html` |
| `8zc-about` | 1 | `indexp.html` |
| `8zc-pgn` | 1 | `indexp.html` |
| `8zc-why` | 1 | `indexp.html` |
| `ARC_AGI_MDLxDCC_Arena.zip` | 1 | `history/11_one_possible_branch_2026_2036.html` |
| `BD-Sudoku.html` | 1 | `history/11_one_possible_branch_2026_2036.html` |
| `BD/8z_shield_GEM.html` | 1 | `BD/8z_shield_landing.html` |
| `BD/8z_shield_GPT.html` | 1 | `BD/8z_shield_landing.html` |
| `BD/8z_shield_GRO.html` | 1 | `BD/8z_shield_landing.html` |
| `BD/AIM3_MentalArena_mRHP_trading_benchmark_v0_6.html` | 1 | `BD/AIM3_MentalArena_mRHP_world_applications_20260619.html` |
| `BD/AliensOnEarth.txt` | 1 | `BD/AliensOnEarth.html` |
| `BD/BD-FranC.html` | 1 | `BD/BDR.html` |
| `BD/BD-Klara.html` | 1 | `BD/BDR.html` |
| `BD/BD-Kres.html` | 1 | `BD/BDR.html` |
| `BD/BD_8Z_Persistent_Governor.html` | 1 | `BD/BD_8Z_DCC7_Testbed.html` |
| `BD/CCH_AI_DNA_Software_v1_5.txt` | 1 | `BD/BD_8Z_DCC_Recursive.html` |
| `BD/NU3496_8ZRP_96793_interactive.html` | 1 | `BD/BD_8ZRP.html` |
| `BD/NU3496_8ZRP_96793_route.svg` | 1 | `BD/BD_8ZRP.html` |
| `BD/RouteSignal_v06b_OVERNIGHT_5W_20H30_SLIM_UPLOAD_20260604_083918Z.zip` | 1 | `BD/RouteSignal_Scout.html` |
| `BD/SM_BTCUSDT_1s_2026-03-08T2001.png` | 1 | `BD/BD_8Z_Trading_Book.html` |
| `BD/assets/8z_NAS_arena_v19_modular_code_capsule.zip` | 1 | `BD/MDLxDCC-Arena-NAS.html` |
| `BD/bd-favicon.svg` | 1 | `BD/BD_portfolio.html` |
| `BD/local_runs/RouteSignal_v06b_LOCAL_5W_10K_NOTES.md` | 1 | `BD/RouteSignal_Scout.html` |
| `BD/local_runs/RouteSignal_v06b_LOCAL_5W_10K_UPLOAD_20260603_120942Z.zip` | 1 | `BD/RouteSignal_Scout.html` |
| `BD/routesignal_v05_baseline_killtest_report.md` | 1 | `BD/RouteSignal_Scout.html` |
| `BD/routesignal_v05_casebook.html` | 1 | `BD/RouteSignal_Scout.html` |
| `BD/routesignal_v05_jan_review_pack.html` | 1 | `BD/RouteSignal_Scout.html` |
| `BD/routesignal_v06_cases/routesignal_v06_ipv6_prefix_health_baseline_test.csv` | 1 | `BD/RouteSignal_Scout.html` |
| `BD/routesignal_v06_cases/routesignal_v06_ipv6_prefix_health_baseline_test.html` | 1 | `BD/RouteSignal_Scout.html` |
| `BD/routesignal_v06_cases/routesignal_v06_ipv6_prefix_health_baseline_test.json` | 1 | `BD/RouteSignal_Scout.html` |
| `BD/routesignal_v06_cases/routesignal_v06_ipv6_prefix_health_baseline_test.md` | 1 | `BD/RouteSignal_Scout.html` |
| `BD/routesignal_v06_cases/routesignal_v06_top_review_queue.csv` | 1 | `BD/RouteSignal_Scout.html` |
| `BD/v06d_full_20h30/RouteSignal_v06b_20H30_ANALYSIS_SUMMARY.md` | 1 | `BD/RouteSignal_Scout.html` |
| `BD/v06d_full_20h30/rank_stability_by_resource_FROM_RUN_INDEX.csv` | 1 | `BD/RouteSignal_Scout.html` |
| `BD/v06d_full_20h30/signature_frequency_TOP250_FROM_RUN_INDEX.csv` | 1 | `BD/RouteSignal_Scout.html` |
| `Birds/images/FS_I_S07_starving_eagle_studies_pilot.webp` | 1 | `Birds/the-flying-salami.html` |
| `Birds/images/FS_I_S08_exploratory_strike.webp` | 1 | `Birds/the-flying-salami.html` |
| `Birds/images/FS_I_S09_another_bird_watches.webp` | 1 | `Birds/the-flying-salami.html` |
| `Birds/images/FS_I_S10_flying_salami_meme.webp` | 1 | `Birds/the-flying-salami.html` |
| `Birds/images/FS_I_S11_luka_frees_black.webp` | 1 | `Birds/the-flying-salami.html` |
| `Birds/images/FS_I_S12_black_leaves.webp` | 1 | `Birds/the-flying-salami.html` |
| `Birds/images/FS_I_S13_speed_flyer_correction.webp` | 1 | `Birds/the-flying-salami.html` |
| `Birds/images/FS_I_S14_tomaz_perfect_wall_pass.webp` | 1 | `Birds/the-flying-salami.html` |
| `Birds/images/FS_I_S15_tomaz_midpoint_preparation.webp` | 1 | `Birds/the-flying-salami.html` |
| `Birds/images/FS_I_S16_first_eagle_crosses_line.webp` | 1 | `Birds/the-flying-salami.html` |
| `Birds/images/FS_I_S17_second_bird_escape_side.webp` | 1 | `Birds/the-flying-salami.html` |
| `Birds/images/FS_I_S18_rock_fills_camera.webp` | 1 | `Birds/the-flying-salami.html` |
| `Birds/images/FS_I_S19_official_pilot_error.webp` | 1 | `Birds/the-flying-salami.html` |
| `Birds/images/FS_I_S20_luka_reconstructs_route.webp` | 1 | `Birds/the-flying-salami.html` |
| `Birds/images/FS_I_S21_learning_to_steer.webp` | 1 | `Birds/the-flying-salami.html` |
| `Birds/images/FS_I_S22_cliff_base_observed.webp` | 1 | `Birds/the-flying-salami.html` |
| `Birds/images/FS_I_S23_urban_chimney_waiting.webp` | 1 | `Birds/the-flying-salami.html` |
| `Birds/images/FS_I_S24_black_line_loop.webp` | 1 | `Birds/the-flying-salami.html` |
| `Birds/images/FS_I_S25_raven_waits_for_hands.webp` | 1 | `Birds/the-flying-salami.html` |
| `Birds/images/FS_I_S26_black_mobs_raptor.webp` | 1 | `Birds/the-flying-salami.html` |
| `Birds/images/FS_I_S27_neither_do_you.webp` | 1 | `Birds/the-flying-salami.html` |
| `Birds/images/FS_I_S28_approach_geometry.webp` | 1 | `Birds/the-flying-salami.html` |
| `Birds/images/FS_I_S29_festival_launch.webp` | 1 | `Birds/the-flying-salami.html` |
| `Birds/images/FS_I_S30_hundreds_of_wings.webp` | 1 | `Birds/the-flying-salami.html` |
| `Birds/images/FS_I_S32_not_thermalling.webp` | 1 | `Birds/the-flying-salami.html` |
| `Birds/images/FS_I_S33_first_dive_mass_confusion.webp` | 1 | `Birds/the-flying-salami.html` |
| `Birds/images/FS_I_S34_silent_aftermath.webp` | 1 | `Birds/the-flying-salami.html` |
| `Birds/images/FS_I_S35_brain_anomaly_lab.webp` | 1 | `Birds/the-flying-salami.html` |
| `Birds/images/FS_I_S36_raven_lock.webp` | 1 | `Birds/the-flying-salami.html` |
| `F4M/8Z-DCC_Flip4M.html` | 1 | `F4M/F4M_paper_CLA.html` |
| `F4M/CCH_AA_v1.4.txt` | 1 | `F4M/CCH_AI_v1.4.html` |
| `F4M/CCH_AB_v1.4.txt` | 1 | `F4M/CCH_AI_v1.4.html` |
| `F4M/CCH_AD_v1.4_CSF.txt` | 1 | `F4M/CCH_AI_v1.4.html` |
| `chess-lab/research` | 1 | `chess-lab/research/responsive-check.html` |
| `chess/research` | 1 | `chess/research/responsive-check.html` |
| `crp/MDLxDCC-arena-casp-protein.html` | 1 | `crp/MDLxDCC-Arenas.html` |
| `crp/MDLxDCC-arena-dream-bio.html` | 1 | `crp/MDLxDCC-Arenas.html` |
| `crp/MDLxDCC-arena-hutter.html` | 1 | `crp/MDLxDCC-Arenas.html` |
| `crp/MDLxDCC-arena-p-vs-np.html` | 1 | `crp/MDLxDCC-Arenas.html` |
| `crp/MDLxDCC-arena-sat-smt-pace.html` | 1 | `crp/MDLxDCC-Arenas.html` |
| `crp/MDLxDCC-arena-xprize.html` | 1 | `crp/MDLxDCC-Arenas.html` |
| `crp/RouteSignal_v06b_OVERNIGHT_5W_20H30_SLIM_UPLOAD_20260604_083918Z.zip` | 1 | `crp/RouteSignal_Scout.html` |
| `crp/arc_v04_key_bundle/arc_report_hub.html` | 1 | `crp/MDLxDCC-Arena-ARC.html` |
| `crp/arc_v04_key_bundle/arc_visual_atlas.html` | 1 | `crp/MDLxDCC-Arena-ARC.html` |
| `crp/arc_v04_key_bundle/run_index.csv` | 1 | `crp/MDLxDCC-Arena-ARC.html` |
| `crp/arc_v04_key_bundle/task_index.csv` | 1 | `crp/MDLxDCC-Arena-ARC.html` |
| `crp/assets/8z_NAS_arena_v19_modular_code_capsule.zip` | 1 | `crp/MDLxDCC-Arena-NAS.html` |
| `crp/local_runs/RouteSignal_v06b_LOCAL_5W_10K_NOTES.md` | 1 | `crp/RouteSignal_Scout.html` |
| `crp/local_runs/RouteSignal_v06b_LOCAL_5W_10K_UPLOAD_20260603_120942Z.zip` | 1 | `crp/RouteSignal_Scout.html` |
| `crp/routesignal_v05_baseline_killtest_report.md` | 1 | `crp/RouteSignal_Scout.html` |
| `crp/routesignal_v05_casebook.html` | 1 | `crp/RouteSignal_Scout.html` |
| `crp/routesignal_v05_jan_review_pack.html` | 1 | `crp/RouteSignal_Scout.html` |
| `crp/routesignal_v06_cases/routesignal_v06_ipv6_prefix_health_baseline_test.csv` | 1 | `crp/RouteSignal_Scout.html` |
| `crp/routesignal_v06_cases/routesignal_v06_ipv6_prefix_health_baseline_test.html` | 1 | `crp/RouteSignal_Scout.html` |
| `crp/routesignal_v06_cases/routesignal_v06_ipv6_prefix_health_baseline_test.json` | 1 | `crp/RouteSignal_Scout.html` |
| `crp/routesignal_v06_cases/routesignal_v06_ipv6_prefix_health_baseline_test.md` | 1 | `crp/RouteSignal_Scout.html` |
| `crp/routesignal_v06_cases/routesignal_v06_top_review_queue.csv` | 1 | `crp/RouteSignal_Scout.html` |
| `crp/v06d_full_20h30/RouteSignal_v06b_20H30_ANALYSIS_SUMMARY.md` | 1 | `crp/RouteSignal_Scout.html` |
| `crp/v06d_full_20h30/rank_stability_by_resource_FROM_RUN_INDEX.csv` | 1 | `crp/RouteSignal_Scout.html` |
| `crp/v06d_full_20h30/signature_frequency_TOP250_FROM_RUN_INDEX.csv` | 1 | `crp/RouteSignal_Scout.html` |
| `facts` | 1 | `indexp.html` |
| `games-info` | 1 | `indexp.html` |
</details>

### E. Directory links (21 pairs, 37 occurrences, 18 targets)

A link to a folder means that folder's `index.html`, and many folders have one, so there is no single candidate. 16 of the 18 are on `crp/lab.html` (see A1).

<details><summary>18 targets</summary>

| Target (lab path) | Pages | Example pages |
|---|---|---|
| `old/` | 4 | `Trip/demo.html`, `Trip/help.html`, `chess-lab/8zc-about.html` +1 more |
| `OmniCPQ/` | 1 | `Start/index.html` |
| `crp/8Z/` | 1 | `crp/lab.html` |
| `crp/8ZT/` | 1 | `crp/lab.html` |
| `crp/AC/` | 1 | `crp/lab.html` |
| `crp/Art/` | 1 | `crp/lab.html` |
| `crp/BD/` | 1 | `crp/lab.html` |
| `crp/CW/` | 1 | `crp/lab.html` |
| `crp/F4M/` | 1 | `crp/lab.html` |
| `crp/LO/` | 1 | `crp/lab.html` |
| `crp/OS/` | 1 | `crp/lab.html` |
| `crp/S/` | 1 | `crp/lab.html` |
| `crp/SLO/` | 1 | `crp/lab.html` |
| `crp/Someone/` | 1 | `crp/lab.html` |
| `crp/Trip/` | 1 | `crp/lab.html` |
| `crp/acp/` | 1 | `crp/lab.html` |
| `crp/crp/` | 1 | `crp/lab.html` |
| `crp/history/` | 1 | `crp/lab.html` |
</details>

### Not part of this set

The router already resolves these, and they were not touched:

- case/extension: 455 pairs;
- production redirect rules: 29 pairs;
- pages excluded from the lab, shown as a link to production: 208 pairs.

The 20 `escapes-base` pairs (root links such as `/start/` or `/ai8/about/` that leave `/mdlxdcc-ai8-lab/`) are also out of scope.

## Files touched

For later conflict resolution:

- `public/BD/AC_01_Flagship.html`
- `public/BD/BD_8Z_ssMDL_DCC.html`
- `public/BD/MDLxDCC-Arena-NAS.html`
- `public/F4M/BD_8Z_Flip4M_DCC.html`
- `public/F4M/BD_8Z_Flip4M_DCC1.html`
- `public/F4M/BD_8Z_Flip4M_DCC2.html`
- `public/F4M/f4m/document.html`
- `public/F4M/f4m/index.html`
- `public/OS/BD_8Z_OS_Story1.html`
- `public/OS/BD_8Z_OS_Story2.html`
- `public/OS/BD_8Z_OS_Story3.html`
- `public/OS/BD_8Z_OS_Story4.html`
- `public/OS/BD_8Z_OS_Story5.html`
- `public/OS/BD_8Z_OS_Story6.html`
- `public/OS/index-O.html`
- `public/c/MDLxDCC_Outreach.html`
- `public/crp/AC.html`
- `public/crp/How_LLMs_Actually_Work.html`
- `lab-evidence/LAB_CHANGES_R11.json` (new)
- `reports/CLOUD_lab-links-unique_20261103.md` (new)

None of these is in `people/`, `gods/`, `code/`, `game/`, `igra/`, `knjiga/` or `BD/O/`. None is encrypted, a vault or `sef` page, or carries `bd-access-data`. None is an archive page (`index-bck*`, "Arhiv je preseljen").

**Note.** `public/F4M/f4m/release.json` records `source_git_blob` `d973766…` for `document.html` and `index.html`. That blob is the provenance of the preserved presentation. No code or test checks it, but it no longer equals the edited file.

## Method

1. Link pairs come from the built site, using the same attribute set as the audit's `linkcheck.py`. Each broken target was replayed through `labRoute()` with the build's own `404.html` payload.
2. For router-missing pairs, every file in `public/` with the same name (case-insensitive) was listed.
3. Each source page was parsed again to find the exact attribute values that produce the pair. The new value is the path to the single file, relative to the page; it is root-absolute when the old value was.
4. The value was rejected when:
   - the page is in a do-not-touch lane, is sensitive, has `bd-access-data`, has a `<base>` tag, or is hash-pinned in a `.json`/`.js` file;
   - production force-redirects the page;
   - the link would leave a standalone publish root;
   - the target exists in production at that path;
   - the new value would not resolve to the candidate from every URL production serves the page at (`_redirects` and `netlify.toml`);
   - the old value works in production from such a URL.
5. Edits were applied by exact position and checked against the before text. The scripts are in the session scratchpad and are not committed. No paid model calls were made.
