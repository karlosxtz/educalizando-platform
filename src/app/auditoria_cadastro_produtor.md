# Auditoria Rigorosa — Rota de Cadastro do Produtor

## 1. O Link Quebrado na Tela de Login
- **Localização:** Em `src/app/login/page.tsx` (linha 221).
- **Destino Atual:** O link "Ainda não possui uma loja? Cadastre-se gratuitamente" está apontando para o href **`/#cadastro`**.
- **Por que quebrou?** Com o nosso recente redesign premium da Home (`/`), nós limpamos a estrutura antiga copiada do concorrente. Aquele ID `#cadastro` que existia no rodapé da home antiga deixou de existir, fazendo com que o link agora apenas jogue o usuário pro topo da página inicial, sem abrir nenhum formulário.

## 2. A Existência do Formulário de Cadastro
Fiz uma varredura nas rotas e encontrei o formulário de produtores.
- **Não existe** uma rota limpa e exclusiva como `/cadastro/produtor` ou `/vender/cadastro`.
- O formulário real (componente `<SignupForm />`) está escondido no final da Landing Page de atração de vendedores, no arquivo **`src/app/vender/page.tsx`**.

## 3. O Destino do Card na Triagem
- O "Card 2" (Quero Vender) da nossa nova tela de triagem (`src/app/cadastro/page.tsx`) está apontando corretamente para **`/vender`**.
- **O Problema de UX:** Como o `/vender` é uma Landing Page gigante (com Hero, Benefícios, FAQ, Preços), quando o usuário clica em "Quero Vender" na triagem (ou tenta criar conta pelo Login), ele é jogado no topo dessa Landing Page e precisa rolar a tela inteira para achar o formulário de cadastro no rodapé. Isso gera muito atrito na conversão.

---
### Conclusão e Próximos Passos:
O fluxo de entrada do produtor está confuso. O link do login aponta para o lugar errado, e o card da triagem aponta para uma página de vendas enorme ao invés de ir direto ao ponto.

A solução cirúrgica será:
1. **Extrair o formulário:** Criar uma rota limpa e direta chamada `src/app/cadastro/produtor/page.tsx` (ou similar) que renderize *apenas* o componente `<SignupForm />` (como fizemos no aluno).
2. **Atualizar a Triagem:** Fazer o "Card 2" da tela de `/cadastro` apontar diretamente para esse novo formulário.
3. **Consertar o Login:** Alterar o link quebrado na tela de `/login` para apontar para esse mesmo formulário limpo, fechando completamente o funil.

Aguardo sua autorização para executar esse conserto do fluxo de cadastro do Produtor!
