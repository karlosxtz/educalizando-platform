import { extractAiJson as extractJson, AI_FORMAT_ERROR } from '@/lib/ai-json';
import { MARKETING_WRITING_RULES, marketingProductContext, assertMarketingQuantities } from '@/lib/ai-marketing-grounding';
import { generateAiContent,getAiKey } from '@/lib/ai-provider';
import { getRequestUser } from '@/lib/api-auth';
import { calculateProductSeoScore } from '@/lib/product-seo-score';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

type AuditProduct = {
  id: string;
  titulo: string | null;
  descricao: string | null;
  capa_url: string | null;
  category_id: string | null;
  education_level_id: string | null;
  category_ids?: string[] | null;
  education_level_ids?: string[] | null;
  updated_at?: string | null;
  tags: string[] | null;
  slug: string | null;
  is_plr: boolean | null;
  seasonal_tags: string[] | null;
  age_range?: string | null;
  format_details?: string | null;
};

type BaseReview = {
  product: AuditProduct;
  score: number;
  issues: string[];
};

function baseReview(product: AuditProduct): BaseReview {
  return { product, ...calculateProductSeoScore(product) };
}

function textList(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())).map(item => item.trim().replace(/\*\*/g, ''))
    : [];
}

function fallbackTags(product: AuditProduct) {
  const stopWords = new Set(['para', 'com', 'das', 'dos', 'uma', 'um', 'atividade', 'material', 'jogo', 'tema']);
  const terms = `${product.titulo || ''} ${product.descricao || ''}`
    .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9]+/).filter(term => term.length > 3 && !stopWords.has(term));
  return Array.from(new Set([...terms.slice(0, 6), 'material pedagógico', 'atividade educativa'])).slice(0, 10);
}

function fallbackThemes(product: AuditProduct) { return product.seasonal_tags || []; }

function fallbackTitle(product: AuditProduct) {
  const clean = (product.titulo || 'Material didático').replace(/[\p{Extended_Pictographic}]/gu, '').replace(/\s+/g, ' ').trim();
  if (clean.length < 30) return `${clean} – Material Pedagógico`.slice(0, 65);
  if (clean.length > 65) return clean.slice(0, 62).replace(/\s+\S*$/, '').trim();
  return clean;
}

function normalizeSuggestedTitle(value: unknown, product: AuditProduct) {
  if (typeof value !== 'string' || !value.trim()) return fallbackTitle(product);
  const clean = value.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
  if (clean.length > 65) return clean.slice(0, 65).replace(/\s+\S*$/, '').trim();
  if (clean.length < 30) return `${clean} – Material Pedagógico`.slice(0, 65);
  return clean;
}

function fallbackDescription(product: AuditProduct) { return (product.descricao || '').trim(); }

