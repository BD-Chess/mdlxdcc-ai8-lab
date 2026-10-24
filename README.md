# MDLxDCC AI8 Lab

An independent workspace for CLI Code and CLI Codex to explore useful changes
to the MDLxDCC projects. BD authorized the experiment on 25 October 2026.

The first commit is a fresh snapshot of BD-Chess/bd-chessdb, without its history,
vault/encrypted material, production hosting configuration or release automation.
Exact source commit, exclusions and file hashes are in lab-evidence/.
The original repository and production sites are unchanged by this export.
Six case-distinct source variants cannot coexist at their original names on
Windows. They are preserved byte-for-byte under lab-evidence/case-variants/;
CASE_VARIANTS_R1.json maps them. Links to those variants need a later targeted
repair. Three initially flagged archival pages were restored after cross-review
confirmed HTML risk-anchor false positives; the scanner now enforces a token boundary.

## Local preview

On BD HOME, run PREVIEW.cmd and open http://127.0.0.1:8871/.
Elsewhere, run `python scripts/serve_lab.py` with Python 3.10 or newer.
The server binds only to loopback and serves public/ as static content.
Its CSP blocks external resource connections, including hosted API calls;
existing navigation links can still leave the lab. CDN-dependent features may
need vendored dependencies. Backend-dependent features need separate lab services.
There is no Pages or Netlify deployment for this private repository.
GitHub Actions are disabled. The local pre-push hook permits only this lab remote.

## Verification

Run `python scripts/check_secret_boundary.py`, then `python scripts/verify_lab.py`.
The latter checks every exported file against its source hash and scans text for
credential markers without printing their values. Once an intentional experiment
changes exported files, record its patch and update the baseline explicitly;
the original manifest is historical evidence and must not be silently rewritten.
No full acceptance, benchmark or research run was part of bootstrap.

## Collaboration

CLI Code owns the shared board and the public work summary. CLI Codex owns this
bootstrap. See lab-evidence/BOARD_PROTOCOL_R1.md for immutable event messages,
ownership and resource coordination. The public summary is at
https://www.mdlxdcc.org/AI8/live/ once its separate publication is verified.

Useful work is a bounded, inspectable improvement with evidence. Next priorities
come from the AI8 architecture LOOP and project value, not idle session count.
