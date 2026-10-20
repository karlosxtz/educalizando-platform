# Catálogo atualizado durante a importação

## Causa

A comparação exigia o mesmo total em todas as páginas da exportação. Uma mudança
no total, inclusive após cadastrar ou remover um material na origem, pausava a
importação e solicitava reinício manual.

## Tratamento

Ao detectar um novo total, o processamento confirma a loja e inicia uma passagem
nova automaticamente, a partir da primeira página. Produtos, recibos e arquivos
já gravados são mantidos; os identificadores e a checagem de entregas existentes
permitem reaproveitá-los. Recomeçar na primeira página também permite encontrar
um material recém-inserido antes da posição atual da paginação.

Os contadores passam a representar a nova conferência. A interface informa isso
explicitamente. Uma remoção na origem não apaga um material da Educalizando.

Há uma passagem automática adicional por execução. Se a origem continuar mudando
ou não entregar os produtos compatíveis com o total, a etapa pausa e mantém os
dados, sem um ciclo ilimitado nem conclusão falsa. Continuar importação permite
uma tentativa adicional, preservando a paginação da passagem em andamento.

Os URLs reais da primeira página delimitam as passagens no histórico já existente;
não há nova coluna nem migration. A validação de páginas repetidas considera só
a passagem atual, de modo que revisitar páginas na reconferência não seja tratado
como um ciclo da API.

## Arquivos alterados

- `src/lib/saber-import-job.ts`: reconferência automática limitada, preservação
  dos registros e validação do total antes da conclusão.
- `src/app/api/creator/platform-import/route.ts`: expõe apenas o indicador público
  de reconferência e renova seu limite na retomada explícita. Não retorna URLs do
  histórico, chave ou arquivos privados.
- `src/app/dashboard/importar-plataforma/page.tsx`: aviso da reconferência e dos
  contadores, além do status durante o processamento.
- `scripts/verify-saber-job.cjs`: catálogo que cresce com inclusão no início,
  catálogo que diminui, reaproveitamento de entregas, retomada da paginação,
  preservação de materiais e limite de mudanças consecutivas.
- `scripts/verify-saber-import-api.cjs`: sinalização segura e retomada da mesma
  passagem sem expor o estado privado.
- Este relatório: explicação do tratamento e da validação.

## Validação

Testes de processamento, contrato de exportação, API e retorno visual aprovados.
Os testes não reiniciaram a importação real da loja. Não se alteram políticas de
acesso, isolamento, checkout, webhooks ou preservação de produtos revisados.
Lint sem erros (14 avisos preexistentes), TypeScript e build de produção aprovados.

Após a publicação, atualizar a página, preencher a mesma chave e usar Continuar
importação. Não é necessário cancelar nem iniciar outra importação.
