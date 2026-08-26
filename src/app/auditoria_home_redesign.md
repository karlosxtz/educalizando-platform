# Auditoria Rigorosa — Estrutura da Home Page (`src/app/page.tsx`)

## 1. O Cabeçalho Atual (Hero Section)
- **Estrutura de Largura:** O banner **NÃO** ocupa a largura total (`w-full`). Atualmente, ele está encapsulado dentro de um container com restrição de largura máxima: `<section className="max-w-7xl mx-auto px-4 ...">`.
- **Formato:** Não é um banner estático, mas sim um **Carrossel de 5 Banners** intercalados usando rolagem nativa (`flex overflow-x-auto snap-x`).
- **Fundo (Backgrounds):** Utiliza classes de gradiente do Tailwind para cada slide. Exemplos:
  - `bg-gradient-to-r from-blue-500 to-indigo-600`
  - `bg-gradient-to-r from-orange-400 to-pink-500`

## 2. As Categorias (Navegação Visual)
- **Origem dos Dados:** As categorias **não** vêm do banco de dados. Elas estão definidas estaticamente em um array fixo logo no início do arquivo: `const VISUAL_CATEGORIES = [ { name: 'Educação Infantil', emoji: '🎨', ... } ]`.
- **Renderização:** Elas são renderizadas como círculos coloridos com emojis dentro (`w-16 h-16 rounded-full`), formando uma fileira horizontal que o usuário precisa arrastar.

## 3. A Lógica das Lojas (Social Proof)
- **Busca de Dados:** A página invoca a função `getTopMarketplaceStores(4)` diretamente no Server Component, limitando o retorno a apenas 4 lojas.
- **Componente:** Cada loja na lista é repassada para um componente externo `<StoreCard store={store} />`.
- **Interatividade/Animação:** **Não há animação automática.** As lojas são renderizadas em um container de rolagem horizontal nativo (`overflow-x-auto snap-x`). O usuário precisa arrastar o dedo (ou scroll) manualmente para ver os cards, que ocupam um espaço fixo grande (`min-w-[280px]`).

---
### Conclusão e Viabilidade para o Redesign:
O terreno está perfeitamente mapeado. Para criar o novo **Banner Full-Width** e o **Carrossel Animado de Avatares ("Bolinhas")**, precisaremos:
1. Remover o container `max-w-7xl` apenas da seção do banner, substituindo-o por um `w-full` absoluto.
2. Trocar o array `VISUAL_CATEGORIES` pelas novas *pills* de navegação (Top Materiais, Licenças PLR, etc.).
3. Aumentar o limite de `getTopMarketplaceStores(4)` para pelo menos `10` ou `12` para encher a tela com as bolinhas redondas.
4. Substituir o uso do `<StoreCard />` grande por pequenos círculos renderizados localmente na própria `page.tsx` (`w-24 h-24 rounded-full`).
