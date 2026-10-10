import { defineConfig } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";
import { fileURLToPath } from "node:url";
import { kvDataAdapter } from '@vinext/cloudflare/cache/kv-data-adapter';

export default defineConfig({
  plugins: [
    vinext({ cache: { data: kvDataAdapter() } }),
    cloudflare({
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
  resolve: {
    alias: {
      '@/lib/product-image-optimizer': fileURLToPath(new URL('./cloudflare/product-image-optimizer.js', import.meta.url)),
      '@/lib/remote-addresses': fileURLToPath(new URL('./cloudflare/remote-addresses.js', import.meta.url)),
    },
  },
});
