# Correção do salvamento de entrega por link

## Causa confirmada

O wizard envia `arquivo_url` preenchido e `delivery_files: []` quando a entrega é por link. No PUT, a lista vazia substituía o link por null antes de validar a publicação. Assim, a tela mostrava cadastro completo, mas a API respondia que faltava a entrega. A mesma inconsistência existia em `plr_license_url` + `plr_delivery_files: []`.

## Correção

- Uma lista preenchida escolhe seu primeiro arquivo como entrega principal.
- Lista vazia e link explícito preservam e gravam o link, removendo os uploads antigos conforme a escolha do criador.
- Lista vazia sem substituto continua representando remoção e não permite publicar material sem entrega.
- Campos de entrega omitidos preservam a entrega existente.
- Erro na consulta da entrega atual interrompe o salvamento; não é interpretado como ausência de entrega.
- Arquivos aceitos sem nome recebem nome padrão na normalização, em vez de desaparecerem da lista.

Sem migration. Sem alteração de preço, conteúdo do material, arquivos reais de clientes ou regras de acesso privado.

## Validação

Testes de regressão executam os handlers reais com banco e serviços externos simulados: payload exato do wizard com link e lista vazia; rascunho publicado após gravar entrega; link PLR persistido; troca por upload; rejeição de remoção sem substituição; controle de propriedade e autenticação; falhas parciais preservam rascunho e arquivos anteriores.

Não foi editado produto de cliente nem realizada compra real para validar a correção.

## Publicação

- `npm run test:uploads`, `npm run typecheck:vinext` e ESLint dos módulos alterados passaram.
- Build completo e dry-run passaram. Cloudflare publicou a versão `945a62ae-3019-41c8-9dce-2bc798134019`.
- Verificação de infraestrutura: PUT sem autenticação em `/api/produtos` retorna 401, sem escrita de dados.
