# Falha na verificação da entrega armazenada

## Diagnóstico e correção

A mensagem da captura é emitida exclusivamente pela consulta HEAD anterior à
gravação em `platform-delivery-media.ts`. A captura não identifica o código HTTP
da resposta original; não foi possível reproduzir a chamada real localmente,
pois as credenciais do armazenamento não estão configuradas no ambiente local.

Foi removida essa dependência de HEAD. Agora a cópia envia PutObject com
`If-None-Match: *` para a mesma chave derivada do conteúdo, loja e produto.
O servidor cria o objeto se ausente; uma resposta 412 reaproveita o objeto que
já existe, sem criar outra versão. Outros erros continuam interrompendo a etapa;
nunca há nova tentativa incondicional que possa sobrescrever arquivos.

O comportamento é documentado pelo [MinIO](https://www.min.io/blog/leading-the-way-minios-conditional-write-feature-for-modern-data-workloads)
e pela [API S3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/conditional-writes.html).
Não se alteram permissões de armazenamento ou políticas de banco.

## Arquivos alterados

- `src/lib/object-storage.ts`: operação condicional separada para a importação;
  os uploads existentes permanecem com sua implementação anterior.
- `src/lib/platform-delivery-media.ts`: usa criação condicional, remove a consulta
  HEAD e retorna mensagem segura quando a gravação falha.
- `scripts/verify-platform-deliveries.cjs`: cobre a cópia e o reaproveitamento pela
  nova operação, mantendo validações de PDF, acesso privado, URL e limite de 50 MB.
- `scripts/verify-storage-conditional-import.cjs`: testa o comando real do helper,
  concorrência, repetição, cabeçalho obrigatório e falhas sem gravação alternativa.
- Este relatório registra evidências e limites da validação.

## Validação e operação

Testes de gravação condicional, cópia de entregas, retomada e processamento do
catálogo passaram com respostas controladas. Não foi reiniciada a importação real.
TypeScript e build de produção passaram; lint sem erros e com os 14 avisos
preexistentes do projeto.
Nenhuma migration é necessária. Após a publicação, usar Continuar importação no
progresso pausado; não é necessário cancelar ou começar novamente.
