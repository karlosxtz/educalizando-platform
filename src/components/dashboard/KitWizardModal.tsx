'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, CheckCircle2, ChevronRight, Boxes, FileText, UploadCloud, 
  DollarSign, Eye, Loader2, AlertCircle, Save, Check, Sparkles, Package
} from 'lucide-react';

import { getPublicProductsByStoreId } from '@/lib/store-service';
import { Product, Kit } from '@/lib/types';
import FileUpload from '@/components/dashboard/FileUpload';

interface KitWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId?: string;
  editingKit?: Kit | null;
  onSave: (data: {
    titulo: string;
    descricao: string | null;
    capa_url: string | null;
    preco_kit: number;
    status: 'publicado' | 'rascunho';
    product_ids: string[];
  }) => Promise<void>;
}

export default function KitWizardModal({
  isOpen,
  onClose,
  storeId,
  editingKit,
  onSave
}: KitWizardModalProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Fields
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [capaUrl, setCapaUrl] = useState<string | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [precoKit, setPrecoKit] = useState<string>('49,90');
  const [status, setStatus] = useState<'publicado' | 'rascunho'>('publicado');

  useEffect(() => {
    if (isOpen && storeId) {
      loadStoreProducts();
    }
  }, [isOpen, storeId]);

  useEffect(() => {
    if (editingKit) {
      setTitulo(editingKit.titulo);
      setDescricao(editingKit.descricao || '');
      setCapaUrl(editingKit.capa_url);
      setPrecoKit(editingKit.preco_kit.toString().replace('.', ','));
      setStatus(editingKit.status === 'rascunho' ? 'rascunho' : 'publicado');
      const ids = (editingKit.products || []).map(p => p.id);
      setSelectedProductIds(ids);
    } else {
      setTitulo('');
      setDescricao('');
      setCapaUrl(null);
      setPrecoKit('49,90');
      setStatus('publicado');
      setSelectedProductIds([]);
    }
    setCurrentStep(1);
    setErrorMsg(null);
  }, [editingKit, isOpen]);

  const loadStoreProducts = async () => {
    if (!storeId) return;
    setLoadingProducts(true);
    try {
      const prods = await getPublicProductsByStoreId(storeId);
      setAvailableProducts(prods);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Dynamic real-time calculation of selected products sum
  const selectedProductsSum = selectedProductIds.reduce((sum, id) => {
    const prod = availableProducts.find(p => p.id === id);
    return sum + (prod ? prod.preco : 0);
  }, 0);

  const numericPrecoKit = parseFloat(precoKit.replace(',', '.')) || 0;
  const economiaValor = Math.max(0, selectedProductsSum - numericPrecoKit);
  const economiaPercentual = selectedProductsSum > 0 && numericPrecoKit < selectedProductsSum
    ? Math.round((economiaValor / selectedProductsSum) * 100)
    : 0;

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleNextStep = () => {
    setErrorMsg(null);
    if (currentStep === 1) {
      if (!titulo.trim()) {
        setErrorMsg('Por favor, informe o título do kit ou combo.');
        return;
      }
    }
    if (currentStep === 3) {
      if (selectedProductIds.length < 2) {
        setErrorMsg('Selecione pelo menos 2 produtos para compor o combo.');
        return;
      }
      // Auto-suggest a default price with 20% discount if setting up brand new kit
      if (!editingKit && numericPrecoKit === 49.90 && selectedProductsSum > 0) {
        const suggestedPrice = Math.round(selectedProductsSum * 0.8 * 100) / 100;
        setPrecoKit(suggestedPrice.toFixed(2).replace('.', ','));
      }
    }
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    setErrorMsg(null);
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSave = async () => {
    setErrorMsg(null);
    if (isNaN(numericPrecoKit) || numericPrecoKit < 0) {
      setErrorMsg('Informe um preço final de venda válido para o kit.');
      return;
    }
    if (selectedProductIds.length === 0) {
      setErrorMsg('O kit precisa conter pelo menos 1 produto.');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        titulo,
        descricao: descricao || null,
        capa_url: capaUrl,
        preco_kit: numericPrecoKit,
        status,
        product_ids: selectedProductIds
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar kit.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl border border-slate-200 w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="bg-white border-b border-slate-200 p-5 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">
                  {editingKit ? 'Editar Kit / Combo' : 'Wizard de Criação de Kit'}
                </h2>
                <p className="text-xs text-slate-500 font-medium">Passo {currentStep} de 4</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Steps Indicator Bar */}
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
            {[
              { step: 1, title: 'Título & Descrição' },
              { step: 2, title: 'Capa do Kit' },
              { step: 3, title: 'Seleção de Produtos' },
              { step: 4, title: 'Preço & Economia' }
            ].map((item) => {
              const isCompleted = currentStep > item.step;
              const isCurrent = currentStep === item.step;

              return (
                <div key={item.step} className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                      isCompleted
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : item.step}
                  </div>
                  <span className={`text-xs font-bold hidden md:inline ${isCurrent ? 'text-blue-600' : 'text-slate-500'}`}>
                    {item.title}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Form Content Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs font-bold flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* STEP 1: Title & Description */}
            {currentStep === 1 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" /> Passo 1: Informações do Combo
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Dê um nome atraente que destaque os benefícios do pacote completo.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                      Título do Kit / Combo *
                    </label>
                    <input
                      type="text"
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                      placeholder="Ex: Combo Mestre do ENEM - Apostila + E-book + 500 Questões"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm font-medium focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                      Descrição Completa do Combo
                    </label>
                    <textarea
                      rows={4}
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      placeholder="Descreva quais produtos fazem parte deste combo e qual a vantagem de comprar tudo junto..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm font-medium focus:outline-none"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Kit Cover Upload */}
            {currentStep === 2 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <UploadCloud className="w-5 h-5 text-blue-600" /> Passo 2: Capa Promocional do Kit
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Envie uma capa exclusiva para representar o combo na vitrine da loja.
                  </p>
                </div>

                <FileUpload
                  bucket="product-covers"
                  accept="image/*"
                  maxSizeMB={3}
                  value={capaUrl}
                  onChange={(url) => setCapaUrl(url)}
                  label="Capa do Kit / Combo"
                  helperText="Formatos recomendados: PNG, JPG ou WEBP (máx 3MB)"
                  recommendationText="Recomendado utilizar uma imagem que represente um pacote de livros ou apostilas."
                  isImage={true}
                  aspectRatio="3:4"
                />
              </motion.div>
            )}

            {/* STEP 3: Product Selection Checklist */}
            {currentStep === 3 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-600" /> Passo 3: Seleção de Produtos Inclusos
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Marque os produtos da sua loja que serão entregues juntos neste kit.
                  </p>
                </div>

                {loadingProducts ? (
                  <div className="py-12 flex justify-center">
                    <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
                  </div>
                ) : availableProducts.length === 0 ? (
                  <div className="bg-amber-50 border border-amber-200 text-amber-900 p-6 rounded-2xl text-center space-y-2">
                    <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
                    <h4 className="font-bold text-sm">Nenhum produto publicado encontrado</h4>
                    <p className="text-xs text-amber-700">
                      Você precisa publicar produtos na sua loja antes de poder agrupá-los em um kit.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-xl flex items-center justify-between text-xs font-bold text-blue-900">
                      <span>{selectedProductIds.length} produto(s) selecionado(s)</span>
                      <span>Soma Individual: <strong>R$ {selectedProductsSum.toFixed(2).replace('.', ',')}</strong></span>
                    </div>

                    <div className="grid gap-2.5 max-h-72 overflow-y-auto pr-1">
                      {availableProducts.map(prod => {
                        const isSelected = selectedProductIds.includes(prod.id);

                        return (
                          <div
                            key={prod.id}
                            onClick={() => toggleProductSelection(prod.id)}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                              isSelected
                                ? 'bg-blue-50/70 border-blue-500 shadow-xs'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 border transition-all ${
                                isSelected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-300'
                              }`}>
                                {isSelected && <Check className="w-4 h-4" />}
                              </div>

                              <div className="w-10 h-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                                {prod.capa_url ? (
                                  <img src={prod.capa_url} alt={prod.titulo} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400 font-bold">
                                    PDF
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-slate-900 truncate">{prod.titulo}</h4>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">{prod.tipo}</span>
                              </div>
                            </div>

                            <div className="text-right flex-shrink-0">
                              <span className="text-xs font-black text-slate-900">
                                R$ {prod.preco.toFixed(2).replace('.', ',')}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 4: Pricing & Discount Real-time Economy Preview */}
            {currentStep === 4 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-blue-600" /> Passo 4: Preço Final do Combo & Economia
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Defina o valor promocional de venda do kit e veja o cálculo de economia em tempo real.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                      Preço de Venda do Kit (R$) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                      <input
                        type="text"
                        value={precoKit}
                        onChange={(e) => setPrecoKit(e.target.value)}
                        placeholder="49,90"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm font-black focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                      Status de Publicação
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as 'publicado' | 'rascunho')}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none"
                    >
                      <option value="publicado">Publicado (Visível na loja)</option>
                      <option value="rascunho">Rascunho (Privado)</option>
                    </select>
                  </div>
                </div>

                {/* Real-time Discount & Savings Badge Banner */}
                <div className="bg-gradient-to-br from-emerald-500 to-teal-700 p-5 rounded-2xl text-white space-y-3 shadow-md">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-300" />
                    <span className="text-xs font-extrabold uppercase tracking-wider">Cálculo de Economia em Tempo Real</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-1 border-t border-white/20">
                    <div>
                      <span className="text-[11px] text-emerald-100 block">Preço dos Produtos Somados</span>
                      <span className="text-lg font-bold line-through text-emerald-200">
                        R$ {selectedProductsSum.toFixed(2).replace('.', ',')}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-emerald-100 block">Preço Final do Combo</span>
                      <span className="text-2xl font-black">
                        R$ {numericPrecoKit.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>

                  {economiaValor > 0 ? (
                    <div className="bg-white/20 backdrop-blur-xs p-3 rounded-xl text-center font-black text-sm">
                      Economia de R$ {economiaValor.toFixed(2).replace('.', ',')} ({economiaPercentual}% OFF)
                    </div>
                  ) : (
                    <div className="bg-black/20 p-2.5 rounded-xl text-center font-bold text-xs text-emerald-100">
                      O preço do kit é igual ou maior que a soma individual.
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 sticky bottom-0 z-10 flex items-center justify-between gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={handlePrevStep}
              disabled={currentStep === 1 || saving}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 disabled:opacity-40 transition-all min-h-[44px]"
            >
              Anterior
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-5 py-2.5 rounded-xl font-extrabold text-xs bg-brand-navy hover:bg-brand-navy-hover text-white shadow-md flex items-center gap-2 transition-all min-h-[44px]"
              >
                <span>Próximo Passo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl font-extrabold text-xs bg-brand-green hover:bg-brand-green-hover text-white shadow-md flex items-center gap-2 transition-all min-h-[44px]"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{saving ? 'Salvando...' : editingKit ? 'Atualizar Kit' : 'Publicar Kit'}</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
