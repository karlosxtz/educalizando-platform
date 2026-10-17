# Confiabilidade do módulo de IA — 14/10/2026

Escopo: geração de produto, SEO, descrição, campanhas simples, lançamento A/B, auditoria, roteiro pedagógico e assistente.

- Recuperação única e limitada para respostas cortadas ou JSON inválido/sem os campos obrigatórios.
- Cada fluxo fornece seu contrato de validação antes de aceitar a geração; verificações factuais continuam depois dele.
- Assistente em texto também recupera uma resposta cortada. Raciocínio baixo aplicado à integração alternativa em texto e JSON; limites maiores para fluxos estruturados completos.
- Mesmo prazo de 120 segundos e mesmo AbortController; recuperação somente com pelo menos 30 segundos restantes. Sem loops, novas tentativas após recusa de segurança, erro de chave ou quota; fallback gratuito preservado.
- Alterações só são gravadas após revisão e confirmação do criador. Não substituir conteúdo por texto genérico quando o provedor falha.

Validação: confiabilidade, formato inválido, campos obrigatórios ausentes, resposta cortada, recusa de segurança, recuperação única do assistente, limites e fallback; fundamentação factual, salvamento SEO, TypeScript, ESLint e limites de tamanho passaram. Testes simulados, sem gerações pagas ou mudanças nos materiais.

Acompanhamento ao vivo foi aberto por 180 segundos sem capturar novas consultas/falhas de IA. Sem a mensagem da falha atual, não atribuí causa específica à conta do criador. Limites/indisponibilidade externos continuam possíveis; esta correção não garante ausência absoluta de falhas.
