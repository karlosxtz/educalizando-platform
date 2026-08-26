# Auditoria Rigorosa — Rastreamento da Rota de Busca Principal

## 1. A Rota de Resultados (`src/app/buscar/page.tsx`)
A inspeção do arquivo que renderiza a página de resultados (`/buscar`) revela a exata conexão com o banco de dados:
- A página lê a query string da URL (`searchParams.q`).
- Ela delega a busca para a função **`searchProducts`** (do arquivo `search-service.ts`), repassando todos os filtros (query, categoria, preço, ordenação).

## 2. O Gargalo em `searchProducts` (`src/lib/search-service.ts`)
Aqui está a causa exata do problema relatado pelo usuário (por que o "poe" falhou na página de resultados):
- A função **`searchProducts` não sofreu a refatoração do Fuzzy Search**. 
- Ela ainda possui o seguinte código em sua linha 45: 
  `query = query.textSearch('titulo', filters.q, { type: 'websearch', config: 'portuguese' });`
- **O Conflito de Regras:** O Auto-complete (via `quickSearch`) ficou extremamente inteligente (Fuzzy Search tolerante a "poe"), mas a página oficial de resultados (via `searchProducts`) continuou com a regra engessada do PostgreSQL Full-Text Search. Quando a barra de pesquisa empurrou o usuário para `/buscar?q=poe`, a página bateu no `.textSearch()`, que não entendeu o fragmento, retornou `0` materiais e acionou o Empty State.

---
### Conclusão e Diagnóstico
O problema atual não é um bug de roteamento ou de UI, mas sim um caso clássico de **sistemas dessincronizados**. Nós aplicamos a inteligência Fuzzy na busca rápida da barra (`quickSearch`), mas esquecemos de injetá-la no "motorzão principal" (`searchProducts`), que alimenta a vitrine completa de produtos.

Para consertar isso e unificar a inteligência, **não podemos simplesmente jogar um `.rpc()` na `searchProducts`**, porque ela precisa lidar com Paginação e múltiplos Filtros combinados (Categoria, Preço, Ano Escolar, Formato), coisa que nosso RPC básico não faz.

**Alternativas de Solução:**
1. **Solução Rápida:** Trocar o `.textSearch()` por `.ilike('titulo', \`%${filters.q}%\`)` dentro do `searchProducts`. Resolve fragmentos imediatamente, mas perde a inteligência de similaridade do Fuzzy para erros ortográficos.
2. **Solução Robusta (Recomendada):** Fazer a busca híbrida do Supabase dentro do próprio TypeScript (combinando `.ilike` no encadeamento) ou refatorar o `.textSearch` para trabalhar em conjunto com uma query mais permissiva no backend.

Aguardando direcionamento.
