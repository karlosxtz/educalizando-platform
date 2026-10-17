# Instalação da automação Educalizando V16

## Arquivos para importar

1. `ATENDENTE EDUCALIZANDO CONVERSACIONAL V16.json`
2. `RECUPERADOR DE MENSAGENS V16.json`
3. `RECUPERADOR DE ATENDIMENTOS V16.json`

Os três workflows fazem partes diferentes do mesmo atendimento:

- O primeiro recebe e responde as mensagens.
- O segundo reenvia mensagens que falharam temporariamente no WhatsApp.
- O terceiro recupera fichas abandonadas após 60 minutos e encerra o estado após 24 horas sem retorno.

## Ativação correta

1. Desative todos os workflows antigos do atendente e todos os recuperadores antigos.
2. Importe os três arquivos V16.
3. Confira se as credenciais Redis, Gemini, Groq e Evolution aparecem selecionadas.
4. Publique e ative os três workflows V16.
5. Na Evolution API, deixe somente um webhook apontando para a URL de produção do caminho `evolutioneducalizandobot-v102`.

Não mantenha a V15, V14 ou outra versão antiga ativa junto com a V16. Dois workflows recebendo o mesmo evento causam respostas repetidas e mensagens fora de ordem.

## Nome do agente

Configure no ambiente do n8n:

`NOME_AGENTE=Alexia`

Se a variável não existir, o fluxo usa `Alexia` automaticamente.

## Teste rápido

Envie as mensagens abaixo, uma por vez:

1. `Olá`
2. `Pode me ajudar a escolher um material?`
3. `6 anos`
4. `Português`
5. `Sílabas`
6. `Não`
7. `Qualquer`

O fluxo deve fazer uma pergunta por vez e pesquisar somente depois da última resposta. Quando mostrar mais de um produto, responda `Opção 2`, depois `quero comprar`. O link só deve aparecer depois da confirmação com `sim`.

Teste também `não gostei` ou `quero outro material`. O fluxo deve apagar a consulta anterior e recomeçar pela idade ou pelo ano escolar.

## Registros no Redis

- Estado principal: `educalizando:filtros:v16:*`
- Campos individuais: `consulta_*`
- Fila de reenvio: `educalizando:outbox:v16`
- Métricas: `educalizando:metricas:v16`

As métricas registradas são: `ficha_iniciada`, `ficha_concluida`, `resultado_encontrado`, `resultado_vazio`, `produto_selecionado`, `compra_confirmada`, `link_enviado` e `abandono_detectado`.
