'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, BookOpen, FileText, Video, Layers, 
  HelpCircle, Boxes, ShieldCheck, Lock, Sparkles, Loader2, AlertCircle, ChevronRight, Check, Star, ThumbsUp, FolderCheck, Download, ExternalLink 
} from 'lucide-react';

import { getCurrentStudentSession, getStudentPurchaseById, generateSignedFileUrl } from '@/lib/student-service';
import { getContentByProductId, authorizeStudentContentAccess, ContentItem } from '@/lib/content-delivery-service';
import { createReview } from '@/lib/review-service';
import { Purchase, Product, ProductType } from '@/lib/types';
import StudentHeader from '@/components/aluno/StudentHeader';

interface MaterialReaderClientViewProps {
  purchaseId: string;
}

export default function MaterialReaderClientView({ purchaseId }: MaterialReaderClientViewProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [studentSession, setStudentSession] = useState<{ id: string; email: string; fullName: string } | null>(null);
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [activeKitProductIndex, setActiveKitProductIndex] = useState<number>(0);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [digitalContents, setDigitalContents] = useState<ContentItem[]>([]);
  const [accessNotice, setAccessNotice] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Student Review Form State
  const [userRating, setUserRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [submittedReview, setSubmittedReview] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const session = await getCurrentStudentSession();
        if (!session) {
          router.push('/aluno/login');
          return;
        }
        setStudentSession(session);

        const pur = await getStudentPurchaseById(purchaseId, session.id);
        if (!pur) {
          setErrorMsg('Matrícula/Compra não encontrada ou acesso não autorizado.');
          setLoading(false);
          return;
        }
        setPurchase(pur);

        // Prepara URL inicial e busca conteúdos entregáveis do produto
        const initialProduct = pur.product || (pur.kit?.products?.[0]);
        if (initialProduct) {
          if (initialProduct.arquivo_url) {
            const sUrl = await generateSignedFileUrl(initialProduct.arquivo_url);
            setSignedUrl(sUrl);
          }
          const items = await getContentByProductId(pur.store_id, initialProduct.id);
          setDigitalContents(items);
        }
      } catch (err: any) {
        console.error(err);
        setErrorMsg('Erro ao carregar os dados do material.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [purchaseId, router]);

  // Atualizar URL assinada ao trocar de produto dentro de um Kit
  const handleSelectKitProduct = async (index: number) => {
    setActiveKitProductIndex(index);
    if (!purchase?.kit?.products) return;
    const prod = purchase.kit.products[index];
    if (prod?.arquivo_url) {
      const sUrl = await generateSignedFileUrl(prod.arquivo_url);
      setSignedUrl(sUrl);
    } else {
      setSignedUrl(null);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim() || !purchase || !studentSession) return;

    setSubmittingReview(true);
    try {
      const isKit = Boolean(purchase.kit_id);
      const targetId = isKit ? purchase.kit_id! : purchase.product_id!;
      const targetType = isKit ? 'kit' : 'product';

      await createReview({
        targetType,
        targetId,
        studentId: studentSession.id,
        studentName: studentSession.fullName,
        rating: userRating,
        comment: reviewComment
      });

      setSubmittedReview(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReview(false);
    }
  };

  const getTipoIcon = (tipo?: ProductType) => {
    switch (tipo) {
      case 'pdf': return <FileText className="w-4 h-4 text-sky-600" />;
      case 'ebook': return <BookOpen className="w-4 h-4 text-indigo-600" />;
      case 'video': return <Video className="w-4 h-4 text-purple-600" />;
      case 'curso': return <Layers className="w-4 h-4 text-blue-600" />;
      case 'simulado': return <HelpCircle className="w-4 h-4 text-amber-600" />;
      default: return <BookOpen className="w-4 h-4 text-blue-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (errorMsg || !purchase) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col font-sans">
        <StudentHeader studentName={studentSession?.fullName} studentEmail={studentSession?.email} />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 max-w-md text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
            <h2 className="text-xl font-bold">Acesso Indisponível</h2>
            <p className="text-xs text-slate-400">{errorMsg || 'Acesso negado para esta compra.'}</p>
            <Link
              href="/aluno/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-xs bg-blue-600 text-white hover:bg-blue-700 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar para Meus Materiais
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const handleAccessContent = async (item: ContentItem) => {
    setAccessNotice(null);
    if (!studentSession || !purchase) return;

    const grant = await authorizeStudentContentAccess({
      storeId: purchase.store_id,
      studentEmail: studentSession.email,
      contentId: item.id,
      productId: item.productId || purchase.product_id || undefined
    });

    if (!grant.authorized) {
      setAccessNotice({
        type: 'error',
        message: grant.errorMessage || 'Acesso não autorizado ao conteúdo.'
      });
      return;
    }

    if (grant.url) {
      if (item.tipo === 'ARQUIVO') {
        const separator = grant.url.includes('?') ? '&' : '?';
        const finalUrl = `${grant.url}${separator}download=${encodeURIComponent(item.fileName || 'material_didatico.pdf')}`;
        window.location.href = finalUrl;
      } else {
        window.open(grant.url, '_blank');
      }
      setAccessNotice({
        type: 'success',
        message: item.tipo === 'ARQUIVO' ? 'Download iniciado com sucesso!' : 'Acesso ao link externo liberado!'
      });
      const updated = await getContentByProductId(purchase.store_id, item.productId || purchase.product_id || '');
      setDigitalContents(updated);
    }
  };

  const activeProduct: Product | null = purchase.product || (purchase.kit?.products?.[activeKitProductIndex]) || null;
  const isKit = Boolean(purchase.kit_id);
  const kitProducts = purchase.kit?.products || [];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Reader Top Bar */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-4 sm:px-8 py-3 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Back & Breadcrumbs */}
          <div className="flex items-center gap-3">
            <Link
              href={`/aluno/loja/${purchase.store_id}`}
              className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-700 flex-shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-blue-400" />
              <span>Voltar para {purchase.store?.nome_loja || 'a Loja'}</span>
            </Link>

            <nav className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 font-medium truncate">
              <Link href="/aluno/dashboard" className="hover:text-white transition-colors">Minhas Lojas</Link>
              <span className="text-slate-600">/</span>
              <Link href={`/aluno/loja/${purchase.store_id}`} className="hover:text-white transition-colors">{purchase.store?.nome_loja}</Link>
              <span className="text-slate-600">/</span>
              <span className="text-slate-200 font-bold truncate max-w-[200px]">{isKit ? purchase.kit?.titulo : activeProduct?.titulo}</span>
            </nav>
          </div>

          {/* Title & Type Badge */}
          <div className="flex items-center gap-2 text-center min-w-0">
            <span className="bg-blue-500/20 text-blue-400 text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase border border-blue-500/30 flex items-center gap-1 flex-shrink-0">
              {isKit ? <Boxes className="w-3.5 h-3.5" /> : getTipoIcon(activeProduct?.tipo)}
              <span>{isKit ? 'COMBO' : activeProduct?.tipo}</span>
            </span>
            <h1 className="text-sm sm:text-base font-black text-white truncate max-w-md">
              {isKit ? purchase.kit?.titulo : activeProduct?.titulo}
            </h1>
          </div>

          {/* Reader Top Bar Badge */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-3 py-1.5 rounded-xl">
            <ShieldCheck className="w-4 h-4" />
            <span>Download Seguro</span>
          </div>

        </div>
      </header>

      {/* Main Layout Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col lg:flex-row gap-6">
        
        {/* If it's a Kit, render sidebar selector for items */}
        {isKit && (
          <aside className="lg:w-80 bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-4 flex-shrink-0">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-400 block">
                Combo de Materiais
              </span>
              <h3 className="text-sm font-black text-white">{purchase.kit?.titulo}</h3>
              <p className="text-xs text-slate-400 font-medium">
                Selecione um item abaixo para baixar:
              </p>
            </div>

            <div className="space-y-2">
              {kitProducts.map((prod, idx) => {
                const isActive = activeKitProductIndex === idx;

                return (
                  <button
                    key={prod.id || idx}
                    onClick={() => handleSelectKitProduct(idx)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isActive
                        ? 'bg-blue-600/20 border-blue-500 text-white shadow-md'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                        isActive ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold block truncate">{prod.titulo}</span>
                        <span className="text-[10px] uppercase font-bold text-slate-400">{prod.tipo}</span>
                      </div>
                    </div>

                    {isActive && <ChevronRight className="w-4 h-4 text-blue-400 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </aside>
        )}

        {/* Main Content Download Container */}
        <section className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col shadow-2xl min-h-[600px]">
          
          {/* Sub-header info */}
          <div className="p-4 sm:p-5 bg-slate-850 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                Material Selecionado:
              </span>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                {getTipoIcon(activeProduct?.tipo)}
                <span>{activeProduct?.titulo || 'Selecione um produto'}</span>
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 bg-slate-800 border border-slate-700 px-3 py-1 rounded-lg">
                Vendido por {purchase.store?.nome_loja}
              </span>
            </div>
          </div>

          {/* Body: Direct File Download Card Only (No Platform Viewer) */}
          <div className="flex-1 p-6 sm:p-12 bg-slate-950 flex flex-col justify-center items-center relative overflow-hidden">
            {!activeProduct ? (
              <div className="text-center p-8 space-y-2 text-slate-400">
                <AlertCircle className="w-10 h-10 text-slate-500 mx-auto" />
                <p>Nenhum produto selecionado.</p>
              </div>
            ) : (
              /* Download Direto de Todos os Materiais */
              <div className="w-full h-full flex flex-col items-center justify-center p-6 sm:p-12 space-y-6 text-center bg-slate-900/80 rounded-3xl border border-slate-800 shadow-2xl max-w-2xl mx-auto my-auto">
                <div className="w-20 h-20 rounded-3xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto shadow-inner">
                  {getTipoIcon(activeProduct.tipo)}
                </div>

                <div className="space-y-2 max-w-lg">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                    Material Liberado para Download
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                    {activeProduct.titulo}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
                    {activeProduct.descricao || 'Seu material didático digital está pronto para ser baixado diretamente no seu dispositivo.'}
                  </p>
                </div>

                <div className="w-full pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a
                    href={`/api/aluno/materiais/${activeProduct.id}/download`}
                    download
                    className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-3 shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-95"
                  >
                    <Download className="w-5 h-5 text-blue-200" />
                    <span>Baixar Material Didático ({activeProduct.tipo.toUpperCase()})</span>
                  </a>
                </div>

                <div className="flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-400 bg-slate-950/60 px-4 py-2 rounded-xl border border-slate-800/80">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Download direto e seguro no seu dispositivo</span>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 25: Conteúdos Disponíveis no Produto Comprado */}
          {digitalContents.length > 0 && (
            <div className="p-5 bg-slate-900 border-t border-slate-800 space-y-3">
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <FolderCheck className="w-4 h-4 text-brand-teal" /> Conteúdos Entregáveis Liberados ({digitalContents.length})
              </h3>

              {accessNotice && (
                <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  accessNotice.type === 'error' ? 'bg-rose-950/80 border border-rose-800 text-rose-300' : 'bg-emerald-950/80 border border-emerald-800 text-emerald-300'
                }`}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{accessNotice.message}</span>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-3">
                {digitalContents.map(cnt => (
                  <div key={cnt.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-white truncate">{cnt.titulo}</h4>
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md ${
                          cnt.tipo === 'ARQUIVO' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        }`}>
                          {cnt.tipo === 'ARQUIVO' ? 'ARQUIVO' : 'LINK'}
                        </span>
                      </div>
                      {cnt.descricao && <p className="text-[11px] text-slate-400 font-medium line-clamp-1">{cnt.descricao}</p>}
                      <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 pt-1 font-mono">
                        <span>{cnt.downloadLimit ? `Downloads: ${cnt.downloadsCount} de ${cnt.downloadLimit}` : 'Downloads ilimitados'}</span>
                        <span>•</span>
                        <span>{cnt.validityDays ? `Validade: ${cnt.validityDays} dias` : 'Acesso vitalício'}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAccessContent(cnt)}
                      className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-slate-700 shadow-sm"
                    >
                      {cnt.tipo === 'ARQUIVO' ? <Download className="w-3.5 h-3.5 text-blue-400" /> : <ExternalLink className="w-3.5 h-3.5 text-purple-400" />}
                      <span>{cnt.tipo === 'ARQUIVO' ? 'Baixar material' : 'Acessar link'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reader Footer Protection Disclaimer */}
          <div className="p-3 bg-slate-900 border-t border-slate-800 text-center text-[11px] text-slate-400 flex items-center justify-center gap-2">
            <Lock className="w-3.5 h-3.5 text-brand-teal" />
            <span>Conteúdo protegido por Direitos Autorais e DRM Educalizando • Licença Pessoal de {studentSession?.fullName}</span>
          </div>

        </section>

        {/* Student Review & Rating Card */}
        <aside className="lg:w-80 bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 text-white shadow-xl flex-shrink-0">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-teal block">
              SUA OPINIÃO IMPORTA
            </span>
            <h3 className="text-sm font-black text-white flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              Avaliar este Material Didático
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Sua avaliação ajuda outros alunos a escolherem os melhores materiais.
            </p>
          </div>

          {submittedReview ? (
            <div className="bg-emerald-950/60 border border-emerald-800 p-4 rounded-2xl text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-sm text-white">Avaliação Enviada com Sucesso!</h4>
              <p className="text-xs text-emerald-300 font-medium">
                Obrigado pelo seu depoimento. Ele já está visível na vitrine oficial da loja!
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Star Picker */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 block">Classificação por Estrelas:</label>
                <div className="flex items-center gap-1 bg-slate-950 p-2.5 rounded-xl border border-slate-800 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setUserRating(star)}
                      className="p-1 transition-transform hover:scale-125 focus:outline-none min-h-[36px] min-w-[36px] flex items-center justify-center"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= userRating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-700 fill-slate-800'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment Textarea */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 block">Seu Comentário / Feedback:</label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Escreva sua opinião sobre a didática, organização do PDF ou videoaula..."
                  className="w-full p-3 bg-slate-950 border border-slate-800 focus:border-brand-teal rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none resize-none font-medium"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submittingReview || !reviewComment.trim()}
                className="w-full py-3 rounded-xl bg-brand-navy hover:bg-brand-navy-hover text-white text-xs font-extrabold shadow-md flex items-center justify-center gap-2 disabled:opacity-50 transition-all min-h-[44px]"
              >
                {submittingReview ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <ThumbsUp className="w-4 h-4 text-brand-teal" />
                    <span>Publicar Minha Avaliação</span>
                  </>
                )}
              </button>
            </form>
          )}
        </aside>

      </main>
    </div>
  );
}
