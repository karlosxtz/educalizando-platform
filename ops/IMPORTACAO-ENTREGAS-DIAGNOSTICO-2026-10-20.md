# Verificação dos arquivos de entrega na exportação

## Constatação

O endpoint configurado é `/api/public/sync/seller-products` no marketplace de origem, com autenticação Bearer e paginação. O cliente consulta somente esse endpoint autorizado e não encaminha a chave em redirecionamentos. O acesso público não permite conferir a resposta autenticada.

O adaptador atual descarta os campos de entrega: `SaberItem` não contém arquivos nem links de entrega, e o processamento cria rascunhos e copia apenas imagens. Assim, não basta mudar um texto ou reaproveitar o campo público de prévia. Ainda é necessário conferir o contrato real retornado por uma chave válida, inclusive se o arquivo exige autenticação, expira ou é um link externo.

Esta alteração prepara uma consulta de compatibilidade somente de leitura. Ela retorna nomes e tipos de campos conhecidos de entrega presentes nos primeiros cinco produtos da página. Não retorna valores, endereços, nomes de arquivos nem credenciais e não muda o processamento ou as entregas existentes.

## Próxima etapa dependente da origem

Conferir o teste de conexão com a chave preenchida pelo usuário no campo privado. Só então mapear os campos reais e implementar a transferência retomável para armazenamento privado, respeitando limites de arquivo, falhas, propriedade da loja, links externos e preservação dos produtos revisados. Arquivos pagos nunca devem ser gravados na galeria, capa ou descrição pública. Não apresentar esta inspeção como importação de PDF concluída.

## Arquivos e motivos

- `src/lib/platform-delivery-diagnostics.ts`: lista limitada de nomes e tipos de campos, sem valores privados.
- `src/lib/saber-export-contract.ts`: inspeciona o esquema de entrega da resposta recebida pela API autorizada.
- `src/app/api/creator/platform-import/route.ts`: inclui somente o diagnóstico na prévia privada autenticada.
- `src/app/dashboard/importar-plataforma/page.tsx`: seção de compatibilidade para consulta e cópia dos nomes dos campos.
- `scripts/verify-saber-import.cjs`: confirma que o diagnóstico não vaza links, nomes, chaves nem dados de clientes.
- `scripts/verify-saber-job.cjs`: atualiza a dependência simulada e mantém as garantias do processamento existente.
- `ops/IMPORTACAO-ENTREGAS-DIAGNOSTICO-2026-10-20.md`: constatação, escopo entregue e dependência para ativar a importação de arquivos.

## Validação

Os testes `verify-saber-import.cjs`, `verify-saber-job.cjs` e `verify-saber-import-api.cjs` passaram. `npm run lint` passou com zero erros e 14 avisos preexistentes; `npm run typecheck:vinext` e `node scripts/deploy-cloudflare.mjs --dry-run` passaram. Nenhum catálogo real foi importado por esta verificação.
