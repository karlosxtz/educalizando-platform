'use client';

const KEY = '@educalizando:search_history';
const EVENT = 'educalizando:search-history-changed';
const EMPTY: string[] = [];
let cachedRaw: string | null | undefined;
let cached: string[] = EMPTY;

export function addSearchHistory(query: string) {
  const value = query.trim();
  if (typeof window === 'undefined' || value.length < 2) return;
  try {
  const current = getSearchHistory().filter(item => item.toLocaleLowerCase('pt-BR') !== value.toLocaleLowerCase('pt-BR'));
  localStorage.setItem(KEY, JSON.stringify([value, ...current].slice(0, 8)));
  cachedRaw = undefined;
  window.dispatchEvent(new Event(EVENT));
  } catch { /* O bloqueio de armazenamento local não impede a busca. */ }
}

export function getSearchHistory() {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === cachedRaw) return cached;
    const parsed = raw ? JSON.parse(raw) : [];
    cachedRaw = raw;
    cached = Array.isArray(parsed) ? parsed.filter(item => typeof item === 'string').slice(0, 8) : EMPTY;
    return cached;
  } catch { return EMPTY; }
}

export function clearSearchHistory() {
  if (typeof window === 'undefined') return;
  try {
  localStorage.removeItem(KEY);
  cachedRaw = undefined;
  window.dispatchEvent(new Event(EVENT));
  } catch { /* Sem armazenamento disponível. */ }
}

export function subscribeToSearchHistory(listener: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(EVENT, listener);
  window.addEventListener('storage', listener);
  return () => { window.removeEventListener(EVENT, listener); window.removeEventListener('storage', listener); };
}
