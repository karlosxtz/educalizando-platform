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

function seoTitle(value: string) {
  const clean = cleanGeneratedText(value).replace(/\s+/g, ' ').trim();
  if (clean.length > 65) return clean.slice(0, 65).replace(/\s+\S*$/, '').trim();
  if (clean.length < 30) return `${clean} – Material Pedagógico`.slice(0, 65);
  return clean;
}

function seoDescription(value: string) {
  const clean = cleanGeneratedText(value);
  if (clean.length >= 120) return clean;
  return `${clean}${clean ? '\n\n' : ''}Material pedagógico pronto para apoiar educadores e famílias, com uma proposta prática, organizada e envolvente para a aprendizagem.`;
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

function parseProposal(text: string, product: Record<string, unknown>, categoryIds: Set<string>, educationLevelIds: Set<string>) {
  const parsed = extractJson(text);
  const strings = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())).map(item => cleanGeneratedText(item)) : [];
  if (!parsed) return {
    titles: [seoTitle(String(product.titulo || 'Material pedagógico'))],
    description: seoDescription(String(product.descricao || '')),
    tags: strings(product.tags),
    descriptionOptions: [seoDescription(String(product.descricao || ''))],
    analysis: ['A IA respondeu em um formato inesperado. Você ainda pode editar o produto abaixo ou gerar uma nova proposta.'],
    categoryId: typeof product.category_id === 'string' ? product.category_id : '',
    educationLevelId: typeof product.education_level_id === 'string' ? product.education_level_id : '',
  };
  return {
    titles: strings(parsed.titles).length ? strings(parsed.titles).map(seoTitle) : [seoTitle(String(product.titulo || 'Material pedagógico'))],
    description: typeof parsed.description === 'string' && parsed.description.trim() ? seoDescription(parsed.description) : seoDescription(String(product.descricao || '')),
    tags: strings(parsed.tags).length ? strings(parsed.tags) : strings(product.tags),
    descriptionOptions: strings(parsed.descriptionOptions).length ? strings(parsed.descriptionOptions).map(seoDescription) : [seoDescription(typeof parsed.description === 'string' ? parsed.description.trim() : String(product.descricao || ''))],
    metaDescription: typeof parsed.metaDescription === 'string' ? cleanGeneratedText(parsed.metaDescription) : '',
    keywords: strings(parsed.keywords),
    analysis: strings(parsed.analysis),
    categoryId: typeof parsed.categoryId === 'string' && categoryIds.has(parsed.categoryId)
      ? parsed.categoryId
      : typeof product.category_id === 'string' ? product.category_id : '',
    educationLevelId: typeof parsed.educationLevelId === 'string' && educationLevelIds.has(parsed.educationLevelId)
      ? parsed.educationLevelId
      : typeof product.education_level_id === 'string' ? product.education_level_id : '',
  };
}

