import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { GEMINI_MARKETING_SYSTEM_PROMPT } from '@/lib/ai-service';

export async function POST(req: Request) {
  try {
    const { titulo, storeId } = await req.json();

    if (!storeId || !titulo) {
      return NextResponse.json({ error: 'Faltam parâmetros obrigatórios.' }, { status: 400 });
    }

    const { data: storeData, error: storeError } = await supabaseAdmin
      .from('stores')
      .select('google_ai_key')
      .eq('id', storeId)
      .single();

    if (storeError || !storeData?.google_ai_key) {
      return NextResponse.json({ error: 'Chave da API Gemini não configurada nesta loja.' }, { status: 401 });
    }

    const apiKey = storeData.google_ai_key;
    
    // Regra Restrita de Prompt (Backend)
    const strictConstraint = `RESTRICAO ABSOLUTA DE TEMPO: A IA está estritamente proibida de incluir referências a horários, períodos de ausência ou justificativas de tempo nas mensagens e roteiros gerados. As campanhas devem ser diretas, atemporais e focadas no material pedagógico.`;

    const fullSystemPrompt = `${GEMINI_MARKETING_SYSTEM_PROMPT}\n\n${strictConstraint}`;

    const prompt = `Gere uma campanha de marketing para o produto "${titulo}". 
Preciso de duas opções separadas:
1. Uma mensagem persuasiva para um grupo VIP de WhatsApp.
2. Uma legenda de Instagram com uma sugestão de enquete para o Stories e 5 a 10 hashtags.
Separe claramente as seções usando "--- WHATSAPP ---" e "--- INSTAGRAM ---". Retorne apenas o texto final.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: fullSystemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro da API Gemini (Campanha):', errorText);
      throw new Error(`Erro Gemini: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return NextResponse.json({ campaign: textResponse });

  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || 'Erro interno.' }, { status: 500 });
  }
}
