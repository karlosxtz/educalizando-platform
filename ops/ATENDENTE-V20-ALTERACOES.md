# Atendente V20 — conversa natural, busca flexível e fotos corrigidas

Workflow: https://n8n.vps11334.panel.icontainer.net/workflow/0YJiXWKAq3Jng4on

Revisão publicada em 12/10/2026, com 55 nós.

## Correções

- Confirmado no sandbox do n8n: URL não existe. A validação antiga apagava capas e links. A nova validação HTTPS preserva imagens e limita compras às rotas oficiais da loja.
- A IA agora escreve a conversa e os resumos usando fatos do catálogo. Saudações não abrem catálogo automaticamente.
- Filtros toleram acentos, abreviações e pequenas diferenças: educaçao especial, ed especial, inclusão e alfabetizaçao foram testados.
- Mudança de categoria limpa tema, disciplina, habilidade, data e resultados antigos quando não reafirmados no novo pedido.
- A memória antiga migra uma vez para v21, preservando nome e compras. Prefixos Redis e comandos permanecem.
- Curadoria prioriza título e descrição, além da categoria. Alfabetização deve corresponder a letras, sílabas, leitura ou escrita.
- Até dois materiais por resposta, cada um com capa disponível, título, resumo curto, preço atual e link oficial. Detalhes pedagógicos, preço original, prévia, vídeo e PLR aparecem conforme o pedido.
- Não se exige responder opção 1. Seleção por nome e referência contextual continuam disponíveis.
- Preços e links são montados com os valores reais da API, fora da redação livre da IA; IDs são validados. Escolha/compra reconsulta o produto.
- Categoria, nível, tema, calendário/mês, formato, preço, licença, gratuitos, ordenação, clubes, combos, facetas e paginação permanecem disponíveis, conforme os dados cadastrados.
- Webhook, credenciais, Evolution, Redis, áudio, Gemini, Groq de reserva do planejador, agrupamento e encaminhamento humano foram preservados.

## Validação

- Testes locais da lógica e dos corpos exatos dos Code nodes passaram, inclusive ambiente sem URL.
- Exportação da versão aplicada: parâmetros, credenciais e conexões dos 55 nós conferem. Os testes temporários foram removidos.
- Teste isolado no n8n preservou capa e link com URLGlobal undefined.
- Gemini real respondeu a opa bom dia com uma saudação, mesmo com histórico de sílabas.
- Gemini real selecionou dois materiais de sílabas para alfabetização, com resumos relevantes, em vez do material de emoções mostrado na reclamação.
- API real validada para categoria/sílabas, tema, PLR/preço, gratuitos, combos, clubes, facetas e escolha por ID.
- Nenhuma mensagem de teste foi enviada a clientes. O recebimento da imagem pelo WhatsApp ainda precisa ser confirmado em conversa real.

## Arquivos

- workflows/whatsapp-loja/v20-conversation.mjs
- workflows/whatsapp-loja/patch-v20.mjs
- workflows/whatsapp-loja/test-v20.mjs
- workflows/whatsapp-loja/ATENDENTE-EDUCALIZANDO-V20-ATUALIZADO-template.json: referência inativa sem chave da loja.

Backups privados com credenciais estão na pasta local ignorada .cloudflare. Não compartilhar ou publicar.
