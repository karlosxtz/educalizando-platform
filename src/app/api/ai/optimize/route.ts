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

    const prompt = `Você é um especialista em copywriting educacional, SEO para plataformas de ensino e marketing de conversão para criadores de conteúdos pedagógicos.
O usuário fornecerá um título rascunho contendo o tema central do material didático.

TÍTULO BASE DO USUÁRIO: "${titulo}"

REGRAS OBRIGATÓRIAS:
1. PRESERVAÇÃO DO TEMA: Mantenha rigorosamente o tema principal informado pelo usuário (ex: se ele digitou 'Saci' ou 'Folclore', o material deve ser sobre isso, sem inventar outros temas genéricos).
2. CAMPO [TITULO]: Crie um título altamente magnético e otimizado para buscas (SEO), combinando o tema com termos que professores buscam no Google e nas redes (ex: 'Atividades Práticas', 'Pronto para Imprimir', 'Alinhado à BNCC').
3. CAMPO [DESCRICAO]: Escreva uma descrição de alta conversão estruturada em: 
   - Gancho emocional/dor do professor (ex: "Quer engajar sua turma sem perder horas preparando material?").
   - O que o aluno vai encontrar / Benefícios pedagógicos claros.
   - Espaço destacado ou indicação clara para o criador customizar o número de páginas.
4. Mantenha estritamente o formato de tags delimitadoras:
[TITULO]
(seu titulo aqui)
[DESCRICAO]
(sua descricao aqui)`;

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
