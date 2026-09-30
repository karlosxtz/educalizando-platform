export type CreatorWhatsAppCampaignPresetId =
  | 'promotion'
  | 'product'
  | 'product_request'
  | 'exclusive'
  | 'morning'
  | 'afternoon'
  | 'evening'
  | 'support';

export type CreatorWhatsAppCampaignPreset = {
  id: CreatorWhatsAppCampaignPresetId;
  title: string;
  description: string;
  message: string;
  requiresProduct?: boolean;
  requiresExclusiveEnabled?: boolean;
};

export const CREATOR_WHATSAPP_CAMPAIGN_PRESETS: CreatorWhatsAppCampaignPreset[] = [
  {
    id: 'promotion',
    title: 'Promoção da loja',
    description: 'Convide seus clientes para conferir as novidades da sua vitrine.',
    message: 'Olá, {{nome}}! 🎉\n\nA {{loja}} preparou materiais e novidades especiais para ajudar nas suas aulas.\n\nConfira a vitrine: {{link}}\n\nSe precisar de ajuda para escolher, responda esta mensagem. 💚',
  },
  {
    id: 'product',
    title: 'Divulgar produto',
    description: 'Envie um material específico com valor, capa e link direto.',
    requiresProduct: true,
    message: 'Olá, {{nome}}! 📚\n\nQuero apresentar o material “{{produto}}”, da {{loja}}, por {{preco}}.\n\nVeja os detalhes: {{link}}\n\nSe tiver alguma dúvida, pode falar comigo por aqui.',
  },
  {
    id: 'product_request',
    title: 'O que você procura?',
    description: 'Pergunte qual tema ou material o cliente deseja encontrar.',
    message: 'Olá, {{nome}}! 👋\n\nEstou passando para saber: qual material, tema ou ano de ensino você está procurando hoje?\n\nResponda esta mensagem com o que precisa e a {{loja}} ajuda você a encontrar a melhor opção. 🔎',
  },
  {
    id: 'exclusive',
    title: 'Material exclusivo',
    description: 'Convide o cliente para pedir um material criado especialmente para ele.',
    requiresExclusiveEnabled: true,
    message: 'Olá, {{nome}}! ✨\n\nPrecisa de um material feito especialmente para sua turma? A {{loja}} está recebendo solicitações de materiais exclusivos.\n\nEnvie seu pedido por aqui: {{link}}\n\nVocê poderá conversar, receber a proposta e acompanhar toda a entrega pela Educalizando.',
  },
  {
    id: 'morning',
    title: 'Bom dia',
    description: 'Comece o dia próximo dos seus clientes.',
    message: 'Bom dia, {{nome}}! ☀️\n\nA {{loja}} deseja um dia leve e cheio de boas ideias para suas aulas.\n\nEstá procurando algum material ou ficou com alguma dúvida? Pode responder por aqui. 💚',
  },
  {
    id: 'afternoon',
    title: 'Boa tarde',
    description: 'Faça um acompanhamento durante a tarde.',
    message: 'Boa tarde, {{nome}}! 🌤️\n\nTudo bem? A {{loja}} está por aqui para ajudar você a encontrar materiais para suas aulas.\n\nSe precisar de uma indicação, responda esta mensagem com o tema ou ano de ensino.',
  },
  {
    id: 'evening',
    title: 'Boa noite',
    description: 'Mantenha o relacionamento no fim do dia.',
    message: 'Boa noite, {{nome}}! 🌙\n\nEspero que seu dia tenha sido produtivo. Se precisar organizar as próximas aulas, conte com os materiais da {{loja}}.\n\nVeja a vitrine: {{link}}',
  },
  {
    id: 'support',
    title: 'Posso ajudar?',
    description: 'Pergunte se o cliente precisa de suporte após a compra.',
    message: 'Olá, {{nome}}! Tudo bem? 💚\n\nA {{loja}} está fazendo um acompanhamento com seus clientes. Você conseguiu acessar seus materiais ou ficou com alguma dúvida?\n\nResponda por aqui e conte como posso ajudar.',
  },
];

export function isCreatorWhatsAppCampaignPresetId(value: unknown): value is CreatorWhatsAppCampaignPresetId {
  return typeof value === 'string' && CREATOR_WHATSAPP_CAMPAIGN_PRESETS.some((preset) => preset.id === value);
}

export type CreatorCampaignVariables = {
  customerName: string;
  storeName: string;
  productName?: string | null;
  productPrice?: string | null;
  link: string;
};

export function renderCreatorWhatsAppCampaignMessage(template: string, variables: CreatorCampaignVariables) {
  return template
    .replace(/\{\{nome\}\}/gi, variables.customerName)
    .replace(/\{\{loja\}\}/gi, variables.storeName)
    .replace(/\{\{produto\}\}/gi, variables.productName || 'material selecionado')
    .replace(/\{\{preco\}\}/gi, variables.productPrice || 'consulte o valor')
    .replace(/\{\{link\}\}/gi, variables.link);
}

export function suggestedCreatorCampaignPresetId(hour: number): CreatorWhatsAppCampaignPresetId {
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

