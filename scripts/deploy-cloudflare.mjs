import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { InputConfigSchema, convertToWranglerConfig } from '@cloudflare/config';

const require = createRequire(import.meta.url);
const root = process.cwd();
const workerDir = path.join(root, '.cloudflare/output/v0/workers/default');
const args = process.argv.slice(2);
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
// vinext's Worker loader requests index.js while the Vite RSC build emits index.mjs.
// Keep a forwarding module at the loader's exact path rather than modifying bundles.
const ssrDir = path.join(workerDir, 'bundle/ssr');
if (!fs.existsSync(path.join(ssrDir, 'index.js')) && fs.existsSync(path.join(ssrDir, 'index.mjs'))) {
  fs.writeFileSync(path.join(ssrDir, 'index.js'), 'export * from "./index.mjs";\n');
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
  assets: { ...config.assets, directory: 'assets' },
});
const configPath = path.join(workerDir, 'wrangler.deploy.json');
fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
const pkgPath = require.resolve('wrangler/package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const cli = path.resolve(path.dirname(pkgPath), pkg.bin.wrangler);
const result = spawnSync(process.execPath, [cli, 'deploy', '--config', configPath,
  ...(args.includes('--dry-run') ? ['--dry-run'] : [])], { stdio: 'inherit' });
process.exit(result.status ?? 1);
