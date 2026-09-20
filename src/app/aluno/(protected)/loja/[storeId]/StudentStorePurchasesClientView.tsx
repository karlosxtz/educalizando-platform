'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, BookOpen, FileText, Video, Layers, 
  HelpCircle, Boxes, ShieldCheck, ArrowRight, Loader2, AlertCircle, ChevronRight, Store as StoreIcon, Download, RotateCcw, X
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

interface RefundEligibility {
  orderId: string;
  productIds: string[];
  accessed: boolean;
  request: { id: string; status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'; review_note?: string | null } | null;
}

export default function StudentStorePurchasesClientView({ storeId }: StudentStorePurchasesClientViewProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [studentSession, setStudentSession] = useState<{ id: string; email: string; fullName: string; avatarUrl?: string } | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [materialSearch, setMaterialSearch] = useState('');
  const normalizeSearch = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const visiblePurchases = purchases.filter(purchase => normalizeSearch(purchase.product?.titulo || purchase.kit?.titulo || 'Material Didático').includes(normalizeSearch(materialSearch.trim())));
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [refundByOrderId, setRefundByOrderId] = useState<Record<string, RefundEligibility>>({});
  const [refundByProductId, setRefundByProductId] = useState<Record<string, RefundEligibility>>({});
  const [refundsLoaded, setRefundsLoaded] = useState(false);
  const [requestingRefundOrderId, setRequestingRefundOrderId] = useState<string | null>(null);
  const [refundModal, setRefundModal] = useState<{ orderId: string; eligibility: RefundEligibility } | null>(null);
  const [refundReason, setRefundReason] = useState('');
  
  const [reviewTarget, setReviewTarget] = useState<{ productId: string; storeId: string; } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const session = await getCurrentStudentSession();
        if (!session) {
          router.push('/cliente/login');
          return;
        }
        setStudentSession(session);

        const data = await getStudentPurchasesByStoreId(session.id, storeId);
        setStore(data.store);
        setPurchases(data.purchases);
        
        const revs = await getStudentReviewsByStore(session.id, storeId);
        setMyReviews(revs);

        const refundResponse = await fetch(`/api/aluno/reembolsos?storeId=${encodeURIComponent(storeId)}`);
        const refundPayload = await refundResponse.json().catch(() => ({}));
        if (refundResponse.ok && refundPayload.success) {
          const mapped = (refundPayload.eligibility as RefundEligibility[]).reduce<Record<string, RefundEligibility>>((result, item) => {
            result[item.orderId] = item;
            return result;
          }, {});
          setRefundByOrderId(mapped);
          const mappedByProduct = (refundPayload.eligibility as RefundEligibility[]).reduce<Record<string, RefundEligibility>>((result, item) => {
            item.productIds.forEach((productId) => { result[productId] = item; });
            return result;
          }, {});
          setRefundByProductId(mappedByProduct);
          setRefundsLoaded(true);
        } else {
          console.warn('[Refund eligibility]', refundPayload.error || 'Não foi possível consultar reembolsos.');
        }
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
    // O material deve abrir fora da biblioteca para o aluno não perder a tela atual.
    // A rota mantém a autorização e pode devolver tanto um arquivo quanto um redirect.
    const downloadUrl = `/api/aluno/materiais/${productId}/download${type === 'plr' ? '?type=plr' : ''}`;
    window.open(downloadUrl, '_blank', 'noopener,noreferrer');
  };

