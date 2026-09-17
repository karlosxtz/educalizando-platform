'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Download, AlertCircle, Loader2, ArrowLeft, Sparkles, Plus, Info } from 'lucide-react';
import Link from 'next/link';
import Sidebar from '@/components/dashboard/Sidebar';

interface PLRItem {
  id: string;
  orderId: string;
  productTitle: string;
  productId: string;
  paidAt: string;
  amount: number;
  coverUrl: string | null;
  storeName: string;
  hasOriginalFile: boolean;
  hasPlrFile: boolean;
}

export default function PLRsCompradosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PLRItem[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchPLRs() {
      try {
        const response = await fetch('/api/plr/purchases');
        if (response.status === 401 || response.status === 403) {
          router.push('/login');
          return;
        }
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setItems(data.items || []);
      } catch (err: any) {
        console.error(err);
        setError('Não foi possível carregar suas licenças PLR.');
      } finally {
        setLoading(false);
      }
    }

    fetchPLRs();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <main className="flex-1 max-w-7xl mx-auto p-4 sm:p-8">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/dashboard/plr" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 mb-2 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Voltar ao Mercado
            </Link>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <Package className="w-7 h-7 text-blue-600" />
              PLRs Comprados
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Todos os produtos com licença de revenda que você adquiriu.
            </p>

            <div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-2xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles className="w-24 h-24 text-indigo-600" />
              </div>
              <h2 className="text-indigo-900 font-black mb-2 flex items-center gap-2 relative z-10 text-base">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                Meus Direitos de Revenda (PLR)
              </h2>
              <p className="text-sm text-indigo-800 leading-relaxed max-w-3xl relative z-10">
                Para maximizar suas vendas e evitar concorrência direta, recomendamos fortemente que você crie uma nova capa e altere o título do produto antes de publicá-lo na sua loja.
              </p>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm font-semibold">{error}</span>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">Nenhum PLR comprado ainda</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
              Você ainda não adquiriu nenhuma licença de revenda no Mercado de PLR.
            </p>
            <Link 
              href="/dashboard/plr"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-blue-600/20"
            >
              Explorar Mercado de PLR
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div key={item.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex flex-col group hover:shadow-md transition-all">
                <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                  <img 
                    src={item.coverUrl || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=300&auto=format&fit=crop&q=80'}
                    alt={item.productTitle}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-lg border border-white/10">
                      Licença PLR
                    </span>
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Vendido por {item.storeName}
                    </span>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                      Pago
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 line-clamp-2 mb-4 leading-snug">
                    {item.productTitle}
                  </h3>
                  
                  <div className="mt-auto">
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                        <span className="bg-slate-200 text-slate-700 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">1</span>
                        Baixar Original
                      </div>
                      
                      {item.hasOriginalFile ? (
                        <a 
                          href={`/api/aluno/materiais/${item.productId}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full flex items-center justify-center gap-2 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition-colors shadow-sm"
                        >
                          <Download className="w-4 h-4" />
                          Baixar Produto Final
                        </a>
                      ) : (
                        <button disabled className="w-full flex items-center justify-center gap-2 py-2 bg-slate-100 text-slate-400 border border-slate-200 rounded-lg text-xs font-bold cursor-not-allowed">
                          Arquivo Indisponível
                        </button>
                      )}

                      {item.hasPlrFile ? (
                        <a
                          href={`/api/aluno/materiais/${item.productId}/download?type=plr`}
                          className="w-full flex items-center justify-center gap-2 py-2 bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-bold transition-colors shadow-sm"
                        >
                          <Download className="w-4 h-4" />
                          Baixar Licença / Arquivos PLR
                        </a>
                      ) : (
                        <button disabled className="w-full py-2 bg-slate-100 text-slate-400 border border-slate-200 rounded-lg text-xs font-bold cursor-not-allowed">
                          Arquivo PLR indisponível
                        </button>
                      )}

                      <div className="h-px bg-slate-200 w-full my-2"></div>

                      <div className="flex items-center justify-between gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">
                        <div className="flex items-center gap-2">
                          <span className="bg-blue-200 text-blue-800 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">2</span>
                          Revender
                        </div>
                        <div className="group relative cursor-help">
                          <Info className="w-4 h-4 text-blue-400" />
                          <div className="absolute bottom-full right-0 mb-2 w-48 bg-slate-800 text-white text-[10px] p-2 rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 text-center leading-relaxed">
                            Lembre-se de personalizar o título e a capa!
                          </div>
                        </div>
                      </div>

                      <Link 
                        href={`/dashboard/produtos/novo?licenca-plr=${encodeURIComponent(item.productId)}`}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-blue-600/20"
                      >
                        <Plus className="w-4 h-4" />
                        Publicar na Minha Loja
                      </Link>
                    </div>
                    <p className="text-[10px] text-center text-slate-400 mt-4 font-medium">
                      Pedido #{item.orderId.split('_').pop()?.toUpperCase()} • {new Date(item.paidAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
