# Auditoria Rigorosa — Retorno e Integração do RPC

## 1. A Chamada do RPC no Backend (`search-service.ts`)
A função `quickSearch` está implementada da seguinte forma:
```typescript
const { data, error } = await supabase
  .rpc('fuzzy_search_products', { search_term: query, max_results: 5 });
```
- **Parâmetros Enviados:** `{ search_term: string, max_results: number }`.
- **Possível Falha 1 (Assinatura SQL):** O PostgREST do Supabase é extremamente rígido com assinaturas. Se a função SQL foi criada no painel com nomes de parâmetros diferentes (por exemplo, `p_search_term` ou apenas `term`, e `limit_val` em vez de `max_results`), a chamada falhará com erro `400 Bad Request` (função não encontrada com esses argumentos específicos). 

## 2. O Tratamento do Retorno (Frontend e Service)
Após a chamada, o código valida e retorna os dados assim:
```typescript
if (!error && data) {
  return data as Pick<Product, 'titulo'>[];
}
// ... cai pro Fallback Local se a condição falhar
```
- **Possível Falha 2 (Retorno Nulo):** Se a função PL/pgSQL for escrita de uma forma que, quando não encontra resultados no `pg_trgm`, ela retorne `NULL` em vez de um array vazio `[]`, a condição `if (!error && data)` pode ser avaliada como verdadeira (se data for array vazio) ou pular a execução se `data` for null.
- **Possível Falha 3 (Fallback Impiedoso):** Se ocorrer qualquer erro na chamada do RPC (como a divergência de parâmetros mencionada acima), a função engole o erro e dispara o Fallback Local. O Fallback tenta fazer `p.titulo.toLowerCase().includes('poe')`. Como "poesia" não tem a exata sequência "poe" isolada (a não ser que seja tratada), o `.includes` pode não capturar, e o retorno será `[]`.

## 3. O Componente de Busca (`SearchBar.tsx`)
No componente visual, o retorno é recebido limpo:
```typescript
const results = await quickSearch(debouncedQuery);
if (active) setSuggestions(results);
```
- **Não há bloqueios no frontend:** O componente `SearchBar` aceita o que vier. Se recebeu o Empty State ("Nenhum resultado encontrado"), é porque o `quickSearch` devolveu estritamente um array vazio `[]`.

---
### Conclusão e Diagnóstico
O frontend não está filtrando ou descartando dados incorretamente. O gargalo do "poe" retornando vazio está ocorrendo **antes** da resposta chegar à tela.

A hipótese principal é que a chamada `.rpc()` está falhando (provavelmente por incompatibilidade no nome dos parâmetros exigidos pela função SQL criada no banco) e acionando o Fallback Local, que não tem inteligência Fuzzy.

Para prosseguir, precisamos validar o script SQL de criação da função `fuzzy_search_products` para garantir que ela espera exatamente os parâmetros `search_term` e `max_results`.
