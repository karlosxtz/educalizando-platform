# Proteção dos salvamentos — 12/10/2026

## Correções desta rodada

- Clubes: novos clubes começam em rascunho. A publicação e os dados de apresentação são gravados após salvar o acervo.
- Troca de acervo: novos vínculos usam upsert pela chave existente; os vínculos removidos são excluídos somente após a gravação. Uma falha de inserção preserva os materiais e a apresentação anteriores.
- Criação de clubes: identificador persistido no navegador permite retomar a mesma criação após falha, sem criar outro clube. A consulta é limitada à loja do criador.
- Produtos: publicação de um rascunho editado ocorre após salvar entregas, galeria e BNCC.
- Edição: o servidor aceita somente os campos editáveis; identidade, datas de criação, contadores, exclusão e indicadores de entrega enviados pelo navegador são ignorados. Os indicadores de entrega continuam derivados pelo servidor.
- Listas de arquivos, galeria e BNCC malformadas são rejeitadas antes de qualquer escrita, evitando interpretar dados inválidos como exclusão.
- Remover todos os arquivos finais de um produto publicado é rejeitado. Para removê-los, é necessário manter o produto como rascunho.
- Galeria: novas imagens são inseridas antes de excluir as anteriores, com identificadores explícitos. BNCC usa upsert e exclui apenas habilidades retiradas.
- Falhas na galeria e BNCC não são mais ocultadas como sucesso pela API.
- Uma resposta de rede perdida ao criar produto aciona verificação do produto e entregas privadas pela sessão do próprio usuário. Sucesso só é confirmado quando a verificação encontra os dados esperados.
- Bloqueio ou falta de espaço no armazenamento do navegador não impede a criação; há proteção de repetição em memória. Cache local não invalida um salvamento confirmado.
- Contagens de acervo e vendas na gestão de clubes são agrupadas em uma passagem, eliminando filtros repetidos por clube.
- JSON inválido recebe erro 400 nos salvamentos, em vez de erro interno genérico.

## Verificações

- `npm run test:verify`: 22 grupos da suíte geral.
- `npm run test:uploads`: 6 grupos, incluindo falhas simuladas de banco, rede e armazenamento local; isolamento de loja; publicação após entrega; preservação de acervo, galeria e BNCC.
- `npm run typecheck:vinext`: verificação estrita do código da aplicação.
- ESLint dos arquivos alterados.
- Compilação de produção e validação do pacote de deploy.
- Todas as verificações acima passaram. ESLint dos arquivos alterados não apresentou erros nem avisos.
- Deploy confirmado: `b430cc10-7783-4cee-bfbb-3433386ee2ce`.
- Após o deploy, homepage, busca, login, Loja da Prô, página do clube e sitemap retornaram HTTP 200 com conteúdo completo.
- Os testes de salvamento desta rodada simularam falhas contra o código real; não foram feitos cadastros ou pagamentos reais em produção.

## Limitações que continuam exigindo trabalho

Os salvamentos ainda usam múltiplas operações no banco, não uma transação única. Uma interrupção entre etapas pode deixar um rascunho incompleto ou uma edição parcialmente aplicada. As proteções reduzem perda e duplicação, mas não substituem funções transacionais no PostgreSQL. Não foram aplicadas migrations nem alterados registros existentes nesta rodada.

Não foram excluídos produtos duplicados, feitas cobranças ou alteradas assinaturas. Antes de limpar duplicados, é necessário conferir arquivos privados e vendas com acesso autorizado ao banco.

O limite de CPU do Workers Free continua o mesmo. Não houve contratação de plano, migração para VPS ou alteração de infraestrutura. Também permanece o alerta da dependência de build `braces`, sem versão corrigida confirmada na revisão anterior.

Não é possível prometer que uma plataforma nunca terá erros. Esta revisão cobre os cenários testados e os problemas identificados nos salvamentos.
