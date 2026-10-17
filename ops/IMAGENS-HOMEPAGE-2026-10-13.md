# Carregamento das capas da homepage — 13/10/2026

## Diagnóstico

Foram consultadas as 100 capas dos produtos publicados que alimentam a homepage, incluindo os endereços antigos normalizados para o MinIO. Todas retornaram HTTP 200 nesta verificação. Isso não comprova a ausência de falhas de rede em outros momentos ou de problemas em imagens externas ao conjunto testado.

Na amostra inicial de 24 capas, os arquivos tinham aproximadamente 107–335 KB. O servidor MinIO/nginx respondeu com `public, max-age=31536000, immutable, no-cache`. A diretiva adicional `no-cache` exige revalidação, reduzindo o benefício da validade longa.

## Alterações

- `/media/catalogo/uploads/...` entrega exclusivamente imagens do bucket público `public-images` por um caminho leve no Worker. Não executa renderização React, consultas Supabase, decodificação ou redimensionamento de imagem.
- O caminho transmite os bytes do MinIO e armazena uma cópia temporária no cache do ponto de presença da Cloudflare. O navegador pode reutilizar a imagem por 24 horas. Os originais continuam no MinIO.
- São aceitos apenas formatos de imagem conhecidos, caminhos válidos e métodos GET/HEAD. Caminhos de materiais privados, PDFs, SVG, travessia de diretório e parâmetros extras são recusados. O destino é fixo; nenhuma URL arbitrária pode ser usada como proxy.
- Cookies e tokens do visitante não são enviados ao MinIO. Cabeçalhos Set-Cookie da origem não são repassados. Redirecionamentos da origem são rejeitados, usando a opção `manual` suportada pela Cloudflare.
- Cards normalizam endereços antigos. Em falha do cache, tentam uma única vez o endereço direto normalizado; uma troca de capa reinicia o estado de erro. Não há repetição infinita.
- As duas primeiras capas da prateleira prioritária têm prioridade alta. As demais usam carregamento conforme a aproximação da área visível, evitando competição desnecessária por rede.
- Banners públicos usam o mesmo caminho de cache, preservando a seleção de versão mobile/desktop.
- Novas capas enviadas usam compressão WebP no navegador com alvo de 0,25 MB e dimensão máxima de 1200 px. Não foi feita conversão em massa das imagens existentes. GIFs continuam preservados.

## Verificações

- Testes de normalização, cache HIT/MISS, preservação de bytes, rejeição de caminhos privados, ausência de credenciais, HEAD, falhas de origem e redirecionamentos.
- Verificação de tipos, lint dos arquivos alterados e limite de tamanho do código.
- Suíte de uploads e proteção de salvamentos passou.
- Compilação de produção concluída.

## Limites

O primeiro acesso a uma imagem em cada ponto de presença ainda depende do MinIO. Cache e prioridade melhoram carregamentos seguintes, mas não eliminam falhas da rede ou da VPS. O novo caminho também conta como requisição do Worker; não aumenta a cota diária do plano gratuito. Não foram contratados serviços de transformação nem alteradas políticas de buckets privados.

## Resultado em produção

Versão publicada: `93cc709f-c3a2-4775-9a33-b537bc4edd43`.

Três capas foram comparadas aos originais por SHA-256: conteúdo idêntico, HTTP 200 e cabeçalho de cache válido. As segundas aberturas retornaram HIT e levaram 90, 132 e 60 ms, respectivamente. A primeira abertura levou aproximadamente 3,46 s, 12,77 s e 1,09 s; portanto a dependência da VPS no primeiro acesso continua sendo uma limitação real.

Homepage, busca, login, Loja da Prô, página do clube e sitemap retornaram HTTP 200 com conteúdo completo após a publicação.

As 100 capas correspondem a 98 arquivos únicos. O carregamento antecipado concluiu 97 arquivos na primeira passagem e teve uma falha transitória. A repetição abriu os 98 arquivos, sem falhas, e retornou 97 HITs. Isso aquece o ponto de presença usado pelo teste; não garante que todos os pontos de presença do mundo tenham sido aquecidos.
