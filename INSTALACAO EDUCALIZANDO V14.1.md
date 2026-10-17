# Instalação da correção V14.1

## O que foi corrigido

Na V14, os nós de proteção contra respostas antigas consultavam a mensagem mais recente no Redis. Essa consulta mantinha o identificador, mas descartava o conteúdo que deveria continuar no fluxo. Como consequência, o atendente chegava repetidamente à resposta de segurança `Estou aqui para continuar o atendimento`.

A V14.1 restaura explicitamente os dados originais em quatro pontos:

1. decisão e estado da conversa;
2. resposta de texto;
3. resultado do catálogo;
4. produto atual do loop de envio.

## Como instalar

1. Desative e exclua ou arquive os workflows V14 importados no n8n.
2. Importe `ATENDENTE EDUCALIZANDO ENTERPRISE V14.1.json`.
3. Importe `RECUPERADOR DE MENSAGENS ENTERPRISE V14.1.json`.
4. Confira as credenciais dos nós Redis, Gemini, Groq e Evolution.
5. Publique e ative somente os dois workflows V14.1.
6. Mantenha o webhook da Evolution apontado para `evolutioneducalizandobot-v102`.

Não deixe V13, V14 e V14.1 ativos ao mesmo tempo.

## Teste rápido

Faça o teste usando uma conversa nova ou apague a chave de memória antiga do número de teste.

1. `Oi`
   - Esperado: uma saudação natural.
2. `Que tipo de material você tem?`
   - Esperado: consulta ou apresentação do catálogo, sem a frase genérica repetida.
3. `Quero material para 6 anos`
   - Esperado: pergunta sobre tema, disciplina ou habilidade.
4. `Sílabas`
   - Esperado: até três produtos com capa e opções identificadas.
5. `Opção 2`
   - Esperado: confirmação do segundo produto.
6. `Quero comprar`
   - Esperado: links apenas do produto escolhido.

## Validação automatizada

Execute na pasta do projeto:

```powershell
node scripts/validate_v141.js
```

O resultado esperado começa com `"ok": true`.