export async function POST(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const { storeId, productId, tool, targetMode } = await request.json().catch(() => ({}));
  if (!storeId || !productId || !instructions[tool]) return NextResponse.json({ error: 'Ferramenta ou produto inválido.' }, { status: 400 });
  const [{ data: store }, { data: product }, { data: secret }, { data: categories }, { data: educationLevels }] = await Promise.all([
    supabaseAdmin.from('stores').select('id').eq('id', storeId).eq('creator_id', user.id).maybeSingle(),
    supabaseAdmin.from('products').select('titulo, descricao, plr_descricao, tipo, preco, slug, is_plr, seasonal_tags, tags, age_range, format_details, category_id, education_level_id').eq('id', productId).eq('store_id', storeId).maybeSingle(),
    supabaseAdmin.from('store_secrets').select('google_ai_key, openrouter_ai_key, ai_provider').eq('store_id', storeId).maybeSingle(),
    supabaseAdmin.from('categories').select('id, nome').or(`store_id.is.null,store_id.eq.${storeId}`).order('nome'),
    supabaseAdmin.from('education_levels').select('id, nome').order('ordem'),
  ]);
  if (!store || !product) return NextResponse.json({ error: 'Produto não encontrado nesta loja.' }, { status: 403 });
  if (!secret || !getAiKey(secret).key) return NextResponse.json({ error: 'Configure uma chave de IA para usar esta ferramenta.' }, { status: 401 });
  const formats: Record<string, string> = {
    seo: '{"titles":["5 títulos diferentes, cada um entre 30 e 65 caracteres"],"description":"melhor modelo escolhido com pelo menos 120 caracteres","descriptionOptions":["3 descrições de venda completas, diferentes e prontas para publicar, com emojis moderados, parágrafos e listas usando quebras de linha reais"],"tags":["5 a 10 tags de busca curtas e específicas; não inclua datas comemorativas ou temas do calendário"],"categoryId":"um ID exato da lista de categorias","educationLevelId":"um ID exato da lista de níveis de ensino","metaDescription":"até 155 caracteres","keywords":["palavra-chave"],"analysis":["melhoria clara e objetiva"]}',
    description: '{"titles":["5 títulos diferentes, cada um entre 30 e 65 caracteres"],"description":"melhor modelo escolhido com pelo menos 120 caracteres","descriptionOptions":["3 descrições de venda completas, diferentes e prontas para publicar, com emojis moderados, parágrafos e listas usando quebras de linha reais"],"tags":["5 a 10 tags de busca curtas e específicas; não inclua datas comemorativas ou temas do calendário"],"categoryId":"um ID exato da lista de categorias","educationLevelId":"um ID exato da lista de níveis de ensino","metaDescription":"até 155 caracteres","keywords":["palavra-chave"],"analysis":["melhoria clara e objetiva"]}',
    campaign: '{"whatsapp":"mensagem pronta para WhatsApp","instagram":"legenda pronta para Instagram com hashtags","stories":["3 chamadas curtas para Stories"]}',
    lesson: '{"objective":"objetivo de aprendizagem","preparation":["materiais e preparação"],"steps":["passo a passo"],"adaptations":["adaptações por nível"],"extension":"atividade complementar"}',
  };
  const isPlrTarget = targetMode === 'plr' && product.is_plr;
  const productUrl = `https://www.educalizando.com.br/produto/${product.slug || productId}${isPlrTarget ? '?licenca=plr' : ''}`;
  const targetContext = isPlrTarget ? 'Você está trabalhando a licença PLR. Escreva para criadores que querem adquirir uma licença para revender o material, sem tratar o comprador como usuário final. Não sugira alteração do título ou tags, pois eles pertencem ao produto principal.' : 'Você está trabalhando o produto final para educadores, famílias e clientes que usarão o material.';
  const activeDescription = isPlrTarget ? product.plr_descricao || product.descricao : product.descricao;
  const classificationContext = isPlrTarget ? '' : `\nCategorias permitidas (use somente um ID exato): ${JSON.stringify(categories || [])}\nNíveis de ensino permitidos (use somente um ID exato): ${JSON.stringify(educationLevels || [])}`;
  const prompt = `Você é especialista em marketing e educação. Responda em português do Brasil.\n\nMATERIAL:\nTítulo: ${product.titulo}\nDescrição atual: ${activeDescription || 'não informada'}\nTipo: ${product.tipo}\nFaixa etária: ${product.age_range || 'não informada'}\nDetalhes: ${product.format_details || 'não informados'}\nTemas pedagógicos e datas: ${(product.seasonal_tags || []).join(', ') || 'não informados'}\nTags de busca atuais: ${(product.tags || []).join(', ') || 'não informadas'}\nLink público oficial do produto: ${productUrl}\nContexto da oferta: ${targetContext}${classificationContext}\n\nTAREFA:\n${instructions[tool]}\nPara divulgação, use exatamente o Link público oficial do produto na chamada final de WhatsApp, Instagram e no último Story. Nunca use link de loja privada ou texto de preenchimento.\n\nResponda somente com JSON válido, sem markdown e sem texto antes ou depois, neste formato exato: ${formats[tool]}.`;
  let text = '';
  try { text = await generateAiContent(secret, prompt, true); } catch (error: any) { return NextResponse.json({ error: error.message || 'A IA não concluiu a geração.' }, { status: 502 }); }
  const proposal = tool === 'seo' || tool === 'description'
    ? parseProposal(text || '', product, new Set((categories || []).map(item => item.id)), new Set((educationLevels || []).map(item => item.id)))
    : null;
  const rawContent = tool === 'campaign' || tool === 'lesson' ? cleanGeneratedValue(extractJson(text || '')) as Record<string, unknown> | null : null;
  const content = tool === 'campaign' ? attachProductLink(rawContent, productUrl) : rawContent;
  return NextResponse.json({ result: text || 'A IA não retornou conteúdo. Tente novamente.', proposal, content });
}
