import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { GEMINI_MARKETING_SYSTEM_PROMPT } from '@/lib/ai-service';
import { getRequestUser } from '@/lib/api-auth';
import { generateAiContent, getAiKey } from '@/lib/ai-provider';

export async function POST(req: Request) {
  try {
    const user = await getRequestUser(req);
    if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

    const { titulo, storeId } = await req.json();

    if (!storeId || !titulo) {
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
    const { data: secret } = await supabaseAdmin.from('store_secrets').select('google_ai_key, openrouter_ai_key, ai_provider').eq('store_id', storeId).maybeSingle();
    if (!secret || !getAiKey(secret).key) {
      return NextResponse.json({ error: 'Chave de IA não configurada nesta loja.' }, { status: 401 });
    }
    
    // Regra Restrita de Prompt (Backend)
    const strictConstraint = `RESTRICAO ABSOLUTA DE TEMPO: A IA está estritamente proibida de incluir referências a horários, períodos de ausência ou justificativas de tempo nas mensagens e roteiros gerados. As campanhas devem ser diretas, atemporais e focadas no material pedagógico.`;

    const fullSystemPrompt = `${GEMINI_MARKETING_SYSTEM_PROMPT}\n\n${strictConstraint}`;

    const prompt = `Gere uma campanha de marketing para o produto "${titulo}". 
Preciso de duas opções separadas:
1. Uma mensagem persuasiva para um grupo VIP de WhatsApp.
2. Uma legenda de Instagram com uma sugestão de enquete para o Stories e 5 a 10 hashtags.
Separe claramente as seções usando "--- WHATSAPP ---" e "--- INSTAGRAM ---". Retorne apenas o texto final.`;

    const textResponse = await generateAiContent(secret, `${fullSystemPrompt}\n\n${prompt}`);

    return NextResponse.json({ campaign: textResponse });

  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || 'Erro interno.' }, { status: 500 });
  }
}
