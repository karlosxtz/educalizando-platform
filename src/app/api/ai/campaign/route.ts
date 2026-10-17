import { aiEditorialInstructions } from '@/lib/ai-editor-options';
import { MARKETING_WRITING_RULES, marketingProductContext, assertMarketingQuantities } from '@/lib/ai-marketing-grounding';
import { generateAiContent,getAiKey } from '@/lib/ai-provider';
import { extractAiJson, AI_FORMAT_ERROR } from '@/lib/ai-json';
import { GEMINI_MARKETING_SYSTEM_PROMPT } from '@/lib/ai-service';
import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const user = await getRequestUser(req);
    if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

    const { productId, storeId, style, brief } = await req.json();

    if (!storeId || !productId) {
      return NextResponse.json({ error: 'Faltam parâmetros obrigatórios.' }, { status: 400 });
    }

    const { data: storeData, error: storeError } = await supabaseAdmin
      .from('stores')
      .select('id')
      .eq('id', storeId)
      .eq('creator_id', user.id)
      .single();

    if (storeError || !storeData) {
      return NextResponse.json({ error: 'Loja não encontrada ou sem permissão.' }, { status: 403 });
    }
    const { data: product, error: productError } = await supabaseAdmin.from('products').select('*').eq('id', productId).eq('store_id', storeId).is('excluido_em', null).maybeSingle();
    if (productError || !product) return NextResponse.json({ error: 'Produto não encontrado nesta loja.' }, { status: 404 });
    const [{ data: categories }, { data: levels }] = await Promise.all([
      supabaseAdmin.from('categories').select('id,nome').or(`store_id.is.null,store_id.eq.${storeId}`),
      supabaseAdmin.from('education_levels').select('id,nome'),
    ]);
    const { data: secret } = await supabaseAdmin.from('store_secrets').select('google_ai_key, openrouter_ai_key, ai_provider').eq('store_id', storeId).maybeSingle();
    if (!secret || !getAiKey(secret).key) {
      return NextResponse.json({ error: 'Chave de IA não configurada nesta loja.' }, { status: 401 });
    }
    
    // Regra Restrita de Prompt (Backend)
    const strictConstraint = `RESTRICAO ABSOLUTA DE TEMPO: A IA está estritamente proibida de incluir referências a horários, períodos de ausência ou justificativas de tempo nas mensagens e roteiros gerados. As campanhas devem ser diretas, atemporais e focadas no material pedagógico.`;

    const fullSystemPrompt = `${GEMINI_MARKETING_SYSTEM_PROMPT}\n\n${strictConstraint}`;

    const prompt = MARKETING_WRITING_RULES + '\n\n' + `Gere uma campanha de marketing usando somente este cadastro: ${JSON.stringify(marketingProductContext(product, categories || [], levels || []))}.
Orientação editorial: ${aiEditorialInstructions(style, brief)}
Preciso de duas opções separadas:
1. Uma mensagem persuasiva para um grupo VIP de WhatsApp.
2. Uma legenda de Instagram com uma sugestão de enquete para o Stories e 5 a 10 hashtags.
Responda somente JSON válido: {"whatsapp":"mensagem pronta para enviar","instagram":"legenda pronta com enquete e hashtags"}.`;

    const parsed = extractAiJson(await generateAiContent(secret, `${fullSystemPrompt}\n\n${prompt}`, true, { maxTokens: 8000, recoverTruncation: true, recoverFormat: true, validateJson: value => [value.whatsapp, value.instagram].every(item => typeof item === 'string' && Boolean(item.trim())) }));
    if (!parsed || typeof parsed.whatsapp !== 'string' || !parsed.whatsapp.trim() || typeof parsed.instagram !== 'string' || !parsed.instagram.trim()) throw new Error(AI_FORMAT_ERROR);
    assertMarketingQuantities(parsed, product);

    return NextResponse.json({ whatsapp: parsed.whatsapp, instagram: parsed.instagram, campaign: `--- WHATSAPP ---\n${parsed.whatsapp}\n\n--- INSTAGRAM ---\n${parsed.instagram}` });

  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || 'Erro interno.' }, { status: 500 });
  }
}
