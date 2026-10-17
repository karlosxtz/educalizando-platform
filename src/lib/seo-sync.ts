const eventName = 'educalizando:seo-saved';
const key = 'educalizando:seo-sync';
export function notifySeoSaved(storeId: string) {
  if (typeof window === 'undefined') return;
  const notice = { storeId, revision: `${Date.now()}-${Math.random()}` };
  window.dispatchEvent(new CustomEvent(eventName, { detail: notice }));
  try { localStorage.setItem(key, JSON.stringify(notice)); } catch { /* Same-tab event still works. */ }
}
export function onSeoSaved(storeId: string, refresh: () => void) {
  const local = (event: Event) => { if ((event as CustomEvent).detail?.storeId === storeId) refresh(); };
  const remote = (event: StorageEvent) => {
    if (event.key !== key || !event.newValue) return;
    try { if (JSON.parse(event.newValue).storeId === storeId) refresh(); } catch { /* Invalid browser data is ignored. */ }
  };
  window.addEventListener(eventName, local); window.addEventListener('storage', remote);
  return () => { window.removeEventListener(eventName, local); window.removeEventListener('storage', remote); };
}
