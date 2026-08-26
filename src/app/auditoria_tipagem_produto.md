# Auditoria Rigorosa — Tipagem de Produto e Roteamento

## 1. A Tipagem de Produto (`Product`)
A análise do arquivo **`src/lib/types.ts`** (linhas 75 a 104) revela a interface exata do `Product`.
As propriedades fundamentais de identificação são:
- `id: string` (UUID do produto)
- `store_id: string` (UUID da loja à qual o produto pertence)
- `titulo: string`

**Descoberta Crítica:** O banco de dados **NÃO POSSUI** uma coluna `slug` para produtos. A chave `slug` simplesmente não existe na tabela `products` nem na tipagem do TypeScript. O produto é puramente identificado pelo seu `id`. 

Isso explica de forma matemática o erro de build: `TS2344: Type '"slug"' is not assignable to type 'keyof Product'`. O nosso `.select('id, titulo, slug')` no `quickSearch` tentou extrair uma coluna fantasma.

## 2. O Roteamento Dinâmico do Produto
A análise da árvore de diretórios do Next.js dentro de `src/app/` confirmou outra arquitetura crucial:
- **Não existe** um diretório raiz `src/app/produto`.
- Toda a navegação de produtos está encapsulada dentro da vitrine das lojas.
- O caminho exato da pasta é: **`src/app/loja/[slug]/produto/[id]`**.

Portanto, o identificador da rota dinâmica é a pasta **`[id]`**, confirmando mais uma vez que o sistema utiliza o UUID do produto para a URL, e não um slug textual. 

Além disso, para montar a URL completa (`/loja/[store-slug]/produto/[id]`), precisamos não apenas do ID do produto, mas também do **slug da loja** (`store:store_id(slug)`).

---
### Conclusão e Próximos Passos
O diagnóstico é incontestável. A falha no deploy foi uma trava de segurança do TypeScript avisando que tentamos rotear usando dados inexistentes na tabela.

Para corrigir o build de forma definitiva:
1. No backend (`quickSearch`), devemos remover o `slug` fantasma e usar `.select('id, titulo, store:store_id(slug)')`.
2. O retorno tipado deve ser ajustado para acomodar o objeto aninhado da loja.
3. No frontend (`SearchBar`), o `href` do Link deve ser alterado de `/produto/${item.slug}` para a rota real completa: `/loja/${item.store.slug}/produto/${item.id}`.

Aguardando autorização para aplicar esta correção arquitetural.