export async function POST(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  const { storeId } = await request.json().catch(() => ({}));
  if (!storeId) return NextResponse.json({ error: 'Loja inválida.' }, { status: 400 });

  const [{ data: store }, { data: secret }, { data: products, error: productsError }, { data: categories }, { data: educationLevels }] = await Promise.all([
    supabaseAdmin.from('stores').select('id').eq('id', storeId).eq('creator_id', user.id).maybeSingle(),
    supabaseAdmin.from('store_secrets').select('google_ai_key, openrouter_ai_key, ai_provider').eq('store_id', storeId).maybeSingle(),
    supabaseAdmin.from('products').select('*').eq('store_id', storeId).neq('status', 'excluido').is('excluido_em', null).order('id').limit(30),
    supabaseAdmin.from('categories').select('id, nome').or(`store_id.is.null,store_id.eq.${storeId}`).order('nome'),
    supabaseAdmin.from('education_levels').select('id, nome').order('ordem'),
  ]);

  if (!store) return NextResponse.json({ error: 'Loja não encontrada ou sem permissão.' }, { status: 403 });
  if (productsError) return NextResponse.json({ error: 'Não foi possível carregar os produtos para análise.' }, { status: 500 });
  if (!secret || !getAiKey(secret).key) return NextResponse.json({ error: 'Conecte uma IA antes de iniciar a auditoria.' }, { status: 401 });

  const reviews = ((products || []) as AuditProduct[]).map(baseReview);
  const candidates = reviews.filter(review => review.score < 100);
  if (!candidates.length) {
    return NextResponse.json({
      summary: 'Todos os materiais já têm os campos essenciais de SEO preenchidos. Use a otimização individual para aperfeiçoar textos e palavras-chave.',
      average: 100,
      items: [],
    });
  }

  const compactProducts = [...candidates].sort((a, b) => a.score - b.score).slice(0, 3).map(({ product, issues }) => ({
    id: product.id,
    titulo: product.titulo || 'Sem título',
    ...marketingProductContext(product, categories || [], educationLevels || []),
    tags: product.tags || [],
    temas: product.seasonal_tags || [],
    faixa_indicada: product.age_range || '',
    formato: product.format_details || '',
    problemas_identificados: issues,
  }));
  const prompt = MARKETING_WRITING_RULES + '\n\n' + `Você é uma consultora de SEO para materiais didáticos. Analise os produtos abaixo e responda em português do Brasil. Para cada item, dê recomendações úteis, fiéis ao conteúdo existente e sem inventar recursos. Não use markdown. Todo título sugerido deve ter entre 30 e 65 caracteres e a descrição deve ter somente a extensão sustentada pelos dados cadastrados. Se o material não tiver tags, crie de 5 a 10 tags específicas que ajudem nas buscas. Preserve os temas existentes; não preencha campos ausentes por suposição. Preserve categorias e níveis já cadastrados. Se categoria ou nível estiver ausente, escolha um ID das listas permitidas somente quando a descrição, assunto ou faixa escolar sustentar essa escolha; explique a evidência em quickWins. Não invente classificação. Preserve faixa e formato factuais. Você pode otimizar metadados editoriais e pedagógicos, mas nunca preço, link público, arquivo/conteúdo entregue ou quantidade de páginas.\n\nCategorias permitidas: ${JSON.stringify(categories || [])}\nNíveis de ensino permitidos: ${JSON.stringify(educationLevels || [])}\nProdutos: ${JSON.stringify(compactProducts)}\n\nResponda SOMENTE JSON válido neste formato: {"summary":"resumo curto da oportunidade da loja","products":[{"id":"id do produto","issues":["até 3 problemas concretos"],"quickWins":["até 3 ações práticas"],"recommendedTitle":"título sugerido entre 30 e 65 caracteres","description":"descrição de venda pronta, com parágrafos naturais e somente detalhes sustentados pelo cadastro","tags":["5 a 10 tags de busca; nunca datas comemorativas"],"themes":["somente temas pedagógicos e datas, se já forem pertinentes"],"categoryId":"ID exato da categoria","educationLevelId":"ID exato do nível de ensino","ageRange":"anos ou faixa escolar indicada","formatDetails":"formato e modo de uso sem inventar dados","suggestedCaption":"legenda curta e pronta para divulgar o material","metaDescription":"meta descrição sugerida com até 155 caracteres","keywords":["5 a 8 palavras-chave"]}]}.`;

  let generated = '';
  let usedSavedSuggestions = false;
  try {
    generated = await generateAiContent(secret, prompt, true, { maxTokens: 8000, recoverTruncation: true, recoverFormat: true, validateJson: value => Array.isArray(value.products) && value.products.length > 0 && value.products.every(item => item && typeof item.id === 'string' && typeof item.description === 'string' && Boolean(item.description.trim()) && typeof item.recommendedTitle === 'string' && Boolean(item.recommendedTitle.trim())) });
    if (!Array.isArray(extractJson(generated)?.products)) throw new Error(AI_FORMAT_ERROR);
  } catch (error: unknown) {
    // A auditoria não pode desaparecer só porque uma geração pontual falhou.
    // As sugestões determinísticas abaixo continuam completas e podem ser
    // revisadas/aplicadas; a próxima auditoria pode enriquecer o texto com IA.
    console.error('[SEO audit generation]', error);
    usedSavedSuggestions = true;
  }

  const parsed = extractJson(generated);
  const suggestions = new Map<string, Record<string, unknown>>();
  if (Array.isArray(parsed?.products)) {
    for (const item of parsed.products) {
      if (item && typeof item === 'object' && typeof (item as Record<string, unknown>).id === 'string') {
        const row = item as Record<string, unknown>;
        if (typeof row.description === 'string' && row.description.trim() && typeof row.recommendedTitle === 'string' && row.recommendedTitle.trim() && compactProducts.some(product => product.id === row.id)) suggestions.set(row.id as string, row);
      }
    }
  }

  const items = reviews.map(({ product, score, issues }) => {
    let suggestion = suggestions.get(product.id);
    try { assertMarketingQuantities({ title: suggestion?.recommendedTitle, description: suggestion?.description, caption: suggestion?.suggestedCaption }, product); }
    catch { suggestion = undefined; }
    const categoryId = product.category_id || product.category_ids?.[0] || (categories || []).find(option => option.id === suggestion?.categoryId)?.id || '';
    const educationLevelId = product.education_level_id || product.education_level_ids?.[0] || (educationLevels || []).find(option => option.id === suggestion?.educationLevelId)?.id || '';
    const description = typeof suggestion?.description === 'string' && suggestion.description.trim() ? suggestion.description.replace(/\*\*/g, '').trim() : fallbackDescription(product);
    const recommendedTitle = normalizeSuggestedTitle(suggestion?.recommendedTitle, product);
    const tags = textList(suggestion?.tags).length ? textList(suggestion?.tags) : product.tags?.length ? product.tags : fallbackTags(product);
    const projected = calculateProductSeoScore({ ...product, titulo: recommendedTitle, descricao: description, tags, category_id: categoryId, education_level_id: educationLevelId });
    return {
      id: product.id,
      expectedUpdatedAt: product.updated_at ?? null,
      projectedScore: projected.score,
      remainingIssues: projected.issues,
      categoryName: (categories || []).find(option => option.id === categoryId)?.nome || 'Não definido',
      educationLevelName: (educationLevels || []).find(option => option.id === educationLevelId)?.nome || 'Não definido',
      generatedByAi: Boolean(suggestion),
      title: product.titulo || 'Material sem título',
      score,
      issues: textList(suggestion?.issues).length ? textList(suggestion?.issues) : issues,
      quickWins: textList(suggestion?.quickWins).length ? textList(suggestion?.quickWins) : ['Revisar o título com a palavra-chave principal.', 'Completar a descrição para deixar os benefícios claros.', 'Aplicar tags específicas para ajudar nas buscas.'],
      recommendedTitle,
      suggestedCaption: typeof suggestion?.suggestedCaption === 'string' ? suggestion.suggestedCaption.replace(/\*\*/g, '').trim() : '',
      description,
      tags,
      themes: fallbackThemes(product),
      categoryId,
      educationLevelId,
      ageRange: product.age_range || '',
      formatDetails: product.format_details || '',
      metaDescription: typeof suggestion?.metaDescription === 'string' ? suggestion.metaDescription.replace(/\*\*/g, '').trim() : '',
      keywords: textList(suggestion?.keywords),
      coverUrl: product.capa_url,
      isPlr: Boolean(product.is_plr),
    };
  });

  return NextResponse.json({
    summary: typeof parsed?.summary === 'string'
      ? parsed.summary.replace(/\*\*/g, '').trim()
      : usedSavedSuggestions
        ? 'A geração de IA não foi concluída. Esta é uma análise local dos campos; os textos originais foram mantidos.'
        : 'A IA encontrou oportunidades para melhorar como seus materiais aparecem nas buscas.',
    usedFallback: usedSavedSuggestions,
    generatedCount: suggestions.size,
    generationNotice: candidates.length > 3 ? 'Textos de IA para até 3 materiais prioritários por auditoria. Use a otimização individual nos demais.' : null,
    average: reviews.length ? Math.round(reviews.reduce((sum, review) => sum + review.score, 0) / reviews.length) : 0,
    items,
  });
}
