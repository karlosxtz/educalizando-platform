'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Download, AlertCircle, Loader2, ArrowLeft, Sparkles, Plus, Eye, X, FileText, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import Sidebar from '@/components/dashboard/Sidebar';

interface PLRItem {
  id: string;
  orderId: string;
  productTitle: string;
  description: string;
  productType: string;
  pageCount: number | null;
  ageRange: string | null;
  formatDetails: string | null;
  productId: string;
  paidAt: string;
  amount: number;
  coverUrl: string | null;
  galleryUrls: string[];
  storeName: string;
  hasPlrFile: boolean;
}

export default function PLRsCompradosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PLRItem[]>([]);
  const [error, setError] = useState('');
  const [selectedItem, setSelectedItem] = useState<PLRItem | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const openDetails = (item: PLRItem) => {
    setSelectedItem(item);
    setSelectedImageIndex(0);
  };
  const selectedImages = selectedItem
    ? Array.from(new Set([selectedItem.coverUrl, ...(selectedItem.galleryUrls || [])].filter((url): url is string => Boolean(url))))
    : [];
  const selectedImage = selectedImages[selectedImageIndex] || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=500&auto=format&fit=crop&q=80';

  useEffect(() => {
    async function fetchPLRs() {
      try {
        const response = await fetch('/api/plr/purchases');
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        const data = await response.json();
        if (response.status === 403) {
          setError(data.error || 'Este módulo é exclusivo para contas de criador.');
          return;
        }
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
              Suas licenças PLR pagas no Mercado de PLR. Os arquivos ficam disponíveis somente para a conta criadora que realizou a compra.
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
            <h3 className="text-lg font-bold text-slate-900 mb-2">Você ainda não adquiriu nenhum arquivo PLR</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
              Quando você comprar uma licença no Mercado de PLR, ela aparecerá aqui automaticamente com o acesso aos arquivos.
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
                <button
                  type="button"
                  onClick={() => openDetails(item)}
                  className="aspect-[4/3] bg-slate-100 relative overflow-hidden text-left focus:outline-none focus:ring-4 focus:ring-blue-200"
                  aria-label={`Ver detalhes de ${item.productTitle}`}
                >
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
                  <div className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-center gap-2 bg-slate-950/75 px-4 py-3 text-xs font-black text-white transition-transform duration-200 group-hover:translate-y-0">
                    <Eye className="h-4 w-4" /> Ver detalhes do PLR
                  </div>
                </button>
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Vendido por {item.storeName}
                    </span>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                      Pago
                    </span>
                  </div>
                  <button type="button" onClick={() => openDetails(item)} className="mb-2 text-left text-sm font-bold leading-snug text-slate-900 line-clamp-2 hover:text-blue-700">
                    {item.productTitle}
                  </button>
                  <button type="button" onClick={() => openDetails(item)} className="mb-4 inline-flex w-fit items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900">
                    <Eye className="h-3.5 w-3.5" /> Ver informações do material
                  </button>
                  
                  <div className="mt-auto">
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                        <span className="bg-slate-200 text-slate-700 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">1</span>
                        Arquivos da licença PLR
                      </div>

                      {item.hasPlrFile ? (
                        <a
                          href={`/api/aluno/materiais/${item.productId}/download?type=plr`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-bold transition-colors shadow-sm"
                        >
                          <Download className="w-4 h-4" />
                          Abrir arquivos PLR
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

      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/55 p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Detalhes do PLR">
          <button type="button" className="absolute inset-0 cursor-default" aria-label="Fechar detalhes" onClick={() => setSelectedItem(null)} />
          <section className="relative z-10 max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
            <div className="grid sm:grid-cols-[220px_1fr]">
              <div className="relative flex aspect-[4/3] flex-col bg-slate-100 p-3 sm:aspect-auto sm:min-h-full sm:p-4">
                <div className="flex min-h-0 flex-1 items-center justify-center">
                  <img src={selectedImage} alt={selectedItem.productTitle} className="max-h-full max-w-full rounded-xl object-contain shadow-sm" />
                </div>
                {selectedImages.length > 1 && (
                  <div className="mt-3 grid grid-cols-4 gap-2" aria-label="Outras imagens do material">
                    {selectedImages.map((imageUrl, index) => (
                      <button
                        key={imageUrl}
                        type="button"
                        onClick={() => setSelectedImageIndex(index)}
                        className={`aspect-square overflow-hidden rounded-lg border-2 bg-white transition ${index === selectedImageIndex ? 'border-blue-600 ring-2 ring-blue-200' : 'border-transparent hover:border-slate-300'}`}
                        aria-label={`Ver imagem ${index + 1} de ${selectedImages.length}`}
                      >
                        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
                <span className="absolute left-4 top-4 rounded-full bg-slate-950/80 px-3 py-1 text-[10px] font-black uppercase text-white">Licença PLR</span>
              </div>
              <div className="p-5 sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-blue-700">Detalhes do material adquirido</p>
                    <h2 className="mt-1 text-xl font-black text-slate-900">{selectedItem.productTitle}</h2>
                    <p className="mt-1 text-sm font-semibold text-slate-500">Vendido por {selectedItem.storeName}</p>
                  </div>
                  <button type="button" onClick={() => setSelectedItem(null)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100" aria-label="Fechar"><X className="h-5 w-5" /></button>
                </div>
                <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-slate-700">{selectedItem.description || 'O vendedor não adicionou uma descrição para este material.'}</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm"><FileText className="mb-1 h-4 w-4 text-blue-600" /><strong>Formato</strong><br /><span className="text-slate-600">{selectedItem.formatDetails || selectedItem.productType.toUpperCase()}</span></div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm"><GraduationCap className="mb-1 h-4 w-4 text-blue-600" /><strong>Indicação</strong><br /><span className="text-slate-600">{selectedItem.ageRange || (selectedItem.pageCount ? `${selectedItem.pageCount} páginas` : 'Conforme descrição')}</span></div>
                </div>
                <div className="mt-6 grid gap-2 sm:grid-cols-2">
                  <a href={`/api/aluno/materiais/${selectedItem.productId}/download?type=plr`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-amber-100 px-4 text-sm font-black text-amber-900 hover:bg-amber-200"><Download className="h-4 w-4" /> Abrir arquivos PLR</a>
                  <Link href={`/dashboard/produtos/novo?licenca-plr=${encodeURIComponent(selectedItem.productId)}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white hover:bg-blue-700"><Plus className="h-4 w-4" /> Publicar na minha loja</Link>
                </div>
                <p className="mt-4 text-xs leading-relaxed text-amber-800">Ao publicar, altere título, descrição e capa para criar a sua própria versão e evitar conflito com o material original.</p>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
