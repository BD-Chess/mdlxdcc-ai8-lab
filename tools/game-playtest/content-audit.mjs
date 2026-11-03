// Static content audit of one game: game.json vs index.html consistency, images, and the
// challenge texts (question, key ideas, hints, reveal) as the guide sees them, for a human
// hint review. No network or model calls. Usage:
//   node tools/game-playtest/content-audit.mjs <slug> [out.json]
import { readFile, writeFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { stepTexts } from '../../functions/lib/game-guide/content.mjs';
import { validateGame } from '../../functions/lib/game-guide/runtime.mjs';
import { hintCoverage } from '../../functions/lib/game-guide/assessment.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const [slug = 'faraday1831', out] = process.argv.slice(2);
const dir = path.join(root, 'public/game', slug);
const html = await readFile(path.join(dir, 'index.html'), 'utf8');
const game = JSON.parse(await readFile(path.join(dir, 'game.json'), 'utf8'));
const lineOf = index => html.slice(0, index).split('\n').length;
const problems = [], add = (where, what) => problems.push({ where, what });
try { validateGame(structuredClone(game), slug); } catch (e) { add('game.json', `validateGame: ${e.message}`); }

// Sections: ids, order and data-* attributes against game.json.
const attr = (tag, name) => tag.match(new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`))?.[1];
const sections = [...html.matchAll(/<section\b[^>]*>/g)].map(m => ({ tag: m[0], line: lineOf(m.index), id: attr(m[0], 'id') }))
  .filter(s => /\bg-step\b/.test(attr(s.tag, 'class') || ''));
const byId = new Map(sections.map(s => [s.id, s]));
game.steps.forEach((step, i) => {
  const s = byId.get(step.id);
  if (!s) return add(`game.json ${step.id}`, 'no <section class="g-step"> with this id in index.html');
  const expect = { 'data-kind': step.kind, 'data-act': String(step.act), 'data-step': String(i + 1), 'data-for': step.for, 'data-tier': step.tier == null ? undefined : String(step.tier) };
  for (const [name, value] of Object.entries(expect)) if (attr(s.tag, name) !== value) add(`index.html:${s.line} ${step.id}`, `${name}="${attr(s.tag, name)}" but game.json says ${JSON.stringify(value)}`);
  if ((i === 0) === /\shidden(?=[\s>])/.test(s.tag)) add(`index.html:${s.line} ${step.id}`, i === 0 ? 'first step is hidden' : 'step is not hidden at start');
});
for (const s of sections) if (!game.steps.some(st => st.id === s.id)) add(`index.html:${s.line} ${s.id}`, 'g-step section not in game.json');
if (sections.map(s => s.id).join() !== game.steps.map(s => s.id).join()) add('index.html', 'section order differs from game.json order');

// refs: every ref has a data-ref element; the label starts the element text.
const plain = s => s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').replace(/ ([.,;:!?])/g, '$1').trim();
const norm = s => plain(s).normalize('NFC').replace(/[»«"„“”]/g, '"');
for (const step of game.steps) for (const ref of step.refs || []) {
  const m = html.match(new RegExp(`<(\\w+)[^>]*\\bdata-ref="${ref.ref.replace('.', '\\.')}"[^>]*>([\\s\\S]*?)</\\1>`));
  if (!m) { add(`game.json ${ref.ref}`, 'ref has no data-ref element in index.html'); continue; }
  const text = norm(m[2]), label = norm(ref.label || '');
  if (!['answer', 'fig', 'figure', 'img', 'table'].includes(ref.kind) && label && !text.startsWith(label.slice(0, 60))) add(`index.html:${lineOf(m.index)} ${ref.ref}`, `refs label differs from page text: label "${label.slice(0, 70)}…" / page "${text.slice(0, 70)}…"`);
}
const refIds = new Set(game.steps.flatMap(s => (s.refs || []).map(r => r.ref)));
for (const m of html.matchAll(/data-ref="([^"]+)"/g)) if (!refIds.has(m[1])) add(`index.html:${lineOf(m.index)}`, `data-ref="${m[1]}" not listed in game.json refs`);

// Challenge question in game.json vs the page question (the model reads game.json).
for (const step of game.steps.filter(s => s.kind === 'challenge')) {
  const q = html.match(new RegExp(`data-ref="${step.id}\\.q"[^>]*>([\\s\\S]*?)</p>`));
  const page = q ? norm(q[1]).replace(/^Kaj bi naredil ti, zdaj, s tem, kar imaš\?\s*/, '') : null;
  if (page && step.question && norm(step.question) !== page) add(`index.html:${lineOf(q.index)} ${step.id}.q`, `game.json question differs from page question: json "${step.question}" / page "${page}"`);
}

// Sources and images.
const sourceIds = new Set((game.sources || []).map(s => s.id));
for (const step of game.steps) for (const id of step.sources_ref || []) if (!sourceIds.has(id)) add(`game.json ${step.id}`, `sources_ref ${id} not in sources`);
const images = [];
for (const m of html.matchAll(/<img\b[^>]*>/g)) {
  const src = attr(m[0], 'src'), alt = attr(m[0], 'alt'), line = lineOf(m.index), file = src && !/^(https?:|data:|\/)/.test(src) ? path.join(dir, src) : null;
  let exists = null; if (file) exists = await access(file).then(() => true, () => false);
  images.push({ line, src, alt: alt ?? null, exists });
  if (alt == null || !alt.trim()) add(`index.html:${line}`, `img ${src} has no alt text`);
  if (exists === false) add(`index.html:${line}`, `img ${src} file is missing`);
  if (!file) add(`index.html:${line}`, `img ${src} is not a relative local file`);
}

// R7 key block (if present) agrees with the plain fields.
for (const c of game.steps.filter(s => s.kind === 'challenge' && s.key)) {
  const texts = (c.key.key_ideas || []).map(x => x.text), hints = game.steps.filter(s => s.kind === 'hint' && s.for === c.id).map(s => s.id);
  if (texts.join('\n') !== (c.key_ideas || []).join('\n')) add(`game.json ${c.id}`, 'key.key_ideas text differs from key_ideas');
  if ((c.key.hints || []).map(h => h.step_id).join() !== hints.join()) add(`game.json ${c.id}`, `key.hints step ids ${JSON.stringify((c.key.hints || []).map(h => h.step_id))} differ from hint steps ${JSON.stringify(hints)}`);
  const ids = new Set((c.key.key_ideas || []).map(x => x.id));
  for (const h of c.key.hints || []) for (const id of h.covers || []) if (!ids.has(id)) add(`game.json ${c.id}`, `hint ${h.step_id} covers unknown ${id}`);
  if ((c.key.alternatives || []).map(a => a.opis).join('\n') !== (c.alternatives_ok || []).join('\n')) add(`game.json ${c.id}`, 'key.alternatives differ from alternatives_ok');
  if ((c.key.anachronisms || []).map(a => a.sredstvo).join('\n') !== (c.anachronisms || []).join('\n')) add(`game.json ${c.id}`, 'key.anachronisms differ from anachronisms');
}

// Challenge texts as the guide reads them (stepTexts), for the hint review.
let challenges = [];
try {
  const g = stepTexts(html, structuredClone(game)), step = id => g.steps.find(s => s.id === id);
  const short = id => id.split('.').at(-1);
  challenges = g.steps.filter(s => s.kind === 'challenge').map(c => {
    const ideaId = new Map((c.key?.key_ideas || []).map(x => [x.text, x.id]));
    return {
      id: c.id, title: c.title, question: c.text, key_ideas: c.key_ideas.map((t, i) => ({ k: ideaId.has(t) ? short(ideaId.get(t)) : `k${i + 1}`, text: t })),
      hints: g.steps.filter(s => s.kind === 'hint' && s.for === c.id).map(h => ({ id: h.id, tier: h.tier, text: h.text,
        author_covers: c.key ? hintCoverage(c, h).map(t => short(ideaId.get(t) || t)) : null })),
      reveal: step(g.steps.find(s => s.kind === 'reveal' && s.for === c.id).id).text.slice(0, 600),
    };
  });
} catch (e) { add('index.html', `stepTexts: ${e.message}`); }

const result = { slug, steps: game.steps.length, sections: sections.length, images, problems, challenges };
if (out) await writeFile(out, JSON.stringify(result, null, 1));
console.log(JSON.stringify({ slug, steps: result.steps, sections: result.sections, images: images.length, problems }, null, 1));
