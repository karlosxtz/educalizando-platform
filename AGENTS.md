# AGENTS.md

## Projeto
Educalizando (https://www.educalizando.com.br): SaaS multi-tenant de mini lojas de materiais didáticos. Next.js (App Router) + TypeScript + Tailwind + Supabase externo, hospedado na Cloudflare.

## Regras que nunca podem ser quebradas
- Não alterar regras de negócio, RLS, isolamento por tenant_id, checkout Asaas nem webhooks.
- Nunca expor chaves secretas (SUPABASE_SERVICE_ROLE_KEY etc.) no código do cliente nem em commits.
- Domínio canônico único: https://www.educalizando.com.br (nunca usar VERCEL_URL, window.location.origin ou *.workers.dev para gerar links públicos).
- Dados reais apenas: sem avaliações, números ou depoimentos inventados.

## Verificação obrigatória antes de concluir qualquer tarefa
- Rodar o lint e o build de produção e corrigir todos os erros.
- Listar os arquivos alterados e o motivo de cada um.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
