'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, BookOpen, FileText, Video, Layers, 
  HelpCircle, Sparkles, Loader2, Gift, Download, ExternalLink, Store as StoreIcon
} from 'lucide-react';
import { toast } from 'sonner';

import { getCurrentStudentSession } from '@/lib/student-service';
import { getAllFreeProducts } from '@/lib/store-service';
import { Product, Store, ProductType } from '@/lib/types';
import StudentHeader from '@/components/aluno/StudentHeader';

export default function StudentFreeProductsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [studentSession, setStudentSession] = useState<{ id: string; email: string; fullName: string; avatarUrl?: string } | null>(null);
  const [freeProducts, setFreeProducts] = useState<(Product & { store?: Store })[]>([]);
  
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const session = await getCurrentStudentSession();
        if (!session) {
          router.push('/aluno/login');
          return;
        }
        setStudentSession(session);

        const products = await getAllFreeProducts();
        setFreeProducts(products);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  const downloadSingleProduct = async (productId: string) => {
    const downloadUrl = `/api/aluno/materiais/${productId}/download`;
    window.location.assign(downloadUrl);
  };

  const handleDownloadPurchase = async (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setDownloadingId(product.id);

    try {
      await downloadSingleProduct(product.id);
      toast.success('Download do brinde iniciado!');
    } catch (err: any) {
      console.error('[Download Error]:', err);
      toast.error('Não foi possível baixar o material agora. Tente novamente em instantes.');
    } finally {
      setDownloadingId(null);
    }
  };

  const getTipoIcon = (tipo?: ProductType) => {
    switch (tipo) {
      case 'pdf': return <FileText className="w-3.5 h-3.5 text-sky-600" />;
      case 'ebook': return <BookOpen className="w-3.5 h-3.5 text-indigo-600" />;
      case 'video': return <Video className="w-3.5 h-3.5 text-purple-600" />;
      case 'curso': return <Layers className="w-3.5 h-3.5 text-blue-600" />;
      case 'simulado': return <HelpCircle className="w-3.5 h-3.5 text-amber-600" />;
      default: return <BookOpen className="w-3.5 h-3.5 text-blue-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-teal animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-brand-teal selection:text-white">
      <StudentHeader
        studentName={studentSession?.fullName}
        studentEmail={studentSession?.email}
        studentAvatarUrl={studentSession?.avatarUrl}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <Link href="/aluno/dashboard" className="hover:text-brand-teal transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar para Minhas Lojas</span>
          </Link>
        </nav>

        {/* Identity Header Card */}
        <div 
          className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
          {/* Decorative Primary Color Top Accent Bar */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-brand-teal" />

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl p-1 bg-teal-50 border-2 border-teal-100 shadow-md flex-shrink-0 relative overflow-hidden flex items-center justify-center text-teal-600">
              <Gift className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-extrabold uppercase tracking-wider text-teal-500 block">
                Materiais Gratuitos
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Meus Brindes <span className="text-2xl">🎁</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Materiais gratuitos liberados para você baixar a qualquer momento.
              </p>
            </div>
          </div>
        </div>

        {/* Store's Free Products Grid */}
        {freeProducts.length === 0 ? (
          <div className="bg-white p-12 sm:p-16 rounded-3xl border border-slate-200 shadow-sm text-center max-w-lg mx-auto space-y-5 my-8">
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-500 border border-slate-200 flex items-center justify-center mx-auto shadow-inner">
              <Gift className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-900">
                Nenhum brinde disponível
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed font-medium">
                No momento, não há nenhum material gratuito disponibilizado. Fique de olho, os criadores sempre liberam novos brindes.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {freeProducts.map((product) => {
              const itemTitle = product.titulo || 'Material Didático';
              const itemCover = product.capa_url || null;
              const storeName = product.store?.nome_loja || 'Loja do Criador';

              return (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={product.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
                >
                  <div className="flex flex-col">
                    {/* Item Cover */}
                    <div className="aspect-[3/4] w-full bg-slate-100 relative overflow-hidden">
                      {itemCover ? (
                        <img src={itemCover} alt={itemTitle} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs font-semibold p-4 text-center bg-gradient-to-br from-slate-50 to-slate-100">
                          <Gift className="w-10 h-10 text-slate-300 mb-2" />
                        </div>
                      )}

                      {/* Content Type Badge */}
                      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-slate-800 text-[10px] font-extrabold px-3 py-1.5 rounded-full uppercase shadow-sm flex items-center gap-1.5 border border-white/50">
                        {getTipoIcon(product.tipo)}
                        <span>{product.tipo || 'Arquivo'}</span>
                      </div>
                      
                      {/* Free Badge */}
                      <div className="absolute top-3 right-3 bg-brand-teal text-white text-[10px] font-black px-2.5 py-1.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Grátis
                      </div>
                    </div>

                    <div className="p-4 space-y-1">
                      <h3 className="font-bold text-slate-800 text-base line-clamp-2 leading-snug">
                        {itemTitle}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                        Por {storeName}
                      </p>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-4 pt-0 mt-auto flex flex-col gap-2">
                    {/* Download Action */}
                    <button
                      type="button"
                      onClick={(e) => handleDownloadPurchase(product, e)}
                      disabled={downloadingId === product.id}
                      className="w-full py-3 rounded-xl font-bold text-sm text-white shadow-sm transition-all flex justify-center items-center gap-2 bg-brand-teal hover:bg-teal-600 active:scale-95 disabled:opacity-50"
                    >
                      {downloadingId === product.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      <span>{downloadingId === product.id ? 'Baixando...' : 'Baixar Brinde'}</span>
                    </button>
                    
                    {product.store && (
                      <Link
                        href={`/loja/${product.store.slug}`}
                        target="_blank"
                        className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-600 py-2 rounded-xl font-bold text-[11px] transition-all border border-slate-200"
                      >
                        Acesse a loja desse criador <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
