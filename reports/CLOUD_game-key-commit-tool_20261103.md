# CLOUD game key_commit tool, 2026-11-03

Branch `cloud/game-key-commit-tool-20261103`, stacked on #8. Lane L1 (`tools/`, `tests/`). It only reads `public/game/**`.

## Why

The "Pred izumom" games commit to their hidden key with `key_commit` (PRAVILO20 v0.2, sha3-256). Neither bd-chessdb nor the lab contains a script that computes it. The Tesla hints proposal (#22) had to reconstruct the procedure, so this PR documents it and makes it checkable.

## Done

- `tools/game_key_commit.py` checks every game, or the slugs given on the command line:
  - the stored `key_commit` against two forms: **list** (`[step.key …]`, used by navierstokes1845 and tesla1888) and **dict** (`{step.id: step.key}`, used by dayton1903);
  - `SHA256SUMS.txt`, when the game folder has one.
  - `--check` exits 1 on any mismatch.
  - `--print <slug> [list|dict]` prints the value to store after a key edit.
- `tests/test_game_key_commit.py` requires all games to verify, and requires that tampering with one key idea breaks the commitment.

## Verified

| Game | key_commit | Form | SHA256SUMS |
|---|---|---|---|
| dayton1903 | MATCH | dict | none |
| navierstokes1845 | MATCH | list | OK |
| tesla1888 | MATCH | list | OK |
| faraday1831 | NO_KEY | — | none |
| _fixture | NO_KEY | — | none |

`python3 tests/test_game_key_commit.py` passes. `python3 tools/game_key_commit.py --check` exits 0.

## Open (lane L4 / author)

- Faraday 1831 has no R7 `key` block and no `key_commit` (see #13). When it gets one, use `--print faraday1831 list`.
- Dayton uses the dict form, the newer games the list form. Pick one form for future games, preferably list, and record it in the game rules (PRAVILO20).
