# CLOUD lab font offload, 2026-11-03

Branch `cloud/lab-font-offload-20261103`, stacked on #16 (both change `scripts/build_pages.py`). Option 1 from the build-size report (#12). **No content changes**: only the Pages build changes.

## Done

- `scripts/build_pages.py` adds `.ttf`, `.otf`, `.woff` and `.woff2` to the passive media types. Font files over 128 KB are therefore served from commit-pinned `raw.githubusercontent.com` URLs instead of the Pages artifact, like the other large media.
- `tests/test_build_pages.py` adds a check that fonts are passive (8/8 pass).

## Verified

- Build: **877.6 → 828.0 MB** published (−49.6 MB); offloaded files 774 → 850; 0 `.ttf` left in the artifact.
- The affected fonts are 76 copies of `DejaVuSans-Bold.ttf` in `Nara/dualframe-lab/.../paired/support/*/fonts/`. No HTML, CSS or JS references them. They appear only in JSON file manifests (path, bytes, sha256), so no page behavior changes.
- `raw.githubusercontent.com` serves an offloaded font with HTTP 200 and `access-control-allow-origin: *`. A page that does load such a font cross-origin would still work, and the lab runtime already maps offloaded paths to raw for `fetch`/XHR.

## Not verified

- The live Pages run (blocked here). The merge republishes the lab because `build_pages.py` changes.

## Open

- Option 2 from #12 (one copy of the identical chess engines, about −320 MB) restructures what is published, so it waits for BD's yes.
