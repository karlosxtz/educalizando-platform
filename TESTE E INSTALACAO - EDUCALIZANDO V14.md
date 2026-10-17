# Educalizando Enterprise V14

## Instalação

1. Desative o atendente e o recuperador das versões anteriores.
2. Importe `ATENDENTE EDUCALIZANDO ENTERPRISE V14.json`.
3. Importe `RECUPERADOR DE MENSAGENS ENTERPRISE V14.json`.
4. Abra os nós Redis, Gemini, Groq e Evolution e confirme as credenciais.
5. Publique e ative os dois workflows V14.
6. Deixe ativo somente um atendente principal e um recuperador.
7. O caminho do webhook continua sendo `evolutioneducalizandobot-v102`.

## Comportamentos principais

- Guarda idade, ano, disciplina, tema, produto escolhido, versão e etapa da conversa.
- Apresenta no máximo três produtos por rodada.
- Identifica `Opção 1`, `2`, `o segundo`, o nome do produto e outras referências diretas.
- Usa o produto selecionado quando o cliente diz `quero comprar`.
- Entrega os links cadastrados da versão final e PLR.
- Entende `mais opções` e não repete os produtos que acabou de apresentar.
- Compara as opções apresentadas e identifica o menor preço cadastrado.
- Entende `quero os dois` e devolve os links das opções apresentadas.
- Pergunta se o cliente conseguiu abrir o link e trata falhas de acesso.
- Interrompe respostas antigas quando chega uma mensagem mais recente.
- Registra eventos em `educalizando:events:v14` para diagnóstico.
- Tenta recuperar mensagens até cinco vezes e envia falhas permanentes para `educalizando:deadletter:v14`.

## Roteiro mínimo de homologação

Use um número de teste e aguarde cada resposta antes da próxima etapa.

1. Envie `Olá`.
   - Deve responder à saudação uma única vez.
2. Envie `Quero material para 6 anos`.
   - Deve perguntar o tema ou habilidade.
3. Envie `Sílabas`.
   - Deve mostrar até três opções com os títulos `OPÇÃO 1 DE N`, `OPÇÃO 2 DE N` e `OPÇÃO 3 DE N`.
4. Envie `Opção 2`.
   - Deve confirmar exatamente o segundo produto.
5. Envie `Quero comprar`.
   - Deve enviar somente os links e preços do produto escolhido.
6. Recomece e envie `Mais opções` depois de uma lista.
   - Deve apresentar produtos diferentes dos anteriores.
7. Envie `Qual é o mais barato?` depois de uma lista.
   - Deve responder usando apenas os preços cadastrados.
8. Envie `Quero os dois` depois de duas ou três opções.
   - Deve listar os links correspondentes às opções mostradas.
9. Depois de receber o link, envie `Não abriu`.
   - Deve oferecer o contato de atendimento cadastrado.
10. Envie duas mensagens rapidamente enquanto uma busca estiver em andamento.
    - A resposta antiga não deve ser enviada depois da mensagem mais recente.

## Diagnóstico

- Mensagens que falharam temporariamente: lista Redis `educalizando:outbox:v14`.
- Falhas depois de cinco tentativas: lista Redis `educalizando:deadletter:v14`.
- Eventos de atendimento: lista Redis `educalizando:events:v14`.
- Estado da conversa: chave Redis `educalizando:filtros:v14:<instância>:<cliente>`.
- Controle da mensagem mais recente: chave Redis `educalizando:latest:v14:<instância>:<cliente>`.

## Observação operacional

O workflow principal e o recuperador precisam permanecer ativos. Se uma versão antiga continuar ativa no mesmo webhook, o WhatsApp poderá receber respostas duplicadas ou fora de contexto.
