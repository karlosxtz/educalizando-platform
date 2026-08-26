# Auditoria Rigorosa — Auto-complete e Busca Inteligente

## 1. O Motor de Busca no Backend (`src/lib/search-service.ts`)
- **Limitação Atual:** A função `searchProducts` utiliza o operador `.ilike('titulo', \`%${filters.q}%\`)`. Embora ignore maiúsculas/minúsculas, ele exige correspondência exata de *substring*. Se o produto for "Situações Problema" e o usuário digitar "situação", o `.ilike` falhará (pois "ção" != "çõe").
- **Viabilidade do `.textSearch()`:** A migração para a funcionalidade nativa de *Full-Text Search* do Supabase é **altamente viável e recomendada**. 
  - Podemos substituir o `.ilike` por: `.textSearch('titulo', filters.q, { type: 'websearch', config: 'portuguese' })`.
  - O parâmetro `config: 'portuguese'` ativa o *stemming* nativo do PostgreSQL, que reduz as palavras aos seus radicais, tornando a busca naturalmente tolerante a singulares, plurais e variações ("situação" encontrará "situações").
- **Performance para Auto-complete:** A atual função `searchProducts` faz *joins* pesados (`store:store_id(*)`, `category_id(*)`). Para alimentar o dropdown do Auto-complete em tempo real, **não existe atualmente** uma função leve. Precisaremos criar uma nova função (ex: `quickSearch(q)`) que faça um `.select('id, titulo, slug')` com `.limit(5)`, poupando totalmente o banco de dados de processamento excessivo.

## 2. A Interface da Barra (`src/components/SearchBar.tsx`)
- **Estrutura Visual:** O componente está perfeitamente arquitetado para receber um dropdown. A tag principal `<form>` já possui as classes `relative group w-full`. Basta injetar uma `<div>` com `absolute top-full w-full mt-2` logo abaixo do `<input>` que a lista flutuante será renderizada com perfeição, sem quebrar o layout do cabeçalho.
- **Gerenciamento de Requisições (Debounce):** Uma análise no `package.json` revelou que **não temos** nenhuma biblioteca de debounce instalada (como `use-debounce` ou `lodash`).
  - Sem um *debounce*, o auto-complete faria uma requisição ao Supabase a cada tecla digitada (M, Ma, Mat, Mate, Matem, Matematica), esgotando os recursos do servidor e causando *flickering* na tela.
  - **Solução:** Como não há biblioteca, a melhor arquitetura é criar um Hook customizado nativo do React (`useDebounce`) diretamente no projeto, utilizando `useEffect` e `setTimeout` (geralmente 300ms a 500ms) para disparar a busca apenas quando o usuário parar de digitar.

---
### Conclusão e Próximos Passos
O terreno é extremamente favorável para a implementação de uma Busca Avançada e Auto-complete.
A arquitetura proposta para a próxima fase é:
1. Atualizar o `search-service.ts` com o `.textSearch('portuguese')` e criar o `quickSearch`.
2. Criar um hook `useDebounce` em `src/hooks/use-debounce.ts`.
3. Expandir o componente `SearchBar` para injetar o dropdown interativo.

Aguardo autorização para iniciarmos a construção desta *feature* premium.
