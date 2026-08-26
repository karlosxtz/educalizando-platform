# Auditoria Pós-Execução — Falhas no Fluxo de Autenticação (Aluno e Criador)

Realizei a inspeção rigorosa dos componentes responsáveis pelo login de Alunos e cadastro de Criadores. O diagnóstico revelou uma falha arquitetural idêntica em ambos os fluxos, ligada ao comportamento do **Next.js App Router** ao lidar com cookies de sessão (Supabase) via *Soft Navigation*.

## 1. O Problema no Login de Aluno (`src/app/aluno/(auth)/login/page.tsx`)
**A Falha:** 
Após o `signInStudent` definir os cookies de sessão no navegador, o código invoca imediatamente um `router.push(getSafeReturnUrl())`.
- **Por que falha:** O `router.push` do Next.js executa um *soft navigation* (navegação via Client-Side Cache e RSC). O navegador **não anexa** imediatamente os novos cookies de autenticação recém-criados nas requisições do router. O Middleware do Next.js intercepta a rota `/aluno/dashboard` (ou o retorno para o checkout), não encontra o cookie `sb-access-token`, acha que o usuário não está logado, e aborta a navegação ou o joga de volta pro login (gerando um loop ou tela branca).
- **A Solução:** Assim como foi feito no login de criador, a navegação pós-autenticação deve ser forçada via **Hard Reload** (`window.location.href = getSafeReturnUrl()`), obrigando o navegador a despachar o cabeçalho com os novos cookies para o Middleware.

## 2. O Problema no Cadastro de Criador (`src/components/SignupForm.tsx`)
**A Falha:**
Após a função `registerCreatorInSupabase` concluir a criação do usuário e da loja, o formulário entra em estado de sucesso (disparando confetes e a tela de parabéns).
1. O redirecionamento automático (após 3 segundos) chama `router.push('/dashboard')`.
2. O botão manual "Acessar Meu Painel" chama `router.push('/dashboard')`.
- **Por que falha (1):** Mesmo motivo do aluno. O `router.push` faz uma requisição soft, o cookie de auth não sobe para o middleware, o acesso ao `/dashboard` é bloqueado, e o usuário "trava" na página ou é jogado para fora. Ao tentar se cadastrar de novo por frustração, recebe o erro de "E-mail já cadastrado".
- **Por que falha (2 - Rota errada):** A rota correta do painel do produtor atualizada é `/dashboard/loja` (conforme verificado no login de criador), e não apenas `/dashboard`.
- **A Solução:** Alterar os disparos de redirecionamento para `window.location.href = '/dashboard/loja'`.

## Conclusão e Próximo Passo
A causa do problema não está no Supabase ou no banco de dados, mas sim no método de roteamento assíncrono do Next.js que tenta navegar antes do cookie estar consolidado no *request context*.

Posso aplicar as correções e trocar os redirecionamentos para `window.location.href` em ambos os arquivos imediatamente, normalizando a autenticação. Qual o seu comando de execução?
