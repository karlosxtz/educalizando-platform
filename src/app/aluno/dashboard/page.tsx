'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  BookOpen, FileText, Video, Layers, HelpCircle, 
  Boxes, ShieldCheck, Zap, ArrowRight, Loader2, Store, Sparkles 
} from 'lucide-react';

import { getCurrentStudentSession, getStudentPurchases } from '@/lib/student-service';
import { Purchase, ProductType } from '@/lib/types';
import StudentHeader from '@/components/aluno/StudentHeader';

export default function StudentDashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [studentSession, setStudentSession] = useState<{ id: string; email: string; fullName: string } | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  useEffect(() => {
    async function loadStudentData() {
      try {
        const session = await getCurrentStudentSession();
        if (!session) {
          router.push('/aluno/login');
          return;
        }
        setStudentSession(session);

        const studentPurchases = await getStudentPurchases(session.id);
        setPurchases(studentPurchases);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStudentData();
  }, [router]);

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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Student Navigation Header */}
      <StudentHeader
        studentName={studentSession?.fullName}
        studentEmail={studentSession?.email}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Welcome & Section Title */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Área de Membros Oficial
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Meus Materiais Didáticos ({purchases.length})
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
              Bem-vindo(a), <strong>{studentSession?.fullName}</strong>! Aqui estão todas as suas apostilas, e-books e cursos contratados.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Acesso Vitalício Liberado
            </span>
          </div>
        </div>

        {/* Purchased Items Catalog Grid */}
        {purchases.length === 0 ? (
          <div className="bg-white p-12 sm:p-16 rounded-3xl border border-slate-200 shadow-sm text-center max-w-lg mx-auto space-y-5 my-8">
            <div className="w-20 h-20 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mx-auto shadow-inner">
              <BookOpen className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900">
                Você ainda não possui materiais
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed font-medium">
                Quando você comprar uma apostila, e-book ou combo em qualquer loja da Educalizando, ele aparecerá automaticamente aqui.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {purchases.map((pur) => {
              const itemTitle = pur.product?.titulo || pur.kit?.titulo || 'Material Didático';
              const itemCover = pur.product?.capa_url || pur.kit?.capa_url || null;
              const storeName = pur.store?.nome_loja || 'Loja do Criador';
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
                      <span className="text-[11px] font-bold text-slate-400 block mb-1">
                        Vendido por <strong className="text-slate-700">{storeName}</strong>
                      </span>
                      <h3 className="font-black text-slate-900 text-base sm:text-lg group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                        {itemTitle}
                      </h3>
                    </div>
                  </div>

                  {/* Access Button Footer */}
                  <div className="p-5 pt-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4" /> Acesso Liberado
                    </span>

                    <Link
                      href={`/aluno/materiais/${pur.id}`}
                      className="px-4 py-2.5 rounded-xl font-extrabold text-xs text-white bg-blue-600 hover:bg-blue-700 shadow-md group-hover:shadow-lg transition-all flex items-center gap-1.5"
                    >
                      <span>Acessar Material</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
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
