import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const defaultLimit = 600;
const legacyLimits: Record<string, number> = {
  'src/app/dashboard/produtos/novo/page.tsx': 1392,
  'src/lib/store-service.ts': 1207,
  'src/app/dashboard/financeiro/page.tsx': 1068,
  'src/app/loja/[slug]/produto/[produtoSlug]/ProductDetailClientView.tsx': 911,
  'src/app/loja/[slug]/checkout/CheckoutClientView.tsx': 902,
  'src/app/loja/[slug]/themes/ThemeDefault.tsx': 886,
  'src/lib/order-service.ts': 849,
  'src/app/dashboard/cupons/page.tsx': 842,
  'src/app/api/produtos/route.ts': 802,
  'src/app/dashboard/produtos/page.tsx': 740,
  'src/lib/student-service.ts': 726,
  'src/components/dashboard/ProductWizardModal.tsx': 717,
  'src/app/loja/[slug]/themes/ThemeMinimalist.tsx': 701,
  'src/app/loja/[slug]/themes/ThemeNetflix.tsx': 701,
  'src/app/loja/[slug]/themes/ThemePinterest.tsx': 701,
  'src/app/loja/[slug]/themes/ThemeLinkTree.tsx': 701,
  'src/app/dashboard/loja/page.tsx': 681,
  'src/app/dashboard/conteudo/[produtoId]/page.tsx': 616,
  'src/app/dashboard/afiliacoes/vitrine/page.tsx': 613,
  'src/app/dashboard/pedidos/page.tsx': 610,
  'src/lib/content-delivery-service.ts': 609,
  'src/app/aluno/(protected)/loja/[storeId]/StudentStorePurchasesClientView.tsx': 608,
};

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap(name => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? sourceFiles(path) : /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

for (const absolutePath of sourceFiles(join(process.cwd(), 'src'))) {
  const path = relative(process.cwd(), absolutePath).replaceAll('\\', '/');
  const content = readFileSync(absolutePath, 'utf8');
  const lines = content ? content.replace(/\r?\n$/, '').split(/\r?\n/).length : 0;
  const limit = legacyLimits[path] || defaultLimit;
  assert.ok(lines <= limit, `${path} cresceu para ${lines} linhas (limite atual: ${limit}). Extraia responsabilidades antes de ampliar o arquivo.`);
}

console.log('Limites de tamanho verificados; arquivos grandes existentes não podem crescer e novos arquivos ficam limitados a 600 linhas.');
