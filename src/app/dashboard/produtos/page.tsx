'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, Plus, Edit3, Trash2, Eye, EyeOff, 
  FileText, Video, BookOpen, HelpCircle, Layers, Loader2, 
  AlertTriangle, AlertCircle, Tags, GraduationCap, Filter, Sparkles, X, ShieldCheck, Search, RotateCcw, CheckCircle2, ArrowUpRight, RefreshCw
} from 'lucide-react';

import { 
  getCurrentCreatorStore, 
  getProductsByStoreId, 
  updateProduct, 
  deleteProduct 
} from '@/lib/store-service';
import { getCategories, getEducationLevels } from '@/lib/category-service';
import { Product, Store, ProductType, Category, EducationLevel } from '@/lib/types';
import { searchMatchScore } from '@/lib/search-matching';
import CategoryManagerModal from '@/components/dashboard/CategoryManagerModal';
import CustomSelect, { CustomSelectOption } from '@/components/ui/CustomSelect';

export default function ProductsManagementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [educationLevels, setEducationLevels] = useState<EducationLevel[]>([]);
  
  // Filters
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedEducationFilter, setSelectedEducationFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState('');

  // Modals State
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Styled AlertDialog Delete Confirmation State
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isDeletingLoading, setIsDeletingLoading] = useState(false);

  // Marketing AI State
  const [marketingProduct, setMarketingProduct] = useState<Product | null>(null);
  const [campaignData, setCampaignData] = useState<string>('');
  const [isGeneratingCampaign, setIsGeneratingCampaign] = useState(false);
  const [showSeo, setShowSeo] = useState(false);
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);
  const [seoAuditing, setSeoAuditing] = useState(false);
  const [seoAuditError, setSeoAuditError] = useState<string | null>(null);
  const [seoAudit, setSeoAudit] = useState<{ summary: string; average: number; items: Array<{ id: string; title: string; score: number; issues: string[]; quickWins: string[]; recommendedTitle: string; suggestedCaption: string; description: string; tags: string[]; themes: string[]; metaDescription: string; keywords: string[]; coverUrl: string | null; isPlr: boolean }> } | null>(null);
  const [selectedSeoIds, setSelectedSeoIds] = useState<string[]>([]);
  const [bulkPreviewOpen, setBulkPreviewOpen] = useState(false);
  const [applyingBulkSeo, setApplyingBulkSeo] = useState(false);
  const deleteTriggerRef = useRef<HTMLButtonElement | null>(null);
  const marketingTriggerRef = useRef<HTMLButtonElement | null>(null);

  const loadData = async () => {
    try {
      const currentStore = await getCurrentCreatorStore();
      setStore(currentStore);
      const [prods, settingsResponse] = await Promise.all([
        getProductsByStoreId(currentStore.id),
        fetch(`/api/ai/settings?storeId=${encodeURIComponent(currentStore.id)}`).catch(() => null),
      ]);
      setProducts(prods);
      if (settingsResponse?.ok) {
        const settings = await settingsResponse.json();
        setAiConfigured(Boolean(settings.configured));
      } else {
        setAiConfigured(false);
      }

      const cats = await getCategories(currentStore.id);
      setCategories(cats);

      const edLevels = await getEducationLevels();
      setEducationLevels(edLevels);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // This request synchronizes the seller's current data after the page mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  useEffect(() => {
    if (!deletingProduct && !marketingProduct) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || isDeletingLoading) return;
      const trigger = deletingProduct ? deleteTriggerRef.current : marketingTriggerRef.current;
      setDeletingProduct(null);
      setMarketingProduct(null);
      setCampaignData('');
      setActionError(null);
      window.requestAnimationFrame(() => trigger?.focus());
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [deletingProduct, isDeletingLoading, marketingProduct]);

  const handleOpenCreateWizard = () => {
    router.push('/dashboard/produtos/novo');
  };

  // Delete Execution (Soft Delete)
  const confirmDeleteProduct = async () => {
    if (!deletingProduct || !store) return;
    setIsDeletingLoading(true);
    setActionError(null);
    try {
      await deleteProduct(deletingProduct.id, store.id);
      setProducts(products.filter(p => p.id !== deletingProduct.id));
      setDeletingProduct(null);
      await loadData();
      router.refresh();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Erro ao excluir produto.');
    } finally {
      setIsDeletingLoading(false);
    }
  };

  const handleGenerateCampaign = async () => {
    if (!marketingProduct || !store) return;
    setIsGeneratingCampaign(true);
    setCampaignData('');
    setActionError(null);
    try {
      const res = await fetch('/api/ai/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo: marketingProduct.titulo, storeId: store.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar campanha.');
      setCampaignData(data.campaign);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Erro ao gerar campanha.');
    } finally {
      setIsGeneratingCampaign(false);
    }
  };

  const handleToggleStatus = async (prod: Product) => {
    const newStatus = prod.status === 'publicado' ? 'rascunho' : 'publicado';
    try {
      const updated = await updateProduct(prod.id, { status: newStatus });
      setProducts(prev => prev.map(p => (p.id === prod.id ? updated : p)));
      router.refresh();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Erro ao alterar status do produto.');
    }
  };

  const handleSeoAudit = async (force = false) => {
    if (showSeo && !force) {
      setShowSeo(false);
      return;
    }
    setShowSeo(true);
    setSeoAuditError(null);
    if (!store?.id) return;

    let configured = aiConfigured;
    if (configured === null) {
      const settingsResponse = await fetch(`/api/ai/settings?storeId=${encodeURIComponent(store.id)}`).catch(() => null);
      if (settingsResponse?.ok) {
        const settings = await settingsResponse.json();
        configured = Boolean(settings.configured);
        setAiConfigured(configured);
      } else {
        configured = false;
        setAiConfigured(false);
      }
    }
    if (!configured) return;

    const cacheKey = `educalizando_seo_audit_${store.id}`;
    if (!force) {
      try {
        const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
        if (cached?.items && Array.isArray(cached.items)) {
          setSeoAudit(cached);
          setSelectedSeoIds(cached.items.filter((item: { score: number }) => item.score < 100).map((item: { id: string }) => item.id));
          return;
        }
      } catch { localStorage.removeItem(cacheKey); }
    }

    setSeoAuditing(true);
    try {
      const response = await fetch('/api/ai/seo-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: store.id }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Não foi possível concluir a auditoria.');
      setSeoAudit(data);
      setSelectedSeoIds((data.items || []).filter((item: { score: number }) => item.score < 100).map((item: { id: string }) => item.id));
      localStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (error: unknown) {
      setSeoAuditError(error instanceof Error ? error.message : 'Não foi possível concluir a auditoria.');
    } finally {
      setSeoAuditing(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchCategory = selectedCategoryFilter === 'all' || p.category_id === selectedCategoryFilter;
    const matchEducation = selectedEducationFilter === 'all' || p.education_level_id === selectedEducationFilter;
    const matchStatus = selectedStatusFilter === 'all' || p.status === selectedStatusFilter;
    const matchSearch = !searchFilter.trim() || searchMatchScore(p, searchFilter) > 0;
    return matchCategory && matchEducation && matchStatus && matchSearch;
  });

  const getTipoIcon = (tipo: ProductType) => {
    switch (tipo) {
      case 'pdf': return <FileText className="w-4 h-4 text-sky-600" />;
      case 'ebook': return <BookOpen className="w-4 h-4 text-indigo-600" />;
      case 'video': return <Video className="w-4 h-4 text-purple-600" />;
      case 'curso': return <Layers className="w-4 h-4 text-blue-600" />;
      case 'simulado': return <HelpCircle className="w-4 h-4 text-amber-600" />;
    }
  };

  const getCategoryName = (catId?: string | null) => {
    if (!catId) return null;
    return categories.find(c => c.id === catId)?.nome || null;
  };

  const getEducationName = (edId?: string | null) => {
    if (!edId) return null;
    return educationLevels.find(e => e.id === edId)?.nome || null;
  };

  const seoReports = useMemo(() => products.map(product => {
    const checks = [
      { label: 'Título claro (30–65 caracteres)', ok: product.titulo.trim().length >= 30 && product.titulo.trim().length <= 65 },
      { label: 'Descrição preenchida (120+ caracteres)', ok: Boolean(product.descricao && product.descricao.trim().length >= 120) },
      { label: 'Capa otimizada', ok: Boolean(product.capa_url) },
      { label: 'Categoria definida', ok: Boolean(product.category_id) },
      { label: 'Nível de ensino definido', ok: Boolean(product.education_level_id) },
    ];
    const score = Math.round((checks.filter(check => check.ok).length / checks.length) * 100);
    return { product, score, checks, suggestions: checks.filter(check => !check.ok).map(check => check.label) };
  }), [products]);
  const getSeoReport = (productId: string) => seoReports.find(report => report.product.id === productId);
  const getAiSeoReport = (productId: string) => seoAudit?.items.find(report => report.id === productId);
  const formatPrice = (price: number | null | undefined) => Number(price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const selectedSeoItems = seoAudit?.items.filter(item => selectedSeoIds.includes(item.id)) || [];
  const toggleSeoItem = (id: string) => setSelectedSeoIds(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  const applySelectedSeo = async () => {
    if (!selectedSeoItems.length || !store?.id) return;
    setApplyingBulkSeo(true);
    try {
      const response = await fetch('/api/ai/seo-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: store.id, changes: selectedSeoItems.map(item => ({ id: item.id, titulo: item.recommendedTitle, descricao: item.description, tags: item.tags, seasonal_tags: item.themes })) }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) throw new Error(result.error || 'Não foi possível salvar as otimizações.');
      await loadData();
      setSeoAudit(current => current ? { ...current, items: current.items.map(item => result.updatedIds?.includes(item.id) ? { ...item, score: 100, issues: [], quickWins: ['Sugestões aplicadas e salvas neste material.'] } : item), average: Math.round((current.items.reduce((sum, item) => sum + (result.updatedIds?.includes(item.id) ? 100 : item.score), 0)) / Math.max(current.items.length, 1)) } : current);
      localStorage.removeItem(`educalizando_seo_audit_${store.id}`);
      setBulkPreviewOpen(false);
      setActionError(null);
    } catch (error: unknown) {
      setActionError(error instanceof Error ? error.message : 'Não foi possível aplicar todas as otimizações.');
    } finally {
      setApplyingBulkSeo(false);
    }
  };

  // Build Options for CustomSelect Filter Component
  const categoryFilterOptions: CustomSelectOption[] = [
    { value: 'all', label: 'Todas as Categorias' },
    ...categories.map(c => ({ value: c.id, label: c.nome }))
  ];

  const educationFilterOptions: CustomSelectOption[] = [
    { value: 'all', label: 'Todos os Níveis' },
    ...educationLevels.map(e => ({ value: e.id, label: e.nome }))
  ];
  const statusFilterOptions: CustomSelectOption[] = [{ value: 'all', label: 'Todos os status' }, { value: 'publicado', label: 'Publicados' }, { value: 'rascunho', label: 'Rascunhos' }];
  const clearFilters = () => { setSelectedCategoryFilter('all'); setSelectedEducationFilter('all'); setSelectedStatusFilter('all'); setSearchFilter(''); };
  const hasFilters = selectedCategoryFilter !== 'all' || selectedEducationFilter !== 'all' || selectedStatusFilter !== 'all' || Boolean(searchFilter);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20" role="status" aria-live="polite">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Carregando seus produtos...</p>
      </div>
    );
  }

  const storeIsConfigured = store && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(store.id);

  return (
    <div className="space-y-6 sm:space-y-8">
      {!storeIsConfigured && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 sm:p-5 rounded-2xl flex items-start gap-4" role="alert">
          <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-black text-sm">Sua loja ainda não está configurada</p>
            <p className="text-xs font-medium mt-1">
              Para cadastrar produtos, você precisa primeiro salvar as informações da sua loja.
              Acesse <strong>&quot;Configurações da Loja&quot;</strong> no menu lateral, preencha o nome e slug, e clique em Salvar.
            </p>
            <a href="/dashboard/loja" className="inline-flex min-h-11 items-center gap-1.5 mt-3 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:ring-offset-2">
              Configurar Minha Loja Agora
            </a>
          </div>
        </div>
      )}
      {/* Page Title & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-3">
            <Package className="w-7 h-7 text-brand-navy" /> Meus Produtos Didáticos ({products.length})
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Cadastre e gerencie suas apostilas, e-books e cursos categorizados por tema e escolaridade.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsCategoryManagerOpen(true)}
            className="w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all flex items-center gap-2 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
          >
            <Tags className="w-4 h-4 text-brand-teal" />
            <span>Gerenciar Minhas Categorias</span>
          </button>

          <button onClick={() => void handleSeoAudit()} className="w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl font-bold text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-all flex items-center gap-2 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"><Sparkles className="w-4 h-4" /> {showSeo ? 'Fechar auditoria' : 'Auditar SEO com IA'}</button><Link
            href="/dashboard/produtos/novo"
            className="w-full sm:w-auto justify-center px-5 py-2.5 rounded-xl font-extrabold text-xs bg-brand-navy hover:bg-brand-navy-hover text-white shadow-md shadow-brand-navy/20 transition-all flex items-center gap-2 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy focus-visible:ring-offset-2"
          >
            <Plus className="w-4 h-4" />
            <span>Novo produto</span>
          </Link>
        </div>
      </div>

      {actionError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs flex items-center gap-3 font-semibold" role="alert">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {showSeo && <section className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-violet-50 p-4 shadow-xs sm:p-6">
        {aiConfigured === false ? <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-blue-700">Auditoria de SEO com IA</p><h2 className="mt-1 text-lg font-black text-slate-900">Conecte a IA para analisar os seus materiais</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Depois da conexão, esta área encontra os produtos que precisam de ajustes, explica cada oportunidade e prepara sugestões para revisão.</p></div><button type="button" onClick={() => router.push('/dashboard/ia')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-black text-white shadow-sm transition hover:bg-violet-700"><Sparkles className="h-4 w-4" /> Configurar IA</button></div> : seoAuditing ? <div className="flex min-h-32 items-center justify-center gap-3 text-sm font-bold text-blue-800"><Loader2 className="h-5 w-5 animate-spin" /> A IA está analisando títulos, descrições, tags e dados dos materiais...</div> : seoAuditError ? <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm font-semibold text-rose-700">{seoAuditError}</p><button type="button" onClick={() => void handleSeoAudit(true)} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white px-3 text-xs font-black text-blue-700 ring-1 ring-blue-200"><RefreshCw className="h-3.5 w-3.5" /> Tentar novamente</button></div> : seoAudit ? <div className="space-y-5"><div className="flex flex-col gap-4 border-b border-blue-100 pb-5 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-blue-700">Auditoria de SEO com IA</p><h2 className="mt-1 text-lg font-black text-slate-900">O que melhorar para seus materiais aparecerem melhor</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{seoAudit.summary}</p></div><div className="rounded-2xl bg-white px-4 py-3 text-center shadow-sm ring-1 ring-blue-100"><span className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Saúde da loja</span><strong className="text-2xl font-black text-blue-700">{seoAudit.average}/100</strong></div></div><div className="grid gap-4 lg:grid-cols-2">{seoAudit.items.filter(item => item.score < 100).map(item => <SeoAuditCard key={item.id} item={item} selected={selectedSeoIds.includes(item.id)} onToggle={() => toggleSeoItem(item.id)} onOptimize={() => router.push(`/dashboard/ia?produto=${encodeURIComponent(item.id)}&ferramenta=seo&alvo=final`)} onOptimizePlr={item.isPlr ? () => router.push(`/dashboard/ia?produto=${encodeURIComponent(item.id)}&ferramenta=seo&alvo=plr`) : undefined} />)}{!seoAudit.items.some(item => item.score < 100) && <div className="rounded-2xl bg-emerald-50 p-5 text-sm font-semibold text-emerald-800 lg:col-span-2"><CheckCircle2 className="mr-2 inline h-5 w-5" /> Seus produtos têm todos os campos essenciais preenchidos.</div>}</div></div> : <div className="text-sm text-slate-600">Prepare sua auditoria para visualizar as recomendações da IA.</div>}
      </section>}

      {showSeo && seoAudit && seoAudit.items.some(item => item.score < 100) && <div className="flex flex-col gap-3 rounded-2xl border border-violet-200 bg-violet-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-black text-violet-950">Aplicar sugestões da IA em lote</p><p className="mt-1 text-xs leading-5 text-violet-800">Selecione os materiais desejados e revise título, descrição, tags e temas antes de salvar.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setSelectedSeoIds(seoAudit.items.filter(item => item.score < 100).map(item => item.id))} className="min-h-10 rounded-xl bg-white px-3 text-xs font-black text-violet-700 ring-1 ring-violet-200">Selecionar todos</button><button type="button" onClick={() => setSelectedSeoIds([])} className="min-h-10 rounded-xl bg-white px-3 text-xs font-black text-slate-600 ring-1 ring-slate-200">Limpar seleção</button><button type="button" disabled={!selectedSeoItems.length} onClick={() => setBulkPreviewOpen(true)} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-black text-white disabled:opacity-50"><CheckCircle2 className="h-4 w-4" /> Revisar {selectedSeoItems.length} alteração(ões)</button></div></div>}
      {showSeo && seoAudit && seoAudit.items.some(item => item.score < 100) && <div className="fixed bottom-5 right-5 z-40 flex items-center gap-3 rounded-2xl bg-violet-700 p-3 text-white shadow-xl"><div className="hidden sm:block"><p className="text-xs font-black">Sugestões prontas</p><p className="text-[11px] text-violet-100">{selectedSeoItems.length} material(is) selecionado(s)</p></div><button type="button" disabled={!selectedSeoItems.length} onClick={() => setBulkPreviewOpen(true)} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white px-4 text-xs font-black text-violet-800 disabled:opacity-50"><CheckCircle2 className="h-4 w-4" /> Aplicar sugestões</button></div>}

      {bulkPreviewOpen && <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/60 p-4 sm:p-8"><div className="mx-auto w-full max-w-4xl rounded-3xl bg-white shadow-2xl"><header className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-6"><div><p className="text-xs font-black uppercase tracking-wider text-violet-700">Revisão antes de salvar</p><h2 className="mt-1 text-xl font-black text-slate-900">Alterações sugeridas para {selectedSeoItems.length} material(is)</h2><p className="mt-1 text-sm text-slate-500">Veja o valor atual, a sugestão da IA e o motivo de cada mudança antes de confirmar.</p></div><button type="button" onClick={() => setBulkPreviewOpen(false)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button></header><div className="max-h-[65vh] space-y-4 overflow-y-auto p-5 sm:p-6">{selectedSeoItems.map(item => <SeoChangePreview key={item.id} item={item} product={products.find(product => product.id === item.id)} />)}</div><footer className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-end"><button type="button" onClick={() => setBulkPreviewOpen(false)} className="min-h-11 rounded-xl px-4 text-sm font-bold text-slate-600 hover:bg-slate-200">Voltar e revisar</button><button type="button" disabled={applyingBulkSeo} onClick={() => void applySelectedSeo()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-black text-white disabled:opacity-60">{applyingBulkSeo && <Loader2 className="h-4 w-4 animate-spin" />} Confirmar e salvar alterações</button></footer></div></div>}

      {/* Styled Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
          <Filter className="w-4 h-4 text-blue-600" /> Filtrar Por:
        </div>
        <div className="flex items-center gap-2"><span className="text-xs font-semibold text-slate-500" aria-live="polite">{filteredProducts.length} resultado(s)</span>{hasFilters && <button onClick={clearFilters} className="inline-flex min-h-11 items-center gap-1 text-xs font-black text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 rounded-lg px-2"><RotateCcw className="h-3.5 w-3.5" /> Limpar</button>}</div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1.3fr)_minmax(180px,1fr)_minmax(180px,1fr)_minmax(170px,.8fr)]">
          <label className="relative"><span className="sr-only">Buscar nos seus produtos</span><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={searchFilter} onChange={event => setSearchFilter(event.target.value)} placeholder="Buscar produto" className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500" /></label>
          {/* Custom Category Select */}
          <div className="w-full">
            <CustomSelect
              options={categoryFilterOptions}
              value={selectedCategoryFilter}
              onChange={(val) => setSelectedCategoryFilter(val)}
              icon={<Tags className="w-4 h-4" />}
            />
          </div>

          {/* Custom Education Level Select */}
          <div className="w-full">
            <CustomSelect
              options={educationFilterOptions}
              value={selectedEducationFilter}
              onChange={(val) => setSelectedEducationFilter(val)}
              icon={<GraduationCap className="w-4 h-4" />}
            />
          </div>

          <div className="w-full"><CustomSelect options={statusFilterOptions} value={selectedStatusFilter} onChange={setSelectedStatusFilter} icon={<Eye className="w-4 h-4" />} /></div>
        </div>
      </div>

      {/* Products Catalog Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white p-6 sm:p-12 rounded-2xl border border-slate-200 shadow-xs text-center max-w-lg mx-auto space-y-4">
          <Package className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">
            {products.length === 0 ? 'Você ainda não publicou nenhum produto' : 'Nenhum produto atende a este filtro'}
          </h3>
          <p className="text-sm text-slate-500">
            Sua loja está pronta! Abra o Wizard guiado para cadastrar seu primeiro e-book ou apostila em PDF.
          </p>
          <button
            onClick={handleOpenCreateWizard}
            className="min-h-11 px-5 py-2.5 rounded-xl font-bold text-xs bg-blue-600 text-white inline-flex items-center gap-2 shadow-md hover:bg-blue-700 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            <Plus className="w-4 h-4" /> Cadastrar Meu Primeiro Produto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredProducts.map(prod => {
            const catName = getCategoryName(prod.category_id);
            const edName = getEducationName(prod.education_level_id);

            return (
              <div
                key={prod.id}
                className="relative min-w-0 flex flex-col justify-between space-y-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:shadow-md sm:p-5"
              >
                {showSeo && getSeoReport(prod.id) && <span className={`absolute right-3 top-3 z-10 rounded-full px-2 py-1 text-[10px] font-black ${(getAiSeoReport(prod.id)?.score ?? getSeoReport(prod.id)!.score) >= 90 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`} title={getAiSeoReport(prod.id)?.issues.join(' · ') || getSeoReport(prod.id)!.suggestions.join(' · ') || 'Critérios SEO preenchidos'}>SEO {getAiSeoReport(prod.id)?.score ?? getSeoReport(prod.id)!.score}</span>}
                <div className="space-y-3">
                  {/* Cover Image & Badges */}
                  <div className="h-40 rounded-xl overflow-hidden bg-slate-100 relative">
                    {prod.capa_url ? (
                      <img src={prod.capa_url} alt={prod.titulo} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-semibold">
                        Sem Capa
                      </div>
                    )}

                    {/* Status Badge */}
                    <button
                      onClick={() => handleToggleStatus(prod)}
                      aria-label={`Alterar status de ${prod.titulo}. Status atual: ${prod.status}.`}
                      title={`Alterar status: ${prod.status}`}
                      className={`absolute top-2 right-2 min-h-8 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-700 ${
                        prod.status === 'publicado'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-500 text-white'
                      }`}
                    >
                      {prod.status === 'publicado' ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      <span>{prod.status}</span>
                    </button>

                    {/* Type Badge */}
                    <span className="absolute bottom-2 left-2 bg-white/95 text-slate-900 text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 border border-slate-200 uppercase shadow-xs">
                      {getTipoIcon(prod.tipo)}
                      <span>{prod.tipo}</span>
                    </span>
                  </div>

                  {/* Category & Education Level Badges */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {catName && (
                      <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md text-[10px] font-extrabold flex items-center gap-1">
                        <Tags className="w-3 h-3" /> {catName}
                      </span>
                    )}
                    {edName && (
                      <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md text-[10px] font-extrabold flex items-center gap-1">
                        <GraduationCap className="w-3 h-3" /> {edName}
                      </span>
                    )}
                  </div>

                  {/* Product Title & Info */}
                  <div>
                    <h3 className="font-bold text-slate-900 text-base line-clamp-2 leading-tight" title={prod.titulo}>
                      {prod.titulo}
                    </h3>
                    {prod.descricao && (
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1 mb-2">
                        {prod.descricao}
                      </p>
                    )}
                    {showSeo && ((getAiSeoReport(prod.id)?.issues || getSeoReport(prod.id)?.suggestions || []).length ? <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-2 text-[10px] font-semibold leading-relaxed text-amber-800">Melhore: {(getAiSeoReport(prod.id)?.issues || getSeoReport(prod.id)?.suggestions || [])[0]}.</p> : <p className="mt-2 text-[10px] font-semibold text-emerald-700">SEO completo</p>)}
                    <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-slate-500">
                      <Eye className="w-4 h-4 text-slate-400" />
                      <span>{prod.views_count || 0} visualizações</span>
                    </div>
                  </div>
                </div>

                {/* Price & Actions Footer */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-2">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Material</span>
                      <span className="inline-flex items-baseline gap-1 whitespace-nowrap text-lg font-black text-slate-900"><span className="text-sm">R$</span>{formatPrice(prod.preco)}</span>
                    </div>

                    {prod.is_plr && prod.preco_plr !== undefined && prod.preco_plr !== null && (
                      <div>
                        <span className="text-[10px] text-blue-500 uppercase tracking-wider block font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Licença PLR
                        </span>
                        <span className="inline-flex items-baseline gap-1 whitespace-nowrap text-lg font-black text-blue-700"><span className="text-sm">R$</span>{formatPrice(prod.preco_plr)}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto sm:items-center sm:gap-1.5">
                    <button
                      onClick={(event) => {
                        marketingTriggerRef.current = event.currentTarget;
                        setMarketingProduct(prod);
                      }}
                      aria-label={`Gerar campanha com IA para ${prod.titulo}`}
                      className="min-h-11 justify-center px-2.5 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-600 transition-colors flex items-center gap-1 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 focus-visible:ring-offset-2"
                      title="Gerar Campanha com IA"
                    >
                      <Sparkles className="w-4 h-4" /> <span className="hidden min-[420px]:inline">Campanha</span>
                    </button>
                    <Link
                      href={`/dashboard/produtos/novo?edit=${prod.id}`}
                      aria-label={`Editar ${prod.titulo}`}
                      className="min-h-11 min-w-11 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-600 focus-visible:ring-offset-2"
                      title="Editar produto via Wizard"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={(event) => {
                        deleteTriggerRef.current = event.currentTarget;
                        setDeletingProduct(prod);
                      }}
                      aria-label={`Excluir ${prod.titulo}`}
                      className="min-h-11 min-w-11 flex items-center justify-center rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2"
                      title="Excluir produto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Styled AlertDialog Modal for Delete Confirmation */}
      <AnimatePresence>
        {deletingProduct && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4" role="presentation">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5 shadow-2xl relative"
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-product-title"
              aria-describedby="delete-product-description"
            >
              <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="text-center space-y-2">
                <h3 id="delete-product-title" className="text-xl font-bold text-slate-900">Excluir Produto Didático?</h3>
                <p id="delete-product-description" className="text-xs text-slate-500 leading-relaxed">
                  Tem certeza que deseja remover <strong>&quot;{deletingProduct.titulo}&quot;</strong>? Esta ação é definitiva para materiais sem vendas.
                </p>
              </div>

              {actionError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs flex items-start gap-2.5 text-left font-medium" role="alert">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span className="leading-snug">{actionError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setDeletingProduct(null);
                    setActionError(null);
                    window.requestAnimationFrame(() => deleteTriggerRef.current?.focus());
                  }}
                  disabled={isDeletingLoading}
                  className="min-h-11 w-full py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-600 focus-visible:ring-offset-2"
                >
                  {actionError ? 'Fechar' : 'Cancelar'}
                </button>
                {!actionError && (
                  <button
                    type="button"
                    onClick={confirmDeleteProduct}
                    disabled={isDeletingLoading}
                    className="min-h-11 w-full py-2.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-md flex items-center justify-center gap-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2"
                  >
                    {isDeletingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    <span>Excluir Produto</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Category Manager Modal */}
      <CategoryManagerModal
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
        storeId={store?.id || ''}
        onCategoriesUpdated={loadData}
      />
      {/* Marketing AI Modal */}
      <AnimatePresence>
        {marketingProduct && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4" role="presentation">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-200 w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[calc(100vh-2rem)]"
              role="dialog"
              aria-modal="true"
              aria-labelledby="campaign-dialog-title"
            >
              <div className="px-4 sm:px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-purple-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 id="campaign-dialog-title" className="text-lg font-black text-slate-900 leading-tight">
                      Campanha de Vendas (IA)
                    </h2>
                    <p className="text-xs text-slate-600 font-medium line-clamp-1">
                      {marketingProduct.titulo}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMarketingProduct(null);
                    setCampaignData('');
                    setActionError(null);
                    window.requestAnimationFrame(() => marketingTriggerRef.current?.focus());
                  }}
                  className="min-h-11 min-w-11 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 focus-visible:ring-offset-2"
                  aria-label="Fechar campanha de vendas"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-4">
                {actionError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs flex items-start gap-2.5 font-medium mb-4" role="alert">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    <span>{actionError}</span>
                  </div>
                )}

                {!campaignData && !isGeneratingCampaign ? (
                  <div className="text-center py-10 space-y-4">
                    <Sparkles className="w-12 h-12 text-purple-200 mx-auto" />
                    <p className="text-sm text-slate-600">
                      Clique no botão abaixo para gerar roteiros persuasivos de WhatsApp e Instagram baseados no título deste produto.
                    </p>
                    <button
                      onClick={handleGenerateCampaign}
                      className="min-h-11 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all shadow-md inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 focus-visible:ring-offset-2"
                    >
                      <Sparkles className="w-4 h-4" /> Gerar Campanha Agora
                    </button>
                  </div>
                ) : isGeneratingCampaign ? (
                  <div className="text-center py-12 flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                    <p className="text-sm text-slate-600 font-medium">A Inteligência Artificial está escrevendo sua campanha...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="whitespace-pre-wrap text-sm text-slate-700 bg-slate-50 p-5 rounded-2xl border border-slate-200 font-medium leading-relaxed">
                      {campaignData}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

function SeoChangePreview({ item, product }: { item: { title: string; coverUrl: string | null; recommendedTitle: string; description: string; tags: string[]; themes: string[]; quickWins: string[] }; product?: Product }) {
  const currentTitle = product?.titulo || 'Não informado';
  const currentDescription = product?.descricao || 'Sem descrição';
  const currentTags = product?.tags || [];
  const currentThemes = product?.seasonal_tags || [];
  const change = (label: string, before: string, after: string) => <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 text-xs text-slate-500"><strong>Atual:</strong> {before}</p><p className="mt-2 whitespace-pre-line text-sm leading-6 text-violet-950"><strong>Será alterado para:</strong> {after}</p></div>;
  return <article className="rounded-2xl border border-slate-200 p-4 sm:p-5"><div className="flex items-center gap-3"><div className="h-12 w-12 overflow-hidden rounded-lg bg-violet-50">{item.coverUrl ? <img src={item.coverUrl} alt="" className="h-full w-full object-cover" /> : <Package className="m-3 h-6 w-6 text-violet-500" />}</div><div><h3 className="font-black text-slate-900">{item.title}</h3><p className="mt-1 text-xs font-bold text-emerald-700">A IA vai melhorar a busca e a apresentação deste material.</p></div></div><div className="mt-4 grid gap-3 sm:grid-cols-2">{change('Título', currentTitle, item.recommendedTitle || currentTitle)}{change('Tags de busca', currentTags.join(', ') || 'Nenhuma tag', item.tags.join(', ') || 'Manter sem tags')}<div className="sm:col-span-2">{change('Descrição de venda', currentDescription, item.description || currentDescription)}</div>{change('Temas pedagógicos', currentThemes.join(', ') || 'Nenhum tema', item.themes.join(', ') || 'Manter temas atuais')}<div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3"><p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Por que estas alterações</p><ul className="mt-2 space-y-1 text-xs leading-5 text-emerald-950">{item.quickWins.map(action => <li key={action}>• {action}</li>)}</ul></div></div></article>;
}

function SeoAuditCard({ item, selected, onToggle, onOptimize, onOptimizePlr }: { item: { title: string; score: number; coverUrl: string | null; issues: string[]; quickWins: string[]; recommendedTitle: string; suggestedCaption: string; metaDescription: string }; selected: boolean; onToggle: () => void; onOptimize: () => void; onOptimizePlr?: () => void }) {
  return <article className={`relative overflow-hidden rounded-2xl border bg-white shadow-sm transition ${selected ? 'border-violet-500 ring-2 ring-violet-200' : 'border-slate-200'}`}><label className="absolute right-3 top-3 z-10 flex cursor-pointer items-center gap-2 rounded-full bg-white px-2 py-1 text-[10px] font-black text-violet-800 shadow-sm ring-1 ring-violet-200"><input type="checkbox" checked={selected} onChange={onToggle} className="h-4 w-4 accent-violet-600" /> Selecionar</label><div className="flex gap-3 border-b border-slate-100 p-4 pr-28"><div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-violet-50">{item.coverUrl ? <img src={item.coverUrl} alt={`Capa de ${item.title}`} className="h-full w-full object-cover" /> : <Package className="m-5 h-6 w-6 text-violet-500" />}</div><div className="min-w-0 flex-1"><p className="line-clamp-2 text-sm font-black text-slate-900">{item.title}</p><p className={`mt-1 text-xs font-bold ${selected ? 'text-violet-700' : 'text-amber-700'}`}>SEO {item.score}/100</p></div></div><div className="p-4"><div className="grid gap-3 sm:grid-cols-2"><div><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">O que precisa atenção</p><ul className="mt-1.5 space-y-1 text-xs leading-5 text-slate-600">{item.issues.slice(0, 3).map(issue => <li key={issue}>• {issue}</li>)}</ul></div><div><p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Sugestões da IA</p><ul className="mt-1.5 space-y-1 text-xs leading-5 text-slate-600">{item.quickWins.slice(0, 3).map(win => <li key={win}>• {win}</li>)}</ul></div></div>{item.recommendedTitle && <p className="mt-3 rounded-xl bg-violet-50 px-3 py-2 text-xs leading-5 text-violet-900"><strong>Título sugerido:</strong> {item.recommendedTitle}</p>}{item.suggestedCaption && <p className="mt-2 rounded-xl bg-pink-50 px-3 py-2 text-xs leading-5 text-pink-950"><strong>Legenda sugerida:</strong> {item.suggestedCaption}</p>}{item.metaDescription && <p className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600"><strong>Resumo para busca:</strong> {item.metaDescription}</p>}<div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={onOptimize} className="inline-flex min-h-10 items-center gap-1 rounded-xl bg-violet-600 px-3 text-xs font-black text-white transition hover:bg-violet-700">Otimizar produto final <ArrowUpRight className="h-3.5 w-3.5" /></button>{onOptimizePlr && <button type="button" onClick={onOptimizePlr} className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-amber-300 bg-amber-50 px-3 text-xs font-black text-amber-900 transition hover:bg-amber-100">Otimizar PLR <ArrowUpRight className="h-3.5 w-3.5" /></button>}</div></div></article>;
}
