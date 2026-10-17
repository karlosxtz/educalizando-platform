# Atendimento humano no mesmo WhatsApp

Publicado na V20, versão `609b9b2c-1c74-4b00-ac94-2492700eedf6`.

O pedido de humano confirma a mudança ao cliente e marca a pausa Redis da conversa atual, sem expiração automática. Outras conversas continuam atendidas. O nó Enviar ao atendente foi desabilitado: não é necessário destino separado. A equipe acompanha e responde no WhatsApp conectado.

Para devolver uma conversa à IA, a equipe envia `/retomar` na própria conversa. Só eventos `fromMe` do WhatsApp conectado podem executar esse comando; comandos recebidos do cliente não liberam a pausa. Mensagens comuns enviadas pela equipe continuam ignoradas pelo bot.

Testados sem envio de WhatsApp: normalização de comando próprio versus cliente, alvo da conversa, ignorar mensagens comuns da equipe, interpretação de atendimento humano e preservação da confirmação. Os dois conjuntos de testes locais passaram. Quatro configurações validadas, cinco operações aplicadas, releitura e publicação confirmadas, conexões preservadas.

A pausa pressupõe disponibilidade e persistência do Redis. Este ajuste não detecta automaticamente todo texto manual como intervenção humana; entra em ação quando o cliente solicita humano. Não houve teste com cliente real.
