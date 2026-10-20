# Produtos repetidos entre páginas da exportação

## Causa e correção

O importador interrompia toda a fila se qualquer ID da página seguinte já
constasse entre os IDs recebidos. A prévia também rejeitava qualquer sobreposição.

Agora, os produtos de páginas sobrepostas são filtrados pelos IDs de origem já
registrados na importação. Somente os produtos novos entram na fila e aumentam
Recebidos. Os repetidos são sinalizados em Pontos para revisar, sem novo download,
upload, cadastro ou incremento dos contadores de produtos processados.

Uma página inteiramente repetida pode ser atravessada se trouxer uma continuação
nova. Se a próxima também não trouxer materiais novos, ou a continuação voltar a
uma página conhecida, o processamento permanece bloqueado para evitar ciclos.
O total de produtos únicos continua sendo conferido antes da conclusão; repetidos
não substituem produtos faltantes nem justificam uma conclusão falsa.

## Arquivos alterados

- `src/lib/saber-import-job.ts`: filtra IDs já recebidos, calcula o total único,
  registra a sobreposição e mantém os limites contra ciclos e mudança de loja.
- `src/app/api/creator/platform-import/route.ts`: prévia aceita sobreposição com
  aviso, mantendo bloqueio de repetição da mesma continuação.
- `scripts/verify-saber-job.cjs`: testes de páginas parcialmente repetidas,
  continuação após página repetida, fila sem novos produtos, totais incompletos e
  conclusão com um único cadastro por produto.
- `scripts/verify-saber-import-api.cjs`: valida o aviso na prévia e o bloqueio de
  continuação que repete a mesma página.
- Este relatório: registro da causa, solução e limites.

## Validação e retomada

Regressões do processamento, do contrato de exportação e da API passaram com
dados de teste. Nenhuma importação real foi reiniciada nesta validação.
Lint sem erros (14 avisos preexistentes), TypeScript e build de produção aprovados.
Não requer migration. Após a publicação, atualizar a página, preencher a mesma
chave e clicar em Continuar importação, aproveitando o progresso salvo.

Não foram alterados RLS, isolamento das lojas, produtos existentes, checkout,
webhooks, arquivos privados ou regras de preservação de edições manuais.
