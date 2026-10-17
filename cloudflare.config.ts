import { bindings, defineConfig, defineWorker } from "cf/config";

export default defineConfig({
  worker: defineWorker({
    name: "educalizando-app",
    entrypoint: "./cloudflare/worker.js",
    compatibilityDate: "2026-10-10",
    compatibilityFlags: ["nodejs_compat"],
    triggers: [{ type: "scheduled", schedule: "* * * * *" }],
    assets: { notFoundHandling: "none" },
    env: {
      ASSETS: bindings.assets(),
      VINEXT_KV_CACHE: bindings.kv({ id: "bc49505d534146499d5e9641b6393cd5" }),
    },
  }),
});
