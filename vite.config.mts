import { defineConfig, loadEnv } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";
import { fileURLToPath } from "node:url";
import { kvDataAdapter } from '@vinext/cloudflare/cache/kv-data-adapter';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

// KV survives deployments. Isolate cached page HTML and client references by
// source/configuration so a new release cannot reuse an old login or bundle.
const cacheHash = createHash('sha256');
function hashSources(directory: string) {
  for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) hashSources(filename);
    else { cacheHash.update(filename); cacheHash.update(readFileSync(filename)); }
  }
}
hashSources('src');
hashSources('cloudflare');
for (const filename of ['next.config.ts', 'vite.config.mts', 'package-lock.json']) cacheHash.update(readFileSync(filename));
const publicBuildEnv = { ...loadEnv('production', process.cwd(), 'NEXT_PUBLIC_'), ...process.env };
for (const key of Object.keys(publicBuildEnv).filter(key => key.startsWith('NEXT_PUBLIC_')).sort()) {
  cacheHash.update(key); cacheHash.update(publicBuildEnv[key] || '');
}
const cacheNamespace = `educalizando-${cacheHash.digest('hex').slice(0, 16)}`;

export default defineConfig({
  define: { EDUCALIZANDO_BUILD_ID: JSON.stringify(cacheNamespace) },
  plugins: [
    vinext({ cache: { data: kvDataAdapter({ appPrefix: cacheNamespace }) } }),
    cloudflare({
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
  resolve: {
    alias: {
      '@/lib/public-cache-runtime': fileURLToPath(new URL('./cloudflare/public-cache-runtime.js', import.meta.url)),
      '@/lib/product-image-optimizer': fileURLToPath(new URL('./cloudflare/product-image-optimizer.js', import.meta.url)),
      '@/lib/remote-addresses': fileURLToPath(new URL('./cloudflare/remote-addresses.js', import.meta.url)),
    },
  },
});
