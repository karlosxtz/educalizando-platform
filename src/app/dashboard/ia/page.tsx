'use client';
import { notifySeoSaved, onSeoSaved } from '@/lib/seo-sync';

import { readApiJson } from '@/lib/api-response';
import { aiFetch, requestAiJson } from '@/lib/ai-client';
import { getCategories,getEducationLevels } from '@/lib/category-service';
import { getCurrentCreatorStore,getProductsByStoreId } from '@/lib/store-service';
import { Category,EducationLevel,Product,Store } from '@/lib/types';
import { BookOpen,Bot,Camera,Copy,Loader2,MessageCircle,MessageSquare,Save,Settings,Sparkles,Wand2,X } from 'lucide-react';
import { useRouter,useSearchParams } from 'next/navigation';
import { useEffect,useRef,useState } from 'react';
import { toast } from 'sonner';

import MarketingCopilot from './MarketingCopilot';
import { AiProductEditor } from './AiProductEditor';
import { AiWorkspacePanel } from './AiWorkspacePanel';
import { useAiWorkspace } from './useAiWorkspace';
import { editorialFromProduct, type AiEditorialValues, type AiWork, type AiWorkInput } from '@/lib/ai-workspace';
import { AiConnectionStatus } from './AiConnectionStatus';
import { copyAiContent as copyToClipboard, requestAiTest } from './ai-actions';
import { AiWritingOptions, AiGenerationStatus } from './AiWritingOptions';
import type { AiEditorStyle } from '@/lib/ai-editor-options';
import { AIToolButton, CopyCard, LessonBlock } from './AiResultCards';

