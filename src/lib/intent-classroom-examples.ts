/** Editorial planning examples, not promises about the contents of listed products. */
export const INTENT_CLASSROOM_EXAMPLES: Record<string, { title: string; steps: string[]; observation: string }> = {
  'materiais-didaticos': {
    title: 'Uma revisão que mostra como os alunos pensaram',
    steps: [
      'Escolha um conteúdo já trabalhado e formule uma pergunta que ajude a perceber o que a turma compreendeu. Procure um recurso cuja descrição corresponda a esse objetivo, em vez de selecionar apenas pela quantidade de páginas.',
      'Leia o material antes da aula e selecione a parte que será usada, conforme a licença. Apresente a proposta, dê tempo para respostas individuais e depois peça que os estudantes comparem seus caminhos em duplas.',
      'Retome duas ou três respostas com a turma. Registre as dúvidas que apareceram e use esse registro para decidir se o próximo encontro precisa de outra explicação, de exemplos diferentes ou de um novo desafio.',
    ],
    observation: 'Observe as justificativas e as perguntas, além dos acertos. Uma atividade preenchida não permite, sozinha, concluir que todos compreenderam o conteúdo.',
  },
  'atividades-alfabetizacao': {
    title: 'Ler, conversar e registrar sem transformar tudo em cópia',
    steps: [
      'Defina se a proposta será voltada à leitura, à escrita de palavras ou à compreensão de um texto. Confira nas prévias se o recurso oferece apoio compatível com esse objetivo e com as produções atuais das crianças.',
      'Faça uma leitura compartilhada ou apresente as palavras escolhidas para a aula. Convide as crianças a explicar suas hipóteses e organize duplas para que possam conversar sobre as escolhas, com sua mediação.',
      'Proponha um registro curto relacionado à conversa: escrever uma palavra, organizar uma lista ou responder sobre o texto, conforme o que foi planejado. Guarde uma produção para comparar com trabalhos posteriores.',
    ],
    observation: 'Anote o que a criança consegue fazer com autonomia e que tipo de apoio utiliza. A indicação de ano no anúncio não substitui essa observação.',
  },
  'educacao-infantil': {
    title: 'Uma imagem como ponto de partida para brincar e conversar',
    steps: [
      'Escolha um tema que já tenha despertado curiosidade no grupo. Leia a proposta do recurso e veja se o tamanho das imagens, a linguagem e os materiais necessários fazem sentido para a idade e para o espaço disponível.',
      'Apresente uma imagem ou situação e escute o que as crianças percebem. Convide o grupo a explorar o tema com histórias, movimentos ou brincadeiras. Se houver recorte ou montagem, prepare o que exige intervenção de um adulto.',
      'Retome a experiência em uma conversa breve. As crianças podem apontar imagens, contar algo ou participar de um registro coletivo; não é necessário que todas respondam do mesmo modo.',
    ],
    observation: 'Observe participação, interesses e formas de expressão. Adapte o tempo e os apoios ao grupo e confira os cuidados necessários para os materiais utilizados.',
  },
  'atividades-para-imprimir': {
    title: 'Prepare uma cópia de teste antes de imprimir para a turma',
    steps: [
      'Leia o anúncio e abra a prévia quando ela estiver disponível. Confira o formato, as páginas necessárias, a orientação da folha e as informações de cor. Não presuma que todo PDF permita editar o conteúdo.',
      'Depois de acessar o arquivo, confira as instruções e imprima uma página de teste. Verifique legibilidade, espaço de resposta e escala, especialmente quando houver peças para montar. Ajuste a impressão conforme as orientações do arquivo.',
      'Planeje a explicação inicial e os recursos complementares antes de fazer todas as cópias. Ao terminar a atividade, converse sobre as respostas e registre os pontos que precisam ser retomados.',
    ],
    observation: 'Uma impressão legível e uma instrução compreendida ajudam a separar dificuldades de apresentação das dúvidas sobre o conteúdo.',
  },
  'jogos-pedagogicos': {
    title: 'Uma rodada de demonstração antes de formar os grupos',
    steps: [
      'Identifique o objetivo do jogo e confira no anúncio seus componentes, regras e número de participantes, quando informados. Prepare as peças e verifique se a proposta é viável no tempo e no espaço da aula.',
      'Demonstre uma rodada, explicando as decisões em voz alta. Peça que os alunos retomem as regras com suas palavras antes de começar. Organize os grupos de acordo com a proposta do jogo e com os apoios de que a turma precisa.',
      'Durante a partida, acompanhe as estratégias e as dúvidas. Ao final, escolha uma situação do jogo para conversar com o grupo: como resolveram, que alternativas encontraram e o que fariam em outra rodada.',
    ],
    observation: 'Vencer não é a única evidência relevante. Observe como o estudante explica uma escolha, usa o conteúdo e participa das interações.',
  },
  'atividades-ensino-fundamental': {
    title: 'Comparar respostas e voltar às evidências',
    steps: [
      'Escolha uma questão compatível com o conteúdo já estudado. Confira a etapa e os conhecimentos exigidos pela proposta. Uma indicação genérica de Ensino Fundamental pode abranger necessidades muito diferentes.',
      'Reserve um momento para resolução individual e outro para comparação em duplas. Peça que cada estudante explique de onde tirou sua resposta: um trecho do texto, um cálculo, uma imagem ou outro elemento da atividade.',
      'Reúna respostas diferentes e retome as evidências com a turma. Se o recurso incluir gabarito, confira como ele pode apoiar a discussão; se não incluir, prepare previamente sua análise das questões.',
    ],
    observation: 'Registre as estratégias e as dificuldades recorrentes para planejar a retomada. Não infira a presença de gabarito apenas pelo tipo de atividade.',
  },
  'planos-de-aula-bncc': {
    title: 'Transforme o recurso escolhido em uma sequência possível',
    steps: [
      'Escreva o objetivo da aula e confira sua relação com o currículo da rede. Quando o anúncio trouxer códigos ou habilidades da BNCC, leia as referências e compare-as com o que a proposta realmente solicita aos estudantes.',
      'Organize uma abertura que retome conhecimentos anteriores, um momento de exploração do recurso e um fechamento. Distribua o tempo considerando leitura das instruções, preparação dos materiais e necessidades de apoio.',
      'Defina o que observar durante a aula e como registrar essas observações. Depois da aplicação, reveja o planejamento com base nas produções e dúvidas da turma, sem tratar o plano como uma receita fixa.',
    ],
    observation: 'A presença nesta seleção não certifica alinhamento de todos os produtos à BNCC. A conferência do currículo e da proposta continua sendo necessária.',
  },
  'recursos-pedagogicos': {
    title: 'Escolher um recurso para uma necessidade observada',
    steps: [
      'Parta de uma situação concreta: dificuldade para compreender uma instrução, necessidade de revisar um conteúdo ou interesse por um tema. Descreva o que deseja observar após a atividade antes de pesquisar materiais.',
      'Compare dois recursos pelas informações disponíveis: conteúdo, público, formato, prévias e condições de uso. Escolha a proposta que possa ser mediada com os recursos da escola, sem presumir que um anúncio mais longo seja necessariamente melhor.',
      'Aplique a proposta e registre o que funcionou, quais apoios foram necessários e quais dúvidas permaneceram. Use essas notas para decidir se o recurso merece ser retomado ou se será preciso buscar outra abordagem.',
    ],
    observation: 'O recurso apoia o trabalho docente; a adequação depende do objetivo, da mediação e das condições reais de participação da turma.',
  },
};
