# IA de marketing: escrita natural baseada no cadastro

## Alterações

Uma política editorial compartilhada orienta SEO, descrições, campanhas, preenchimento de cadastro e Agente Eduardo. Ela exige escrita natural em português brasileiro, detalhes concretos, preservação do significado e dos exemplos da descrição original, sem bordões, entusiasmo artificial, escassez inventada ou promessas garantidas.

As informações ausentes devem permanecer ausentes no texto de venda. A análise para o criador pode apontar o que falta preencher. Roteiros e adaptações devem identificar sugestões opcionais do professor, sem apresentá-las como conteúdo incluído no arquivo.

As ferramentas individuais e auditorias recebem a descrição completa e dados reais de páginas, tipo, cores, formato, faixa etária, categorias, todos os níveis selecionados, tags e temas. Na campanha simples, o servidor busca o produto pelo identificador e pela loja autorizada; o título isolado deixou de ser a fonte da campanha. No Agente Eduardo, o panorama de desempenho continua disponível e foram acrescentadas fontes textuais de até 12 cadastros para orientar respostas sobre conteúdo; produtos fora dessa seleção exigem a ferramenta individual para revisão completa.

Descrições do produto final e da licença PLR são separadas. Uma descrição PLR ausente não é silenciosamente substituída por uma descrição de uso final. Não são presumidos direitos ilimitados de revenda ou edição.

Foram retirados os fallbacks que acrescentavam frases genéricas de aprendizagem, sala de aula e praticidade e a escolha automática de uma escolaridade padrão. As respostas geradas não podem substituir automaticamente idade, formato, classificação ou temas conhecidos por suposições. No novo cadastro, a IA recebe também os dados já preenchidos e preserva tipo, classificações, temas, faixa e formato.

Existe uma verificação determinística adicional para quantidades numéricas de páginas, atividades, arquivos, fichas, cartas, tabuleiros e jogos. Quantidades que não aparecem na fonte são rejeitadas antes de devolver a proposta de venda. A auditoria mantém os textos originais quando essa verificação falha. Essa checagem não substitui a revisão semântica de todas as frases, números escritos por extenso ou benefícios subjetivos.

A otimização antiga passou a usar a descrição enviada, que antes era ignorada. Também foi corrigida a diferença de resposta entre o modal (JSON) e o cadastro de combos (event stream). Os dois agora recebem saída validada por meio do provedor de IA já configurado.

## Validação

`npm run test:marketing-grounding` executa cenários com respostas simuladas contra os handlers reais: descrição completa, múltiplos níveis, exclusão de URLs privadas, separação final/PLR, preservação de metadados, fallback sem benefícios novos, bloqueio de quantidades inventadas, otimização com descrição e campanha carregada do produto da loja.

Verificações de tipos, lint e tamanho de fonte passaram. Não foram alterados produtos existentes nem executadas gerações pagas com as chaves reais durante os testes. As alterações afetam as próximas gerações; propostas antigas não são reescritas automaticamente.

Não há treinamento automático do modelo ou alteração dos arquivos pedagógicos. Melhorar o cadastro fornece uma base factual melhor para a próxima geração. As sugestões continuam sujeitas à revisão do criador antes de serem aplicadas.

Publicação confirmada: `d59d74bc-4524-4110-bd49-a7eb3659f80f`. Homepage, busca, login, loja, clube e sitemap retornaram HTTP 200 com conteúdo completo após o deploy.
