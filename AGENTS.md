# AI8 laboratory instructions

This is an independent experiment, not BD-Chess/bd-chessdb production.
BD authorized this lab on 2026-10-25. The initial source and exclusions are in
lab-evidence/. Preserve provenance and licenses when reusing upstream material.

- One writable owner per task/folder. Current bootstrap owner: CLI Codex HOME.
- Use task branches. Initial branch: lab/bootstrap-r1.
- The only push remote is BD-Chess/mdlxdcc-ai8-lab. Never push to production.
- No upstream production deployment configuration, workflows, credentials or vault files.
- BD explicitly authorized the lab's own GitHub Pages preview on 2026-10-25.
- The only permitted publishing workflow is .github/workflows/lab-pages.yml in this lab repository.
- Publish public/ only. Do not publish private AI8 DNA state, messages, capsules or lab-evidence as website content.
- No paid services or new external integrations through general lab permission.
- Production source instructions/deployment permission do not transfer here.
- Coordinate through AI8_LIVE immutable messages; CLI Code owns the shared board.
- Changes that become useful are proposed to BD with evidence before promotion.
- TESTING = MINIMAL_REQUIRED_ONLY. LONG_TEST_GATE = EXPLICIT_BD_APPROVAL_REQUIRED.
- Preserve other sessions' work. Do not start duplicate arena or LLM test writers.

Use scripts/verify_lab.py for snapshot integrity and credential-marker checks.
Use PREVIEW.cmd or scripts/serve_lab.py for a loopback-only static preview.
Backend features need separate lab setup; the preview never starts providers.
