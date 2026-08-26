# Auditoria Rigorosa — Botão Entrar e Sistema de Triagem

## 1. O Botão Atual (MarketplaceHeader)
- **Localização:** O botão principal está em `src/components/MarketplaceHeader.tsx` (linha 58).
- **Redirecionamento Atual:** Atualmente, ele é um componente genérico do Next.js apontando diretamente para a rota do produtor:
  `<Link href="/login" className="...">Entrar</Link>`

## 2. O Mapa de Logins (As Portas de Entrada)
Fiz o mapeamento completo das rotas de autenticação da plataforma. As três portas de entrada já existem fisicamente no projeto e estão separadas:
- **Login de Aluno:** Confirmei que existe a rota `src/app/aluno/login/page.tsx`.
- **Login de Produtor:** Confirmei que existe a rota raiz `src/app/login/page.tsx` (atualmente a rota padrão).
- **Login de Afiliado:** Confirmei que existe uma rota dedicada para afiliados em `src/app/afiliados/login/page.tsx`.

## 3. Viabilidade de Interface (Página vs Modal)
- **Componentes Atuais:** Inspecionei o diretório `src/components/ui`. Atualmente, **não** possuímos bibliotecas pesadas de Modal/Dialog instaladas (como Radix, Shadcn ou Headless UI). A pasta possui apenas um `CustomSelect.tsx`.
- **Recomendação de Arquitetura:**
  - **Opção A (Página Intermediária - Mais Limpa):** Em vez de entupir o cabeçalho global com lógicas de estado React (`useState`) para abrir modais, a arquitetura mais limpa e nativa para o Next.js App Router é criar uma página de triagem **`/entrar`** (`src/app/entrar/page.tsx`). O botão do cabeçalho apontará para `/entrar`. Nessa página, o usuário verá 3 *cards* gigantes e bonitos perguntando: "Como você deseja acessar?".
  - **Benefícios da Página `/entrar`:** Facilita o compartilhamento do link (deep-linking), garante acessibilidade nativa, funciona perfeitamente no mobile sem bugar o scroll da tela e mantém o `MarketplaceHeader` livre de renderização do lado do cliente (`"use client"`).

---
### Conclusão:
Temos as três rotas de destino prontas. O cabeçalho aponta para o lugar errado de forma estática. A estratégia de criar uma página `/entrar` dedicada para a triagem é a mais sólida e profissional. Aguardo sua autorização para criar a tela `/entrar` e redirecionar o cabeçalho!
