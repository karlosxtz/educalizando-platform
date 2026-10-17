# Upload direto ao MinIO

O navegador solicita uma autorização em `/api/storage/presign-upload` e envia o arquivo diretamente para `https://arquivos.educalizando.com.br` por PUT. A API recebe apenas nome, tamanho, tipo e destino lógico; nenhum conteúdo binário é enviado pelas telas para as antigas rotas de upload da aplicação.

Não existe renovação manual. Cada envio recebe uma assinatura com validade de 15 minutos. Uma resposta 401 na autorização renova a sessão uma vez; uma autorização vencida ou falha transitória no armazenamento solicita outra assinatura e repete o envio uma vez. Se a sessão foi revogada, o usuário precisa entrar novamente. Não são distribuídas credenciais permanentes do MinIO.

Imagens são comprimidas no navegador. As capas, logos, banners e avatares usam `public-images`; materiais e arquivos PLR usam respectivamente `private-materials` e `private-plr`, com referências privadas `minio://`. A assinatura vincula o objeto gerado pelo servidor, o tipo, o tamanho exato e o controle de cache. Não aceita caminhos ou buckets físicos fornecidos pelo cliente. O limite continua em 15 MB.

O PUT não encaminha cookies nem o token da plataforma para o MinIO. As autorizações não podem ser armazenadas em cache; o destinatário do arquivo é restrito ao domínio de armazenamento conhecido. As rotas antigas continuam disponíveis para compatibilidade, mas o cliente compartilhado não as utiliza. Importações feitas no servidor ainda usam o armazenamento pelo servidor.

## Verificação

- `node scripts/verify-direct-storage-upload.cjs`: expiração automática, renovação de sessão, autenticação, validação, privacidade, limite de tentativas e buckets privados.
- `node scripts/verify-storage-upload.cjs`: compatibilidade do fluxo legado, integridade e isolamento dos materiais.
- CORS verificado por OPTIONS, sem gravação: os três buckets aceitaram PUT com `content-type,cache-control` para o domínio oficial.
- Build Vite concluído e publicado em 12/10/2026 (versão `54cd21dc-ce7b-41cd-9c45-c076b83b9335`). Upload autenticado de PNG pelo painel confirmou armazenamento WebP direto no MinIO e prévia carregada. As configurações da loja não foram salvas durante o teste; o formulário foi recarregado depois.
- A renovação de sessão/assinatura e os buckets privados foram verificados nos testes automatizados. Não foi feito upload real de um material PDF/PLR nesta validação. O verificador TypeScript global ainda acusa seis erros anteriores em tipos gerados de `.next`, sem erros nos arquivos deste fluxo.
- Limites de CPU do Worker podem afetar outras operações da plataforma, mesmo sem transportar arquivos.

Referências: [uploads com URL assinada](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html), [CORS do MinIO](https://docs.min.io/aistor/administration/cors-configuration/).
