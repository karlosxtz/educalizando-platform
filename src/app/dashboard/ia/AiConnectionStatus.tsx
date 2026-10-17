'use client';
import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, PlugZap } from 'lucide-react';
import { requestAiJson } from '@/lib/ai-client';

export function AiConnectionStatus({ storeId, configured, disabled }: { storeId: string; configured: boolean; disabled: boolean }) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ elapsedMs: number } | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { setResult(null); setError(''); }, [storeId, configured]);
  async function test() {
    if (testing || disabled || !configured) return;
    setTesting(true); setError(''); setResult(null);
    try {
      const payload = await requestAiJson('/api/ai/health', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ storeId }) });
      setResult({ elapsedMs: payload.elapsedMs });
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Não foi possível testar a IA.'); }
    finally { setTesting(false); }
  }
  return <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-bold text-slate-900">Conexão da inteligência artificial</p><p className="mt-1 text-xs text-slate-500">Confira se sua chave está respondendo antes de gerar um conteúdo.</p></div><button type="button" onClick={() => void test()} disabled={testing || disabled || !configured} className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-xs font-bold text-violet-800 disabled:opacity-50">{testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlugZap className="h-4 w-4" />}{testing ? 'Testando resposta...' : 'Testar conexão'}</button></div>{result && <p role="status" className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4" />A inteligência artificial respondeu em {(result.elapsedMs / 1000).toFixed(1)}s. Conexão validada neste teste.</p>}{error && <p role="alert" className="mt-3 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">{error}</p>}</div>;
}
