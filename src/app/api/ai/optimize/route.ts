import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { titulo, descricao, storeId } = await req.json();

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
    const prompt = `Atue como um especialista em SEO para infoprodutos educacionais. 
Eu tenho um material com o seguinte título: "${titulo}" e descrição atual: "${descricao || ''}".
Por favor, otimize o título para ser mais atrativo e claro, e melhore a descrição para vender mais, focando nos benefícios.
Retorne um JSON estrito com as chaves "titulo" e "descricao". Nenhuma outra formatação, apenas o JSON puro, sem crases de markdown.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro da API Gemini:', errorText);
      throw new Error(`Erro Gemini: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const textResponse = result.candidates[0].content.parts[0].text;
    
    const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
       throw new Error('Formato de resposta inválido da IA.');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);

    return NextResponse.json(parsed);

  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || 'Erro interno.' }, { status: 500 });
  }
}
