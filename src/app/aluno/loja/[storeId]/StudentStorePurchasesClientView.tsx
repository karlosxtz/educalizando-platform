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
  const [studentSession, setStudentSession] = useState<{ id: string; email: string; fullName: string; avatarUrl?: string } | null>(null);
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

  const downloadSingleProduct = async (productId: string, title: string, type?: 'plr') => {
    // Usar navegação direta para aproveitar o redirect do backend e evitar proxy em memória
    const downloadUrl = `/api/aluno/materiais/${productId}/download${type === 'plr' ? '?type=plr' : ''}`;
    
    // window.location.assign evita bloqueadores de popup (já que a chamada é async)
    // e permite que o browser resolva o Content-Disposition: attachment nativamente
    window.location.assign(downloadUrl);
  };

  const handleDownloadPurchase = async (pur: Purchase, e: React.MouseEvent, type?: 'plr') => {
    e.preventDefault();
    e.stopPropagation();

    const targetId = pur.product_id || pur.id;
    const downloadActionId = type === 'plr' ? `${pur.id}-plr` : pur.id;
    console.log("### BOTÃO DOWNLOAD CLICADO ###");
    console.log("DOWNLOAD MATERIAL:", targetId, type || 'default');
    console.log("CURRENT URL:", window.location.href);

    setDownloadingId(downloadActionId);

    try {
      if (pur.product_id) {
        await downloadSingleProduct(pur.product_id, pur.product?.titulo || 'Material_Didatico', type);
      } else if (pur.kit?.products && pur.kit.products.length > 0) {
        for (const prod of pur.kit.products) {
          await downloadSingleProduct(prod.id, prod.titulo || 'Material_Kit', type);
        }
      } else {
        await downloadSingleProduct(pur.id, pur.kit?.titulo || 'Material_Didatico', type);
      }
      
      const targetProductId = pur.product_id || pur.id;
      const existingReview = myReviews.find(r => r.product_id === targetProductId);
      
      if (!existingReview && type !== 'plr') {
        toast('Já baixou? Que tal avaliar este material?', {
          action: {
            label: 'Avaliar agora',
            onClick: () => setReviewTarget({ productId: targetProductId, storeId })
          },
          duration: 8000,
          icon: '⭐'
        });
      } else {
        toast.success(type === 'plr' ? 'Download da Licença PLR iniciado!' : 'Download iniciado!');
      }
    } catch (err: any) {
      console.error('[Download Error]:', err);
      toast.error('Não foi possível baixar o material agora. Tente novamente em instantes.', {
        action: {
          label: 'Tentar novamente',
          onClick: () => handleDownloadPurchase(pur, e as any, type)
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
        studentAvatarUrl={studentSession?.avatarUrl}
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
                Minha Biblioteca
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Meus Materiais — {storeName}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Aqui estão todos os materiais didáticos que você adquiriu. Baixe quando precisar.
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
                Nenhum material adquirido ainda
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed font-medium">
                Você ainda não possui apostilas ou e-books adquiridos nesta biblioteca. Explore a vitrine para adicionar novos materiais à sua estante.
              </p>
            </div>

            <Link
              href={`/loja/${store?.slug || ''}`}
              target="_blank"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white shadow-md transition-all active:scale-95"
              style={{ backgroundColor: primaryColor }}
            >
              <StoreIcon className="w-4 h-4" /> Explorar Loja
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {purchases.map((pur) => {
              const itemTitle = pur.product?.titulo || pur.kit?.titulo || 'Material Didático';
              const itemCover = pur.product?.capa_url || pur.kit?.capa_url || null;
              const isKit = Boolean(pur.kit_id);

              return (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={pur.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
                >
                  <div className="flex flex-col">
                    {/* Item Cover */}
                    <div className="aspect-[3/4] w-full bg-slate-100 relative overflow-hidden">
                      {itemCover ? (
                        <img src={itemCover} alt={itemTitle} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs font-semibold p-4 text-center bg-gradient-to-br from-slate-50 to-slate-100">
                          {isKit ? <Boxes className="w-10 h-10 text-slate-300 mb-2" /> : <BookOpen className="w-10 h-10 text-slate-300 mb-2" />}
                        </div>
                      )}

                      {/* Content Type Badge */}
                      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-slate-800 text-[10px] font-extrabold px-3 py-1.5 rounded-full uppercase shadow-sm flex items-center gap-1.5 border border-white/50">
                        {isKit ? (
                          <>
                            <Boxes className="w-3.5 h-3.5 text-blue-600" />
                            <span>Combo ({pur.kit?.products?.length || 0})</span>
                          </>
                        ) : (
                          <>
                            {getTipoIcon(pur.product?.tipo)}
                            <span>{pur.product?.tipo || 'Arquivo'}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="p-4 space-y-1">
                      <h3 className="font-bold text-slate-800 text-base line-clamp-2 leading-snug">
                        {itemTitle}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                        {storeName}
                      </p>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-4 pt-0 mt-auto flex flex-col gap-2">
                    {/* Botão de Avaliação (Discreto) */}
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
                          className={`w-full py-1.5 rounded-lg text-[11px] font-bold transition-colors flex items-center justify-center gap-1.5 ${
                            existingReview 
                              ? 'text-amber-600 hover:bg-amber-50' 
                              : 'text-slate-400 hover:bg-slate-50'
                          }`}
                        >
                          <Star className={`w-3.5 h-3.5 ${existingReview ? 'fill-amber-500 text-amber-500' : ''}`} />
                          {existingReview ? 'Sua Avaliação' : 'Avaliar Material'}
                        </button>
                      );
                    })()}

                    {/* Download Action */}
                    <div className="flex gap-2">
                      {pur.is_plr_purchase && pur.product?.plr_license_url && (
                        <button
                          type="button"
                          onClick={(e) => handleDownloadPurchase(pur, e, 'plr')}
                          disabled={downloadingId === `${pur.id}-plr`}
                          className="w-1/3 py-3 rounded-xl font-bold text-xs text-amber-700 bg-amber-100 transition-all flex justify-center items-center gap-1.5 hover:bg-amber-200 active:scale-95 disabled:opacity-50"
                        >
                          {downloadingId === `${pur.id}-plr` ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <FileText className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      
                      <button
                        type="button"
                        onClick={(e) => handleDownloadPurchase(pur, e)}
                        disabled={downloadingId === pur.id}
                        className="flex-1 py-3 rounded-xl font-bold text-sm text-white shadow-sm transition-all flex justify-center items-center gap-2 hover:brightness-110 active:scale-95 disabled:opacity-50 w-full"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {downloadingId === pur.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        <span>{downloadingId === pur.id ? 'Baixando...' : 'Baixar Arquivo'}</span>
                      </button>
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
