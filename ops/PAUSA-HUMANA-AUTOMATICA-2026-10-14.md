# Pausa automática por resposta humana

V20 `0YJiXWKAq3Jng4on`, versão publicada `46790758-8d30-40de-ab90-1bf53135b0de`, 70 nós.

## Comportamento

Uma mensagem própria recebida pelo webhook passa por identificação antes de qualquer processamento de IA. IDs retornados pela Evolution para mensagens de texto, capa e confirmação de retomada são registrados no Redis por sete dias. O próprio número pode, assim, enviar mensagens tanto pelo bot quanto pela equipe.

Antes de cada envio da IA, registra-se uma marca do texto na conversa por 30 segundos. Essa marca cobre a possibilidade de o webhook de eco chegar antes do retorno da API. A identificação aguarda dois segundos, confere o ID e a marca pendente. Origem android/ios/desktop sem ID registrado é tratada como humana; web/unknown confere também a marca pendente com texto exato. Não se usa somente fromMe ou somente source.

Uma resposta identificada como humana grava a pausa sem expiração exclusivamente naquela conversa. Não envia confirmação automática ao cliente. Mensagens futuras do cliente encontram a pausa e param antes da IA. Cada item da fila de saída também consulta novamente a pausa antes de enviar. A retomada manual existente continua disponível ao proprietário; não há retorno automático por tempo.

Incluída comparação dos dois últimos materiais apresentados. Consulta novamente ambos na API e mostra características, preços e links reais, identificando campos ausentes. Se um produto deixou de estar disponível, não completa a comparação com dados antigos.

## Validação

- Registros históricos reais confirmaram resposta da API com data.key.id e fromMe, além de mensagem humana com source android. Nenhum dado de cliente ou credencial foi copiado para este documento.
- Testes locais de texto, áudio, imagem, IDs conhecidos, marcador pendente, expiração, isolamento por conversa/instância e comparação passaram.
- Parser de recibo foi testado com retorno histórico real, sem executar envio.
- 19 configurações de nós validadas; releitura de parâmetros e conexões; credenciais anteriores preservadas. Publicação confirmada. Nenhum WhatsApp enviado nos testes.

## Limites práticos

O webhook da Evolution precisa entregar mensagens próprias. Eventos históricos com timestamp mais antigo que cinco minutos são ignorados para não pausar conversas por sincronização antiga. Envios já entregues ao provedor não podem ser cancelados. Na rara situação de uma pessoa enviar via WhatsApp Web exatamente o mesmo texto da IA dentro da janela pendente, a identificação pode considerar a mensagem um eco automático. Pausas e identificadores dependem da disponibilidade/persistência do Redis. Não foi feita conversa real de ponta a ponta com cliente.

Referência de origem: https://github.com/EvolutionAPI/evolution-api/blob/main/src/api/integrations/channel/whatsapp/whatsapp.baileys.service.ts — source é derivado do dispositivo, portanto não basta para identificar autoria humana.
