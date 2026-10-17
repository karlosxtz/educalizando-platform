# Geração de SEO cortada — 14/10/2026

- Pedido anterior permitia 8000 caracteres por descrição em três versões, além dos demais campos, frente a 8000 tokens de saída compartilhados.
- Prompt limita cada versão a 2200 caracteres e JSON total a 7500, mantendo fatos, restrições, três versões e formatação.
- Nas gerações estruturadas, integração alternativa usa esforço de raciocínio baixo para reservar maior parte do orçamento à resposta útil. Referência técnica: https://openrouter.ai/docs/guides/best-practices/reasoning-tokens .
- SEO/descrição permitem uma única recuperação compacta após sinal explícito MAX_TOKENS/length. Mesma autorização e mesmo AbortController; só inicia se restarem pelo menos 30 segundos no prazo de 120 segundos. Não repete quotas, erros de chave, timeout ou formato arbitrário. Fallback gratuito é preservado na recuperação.
- Resposta ainda truncada permanece bloqueada; nenhuma gravação automática. Validação factual e revisão do produto continuam.
- Testes simulam recuperação com sucesso, segunda truncagem sem loop, limite compartilhado e fallback gratuito. Não houve geração paga ou edição de produtos reais.
