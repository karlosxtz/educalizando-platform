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

      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="text-xs uppercase bg-slate-900 text-slate-500 border-b border-slate-800">
              <tr>
                <th scope="col" className="px-6 py-4">Nome da Loja</th>
                <th scope="col" className="px-6 py-4">Slug (URL)</th>
                <th scope="col" className="px-6 py-4">WhatsApp (Lead)</th>
                <th scope="col" className="px-6 py-4">Produtos</th>
                <th scope="col" className="px-6 py-4">Cadastro</th>
                <th scope="col" className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Carregando lojas...
                  </td>
                </tr>
              ) : stores.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Nenhuma loja encontrada.
                  </td>
                </tr>
              ) : (
                stores.map((store) => (
                  <tr key={store.id} className="border-b border-slate-800 hover:bg-slate-900/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-200">{store.nome_loja}</div>
                      <div className="text-xs text-slate-500">ID: {store.id.split('-')[0]}...</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-blue-400">
                      /{store.slug}
                    </td>
                    <td className="px-6 py-4">
                      {store.whatsapp ? (
                        <a 
                          href={`https://wa.me/${store.whatsapp.replace(/\D/g, '')}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#25D366]/10 text-[#25D366] rounded-full text-xs font-bold hover:bg-[#25D366]/20 transition-colors"
                        >
                          {store.whatsapp}
                        </a>
                      ) : (
                        <span className="text-slate-600 text-xs italic">Não informado</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Package className="w-4 h-4 text-slate-500" />
                        <span>{store.products?.[0]?.count || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {new Date(store.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleImpersonate(store.id, store.nome_loja)}
                          className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                          title="Entrar na conta deste criador"
                        >
                          <LogIn className="w-4 h-4" /> Entrar
                        </button>
                        <Link
                          href={`/loja/${store.slug}`}
                          target="_blank"
                          className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                          title="Ver Loja Pública"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(store.id)}
                          className="p-2 text-rose-500 hover:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors"
                          title="Excluir Loja"
                        >
                          <Trash2 className="w-4 h-4" />
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
    </div>
  );
}
