"use client";

import { ExternalLink,Gift,Loader2,MessageCircle,Package,Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect,useState } from 'react';
import { toast } from 'sonner';

interface StoreData {
  id: string;
  nome_loja: string;
  slug: string;
  whatsapp?: string;
  created_at: string;
  products: { count: number }[];
  withdrawals: { count: number }[];
  whatsapp_module?: {
    status?: string;
    expires_at?: string | null;
    whatsapp_connected?: boolean;
    free_access_enabled?: boolean;
  } | null;
}

export default function SuperAdminLojas() {
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [updatingWhatsapp, setUpdatingWhatsapp] = useState<string | null>(null);

  useEffect(() => {
    fetchStores();
  }, []);

  async function fetchStores() {
    try {
      const res = await fetch('/api/admin/stores');
      const data = await res.json();
      if (data.success) {
        setStores(data.stores || []);
      } else {
        setErrorMsg(data.error || 'Erro desconhecido da API');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Falha ao buscar lojas');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta loja vazia? Lojas com catálogo, kits ou compras não podem ser apagadas para preservar o histórico.')) return;
    
    try {
      const res = await fetch(`/api/admin/stores?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        alert('Loja excluída com sucesso.');
        fetchStores();
      } else {
        alert('Erro ao excluir: ' + data.error);
      }
    } catch (_e) {
      alert('Erro inesperado.');
    }
  }

  async function toggleWhatsappBonus(store: StoreData) {
    const enabled = store.whatsapp_module?.free_access_enabled === true;
    setUpdatingWhatsapp(store.id);
    try {
      const res = await fetch('/api/admin/stores', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: store.id,
          freeAccessEnabled: !enabled,
          note: !enabled ? 'Cortesia liberada pelo painel administrativo.' : 'Cortesia encerrada pelo painel administrativo.',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Não foi possível alterar o acesso.');
      setStores(current => current.map(item => item.id === store.id ? { ...item, whatsapp_module: data.subscription } : item));
      toast.success(!enabled ? `WhatsApp liberado gratuitamente para ${store.nome_loja}.` : `Cortesia encerrada para ${store.nome_loja}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível alterar o acesso.');
    } finally {
      setUpdatingWhatsapp(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Lojas & Criadores</h1>
        <p className="text-slate-400 mt-1">Gerencie todos os lojistas cadastrados na plataforma.</p>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <h2 className="text-lg font-bold text-white">Lojas Criadas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="text-xs uppercase bg-slate-900 text-slate-500 border-b border-slate-800">
              <tr>
                <th scope="col" className="px-6 py-4">Nome da Loja</th>
                <th scope="col" className="px-6 py-4">Slug (URL)</th>
                <th scope="col" className="px-6 py-4">Produtos</th>
                <th scope="col" className="px-6 py-4">WhatsApp da Loja</th>
                <th scope="col" className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p>Carregando lojas...</p>
                    </div>
                  </td>
                </tr>
              ) : errorMsg ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-red-500">
                    <p className="font-bold">Erro ao carregar lojas:</p>
                    <p className="text-sm">{errorMsg}</p>
                  </td>
                </tr>
              ) : stores.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Nenhuma loja encontrada.
                  </td>
                </tr>
              ) : (
                stores.map((store) => (
                  <tr key={store.id} className="border-b border-slate-800 hover:bg-slate-900/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">{store.nome_loja}</div>
                      <div className="text-xs text-slate-500 font-mono mt-1">{store.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/${store.slug}`} target="_blank" className="text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
                        /{store.slug}
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-slate-500" />
                        <span className="bg-slate-800 text-slate-300 py-1 px-2 rounded font-medium text-xs">
                          {store.products?.[0]?.count || 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="min-w-52 space-y-2">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                          <span className={`rounded-full px-2 py-1 ${store.whatsapp_module?.free_access_enabled ? 'bg-violet-500/15 text-violet-300' : store.whatsapp_module?.status === 'active' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                            {store.whatsapp_module?.free_access_enabled ? 'Cortesia ativa' : store.whatsapp_module?.status === 'active' ? 'Assinatura paga' : 'Sem cortesia'}
                          </span>
                          {store.whatsapp_module?.whatsapp_connected ? <span className="inline-flex items-center gap-1 text-emerald-400"><MessageCircle className="h-3 w-3" />Conectado</span> : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => void toggleWhatsappBonus(store)}
                          disabled={updatingWhatsapp === store.id}
                          className={`inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-xs font-bold transition-colors disabled:opacity-50 ${store.whatsapp_module?.free_access_enabled ? 'border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20' : 'border border-violet-500/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20'}`}
                        >
                          {updatingWhatsapp === store.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />}
                          {store.whatsapp_module?.free_access_enabled ? 'Encerrar cortesia' : 'Liberar grátis'}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDelete(store.id)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          title="Excluir Loja"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <h2 className="text-lg font-bold text-white">Dados dos Criadores</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="text-xs uppercase bg-slate-900 text-slate-500 border-b border-slate-800">
              <tr>
                <th scope="col" className="px-6 py-4">Loja Vinculada</th>
                <th scope="col" className="px-6 py-4">WhatsApp (Lead)</th>
                <th scope="col" className="px-6 py-4">Data de Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                    Carregando dados...
                  </td>
                </tr>
              ) : errorMsg ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-red-500">
                    <p className="font-bold">Erro ao carregar dados:</p>
                    <p className="text-sm">{errorMsg}</p>
                  </td>
                </tr>
              ) : stores.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                    Nenhum criador encontrado.
                  </td>
                </tr>
              ) : (
                stores.map((store) => (
                  <tr key={`creator-${store.id}`} className="border-b border-slate-800 hover:bg-slate-900/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">{store.nome_loja}</div>
                    </td>
                    <td className="px-6 py-4">
                      {store.whatsapp ? (
                        <a 
                          href={`https://wa.me/${store.whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-green-400 hover:text-green-300 font-medium bg-green-400/10 px-2 py-1 rounded transition-colors"
                        >
                          {store.whatsapp}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-600 italic">Não informado</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-300">
                        {new Date(store.created_at).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(store.created_at).toLocaleTimeString('pt-BR')}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
