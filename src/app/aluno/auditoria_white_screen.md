# Auditoria Rigorosa — Diagnóstico da Tela Branca em `/aluno/login`

## 1. Análise do Protetor de Rota (`src/app/aluno/layout.tsx`)
**Encontramos o vilão absoluto (Loop de Redirecionamento).**
A lógica de proteção de rota dentro do layout do aluno foi escrita com base na leitura manual de cabeçalhos (`headersList`), da seguinte forma:
```typescript
const pathname = headersList.get('x-invoke-path') || headersList.get('next-url') || headersList.get('referer') || ''
const isAuthRoute = pathname.includes('/aluno/login') || pathname.includes('/aluno/cadastro')

if (!session && !isAuthRoute) {
  redirect('/aluno/login')
}
```
**Por que isso quebra tudo?**
No Next.js App Router (ainda mais na Vercel), quando o usuário faz uma navegação no lado do cliente (SPA Navigation) vindo da página `/entrar`, os cabeçalhos `x-invoke-path` e `next-url` frequentemente vêm vazios ou não confiáveis, e o cabeçalho `referer` aponta para a página *anterior* (ex: `/entrar`). 
Como a variável `pathname` acaba não contendo a string `'/aluno/login'`, a variável `isAuthRoute` fica falsa. Como ele não tem sessão, o código executa `redirect('/aluno/login')`. Ao tentar renderizar a página de login de novo, o layout roda novamente sob as mesmas condições erradas, forçando outro redirect. O navegador entra em Pânico (ERR_TOO_MANY_REDIRECTS) e exibe a Tela Branca/Erro de Conexão.

## 2. Análise da Página de Login (`src/app/aluno/login/page.tsx`)
A página em si está perfeitamente saudável:
- Possui a diretiva `"use client"` corretamente.
- Utiliza o `Suspense` ao redor do formulário `StudentLoginForm` para envolver o gancho `useSearchParams()`, o que está perfeitamente de acordo com as regras do Next.js.
- Não existem imports quebrados evidentes. 
A página nem sequer chega a ser renderizada porque o `layout.tsx` a estrangula no meio do caminho.

## 3. Conclusão dos Logs de Comportamento
Não se trata de um *Client-Side Crash* de Hydration, e sim um **Infinite Redirect Loop (Too many redirects)** causado exclusivamente pelo componente de Layout do servidor interceptando a própria rota de login que ele tenta liberar.

---
### O Plano de Correção Cirúrgica:
Não podemos usar `headersList` para ler a URL atual no Next.js App Router para fins de roteamento dinâmico estrito de layout. A arquitetura correta é remover a lógica de redirecionamento global do `layout.tsx` e proteger as páginas restritas de forma individual (ou criando um Grupo de Rotas `(protected)` dentro de `/aluno`, e deixando as rotas de auth `/aluno/login` fora do grupo protegido). 

Posso corrigir esse loop imediatamente extraindo a página de login para fora do layout protetor ou atualizando a estratégia de proteção. Aguardo a ordem de execução!
