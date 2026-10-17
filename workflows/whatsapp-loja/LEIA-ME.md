# WhatsApp da loja Educalizando — Evolution + Redis + Groq

Arquivo para importar: `educalizando-whatsapp-loja.json`.
Estado: **rascunho desativado**, modo de teste ligado, 27 nós, sem chaves ou telefones reais no arquivo.

## O que está pronto

Recebe `MESSAGES_UPSERT`, atende somente a instância configurada e recusa grupos, mensagens próprias e eventos sem número válido. Aceita `remoteJidAlt` para eventos com endereço LID. O modo de teste atende exclusivamente ao telefone configurado.

Redis mantém a sessão por 12 horas, deduplica o mesmo ID de mensagem por 24 horas com `INCR` atômico e registra recibos de entrega/falha por 24 horas. Uma revisão da conversa evita enviar uma resposta cuja execução já tenha sido ultrapassada por uma mensagem nova. Não é uma fila transacional nem um agrupador de mensagens: cada pergunta é processada separadamente, e uma resposta anterior pode ser descartada se chegar uma nova pergunta.

A Groq interpreta intenção e tema da busca. Ela **não escreve preços, links ou descrições de produtos**. O formatador usa os dados atuais da API da loja; para selecionar ou comprar, consulta novamente o catálogo e não reaproveita um preço antigo. Mostra até três opções e aceita a escolha pelo número. Distingue produto final e licença PLR. Os links aceitos são HTTPS no domínio oficial e no caminho da mesma loja. Não consulta outros vendedores.

Ao escolher um material, envia título, formato, preço, resumo da descrição e link oficial. Usa a capa quando o URL pertence a `www.educalizando.com.br` ou `arquivos.educalizando.com.br`; sem capa compatível, usa texto. O cliente compra no site. O workflow não cobra, não confirma pagamentos nem libera arquivos de entrega.

“Atendente” ou “humano” pausa o bot por uma hora, após a confirmação do envio da resposta. “Voltar bot” retoma. Essa pausa permite atendimento manual no WhatsApp; ela não transfere a conversa para um sistema externo nem notifica automaticamente outra pessoa.

## Configuração necessária no n8n

Importe o JSON como **novo workflow**. Não substitua um fluxo existente ou seu webhook durante os testes.

No nó **Configuração**, preencha:

- `instanceName`: nome exato da instância conectada na Evolution.
- `evolutionBaseUrl`: endereço HTTPS da Evolution API v2.
- `testPhone`: seu telefone de teste, com país e DDD, somente dígitos.
- `testMode`: mantenha `true` até terminar os testes.
- `groqModel`: modelo disponível na sua conta; o rascunho usa `llama-3.3-70b-versatile`.
- `catalogUrl`: mantenha `https://www.educalizando.com.br/api/integrations/store-chatbot`.

Selecione as credenciais existentes ou cadastre-as pelo gerenciador do n8n:

| Serviço | Credencial | Nós |
| --- | --- | --- |
| Redis | Redis, com host/porta/senha/TLS conforme seu servidor | Todos os nós Redis |
| Groq | Groq API | Interpretar com Groq |
| API da loja | HTTP Header Auth: `Authorization` = `Bearer CHAVE_DA_LOJA` | Consultar API da loja |
| Evolution | HTTP Header Auth: `apikey` = chave da Evolution | Enviar material com capa; Enviar resposta em texto |
| Entrada do webhook | HTTP Header Auth: `x-educalizando-webhook-token` = segredo exclusivo da entrada | Webhook Evolution |

A chave da API Educalizando precisa estar ativa e vinculada **à sua loja**. A integração do WhatsApp da loja também precisa estar liberada na plataforma; a rota pode devolver 403 se estiver suspensa. Não coloque essas chaves no nó Configuração, em notas ou no JSON exportado.

Na Evolution, configure o evento `MESSAGES_UPSERT` para o URL do **Webhook Evolution** mostrado pelo n8n. Configure o mesmo header secreto da entrada. Verifique se sua versão da Evolution permite definir headers no webhook; sem isso, esta entrada autenticada não receberá mensagens. Não remova a autenticação para resolver uma rejeição. Primeiro confirme a versão/configuração e escolha um transporte autenticado compatível.