export default function IAConfigPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedProductId = searchParams.get('produto');
  const requestedTool = searchParams.get('ferramenta');
  const requestedTarget = searchParams.get('alvo');
  const appliedRequestedProduct = useRef(false);
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
  const [contentProposal, setContentProposal] = useState<any>(null);
  const [campaignChoiceOpen, setCampaignChoiceOpen] = useState(false);
  const [optimizationChoiceOpen, setOptimizationChoiceOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<'product' | 'plr'>('product');
  const [activeTool, setActiveTool] = useState('');
  const [proposal, setProposal] = useState<any>(null);
  const [editingProductId, setEditingProductId] = useState('');
  const [sourceUpdatedAt, setSourceUpdatedAt] = useState<string | null | undefined>(undefined);
  const [writingStyle, setWritingStyle] = useState<AiEditorStyle>('natural');
  const [writingBrief, setWritingBrief] = useState('');
  const generationController = useRef<AbortController | null>(null);
  const cancelGeneration = () => { generationController.current?.abort(); generationController.current = null; setActiveTool(''); setGenerating(false); };
  useEffect(() => () => { generationController.current?.abort(); }, []);
  useEffect(() => {
    if (!store?.id) return;
    return onSeoSaved(store.id, () => { void getProductsByStoreId(store.id).then(rows => setProducts(rows.filter(product => product.status === 'publicado'))).catch(() => toast.message('Não foi possível atualizar a lista. O produto salvo permanece confirmado.')); });
  }, [store?.id]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedTags, setEditedTags] = useState<string[]>([]);
  const [editedThemes, setEditedThemes] = useState<string[]>([]);
  const [editedCategoryId, setEditedCategoryId] = useState('');
  const [editedEducationLevelId, setEditedEducationLevelId] = useState('');
  const [editedAgeRange, setEditedAgeRange] = useState('');
  const [editedFormatDetails, setEditedFormatDetails] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [educationLevels, setEducationLevels] = useState<EducationLevel[]>([]);
  const [tagDraft, setTagDraft] = useState('');
  const [applying, setApplying] = useState(false);
  const [editingBaseline, setEditingBaseline] = useState<AiEditorialValues | null>(null);
  const [restoring, setRestoring] = useState(false);
  const editorValues: AiEditorialValues = { title: editedTitle, description: editedDescription, tags: editedTags, themes: editedThemes, categoryId: editedCategoryId, educationLevelId: editedEducationLevelId, ageRange: editedAgeRange, formatDetails: editedFormatDetails };
  const draftInput: AiWorkInput | null = editorOpen && editingBaseline && editingProductId ? { productId: editingProductId, target: editingTarget, productTitle: editingBaseline.title, sourceUpdatedAt, values: editorValues, baseline: editingBaseline } : null;
  const workspace = useAiWorkspace(store?.id, draftInput);
  const closeEditor = () => { if (applying) return; if (draftInput) { workspace.save(draftInput, 'draft'); workspace.save(draftInput, 'edited'); } setEditorOpen(false); };
  async function restoreWork(work: AiWork) {
    if (!store?.id || activeTool || generating || applying || restoring) return;
    setRestoring(true);
    try {
      const result = await requestAiJson(`/api/ai/editor-source?storeId=${encodeURIComponent(store.id)}&productId=${encodeURIComponent(work.productId)}`);
      const cached = products.find(item => item.id === work.productId);
      const product = result.product ? { ...cached, ...result.product } as Product : null;
      if (!product || (work.target === 'plr' && !product.is_plr)) throw new Error('Este material ou licença não está mais disponível nesta loja.');
      setProducts(current => current.map(item => item.id === product.id ? product : item)); setSelectedProductId(product.id);
      setEditingProductId(product.id); setEditingTarget(work.target); setSourceUpdatedAt(product.updated_at ?? null); setEditingBaseline(editorialFromProduct(product, work.target));
      setEditedTitle(work.values.title); setEditedDescription(work.values.description); setEditedTags(work.values.tags); setEditedThemes(work.values.themes); setEditedCategoryId(work.values.categoryId); setEditedEducationLevelId(work.values.educationLevelId); setEditedAgeRange(work.values.ageRange); setEditedFormatDetails(work.values.formatDetails);
      setProposal({ titles: [work.values.title], descriptionOptions: [work.values.description], analysis: ['Versão restaurada para revisão com o cadastro atual. Confira as diferenças antes de salvar.'] }); setEditorOpen(true);
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Não foi possível restaurar a versão.'); }
    finally { setRestoring(false); }
  }

  useEffect(() => {
    async function loadData() {
      try {
        const creatorStore = await getCurrentCreatorStore();
        setStore(creatorStore);
        const settingsResponse = await aiFetch(`/api/ai/settings?storeId=${encodeURIComponent(creatorStore.id)}`);
        if (settingsResponse.ok) {
          const settings = await readApiJson(settingsResponse);
          setHasApiKey(Boolean(settings.configured));
          if (settings.configured) setShowConfig(false);
        }

        if (creatorStore.id) {
          const [prods, availableCategories, availableEducationLevels] = await Promise.all([
            getProductsByStoreId(creatorStore.id),
            getCategories(creatorStore.id),
            getEducationLevels(),
          ]);
          setCategories(availableCategories);
          setEducationLevels(availableEducationLevels);
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
      const response = await aiFetch('/api/ai/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: store.id, apiKey })
      });
      if (!response.ok) {
        const data = await readApiJson(response);
        throw new Error(data.error || 'Erro ao salvar a chave.');
      }
      toast.success('Chave de IA atualizada com sucesso!');
      setHasApiKey(true);
      setApiKey('');
      setShowConfig(false);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar a chave.');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateCampaign = async () => {
    if (generating || activeTool || applying || restoring) return;
    if (!selectedProductId || !store?.id) {
      toast.error('Selecione um produto para gerar a campanha.');
      return;
    }

    const selectedProduct = products.find(p => p.id === selectedProductId);
    if (!selectedProduct) return;

    setGenerating(true);
    const controller = new AbortController(); generationController.current = controller;
    const loadingToast = toast.loading('A Inteligência Artificial está escrevendo sua campanha...');

    try {
      const res = await aiFetch('/api/ai/campaign', {
        signal: controller.signal,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: selectedProduct.titulo,
          productId: selectedProduct.id, style: writingStyle, brief: writingBrief,
          storeId: store.id
        })
      });

      const data = await readApiJson(res);
      if (controller.signal.aborted) return;

      if (!res.ok) {
        throw new Error(data.error || 'Falha ao comunicar com a inteligência artificial.');
      }

      const campaignText = data.campaign || '';
      
      // Separar pelo delimitador
      const parts = campaignText.split('--- INSTAGRAM ---');
      let wpp = parts[0] || '';
      let insta = parts[1] || '';

      // Limpar marcador do WhatsApp se existir
      wpp = wpp.replace(/--- WHATSAPP ---/gi, '').trim();
      insta = insta.trim();

      setWhatsappCopy(data.whatsapp || wpp);
      setInstagramCopy(data.instagram || insta);
      
      toast.success('Campanha pronta para revisão.', { id: loadingToast });
    } catch (err: any) {
      if (controller.signal.aborted) toast.dismiss(loadingToast); else toast.error(err.message, { id: loadingToast });
    } finally {
      if (generationController.current === controller) { generationController.current = null; setGenerating(false); }
    }
  };

  const generateProductTool = async (tool: 'seo' | 'description' | 'campaign' | 'lesson', targetMode: 'product' | 'plr' = 'product', productIdOverride?: string) => {
    if (activeTool || generating || applying || restoring) return;
    const productId = productIdOverride || selectedProductId;
    if (!productId || !store?.id) return toast.error('Selecione um material para continuar.');
    const selectedProduct = products.find(product => product.id === productId);
    const previousDraft = workspace.items.drafts.find(item => item.productId === productId && item.target === targetMode);
    if (previousDraft) workspace.save(previousDraft, 'edited');
    const controller = new AbortController(); generationController.current = controller;
    setActiveTool(tool);
    try {
      const response = await aiFetch('/api/ai/product-tools', { signal: controller.signal, method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ storeId: store.id, productId, tool, targetMode, style: writingStyle, brief: writingBrief }) });
      const payload = await readApiJson(response);
      if (controller.signal.aborted) return;
      if (!response.ok) throw new Error(payload.error || 'Não foi possível gerar este conteúdo.');
      if (payload.productId && payload.productId !== productId) throw new Error('A resposta não corresponde ao material escolhido.');
      if ((tool === 'seo' || tool === 'description') && payload.proposal) {
        const baseline = payload.sourceEditorial || editorialFromProduct(selectedProduct || {}, targetMode);
        const generatedValues: AiEditorialValues = { title: payload.proposal.titles?.[0] || baseline.title, description: payload.proposal.description, tags: payload.proposal.tags || baseline.tags, themes: baseline.themes, categoryId: payload.proposal.categoryId || baseline.categoryId, educationLevelId: payload.proposal.educationLevelId || baseline.educationLevelId, ageRange: payload.proposal.ageRange || baseline.ageRange, formatDetails: payload.proposal.formatDetails || baseline.formatDetails };
        workspace.save({ productId, target: targetMode, productTitle: baseline.title, sourceUpdatedAt: payload.sourceUpdatedAt, values: generatedValues, baseline }, 'generated');
        setEditingBaseline(baseline);
        setEditingProductId(productId); setSourceUpdatedAt(payload.sourceUpdatedAt);
        setEditingTarget(targetMode);
        setToolResult('');
        setProposal({ ...payload.proposal, tool });
        setEditedTitle(baseline.title); setEditedDescription(baseline.description); setEditedTags(baseline.tags); setEditedThemes(baseline.themes); setEditedCategoryId(baseline.categoryId); setEditedEducationLevelId(baseline.educationLevelId); setEditedAgeRange(baseline.ageRange); setEditedFormatDetails(baseline.formatDetails);
        setTagDraft('');
        setEditorOpen(true);
      } else {
        if (payload.content) setContentProposal({ ...payload.content, type: tool });
        else setToolResult(payload.result || '');
      }
    } catch (error: any) { if (!controller.signal.aborted) toast.error(error.message || 'Não foi possível gerar este conteúdo.'); } finally { if (generationController.current === controller) { generationController.current = null; setActiveTool(''); } }
  };

  useEffect(() => {
    if (appliedRequestedProduct.current || !requestedProductId || !products.length) return;
    const requestedProduct = products.find(product => product.id === requestedProductId);
    if (!requestedProduct) return;
    appliedRequestedProduct.current = true;
    setSelectedProductId(requestedProduct.id);
    if (requestedTool === 'seo') {
      if (requestedTarget === 'plr' && requestedProduct.is_plr) {
        void generateProductTool('seo', 'plr', requestedProduct.id);
      } else if (requestedProduct.is_plr && requestedTarget !== 'final') {
        setOptimizationChoiceOpen(true);
        toast.message('Escolha se deseja otimizar o produto final ou a licença PLR.');
      } else {
        void generateProductTool('seo', 'product', requestedProduct.id);
      }
    }
  }, [products, requestedProductId, requestedTool, requestedTarget]);

  const applyProposal = async () => {
    if (!editingProductId || applying) return;
    if (!editedDescription.trim() || (editingTarget === 'product' && editedTitle.trim().length < 4)) { toast.error('Preencha o título e a descrição antes de salvar.'); return; }
    setApplying(true);
    try {
      const updates: Partial<Product> = {};
      if (editingTarget === 'plr') {
        if (editedDescription.trim()) updates.plr_descricao = editedDescription.trim();
      } else {
        if (editedTitle.trim()) updates.titulo = editedTitle.trim();
        if (editedDescription.trim()) updates.descricao = editedDescription.trim();
        updates.tags = editedTags;
        updates.seasonal_tags = editedThemes;
        updates.category_id = editedCategoryId || null;
        updates.education_level_id = editedEducationLevelId || null;
        updates.age_range = editedAgeRange.trim() || null;
        updates.format_details = editedFormatDetails.trim() || null;
      }
      const response = await aiFetch('/api/ai/seo-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: store?.id, changes: [{ id: editingProductId, ...updates, ...(sourceUpdatedAt !== undefined ? { expectedUpdatedAt: sourceUpdatedAt } : {}) }] }),
      });
      const result = await readApiJson(response);
      if (!response.ok || !result.success || !result.updatedIds?.includes(editingProductId)) {
        throw new Error(result.error || 'O servidor não confirmou o salvamento das alterações.');
      }
      if (draftInput) { workspace.save({ ...draftInput, values: draftInput.baseline }, 'before-save'); workspace.save(draftInput, 'saved'); workspace.clear(editingProductId, editingTarget); }
      setEditorOpen(false); setProposal(null);
      try { localStorage.removeItem(`educalizando_seo_audit_${store?.id}`); } catch { /* Optional browser cache. */ }
      setProducts(current => current.map(product => ({ ...product, ...(result.savedProducts?.find((saved: Partial<Product>) => saved.id === product.id) || {}) })));
      if (store?.id) notifySeoSaved(store.id);
      setEditorOpen(false);
      const confirmedSeo = result.seoResults?.find((item: { id: string }) => item.id === editingProductId);
      if (editingTarget === 'product' && confirmedSeo) toast.success(`Produto salvo. Nota confirmada do cadastro: ${confirmedSeo.score}/100.`);
      else toast.success('Alterações salvas no produto.');
      if (editingTarget === 'product' && confirmedSeo?.issues?.length) toast.message(`Ainda falta: ${confirmedSeo.issues.join(' ')}`);
      if (requestedTool === 'seo') router.push('/dashboard/produtos?auditoria=atualizada');
    } catch (error: any) { toast.error(error.message || 'Não foi possível salvar o produto.'); } finally { setApplying(false); }
  };

  const activeProduct = products.find(product => product.id === (editorOpen ? editingProductId : selectedProductId)) || null;

  const requestAITest = () => requestAiTest(store?.nome_loja);

  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-2xl bg-violet-100 p-4 text-violet-700"><Loader2 className="h-8 w-8 animate-spin" /></div>
        <div><p className="font-black text-slate-900">Aguarde enquanto preparamos tudo</p><p className="mt-1 text-sm text-slate-500">Estamos carregando o produto e as configurações da inteligência artificial.</p></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-3 sm:px-0">
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
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <button
            type="button"
            onClick={requestAITest}
            className="flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-black text-white shadow-sm transition-colors hover:bg-emerald-600"
          >
            <MessageCircle className="h-4 w-4" /> Solicitar teste de IA
          </button>
          {!showConfig && (
            <button
              type="button"
              onClick={() => setShowConfig(true)}
              className="flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500 transition-colors hover:text-purple-600"
            >
              <Settings className="w-4 h-4" /> Configurar Chave API
            </button>
          )}
        </div>
      </div>

      {store && <AiConnectionStatus key={showConfig ? 'config' : 'tools'} storeId={store.id} configured={hasApiKey} disabled={Boolean(activeTool) || generating || saving} />}
      {showConfig ? (
        // VIEW: CONFIGURAÇÃO DE CHAVE
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in zoom-in-95">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-bold text-slate-900">Conectar inteligência artificial</h2>
              </div>
              {hasApiKey && (
                <button onClick={() => setShowConfig(false)} className="text-xs font-bold text-purple-600 hover:underline">
                  Voltar para o Gerador
                </button>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Configure a chave fornecida pelo suporte para habilitar as ferramentas de texto, divulgação e planejamento pedagógico.
            </p>
          </div>
          
          <form onSubmit={handleSave} className="p-6 space-y-4 bg-white">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Chave de acesso</label>
              <input
                type="password"
                placeholder="Cole a chave fornecida pelo suporte"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none text-sm font-mono"
              />
              <p className="text-xs text-slate-500 mt-2">
                Cole a sua chave de IA. A plataforma identifica a integração compatível automaticamente, seleciona a melhor opção disponível e nunca exibe sua chave publicamente.
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
                disabled={Boolean(activeTool) || generating || applying || restoring}
                onChange={(e) => { setSelectedProductId(e.target.value); setContentProposal(null); setToolResult(''); setWhatsappCopy(''); setInstagramCopy(''); }}
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
            <AiWritingOptions style={writingStyle} brief={writingBrief} disabled={Boolean(activeTool) || generating || applying || restoring} onStyle={setWritingStyle} onBrief={setWritingBrief} />
            {(activeTool || generating) && <AiGenerationStatus label="Gerando conteúdo" onCancel={cancelGeneration} />}
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <AIToolButton disabled={Boolean(activeTool) || generating || applying || restoring} icon={Sparkles} label="Otimizar produto com IA" description="clareza, título, descrição e tags a partir do cadastro" loading={activeTool === 'seo'} onClick={() => activeProduct?.is_plr ? setOptimizationChoiceOpen(true) : void generateProductTool('seo')} />
              <AIToolButton disabled={Boolean(activeTool) || generating || applying || restoring} icon={MessageSquare} label="Divulgação" description="WhatsApp e Instagram" loading={activeTool === 'campaign'} onClick={() => activeProduct?.is_plr ? setCampaignChoiceOpen(true) : void generateProductTool('campaign')} />
              <AIToolButton disabled={Boolean(activeTool) || generating || applying || restoring} icon={BookOpen} label="Roteiro pedagógico" description="uso em sala de aula" loading={activeTool === 'lesson'} onClick={() => void generateProductTool('lesson')} />
            </div>
            {contentProposal?.type === 'campaign' && <div className="mt-4 grid gap-4 lg:grid-cols-2"><CopyCard title="Mensagem para WhatsApp" description="Pronta para copiar e enviar aos seus contatos." text={contentProposal.whatsapp} /><CopyCard title="Legenda para Instagram" description="Pronta para publicar, incluindo hashtags." text={contentProposal.instagram} /><div className="rounded-2xl border border-violet-100 bg-white p-5 lg:col-span-2"><div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-violet-600" /><h3 className="font-black text-slate-900">Chamadas para Stories</h3></div><p className="mt-1 text-sm text-slate-500">Use uma chamada por tela para criar curiosidade antes do link.</p><div className="mt-4 grid gap-3 sm:grid-cols-3">{(contentProposal.stories || []).map((story: string, index: number) => <div key={`${index}-${story}`} className="rounded-xl bg-violet-50 p-4"><p className="text-xs font-black text-violet-700">STORY {index + 1}</p><p className="mt-2 text-sm font-semibold leading-6 text-slate-800">{story}</p><button type="button" onClick={() => navigator.clipboard.writeText(story).then(() => toast.success('Story copiado.'))} className="mt-3 text-xs font-black text-violet-700">Copiar</button></div>)}</div></div></div>}
            {contentProposal?.type === 'lesson' && <div className="mt-4 rounded-2xl border border-violet-100 bg-white p-5"><div className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-violet-600" /><div><h3 className="font-black text-slate-900">Roteiro pedagógico pronto para usar</h3><p className="text-sm text-slate-500">Organizado para orientar a aplicação do material em sala.</p></div></div><div className="mt-5 grid gap-4 md:grid-cols-2"><LessonBlock title="Objetivo de aprendizagem" items={[contentProposal.objective]} /><LessonBlock title="Preparação" items={contentProposal.preparation} /><LessonBlock title="Passo a passo" items={contentProposal.steps} /><LessonBlock title="Adaptações" items={contentProposal.adaptations} /><LessonBlock title="Atividade complementar" items={[contentProposal.extension]} /></div><button type="button" onClick={() => navigator.clipboard.writeText([contentProposal.objective, ...(contentProposal.preparation || []), ...(contentProposal.steps || []), ...(contentProposal.adaptations || []), contentProposal.extension].filter(Boolean).join('\n\n')).then(() => toast.success('Roteiro copiado.'))} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-black text-white"><Copy className="h-4 w-4" /> Copiar roteiro completo</button></div>}
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
      {!editorOpen && proposal && editingProductId && <button type="button" disabled={Boolean(activeTool) || generating || applying || restoring} onClick={() => { setSelectedProductId(editingProductId); setEditorOpen(true); }} className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-bold text-violet-800 disabled:opacity-50">Retomar a revisão em aberto</button>}
      {store && <AiWorkspacePanel drafts={workspace.items.drafts} history={workspace.items.history} productId={selectedProductId} status={workspace.status} disabled={Boolean(activeTool) || generating || applying || restoring} onRestore={work => void restoreWork(work)} />}
      {store && <MarketingCopilot store={store} products={products} selectedProductId={selectedProductId} aiConfigured={hasApiKey} onOptimizeProduct={(productId) => { if (activeTool || generating || applying || restoring) return; setSelectedProductId(productId); void generateProductTool('seo', 'product', productId); }} />}
      {activeTool === 'seo' && !editorOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-700"><Loader2 className="h-8 w-8 animate-spin" /></div>
            <h2 className="mt-5 text-xl font-black text-slate-900">Aguarde enquanto preparamos tudo</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">A IA está revisando a apresentação com base no cadastro. Você poderá conferir cada texto antes de salvar.</p>
            <AiGenerationStatus label="Revisando material" onCancel={cancelGeneration} />
            <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">Preço, link público e conteúdo do arquivo permanecem protegidos.</p>
          </div>
        </div>
      )}
      {optimizationChoiceOpen && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-wider text-violet-700">Material com licença PLR</p><h2 className="mt-1 text-xl font-black text-slate-900">O que você quer otimizar?</h2><p className="mt-2 text-sm leading-6 text-slate-500">Escolha a oferta. Cada descrição será trabalhada e salva no campo correto, sem misturar produto final e licença.</p></div><button type="button" onClick={() => setOptimizationChoiceOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
            <div className="mt-5 grid gap-3"><button type="button" onClick={() => { setOptimizationChoiceOpen(false); void generateProductTool('seo', 'product'); }} className="rounded-2xl border border-violet-200 bg-violet-50 p-4 text-left transition hover:border-violet-500"><p className="font-black text-violet-950">Otimizar produto final</p><p className="mt-1 text-sm text-violet-800">Melhora todos os metadados editoriais e pedagógicos, preservando preço, link e conteúdo.</p></button><button type="button" onClick={() => { setOptimizationChoiceOpen(false); void generateProductTool('seo', 'plr'); }} className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left transition hover:border-amber-500"><p className="font-black text-amber-950">Otimizar licença PLR</p><p className="mt-1 text-sm text-amber-800">Melhora apenas a descrição exclusiva da licença para revendedores.</p></button></div>
          </div>
        </div>
      )}
      {campaignChoiceOpen && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-wider text-violet-700">Material com licença PLR</p><h2 className="mt-1 text-xl font-black text-slate-900">Qual divulgação você quer criar?</h2><p className="mt-2 text-sm leading-6 text-slate-500">Escolha o público da campanha. A IA ajustará a mensagem, os benefícios e o link de compra.</p></div><button type="button" onClick={() => setCampaignChoiceOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
            <div className="mt-5 grid gap-3"><button type="button" onClick={() => { setCampaignChoiceOpen(false); void generateProductTool('campaign', 'product'); }} className="rounded-2xl border border-violet-200 bg-violet-50 p-4 text-left transition hover:border-violet-500"><p className="font-black text-violet-950">Divulgar produto final</p><p className="mt-1 text-sm text-violet-800">Para educadores, famílias e clientes que vão usar o material.</p></button><button type="button" onClick={() => { setCampaignChoiceOpen(false); void generateProductTool('campaign', 'plr'); }} className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left transition hover:border-amber-500"><p className="font-black text-amber-950">Divulgar licença PLR</p><p className="mt-1 text-sm text-amber-800">Para criadores que querem adquirir a licença para revender o material.</p></button></div>
          </div>
        </div>
      )}
      {editorOpen && proposal && <AiProductEditor proposal={proposal} activeProduct={activeProduct} categories={categories} educationLevels={educationLevels} editingTarget={editingTarget} editedTitle={editedTitle} setEditedTitle={setEditedTitle} editedDescription={editedDescription} setEditedDescription={setEditedDescription} editedTags={editedTags} setEditedTags={setEditedTags} editedThemes={editedThemes} setEditedThemes={setEditedThemes} editedCategoryId={editedCategoryId} setEditedCategoryId={setEditedCategoryId} editedEducationLevelId={editedEducationLevelId} setEditedEducationLevelId={setEditedEducationLevelId} editedAgeRange={editedAgeRange} setEditedAgeRange={setEditedAgeRange} editedFormatDetails={editedFormatDetails} setEditedFormatDetails={setEditedFormatDetails} tagDraft={tagDraft} setTagDraft={setTagDraft} applying={applying} applyProposal={applyProposal} baseline={editingBaseline!} values={editorValues} draftStatus={workspace.status} onClose={closeEditor} />}
    </div>
  );
}
