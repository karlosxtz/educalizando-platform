# SEO de marca e indexação pública — 16/10/2026

## Resultado e limites

Implementação técnica para fortalecer a marca Educalizando e a descoberta de lojas e produtos. Nenhuma posição no Google é garantida pelo código. A grafia alternativa educaizando aparece uma vez no conteúdo visível da FAQ, como esclarecimento do nome oficial.

- Domínio fixo https://www.educalizando.com.br, metadataBase e canonical por página. Hosts alternativos de hospedagem redirecionam a navegação com 301, preservando caminho e consulta.
- Home com título iniciado pela marca, H1 único, proposta de valor real, links de catálogo/lojas e FAQ renderizados no servidor.
- Organization com logo da marca e redes já cadastradas; WebSite e FAQPage coerentes com conteúdo visível.
- Product/Offer com preço, licença e vendedor reais. AggregateRating usa todas as avaliações aprovadas, paginadas, e é omitido quando não há dados válidos.
- Removida a nota 5.0 fixa do card de loja.
- Produtos e lojas têm canonical próprio; vitrines de afiliados conservam as permissões públicas existentes.
- A auditoria integral encontrou cadastros repetidos e lojas homônimas. Metadados diferenciam essas ocorrências com referência abreviada do ID real do produto ou handle da loja. Títulos e descrições do cadastro, slugs, preços e arquivos permanecem intactos.
- sitemap.ts consulta o catálogo público sob RLS, incluindo lojas visíveis, produtos publicados/não excluídos, combos, clubes, blog e páginas editoriais. Não cria uma coluna de status inexistente para lojas.
- robots.ts bloqueia áreas privadas e checkout, preservando acesso às imagens públicas. Dashboard, admin, login e checkout usam metadata privada no servidor; área do aluno já tinha metadata privada.
- next/font/local com Geist WOFF2 e licença OFL. next/image conserva os URLs/caches do MinIO com unoptimized, evitando recolocar transformação de imagens por requisição no Worker gratuito.
- Validação antes do streaming resolve o 200 indevido das telas de não encontrado: ausência confirmada retorna 404, falha do banco retorna 503 com Retry-After.
- Sem migrations, edição de produtos reais, alteração de RLS, preços, isolamento, processamento Asaas ou contratos de webhooks.

## Verificações

- Auditoria HTTP local em http://127.0.0.1:3004: 672 páginas verificadas; sitemap com 672 URLs; 0 falhas registradas.
- robots.txt e sitemap.xml com respostas 200 e URLs do domínio canônico; páginas inexistentes de produto, loja e blog com 404.
- Login, entrada e login do aluno com noindex, nofollow; uma única H1 na home e schemas Organization/WebSite/FAQPage presentes.
- Testes de regressão: títulos/descrições, links final/PLR, agregação aprovada acima de mil avaliações, sitemap acima de mil registros, rascunhos/excluídos/loja invisível, 301 e preservação de POST de integração no guard do Worker.
- Lint: zero erros; 17 avisos preexistentes. Checagem TypeScript, tamanho de fonte, HTML público e build de produção Cloudflare/dry-run passaram.
- Sitemap revalida a cada 300 segundos; documentos públicos conservam o cache existente. XML tem limite padrão de 50 mil URLs; o código rejeita excesso em vez de cortar silenciosamente, devendo ser particionado quando o catálogo atingir esse porte.
- FAQPage não promete destaque de FAQ no Google. Referência: https://developers.google.com/search/docs/appearance/structured-data/faqpage .

## Rota → título e descrição

