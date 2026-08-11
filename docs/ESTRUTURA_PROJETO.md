# Estrutura Completa e Documentação Técnica do Projeto — Educalizando

Documentação oficial do estado atual da arquitetura, modelo de negócio, rotas, banco de dados, integrações e mapa de funcionalidades da plataforma **Educalizando**.

---

## 1. Visão Geral

### Stack Tecnológica Utilizada
- **Framework Web:** [Next.js 16.3.0](https://nextjs.org/) (Turbopack, App Router).
- **Linguagem:** TypeScript 5.x.
- **Estilização e Design System:** Vanilla CSS, TailwindCSS, Framer Motion (animações de UI e transições), Lucide React (ícones vetoriais).
- **Backend & Banco de Dados:** [Supabase](https://supabase.com/) (Supabase Auth para autenticação de criadores/alunos, PostgreSQL Database para persistência relacional, Supabase Storage para mídias/PDFs).
- **Gateway de Pagamento:** [Asaas API v3](https://www.asaas.com/) (Checkout transparente com PIX instantâneo, Cartão de Crédito e Boleto Bancário, recepção de webhooks e gestão de subcontas/saques).

### Modelo de Negócio
A plataforma **Educalizando** é uma solução SaaS *multi-tenant* focada em professores, educadores e criadores de conteúdo didático. 
- Cada criador possui sua **vitrine pública exclusiva e personalizável** (endereço `educalizando.com.br/loja/[slug]`).
- Os criadores podem cadastrar e vender infoprodutos digitais individuais (Apostilas PDF, E-books, Videoaulas, Simulados) e Kits/Combos com desconto.
- **Taxa da Plataforma:** Cobrança transparente de apenas **R$ 0,99 fixo por produto vendido** (0% de comissão percentual sobre o valor total do material).
- **Taxa de Meio de Pagamento (Asaas):** Repassada de forma transparente (PIX/Boleto: R$ 1,99 por transação; Cartão: R$ 0,49 + 2,99%).
- Repasse líquido calculado em tempo real para a carteira digital do criador no painel com funcionalidade de solicitação de saque via chave PIX.

---

## 2. Árvore de Diretórios (`src/`)

```text
src/
├── app/                        # Rotas e páginas da aplicação baseadas no Next.js App Router
│   ├── (site institucional)    # Landing page principal, login, cadastro
│   ├── aluno/                  # Portal do aluno, login, cadastro e visualizador de materiais
│   ├── dashboard/              # Painel administrativo do criador/professor (13 sub-rotas)
│   ├── loja/[slug]/            # Vitrine pública multi-tenant do criador, páginas de produto e checkout
│   └── api/                    # Endpoints de API serverless (checkout, webhooks Asaas, produtos, financeiro)
├── components/                 # Componentes reutilizáveis de interface
│   ├── dashboard/              # Componentes internos do painel (modais, tabelas, assistentes, upload)
│   ├── ui/                     # Componentes genéricos de UI (CustomSelect, botões, cards)
│   └── (landing page)          # Header, Hero, Pricing, HowItWorks, Benefits, FAQ, Footer, SignupForm
├── lib/                        # Camada de serviços, utilitários e integração com APIs externas
│   ├── asaas-service.ts        # Comunicação com a API do Asaas (clientes, cobranças, PIX)
│   ├── store-service.ts        # Gestão de lojas e produtos (operações Supabase + fallback resiliente)
│   ├── order-service.ts        # Cálculo financeiro detalhado de pedidos, retenções e taxas
│   ├── wallet-service.ts       # Gestão de saldo da carteira do criador e detalhamento de taxas
│   ├── category-service.ts     # Gestão de categorias globais e customizadas
│   ├── kit-service.ts          # Gestão de kits/combos de produtos
│   ├── coupon-service.ts       # Gestão e validação de cupons de desconto
│   ├── student-service.ts      # Autenticação e gestão de permissões de alunos
│   ├── withdrawal-service.ts   # Solicitações de saque PIX
│   ├── supabase.ts             # Cliente de conexão Supabase e funções de autenticação
│   ├── config.ts               # Configurações globais de taxas e identificação
│   └── types.ts                # Interfaces e definições de tipos TypeScript do sistema
```

---

## 3. Rotas e Páginas

### 🌐 Site Institucional
- `/` — Landing page principal da plataforma com apresentação, diferenciais, tabela de preços transparente e formulário de criação de lojas para professores.
- `/login` — Tela de autenticação e acesso para criadores/professores.
- `/offline` — Página PWA de suporte para navegação sem conexão com a internet.

### 🏪 Loja Pública do Criador (`/loja/[slug]`)
- `/loja/[slug]` — Vitrine digital pública da loja do criador com suporte a personalização de cores, banner, bio, redes sociais, busca de materiais e filtros por categoria e nível escolar.
- `/loja/[slug]/produto/[id]` — Página de detalhes do produto individual com capa, preço, descrição, dados pedagógicos e botão de compra.
- `/loja/[slug]/kit/[id]` — Página detalhada do kit/combo de infoprodutos com desconto especial.
- `/loja/[slug]/checkout` — Tela de checkout responsivo da loja com identificação/cadastro do aluno, aplicação de cupons, resumo de taxas e pagamento por PIX, Cartão ou Boleto.
- `/loja/[slug]/checkout/sucesso/[orderId]` — Tela de confirmação do pedido com exibição de QR Code PIX em tempo real, chave Copia e Cola e status de aprovação.

### 🎓 Área do Aluno (Comprador)
- `/aluno` — Landing page / portal do aluno.
- `/aluno/login` — Login do aluno/comprador.
- `/aluno/cadastro` — Cadastro rápido de novos alunos.
- `/aluno/dashboard` — Área de membros do aluno com biblioteca de materiais adquiridos e botão de acesso/download.
- `/aluno/loja/[storeId]` — Redirecionamento e visualização de loja vinculada ao aluno.
- `/aluno/materiais/[purchaseId]` — Leitor/visualizador digital do conteúdo pedagógico adquirido.

### 📊 Dashboard do Criador (`/dashboard`)
- `/dashboard` — Visão geral da conta do professor com gráfico de vendas, faturamento total, quantidade de pedidos e feed de vendas recentes.
- `/dashboard/loja` — Configuração da identidade da loja (nome público, slug exclusivo, bio, redes sociais, logotipo, banner e cor primária).
- `/dashboard/produtos` — Gerenciador completo de materiais didáticos com busca, status (publicado/rascunho) e ações de edição e exclusão.
- `/dashboard/produtos/novo` — Assistente em 4 passos (*wizard*) para criação de produtos (1. Dados Básicos, 2. Capa, 3. Arquivo Digital, 4. Revisão e Publicação).
- `/dashboard/conteudo` e `/dashboard/conteudo/[produtoId]` — Gestão dos arquivos digitais (PDFs e videoaulas) disponibilizados aos alunos.
- `/dashboard/kits` e `/dashboard/kits/novo` — Gestão e criação de combos/kits de infoprodutos com desconto.
- `/dashboard/cupons` — Gestão de cupons de desconto (porcentagem ou valor fixo) com limite de usos e validade.
- `/dashboard/categorias` — Gestão de categorias e temas customizados da loja do criador.
- `/dashboard/pedidos` — Relatório e histórico completo de vendas realizadas com filtro por status de pagamento.
- `/dashboard/clientes` e `/dashboard/clientes/[clienteId]` — Lista de alunos/compradores com histórico individual de compras e dados de contato.
- `/dashboard/financeiro` — Carteira digital do criador com saldo disponível, detalhamento transparente da retenção Educalizando (R$ 0,99/produto) + taxa Asaas, histórico de saques e formulário de solicitação de saque PIX.
- `/dashboard/conta` — Perfil do criador e edição de dados cadastrais.

### 🔌 API Routes (Endpoints Serverless)
- `/api/checkout` — Endpoint para criação de cobrança no Asaas (PIX/Cartão/Boleto), cadastro do comprador e geração do pedido no banco de dados.
- `/api/checkout/status` — Checagem de status de pagamento do pedido em tempo real.
- `/api/webhooks/asaas` — Webhook receptor de notificações do Asaas (`PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED`) que atualiza o pedido para `paid` e libera o material na área do aluno automaticamente.
- `/api/produtos` — Backend API para criação (POST) e edição (PUT) de produtos no Supabase garantindo persistência global sem bloqueios RLS de cliente.
- `/api/financeiro/pix-key` — Registro e validação de chave PIX e CPF do criador.
- `/api/financeiro/saque` — Processamento e registro de solicitações de saque de saldo disponível.
- `/api/aluno/materiais/[productId]/download` — Download seguro de arquivos didáticos do aluno autenticado.

---

## 4. Banco de Dados

### Tabelas do Banco de Dados PostgreSQL (Supabase)

| Tabela | Finalidade Principal |
| :--- | :--- |
| `stores` | Cadastro das lojas virtuais dos criadores (slug, nome, bio, redes sociais, cor primária, id do criador). |
| `products` | Cadastro dos infoprodutos didáticos (título, descrição, tipo, preço, URLs de capa/arquivo, status, categoria, escolaridade). |
| `categories` | Categorias e temas didáticos (globais da plataforma ou customizados por loja via `store_id`). |
| `education_levels` | Níveis de escolaridade cadastrados (Educação Infantil, Ensino Fundamental, Médio, ENEM, Concursos, etc.). |
| `kits` | Combos/kits de infoprodutos cadastrados pela loja. |
| `kit_items` | Tabela relacional de associação entre kits e produtos. |
| `orders` | Registro completo das vendas (dados do comprador, subtotal, taxa Educalizando R$ 0,99, taxa Asaas, valor líquido do criador, status, id Asaas, método de pagamento, QR Code PIX). |
| `order_items` | Detalhamento dos itens inclusos em cada pedido de venda. |
| `student_purchases` | Registro de liberação de conteúdo na área do aluno pós-pagamento. |
| `coupons` | Cupons de desconto da loja (código, porcentagem/valor fixo, limite de uso, validade). |
| `coupon_products` | Restrições de cupons aplicados a produtos/kits específicos. |
| `product_reviews` | Avaliações e comentários dos alunos sobre os materiais. |
| `creator_pix_keys` | Cadastro das chaves PIX e CPFs dos criadores para recebimento de saques. |
| `withdrawal_requests` | Histórico e solicitações de saque de saldo da carteira do criador. |

### Principais Relações (Foreign Keys)
- `products.store_id` ➔ `stores.id`
- `products.category_id` ➔ `categories.id`
- `products.education_level_id` ➔ `education_levels.id`
- `kit_items.kit_id` ➔ `kits.id` | `kit_items.product_id` ➔ `products.id`
- `order_items.order_id` ➔ `orders.id` ON DELETE CASCADE
- `order_items.product_id` ➔ `products.id`
- `student_purchases.store_id` ➔ `stores.id` | `student_purchases.product_id` ➔ `products.id`
- `coupons.store_id` ➔ `stores.id`
- `withdrawal_requests.store_id` ➔ `stores.id`

### Resumo das Políticas de Segurança (RLS - Row Level Security)
- **Operações de Leitura (SELECT):** Habilitadas publicamente em `stores`, `products`, `categories`, `education_levels` e `kits` para permitir a navegação livre de compradores na vitrine pública.
- **Operações de Gravacao (INSERT/UPDATE):** Protegidas por autenticação do criador (`auth.uid() = creator_id`) ou intermediadas pelas rotas de API serverless backend (`/api/produtos`, `/api/checkout`, `/api/webhooks/asaas`).

---

## 5. Integrações Externas

### 1. Gateway de Pagamento Asaas
- **Checkout Transparente (API v3):** Integrado e funcional. Gera cobranças por PIX (com QR Code base64 e chave Copia e Cola instantâneos), Cartão de Crédito e Boleto Bancário.
- **Webhook de Notificação (`/api/webhooks/asaas`):** Escuta eventos de confirmação de pagamento (`PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED`) em tempo real. Atualiza o status do pedido para `paid`, calcula o saldo líquido do criador e libera o acesso aos materiais na biblioteca do aluno.
- **Gestão de Saldo & Saques:** Painel financeiro calcula com precisão as retenções (R$ 0,99/produto + taxa real Asaas) e exibe o saldo líquido disponível imediatamente no ambiente Sandbox e Produção.

### 2. Supabase (Auth, DB & Storage)
- **Supabase Auth:** Autenticação de professores e alunos via e-mail e senha com gerenciamento de metadados (`full_name`, `cpf`, `role`, `store_slug`).
- **Supabase Database:** Persistência relacional em banco de dados PostgreSQL.
- **Supabase Storage:** Armazenamento e geração de links para capas e arquivos digitais.

---

## 6. Funcionalidades por Módulo

| Módulo | Status Atual | Descrição Detalhada |
| :--- | :---: | :--- |
| **Lojas Virtuais Multi-tenant** | 🟢 **100% Funcional** | Criação automática de loja, slug exclusivo humano, personalização completa de nome, bio, redes sociais, logotipo, banner e cor primária. |
| **Cadastro de Produtos** | 🟢 **100% Funcional** | Wizard em 4 passos para publicar apostilas PDF, e-books, simulados e videoaulas. Sanitização de UUIDs e persistência backend sem travamentos. |
| **Kits e Combos** | 🟢 **100% Funcional** | Agrupamento de infoprodutos em combos promocionais com preço especial de venda. |
| **Cupons de Desconto** | 🟢 **100% Funcional** | Criação de cupons por porcentagem ou valor fixo com contagem de uso e validação no checkout. |
| **Checkout Transparente** | 🟢 **100% Funcional** | Identificação/cadastro do aluno, cálculo de cupons, resumo de taxas e pagamento imediato via PIX (QR Code / Copia e Cola), Cartão e Boleto. |
| **Área do Aluno** | 🟢 **100% Funcional** | Cadastro/login do comprador, painel com biblioteca de compras e download/visualização direta dos arquivos adquiridos. |
| **Painel Financeiro & Carteira** | 🟢 **100% Funcional** | Exibição transparente de vendas brutas, detalhamento das taxas (R$ 0,99 Educalizando + Asaas), saldo disponível para saque e cadastro de chave PIX. |
| **Relatórios e Métricas** | 🟢 **100% Funcional** | Gráfico de evolução de vendas por período, resumo de produtos mais vendidos e feed de pedidos em tempo real. |
| **Saques PIX** | 🟡 **Parcial** | Registro e validação de solicitações de saque com chave PIX e CPF. Integração automática com transferências automáticas Asaas em preparação. |
| **Painel Master Admin Global** | 🟡 **Parcial** | Estrutura de métricas individuais de lojas funcional; visualização global de todas as lojas da plataforma em expansão. |

---

## 7. Pontos de Atenção Conhecidos

1. **Revalidação de Cache no Next.js App Router:**
   - Para garantir que novos produtos e edições apareçam na vitrine pública sem necessidade de *hard refresh*, os endpoints usam `revalidatePath('/loja/[slug]', 'page')` e as páginas públicas utilizam `export const dynamic = 'force-dynamic'`.
2. **Sanitização de Identificadores UUID:**
   - Os campos `category_id`, `education_level_id` e `store_id` devem sempre passar pelo utilitário `sanitizeUUID` para garantir a conversão correta antes de requisições ao PostgreSQL do Supabase, prevenindo erros do tipo `invalid input syntax for type uuid`.
3. **Isolamento de Sessão Local:**
   - O login e logout realizam a limpeza completa das chaves de sessão no `localStorage` (`educalizando_creator_session`, `educalizando_session`), evitando desincronização ao alternar contas no mesmo navegador.

---

## 8. Sugestões de Melhoria e Próximos Passos

### 🚀 Alta Prioridade (Impacto Direto em Vendas e Operação)
1. **Split de Pagamento Automático Nativo no Asaas (Asaas Subaccounts):**
   - Conectar a API de criação de subcontas Asaas para que, na aprovação de uma venda por PIX/Cartão, o Asaas divida automaticamente os R$ 0,99 para a conta master da Educalizando e transfira a parcela líquida diretamente para a conta bancária/Asaas do professor.
2. **Proteção DRM de PDFs (Marca d'Água Dinâmica):**
   - Ao gerar o download do material na Área do Aluno, carimbar automaticamente no rodapé de cada página do PDF o nome completo, CPF e e-mail do comprador para coibir o compartilhamento indevido.
3. **Notificações por WhatsApp:**
   - Enviar mensagem automática via WhatsApp assim que o PIX for pago, contendo o link de acesso direto aos materiais na Área do Aluno.

### 💡 Média Prioridade (Melhorias de UX e Gestão)
1. **Exportação de Relatórios Financeiros (CSV / Excel):**
   - Adicionar botão de download de relatórios de vendas e extrato financeiro para contabilidade dos criadores.
2. **Painel Master Admin Unificado:**
   - Criar visão administrativa `/admin` para os gestores da plataforma acompanharem o volume total de vendas de todas as lojas, aprovações de saques e estatísticas gerais.
