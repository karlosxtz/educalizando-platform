export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { titulo, descricao, storeId, field } = await req.json();

    if (!storeId || !titulo) {
      return NextResponse.json({ error: 'Faltam parâmetros obrigatórios.' }, { status: 400 });
    }

    // Buscar a chave da loja
    const { data: storeData, error: storeError } = await supabaseAdmin
      .from('stores')
      .select('google_ai_key')
      .eq('id', storeId)
      .single();

    if (storeError || !storeData?.google_ai_key) {
      return NextResponse.json({ error: 'Chave da API Gemini não configurada nesta loja.' }, { status: 401 });
    }

    const apiKey = storeData.google_ai_key;
    const cleanApiKey = apiKey.trim().replace(/['"]/g, '');

    const target = field === 'titulo' ? 'título' : 'descrição';
    const prompt = `Atue como um especialista em SEO para infoprodutos educacionais. 
Eu tenho um material com o seguinte título: "${titulo}" e descrição atual: "${descricao || ''}".
Por favor, otimize APENAS o ${target} para ser mais atrativo e focado em conversão.
Retorne EXCLUSIVAMENTE o texto puro do ${target} otimizado. Não use markdown, não use JSON, apenas o texto final.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:streamGenerateContent?alt=sse&key=${cleanApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI Debug] Erro da API Gemini:', errorText);
      return NextResponse.json({ error: `Erro Gemini: ${response.status} - ${errorText}` }, { status: response.status });
    }

    return new Response(response.body, {
      headers: { 'Content-Type': 'text/event-stream' },
    });

  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || 'Erro interno.' }, { status: 500 });
  }
}