O endereço de produção, se o n8n não usar um prefixo diferente, será:
`https://n8n.vps11334.panel.icontainer.net/webhook/educalizando-loja-v1`.
Para teste manual, use o URL de teste mostrado pelo próprio nó e a opção **Listen for test event**. Não confunda `/webhook-test/` com `/webhook/`.

## Teste antes de ativar

1. Confirme a conexão da instância Evolution e execute o teste da credencial Redis.
2. Faça uma consulta da API com a credencial da sua loja e confirme `scope.storeId` e `store.id`.
3. Teste somente com seu telefone: “oi”, uma busca existente, “1”, “quero comprar”, licença PLR e uma busca inexistente.
4. Confira preço e link com o site. Altere um preço de um produto de teste, se desejar, e confirme que a seleção consulta o valor atual.
5. Teste evento duplicado, grupo, mensagem própria, falha da API e pausa por atendimento humano.
6. Depois de revisar essas execuções, escolha o horário da troca de webhook, desligue outros bots que atendam a mesma instância, desative `testMode` e ative o novo workflow.

Nenhum destes testes externos foi realizado pelo Codex nesta entrega: não havia ferramentas MCP do n8n carregadas nesta conversa nem credenciais associadas ao rascunho. O arquivo não foi importado nem ativado na instância.

## Falhas e limites

- Redis indisponível interrompe a execução antes de enviar uma resposta sem controle de contexto/deduplicação.
- Groq indisponível ou JSON inválido gera uma mensagem curta de indisponibilidade. Não usa texto livre da IA como dados de catálogo.
- API ausente, revogada, suspensa ou com erro não gera uma oferta inventada.
- Envios Evolution não têm repetição automática: um timeout pode ocorrer depois de o WhatsApp aceitar a mensagem. Confira a execução/recibo antes de reenviar, para evitar duplicatas.
- Falha de envio não salva o novo estado comercial. A cópia da resposta pendente fica no Redis por 24 horas. Não há recuperação automática de fila neste rascunho.
- Há uma janela de concorrência entre conferir a revisão e enviar. A revisão reduz respostas ultrapassadas, mas não garante ordenação perfeita ou entrega “exatamente uma vez”.
- Áudio e outros anexos sem texto recebem pedido para escrever a pergunta; transcrição não foi implementada.
- A API 1.1 informa a cobertura de até 5.000 materiais publicados por loja. O rascunho pede 20 resultados por lista e apresenta três opções. Seleções e compras consultam o produto novamente por ID, sem repetir a busca anterior, e mostram as categorias, níveis de ensino e temas cadastrados. Clubes, combos, navegação por páginas e sugestões aproximadas ainda não foram incorporados ao diálogo deste rascunho. Consulte `ops/API-ATENDENTE-LOJISTA.md` para o contrato completo dos filtros e facetas.
- Execuções automáticas não salvam payloads completos no histórico do n8n. Recibos com falha e contexto no Redis ainda contêm dados de atendimento e precisam seguir sua política de retenção.

## Validação local realizada

`node workflows/whatsapp-loja/build.mjs`
`node workflows/whatsapp-loja/test.mjs`

Passaram os testes de entrada, isolamento por instância/telefone, exclusão de grupos/mensagens próprias, LID, preço atualizado, licença PLR, links externos recusados, produto inexistente, JSON inválido, falha da API, pausa humana, sintaxe dos nós/expressões e referências do grafo. Os produtos de teste são fixtures locais; nada foi inserido no catálogo, nenhuma mensagem foi enviada e nenhuma credencial foi exportada.

Referências: [HTTP Request no n8n](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/), [Redis no n8n](https://github.com/n8n-io/n8n/blob/master/packages/nodes-base/nodes/Redis/Redis.node.ts), [Groq JSON mode](https://console.groq.com/docs/structured-outputs), [MCP oficial do n8n](https://docs.n8n.io/connect/connect-to-n8n-mcp-server/). O contrato da API da loja foi conferido no código `src/app/api/integrations/store-chatbot/route.ts`.
