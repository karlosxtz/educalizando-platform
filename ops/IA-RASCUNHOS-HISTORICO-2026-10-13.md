# Rascunhos, versões e revisão editorial — 13/10/2026

## Implementado no editor de materiais da IA
- Rascunho automático dos campos editoriais após 500 ms de pausa, ao fechar o editor e ao ocultar/sair da página. Fechar mantém uma revisão em memória que pode ser retomada nesta sessão.
- Armazenamento local no navegador, separado por loja, produto e produto final/licença PLR. Até 10 rascunhos e 20 versões recentes por loja, por até 30 dias. Textos limitados aos tamanhos aceitos pelo editor/servidor. Não é sincronização entre dispositivos.
- Histórico registra proposta gerada, edição guardada, cadastro antes do salvamento e texto salvo após confirmação do servidor. Registros consecutivos idênticos do mesmo tipo não duplicam; falhas de armazenamento mantêm os registros anteriores e têm aviso visível.
- Restauração explícita abre o editor para revisão, sem gravar no produto. Busca o cadastro atual numa API autenticada e limitada à loja proprietária. Uma falha de rede retorna erro; não usa um produto local antigo como referência de salvamento.
- Comparação de título, descrição, tags, temas e campos principais da classificação. Oferta PLR compara somente sua descrição. Colunas Antes/Depois e trechos removidos/adicionados. Textos longos usam linhas; matriz de comparação tem limite de 250 mil células para proteger o navegador.
- Revisão local avisa sobre frases repetidas, slogans genéricos, ausência de descrição original, algumas alegações de editabilidade/BNCC/bônus/certificado/revenda, quantidades sem apoio e faixa etária não informada. É uma checagem parcial dos campos cadastrados, não uma inspeção do arquivo nem comprovação integral das alegações.
- A versão factual do cadastro usada pela geração vem do servidor, sem URLs privadas ou chave de IA. A restauração compara contra o cadastro atual, mantendo a proteção de versão no UPDATE já implementada.
- Campos congelados durante o salvamento para evitar perder alterações digitadas enquanto o pedido é enviado. Depois da confirmação, o rascunho daquela oferta é removido, sem afetar o da outra licença.
- Limpeza manual de categoria/nível principais, faixa etária e formato é respeitada no servidor. Outros vínculos de categoria/nível, preço, slug e arquivos não entram no rollback editorial.

## Validação
npm run test:ai-reliability inclui testes de persistência/recuperação, isolamento loja/produto/PLR, retenção/expiração, deduplicação, lista permitida de campos, corrupção/quota do navegador, reconstrução exata de ambos os textos do diff, textos longos, avisos de qualidade e renderização real de componentes React. Inclui API de cadastro atual com autorização, resposta privada sem cache e falha sem fallback antigo; UPDATE concorrente continua testado.

Também executados test:marketing-grounding, test:source-size, typecheck:vinext e ESLint dos arquivos alterados. Provedores e banco simulados nos testes; não foram gerados conteúdos pagos nem alterados produtos reais durante a validação.

O histórico continua dependente do armazenamento deste navegador. Limpar os dados do site ou usar uma sessão privada pode remover as versões. Nenhum serviço ou tabela nova foi contratado; as checagens locais não fazem requisições a provedores de IA.

## Publicação concluída
Versão Cloudflare 40b3d942-d844-46ae-aca5-3dec23537d19. Compilação Vite, dry-run, testes de IA, fidelidade, tamanho, typecheck e lint concluídos. Após publicação: homepage e login 200 com HTML completo; dashboard/ia sem sessão levou ao login; editor-source e seo-apply sem sessão retornaram 401 JSON. Interface autenticada e restauração real de um material não foram exercitadas em produção; os testes cobrem essas operações com banco/armazenamento simulados e renderização React.
