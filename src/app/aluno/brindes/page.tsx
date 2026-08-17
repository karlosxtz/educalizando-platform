'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Gift, Search, Loader2, Sparkles, Download, Eye, ExternalLink, ShieldCheck
} from 'lucide-react';

import { getCurrentStudentSession } from '@/lib/student-service';
import { getAllFreeProducts } from '@/lib/store-service';
import { Product, Store } from '@/lib/types';
import StudentHeader from '@/components/aluno/StudentHeader';

export default function StudentFreeProductsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [studentSession, setStudentSession] = useState<{ id: string; email: string; fullName: string; avatarUrl?: string } | null>(null);
  const [freeProducts, setFreeProducts] = useState<(Product & { store?: Store })[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-teal animate-spin" />
      </div>
    );
  }

  const filteredProducts = freeProducts.filter(p => 
    p.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.store?.nome_loja && p.store.nome_loja.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-brand-teal selection:text-white">
      <StudentHeader
        studentName={studentSession?.fullName}
        studentEmail={studentSession?.email}
        studentAvatarUrl={studentSession?.avatarUrl}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Welcome & Section Title */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-xs font-extrabold uppercase tracking-wider text-brand-teal bg-teal-50 px-3 py-1 rounded-full border border-teal-200 inline-flex items-center gap-1.5">
              <Gift className="w-3.5 h-3.5 text-brand-teal" /> Materiais 100% Gratuitos
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Central de Materiais Grátis
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">
              Aproveite apostilas, e-books e materiais gratuitos disponibilizados pelos melhores criadores da Educalizando. Baixe diretamente sem custo.
            </p>
          </div>

          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar material ou loja..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-teal focus:border-brand-teal outline-none transition-all placeholder:text-slate-400 font-medium"
            />
          </div>
        </div>

        {/* Free Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white p-12 sm:p-16 rounded-3xl border border-slate-200 shadow-sm text-center max-w-lg mx-auto space-y-5 my-8">
            <div className="w-20 h-20 rounded-full bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center mx-auto shadow-inner">
              <Gift className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900">
                Nenhum material grátis encontrado
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed font-medium">
                No momento não há nenhum material gratuito correspondente à sua busca ou os criadores ainda não adicionaram materiais grátis.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={product.id}
                className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
              >
                {/* Cover Image */}
                <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden border-b border-slate-100">
                  {product.capa_url ? (
                    <img 
                      src={product.capa_url} 
                      alt={product.titulo}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                      <Gift className="w-12 h-12 opacity-50" />
                      <span className="text-xs font-bold uppercase tracking-widest">Sem Capa</span>
                    </div>
                  )}

                  {/* Free Badge */}
                  <div className="absolute top-3 left-3 bg-brand-teal text-white text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Grátis
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5 flex flex-col flex-1">
                  <div className="flex-1 space-y-1">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-brand-teal transition-colors">
                      {product.titulo}
                    </h3>
                    {product.store && (
                      <p className="text-xs font-medium text-slate-500 flex items-center gap-1">
                        Por <span className="text-brand-navy">{product.store.nome_loja}</span>
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-5 space-y-2">
                    <Link
                      href={`/aluno/brindes/${product.id}`}
                      className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-brand-navy text-white py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm"
                    >
                      <Eye className="w-4 h-4" /> Ver Detalhes
                    </Link>
                    {product.store && (
                      <Link
                        href={`/loja/${product.store.slug}`}
                        target="_blank"
                        className="w-full flex items-center justify-center gap-2 bg-teal-50 hover:bg-teal-100 text-teal-700 py-2 rounded-xl font-bold text-[11px] sm:text-xs transition-all border border-teal-200"
                      >
                        Acesse a loja desse criador <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
