import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { randomUUID, createHash } from 'node:crypto';
import { SLUGS } from '../functions/lib/game-guide/runtime.mjs';

const dir = new URL('../supabase/migrations/', import.meta.url);
const migrations = (await readdir(dir)).filter(n => n.endsWith('.sql')).sort();
const sql = name => readFile(new URL(name, dir), 'utf8');

// The last migration that defines the game_sessions slug check is the database allowlist.
async function databaseSlugs() {
  let slugs = null;
  for (const name of migrations) {
    const text = await sql(name);
    if (!/game_sessions/.test(text)) continue;
    const m = [...text.matchAll(/slug\s+in\s*\(([^)]*)\)/gi)].at(-1);
    if (m) slugs = m[1].split(',').map(s => s.trim().replace(/^'|'$/g, ''));
  }
  return slugs;
}

test('runtime SLUGS and the database slug check list the same games', async () => {
  assert.deepEqual([...await databaseSlugs()].sort(), [...SLUGS].sort());
});

test('actual Postgres: tesla1888 and navierstokes1845 logs start only after the slugs migration', async () => {
  const { PGlite } = await import(process.env.GAME_LOG_PGLITE_MODULE || '@electric-sql/pglite');
  const db = new PGlite();
  try {
    await db.exec('create role anon; create role authenticated;');
    const order = ['_mdlxdcc_guide_access_budget.sql', '_game_guide_log.sql', '_game_guide_trace.sql'];
    for (const suffix of order) await db.exec(await sql(migrations.find(n => n.endsWith(suffix))));
    const secret = 'offline-db-fixture', digest = createHash('sha256').update(secret).digest('hex');
    await db.query('insert into mdlxdcc_guide_private.config(server_key_sha256) values ($1)', [digest]);
    const rpc = async (action, data = {}) => (await db.query('select public.mdlxdcc_guide($1,$2::jsonb) as result', [action, JSON.stringify(data)])).rows[0].result;
    await db.exec('set role anon;');
    await db.query("select set_config('request.headers',$1,false)", [JSON.stringify({ 'x-mdlxdcc-guide-key': secret })]);
    const start = slug => rpc('game_log_start', { id: randomUUID(), actor_key: 'a'.repeat(64), slug, owner: true, consent: true, development: true });

    await assert.rejects(start('tesla1888'), /game_sessions_slug_check/);
    await db.exec('reset role;');
    await db.exec(await sql(migrations.find(n => n.endsWith('_game_sessions_slugs_r2.sql'))));
    await db.exec('set role anon;');
    for (const slug of ['dayton1903', 'faraday1831', 'navierstokes1845', 'tesla1888', '_fixture']) assert.equal((await start(slug)).ok, true, slug);
    await assert.rejects(start('unknown1999'), /game_sessions_slug_check/);

    const data = { id: randomUUID(), actor_key: 'b'.repeat(64), slug: 'tesla1888', owner: true, consent: true, development: true };
    await rpc('game_log_start', data);
    await rpc('game_log_append', { ...data, events: [{ kind: 'player_message', payload: { text: 'fixture' } }] });
    await rpc('game_log_delete', data); // tombstone sets slug null
    assert.equal((await rpc('game_log_read', { id: data.id })).events.length, 0);
  } finally { await db.close(); }
});
