# Separação entre login de cliente e criador

## Problema e comportamento corrigido

O login por senha do cliente aceitava qualquer usuário do Supabase. A leitura da sessão repetia o problema: retornava também contas identificadas como criadoras. A área protegida do cliente não tinha validação de perfil no servidor.

Agora o login do cliente recusa contas de criador, informa o acesso correto e encerra a sessão criada na tentativa recusada. Contas antigas com loja própria também são identificadas. Se a consulta de perfil falhar, o acesso não é liberado como cliente. A validação no servidor redireciona criadores para seu painel antes de renderizar páginas da área do cliente, abrangendo também acesso direto, links de e-mail e Google. O encerramento do fluxo de autenticação reconhece lojas antigas ao escolher o destino.

Não houve alteração de RLS, isolamento das lojas, registros de contas ou compras, credenciais, checkout, webhooks ou autorização dos arquivos de entrega. A identificação de área não concede acesso a lojas; a propriedade continua sendo validada pelas regras existentes.

## Arquivos alterados e motivos

- `src/lib/account-area.ts`: resolução compartilhada da área por identificação de cadastro ou propriedade de loja; falha fechada quando a consulta não responde.
- `src/lib/student-service.ts`: validação antes de salvar/sincronizar o login do cliente, encerramento de tentativas recusadas e exclusão de criadores da sessão do cliente.
- `src/lib/role-service.ts`: remove a premissa de que qualquer usuário autenticado possui perfil de cliente; trata falhas de consulta sem conceder esse perfil.
- `src/app/aluno/(protected)/layout.tsx`: validação de identidade e área no servidor para as páginas do cliente, incluindo o alias `/cliente`.
- `src/app/aluno/(auth)/login/page.tsx`: texto do link para o acesso de criador compatível com a mensagem da recusa.
- `src/app/api/auth/complete/route.ts`: destino de autenticação coerente para criadores com lojas antigas, sem mudar o cadastro existente.
- `scripts/verify-account-area.cjs`: testes de comportamento do login, encerramento da sessão e proteção do servidor.
- `ops/SEPARACAO-LOGIN-CLIENTE-CRIADOR-2026-10-20.md`: registro da correção e validação.

## Validação

- `node scripts/verify-account-area.cjs`: passou; criador, seller, admin, is_creator, criador legado, indisponibilidade de consulta, cliente legítimo, limpeza da sessão e bloqueio no servidor.
- `node node_modules/ts-node/dist/bin.js -P tsconfig.test.json scripts/verify-auth-security.ts`: passou; destinos seguros e MFA.
- `node scripts/verify-buyer-growth.cjs`: passou.
- `node scripts/verify-teaching-workspace.cjs`: passou.
- `npm run lint`: passou, zero erros e 14 avisos preexistentes.
- `npm run typecheck:vinext`: passou.
- `node scripts/deploy-cloudflare.mjs --dry-run`: build de produção e empacotamento Cloudflare passaram.

Os cenários autenticados foram executados com sessões simuladas nos testes, sem pedir, ler ou utilizar senhas de contas reais. A confirmação final com a conta específica do usuário deve ser feita por ele no navegador.
