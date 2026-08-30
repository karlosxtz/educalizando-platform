'use client';

import { useState, useEffect } from 'react';
import { getCurrentCreatorStore, updateStore } from '@/lib/store-service';
import { Store } from '@/lib/types';
import { Sparkles, Save, Loader2, Bot } from 'lucide-react';
import { toast } from 'sonner';

export default function IAConfigPage() {
  const [store, setStore] = useState<Store | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadStore() {
      try {
        const creatorStore = await getCurrentCreatorStore();
        setStore(creatorStore);
        setApiKey(creatorStore.google_ai_key || '');
      } catch (error) {
        console.error('Failed to load store', error);
        toast.error('Erro ao carregar configurações.');
      } finally {
        setLoading(false);
      }
    }
    loadStore();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store?.id) return;
    
    setSaving(true);
    try {
      await updateStore(store.id, { google_ai_key: apiKey });
      toast.success('Chave de IA atualizada com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar a chave.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-5">
        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inteligência Artificial</h1>
          <p className="text-slate-500">Configure seu assistente virtual para turbinar suas vendas.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 mb-2">
            <Bot className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-bold text-slate-900">Assistente de Marketing</h2>
          </div>
          <p className="text-sm text-slate-500 mt-1 leading-relaxed">
            Ao configurar sua chave do Google Gemini, nossa Inteligência Artificial será habilitada no seu painel. 
            Ela será responsável por gerar <strong>copys persuasivas para seus grupos de WhatsApp</strong>, 
            criar <strong>enquetes engajadoras para o Instagram</strong> e sugerir <strong>hashtags estratégicas exclusivas</strong> 
            para impulsionar o alcance dos seus produtos de forma automatizada e inteligente.
          </p>
        </div>
        
        <form onSubmit={handleSave} className="p-6 space-y-4 bg-white">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Chave API do Google Gemini
            </label>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none text-sm"
            />
            <p className="text-xs text-slate-500 mt-2">
              Sua chave é armazenada de forma segura e só será usada para gerar as suas próprias campanhas. Ela nunca será exibida publicamente.
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline ml-1 font-semibold">
                Obter minha chave gratuitamente
              </a>
            </p>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-70 shadow-md shadow-purple-500/20"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Salvando...' : 'Salvar Chave API'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
