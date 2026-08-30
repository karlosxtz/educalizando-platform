'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, CheckCircle2, ChevronRight, Boxes, FileText, 
  UploadCloud, Package, DollarSign, Eye, Sparkles, Loader2, AlertCircle, Save, Check
} from 'lucide-react';

import { getCurrentCreatorStore, getPublicProductsByStoreId } from '@/lib/store-service';
import { createKit, updateKit, getKitById } from '@/lib/kit-service';
import { Product, Store, Kit } from '@/lib/types';
import FileUpload from '@/components/dashboard/FileUpload';
import { toast } from 'sonner';

function KitWizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [store, setStore] = useState<Store | null>(null);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Wizard Step Control (1, 2, 3, 4)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form Fields
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [capaUrl, setCapaUrl] = useState<string | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [precoKit, setPrecoKit] = useState<string>('49,90');
  const [status, setStatus] = useState<'publicado' | 'rascunho'>('publicado');

  useEffect(() => {
    async function initData() {
      try {
        const currentStore = await getCurrentCreatorStore();
        setStore(currentStore);

        const prods = await getPublicProductsByStoreId(currentStore.id);
        setAvailableProducts(prods);

        if (editId) {
          const existing = await getKitById(editId);
          if (existing) {
            setTitulo(existing.titulo);
            setDescricao(existing.descricao || '');
            setCapaUrl(existing.capa_url);
            setPrecoKit(existing.preco_kit.toString().replace('.', ','));
            setStatus(existing.status === 'rascunho' ? 'rascunho' : 'publicado');
            const ids = (existing.products || []).map(p => p.id);
            setSelectedProductIds(ids);
          }
        }
      } catch (err: any) {
        console.error(err);
        setErrorMsg('Erro ao carregar dados do formulário.');
      } finally {
        setLoading(false);
      }
    }
    initData();
  }, [editId]);

  const handleOptimizeAll = async () => {
    if (!store?.id) {
      toast.error('Loja não configurada.');
      return;
    }
    if (!titulo || titulo.length < 10) {
      toast.error('Digite pelo menos 10 caracteres no título para que a IA possa gerar o material.');
      return;
    }

    const loadingToast = toast.loading('A IA está gerando o kit mágico...');
    try {
      // In Kits, we inform the AI it's a kit/bundle context by modifying the payload slightly if needed,
      // but the API is generic enough. We just ensure we send the current values.
      const res = await fetch('/api/ai/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: titulo + " (Kit/Combo de Produtos)",
          storeId: store.id
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Erro ao otimizar com IA.');
      }

      if (!res.body) throw new Error('Falha ao iniciar leitura de stream.');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let streamedText = '';

      setTitulo('');
      setDescricao('');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(dataStr);
              const textPart = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
              streamedText += textPart;
              
              // Extração progressiva com Regex
              const titleMatch = streamedText.match(/\[TITULO\]([\s\S]*?)(\[DESCRICAO\]|$)/);
              const descMatch = streamedText.match(/\[DESCRICAO\]([\s\S]*)/);
              
              if (titleMatch) setTitulo(titleMatch[1].trimStart());
              if (descMatch) setDescricao(descMatch[1].trimStart());
            } catch (e) {
              // ignore partial JSON parse errors
            }
          }
        }
      }
      
      toast.success(`Kit gerado com sucesso!`, { id: loadingToast });
    } catch (err: any) {
      toast.error(err.message, { id: loadingToast });
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
      if (!editId && numericPrecoKit === 49.90 && selectedProductsSum > 0) {
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

  const handleSaveKit = async () => {
    if (!store) return;
    setSaving(true);
    setErrorMsg(null);

    try {
      if (editId) {
        await updateKit(
          editId,
          {
            titulo,
            descricao: descricao || null,
            capa_url: capaUrl,
            preco_kit: numericPrecoKit,
            status
          },
          selectedProductIds
        );
      } else {
        await createKit(
          {
            store_id: store.id,
            titulo,
            descricao: descricao || null,
            capa_url: capaUrl,
            preco_kit: numericPrecoKit,
            status
          },
          selectedProductIds
        );
      }

      router.push('/dashboard/kits');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao salvar kit.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Fixed Navigation Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/dashboard/kits"
            className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para Kits</span>
          </Link>

          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-blue-600" />
            <h1 className="text-sm font-black text-slate-900">
              {editId ? 'Editar Kit de Produtos' : 'Wizard de Criação de Kit'}
            </h1>
          </div>

          <div className="text-xs text-slate-400 font-semibold hidden sm:block">
            Passo {currentStep} de 4
          </div>
        </div>
      </header>

      {/* Step Progress Indicator Bar */}
      <div className="bg-white border-b border-slate-200 py-4 px-4 sm:px-6 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 z-0" />

          {[
            { step: 1, title: 'Título & Descrição' },
            { step: 2, title: 'Capa do Kit' },
            { step: 3, title: 'Seleção de Produtos' },
            { step: 4, title: 'Preço & Economia' }
          ].map((item) => {
            const isCompleted = currentStep > item.step;
            const isCurrent = currentStep === item.step;

            return (
              <div key={item.step} className="relative z-10 flex flex-col items-center gap-1.5 bg-white px-2">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                    isCompleted
                      ? 'bg-emerald-600 text-white shadow-md'
                      : isCurrent
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-md'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : item.step}
                </div>
                <span className={`text-[11px] font-bold hidden sm:block ${isCurrent ? 'text-blue-600' : 'text-slate-500'}`}>
                  {item.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Wizard Form Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs font-bold flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-6 sm:p-10 space-y-8">
          {/* STEP 1: Basic Information */}
          {currentStep === 1 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  1. Título e Descrição do Kit
                </h2>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Crie um nome atraente e uma descrição chamativa para o seu pacote de infoprodutos.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                      Título do Kit / Combo *
                    </label>
                    <button type="button" onClick={handleOptimizeAll} className="text-sm text-blue-600 flex items-center gap-1 font-bold hover:text-blue-800 transition-colors">
                      <Sparkles className="w-4 h-4"/> Gerar com IA
                    </button>
                  </div>
                  <input
                    type="text"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Ex: Super Combo Vestibular - Matemática + Física + Química Esquematizada"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm font-medium focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                      Descrição Detalhada do Combo
                    </label>
                  </div>
                  <textarea
                    rows={4}
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Explique o que o aluno ganha comprando este combo completo e quais arquivos receberá..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm font-medium focus:outline-none"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Kit Cover Upload */}
          {currentStep === 2 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-blue-600" />
                  2. Imagem de Capa do Kit
                </h2>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Selecione uma imagem promocional que represente o pacote completo de materiais.
                </p>
              </div>

              <FileUpload
                bucket="product-covers"
                accept="image/*"
                maxSizeMB={3}
                value={capaUrl}
                onChange={(url) => setCapaUrl(url)}
                label="Capa do Combo"
                helperText="Upload em formato PNG, JPG ou WEBP (máx 3MB)"
                recommendationText="Imagens em mockup de pacotes/combos geram até 40% mais conversão!"
                isImage={true}
                aspectRatio="3:4"
              />
            </motion.div>
          )}

          {/* STEP 3: Product Selection Checklist */}
          {currentStep === 3 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  3. Seleção de Produtos da Loja
                </h2>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Selecione quais produtos publicados da sua própria loja farão parte deste combo.
                </p>
              </div>

              {availableProducts.length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 p-6 rounded-2xl text-center space-y-2">
                  <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
                  <h4 className="font-bold text-sm">Nenhum produto publicado</h4>
                  <p className="text-xs text-amber-700">
                    Você ainda não possui produtos publicados nesta loja para agrupar em um kit.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl flex items-center justify-between text-xs font-bold text-blue-900">
                    <span>{selectedProductIds.length} produto(s) selecionado(s)</span>
                    <span>Soma Individual: <strong className="text-sm">R$ {selectedProductsSum.toFixed(2).replace('.', ',')}</strong></span>
                  </div>

                  <div className="grid gap-3 max-h-96 overflow-y-auto pr-1">
                    {availableProducts.map(prod => {
                      const isSelected = selectedProductIds.includes(prod.id);

                      return (
                        <div
                          key={prod.id}
                          onClick={() => toggleProductSelection(prod.id)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                            isSelected
                              ? 'bg-blue-50/70 border-blue-600 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 border transition-all ${
                              isSelected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-300'
                            }`}>
                              {isSelected && <Check className="w-4 h-4" />}
                            </div>

                            <div className="w-12 h-14 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                              {prod.capa_url ? (
                                <img src={prod.capa_url} alt={prod.titulo} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400 font-bold">
                                  PDF
                                </div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-slate-900 truncate">{prod.titulo}</h4>
                              <span className="text-[10px] font-extrabold text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                                {prod.tipo}
                              </span>
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <span className="text-sm font-black text-slate-900">
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

          {/* STEP 4: Pricing & Discount Review */}
          {currentStep === 4 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  4. Preço Final do Kit & Cálculo de Economia
                </h2>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Defina o preço único de venda e confira como os alunos enxergarão o desconto oferecido.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                    Preço Final de Venda do Kit (R$) *
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

              {/* Dynamic Real-time Savings Banner */}
              <div className="bg-gradient-to-br from-emerald-600 to-teal-800 p-6 rounded-3xl text-white space-y-4 shadow-xl">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  <h4 className="text-xs font-extrabold uppercase tracking-widest">Resumo de Desconto & Economia para o Aluno</h4>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/20">
                  <div>
                    <span className="text-xs text-emerald-100 block font-medium">Preço Somado Individual</span>
                    <span className="text-xl font-bold line-through text-emerald-200">
                      R$ {selectedProductsSum.toFixed(2).replace('.', ',')}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-emerald-100 block font-medium">Preço Único de Venda do Kit</span>
                    <span className="text-3xl font-black">
                      R$ {numericPrecoKit.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                {economiaValor > 0 ? (
                  <div className="bg-white/20 backdrop-blur-xs p-4 rounded-2xl text-center font-black text-base shadow-inner">
                    Economia de R$ {economiaValor.toFixed(2).replace('.', ',')} ({economiaPercentual}% off)
                  </div>
                ) : (
                  <div className="bg-black/20 p-3 rounded-2xl text-center font-bold text-xs text-emerald-100">
                    Sem desconto ativo. O preço do kit é igual ou maior que a soma individual.
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Navigation Controls Bar */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handlePrevStep}
              disabled={currentStep === 1 || saving}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40 transition-all"
            >
              Anterior
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-6 py-2.5 rounded-xl font-extrabold text-xs bg-blue-600 text-white hover:bg-blue-700 shadow-md flex items-center gap-2 transition-all"
              >
                <span>Próximo Passo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveKit}
                disabled={saving}
                className="px-7 py-3 rounded-xl font-extrabold text-xs bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg flex items-center gap-2 transition-all"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{saving ? 'Salvando...' : editId ? 'Atualizar Kit' : 'Publicar Kit de Produtos'}</span>
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function FullScreenKitWizardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    }>
      <KitWizardContent />
    </Suspense>
  );
}