| Rota | Title | Description |
|---|---|---|
| / | Educalizando: plataforma de materiais didáticos | Na Educalizando, encontre atividades, apostilas e jogos pedagógicos digitais. Conheça lojas de educadores ou crie sua loja de materiais didáticos. |
| /afiliados | Programa de afiliados \| Educalizando | Divulgue materiais didáticos digitais em sua vitrine e acompanhe suas indicações na Educalizando. |
| /ajuda | Central de ajuda para compradores e criadores \| Educalizando | Na central de ajuda Educalizando, tire dúvidas sobre compras, acesso aos materiais e vendas. Encontre orientações para usar a plataforma. Acesse! |
| /atividades-alfabetizacao | Atividades de alfabetização para imprimir e usar em sala \|… | Explore atividades de alfabetização, leitura, escrita, letras e sílabas para tornar o aprendizado mais significativo e divertido. |
| /atividades-ensino-fundamental | Atividades ensino fundamental para imprimir \| Educalizando | Encontre atividades ensino fundamental para imprimir por ano e disciplina. Apoie seu planejamento com recursos pedagógicos e explore as opções! |
| /atividades-para-imprimir | Atividades pedagógicas para imprimir grátis \| Educalizando | Busque atividades pedagógicas para imprimir grátis e opções pagas por tema. Confira formatos e licenças, organize suas aulas e explore o catálogo! |
| /atividades-por-ano | Materiais por ano escolar e etapa de ensino \| Educalizando | Encontre materiais didáticos por ano escolar, da Educação Infantil ao Ensino Médio, com recursos para diferentes etapas de ensino. |
| /atividades-por-ano/educacao-infantil | Atividades para Educação Infantil para Imprimir \|… | Encontre os melhores materiais didáticos, apostilas e atividades prontas para Educação Infantil. Alinhados à BNCC e desenvolvidos por especialistas para… |
| /atividades-por-ano/ensino-fundamental-1 | Atividades do 1º ao 5º ano para imprimir \| Educalizando | Explore atividades do 1º ao 5º ano do ensino fundamental para leitura, escrita e matemática. Apoie o planejamento com a BNCC e encontre recursos! |
| /atividades-por-ano/ensino-fundamental-2 | Atividades do 6º ao 9º ano para imprimir \| Educalizando | Encontre atividades do 6º ao 9º ano do ensino fundamental por disciplina. Planeje aulas considerando a BNCC e explore materiais para sua turma! |
| /atividades-por-ano/ensino-medio | Atividades ensino médio, ENEM e BNCC \| Educalizando | Busque atividades para ensino médio, ENEM e BNCC por área de conhecimento. Apoie aulas, revisões e avaliações com recursos digitais. Veja as opções! |
| /atividades-por-ano/ensino-superior-pos | Atividades para Ensino Superior & Pós para Imprimir \|… | Encontre os melhores materiais didáticos, apostilas e atividades prontas para Ensino Superior & Pós. Alinhados à BNCC e desenvolvidos por especialistas… |
| /atividades-por-ano/idiomas-cursos-livres | Atividades para Idiomas & Cursos Livres para Imprimir \|… | Encontre os melhores materiais didáticos, apostilas e atividades prontas para Idiomas & Cursos Livres. Alinhados à BNCC e desenvolvidos por especialistas… |
| /atividades-por-ano/pre-vestibular-enem | Materiais de estudo pré-vestibular e ENEM \| Educalizando | Encontre materiais de estudo pré-vestibular e ENEM para organizar revisões e praticar conteúdos. Explore apostilas e recursos para sua preparação! |
| /blog | Blog Educalizando \| Ideias e Guias Pedagógicos | Guias pedagógicos, ideias de atividades e estratégias para educadores aproveitarem melhor seus materiais didáticos. |
| /buscar | Atividades pedagógicas para baixar \| Educalizando | Busque atividades pedagógicas para baixar, apostilas e planos de aula por tema ou ano escolar. Encontre recursos para sua turma e explore o catálogo! |
| /calendario | Calendário escolar e datas comemorativas \| Educalizando | Planeje aulas com datas temáticas e encontre materiais do catálogo Educalizando por tema. |
| /calendario/abolicao-da-escravidao | 13 de Maio – Abolição da Escravidão: atividades e ideias… | Data para trabalhar criticamente a abolição, seus limites históricos, o protagonismo negro, a resistência e a cultura afro-brasileira. Veja ideias… |
| /calendario/dia-da-arvore | Dia da Árvore: atividades e ideias para aulas \| Educalizando | Tema disponível para projetos pedagógicos sobre natureza e preservação. Veja ideias pedagógicas para trabalhar o tema em 21 de setembro. |
| /calendario/dia-da-bandeira | Dia da Bandeira: atividades e ideias para aulas \|… | Tema disponível para organizar pesquisas e materiais relacionados a símbolos nacionais. Veja ideias pedagógicas para trabalhar o tema em 19 de novembro. |
| /calendario/dia-da-consciencia-negra | Dia da Consciência Negra: atividades e ideias para aulas \|… | Tema disponível para encontrar materiais relacionados à educação e cultura afro-brasileira. Veja ideias pedagógicas para trabalhar o tema em 20 de… |
| /calendario/dia-da-escola | Dia da Escola: atividades e ideias para aulas \| Educalizando | Tema de planejamento escolar disponível para explorar no catálogo. Veja ideias pedagógicas para trabalhar o tema em 15 de março. |
| /calendario/dia-da-reforma-protestante | 31 de outubro – Dia da Reforma Protestante: atividades e… | Tema disponível para materiais educativos sobre a Reforma Protestante, sua história e seus impactos culturais e religiosos. Veja ideias pedagógicas para… |
| /calendario/dia-da-terra | Dia da Terra: atividades e ideias para aulas \| Educalizando | Tema de planejamento para projetos sobre natureza, ambiente e sustentabilidade. Veja ideias pedagógicas para trabalhar o tema em 22 de abril. |
| /calendario/dia-das-criancas | Dia das Crianças: atividades e ideias para aulas \|… | Tema disponível para propostas lúdicas e atividades voltadas à infância. Veja ideias pedagógicas para trabalhar o tema em 12 de outubro. |
| /calendario/dia-do-folclore | Dia do Folclore: atividades e ideias para aulas \|… | Tema disponível para descobrir materiais ligados à cultura popular brasileira. Veja ideias pedagógicas para trabalhar o tema em 22 de agosto. |
| /calendario/dia-do-livro-infantil | Dia do Livro Infantil: atividades e ideias para aulas \|… | Tema disponível para apoiar propostas de leitura e literatura infantil. Veja ideias pedagógicas para trabalhar o tema em 18 de abril. |
| /calendario/dia-do-trabalho | Dia do Trabalho: atividades e ideias para aulas \|… | Tema disponível para pesquisas e atividades adequadas ao contexto escolar. Veja ideias pedagógicas para trabalhar o tema em 1 de maio. |
| /calendario/dia-do-transito | Dia do Trânsito: atividades e ideias para aulas \|… | Tema de planejamento para materiais sobre convivência e segurança no trânsito. Veja ideias pedagógicas para trabalhar o tema em 25 de setembro. |
| /calendario/dia-dos-povos-indigenas | Dia dos Povos Indígenas: atividades e ideias para aulas \|… | Tema disponível para organizar pesquisas e materiais pedagógicos relacionados. Veja ideias pedagógicas para trabalhar o tema em 19 de abril. |
| /calendario/dia-dos-professores | Dia dos Professores: atividades e ideias para aulas \|… | Tema disponível para reconhecer o trabalho docente em projetos pedagógicos. Veja ideias pedagógicas para trabalhar o tema em 15 de outubro. |
| /calendario/dia-internacional-da-mulher | Dia Internacional da Mulher: atividades e ideias para… | Tema disponível para apoiar planejamentos e propostas pedagógicas relacionadas à data. Veja ideias pedagógicas para trabalhar o tema em 8 de março. |
| /calendario/dia-mundial-da-agua | Dia Mundial da Água: atividades e ideias para aulas \|… | Tema disponível para localizar materiais e propostas relacionadas à água. Veja ideias pedagógicas para trabalhar o tema em 22 de março. |
| /calendario/dia-mundial-da-saude | Dia Mundial da Saúde: atividades e ideias para aulas \|… | Tema de planejamento para encontrar materiais voltados ao cuidado e bem-estar. Veja ideias pedagógicas para trabalhar o tema em 7 de abril. |
| /calendario/festa-junina | Festa Junina: atividades e ideias para aulas \| Educalizando | Tema cultural disponível para localizar materiais de planejamento para o período junino. Veja ideias pedagógicas para trabalhar o tema em 24 de junho. |
| /calendario/independencia-do-brasil | Independência do Brasil: atividades e ideias para aulas \|… | Tema disponível para apoiar pesquisas e atividades escolares relacionadas. Veja ideias pedagógicas para trabalhar o tema em 7 de setembro. |
| /calendario/meio-ambiente | Meio Ambiente: atividades e ideias para aulas \| Educalizando | Tema de planejamento para encontrar recursos sobre cuidado e meio ambiente. Veja ideias pedagógicas para trabalhar o tema em 5 de junho. |
| /calendario/natal | Natal: atividades e ideias para aulas \| Educalizando | Tema disponível para planejamentos e materiais de encerramento do ano. Veja ideias pedagógicas para trabalhar o tema em 25 de dezembro. |
| /calendario/primavera | Primavera: atividades e ideias para aulas \| Educalizando | Tema de planejamento para propostas sobre ciclos da natureza, observação e cuidado com o ambiente. Veja ideias pedagógicas para trabalhar o tema em 22 de… |
| /calendario/proclamacao-da-republica | Proclamação da República: atividades e ideias para aulas \|… | Tema disponível para pesquisas e propostas pedagógicas relacionadas à história do Brasil. Veja ideias pedagógicas para trabalhar o tema em 15 de novembro. |
| /categorias/aep-abordagem-educacional-por-principios | Atividades e materiais de AEP (Abordagem Edu… \| Educalizando | Explore atividades e materiais didáticos de AEP (Abordagem Educacional por Princípios). Confira o conteúdo, o formato e o público indicado de cada… |
| /categorias/alfabetizacao | Atividades e materiais de Alfabetização \| Educalizando | Explore atividades e materiais didáticos de Alfabetização. Confira o conteúdo, o formato e o público indicado de cada recurso para escolher o que sua… |
| /categorias/artes | Atividades e materiais de Artes \| Educalizando | Explore atividades e materiais didáticos de Artes. Confira o conteúdo, o formato e o público indicado de cada recurso para escolher o que sua turma… |
| /categorias/atividades-ludicas | Atividades e materiais de Atividades Lúdicas \| Educalizando | Explore atividades e materiais didáticos de Atividades Lúdicas. Confira o conteúdo, o formato e o público indicado de cada recurso para escolher o que… |
| /categorias/avaliacoes-simulados | Atividades e materiais de Avaliações e Simul… \| Educalizando | Explore atividades e materiais didáticos de Avaliações e Simulados. Confira o conteúdo, o formato e o público indicado de cada recurso para escolher o… |
| /categorias/bercario | Atividades e materiais de Berçário \| Educalizando | Explore atividades e materiais didáticos de Berçário. Confira o conteúdo, o formato e o público indicado de cada recurso para escolher o que sua turma… |
| /categorias/biblia-historias-biblicas | Atividades e materiais de Bíblia e Histórias… \| Educalizando | Explore atividades e materiais didáticos de Bíblia e Histórias Bíblicas. Confira o conteúdo, o formato e o público indicado de cada recurso para escolher… |
| /categorias/bncc | Atividades e materiais de BNCC \| Educalizando | Explore atividades e materiais didáticos de BNCC. Confira o conteúdo, o formato e o público indicado de cada recurso para escolher o que sua turma precisa. |
| /categorias/caligrafia | Atividades e materiais de Caligrafia \| Educalizando | Explore atividades e materiais didáticos de Caligrafia. Confira o conteúdo, o formato e o público indicado de cada recurso para escolher o que sua turma… |
| /categorias/catequese | Atividades e materiais de Catequese \| Educalizando | Explore atividades e materiais didáticos de Catequese. Confira o conteúdo, o formato e o público indicado de cada recurso para escolher o que sua turma… |
| /categorias/ciencia-e-biologia | Atividades e materiais de Ciência e Biologia \| Educalizando | Explore atividades e materiais didáticos de Ciência e Biologia. Confira o conteúdo, o formato e o público indicado de cada recurso para escolher o que… |
| /categorias/ciencias-biologia | Atividades e materiais de Ciências & Biologia \| Educalizando | Explore atividades e materiais didáticos de Ciências & Biologia. Confira o conteúdo, o formato e o público indicado de cada recurso para escolher o que… |
| /categorias/combo | Atividades e materiais de Combo \| Educalizando | Explore atividades e materiais didáticos de Combo. Confira o conteúdo, o formato e o público indicado de cada recurso para escolher o que sua turma… |
| /categorias/coordenacao-motora | Atividades e materiais de Coordenação Motora \| Educalizando | Explore atividades e materiais didáticos de Coordenação Motora. Confira o conteúdo, o formato e o público indicado de cada recurso para escolher o que… |
| /categorias/datas-comemorativas | Atividades e materiais de Datas Comemorativas \| Educalizando | Explore atividades e materiais didáticos de Datas Comemorativas. Confira o conteúdo, o formato e o público indicado de cada recurso para escolher o que… |
| /categorias/educacao-crista | Atividades e materiais de Educação Cristã \| Educalizando | Explore atividades e materiais didáticos de Educação Cristã. Confira o conteúdo, o formato e o público indicado de cada recurso para escolher o que sua… |
| /categorias/educacao-crista-classica | Atividades e materiais de Educação Cristã Cl… \| Educalizando | Explore atividades e materiais didáticos de Educação Cristã Clássica. Confira o conteúdo, o formato e o público indicado de cada recurso para escolher o… |
| /categorias/educacao-especial | Atividades e materiais de Educação Especial \| Educalizando | Explore atividades e materiais didáticos de Educação Especial. Confira o conteúdo, o formato e o público indicado de cada recurso para escolher o que sua… |
| /categorias/educacao-financeira | Atividades e materiais de Educação Financeira \| Educalizando | Explore atividades e materiais didáticos de Educação Financeira. Confira o conteúdo, o formato e o público indicado de cada recurso para escolher o que… |
| /categorias/educacao-infantil | Atividades e materiais de Educação Infantil \| Educalizando | Explore atividades e materiais didáticos de Educação Infantil. Confira o conteúdo, o formato e o público indicado de cada recurso para escolher o que sua… |
| /categorias/educacao-socioemocional | Atividades e materiais de Educação Socioemoc… \| Educalizando | Explore atividades e materiais didáticos de Educação Socioemocional. Confira o conteúdo, o formato e o público indicado de cada recurso para escolher o… |
| /categorias/eja | Atividades e materiais de Educação de Jovens… \| Educalizando | Explore atividades e materiais didáticos de Educação de Jovens e Adultos (EJA). Confira o conteúdo, o formato e o público indicado de cada recurso para… |
| /categorias/ensino-fundamental | Atividades e materiais de Ensino Fundamental \| Educalizando | Explore atividades e materiais didáticos de Ensino Fundamental. Confira o conteúdo, o formato e o público indicado de cada recurso para escolher o que… |
| /categorias/ensino-religioso | Atividades e materiais de Ensino Religioso \| Educalizando | Explore atividades e materiais didáticos de Ensino Religioso. Confira o conteúdo, o formato e o público indicado de cada recurso para escolher o que sua… |
| /categorias/escola-biblica-dominical | Atividades e materiais de Escola Bíblica Dom… \| Educalizando | Explore atividades e materiais didáticos de Escola Bíblica Dominical. Confira o conteúdo, o formato e o público indicado de cada recurso para escolher o… |
| /categorias/geografia | Atividades e materiais de Geografia \| Educalizando | Explore atividades e materiais didáticos de Geografia. Confira o conteúdo, o formato e o público indicado de cada recurso para escolher o que sua turma… |
| /categorias/historia | Atividades e materiais de História \| Educalizando | Explore atividades e materiais didáticos de História. Confira o conteúdo, o formato e o público indicado de cada recurso para escolher o que sua turma… |
| /categorias/historia-geografia | Atividades e materiais de História & Geograf… \| Educalizando | Explore atividades e materiais didáticos de História & Geografia. Confira o conteúdo, o formato e o público indicado de cada recurso para escolher o que… |
| /categorias/inclusao-acessibilidade | Atividades e materiais de Inclusão e Acessib… \| Educalizando | Explore atividades e materiais didáticos de Inclusão e Acessibilidade. Confira o conteúdo, o formato e o público indicado de cada recurso para escolher o… |
| /categorias/jogos | Atividades e materiais de Jogos \| Educalizando | Explore atividades e materiais didáticos de Jogos. Confira o conteúdo, o formato e o público indicado de cada recurso para escolher o que sua turma… |
| /categorias/matematica | Atividades e materiais de Matemática \| Educalizando | Explore atividades e materiais didáticos de Matemática. Confira o conteúdo, o formato e o público indicado de cada recurso para escolher o que sua turma… |
| /categorias/material-adaptado | Atividades e materiais de Material adaptado \| Educalizando | Explore atividades e materiais didáticos de Material adaptado. Confira o conteúdo, o formato e o público indicado de cada recurso para escolher o que sua… |
| /categorias/ministerio-infantil | Atividades e materiais de Ministério Infantil \| Educalizando | Explore atividades e materiais didáticos de Ministério Infantil. Confira o conteúdo, o formato e o público indicado de cada recurso para escolher o que… |
| /categorias/musica | Atividades e materiais de Música \| Educalizando | Explore atividades e materiais didáticos de Música. Confira o conteúdo, o formato e o público indicado de cada recurso para escolher o que sua turma… |
| /categorias/outros | Atividades e materiais de Outros \| Educalizando | Explore atividades e materiais didáticos de Outros. Confira o conteúdo, o formato e o público indicado de cada recurso para escolher o que sua turma… |
| /categorias/outros-conteudos | Atividades e materiais de Outros Conteúdos \| Educalizando | Explore atividades e materiais didáticos de Outros Conteúdos. Confira o conteúdo, o formato e o público indicado de cada recurso para escolher o que sua… |
| /categorias/planners-e-organizacao | Atividades e materiais de Planners e Organiz… \| Educalizando | Explore atividades e materiais didáticos de Planners e Organização. Confira o conteúdo, o formato e o público indicado de cada recurso para escolher o… |
| /categorias/portugues-literatura | Atividades e materiais de Português & Litera… \| Educalizando | Explore atividades e materiais didáticos de Português & Literatura. Confira o conteúdo, o formato e o público indicado de cada recurso para escolher o… |
| /categorias/psicopedagogia | Atividades e materiais de Psicopedagogia \| Educalizando | Explore atividades e materiais didáticos de Psicopedagogia. Confira o conteúdo, o formato e o público indicado de cada recurso para escolher o que sua… |
| /categorias/religioso | Atividades e materiais de Religioso \| Educalizando | Explore atividades e materiais didáticos de Religioso. Confira o conteúdo, o formato e o público indicado de cada recurso para escolher o que sua turma… |
| /categorias/vestibular-enem | Atividades e materiais de Vestibular & ENEM \| Educalizando | Explore atividades e materiais didáticos de Vestibular & ENEM. Confira o conteúdo, o formato e o público indicado de cada recurso para escolher o que sua… |
| /clube/loja-da-pro-clube-da-revenda-renda-extra-para-professoras-e1c4bb | Clube da Revenda — Renda extra para professo… \| Educalizando | Clube da Revenda — Renda extra para professoras Transforme sua paixão pela educação em uma oportunidade de renda extra! O Clube da Revenda oferece… |
| /clube/loja-da-pro-clube-loja-da-pro-717afa | Clube - Loja da Prô \| Educalizando | CLUBE DE ASSINATURA \| RECURSOS PEDAGÓGICOS Transforme sua rotina pedagógica com materiais criativos, encantadores e prontos para fazer a diferença na sua… |
| /clube/lojinha-pedagogica-da-pro-vanessa-clube-plr-pro-vanessa-da01f6 | Clube PLR - Prô Vanessa \| Educalizando | Baixíssimo custo de investimento Comprar a licença PLR de um material pronto custa uma fração minúscula, tornando o modelo ideal para quem tem pouco… |
| /educacao-infantil | Materiais para Educação Infantil: brincadeiras, rotina e… | Recursos pedagógicos para Educação Infantil com propostas lúdicas, visuais e adequadas às experiências das crianças. |
| /glossario | Glossário Pedagógico \| Educalizando | Consulte termos essenciais da educação, BNCC e materiais pedagógicos no glossário da Educalizando. |
| /glossario/aee | AEE (Atendimento Educacional Especializado) \| Glossário… | Serviço que complementa a escolarização de estudantes público-alvo da Educação Especial. |
| /glossario/alfabetizacao | Alfabetização \| Glossário Pedagógico Educalizando | Processo de apropriação da leitura e da escrita. |
| /glossario/atividade-pedagogica | Atividade pedagógica \| Glossário Pedagógico Educalizando | Proposta planejada para favorecer uma aprendizagem específica. |
| /glossario/avaliacao-diagnostica | Avaliação diagnóstica \| Glossário Pedagógico Educalizando | Levantamento do que a turma já sabe antes ou durante o ensino. |
| /glossario/bncc | BNCC (Base Nacional Comum Curricular) \| Glossário… | Documento que define aprendizagens essenciais da Educação Básica. |
| /glossario/educacao-especial | Educação Especial \| Glossário Pedagógico Educalizando | Modalidade transversal que promove acesso, participação e aprendizagem com equidade. |
| /glossario/ensino-fundamental | Ensino Fundamental \| Glossário Pedagógico Educalizando | Etapa obrigatória da Educação Básica composta por nove anos. |
| /glossario/letramento | Letramento \| Glossário Pedagógico Educalizando | Uso social da leitura e da escrita em situações reais. |
| /glossario/material-adaptado | Material adaptado \| Glossário Pedagógico Educalizando | Recurso ajustado para reduzir barreiras de acesso e participação. |
| /glossario/material-didatico-digital | Material didático digital \| Glossário Pedagógico… | Recurso pedagógico distribuído em formato eletrônico. |
| /glossario/plano-de-aula | Plano de aula \| Glossário Pedagógico Educalizando | Organização intencional de uma experiência de ensino. |
| /glossario/professor-criador | Professor criador \| Glossário Pedagógico Educalizando | Educador que transforma sua experiência em materiais pedagógicos autorais. |
| /glossario/sequencia-didatica | Sequência didática \| Glossário Pedagógico Educalizando | Conjunto articulado de aulas para desenvolver uma aprendizagem. |
| /jogos-pedagogicos | Jogos pedagógicos para aprender brincando \| Educalizando | Descubra jogos pedagógicos digitais para trabalhar leitura, escrita, matemática, raciocínio e interação em diferentes momentos da aula. |
| /kit/6bb968c2-4b86-41c0-b4c8-1a789499c076 | Combo Silábico \| Educalizando | 🌟 FICHAS DE SÍLABAS ALFABÉTICA 🌟 Um recurso lúdico, colorido e super atrativo para deixar o processo de alfabetização ainda mais divertido! 💕📚 |
| /kit/776a7499-2e18-45be-842f-55faf28ef4ef | Ofina Poetica \| Educalizando | Aventais Borboletas e Leilão de Jardim + OFICINA POÉTICA — LEILÃO DE JARDIM e 🦋 OFICINA POÉTICA — AS BORBOLETAS |
| /kit/ad928afd-f129-4283-b305-c4594a5bce14 | Combo das 4 operações \| Educalizando | Aprender as 4 operações não precisa ser chato ou cansativo! Apresentamos o nosso Combo de Apostilas das 4 Operações Matemáticas – o material perfeito… |
| /loja/arquivos-da-pro | Arquivos da Prô \| Materiais Didáticos \| Educalizando | Arquivos da Prô: 1 materiais didáticos em Datas Comemorativas. Encontre recursos digitais para apoiar suas aulas e o planejamento. Explore a loja! |
| /loja/atividade-criativa | ATIVIDADE CRIATIVA \| Materiais Didáticos \| Educalizando | ATIVIDADE CRIATIVA: 0 materiais didáticos em educação. Encontre recursos digitais para apoiar o planejamento das aulas da sua turma. Explore a loja! |
| /loja/bau-das-atividades | Baú das Atividades \| Materiais Didáticos \| Educalizando | Baú das Atividades: 1 materiais didáticos em Alfabetização. Encontre recursos digitais para apoiar o planejamento das aulas da sua turma. Explore a loja! |
| /loja/bau-do-professor | Baú do professor \| Materiais Didáticos \| Educalizando | Baú do professor: 12 materiais didáticos em educação. Encontre recursos digitais para apoiar o planejamento das aulas da sua turma. Explore a loja! |
| /loja/bau-pedagogico | Baú Pedagógico \| Materiais Didáticos \| Educalizando | Baú Pedagógico: 0 materiais didáticos em educação. Encontre recursos para professores planejarem aulas e apoiarem a aprendizagem da turma. Explore a loja! |
| /loja/buscandosaber | Buscando Saber \| Materiais Didáticos \| Educalizando | Buscando Saber: 27 materiais didáticos em Atividades Lúdicas. Encontre recursos digitais para apoiar o planejamento das aulas da sua turma. Explore a loja! |
| /loja/coisas-de-prof | Coisas de Prof \| Materiais Didáticos \| Educalizando | Coisas de Prof: 5 materiais didáticos em Artes. Encontre recursos para professores planejarem aulas e apoiarem a aprendizagem da turma. Explore a loja! |
| /loja/colore-pedagogica | Colorê Pedagógica. \| Materiais Didáticos \| Educalizando | Colorê Pedagógica.: 2 materiais didáticos em educação. Encontre recursos digitais para apoiar o planejamento das aulas da sua turma. Explore a loja! |
| /loja/digitaledujoycelemos | digitaledujoycelemos \| Materiais Didáticos \| Educalizando | digitaledujoycelemos: 10 materiais didáticos em Alfabetização. Encontre recursos digitais para apoiar suas aulas e o planejamento. Explore a loja! |
| /loja/doce-aprender-pedagogico-plr | DOCE APREND…AGOGICO PLR \| Materiais Didáticos \| Educalizando | DOCE APRENDER PEDAGOGICO PLR: 0 materiais didáticos em educação. Encontre recursos digitais para apoiar suas aulas e o planejamento. Explore a loja! |
| /loja/educacao-ludica | Educação Lúdica \| @educacao-ludica | @educacao-ludica — Educação Lúdica: 0 materiais didáticos em educação. Encontre recursos digitais para apoiar suas aulas e o planejamento. Explore a loja! |
| /loja/educacao-ludica-nzur | Educação Lúdica \| @educacao-ludica-nzur | @educacao-ludica-nzur — Educação L…: 0 materiais didáticos em educação. Encontre recursos digitais para apoiar suas aulas e o planejamento. Explore a loja! |
| /loja/educarose | EDUCAROSE \| Materiais Didáticos \| Educalizando | EDUCAROSE: 18 materiais didáticos em Alfabetização. Encontre recursos para professores planejarem aulas e apoiarem a aprendizagem da turma. Explore a loja! |
| /loja/encantamente-recursos-pedagogicos | Encantament…Pedagógicos \| Materiais Didáticos \| Educalizando | Encantamente Recursos Pedagógicos: 1 materiais didáticos em Educação Infantil. Escolha recursos digitais para apoiar as aulas da sua turma. Explore a loja! |
| /loja/hyper-light | Hyper Light \| Materiais Didáticos \| Educalizando | Hyper Light: 0 materiais didáticos em educação. Encontre recursos para professores planejarem aulas e apoiarem a aprendizagem da turma. Explore a loja! |
| /loja/layla-martins-atividades-pedagogicas | Layla Marti…Pedagógicas \| Materiais Didáticos \| Educalizando | Layla Martins Atividades Pedagógic…: 0 materiais didáticos em educação. Encontre recursos digitais para apoiar suas aulas e o planejamento. Explore a loja! |
| /loja/loja-da-pro | Loja da Prô \| Materiais Didáticos \| Educalizando | Loja da Prô: 50 materiais didáticos em Alfabetização. Encontre recursos digitais para apoiar o planejamento das aulas da sua turma. Explore a loja! |
| /loja/lojinha-pedagogica-da-pro-vanessa | Lojinha Ped…Prô Vanessa \| Materiais Didáticos \| Educalizando | Lojinha Pedagógica da Prô Vanessa: 28 materiais didáticos em Alfabetização. Escolha recursos digitais para apoiar as aulas da sua turma. Explore a loja! |
| /loja/lumie-pedagogico | Lumiê Pedagógico \| Materiais Didáticos \| Educalizando | Lumiê Pedagógico: 4 materiais didáticos em Artes. Encontre recursos para professores planejarem aulas e apoiarem a aprendizagem da turma. Explore a loja! |
| /loja/oficina-ludica-ciencias | Oficina Lúdica Ciências \| Materiais Didáticos \| Educalizando | Oficina Lúdica Ciências: 0 materiais didáticos em educação. Encontre recursos digitais para apoiar o planejamento das aulas da sua turma. Explore a loja! |
| /loja/pedagogogiali | pedagogiali \| Materiais Didáticos \| Educalizando | pedagogiali: 0 materiais didáticos em educação. Encontre recursos para professores planejarem aulas e apoiarem a aprendizagem da turma. Explore a loja! |
| /loja/portal-mae-profe | PORTAL-MÃE&PROFE \| Materiais Didáticos \| Educalizando | PORTAL-MÃE&PROFE: 15 materiais didáticos em Datas Comemorativas. Encontre recursos digitais para apoiar suas aulas e o planejamento. Explore a loja! |
| /loja/prof-lia-recursos-pedagogicos | Recursos Pe…a Profª Lia \| Materiais Didáticos \| Educalizando | Recursos Pedagógicos da Profª Lia: 12 materiais didáticos em Artes. Encontre recursos digitais para apoiar suas aulas e o planejamento. Explore a loja! |
| /loja/professor-gamificado | Professor Gamificado \| Materiais Didáticos \| Educalizando | Professor Gamificado: 0 materiais didáticos em educação. Encontre recursos digitais para apoiar o planejamento das aulas da sua turma. Explore a loja! |
| /loja/professorgamificado | PROFESSOR GAMIFICADO \| Materiais Didáticos \| Educalizando | PROFESSOR GAMIFICADO: 5 materiais didáticos em Alfabetização. Encontre recursos digitais para apoiar o planejamento das aulas da sua turma. Explore a loja! |
| /loja/profkei-atividades-pedagogicas | Profkei ati…pedagógicas \| Materiais Didáticos \| Educalizando | Profkei atividades pedagógicas: 7 materiais didáticos em Datas Comemorativas. Escolha recursos digitais para apoiar as aulas da sua turma. Explore a loja! |
| /loja/recursos-criativos7 | Recursos criativos7 \| Materiais Didáticos \| Educalizando | Recursos criativos7: 0 materiais didáticos em educação. Encontre recursos digitais para apoiar o planejamento das aulas da sua turma. Explore a loja! |
| /loja/recursos-pedagogicos-da-prof | Recursos Pe…cos da Prof \| Materiais Didáticos \| Educalizando | Recursos Pedagógicos da Prof: 27 materiais didáticos em Artes. Encontre recursos digitais para apoiar suas aulas e o planejamento. Explore a loja! |
| /loja/saber-mais-recursos-pedagogicos | Saber Mais…Pedagógicos \| Materiais Didáticos \| Educalizando | Saber Mais Recursos Pedagógicos: 0 materiais didáticos em educação. Encontre recursos digitais para apoiar suas aulas e o planejamento. Explore a loja! |
| /loja/turminha-do-saber | Turminha do Saber \| Materiais Didáticos \| Educalizando | Turminha do Saber: 2 materiais didáticos em Alfabetização. Encontre recursos digitais para apoiar o planejamento das aulas da sua turma. Explore a loja! |
| /loja/turminhakids | Turminhakids \| Materiais Didáticos \| Educalizando | Turminhakids: 8 materiais didáticos em Datas Comemorativas. Encontre recursos digitais para apoiar o planejamento das aulas da sua turma. Explore a loja! |
| /loja/universo-pedagogico-da-prof-lu | universo-pe…-da-prof.lu \| Materiais Didáticos \| Educalizando | universo-pedagogico-da-prof.lu: 23 materiais didáticos em Ensino Fundamental. Escolha recursos digitais para apoiar as aulas da sua turma. Explore a loja! |
| /lojas | Lojas de materiais didáticos \| Educalizando | Conheça lojas de educadores e encontre materiais didáticos digitais para sua rotina pedagógica. |
| /materiais-didaticos | Materiais didáticos digitais para ensinar com mais… | Encontre atividades, apostilas, jogos pedagógicos e recursos digitais criados por educadores para apoiar suas aulas e reduzir o tempo de planejamento. |
| /materiais-gratis | Materiais Pedagógicos Gratuitos \| Educalizando | Atividades e recursos pedagógicos gratuitos para professores, famílias e educadores. |
| /ofertas | Ofertas de materiais didáticos \| Educalizando | Materiais didáticos digitais com preço promocional cadastrados pelos criadores da Educalizando. |
| /planos-de-aula-bncc | Planos de aula e recursos alinhados à BNCC \| Educalizando | Planeje aulas com mais clareza usando recursos que ajudam a organizar objetivos, habilidades e experiências de aprendizagem. |
| /privacidade | Política de Privacidade \| Educalizando | Consulte como a Educalizando trata dados pessoais, cookies, pagamentos e os direitos previstos na LGPD. |
| /recursos-pedagogicos | Recursos pedagógicos digitais para professores \|… | Explore recursos pedagógicos digitais criados por educadores para apoiar planejamento, intervenções e experiências de aprendizagem. |
| /sobre | Sobre a Educalizando | Conheça a Educalizando, uma plataforma para descobrir, comprar e vender materiais didáticos digitais. |
| /termos | Termos de Uso \| Educalizando | Consulte os termos de uso da plataforma Educalizando para compradores, criadores e parceiros. |
| /produto/10-folhinhas-de-atividades-para-educacao-infantil-nome-letras-vogais-rimas-e-historias | ✨10 Folhinhas de Atividades para Educação In… \| Educalizando | Educalizando: ✨10 Folhinhas de Atividades para Educação Infantil \| Nome, Letras, Vogais, Rimas e Hi. 10 Folhinhas de Atividades para Educação Infantil \|… |
| /produto/150-probleminhas-de-matematica-para-o-2-ano | 150 PROBLEMINHAS DE MATEMÁTICA PARA O 2º ANO! \| Educalizando | Educalizando: 150 PROBLEMINHAS DE MATEMÁTICA PARA O 2º ANO!. 150 probleminhas de matemática com situações do cotidiano infantil; 50 páginas em PDF,… |
| /loja/arquivos-da-pro/produto/sacola-de-historia-dia-da-arvore | Sacola de história dia da árvore \| Loja Arquivos da Prô | Arquivos da Prô: Sacola de história dia da árvore. Sacola Dia da Árvore Transforme o Dia da Árvore em uma experiência mágica e educativa para as… |
| /loja/bau-das-atividades/produto/dia-das-criancas-o-mestre-mandou-atividade-para-colorir | Dia das crianças / O mestre mandou!… \| Loja Baú das Ativida | Baú das Atividades: Dia das crianças / O mestre mandou! Atividade para colorir. Uma atividade divertida e educativa para celebrar o Dia das Crianças com… |

Metadados de produtos e lojas são derivados do cadastro real. O relatório JSON complementar contém a lista completa auditada, sem dados privados nem chaves.

## Arquivos desta tarefa

| Arquivo | Motivo |
|---|---|
| next-sitemap.config.js | Geração dinâmica e remoção de arquivos estáticos conflitantes. |
| next.config.ts | Redirecionamento e domínio canônico antes da renderização/cache. |
| public/robots.txt (removido) | Geração dinâmica e remoção de arquivos estáticos conflitantes. |
| public/sitemap-0.xml (removido) | Geração dinâmica e remoção de arquivos estáticos conflitantes. |
| public/sitemap.xml (removido) | Geração dinâmica e remoção de arquivos estáticos conflitantes. |
| scripts/verify-page-seo.ts | Testes de regressão e auditoria HTTP local. |
| src/app/admin/layout.tsx | Fonte global ou metadata privada; interface e autorização preservadas. |
| src/app/afiliado/[slug]/page.tsx | Metadados por rota, canonical, imagem pública e/ou 404. |
| src/app/blog/[slug]/page.tsx | Metadados por rota, canonical, imagem pública e/ou 404. |
| src/app/blog/page.tsx | Metadados por rota, canonical, imagem pública e/ou 404. |
| src/app/clube/[slug]/page.tsx | Metadados por rota, canonical, imagem pública e/ou 404. |
| src/app/dashboard/layout.tsx | Fonte global ou metadata privada; interface e autorização preservadas. |
| src/app/globals.css | Fonte local, aplicação global e licença de redistribuição. |
| src/app/layout.tsx | Fonte global ou metadata privada; interface e autorização preservadas. |
| src/app/loja/[slug]/kit/[id]/page.tsx | Metadados por rota, canonical, imagem pública e/ou 404. |
| src/app/loja/[slug]/page.tsx | Metadados por rota, canonical, imagem pública e/ou 404. |
| src/app/loja/[slug]/produto/[produtoSlug]/ProductDetailClientView.tsx | Imagens com next/image, dimensões, carregamento progressivo e caminho existente do MinIO. |
| src/app/loja/[slug]/produto/[produtoSlug]/page.tsx | Metadados por rota, canonical, imagem pública e/ou 404. |
| src/app/loja/[slug]/themes/ThemeDefault.tsx | Imagens com next/image, dimensões, carregamento progressivo e caminho existente do MinIO. |
| src/app/loja/[slug]/themes/ThemeLinkTree.tsx | Imagens com next/image, dimensões, carregamento progressivo e caminho existente do MinIO. |
| src/app/loja/[slug]/themes/ThemeMinimalist.tsx | Imagens com next/image, dimensões, carregamento progressivo e caminho existente do MinIO. |
| src/app/loja/[slug]/themes/ThemeNetflix.tsx | Imagens com next/image, dimensões, carregamento progressivo e caminho existente do MinIO. |
| src/app/loja/[slug]/themes/ThemePinterest.tsx | Imagens com next/image, dimensões, carregamento progressivo e caminho existente do MinIO. |
| src/app/lojas/page.tsx | Metadados por rota, canonical, imagem pública e/ou 404. |
| src/app/page.tsx | Marca, texto público, FAQ e um único H1. |
| src/app/produto/[slug]/page.tsx | Metadados por rota, canonical, imagem pública e/ou 404. |
| src/app/sitemap-catalogo.xml/route.ts | Geração dinâmica e remoção de arquivos estáticos conflitantes. |
| src/components/Footer.tsx | Imagens com next/image, dimensões, carregamento progressivo e caminho existente do MinIO. |
| src/components/HomepageMarketplace.tsx | Marca, texto público, FAQ e um único H1. |
| src/components/MainBannersCarousel.tsx | Imagens com next/image, dimensões, carregamento progressivo e caminho existente do MinIO. |
| src/components/MarketplaceHeader.tsx | Imagens com next/image, dimensões, carregamento progressivo e caminho existente do MinIO. |
| src/components/StoreCard.tsx | Remove nota fixa inventada e usa imagem dimensionada. |
| src/lib/page-seo.ts | Metadados, URLs canônicas, limites e dados estruturados. |
| src/lib/seo.ts | Metadados, URLs canônicas, limites e dados estruturados. |
| src/proxy.ts | Validação pública antes do streaming; 404 real e 503 em indisponibilidade. |
| src/lib/canonical-host.ts | Redirecionamento e domínio canônico antes da renderização/cache. |
| src/lib/catalog-sitemap.ts | Geração dinâmica e remoção de arquivos estáticos conflitantes. |
| src/lib/private-metadata.ts | Fonte global ou metadata privada; interface e autorização preservadas. |
| src/lib/home-content.ts | Marca, texto público, FAQ e um único H1. |
| src/lib/product-review-summary.ts | Agregação de avaliações públicas aprovadas do banco. |
| src/lib/public-document-status.ts | Validação pública antes do streaming; 404 real e 503 em indisponibilidade. |
| src/app/sitemap.ts | Geração dinâmica e remoção de arquivos estáticos conflitantes. |
| src/app/robots.ts | Geração dinâmica e remoção de arquivos estáticos conflitantes. |
| src/components/HomeBrandContent.tsx | Marca, texto público, FAQ e um único H1. |
| src/app/fonts/geist-latin.woff2 | Fonte local, aplicação global e licença de redistribuição. |
| src/app/fonts/OFL.txt | Fonte local, aplicação global e licença de redistribuição. |
| src/app/login/layout.tsx | Fonte global ou metadata privada; interface e autorização preservadas. |
| src/app/entrar/layout.tsx | Fonte global ou metadata privada; interface e autorização preservadas. |
| src/app/loja/[slug]/checkout/layout.tsx | Fonte global ou metadata privada; interface e autorização preservadas. |
| scripts/verify-brand-seo.cjs | Testes de regressão e auditoria HTTP local. |
| scripts/audit-local-brand-seo.mjs | Testes de regressão e auditoria HTTP local. |
| src/lib/catalog-seo.ts | Metadados, URLs canônicas, limites e dados estruturados. |
| src/components/CatalogCover.tsx | Imagens com next/image, dimensões, carregamento progressivo e caminho existente do MinIO. |
| src/components/ui/CatalogImage.tsx | Imagens com next/image, dimensões, carregamento progressivo e caminho existente do MinIO. |
| src/components/store/ProductPublicSummary.tsx | Imagens com next/image, dimensões, carregamento progressivo e caminho existente do MinIO. |
| scripts/verify-catalog-seo.ts | Testes de regressão e auditoria HTTP local. |
| scripts/verify-product-seo-render.cjs | Testes de regressão e auditoria HTTP local. |
| src/app/admin/ClientLayout.tsx | Fonte global ou metadata privada; interface e autorização preservadas. |
| src/app/dashboard/ClientLayout.tsx | Fonte global ou metadata privada; interface e autorização preservadas. |
| cloudflare/worker.js | Redirecionamento e domínio canônico antes da renderização/cache. |
| src/lib/seo-identity.ts | Metadados, URLs canônicas, limites e dados estruturados. |
| ops/SEO-MARCA-INDEXACAO-2026-10-16.md | Resultado, critérios, limites e tabela de metadados. |
| ops/seo-metadados-2026-10-16.json | Evidência HTTP pública completa da auditoria. |

## Publicação e commits

Build de produção validado e publicado na Cloudflare: `c7803e8f-6b55-4d78-b1d0-03ef93a805f7`.

Conferência pública após o deploy, sem autenticação ou escrita de dados:

- Home: 200, título iniciado por Educalizando.
- /robots.txt: 200, área do aluno bloqueada.
- /sitemap.xml: 200, 672 URLs.
- Produto e loja inexistentes: 404.
- Host workers.dev e domínio sem www: 301, mantendo caminho e consulta para https://www.educalizando.com.br.
- 2c2e390: fix(seo): unifica sitemap robots hosts e respostas 404
- a200288: feat(seo): reforca marca metadados e avaliacoes reais
- 0f6d320: perf(seo): usa fontes locais imagens dimensionadas e metadata privada
- dd27880: test(seo): valida marca catalogo publico e indexacao local
- c1f8158: fix(seo): diferencia metadados de produtos e lojas homonimos
