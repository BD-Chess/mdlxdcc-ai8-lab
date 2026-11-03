# CLOUD lab build size, 2026-11-03

Branch `cloud/lab-build-size-20261103`, stacked on #8. **Report only. Nothing is deleted or changed.**

## Facts (measured on the build after the R2 sync, `scripts/build_pages.py`)

| Measure | Value |
|---|---|
| Published Pages artifact | **877.6 MB** in 4,140 files |
| Gate in `build_pages.py` | 950 MB, so **72 MB headroom (92% used)** |
| GitHub Pages limit (published site) | 1 GB |
| Already offloaded to `raw.githubusercontent.com` (media over 128 KB) | 774 files, 776.7 MB, not counted above |
| Byte-identical duplicates (files over 100 KB) | **382.4 MB** |

### Where the size is

| Area | MB | Note |
|---|---|---|
| `chess-lab/vendor` + `chess-lab/engines` | 320.7 | Stockfish 19 (`.wasm` parts), Reckless, Lc0/Maia runtime, NNUE |
| `chess/vendor` + `chess/engines` | 320.7 | **The same engines again**: 41 groups of byte-identical large files |
| `Nara/dualframe-lab` | 65.7 | Includes **76 `DejaVuSans*.ttf` (53.9 MB)**, copied into every `paired/support/<id>/fonts/` folder |
| All `.html` | 64.9 | Largest: `Nara/Nara-AI-archive.html` 3.9 MB; `BD/` and `8ZT/BD_8Z_Trading_Book.html` 3.3 MB each (identical); `8ZT/index.html` 3.3 MB |
| By extension | — | `.wasm` 435.9 MB, `.ttf` 53.9 MB, `.nn` 50.4 MB, `.json` 46.5 MB |

## Options, ranked by value and risk (none applied)

1. **Offload fonts to raw.** This is low risk and saves about **54 MB** (6%).
   - The change: add `.ttf`, `.otf`, `.woff` and `.woff2` to the offloaded passive types in `build_pages.py`.
   - Verified: `raw.githubusercontent.com` answers a font request with `access-control-allow-origin: *`, so cross-origin fonts work.
   - No HTML, CSS or JS in `Nara/dualframe-lab` references `DejaVuSans-Bold.ttf`, so these fonts are not used by the web page at all. They look like renderer support files.
   - Effort: one line and a test.
2. **Publish only one copy of the identical chess engines.** This saves about **320 MB** (36%), at medium risk.
   - The change: the build publishes `chess/vendor` and `chess/engines` once. The lab runtime, which already rewrites `fetch` and XHR in every copied JS file, maps a `chess-lab/...` engine path to the identical `chess/...` file.
   - Risks: Web Workers, `WebAssembly.instantiateStreaming`, `new URL(..., import.meta.url)` and service-worker caches each need a browser check of both chess apps (Deep analysis, Top picks, engine cards).
   - Effort: about 2 hours including browser tests. Source files stay untouched.
3. **Deduplicate the identical trading book HTML** (`BD/` vs `8ZT/`). Saves only 3.3 MB, so it is not worth a separate change.
4. **Do not raise the gate.** 950 MB is a safety margin under GitHub's 1 GB, and the next sync can add tens of MB.

**Recommendation:** do 1 now, which brings the build to about 824 MB. Do 2 before the next large sync, which would bring it to about 504 MB. Both are lab build changes only and need BD's yes, because a merge republishes the lab.

## Verified

- Sizes and byte-identity: every built file was hashed (sha256) and measured.
- raw CORS header: one font request (`curl -I`).
- Font references: `grep` over `public/Nara/dualframe-lab` for `.html`, `.css` and `.js` found none.

## Not verified

- Whether the chess apps work with the deduplicated engines (option 2 needs a browser test).
- GitHub's own artifact-size accounting on the runner, which may differ slightly from local sums.
