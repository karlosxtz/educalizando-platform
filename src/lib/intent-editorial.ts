type IntentEditorial = {
  seoTitle: string;
  sections: { title: string; text: string }[];
  related: { href: string; label: string }[];
};

/** Guidance for existing pages; these texts do not assert features of any product. */
export const INTENT_EDITORIAL: Record<string, IntentEditorial> = {
  'materiais-didaticos': {
    seoTitle: 'Materiais didáticos digitais | Educalizando',
    sections: [
      { title: 'Escolha a partir do objetivo da sua aula', text: 'Antes de escolher um material didático, pense no que a turma precisa aprender e em como você vai acompanhar esse processo. Uma atividade de revisão pede recursos diferentes de uma primeira apresentação do conteúdo. Leia a descrição para conferir o tema, o público indicado e o que está incluído. A capa ajuda a conhecer a proposta visual, mas não substitui essas informações.' },
      { title: 'Compare formato, licença e condições de acesso', text: 'PDF, vídeo, curso e outros formatos exigem formas diferentes de uso. Para uma proposta impressa, confira tamanho, cores e quantidade de páginas quando esses dados estiverem disponíveis. Para um recurso digital, considere os equipamentos da escola. Verifique também a licença e as condições de entrega de cada anúncio. Comprar um arquivo para usar em aula não significa receber autorização para revender ou redistribuir o conteúdo.' },
    ],
    related: [{ href: '/atividades-para-imprimir', label: 'Atividades para imprimir' }, { href: '/jogos-pedagogicos', label: 'Jogos pedagógicos' }, { href: '/recursos-pedagogicos', label: 'Como escolher recursos pedagógicos' }],
  },
  'atividades-alfabetizacao': {
    seoTitle: 'Atividades de alfabetização para imprimir | Educalizando',
    sections: [
      { title: 'Observe o que a criança já sabe sobre a escrita', text: 'Atividades de alfabetização podem trabalhar reconhecimento de letras, relações entre sons e escrita, formação de palavras ou compreensão de pequenos textos. Essas propostas têm objetivos distintos. Observe as produções da criança antes de escolher o recurso e leia o anúncio para entender qual habilidade a atividade explora. Uma indicação de ano escolar ajuda na busca, mas não substitui a observação do professor sobre as necessidades da turma.' },
      { title: 'Combine a atividade impressa com leitura e conversa', text: 'Ao trabalhar com um alfabeto, jogo de sílabas ou proposta de leitura e escrita, reserve tempo para a criança explicar suas escolhas. É possível alternar momentos coletivos, duplas e registros individuais conforme o objetivo da aula. Confira as prévias disponíveis para avaliar legibilidade e espaço de resposta. Se houver necessidade de adaptação, verifique primeiro o formato e a licença; um PDF não é necessariamente um arquivo editável.' },
    ],
    related: [{ href: '/educacao-infantil', label: 'Recursos para Educação Infantil' }, { href: '/jogos-pedagogicos', label: 'Jogos para diferentes aprendizagens' }, { href: '/atividades-ensino-fundamental', label: 'Materiais para Ensino Fundamental' }],
  },
  'educacao-infantil': {
    seoTitle: 'Materiais para Educação Infantil | Educalizando',
    sections: [
      { title: 'Planeje experiências que acolham diferentes ritmos', text: 'Na Educação Infantil, um recurso pode apoiar histórias, brincadeiras, exploração de imagens e conversas sobre o cotidiano. Ao escolher, considere a idade das crianças, seus interesses e a possibilidade de participação de todas. Veja se a proposta exige leitura, recorte ou manipulação de peças pequenas. A descrição e as prévias ajudam a decidir o que faz sentido para o grupo e quais cuidados serão necessários na preparação.' },
      { title: 'Organize o uso antes de preparar as cópias', text: 'Um mesmo tema pode ser explorado com uma roda de conversa, uma brincadeira ou uma produção coletiva. Defina como o material entra nessa experiência e quanto tempo as crianças terão para explorá-lo. Antes de imprimir, confira o formato, as cores e a quantidade de páginas informada pelo criador. Evite escolher apenas pela aparência da capa: a proposta precisa caber no espaço, nos recursos e na rotina da sua turma.' },
    ],
    related: [{ href: '/atividades-alfabetizacao', label: 'Alfabetização e letramento' }, { href: '/jogos-pedagogicos', label: 'Jogos pedagógicos' }, { href: '/atividades-para-imprimir', label: 'Atividades para imprimir' }],
  },
  'planos-de-aula-bncc': {
    seoTitle: 'Planos de aula e planejamento com a BNCC | Educalizando',
    sections: [
      { title: 'Comece pelo objetivo, depois escolha o recurso', text: 'Um plano de aula organiza o que será ensinado, as etapas da proposta e a observação da aprendizagem. Ao procurar um material, confira se o anúncio apresenta a sequência, o público e os recursos necessários. Uma atividade avulsa pode complementar seu planejamento, mas não equivale automaticamente a um plano completo. Considere também o tempo disponível e o que a turma já estudou antes de definir como usar a proposta.' },
      { title: 'Confira a relação com a BNCC em cada anúncio', text: 'A presença de um material nesta seleção não comprova alinhamento à BNCC. Quando o criador informar habilidades ou códigos, compare-os com o conteúdo da proposta e com o currículo da sua rede. Não presuma que todos os arquivos tragam esses dados. Use as informações disponíveis como apoio para revisar o planejamento, definir a mediação e registrar evidências de aprendizagem. Se faltar um detalhe essencial, consulte a loja antes de comprar.' },
    ],
    related: [{ href: '/atividades-ensino-fundamental', label: 'Atividades para Ensino Fundamental' }, { href: '/educacao-infantil', label: 'Materiais para Educação Infantil' }, { href: '/recursos-pedagogicos', label: 'Escolher recursos para suas aulas' }],
  },
  'atividades-para-imprimir': {
    seoTitle: 'Atividades escolares para imprimir | Educalizando',
    sections: [
      { title: 'Confira o arquivo antes de planejar a impressão', text: 'Ao escolher atividades para imprimir, veja se o anúncio informa PDF ou outro formato adequado à sua necessidade. Confira as páginas de prévia, o tamanho de impressão e o uso de cores quando esses detalhes estiverem disponíveis. Um recurso com imagens pequenas ou instruções extensas pode pedir outra organização da aula. A quantidade de páginas, sozinha, não indica se o material atende ao objetivo que você definiu.' },
      { title: 'Prepare uma aplicação possível para a sua turma', text: 'Antes de produzir todas as cópias, leia as orientações e planeje a mediação. Pense no tempo de realização, nos materiais complementares e na forma de acompanhar as respostas dos alunos. Se precisar alterar textos ou imagens, confirme se o formato permite edição e se a licença autoriza a adaptação. Nesta seleção há materiais com diferentes condições de compra; preço e gratuidade devem ser conferidos na página de cada produto.' },
    ],
    related: [{ href: '/atividades-alfabetizacao', label: 'Atividades de alfabetização' }, { href: '/atividades-ensino-fundamental', label: 'Atividades para Ensino Fundamental' }, { href: '/jogos-pedagogicos', label: 'Jogos pedagógicos' }],
  },
  'jogos-pedagogicos': {
    seoTitle: 'Jogos pedagógicos para suas aulas | Educalizando',
    sections: [
      { title: 'Entenda o que o jogo propõe trabalhar', text: 'Bingo, dominó, trilha e outros jogos podem apoiar diferentes aprendizagens, dependendo das regras e da mediação. Leia o anúncio para identificar o conteúdo, a indicação de público e os componentes incluídos. Confira se o recurso é digital ou precisa ser impresso e montado. Um tema conhecido pelas crianças pode despertar interesse, mas a escolha também precisa considerar o desafio e as oportunidades de participação da turma.' },
      { title: 'Planeje as regras, os grupos e a conversa final', text: 'Reserve tempo para apresentar uma rodada de exemplo antes de iniciar a atividade. Observe quantos participantes o material comporta, quando essa informação estiver disponível, e organize os grupos conforme o espaço da sala. Durante a partida, acompanhe as estratégias dos alunos. Ao final, retome as descobertas em uma conversa ou registro. Para imprimir, adaptar ou reutilizar as peças, confira o formato e as condições da licença do produto.' },
    ],
    related: [{ href: '/atividades-alfabetizacao', label: 'Leitura, escrita e alfabetização' }, { href: '/educacao-infantil', label: 'Recursos para Educação Infantil' }, { href: '/atividades-para-imprimir', label: 'Atividades para imprimir' }],
  },
  'atividades-ensino-fundamental': {
    seoTitle: 'Atividades para Ensino Fundamental | Educalizando',
    sections: [
      { title: 'Diferencie o ano escolar e o objetivo de aprendizagem', text: 'O Ensino Fundamental reúne etapas com necessidades distintas. Uma proposta para os anos iniciais pode exigir outra abordagem nos anos finais, mesmo quando trata do mesmo assunto. Confira os níveis marcados pelo criador, a descrição e as prévias do material. Considere também o repertório da turma: revisar um conteúdo, introduzir um conceito e avaliar a aprendizagem pedem atividades e formas de acompanhamento diferentes.' },
      { title: 'Combine conteúdo, linguagem e forma de uso', text: 'Ao comparar materiais, observe a extensão dos textos, o tipo de questão e os recursos visuais. Planeje como apresentar a atividade e quais registros permitirão entender o raciocínio dos alunos. Confira o formato antes de contar com edição, projeção ou impressão. As indicações do anúncio ajudam a escolher, mas cabe ao professor verificar a adequação ao currículo e às condições de sua escola. Nenhuma classificação substitui a leitura da proposta.' },
    ],
    related: [{ href: '/atividades-por-ano/ensino-fundamental-1', label: 'Materiais para os anos iniciais' }, { href: '/atividades-por-ano/ensino-fundamental-2', label: 'Materiais para os anos finais' }, { href: '/planos-de-aula-bncc', label: 'Planos de aula e planejamento' }],
  },
  'recursos-pedagogicos': {
    seoTitle: 'Recursos pedagógicos digitais | Educalizando',
    sections: [
      { title: 'Pense na função do recurso durante a aula', text: 'Um recurso pedagógico pode ajudar a apresentar um assunto, organizar uma prática, apoiar uma explicação ou acompanhar a aprendizagem. Comece pela dificuldade ou pelo objetivo que você quer trabalhar. Depois, compare as informações dos anúncios e veja como cada proposta pode entrar na sequência que você já planejou. Uma apresentação visual atraente é útil, mas precisa estar acompanhada de conteúdo e orientações adequados ao seu contexto.' },
      { title: 'Avalie o que está incluído e o que você precisará preparar', text: 'Confira os arquivos, as páginas, o formato e as prévias quando essas informações estiverem cadastradas. Considere impressão, montagem, equipamentos e tempo de preparação. Veja se a licença permite o uso pretendido e se há indicação de edição; arquivos digitais não são necessariamente editáveis. Nas páginas dos produtos e das lojas, busque os detalhes que faltarem para decidir. Assim você escolhe com mais clareza, sem depender apenas de um título ou de uma capa.' },
    ],
    related: [{ href: '/materiais-didaticos', label: 'Catálogo de materiais didáticos' }, { href: '/planos-de-aula-bncc', label: 'Organizar o planejamento de aula' }, { href: '/jogos-pedagogicos', label: 'Selecionar jogos pedagógicos' }],
  },
};
