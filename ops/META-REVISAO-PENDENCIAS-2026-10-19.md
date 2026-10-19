# Meta: preparação da análise em 19/10/2026

## Confirmado no painel autenticado

- App Educalizando: 948947541213265. Portfólio: 2054794601838588.
- Empresa verificada; verificação de acesso como provedor de tecnologia em análise.
- App não publicado e análise de permissões ainda não enviada.
- As justificativas de `instagram_business_basic` e `instagram_business_content_publish` estavam preenchidas e foram preservadas pelo botão Salvar. Ambas ainda exigem screencast e a declaração de uso permitido não foi marcada.
- Na janela de `instagram_business_content_publish`, as chamadas de teste aparecem como **Concluída**. Não foi feita publicação adicional nesta sessão. Esse indicador não substitui a gravação nem a aprovação da permissão.
- `public_profile` também aparecia na solicitação, mas o código deste fluxo usa Instagram Login com somente as duas permissões Instagram. Foi removida somente dessa solicitação de análise, conforme o diálogo da Meta; a lista atual contém apenas as duas permissões Instagram. Não foram removidos produtos/casos de uso nem alteradas credenciais ou permissões de pessoas.

## Configurações corrigidas

- Criada a plataforma Website com URL `https://www.educalizando.com.br/`.
- Ícone oficial existente normalizado para 1024 × 1024. O primeiro envio com fundo branco foi rejeitado; a versão que preserva transparência foi aceita e salva.
- Após recarregar Configurações básicas, persistiam o nome do arquivo do ícone e a URL do site, sem o aviso de ícone faltante.
- Na submissão, Configurações do app passou de 75% para **100%**.
- A plataforma web liberou a seção Instruções para o analista, antes bloqueada por ausência de plataforma cadastrada.
- Instruções foram preenchidas com o caminho de login, módulo, conexão, identificação de perfil, preparação da arte, confirmação de publicação e desconexão. Facebook Login foi marcado como Não, coerente com o fluxo implementado. A etapa passou a 100%.
- O texto das instruções identifica explicitamente as pendências do rascunho: conta dedicada, liberação do estúdio e gravação. Essas notas precisam ser substituídas pelas instruções finais quando as pendências forem resolvidas; não enviar esse rascunho como se estivesse pronto.

## O que falta e quem resolve

1. **Responsável pela empresa:** confirmar a razão social/controlador, país, histórico real de solicitações de segurança nacional e políticas efetivamente adotadas. Não inferir essas respostas pelo código. Foi selecionado Sim para existência de provedores; o cadastro completo exige categorias e todos os países de tratamento/acesso. Cloudflare e Supabase fazem parte da infraestrutura observada. O fornecedor da VPS e os países efetivos precisam ser conferidos nos contratos/configurações antes da declaração final.
2. **Titular:** criar ou indicar conta de criador exclusiva para revisão, com senha definida por ele, sem acesso administrativo ou dados de outras lojas. Credenciais ficam somente no campo privado da Meta; nunca no chat, Git ou neste relatório. O formulário informa manutenção dos códigos de acesso por um ano após envio.
3. **Implementação/operador da plataforma:** liberar o estúdio para a conta dedicada preservando o aviso para os demais criadores. `src/app/dashboard/instagram/page.tsx` atualmente entrega aviso de análise para todos. Não foram alteradas autenticação, autorização, RLS nem contas nesta sessão. Não é possível gravar a jornada completa nesse endereço enquanto ele continuar mostrando só o aviso.
4. **Titular:** após a liberação da conta de teste, gravar conexão oficial, perfil conectado, seleção de produto próprio, personalização, confirmação e publicação real autorizada. Não mostrar senhas/tokens nem enviar credenciais do Instagram aos avaliadores. A gravação deve ser anexada nas duas permissões quando demonstrar ambas.
5. **Responsável:** confirmar os compromissos de uso permitido exibidos nas duas permissões; nenhum aceite foi feito em seu nome nesta sessão. A submissão final continua bloqueada por etapas incompletas.
6. **Operador da plataforma:** atualizar instruções com o acesso realmente testado e conferir todos os campos antes de enviar. Aguardar o processo de verificação de acesso; não prometer aprovação ou prazo.

## Pinterest

Aplicativo 1626029 permanece com **Acesso Trial pendente**. O painel informa solicitação em análise, segredo indisponível e campo de URI de redirecionamento desabilitado. Não gerar token limitado de leitura como substituto para OAuth/publicação. Não houve alteração no Pinterest nesta preparação da Meta.

## Complemento: documento do MEI fornecido pelo titular

