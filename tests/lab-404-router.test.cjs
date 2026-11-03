const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { labRoute } = require('../scripts/lab_404_router.js');

const root = path.join(__dirname, '..');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]);
const plan = JSON.parse(fs.readFileSync(path.join(root, 'lab-evidence/LAB_EXPORT_PLAN_R1.json'), 'utf8'));
const data = {
  base: '/mdlxdcc-ai8-lab/', production: 'https://www.mdlxdcc.org',
  excluded: plan.excluded.map(e => e.path).filter(p => p.startsWith('public/') && /\.html?$/.test(p)).map(p => p.slice(7)),
  rules: JSON.parse(fs.readFileSync(path.join(root, 'scripts/lab_routes_r2.json'), 'utf8')).rules,
  files: walk(path.join(root, 'public')).map(f => path.relative(path.join(root, 'public'), f).split(path.sep).join('/')),
};
const route = p => labRoute('/mdlxdcc-ai8-lab/' + p, data);

test('letter case and a missing .html resolve to the existing lab file', () => {
  assert.deepEqual(route('crp/ai8_conscious_love_valuation'), { kind: 'local', href: '/mdlxdcc-ai8-lab/crp/AI8_Conscious_Love_Valuation.html' });
  assert.equal(route('c/mind-of-minds.html').href, '/mdlxdcc-ai8-lab/c/Mind-of-Minds.html');
  assert.equal(route('ai8/ai8_arenaloop').href, '/mdlxdcc-ai8-lab/AI8/AI8_ArenaLoop.html');
});

test('production redirect rules are replayed inside the lab', () => {
  assert.equal(route('crp/mdlxdcc').href, '/mdlxdcc-ai8-lab/crp/MDLxDCC.html');
  assert.equal(route('bd/trading').href, '/mdlxdcc-ai8-lab/BD/BD_Trading_Hub.html');
  assert.equal(route('bd/trading').rule, '/bd/trading');
});

test('pages the lab snapshot excludes point to the production site, never to OmniCPQ/TS', () => {
  assert.deepEqual(route('BD/'), { kind: 'production', href: 'https://www.mdlxdcc.org/BD/' });
  assert.equal(route('index-atlas.html').kind, 'production');
  assert.ok(!data.rules.some(r => /omnicpq|^\/ts\b/i.test(r.from + r.to)));
});

test('unknown paths stay missing and malformed escapes do not throw', () => {
  assert.equal(route('no/such/page-xyz').kind, 'missing');
  assert.equal(labRoute('/mdlxdcc-ai8-lab/%E0%A4%A', data).kind, 'missing');
});
