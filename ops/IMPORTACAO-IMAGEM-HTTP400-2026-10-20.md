# Importação: imagem rejeitada com HTTP 400

## Evidência

A tela real da loja Baú do professor mostrou a importação pausada com 80
recebidos, 8 importados, 70 já importados e total informado de 123. O erro
era `Não foi possível baixar a mídia (400)`, emitido pelo download das imagens
públicas. Não era um erro de download do PDF nem de gravação no MinIO.
Não foi possível identificar a URL específica a partir da tela; nenhuma chave
foi extraída do navegador. O tratamento abaixo não pressupõe qual servidor
rejeitou essa imagem.

## Comportamento

- Se um transformador público de imagem compatível responder 400, tentar o
  original público: Supabase render/public → object/public; Next Image →
  caminho original no mesmo domínio. Não alterar URLs assinadas.
- Validar novamente HTTPS, DNS, redes privadas, redirecionamentos, tamanho e
  MIME do original. Não encaminhar a chave de exportação aos servidores de mídia.
- Se a imagem responder 400, 404 ou 410, registrar produto, posição da imagem
  e status em Pontos para revisar e avançar apenas essa imagem. Não salvar
  resposta inválida, placeholder ou URL remota como se fosse imagem copiada.
- Usar a primeira imagem válida como capa quando não houver capa cadastrada.
- Continuar as demais imagens e entregas privadas do produto. Falhas de
  autenticação, rede, armazenamento, limites ou indisponibilidade temporária
  continuam pausando para nova tentativa; não são descartadas silenciosamente.
- Retomar a importação existente com Continuar importação. Não há SQL novo,
  reinício do catálogo, alteração de RLS ou mudança de isolamento por loja.

## Arquivos alterados

- `src/lib/platform-image-recovery.ts`: erros HTTP tipados, extração restrita do
  original público e classificação das imagens indisponíveis.
- `src/lib/woocommerce-media.ts`: tentativa do original com as mesmas validações.
- `src/lib/saber-import-job.ts`: pendência explícita para imagem indisponível,
  continuação do produto e primeira imagem válida como capa.
- `scripts/verify-platform-image-recovery.cjs`: recuperação, privacidade,
  bloqueio de redirecionamento privado e preservação de falhas temporárias.
- `scripts/verify-saber-job.cjs`: regressão de imagem 400 seguida por imagem
  válida e PDF, capa alternativa e pausa preservada para HTTP 503.
- Este relatório: evidência, escopo, limitações e validação.

## Validação

Testes de recuperação de imagem, processamento do catálogo, contrato/API de
importação, entregas, reaproveitamento de arquivos e gravação condicional no
storage aprovados. Lint, checagem de tipos e build de produção são conferidos
antes da publicação. A imagem indisponível pode precisar ser reenviada pelo
criador; o importador não consegue recuperar bytes que a origem não fornece.