O titular forneceu um CCMEI em PDF e autorizou usar seus dados no formulário da Meta. O nome empresarial foi transcrito para o campo de controlador e o país foi definido como Brasil. Os valores apareceram no formulário com a indicação de salvamento automático. O PDF, CPF, CNPJ completo e endereço não foram copiados para este repositório nem anexados à Meta sem necessidade.

O certificado comprova dados cadastrais, mas não informa países de tratamento/acesso dos provedores, histórico de solicitações de segurança nacional ou procedimentos efetivamente adotados pela empresa. Essas declarações continuam sem resposta, aguardando informação do titular; não foi feito aceite adicional nem envio final.

## Complemento: declarações do titular e hospedagem

Após o preenchimento cadastral, o titular confirmou que não houve compartilhamento por solicitações de segurança nacional nos últimos 12 meses e declarou adoção dos quatro procedimentos oferecidos pelo formulário: verificar legitimidade, contestar solicitações ilegais, minimizar dados e registrar solicitações/respostas. Essas cinco seleções foram preenchidas; a interface confirmou salvamento automático. São declarações fornecidas pelo titular, não uma auditoria independente dos procedimentos ou certificações.

Foi cadastrado **Integrator Host do Brasil**, categoria **Soluções e serviços de TI, incluindo o armazenamento e processamento na nuvem**, país **Estados Unidos da América**, conforme informação do titular sobre VPS Linux/MinIO. A Meta exibiu o provedor na lista e o progresso de Tratamento de dados passou a 100%.

Esse progresso representa preenchimento dos campos exigidos pelo formulário, não comprova completude da lista de operadores. Cloudflare e Supabase também participam do fluxo implementado e seus países de tratamento/acesso ainda precisam ser confirmados. A documentação oficial informa que região do banco não equivale necessariamente a todos os locais de suporte/operação, e a Cloudflare pode processar dados globalmente sem configuração de localização específica. Não foram cadastrados países por suposição.

A tentativa de abrir o painel Supabase para conferir a região foi bloqueada pelo controle de segurança do navegador por permissão salva. Não houve contorno do bloqueio nem tentativa alternativa de consultar a mesma conta. Foi solicitada ao titular a região/países de tratamento do Supabase e confirmação de eventual localização contratada/configurada na Cloudflare.

Não foram copiados para o formulário os textos de certificações mencionados pelo titular: a etapa apresentada solicita nome, categoria e países. Não houve aceite adicional de termos nem envio da solicitação. Permanecem pendentes a lista completa dos provedores, acesso dedicado ao estúdio, screencast e compromissos de uso permitido.

Fontes oficiais consultadas para delimitar a pendência:

- https://supabase.com/legal/privacy-resources/data-residency-and-transfers-faq
- https://developers.cloudflare.com/data-localization/metadata-boundary/
- https://developers.cloudflare.com/data-localization/regional-services/

## Complemento: Supabase e Cloudflare informados pelo titular

O titular informou inicialmente duas regiões alternativas para o banco. Após pergunta específica, confirmou **us-east-1**, nos Estados Unidos; não foi declarada residência do banco no Brasil.

Foram salvos os seguintes operadores adicionais, todos na categoria de soluções/serviços de TI, armazenamento e processamento em nuvem:

| Operador | Países individualmente selecionados no rascunho |
| --- | --- |
| Supabase Pte. Ltd. / Supabase, Inc. | Estados Unidos da América e Singapura |
| Cloudflare, Inc. | Brasil e Estados Unidos da América |

Os três provedores, incluindo Integrator Host do Brasil, aparecem na lista da Meta. As respostas sobre autoridades e os quatro procedimentos continuam selecionadas e a interface confirma salvamento automático.

**Pendência antes de submeter:** o titular também declarou suporte/processamento global, sem enumerar os demais países. A Meta exige seleção de países individualmente; a busca por Global não apresentou opção. Os países acima são os nominalmente informados, não uma declaração de que todo o tratamento ocorre somente neles. É necessário completar a abrangência com os documentos/configurações dos provedores antes de enviar. A lista de datacenters de um provedor, por si só, não prova que todos tratam os dados deste aplicativo, nem substitui os locais de suporte remoto. Não foram selecionados outros países por suposição.

Não foram aceitos contratos novos, alteradas configurações de residência dos dados, geradas credenciais ou enviados documentos privados a novos destinatários. As afirmações sobre DPA, SCCs, certificações e retenção recebidas do titular não foram convertidas em certificações independentes nem inseridas em campos que solicitavam somente nome, serviço e países.

Validação desta continuação: `npm run lint` e build Vinext/Wrangler com `node scripts/deploy-cloudflare.mjs --dry-run` concluídos com exit 0 (17 avisos existentes de lint). Nenhum código de aplicação foi alterado ou publicado. Este registro foi atualizado para documentar as seleções efetivas e sua limitação geográfica.

