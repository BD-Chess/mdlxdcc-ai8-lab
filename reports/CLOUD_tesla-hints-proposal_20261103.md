# CLOUD Tesla 1888 hint proposal, 2026-11-03

**This is a proposal for BD and the game author. It is a content decision, not a fix.** The game was authored in the session **Inventing-3-TESLA**, and BD decides.

**Branch and PR:**
- Branch: `cloud/tesla-hints-proposal-20261103`. Draft PR: #22.
- It branches from #11 (`cloud/tesla-playtest-20261103`).
- **It is not part of the merge chain #11 → #13 → #20.**
- No model or API calls were made.

## Scope

Only the 7 hints flagged in `reports/CLOUD_tesla-playtest_20261103.md` (item 4, reviewer Zora) are rewritten: s6, s13, s20, s21, s28, s29, s36.

| File | What changed |
|---|---|
| `public/game/tesla1888/index.html` | The visible text of the 7 hints. The guide reads this text through `stepTexts`. |
| `public/game/tesla1888/game.json` | For the same hints: `steps[challenge].key.hints[].besedilo` and the hint step's `refs[0].label`. The label is the first 90 characters of the text, as for all 85 paragraph refs. `key_commit.sha3` is recomputed. |
| `public/game/tesla1888/SHA256SUMS.txt` | The `index.html` and `game.json` lines. |
| `lab-evidence/LAB_CHANGES_R10.json` | Records the 3 changed exported files (content commit `4d7120d`). |

Nothing else changes:
- Step ids, order, tiers, titles and `for` stay the same.
- `covers` stays the same, as do challenge texts, key ideas, reveals and `for_agent`.

**The rules the new texts follow:**
- t2 hints point to the cause or direction.
- t3 hints may narrow the search strongly. They do not state the mechanism or the numbers that the key ideas and the reveal contain.
- Most of the text is a question the player has to answer.

## The 7 hints: independent choices

Each hint below is a separate choice, so BD can accept or reject each one on its own.

To reject one hint:
1. Put its OLD text back in the `<p data-ref="sN.p1">` paragraph of `index.html`.
2. Put the same text in the `besedilo` field in `game.json`, and its first 90 characters in the `label`.
3. Recompute `key_commit` and SHA256SUMS with the procedure below.

### 1. s6, tier 3 of s3 "Neprijetna cena vrtenja" (covers s3.k3)

- **OLD:** Generator v sebi proizvaja izmenični tok; komutator ga šele preoblikuje za enosmerni motor. Ali bi se dalo to samodejno menjavanje smeri izkoristiti, namesto da ga mehansko odpravljaš? Kako tok pripeljati do vrtečega se dela, ostane odprto vprašanje.
- **NEW:** Loči nalogo od izvedbe: kaj motor zares potrebuje in kaj je le način, kako to v tem stroju opravlja drsni stik? Nato pomisli, kakšen tok nastaja v vrtečem se navitju generatorja, še preden pride do komutatorja. Kako tok pripeljati do vrtečega se dela, ostane odprto vprašanje.
- **What changed and why:**
  - The old text named alternating current and proposed using it instead of commutating it. That is k3 together with its own example.
  - The new text asks the player to separate the task from the implementation, which echoes the s7 reveal ("ločiš nalogo stroja od njegove izvedbe"). It then points to the current in the generator winding before the commutator, without naming it or saying what to do with it.
  - The last sentence is kept.
- **Historical check:** in a Gramme dynamo, the voltage in each armature coil reverses as the coil passes the poles, and the commutator rectifies it. This matches s7: "Generatorji v tvojem času že proizvajajo izmenične električne spremembe."

### 2. s13, tier 3 of s10 "Gibanje brez dotika" (covers s10.k3)

