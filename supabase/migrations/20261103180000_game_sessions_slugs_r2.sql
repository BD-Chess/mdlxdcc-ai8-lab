-- GAME-LOG slugs R2: allow game logs for Navier–Stokes 1845 and Tesla 1888.
-- functions/lib/game-guide/runtime.mjs SLUGS already lists both games; without this
-- migration game_log_start fails the column check for them. Deleted-session tombstones
-- keep slug null, which the check still accepts. Fails loudly if the constraint name differs.
begin;
alter table mdlxdcc_guide_private.game_sessions
  drop constraint game_sessions_slug_check;
alter table mdlxdcc_guide_private.game_sessions
  add constraint game_sessions_slug_check
  check (slug in ('dayton1903','faraday1831','navierstokes1845','tesla1888','_fixture'));
commit;
