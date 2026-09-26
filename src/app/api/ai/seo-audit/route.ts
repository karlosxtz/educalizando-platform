import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/api-auth';
import { generateAiContent, getAiKey } from '@/lib/ai-provider';
import { supabaseAdmin } from '@/lib/supabase';

type AuditProduct = {
  id: string;
  titulo: string | null;
  descricao: string | null;
  capa_url: string | null;
  category_id: string | null;
  education_level_id: string | null;
  tags: string[] | null;
  slug: string | null;
};

type BaseReview = {
  product: AuditProduct;
  score: number;
  issues: string[];
};

function baseReview(product: AuditProduct): BaseReview {
  const titleLength = product.titulo?.trim().length || 0;
  const descriptionLength = product.descricao?.trim().length || 0;
  const checks = [
    { ok: titleLength >= 30 && titleLength <= 65, issue: 'Ajustar o título para ficar claro e ter entre 30 e 65 caracteres.' },
    { ok: descriptionLength >= 120, issue: 'Completar a descrição com benefícios, conteúdo incluso e público indicado.' },
    { ok: Boolean(product.capa_url), issue: 'Adicionar uma capa para melhorar a apresentação do material.' },
    { ok: Boolean(product.category_id), issue: 'Definir a categoria para facilitar que o material seja encontrado.' },
    { ok: Boolean(product.education_level_id), issue: 'Definir o nível de ensino do material.' },
    { ok: Boolean(product.tags?.filter(Boolean).length), issue: 'Adicionar tags de busca específicas para o conteúdo.' },
    { ok: Boolean(product.slug), issue: 'Gerar o endereço público amigável do produto.' },
  ];
  const issues = checks.filter(check => !check.ok).map(check => check.issue);
  return { product, score: Math.round((checks.filter(check => check.ok).length / checks.length) * 100), issues };
}

function extractJson(text: string): Record<string, unknown> | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  const candidates = [fenced, start >= 0 && end > start ? text.slice(start, end + 1) : null, text].filter(Boolean) as string[];
  for (const candidate of candidates) {
    try { return JSON.parse(candidate.trim()); } catch { /* tenta o próximo formato */ }
  }
  return null;
}

function textList(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())).map(item => item.trim().replace(/\*\*/g, ''))
    : [];
}

export async function POST(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  const { storeId } = await request.json().catch(() => ({}));
  if (!storeId) return NextResponse.json({ error: 'Loja inválida.' }, { status: 400 });

  const [{ data: store }, { data: secret }, { data: products, error: productsError }] = await Promise.all([
    supabaseAdmin.from('stores').select('id').eq('id', storeId).eq('creator_id', user.id).maybeSingle(),
    supabaseAdmin.from('store_secrets').select('google_ai_key, openrouter_ai_key, ai_provider').eq('store_id', storeId).maybeSingle(),
    supabaseAdmin.from('products').select('id, titulo, descricao, capa_url, category_id, education_level_id, tags, slug').eq('store_id', storeId).order('id').limit(30),
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

  const compactProducts = candidates.slice(0, 20).map(({ product, issues }) => ({
    id: product.id,
    titulo: product.titulo || 'Sem título',
    descricao: (product.descricao || '').slice(0, 350),
    tags: product.tags || [],
    problemas_identificados: issues,
  }));
  const prompt = `Você é uma consultora de SEO para materiais didáticos. Analise os produtos abaixo e responda em português do Brasil. Para cada item, dê recomendações úteis, fiéis ao conteúdo existente e sem inventar recursos. Não use markdown.\n\nProdutos: ${JSON.stringify(compactProducts)}\n\nResponda SOMENTE JSON válido neste formato: {"summary":"resumo curto da oportunidade da loja","products":[{"id":"id do produto","issues":["até 3 problemas concretos"],"quickWins":["até 3 ações práticas"],"recommendedTitle":"título sugerido ou string vazia se não precisar trocar","metaDescription":"meta descrição sugerida com até 155 caracteres","keywords":["5 a 8 palavras-chave"]}]}.`;

  let generated = '';
  try {
    generated = await generateAiContent(secret, prompt, true);
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'A IA não concluiu a auditoria.' }, { status: 502 });
  }

  const parsed = extractJson(generated);
  const suggestions = new Map<string, Record<string, unknown>>();
  if (Array.isArray(parsed?.products)) {
    for (const item of parsed.products) {
      if (item && typeof item === 'object' && typeof (item as Record<string, unknown>).id === 'string') {
        suggestions.set((item as Record<string, unknown>).id as string, item as Record<string, unknown>);
      }
    }
  }

  const items = reviews.map(({ product, score, issues }) => {
    const suggestion = suggestions.get(product.id);
    return {
      id: product.id,
      title: product.titulo || 'Material sem título',
      score,
      issues: textList(suggestion?.issues).length ? textList(suggestion?.issues) : issues,
      quickWins: textList(suggestion?.quickWins),
      recommendedTitle: typeof suggestion?.recommendedTitle === 'string' ? suggestion.recommendedTitle.replace(/\*\*/g, '').trim() : '',
      metaDescription: typeof suggestion?.metaDescription === 'string' ? suggestion.metaDescription.replace(/\*\*/g, '').trim() : '',
      keywords: textList(suggestion?.keywords),
    };
  });

  return NextResponse.json({
    summary: typeof parsed?.summary === 'string' ? parsed.summary.replace(/\*\*/g, '').trim() : 'A IA encontrou oportunidades para melhorar como seus materiais aparecem nas buscas.',
    average: reviews.length ? Math.round(reviews.reduce((sum, review) => sum + review.score, 0) / reviews.length) : 0,
    items,
  });
}
