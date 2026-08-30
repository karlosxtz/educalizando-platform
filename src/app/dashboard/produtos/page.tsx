'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, Plus, Edit3, Trash2, Eye, EyeOff, 
  FileText, Video, BookOpen, HelpCircle, Layers, Loader2, 
  AlertTriangle, AlertCircle, Tags, GraduationCap, Filter, Sparkles, X
} from 'lucide-react';

import { 
  getCurrentCreatorStore, 
  getProductsByStoreId, 
  createProduct, 
  updateProduct, 
  deleteProduct 
} from '@/lib/store-service';
import { getCategories, getEducationLevels } from '@/lib/category-service';
import { Product, Store, ProductType, Category, EducationLevel } from '@/lib/types';
import ProductWizardModal from '@/components/dashboard/ProductWizardModal';
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

  // Modals State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Styled AlertDialog Delete Confirmation State
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isDeletingLoading, setIsDeletingLoading] = useState(false);

  // Marketing AI State
  const [marketingProduct, setMarketingProduct] = useState<Product | null>(null);
  const [campaignData, setCampaignData] = useState<string>('');
  const [isGeneratingCampaign, setIsGeneratingCampaign] = useState(false);

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
    loadData();
  }, []);

  const handleOpenCreateWizard = () => {
    setEditingProduct(null);
    setActionError(null);
    setIsWizardOpen(true);
  };

  const handleOpenEditWizard = (prod: Product) => {
    setEditingProduct(prod);
    setActionError(null);
    setIsWizardOpen(true);
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
    } catch (err: any) {
      setActionError(err.message || 'Erro ao excluir produto.');
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
    } catch (err: any) {
      setActionError(err.message);
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
    } catch (err: any) {
      setActionError(err.message || 'Erro ao alterar status do produto.');
    }
  };

  const handleWizardSave = async (data: {
    titulo: string;
    descricao: string | null;
    tipo: ProductType;
    preco: number;
    capa_url: string | null;
    arquivo_url: string | null;
    status: 'publicado' | 'rascunho';
    category_id: string | null;
    education_level_id: string | null;
  }) => {
    if (!store) return;
    setActionError(null);

    if (editingProduct) {
      const updated = await updateProduct(editingProduct.id, {
        titulo: data.titulo,
        descricao: data.descricao,
        tipo: data.tipo,
        preco: data.preco,
        capa_url: data.capa_url,
        arquivo_url: data.arquivo_url,
        status: data.status,
        category_id: data.category_id,
        education_level_id: data.education_level_id
      });
      setProducts(prev => prev.map(p => (p.id === editingProduct.id ? updated : p)));
    } else {
      const created = await createProduct({
        store_id: store.id,
        titulo: data.titulo,
        descricao: data.descricao,
        tipo: data.tipo,
        preco: data.preco,
        capa_url: data.capa_url,
        arquivo_url: data.arquivo_url,
        status: data.status,
        category_id: data.category_id,
        education_level_id: data.education_level_id
      });
      setProducts(prev => [created, ...prev]);
    }
    router.refresh();
  };

  const filteredProducts = products.filter(p => {
    const matchCategory = selectedCategoryFilter === 'all' || p.category_id === selectedCategoryFilter;
    const matchEducation = selectedEducationFilter === 'all' || p.education_level_id === selectedEducationFilter;
    return matchCategory && matchEducation;
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

  // Build Options for CustomSelect Filter Component
  const categoryFilterOptions: CustomSelectOption[] = [
    { value: 'all', label: 'Todas as Categorias' },
    ...categories.map(c => ({ value: c.id, label: c.nome }))
  ];

  const educationFilterOptions: CustomSelectOption[] = [
    { value: 'all', label: 'Todos os Níveis' },
    ...educationLevels.map(e => ({ value: e.id, label: e.nome }))
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const storeIsConfigured = store && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(store.id);

  return (
    <div className="space-y-8">
      {!storeIsConfigured && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-5 rounded-2xl flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-black text-sm">Sua loja ainda não está configurada</p>
            <p className="text-xs font-medium mt-1">
              Para cadastrar produtos, você precisa primeiro salvar as informações da sua loja.
              Acesse <strong>"Configurações da Loja"</strong> no menu lateral, preencha o nome e slug, e clique em Salvar.
            </p>
            <a href="/dashboard/loja" className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold rounded-lg transition-colors">
              Configurar Minha Loja Agora
            </a>
          </div>
        </div>
      )}
      {/* Page Title & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-3">
            <Package className="w-7 h-7 text-brand-navy" /> Meus Produtos Didáticos ({products.length})
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Cadastre e gerencie suas apostilas, e-books e cursos categorizados por tema e escolaridade.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsCategoryManagerOpen(true)}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all flex items-center gap-2 min-h-[44px]"
          >
            <Tags className="w-4 h-4 text-brand-teal" />
            <span>Gerenciar Minhas Categorias</span>
          </button>

          <Link
            href="/dashboard/produtos/novo"
            className="px-5 py-2.5 rounded-xl font-extrabold text-xs bg-brand-navy hover:bg-brand-navy-hover text-white shadow-md shadow-brand-navy/20 transition-all flex items-center gap-2 min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Novo Produto (Tela Cheia)</span>
          </Link>
        </div>
      </div>

      {actionError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs flex items-center gap-3 font-semibold">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Styled Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
          <Filter className="w-4 h-4 text-blue-600" /> Filtrar Por:
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {/* Custom Category Select */}
          <div className="w-full sm:w-56">
            <CustomSelect
              options={categoryFilterOptions}
              value={selectedCategoryFilter}
              onChange={(val) => setSelectedCategoryFilter(val)}
              icon={<Tags className="w-4 h-4" />}
            />
          </div>

          {/* Custom Education Level Select */}
          <div className="w-full sm:w-56">
            <CustomSelect
              options={educationFilterOptions}
              value={selectedEducationFilter}
              onChange={(val) => setSelectedEducationFilter(val)}
              icon={<GraduationCap className="w-4 h-4" />}
            />
          </div>
        </div>
      </div>

      {/* Products Catalog Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-xs text-center max-w-lg mx-auto space-y-4">
          <Package className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">
            {products.length === 0 ? 'Você ainda não publicou nenhum produto' : 'Nenhum produto atende a este filtro'}
          </h3>
          <p className="text-sm text-slate-500">
            Sua loja está pronta! Abra o Wizard guiado para cadastrar seu primeiro e-book ou apostila em PDF.
          </p>
          <button
            onClick={handleOpenCreateWizard}
            className="px-5 py-2.5 rounded-xl font-bold text-xs bg-blue-600 text-white inline-flex items-center gap-2 shadow-md hover:bg-blue-700 transition-all"
          >
            <Plus className="w-4 h-4" /> Cadastrar Meu Primeiro Produto
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(prod => {
            const catName = getCategoryName(prod.category_id);
            const edName = getEducationName(prod.education_level_id);

            return (
              <div
                key={prod.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md transition-all relative overflow-hidden"
              >
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
                      className={`absolute top-2 right-2 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-xs ${
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
                    <h3 className="font-bold text-slate-900 text-base line-clamp-2 leading-tight">
                      {prod.titulo}
                    </h3>
                    {prod.descricao && (
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {prod.descricao}
                      </p>
                    )}
                  </div>
                </div>

                {/* Price & Actions Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Preço de Venda</span>
                    <span className="text-lg font-black text-slate-900">
                      R$ {prod.preco.toFixed(2).replace('.', ',')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setMarketingProduct(prod)}
                      className="px-2.5 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-600 transition-colors flex items-center gap-1 text-xs font-bold"
                      title="Gerar Campanha com IA"
                    >
                      <Sparkles className="w-4 h-4" /> <span className="hidden lg:inline">Campanha</span>
                    </button>
                    <Link
                      href={`/dashboard/produtos/novo?edit=${prod.id}`}
                      className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      title="Editar produto via Wizard"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => setDeletingProduct(prod)}
                      className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
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
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-6 space-y-5 shadow-2xl relative"
            >
              <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-slate-900">Excluir Produto Didático?</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Tem certeza que deseja remover <strong>"{deletingProduct.titulo}"</strong>? Esta ação é definitiva para materiais sem vendas.
                </p>
              </div>

              {actionError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs flex items-start gap-2.5 text-left font-medium">
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
                  }}
                  disabled={isDeletingLoading}
                  className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
                >
                  {actionError ? 'Fechar' : 'Cancelar'}
                </button>
                {!actionError && (
                  <button
                    type="button"
                    onClick={confirmDeleteProduct}
                    disabled={isDeletingLoading}
                    className="w-full py-2.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-md flex items-center justify-center gap-2 transition-all"
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

      {/* Guided 4-Step Product Wizard Modal */}
      <ProductWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        storeId={store?.id}
        editingProduct={editingProduct}
        onSave={handleWizardSave}
      />

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
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-200 w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-purple-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 leading-tight">
                      Campanha de Vendas (IA)
                    </h2>
                    <p className="text-xs text-slate-600 font-medium line-clamp-1">
                      {marketingProduct.titulo}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setMarketingProduct(null); setCampaignData(''); setActionError(null); }}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto space-y-4">
                {actionError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs flex items-start gap-2.5 font-medium mb-4">
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
                      className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all shadow-md inline-flex items-center gap-2"
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
