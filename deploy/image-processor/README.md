# Compactador de imagens na VPS

Este container recebe somente pedidos assinados pela aplicação. Ele consulta a
imagem pública de origem, gera WebP de até 1200 px (alvo 120 KiB) e miniatura
de até 480 px (alvo 45 KiB) e grava ambos diretamente no MinIO. O navegador do
comprador acessa o MinIO. Não utiliza Cloudflare Images nem transformação no Worker.
Os alvos de tamanho respeitam qualidade mínima; imagens detalhadas podem superar
o alvo. GIF animado é convertido para WebP animado, sem descartar a animação.

## Instalação no painel da Integrator

1. Envie esta pasta para a VPS ou use-a como contexto de build Docker. Ela contém
   Dockerfile, package.json, server.mjs e compose.yaml.
2. Copie `.env.example` para `.env.runtime`, preenchendo os valores apenas no
   servidor/painel. Crie um segredo aleatório com pelo menos 32 caracteres e uma
   conta de serviço do MinIO limitada ao caminho público de imagens otimizadas.
   Não use a conta raiz do MinIO e não envie essas informações por chat.
3. Execute `docker compose up -d --build` nesta pasta. O serviço escuta somente
   em `127.0.0.1:3180`, com limite de 512 MiB, 1 CPU e duas operações simultâneas.
4. No proxy HTTPS já usado pela VPS, publique um endereço dedicado para
   `http://127.0.0.1:3180`. `/health` deve retornar `{"ok":true}`. O POST sem
   assinatura deve responder 401. Não exponha a porta 3180 diretamente.
5. Configure na aplicação `IMAGE_PROCESSOR_URL` com esse endereço HTTPS e
   `IMAGE_PROCESSOR_SECRET` com o mesmo segredo. São variáveis privadas do
   servidor. Nenhuma chave deve receber prefixo `NEXT_PUBLIC_`.
6. Teste uma importação de imagem e confirme as variantes `full.webp` e
   `thumb.webp` em `public-images/uploads/optimized/v1/`. Só então considere a
   compactação automática das importações ativada.

Uploads normais já são compactados no navegador e enviados por URL assinada
diretamente ao MinIO. PDFs e arquivos privados de entrega não são transformados.
O novo serviço não altera produtos, RLS, compras ou permissões da loja.

## Permissão mínima no MinIO

A conta de serviço do compactador precisa somente de `s3:PutObject` no recurso
`arn:aws:s3:::public-images/uploads/optimized/*`. A gravação é condicional
(`If-None-Match: *`), com chave baseada no conteúdo para evitar cópias repetidas.
O serviço não lista buckets nem lê os materiais privados.

## Validação e reversão

O script `node scripts/verify-vps-image-processor.mjs` testa o processamento e a
autenticação localmente. Não ative as variáveis antes de instalar o container.
Para desativar somente o serviço, remova as duas variáveis privadas da aplicação;
os endereços MinIO já gravados continuam válidos.

O site continua na hospedagem existente. Este serviço separa o processamento e
a entrega das imagens; ele não migra a hospedagem da aplicação inteira.
