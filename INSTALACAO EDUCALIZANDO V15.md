# Educalizando — Consulta Guiada V15

## Mudança principal

O atendente não transforma mais pedidos vagos em filtros. Quando o cliente pede ajuda para escolher, encontrar ou pesquisar outro material, ele envia esta ficha:

```text
Idade:
Ano escolar:
Disciplina:
Tema ou conteúdo:
Habilidade ou objetivo:
Data comemorativa: (informe não ou o nome da data)
Tipo de versão: (final, PLR ou qualquer)
Nome do produto: (opcional)
```

A pesquisa só é executada quando a ficha contém:

- idade ou ano escolar; e
- disciplina, tema, habilidade, objetivo ou data comemorativa.

O nome exato do produto também pode ser usado para uma busca direta.

Se nenhum produto for encontrado, o fluxo não envia sugestões aleatórias. Ele devolve a ficha com os valores recebidos e pede que o cliente deixe os filtros mais amplos ou claros.

## Instalação

1. Desative os workflows V14.1 e todas as versões anteriores.
2. Importe `ATENDENTE EDUCALIZANDO CONSULTA GUIADA V15.json`.
3. Importe `RECUPERADOR DE MENSAGENS V15.json`.
4. Confira as credenciais do Redis, Gemini, Groq e Evolution.
5. Publique e ative somente os dois workflows V15.
6. O webhook continua em `evolutioneducalizandobot-v102`.

## Teste recomendado

1. Envie `Você pode me ajudar a encontrar um material?`.
   - Deve receber a ficha, sem produtos.
2. Preencha somente a idade e envie.
   - Deve informar quais dados ainda faltam, sem pesquisar.
3. Envie a ficha completa em uma única mensagem.
   - Deve pesquisar uma vez e apresentar até três resultados.
4. Envie `Opção 2` e depois `Quero comprar`.
   - Deve manter exatamente o segundo produto escolhido.
5. Envie `Quero pesquisar outro material`.
   - Deve limpar a consulta anterior e apresentar uma ficha nova.

## Validação automática

```powershell
node scripts/validate_v15.js
```
