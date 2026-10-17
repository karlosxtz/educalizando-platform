import { editorialFromProduct } from '@/lib/ai-workspace';
import { normalizeSeoResponse } from '@/lib/ai-seo-response';
import { aiEditorialInstructions } from '@/lib/ai-editor-options';
import { extractAiJson as extractJson, AI_FORMAT_ERROR } from '@/lib/ai-json';
import { MARKETING_WRITING_RULES, marketingProductContext, assertMarketingQuantities } from '@/lib/ai-marketing-grounding';
import { generateAiContent,getAiKey } from '@/lib/ai-provider';
import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

const instructions: Record<string, string> = {
  seo: 'Crie uma proposta completa de SEO para este produto. Priorize termos que educadores realmente buscariam e mantenha todas as sugestões fiéis ao material informado.',
  description: 'Crie uma proposta completa de apresentação e venda para este produto. A descrição deve ter parágrafos e listas claras, benefícios pedagógicos, o que está incluso, para quem serve e uma chamada final. Não invente páginas, arquivos ou certificações.',
  campaign: 'Crie uma campanha separada por canal. A mensagem de WhatsApp precisa ser uma mensagem de venda completa, calorosa e pronta para enviar: abertura que chama atenção, problema que o material resolve, benefícios, o que está incluso, convite claro e espaço para o link. Use 5 a 7 blocos curtos com emojis moderados. A legenda do Instagram deve ter emojis moderados e hashtags. Crie 3 Stories em sequência: o primeiro apresenta uma dor ou pergunta, o segundo explica o benefício e o terceiro faz a chamada para ação; cada Story deve ter 2 a 3 linhas, não apenas uma frase.',
  lesson: 'Crie um roteiro pedagógico claro e prático com objetivo de aprendizagem, preparação, passo a passo em sala, adaptação por nível e atividade complementar.',
};

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
  return clean;
}

function seoDescription(value: string) {
  return cleanGeneratedText(value);
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

type Classification = { id: string; nome: string };

function savedClassification(options: Classification[], preferredId: unknown) {
  const saved = options.find(option => option.id === preferredId);
  return saved?.id || '';
}

function parseProposal(text: string, product: Record<string, unknown>, categories: Classification[], educationLevels: Classification[]) {
  const parsed = extractJson(text);
  const strings = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())).map(item => cleanGeneratedText(item)) : [];
  if (!parsed || typeof parsed.description !== 'string' || !parsed.description.trim() || !strings(parsed.titles).length) throw new Error(AI_FORMAT_ERROR);
  return {
    titles: strings(parsed.titles).length ? strings(parsed.titles).map(seoTitle) : [seoTitle(String(product.titulo || 'Material pedagógico'))],
    description: typeof parsed.description === 'string' && parsed.description.trim() ? seoDescription(parsed.description) : seoDescription(String(product.descricao || '')),
    tags: strings(parsed.tags).length ? strings(parsed.tags) : strings(product.tags),
    descriptionOptions: Array.from(new Set([seoDescription(parsed.description as string), ...strings(parsed.descriptionOptions).map(seoDescription)])).slice(0, 3),
    metaDescription: typeof parsed.metaDescription === 'string' ? cleanGeneratedText(parsed.metaDescription) : '',
    keywords: strings(parsed.keywords),
    analysis: strings(parsed.analysis),
    categoryId: savedClassification(categories, product.category_id) || savedClassification(categories, parsed.categoryId),
    educationLevelId: savedClassification(educationLevels, product.education_level_id) || savedClassification(educationLevels, parsed.educationLevelId),
    ageRange: String(product.age_range || ''),
    formatDetails: String(product.format_details || ''),
  };
}

