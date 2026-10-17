'use client';
export type RecoveryInputItem = { productId: string; quantity: number; isPlr?: boolean; kind?: 'product' | 'kit' };
const key = (storeId: string) => '@educalizando:store-recovery:' + storeId;
export function recoveryBrowserToken(storeId: string) {
  try { let token = localStorage.getItem(key(storeId)); const since = Number(localStorage.getItem(key(storeId) + ':created')); if (!token || !since || Date.now() - since >= 7 * 86400000) { token = crypto.randomUUID(); localStorage.setItem(key(storeId), token); localStorage.setItem(key(storeId) + ':created', String(Date.now())); } return token; } catch { return null; }
}
export function finishStoreRecovery(storeId: string) { try { localStorage.removeItem(key(storeId)); localStorage.removeItem(key(storeId) + ':created'); localStorage.removeItem(key(storeId) + ':parent'); } catch { /* Optional local storage. */ } }
type RecoveryInput = { storeId: string; storeSlug: string; items: RecoveryInputItem[]; stage: 'cart' | 'checkout'; consent?: boolean; phone?: string; name?: string };
const writes = new Map<string, Promise<Response | undefined>>();
export function saveStoreRecovery(input: RecoveryInput) {
  const task = (writes.get(input.storeId) || Promise.resolve()).catch(() => undefined).then(() => persistStoreRecovery(input));
  writes.set(input.storeId, task);
  void task.finally(() => { if (writes.get(input.storeId) === task) writes.delete(input.storeId); }).catch(() => {});
  return task;
}
async function persistStoreRecovery(input: RecoveryInput) {
  const browserToken = recoveryBrowserToken(input.storeId); if (!browserToken) return;
  let parentToken: string | null = null; try { parentToken = localStorage.getItem(key(input.storeId) + ':parent'); } catch { /* Optional. */ }
  const send = (token: string) => fetch('/api/store-carts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true, body: JSON.stringify({ ...input, phone: input.consent ? input.phone : undefined, name: input.consent ? input.name : undefined, browserToken: token, parentToken, source: 'store' }) });
  const response = await send(browserToken);
  if (response.status === 409 && (await response.clone().json()).newCartRequired && input.items.length) {
    finishStoreRecovery(input.storeId); const next = recoveryBrowserToken(input.storeId); if (next) return send(next);
  }
  return response;
}
export function setRecoveryParent(storeId: string, token: string) { try { localStorage.setItem(key(storeId) + ':parent', token); } catch { /* Optional. */ } }
