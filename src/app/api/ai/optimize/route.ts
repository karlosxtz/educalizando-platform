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
    const cleanApiKey = apiKey.trim().replace(/['"]/g, '');
    console.log(`[AI Debug] Chave resgatada. Tamanho: ${cleanApiKey.length} caracteres.`);

    // PASSO 1: Listar modelos permitidos para esta chave (diagnóstico)
    const checkModels = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${cleanApiKey}`);
    const modelsData = await checkModels.json();
    console.log('[AI Debug] Modelos permitidos para esta chave:', JSON.stringify(modelsData, null, 2));

    if (!checkModels.ok) {
      console.error('[AI Debug] Falha ao listar modelos. A chave pode ser inválida.');
      return NextResponse.json({ error: `Chave inválida ou sem permissão. Status: ${checkModels.status}. Detalhes: ${JSON.stringify(modelsData)}` }, { status: 401 });
    }

    // Extrair nomes dos modelos disponíveis para log
    const modelNames = (modelsData.models || []).map((m: any) => m.name);
    console.log('[AI Debug] Nomes dos modelos:', modelNames);

    // PASSO 2: Gerar conteúdo com o modelo disponível
    const prompt = `Atue como um especialista em SEO para infoprodutos educacionais. 
Eu tenho um material com o seguinte título: "${titulo}" e descrição atual: "${descricao || ''}".
Por favor, otimize o título para ser mais atrativo e claro, e melhore a descrição para vender mais, focando nos benefícios.
Retorne um JSON estrito com as chaves "titulo" e "descricao". Nenhuma outra formatação, apenas o JSON puro, sem crases de markdown.`;

    // Usar o primeiro modelo flash disponível ou fallback
    const flashModel = modelNames.find((n: string) => n.includes('gemini-1.5-flash')) 
                    || modelNames.find((n: string) => n.includes('gemini-2.0-flash'))
                    || modelNames.find((n: string) => n.includes('gemini'))
                    || 'models/gemini-1.5-flash-latest';
    
    const modelPath = flashModel.startsWith('models/') ? flashModel : `models/${flashModel}`;
    console.log(`[AI Debug] Modelo selecionado para geração: ${modelPath}`);

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent?key=${cleanApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI Debug] Erro da API Gemini:', errorText);
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
