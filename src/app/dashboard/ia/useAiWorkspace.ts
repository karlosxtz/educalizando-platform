'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { clearAiDraft, readAiWorkspace, writeAiWork, type AiWorkInput, type AiWork } from '@/lib/ai-workspace';

export function useAiWorkspace(storeId: string | undefined, draft: AiWorkInput | null) {
  const [revision, setRevision] = useState(0);
  const [status, setStatus] = useState('');
  const [items, setItems] = useState<{ drafts: AiWork[]; history: AiWork[] }>({ drafts: [], history: [] });
  const current = useRef<AiWorkInput | null>(null);
  const encoded = draft ? JSON.stringify(draft) : '';
  const refresh = useCallback(() => {
    if (!storeId) return;
    try { setItems(readAiWorkspace(localStorage, storeId)); }
    catch { setStatus('O navegador não permitiu acessar os rascunhos.'); }
  }, [storeId]);
  useEffect(refresh, [refresh, revision]);
  const save = useCallback((input: AiWorkInput, kind: AiWork['kind']) => {
    if (!storeId) return false;
    try { writeAiWork(localStorage, storeId, input, kind); setStatus(kind === 'draft' ? 'Rascunho salvo neste navegador.' : 'Versão guardada no histórico deste navegador.'); setRevision(value => value + 1); return true; }
    catch { setStatus('Não foi possível guardar a versão neste navegador. Mantenha esta tela aberta e copie o texto antes de sair.'); return false; }
  }, [storeId]);
  useEffect(() => {
    current.current = encoded ? JSON.parse(encoded) : null;
    if (!current.current) return;
    const timer = setTimeout(() => { if (current.current) save(current.current, 'draft'); }, 500);
    return () => clearTimeout(timer);
  }, [encoded, save]);
  useEffect(() => {
    const flush = () => {
      if (!storeId || !current.current) return;
      try { writeAiWork(localStorage, storeId, current.current, 'draft'); } catch { /* The visible editor is kept intact. */ }
    };
    const visibility = () => { if (document.visibilityState === 'hidden') flush(); };
    window.addEventListener('pagehide', flush); document.addEventListener('visibilitychange', visibility);
    return () => { flush(); window.removeEventListener('pagehide', flush); document.removeEventListener('visibilitychange', visibility); };
  }, [storeId]);
  const clear = (productId: string, target: AiWork['target']) => {
    // Prevent an unmount or pending debounce from recreating a draft after successful publication.
    if (current.current?.productId === productId && current.current.target === target) current.current = null;
    try { if (storeId) clearAiDraft(localStorage, storeId, productId, target); setRevision(value => value + 1); }
    catch { setStatus('Não foi possível remover o rascunho local.'); }
  };
  return { items, status, save, clear, refresh };
}
