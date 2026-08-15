"use client";

import { useEffect, useState } from 'react';
import { Settings, Save, Percent, DollarSign } from 'lucide-react';

export default function SuperAdminConfiguracoes() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    platform_fee_percentage: 10,
    platform_fixed_fee: 0,
    minimum_withdrawal_amount: 50,
    withdrawal_fee: 0
  });

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/admin/settings');
        const data = await res.json();
        if (data.success && data.settings) {
          setFormData({
            platform_fee_percentage: data.settings.platform_fee_percentage,
            platform_fixed_fee: data.settings.platform_fixed_fee,
            minimum_withdrawal_amount: data.settings.minimum_withdrawal_amount,
            withdrawal_fee: data.settings.withdrawal_fee
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        alert('Configurações salvas com sucesso!');
      } else {
        alert('Erro ao salvar: ' + data.error);
      }
    } catch (error) {
      alert('Erro inesperado');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Configurações Globais</h1>
        <p className="text-slate-400 mt-1">Gerencie as taxas e regras mestras do EducalizandoOS.</p>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-500" />
          Motor de Taxas
        </h2>
        
        {loading ? (
          <p className="text-slate-500">Carregando configurações...</p>
        ) : (
          <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Percent className="w-4 h-4 text-emerald-500" />
                  Taxa da Plataforma (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.platform_fee_percentage}
                  onChange={(e) => setFormData({...formData, platform_fee_percentage: Number(e.target.value)})}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-500">Porcentagem retida de cada venda.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  Taxa Fixa da Plataforma (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.platform_fixed_fee}
                  onChange={(e) => setFormData({...formData, platform_fixed_fee: Number(e.target.value)})}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-500">Valor fixo cobrado adicionalmente em cada venda.</p>
              </div>
            </div>

            <hr className="border-slate-800" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-amber-500" />
                  Saque Mínimo (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.minimum_withdrawal_amount}
                  onChange={(e) => setFormData({...formData, minimum_withdrawal_amount: Number(e.target.value)})}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-amber-500" />
                  Taxa de Saque (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.withdrawal_fee}
                  onChange={(e) => setFormData({...formData, withdrawal_fee: Number(e.target.value)})}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-500">Custo repassado ao criador para transferências.</p>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button 
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
