# Correções verificadas em 12/10/2026

Publicado na Cloudflare: `2c4d6a51-9500-4f3e-9476-58aa0e855752`.

## Falhas corrigidas

- Capa do clube ainda usava upload binário pela rota antiga: agora usa o cliente compartilhado de upload direto ao MinIO, com compressão no navegador e autorização automática.
- Operações de clubes agora enviam explicitamente a sessão do usuário e renovam uma sessão expirada uma vez.
- Imagens antigas de clubes, lojas e materiais listados no clube são normalizadas para a origem pública correta.
- Entregas de materiais exclusivos também deixaram de enviar partes binárias pela Cloudflare. O arquivo e sua capa continuam em armazenamento privado.
- Respostas HTML/texto de gateways nas telas de clubes e exclusivos não aparecem mais como erros técnicos de JSON: recebem mensagens legíveis, preservando o formulário.
- O timer de progresso do upload geral encerra em erros, evitando intervalos abandonados. O seletor de imagem permite tentar novamente com o mesmo arquivo.

## Validação

- Upload autenticado de uma imagem PNG de 6 MB pelo editor de clube: compressão e envio concluídos; a prévia carregou do domínio MinIO. Não foi criado ou salvo um clube de teste.
- Homepage, busca, login, Loja da Prô, clube público da Loja da Prô e sitemap: HTTP 200 com resposta completa nesta verificação.
- Testes automatizados de renovação, upload direto, autenticação, privacidade e respostas não JSON passaram.
- Build Vite concluído; lint dos arquivos alterados passou. A verificação global de tipos acusa seis erros anteriores apenas em tipos gerados de `.next`.

## Limites da verificação

O teste de capa verificou upload e prévia; não sobrescreveu a capa de um clube real nem alterou assinaturas. Não foram executadas transações financeiras para testar pagamentos. A revisão não comprova a ausência de todo erro possível na plataforma.

O limite de CPU gratuito da Cloudflare já foi confirmado em auditoria anterior e não é removido por estas correções. A migração para a VPS permanece pendente de identificação e acesso ao painel. O usuário informou que não sabe seu endereço; nenhuma cobrança ou mudança de hospedagem foi feita.
