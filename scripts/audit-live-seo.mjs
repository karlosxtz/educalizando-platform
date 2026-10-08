import { writeFileSync } from 'node:fs';

const origin = 'https://www.educalizando.com.br';
const paths = ['/', '/buscar', ...['alfabetizacao','matematica','artes','historia','ensino-religioso','bercario'].map(c => `/buscar?categoria=${c}`), '/atividades-ensino-fundamental', '/atividades-para-imprimir', ...['ensino-fundamental-1','ensino-fundamental-2','ensino-medio','pre-vestibular-enem'].map(c => `/atividades-por-ano/${c}`), '/cadastro/produtor','/afiliados/cadastro','/ajuda'];
const sitemap = await fetch(`${origin}/sitemap-catalogo.xml`).then(r => { if (!r.ok) throw new Error(`Sitemap: ${r.status}`); return r.text(); });
const urls = [...paths.map(path => origin + path), ...[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]).filter(url => url.startsWith(`${origin}/produto/`) || url.startsWith(`${origin}/loja/`))];
const results = [];
let cursor = 0;
async function worker() {
  while (cursor < urls.length) {
    const url = urls[cursor++];
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(45000) });
      const html = await response.text();
      const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '';
      const description = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/i)?.[1] || '';
      const canonical = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]*)"/i)?.[1] || '';
      results.push({ url, status: response.status, title, description, canonical });
    } catch (error) { results.push({ url, error: error.message }); }
    if (results.length % 25 === 0) console.log(`${results.length}/${urls.length} páginas verificadas`);
  }
}
await Promise.all(Array.from({ length: 4 }, worker));
function duplicates(field) {
  const map = new Map();
  for (const item of results) if (item[field]) map.set(item[field], [...(map.get(item[field]) || []), item.url]);
  return [...map].filter(([, values]) => values.length > 1).map(([value, pages]) => ({ value, pages }));
}
const report = { checked: results.length, failures: results.filter(item => item.error || item.status !== 200 || !item.title || !item.description || !item.canonical), duplicateTitles: duplicates('title'), duplicateDescriptions: duplicates('description'), results };
writeFileSync('seo-audit-report.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify({ checked: report.checked, failures: report.failures.length, duplicateTitles: report.duplicateTitles, duplicateDescriptions: report.duplicateDescriptions }, null, 2));
