/** Planning guidance for existing pages; never a claim about the listed products. */
export const CALENDAR_EDITORIAL: Record<string, {
  title: string;
  description: string;
  sections: { title: string; text: string }[];
  related: { href: string; label: string }[];
}> = {
  'proclamacao-da-republica': {
    title: 'Proclamação da República: atividades para imprimir',
    description: 'Planeje aulas sobre a Proclamação da República. Veja sugestões de pesquisa e compare materiais digitais por conteúdo, formato e público indicado.',
    sections: [
      { title: 'Transforme a data em uma pergunta de investigação', text: 'Uma aula sobre a Proclamação da República pode começar com perguntas sobre formas de governo, participação política e mudanças na sociedade. Escolha uma questão compatível com o que a turma já estudou. Em vez de organizar a proposta apenas em torno da memorização de uma data, reúna textos, imagens ou documentos que permitam comparar interpretações. Ao usar uma fonte, identifique com os alunos quem a produziu, em qual contexto e com que intenção. As respostas podem ser registradas em uma linha do tempo comentada, um quadro de comparação ou um pequeno texto, conforme os objetivos da aula.' },
      { title: 'Compare os materiais antes de preparar a atividade', text: 'Nesta página, os produtos relacionados dependem dos temas marcados pelos criadores. Leia cada anúncio para saber se o arquivo oferece texto de apoio, questões, ilustrações ou outra proposta; essa seleção não garante que todos incluam os mesmos recursos. Confira a etapa escolar, o formato, as prévias disponíveis e as condições de uso. Uma atividade de recorte pode complementar uma investigação, mas não substitui a contextualização do professor. Se precisar de avaliação, verifique se há espaço para respostas e quais conhecimentos serão mobilizados. Para adaptar ou editar o arquivo, confirme primeiro as possibilidades do formato e da licença.' },
    ],
    related: [{ href: '/categorias/historia', label: 'Materiais de História' }, { href: '/atividades-ensino-fundamental', label: 'Atividades para Ensino Fundamental' }],
  },
  'dia-da-consciencia-negra': {
    title: 'Consciência Negra: atividades para suas aulas',
    description: 'Planeje propostas sobre Consciência Negra e cultura afro-brasileira. Compare os materiais, as prévias e o público indicado para sua turma.',
    sections: [
      { title: 'Dê espaço para histórias, vozes e referências diversas', text: 'O trabalho com a Consciência Negra pode articular leitura, pesquisa, apreciação artística e conversa sobre respeito e participação social. Defina um recorte adequado à turma e selecione referências que apresentem pessoas negras como sujeitos de suas próprias histórias. Ao escolher imagens e textos, observe se há diversidade de experiências e se a abordagem evita estereótipos. Reserve tempo para ouvir as perguntas dos estudantes e contextualizar as fontes utilizadas. Uma produção visual ou um painel pode registrar o percurso, mas precisa estar ligado às leituras e discussões da aula. O tema também pode continuar em outros momentos do planejamento, além da data comemorativa.' },
      { title: 'Escolha a proposta pelo conteúdo, além da decoração', text: 'Antes de comprar, confira o que está incluído no anúncio: um painel decorativo, uma sequência de atividades e um texto de pesquisa cumprem funções diferentes. Leia a descrição e as prévias para avaliar a linguagem, a legibilidade e a relação com seus objetivos. Os níveis indicados pelo criador ajudam na busca, mas não substituem essa leitura. Não presuma que um arquivo traga orientações de mediação, referências ou possibilidades de edição se isso não estiver informado. Planeje como apresentar o recurso, acolher dúvidas e acompanhar as produções da turma. Se faltar uma informação essencial, consulte a loja antes de escolher o material.' },
    ],
    related: [{ href: '/categorias/historia', label: 'Explorar materiais de História' }, { href: '/educacao-infantil', label: 'Recursos para Educação Infantil' }],
  },
};
