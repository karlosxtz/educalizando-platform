# Estabilidade do módulo de IA — 13/10/2026

## Correções
- Google, Groq e OpenRouter usam saída JSON nas ferramentas estruturadas. Mantidos os provedores e modelos já utilizados; nenhuma chave foi substituída.
- Timeout de 45 segundos na geração, incluindo leitura do corpo; timeout de 65 segundos no cliente, incluindo autenticação e leitura. A espera de rede não é tempo de CPU da Cloudflare.
- Removida a segunda tentativa indiscriminada no OpenRouter: 429, autenticação e indisponibilidade não disparam nova solicitação. Mantida a alternativa gratuita somente após recusa por falta de créditos (402), dentro do mesmo prazo total. Limite de solicitações, créditos, autenticação, resposta vazia, bloqueio e truncamento têm mensagens distintas.
- Groq utiliza reasoning_effort low; Gemini 2.5 Flash thinkingBudget 0 para revisão editorial. Respostas de raciocínio não são exibidas como texto final.
- O editor não abre uma proposta com os dados antigos quando a IA entrega JSON inválido ou faltam título/descrição.
- Campanhas e otimização recebem JSON e validam campos; o retorno de campanha e SSE do combo mantêm compatibilidade com os consumidores existentes.
- Fonte completa do material enviada uma vez ao editor, sem duplicar descrição e listas de categorias. Três títulos, descrição principal e uma alternativa; cadastro factual preservado.
- Auditoria gera textos para até três materiais prioritários por consulta, informa essa abrangência e mantém a revisão local dos demais. Sugestões locais são identificadas; apenas propostas geradas ficam pré-selecionadas.
- Assistente recebe quatro cadastros completos relevantes à pergunta e resumo de até 40 produtos. Informa total do catálogo e identifica como amostra, sem fingir análise detalhada de todo produto.
- Campanha completa valida canais e plano de sete dias antes de criar links.
- Removida digitação artificial após a resposta: o chat entrega o texto completo assim que chega. Análise local de reserva é identificada com aviso.
- Telas de IA, produtos, cadastro, combos e modal usam o mesmo cliente autenticado, renovação em 401 e tradução dos erros de gateway.
- Bloqueio de novas gerações nos botões enquanto há geração em curso; estados liberados também após erros.

## Verificação
- npm run test:ai-reliability: três provedores simulados, modos JSON, limites de espera na rede e no corpo, 401/402/429/503, recusa/vazio/truncamento, parser com aspas/chaves, gateway HTML. Não usa chaves reais nem consome créditos.
- npm run test:marketing-grounding: fatos completos, escolaridade múltipla, PLR separado, campos pedagógicos preservados, quantidades inventadas rejeitadas e erro explícito sem falsa proposta.
- npm run typecheck:vinext, ESLint nos arquivos alterados e test:source-size.

## Limites
Não comprova latência ou disponibilidade dos provedores reais. Quotas externas, créditos e CPU do Workers Free continuam sujeitos aos limites das contas. Não há promessa de ausência de falhas nem treinamento automático. Produtos existentes não foram alterados pela publicação.

Documentação de parâmetros consultada: https://console.groq.com/docs/api-reference ; https://console.groq.com/docs/model/openai/gpt-oss-20b ; https://ai.google.dev/gemini-api/docs/generate-content/thinking ; https://openrouter.ai/docs/api_reference/parameters .

## Publicação e conferência
Publicado na Cloudflare em 13/10/2026, versão 5de6b986-4ef9-4ba1-9957-f2f990244a9e. Compilação Vite concluída; dry-run Wrangler validado fora do sandbox devido ao bloqueio de leitura do diretório. Typecheck, lint, testes de estabilidade, fidelidade e tamanho passaram.

Conferência HTTP após publicação: homepage e login retornaram 200 com HTML completo; dashboard/ia sem sessão levou ao login; POST sem sessão em product-tools e optimize retornou 401 JSON. Não foi feita uma geração autenticada com a chave da loja; tempos dos provedores reais não foram medidos.
