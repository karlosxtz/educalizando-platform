"use client";

import { useEffect, useState } from 'react';
import { Settings, Save, Percent, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function SuperAdminConfiguracoes() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    platform_fee_percentage: 13,
    platform_fixed_fee: 0,
    minimum_withdrawal_amount: 50,
    withdrawal_fee: 0,
    whatsapp_template_creator: '',
    whatsapp_template_student: '',
    whatsapp_template_affiliate: '',
    whatsapp_template_creator_sale: '',
    whatsapp_template_buyer_sale: ''
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
            whatsapp_template_creator: data.settings.whatsapp_template_creator || '',
            whatsapp_template_student: data.settings.whatsapp_template_student || '',
            whatsapp_template_affiliate: data.settings.whatsapp_template_affiliate || '',
            whatsapp_template_creator_sale: data.settings.whatsapp_template_creator_sale || '',
            whatsapp_template_buyer_sale: data.settings.whatsapp_template_buyer_sale || ''
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
    } catch (error) {
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
                <p className="text-xs text-slate-500">Taxa fixa vigente da Educalizando: 13% por venda.</p>
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

            <hr className="border-slate-800" />

            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2 pt-4">
              <Settings className="w-5 h-5 text-green-500" />
              Templates de Boas-vindas (WhatsApp)
            </h2>
            <p className="text-sm text-slate-400 mb-6">Você pode utilizar a variável <code className="bg-slate-800 px-1 rounded text-blue-400">{`{{nome}}`}</code> para inserir o primeiro nome do usuário.</p>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  Novo Lojista (Creator)
                </label>
                <textarea
                  rows={5}
                  value={formData.whatsapp_template_creator}
                  onChange={(e) => setFormData({...formData, whatsapp_template_creator: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Olá {{nome}}! ..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  Novo Cliente
                </label>
                <textarea
                  rows={5}
                  value={formData.whatsapp_template_student}
                  onChange={(e) => setFormData({...formData, whatsapp_template_student: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Oie {{nome}}! ..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  Novo Afiliado (Affiliate)
                </label>
                <textarea
                  rows={5}
                  value={formData.whatsapp_template_affiliate}
                  onChange={(e) => setFormData({...formData, whatsapp_template_affiliate: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Olá {{nome}}! ..."
                />
              </div>
            </div>

            <hr className="border-slate-800" />

            <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2 pt-2">
              <Settings className="w-5 h-5 text-emerald-500" />
              Alertas de Compra Confirmada
            </h2>
            <p className="text-sm text-slate-400 mb-6">Os alertas são enviados após confirmação do pagamento. Use <code className="bg-slate-800 px-1 rounded text-blue-400">{'{{nome}}'}</code>, <code className="bg-slate-800 px-1 rounded text-blue-400">{'{{comprador}}'}</code>, <code className="bg-slate-800 px-1 rounded text-blue-400">{'{{produto}}'}</code>, <code className="bg-slate-800 px-1 rounded text-blue-400">{'{{valor}}'}</code> e <code className="bg-slate-800 px-1 rounded text-blue-400">{'{{pedido}}'}</code>.</p>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Alerta para criador</label>
                <textarea rows={5} value={formData.whatsapp_template_creator_sale} onChange={(e) => setFormData({...formData, whatsapp_template_creator_sale: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="💰 Nova venda confirmada! ..." />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Confirmação para Cliente</label>
                <textarea rows={5} value={formData.whatsapp_template_buyer_sale} onChange={(e) => setFormData({...formData, whatsapp_template_buyer_sale: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="✅ Compra confirmada! ..." />
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
