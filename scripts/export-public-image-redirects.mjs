import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { loadEnv } from 'vite';
import { createClient } from '@supabase/supabase-js';

// Read-only export for dashboard Bulk Redirects. No account token, service role,
// object upload, SQL write, or automatic Cloudflare rule activation.
const settings = loadEnv('production', process.cwd(), 'NEXT_PUBLIC_');
const url = settings.NEXT_PUBLIC_SUPABASE_URL;
const key = settings.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) throw new Error('Configuração pública do catálogo indisponível.');
const db = createClient(url, key, { auth: { persistSession: false } });
const helper = '.cloudflare/export-image-helper.mjs';
await build({ entryPoints: ['src/lib/public-image-url.ts'], bundle: true, platform: 'node', format: 'esm', outfile: helper });
const { directPublicImageUrl } = await import(pathToFileURL(path.resolve(helper)).href);
const redirects = new Map();
for (let offset = 0; offset < 50000; offset += 1000) {
  const { data, error } = await db.from('products').select('id,slug,capa_url')
    .in('status', ['publicado', 'ativo', 'published']).is('excluido_em', null).order('id').range(offset, offset + 999);
  if (error) throw new Error('Não foi possível consultar o catálogo público.');
  for (const product of data || []) {
    const target = product.capa_url && (directPublicImageUrl(product.capa_url) || product.capa_url);
    if (!target?.startsWith('https://arquivos.educalizando.com.br/public-images/uploads/')) continue;
    for (const identity of new Set([product.slug, product.id].filter(Boolean))) {
      redirects.set('https://www.educalizando.com.br/imagens/produtos/' + encodeURIComponent(identity) + '/capa', target);
    }
  }
  if ((data || []).length < 1000) break;
  if (offset === 49000) throw new Error('Exportação excedeu o limite; nenhum arquivo parcial foi gravado.');
}
const quote = value => '"' + value.replaceAll('"', '""') + '"';
// Cloudflare CSV has no header. Unspecified options keep their safe defaults.
fs.writeFileSync('.cloudflare/public-image-redirects.csv', [...redirects].map(([source, target]) => `${quote(source)},${quote(target)},301,false,false,false,false`).join('\n') + '\n');
console.log('Redirecionamentos públicos exportados:', redirects.size, '→ .cloudflare/public-image-redirects.csv');
