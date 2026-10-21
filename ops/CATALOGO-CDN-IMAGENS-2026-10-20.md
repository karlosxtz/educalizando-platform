# Capas e logos leves no catálogo

> Atualização posterior: os assets de imagens foram transferidos para o MinIO.
> O fluxo atual está em `IMAGENS-MINIO-AUTOMATICAS-2026-10-20.md`.

## Diagnóstico

A busca por objetivo misturava miniaturas já geradas com capas importadas
servidas diretamente pelo MinIO e imagens públicas antigas no Supabase.
As importações no Worker preservam os bytes originais (não há transformação
paga habilitada). Assim, imagens novas não entravam automaticamente no
manifesto de miniaturas existente.

## Alteração

As miniaturas verificadas são publicadas como assets estáticos da Cloudflare,
em URLs com hash de conteúdo e cache imutável por um ano. Não existe proxy,
download autenticado ou processamento de imagem durante a visita do comprador.
Os originais continuam preservados como fallback e para visualização ampliada.
As primeiras quatro capas da busca por objetivo recebem prioridade; as demais
continuam com carregamento gradual.

A preparação lê apenas o catálogo público com chave pública anon, limita os
domínios e buckets permitidos, rejeita URLs assinadas, redirecionamentos e
arquivos privados. Os WebP gerados são decodificados e conferidos antes de
entrarem no manifesto. Nenhuma tabela, RLS ou entrega paga foi alterada.

## Arquivos alterados e motivo

- `scripts/prepare-catalog-previews.mjs`: preparação local e repetível das
  miniaturas públicas, reaproveitando as existentes.
- `src/lib/catalog-preview-manifest.json`: associação explícita entre original
  público e miniatura estática verificada.
- `public/images/catalog-previews/*.webp`: miniaturas reais com hash de conteúdo.
- `src/lib/catalog-image-url.ts`: usar a miniatura da CDN quando disponível,
  preservando o endereço original e a compatibilidade com as miniaturas antigas.
- `src/components/ui/CatalogImage.tsx`: documentar o caminho de entrega atualizado.
- `public/_headers`: cache imutável somente para os novos assets públicos.
- `src/app/encontrar-material/page.tsx`: priorizar as primeiras quatro capas.
- `package.json`: comando de manutenção `npm run optimize:catalog-previews`.
- `scripts/verify-static-catalog-previews.cjs`: integridade, decodificação,
  dimensão, hash, escopo público, preservação dos originais e cache.
- `scripts/verify-minio-image-performance.cjs`: compatibilidade do teste existente
  com o novo manifesto de assets.
- Este relatório: diagnóstico, validação e limites.

## Limites

Novas imagens sem miniatura preparada continuam com o original como fallback;
o comando de manutenção permite atualizar o conjunto antes de futuras publicações.
Fotos originais indisponíveis na origem não podem ser reconstruídas por essa
otimização. Uma imagem em cache antigo pode exigir atualização da página para
receber o novo HTML. Tempos de carregamento variam com a conexão do visitante.

## Preparação concluída

- 315 miniaturas existentes reaproveitadas e verificadas novamente.
- 276 novas miniaturas preparadas; 591 originais públicos mapeados no total.
- Novas imagens: 85.846.723 bytes de originais para 8.339.634 bytes de
  miniaturas (aproximadamente 90% de redução).
- Duas leituras que excederam 30 segundos foram repetidas com sucesso. A última
  preparação terminou sem falhas.
- No primeiro lote, a mediana do tempo de leitura/conversão dos originais foi
  8.928 ms e o percentil 95 foi 18.119 ms. Esses tempos incluem a preparação
  local; não são uma medição de carregamento na conexão de cada comprador.

Testes de integridade das 591 associações aprovados, incluindo fallback para
original e compatibilidade dos endereços antigos. Lint: zero erros e os 14
avisos anteriores. Checagem de tipos e build de produção/dry-run aprovados.
