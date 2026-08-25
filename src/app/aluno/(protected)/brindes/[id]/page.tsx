'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Download, FileText, Loader2, Sparkles, Store, ExternalLink, ShieldCheck
} from 'lucide-react';

import { getCurrentStudentSession } from '@/lib/student-service';
import { getProductById } from '@/lib/store-service';
import { Product, Store as StoreType } from '@/lib/types';
import StudentHeader from '@/components/aluno/StudentHeader';
import { supabase } from '@/lib/supabase';

export default function StudentFreeProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [studentSession, setStudentSession] = useState<{ id: string; email: string; fullName: string; avatarUrl?: string } | null>(null);
  const [product, setProduct] = useState<(Product & { store?: StoreType }) | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const session = await getCurrentStudentSession();
        if (!session) {
          router.push('/aluno/login');
          return;
        }
        setStudentSession(session);

        const prod = await getProductById(resolvedParams.id);
        if (!prod || !prod.is_free) {
          router.push('/aluno/brindes');
          return;
        }
        
        // Fetch store info
        const { data: storeData } = await supabase
          .from('stores')
          .select('*')
          .eq('id', prod.store_id)
          .single();

        setProduct({ ...prod, store: storeData });
      } catch (err) {
        console.error(err);
        router.push('/aluno/brindes');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [resolvedParams.id, router]);

  const handleDownload = async () => {
    if (!product?.arquivo_url) return;
    
    setDownloading(true);
    try {
      // Direct download since it's free and public or signed if it was private
      // Usually product.arquivo_url is a full URL or a path
      let downloadUrl = product.arquivo_url;
      
      // If it's just a path, we might need to get public url
      if (!downloadUrl.startsWith('http')) {
        const { data } = supabase.storage.from('produtos').getPublicUrl(product.arquivo_url);
        downloadUrl = data.publicUrl;
      }
      
      // Open in new tab to trigger download
      window.open(downloadUrl, '_blank');
    } catch (err) {
      console.error('Download error:', err);
      alert('Erro ao fazer download do material grátis.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-teal animate-spin" />
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-brand-teal selection:text-white">
      <StudentHeader
        studentName={studentSession?.fullName}
        studentEmail={studentSession?.email}
        studentAvatarUrl={studentSession?.avatarUrl}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Link
          href="/aluno/brindes"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para Materiais Grátis
        </Link>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
          {/* Left Column: Image */}
          <div className="w-full md:w-2/5 bg-slate-100 relative">
            {product.capa_url ? (
              <img 
                src={product.capa_url} 
                alt={product.titulo}
                className="w-full h-full object-cover min-h-[300px]"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center min-h-[300px] text-slate-300">
                <FileText className="w-16 h-16 opacity-50" />
              </div>
            )}
          </div>

          {/* Right Column: Details */}
          <div className="w-full md:w-3/5 p-6 sm:p-10 flex flex-col">
            <div className="flex-1 space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white bg-brand-teal px-2.5 py-1 rounded-md flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" /> Material 100% Gratuito
                  </span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-black text-slate-900 leading-tight">
                  {product.titulo}
                </h1>
                
                {product.store && (
                  <Link 
                    href={`/loja/${product.store.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-brand-teal transition-colors group"
                  >
                    <Store className="w-4 h-4 text-slate-400 group-hover:text-brand-teal" />
                    <span>Disponibilizado por <span className="text-slate-900 group-hover:text-brand-teal">{product.store.nome_loja}</span></span>
                    <ExternalLink className="w-3 h-3 opacity-50" />
                  </Link>
                )}
              </div>

              {product.descricao && (
                <div className="prose prose-sm sm:prose-base prose-slate max-w-none text-slate-600 leading-relaxed border-t border-slate-100 pt-6">
                  {product.descricao}
                </div>
              )}
            </div>

            <div className="mt-10 space-y-4">
              <button
                onClick={handleDownload}
                disabled={downloading || !product.arquivo_url}
                className="w-full flex items-center justify-center gap-2 bg-brand-teal hover:bg-teal-600 text-white py-4 rounded-xl font-black text-base sm:text-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {downloading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Download className="w-5 h-5" /> Baixar Material Agora
                  </>
                )}
              </button>

              {product.store && (
                <div className="bg-brand-navy/5 border border-brand-navy/10 rounded-xl p-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-slate-900">Gostou deste material grátis?</h4>
                    <p className="text-xs text-slate-500 font-medium">Veja os materiais completos deste criador.</p>
                  </div>
                  <Link
                    href={`/loja/${product.store.slug}`}
                    target="_blank"
                    className="bg-brand-navy hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
                  >
                    Acessar Loja
                  </Link>
                </div>
              )}
              
              <div className="flex items-center justify-center gap-1.5 text-[10px] sm:text-xs text-slate-400 font-semibold uppercase tracking-widest pt-2">
                <ShieldCheck className="w-3.5 h-3.5" /> Download Seguro pela Educalizando
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
