'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen, FileText, Video, Layers, HelpCircle, Boxes, ShieldCheck, Loader2, AlertCircle, FolderCheck, Download, ExternalLink } from 'lucide-react';

import { getCurrentStudentSession, getStudentPurchaseById } from '@/lib/student-service';
import { getContentByProductId, authorizeStudentContentAccess, ContentItem } from '@/lib/content-delivery-service';
import { Purchase, ProductType } from '@/lib/types';
import StudentHeader from '@/components/aluno/StudentHeader';

interface MaterialReaderClientViewProps {
  purchaseId: string;
}

export default function MaterialReaderClientView({ purchaseId }: MaterialReaderClientViewProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [studentSession, setStudentSession] = useState<{ id: string; email: string; fullName: string } | null>(null);
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [digitalContents, setDigitalContents] = useState<ContentItem[]>([]);
  const [accessNotice, setAccessNotice] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
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

        // Busca conteúdos entregáveis do combo
        let items: ContentItem[] = [];
        if (pur.kit?.products) {
          for (const prod of pur.kit.products) {
            const prodItems = await getContentByProductId(pur.store_id, prod.id);
            // Add a virtual content item for the product's main file itself if it exists
            if (prod.arquivo_url) {
                items.push({
                    id: prod.id,
                    storeId: pur.store_id,
                    productId: prod.id,
                    productTitle: prod.titulo,
                    titulo: prod.titulo,
                    descricao: prod.descricao,
                    tipo: 'ARQUIVO',
                    url: prod.arquivo_url,
                    fileName: `${prod.titulo.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`,
                    downloadsCount: 0,
                    externalAccessCount: 0,
                    active: true,
                    orderIndex: -1,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }
            items = [...items, ...prodItems];
          }
        }
        
        // Sort items properly
        items.sort((a, b) => {
            if (a.productId !== b.productId) {
                return (a.productId || '').localeCompare(b.productId || '');
            }
            return a.orderIndex - b.orderIndex;
        });
        
        setDigitalContents(items);
      } catch (err: any) {
        console.error(err);
        setErrorMsg('Erro ao carregar os dados do material.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [purchaseId, router]);

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (errorMsg || !purchase || !purchase.kit_id) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
        <StudentHeader studentName={studentSession?.fullName} studentEmail={studentSession?.email} />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 max-w-md text-center space-y-4 shadow-sm">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
            <h2 className="text-xl font-bold">Acesso Indisponível</h2>
            <p className="text-xs text-slate-500">{errorMsg || 'Acesso negado para este combo.'}</p>
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

    if (item.tipo === 'ARQUIVO') {
      const prodId = item.productId || purchase.product_id || purchase.id;
      const downloadUrl = item.orderIndex === -1 
        ? `/api/aluno/materiais/${prodId}/download`
        : `/api/aluno/materiais/${prodId}/download?contentId=${item.id}`;

      console.log("DOWNLOAD MATERIAL:", prodId);
      console.log("CURRENT URL:", window.location.href);

      try {
        const res = await fetch(downloadUrl);
        if (!res.ok) throw new Error(`HTTP Error ${res.status}`);

        const disposition = res.headers.get('content-disposition');
        let filename = `${(item.titulo || 'Material_Didatico').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
        if (disposition && disposition.includes('filename=')) {
          const match = disposition.match(/filename="?([^";]+)"?/);
          if (match && match[1]) {
            filename = decodeURIComponent(match[1]);
          }
        }

        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = objectUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(objectUrl);

        setAccessNotice({
          type: 'success',
          message: 'Download iniciado com sucesso!'
        });
      } catch (err) {
        console.error('[Download Error]:', err);
        setAccessNotice({
          type: 'error',
          message: 'Erro ao realizar download do arquivo.'
        });
      }
      return;
    }

    const grant = await authorizeStudentContentAccess({
      storeId: purchase.store_id,
      studentEmail: studentSession.email,
      contentId: item.id,
      productId: item.productId || undefined
    });

    if (!grant.authorized) {
      setAccessNotice({
        type: 'error',
        message: grant.errorMessage || 'Acesso não autorizado ao conteúdo.'
      });
      return;
    }

    if (grant.url) {
      window.open(grant.url, '_blank');
      setAccessNotice({
        type: 'success',
        message: 'Acesso ao link externo liberado!'
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 sm:px-8 py-3 shadow-sm">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <Link
              href={`/aluno/loja/${purchase.store_id}`}
              className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl border border-slate-200 flex-shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-blue-600" />
              <span>Voltar para {purchase.store?.nome_loja || 'a Loja'}</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 text-center min-w-0">
            <span className="bg-blue-50 text-blue-600 text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase border border-blue-100 flex items-center gap-1 flex-shrink-0">
              <Boxes className="w-3.5 h-3.5" />
              <span>COMBO</span>
            </span>
            <h1 className="text-sm sm:text-base font-black text-slate-900 truncate max-w-md">
              {purchase.kit?.titulo}
            </h1>
          </div>
          
          <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl">
            <ShieldCheck className="w-4 h-4" />
            <span>Downloads Seguros</span>
          </div>

        </div>
      </header>

      {/* Main Layout Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 flex flex-col gap-6">
        
        <section className="bg-white border border-slate-200 rounded-3xl overflow-hidden flex flex-col shadow-sm">
          
          <div className="p-5 sm:p-8 bg-slate-50 border-b border-slate-200 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto shadow-inner border border-blue-200">
               <Boxes className="w-8 h-8" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Central de Downloads do Combo
            </h2>
            <p className="text-sm text-slate-500 max-w-xl mx-auto font-medium">
              Todos os materiais didáticos do seu combo estão listados abaixo. Clique em baixar para transferir os arquivos diretamente para o seu dispositivo.
            </p>
          </div>

          <div className="p-5 sm:p-8 space-y-6 bg-white">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <FolderCheck className="w-4 h-4 text-blue-600" /> Arquivos Disponíveis ({digitalContents.length})
            </h3>

            {accessNotice && (
              <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${
                accessNotice.type === 'error' ? 'bg-rose-50 border border-rose-200 text-rose-700' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
              }`}>
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{accessNotice.message}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {digitalContents.map((cnt, idx) => (
                <div key={`${cnt.id}-${idx}`} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-bold text-slate-900 line-clamp-2" title={cnt.titulo}>{cnt.titulo}</h4>
                    </div>
                    <span className={`inline-flex text-[10px] font-extrabold px-2.5 py-1 rounded-md ${
                        cnt.tipo === 'ARQUIVO' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-purple-100 text-purple-700 border border-purple-200'
                    }`}>
                        {cnt.tipo === 'ARQUIVO' ? 'ARQUIVO PARA DOWNLOAD' : 'LINK EXTERNO'}
                    </span>
                    {cnt.descricao && <p className="text-xs text-slate-500 font-medium line-clamp-2 pt-1">{cnt.descricao}</p>}
                  </div>

                  <button
                    onClick={() => handleAccessContent(cnt)}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                  >
                    {cnt.tipo === 'ARQUIVO' ? <Download className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
                    <span>{cnt.tipo === 'ARQUIVO' ? 'Baixar Material' : 'Acessar Link'}</span>
                  </button>
                </div>
              ))}
              
              {digitalContents.length === 0 && (
                  <div className="col-span-1 sm:col-span-2 text-center p-8 bg-slate-50 rounded-2xl border border-slate-200">
                      <p className="text-slate-500 text-sm font-medium">Nenhum arquivo encontrado neste combo.</p>
                  </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
