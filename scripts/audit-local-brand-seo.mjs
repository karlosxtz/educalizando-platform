import fs from 'node:fs';
import assert from 'node:assert/strict';

const base = process.env.SEO_LOCAL_URL || 'http://127.0.0.1:3004';
const canonical = 'https://www.educalizando.com.br';
const report = { base, checkedAt: new Date().toISOString(), pages: [], errors: [] };
const previous = process.env.SEO_AUDIT_RECHECK ? JSON.parse(fs.readFileSync('.cloudflare/seo-local-report.json', 'utf8')) : null;
const entity = value => (value || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'");
async function read(path) {
  const response = await fetch(base + path, { headers: { 'User-Agent': 'Googlebot' }, signal: AbortSignal.timeout(90000), redirect: 'manual' });
  return { status: response.status, type: response.headers.get('content-type'), robots: response.headers.get('x-robots-tag'), body: await response.text() };
}
function attribute(html, selector, key = 'content') {
  const tags = html.match(/<(?:meta|link)\b[^>]*>/g) || [];
  const tag = tags.find(tag => selector.test(tag));
  return entity(tag?.match(new RegExp('\\b' + key + '="([^"]*)"'))?.[1]);
}
try {
  const robots = await read('/robots.txt');
  assert.equal(robots.status, 200);
  assert.match(robots.body, /Sitemap: https:\/\/www.educalizando.com.br\/sitemap.xml/);
  for (const path of ['/dashboard', '/admin', '/aluno', '/api/', '/checkout', '/loja/*/checkout']) assert(robots.body.includes('Disallow: ' + path));
  const sitemap = await read('/sitemap.xml');
  assert.equal(sitemap.status, 200, sitemap.body.slice(0, 350));
  assert.match(sitemap.type, /xml/);
  const urls = [...sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => entity(match[1]));
  assert(urls.length > 15);
  assert.equal(new Set(urls).size, urls.length);
  assert(urls.every(url => new URL(url).origin === canonical));
  assert(!urls.some(url => /\/(?:dashboard|admin|aluno|api|checkout)(?:\/|$)/.test(new URL(url).pathname)));
  report.sitemapUrls = urls.length;
  assert(!urls.some(url => /\/loja\/[^/]+\/produto\//.test(url)), 'Store-context products must not enter sitemap');
  const dynamic = ['^/loja/[^/]+$', '^/produto/', '^/loja/[^/]+/produto/', '^/blog/'].map(pattern => urls.find(url => new RegExp(pattern).test(new URL(url).pathname))).filter(Boolean);
  let paths = [...new Set([
    '/', '/sobre', '/lojas', '/blog', '/materiais-didaticos', '/recursos-pedagogicos',
    '/atividades-alfabetizacao', '/educacao-infantil', '/jogos-pedagogicos', '/planos-de-aula-bncc',
    '/calendario', '/glossario', '/materiais-gratis', '/ofertas', '/atividades-por-ano', '/ajuda', '/termos', '/privacidade',
    ...dynamic.map(url => new URL(url).pathname),
  ])];
  if (process.env.SEO_AUDIT_ALL === '1') {
    for (const url of urls) if (!paths.includes(new URL(url).pathname)) paths.push(new URL(url).pathname);
  }
  if (previous) {
    assert.equal(previous.base, base, 'Recheck must use the same local server');
    assert.equal(previous.sitemapUrls, urls.length, 'Catalogue changed: run a full audit');
    assert(previous.errors.every(item => item.path || item.error.startsWith('All public metadata checks')), 'Non-page failure requires a full audit');
    paths = [...new Set(previous.errors.map(item => item.path).filter(Boolean))];
    report.pages = previous.pages.filter(page => !paths.includes(page.path));
    report.initialAuditAt = previous.initialAuditAt || previous.checkedAt;
    report.recheckedPaths = paths;
  }
  const pending = [...paths];
  async function checkNext() { while (pending.length) { const path = pending.shift(); await checkPage(path); } }
  async function checkPage(path) {
    try {
      const response = await read(path);
      assert.equal(response.status, 200, path + ' HTTP');
      const title = entity(response.body.match(/<title>([^<]*)<\/title>/)?.[1]);
      const description = attribute(response.body, /\bname="description"/);
      const url = attribute(response.body, /\brel="canonical"/, 'href');
      const page = { path, title, description, canonical: url };
      report.pages.push(page);
      const namedPage = /^\/(?:produto\/|loja\/[^/]+$)/.test(path);
      assert(title && (title.length <= 60 || namedPage), path + ' title length ' + title.length);
      if (namedPage) assert(!title.includes('…'), path + ' registered name was cut');
      assert(description && (description.length <= 155 || namedPage), path + ' description length ' + description.length);
      assert.equal(new URL(url).href, new URL(path, canonical).href, path + ' canonical');
      assert(attribute(response.body, /\bproperty="og:image"/), path + ' OG image');
      assert(!/noindex/.test(attribute(response.body, /\bname="robots"/)), path + ' noindex URL in sitemap');
      assert.equal(attribute(response.body, /\bname="twitter:card"/), 'summary_large_image', path + ' Twitter');
      if (path === '/') {
        assert.match(title, /^Educalizando/);
        assert.equal((response.body.match(/<h1(?:\s|>)/g) || []).length, 1);
        const scripts = [...response.body.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));
        for (const type of ['Organization', 'WebSite', 'FAQPage']) assert(scripts.some(item => item['@type'] === type), type);
      }
      console.log('OK', path);
    } catch (error) { report.errors.push({ path, error: error.message }); console.error('FAIL', path, error.message); }
  }
  await Promise.all(Array.from({ length: process.env.SEO_AUDIT_ALL === '1' ? 6 : 1 }, checkNext));
  for (const path of ['/produto/seo-inexistente-20261016', '/loja/seo-inexistente-20261016', '/blog/seo-inexistente-20261016']) {
    const response = await read(path);
    assert.equal(response.status, 404, path + ': must not return a soft 404');
    console.log('OK 404', path);
  }
  for (const path of ['/login', '/entrar', '/aluno/login']) {
    const response = await read(path);
    const robots = attribute(response.body, /\bname="robots"/);
    assert(/noindex/.test(robots) && /nofollow/.test(robots), path + ' private metadata: ' + robots);
  }
  for (const key of ['title', 'description']) {
    const seen = new Map();
    for (const page of report.pages) {
      if (seen.has(page[key])) report.errors.push({ path: page.path, error: 'Duplicate ' + key + ': ' + seen.get(page[key]) });
      seen.set(page[key], page.path);
    }
  }
  assert.equal(report.errors.length, 0, 'All public metadata checks must pass');
} catch (error) { report.errors.push({ error: error.message }); console.error(error.message); process.exitCode = 1; }
finally { fs.writeFileSync('.cloudflare/seo-local-report.json', JSON.stringify(report, null, 2)); }
