# Limite de 50 tags por produto

O cadastro e a edição passam a permitir até 50 tags de busca. O contador e a orientação exibem o mesmo limite. O servidor também aplica o teto: anteriormente a criação cortava a lista em 20, mesmo que o formulário permitisse enviar mais. A edição mantém tags existentes quando o campo não é enviado.

Rascunhos e revisão editorial da IA preservam até 50 tags. As sugestões automáticas continuam podendo sugerir uma quantidade menor, sem obrigar o criador a preencher todas as posições. Não há alteração de temas do calendário, RLS, tenant, preços, checkout ou arquivos de entrega. Não é necessária migration.

## Arquivos e motivos

- `src/lib/product-tags.ts`: constante compartilhada com máximo de 50 e normalização padrão nesse limite.
- `src/components/ui/TagInput.tsx`: limite padrão e contador usam a constante.
- `src/app/dashboard/produtos/novo/ProductWizardStepOne.tsx`: cadastro/edição mostram e permitem até 50 tags.
- `src/app/api/produtos/post.ts`: criação e recuperação de cadastro salvam até 50 tags normalizadas.
- `src/lib/product-update-payload.ts`: atualização aplica o mesmo limite sem apagar tags quando o campo está ausente.
- `src/lib/ai-workspace.ts`: histórico e rascunhos editoriais preservam até 50 tags.
- `src/lib/ai-seo-fill.ts`: preenchimento editorial aceita propostas de até 50 tags.
- `src/app/api/ai/seo-apply/route.ts`: aplicação editorial salva até 50 tags.
- `scripts/verify-product-tags.ts`: limites 50/51, deduplicação e atualização parcial.
- `scripts/verify-product-create.cjs`: valida persistência de 50 tags na criação e recuperação; ajusta dependência do normalizador.
- `scripts/verify-ai-workspace.cjs`: verifica preservação de 50 tags e ajusta as dependências simuladas; atualiza o teste antigo de imagem para o fallback de miniatura existente.
- `ops/PRODUTOS-50-TAGS-2026-10-20.md`: documentação da entrega.

## Verificação

- `npm run test:product-tags`: passou.
- `node scripts/verify-product-create.cjs`: passou.
- `node scripts/verify-ai-workspace.cjs`: passou.
- `npm run typecheck:vinext`: passou.
- `npm run lint`: passou, zero erros e 14 avisos preexistentes.
- `node scripts/deploy-cloudflare.mjs --dry-run`: build de produção e empacotamento Cloudflare passaram.
