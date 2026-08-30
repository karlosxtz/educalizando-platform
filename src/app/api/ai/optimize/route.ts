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

    const prompt = `Atue como um especialista em SEO para infoprodutos educacionais. 
Eu tenho um material com o seguinte título base: "${titulo}".

Regra de Ouro Inegociável: O Título base fornecido pelo usuário contém o tema principal do material (por exemplo: Saci, Folclore, Alfabetização, Matemática). Você está estritamente proibido de remover ou alterar o foco principal do tema digitado. O seu papel no campo [TITULO] é apenas polir, otimizar e tornar o título comercialmente atraente para educadores, preservando 100% da identidade pedagógica original.

Por favor, gere uma resposta contendo estritamente o seguinte formato de texto puro delimitado:

[TITULO]
(Título otimizado e atrativo para educadores)
[DESCRICAO]
(Descrição detalhada, comercial e pedagógica, deixando claro o que o aluno vai receber e estruturada para o criador apenas ajustar o número de páginas)

Não use markdown, não use JSON. Siga estritamente o formato delimitado.`;

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
