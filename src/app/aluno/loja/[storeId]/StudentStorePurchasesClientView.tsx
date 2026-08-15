'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, BookOpen, FileText, Video, Layers, 
  HelpCircle, Boxes, ShieldCheck, ArrowRight, Loader2, AlertCircle, ChevronRight, Store as StoreIcon, Download 
} from 'lucide-react';

import { toast } from 'sonner';

import { getCurrentStudentSession, getStudentPurchasesByStoreId } from '@/lib/student-service';
import { getStudentReviewsByStore } from '@/lib/review-service';
import { Purchase, ProductType, Store, Review } from '@/lib/types';
import StudentHeader from '@/components/aluno/StudentHeader';
import StudentReviewModal from '@/components/StudentReviewModal';
import { Star } from 'lucide-react';

interface StudentStorePurchasesClientViewProps {
  storeId: string;
}

export default function StudentStorePurchasesClientView({ storeId }: StudentStorePurchasesClientViewProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [studentSession, setStudentSession] = useState<{ id: string; email: string; fullName: string } | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  
  const [reviewTarget, setReviewTarget] = useState<{ productId: string; storeId: string; } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const session = await getCurrentStudentSession();
        if (!session) {
          router.push('/aluno/login');
          return;
        }
        setStudentSession(session);

        const data = await getStudentPurchasesByStoreId(session.id, storeId);
        setStore(data.store);
        setPurchases(data.purchases);
        
        const revs = await getStudentReviewsByStore(session.id, storeId);
        setMyReviews(revs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [storeId, router]);

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const downloadSingleProduct = async (productId: string, title: string) => {
    // Usar navegação direta para aproveitar o redirect do backend e evitar proxy em memória
    const downloadUrl = `/api/aluno/materiais/${productId}/download`;
    
    // window.location.assign evita bloqueadores de popup (já que a chamada é async)
    // e permite que o browser resolva o Content-Disposition: attachment nativamente
    window.location.assign(downloadUrl);
  };

  const handleDownloadPurchase = async (pur: Purchase, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const targetId = pur.product_id || pur.id;
    console.log("### BOTÃO DOWNLOAD CLICADO ###");
    console.log("DOWNLOAD MATERIAL:", targetId);
    console.log("CURRENT URL:", window.location.href);

    setDownloadingId(pur.id);

    try {
      if (pur.product_id) {
        await downloadSingleProduct(pur.product_id, pur.product?.titulo || 'Material_Didatico');
      } else if (pur.kit?.products && pur.kit.products.length > 0) {
        for (const prod of pur.kit.products) {
          await downloadSingleProduct(prod.id, prod.titulo || 'Material_Kit');
        }
      } else {
        await downloadSingleProduct(pur.id, pur.kit?.titulo || 'Material_Didatico');
      }
      
      const targetProductId = pur.product_id || pur.id;
      const existingReview = myReviews.find(r => r.product_id === targetProductId);
      
      if (!existingReview) {
        toast('Já baixou? Que tal avaliar este material?', {
          action: {
            label: 'Avaliar agora',
            onClick: () => setReviewTarget({ productId: targetProductId, storeId })
          },
          duration: 8000,
          icon: '⭐'
        });
      } else {
        toast.success('Download iniciado!');
      }
    } catch (err: any) {
      console.error('[Download Error]:', err);
      toast.error('Não foi possível baixar o material agora. Tente novamente em instantes.', {
        action: {
          label: 'Tentar novamente',
          onClick: () => handleDownloadPurchase(pur, e as any)
        }
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleReviewSuccess = (newRating: number, newComment: string) => {
    if (!reviewTarget) return;
    setMyReviews(prev => {
      const idx = prev.findIndex(r => r.product_id === reviewTarget.productId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], nota: newRating, comentario: newComment };
        return copy;
      } else {
        return [...prev, {
          id: `tmp_${Date.now()}`,
          product_id: reviewTarget.productId,
          store_id: reviewTarget.storeId,
          student_id: studentSession!.id,
          nota: newRating,
          comentario: newComment,
          created_at: new Date().toISOString()
        }];
      }
    });
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
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const primaryColor = store?.cor_primaria || '#2563eb';
  const storeName = store?.nome_loja || 'Loja do Criador';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Student Navigation Header */}
      <StudentHeader
        studentName={studentSession?.fullName}
        studentEmail={studentSession?.email}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <Link href="/aluno/dashboard" className="hover:text-blue-600 transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Minhas Lojas</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-900 truncate">{storeName}</span>
        </nav>

        {/* Store Branded Identity Header Card */}
        <div 
          className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6"
          style={{ '--store-primary': primaryColor } as React.CSSProperties}
        >
          {/* Decorative Primary Color Top Accent Bar */}
          <div className="absolute top-0 left-0 right-0 h-2" style={{ backgroundColor: primaryColor }} />

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl p-1 bg-white border-2 border-slate-100 shadow-md flex-shrink-0 relative overflow-hidden flex items-center justify-center">
              {store?.logo_url ? (
                <img src={store.logo_url} alt={storeName} className="w-full h-full rounded-xl object-cover" />
              ) : (
                <div 
                  className="w-full h-full rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-inner"
                  style={{ backgroundColor: primaryColor }}
                >
                  {storeName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block">
                Espaço Exclusivo da Loja
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {storeName}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Seus materiais contratados exclusivamente nesta loja ({purchases.length} {purchases.length === 1 ? 'item' : 'itens'})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/loja/${store?.slug || ''}`}
              target="_blank"
              className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl border border-slate-200 transition-all flex items-center gap-1.5"
            >
              <StoreIcon className="w-4 h-4 text-blue-600" />
              <span>Visitar Vitrine Pública</span>
            </Link>
          </div>
        </div>

        {/* Store's Purchased Products & Kits Grid */}
        {purchases.length === 0 ? (
          <div className="bg-white p-12 sm:p-16 rounded-3xl border border-slate-200 shadow-sm text-center max-w-lg mx-auto space-y-5 my-8">
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-500 border border-slate-200 flex items-center justify-center mx-auto shadow-inner">
              <BookOpen className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-900">
                Nenhum material encontrado nesta loja
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed font-medium">
                Você ainda não possui apostilas ou e-books adquiridos especificamente na {storeName}.
              </p>
            </div>

            <Link
              href="/aluno/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar para Minhas Lojas
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {purchases.map((pur) => {
              const itemTitle = pur.product?.titulo || pur.kit?.titulo || 'Material Didático';
              const itemCover = pur.product?.capa_url || pur.kit?.capa_url || null;
              const isKit = Boolean(pur.kit_id);

              return (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={pur.id}
                  className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group flex flex-col justify-between"
                >
                  <div className="p-5 space-y-4">
                    {/* Item Cover */}
                    <div className="aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-100 relative shadow-inner">
                      {itemCover ? (
                        <img src={itemCover} alt={itemTitle} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs font-semibold p-4 text-center bg-gradient-to-tr from-slate-900 to-slate-800 text-white">
                          {isKit ? <Boxes className="w-8 h-8 text-blue-400 mb-1" /> : <BookOpen className="w-8 h-8 text-blue-400 mb-1" />}
                          <span>{itemTitle}</span>
                        </div>
                      )}

                      {/* Content Type Badge */}
                      <span className="absolute top-3 left-3 bg-slate-900/90 text-white text-[10px] font-extrabold px-3 py-1 rounded-xl uppercase shadow-md backdrop-blur-xs flex items-center gap-1.5 border border-white/20">
                        {isKit ? (
                          <>
                            <Boxes className="w-3.5 h-3.5 text-blue-400" />
                            <span>COMBO ({pur.kit?.products?.length || 0} ITENS)</span>
                          </>
                        ) : (
                          <>
                            {getTipoIcon(pur.product?.tipo)}
                            <span>{pur.product?.tipo}</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-black text-slate-900 text-base sm:text-lg group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                        {itemTitle}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1 font-medium">
                        {pur.product?.descricao || pur.kit?.descricao || 'Material didático digital.'}
                      </p>
                    </div>
                  </div>

                  {/* Direct Download Action Footer */}
                  <div className="p-5 pt-3 border-t border-slate-100 bg-slate-50/60 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4" /> Acesso Liberado
                      </span>

                      <button
                        type="button"
                        onClick={(e) => handleDownloadPurchase(pur, e)}
                        disabled={downloadingId === pur.id}
                        className="px-4 py-2.5 rounded-xl font-extrabold text-xs text-white shadow-md transition-all flex items-center gap-1.5 hover:brightness-110 active:scale-95 cursor-pointer disabled:opacity-50"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {downloadingId === pur.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        <span>{downloadingId === pur.id ? 'Baixando...' : 'Acessar Material'}</span>
                      </button>
                    </div>
                    
                    {/* Botão Avaliar */}
                    <div className="pt-2 border-t border-slate-200/50">
                      {(() => {
                        const existingReview = myReviews.find(r => r.product_id === (pur.product_id || pur.id));
                        return (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setReviewTarget({ productId: pur.product_id || pur.id, storeId });
                            }}
                            className={`w-full py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 ${
                              existingReview 
                                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200' 
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                            }`}
                          >
                            <Star className={`w-3.5 h-3.5 ${existingReview ? 'fill-amber-500 text-amber-500' : ''}`} />
                            {existingReview ? 'Minha Avaliação' : 'Avaliar'}
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {reviewTarget && studentSession && (
        <StudentReviewModal
          isOpen={!!reviewTarget}
          onClose={() => setReviewTarget(null)}
          productId={reviewTarget.productId}
          storeId={reviewTarget.storeId}
          studentId={studentSession.id}
          initialRating={myReviews.find(r => r.product_id === reviewTarget.productId)?.nota || 0}
          initialComment={myReviews.find(r => r.product_id === reviewTarget.productId)?.comentario || ''}
          onSuccess={handleReviewSuccess}
        />
      )}
    </div>
  );
}
