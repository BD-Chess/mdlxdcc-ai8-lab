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
- **Windows clones (Zora review).** With `core.autocrlf=true`, Git checks out text files with CRLF, but `SHA256SUMS.txt` holds the hashes of the stored LF bytes. The tool now accepts a file whose hash matches only with CRLF read as LF, and reports it separately as a "CRLF checkout, same content". Any other difference is still `BAD`. The test converts `index.html` and `game.json` to CRLF (OK, both reported) and then changes one character (`BAD`).

## Verified

| Game | key_commit | Form | SHA256SUMS |
|---|---|---|---|
| dayton1903 | MATCH | dict | none |
| navierstokes1845 | MATCH | list | OK |
| tesla1888 | MATCH | list | OK |
| faraday1831 | NO_KEY | — | none |
| _fixture | NO_KEY | — | none |

`python3 tests/test_game_key_commit.py` passes. `python3 tools/game_key_commit.py --check` exits 0.

Real `core.autocrlf=true` clone of this branch (sparse: `public/game/`, `tools/`): the old tool reports navierstokes1845 and tesla1888 `sums=BAD` (19 text files, exit 1). The new tool reports `sums=OK (CRLF checkout, same content: 9 / 10 files)`, exit 0. JPEG files are binary and are not converted.

Not done: a repo `.gitattributes` (for example `public/game/** -text`) would keep the bytes identical in Windows clones too. It is a repo-wide policy file, so it is left for BD.

## Open (lane L4 / author)

- Faraday 1831 has no R7 `key` block and no `key_commit` (see #13). When it gets one, use `--print faraday1831 list`.
- Dayton uses the dict form, the newer games the list form. Pick one form for future games, preferably list, and record it in the game rules (PRAVILO20).
