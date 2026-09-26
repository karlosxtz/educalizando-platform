import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { generateAiContent, getAiKey } from '@/lib/ai-provider';

const instructions: Record<string, string> = {
  seo: 'Crie uma proposta completa de SEO para este produto. Priorize termos que educadores realmente buscariam e mantenha todas as sugestões fiéis ao material informado.',
  description: 'Crie uma proposta completa de apresentação e venda para este produto. A descrição deve ter parágrafos e listas claras, benefícios pedagógicos, o que está incluso, para quem serve e uma chamada final. Não invente páginas, arquivos ou certificações.',
  campaign: 'Crie uma campanha separada por canal. A mensagem de WhatsApp precisa ser uma mensagem de venda completa, calorosa e pronta para enviar: abertura que chama atenção, problema que o material resolve, benefícios, o que está incluso, convite claro e espaço para o link. Use 5 a 7 blocos curtos com emojis moderados. A legenda do Instagram deve ter emojis moderados e hashtags. Crie 3 Stories em sequência: o primeiro apresenta uma dor ou pergunta, o segundo explica o benefício e o terceiro faz a chamada para ação; cada Story deve ter 2 a 3 linhas, não apenas uma frase.',
  lesson: 'Crie um roteiro pedagógico claro e prático com objetivo de aprendizagem, preparação, passo a passo em sala, adaptação por nível e atividade complementar.',
};

function extractJson(text: string): Record<string, unknown> | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  const candidates = [fenced, start >= 0 && end > start ? text.slice(start, end + 1) : null, text].filter(Boolean) as string[];
  for (const candidate of candidates) {
    try { return JSON.parse(candidate.trim()); } catch { /* tenta a próxima versão extraída */ }
  }
  return null;
}

function cleanGeneratedText(value: string) {
  return value
    .replace(/\*\*/g, '')
    .replace(/^\s*#{1,6}\s*/gm, '')
    .replace(/^\s*[-*]\s+/gm, '• ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function cleanGeneratedValue(value: unknown): unknown {
  if (typeof value === 'string') return cleanGeneratedText(value);
  if (Array.isArray(value)) return value.map(cleanGeneratedValue);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, cleanGeneratedValue(item)]));
  return value;
}

function attachProductLink(content: Record<string, unknown> | null, productUrl: string) {
  if (!content) return null;
  const stories = content.stories;
  const includeLink = (value: unknown) => {
    if (typeof value !== 'string') return value;
    const replaced = value.replace(/\[(?:SEU )?(?:LINK(?: PARA COMPRA)?|LINK AQUI)\]/gi, productUrl);
    return replaced.includes(productUrl) ? replaced : `${replaced}\n\n🔗 Acesse o material: ${productUrl}`;
  };
  return {
    ...content,
    whatsapp: includeLink(content.whatsapp),
    instagram: includeLink(content.instagram),
    stories: Array.isArray(stories) ? stories.map((story, index) => index === stories.length - 1 ? includeLink(story) : story) : stories,
  };
}

function parseProposal(text: string, product: Record<string, unknown>) {
  const parsed = extractJson(text);
  const strings = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())).map(item => cleanGeneratedText(item)) : [];
  if (!parsed) return {
    titles: [String(product.titulo || '')].filter(Boolean),
    description: String(product.descricao || ''),
    tags: strings(product.tags),
    descriptionOptions: [String(product.descricao || '')].filter(Boolean),
    analysis: ['A IA respondeu em um formato inesperado. Você ainda pode editar o produto abaixo ou gerar uma nova proposta.'],
  };
  return {
    titles: strings(parsed.titles).length ? strings(parsed.titles) : [String(product.titulo || '')].filter(Boolean),
    description: typeof parsed.description === 'string' && parsed.description.trim() ? cleanGeneratedText(parsed.description) : String(product.descricao || ''),
    tags: strings(parsed.tags).length ? strings(parsed.tags) : strings(product.tags),
    descriptionOptions: strings(parsed.descriptionOptions).length ? strings(parsed.descriptionOptions) : [typeof parsed.description === 'string' ? parsed.description.trim() : String(product.descricao || '')].filter(Boolean),
    metaDescription: typeof parsed.metaDescription === 'string' ? cleanGeneratedText(parsed.metaDescription) : '',
    keywords: strings(parsed.keywords),
    analysis: strings(parsed.analysis),
  };
}

