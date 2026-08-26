# Auditoria Pós-Execução — Estrutura Macro do Produto vs Padrão de Mercado

Realizei uma inspeção estrita na anatomia estrutural do arquivo `ProductDetailClientView.tsx` (linhas 212 a 534) para comparar com os layouts de alta conversão de grandes players (Hotmart, Kiwify, Udemy, Amazon).

## 1. O Grid Principal Atual (Esquerda vs Direita)

O layout atual utiliza um grid moderno de 12 colunas (`grid-cols-1 lg:grid-cols-12`), dividido em:
- **Coluna Esquerda (Conteúdo):** Ocupa 7 a 8 colunas (`lg:col-span-7 xl:col-span-8`).
- **Coluna Direita (Compra):** Ocupa 5 a 4 colunas (`lg:col-span-5 xl:col-span-4`) com comportamento pegajoso (`sticky`).

## 2. Diagnóstico de Alinhamento e Fricção

A arquitetura das colunas está sólida, porém, a **distribuição dos elementos** não reflete o padrão de mercado focado em vendas (Product Page Standard).

### Onde está a Fricção Atual?
1. **O Título e as Tags estão na Esquerda:**
   - Atualmente, as tags de categoria, o nome do produto (`<h1>`) e o criador estão renderizados no topo da **Coluna Esquerda**, antes mesmo da Imagem de Capa (linhas 217 a 231).
2. **Coluna Direita (Sidebar) Pobre de Informação:**
   - A coluna direita (ilha de compra) possui apenas o Preço, os Botões e as Garantias. Ela não repete ou exibe o nome do produto.
3. **Falta de Avaliações (Estrelas) no Topo:**
   - O resumo das avaliações (estrelas médias) não aparece perto do título ou do preço, o que quebra a prova social imediata na hora do check-in.

### O Padrão Ouro de Referência (O que deve ser feito)
Nos gigantes do mercado (ex: Udemy, Shopify Stores), a lógica de distribuição é invertida para otimizar o *Eye Tracking* (rastreamento ocular):

* **Coluna Esquerda (Foco Visual & Imersão):**
  - Deve começar DIRETAMENTE com a **Imagem de Capa / Galeria** (sem texto antes).
  - Em seguida: Descrição, Benefícios, Biografia e Seção de Avaliações.
* **Coluna Direita (O Check-in de Vendas Completo):**
  - A Ilha Flutuante deve ser o "Checkout Resumido". Ela deve concentrar, de cima para baixo:
    1. Tags/Badges (Categoria, Nível).
    2. **Título Principal do Produto** (`<h1>`).
    3. Prova Social (Estrelas e Nº de Avaliações).
    4. **O Preço** em destaque.
    5. Botões de Ação (Comprar/Adicionar).
    6. Garantias / Trust Features.

## 3. Conclusão
O layout atual "espalha" os gatilhos de venda: o aluno lê o nome na esquerda e o preço na direita. A estrutura ideal de alta conversão exige trazer o Título, as Tags e as Estrelas para dentro da Ilha Flutuante da direita, deixando a coluna da esquerda exclusivamente para o visual (Capa) e textos longos de leitura profunda.

A plataforma suporta essa refatoração estrutural perfeitamente. Como deseja prosseguir?
