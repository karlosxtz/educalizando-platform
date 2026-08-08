'use client';

import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, Plus, Edit3, Trash2, Eye, EyeOff, X, 
  FileText, Video, BookOpen, HelpCircle, Layers, CheckCircle2, Loader2 
} from 'lucide-react';

import { productFormSchema, type ProductFormValues } from '@/lib/zod-schemas';
import { 
  getStoreByCreatorId, 
  getProductsByStoreId, 
  createProduct, 
  updateProduct, 
  deleteProduct 
} from '@/lib/store-service';
import { Product, Store, ProductType } from '@/lib/types';

export default function ProductsManagementPage() {
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      titulo: '',
      descricao: '',
      tipo: 'pdf',
      preco: 29.90,
      capa_url: '',
      arquivo_url: '',
      status: 'publicado'
    }
  });

  const loadData = async () => {
    try {
      const currentStore = await getStoreByCreatorId('creator-ricardo');
      setStore(currentStore);
      const prods = await getProductsByStoreId(currentStore.id);
      setProducts(prods);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    reset({
      titulo: '',
      descricao: '',
      tipo: 'pdf',
      preco: 49.90,
      capa_url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80',
      arquivo_url: 'https://example.com/material-didatico.pdf',
      status: 'publicado'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prod: Product) => {
    setEditingProduct(prod);
    reset({
      titulo: prod.titulo,
      descricao: prod.descricao || '',
      tipo: prod.tipo,
      preco: prod.preco,
      capa_url: prod.capa_url || '',
      arquivo_url: prod.arquivo_url || '',
      status: prod.status
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (prodId: string) => {
    if (confirm('Tem certeza que deseja excluir este produto didático?')) {
      try {
        await deleteProduct(prodId);
        setProducts(prev => prev.filter(p => p.id !== prodId));
      } catch (err: any) {
        alert(err.message || 'Erro ao excluir produto.');
      }
    }
  };

  const handleToggleStatus = async (prod: Product) => {
    const newStatus = prod.status === 'publicado' ? 'rascunho' : 'publicado';
    try {
      const updated = await updateProduct(prod.id, { status: newStatus });
      setProducts(prev => prev.map(p => (p.id === prod.id ? updated : p)));
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar status.');
    }
  };

  const onSubmit: SubmitHandler<ProductFormValues> = async (values) => {
    if (!store) return;
    try {
      if (editingProduct) {
        const updated = await updateProduct(editingProduct.id, {
          titulo: values.titulo,
          descricao: values.descricao,
          tipo: values.tipo,
          preco: values.preco,
          capa_url: values.capa_url,
          arquivo_url: values.arquivo_url,
          status: values.status
        });
        setProducts(prev => prev.map(p => (p.id === editingProduct.id ? updated : p)));
      } else {
        const created = await createProduct({
          store_id: store.id,
          titulo: values.titulo,
          descricao: values.descricao || null,
          tipo: values.tipo,
          preco: values.preco,
          capa_url: values.capa_url || null,
          arquivo_url: values.arquivo_url || null,
          status: values.status
        });
        setProducts(prev => [created, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar produto.');
    }
  };

  const getTipoIcon = (tipo: ProductType) => {
    switch (tipo) {
      case 'pdf': return <FileText className="w-4 h-4 text-sky-600" />;
      case 'ebook': return <BookOpen className="w-4 h-4 text-indigo-600" />;
      case 'video': return <Video className="w-4 h-4 text-purple-600" />;
      case 'curso': return <Layers className="w-4 h-4 text-blue-600" />;
      case 'simulado': return <HelpCircle className="w-4 h-4 text-amber-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-3">
            <Package className="w-7 h-7 text-blue-600" /> Meus Produtos Didáticos ({products.length})
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Cadastre apostilas em PDF, e-books, simulados e videoaulas da sua loja.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-5 py-3 rounded-xl font-extrabold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span>Cadastrar Novo Produto</span>
        </button>
      </div>

      {/* Products Catalog Grid */}
      {products.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-xs text-center max-w-lg mx-auto space-y-4">
          <Package className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">Nenhum produto cadastrado ainda</h3>
          <p className="text-sm text-slate-500">
            Cadastre seu primeiro e-book ou apostila digital em PDF para começar a vender na sua loja.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="px-5 py-2.5 rounded-xl font-bold text-xs bg-blue-600 text-white inline-flex items-center gap-2 shadow-md"
          >
            <Plus className="w-4 h-4" /> Cadastrar Meu Primeiro Produto
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(prod => (
            <div
              key={prod.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md transition-all relative overflow-hidden"
            >
              <div className="space-y-3">
                {/* Cover Image & Type Tag */}
                <div className="h-40 rounded-xl overflow-hidden bg-slate-100 relative">
                  {prod.capa_url ? (
                    <img src={prod.capa_url} alt={prod.titulo} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
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
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Preço de Venda</span>
                  <span className="text-lg font-black text-slate-900">
                    R$ {prod.preco.toFixed(2).replace('.', ',')}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEditModal(prod)}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    title="Editar produto"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(prod.id)}
                    className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                    title="Excluir produto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form: Create / Edit Product */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-200 w-full max-w-xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  {editingProduct ? 'Editar Produto Didático' : 'Cadastrar Novo Produto Didático'}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Título do Material *
                  </label>
                  <input
                    type="text"
                    {...register('titulo')}
                    placeholder="Ex: Apostila de Direito Constitucional Esquematizado"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm focus:outline-none"
                  />
                  {errors.titulo && (
                    <p className="text-xs text-rose-500 mt-1 font-medium">{errors.titulo.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Tipo de Conteúdo *
                    </label>
                    <select
                      {...register('tipo')}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm focus:outline-none"
                    >
                      <option value="pdf">Apostila PDF</option>
                      <option value="ebook">E-Book Interativo</option>
                      <option value="video">Videoaula</option>
                      <option value="curso">Curso Completo</option>
                      <option value="simulado">Simulado Gabaritado</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Preço de Venda (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('preco')}
                      placeholder="49.90"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm focus:outline-none"
                    />
                    {errors.preco && (
                      <p className="text-xs text-rose-500 mt-1 font-medium">{errors.preco.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    URL da Imagem de Capa
                  </label>
                  <input
                    type="text"
                    {...register('capa_url')}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    URL do Arquivo (PDF ou Link de Vídeo)
                  </label>
                  <input
                    type="text"
                    {...register('arquivo_url')}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Descrição Detalhada
                  </label>
                  <textarea
                    rows={3}
                    {...register('descricao')}
                    placeholder="Descreva o conteúdo do material didático..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Status de Publicação *
                  </label>
                  <select
                    {...register('status')}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm focus:outline-none"
                  >
                    <option value="publicado">Publicado (Visível na loja pública)</option>
                    <option value="rascunho">Rascunho (Oculto da vitrine)</option>
                  </select>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 disabled:opacity-50 shadow-md"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>{editingProduct ? 'Salvar Alterações' : 'Publicar Produto'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
