# Auditoria Rigorosa — Botão de Cadastro e Triagem

## 1. O Botão Atual no Cabeçalho
- **Localização:** Em `src/components/MarketplaceHeader.tsx` (linha 53).
- **Redirecionamento:** O botão atualmente exibe o texto `"Criar Loja"` e possui o `href="/vender"`. Este é um link direto e voltado exclusivamente para atrair Produtores.

## 2. O Mapa de Cadastros (As Portas de Entrada)
Fiz o mapeamento físico das rotas de criação de conta (Sign Up) na arquitetura atual:
- **Cadastro de Aluno:** A rota de registro do aluno já existe e está perfeitamente alocada em `src/app/aluno/(auth)/cadastro/page.tsx` (rota pública graças ao Route Group).
- **Cadastro de Produtor:** A rota dedicada a converter e cadastrar novos produtores/lojas é a `src/app/vender/page.tsx` (para onde o botão do cabeçalho aponta atualmente).
- **Cadastro de Afiliado:** A rota de registro para afiliados também já está construída e mapeada em `src/app/afiliados/cadastro/page.tsx`.

## 3. Viabilidade da Nova Rota de Triagem
- **Caminho Livre:** Inspecionei a pasta `src/app`. Atualmente, **não** existem as pastas `/cadastro` ou `/criar-conta`.
- **Recomendação de Rota:** A URL `/cadastro` é a opção mais limpa, universal e profissional para servir como página raiz de triagem de novos usuários. 

---
### Conclusão e Próximos Passos:
O terreno está totalmente mapeado e livre. Para implementar o novo fluxo de padronização, a arquitetura ideal será:
1. Renomear o botão no cabeçalho de `"Criar Loja"` para `"Criar Conta"` e alterar seu destino para `/cadastro`.
2. Criar a página `src/app/cadastro/page.tsx` seguindo o exato mesmo padrão visual premium da tela `/entrar` (com 3 cards: "Sou Aluno", "Sou Produtor", "Sou Afiliado").
3. Os 3 cards apontarão, respectivamente, para `/aluno/cadastro`, `/vender` e `/afiliados/cadastro`.

Aguardo sua autorização para executar a construção da triagem de cadastro!
