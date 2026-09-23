'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, Plus, Edit3, Trash2, Eye, EyeOff, 
  FileText, Video, BookOpen, HelpCircle, Layers, Loader2, 
  AlertTriangle, AlertCircle, Tags, GraduationCap, Filter, Sparkles, X, ShieldCheck, Search, RotateCcw
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
  const deleteTriggerRef = useRef<HTMLButtonElement | null>(null);
  const marketingTriggerRef = useRef<HTMLButtonElement | null>(null);

  const loadData = async () => {
    try {
      const currentStore = await getCurrentCreatorStore();
      setStore(currentStore);
      const prods = await getProductsByStoreId(currentStore.id);
      setProducts(prods);

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
  const seoAverage = seoReports.length ? Math.round(seoReports.reduce((sum, report) => sum + report.score, 0) / seoReports.length) : 0;
  const seoNeedsWork = seoReports.filter(report => report.score < 90);
  const getSeoReport = (productId: string) => seoReports.find(report => report.product.id === productId);

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

          <button onClick={() => setShowSeo(value => !value)} className="w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl font-bold text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-all flex items-center gap-2 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"><Sparkles className="w-4 h-4" /> {showSeo ? 'Ocultar SEO' : 'Verificar SEO'}</button><Link
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

      {showSeo && <section className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 shadow-xs"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wider text-blue-700">SEO visível nos cards</p><p className="mt-1 text-sm text-slate-600">Média da loja: <strong>{seoAverage}/100</strong> · Cada material mostra sua nota e a primeira melhoria recomendada.</p></div><span className={`rounded-xl px-3 py-2 text-xs font-black ${seoNeedsWork.length ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>{seoNeedsWork.length} para melhorar</span></div></section>}

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
                {showSeo && getSeoReport(prod.id) && <span className={`absolute right-3 top-3 z-10 rounded-full px-2 py-1 text-[10px] font-black ${getSeoReport(prod.id)!.score >= 90 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`} title={getSeoReport(prod.id)!.suggestions.join(' · ') || 'Critérios SEO preenchidos'}>SEO {getSeoReport(prod.id)!.score}</span>}
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
                    {showSeo && (getSeoReport(prod.id)?.suggestions.length ? <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-2 text-[10px] font-semibold leading-relaxed text-amber-800">Melhore: {getSeoReport(prod.id)!.suggestions[0]}.</p> : <p className="mt-2 text-[10px] font-semibold text-emerald-700">SEO completo</p>)}
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
                      <span className="text-lg font-black text-slate-900">
                        R$ {prod.preco.toFixed(2).replace('.', ',')}
                      </span>
                    </div>

                    {prod.is_plr && prod.preco_plr !== undefined && prod.preco_plr !== null && (
                      <div>
                        <span className="text-[10px] text-blue-500 uppercase tracking-wider block font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Licença PLR
                        </span>
                        <span className="text-lg font-black text-blue-700">
                          R$ {prod.preco_plr.toFixed(2).replace('.', ',')}
                        </span>
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
