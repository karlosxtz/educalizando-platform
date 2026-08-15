"use client";

import { useEffect, useState } from 'react';
import { Package, Trash2, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface ProductData {
  id: string;
  titulo: string;
  tipo: string;
  preco: number;
  status: string;
  created_at: string;
  store: {
    nome_loja: string;
    slug: string;
  };
}

export default function SuperAdminProdutos() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const res = await fetch('/api/admin/products');
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('ATENÇÃO: Excluir este produto apagará ele permanentemente da plataforma. Deseja prosseguir?')) return;
    
    try {
      const res = await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        alert('Produto excluído com sucesso.');
        fetchProducts();
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
        <h1 className="text-3xl font-bold tracking-tight text-white">Catálogo Global</h1>
        <p className="text-slate-400 mt-1">Monitore e modere todos os produtos ativos na plataforma.</p>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="text-xs uppercase bg-slate-900 text-slate-500 border-b border-slate-800">
              <tr>
                <th scope="col" className="px-6 py-4">Produto</th>
                <th scope="col" className="px-6 py-4">Loja</th>
                <th scope="col" className="px-6 py-4">Tipo</th>
                <th scope="col" className="px-6 py-4">Preço</th>
                <th scope="col" className="px-6 py-4">Status</th>
                <th scope="col" className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Carregando catálogo...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Nenhum produto cadastrado.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="border-b border-slate-800/50 hover:bg-slate-900/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-200">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0">
                          <Package className="w-4 h-4" />
                        </div>
                        <span className="line-clamp-1 max-w-xs" title={product.titulo}>{product.titulo}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {product.store?.nome_loja}
                    </td>
                    <td className="px-6 py-4 uppercase text-xs">
                      {product.tipo}
                    </td>
                    <td className="px-6 py-4 text-emerald-400 font-medium">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.preco)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        product.status === 'publicado' ? 'bg-emerald-500/10 text-emerald-500' : 
                        product.status === 'excluido' ? 'bg-red-500/10 text-red-500' :
                        'bg-amber-500/10 text-amber-500'
                      }`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-3 whitespace-nowrap">
                      <Link 
                        href={`/loja/${product.store?.slug}/produto/${product.id}`}
                        target="_blank"
                        className="text-blue-500 hover:text-blue-400 inline-flex items-center gap-1"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span className="hidden sm:inline">Ver</span>
                      </Link>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className="text-red-500 hover:text-red-400 inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Excluir</span>
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
