export type CreatorNetworkingPreset = {
  id: 'welcome' | 'group' | 'morning' | 'afternoon' | 'evening' | 'support';
  title: string;
  description: string;
  message: string;
};

export const CREATOR_GROUP_URL = 'https://chat.whatsapp.com/C7Yz19yfFh6CWu12DmZyJx';

export const CREATOR_NETWORKING_PRESETS: CreatorNetworkingPreset[] = [
  {
    id: 'welcome',
    title: 'Boas-vindas',
    description: 'Recepcione o criador e apresente o painel.',
    message: 'Olá, {{nome}}! 👋\n\nSeja muito bem-vindo(a) à comunidade Educalizando! A loja {{loja}} já faz parte da nossa rede de criadores.\n\nConte com a nossa equipe para publicar, divulgar e vender seus materiais. Acesse seu painel: https://www.educalizando.com.br/dashboard\n\nEstamos felizes por ter você com a gente! 💙',
  },
  {
    id: 'group',
    title: 'Convite para o grupo',
    description: 'Convide para o grupo oficial de criadores.',
    message: `Olá, {{nome}}! 🌟\n\nQueremos convidar você para o grupo oficial de criadores da Educalizando. Por lá compartilhamos novidades, dicas de vendas, oportunidades e informações importantes da plataforma.\n\nEntre pelo link: ${CREATOR_GROUP_URL}\n\nEsperamos você!`,
  },
  {
    id: 'morning',
    title: 'Bom dia',
    description: 'Inicie o dia mantendo o relacionamento ativo.',
    message: 'Bom dia, {{nome}}! ☀️\n\nPassando para desejar um excelente dia para você e para a {{loja}}. Como estão as publicações dos seus materiais?\n\nSe tiver alguma dúvida ou precisar de ajuda, pode responder esta mensagem. Estamos por aqui! 💙',
  },
  {
    id: 'afternoon',
    title: 'Boa tarde',
    description: 'Faça um acompanhamento durante a tarde.',
    message: 'Boa tarde, {{nome}}! 🌤️\n\nTudo bem com você e com a {{loja}}? Queremos saber se existe alguma dúvida ou se podemos ajudar em alguma etapa dentro da Educalizando.\n\nPode contar com a nossa equipe!',
  },
  {
    id: 'evening',
    title: 'Boa noite',
    description: 'Mantenha o contato próximo no fim do dia.',
    message: 'Boa noite, {{nome}}! 🌙\n\nEsperamos que seu dia tenha sido produtivo. Se ficou alguma dúvida sobre sua loja, seus materiais ou suas vendas na Educalizando, envie uma mensagem para a gente.\n\nEstamos prontos para ajudar! 💙',
  },
  {
    id: 'support',
    title: 'Acompanhamento',
    description: 'Pergunte se o criador precisa de ajuda.',
    message: 'Olá, {{nome}}! Tudo bem? 💙\n\nEstamos fazendo um acompanhamento com nossos criadores e gostaríamos de saber: você tem alguma dúvida ou encontrou alguma dificuldade na {{loja}}?\n\nResponda por aqui e conte como podemos ajudar.',
  },
];

export function renderCreatorNetworkingMessage(
  template: string,
  creator: { name: string; storeName: string },
) {
  return template
    .replace(/\{\{nome\}\}/gi, creator.name)
    .replace(/\{\{loja\}\}/gi, creator.storeName);
}

export function suggestedGreetingPresetId(hour: number): CreatorNetworkingPreset['id'] {
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}
