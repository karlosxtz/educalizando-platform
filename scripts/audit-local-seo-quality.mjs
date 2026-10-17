import assert from 'node:assert/strict';
import fs from 'node:fs';

const base = process.env.SEO_LOCAL_URL || 'http://127.0.0.1:3004';
const report = JSON.parse(fs.readFileSync('ops/seo-qualidade-2026-10-16.json', 'utf8'));
const snapshot = JSON.parse(fs.readFileSync('.cloudflare/seo-quality-inventory.json', 'utf8'));
const results = { checkedAt: new Date().toISOString(), base, checks: [], errors: [] };
const decode = text => text.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'");
async function read(path) {
  const response = await fetch(base + path, { headers: { 'User-Agent': 'Googlebot' }, signal: AbortSignal.timeout(90000) });
  const html = await response.text();
  assert.equal(response.status, 200, path + ' HTTP');
  const tags = html.match(/<(?:meta|link)\b[^>]*>/g) || [];
  const attr = (selector, name = 'content') => decode(tags.find(t => selector.test(t))?.match(new RegExp('\\b' + name + '="([^"]*)"'))?.[1] || '');
  return { html, robots: attr(/\bname="robots"/), canonical: attr(/\brel="canonical"/, 'href') };
}
const tasks = [
  ...report.stores.map(s => ({ path: '/loja/' + s.slug, indexable: s.indexable })),
  ...report.categories.map(c => ({ path: '/categorias/' + c.slug, indexable: c.indexable, canonical: '/categorias/' + c.canonicalSlug })),
  ...['ensino-superior-pos', 'idiomas-cursos-livres'].map(slug => ({ path: '/atividades-por-ano/' + slug, noUnverifiedClaims: true })),
];
for (const product of snapshot.products.slice(0, 5)) {
  const owner = snapshot.stores.find(s => s.id === product.store_id);
  if (!owner) continue;
  tasks.push({ path: '/loja/' + owner.slug + '/produto/' + encodeURIComponent(product.slug || product.id), canonical: '/produto/' + encodeURIComponent(product.slug || product.id) });
}
const sitemap = await read('/sitemap.xml');
const paths = new Set([...sitemap.html.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => new URL(m[1]).pathname));
assert.equal(paths.size, report.currentTotal);
assert(![...paths].some(path => /^\/loja\/[^/]+\/produto\//.test(path)));
async function worker() {
  while (tasks.length) {
    const task = tasks.shift();
    try {
      const page = await read(task.path);
      assert.equal(page.canonical, 'https://www.educalizando.com.br' + (task.canonical || task.path), task.path + ' canonical');
      if (task.indexable !== undefined) {
        assert.equal(/noindex/.test(page.robots), !task.indexable, task.path + ' robots: ' + page.robots);
        assert(!/nofollow/.test(page.robots), task.path + ' must follow links');
        if (!task.indexable) assert(!paths.has(task.path), task.path + ' must not enter sitemap');
      }
      if (task.noUnverifiedClaims) {
        assert(!/Alinhad[oa]s? à BNCC|desenvolvidos por especialistas/.test(page.html), task.path + ' unverified claim');
      }
      if (task.path === '/categorias/educacao-infantil') {
        const count = report.categories.find(c => c.slug === 'educacao-infantil').combinedCount;
        assert(page.html.includes(count + ' materiais didáticos publicados'), 'Combined duplicate-ID category count');
        assert(!page.html.includes('Nenhum material encontrado'), 'Duplicate category IDs must show products');
      }
      results.checks.push(task.path);
      console.log('OK', task.path);
    } catch (error) { results.errors.push({ path: task.path, error: error.message }); console.error('FAIL', task.path, error.message); }
  }
}
await Promise.all(Array.from({ length: 4 }, worker));
fs.writeFileSync('.cloudflare/seo-quality-http-policies.json', JSON.stringify(results, null, 2));
assert.equal(results.errors.length, 0, 'Quality policies must match rendered HTTP responses');
