# CLOUD Supabase slugs (tesla1888, navierstokes1845), 2026-11-03

Branch `cloud/supabase-slugs-20261103`, stacked on #8 → #7 → #6. **No apply was run.** Applying is BD's step.

## Cause

- `functions/lib/game-guide/runtime.mjs:4` lists the slugs `dayton1903, faraday1831, navierstokes1845, tesla1888, _fixture`.
- The database check in `supabase/migrations/20261029195424_game_guide_log.sql` allows only `dayton1903, faraday1831, _fixture`.
- So `game_log_start` for Tesla 1888 or Navier–Stokes 1845 violates `game_sessions_slug_check`, and agent logging fails for these two games.

## Done

- `supabase/migrations/20261103180000_game_sessions_slugs_r2.sql` drops the check and recreates it with all 5 slugs. It intentionally has no `if exists`: if the constraint has a different name, it fails loudly instead of leaving the old check active.
- `tests/game-log-slugs.test.mjs` adds two tests:
  1. **Consistency:** runtime `SLUGS` equals the slug list from the newest migration that defines it. The test fails if a new game is added to the code without a migration.
  2. **Real Postgres (PGlite):** the migrations are applied in order. Before the new migration, `tesla1888` fails on `game_sessions_slug_check`. After it, all 5 slugs pass and an unknown slug still fails. A Tesla log append and its deletion still work, because the tombstone keeps slug null.

## Verified by test

- `node --test tests/game-log-slugs.test.mjs`: 2/2 pass.
- `node --test tests/game-log.test.mjs`: 7/7 pass, so existing behavior is unchanged.

## Not verified

- The constraint name in the production database: the default Postgres name is `game_sessions_slug_check`. Step 1 below checks it.
- The production apply and agent logging for Tesla 1888 after the apply.

## How BD applies it (production Supabase, project with schema `mdlxdcc_guide_private`)

1. **Check** (SQL editor):
   ```sql
   select conname, pg_get_constraintdef(oid)
   from pg_constraint
   where conrelid = 'mdlxdcc_guide_private.game_sessions'::regclass and contype = 'c';
   ```
   One row must be `game_sessions_slug_check` with `slug = ANY (ARRAY['dayton1903'::text, 'faraday1831'::text, '_fixture'::text])`. If the name is different, stop.
2. **Apply** one of these two ways:
   - Supabase dashboard → SQL editor → paste the whole content of `supabase/migrations/20261103180000_game_sessions_slugs_r2.sql` → Run. It runs in one transaction.
   - Or, with the Supabase CLI linked to the project, in the bd-chessdb repo after the file has been transferred there: `supabase db push`.
3. **Confirm:** run the query from step 1 again. It must show all 5 slugs, including `navierstokes1845` and `tesla1888`.
4. **Functional check:** open `/game/tesla1888/` as owner with logging on, send one message, and confirm in the game log that the session appears.
5. **Rollback** (only if no Tesla or Navier–Stokes sessions exist yet; otherwise the check fails on the existing rows):
   ```sql
   begin;
   alter table mdlxdcc_guide_private.game_sessions drop constraint game_sessions_slug_check;
   alter table mdlxdcc_guide_private.game_sessions add constraint game_sessions_slug_check
     check (slug in ('dayton1903','faraday1831','_fixture'));
   commit;
   ```

## Transfer to bd-chessdb

After BD confirms, the transfer needs only two files: the migration and the test. Both are new, and runtime `SLUGS` in bd-chessdb is already correct.
