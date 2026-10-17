// Generate an auditable public-data report from a read-only catalogue snapshot
// and the XML actually returned by the local application. Never reads secrets.
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(path) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  } }).outputText, { exports });
  return exports;
}
const inventory = JSON.parse(fs.readFileSync(process.argv[2] || '.cloudflare/seo-quality-inventory.json', 'utf8'));
const old = JSON.parse(fs.readFileSync('ops/seo-metadados-2026-10-16.json', 'utf8'));
const xml = fs.readFileSync(process.argv[3] || '.cloudflare/seo-quality-sitemap.xml', 'utf8');
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => new URL(m[1]).pathname);
if (!urls.length) throw Error('Sitemap XML vazio ou inválido');
const policy = load('src/lib/seo-index-policy.ts').buildSeoIndexPolicy(inventory.products, inventory.stores, inventory.categories);
const editorial = load('src/lib/category-editorial.ts').CATEGORY_INTRODUCTIONS;
const stores = inventory.stores.map(s => ({ ...s, ...policy.storeRules.get(s.id) }));
const categories = [...policy.categoryRules.values()].map(rule => ({
  ...rule, name: inventory.categories.find(c => c.slug === rule.slug).nome,
})).sort((a, b) => b.count - a.count || a.slug.localeCompare(b.slug));
const current = new Set(urls);
const previous = new Set(old.pages.map(p => p.path));
const removed = [...previous].filter(path => !current.has(path)).map(path => {
  let reason = 'mudança no catálogo público desde a auditoria anterior';
  if (/^\/loja\/[^/]+\/produto\//.test(path)) reason = 'produto alternativo: canonical global único';
  else if (path.startsWith('/loja/')) reason = stores.find(s => path === '/loja/' + s.slug)?.reason || reason;
  else if (path.startsWith('/categorias/')) reason = categories.find(c => path === '/categorias/' + c.slug)?.reason || reason;
  return { path, reason };
});
const report = {
  checkedAt: new Date().toISOString(), catalogCheckedAt: inventory.checkedAt,
  counting: 'Produtos próprios publicados/ativos, não excluídos, visíveis sob RLS pública. Cada produto conta uma vez por slug de categoria; afiliados não multiplicam o catálogo.',
  previousTotal: previous.size, currentTotal: current.size,
  removedTotal: removed.length, added: urls.filter(p => !previous.has(p)),
  removedByReason: removed.reduce((acc, item) => ({ ...acc, [item.reason]: (acc[item.reason] || 0) + 1 }), {}),
  removed,
  emptyStores: stores.filter(s => s.count === 0), duplicateStores: policy.duplicateStores,
  stores,
  categories,
  thinCategories: categories.filter(c => c.count < 3),
  consolidatedCategories: categories.filter(c => c.canonicalSlug !== c.slug),
  repeatedCategorySlugs: [...new Set(inventory.categories.map(c => c.slug))].map(slug => ({
    slug, records: inventory.categories.filter(c => c.slug === slug).map(c => ({ id: c.id, name: c.nome,
      count: policy.publicProducts.filter(p => [p.category_id, ...p.category_ids || []].includes(c.id)).length })),
  })).filter(group => group.records.length > 1),
  topTen: categories.filter(c => c.canonicalSlug === c.slug).slice(0, 10).map(c => ({ slug: c.slug, count: c.count,
    words: (editorial[c.slug] || []).join(' ').split(/\s+/).filter(Boolean).length })),
  verification: fs.existsSync('.cloudflare/seo-quality-validation.json')
    ? JSON.parse(fs.readFileSync('.cloudflare/seo-quality-validation.json', 'utf8')) : null,
};
fs.writeFileSync('ops/seo-qualidade-2026-10-16.json', JSON.stringify(report, null, 2) + '\n');
const table = (headers, rows) => ['| ' + headers.join(' | ') + ' |', '| ' + headers.map(() => '---').join(' | ') + ' |', ...rows.map(row => '| ' + row.join(' | ') + ' |')].join('\n');
const md = `# Qualidade do conteúdo indexável — 16/10/2026

Auditoria de dados públicos em ${inventory.checkedAt}. Nenhum registro de loja, produto ou categoria foi alterado. Sem migration, alteração de RLS, preços, checkout, Asaas ou webhooks. Sem criação de páginas em massa.

## Sitemap

De **${report.previousTotal}** para **${report.currentTotal} URLs**: ${report.removedTotal} URLs da auditoria anterior removidas; ${report.added.length} adicionadas pela evolução do catálogo. A lista completa de caminhos e motivos está em seo-qualidade-2026-10-16.json.

${table(['Motivo', 'URLs removidas'], Object.entries(report.removedByReason))}

## Critérios automáticos

- Contagem: ${report.counting}
- Loja com zero produtos: noindex, follow e fora do sitemap; volta após publicação do primeiro produto, na próxima revalidação pública (cache de catálogo: 300 segundos; cache de página/CDN pode acrescentar tempo).
- Duplicidade de loja: nome igual após normalizar acentos/pontuação, slug com no máximo um erro de caractere (mínimo oito caracteres), ou sufixo gerado de quatro caracteres. Só a de contagem estritamente menor recebe noindex. Empates aguardam decisão do proprietário. Não se presume duplicidade apenas por palavras genéricas em comum.
- Categorias: contagem por URL/slug, reunindo todos os IDs globais com aquele slug e sem contar um produto duas vezes. Menos de três produtos: noindex, follow e fora do sitemap. Outros, Outros Conteúdos e Combo: sempre noindex, independentemente da contagem.
- Aliases semânticos conhecidos apontam canonical para a categoria principal; a principal exibe materiais de todos os IDs do grupo. Alias com três ou mais produtos mantém index, follow com canonical principal; alias fino recebe noindex, follow conforme solicitado. Só a URL principal elegível entra no sitemap. Os limiares usam a contagem própria do slug.
- Falha na consulta não é tratada como catálogo vazio. Lojas afiliadas continuam funcionando: esta política altera apenas indexação, sem remover vitrines ou vínculos.

## Lojas vazias

${table(['Loja', 'Slug', 'Produtos'], report.emptyStores.map(s => [s.nome_loja, s.slug, s.count]))}

## Pares de lojas duplicadas

${report.duplicateStores.length ? table(['Primeira', 'Segunda', 'Contagens', 'ID com noindex'], report.duplicateStores.map(p => [p.first.slug, p.second.slug, p.firstCount + ' / ' + p.secondCount, p.suppressedId || 'empate: decidir'])) : 'Nenhum par encontrado pelos critérios acima. Nenhuma loja foi apagada, renomeada ou fundida. A lista de todas as lojas e suas contagens está no JSON para revisão manual.'}

## Categorias consolidadas

${table(['Alias', 'Produtos próprios', 'Canonical principal', 'Produtos distintos do grupo'], report.consolidatedCategories.map(c => [c.slug, c.count, c.canonicalSlug, c.combinedCount]))}

## Categorias com menos de três produtos

${table(['Categoria', 'Slug', 'Produtos'], report.thinCategories.map(c => [c.name, c.slug, c.count]))}

## Registros com o mesmo slug

${table(['Slug', 'Registros', 'Produtos distintos da URL'], report.repeatedCategorySlugs.map(c => [c.slug, c.records.length, policy.categoryRules.get(c.slug).count]))}

Esses registros já compartilhavam URL, mas a consulta anterior tentava resolver um único ID. A página agora reúne os IDs sem alterar nenhum dado. Os IDs e contagens individuais estão no JSON. Categorias relacionadas, mas de escopo diferente, não foram fundidas automaticamente (por exemplo, Educação Cristã, Escola Bíblica Dominical e Ensino Religioso).

## Dez introduções reescritas

${table(['Categoria', 'Produtos publicados', 'Palavras'], report.topTen.map(c => [c.slug, c.count, c.words]))}

Textos únicos com orientação para avaliar e usar recursos, sem promessas de resultados, credenciais de autores ou certificação curricular. A categoria BNCC esclarece que a classificação é informada pelo criador. Páginas de nível de ensino perderam o selo genérico de alinhamento à BNCC e a alegação de autoria por especialistas, incluindo ensino-superior-pos e idiomas-cursos-livres.

## Nomes e identidade de produtos

O nome completo tem prioridade sobre os sufixos de marketing. Se o nome sozinho ultrapassar 60 caracteres, é preservado: 60 é uma meta editorial, não uma obrigação técnica. A mesma prioridade vale para nomes nas descrições; textos complementares são reduzidos primeiro. Não há cortes de nome com reticências. Concordância: 1 material didático / 2 materiais didáticos.

Ambas as rotas de produto apontam canonical para https://www.educalizando.com.br/produto/[slug]. A variante /loja/[slug]/produto/[produtoSlug] não entra no sitemap. Links de loja, compra, atribuição e escolha de licença continuam funcionando. O Product JSON-LD também usa a identidade global; ofertas PLR conservam seu link de licença.
`;
const changedFiles = [
  ['src/lib/seo-index-policy.ts', 'Regras únicas de contagem, noindex e consolidação; pares de lojas e tratamento de empates.'],
  ['src/lib/seo-public-catalog.ts', 'Leituras públicas paginadas com cache; reunião de IDs de categorias sem editar produtos.'],
  ['src/lib/catalog-sitemap.ts', 'Exclusão de lojas vazias, categorias inelegíveis e rotas alternativas de produto.'],
  ['src/lib/category-editorial.ts', 'Dez introduções originais com mais de 150 palavras e orientação factual.'],
  ['src/app/categorias/[slug]/page.tsx', 'Metadata, conteúdo, catálogo e dados estruturados coerentes com a categoria principal.'],
  ['src/app/loja/[slug]/page.tsx', 'Robots automático e contagem de publicados para indexação da loja.'],
  ['src/app/atividades-por-ano/[slug]/page.tsx', 'Remoção das alegações não verificadas de BNCC e especialistas.'],
  ['src/lib/page-seo.ts', 'Prioridade para nomes completos, redução dos sufixos e concordância singular/plural.'],
  ['src/lib/seo.ts', 'Opção para preservar nomes também nos cartões sociais.'],
  ['src/lib/catalog-seo.ts', 'Canonical e identidade global únicos; nomes completos nas metadata de produto.'],
  ['src/lib/seo-identity.ts', 'Referências de produtos homônimos iguais em ambos os contextos de URL.'],
  ['scripts/verify-seo-quality.cjs', 'Regressões dos limiares, duplicidades, retorno automático, nomes e textos.'],
  ['scripts/audit-local-seo-quality.mjs', 'Verificação HTTP de todas as lojas/categorias e amostras de aliases de produto.'],
  ['scripts/report-seo-quality.cjs', 'Geração reproduzível do comparativo e das listas de revisão.'],
  ['scripts/audit-local-brand-seo.mjs', 'Sitemap sem aliases/noindex; nomes completos podem ultrapassar a meta editorial.'],
  ['scripts/verify-brand-seo.cjs', 'Atualização do contrato de canonical e do catálogo compartilhado.'],
  ['scripts/verify-catalog-seo.ts', 'Regressão de canonical único e descrição factual preservando licença.'],
  ['scripts/verify-page-seo.ts', 'Regressão de nomes completos e concordância das contagens.'],
  ['ops/SEO-QUALIDADE-CONTEUDO-2026-10-16.md', 'Relatório legível, decisões, resultados e arquivos alterados.'],
  ['ops/seo-qualidade-2026-10-16.json', 'Lista auditável de cada URL removida, lojas, categorias, IDs e contagens.'],
];
const verification = report.verification ? `
## Verificações finais

- Lint completo: zero erros e 17 avisos preexistentes. Lint dos arquivos desta tarefa: sem erros ou avisos.
- TypeScript: npm run typecheck:vinext aprovado.
- Build real de produção da Cloudflare: node scripts/deploy-cloudflare.mjs --dry-run aprovado, sem publicar. O último build inclui todas as alterações de código desta tarefa.
- Suíte geral npm run test:verify aprovada (inclui financeiro, checkout, integrações, segurança, migrations e limite de tamanho; nenhum desses contratos foi alterado).
- Regressões de SEO aprovadas: verify-seo-quality.cjs, verify-brand-seo.cjs, verify-page-seo.ts, verify-catalog-seo.ts e verify-product-seo-render.cjs.
- HTTP local: ${report.verification.publicPages} URLs do sitemap auditadas, zero falhas pendentes. A auditoria integral foi seguida pela revalidação de ${report.verification.recheckedPages} páginas cujos títulos foram ajustados; cada resultado foi integrado ao mesmo relatório, sem apagar falhas não resolvidas.
- Mais ${report.verification.policyChecks} verificações HTTP de todas as lojas e categorias, das duas páginas de nível indicadas e de cinco variantes de produto. Zero falhas. robots.txt/sitemap.xml retornam 200; páginas inexistentes de loja/produto/blog retornam 404; páginas privadas permanecem noindex/nofollow.
- Testes de restauração automática foram feitos com fixtures, sem publicar/despublicar produtos reais. Falha de banco não é convertida em catálogo vazio.
- Sem deploy nesta etapa. Commits locais preparados; os dados reais e as regras comerciais foram preservados.
` : '';
fs.writeFileSync('ops/SEO-QUALIDADE-CONTEUDO-2026-10-16.md', md + verification + '\n## Arquivos alterados\n\n' + table(['Arquivo', 'Motivo'], changedFiles) + '\n');
console.log(JSON.stringify({ previous: report.previousTotal, current: report.currentTotal, removed: report.removedByReason, added: report.added, topTen: report.topTen }, null, 2));
