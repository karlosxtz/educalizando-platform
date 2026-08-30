'use client';

import { useState, useEffect } from 'react';
import { getCurrentCreatorStore, updateStore, getProductsByStoreId } from '@/lib/store-service';
import { Store, Product } from '@/lib/types';
import { Sparkles, Save, Loader2, Bot, MessageSquare, Camera, Copy, Settings, CheckCircle2, Wand2 } from 'lucide-react';
import { toast } from 'sonner';

export default function IAConfigPage() {
  const [store, setStore] = useState<Store | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Módulo Gerador States
  const [showConfig, setShowConfig] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [whatsappCopy, setWhatsappCopy] = useState('');
  const [instagramCopy, setInstagramCopy] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const creatorStore = await getCurrentCreatorStore();
        setStore(creatorStore);
        setApiKey(creatorStore.google_ai_key || '');
        
        if (creatorStore.google_ai_key) {
          setShowConfig(false);
        }

        if (creatorStore.id) {
          const prods = await getProductsByStoreId(creatorStore.id);
          const publishedProds = prods.filter(p => p.status === 'publicado');
          setProducts(publishedProds);
          if (publishedProds.length > 0) {
            setSelectedProductId(publishedProds[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to load store', error);
        toast.error('Erro ao carregar configurações.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store?.id) return;
    
    setSaving(true);
    try {
      await updateStore(store.id, { google_ai_key: apiKey });
      toast.success('Chave de IA atualizada com sucesso!');
      setShowConfig(false);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar a chave.');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateCampaign = async () => {
    if (!selectedProductId || !store?.id) {
      toast.error('Selecione um produto para gerar a campanha.');
      return;
    }

    const selectedProduct = products.find(p => p.id === selectedProductId);
    if (!selectedProduct) return;

    setGenerating(true);
    setWhatsappCopy('');
    setInstagramCopy('');
    const loadingToast = toast.loading('A Inteligência Artificial está escrevendo sua campanha...');

    try {
      const res = await fetch('/api/ai/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: selectedProduct.titulo,
          storeId: store.id
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Falha ao comunicar com a API do Gemini.');
      }

      const campaignText = data.campaign || '';
      
      // Separar pelo delimitador
      const parts = campaignText.split('--- INSTAGRAM ---');
      let wpp = parts[0] || '';
      let insta = parts[1] || '';

      // Limpar marcador do WhatsApp se existir
      wpp = wpp.replace(/--- WHATSAPP ---/gi, '').trim();
      insta = insta.trim();

      setWhatsappCopy(wpp);
      setInstagramCopy(insta);
      
      toast.success('Campanha magnética gerada com sucesso!', { id: loadingToast });
    } catch (err: any) {
      toast.error(err.message, { id: loadingToast });
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string, type: 'whatsapp' | 'instagram') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`Cópia para ${type === 'whatsapp' ? 'WhatsApp' : 'Instagram'} copiada para área de transferência!`);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">IA de Marketing</h1>
            <p className="text-slate-500 text-sm">Gerador de Campanhas & Copys de Alta Conversão</p>
          </div>
        </div>
        {!showConfig && (
          <button 
            onClick={() => setShowConfig(true)}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-purple-600 bg-white border border-slate-200 px-3 py-2 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" /> Configurar Chave API
          </button>
        )}
      </div>

      {showConfig ? (
        // VIEW: CONFIGURAÇÃO DE CHAVE
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in zoom-in-95">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-bold text-slate-900">Conectar Google Gemini</h2>
              </div>
              {store?.google_ai_key && (
                <button onClick={() => setShowConfig(false)} className="text-xs font-bold text-purple-600 hover:underline">
                  Voltar para o Gerador
                </button>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Ao configurar sua chave do Google Gemini, nossa Inteligência Artificial será habilitada. 
              Ela gerará <strong>copys persuasivas para grupos VIPs</strong> e 
              <strong>enquetes para o Instagram</strong> automaticamente.
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
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none text-sm font-mono"
              />
              <p className="text-xs text-slate-500 mt-2">
                Sua chave é armazenada de forma segura. Ela nunca será exibida publicamente.
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline ml-1 font-semibold">
                  Obter minha chave gratuita
                </a>
              </p>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving || !apiKey}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-70 shadow-md shadow-purple-500/20"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Salvando...' : 'Salvar Chave e Acessar Gerador'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        // VIEW: GERADOR DE CAMPANHAS
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Action Bar */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-purple-600" /> Qual material você quer vender hoje?
            </h3>
            
            <div className="flex flex-col md:flex-row gap-4">
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-sm font-medium text-slate-700"
              >
                {products.length === 0 ? (
                  <option value="">Nenhum produto publicado encontrado.</option>
                ) : (
                  products.map(p => (
                    <option key={p.id} value={p.id}>{p.titulo}</option>
                  ))
                )}
              </select>
              
              <button
                onClick={handleGenerateCampaign}
                disabled={generating || !selectedProductId}
                className="md:w-auto w-full flex justify-center items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-70 shadow-lg shadow-purple-500/25 whitespace-nowrap"
              >
                {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {generating ? 'A IA está escrevendo...' : 'Gerar Campanha de Vendas'}
              </button>
            </div>
          </div>

          {/* Results Area */}
          {(whatsappCopy || instagramCopy) && (
            <div className="grid md:grid-cols-2 gap-6 pt-4 animate-in fade-in zoom-in-95">
              {/* WhatsApp Card */}
              {whatsappCopy && (
                <div className="bg-white rounded-2xl border-2 border-green-100 shadow-sm overflow-hidden flex flex-col h-full">
                  <div className="bg-green-50 p-4 border-b border-green-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <h4 className="font-bold text-green-900">Grupo VIP / WhatsApp</h4>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(whatsappCopy, 'whatsapp')}
                      className="text-xs font-bold bg-white text-green-700 border border-green-200 hover:bg-green-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copiar
                    </button>
                  </div>
                  <div className="p-5 flex-1 bg-slate-50/50">
                    <div className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed font-medium">
                      {whatsappCopy}
                    </div>
                  </div>
                </div>
              )}

              {/* Instagram Card */}
              {instagramCopy && (
                <div className="bg-white rounded-2xl border-2 border-pink-100 shadow-sm overflow-hidden flex flex-col h-full">
                  <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-4 border-b border-pink-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center text-white">
                        <Camera className="w-4 h-4" />
                      </div>
                      <h4 className="font-bold text-pink-900">Instagram & Stories</h4>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(instagramCopy, 'instagram')}
                      className="text-xs font-bold bg-white text-pink-700 border border-pink-200 hover:bg-pink-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copiar
                    </button>
                  </div>
                  <div className="p-5 flex-1 bg-slate-50/50">
                    <div className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed font-medium">
                      {instagramCopy}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
