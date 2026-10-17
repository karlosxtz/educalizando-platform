# Instalação — Educalizando V18

## Arquivos

Importe no n8n:

1. `ATENDENTE EDUCALIZANDO V18.json`
2. `RECUPERADOR DE MENSAGENS V18.json`
3. `RECUPERADOR DE ATENDIMENTOS V18.json`

Os três workflows devem ficar ativos. Eles cuidam, respectivamente, do atendimento em tempo real, da recuperação de mensagens que falharam e da recuperação de atendimentos, relatórios e reativação.

## Troca da V17 pela V18

1. Desative o atendente V17 e qualquer versão anterior.
2. Desative os dois recuperadores V17 e anteriores.
3. Importe os três arquivos V18.
4. Confira as credenciais Redis, Google Gemini, Groq e Evolution API.
5. Configure as variáveis abaixo e reinicie o n8n.
6. Publique e ative somente os três workflows V18.
7. Na Evolution API, mantenha um único webhook apontando para a URL de produção do caminho `evolutioneducalizandobot-v102`.
8. Habilite no webhook da Evolution os eventos de mensagem recebida e atualização de mensagem (`MESSAGES_UPDATE`/`send.message.update`). Eles alimentam a confirmação `DELIVERY_ACK` e `READ`.

Nunca deixe duas versões do atendente ativas ao mesmo tempo. Isso causa respostas duplicadas, mensagens antigas e conversa fora de ordem.

## Variáveis de ambiente

```env
NOME_AGENTE=Alexia
NUMERO_ATENDENTE=5511999999999@s.whatsapp.net
NUMERO_RELATORIO=5511999999999@s.whatsapp.net
EVOLUTION_INSTANCE_RELATORIO=nome-da-instancia

CUPOM_PRIMEIRA_COMPRA=VOLTA10
CUPOM_TERCEIRA_COMPRA=FIEL15
CUPOM_QUINTA_COMPRA=VIP20
LINK_PAGAMENTO_PACOTE=https://seu-link-de-pagamento-do-pacote
DESCONTO_PACOTE_PERCENTUAL=10

WHISPER_MODEL=whisper-large-v3
AB_TESTE_ATIVO=true
REATIVACAO_SEMANAL_ATIVO=true
REATIVACAO_LIMITE_POR_RODADA=50
RETRY_MENSAGEM_CRITICA_ATIVO=true
ESCALADA_AUTOMATICA_ATIVO=true
```

Use o `remoteJid` aceito pela Evolution em `NUMERO_ATENDENTE` e `NUMERO_RELATORIO`. Configure o fuso horário do n8n como `America/Sao_Paulo` para o relatório diário das 8h e a reativação de segunda-feira às 10h.

## Recursos da V18

- Áudios são transcritos pelo Groq Whisper, tratados como mensagem normal e respondidos em texto.
- O nome é capturado quando o cliente se apresenta. Após três trocas sem nome, o bot pergunta uma única vez.
- Prazo e contexto pedagógico entram na ficha. Prazos inferiores a três dias priorizam a versão final e destacam entrega imediata.
- Disciplina, abreviações e erros simples de tema são normalizados antes da consulta.
- O cliente pode pedir comparação, recomendação ou catálogo por categorias.
- Três buscas vazias, duas rejeições completas ou sinais de frustração geram atendimento humano com prioridade alta.
- A abertura usa teste A/B estável por cliente e mede sessões, buscas e compras.
- Clientes com compra antiga podem receber reativação semanal, limitada a 50 contatos por rodada.
- Mensagens críticas sem `DELIVERY_ACK` ou `READ` são reenviadas uma única vez.

## Chaves Redis novas

- Nome: `nome_{sessionId}`
- Urgência: `urgencia_{sessionId}`
- Filtro normalizado: `filtro_normalizado_{sessionId}`
- Variante de abertura: `ab_variante_{sessionId}`
- Prioridade: `prioridade_{sessionId}`
- Última atividade: `ultima_atividade_{sessionId}`
- Reativação: `reativacao_enviada_{sessionId}`
- Entrega: `entrega_ack_{instance}:{msgId}`
- Reenvio: `tentativa_reenvio_{sessionId}_{msgId}` com TTL de 10 minutos
- Fila: `educalizando:outbox:v18`
- Métricas: `educalizando:metricas:v18`
- Contadores: `educalizando:relatorio:v18:current`
- Snapshots: `educalizando:snapshot:v18:*`

As chaves existentes de estado, histórico, compras, suporte e pacote foram preservadas.

## Testes recomendados

### Áudio

1. Envie um áudio pedindo um material e confirme que a resposta chega em texto.
2. Confira em `mensagens_{sessionId}` o tipo `audio_transcrito`.
3. Simule falha do Groq e confira a mensagem de fallback.

### Nome

1. Envie `Sou a Mariana` e confirme `nome_{sessionId}`.
2. Em outra sessão, faça três trocas sem informar o nome.
3. Confirme que `Como posso te chamar?` aparece uma vez e não se repete.

### Prazo, contexto e normalização

1. Pesquise com `mat`, tema `silaba` e prazo para menos de três dias.
2. Confirme a busca por `Matemática` e `sílabas`.
3. Confirme no card `Disponível agora — entrega imediata por download`.
4. Confira `urgencia_{sessionId}` e `filtro_normalizado_{sessionId}`.

### Comparação e catálogo

1. Depois de receber opções, pergunte `qual é melhor?`.
2. Confirme apenas o resumo comparativo e uma recomendação.
3. Envie `catálogo` e confirme categorias reais sem cards individuais.

### Escalada

1. Faça três buscas consecutivas sem resultado.
2. Em outra sessão, rejeite todas as opções duas vezes.
3. Em outra, envie `estou frustrado`.
4. Confirme prioridade alta, pausa do bot, resumo marcado e evento `escalada_automatica`.

### Teste A/B

1. Inicie sessões com números terminados em algarismo par e ímpar.
2. Confira A e B em `ab_variante_{sessionId}`.
3. Confira sessões, buscas e compras no relatório.
4. Após 100 sessões de cada variante, confirme a linha com a variante vencedora.

### Reativação

1. Use um histórico com compra há mais de 21 dias e nenhuma atividade nos últimos sete dias.
2. Execute manualmente o gatilho semanal.
3. Confirme mensagem personalizada, limite 50, marcador e métrica.

### Entrega e reenvio

1. Envie uma mensagem com link, resumo de pacote ou cupom.
2. Confirme que `DELIVERY_ACK` ou `READ` cria `entrega_ack_*`.
3. Sem ACK, confirme espera de três minutos, mais dois minutos e um único reenvio.
4. Sem ACK do reenvio, confirme `entrega_pendente` sem novo envio.

## Validação local

```powershell
node scripts/build_v18.js
node scripts/validate_v18.js
```

Resultado esperado: `943/943 verificações aprovadas`.
