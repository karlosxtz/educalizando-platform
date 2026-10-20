# Importação interrompida por produto revisado

## Causa

O recibo final do produto só é gravado após suas imagens e entregas. Se o criador
revisa ou publica o rascunho antes desse ponto, o produto existe, mas ainda não tem
o recibo final. O processamento já preservava e avançava sobre revisados com
recibo; sem ele, pausava toda a fila com a mensagem exibida na captura.

## Correção e arquivos

- `src/lib/saber-import-job.ts`: no ponto de preservação, um produto da própria
  loja identificado pelo ID determinístico da origem é preservado e sinalizado,
  mesmo sem recibo final. A etapa avança uma posição, soma um item já existente,
  limpa o cursor de arquivos e continua. Não insere recibo de importação concluída
  nem modifica o produto preservado. Produtos de outra loja continuam bloqueados.
- `scripts/verify-saber-job.cjs`: cobre publicação durante a importação, rascunho
  já revisado sem recibo, preservação integral do registro e processamento do
  próximo material até a conclusão. Mantém testes de isolamento e duplicação.
- Este relatório registra a causa e o tratamento.

## Operação

Não requer migration nem reiniciar o catálogo. Após a publicação, atualizar a
página, preencher a mesma chave e usar Continuar importação. O material preservado
aparece em Pontos para revisar; seus arquivos precisam ser conferidos no cadastro.
A correção não sobrescreve arquivos de um produto já revisado ou publicado.

## Verificação

Regressões de processamento, retomada e cópia das entregas passaram. A reprodução
foi feita com dados de teste, sem reiniciar uma importação real.
Lint sem erros (14 avisos preexistentes), TypeScript e build de produção aprovados.