## Preparação técnica da conta dedicada

O titular criou a loja **Revisão Meta Educalizando** e informou seu e-mail comercial como conta de teste. Após o cadastro feito pelo titular, o painel confirmou um produto publicado: **Material didatico 2027 META**, formato PDF, com capa. Nenhuma senha foi lida ou solicitada pelo chat.

Foi preparado acesso temporário ao estúdio no endereço existente `/dashboard/instagram`. Ele usa a autenticação de servidor já existente (inclusive a verificação de segundo fator), exige e-mail confirmado e corresponde exatamente ao e-mail configurado no servidor. Não usa e-mail, loja ou papel passados por query string, nem amplia as permissões de APIs. O estúdio continua resolvendo somente a loja e os produtos do usuário autenticado pelos controles existentes.

As seguintes variáveis foram salvas em produção no Worker, inicialmente com o acesso **desligado**:

- `INSTAGRAM_REVIEW_ENABLED=false`.
- `INSTAGRAM_REVIEW_ACCOUNT_EMAIL`: e-mail da conta dedicada informado pelo titular; nunca uma senha ou token.
- `INSTAGRAM_REVIEW_UNTIL=2027-10-20T23:59:59.000Z`.

Sem as três configurações válidas, com acesso desligado, prazo vencido, usuário anônimo, outro e-mail ou e-mail não confirmado, a página mantém o aviso de análise. Falha na consulta de identidade também mantém o aviso. A ativação final e o teste real no navegador precisam de confirmação posterior; não confundir configuração com conexão real ao Instagram, gravação ou aprovação da Meta.

Não há novos bindings, cron ou armazenamento. Durante a ativação temporária, a página verifica a sessão no servidor; desativada, não consulta a identidade para esse controle.

Arquivos desta preparação:

| Arquivo | Motivo |
| --- | --- |
| `src/lib/instagram-review-access.ts` | Validar configuração de teste e prazo, somente no servidor |
| `src/app/dashboard/instagram/page.tsx` | Abrir o estúdio para a conta de revisão autenticada, preservando o aviso para as demais |
| `src/components/creator/InstagramReviewGate.tsx` | Consultar a elegibilidade com a sessão real do painel, cancelar ao desmontar e preservar o aviso em falhas |
| `src/app/api/creator/instagram/review-access/route.ts` | Validar identidade no servidor por Bearer ou cookie, retornando somente um booleano privado e sem cache |
| `scripts/verify-instagram-review-access.cjs` | Testar configuração ausente, inválida, vencida, normalização, sessão ausente, outro usuário, e-mail não confirmado e falha de autenticação |
| Este relatório | Registrar configuração efetiva, escopo e pendências |

Verificações da versão final desta preparação: teste de acesso de revisão, regressão `verify-instagram-publishing.cjs`, lint (zero erros, 17 avisos existentes), `typecheck:vinext` e build de produção Vinext/Wrangler com `--dry-run` aprovados. Não foram alterados RLS, dados de criadores, preços, checkout, Asaas, webhooks ou o fluxo OAuth.

Compatibilidade de sessão: o painel utiliza também Supabase JS com sessão local e `instagramFetch` envia o Bearer às APIs existentes. A entrada de revisão usa esse mesmo cliente e uma consulta autenticada de elegibilidade; não depende de cookies SSR para funcionar após o cadastro. O endpoint reutiliza `getRequestUser`, incluindo validação de segundo fator. Não retorna nome, e-mail, IDs ou tokens. Sessões não confirmadas, outros usuários e falhas recebem acesso negado; respostas têm `private, no-store` e `Vary: Authorization, Cookie`. Não há consulta periódica. A expiração fecha novas entradas/checagens da interface, não revoga a autorização OAuth existente do titular no Instagram.

## Verificação local e arquivos

- `npm run lint`: exit 0, zero erros e 17 avisos existentes.
- `node scripts/deploy-cloudflare.mjs --dry-run`: exit 0, build de produção Vinext e empacotamento Wrangler concluídos. Não houve deploy.
- Código de acesso restrito alterado conforme a tabela acima; nenhum dado cadastrado de criador foi alterado pelo agente.
- Este arquivo: registro das mudanças efetivamente salvas, impedimentos e próximos passos. As verificações foram repetidas após a adaptação da sessão Bearer, todas com exit 0.
- `.cloudflare/educalizando-meta-icon-transparent-1024.png`: arquivo técnico local usado no upload da marca; diretório ignorado, não incluído no Git. A tentativa anterior com fundo branco também permanece local nesse diretório.
- O diretório `output/` já estava não rastreado antes da tarefa e não foi incluído.
