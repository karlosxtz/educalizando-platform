'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Award, Package, FileText, BookOpen, Video, Layers, HelpCircle, ArrowRight, Loader2 } from 'lucide-react';
import { Product, TopProductStat, ProductType } from '@/lib/types';
import { getTopProductsReport } from '@/lib/sales-service';

interface TopProductsReportProps {
  products: Product[];
  storeId?: string;
}

export default function TopProductsReport({ products, storeId }: TopProductsReportProps) {
  const [stats, setStats] = useState<TopProductStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      try {
        const res = await getTopProductsReport(storeId || '', products);
        setStats(res);
      } catch (err) {
        console.error('Erro ao carregar top produtos:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [products, storeId]);

  const getTipoIcon = (tipo: ProductType) => {
    switch (tipo) {
      case 'pdf': return <FileText className="w-3.5 h-3.5 text-sky-600" />;
      case 'ebook': return <BookOpen className="w-3.5 h-3.5 text-indigo-600" />;
      case 'video': return <Video className="w-3.5 h-3.5 text-purple-600" />;
      case 'curso': return <Layers className="w-3.5 h-3.5 text-blue-600" />;
      case 'simulado': return <HelpCircle className="w-3.5 h-3.5 text-amber-600" />;
    }
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600 flex items-center gap-1.5 mb-1">
            <Award className="w-4 h-4 text-amber-500" /> Mais Vendidos da Sua Loja
          </span>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Top Produtos</h3>
        </div>

        <Link
          href="/dashboard/produtos"
          className="text-xs font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
        >
          <span>Ver Todos</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center text-slate-400">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        </div>
      ) : stats.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-xs font-medium">
          Nenhum material cadastrado ainda.
        </div>
      ) : (
        <div className="space-y-4">
          {stats.map((item, index) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl border border-slate-100 bg-slate-50/30 hover:bg-white hover:border-slate-200 hover:shadow-md transition-all space-y-3 group"
            >
              <div className="flex items-center gap-4">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0 shadow-sm">
                  {item.capa_url ? (
                    <img src={item.capa_url} alt={item.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-5 h-5 text-slate-300" />
                    </div>
                  )}
                  <div className="absolute top-0 left-0 bg-slate-900 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-br-lg">
                    {index + 1}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 text-sm line-clamp-1">
                    {item.titulo}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase bg-slate-100 px-1.5 py-0.5 rounded">
                      {getTipoIcon(item.tipo)} {item.tipo}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      R$ {item.preco.toFixed(2).replace('.', ',')} / un.
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm font-black text-slate-900 block">
                    R$ {item.faturamentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                    {item.unidadesVendidas} vendas
                  </span>
                </div>
              </div>

              {/* Progress Bar Indicator */}
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden relative">
                  <div
                    className="absolute top-0 left-0 bottom-0 bg-blue-600 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.max(item.porcentagem, 5)}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-bold min-w-[32px] text-right">
                  {item.porcentagem}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
