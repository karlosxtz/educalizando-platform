# Migração da Educalizando para Cloudflare Workers

## Estado da preparação

Configuração paralela criada com vinext e Cloudflare Vite Plugin. O build Next.js
usado pela Vercel continua sendo `npm run build`. Não foram alterados domínio,
DNS, banco, MinIO, Evolution, credenciais ou configurações de produção.

`npm run build:vinext` compilou com sucesso em 10/10/2026. O simulador iniciou
com `npm run start:vinext`; `/robots.txt` retornou 200. `/`, `/buscar` e a API de
upload retornaram 500 pela ausência local de `SUPABASE_SERVICE_ROLE_KEY`.
Isso não valida login, checkout, importação ou entrega de arquivos.

## Comandos locais

- `npm run dev:vinext`: desenvolvimento paralelo, porta 3001.
- `npm run build:vinext`: gera `.cloudflare/output`.
- `npm run start:vinext`: simula a compilação, porta 4173.
- `npm run deploy:vinext`: publicação; requer autenticação na conta Cloudflare.

Há um namespace KV para o cache de dados do Next/ISR. Ele tem limites próprios
no Free; monitorar leituras/escritas junto com CPU e requisições. Não ativar
Workers Paid, Images Paid ou KV pago automaticamente.

Não usar `npx wrangler deploy` sem adaptar o projeto: esta configuração usa o
formato de saída do Cloudflare Vite Plugin e `cloudflare.config.ts`.

## Variáveis e segredos

Copiar as variáveis necessárias da produção Vercel para a configuração de build
e de execução da Cloudflare. Variáveis `NEXT_PUBLIC_*` são públicas e precisam
estar disponíveis no build. Chaves privadas devem ser segredos de execução,
nunca receber o prefixo `NEXT_PUBLIC_` ou entrar em arquivos versionados.

Incluem Supabase (URL, chave pública e SERVICE_ROLE_KEY), OBJECT_STORAGE_*,
credenciais da Evolution, pagamentos, criptografia, e-mail e CRON_SECRET,
conforme os nomes já configurados em produção. Não colar valores no chat.
Para testes locais usar `.dev.vars`, ignorado pelo Git.

## Validações pendentes antes da troca de domínio

1. Validar as variáveis no Worker de teste e o login com cookies.
2. Validar uploads/importações usando a implementação `cloudflare/product-image-optimizer.js`
   com o binding IMAGES. A Vercel mantém sharp; Workers usa transformação WebP
   até 1920 px, sem ampliar. Os arquivos continuam no MinIO. Images Free oferece
   5.000 transformações únicas/mês; ao exceder, novas transformações falham sem
   cobrança automática. Não contratar Images Paid durante esta migração gratuita.
3. Validar DNS e proteção contra SSRF da integração WooCommerce. Workers usa
   resolve4/resolve6 no lugar de lookup (não implementado); endereços privados
   continuam bloqueados e falhas de resolução interrompem a importação.
4. Testar compra, callbacks, downloads privados, imagens e vídeos do MinIO.
5. Replicar os três agendamentos de `vercel.json` com autenticação CRON_SECRET,
   ativando-os somente na troca definitiva para não duplicar notificações.
6. Atualizar callbacks de autenticação/pagamentos para o endereço de teste
   quando necessário, sem substituir o domínio da loja antecipadamente.
7. Medir CPU real por requisição: Workers Free oferece 10 ms de CPU por chamada;
   SSR e processamento de imagens precisam ser medidos, mesmo com poucas vendas.
8. Garantir sitemap atualizado e testes de SEO/compra em celular.

Não publicar esta preparação como migração concluída. Manter a Vercel até
aprovar esses testes. Nenhum serviço pago de imagens/cache foi contratado.
# Correção do conflito com variáveis do painel

O script `deploy:vinext` publica a saída do Vite pelo Wrangler oficial,
com `keep_vars: true`, preservando variáveis cadastradas no painel e segredos.
Não inclua valores privados na configuração versionada. A configuração de
bindings ASSETS, IMAGES e VINEXT_KV_CACHE continua vindo de cloudflare.config.ts.
Validação sem publicar: `npm run deploy:vinext -- --skip-build --dry-run`.