- **OLD:** Največji magnetni učinek v razmaknjenih navitjih naj ne nastopi istočasno, ampak zaporedno, s časovnim zamikom. Kaj se zgodi s skupnim magnetnim učinkom, ko ga primerjaš med dvema zaporednima trenutkoma?
- **NEW:** Najprej v mislih preizkusi preprost primer: vsa razmaknjena navitja nihajo hkrati, v istem ritmu. Ali se smer skupnega magnetnega učinka pri tem kam premika? Nato razmisli, kaj bi moral spremeniti pri tem, kdaj posamezno navitje doseže svoj največji učinek.
- **What changed and why:**
  - The old text stated the k3 mechanism (sequential maxima with a time shift) and left only the consequence open.
  - The new text has the player test the in-phase case first, which is the "not enough" half of k3. It then asks what to change about when each winding peaks.
  - It does not say "sequential", "time shift" or "rotating".
  - k4 (order reverses direction) is still not mentioned, as the s13 `for_agent` requires.
- **Historical check:** windings driven in phase give a field that only pulses along one axis. Time-shifted currents make it rotate, as in s14.

### 3. s20, tier 2 of s18 "Nevidna povezava" (covers s18.k2)

- **OLD:** Faraday je pokazal, da spreminjanje magnetnega vpliva lahko sproži električni tok v prevodniku. Če ima tok v rotorju sklenjeno pot, ga ni treba dovajati po žici.
- **NEW:** Spomni se Faradayevih poskusov: kaj lahko spreminjajoč se magnetni vpliv povzroči v kovini, na katero ni priključen noben vir? In kakšno obliko bi moral imeti prevodni del rotorja, da bi to v njem lahko delovalo brez žic od zunaj?
- **What changed and why:**
  - The old text stated the whole of k2: induced current, a closed path, and no wire needed.
  - The new text, as a t2, points to the cause (Faraday's experiments) and asks two questions: what appears in the unconnected metal, and what shape the rotor conductor needs.
  - It does not say "current" or "closed path".
- **Historical check:** Faraday's induction (1831) was already shown in the s14 reveal and is used in s22.

### 4. s21, tier 3 of s18 (covers s18.k3, s18.k4)

- **OLD:** Inducirani tok ustvari magnetni odziv, zaradi katerega rotor sledi vrtečemu se polju. Če bi polje povsem dohitel, bi inducirani tok in z njim indukcijski navor izginila.
- **NEW:** Tok, ki nastane v rotorju, ni brez posledic: kaj ustvari vsak električni tok okoli sebe in kako bi to delovalo skupaj z vrtečim se poljem? Nato si zamisli, da rotor polje dohiti in se vrti natanko enako hitro. Kaj bi se tedaj z vidika rotorja še spreminjalo?
- **What changed and why:**
  - The old text stated k3 (the rotor's own magnetic response makes it follow the field) and k4 (current and torque vanish at equal speed). That is almost the whole s22 reveal.
  - The new text asks both as questions: what any current makes around itself and how that meets the rotating field (k3), and what still changes for a rotor running at field speed (k4).
  - It does not state that the rotor lags, that the torque vanishes, or "slip".
- **Historical check:** Ørsted (1820) showed that a current makes a magnetic field. This matches s22.

### 5. s28, tier 2 of s26 "Od izuma do uporabnega sistema" (covers s26.k2, s26.k3)

- **OLD:** V generatorju uporabi dve električno ločeni navitji, pravokotni drugo na drugo. Ko se vrtita skozi magnetno polje, eno doseže največjo inducirano napetost takrat, ko je pri drugem trenutna inducirana napetost nič. Tako dobiš dva izhoda, zamaknjena za četrtino periode.
- **NEW:** Časovno razliko lahko poiščeš že tam, kjer napetost nastaja. Od česa je odvisno, v katerem trenutku obrata navitje v generatorju doseže največjo napetost? Kako bi to izkoristil, da bi iz enega stroja dobil dva izhoda, ki ne dosegata vrhov hkrati?
- **What changed and why:**
  - The old text was the full solution to k2 and k3: two windings at right angles, one at its peak while the other is at zero, a quarter-period shift.
  - The new text, as a t2, gives the direction: look where the voltage is generated. It then asks what decides the timing of a winding's peak and how to use that.
  - It does not mention "two windings", "perpendicular" or "90°".
- **Historical check:** this matches s30, Tesla's 1888 generator with two perpendicular windings. It does not rule out the B alternatives in s30.

### 6. s29, tier 3 of s26 (covers s26.k4, s26.k5)

- **OLD:** Dva neodvisna sklenjena tokokroga potrebujeta po dva vodnika, skupaj štiri. Če združiš povratni poti, zadoščajo trije, toda skupni vodnik mora prenašati vsoto obeh tokov; pri enakih sinusnih tokovih z zamikom 90 stopinj je njegov efektivni tok približno 1,41-krat večji. Če iz enega vira ustvariš drugo fazo šele pri motorju, zadoščata dva napajalna vodnika, vendar potrebuješ dodatne električne elemente.
- **NEW:** Za vsak tok si zamisli celotno pot od vira do motorja in nazaj. Koliko vodnikov tako potrebujeta dva ločena tokokroga? Ali bi si lahko kakšno pot delila in kaj bi tedaj moral prenašati skupni vodnik? Premisli še, ali mora drugi časovni potek nastati že pri generatorju ali šele pri motorju, in kaj te stane vsaka izbira.
- **What changed and why:**
  - The old text gave every number: 4, 3 or 2 conductors, the sum in the common return, and 1.41×. That is all of k4 and most of k5.
  - The new text follows Zora's proposal. It has the player trace each closed path and count, ask whether paths can be shared and what the shared conductor carries, and weigh where the second phase is made and at what cost.
  - There are no counts, no sum, no 1.41 and no 15 %.
- **Historical check:** this matches s30, which accepts four or three conductors, and two conductors with the phase made at the motor as B.

### 7. s36, tier 3 of s33 "Trideset kilometrov do mesta" (covers s33.k3, s33.k4)

- **OLD:** Elektrike ni treba uporabljati pri enaki napetosti, kot jo pošiljaš po daljnovodu. Poznaš dve tuljavi, povezani s spreminjajočim se magnetnim poljem: kaj bi z njima naredil na začetku in na koncu poti?
- **NEW:** Ali mora napetost, ki je ugodna za dolgo pot, ostati enaka tudi tam, kjer elektriko uporabljajo ljudje? Če ne, kje na poti bi jo spreminjal? Pri izmeničnem toku ti lahko pomaga pojav, ki ga že izkoriščaš v svojem motorju: kako bi z njim spremenil napetost?
- **What changed and why:**
  - The old text stated the premise of k3. It also described the transformer mechanism of k4 (two coils linked by a changing magnetic field) and asked only where to put it.
  - The new text turns k3 into questions (must the voltage stay the same, and where would you change it) and points to the phenomenon the player already uses in the motor.
  - It does not mention two coils, a shared changing field, the absence of a direct connection, or step-up and step-down.
  - It is still a strong t3. If BD wants it softer, drop the last clause ("pojav, ki ga že izkoriščaš v svojem motorju").
- **Historical check:** by 1893 the transformer was known (Gaulard–Gibbs 1882–1886, ZBD 1885, Stanley 1886; see s37), and Tesla's motor works by electromagnetic induction. The hint does not claim that Tesla invented the transformer.

## Before and after: which key ideas the text gives away

Judged by meaning, not by words.

| Hint | Tier | Covers | OLD gives away | NEW gives away |
|---|---|---|---|---|
| s6 | 3 | s3.k3 | k3 fully: use the generator's alternating current instead of reversing it mechanically. Also restates part of k2. | None stated. Points to the generator winding's current as a question. The player still has to conclude "reverse direction without a sliding contact". |
| s13 | 3 | s10.k3 | k3 mechanism: maxima sequential, with a time shift. | None stated. Gives the in-phase test case and asks about the timing of the peaks. k3's conclusion (time shift, rotating direction) is left to the player. |
| s20 | 2 | s18.k2 | k2 fully: induced current, closed path, no wire. | None stated. Gives the cause to look at (Faraday) and asks what appears and what shape the conductor needs. |
| s21 | 3 | s18.k3, s18.k4 | k3 and k4 fully: magnetic response makes the rotor follow; at equal speed, current and torque vanish. | None stated. Both are asked as questions. "Lag" and "torque vanishes" are not said. |
| s28 | 2 | s26.k2, s26.k3 | k2 and k3 fully: two perpendicular windings, peaks offset, quarter period. | None stated. Says only to look where the voltage is generated, and asks what sets the moment of the peak. |
| s29 | 3 | s26.k4, s26.k5 | k4 fully (4, 3, 2 conductors) and k5 mostly (sum, 1.41×, extra elements). | None stated. Asks the player to count the closed paths and to ask what a shared conductor carries and what each option costs. No numbers. |
| s36 | 3 | s33.k3, s33.k4 | k3 premise and k4 mechanism (two coils plus a changing magnetic field). | Borderline on k4 only at the level of "the phenomenon you use in your motor". k3 is asked, not stated. The two-winding arrangement and step-up/step-down are not stated. |

**Coverage declarations (`covers`):**
- Unchanged. Each new hint still aims at the same key ideas, only less directly.
- `covers` decides which key ideas can no longer earn ✦ once the hint is opened (`assessment.mjs` `hintCoverage`), so keeping them is the conservative and consistent choice.
- Optional note for the author: the `for_agent` texts of s20 and s28 still call them "zelo močan namig". After the rewrite they are moderate t2 hints. This is harmless, and it is left unchanged because it is outside this scope.

## key_commit

The procedure was found by reproduction. No script in this repo or in bd-chessdb computes it.
- I tested 6,944 candidate serializations per game against all three games: 124 payload shapes × 56 JSON formats.
- Navier–Stokes and the current Tesla value matched exactly one candidate, the same one for both.
- Dayton R7.1 matches a variant that maps step ids to keys: `{step_id: key}`.

```python
keys = [s["key"] for s in game["steps"] if "key" in s]  # challenge steps, in file order
blob = json.dumps(keys, sort_keys=True, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
sha3 = hashlib.sha3_256(blob).hexdigest()  # no trailing newline
```

`game.json` is written back as `json.dumps(game, indent=1, ensure_ascii=False) + "\n"`. Before any edit, this was checked to reproduce the original file byte for byte.

| | Value |
|---|---|
| key_commit old (reproduced before any edit) | `bf9d94e88cbd031ab55e02915a5d484bd01fb7409268ca9fb884e332e6f2e1d2` |
| key_commit new | `f87a5a1d1324ae131970dd9c36c82c24db3695da53522da0580ffaf3cf75785c` |
| index.html sha256 | `b90a7678…0cd7` → `c060247f16461db77f61eed97f35dd31a07287e32530f76ede251beacc343c2f` |
| game.json sha256 | `b0531510…e855` → `cc441ed4f1f1734ea5d626ce507f06382d2a83e0eac4d5dec447be98159ec5d9` |
| SHA256SUMS.txt sha256 | `137d03fc…8117` → `54df934c7d5ef778c4fc705207bfafd6a47b93023225d911b2d4ca1923509ac5` |

`sha256sum -c SHA256SUMS.txt` reports all 13 files OK.

## Verification

| Check | Result |
|---|---|
| `node --test tests/game-guide*.test.mjs` | **98 pass, 4 fail, 1 skipped, the same before and after the change.** |
| Tesla extraction test (p0 "trusted page extraction…") | Passes. It is the only test that reads Tesla content. |
| `stepTexts` check | Returns the new text for all 7 hints, identical to `besedilo` in game.json. |
| `node tools/game-playtest/playtest.mjs tesla1888 <scratch> 360` | 42 turns, 89 mock rounds, `allStepsOpened: true` (38/38), `cardLines: 5`, console 0, page errors 0, failed requests 0, overflow 0. |
| Same at `1280` | Same result: 38/38 steps, 5 card lines, 0 errors, 0 failed requests, 0 overflow. The new s6 text renders in the hint card. |
| `python3 scripts/verify_lab.py` | PASS: 5363 source files, no errors. The 3 changed files are recorded in `lab-evidence/LAB_CHANGES_R10.json`. `VALIDATION_R1.json` was restored with `git checkout --`. |

The 4 test failures exist on the base branch with no changes and are unrelated to Tesla content:
- p0 "P0-1 suppress claimed opening…" and the two "shared real provider transport" tests in `game-guide.test.mjs` expect an older guide message ("Preberi in mi povej, ko si pripravljen.").
- r2 "R2 rejected call… opens s6" fails on Dayton data.

## Not verified

- Real model behavior with the new hints. The playtest uses the deterministic mock agent.
- Whether real players find the new t2 hints (s20, s28) too weak. This is the author's call.
