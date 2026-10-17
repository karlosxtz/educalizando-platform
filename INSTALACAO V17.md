# Instalação — Educalizando V17

## Arquivos

Importe estes três workflows no n8n:

1. `ATENDENTE EDUCALIZANDO V17.json`
2. `RECUPERADOR DE MENSAGENS V17.json`
3. `RECUPERADOR DE ATENDIMENTOS V17.json`

O quarto arquivo é este manual de instalação.

## Antes de ativar

1. Desative o atendente V16 e todas as versões anteriores.
2. Desative os recuperadores V16 e anteriores.
3. Importe os três workflows V17.
4. Confira as credenciais Redis, Gemini, Groq e Evolution.
5. Configure as variáveis de ambiente abaixo e reinicie o n8n.
6. Publique e ative somente os três workflows V17.
7. Na Evolution API, mantenha um único webhook apontando para a URL de produção do caminho `evolutioneducalizandobot-v102`.

Não deixe duas versões do atendente ativas. Isso causa respostas duplicadas, mensagens antigas e conversas fora de ordem.

## Variáveis de ambiente

```env
NOME_AGENTE=Alexia

# Número ou grupo interno que receberá os pedidos de atendimento humano.
# Use o remoteJid aceito pela Evolution API.
NUMERO_ATENDENTE=5511999999999@s.whatsapp.net

# Destino e instância usados no relatório diário das 8h.
NUMERO_RELATORIO=5511999999999@s.whatsapp.net
EVOLUTION_INSTANCE_RELATORIO=nome-da-instancia

# Cupons de fidelidade.
CUPOM_PRIMEIRA_COMPRA=VOLTA10
CUPOM_TERCEIRA_COMPRA=FIEL15
CUPOM_QUINTA_COMPRA=VIP20

# Pacote com três produtos.
LINK_PAGAMENTO_PACOTE=https://seu-link-de-pagamento-do-pacote
DESCONTO_PACOTE_PERCENTUAL=10
```

Se `NOME_AGENTE` não estiver configurado, o nome padrão será Alexia.

O link configurado em `LINK_PAGAMENTO_PACOTE` deve levar para o checkout usado pela loja para o pacote. Sem essa variável, o atendente consegue apresentar e confirmar o pacote, mas não terá um link para entregar.

## Atendimento humano

Quando o cliente pedir atendente, humano, pessoa real ou suporte:

1. O bot responde ao cliente que está chamando alguém.
2. O bot salva a sessão como pausada.
3. O resumo da conversa é enviado para `NUMERO_ATENDENTE`.
4. As novas mensagens do cliente são registradas, mas o bot não responde.

Para reativar a última sessão encaminhada, envie no chat interno:

```text
/retomar
```

Também é possível indicar o telefone do cliente:

```text
/retomar 5511988887777
```

## Relatório diário

O workflow `RECUPERADOR DE ATENDIMENTOS V17` envia o relatório todos os dias às 8h. Ele consolida os contadores acumulados desde o relatório anterior, salva um snapshot no Redis e zera os contadores do próximo período.

Confirme que o fuso horário do n8n está configurado como `America/Sao_Paulo`.

## Chaves Redis da V17

- Perfil comercial: `perfil_{sessionId}`
- Histórico de compra: `historico_{sessionId}`
- Total de compras: `compras_total_{sessionId}`
- Pacote oferecido: `pacote_{sessionId}`
- Suporte: `suporte_{sessionId}`
- Estado do bot: `estado_bot_{sessionId}`
- Histórico recente: `mensagens_{sessionId}`
- Deduplicação por hash: `educalizando:hash:v17:*`
- Proteção contra flood: `educalizando:rate:v17:*`
- Fila de reenvio: `educalizando:outbox:v17`
- Métricas: `educalizando:metricas:v17`
- Contadores do relatório: `educalizando:relatorio:v17:current`
- Snapshots: `educalizando:snapshot:v17:*`

## Testes recomendados

### Explorador

1. `Quero ver o que tem`
2. Confirme que o bot apresenta categorias antes dos filtros.

### Comprador

1. `Preciso de um material`
2. Confirme que o bot pergunta diretamente a idade ou o ano escolar.

### Pacote

1. Faça uma busca que retorne três produtos da mesma disciplina e ano.
2. Escolha `Opção 4`.
3. Confirme que o link só é enviado depois de responder `sim`.

### Suporte

1. Após a pergunta de satisfação, responda `não abriu`.
2. Informe nome completo e e-mail.
3. Confirme o registro em `suporte_{sessionId}` e o envio ao atendente.

### Handoff

1. Envie `quero falar com atendente`.
2. Envie outra mensagem e confirme que o bot permanece pausado.
3. No chat interno, envie `/retomar`.
4. Envie uma nova mensagem do cliente e confirme que o bot voltou a responder.
