'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Calendar, BarChart3, LineChart, Loader2 } from 'lucide-react';
import { PeriodFilter, SalesDataPoint } from '@/lib/types';
import { getSalesDataByPeriod } from '@/lib/sales-service';

interface SalesOverviewChartProps {
  storeId?: string;
  onDataLoaded?: (totalRevenue: number, totalSalesCount: number) => void;
}

export default function SalesOverviewChart({ storeId, onDataLoaded }: SalesOverviewChartProps) {
  const [period, setPeriod] = useState<PeriodFilter>('7d');
  const [viewMode, setViewMode] = useState<'revenue' | 'volume'>('revenue');
  const [data, setData] = useState<SalesDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    async function fetchChartData() {
      setLoading(true);
      try {
        const res = await getSalesDataByPeriod(storeId || '', period);
        setData(res);
        if (onDataLoaded) {
          const totRev = res.reduce((acc, curr) => acc + curr.revenue, 0);
          const totCount = res.reduce((acc, curr) => acc + curr.salesCount, 0);
          onDataLoaded(totRev, totCount);
        }
      } catch (err) {
        console.error('Erro ao carregar dados do gráfico:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchChartData();
  }, [storeId, period]);

  const maxRevenue = Math.max(...data.map(d => d.revenue), 100);
  const maxSales = Math.max(...data.map(d => d.salesCount), 10);
  const maxValue = viewMode === 'revenue' ? maxRevenue : maxSales;

  // Chart dimensions
  const svgWidth = 700;
  const svgHeight = 240;
  const paddingX = 40;
  const paddingY = 30;

  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingY * 2;

  // Compute point coordinates
  const points = data.map((d, index) => {
    const val = viewMode === 'revenue' ? d.revenue : d.salesCount;
    const x = paddingX + (index / Math.max(data.length - 1, 1)) * chartWidth;
    const y = svgHeight - paddingY - (val / (maxValue * 1.15)) * chartHeight;
    return { x, y, val, item: d };
  });

  // SVG Area & Line Paths
  const linePath = points.length > 0
    ? points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '')
    : '';

  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${points[0].x} ${svgHeight - paddingY} Z`
    : '';

  const totalRevenue = data.reduce((acc, d) => acc + d.revenue, 0);
  const totalSales = data.reduce((acc, d) => acc + d.salesCount, 0);
  const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-blue-600 mb-1">
            <TrendingUp className="w-4 h-4" /> Desempenho Financeiro Real-Time
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            {viewMode === 'revenue' ? `R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : `${totalSales} vendas PIX`}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Ticket Médio por Venda: <strong className="text-slate-900 font-bold">R$ {averageTicket.toFixed(2).replace('.', ',')}</strong>
          </p>
        </div>

        {/* View Mode & Period Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Mode Switcher */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setViewMode('revenue')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                viewMode === 'revenue' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" /> Receita
            </button>
            <button
              onClick={() => setViewMode('volume')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                viewMode === 'volume' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" /> Quantidade
            </button>
          </div>

          {/* Period Filter Buttons */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs font-bold">
            {(['7d', '30d', 'month', 'year'] as PeriodFilter[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-2.5 py-1.5 rounded-lg uppercase tracking-wider transition-all ${
                  period === p ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : p === 'month' ? 'Este Mês' : 'Ano'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Interactive Chart Canvas */}
      <div className="relative w-full overflow-x-auto">
        {loading ? (
          <div className="h-64 flex items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : (
          <div className="min-w-[400px] sm:min-w-[500px]">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto overflow-visible select-none"
            >
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.33, 0.66, 1].map((ratio, i) => {
                const y = paddingY + ratio * chartHeight;
                return (
                  <line
                    key={i}
                    x1={paddingX}
                    y1={y}
                    x2={svgWidth - paddingX}
                    y2={y}
                    stroke="#e2e8f0"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Area fill */}
              <motion.path
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                d={areaPath}
                fill="url(#chartGradient)"
              />

              {/* Smooth Trend Line */}
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                d={linePath}
                fill="none"
                stroke="#2563eb"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points & Interactive Hover Hotspots */}
              {points.map((p, i) => {
                const isHovered = hoveredIndex === i;
                return (
                  <g key={i} className="cursor-pointer" onMouseEnter={() => setHoveredIndex(i)} onMouseLeave={() => setHoveredIndex(null)}>
                    {/* Vertical Highlight Bar on Hover */}
                    {isHovered && (
                      <line
                        x1={p.x}
                        y1={paddingY}
                        x2={p.x}
                        y2={svgHeight - paddingY}
                        stroke="#93c5fd"
                        strokeWidth="2"
                        strokeDasharray="3 3"
                      />
                    )}

                    {/* Outer Circle Ring */}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isHovered ? "7" : "4.5"}
                      className="fill-white stroke-blue-600 transition-all duration-150"
                      strokeWidth="3"
                    />

                    {/* X-Axis Label */}
                    <text
                      x={p.x}
                      y={svgHeight - 8}
                      textAnchor="middle"
                      className="text-[11px] font-bold fill-slate-500"
                    >
                      {p.item.label}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Interactive Tooltip Card Overlay */}
            {hoveredIndex !== null && points[hoveredIndex] && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute z-20 bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 pointer-events-none"
                style={{
                  left: `${(points[hoveredIndex].x / svgWidth) * 100}%`,
                  top: '10px',
                  transform: 'translateX(-50%)'
                }}
              >
                <div className="font-extrabold border-b border-slate-700 pb-1 text-blue-300">
                  {points[hoveredIndex].item.label} ({points[hoveredIndex].item.date})
                </div>
                <div className="flex justify-between items-center gap-4 pt-0.5">
                  <span className="text-slate-400">Faturamento:</span>
                  <span className="font-black text-emerald-400">
                    R$ {points[hoveredIndex].item.revenue.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-4">
                  <span className="text-slate-400">Vendas via PIX:</span>
                  <span className="font-bold text-white">
                    {points[hoveredIndex].item.salesCount} unidades
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
