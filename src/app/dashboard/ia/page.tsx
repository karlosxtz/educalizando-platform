'use client';

import { useState, useEffect } from 'react';
import { getCurrentCreatorStore, getProductsByStoreId, updateProduct } from '@/lib/store-service';
import { Store, Product } from '@/lib/types';
import { Sparkles, Save, Loader2, Bot, MessageSquare, Camera, Copy, Settings, CheckCircle2, Wand2, Search, FileText, BookOpen, X } from 'lucide-react';
import { toast } from 'sonner';
import { SCHOOL_CALENDAR_TAGS } from '@/lib/school-calendar';

export default function IAConfigPage() {
  const [store, setStore] = useState<Store | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Módulo Gerador States
  const [showConfig, setShowConfig] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [whatsappCopy, setWhatsappCopy] = useState('');
  const [instagramCopy, setInstagramCopy] = useState('');
  const [toolResult, setToolResult] = useState('');
  const [activeTool, setActiveTool] = useState('');
  const [proposal, setProposal] = useState<any>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedTags, setEditedTags] = useState<string[]>([]);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const creatorStore = await getCurrentCreatorStore();
        setStore(creatorStore);
        const settingsResponse = await fetch(`/api/ai/settings?storeId=${encodeURIComponent(creatorStore.id)}`);
        if (settingsResponse.ok) {
          const settings = await settingsResponse.json();
          setHasApiKey(Boolean(settings.configured));
          if (settings.configured) setShowConfig(false);
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
      const response = await fetch('/api/ai/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: store.id, apiKey })
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Erro ao salvar a chave.');
      }
      toast.success('Chave de IA atualizada com sucesso!');
      setHasApiKey(true);
      setApiKey('');
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

  const generateProductTool = async (tool: 'seo' | 'description' | 'campaign' | 'lesson') => {
    if (!selectedProductId || !store?.id) return toast.error('Selecione um material para continuar.');
    const selectedProduct = products.find(product => product.id === selectedProductId);
    setActiveTool(tool); setToolResult(''); setProposal(null);
    try {
      const response = await fetch('/api/ai/product-tools', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ storeId: store.id, productId: selectedProductId, tool }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Não foi possível gerar este conteúdo.');
      setToolResult(payload.result || '');
      if ((tool === 'seo' || tool === 'description') && payload.proposal) {
        setProposal({ ...payload.proposal, tool });
        setEditedTitle(payload.proposal.titles?.[0] || selectedProduct?.titulo || '');
        setEditedDescription(payload.proposal.description || selectedProduct?.descricao || '');
        setEditedTags(selectedProduct?.seasonal_tags || []);
        setEditorOpen(true);
      }
    } catch (error: any) { toast.error(error.message || 'Não foi possível gerar este conteúdo.'); } finally { setActiveTool(''); }
  };

  const applyProposal = async () => {
    if (!selectedProductId) return;
    setApplying(true);
    try {
      const updates: Partial<Product> = {};
      if (editedTitle.trim()) updates.titulo = editedTitle.trim();
      if (editedDescription.trim()) updates.descricao = editedDescription.trim();
      updates.seasonal_tags = editedTags;
      await updateProduct(selectedProductId, updates);
      setProducts(current => current.map(product => product.id === selectedProductId ? { ...product, ...updates } : product));
      setEditorOpen(false); toast.success('Produto atualizado com as escolhas da IA.');
    } catch (error: any) { toast.error(error.message || 'Não foi possível salvar o produto.'); } finally { setApplying(false); }
  };

  const activeProduct = products.find(product => product.id === selectedProductId) || null;

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
              {hasApiKey && (
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
            
            <div className="flex flex-col gap-4">
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

          <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-5">
            <div className="flex items-start gap-3"><div className="rounded-xl bg-violet-600 p-2 text-white"><Sparkles className="w-5 h-5" /></div><div><h3 className="font-black text-slate-900">Ferramentas para este material</h3><p className="mt-1 text-sm text-slate-600">Use a IA para preparar sua página, divulgação e uso pedagógico.</p></div></div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <AIToolButton icon={Search} label="Títulos e SEO" description="títulos, meta e palavras-chave" loading={activeTool === 'seo'} onClick={() => void generateProductTool('seo')} />
              <AIToolButton icon={FileText} label="Descrição de venda" description="benefícios e estrutura" loading={activeTool === 'description'} onClick={() => void generateProductTool('description')} />
              <AIToolButton icon={MessageSquare} label="Divulgação" description="WhatsApp e Instagram" loading={activeTool === 'campaign'} onClick={() => void generateProductTool('campaign')} />
              <AIToolButton icon={BookOpen} label="Roteiro pedagógico" description="uso em sala de aula" loading={activeTool === 'lesson'} onClick={() => void generateProductTool('lesson')} />
            </div>
            {toolResult && <div className="mt-4 overflow-hidden rounded-2xl border border-violet-100 bg-white"><div className="flex items-center justify-between border-b border-violet-100 bg-violet-50 px-4 py-3"><p className="text-sm font-black text-violet-900">Conteúdo gerado pela IA</p><button onClick={() => navigator.clipboard.writeText(toolResult).then(() => toast.success('Conteúdo copiado.'))} className="inline-flex items-center gap-1.5 text-xs font-black text-violet-700"><Copy className="w-3.5 h-3.5" /> Copiar</button></div><pre className="whitespace-pre-wrap p-4 font-sans text-sm leading-6 text-slate-700">{toolResult}</pre></div>}
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
      {editorOpen && proposal && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/60 p-3 sm:p-6">
          <div className="mx-auto my-4 w-full max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
            <header className="flex items-start justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-violet-700 to-fuchsia-600 px-5 py-5 text-white sm:px-7">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-100">Editor do material com IA</p>
                <h2 className="mt-1 text-xl font-black sm:text-2xl">Revise e salve as melhorias no seu produto</h2>
                <p className="mt-1 text-sm text-violet-100">Você controla cada informação antes de publicar a alteração.</p>
              </div>
              <button type="button" aria-label="Fechar editor" onClick={() => setEditorOpen(false)} className="rounded-xl bg-white/15 p-2 text-white transition hover:bg-white/25"><X className="h-5 w-5" /></button>
            </header>

            <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[240px_minmax(0,1fr)]">
              <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-wider text-slate-500">Material selecionado</p>
                {activeProduct?.capa_url ? (
                  <img src={activeProduct.capa_url} alt={`Capa de ${activeProduct.titulo}`} className="mt-3 aspect-[4/3] w-full rounded-xl object-cover shadow-sm" />
                ) : (
                  <div className="mt-3 flex aspect-[4/3] items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-fuchsia-100 text-violet-600"><BookOpen className="h-10 w-10" /></div>
                )}
                <h3 className="mt-4 line-clamp-3 text-base font-black text-slate-900">{activeProduct?.titulo || 'Material selecionado'}</h3>
                <p className="mt-1 text-sm text-slate-500">{activeProduct?.tipo || 'Material digital'}</p>
                <div className="mt-4 rounded-xl bg-white p-3 text-xs leading-5 text-slate-600">
                  A capa e o contexto ficam visíveis aqui para você editar o produto certo.
                </div>
              </aside>

              <section className="min-w-0 space-y-6">
                {proposal.analysis?.length ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-xs font-black uppercase tracking-wider text-amber-800">Diagnóstico da IA</p>
                    <ul className="mt-2 space-y-1 text-sm leading-6 text-amber-950">{proposal.analysis.map((item: string) => <li key={item}>• {item}</li>)}</ul>
                  </div>
                ) : null}

                <div className="rounded-2xl border border-slate-200 p-4 sm:p-5">
                  <div className="flex items-center gap-2"><Search className="h-4 w-4 text-violet-600" /><h3 className="font-black text-slate-900">1. Título do produto</h3></div>
                  <p className="mt-1 text-sm text-slate-500">Escolha uma sugestão ou escreva um título que descreva seu material com clareza.</p>
                  {proposal.titles?.length ? <div className="mt-3 grid gap-2">{proposal.titles.slice(0, 3).map((title: string) => <button key={title} type="button" onClick={() => setEditedTitle(title)} className={`rounded-xl border p-3 text-left text-sm font-bold transition ${editedTitle === title ? 'border-violet-600 bg-violet-50 text-violet-900' : 'border-slate-200 text-slate-700 hover:border-violet-300'}`}>{title}</button>)}</div> : null}
                  <input value={editedTitle} onChange={event => setEditedTitle(event.target.value)} placeholder="Título do seu material" className="mt-3 min-h-12 w-full rounded-xl border border-slate-300 px-3 text-sm font-semibold outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" />
                </div>

                <div className="rounded-2xl border border-slate-200 p-4 sm:p-5">
                  <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-violet-600" /><h3 className="font-black text-slate-900">2. Descrição de venda</h3></div>
                  <p className="mt-1 text-sm text-slate-500">Explique o que o material entrega, para quem serve e como será usado.</p>
                  <textarea value={editedDescription} onChange={event => setEditedDescription(event.target.value)} placeholder="Descreva o seu material" className="mt-3 min-h-40 w-full rounded-xl border border-slate-300 p-3 text-sm leading-6 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" />
                </div>

                <div className="rounded-2xl border border-slate-200 p-4 sm:p-5">
                  <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-violet-600" /><h3 className="font-black text-slate-900">3. Tags e temas</h3></div>
                  <p className="mt-1 text-sm text-slate-500">As tags ajudam educadores a encontrar o material por tema e data pedagógica.</p>
                  <div className="mt-3 flex flex-wrap gap-2">{editedTags.length ? editedTags.map(tag => <button key={tag} type="button" onClick={() => setEditedTags(tags => tags.filter(item => item !== tag))} className="rounded-full bg-violet-100 px-3 py-1.5 text-xs font-bold text-violet-800">{tag} ×</button>) : <span className="text-sm text-slate-500">Nenhuma tag selecionada ainda.</span>}</div>
                  <details className="mt-4 rounded-xl bg-slate-50 p-3"><summary className="cursor-pointer text-sm font-black text-violet-700">Adicionar ou remover tags</summary><div className="mt-3 flex flex-wrap gap-2">{SCHOOL_CALENDAR_TAGS.map(tag => <button key={tag} type="button" onClick={() => setEditedTags(tags => tags.includes(tag) ? tags.filter(item => item !== tag) : [...tags, tag])} className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${editedTags.includes(tag) ? 'border-violet-600 bg-violet-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-violet-300'}`}>{tag}</button>)}</div></details>
                </div>

                {(proposal.metaDescription || proposal.keywords?.length) ? <div className="rounded-2xl bg-slate-900 p-4 text-white sm:p-5"><p className="text-xs font-black uppercase tracking-wider text-violet-200">Prévia para busca</p>{proposal.metaDescription ? <p className="mt-2 text-sm leading-6 text-slate-100"><span className="font-bold text-white">Meta descrição sugerida: </span>{proposal.metaDescription}</p> : null}{proposal.keywords?.length ? <p className="mt-2 text-sm leading-6 text-slate-300"><span className="font-bold text-white">Palavras-chave: </span>{proposal.keywords.join(', ')}</p> : null}</div> : null}
              </section>
            </div>

            <footer className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7"><p className="text-xs leading-5 text-slate-500">Ao salvar, título, descrição e tags serão atualizados neste produto.</p><div className="flex gap-2"><button type="button" onClick={() => setEditorOpen(false)} className="min-h-11 rounded-xl px-4 text-sm font-bold text-slate-600 hover:bg-slate-200">Cancelar</button><button type="button" onClick={() => void applyProposal()} disabled={applying} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 disabled:opacity-60">{applying && <Loader2 className="h-4 w-4 animate-spin" />} Salvar alterações</button></div></footer>
          </div>
        </div>
      )}
    </div>
  );
}

function AIToolButton({ icon: Icon, label, description, loading, onClick }: { icon: any; label: string; description: string; loading: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} disabled={loading} className="group min-h-24 rounded-xl border border-violet-100 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md disabled:opacity-60"><div className="flex items-center gap-2"><span className="rounded-lg bg-violet-100 p-1.5 text-violet-700">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}</span><span className="text-sm font-black text-slate-900">{label}</span></div><p className="mt-2 text-xs leading-5 text-slate-500">{loading ? 'A IA está preparando...' : description}</p></button>;
}
