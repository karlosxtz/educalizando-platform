# Auditoria Rigorosa — Estado do Auto-complete e Schema

## 1. O Schema e as Tipagens
A análise do arquivo `src/lib/types.ts` e das consultas existentes (`search-service.ts`) confirmam o mapeamento exato do banco de dados:
- **Tabela Principal:** `products`
- **Coluna de Busca:** `titulo` (onde estão armazenados os nomes dos materiais, como "Atividades de Matemática").
Estes são os nomes exatos que devem ser utilizados em qualquer script SQL (RPC) futuro para evitar quebras no banco.

## 2. O Motor Atual no Backend (`search-service.ts`)
Inspecionando a função `quickSearch`, constatamos o motivo exato pelo qual a busca falhou silenciosamente quando o termo "poé" foi digitado:
- Como o script SQL da função RPC `fuzzy_search_products` **não foi executado no Supabase**, a chamada `supabase.rpc(...)` retornou um erro interno (Função Inexistente).
- A função `quickSearch` possui um bloco `try/catch` que engole esse erro (`console.error('[quickSearch] Erro no Supabase:', err);`) e **aciona o Fallback Local** silenciosamente.
- O Fallback Local faz um filtro rígido: `.includes(qLower)`. Como "poé" não é uma *substring* exata de "poesia" ou "poemas", ele retorna um array vazio `[]`.

## 3. O Ponto de Quebra no Frontend (`SearchBar.tsx`)
A interface agiu exatamente como programada, mas foi vítima do retorno vazio do backend:
- O componente possui a validação segura `{suggestions.length > 0 && (...)}` antes de renderizar a lista `<ul>`.
- Como o backend retornou `[]` (devido à falha do RPC e à rigidez do `.includes()`), o componente recebeu zero sugestões.
- A validação falhou, e o frontend **apagou (ocultou) o dropdown instantaneamente**, deixando o usuário sem feedback (não há uma mensagem de "Nenhum resultado encontrado").

---
### Conclusão e Diagnóstico
A exclusão do dropdown ao digitar "poé" não foi um erro de travamento, mas sim o comportamento esperado de um sistema que:
1. Tentou chamar uma inteligência (RPC) que ainda não existe no banco.
2. Caiu no modo de emergência (Fallback Local).
3. Não encontrou a correspondência exata via `.includes()`.
4. Ocultou a lista por não ter nada para mostrar.

Para que a tolerância a erros (typos) funcione e "poé" encontre "poesia", **é estritamente necessário que o script SQL ativando o `pg_trgm` e criando a função RPC seja executado no painel do Supabase**, conectando a tabela `products` e a coluna `titulo`.
