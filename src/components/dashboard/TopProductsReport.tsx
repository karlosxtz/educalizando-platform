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

export default function TopProductsReport({ products, storeId = 'store-demo' }: TopProductsReportProps) {
  const [stats, setStats] = useState<TopProductStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      try {
        const res = await getTopProductsReport(products, storeId);
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
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600 flex items-center gap-1.5 mb-0.5">
            <Award className="w-4 h-4 text-amber-500" /> Mais Vendidos da Sua Loja
          </span>
          <h3 className="text-lg font-bold text-slate-900">Materiais com Maior Faturamento</h3>
        </div>

        <Link
          href="/dashboard/produtos"
          className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
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
              className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-2.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 text-xs font-black flex items-center justify-center shrink-0">
                    #{index + 1}
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs line-clamp-1">
                      {item.titulo}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1 uppercase">
                        {getTipoIcon(item.tipo)} {item.tipo}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-[10px] text-slate-500 font-bold">
                        R$ {item.preco.toFixed(2).replace('.', ',')} / unid.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-slate-900 block">
                    R$ {item.faturamentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold">
                    {item.unidadesVendidas} vendas
                  </span>
                </div>
              </div>

              {/* Progress Bar Indicator */}
              <div className="space-y-1">
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(item.porcentagem, 5)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>Participação nas vendas</span>
                  <span>{item.porcentagem}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
