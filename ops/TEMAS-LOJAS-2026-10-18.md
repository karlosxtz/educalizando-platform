# Temas das lojas — 18/10/2026

## Entrega

Configuração da Loja → Tema / Layout da Vitrine Pública oferece seis opções:

| Tema | Aparência |
| --- | --- |
| Clássico | Vitrine atual preservada |
| Aurora | Apresentação dividida, fundo suave e catálogo em três colunas |
| Editorial | Tons de papel, títulos serifados, apresentação central e catálogo amplo |
| Brincar | Paleta pastel, formas lúdicas, bordas e imagens em arco |
| Noite | Fundo escuro, banner imersivo e galeria com quatro colunas |
| Estúdio | Perfil lateral no computador, catálogo em fichas e composição empilhada no celular |

O criador escolhe uma opção, confere a prévia representativa e salva as configurações. A cor de destaque, imagens e dados da loja são mantidos. O formulário agora carrega e persiste `layout_theme`, usando o serviço e a revalidação pública já existentes. Nenhuma loja é alterada automaticamente. Valores desconhecidos usam o Clássico. Não é necessária migration.

Os temas compartilham os filtros atuais, ofertas finais/PLR, categorias, níveis, paginação, carrinho existente, acesso do comprador, kits, clubes e apresentação do autor. Produtos gratuitos levam à página do material. Links PLR mantêm a licença na URL e no carrinho. Não foram modificados checkout, preços, entrega, RLS, isolamento, pagamentos ou webhooks. Imagens continuam entregues pelo fluxo atual do MinIO, sem transformação paga.

## Arquivos e motivo

| Arquivo | Motivo |
| --- | --- |
| `src/lib/store-themes.ts` | Registro dos estilos, normalização e contraste das cores |
| `src/components/store/themes/StorefrontTheme.tsx` | Catálogo compartilhado, navegação e estados vazios |
| `src/components/store/themes/StorefrontTheme.module.css` | Cinco layouts isolados e responsivos |
| `src/components/store/themes/StorefrontHero.tsx` | Identidade, banner e contatos reais da loja |
| `src/components/store/themes/StorefrontProductCard.tsx` | Cards, detalhes e integração com o carrinho existente |
| `src/components/store/themes/StorefrontExtras.tsx` | Kits, clubes e autor nos novos estilos |
| `src/app/loja/[slug]/PublicStoreClientView.tsx` | Seleção do tema salvo sem substituir o Clássico |
| `src/components/dashboard/StoreThemePicker.tsx` | Seletor acessível com seis opções |
| `src/components/dashboard/StoreThemeMiniature.tsx` | Miniaturas representativas dos layouts |
| `src/components/dashboard/StoreThemeLivePreview.tsx` | Prévia com identidade real e formatos de computador/celular |
| `src/components/dashboard/StoreLivePreview.tsx` | Encaminhamento das prévias sem mudar a de afiliados |
| `src/app/dashboard/loja/page.tsx` | Carregar, selecionar e salvar o tema pelo formulário atual |
| `scripts/verify-store-themes.cjs` | Regressões de renderização, licença, carrinho e cores |
| `package.json` | Comando `test:store-themes` |
| `ops/TEMAS-LOJAS-2026-10-18.md` | Registro da implementação e validação |

## Validação

- Lint: passou, zero erros; 17 avisos preexistentes.
- Typecheck Vinext: passou.
- Build de produção e empacotamento Wrangler: passaram com `node scripts/deploy-cloudflare.mjs --dry-run`.
- Testes `store-themes`, `source-size`, `social-links` e `product-tags`: passaram.
- Prévia local usando catálogo público real, sem salvar dados de criadores: cinco estilos em 1440×1000 e 390×844, sem transbordamento horizontal e com um H1 por loja.
- Busca sem resultado, limpar filtros, carregar os 16 produtos, seleção de tema e adicionar ao carrinho local: verificados pelo navegador. Capas visíveis carregaram diretamente do servidor de arquivos.
- Persistência usa o serviço existente; não foi executada compra nem alterada configuração de uma loja real para testar.

As miniaturas do formulário são representações do layout, identificadas como tal; o catálogo público usa os produtos reais. O desempenho de rede e as imagens originais continuam sujeitos ao servidor de arquivos já utilizado pela plataforma.
