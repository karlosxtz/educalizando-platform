type AiSecret = { google_ai_key?: string | null; openrouter_ai_key?: string | null; ai_provider?: string | null };
type AiSource = 'google' | 'groq' | 'router';

function cleanKey(value?: string | null) {
  return value?.trim().replace(/['"]/g, '').replace(/^Bearer\s+/i, '') || '';
}

function detectSource(key: string): AiSource {
  if (key.startsWith('AIza')) return 'google';
  if (key.startsWith('gsk_')) return 'groq';
  return 'router';
}

export function getAiKey(secret: AiSecret) {
  const storedKey = secret.ai_provider === 'alternative' ? secret.openrouter_ai_key : secret.google_ai_key;
  const key = cleanKey(storedKey);
  const source = detectSource(key);
  return { alternative: source !== 'google', key, source };
}

function genericIntegrationError(status: number) {
  if (status === 401 || status === 403) return 'A chave de IA não foi aceita. Salve a chave novamente e tente gerar o conteúdo.';
  if (status === 429) return 'A IA atingiu o limite temporário de solicitações. Aguarde alguns instantes e tente novamente.';
  return 'A IA não conseguiu concluir esta solicitação agora. Tente novamente em instantes.';
}

async function readResponse(response: Response) {
  return response.json().catch(() => null) as Promise<{ choices?: Array<{ message?: { content?: string } }>; error?: { message?: string } }>;
}

export async function generateAiContent(secret: AiSecret, prompt: string, json = false) {
  const { key, source } = getAiKey(secret);
  if (!key) throw new Error('Configure uma chave de IA para usar esta ferramenta.');

  if (source === 'router') {
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${key}`, 'HTTP-Referer': 'https://educalizando.com.br', 'X-OpenRouter-Title': 'EducaliZando' };
    const request = (model: string) => fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST', headers, body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: 4096 }),
    });
    // A seleção automática cobre os modelos compatíveis com a conta. A rota
    // gratuita é usada como reserva para manter o painel funcional.
    let response = await request('openrouter/auto');
    if (!response.ok && response.status !== 401 && response.status !== 403) response = await request('openrouter/free');
    const payload = await readResponse(response);
    if (!response.ok) {
      console.error('[AI router]', response.status, payload?.error?.message || payload);
      throw new Error(genericIntegrationError(response.status));
    }
    return payload?.choices?.[0]?.message?.content?.trim() || '';
  }

  if (source === 'groq') {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: 'openai/gpt-oss-20b', messages: [{ role: 'user', content: prompt }], max_tokens: 4096 }),
    });
    const payload = await readResponse(response);
    if (!response.ok) {
      console.error('[AI direct]', response.status, payload?.error?.message || payload);
      throw new Error(genericIntegrationError(response.status));
    }
    return payload?.choices?.[0]?.message?.content?.trim() || '';
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: json ? { responseMimeType: 'application/json', maxOutputTokens: 4096 } : undefined }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    console.error('[AI primary]', response.status, payload?.error?.message || payload);
    throw new Error(genericIntegrationError(response.status));
  }
  return payload?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || '').join('\n').trim() || '';
}