export async function POST(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const { storeId, productId, tool, targetMode, style, brief } = await request.json().catch(() => ({}));
  if (!storeId || !productId || !instructions[tool]) return NextResponse.json({ error: 'Ferramenta ou produto inválido.' }, { status: 400 });
  const [{ data: store }, { data: product }, { data: secret }, { data: categories }, { data: educationLevels }] = await Promise.all([
    supabaseAdmin.from('stores').select('id').eq('id', storeId).eq('creator_id', user.id).maybeSingle(),
    supabaseAdmin.from('products').select('*').eq('id', productId).eq('store_id', storeId).maybeSingle(),
    supabaseAdmin.from('store_secrets').select('google_ai_key, openrouter_ai_key, ai_provider').eq('store_id', storeId).maybeSingle(),
    supabaseAdmin.from('categories').select('id, nome').or(`store_id.is.null,store_id.eq.${storeId}`).order('nome'),
    supabaseAdmin.from('education_levels').select('id, nome').order('ordem'),
  ]);
  if (!store || !product) return NextResponse.json({ error: 'Produto não encontrado nesta loja.' }, { status: 403 });
  if (!secret || !getAiKey(secret).key) return NextResponse.json({ error: 'Configure uma chave de IA para usar esta ferramenta.' }, { status: 401 });
  const formats: Record<string, string> = {
    seo: '{"titles":["3 títulos diferentes, cada um entre 30 e 65 caracteres"],"description":"melhor modelo escolhido com detalhes apenas quando disponíveis no cadastro","descriptionOptions":["segunda versão: foco em componentes e organização, detalhada com base nos fatos","terceira versão: tom acolhedor de educador, com apresentação diferente e os mesmos fatos"],"tags":["5 a 10 tags de busca curtas e específicas; não inclua datas comemorativas ou temas do calendário"],"categoryId":"ID da categoria pertinente ou vazio se não houver evidência","educationLevelId":"ID do nível pertinente ou vazio se não houver evidência","metaDescription":"até 155 caracteres","keywords":["palavra-chave"],"analysis":["melhoria clara e objetiva"]}',
    description: '{"titles":["3 títulos diferentes, cada um entre 30 e 65 caracteres"],"description":"melhor modelo escolhido com detalhes apenas quando disponíveis no cadastro","descriptionOptions":["segunda versão: foco em componentes e organização, detalhada com base nos fatos","terceira versão: tom acolhedor de educador, com apresentação diferente e os mesmos fatos"],"tags":["5 a 10 tags de busca curtas e específicas; não inclua datas comemorativas ou temas do calendário"],"metaDescription":"até 155 caracteres","keywords":["palavra-chave"],"analysis":["melhoria clara e objetiva"]}',
    campaign: '{"whatsapp":"mensagem pronta para WhatsApp","instagram":"legenda pronta para Instagram com hashtags","stories":["3 chamadas curtas para Stories"]}',
    lesson: '{"objective":"objetivo de aprendizagem","preparation":["materiais e preparação"],"steps":["passo a passo"],"adaptations":["adaptações por nível"],"extension":"atividade complementar"}',
  };
  const isPlrTarget = targetMode === 'plr' && product.is_plr;
  const productUrl = `https://www.educalizando.com.br/produto/${product.slug || productId}${isPlrTarget ? '?licenca=plr' : ''}`;
  const targetContext = isPlrTarget ? 'Você está trabalhando a licença PLR. Escreva para criadores que querem adquirir uma licença para revender o material, sem tratar o comprador como usuário final. Não sugira alteração do título ou tags, pois eles pertencem ao produto principal.' : 'Você está trabalhando o produto final para educadores, famílias e clientes que usarão o material. Você pode otimizar todos os metadados editoriais e pedagógicos. Nunca altere nem sugira alteração do preço, do link público, do arquivo/conteúdo entregue, da quantidade de páginas ou de fatos que não estejam informados.';
  const prompt = MARKETING_WRITING_RULES + '\n\n' + `Você é especialista em marketing e educação. Responda em português do Brasil.\nLink público oficial do produto: ${productUrl}\nFonte factual completa: ${JSON.stringify(marketingProductContext(product, categories || [], educationLevels || [], Boolean(isPlrTarget)))}\nContexto da oferta: ${targetContext}\nOrientação de escrita: ${aiEditorialInstructions(style, brief)}\n\nTAREFA:\n${instructions[tool]}\nFORMATAÇÃO DAS DESCRIÇÕES: entregue texto simples, sem HTML ou Markdown. Use parágrafos separados por duas quebras de linha. Separe em seções com títulos curtos: Apresentação; O que está incluído; Como usar; Informações do material. Inclua cada seção somente se houver fatos na fonte; sugestões de uso devem ser identificadas como sugestões opcionais. Liste componentes com •, um por linha. Preserve todos os componentes, exemplos e restrições documentados, sem frases genéricas ou repetição. A extensão deve acompanhar a riqueza do cadastro, até 2200 caracteres por descrição e 7500 caracteres no JSON completo. Preserve os detalhes concretos do cadastro. Evite repetir a mesma descrição em vários campos: description deve ser a primeira versão, focada em apresentação clara e termos de busca naturais; descriptionOptions contém exatamente DUAS versões adicionais, distintas na organização e no tom. Não repita a primeira. Cada uma deve ser completa, com até 350 palavras quando houver dados suficientes, preservando todos os fatos essenciais. As três versões descrevem o mesmo material, sem inventar benefícios para diferenciá-las. Categorias e níveis existentes serão preservados. Se estiverem ausentes, sugira um ID das listas permitidas somente se o assunto, faixa ou descrição sustentarem a escolha; caso contrário, deixe vazio e explique o que falta. Nunca classifique por suposição. Faixa e formato são fatos do cadastro e permanecem preservados. Categorias permitidas: ${JSON.stringify(categories || [])}. Níveis permitidos: ${JSON.stringify(educationLevels || [])}. Para divulgação, use exatamente o Link público oficial.\nResponda somente com JSON válido neste formato: ${formats[tool]}.`;
  let text = '';
  try {
    text = await generateAiContent(secret, prompt, true, { maxTokens: 8000, recoverTruncation: true, recoverFormat: true, validateJson: value => {
      if (tool === 'seo' || tool === 'description') { try { normalizeSeoResponse(value, String(product.titulo || '')); return true; } catch { return false; } }
      const list = (items: unknown) => Array.isArray(items) && items.length > 0 && items.every(item => typeof item === 'string' && item.trim());
      if (tool === 'campaign') return [value.whatsapp, value.instagram].every(item => typeof item === 'string' && item.trim()) && list(value.stories) && (value.stories as unknown[]).length === 3;
      return typeof value.objective === 'string' && Boolean(value.objective.trim()) && ['preparation', 'steps', 'adaptations'].every(field => list(value[field])) && typeof value.extension === 'string';
    } });
    if (tool === 'seo' || tool === 'description') {
      const generated = extractJson(text);
      if (!generated) throw new Error(AI_FORMAT_ERROR);
      text = JSON.stringify(normalizeSeoResponse(generated, String(product.titulo || '')));
    }
    if (tool !== 'lesson') assertMarketingQuantities(extractJson(text), product);
  const parsed = extractJson(text);
  if (!parsed) throw new Error(AI_FORMAT_ERROR);
  const textList = (value: unknown) => Array.isArray(value) && value.length > 0 && value.every(item => typeof item === 'string' && item.trim());
  if (tool === 'campaign' && (![parsed.whatsapp, parsed.instagram].every(value => typeof value === 'string' && value.trim()) || !textList(parsed.stories) || (parsed.stories as string[]).length !== 3)) throw new Error(AI_FORMAT_ERROR);
  if (tool === 'lesson' && (typeof parsed.objective !== 'string' || !parsed.objective.trim() || !['preparation', 'steps', 'adaptations'].every(field => textList(parsed[field])) || typeof parsed.extension !== 'string')) throw new Error(AI_FORMAT_ERROR);
  const proposal = tool === 'seo' || tool === 'description'
    ? parseProposal(text || '', product, (categories || []) as Classification[], (educationLevels || []) as Classification[])
    : null;
  const rawContent = tool === 'campaign' || tool === 'lesson' ? cleanGeneratedValue(extractJson(text || '')) as Record<string, unknown> | null : null;
  const content = tool === 'campaign' ? attachProductLink(rawContent, productUrl) : rawContent;
  return NextResponse.json({ result: text, proposal, content, productId: product.id, sourceUpdatedAt: product.updated_at ?? null, sourceEditorial: editorialFromProduct(product, isPlrTarget ? 'plr' : 'product') });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'A IA não concluiu a geração.' }, { status: 502 });
  }
}
