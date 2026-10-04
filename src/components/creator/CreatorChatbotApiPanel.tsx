'use client';

import { buildStoreChatbotN8nWorkflow, storeChatbotN8nFileName } from '@/lib/store-chatbot-n8n-workflow';
import { CheckCircle2, Copy, Download, KeyRound, RefreshCw, ShieldCheck, Trash2, Workflow } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type KeyInfo = { exists: boolean; masked?: string; createdAt?: string; updatedAt?: string; lastUsedAt?: string | null };
type Payload = { error?: string; endpoint?: string; apiKey?: string; warning?: string; key?: KeyInfo };

async function body(response: Response): Promise<Payload> {
  return response.json().catch(() => ({ error: 'A resposta da integração não pôde ser lida.' }));
}

export default function CreatorChatbotApiPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [endpoint, setEndpoint] = useState('');
  const [key, setKey] = useState<KeyInfo>({ exists: false });
  const [newApiKey, setNewApiKey] = useState('');

  const load = async () => {
    try {
      const response = await fetch('/api/creator/whatsapp-module/chatbot-api-key', { cache: 'no-store' });
      const payload = await body(response);
      if (!response.ok) throw new Error(payload.error);
      setEndpoint(payload.endpoint || '');
      setKey(payload.key || { exists: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível carregar a API privada.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const generate = async () => {
    if (key.exists && !window.confirm('Gerar outra chave desativa imediatamente a chave atual. Deseja continuar?')) return;
    setSaving(true);
    try {
      const response = await fetch('/api/creator/whatsapp-module/chatbot-api-key', { method: 'POST' });
      const payload = await body(response);
      if (!response.ok || !payload.apiKey) throw new Error(payload.error || 'A chave não foi gerada.');
      setNewApiKey(payload.apiKey);
      setEndpoint(payload.endpoint || endpoint);
      setKey({ exists: true, masked: `${payload.apiKey.slice(0, 15)}••••••••${payload.apiKey.slice(-4)}`, updatedAt: new Date().toISOString() });
      toast.success('Nova chave criada. Copie e guarde agora.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível gerar a chave.');
    } finally {
      setSaving(false);
    }
  };

  const revoke = async () => {
    if (!window.confirm('A integração do n8n deixará de funcionar imediatamente. Revogar esta chave?')) return;
    setSaving(true);
    try {
      const response = await fetch('/api/creator/whatsapp-module/chatbot-api-key', { method: 'DELETE' });
      const payload = await body(response);
      if (!response.ok) throw new Error(payload.error);
      setKey({ exists: false });
      setNewApiKey('');
      toast.success('Chave revogada.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível revogar a chave.');
    } finally {
      setSaving(false);
    }
  };

  const copy = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copiado.`);
  };

  const downloadN8nWorkflow = () => {
    if (!newApiKey || !endpoint) {
      toast.error('Gere uma nova chave para baixar o fluxo já configurado.');
      return;
    }
    const workflow = buildStoreChatbotN8nWorkflow({ endpoint, apiKey: newApiKey });
    const url = URL.createObjectURL(new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = storeChatbotN8nFileName();
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success('Fluxo pronto baixado. Agora é só importar no n8n.');
  };

  const curl = endpoint && newApiKey
    ? `curl -H "Authorization: Bearer ${newApiKey}" "${endpoint}?q=alfabetização"`
    : `curl -H "Authorization: Bearer SUA_CHAVE" "${endpoint || 'URL_DA_API'}?q=alfabetização"`;

  return <section className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm">
    <div className="bg-gradient-to-r from-blue-700 to-indigo-700 p-6 text-white sm:p-8">
      <div className="flex items-start gap-3"><Workflow className="mt-1 h-7 w-7 shrink-0" /><div><p className="text-xs font-black uppercase tracking-[.16em] text-blue-100">Integração exclusiva da loja</p><h2 className="mt-1 text-2xl font-black">API privada para chatbot e n8n</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-blue-50">Conecte um agente de atendimento ao catálogo real da sua loja. A API reúne produtos, materiais grátis, clubes, combos e redes sociais, sem pesquisar na internet ou misturar dados de outros criadores.</p></div></div>
    </div>

    <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.1fr_.9fr]">
      <div>
        <div className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-blue-700" /><h3 className="font-black text-slate-950">Sua credencial</h3></div>
        {loading ? <p className="mt-4 text-sm text-slate-500">Carregando integração...</p> : <>
          <label className="mt-4 block text-xs font-black uppercase tracking-wider text-slate-500">Endpoint</label>
          <div className="mt-2 flex gap-2"><input readOnly value={endpoint} className="min-h-11 min-w-0 flex-1 rounded-xl border bg-slate-50 px-3 text-sm" /><button onClick={() => void copy(endpoint, 'Endpoint')} className="rounded-xl border px-3" aria-label="Copiar endpoint"><Copy className="h-4 w-4" /></button></div>

          {newApiKey ? <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-black text-amber-950">Sua integração está pronta.</p><p className="mt-1 text-xs leading-5 text-amber-900">Baixe o fluxo abaixo antes de sair. A chave aparece somente agora e já será incluída com segurança no arquivo.</p><div className="mt-3 flex gap-2"><input readOnly value={newApiKey} className="min-h-11 min-w-0 flex-1 rounded-xl border border-amber-200 bg-white px-3 font-mono text-xs" /><button onClick={() => void copy(newApiKey, 'Chave')} className="rounded-xl bg-amber-500 px-3 text-amber-950" aria-label="Copiar chave"><Copy className="h-4 w-4" /></button></div><button onClick={downloadN8nWorkflow} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 text-sm font-black text-white"><Download className="h-4 w-4" /> Baixar fluxo pronto do n8n</button></div> : null}

          <div className="mt-4 rounded-2xl border bg-slate-50 p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-black text-slate-900">{key.exists ? key.masked : 'Nenhuma chave ativa'}</p><p className="mt-1 text-xs text-slate-500">{key.lastUsedAt ? `Último uso: ${new Date(key.lastUsedAt).toLocaleString('pt-BR')}` : key.exists ? 'Ainda não utilizada pelo n8n.' : 'Gere uma chave para começar.'}</p></div>{key.exists ? <ShieldCheck className="h-6 w-6 shrink-0 text-emerald-600" /> : <KeyRound className="h-6 w-6 shrink-0 text-slate-400" />}</div></div>
          <div className="mt-4 flex flex-wrap gap-2"><button onClick={() => void generate()} disabled={saving} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-700 px-5 text-sm font-black text-white disabled:opacity-60">{key.exists ? <RefreshCw className="h-4 w-4" /> : <KeyRound className="h-4 w-4" />}{saving ? 'Processando...' : key.exists ? 'Trocar chave' : 'Gerar chave privada'}</button>{key.exists ? <button onClick={() => void revoke()} disabled={saving} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-rose-200 px-4 text-sm font-black text-rose-700 disabled:opacity-60"><Trash2 className="h-4 w-4" /> Revogar</button> : null}</div>
        </>}
      </div>

      <aside className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5"><p className="text-xs font-black uppercase tracking-wider text-blue-700">Forma mais fácil</p><h3 className="mt-1 text-lg font-black text-slate-950">Importe tudo pronto no n8n</h3><ol className="mt-3 space-y-3 text-sm leading-6 text-slate-700"><li><b>1.</b> Clique em <b>Gerar chave privada</b>.</li><li><b>2.</b> Clique em <b>Baixar fluxo pronto do n8n</b>.</li><li><b>3.</b> No n8n, escolha <b>Import from File</b> e selecione o arquivo.</li></ol><p className="mt-4 rounded-xl border border-blue-100 bg-white p-3 text-xs leading-5 text-slate-600">O fluxo já chega com endpoint, autenticação, busca e seção configurados. As seções disponíveis são products, plr, free_materials, clubs, kits e all.</p><details className="mt-4"><summary className="cursor-pointer text-xs font-black text-blue-800">Configuração manual avançada</summary><div className="mt-3 rounded-xl bg-slate-950 p-3 text-xs text-slate-100"><code className="break-all">{curl}</code></div><button onClick={() => void copy(curl, 'Exemplo')} className="mt-3 inline-flex items-center gap-2 text-xs font-black text-blue-800"><Copy className="h-3.5 w-3.5" /> Copiar exemplo</button></details></aside>
    </div>
    <div className="grid gap-3 border-t bg-slate-50 px-6 py-5 text-xs text-slate-600 sm:grid-cols-3 sm:px-8"><p className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> Somente dados públicos desta loja</p><p className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> Sem clientes, pedidos ou arquivos privados</p><p className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> Bloqueio automático sem acesso ao módulo</p></div>
  </section>;
}
