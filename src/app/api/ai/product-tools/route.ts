import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';

const instructions: Record<string, string> = {
  seo: 'Crie uma proposta completa de SEO para este produto. Priorize termos que educadores realmente buscariam e mantenha todas as sugestões fiéis ao material informado.',
  description: 'Crie uma proposta completa de apresentação e venda para este produto. A descrição deve ter parágrafos e listas claras, benefícios pedagógicos, o que está incluso, para quem serve e uma chamada final. Não invente páginas, arquivos ou certificações.',
  campaign: 'Crie uma campanha separada por canal. A mensagem de WhatsApp deve ser direta e pronta para enviar; a legenda do Instagram deve ter emojis moderados e hashtags; Stories devem ser chamadas curtas.',
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

function parseProposal(text: string, product: Record<string, unknown>) {
  const parsed = extractJson(text);
  const strings = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())).map(item => item.trim()) : [];
  if (!parsed) return {
    titles: [String(product.titulo || '')].filter(Boolean),
    description: String(product.descricao || ''),
    tags: strings(product.tags),
    descriptionOptions: [String(product.descricao || '')].filter(Boolean),
    analysis: ['A IA respondeu em um formato inesperado. Você ainda pode editar o produto abaixo ou gerar uma nova proposta.'],
  };
  return {
    titles: strings(parsed.titles).length ? strings(parsed.titles) : [String(product.titulo || '')].filter(Boolean),
    description: typeof parsed.description === 'string' && parsed.description.trim() ? parsed.description.trim() : String(product.descricao || ''),
    tags: strings(parsed.tags).length ? strings(parsed.tags) : strings(product.tags),
    descriptionOptions: strings(parsed.descriptionOptions).length ? strings(parsed.descriptionOptions) : [typeof parsed.description === 'string' ? parsed.description.trim() : String(product.descricao || '')].filter(Boolean),
    metaDescription: typeof parsed.metaDescription === 'string' ? parsed.metaDescription.trim() : '',
    keywords: strings(parsed.keywords),
    analysis: strings(parsed.analysis),
  };
}

export async function POST(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const { storeId, productId, tool } = await request.json().catch(() => ({}));
  if (!storeId || !productId || !instructions[tool]) return NextResponse.json({ error: 'Ferramenta ou produto inválido.' }, { status: 400 });
  const [{ data: store }, { data: product }, { data: secret }] = await Promise.all([
    supabaseAdmin.from('stores').select('id').eq('id', storeId).eq('creator_id', user.id).maybeSingle(),
    supabaseAdmin.from('products').select('titulo, descricao, tipo, preco, seasonal_tags, tags, age_range, format_details').eq('id', productId).eq('store_id', storeId).maybeSingle(),
    supabaseAdmin.from('store_secrets').select('google_ai_key').eq('store_id', storeId).maybeSingle(),
  ]);
  if (!store || !product) return NextResponse.json({ error: 'Produto não encontrado nesta loja.' }, { status: 403 });
  if (!secret?.google_ai_key) return NextResponse.json({ error: 'Configure sua chave Gemini para usar esta ferramenta.' }, { status: 401 });
  const formats: Record<string, string> = {
    seo: '{"titles":["5 títulos diferentes"],"description":"melhor modelo escolhido","descriptionOptions":["3 descrições de venda completas, diferentes e prontas para publicar, com emojis moderados, parágrafos e listas usando quebras de linha reais"],"tags":["5 a 10 tags de busca curtas e específicas; não inclua datas comemorativas ou temas do calendário"],"metaDescription":"até 155 caracteres","keywords":["palavra-chave"],"analysis":["melhoria clara e objetiva"]}',
    description: '{"titles":["5 títulos diferentes"],"description":"melhor modelo escolhido","descriptionOptions":["3 descrições de venda completas, diferentes e prontas para publicar, com emojis moderados, parágrafos e listas usando quebras de linha reais"],"tags":["5 a 10 tags de busca curtas e específicas; não inclua datas comemorativas ou temas do calendário"],"metaDescription":"até 155 caracteres","keywords":["palavra-chave"],"analysis":["melhoria clara e objetiva"]}',
    campaign: '{"whatsapp":"mensagem pronta para WhatsApp","instagram":"legenda pronta para Instagram com hashtags","stories":["3 chamadas curtas para Stories"]}',
    lesson: '{"objective":"objetivo de aprendizagem","preparation":["materiais e preparação"],"steps":["passo a passo"],"adaptations":["adaptações por nível"],"extension":"atividade complementar"}',
  };
  const prompt = `Você é especialista em marketing e educação. Responda em português do Brasil.\n\nMATERIAL:\nTítulo: ${product.titulo}\nDescrição atual: ${product.descricao || 'não informada'}\nTipo: ${product.tipo}\nFaixa etária: ${product.age_range || 'não informada'}\nDetalhes: ${product.format_details || 'não informados'}\nTemas pedagógicos e datas: ${(product.seasonal_tags || []).join(', ') || 'não informados'}\nTags de busca atuais: ${(product.tags || []).join(', ') || 'não informadas'}\n\nTAREFA:\n${instructions[tool]}\n\nResponda somente com JSON válido, sem markdown e sem texto antes ou depois, neste formato exato: ${formats[tool]}.`;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${secret.google_ai_key.trim().replace(/['"]/g, '')}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 4096 } }) });
  const payload = await response.json().catch(() => null);
  if (!response.ok) return NextResponse.json({ error: payload?.error?.message || 'A Gemini não concluiu a geração.' }, { status: response.status });
  const text = payload?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || '').join('\n').trim();
  const proposal = tool === 'seo' || tool === 'description' ? parseProposal(text || '', product) : null;
  const content = tool === 'campaign' || tool === 'lesson' ? extractJson(text || '') : null;
  return NextResponse.json({ result: text || 'A IA não retornou conteúdo. Tente novamente.', proposal, content });
}
