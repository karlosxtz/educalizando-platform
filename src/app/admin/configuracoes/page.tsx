"use client";

import { DollarSign,MessageCircle,Percent,Save,Settings } from 'lucide-react';
import { useEffect,useState } from 'react';
import { toast } from 'sonner';

export default function SuperAdminConfiguracoes() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    platform_fee_percentage: 13,
    platform_fixed_fee: 0,
    minimum_withdrawal_amount: 50,
    withdrawal_fee: 0,
    whatsapp_module_charge_enabled: true,
    whatsapp_module_price_cents: 1990
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
            withdrawal_fee: data.settings.withdrawal_fee,
            whatsapp_module_charge_enabled: data.settings.whatsapp_module_charge_enabled !== false,
            whatsapp_module_price_cents: data.settings.whatsapp_module_price_cents || 1990
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
        toast.success('Configurações salvas com sucesso.');
      } else {
        toast.error(data.error || 'Não foi possível salvar as configurações.');
      }
    } catch (_error) {
      toast.error('Erro inesperado ao salvar as configurações.');
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
                  Taxa vigente da Plataforma (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.platform_fee_percentage}
                  readOnly
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-lg px-4 py-2 text-slate-300 cursor-not-allowed"
                />
                <p className="text-xs text-slate-500">Taxa do criador: 13% sobre o valor original em qualquer meio. No cartão, os juros de 5,99% em 1x a 18,79% em 12x são pagos pelo cliente.</p>
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
                  onChange={() => setFormData({...formData, platform_fixed_fee: 0})}
                  disabled
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-500">Não há cobrança fixa adicional.</p>
              </div>
            </div>

            <hr className="border-slate-800" />

            <section className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-5">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                    <MessageCircle className="h-5 w-5 text-emerald-400" />
                    Cobrança do WhatsApp da Loja
                  </h3>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
                    Quando a cobrança estiver ativa, apenas lojas com assinatura paga ou cortesia individual usam automações e campanhas. Desativada, o módulo fica gratuito para todas as lojas.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.whatsapp_module_charge_enabled}
                  onClick={() => setFormData(current => ({ ...current, whatsapp_module_charge_enabled: !current.whatsapp_module_charge_enabled }))}
                  className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${formData.whatsapp_module_charge_enabled ? 'bg-emerald-500' : 'bg-slate-700'}`}
                >
                  <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${formData.whatsapp_module_charge_enabled ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Estado atual</p>
                  <p className={`mt-2 font-bold ${formData.whatsapp_module_charge_enabled ? 'text-amber-300' : 'text-emerald-300'}`}>
                    {formData.whatsapp_module_charge_enabled ? 'Cobrança ativa' : 'Grátis para todas as lojas'}
                  </p>
                </div>
                <label className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Preço por 30 dias</span>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="font-bold text-slate-400">R$</span>
                    <input
                      type="number"
                      min="1"
                      max="10000"
                      step="0.01"
                      value={(formData.whatsapp_module_price_cents / 100).toFixed(2)}
                      onChange={(event) => setFormData(current => ({ ...current, whatsapp_module_price_cents: Math.round(Number(event.target.value || 0) * 100) }))}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                </label>
              </div>
              <p className="mt-4 text-xs leading-5 text-slate-500">Ao reativar a cobrança, lojas sem pagamento válido ou cortesia perdem o acesso e têm a comunicação da instância interrompida.</p>
            </section>

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
