/** A failed submission retains its ID so retrying cannot create another product. */
const pendingInMemory = new Map<string, { fingerprint: string; id: string }>();

export function productCreationRequest(payload: object, storage: Pick<Storage, 'getItem' | 'setItem'>, newId: () => string, key = 'educalizando_pending_product_creation') {
  const fingerprint = JSON.stringify(payload);
  try {
    const pending = JSON.parse(storage.getItem(key) || 'null');
    if (pending?.fingerprint === fingerprint && /^[0-9a-f-]{36}$/i.test(pending.id)) return pending.id as string;
  } catch { /* An invalid cached request must not prevent a submission. */ }
  const cached = pendingInMemory.get(key);
  if (cached?.fingerprint === fingerprint) return cached.id;
  const id = newId();
  pendingInMemory.set(key, { fingerprint, id });
  try { storage.setItem(key, JSON.stringify({ fingerprint, id })); } catch { /* Keep retry protection when browser storage is unavailable. */ }
  return id;
}

export function clearCreationRequest(storage: Pick<Storage, 'removeItem'>, key = 'educalizando_pending_product_creation') {
  pendingInMemory.delete(key);
  try { storage.removeItem(key); } catch { /* Browser privacy settings cannot invalidate a successful save. */ }
}
