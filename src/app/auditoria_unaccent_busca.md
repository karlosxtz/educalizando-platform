# Auditoria Rigorosa — Aplicação de Unaccent na Busca Principal

## 1. A Construção da Query Atual (`src/lib/search-service.ts`)
A função `searchProducts` aplica a busca de texto atualmente da seguinte forma:
```typescript
if (filters.q) {
  query = query.ilike('titulo', `%${filters.q}%`);
}
```
O método `.ilike()` é excelente para ignorar *maiúsculas e minúsculas* (case-insensitive) e lidar com fragmentos. No entanto, ele **não ignora acentos**. Para o `ilike`, "poe" é matematicamente diferente de "poé".

## 2. A Limitação do Supabase (PostgREST) com Funções Nativas
O cliente Javascript do Supabase (que é uma ponte para a API PostgREST) é construído para mapear métodos em colunas exatas da tabela.
- **A Tentativa `.ilike('unaccent(titulo)', ...)`:** Se tentarmos usar `.ilike('unaccent(titulo)', '%poe%')` ou `.filter('unaccent(titulo)', 'ilike', ...)`, a requisição vai falhar com erro `400 Bad Request: Column not found`. O PostgREST procurará literalmente por uma coluna cujo nome da string seja `"unaccent(titulo)"`. Ele não permite a injeção de "Raw SQL" (funções) diretamente no nome da coluna por questões de segurança (prevenção contra SQL Injection).

## 3. As Soluções Arquiteturais Viáveis
Como não podemos envelopar a coluna na chamada do frontend, precisamos que o banco de dados já forneça essa versão sem acentos. Temos três caminhos de arquitetura:

**A) Coluna Gerada (Generated Column) - (A Mais Simples e Recomendada):**
Podemos rodar um script SQL rápido no Supabase que cria uma coluna invisível/extra chamada `titulo_limpo` que se auto-atualiza.
*SQL:* `ALTER TABLE products ADD COLUMN titulo_limpo text GENERATED ALWAYS AS (unaccent(titulo)) STORED;`
*Vantagem:* No backend, só precisaremos mudar para `.ilike('titulo_limpo', \`%${filters.q}%\`)`. Todos os outros filtros de paginação e ordenação continuam funcionando perfeitamente.

**B) View do Banco de Dados:**
Criar uma "Vitrine Virtual" (View) chamada `public.vw_products` que pega tudo de `products` e adiciona o `unaccent(titulo)`.
*Vantagem:* Não altera a tabela original.
*Desvantagem:* Temos que mudar o `.from('products')` para `.from('vw_products')`.

**C) Função RPC:**
Transformar a `searchProducts` inteira em uma super função PL/pgSQL (como fizemos no auto-complete).
*Desvantagem:* Muito complexo, pois precisaríamos reconstruir toda a lógica de filtros opcionais (categoria, preço, etc.) e paginação dentro do SQL.

---
### Conclusão e Diagnóstico
A falha em encontrar "poética" ao digitar "poe" ocorre porque o `.ilike` é estrito em relação a acentuação e a API do Supabase nos impede de usar `unaccent()` diretamente no JavaScript.

A solução cirúrgica mais limpa, performática e que preserva 100% da inteligência atual da `searchProducts` é a **Solução A (Coluna Gerada)**.

Aguardando autorização para criar a *migration* do banco e ajustar o backend.
