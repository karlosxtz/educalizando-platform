import { AI_FORMAT_ERROR, extractAiJson } from './ai-json';
type AiSecret = { google_ai_key?: string | null; openrouter_ai_key?: string | null; ai_provider?: string | null };
type AiSource = 'google' | 'groq' | 'router';
export const AI_PROVIDER_TIMEOUT_MS = 120_000;
function cleanKey(value?: string | null) { return value?.trim().replace(/['"]/g, '').replace(/^Bearer\s+/i, '') || ''; }
function detectSource(key: string): AiSource {
  if (key.startsWith('AIza')) return 'google';
  if (key.startsWith('gsk_')) return 'groq';
  return 'router';
}
export function getAiKey(secret: AiSecret) {
  const key = cleanKey(secret.ai_provider === 'alternative' ? secret.openrouter_ai_key : secret.google_ai_key);
  const source = detectSource(key);
  return { alternative: source !== 'google', key, source };
}
function integrationError(status: number) {
  if (status === 401 || status === 403) return 'A chave de IA não foi aceita. Salve a chave novamente e tente gerar o conteúdo.';
  if (status === 402) return 'O provedor de IA informou falta de créditos. Confira sua conta de IA.';
  if (status === 429) return 'A IA atingiu o limite temporário de solicitações. Aguarde alguns instantes e tente novamente.';
  if (status === 400 || status === 404) return 'O provedor não aceitou esta geração. Confira se sua chave tem acesso ao modelo e ao formato solicitados.';
  return 'O provedor de IA está indisponível agora. Tente novamente em instantes.';
}
export async function generateAiContent(secret: AiSecret, prompt: string, json = false, options: { maxTokens?: number; recoverTruncation?: boolean; recoverFormat?: boolean; validateJson?: (value: Record<string, unknown>) => boolean } = {}) {
  const { key, source } = getAiKey(secret);
  if (!key) throw new Error('Configure uma chave de IA para usar esta ferramenta.');
  const maxTokens = Math.max(512, Math.min(options.maxTokens || (json ? 6000 : 3000), 8000));
  const controller = new AbortController();
  const startedAt = Date.now();
  const timer = setTimeout(() => controller.abort(), AI_PROVIDER_TIMEOUT_MS);
  const structuredPrompt = json ? `${prompt}\nRetorne um único objeto JSON completo, sem comentários ou blocos de código.` : prompt;
  try {
    let url: string;
    let body: unknown;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (source === 'google') {
      url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
      headers['x-goog-api-key'] = key;
      body = { contents: [{ parts: [{ text: structuredPrompt }] }], generationConfig: {
        maxOutputTokens: maxTokens, thinkingConfig: { thinkingBudget: 0 },
        ...(json ? { responseMimeType: 'application/json' } : {}),
      } };
    } else {
      headers.Authorization = `Bearer ${key}`;
      if (source === 'router') {
        headers['HTTP-Referer'] = 'https://www.educalizando.com.br';
        headers['X-OpenRouter-Title'] = 'EducaliZando';
      }
      url = source === 'groq' ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://openrouter.ai/api/v1/chat/completions';
      body = { model: source === 'groq' ? 'openai/gpt-oss-20b' : 'openrouter/auto',
        messages: [{ role: 'user', content: structuredPrompt }], max_tokens: maxTokens,
        ...(source === 'groq' ? { reasoning_effort: 'low' } : {}),
        ...(source === 'router' ? { reasoning: { effort: 'low' } } : {}),
        ...(json ? { response_format: { type: 'json_object' }, ...(source === 'router' ? { provider: { require_parameters: true } } : {}) } : {}),
      };
    }
    // Do not retry quotas/authentication. Preserve free access only after a non-billable credit refusal.
    let response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body), signal: controller.signal });
    // Retry only an explicit temporary upstream refusal, never a timeout, quota or completed generation.
    if ([502, 503, 504].includes(response.status) && !controller.signal.aborted) {
      await response.body?.cancel();
      response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body), signal: controller.signal });
    }
    if (source === 'router' && response.status === 402) {
      await response.body?.cancel();
      body = { ...(body as Record<string, unknown>), model: 'openrouter/free' };
      response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body), signal: controller.signal });
    }
    if (!response.ok) { await response.body?.cancel(); throw new Error(integrationError(response.status)); }
    let payload = await response.json();
    if (payload?.error) throw new Error(integrationError(Number(payload.error.code) || 502));
    const readText = (value: typeof payload): string => source === 'google'
      ? value?.candidates?.[0]?.content?.parts?.filter((part: { thought?: boolean }) => !part.thought).map((part: { text?: string }) => part.text || '').join('\n').trim() || ''
      : typeof value?.choices?.[0]?.message?.content === 'string' ? value.choices[0].message.content.trim() : '';
    const truncated = payload?.candidates?.[0]?.finishReason === 'MAX_TOKENS' || payload?.choices?.[0]?.finish_reason === 'length';
    const blocked = payload?.promptFeedback?.blockReason || payload?.choices?.[0]?.finish_reason === 'content_filter' || payload?.choices?.[0]?.message?.refusal || (source === 'google' && payload?.candidates?.[0]?.finishReason && !['STOP', 'MAX_TOKENS'].includes(payload.candidates[0].finishReason));
    const candidateJson = json ? extractAiJson(readText(payload)) : null;
    const invalidFormat = json && (!candidateJson || (options.validateJson && !options.validateJson(candidateJson)));
    if (!blocked && ((options.recoverTruncation && truncated) || (options.recoverFormat && invalidFormat)) && Date.now() - startedAt < AI_PROVIDER_TIMEOUT_MS - 30_000) {
      const compactPrompt = structuredPrompt + `\nRECUPERAÇÃO: a tentativa anterior não completou o formato necessário. Gere novamente ${json ? 'um JSON completo, com TODOS os campos do formato solicitado, no máximo 6000 caracteres no total' : 'um texto completo, no máximo 4500 caracteres'}. Preserve fatos essenciais e restrições. Não inclua raciocínio nem repetições. Nunca invente ou complete fatos ausentes.`;
      const retryBody = source === 'google' ? { ...(body as Record<string, unknown>), contents: [{ parts: [{ text: compactPrompt }] }] } : { ...(body as Record<string, unknown>), messages: [{ role: 'user', content: compactPrompt }] };
      response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(retryBody), signal: controller.signal });
      if (!response.ok) { await response.body?.cancel(); throw new Error(integrationError(response.status)); }
      payload = await response.json();
    }
    if (payload?.error) throw new Error(integrationError(Number(payload.error.code) || 502));
    let text: string;
    if (source === 'google') {
      const candidate = payload?.candidates?.[0];
      if (candidate?.finishReason === 'MAX_TOKENS') throw new Error('A resposta da IA ficou incompleta. Tente gerar um conteúdo menor.');
      if (payload?.promptFeedback?.blockReason || (candidate?.finishReason && candidate.finishReason !== 'STOP')) throw new Error('A IA não conseguiu responder a este conteúdo. Revise a solicitação e tente novamente.');
      text = candidate?.content?.parts?.filter((part: { thought?: boolean }) => !part.thought).map((part: { text?: string }) => part.text || '').join('\n').trim() || '';
    } else {
      const choice = payload?.choices?.[0];
      if (choice?.finish_reason === 'length') throw new Error('A resposta da IA ficou incompleta. Tente gerar um conteúdo menor.');
      if (choice?.finish_reason === 'content_filter' || choice?.message?.refusal) throw new Error('A IA não conseguiu responder a este conteúdo. Revise a solicitação e tente novamente.');
      text = typeof choice?.message?.content === 'string' ? choice.message.content.trim() : '';
    }
    if (!text) throw new Error('O provedor de IA retornou uma resposta vazia. Tente novamente.');
    if (json) {
      const parsed = extractAiJson(text);
      if (!parsed || (options.validateJson && !options.validateJson(parsed))) throw new Error(AI_FORMAT_ERROR);
      return JSON.stringify(parsed);
    }
    return text;
  } catch (error) {
    if (controller.signal.aborted) throw new Error('O provedor não concluiu a resposta em 2 minutos. Seus textos e rascunhos foram preservados. Tente novamente quando o serviço estiver disponível.');
    if (error instanceof TypeError || error instanceof SyntaxError) throw new Error('Não foi possível ler a resposta do provedor de IA. Tente novamente em instantes.');
    throw error;
  } finally { clearTimeout(timer); }
}
