# Respostas de SEO — normalização segura — 14/10/2026

- Parser recupera objetos completos com quebras de linha não escapadas e vírgulas finais, sem completar trechos cortados nem inventar campos.
- Propostas completas com title/titulo, description/descricao ou envolvidas em proposal/proposta/seo são normalizadas para o editor.
- Descrição gerada disponível nas opções é aproveitada. Se não houver título sugerido, mantém o atual e informa isso na análise.
- Sem descrição gerada completa, mantém erro; não substitui geração por texto genérico. Conferência de quantidades e revisão antes de salvar continuam obrigatórias.
- Testes de confiabilidade, segurança, normalização, fundamentação, TypeScript e ESLint passaram. Não houve geração paga nem edição de produtos reais durante os testes.
