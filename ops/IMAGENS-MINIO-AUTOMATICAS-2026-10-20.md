# Imagens no MinIO e compactação automática

## Estado verificado

- 591 referências do catálogo correspondem a 575 arquivos únicos.
- 304 miniaturas únicas já estavam no MinIO. Foram enviados somente os outros
  271 arquivos, preservando os nomes por hash e sem reenviar os existentes.
- Os 575 endereços públicos foram conferidos: HTTP 200, tipo de imagem e tamanho
  iguais aos arquivos preparados. Uma amostra também foi conferida por SHA-256.
- As referências do catálogo voltam a apontar diretamente para o MinIO.
- Os 575 binários foram retirados de `public/`, assim como sua regra de cache
  e o comando antigo de preparação de assets da Cloudflare.

## Cadastro

A compactação ocorre uma vez no navegador. Alvos: capa 1200 px / 0,12 MiB;
avatar 256 px / 0,03 MiB; banner 1920 px / 0,24 MiB. Não aumentar arquivos já
pequenos. O upload binário usa diretamente a URL assinada do MinIO; somente a
autorização usa a aplicação. PDF e entregas privadas não são transformados.
GIFs no cadastro preservam sua animação pelo fluxo existente.

## Importação

Foi preparado um serviço Docker para a VPS. A aplicação envia apenas metadados
assinados por HMAC. O serviço baixa a imagem pública, gera WebP e miniatura e
grava diretamente no MinIO, com chave baseada no conteúdo e escrita condicional.
Isso evita duplicar imagens mesmo se o link da origem renovar sua assinatura.
Há proteção contra acesso a redes privadas, redirecionamentos inseguros, arquivos
grandes, excesso de pixels e requisições não autenticadas. O destino é limitado
ao bucket público e o retorno é validado pelo escopo da loja/produto.

**A compactação das importações só ficará ativa depois da instalação do serviço
na VPS e da configuração privada de IMAGE_PROCESSOR_URL e IMAGE_PROCESSOR_SECRET.**
O painel informado foi `https://vps11334.panel.icontainer.net:2090`; o navegador
do agente bloqueou o acesso com `Access Temporarily Unavailable`. Não foi tentado
contornar esse bloqueio. O container não foi instalado nem ativado em produção.
Sem as variáveis, o caminho de importação anterior permanece disponível.

## Arquivos alterados e motivos

- `src/lib/image-upload-profile.ts`: alvos menores por finalidade.
- `src/lib/object-storage-client.ts`: compressão única no navegador; não aumentar
  imagens pequenas.
- `src/components/dashboard/FileUploadMultiple.tsx`: remover compressão duplicada.
- `src/lib/catalog-image-url.ts`: MinIO para as miniaturas existentes e associação
  automática full/thumb do novo serviço.
- `src/components/ui/CatalogImage.tsx`: comentário do fluxo atualizado.
- `src/lib/image-processor-client.ts`: integração privada por metadados e HMAC.
- `src/lib/woocommerce-media.ts`: encaminhar imagens ao serviço quando ativado;
  preservar tratamento de vídeos e arquivos privados.
- `deploy/image-processor/*`: serviço, Dockerfile, Compose, exemplos de configuração
  sem credenciais e instruções de instalação.
- `.env.example`: variáveis privadas opcionais do compactador.
- `public/images/catalog-previews/*.webp`: removidos da hospedagem Cloudflare;
  permanecem no MinIO com os mesmos hashes.
- `public/_headers`: remover regra dos assets de imagens retirados.
- `scripts/prepare-catalog-previews.mjs`: removido; não publicar miniaturas como
  assets da Cloudflare.
- `package.json`: comandos de teste; retirar a antiga preparação manual de assets.
- `scripts/verify-static-catalog-previews.cjs`: verificar MinIO, associação automática
  das miniaturas e ausência de binários no pacote da Cloudflare.
- `scripts/verify-minio-image-performance.cjs`: perfil de avatar atualizado.
- `scripts/verify-platform-image-recovery.cjs`: manter cobertura do download antigo
  quando o serviço ainda não está configurado.
- `scripts/verify-image-processor-client.cjs`: assinatura, isolamento e erros seguros.
- `scripts/verify-vps-image-processor.mjs`: compactação real, HTTP protegido,
  gravação full/thumb, reaproveitamento e ausência de duplicação por conteúdo.
- Este relatório e o aviso no relatório anterior: distinguir o que foi instalado
  do que ainda precisa de implantação na VPS.

O serviço não migra a hospedagem do site. Ele separa o processamento e o
armazenamento das imagens, sem alterar RLS, checkout, pagamentos ou regras de loja.

## Validação antes da publicação

Lint com zero erros e os 14 avisos anteriores; checagem de tipos e build de
produção/dry-run aprovados. Testes do compactador, autenticação HMAC, GIF animado,
cliente do compactador, uploads diretos, recuperação de imagem, retomada da
importação e gravação condicional aprovados. O teste do serviço foi local, com
MinIO simulado; a instalação e o teste real na VPS continuam pendentes.
