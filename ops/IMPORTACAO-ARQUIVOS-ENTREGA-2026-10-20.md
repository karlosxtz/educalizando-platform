# Importação dos materiais de entrega

## Contrato confirmado e comportamento

O teste autenticado da loja informada pelo usuário confirmou `files: array`, `files[].name: string` e `files[].url: string`. A consulta apresentou 116 produtos, cinco na primeira página. Nenhuma chave, endereço privado ou conteúdo de arquivo foi exibido no chat. Não foi iniciada nem retomada a importação real durante a inspeção.

O importador agora reconhece esse contrato, guarda as referências somente na fila privada e processa cada entrega depois das imagens. PDFs e outros formatos aceitos são copiados para armazenamento privado, com limite existente de 15 MB por arquivo. Links compartilhados permanecem referências privadas de entrega e recebem aviso para conferir as permissões na origem. Uma página HTML não é apresentada como PDF copiado; PDFs precisam ter assinatura compatível. Não há encaminhamento da chave de exportação aos servidores de arquivos nem em redirecionamentos.

As entregas são gravadas apenas em `product_deliveries` e `product_delivery_files`; nunca na galeria, capa ou campos públicos do produto. Os produtos continuam em rascunho para revisão. Produtos revisados/publicados são preservados. Erros, expiração da etapa, limites e alterações manuais não são apresentados como cópia concluída.

Para importações pausadas anteriores, **Completar arquivos desde o início** inicia uma nova passagem pelo catálogo, mantendo os produtos existentes e seus recibos. A contagem passa a refletir essa nova passagem. Os rascunhos já importados podem receber as entregas ausentes sem duplicação de produtos; imagens e informações desses produtos não são sobrescritas. A função não é acionada automaticamente.

## Banco

Migration `supabase/migrations/20261020150000_platform_import_deliveries.sql`: usuário confirmou execução sem erros. Cria apenas uma tabela privada de proveniência e uma função transacional restrita ao `service_role`. A função exige loja, produto, etapa, lease vigente e rascunho importado; verifica as entregas existentes antes de gravar. Não modifica políticas existentes, checkout, webhooks ou permissões dos compradores. O servidor verifica a presença da função antes de copiar arquivos.

## Arquivos alterados e motivos

- `src/lib/platform-delivery-contract.ts`: parser do contrato real `files[{name,url}]`, HTTPS, deduplicação e limite por produto.
- `src/lib/platform-delivery-media.ts`: leitura remota limitada, validação de endereços e redirecionamentos, tipos, PDF e tamanho; armazenamento privado e tratamento de links.
- `src/lib/saber-export-contract.ts`: adaptador versão 3 inclui entregas na fila privada, sem expô-las na prévia.
- `src/lib/saber-import-job.ts`: etapa de entrega retomável, proteção dos produtos existentes, preenchimento das entregas de rascunhos e nova passagem pelo catálogo.
- `src/app/api/creator/platform-import/route.ts`: capacidade de entrega, contagem sem URLs e ação autenticada para revisitar a importação pausada.
- `src/app/dashboard/importar-plataforma/page.tsx`: instruções corretas, contagem dos materiais disponíveis, aviso de ativação e botão para completar importações antigas.
- `supabase/migrations/20261020150000_platform_import_deliveries.sql`: proveniência privada e gravação transacional que preserva alterações manuais.
- `scripts/verify-platform-deliveries.cjs`: arquivos privados, links, token não encaminhado, DNS/redirecionamento, HTML, PDF e limite de tamanho.
- `scripts/verify-saber-import.cjs`: adaptador e diagnóstico compatíveis com a versão nova.
- `scripts/verify-saber-job.cjs`: etapas de entrega, repetição, preservação, falhas, migration ausente e nova passagem sem duplicação.
- `scripts/verify-saber-import-api.cjs`: prévia e isolamento de loja compatíveis com o teste de disponibilidade.
- `ops/IMPORTACAO-ARQUIVOS-ENTREGA-2026-10-20.md`: contrato observado, comportamento, limitações e validação.

## Validação

Os quatro scripts acima passaram. A cópia e os conflitos foram exercitados com arquivos e banco simulados, sem iniciar uma importação real na loja do usuário. `npm run lint` passou com zero erros e 14 avisos preexistentes. `npm run typecheck:vinext` e `node scripts/deploy-cloudflare.mjs --dry-run` passaram.