  const markMaterialAccessed = (pur: Purchase) => {
    const eligibility = pur.order_id
      ? refundByOrderId[pur.order_id]
      : (pur.product_id ? refundByProductId[pur.product_id] : undefined);
    if (!eligibility || eligibility.accessed) return;

    const accessedEligibility = { ...eligibility, accessed: true };
    setRefundByOrderId((previous) => ({ ...previous, [eligibility.orderId]: accessedEligibility }));
    setRefundByProductId((previous) => {
      const next = { ...previous };
      accessedEligibility.productIds.forEach((productId) => { next[productId] = accessedEligibility; });
      return next;
    });
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
      // Mesmo links externos passam pela API. Assim o acesso fica registrado
      // antes do redirecionamento e a regra de reembolso não pode ser burlada.
      if (pur.product_id) {
        await downloadSingleProduct(pur.product_id, pur.product?.titulo || 'Material_Didatico', type);
      } else if (pur.kit?.products && pur.kit.products.length > 0) {
        for (const prod of pur.kit.products) {
          await downloadSingleProduct(prod.id, prod.titulo || 'Material_Kit', type);
        }
      } else {
        await downloadSingleProduct(pur.id, pur.kit?.titulo || 'Material_Didatico', type);
      }

      // O endpoint registra o evento antes de redirecionar/entregar o arquivo.
      // Atualizamos a própria biblioteca no mesmo clique para que não exista uma
      // janela visual em que o material foi aberto, mas o reembolso ainda apareça.
      if (type !== 'plr') markMaterialAccessed(pur);
      
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

  const handleRefundRequest = async () => {
    const selectedRefund = refundModal;
    if (!selectedRefund) return;
    const { orderId, eligibility } = selectedRefund;
    if (!orderId || requestingRefundOrderId) return;
    if (eligibility?.accessed) {
      toast.error('Este pedido já teve material acessado ou baixado e não pode solicitar reembolso.');
      return;
    }
    if (eligibility?.request) {
      toast('Já existe uma solicitação para este pedido.');
      return;
    }

    const reason = refundReason.trim();
    if (reason.length < 10) {
      toast.error('Explique o motivo do reembolso com pelo menos 10 caracteres.');
      return;
    }
    setRequestingRefundOrderId(orderId);
    try {
      const response = await fetch('/api/aluno/reembolsos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, reason: reason.trim() })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Não foi possível enviar a solicitação.');
      const pendingEligibility: RefundEligibility = { orderId, productIds: eligibility?.productIds || [], accessed: false, request: { id: `pending-${orderId}`, status: 'PENDING' } };
      setRefundByOrderId((previous) => ({ ...previous, [orderId]: pendingEligibility }));
      setRefundByProductId((previous) => {
        const next = { ...previous };
        pendingEligibility.productIds.forEach((productId) => { next[productId] = pendingEligibility; });
        return next;
      });
      setRefundModal(null);
      setRefundReason('');
      toast.success('Solicitação enviada para análise. Você será avisado após a decisão.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível enviar a solicitação.');
    } finally {
      setRequestingRefundOrderId(null);
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
          <Link href="/cliente/dashboard" className="hover:text-blue-600 transition-colors flex items-center gap-1">
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
                Encontre sua compra e use o botão Abrir material para acessar o arquivo ou link em uma nova aba.
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

        {purchases.length > 0 && <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <label htmlFor="purchased-material-search" className="block text-sm font-bold text-slate-800">Buscar nos meus materiais</label>
          <input id="purchased-material-search" type="search" value={materialSearch} onChange={event => setMaterialSearch(event.target.value)} placeholder="Digite o nome do material ou combo" className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 px-4 text-base focus:ring-2 focus:ring-blue-100" />
          <p className="mt-3 text-xs text-slate-500" role="status">Exibindo {visiblePurchases.length} de {purchases.length} compras nesta loja.</p>
          {materialSearch && <button type="button" onClick={() => setMaterialSearch('')} className="min-h-11 text-sm font-bold text-blue-700">Limpar busca</button>}
          {visiblePurchases.length === 0 && <p className="text-sm text-slate-600">Nenhum material encontrado. Tente uma parte do nome ou limpe a busca.</p>}
        </section>}
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
            {visiblePurchases.map((pur) => {
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
                    <div className="aspect-square w-full bg-slate-100 relative overflow-hidden">
                      {itemCover ? (
                        <img src={itemCover} alt={itemTitle} loading="lazy" className="w-full h-full object-contain" />
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
                      <h3 className="font-bold text-slate-800 text-base leading-snug [overflow-wrap:anywhere]">
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
                          className={`order-1 min-h-11 w-full py-1.5 rounded-lg text-[11px] font-bold transition-colors flex items-center justify-center gap-1.5 ${
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
                      {pur.is_plr_purchase && pur.product?.plr_license_url ? (
                        <button
                          type="button"
                          onClick={(e) => handleDownloadPurchase(pur, e, 'plr')}
                          disabled={downloadingId === `${pur.id}-plr`}
                          className="w-full py-3 rounded-xl font-bold text-sm text-amber-900 bg-amber-100 transition-all flex justify-center items-center gap-2 hover:bg-amber-200 active:scale-95 disabled:opacity-50"
                        >
                          {downloadingId === `${pur.id}-plr` ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <FileText className="w-4 h-4" />
                          )}
                          <span>{downloadingId === `${pur.id}-plr` ? 'Abrindo licença...' : 'Acessar licença PLR'}</span>
                        </button>
                      ) : <button
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
                        <span>{downloadingId === pur.id ? 'Abrindo...' : isKit ? 'Abrir materiais do combo' : 'Abrir material'}</span>
                      </button>
                      }
                    </div>

                    {!pur.is_plr_purchase && refundsLoaded && (() => {
                      // Pedidos mais antigos podem ter acesso ativo sem order_id.
                      // Nestes casos, a elegibilidade retornada pelo servidor é
                      // associada ao produto para o botão não desaparecer.
                      const eligibility = pur.order_id
                        ? refundByOrderId[pur.order_id]
                        : (pur.product_id ? refundByProductId[pur.product_id] : undefined);
                      if (!eligibility) return null;
                      const requestStatus = eligibility?.request?.status;
                      const isAccessed = eligibility?.accessed;
                      const isPending = requestStatus === 'PENDING';
                      const isResolved = requestStatus === 'APPROVED' || requestStatus === 'REJECTED' || requestStatus === 'CANCELLED';
                      return (
                        <div className="order-2 border-t border-slate-100 pt-3">
                          {isPending ? (
                            <p className="flex items-center justify-center gap-1.5 rounded-lg bg-amber-50 px-2 py-2 text-center text-[10px] font-bold text-amber-800"><Loader2 className="h-3.5 w-3.5" /> Solicitação de reembolso em análise</p>
                          ) : isResolved ? (
                            <p className={`rounded-lg px-2 py-2 text-center text-[10px] font-bold ${requestStatus === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>Solicitação {requestStatus === 'APPROVED' ? 'aprovada' : 'analisada'}</p>
                          ) : isAccessed ? (
                            <p className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-center text-[10px] font-bold text-slate-400"><ShieldCheck className="h-3.5 w-3.5" /> Acesso ao material registrado</p>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setRefundReason('');
                                setRefundModal({ orderId: eligibility.orderId, eligibility });
                              }}
                              disabled={requestingRefundOrderId !== null}
                              className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-bold text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
                            >
                              {requestingRefundOrderId === eligibility.orderId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                              Solicitar reembolso
                            </button>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {refundModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="refund-modal-title">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-lg rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <h2 id="refund-modal-title" className="text-xl font-black tracking-tight text-slate-900">Solicitar reembolso</h2>
                <p className="mt-1 text-sm font-medium leading-relaxed text-slate-500">Conte o que aconteceu para a equipe analisar seu pedido.</p>
              </div>
              <button type="button" onClick={() => setRefundModal(null)} disabled={requestingRefundOrderId !== null} className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50" aria-label="Fechar solicitação de reembolso">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="flex items-center gap-2 text-sm font-black text-amber-900"><AlertCircle className="h-4 w-4" /> Antes de enviar</p>
              <p className="mt-1.5 text-xs font-medium leading-relaxed text-amber-800">O reembolso só pode ser solicitado antes de abrir, visualizar ou baixar o material. A solicitação será analisada pela Educalizando e não garante aprovação automática.</p>
            </div>

            <label className="mt-5 block text-sm font-bold text-slate-800" htmlFor="refund-reason">Motivo da solicitação</label>
            <textarea
              id="refund-reason"
              value={refundReason}
              onChange={(event) => setRefundReason(event.target.value)}
              placeholder="Ex.: comprei o material por engano..."
              maxLength={1000}
              rows={4}
              disabled={requestingRefundOrderId !== null}
              className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-100 disabled:opacity-60"
            />
            <p className="mt-1.5 text-right text-[11px] font-medium text-slate-400">{refundReason.trim().length}/1000 · mínimo de 10 caracteres</p>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setRefundModal(null)} disabled={requestingRefundOrderId !== null} className="rounded-xl px-4 py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50">Cancelar</button>
              <button type="button" onClick={handleRefundRequest} disabled={requestingRefundOrderId !== null || refundReason.trim().length < 10} className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50">
                {requestingRefundOrderId ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                Enviar para análise
              </button>
            </div>
          </motion.div>
        </div>
      )}

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
