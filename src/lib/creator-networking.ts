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
    message: 'Olá, {{nome}}! Que bom ter você por aqui 💙\n\nA {{loja}} agora faz parte da comunidade Educalizando, e queremos acompanhar você de perto nessa jornada. Sabemos que começar uma loja envolve dúvidas, escolhas e bastante dedicação — você não precisa fazer tudo sozinho(a).\n\nNo seu painel, você pode organizar a vitrine, publicar materiais e acompanhar o crescimento da loja: https://www.educalizando.com.br/dashboard\n\nSe travar em qualquer etapa, responda esta mensagem. Nossa equipe vai ler e ajudar você com carinho. Seja muito bem-vindo(a)! ✨',
  },
  {
    id: 'group',
    title: 'Convite para o grupo',
    description: 'Convide para o grupo oficial de criadores.',
    message: `Olá, {{nome}}! Tudo bem? 🌟\n\nCriar fica muito mais leve quando podemos trocar experiências. Por isso, queremos convidar você para o grupo oficial de criadores da Educalizando.\n\nPor lá compartilhamos dicas práticas, novidades da plataforma, oportunidades e orientações para ajudar a {{loja}} a crescer. É também um espaço para você tirar dúvidas e se sentir acompanhado(a).\n\nEntre quando puder: ${CREATOR_GROUP_URL}\n\nVai ser muito bom ter você mais perto da nossa comunidade! 💙`,
  },
  {
    id: 'catalog',
    title: 'Fortalecer o catálogo',
    description: 'Oriente lojas com menos de 10 produtos publicados.',
    message: 'Olá, {{nome}}! Como você está? 💙\n\nPassamos para olhar com carinho o desenvolvimento da {{loja}} e vimos que seu catálogo ainda tem menos de 10 materiais. Isso não é uma cobrança — é uma oportunidade que queremos ajudar você a aproveitar.\n\nQuando a loja oferece mais opções, ela pode aparecer em mais buscas e atender necessidades diferentes dos clientes. Uma boa primeira meta é chegar a 10 produtos, no seu ritmo, cuidando de cada capa, título e descrição.\n\nVocê pode começar com apenas um novo material nesta semana: https://www.educalizando.com.br/dashboard/produtos\n\nExiste alguma dificuldade impedindo você de publicar? Responda esta mensagem e conte para nós. Queremos entender e ajudar de verdade. 🚀',
  },
  {
    id: 'branding',
    title: 'Completar identidade visual',
    description: 'Ajude lojas sem logo ou capa a transmitir mais confiança.',
    message: 'Olá, {{nome}}! Tudo bem por aí? ✨\n\nVisitamos a {{loja}} e percebemos que ainda falta a foto de perfil, a imagem de capa ou uma das duas. Queremos ajudar você a deixar essa vitrine com a qualidade que o seu trabalho merece.\n\nUma identidade visual completa ajuda o cliente a reconhecer sua marca, transmite mais confiança e deixa os materiais com uma apresentação profissional desde a primeira visita.\n\nVocê pode configurar as imagens aqui: https://www.educalizando.com.br/dashboard/loja\n\nSe não tiver uma arte pronta ou não souber qual imagem usar, fale com a gente. Responda esta mensagem e vamos orientar você com calma. 💙',
  },
  {
    id: 'morning',
    title: 'Bom dia',
    description: 'Inicie o dia mantendo o relacionamento ativo.',
    message: 'Bom dia, {{nome}}! ☀️\n\nEsperamos que você esteja bem. Passamos para desejar um dia leve e produtivo para você e para a {{loja}}.\n\nComo está sua experiência na Educalizando? Se alguma etapa estiver difícil — cadastro, publicação, divulgação ou organização da loja — responda esta mensagem e conte para nós. Estamos aqui para ouvir e ajudar. 💙',
  },
  {
    id: 'afternoon',
    title: 'Boa tarde',
    description: 'Faça um acompanhamento durante a tarde.',
    message: 'Boa tarde, {{nome}}! 🌤️\n\nTudo bem com você? Passamos para saber como estão as coisas na {{loja}} e se existe alguma etapa em que você gostaria de receber ajuda.\n\nPode ser uma dúvida simples ou algo que esteja impedindo você de avançar. Responda por aqui quando puder — nossa equipe está pronta para ouvir e orientar você com atenção. 💙',
  },
  {
    id: 'evening',
    title: 'Boa noite',
    description: 'Mantenha o contato próximo no fim do dia.',
    message: 'Boa noite, {{nome}}! 🌙\n\nEsperamos que seu dia tenha sido tranquilo. Antes de encerrar, queremos lembrar que você pode contar com a gente no desenvolvimento da {{loja}}.\n\nSe surgiu alguma dúvida sobre materiais, configuração ou vendas, deixe sua mensagem por aqui. Vamos ler com atenção e ajudar assim que possível. Cuide-se! 💙',
  },
  {
    id: 'support',
    title: 'Acompanhamento',
    description: 'Pergunte se o criador precisa de ajuda.',
    message: 'Olá, {{nome}}! Como você está? 💙\n\nEstamos acompanhando nossos criadores porque queremos que ninguém se sinta sozinho durante o desenvolvimento da loja. Como está sendo sua experiência com a {{loja}}?\n\nExiste alguma dúvida, dificuldade ou ideia que você gostaria de dividir com a gente? Pode responder com suas próprias palavras. Nossa equipe vai ler com atenção e buscar uma orientação que realmente ajude você.',
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
