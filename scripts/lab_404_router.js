/* Lab-only 404 router. GitHub Pages is case-sensitive, serves no Netlify _redirects and the
   lab snapshot excludes a few production pages. When a path is missing, this resolves it to
   (1) a production redirect rule replayed inside the lab, (2) the same file with different
   letter case or without ".html", or (3) the page on the production site, shown as a link.
   Pure function; build_pages.py embeds it into 404.html and tests load it in Node. */
function labRoute(pathname, data) {
  const base = data.base;
  let rel = pathname.startsWith(base) ? pathname.slice(base.length) : pathname.replace(/^\/+/, '');
  try { rel = decodeURIComponent(rel); } catch (_) { return { kind: 'missing', path: rel }; }
  const files = new Map(data.files.map(f => [f.toLowerCase(), f]));
  const find = p => {
    p = p.replace(/^\/+/, '');
    const tries = p === '' || p.endsWith('/') ? [p + 'index.html'] : [p, p + '.html', p + '/index.html'];
    for (const t of tries) { const hit = files.get(t.toLowerCase()); if (hit) return hit; }
    return null;
  };
  const local = hit => ({ kind: 'local', href: base + (hit.endsWith('/index.html') || hit === 'index.html' ? hit.slice(0, -'index.html'.length) : hit) });
  const key = ('/' + rel).toLowerCase().replace(/\/+$/, '') || '/';
  for (const rule of data.rules) {
    const from = rule.from.toLowerCase().replace(/\/+$/, '') || '/';
    let to = null;
    if (from.endsWith('/*') && key.startsWith(from.slice(0, -1))) to = rule.to.replace(':splat', ('/' + rel).slice(from.length - 1));
    else if (from === key) to = rule.to;
    if (to === null) continue;
    const hit = find(to);
    if (hit) return { kind: 'local', ...local(hit), rule: rule.from };
    const excluded = data.excluded.find(e => e.toLowerCase() === to.replace(/^\/+/, '').toLowerCase() || e.toLowerCase() === to.replace(/^\/+/, '').toLowerCase() + 'index.html');
    if (excluded) return { kind: 'production', href: data.production + '/' + excluded.replace(/index\.html$/, ''), rule: rule.from };
  }
  const hit = find(rel);
  if (hit && hit !== rel) return local(hit);
  const lowered = rel.toLowerCase();
  const tries = lowered === '' || lowered.endsWith('/') ? [lowered + 'index.html'] : [lowered, lowered + '.html', lowered + '/index.html'];
  const excluded = data.excluded.find(e => tries.includes(e.toLowerCase()));
  if (excluded) return { kind: 'production', href: data.production + '/' + excluded.replace(/index\.html$/, '') };
  return { kind: 'missing', path: rel };
}
if (typeof module !== 'undefined') module.exports = { labRoute };
