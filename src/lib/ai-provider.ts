type AiSecret = { google_ai_key?: string | null; openrouter_ai_key?: string | null; ai_provider?: string | null };

export function getAiKey(secret: AiSecret) {
  const alternative = secret.ai_provider === 'alternative';
  const key = alternative ? secret.openrouter_ai_key : secret.google_ai_key;
  return { alternative, key: key?.trim().replace(/['"]/g, '') || '' };
}

export async function generateAiContent(secret: AiSecret, prompt: string, json = false) {
  const { alternative, key } = getAiKey(secret);
  if (!key) throw new Error('Configure uma chave de IA para usar esta ferramenta.');
  if (alternative) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: 'google/gemini-2.5-flash', messages: [{ role: 'user', content: prompt }], response_format: json ? { type: 'json_object' } : undefined, max_tokens: 4096 }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(payload?.error?.message || 'A IA não concluiu a geração.');
    return payload?.choices?.[0]?.message?.content?.trim() || '';
  }
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${key}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: json ? { responseMimeType: 'application/json', maxOutputTokens: 4096 } : undefined }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.error?.message || 'A IA não concluiu a geração.');
  return payload?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || '').join('\n').trim() || '';
}
