'use client';
import { useEffect, useSyncExternalStore } from 'react';
import { supabase } from './supabase';

type Snapshot = { ready: boolean; userId: string | null; ids: ReadonlySet<string>; error: boolean };
const empty: Snapshot = { ready: false, userId: null, ids: new Set(), error: false };
let snapshot = empty;
let loading: Promise<void> | null = null;
let listening = false;
let generation = 0;
const listeners = new Set<() => void>();
const busy = new Set<string>();
const emit = () => listeners.forEach(listener => listener());

function load() {
  if (loading) return loading;
  const version = generation;
  loading = (async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user.id || null;
      const ids = new Set<string>();
      if (userId) for (let from = 0; ; from += 1000) {
        const result = await supabase.from('product_favorites').select('product_id').eq('user_id', userId).order('product_id').range(from, from + 999);
        if (result.error) throw result.error;
        for (const row of result.data || []) ids.add(row.product_id);
        if ((result.data?.length || 0) < 1000) break;
      }
      if (version === generation) snapshot = { ready: true, userId, ids, error: false };
    } catch { if (version === generation) snapshot = { ...empty, ready: true, error: true }; }
    finally { if (version === generation) loading = null; emit(); }
  })();
  return loading;
}

export function useBuyerFavorites() {
  const state = useSyncExternalStore(listener => { listeners.add(listener); return () => { listeners.delete(listener); }; }, () => snapshot, () => empty);
  useEffect(() => {
    if (!listening) {
      listening = true;
      supabase.auth.onAuthStateChange((_event, session) => {
        if ((session?.user.id || null) === snapshot.userId && snapshot.ready) return;
        generation++; snapshot = empty; emit();
        // Supabase auth callbacks must not await another Supabase request.
        queueMicrotask(() => { loading = null; void load(); });
      });
    }
    if (!snapshot.ready) void load();
  }, []);
  return state;
}

export async function toggleBuyerFavorite(productId: string) {
  if (busy.has(productId)) return;
  busy.add(productId);
  try {
    if (!snapshot.ready || snapshot.error) await load();
    if (snapshot.error) throw new Error('Não foi possível consultar seus favoritos. Tente novamente.');
    const userId = snapshot.userId;
    if (!userId) return false;
    const removing = snapshot.ids.has(productId);
    const result = removing
      ? await supabase.from('product_favorites').delete().eq('user_id', userId).eq('product_id', productId)
      : await supabase.from('product_favorites').upsert({ user_id: userId, product_id: productId }, { onConflict: 'user_id,product_id', ignoreDuplicates: true });
    if (result.error) throw new Error('Não foi possível atualizar seu favorito. Tente novamente.');
    if (snapshot.userId === userId) {
      const ids = new Set(snapshot.ids);
      if (removing) ids.delete(productId); else ids.add(productId);
      snapshot = { ...snapshot, ids }; emit();
    }
    return true;
  } finally { busy.delete(productId); }
}
