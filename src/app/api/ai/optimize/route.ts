import { MARKETING_WRITING_RULES, marketingProductContext, assertMarketingQuantities } from '@/lib/ai-marketing-grounding';
import { generateAiContent,getAiKey } from '@/lib/ai-provider';
import { extractAiJson, AI_FORMAT_ERROR } from '@/lib/ai-json';
import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const user = await getRequestUser(req);
    if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

    const { titulo, descricao, storeId, responseFormat } = await req.json();

    if (!storeId || !titulo) {
      return NextResponse.json({ error: 'Faltam parâmetros obrigatórios.' }, { status: 400 });
    }

    // Buscar a chave da loja
    const { data: storeData, error: storeError } = await supabaseAdmin
      .from('stores')
      .select('id')
      .eq('id', storeId)
      .eq('creator_id', user.id)
      .single();

    if (storeError || !storeData) {
      return NextResponse.json({ error: 'Loja não encontrada ou sem permissão.' }, { status: 403 });
    }
    const { data: secret } = await supabaseAdmin.from('store_secrets').select('google_ai_key, openrouter_ai_key, ai_provider').eq('store_id', storeId).maybeSingle();
    if (!secret || !getAiKey(secret).key) {
      return NextResponse.json({ error: 'Chave de IA não configurada nesta loja.' }, { status: 401 });
    }


    const prompt = MARKETING_WRITING_RULES + '\n\n' + `Você é um especialista em copywriting educacional, SEO para plataformas de ensino e marketing de conversão para criadores de conteúdos pedagógicos.
O usuário fornecerá um título rascunho contendo o tema central do material didático.

TÍTULO BASE DO USUÁRIO: "${titulo}"

REGRAS OBRIGATÓRIAS:
1. PRESERVAÇÃO DO TEMA: Mantenha rigorosamente o tema principal informado pelo usuário (ex: se ele digitou 'Saci' ou 'Folclore', o material deve ser sobre isso, sem inventar outros temas genéricos).
2. CAMPO [TITULO]: Melhore a clareza do título sem acrescentar formato, conteúdo ou alinhamento à BNCC que não estejam na fonte.
3. CAMPO [DESCRICAO]: Escreva uma descrição de alta conversão estruturada em: 
   - Reorganize os detalhes e exemplos realmente informados pelo criador.
   - Não invente benefícios, quantidade de páginas ou espaços de preenchimento.
   - Se só houver título, faça uma revisão curta sem imaginar o conteúdo.
4. Responda somente com JSON válido: {"titulo":"título revisado","descricao":"descrição revisada com todos os detalhes sustentados pelo cadastro"}.
FONTE EM JSON: ${JSON.stringify(marketingProductContext({ titulo, descricao: typeof descricao === 'string' ? descricao.slice(0, 8000) : null }))}`;

    const parsed = extractAiJson(await generateAiContent(secret, prompt, true, { maxTokens: 8000, recoverTruncation: true, recoverFormat: true, validateJson: value => [value.titulo, value.descricao].every(item => typeof item === 'string' && Boolean(item.trim())) }));
    if (!parsed || typeof parsed.titulo !== 'string' || !parsed.titulo.trim() || typeof parsed.descricao !== 'string' || !parsed.descricao.trim()) throw new Error(AI_FORMAT_ERROR);
    assertMarketingQuantities(parsed, { titulo, descricao });
    if (responseFormat === 'json') {
      return NextResponse.json({ titulo: parsed.titulo.trim(), descricao: parsed.descricao.trim() });
    }
    const text = `[TITULO]\n${parsed.titulo.trim()}\n[DESCRICAO]\n${parsed.descricao.trim()}`;
    const event = `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] })}\n\ndata: [DONE]\n\n`;
    return new Response(event, { headers: { 'Content-Type': 'text/event-stream' } });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || 'Erro interno.' }, { status: 500 });
  }
}
