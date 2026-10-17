# Cadastro com erro após gravação

Versão final publicada: `019ae8b4-c083-46e3-9a4b-c3ee01b2550b`.

A consulta pública confirmou três produtos com o título da captura, criados em 12/10/2026 às 14:18:25, 14:18:35 e 14:19:20 (São Paulo). O erro exibido não significa que o registro inicial não existe. A consulta pública não permite confirmar os arquivos privados de entrega desses três registros.

Correções: identificador de criação persistido enquanto a tentativa estiver pendente; reaproveitamento do mesmo produto em novas tentativas; arquivos de entrega gravados por upsert; sincronização WooCommerce e invalidação de cache após a resposta; tratamento seguro de respostas não JSON; falhas do cache local não alteram o sucesso confirmado pelo servidor. Após um HTTP 500, o navegador só recupera sucesso se sua sessão do banco comprovar o produto da loja e todas as entregas esperadas, incluindo PLR.

Testes: simulação de gravação parcial, retomada, duas novas tentativas sem produtos extras, isolamento de loja, confirmação de entregas completas e falha externa após salvar. Build Vite e lint passaram; os seis erros antigos de tipos gerados de `.next` permanecem.

A edição também adia sincronização externa e invalidação de cache. A troca de entregas escreve os arquivos substitutos antes de excluir índices antigos excedentes; o teste confirmou que uma falha de substituição não exclui os arquivos anteriores.

Limites: não foram excluídas cópias existentes nem confirmadas suas entregas privadas. Não foi efetuado novo cadastro real de produto nesta validação. O ponto exato da interrupção do Worker ainda precisa de confirmação por logs de uma tentativa autenticada; as mudanças reduzem trabalho antes da resposta e protegem a retomada, sem aumentar o limite da hospedagem.
