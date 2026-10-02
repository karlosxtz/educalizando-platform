import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const defaultLimit = 600;
const legacyLimits: Record<string, number> = {
  'src/app/loja/[slug]/produto/[produtoSlug]/ProductDetailClientView.tsx': 911,
  'src/app/loja/[slug]/checkout/CheckoutClientView.tsx': 902,
  'src/app/loja/[slug]/themes/ThemeDefault.tsx': 886,
  'src/app/loja/[slug]/themes/ThemeMinimalist.tsx': 701,
  'src/app/loja/[slug]/themes/ThemeNetflix.tsx': 701,
  'src/app/loja/[slug]/themes/ThemePinterest.tsx': 701,
  'src/app/loja/[slug]/themes/ThemeLinkTree.tsx': 701,
  'src/app/dashboard/conteudo/[produtoId]/page.tsx': 616,
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
