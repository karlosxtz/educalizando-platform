# Carregamento de imagens — MinIO, 17/10/2026

## Medição em produção antes da mudança

- Home: 100 tags de imagem, 69 sem lazy loading, 30 URLs públicas MinIO distintas.
- Imagens públicas medidas: servidor `nginx`, sem `CF-Cache-Status`.
- Headers recebidos: `public, max-age=31536000, immutable, no-cache`.
  O `no-cache` obriga revalidação e contradiz a intenção de reutilização longa.
- Amostra de arquivos grandes: 1.558.732, 1.474.141 e 1.242.084 bytes.
- Downloads completos da amostra: aproximadamente 1,1 a 5,1 segundos nesta conexão.
  Isso é medição local, não promessa de tempo para todos os visitantes.

Dados locais completos: `.cloudflare/minio-image-measurements.json`.

## Alterações no código

- Logos de lojas/produtos, capas de combos e mosaicos carregam sob demanda,
  com dimensões declaradas e decodificação assíncrona.
- Banner no fim da home deixa de competir com prioridade alta.
- Banners no topo das lojas permanecem prioritários e em resolução original.
  As galerias ampliadas dos cinco temas também preservam o original.
- Preconnect/DNS-prefetch somente para o domínio existente do MinIO.
- Uploads são compactados uma vez no navegador: avatar até 320px/0,06MB;
  capa até 1200px/0,18MB; banner até 1920px/0,32MB, conforme o compressor.
  GIFs preservam a animação; PDF/PLR e materiais privados não são transformados.
- Leitura original continua direta do MinIO, sem otimizador, transformação paga,
  armazenamento ou proxy de bytes na Cloudflare.
- Suporte a previews WebP de até 480px, hospedados no mesmo bucket público MinIO.
  Só o manifesto de previews publicamente verificados permite trocar a URL.
  Sem entrada no manifesto, a imagem original é usada; se um preview falhar,
  há fallback para o original, sem parâmetros de cache busting.

## Previews antigos: preparação e pendência

`node scripts/optimize-minio-previews.mjs` faz inventário público somente leitura.
`--prepare` gera arquivos locais e um manifesto pendente, sem alterar o site.
`node scripts/optimize-minio-previews.mjs --write` cria novos objetos sob
`public-images/uploads/previews/v1/`, sem sobrescrever, apagar ou modificar
cadastros/originais. Processamento local com sharp, nunca no Worker. Novas URLs
dependem dos bytes gerados (hash), podendo receber cache imutável.

A execução S3 inicial parou antes de criar objetos porque as credenciais não
estavam disponíveis localmente. Após o login feito pelo usuário, foi usada a
interface de upload do console MinIO, sem extrair tokens ou criar credenciais.
Os arquivos foram preparados localmente e enviados em lote para a pasta nova.

Resultado: 249 referências correspondem a 240 arquivos únicos. Peso agregado
das referências: 63.664.751 bytes nos originais para 7.649.766 bytes nos previews,
redução de 88%. Todos os 240 objetos passaram em HEAD público com status 200,
Content-Type de imagem e tamanho igual ao arquivo local. Só então o manifesto
da aplicação foi preenchido. Originais, cadastros e buckets privados intactos.
O total de arquivos únicos adicionados é cerca de 7,45 MB; referências repetidas
explicam a diferença em relação ao total agregado acima.

A primeira publicação foi conferida na home: de 69 imagens sem lazy loading para
3, mantendo 100 tags no HTML. Isso não significa que o navegador espere rolar
para absolutamente toda imagem lazy: ele pode antecipar itens próximos da tela.

Comprovação local: `.cloudflare/minio-previews-uploaded.png` e
`.cloudflare/minio-preview-verification.json`. O manifesto atualizado precisa
ser publicado com a aplicação para os novos URLs serem usados.

## Cache no Nginx da VPS: ainda depende de acesso

Inspecionar a localização existente que atende `/public-images/`, preservando
seu proxy, CORS, TLS e cabeçalhos de segurança. Identificar a origem da diretiva
que acrescenta `no-cache` (por exemplo `expires -1` ou `add_header`). Corrigir
somente a entrega das imagens públicas com nomes únicos. Resposta esperada:

```
Cache-Control: public, max-age=31536000, immutable
```

Não aplicar isso a `private-materials`, `private-plr`, console MinIO, links
assinados ou respostas de autenticação. Não colar um novo bloco Nginx sem antes
conferir a configuração existente. Validar com `nginx -t` antes do reload e
conferir headers, CORS e acesso privado depois. Nenhuma regra Cloudflare é
necessária para esta correção.

## Arquivos alterados e motivos

| Arquivo | Motivo |
|---|---|
| src/components/HomepageMarketplace.tsx | Logos da faixa de lojas com lazy loading. |
| src/components/ProductCard.tsx | Logos pequenos sob demanda. |
| src/components/MarketplaceKitCard.tsx | Capa de combo sob demanda. |
| src/components/KitCoverMosaic.tsx | Mosaicos sem baixar todas as capas imediatamente. |
| src/components/MainBannersCarousel.tsx | Retirar prioridade alta de banners abaixo da dobra. |
| src/components/ui/CatalogImage.tsx | Lazy padrão, preview seguro e fallback para original. |
| src/components/CatalogCover.tsx | Capas usam preview apenas quando disponível. |
| src/app/loja/[slug]/themes/ThemeDefault.tsx | Galeria original e prioridade do banner da loja. |
| src/app/loja/[slug]/themes/ThemeMinimalist.tsx | Galeria original e prioridade do banner da loja. |
| src/app/loja/[slug]/themes/ThemeNetflix.tsx | Galeria original e prioridade do banner da loja. |
| src/app/loja/[slug]/themes/ThemePinterest.tsx | Galeria original e prioridade do banner da loja. |
| src/app/loja/[slug]/themes/ThemeLinkTree.tsx | Galeria original e prioridade do banner da loja. |
| src/app/layout.tsx | Antecipar conexão com o MinIO. |
| src/lib/catalog-image-url.ts | Resolver previews conhecidos no mesmo MinIO. |
| src/lib/minio-preview-manifest.json | Mapa de 249 referências para previews verificados no MinIO. |
| src/lib/image-upload-profile.ts | Limites de compressão por finalidade. |
| src/lib/object-storage-client.ts | Compressão no navegador antes do PUT direto MinIO. |
| src/components/dashboard/FileUpload.tsx | Remover compressão duplicada e informar finalidade. |
| scripts/optimize-minio-previews.mjs | Manutenção opcional dos previews sem alterar originais. |
| scripts/verify-direct-storage-upload.cjs | Atualizar fixture da compressão. |
| scripts/verify-minio-image-performance.cjs | Verificar URLs, lazy, formatos e proteção de arquivos privados. |
| ops/MINIO-IMAGENS-2026-10-17.md | Medições, implementação e pendências reais. |

## Validação local

Lint: zero erros, 17 avisos preexistentes. Typecheck Vinext e build de produção
Cloudflare com dry-run passaram. Testes de performance MinIO, upload direto,
regressões de cache/imagens Cloudflare e SEO de marca passaram.

Publicação do código não equivale a corrigir a configuração do servidor MinIO;
essa etapa continua dependente de acesso à VPS.
