# Completar os arquivos de uma importação anterior

## Procedimento

Na importação pausada, usar a mesma chave e **Completar arquivos desde o início**. O catálogo é percorrido novamente. A identificação combina a loja de destino, a loja de origem e o ID de cada produto exportado. Os recibos existentes e o identificador determinístico fazem o processo reutilizar os produtos importados, em vez de inserir outros iguais.

Os contadores passam a representar essa nova passagem pelo catálogo; o reset dos números não apaga produtos. Rascunhos importados podem receber as entregas faltantes. Produtos revisados/publicados e entregas alteradas manualmente continuam preservados. Esta tarefa não iniciou nem retomou uma importação real.

## Proteção adicional dos arquivos

Antes de baixar uma entrega, o servidor agora consulta os arquivos e seus recibos privados. Se o arquivo correspondente já está registrado e inalterado, avança sem download nem gravação. Se encontrar exclusão, troca manual ou inconsistência, pausa para revisão antes de copiar.

Se uma tentativa anterior enviou o objeto ao armazenamento mas não concluiu a transação do banco, o nome baseado no conteúdo continua sendo o mesmo. O importador consulta esse objeto e o reutiliza, evitando outro PUT e outra versão no armazenamento. Uma falha de consulta não provoca envio às cegas. O reaproveitamento é por loja, produto e posição da entrega; não compartilha materiais entre lojas.

Não é necessária nova migration para esta proteção. As tabelas e funções privadas já ativadas são reutilizadas. Não há limpeza nem exclusão automática de arquivos existentes.

## Arquivos alterados e motivos

- `src/lib/platform-delivery-resume.ts`: confere recibos e arquivos privados, distingue entrega existente e faltante e preserva mudanças manuais antes de qualquer transferência.
- `src/lib/saber-import-job.ts`: pula a cópia de entregas que já possuem gravação confirmada.
- `src/lib/platform-delivery-media.ts`: consulta o objeto antes de enviar novamente uma tentativa parcial, evitando versões repetidas.
- `src/app/dashboard/importar-plataforma/page.tsx`: orientação visível sobre retomada de importações antigas e significado dos contadores.
- `scripts/verify-platform-delivery-resume.cjs`: isolamento, reutilização, arquivos faltantes, mudanças manuais e falhas de consulta.
- `scripts/verify-platform-deliveries.cjs`: repetição reutiliza o objeto sem novo PUT; indisponibilidade do armazenamento preserva os dados.
- `scripts/verify-saber-job.cjs`: segunda passagem não aumenta os produtos nem repete download ou gravação de entregas confirmadas.
- `ops/IMPORTACAO-RETOMADA-SEM-DUPLICACAO-2026-10-20.md`: procedimento e validação.

## Verificação

Passaram os testes de retomada de entregas, armazenamento, processamento e API privada. `npm run lint` passou com zero erros e 14 avisos preexistentes. `npm run typecheck:vinext` e `node scripts/deploy-cloudflare.mjs --dry-run` passaram.
