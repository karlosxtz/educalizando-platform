# Regras do Projeto Educalizando

## Deploy & Push Automático para GitHub
Sempre que arquivos no projeto forem modificados, criados ou refatorados, execute automaticamente a sincronização com o GitHub:
`git add . && git commit -m "feat/fix: auto sync update" && git push origin main`

Dessa forma, o GitHub e o Deploy da Vercel serão mantidos 100% atualizados em tempo real sem necessidade de solicitação manual.
