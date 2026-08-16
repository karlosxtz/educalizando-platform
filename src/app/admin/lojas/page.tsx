"use client";

import { useEffect, useState } from 'react';
import { Store, Trash2, ExternalLink, LogIn, Package } from 'lucide-react';
import Link from 'next/link';

interface StoreData {
  id: string;
  nome_loja: string;
  slug: string;
  whatsapp?: string;
  created_at: string;
  products: { count: number }[];
  withdrawals: { count: number }[];
}

export default function SuperAdminLojas() {
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
    if (!confirm('ATENÇÃO: Excluir esta loja apagará TODOS os produtos, kits e histórico vinculados a ela. Tem certeza absoluta?')) return;
    
    try {
      const res = await fetch(`/api/admin/stores?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        alert('Loja excluída com sucesso.');
        fetchStores();
      } else {
        alert('Erro ao excluir: ' + data.error);
      }
    } catch (e) {
      alert('Erro inesperado.');
    }
  }

  async function handleImpersonate(storeId: string, storeName: string) {
    if (!confirm(`Deseja entrar no painel da loja "${storeName}" como se fosse o dono?`)) return;

    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId }),
      });
      const data = await res.json();
      
      if (data.success && data.url) {
        // Redireciona o Admin para o Magic Link, que vai logá-lo como o usuário e abrir a dashboard
        window.open(data.url, '_blank');
      } else {
        alert('Erro ao logar como criador: ' + (data.error || 'Erro desconhecido.'));
      }
    } catch (e) {
      alert('Erro inesperado ao conectar com a API.');
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
                <th scope="col" className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p>Carregando lojas...</p>
                    </div>
                  </td>
                </tr>
              ) : errorMsg ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-red-500">
                    <p className="font-bold">Erro ao carregar lojas:</p>
                    <p className="text-sm">{errorMsg}</p>
                  </td>
                </tr>
              ) : stores.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
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
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleImpersonate(store.id, store.nome_loja)}
                          className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors group relative"
                          title="Logar como este Criador"
                        >
                          <LogIn className="w-5 h-5" />
                        </button>
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
