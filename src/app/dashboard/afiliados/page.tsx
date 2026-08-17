"use client";

import { useEffect, useState } from 'react';
import { getStoreAffiliates, updateAffiliateStatus } from '@/lib/affiliate-service';
import { getCurrentCreatorStore } from '@/lib/store-service';
import { Affiliate, Store } from '@/lib/types';
import { Users, CheckCircle, XCircle, Settings, TrendingUp } from 'lucide-react';
import { updateStoreSettings } from '@/app/actions/store-actions'; // we will need an action for this or use supabase directly
import { supabase } from '@/lib/supabase';

export default function CreatorAffiliatesPage() {
  const [store, setStore] = useState<Store | null>(null);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Settings state
  const [isProgramEnabled, setIsProgramEnabled] = useState(false);
  const [commissionType, setCommissionType] = useState<'percentual' | 'fixo'>('percentual');
  const [commissionRate, setCommissionRate] = useState(30);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      const myStore = await getCurrentCreatorStore();
      if (myStore) {
        setStore(myStore);
        setIsProgramEnabled(myStore.affiliate_program_enabled || false);
        setCommissionType(myStore.affiliate_commission_type || 'percentual');
        setCommissionRate(myStore.affiliate_commission_rate || 30);
        
        const myAffiliates = await getStoreAffiliates(myStore.id);
        setAffiliates(myAffiliates);
      }
    } catch (e) {
      console.error('Failed to load affiliates', e);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSaveSettings() {
    if (!store) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('stores')
        .update({ 
          affiliate_program_enabled: isProgramEnabled,
          affiliate_commission_type: commissionType,
          affiliate_commission_rate: commissionRate
        })
        .eq('id', store.id);
        
      if (!error) {
        alert('Configurações salvas com sucesso!');
      } else {
        alert('Erro ao salvar as configurações.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleStatusChange(id: string, status: 'aprovado' | 'rejeitado') {
    const ok = await updateAffiliateStatus(id, status);
    if (ok) {
      setAffiliates(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    }
  }

  if (isLoading) {
    return <div className="p-8">Carregando afiliados...</div>;
  }

  if (!store) {
    return <div className="p-8">Você precisa configurar sua loja primeiro.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Programa de Afiliados</h1>
        <p className="text-slate-500 mt-1">Gerencie seus parceiros de vendas e configure suas comissões.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configurações do Programa */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Settings className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Configurações</h2>
            </div>
            
            <div className="space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isProgramEnabled}
                  onChange={(e) => setIsProgramEnabled(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-700">Habilitar programa de afiliados</span>
              </label>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tipo de Comissão
                </label>
                <select
                  value={commissionType}
                  onChange={(e) => setCommissionType(e.target.value as 'percentual' | 'fixo')}
                  disabled={!isProgramEnabled}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 mb-4"
                >
                  <option value="percentual">Porcentagem (%)</option>
                  <option value="fixo">Valor Fixo (R$)</option>
                </select>

                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Valor da Comissão
                </label>
                <div className="relative">
                  {commissionType === 'fixo' && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-slate-500 sm:text-sm">R$</span>
                    </div>
                  )}
                  <input 
                    type="number" 
                    min="1"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(Number(e.target.value))}
                    className={`w-full ${commissionType === 'fixo' ? 'pl-9' : 'pl-3'} pr-10 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
                    disabled={!isProgramEnabled}
                  />
                  {commissionType === 'percentual' && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-slate-400 sm:text-sm">%</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Esta é a taxa que seus afiliados receberão automaticamente por cada venda concluída.
                </p>
              </div>

              <button 
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Salvando...' : 'Salvar Configurações'}
              </button>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-500/20">
            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" /> 
              Potencialize suas Vendas
            </h3>
            <p className="text-indigo-100 text-sm mb-4 leading-relaxed">
              Afiliados podem aumentar suas vendas em até 300%. Forneça bons materiais de divulgação para eles.
            </p>
            <div className="text-xs font-medium bg-white/20 inline-block px-3 py-1 rounded-full backdrop-blur-sm">
              Link de Convite Ativo
            </div>
          </div>
        </div>

        {/* Lista de Afiliados */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                  <Users className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">Seus Afiliados</h2>
              </div>
              <div className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                {affiliates.length} Parceiros
              </div>
            </div>
            
            <div className="divide-y divide-slate-100">
              {affiliates.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-slate-900 font-medium">Nenhum afiliado ainda</h3>
                  <p className="text-slate-500 text-sm mt-1">
                    Quando alguém solicitar afiliação à sua loja, aparecerá aqui.
                  </p>
                </div>
              ) : (
                affiliates.map(affiliate => (
                  <div key={affiliate.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      {affiliate.user?.avatar_url ? (
                        <img src={affiliate.user.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-medium">
                          {affiliate.user?.full_name?.charAt(0).toUpperCase() || 'A'}
                        </div>
                      )}
                      <div>
                        <h4 className="font-medium text-slate-900">{affiliate.user?.full_name || 'Usuário Desconhecido'}</h4>
                        <p className="text-sm text-slate-500">{affiliate.user?.email}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            affiliate.status === 'aprovado' ? 'bg-green-100 text-green-700' :
                            affiliate.status === 'rejeitado' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {affiliate.status.toUpperCase()}
                          </span>
                          {affiliate.commission_rate && (
                            <span className="text-xs font-medium bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                              Taxa Especial: {affiliate.commission_type === 'fixo' ? `R$ ${affiliate.commission_rate}` : `${affiliate.commission_rate}%`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {affiliate.status === 'pendente' && (
                        <>
                          <button 
                            onClick={() => handleStatusChange(affiliate.id, 'aprovado')}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg text-sm font-medium transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" /> Aprovar
                          </button>
                          <button 
                            onClick={() => handleStatusChange(affiliate.id, 'rejeitado')}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors"
                          >
                            <XCircle className="w-4 h-4" /> Rejeitar
                          </button>
                        </>
                      )}
                      {affiliate.status === 'aprovado' && (
                        <button 
                          onClick={() => handleStatusChange(affiliate.id, 'rejeitado')}
                          className="px-3 py-1.5 text-slate-400 hover:text-red-600 text-sm font-medium transition-colors"
                        >
                          Revogar
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
