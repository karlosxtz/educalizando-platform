# Auditoria Rigorosa — Barra de Busca no Cabeçalho

## 1. A Estrutura do Input e Botão de Busca
O arquivo auditado foi **`src/components/MarketplaceHeader.tsx`**.
- **Natureza do Componente:** Atualmente, ele é um **Server Component** (não possui a diretiva `"use client"` no topo). 
- **Gestão de Estado:** **NÃO** existe nenhum `useState` gerenciando o valor digitado. O elemento `<input>` está estruturado puramente como um componente visual estático (um *dummy component*), sem atributos `value` ou `onChange`.

## 2. Os Manipuladores de Evento (Ações de Disparo)
- **Tag Form:** O bloco da barra de pesquisa não está envolvido por nenhuma tag `<form>`. Ele está encapsulado apenas por uma `<div>` com classes de estilo (`className="relative group"`).
- **Eventos (`onClick` / `onKeyDown`):** O botão "Buscar" não possui evento `onClick`. O `<input>` não possui evento `onKeyDown` (para capturar o Enter). 
- **Roteamento:** Como não é um *Client Component* e não há eventos, o roteador do Next.js (`useRouter`) nem sequer foi importado no arquivo. Consequentemente, não há nenhuma função disparando `router.push('/buscar?q=...')`.

## 3. Tratamento de Parâmetros e Acentuação
- **Sanitização e Encoding:** Como o campo é estático e não intercepta os dados digitados, também não existe nenhum mecanismo de formatação (`encodeURIComponent` ou limpeza de espaços). Qualquer termo digitado fica preso no lado do cliente (no DOM do navegador) e desaparece quando o usuário clica.

---
### Conclusão e Próximos Passos:
O diagnóstico é cirúrgico: a barra de pesquisa do cabeçalho é apenas um *mockup visual* e está totalmente "morta" em termos de lógica. 
Para torná-la 100% funcional, as seguintes alterações arquiteturais serão necessárias:
1. Transformar o `MarketplaceHeader` (ou criar um sub-componente específico para a busca) em um **Client Component** (`"use client"`).
2. Adicionar o **estado** (`useState`) para o termo digitado.
3. Envolver o conjunto em um `<form onSubmit={handleSearch}>` para capturar tanto o clique do botão quanto a tecla "Enter".
4. Aplicar `encodeURIComponent` e disparar o **redirecionamento** via `useRouter()`.

Aguardando autorização e escopo para executar a cirurgia de refatoração.
