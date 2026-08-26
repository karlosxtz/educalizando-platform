# Auditoria Rigorosa — Diagnóstico de Falha no Auto-complete

## 1. O Motor de Busca Rápida (`src/lib/search-service.ts`)
- **Uso do `.textSearch()`:** A função `quickSearch` está de fato utilizando `.textSearch('titulo', query, { type: 'websearch', config: 'portuguese' })`.
- **A Causa do Problema com Fragmentos:** O PostgreSQL Full-Text Search (FTS) funciona através de dicionários e "tokens" (palavras inteiras e seus radicais). Ele não é projetado para buscas parciais de substring no meio da digitação (ex: "ofici" para "oficina"). O FTS exige a palavra completa ou quase completa. Por isso, ao digitar uma palavra pela metade ou com erro de digitação ("oficna"), o banco não encontra o token exato e retorna um array vazio `[]`.
- **Viabilidade do `.ilike()`:** Migrar apenas a `quickSearch` de volta para o `.ilike('titulo', \`%${query}%\`)` é uma solução **perfeita e viável**. O `.ilike()` lida perfeitamente com *substrings* e erros no meio da digitação. Mantendo o `.textSearch()` na busca principal (`searchProducts`), nós conquistamos o melhor dos dois mundos: Auto-complete tolerante a fragmentos em tempo real, e Busca Principal tolerante a plural/singular.

## 2. O Estado do Frontend (`src/components/SearchBar.tsx`)
- **Gestão de Estado de Carregamento (`isSearching`):**
  - O bloco atual do `useEffect` faz a chamada sequencial: `setIsSearching(true)` -> `await quickSearch` -> `setIsSearching(false)`.
  - **Falta Crítica:** Não existe um bloco `try / catch / finally`. Se a promessa de rede do Supabase for rejeitada, sofrer um timeout, ou se o `quickSearch` disparar um erro não tratado internamente, a execução da função `fetchSuggestions` é abortada prematuramente. O código nunca alcança o `setIsSearching(false)`, resultando na famosa "lupinha rodando infinitamente" travando a interface.
- **Renderização com Array Vazio:**
  - Quando a busca não encontra nada (ex: fragmento inválido), `quickSearch` devolve `[]`. O frontend oculta o dropdown corretamente (`suggestions.length > 0`), mas o estado de carregamento dependia puramente de um caminho feliz perfeito para ser desativado.

---
### Conclusão e Próximos Passos
O diagnóstico foi concluído com precisão cirúrgica. A falha no carregamento e a falta de resultados para palavras pela metade possuem motivos arquiteturais claros.

Para aplicar a resolução definitiva, as seguintes ações são recomendadas:
1. **No Backend (`search-service.ts`):** Substituir `.textSearch` por `.ilike('titulo', \`%${query}%\`)` dentro do `quickSearch`.
2. **No Frontend (`SearchBar.tsx`):** Envolver a chamada de busca em um bloco `try / finally` para garantir que `setIsSearching(false)` execute incondicionalmente. Opcionalmente, pode-se tratar as "race conditions" (quando o usuário digita mais rápido que a resposta do banco) usando uma variável booleana de controle (ex: `let active = true`).

Aguardando autorização para executar a correção.
