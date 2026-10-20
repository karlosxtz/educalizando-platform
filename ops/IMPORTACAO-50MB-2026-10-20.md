# Materiais importados de até 50 MB

O limite de cada arquivo de entrega na importação de marketplace passa de 15 MB para 50 MB (52.428.800 bytes). A regra é aplicada ao tamanho declarado, aos bytes realmente recebidos, à validação de produtos e ao banco. O usuário confirmou execução da migration sem erros.

A leitura usa um buffer de destino em vez de guardar todos os fragmentos e depois montar uma segunda cópia completa. O armazenamento continua privado e as validações de endereço, tipo de arquivo, propriedade da loja e preservação de entregas existentes continuam ativas. O aumento não elimina outras possíveis falhas da origem, como links vencidos ou arquivos indisponíveis.

## Arquivos alterados e motivos

- `src/lib/product-delivery-files.ts`: permite validar e salvar entregas importadas de até 50 MB, inclusive ao revisar o produto.
- `src/lib/platform-delivery-media.ts`: aceita até 50 MB declarados e recebidos; reduz a duplicação de memória e atualiza a mensagem de limite.
- `src/app/dashboard/importar-plataforma/page.tsx`: informa o teto de 50 MB na área de importação.
- `supabase/migrations/20261020160000_platform_import_50mb.sql`: aumenta a constraint de tamanho e a validação da função transacional, sem alterar políticas de acesso.
- `scripts/verify-platform-deliveries.cjs`: testa PDF com exatamente 50 MB, validação de salvamento e rejeição de bytes acima do teto, com e sem Content-Length.
- `ops/IMPORTACAO-50MB-2026-10-20.md`: escopo e validação.

## Verificação

Passaram os testes de entregas, processamento de importação, API privada e gravação de produtos. O teste de 50 MB usa um PDF sintético no ambiente de testes, sem importar materiais reais. `npm run lint` passou com zero erros e 14 avisos preexistentes. `npm run typecheck:vinext` e `node scripts/deploy-cloudflare.mjs --dry-run` passaram.
