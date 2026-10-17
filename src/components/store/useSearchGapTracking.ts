'use client';
import { useEffect, useRef } from 'react';
import { gapKey, safeGapQuery, type GapFilters } from '@/lib/store-search-gaps';

type Props = { storeId: string; query: string; resultCount: number; unfilteredCount: number; enabled: boolean; filters: GapFilters };
type Recent = { key: string; at: number };
export function useSearchGapTracking({ storeId, query, resultCount, unfilteredCount, enabled, filters }: Props) {
  const recent = useRef<Recent[]>([]);
  const { category, education, collection } = filters;
  useEffect(() => {
    const safe = safeGapQuery(query);
    if (!enabled || !safe || resultCount !== 0) return;
    const key = gapKey(storeId, safe.normalized, { category, education, collection });
    const timer = setTimeout(() => {
      if (document.visibilityState !== 'visible' || navigator.doNotTrack === '1' || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl || /bot|crawler|spider|headless/i.test(navigator.userAgent)) return;
      const storageKey = 'educalizando_search_gaps_' + storeId;
      try {
        if (localStorage.getItem('educalizando_metrics_consent_' + storeId) === 'rejected') return;
        const saved = JSON.parse(sessionStorage.getItem(storageKey) || '[]');
        if (Array.isArray(saved)) recent.current = saved.filter(item => typeof item.key === 'string' && Number.isFinite(item.at)).slice(-100);
      } catch { /* First-party statistics also work without browser storage. */ }
      const now = Date.now();
      recent.current = recent.current.filter(item => now - item.at < 30 * 60000).slice(-99);
      if (recent.current.some(item => item.key === key)) return;
      recent.current.push({ key, at: now });
      try { sessionStorage.setItem(storageKey, JSON.stringify(recent.current)); } catch { /* Memory deduplication remains active. */ }
      void fetch('/api/store-search-gaps', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', keepalive: true,
        body: JSON.stringify({ id: crypto.randomUUID(), storeId, query: safe.query, scope: unfilteredCount === 0 ? 'catalog' : 'filters', filters: { category, education, collection } }),
      }).catch(() => { /* Metrics never block a search or display errors to shoppers. */ });
    }, 1600);
    return () => clearTimeout(timer);
  }, [storeId, query, resultCount, unfilteredCount, enabled, category, education, collection]);
}
