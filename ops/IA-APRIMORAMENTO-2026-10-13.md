# Aprimoramento da IA de Marketing — 13/10/2026

## Experiência e qualidade
- Opções de estilo: natural e acolhedor, direto e objetivo, detalhado e explicativo.
- Orientação editorial opcional de até 600 caracteres, usada para tom, ênfase e organização, sem virar fonte de fatos. Aplicada ao editor, divulgação e campanha simples.
- Títulos curtos deixam de receber automaticamente o sufixo genérico Material Pedagógico no editor individual.
- Status de geração com tempo decorrido e cancelamento da espera; disponível também na janela de otimização.
- Resultados existentes permanecem quando uma nova tentativa falha. A nova resposta só os substitui após validação. Não é persistência após recarregar ou fechar o navegador.
- Testar conexão: chamada real curta com a chave existente da loja, solicitada explicitamente pelo botão. Exibe provedor e latência medida daquele teste. Não substitui uma chave nem altera produtos; protegido por propriedade da loja e limite de três testes/minuto. Ausência de chave tem erro específico.

## Preservação dos materiais
- Cada proposta registra produto de origem e updated_at da fonte. O editor salva pelo produto vinculado à proposta, independentemente do seletor da página.
- Seletor e novas gerações bloqueados enquanto a operação está em curso; retornos de pedidos cancelados são ignorados.
- Salvamento editorial faz conferência prévia e condição de versão no UPDATE do banco. Uma edição concorrente retorna 409; não sobrescreve silenciosamente dados mais recentes. O lote continua não transacional e retorna updatedIds se houver conflito durante um salvamento parcial.
- Correção de classificação: categoria e nível são consultados separadamente, preservando seus IDs cadastrados. Preço, slug e arquivos ficam fora dos campos editoriais.
- Cliente trata cancelamento separadamente de erro. O prazo também vale quando a autenticação fica pendente, com Promise.race, e não apenas para fetch.
- Stories exigem três textos válidos; roteiro valida listas de texto antes de renderizar; campanha completa confere dias consecutivos de 1 a 7 e conteúdo de cada dia.

## Assistente
- Recebe o ID do produto selecionado; esse produto e este material se referem ao contexto escolhido. Perguntas explicitamente sobre outro título ou sobre a loja continuam respeitadas.
- Busca de contexto usa título, tags, temas, descrição e histórico, dando mais peso à pergunta atual. Até quatro cadastros completos, com estatísticas do produto selecionado mesmo que esteja fora dos primeiros 40 do resumo.
- Apenas materiais publicados da loja autenticada podem virar foco. IDs de outra loja são recusados.

## Validação
- test:ai-reliability inclui testes de cancelamento e prazo com autenticação pendente, proteção SQL contra edição concorrente, escolha de contexto, instruções limitadas, diagnóstico sem expor chave, recusa sem autenticação e bloqueio por limite sem chamar provedor.
- test:marketing-grounding, test:source-size, typecheck:vinext e ESLint nos arquivos alterados.
- Provedores simulados nos testes; nenhuma chamada real com a chave do lojista foi realizada durante o desenvolvimento. O botão permite ao proprietário validar a conexão em produção.

Cancelamento interrompe a espera do navegador e descarta resposta atrasada. Não garante cancelamento ou estorno no provedor caso ele já tenha iniciado a geração. Nenhum modelo, plano ou chave foi trocado. Limites externos e CPU da Cloudflare Free permanecem aplicáveis.

## Publicação
Publicação concluída em 13/10/2026: versão Cloudflare 139852c0-d44c-49fd-bd1b-0b755a234601. Vite build e Wrangler dry-run concluídos; typecheck e lint passaram, assim como os testes de estabilidade, fidelidade, concorrência e tamanho.

Verificação HTTP: homepage e login 200 com HTML completo; dashboard/ia sem sessão redireciona ao login; health, product-tools e seo-apply sem sessão retornam 401 JSON. Geração autenticada com chave real e validação visual do painel conectado não realizadas neste ciclo.
