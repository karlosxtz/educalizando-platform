type AiSecret = { google_ai_key?: string | null; openrouter_ai_key?: string | null; ai_provider?: string | null };

export function getAiKey(secret: AiSecret) {
  const alternative = secret.ai_provider === 'alternative';
  const key = alternative ? secret.openrouter_ai_key : secret.google_ai_key;
  return { alternative, key: key?.trim().replace(/['"]/g, '').replace(/^Bearer\s+/i, '') || '' };
}

export async function generateAiContent(secret: AiSecret, prompt: string, json = false) {
  const { alternative, key } = getAiKey(secret);
  if (!key) throw new Error('Configure uma chave de IA para usar esta ferramenta.');
  if (alternative) {
    // As chaves do Groq começam com gsk_. Elas usam o formato compatível com
    // OpenAI, porém em um endpoint diferente do OpenRouter. Antes deste
    // tratamento, uma chave válida do Groq era enviada ao OpenRouter e toda
    // geração falhava com uma mensagem genérica de integração.
    const isGroq = key.startsWith('gsk_');
    const providerName = isGroq ? 'Groq' : 'OpenRouter';
    const response = await fetch(isGroq ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}`, 'HTTP-Referer': 'https://educalizando.com.br', 'X-OpenRouter-Title': 'EducaliZando' },
      // A instrução de JSON já faz parte do prompt. Alguns modelos disponíveis
      // pela integração alternativa recusam `response_format`, mesmo com uma
      // chave válida, e respondiam como se a credencial estivesse errada.
      // O roteador tenta modelos compatíveis em ordem. Isso evita que uma
      // indisponibilidade temporária de um modelo interrompa as ferramentas
      // da loja, sem exigir que o criador troque ou informe outra chave.
      body: JSON.stringify(isGroq
        ? { model: 'openai/gpt-oss-20b', messages: [{ role: 'user', content: prompt }], max_tokens: 4096 }
        : { models: ['~google/gemini-flash-latest', 'google/gemini-2.5-flash'], messages: [{ role: 'user', content: prompt }], max_tokens: 4096 }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      console.error(`[AI ${providerName}]`, response.status, payload?.error?.message || payload);
      if (response.status === 401 || response.status === 403) {
        throw new Error(`${providerName} não aceitou esta chave. Confira se a integração selecionada corresponde à chave salva.`);
      }
      if (response.status === 429) {
        throw new Error(`${providerName} atingiu o limite temporário de solicitações. Aguarde alguns instantes e tente novamente.`);
      }
      throw new Error(`${providerName} não conseguiu concluir esta solicitação agora. Tente novamente em instantes.`);
    }
    return payload?.choices?.[0]?.message?.content?.trim() || '';
  }
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${key}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: json ? { responseMimeType: 'application/json', maxOutputTokens: 4096 } : undefined }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    console.error('[AI primary provider]', response.status, payload?.error?.message || payload);
    throw new Error('Não foi possível concluir a geração. Confira sua chave com o suporte e tente novamente.');
  }
  return payload?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || '').join('\n').trim() || '';
}
