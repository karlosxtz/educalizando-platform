'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Store as StoreIcon, BookOpen, ShieldCheck, 
  ArrowRight, Loader2, Sparkles, Layers, ShoppingBag 
} from 'lucide-react';

import { getCurrentStudentSession, getStudentStoresGrouped, GroupedStudentStore } from '@/lib/student-service';
import StudentHeader from '@/components/aluno/StudentHeader';

export default function StudentDashboardStoresPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [studentSession, setStudentSession] = useState<{ id: string; email: string; fullName: string; avatarUrl?: string } | null>(null);
  const [groupedStores, setGroupedStores] = useState<GroupedStudentStore[]>([]);

  useEffect(() => {
    async function loadStudentData() {
      try {
        const session = await getCurrentStudentSession();
        if (!session) {
          router.push('/aluno/login');
          return;
        }
        setStudentSession(session);

        const stores = await getStudentStoresGrouped(session.id);
        setGroupedStores(stores);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStudentData();
  }, [router]);

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
        studentAvatarUrl={studentSession?.avatarUrl}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Welcome & Section Title */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-xs font-extrabold uppercase tracking-wider text-brand-navy bg-slate-100 px-3 py-1 rounded-full border border-slate-200 inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-teal" /> Área de Membros do Aluno
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Minhas Lojas ({groupedStores.length})
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
              Bem-vindo(a), <strong>{studentSession?.fullName}</strong>! Selecione abaixo a loja do criador para ver os seus materiais adquiridos naquela loja.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-brand-green font-bold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-brand-green" /> Acesso Unificado
            </span>
          </div>
        </div>

        {/* Grouped Stores Grid */}
        {groupedStores.length === 0 ? (
          <div className="bg-white p-12 sm:p-16 rounded-3xl border border-slate-200 shadow-sm text-center max-w-lg mx-auto space-y-5 my-8">
            <div className="w-20 h-20 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mx-auto shadow-inner">
              <StoreIcon className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900">
                Você ainda não possui materiais em nenhuma loja
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed font-medium">
                Quando você comprar uma apostila, e-book ou curso na Educalizando, a loja aparecerá automaticamente organizada nesta tela.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupedStores.map(({ store, purchasesCount }) => {
              const primaryColor = store.cor_primaria || '#2563eb';

              return (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={store.id}
                  className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group flex flex-col justify-between"
                  style={{ '--store-primary': primaryColor } as React.CSSProperties}
                >
                  <div className="p-6 space-y-5">
                    
                    {/* Store Header Banner / Logo Bar */}
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl p-1 bg-white border-2 border-slate-100 shadow-md flex-shrink-0 relative overflow-hidden flex items-center justify-center">
                        {store.logo_url ? (
                          <img src={store.logo_url} alt={store.nome_loja} className="w-full h-full rounded-xl object-cover" />
                        ) : (
                          <div 
                            className="w-full h-full rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-inner"
                            style={{ backgroundColor: primaryColor }}
                          >
                            {store.nome_loja.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1 min-w-0">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                          Loja de Infoprodutos
                        </span>
                        <h3 className="font-black text-slate-900 text-lg group-hover:text-blue-600 transition-colors truncate">
                          {store.nome_loja}
                        </h3>
                        <span 
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold text-white shadow-xs"
                          style={{ backgroundColor: primaryColor }}
                        >
                          <BookOpen className="w-3 h-3" />
                          <span>{purchasesCount} {purchasesCount === 1 ? 'material' : 'materiais'}</span>
                        </span>
                      </div>
                    </div>

                    {store.descricao && (
                      <p className="text-xs text-slate-500 line-clamp-2 font-medium leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        {store.descricao}
                      </p>
                    )}

                  </div>

                  {/* Access Store Materials Action Footer */}
                  <div className="p-5 pt-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" /> Acesso Seguro
                    </span>

                    <Link
                      href={`/aluno/loja/${store.id}`}
                      className="px-4 py-2.5 rounded-xl font-extrabold text-xs text-white shadow-md group-hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <span>Acessar Espaço da Loja</span>
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