export async function POST(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const { storeId, productId, tool, campaignMode } = await request.json().catch(() => ({}));
  if (!storeId || !productId || !instructions[tool]) return NextResponse.json({ error: 'Ferramenta ou produto inválido.' }, { status: 400 });
  const [{ data: store }, { data: product }, { data: secret }] = await Promise.all([
    supabaseAdmin.from('stores').select('id').eq('id', storeId).eq('creator_id', user.id).maybeSingle(),
    supabaseAdmin.from('products').select('titulo, descricao, tipo, preco, slug, is_plr, seasonal_tags, tags, age_range, format_details').eq('id', productId).eq('store_id', storeId).maybeSingle(),
    supabaseAdmin.from('store_secrets').select('google_ai_key, openrouter_ai_key, ai_provider').eq('store_id', storeId).maybeSingle(),
  ]);
  if (!store || !product) return NextResponse.json({ error: 'Produto não encontrado nesta loja.' }, { status: 403 });
  if (!secret || !getAiKey(secret).key) return NextResponse.json({ error: 'Configure uma chave de IA para usar esta ferramenta.' }, { status: 401 });
  const formats: Record<string, string> = {
    seo: '{"titles":["5 títulos diferentes"],"description":"melhor modelo escolhido","descriptionOptions":["3 descrições de venda completas, diferentes e prontas para publicar, com emojis moderados, parágrafos e listas usando quebras de linha reais"],"tags":["5 a 10 tags de busca curtas e específicas; não inclua datas comemorativas ou temas do calendário"],"metaDescription":"até 155 caracteres","keywords":["palavra-chave"],"analysis":["melhoria clara e objetiva"]}',
    description: '{"titles":["5 títulos diferentes"],"description":"melhor modelo escolhido","descriptionOptions":["3 descrições de venda completas, diferentes e prontas para publicar, com emojis moderados, parágrafos e listas usando quebras de linha reais"],"tags":["5 a 10 tags de busca curtas e específicas; não inclua datas comemorativas ou temas do calendário"],"metaDescription":"até 155 caracteres","keywords":["palavra-chave"],"analysis":["melhoria clara e objetiva"]}',
    campaign: '{"whatsapp":"mensagem pronta para WhatsApp","instagram":"legenda pronta para Instagram com hashtags","stories":["3 chamadas curtas para Stories"]}',
    lesson: '{"objective":"objetivo de aprendizagem","preparation":["materiais e preparação"],"steps":["passo a passo"],"adaptations":["adaptações por nível"],"extension":"atividade complementar"}',
  };
  const isPlrCampaign = tool === 'campaign' && campaignMode === 'plr' && product.is_plr;
  const productUrl = `https://www.educalizando.com.br/produto/${product.slug || productId}${isPlrCampaign ? '?licenca=plr' : ''}`;
  const campaignContext = isPlrCampaign ? 'Esta é uma campanha para licença PLR. Fale com criadores que desejam adquirir uma licença para revender o material, explique o direito de revenda de forma responsável e não trate o comprador como usuário final.' : 'Esta é uma campanha para o produto final, destinada a educadores, famílias e clientes que usarão o material.';
  const prompt = `Você é especialista em marketing e educação. Responda em português do Brasil.\n\nMATERIAL:\nTítulo: ${product.titulo}\nDescrição atual: ${product.descricao || 'não informada'}\nTipo: ${product.tipo}\nFaixa etária: ${product.age_range || 'não informada'}\nDetalhes: ${product.format_details || 'não informados'}\nTemas pedagógicos e datas: ${(product.seasonal_tags || []).join(', ') || 'não informados'}\nTags de busca atuais: ${(product.tags || []).join(', ') || 'não informadas'}\nLink público oficial do produto: ${productUrl}\nContexto de divulgação: ${campaignContext}\n\nTAREFA:\n${instructions[tool]}\nPara divulgação, use exatamente o Link público oficial do produto na chamada final de WhatsApp, Instagram e no último Story. Nunca use link de loja privada ou texto de preenchimento.\n\nResponda somente com JSON válido, sem markdown e sem texto antes ou depois, neste formato exato: ${formats[tool]}.`;
  let text = '';
  try { text = await generateAiContent(secret, prompt, true); } catch (error: any) { return NextResponse.json({ error: error.message || 'A IA não concluiu a geração.' }, { status: 502 }); }
  const proposal = tool === 'seo' || tool === 'description' ? parseProposal(text || '', product) : null;
  const rawContent = tool === 'campaign' || tool === 'lesson' ? cleanGeneratedValue(extractJson(text || '')) as Record<string, unknown> | null : null;
  const content = tool === 'campaign' ? attachProductLink(rawContent, productUrl) : rawContent;
  return NextResponse.json({ result: text || 'A IA não retornou conteúdo. Tente novamente.', proposal, content });
}
