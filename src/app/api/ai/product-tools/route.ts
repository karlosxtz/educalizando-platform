import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';

const instructions: Record<string, string> = {
  seo: 'RESPONDA APENAS JSON válido no formato {"titles":["..."],"metaDescription":"...","keywords":["..."],"analysis":["..."]}. Crie 5 títulos SEO, uma meta descrição de até 155 caracteres, palavras-chave e uma análise objetiva do que melhorar. Use títulos claros, sem promessas enganosas.',
  description: 'RESPONDA APENAS JSON válido no formato {"description":"...","analysis":["..."]}. Crie uma descrição de venda completa: abertura, benefícios pedagógicos, o que está incluso, para quem é e chamada final. Use informações reais do material, sem inventar páginas, arquivos ou certificações.',
  campaign: 'Crie uma campanha com uma mensagem para WhatsApp, legenda para Instagram, 5 hashtags e 3 chamadas curtas para Stories.',
  lesson: 'Crie um roteiro pedagógico com objetivo de aprendizagem, sugestões de uso em sala, adaptação por nível e uma atividade complementar.',
};

export async function POST(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const { storeId, productId, tool } = await request.json().catch(() => ({}));
  if (!storeId || !productId || !instructions[tool]) return NextResponse.json({ error: 'Ferramenta ou produto inválido.' }, { status: 400 });
  const [{ data: store }, { data: product }, { data: secret }] = await Promise.all([
    supabaseAdmin.from('stores').select('id').eq('id', storeId).eq('creator_id', user.id).maybeSingle(),
    supabaseAdmin.from('products').select('titulo, descricao, tipo, preco, seasonal_tags, age_range, format_details').eq('id', productId).eq('store_id', storeId).maybeSingle(),
    supabaseAdmin.from('store_secrets').select('google_ai_key').eq('store_id', storeId).maybeSingle(),
  ]);
  if (!store || !product) return NextResponse.json({ error: 'Produto não encontrado nesta loja.' }, { status: 403 });
  if (!secret?.google_ai_key) return NextResponse.json({ error: 'Configure sua chave Gemini para usar esta ferramenta.' }, { status: 401 });
  const prompt = `Você é especialista em marketing e educação. Responda em português do Brasil, com estrutura fácil de copiar e sem markdown excessivo.\n\nMATERIAL:\nTítulo: ${product.titulo}\nDescrição: ${product.descricao || 'não informada'}\nTipo: ${product.tipo}\nFaixa etária: ${product.age_range || 'não informada'}\nDetalhes: ${product.format_details || 'não informados'}\nTemas: ${(product.seasonal_tags || []).join(', ') || 'não informados'}\n\nTAREFA:\n${instructions[tool]}`;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${secret.google_ai_key.trim().replace(/['"]/g, '')}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
  const payload = await response.json().catch(() => null);
  if (!response.ok) return NextResponse.json({ error: payload?.error?.message || 'A Gemini não concluiu a geração.' }, { status: response.status });
  const text = payload?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || '').join('\n').trim();
  let proposal = null;
  if (tool === 'seo' || tool === 'description') {
    try { proposal = JSON.parse((text || '').replace(/^```json\s*|\s*```$/g, '').trim()); } catch { /* Mantém o resultado como texto se o provedor não devolver JSON válido. */ }
  }
  return NextResponse.json({ result: text || 'A IA não retornou conteúdo. Tente novamente.', proposal });
}
