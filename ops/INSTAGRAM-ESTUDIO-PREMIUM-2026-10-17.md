# Estúdio de publicações: composição com foco na imagem

## O que mudou

- O padrão agora é Somente imagem: sem textos, preço, logo ou assinatura visual adicionados sobre a foto. A menção obrigatória do feed continua na legenda, preservada pelo servidor.
- A imagem inteira usa toda a área compatível com sua proporção. Quando a proporção da foto difere do post, a própria foto desfocada preenche o restante. Não há mais barras obrigatórias na cor da loja nem uma moldura branca artificial.
- A alternativa Preencher o post recorta a imagem, com controles de aproximação e posição horizontal/vertical. A prévia exibe o recorte final.
- Seis modelos selecionáveis com miniaturas: Somente imagem, Minimal, Capa em destaque, Editorial, Imersivo e Vitrine. Cada modelo tem uma composição real, sem apenas trocar o nome da opção.
- Nos modelos com texto, ocultar informações libera espaço para a foto. Títulos de modelos imersivos são posicionados pela altura real do texto.
- Story 1080×1920; Feed retrato 1080×1350 ou quadrado 1080×1080.
- Margem, cantos arredondados na foto real, brilho, saturação, tipo de fundo, paletas, cores, contraste, fonte, alinhamento, tamanho e posição do título nos modelos imersivos.
- Trocar a foto somente desta publicação, usar imagem de fundo própria e logo local. JPG/PNG/WebP até 8 MB, preparo local até 2048 px, sem alterar a capa ou o cadastro do produto. A foto alternativa é descartada ao mudar de produto.
- Abas Modelos/Imagem/Textos/Identidade, controles compactos, prévia estável ao ajustar, ações de baixar e publicar reunidas junto à prévia, gerenciamento da conexão recolhido e histórico separado.
- Preferências de estilo v2 por loja neste navegador. Preferências antigas retornam ao novo padrão para não restaurar as antigas faixas coloridas. Arquivos e textos específicos de produto não são salvos como estilo.
- Nenhuma alteração automática em posts já publicados no Instagram.

## Arquitetura e limites preservados

Canvas e filtros no dispositivo, JPEG 0,94, imagens decodificadas reaproveitadas em cache local limitado. Nenhuma API de geração de imagem, transformação de imagens paga, novo binding, novo armazenamento ou novo polling. O envio aprovado permanece direto ao armazenamento existente. A interface não menciona os provedores de infraestrutura.

Nenhuma mudança em RLS, isolamento de lojas, permissões da Meta, checkout, preços, Asaas, webhooks ou acesso de alunos. Publicação real ainda exige revisar e confirmar; nenhum post foi enviado durante a validação.

Imagem JPEG não contém link clicável. A conexão atual não publica stickers de link/menção nos Stories nem marcação de pessoas na foto. As orientações continuam disponíveis em Legenda e divulgação.

## Validação

- Lint e typecheck Vinext; testes do módulo e limite de tamanho de arquivos; build de produção pelo script oficial.
- Regressões de OAuth, isolamento, criptografia, idempotência concorrente e resultado incerto sem reenvio mantidas.
- Testes verificam imagem inteira sem overlays, dimensão do desenho, ausência da cor obrigatória da loja, limites do recorte, arredondamento na imagem real, seis modelos, feed quadrado, foto local sem alterar o produto, QR canônico, preço opcional e sanitização das preferências.
- Navegador isolado, sem publicação: visual desktop, abas, enquadramento, feed quadrado, foto inteira e tela de 390 px sem overflow horizontal. Viewport restaurado após o teste.

## Arquivos

| Arquivo | Motivo |
| --- | --- |
| src/lib/instagram-design.ts | Padrão Somente imagem, seis presets, proporções e preferências v2 sanitizadas. |
| src/lib/instagram-artwork.ts | Desenho ampliado, fundo desfocado, imagem alternativa, filtros e composição adaptativa. |
| src/components/creator/InstagramDesignPresets.tsx | Galeria visual de modelos. |
| src/components/creator/InstagramDesignEditor.tsx | Abas, sliders e personalização local de foto, textos e identidade. |
| src/components/creator/InstagramStudioView.tsx | Interface do estúdio, conexão, prévia e confirmação de publicação. |
| src/app/dashboard/instagram/page.tsx | Integração dos controles, imagem alternativa e prévia com URLs locais revogadas corretamente. |
| scripts/verify-instagram-publishing.cjs | Verificações dos novos comportamentos e regressões de publicação. |
| ops/INSTAGRAM-ESTUDIO-PREMIUM-2026-10-17.md | Escopo, limites, arquivos e validação. |
