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
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}`, 'HTTP-Referer': 'https://educalizando.com.br', 'X-Title': 'EducaliZando' },
      // A instrução de JSON já faz parte do prompt. Alguns modelos disponíveis
      // pela integração alternativa recusam `response_format`, mesmo com uma
      // chave válida, e respondiam como se a credencial estivesse errada.
      body: JSON.stringify({ model: 'google/gemini-2.5-flash', messages: [{ role: 'user', content: prompt }], max_tokens: 4096 }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      console.error('[AI alternative provider]', response.status, payload?.error?.message || payload);
      throw new Error('A integração de IA não conseguiu concluir esta solicitação agora. Tente novamente em instantes.');
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
