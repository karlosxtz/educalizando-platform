"use client";

import { useEffect, useState } from 'react';
import { Store, Trash2, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface StoreData {
  id: string;
  nome_loja: string;
  slug: string;
  created_at: string;
  products: { count: number }[];
  withdrawals: { count: number }[];
}

export default function SuperAdminLojas() {
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStores();
  }, []);

  async function fetchStores() {
    try {
      const res = await fetch('/api/admin/stores');
      const data = await res.json();
      if (data.success) {
        setStores(data.stores);
      }
    } catch (e) {
      console.error(e);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Lojas & Criadores</h1>
        <p className="text-slate-400 mt-1">Gerencie todos os lojistas cadastrados na plataforma.</p>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="text-xs uppercase bg-slate-900 text-slate-500 border-b border-slate-800">
              <tr>
                <th scope="col" className="px-6 py-4">Nome da Loja</th>
                <th scope="col" className="px-6 py-4">Slug</th>
                <th scope="col" className="px-6 py-4">Produtos</th>
                <th scope="col" className="px-6 py-4">Cadastro</th>
                <th scope="col" className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Carregando lojas...
                  </td>
                </tr>
              ) : stores.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Nenhuma loja encontrada na plataforma.
                  </td>
                </tr>
              ) : (
                stores.map((store) => (
                  <tr key={store.id} className="border-b border-slate-800/50 hover:bg-slate-900/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-200">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center text-blue-500">
                          <Store className="w-4 h-4" />
                        </div>
                        {store.nome_loja}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                      /{store.slug}
                    </td>
                    <td className="px-6 py-4">
                      {store.products?.[0]?.count || 0}
                    </td>
                    <td className="px-6 py-4">
                      {new Date(store.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <Link 
                        href={`/loja/${store.slug}`}
                        target="_blank"
                        className="text-blue-500 hover:text-blue-400 inline-flex items-center gap-1"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span className="hidden sm:inline">Visitar</span>
                      </Link>
                      <button 
                        onClick={() => handleDelete(store.id)}
                        className="text-red-500 hover:text-red-400 inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Banir</span>
                      </button>
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
