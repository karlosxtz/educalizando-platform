'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, BookOpen, FileText, Video, Layers, 
  HelpCircle, Boxes, ShieldCheck, Lock, Sparkles, Loader2, AlertCircle, ChevronRight, Check
} from 'lucide-react';

import { getCurrentStudentSession, getStudentPurchaseById, generateSignedFileUrl } from '@/lib/student-service';
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

        // Prepara URL inicial do primeiro produto
        const initialProduct = pur.product || (pur.kit?.products?.[0]);
        if (initialProduct?.arquivo_url) {
          const sUrl = await generateSignedFileUrl(initialProduct.arquivo_url);
          setSignedUrl(sUrl);
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

  const activeProduct: Product | null = purchase.product || (purchase.kit?.products?.[activeKitProductIndex]) || null;
  const isKit = Boolean(purchase.kit_id);
  const kitProducts = purchase.kit?.products || [];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Reader Top Bar */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-4 sm:px-8 py-3.5 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          <Link
            href="/aluno/dashboard"
            className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 px-3.5 py-2 rounded-xl border border-slate-700"
          >
            <ArrowLeft className="w-4 h-4 text-blue-400" />
            <span>Voltar para Meus Materiais</span>
          </Link>

          <div className="flex items-center gap-2 text-center min-w-0">
            <span className="bg-blue-500/20 text-blue-400 text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase border border-blue-500/30 flex items-center gap-1 flex-shrink-0">
              {isKit ? <Boxes className="w-3.5 h-3.5" /> : getTipoIcon(activeProduct?.tipo)}
              <span>{isKit ? 'COMBO' : activeProduct?.tipo}</span>
            </span>
            <h1 className="text-sm sm:text-base font-black text-white truncate max-w-md">
              {isKit ? purchase.kit?.titulo : activeProduct?.titulo}
            </h1>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-3 py-1.5 rounded-xl">
            <ShieldCheck className="w-4 h-4" />
            <span>Leitor Seguro DRM</span>
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
                Selecione um arquivo abaixo para visualizar:
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

        {/* Main Content Reader Container */}
        <section className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col shadow-2xl min-h-[600px]">
          
          {/* Reader Sub-header info */}
          <div className="p-4 sm:p-5 bg-slate-850 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                Material Ativo:
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

          {/* Reader Body Viewer */}
          <div className="flex-1 p-2 sm:p-4 bg-slate-950 flex flex-col justify-center items-center relative overflow-hidden">
            {!activeProduct ? (
              <div className="text-center p-8 space-y-2 text-slate-400">
                <AlertCircle className="w-10 h-10 text-slate-500 mx-auto" />
                <p>Nenhum produto selecionado.</p>
              </div>
            ) : activeProduct.tipo === 'video' || activeProduct.tipo === 'curso' ? (
              /* Video Content Viewer */
              <div className="w-full h-full max-w-4xl aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border border-slate-800 relative flex items-center justify-center">
                {signedUrl?.includes('youtube.com') || signedUrl?.includes('youtu.be') || signedUrl?.includes('vimeo.com') ? (
                  <iframe
                    src={signedUrl}
                    title={activeProduct.titulo}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : signedUrl ? (
                  <video
                    src={signedUrl}
                    controls
                    controlsList="nodownload"
                    className="w-full h-full object-contain"
                  >
                    Seu navegador não suporta a reprodução direta deste vídeo.
                  </video>
                ) : (
                  <div className="text-center space-y-3 p-8">
                    <Video className="w-12 h-12 text-blue-500 mx-auto animate-pulse" />
                    <h3 className="text-base font-bold text-white">{activeProduct.titulo}</h3>
                    <p className="text-xs text-slate-400 max-w-sm">
                      O arquivo de vídeo está sendo processado pelo servidor da plataforma.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Document / PDF / E-book Viewer */
              <div className="w-full h-full flex flex-col space-y-3">
                <div className="flex-1 bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 relative min-h-[550px] flex items-center justify-center shadow-inner">
                  {signedUrl ? (
                    <iframe
                      src={`${signedUrl}#toolbar=0&navpanes=0`}
                      title={activeProduct.titulo}
                      className="w-full h-[600px] border-0 rounded-2xl"
                    />
                  ) : (
                    <div className="text-center p-8 space-y-4 max-w-md">
                      <FileText className="w-12 h-12 text-sky-400 mx-auto" />
                      <div>
                        <h3 className="text-base font-bold text-white">{activeProduct.titulo}</h3>
                        <p className="text-xs text-slate-400 mt-1">
                          {activeProduct.descricao || 'Material Didático Digital em formato PDF.'}
                        </p>
                      </div>
                      <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-xs text-slate-300 font-medium">
                        O visualizador protegido está carregando o documento criptografado.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Reader Footer Protection Disclaimer */}
          <div className="p-3 bg-slate-900 border-t border-slate-800 text-center text-[11px] text-slate-400 flex items-center justify-center gap-2">
            <Lock className="w-3.5 h-3.5 text-blue-400" />
            <span>Conteúdo protegido por Direitos Autorais e DRM Educalizando • Licença Pessoal de {studentSession?.fullName}</span>
          </div>

        </section>

      </main>
    </div>
  );
}
