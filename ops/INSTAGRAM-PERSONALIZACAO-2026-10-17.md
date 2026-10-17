# Instagram: personalização da divulgação

## Comportamento

- Três modelos; fundo degradê, sólido, papel ou imagem local; cores; três fontes; alinhamento e tamanho de título; texto complementar e chamada; logo da loja ou arquivo local; capa inteira ou recortada; endereço e QR code do produto opcionais.
- Preço oculto por padrão na arte e na legenda inicial. Ativar usa o preço real do cadastro, sem modificar o produto.
- Prévia automática com debounce de 450 ms, proteção contra resultado antigo e reaproveitamento de imagens decodificadas (cache local limitado a oito imagens).
- Preferências por loja no localStorage deste navegador. Não persistir textos de produtos, dados de arquivos ou URLs locais como preferências. Trocar produto limpa o título e complemento personalizados.
- Fundo e logo personalizados: JPG/PNG/WebP até 8 MB, dimensionados localmente até 2048 px. Nenhum envio destes arquivos durante a edição.
- QR gerado localmente para o endereço canônico do produto dentro da loja. Não é link clicável dentro do JPEG.
- Menção @educalizando_brasil visível na arte e obrigatória na legenda do feed, também aplicada no servidor, com limite de 2200 caracteres e sem duplicar a menção correta. Não a apresentar como marcação de pessoa na foto.

## Limites reais da integração

O aplicativo usa Instagram Login, com instagram_business_basic e instagram_business_content_publish. A coleção oficial da Meta informa que esta configuração não acessa tagging: https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api?entity=request-23987686-10bf8bf7-d9b7-4340-9c66-61d3ce683a87 . Não enviar user_tags sem suporte nem alterar o login/permissões das conexões existentes.

O fluxo atual publica a imagem do Story, sem sticker de link/menção. Um @ desenhado é visual; uma URL no JPEG não se torna clicável. O painel orienta baixar a arte e adicionar os stickers no aplicativo Instagram para obter essa experiência interativa. No feed, a menção é enviada na legenda; não é uma marcação de pessoa na mídia.

## Consumo e armazenamento

Canvas, leitura dos arquivos locais e QR executam no dispositivo do criador. Não há geração de imagem por IA, Cloudflare Images, transformação no Worker, KV ou R2 novos. Capas e logos cadastrados continuam usando o endereço público atual do MinIO. Somente o JPEG final é enviado diretamente ao MinIO ao confirmar a publicação. Endpoints autenticados existentes continuam consumindo requisições/CPU para autorização, assinatura de upload e comunicação com a Meta; não se promete custo zero da plataforma.

Não houve mudança de migration, RLS, acesso de alunos, checkout, webhooks, preços ou dados cadastrados. Nenhuma publicação real foi feita para validar o editor.

## Validação

- Lint: zero erros, 17 avisos preexistentes.
- Typecheck Vinext; testes de Instagram e limite de tamanho; build de produção via script oficial em dry-run.
- Navegador local isolado, publicação desabilitada: Story e Feed, QR code, preço ligado/desligado, papel/fundo local, fonte e estilo persistido após recarregar. Fundo de teste escolhido via seletor de arquivos; JPEG gerado com sucesso.
- Testes: menção obrigatória e limite no servidor, idempotência e isolamento mantidos, imagens reaproveitadas, QR com destino correto, preferências sanitizadas sem dados de outro produto, preço opcional e arte com fundo/logo locais.

## Arquivos alterados

| Arquivo | Motivo |
| --- | --- |
| src/components/creator/InstagramDesignEditor.tsx | Controles acessíveis de personalização e leitura local de arquivos. |
| src/lib/instagram-design.ts | Contrato do estilo, padrões, sanitização das preferências e menção fixa. |
| src/lib/instagram-artwork.ts | Renderização Canvas dos modelos, fundo, logo, preço opcional e QR. |
| src/app/dashboard/instagram/page.tsx | Prévia automática, preferências por loja, legenda final e orientação de links/marcações. |
| src/lib/instagram-contract.ts | Legenda sem preço por padrão, opção de preço e menção. |
| src/lib/instagram-publishing.ts | Garantia da menção no feed e validação de comprimento antes de preparar upload. |
| scripts/verify-instagram-publishing.cjs | Cobertura das novas funções e regressões do fluxo de publicação. |
| ops/INSTAGRAM-PERSONALIZACAO-2026-10-17.md | Escopo, limites, consumo, validação e arquivos. |
