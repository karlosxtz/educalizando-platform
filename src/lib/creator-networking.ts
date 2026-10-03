export type CreatorNetworkingPresetId = 'welcome' | 'group' | 'catalog' | 'branding' | 'morning' | 'afternoon' | 'evening' | 'support';
export type CreatorNetworkingAudience = 'all' | 'low_products' | 'incomplete_branding';

export type CreatorNetworkingPreset = {
  id: CreatorNetworkingPresetId;
  title: string;
  description: string;
  message: string;
};

export function isCreatorNetworkingPresetId(value: unknown): value is CreatorNetworkingPresetId {
  return typeof value === 'string' && CREATOR_NETWORKING_PRESETS.some((preset) => preset.id === value);
}

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
    id: 'catalog',
    title: 'Fortalecer o catálogo',
    description: 'Oriente lojas com menos de 10 produtos publicados.',
    message: 'Olá, {{nome}}! Tudo bem? 💙\n\nAnalisamos a loja {{loja}} e percebemos que seu catálogo ainda possui menos de 10 materiais. Um catálogo maior e bem organizado aumenta as possibilidades de aparecer nas buscas, atender diferentes necessidades e conquistar novas vendas.\n\nNossa sugestão é chegar primeiro a 10 produtos, publicando materiais úteis com boas capas, títulos claros e descrições completas. Não precisa fazer tudo de uma vez: escolha uma meta de publicações por semana.\n\nAcesse seus produtos e publique o próximo material: https://www.educalizando.com.br/dashboard/produtos\n\nSe precisar de ajuda para cadastrar ou melhorar seus materiais, responda esta mensagem. Estamos aqui para apoiar o crescimento da sua loja! 🚀',
  },
  {
    id: 'branding',
    title: 'Completar identidade visual',
    description: 'Ajude lojas sem logo ou capa a transmitir mais confiança.',
    message: 'Olá, {{nome}}! Tudo bem? ✨\n\nVimos que a identidade visual da loja {{loja}} ainda não está completa. Adicionar a foto de perfil da loja e uma imagem de capa deixa sua vitrine mais bonita, organizada e profissional para quem chega pelo marketplace.\n\nEssas imagens ajudam o cliente a reconhecer sua marca, aumentam a confiança na compra e fazem seus materiais ganharem uma apresentação mais atrativa.\n\nAcesse as configurações da loja, envie sua logo e sua capa e confira a prévia antes de salvar: https://www.educalizando.com.br/dashboard/loja\n\nSe tiver dificuldade, responda esta mensagem e nossa equipe ajuda você a concluir a configuração. 💙',
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

export function creatorMatchesNetworkingAudience(
  audience: CreatorNetworkingAudience,
  creator: { productCount: number; hasLogo: boolean; hasBanner: boolean },
) {
  if (audience === 'low_products') return creator.productCount < 10;
  if (audience === 'incomplete_branding') return !creator.hasLogo || !creator.hasBanner;
  return true;
}
