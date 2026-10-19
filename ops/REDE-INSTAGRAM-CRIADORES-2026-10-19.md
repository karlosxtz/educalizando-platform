# Rede de criadores no Instagram

## Onde acessar

Painel do criador → Marketing e crescimento → **Rede de criadores · Instagram**.
URL: https://www.educalizando.com.br/dashboard/rede-instagram

## Comportamento

- Os perfis válidos já informados no Instagram público de cada loja entram automaticamente, sem recadastro. A leitura respeita as políticas públicas atuais do Supabase.
- O criador pode corrigir, cadastrar ou remover o próprio perfil usando a mesma gravação de configuração da loja, sob RLS. Nenhum cadastro foi alterado durante a implementação.
- Uma conexão oficial já cadastrada na própria loja é oferecida como opção “Usar esse perfil”. Só salvar altera o Instagram público; uma identidade privada diferente não é divulgada automaticamente.
- Busca por nome, @ e descrição, paginação de 12 cards, ordenação diária e botão de novas descobertas. Não há compra de destaque ou classificação por seguidores.
- Cards com banner, logo, link da loja, link do Instagram e cópia do endereço. Se não houver imagem, mostra a inicial da loja.
- O botão “Visitar e seguir” abre o perfil oficial; não segue contas automaticamente e não afirma que o usuário passou a seguir.

## Fotos e estatísticas reais

Quando a integração oficial estiver habilitada e existir uma autorização válida para o mesmo @ já público da loja, o servidor solicita `username,profile_picture_url,followers_count,media_count` na API oficial. Exibe apenas os campos efetivamente retornados. Zero seguidores é mostrado como zero; ausência ou erro não viram um número inventado.

A liberação geral da Meta continua pendente. O módulo de publicação permanece com seu aviso de análise e a flag existente não foi ativada por esta implementação. Sem liberação, conta autorizada, token válido ou suporte aos campos pela Meta, a rede funciona com a foto da loja e informa que a quantidade de seguidores está indisponível. Apenas colar um link não autentica nem conecta uma conta ao aplicativo.

Não há scraping de Instagram, reprodução de publicações, novas permissões, publicação ou alteração de conexões OAuth. A referência da integração existente continua sendo [Instagram API com Instagram Login](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/).

## Privacidade e consumo

- API restrita a criador autenticado, respostas `private, no-store`, limite de 90 solicitações por minuto por loja. A rota é privada pelo layout do painel e não entra no sitemap.
- Diretório usa somente campos públicos explícitos. O identificador recebido para estatísticas deve pertencer a uma loja presente no diretório público. Uma conexão com @ diferente não é consultada na Meta.
- Credenciais são descriptografadas somente no servidor, vinculadas à loja e enviadas em Authorization para o host fixo da Meta; sem redirecionamento. Não aparecem nas respostas ou logs.
- Cache do diretório por um minuto em memória; estatísticas por uma hora e falhas por cinco minutos, com máximo de 256 entradas por isolate. Coalescência de requisições simultâneas e máximo de quatro consultas Graph simultâneas no isolate.
- O cliente carrega estatísticas apenas dos cards próximos da tela, duas chamadas por vez, sem polling. Com a integração desativada, nem inicia essas chamadas.
- Cache em memória não persiste entre reinicializações ou regiões do Worker; não representa uma garantia global de uma consulta por hora.
- Sem KV/R2/D1 adicional, sem migration, sem alteração de RLS, cobrança, checkout, Asaas ou webhooks.
- Imagens seguem diretamente do armazenamento atual ou do CDN oficial da Meta para o navegador. Não há transformação, armazenamento ou proxy de imagem na Cloudflare.

## Arquivos alterados

| Arquivo | Motivo |
| --- | --- |
| `src/app/dashboard/rede-instagram/page.tsx` | Interface responsiva, busca, descoberta, edição do próprio perfil e cards. |
| `src/components/dashboard/Sidebar.tsx` | Entrada da rede no painel do criador. |
| `src/app/api/creator/instagram-community/route.ts` | Diretório autenticado e resposta segura de estatísticas públicas. |
| `src/lib/instagram-community.ts` | Contrato público, validação estrita de perfis, CDN e números reais. |
| `src/lib/instagram-community-server.ts` | Consulta pública, cache e leitura protegida da API oficial. |
| `scripts/verify-instagram-community.cjs` | Verificação de autenticação, ausência de credenciais, cache e falhas seguras. |
| `ops/REDE-INSTAGRAM-CRIADORES-2026-10-19.md` | Uso, limites, privacidade e inventário. |

## Validação

Verificações de contrato/API com testes locais, lint, typecheck e build de produção Vinext/Wrangler. A leitura real de estatísticas de todas as contas depende da liberação da Meta e não foi confirmada nesta implementação.
