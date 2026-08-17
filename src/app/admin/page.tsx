"use client";

import { useEffect, useState } from 'react';
import { Store, Package, Users, DollarSign, Activity, CreditCard } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface Stats {
  totalStores: number;
  totalProducts: number;
  totalPurchases: number;
  totalGrossRevenue: number;
  totalEducalizandoRevenue: number;
  totalAsaasFees: number;
}

interface ChartData {
  date: string;
  revenue: number;
  educalizandoRevenue: number;
  salesCount: number;
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/admin/stats');
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
          setChartData(data.chartData || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatDate = (dateStr: any) => {
    if (typeof dateStr !== 'string') return String(dateStr);
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [, month, day] = parts;
      return `${day}/${month}`;
    }
    return dateStr;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard Mestre</h1>
          <p className="text-slate-400 mt-1">Visão geral do sistema em tempo real.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 rounded-full text-sm font-medium border border-blue-500/20">
          <Activity className="w-4 h-4" />
          Sistema Operacional
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard 
          title="Vendas Globais" 
          value={loading ? '...' : formatCurrency(stats?.totalGrossRevenue || 0)} 
          icon={<DollarSign className="w-5 h-5 text-emerald-500" />} 
          trend="Total transacionado"
        />
        <StatCard 
          title="Receita Educalizando" 
          value={loading ? '...' : formatCurrency(stats?.totalEducalizandoRevenue || 0)} 
          icon={<DollarSign className="w-5 h-5 text-blue-500" />} 
          trend="Sua parte das vendas (Líquido)"
        />
        <StatCard 
          title="Taxas Asaas" 
          value={loading ? '...' : formatCurrency(stats?.totalAsaasFees || 0)} 
          icon={<CreditCard className="w-5 h-5 text-red-400" />} 
          trend="Custo do gateway"
        />
        <StatCard 
          title="Lojas Ativas" 
          value={loading ? '...' : String(stats?.totalStores || 0)} 
          icon={<Store className="w-5 h-5 text-purple-500" />} 
        />
        <StatCard 
          title="Produtos" 
          value={loading ? '...' : String(stats?.totalProducts || 0)} 
          icon={<Package className="w-5 h-5 text-amber-500" />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/50 rounded-2xl p-6 h-[400px] flex flex-col shadow-xl shadow-black/20">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Volume Financeiro Global (30 dias)</h3>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5 text-slate-300">
                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" /> Venda Global
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" /> Educalizando
              </div>
            </div>
          </div>
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-3">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium animate-pulse">Carregando dados...</p>
            </div>
          ) : (
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.6}/>
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorEducalizando" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.6}/>
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <filter id="shadow" height="200%">
                      <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.3"/>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.5} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickFormatter={formatDate} tickMargin={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `R$${v}`} tickLine={false} axisLine={false} tickMargin={8} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', borderColor: 'rgba(51, 65, 85, 0.5)', borderRadius: '12px', backdropFilter: 'blur(12px)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)', padding: '12px 16px' }}
                    itemStyle={{ fontSize: '14px', fontWeight: 500 }}
                    labelStyle={{ color: '#94a3b8', marginBottom: '8px', fontWeight: 600, fontSize: '13px' }}
                    formatter={(value: any, name: any) => [
                      <span key="value" style={{ color: name === 'revenue' ? '#34d399' : '#60a5fa' }}>{formatCurrency(Number(value) || 0)}</span>, 
                      name === 'revenue' ? 'Venda Global' : 'Educalizando'
                    ]}
                    labelFormatter={formatDate}
                    cursor={{ stroke: '#334155', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" style={{ filter: 'url(#shadow)' }} />
                  <Area type="monotone" dataKey="educalizandoRevenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorEducalizando)" style={{ filter: 'url(#shadow)' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/50 rounded-2xl p-6 h-[400px] flex flex-col shadow-xl shadow-black/20">
           <h3 className="text-lg font-semibold text-white mb-6">Vendas Diárias</h3>
           {loading ? (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-3">
               <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
               <p className="text-sm font-medium animate-pulse">Carregando dados...</p>
             </div>
           ) : (
             <div className="flex-1 w-full min-h-0">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                   <defs>
                     <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="0%" stopColor="#3b82f6" stopOpacity={1}/>
                       <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.8}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.5} />
                   <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickFormatter={formatDate} tickMargin={12} tickLine={false} axisLine={false} />
                   <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} tickLine={false} axisLine={false} tickMargin={8} />
                   <Tooltip 
                     contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', borderColor: 'rgba(51, 65, 85, 0.5)', borderRadius: '12px', backdropFilter: 'blur(12px)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)', padding: '12px 16px' }}
                     itemStyle={{ color: '#60a5fa', fontSize: '14px', fontWeight: 500 }}
                     labelStyle={{ color: '#94a3b8', marginBottom: '8px', fontWeight: 600, fontSize: '13px' }}
                     formatter={(value: any) => [Number(value) || 0, 'Pedidos Feitos']}
                     labelFormatter={formatDate}
                     cursor={{ fill: 'rgba(30, 41, 59, 0.4)' }}
                   />
                   <Bar dataKey="salesCount" fill="url(#colorSales)" radius={[6, 6, 0, 0]} maxBarSize={40} />
                 </BarChart>
               </ResponsiveContainer>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend }: { title: string, value: string | number, icon: React.ReactNode, trend?: string }) {
  return (
    <div className="bg-slate-950 border border-slate-800 p-6 rounded-xl hover:border-slate-700 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-400">{title}</h3>
        <div className="p-2 bg-slate-900 rounded-lg">
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-white mb-2">{value}</p>
      {trend && <p className="text-xs text-emerald-400 font-medium">{trend}</p>}
    </div>
  );
}
