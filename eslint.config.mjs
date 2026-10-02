import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tseslint from "@typescript-eslint/eslint-plugin";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // TypeScript continua com `strict`/`noImplicitAny` no build. Os `any`
    // explícitos restantes representam payloads legados e SDKs externos;
    // a migração deles exige contratos de domínio, não silenciamento pontual.
    plugins: {
      "@typescript-eslint": tseslint,
      react,
      "react-hooks": reactHooks,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
        destructuredArrayIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        ignoreRestSiblings: true,
      }],
      // O projeto ainda usa o padrão de carregamento assíncrono em effects.
      // Mantemos rules-of-hooks ativo e adiamos regras do React Compiler até
      // a migração para uma camada única de consultas/cache.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      "react-hooks/static-components": "off",
      "react-hooks/incompatible-library": "off",
      "react-hooks/exhaustive-deps": "off",
      "react/no-unescaped-entities": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      // Capas e avatares vêm de URLs dinâmicas do armazenamento dos criadores.
      // A tag nativa evita bloquear hosts não cadastrados no otimizador do Next.
      "@next/next/no-img-element": "off",
    },
  },
  {
    files: ["scripts/**/*.{js,cjs}"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "tmp/**",
    "scratch/**",
    "check_query.ts",
    "check_queries.ts",
    "create_bucket.js",
    "scratch_check*.ts",
    "test_query.mjs",
    "test-affiliate.ts",
  ]),
]);

export default eslintConfig;
