# SEO unificado e revisão funcional — 14/10/2026

Problemas corrigidos:
- Produtos usava cinco critérios próprios enquanto IA/servidor usavam sete; todos agora usam calculateProductSeoScore, incluindo classificações múltiplas.
- Auditoria ignorava categoryId/educationLevelId sugeridos. IDs válidos podem preencher classificações ausentes quando sustentadas pelo cadastro; classificações existentes são mantidas.
- Editor abria com proposta preenchida, fazendo o botão repetir o mesmo estado sem retorno. Agora abre com cadastro atual, botão aplica sugestões e confirma visualmente. Salvar fica desabilitado sem mudanças e permanece visível no rodapé da revisão.
- Revisão em lote inclui categoria/nível, nota prevista e pendências. Salva com a versão do produto para evitar sobrescrever edição recente e verifica todos os IDs confirmados.
- Endereço amigável só é criado quando ausente, com sufixo único por produto. Endereços existentes, preços e arquivos não mudam.
- Confirmação calcula nota com campos retornados pela gravação, e nova auditoria lê o cadastro salvo.

Validação: testes de confiabilidade, fundamentação, clique real do editor com captura de alterações/feedback, auditoria e salvamento completos (86 previsto com URL ausente -> 100 confirmado após criar URL), proteção de versão e nova auditoria sem as pendências antigas; TypeScript, ESLint e tamanho dos fontes. Nenhum produto real ou geração paga foi usado nos testes.

100/100 significa os sete critérios internos preenchidos; não equivale a posição garantida no Google. Informação factual ausente não é inventada para aumentar a nota.
