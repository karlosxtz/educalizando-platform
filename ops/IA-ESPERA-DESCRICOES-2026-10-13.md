# Correção de espera e descrições — 13/10/2026

- Removido corte local da geração aos 45 segundos. Provedor recebe até 120 segundos incluindo corpo; cliente até 145 segundos incluindo autenticação e corpo. Cancelamento voluntário permanece disponível.
- Não se trata de garantia de ausência de falhas: serviço externo, rede, créditos, quota e limite CPU da Cloudflare continuam aplicáveis. Não foi criado processamento persistente em fila. Uma interrupção longa ainda retorna erro, preservando o rascunho e resultados já existentes.
- Uma resposta HTTP temporária explícita 502/503/504 permite uma única nova tentativa com o mesmo prazo total. Timeout, falha de rede sem resposta, 401/403/429 e geração concluída não disparam retry automático. Alternativa gratuita OpenRouter após 402 permanece.
- Editor SEO/descrição tem orçamento de até 8000 tokens e alternativa de até 450 palavras quando houver dados suficientes; sem mínimo que force invenções. Limite do campo continua 8000 caracteres.
- Instruções de formatação: texto simples, parágrafos separados, apresentação, componentes, sugestões de uso identificadas e informações do material; seções sem evidência devem ser omitidas. Componentes com marcadores e uma linha por item.
- Testes simulados de quota, timeout e recuperação de 503 passaram junto aos de fidelidade, histórico e proteção de salvamento. Typecheck e lint passaram. Latência real de provedor com chave de loja não medida neste ciclo.

Publicação: versão 841b7121-2f62-4b86-91c1-f7cbb33e5c45. Build Vite e dry-run concluídos. Login 200 HTML completo, product-tools sem sessão 401 JSON após publicação. Geração autenticada real não realizada.
