# Acesso e segurança da Educalizando

## No site

- Login de comprador, criador e afiliado: link ou código por e-mail, sem criar contas implicitamente.
- Reenvio de confirmação de cadastro nesses mesmos formulários.
- `/seguranca`: senha com confirmação por código, troca confirmada de e-mail, aplicativo autenticador (TOTP), confirmação e remoção de fatores, métodos de login.
- `/admin/convites`: convites restritos ao administrador, para compradores ou criadores.
- `/auth/confirmar`: retorno da confirmação, link mágico, Google e convite; sincroniza a sessão e conclui a loja de novos criadores.
- Contas com fator verificado precisam de AAL2 nas rotas protegidas e nas APIs que usam `getRequestUser`. O segundo fator não é exigido antes de concluir seu cadastro.
- Google e telefone de autenticação só aparecem quando os respectivos provedores estão habilitados no Supabase. O telefone de autenticação é separado do WhatsApp comercial.

## Aplicar os modelos e ativar avisos no Supabase

Os arquivos de `supabase/email-templates/` incluem os 13 modelos completos e seus assuntos em `auth-config.json`. Estes arquivos não contêm credenciais.

O pacote ativa confirmação de cadastro, confirmação segura da troca de e-mail, reautenticação para senha, vinculação manual, TOTP e os sete avisos de segurança. Não muda chaves de API, SMTP, provedores ou registros DNS.

Um operador autenticado pode executar `node scripts/configure-auth-emails.mjs --apply` com `SUPABASE_ACCESS_TOKEN` (token pessoal de gerenciamento, nunca a chave service_role) e `SUPABASE_PROJECT_REF` no ambiente. Não cole tokens em chats nem os salve no repositório. O comando preserva a lista de redirecionamentos e verifica o resultado remoto.

Sem token de gerenciamento, aplique pelo painel:

1. Authentication → Emails → Templates: copie o assunto correspondente de `auth-config.json` e o HTML de cada arquivo.
2. Ative todos os sete avisos em Segurança e salve.
3. Authentication → Sign In / Providers → Email: habilite confirmação de cadastro, troca segura de e-mail e alteração segura de senha.
4. Authentication → URL Configuration: Site URL `https://www.educalizando.com.br`; autorize `https://www.educalizando.com.br/auth/confirmar`, `https://www.educalizando.com.br/auth/confirmar?**` e `https://www.educalizando.com.br/redefinir-senha`. Preserve os destinos existentes necessários.
5. Authentication → MFA: habilite cadastro e verificação TOTP. Ative vinculação manual de identidades nas configurações de autenticação.
6. Configure SMTP do Resend para o domínio verificado, caso ainda não tenha sido salvo. Desative rastreamento de links dos e-mails de autenticação no Resend.

## Google e SMS — configuração externa pendente

Google exige um cliente OAuth no Google Cloud e seu ID/segredo no provedor Google do Supabase. O retorno autorizado no Google é `https://ljmfonterxaiqvbdfkye.supabase.co/auth/v1/callback`. Nunca exponha o segredo no navegador.

SMS exige a contratação/configuração de um provedor compatível em Authentication → Phone. Não ativar telefone antes de configurar o provedor. A interface ficará oculta enquanto o Supabase informar que o provedor está desabilitado.

## Validação antes da ativação em produção

1. Cadastro novo: recebe confirmação, não cria sessão fictícia, cria loja só depois de confirmar; comprador retorna aos materiais.
2. Link mágico e código: ambos entram em conta existente; retorno externo é rejeitado.
3. Convite pelo administrador: usuário recebe, aceita e define senha em Segurança. Não enviar convites de teste a terceiros.
4. Senha e e-mail: conferir confirmação, avisos e recuperação; testar antigo e novo e-mail.
5. TOTP: cadastrar, confirmar, sair, entrar; painel/API financeira deve bloquear AAL1; confirmar código e liberar; remover fator após verificar identidade.
6. Google/SMS: testar somente após configurar provedores. Vincular/remover método mantendo uma forma de acesso.

Testes locais: `npx ts-node -P tsconfig.test.json scripts/verify-auth-security.ts`, `node scripts/verify-auth-emails.mjs`, `npm run build:vinext`.

Configurar modelos de e-mail no Supabase não exige deploy. As novas telas e proteções precisam do deploy da branch Cloudflare.
