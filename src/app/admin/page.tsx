"use client";

import { useEffect, useState } from 'react';
import { Store, Package, Users, DollarSign, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface Stats {
  totalStores: number;
  totalProducts: number;
  totalPurchases: number;
  totalRevenue: number;
}

interface ChartData {
  date: string;
  revenue: number;
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Faturamento Bruto" 
          value={loading ? '...' : formatCurrency(stats?.totalRevenue || 0)} 
          icon={<DollarSign className="w-5 h-5 text-emerald-500" />} 
          trend="Últimos 30 dias"
        />
        <StatCard 
          title="Lojas Ativas" 
          value={loading ? '...' : String(stats?.totalStores || 0)} 
          icon={<Store className="w-5 h-5 text-blue-500" />} 
        />
        <StatCard 
          title="Produtos Publicados" 
          value={loading ? '...' : String(stats?.totalProducts || 0)} 
          icon={<Package className="w-5 h-5 text-purple-500" />} 
        />
        <StatCard 
          title="Alunos / Matrículas" 
          value={loading ? '...' : String(stats?.totalPurchases || 0)} 
          icon={<Users className="w-5 h-5 text-amber-500" />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-xl p-6 h-96 flex flex-col">
          <h3 className="text-lg font-medium text-white mb-6">Volume Financeiro (30 dias)</h3>
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-slate-500">Carregando gráfico...</div>
          ) : (
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="date" stroke="#475569" fontSize={12} tickFormatter={formatDate} tickMargin={10} />
                  <YAxis stroke="#475569" fontSize={12} tickFormatter={(v) => `R$${v}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                    itemStyle={{ color: '#10b981' }}
                    labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                    formatter={(value: number) => [formatCurrency(value), 'Faturamento']}
                    labelFormatter={formatDate}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 h-96 flex flex-col">
           <h3 className="text-lg font-medium text-white mb-6">Vendas Diárias</h3>
           {loading ? (
             <div className="flex-1 flex items-center justify-center text-slate-500">Carregando gráfico...</div>
           ) : (
             <div className="flex-1 w-full min-h-0">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                   <XAxis dataKey="date" stroke="#475569" fontSize={12} tickFormatter={formatDate} tickMargin={10} />
                   <YAxis stroke="#475569" fontSize={12} allowDecimals={false} />
                   <Tooltip 
                     contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                     itemStyle={{ color: '#3b82f6' }}
                     labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                     formatter={(value: number) => [value, 'Pedidos']}
                     labelFormatter={formatDate}
                     cursor={{ fill: '#1e293b' }}
                   />
                   <Bar dataKey="salesCount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
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
