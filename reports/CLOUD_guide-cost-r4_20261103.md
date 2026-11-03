# CLOUD guide cost reduction R4 (game guide), 2026-11-03

Branch `cloud/guide-cost-r4-20261103`, stacked on `cloud/p0-1-fix-20261103` (PR #10). Scope: the "Pred izumom" guide (`functions/game-guide.mjs`, `functions/lib/game-guide/**`) and its tests. **No real model or API call was made.** Every number below is an offline **ESTIMATE**. The production figures from the review (about 1.57 USD per game, cache reads 6.6% of input) are treated as reported, not verified.

## Summary

- **Why the cost was high.** Claude requests had **no `cache_control` at all**, so Claude could not read anything from the cache. The prompt was also ordered against caching. About 90% of each round's input is the system prompt: the rules, then one JSON context. In that JSON, volatile keys (`mode`, `allowed_open_steps`, …) came before the large, slowly growing texts of the opened steps. GPT's automatic prefix cache therefore usually stopped after the rules.
- **What changed.** The prompt is now ordered from most stable to least stable. Claude gets three cache breakpoints. The internal instructions are in English. The model sees the same facts as before: the context JSON equals `modelContext()` key for key.
- **Effect (ESTIMATE, complete scripted games).**
  - Share of each round's prompt that matches the previous round: 33–43% → **87–89%**.
  - Claude Opus 5.5 input per game: 1.89–3.72 → **0.36–0.71 USD**, assuming a warm cache.
  - GPT-6.1-sol input per game: 0.50–1.02 → **0.25–0.42 USD**.
  - Output tokens cannot be measured offline. At an assumed 300 output tokens per round, the full-game total is 0.72–1.15 USD (Opus) or 0.43–0.65 USD (GPT).
  - **The 0.30 USD target is not reached for a complete Opus game by caching alone.** See the open questions.

## Done

| File | Change |
|---|---|
| `functions/lib/game-guide/runtime.mjs` | `promptParts()` builds the prompt from ordered parts. `instructions()` joins them, so the text the model receives is unchanged in meaning. `systemPrompt()` returns Claude blocks or the GPT string. The rules are translated to English: player-facing phrases, card formats and trigger words are kept in Slovenian, and a new explicit rule says that everything the player sees is in Slovenian, including the `ask_understanding` question and the `assess_challenge` why/advantages. The `sealed_key.warning` is in English. |
| `functions/lib/game-guide/provider.mjs` | `gameProviderRound` passes the Claude system prompt as text blocks (`systemBlocks`) to the **unchanged** shared transport. GPT and injected test rounds get the same text as one string. |
| `functions/game-guide.mjs` | Default round is `gameProviderRound`. It sends `system` (string) and `systemBlocks` (Claude). Three internal model-facing repair/notice messages are translated to English: two repair prompts and the "untrusted context" placeholder for Claude. Player-facing strings are unchanged. |
| `tests/game-guide-cost-r4.test.mjs` (new) | Locks the cacheable layout (see "Verified by test"). |
| `tests/game-guide-p0.test.mjs`, `-r35`, `-r4fix`, `game-guide.test.mjs` | **Updated only where they assert internal prompt text.** Slovenian rule phrases became their English equivalents. In r35, the payload-prompt helper now joins Claude's block array. No player-facing assertion changed. |
| `reports/CLOUD_guide-cost-r4_20261103/` | `measure.mjs` (offline harness), `before.json`, `after.json`. These hold numbers only, no prompt text. |
| `lab-evidence/LAB_CHANGES_R4.json` | Rows for the 7 changed manifest files. `verify_lab.py`: PASS. |

### Prompt layout (system prompt; GPT gets the same text as `instructions`)

| # | Part | Changes when | Claude `cache_control` |
|---|---|---|---|
| 1 | English rules + mode rule (play/development) | never within a game; identical across games | yes (with the tools before it: ≈2,240 tokens ESTIMATE, above the 512-token Opus 5.5 minimum) |
| 2 | `KONTEKST IGRE (podatki):` + `{title, slug, available_tools, "opened":[` | never within a game | – |
| 3 | one block per opened step, in game order | a step opens (appended at the end) | on the last step block (a 20-block lookback finds the previous entry one block back) |
| 4 | `sealed_key` + cards of challenges whose reveal is open (frozen: only the active challenge can be assessed) | a challenge or reveal opens | yes |
| 5 | turn state: open card, `asked`, `asked_ideas`, `mode`, transitions, `next`, `challenge_answers` | every turn | – (fresh) |

- The joined parts are one valid JSON object after the label, deep-equal to `modelContext()`. Only key order and whitespace differ.
- The Slovenian data label `KONTEKST IGRE (podatki):` and the string `system` passed to injected rounds are kept on purpose. With them, `tools/game-playtest/playtest.mjs` (parallel Tesla PR) and `tests/browser-p0-smoke.mjs` still parse the context without changes.

### Ideas evaluated

1. **Stable prefix + caching: implemented** (above). Claude uses explicit 5-minute breakpoints. GPT needs no markers: the identical prefix is the rules (≈1,370 tokens at 4 chars/token, above OpenAI's 1024 minimum), plus the opened steps when unchanged.
2. **English internal instructions: implemented.** Effect on cost is small. The rules are now cached (Opus read price $0.20/MTok). By characters the English rules are slightly longer (5,481 vs about 5,078 characters). A real tokenizer usually needs fewer tokens for English than for Slovenian, but that is not verified. The main value is clarity and maintainability.
3. **Effort routing: evaluated, not implemented.** The shared transport already sends `effort: low` on every round for both providers, so "low by default" is already true. Raising effort for `assess_challenge` would:
   - raise output (thinking) tokens;
   - require predicting the round before the model chooses the tool;
   - and, per the Claude prompt-caching docs, a `thinking`/`effort` change between requests invalidates the messages cache, and on some models the tools+system cache too. That is exactly the prefix this change makes cacheable.

   Per-message effort (a beta) avoids that, but it needs the shared transport, which is out of scope. Recommendation: keep low unless a real game shows assessment quality problems.

## Verified by test

- **`tests/game-guide*.test.mjs` (12 files including the new one) + `tests/game-log.test.mjs`: 111 tests, 110 pass, 1 skipped.** The skip is the existing DB-constraint skip in r3. Before: 101 + 7, 100 + 7 pass, the same skip.
- `tests/game-guide-cost-r4.test.mjs` plays 5 turns (11 provider rounds per provider) with the real handler, real shared transport and a fake client. It locks:
  - For Claude, `system` is a block array with exactly 3 `ephemeral` breakpoints. The rules block, the game-header block and the tool list are **byte-identical in every round**. The opened-step blocks are append-only. The last block (turn state) is uncached.
  - The stable prefix contains no player text, no `"allowed_open_steps":`/`"challenge_answers":`/`"learning":`/`"sealed_key":` data, and no sealed hint, reveal or key-idea text.
  - The GPT `instructions` string equals the joined Claude text in every round. It starts with the same stable prefix, and its prefix up to the opened steps is append-only.
  - The context JSON deep-equals `modelContext()` in 5 game states. A card moves into the cached part only after its reveal is open.
  - The rules still name the Slovenian player-facing formats and say that player text is Slovenian.
- `python3 scripts/verify_lab.py`: **PASS**. `VALIDATION_R1.json` was restored before the commit.

## Offline measurement (method)

`node reports/CLOUD_guide-cost-r4_20261103/measure.mjs <label> <out.json>` runs each of the 4 games to the epilogue for both providers. It uses the real handler and the real `providerRound` with a fake client that records every exact request payload. A scripted player (IZUMLJAJ, play mode) does this:

- story: "Naprej.";
- per challenge: one hint request, one factual question, an idea (the agent asks one `ask_understanding`), a full explanation (`assess_challenge` with all milestones), then the reveal.

That gives 60–74 provider rounds over 30–37 turns per game. "Before" ran the same script on an export of the base commit (`git archive HEAD functions public/game`).

- **Tokens: ESTIMATE = characters / 3.5.** No tokenizer is available offline.
- **Claude cache model:**
  - render order tools → system → messages;
  - reads only at `cache_control` breakpoints, with a 20-block lookback;
  - writes up to the last breakpoint;
  - no breakpoint means no caching.
- **GPT cache model:** automatic longest prefix shared with an earlier request, at least 1024 tokens, in 128-token steps. Render order assumed instructions → tools → input (OpenAI's published harmony format). Tools-first is also reported.
- **Scenarios:**
  - *warm*: cache entries survive between the player's turns, i.e. all turn gaps are under 5 minutes;
  - *cold*: entries expire between turns, so reuse happens only within one turn.
- **Prices (USD/MTok):**
  - Claude Opus 5.5 from the `claude-api` skill: $4 input, $5 5-minute write, $0.20 read, $20 output.
  - Claude Sonnet 5.5, same token counts: $2 / $2.50 / $0.20 / $10.
  - GPT-6.1-sol from the constants in `functions/lib/mdlxdcc-guide/cost.mjs`: $2 input, $0.10 cached, $2.50 write, $10 output.
  - These are list prices. The in-code budget `charge()` adds 10%.
- **Output tokens are an ASSUMPTION** (150 / 300 / 600 per round). They are the same before and after.

### Per game, per provider (ESTIMATE; before → after)

| Game | Provider | Rounds (turns) | Avg tokens/round | First–last round | Same prefix as previous round | Cache-read share, warm | Cache-read share, cold |
|---|---|---|---|---|---|---|---|
| dayton1903 | claude | 60 (30) | 7,868 → 8,052 | 2,881–11,704 → 3,064–11,892 | 42% → 88% | 0% → 87% | 0% → 42% |
| dayton1903 | gpt | 60 (30) | 7,947 → 8,131 | 2,928–11,790 → 3,111–11,978 | 43% → 87% | 50% → 78% | 14% → 37% |
| faraday1831 | claude | 68 (34) | 9,056 → 9,241 | 2,653–13,507 → 2,836–13,697 | 39% → 89% | 0% → 88% | 0% → 43% |
| faraday1831 | gpt | 68 (34) | 9,136 → 9,321 | 2,700–13,593 → 2,883–13,783 | 39% → 89% | 51% → 81% | 13% → 38% |
| navierstokes1845 | claude | 72 (36) | 9,291 → 9,476 | 2,697–14,626 → 2,880–14,815 | 39% → 87% | 0% → 86% | 0% → 41% |
| navierstokes1845 | gpt | 72 (36) | 9,371 → 9,556 | 2,744–14,712 → 2,927–14,901 | 39% → 87% | 48% → 79% | 13% → 37% |
| tesla1888 | claude | 74 (37) | 12,576 → 12,761 | 2,736–20,945 → 2,919–21,135 | 33% → 88% | 0% → 87% | 0% → 41% |
| tesla1888 | gpt | 74 (37) | 12,656 → 12,841 | 2,783–21,031 → 2,966–21,221 | 33% → 88% | 48% → 82% | 11% → 38% |

Size is unchanged (+≈180 tokens per round from the English rules by characters). The gain comes from order and breakpoints, not from size.

### ESTIMATED USD per complete game (before → after)

| Game | Model | Input only, warm | Input only, cold | Total warm, output 150 / 300 / 600 tok per round |
|---|---|---|---|---|
| dayton1903 | Claude Opus 5.5 | 1.89 → **0.36** | 1.89 → 1.41 | 2.07 / 2.25 / 2.61 → 0.54 / 0.72 / 1.08 |
| dayton1903 | (same tokens as Claude Sonnet 5.5) | 0.94 → 0.22 | 0.94 → 0.73 | 1.03 / 1.12 / 1.30 → 0.31 / 0.40 / 0.58 |
| dayton1903 | GPT-6.1-sol | 0.50 → **0.25** | 0.83 → 0.63 | 0.59 / 0.68 / 0.86 → 0.34 / 0.43 / 0.61 |
| faraday1831 | Claude Opus 5.5 | 2.46 → **0.44** | 2.46 → 1.82 | 2.67 / 2.87 / 3.28 → 0.64 / 0.85 / 1.25 |
| faraday1831 | (same tokens as Claude Sonnet 5.5) | 1.23 → 0.27 | 1.23 → 0.93 | 1.33 / 1.44 / 1.64 → 0.38 / 0.48 / 0.68 |
| faraday1831 | GPT-6.1-sol | 0.65 → **0.30** | 1.09 → 0.81 | 0.75 / 0.85 / 1.05 → 0.40 / 0.50 / 0.71 |
| navierstokes1845 | Claude Opus 5.5 | 2.68 → **0.54** | 2.68 → 2.02 | 2.89 / 3.11 / 3.54 → 0.75 / 0.97 / 1.40 |
| navierstokes1845 | (same tokens as Claude Sonnet 5.5) | 1.34 → 0.33 | 1.34 → 1.04 | 1.45 / 1.55 / 1.77 → 0.44 / 0.54 / 0.76 |
| navierstokes1845 | GPT-6.1-sol | 0.73 → **0.35** | 1.18 → 0.89 | 0.84 / 0.95 / 1.16 → 0.46 / 0.56 / 0.78 |
| tesla1888 | Claude Opus 5.5 | 3.72 → **0.71** | 3.72 → 2.79 | 3.94 / 4.17 / 4.61 → 0.93 / 1.15 / 1.59 |
| tesla1888 | (same tokens as Claude Sonnet 5.5) | 1.86 → 0.44 | 1.86 → 1.44 | 1.97 / 2.08 / 2.31 → 0.55 / 0.66 / 0.88 |
| tesla1888 | GPT-6.1-sol | 1.02 → **0.42** | 1.68 → 1.21 | 1.13 / 1.24 / 1.46 → 0.53 / 0.65 / 0.87 |

**Per round (to scale to real game lengths):**

- Opus input 0.031–0.050 → **0.006–0.010 USD** (warm).
- GPT input 0.008–0.014 → **0.004–0.006 USD**.

**Sensitivity checks:**

- GPT with tools rendered first: 0.43–0.92 → 0.17–0.33.
- GPT if every uncached prompt token is billed as a cache write ($2.50): 0.62–1.26 → 0.31–0.51.
- Claude with a 1-hour TTL (2× writes): 0.45–0.91, versus 0.36–0.71 at 5 minutes when warm and 1.41–2.79 when cold.

**What is left per Opus round after the change (warm):**

- fresh input ≈ 500–700 tokens: the conversation history ≈ 360–470, plus the turn state;
- cache writes when a step opens (new step + sealed key + frozen cards);
- cache reads of the rest.

For Dayton that is about 0.13 USD fresh, 0.15 USD writes and 0.08 USD reads per game.

**Reported production numbers.**

- With no `cache_control`, Claude reads 0% by construction. The model gives GPT 11–14% (cold) to 48–51% (warm). A Claude-heavy mix therefore fits the reported 6.6%.
- At the before rate of 0.031–0.050 USD input per Opus round, 1.57 USD corresponds to about 28–42 rounds, i.e. a partial game.
- Both are plausible, but **not verified**.

## Not verified

- **Real cache behaviour.** Actual `cache_read_input_tokens` / `cache_creation_input_tokens` (Claude) and `cached_tokens` (GPT), and the GPT render order. This needs a real request.
- **Claude request shape.**
  - Whether the API accepts up to 33–42 system text blocks (one per opened step; game end) with 3 breakpoints. No limit is documented in the skill.
  - Whether the 20-block lookback hits the previous last-step entry as modelled.
  - Whether the API joins system blocks without changing the JSON. Splits happen only between JSON tokens, so a separator would still leave valid JSON.
- **Model behaviour with English instructions.** Slovenian replies, questions and `why`, and the same tool discipline. It was not run against a model. The deterministic server guards (`unsafeReply`, technical-text checks, card derivation) are unchanged.
- **Token counts.** They are chars/3.5. Slovenian and English tokenize differently.
- **Output tokens per round, and the real rounds per game.** The scripted path is one hint and one question per challenge.
- **TTL hit rate.** It depends on the player's pauses.
- **GPT-6.1-sol cache-write billing.** Whether uncached tokens are billed at $2.50.
- **The production numbers** 1.57 USD / 6.6%. There is no access to production logs.
- **Other harnesses.** `tests/browser-p0-smoke.mjs` (already stale, see the P0-1 report) and `tools/game-playtest/playtest.mjs` were not run. They should keep working because the label and the string `system` are unchanged.

## Open questions for BD

1. **One real measured game (needs BD's agreement and a key).** One complete owner game per provider (at least Claude Opus 5.5) with logging on. The game log already records per-round `usage.input_tokens`, `cache_read`, `cache_write(_5m/_1h)` and `output_tokens`, plus `stop_reason` (P0-R3.4). That single game:
   - confirms or corrects the cache-read share (expected ≈ 80–88% warm) and the USD per game;
   - measures output tokens per round, the largest unknown, since at 300 tokens/round output is about half of the remaining Opus cost;
   - checks that the English instructions still give Slovenian player text and the same tool discipline.
2. **0.30 USD per game.** It is not reached for a complete Opus game by caching alone: input is 0.36–0.71 USD plus output (ESTIMATE). Options:
   - Claude Sonnet 5.5: input 0.22–0.44, and the transport already uses `between_tools` thinking there;
   - GPT-6.1-sol: input 0.25–0.42;
   - shorter output.

   Model choice is BD's decision.
3. **Cache TTL.** Is the 5-minute TTL enough? The game-log timestamps give the share of player turns that arrive more than 5 minutes after the previous one. A 1-hour TTL costs 2× per write, and it pays off if long pauses are common.
4. **Further levers, not implemented** (they change what the model sees, so test them in a real game):
   - (a) Drop the `refs` arrays from opened steps in the model context. They repeat the first ~90 characters of each paragraph, 27–40% of the opened-step JSON. Estimate: about 0.04–0.05 USD per Opus game.
   - (b) Move the turn state after the conversation, as a mid-conversation system/developer message, so the history and within-turn tool rounds also cache, and GPT's tools would cache even if rendered after the instructions. Upper bound here: 0.08–0.13 USD per Opus game, if all history tokens were reused. In practice it is less, because only later rounds of a turn can reuse the history. It is more with long chats.
   - (c) In the shared transport (out of scope): GPT `prompt_cache_key` / retention, and Claude per-message effort if effort routing is ever wanted.
5. **Observation in `functions/lib/mdlxdcc-guide/cost.mjs` (out of scope, not changed).** `charge()` prices Claude **Sonnet** cache reads at $0.10/MTok (`read * 100`, scale 1), while the `claude-api` skill lists $0.20 for Sonnet 5.5. Opus ($0.20) matches. The budget ledger therefore undercounts Sonnet cache reads.
6. **Merge order with the Tesla playtest PR.** No conflict is expected. A future harness should read Claude payloads as block arrays (see the helper in `tests/game-guide-r35.test.mjs`).
