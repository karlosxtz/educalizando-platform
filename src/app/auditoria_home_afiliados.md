# Auditoria Rigorosa — Seção de Afiliados na Home

## 1. Localização e Estrutura do Componente
O rastreio em `src/app/page.tsx` localizou a seção de afiliados (Seção 7 do layout) a partir da linha 365.
- **Formato:** O bloco não é um componente isolado (como `<AffiliateSection />`). É um código JSX "solto" diretamente embutido na página inicial.
- **Classes que quebram o padrão (Fundo Escuro):**
  A tag `<section>` que encapsula a área utiliza a seguinte estrutura de classes Tailwind que impõe o "Dark Mode" artificial:
  `className="bg-slate-900 text-white py-20 border-t border-slate-800 relative overflow-hidden"`
  
  Há também um efeito de "brilho" decorativo hardcoded:
  `className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500 rounded-full blur-[120px] opacity-20 -translate-y-1/2 translate-x-1/3"`

## 2. Mapeamento do Copywriting Atual
A seção possui uma copy de conversão focada em afiliados. Abaixo os textos exatos e atuais:

- **Título Principal:** "Ganhe comissão divulgando lojas parceiras"
- **Subtítulo:** "O Programa de Afiliados Educalizando permite que você lucre indicando os melhores materiais didáticos do mercado."

### Cards Simulados de Lojas (Dados Hardcoded)
O grid possui 4 Cards fictícios, com estilos de fundo escuro (`bg-slate-800/50`):

1. **Card 1:** 👩‍🏫 "Prof. Maria Ensina" (Atividades Lúdicas) — "50% de Comissão"
2. **Card 2:** 🎲 "Jogos & Saber" (Jogos de Tabuleiro) — "40% de Comissão"
3. **Card 3:** 🚀 "Material PLR PRO" (Direitos de Revenda) — "60% de Comissão"
4. **Card 4:** 🖍️ "Artes Criativas" (Pinturas e Formas) — "45% de Comissão"

### Botões de Ação (CTAs)
- **Botão Secundário:** "Ver todas as lojas" (`href="/buscar?filter=stores"`)
- **Botão Primário:** "Quero ser afiliado" (`href="/afiliados/cadastro"`)

---
### Conclusão e Próximos Passos:
O diagnóstico confirma que a estrutura é fixa e dependente de classes de fundo escuro (como `bg-slate-900`, `text-white`, e `bg-slate-800`). Para alinhar essa seção ao padrão visual *clean* e "Premium Apple" da plataforma, precisaremos reescrever as tags de classe para a paleta clara (`bg-slate-50` ou `bg-white`) e atualizar a copy com os novos benefícios institucionais solicitados ("Vitrine Própria, Comissões Flexíveis", etc.).

Aguardo suas instruções de redesign para substituir a seção.
