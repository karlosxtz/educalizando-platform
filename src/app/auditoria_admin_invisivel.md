# Auditoria Rigorosa — Ocultação da Loja Admin

## 1. A Rota de Lojas (`src/app/lojas/page.tsx`)
Inspecionei a vitrine pública de lojas. Ela renderiza a página consumindo os dados através da função **`getAllPublicStores()`**, que é importada do arquivo de serviços do Supabase.

## 2. A Função de Busca (`getAllPublicStores`)
Fui até `src/lib/store-service.ts` (linha 1116) para auditar a query. 
O vazamento ocorre porque a busca está sendo feita de forma irrestrita:
```typescript
const { data, error } = await supabase
  .from('stores')
  .select('id, nome_loja, slug, descricao, logo_url, banner_url, created_at')
  .order('created_at', { ascending: false });
```
**O Problema:** A query executa um `.select()` puro. Não existe nenhum `.eq('status', 'publicado')` ou similar, o que significa que o banco devolve absolutamente *todas* as lojas cadastradas, incluindo as contas internas da equipe administrativa.

Inspecionei a tipagem (`Store` em `src/lib/types.ts`) para ver se a tabela possuía uma coluna nativa para filtrar contas. Não encontrei propriedades como `role`, `is_admin` ou `status` prontas para uso.

## 3. O Perfil "Eduardo Admin"
Como a tabela de lojas (`stores`) não guarda o e-mail (guarda apenas o `creator_id`), nós não conseguimos usar o `NEXT_PUBLIC_SUPERADMIN_EMAIL` diretamente nessa query de forma simples.

A melhor estratégia, portanto, e a mais leve em termos de processamento, será adicionarmos filtros estritos de `.neq` (Not Equal) baseados nos **slugs** que pertencem ao administrador.

A correção ideal na query ficará assim:
```typescript
const { data, error } = await supabase
  .from('stores')
  .select('id, nome_loja, slug, descricao, logo_url, banner_url, created_at')
  .neq('slug', 'eduardo-admin')
  .neq('slug', 'admin') // Ocultamos outros slugs padrões por segurança
  .neq('slug', 'educalizando')
  .order('created_at', { ascending: false });
```

---
### Conclusão e Próximos Passos:
O diagnóstico foi cirúrgico e o vazamento acontece puramente por falta de filtros na busca do catálogo de lojas. 

O código não precisará de migrações no banco. Bastará aplicarmos os filtros `.neq('slug', '...')` na função `getAllPublicStores` (e também na `getTopMarketplaceStores`, que alimenta a Home) para deixarmos o seu perfil 100% invisível ao público, mas mantendo seu acesso normal via Painel.

Aguardo a ordem para executar o filtro de invisibilidade.
