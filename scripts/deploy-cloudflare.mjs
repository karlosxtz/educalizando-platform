import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { InputConfigSchema, convertToWranglerConfig } from '@cloudflare/config';
import { loadEnv } from 'vite';

const require = createRequire(import.meta.url);
const root = process.cwd();
// Never publish the development origin as a public store/image address.
process.env.NEXT_PUBLIC_SITE_URL = 'https://www.educalizando.com.br';
process.env.NEXT_PUBLIC_APP_URL = 'https://www.educalizando.com.br';
const workerDir = path.join(root, '.cloudflare/output/v0/workers/default');
const args = process.argv.slice(2);
const publicEnv = { ...loadEnv('production', root, 'NEXT_PUBLIC_'), ...process.env };
const publicSupabaseUrl = publicEnv.NEXT_PUBLIC_SUPABASE_URL;
const publicSupabaseKey = publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!publicSupabaseUrl?.startsWith('https://') || publicSupabaseUrl.includes('xyzcompany') ||
    !publicSupabaseKey || publicSupabaseKey.includes('dummykey')) {
  throw new Error('Deploy bloqueado: configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY antes de gerar o pacote.');
}
if (!publicSupabaseKey.startsWith('sb_publishable_')) {
  let role;
  try { role = JSON.parse(Buffer.from(publicSupabaseKey.split('.')[1], 'base64url').toString()).role; } catch { /* Invalid public key is rejected below. */ }
  if (role !== 'anon') throw new Error('Deploy bloqueado: a chave pública do Supabase precisa ser anon ou publishable.');
}
if (args.some(arg => !['--skip-build', '--dry-run'].includes(arg))) {
  throw new Error('Supported options: --skip-build, --dry-run');
}
if (!args.includes('--skip-build')) {
  const viteCli = path.join(path.dirname(require.resolve('vite/package.json')), 'bin/vite.js');
  const build = spawnSync(process.execPath, [viteCli, 'build'], { stdio: 'inherit' });
  if (build.status !== 0) process.exit(build.status ?? 1);
}
const { manifest, ...worker } = JSON.parse(fs.readFileSync(path.join(workerDir, 'worker.config.json'), 'utf8'));
if (worker.name !== 'educalizando-app' || !manifest?.mainModule) {
  throw new Error('Unexpected Worker name or missing build entrypoint');
}
const config = convertToWranglerConfig(InputConfigSchema.parse({ worker }));
const clientAssetsDir = path.join(workerDir, 'assets/_next/static/chunks');
const supabaseClientAssets = fs.readdirSync(clientAssetsDir)
  .filter(name => /^supabase-.*\.js$/.test(name))
  .map(name => fs.readFileSync(path.join(clientAssetsDir, name), 'utf8'));
if (!supabaseClientAssets.some(asset => asset.includes(publicSupabaseUrl) && asset.includes(publicSupabaseKey))) {
  throw new Error('Deploy bloqueado: o pacote do navegador não contém a configuração pública do Supabase. Gere novamente o build.');
}
// vinext's Worker loader requests index.js while the Vite RSC build emits index.mjs.
// Keep a forwarding module at the loader's exact path rather than modifying bundles.
for (const entryDir of [path.join(workerDir, 'bundle'), path.join(workerDir, 'bundle/ssr')]) {
  if (fs.existsSync(path.join(entryDir, 'index.mjs'))) {
    fs.writeFileSync(path.join(entryDir, 'index.js'),
      'export * from "./index.mjs";\nexport { default } from "./index.mjs";\n');
  }
}
Object.assign(config, {
  main: `bundle/${manifest.mainModule}`,
  no_bundle: true,
  find_additional_modules: true,
  keep_vars: true,
  rules: [
    { type: 'ESModule', globs: ['**/*.mjs', '**/*.js'], fallthrough: true },
    { type: 'CompiledWasm', globs: ['**/*.wasm'], fallthrough: true },
  ],
  // Static assets bypass Worker execution and its request/CPU billing.
  assets: { ...config.assets, directory: 'assets', run_worker_first: false },
});
const configPath = path.join(workerDir, 'wrangler.deploy.json');
fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
const pkgPath = require.resolve('wrangler/package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const cli = path.resolve(path.dirname(pkgPath), pkg.bin.wrangler);
const result = spawnSync(process.execPath, [cli, 'deploy', '--config', configPath,
  ...(args.includes('--dry-run') ? ['--dry-run'] : [])], { stdio: 'inherit' });
process.exit(result.status ?? 1);
