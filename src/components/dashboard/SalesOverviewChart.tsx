'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, BarChart3, Loader2, LineChart } from 'lucide-react';
import { PeriodFilter, SalesDataPoint } from '@/lib/types';
import { getSalesDataByPeriod } from '@/lib/sales-service';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface SalesOverviewChartProps {
  storeId?: string;
  onDataLoaded?: (totalRevenue: number, totalSalesCount: number, conversionRate: number) => void;
}

export default function SalesOverviewChart({ storeId, onDataLoaded }: SalesOverviewChartProps) {
  const [period, setPeriod] = useState<PeriodFilter>('7d');
  const [viewMode, setViewMode] = useState<'revenue' | 'volume'>('revenue');
  const [data, setData] = useState<SalesDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchChartData() {
      setLoading(true);
      try {
        const res = await getSalesDataByPeriod(storeId || '', period);
        setData(res.chartData);
        if (onDataLoaded) {
          const totRev = res.chartData.reduce((acc, curr) => acc + curr.revenue, 0);
          const totCount = res.chartData.reduce((acc, curr) => acc + curr.salesCount, 0);
          const conversionRate = res.totalGeneratedCount > 0 ? (totCount / res.totalGeneratedCount) * 100 : 0;
          onDataLoaded(totRev, totCount, conversionRate);
        }
      } catch (err) {
        console.error('Erro ao carregar dados do gráfico:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchChartData();
  }, [storeId, period, onDataLoaded]);

  const totalRevenue = data.reduce((acc, d) => acc + d.revenue, 0);
  const totalSales = data.reduce((acc, d) => acc + d.salesCount, 0);
  const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

  return (
    <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-blue-600 mb-2">
            <TrendingUp className="w-4 h-4" /> Desempenho Financeiro
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {viewMode === 'revenue' ? `R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : `${totalSales} vendas`}
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Desempenho de Vendas
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Acompanhe a receita e volume do seu negócio</p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* View Toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center shadow-inner">
            <button
              onClick={() => setViewMode('revenue')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                viewMode === 'revenue' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <LineChart className="w-4 h-4" /> Receita
            </button>
            <button
              onClick={() => setViewMode('sales')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                viewMode === 'sales' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <BarChart3 className="w-4 h-4" /> Vendas
            </button>
          </div>

          {/* Period Filter Tabs */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center shadow-inner text-xs font-bold">
            {(['7d', '30d', 'month', 'year'] as PeriodFilter[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg uppercase tracking-wider transition-all ${
                  period === p ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : p === 'month' ? 'Mês' : 'Ano'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recharts Canvas */}
      <div className="relative w-full h-[320px] z-10">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-sm font-medium animate-pulse">Analisando dados...</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === 'revenue' ? (
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.25}/>
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                  <filter id="shadowRev" height="200%">
                    <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#2563eb" floodOpacity="0.2"/>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6} />
                <XAxis dataKey="label" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickMargin={12} />
                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `R$${v}`} tickLine={false} axisLine={false} tickMargin={8} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderColor: '#e2e8f0', borderRadius: '16px', backdropFilter: 'blur(12px)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', padding: '12px 16px' }}
                  itemStyle={{ color: '#2563eb', fontSize: '15px', fontWeight: 700 }}
                  labelStyle={{ color: '#64748b', marginBottom: '4px', fontWeight: 600, fontSize: '13px' }}
                  formatter={(value: any) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Receita']}
                  labelFormatter={(label, payload) => {
                    if (payload && payload.length > 0) {
                      return `${label} (${payload[0].payload.date})`;
                    }
                    return label;
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" style={{ filter: 'url(#shadowRev)' }} />
              </AreaChart>
            ) : (
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6} />
                <XAxis dataKey="label" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickMargin={12} />
                <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} tickLine={false} axisLine={false} tickMargin={8} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderColor: '#e2e8f0', borderRadius: '16px', backdropFilter: 'blur(12px)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', padding: '12px 16px' }}
                  itemStyle={{ color: '#2563eb', fontSize: '15px', fontWeight: 700 }}
                  labelStyle={{ color: '#64748b', marginBottom: '4px', fontWeight: 600, fontSize: '13px' }}
                  formatter={(value: any) => [`${value} unidades`, 'Vendas']}
                  labelFormatter={(label, payload) => {
                    if (payload && payload.length > 0) {
                      return `${label} (${payload[0].payload.date})`;
                    }
                    return label;
                  }}
                  cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }}
                />
                <Bar dataKey="salesCount" fill="url(#colorVol)" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
