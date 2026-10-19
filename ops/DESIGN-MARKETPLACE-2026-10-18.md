# Revisão visual do marketplace — 18/10/2026

## Auditoria e direção adotada

Referências observadas ao vivo: https://www.educalizando.com.br/ e https://saberdidatico.com.br/.
Na Educalizando também foram revisados o catálogo/busca, o diretório de lojas e uma página de produto. Não se trata de uma auditoria de todas as telas privadas nem de todos os temas individuais das lojas.

| Aspecto | Educalizando antes | Saber Didático observado | Mudança aplicada |
| --- | --- | --- | --- |
| Primeira impressão | Introdução textual seguida de outra abertura com a mesma proposta | Caminhos por etapa e vitrine com capas em evidência | Uma abertura editorial, com capas reais e dois caminhos claros: catálogo e gratuitos |
| Navegação | Muitos links com pílulas, emojis e cores competindo | Hierarquia mais clara entre busca, categorias e ações | Busca curta, links sem pílulas repetidas e acesso explícito a calendário, gratuitos e venda no desktop |
| Consistência | Azul, roxo, verde-limão e vários gradientes no mesmo percurso | Paleta mais contida nos elementos de navegação | Azul da marca, tons de papel e verde suave; promoções continuam identificáveis |
| Calendário | Vários blocos repetindo temas e campanhas | Apresentação temática com links para materiais | Um resumo do mês e próximas datas; removidas da home as campanhas duplicadas |
| Lojas | Faixa automática com cópias dos links | Vitrines com identidade de cada criador | Faixa manual, rolável por toque, mouse ou teclado, sem cópias para animação |
| Cards | Abrir material, carrinho e comprar disputavam atenção | Capas maiores com informações agrupadas | Removido botão redundante “Ver material”; capa e título continuam abrindo detalhes, compra e carrinho preservados |
| Celular | Navegação com faixa animada adicional; lojas em duas colunas a partir de 390px | Não foi feita avaliação móvel completa do concorrente | Menu mais curto, colagem compacta, lojas em uma coluna até 640px e rodapé responsivo |

A comparação de design é qualitativa. Não foi realizado teste A/B com compradores, portanto não há promessa de aumento de conversão nem de posição no Google.

## Arquivos alterados e motivo

| Arquivo | Motivo |
| --- | --- |
| src/app/page.tsx | Fundo da nova identidade e remoção da abertura duplicada; metadata, canonical e JSON-LD mantidos |
| src/app/globals.css | Estilos limitados à apresentação pública, hierarquia, cartões, responsividade e correção do ancestral que impedia cabeçalho fixo |
| src/app/lojas/page.tsx | Introdução mais clara, superfícies consistentes e cards legíveis em celulares |
| src/components/HomeBrandContent.tsx | Abertura única com capas reais, CTAs e FAQ mais legível |
| src/components/HomeCatalogSkeleton.tsx | Mantém a abertura durante o carregamento do catálogo |
| src/components/HomepageMarketplace.tsx | Sequência de seções simplificada; elimina campanhas repetidas e movimento automático das lojas |
| src/components/MarketplaceHeader.tsx | Navegação mais direta e remoção da faixa animada no celular |
| src/components/SearchBar.tsx | Texto curto, nome acessível e espaço para não sobrepor texto ao botão Buscar |
| src/components/ProductCard.tsx | Remove apenas o botão redundante de detalhes; handlers de carrinho e compra mantidos |
| src/components/UpcomingCalendarDates.tsx | Cards temáticos mais compactos, títulos e espaçamentos coerentes |
| src/components/Footer.tsx | Duas colunas em tablets e quatro somente em telas maiores; espaçamento reduzido |
| scripts/verify-home-design.cjs | Verifica H1 único, links reais, lojas sem duplicação, FAQ e estado vazio sem mutar dados |
| ops/DESIGN-MARKETPLACE-2026-10-18.md | Registra comparação, escopo e validação |

## Verificação

- Prévia local renderizada em navegador, desktop e viewport móvel: largura útil 382px sem overflow horizontal.
- Menu móvel aberto/fechado; alvos principais com 44px ou mais.
- Imagens da abertura carregadas diretamente de arquivos.educalizando.com.br.
- Rolagem desktop: header.top = 0 em scrollTop = 720; imagens visíveis carregadas.
- Testes: home, seleção/SEO, imagens MinIO, cinco temas e tamanho dos arquivos aprovados.
- Lint: zero erros; 17 avisos já existentes no projeto.
- Typecheck Vinext aprovado.
- Build/empacotamento de produção Vinext aprovado; resultado registrado em .cloudflare/design-production-build.log.

Não foram acrescentadas consultas, bibliotecas, imagens geradas nem serviços de transformação. A abertura reutiliza três capas já presentes no mesmo catálogo. Dados de criadores, preços, acesso, armazenamento, checkout e integrações não foram alterados.

