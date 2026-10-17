import { authenticatedFetch } from './client-api';
import { readApiJson } from './api-response';

/** Bound the authenticated request and body read. Never retry a generation automatically. */
export async function aiFetch(url: string, init: RequestInit = {}) {
  const controller = new AbortController();
  const cancel = () => controller.abort(init.signal?.reason);
  init.signal?.addEventListener('abort', cancel, { once: true });
  if (init.signal?.aborted) cancel();
  let timedOut = false;
  let timer: ReturnType<typeof setTimeout>;
  const deadline = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => { timedOut = true; controller.abort(); reject(new Error('timeout')); }, 145_000);
  });
  const cancellation = new Promise<never>((_resolve, reject) => {
    const rejectCancellation = () => reject(new DOMException('Geração cancelada.', 'AbortError'));
    if (controller.signal.aborted) rejectCancellation();
    else controller.signal.addEventListener('abort', rejectCancellation, { once: true });
  });
  try {
    return await Promise.race([deadline, cancellation, (async () => {
      if (controller.signal.aborted) throw new DOMException('Geração cancelada.', 'AbortError');
      const response = await authenticatedFetch(url, { ...init, signal: controller.signal });
      const body = await response.arrayBuffer();
      return new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers });
    })()]);
  } catch (error) {
    if (timedOut) throw new Error('A solicitação de IA demorou demais. Seus dados foram mantidos. Tente novamente em instantes.');
    throw error;
  } finally { clearTimeout(timer!); init.signal?.removeEventListener('abort', cancel); }
}

export async function requestAiJson(url: string, init: RequestInit = {}) {
  const response = await aiFetch(url, init);
  const payload = await readApiJson(response);
  if (!response.ok) throw new Error(payload.error || 'Não foi possível concluir esta ação de IA.');
  return payload;
}
