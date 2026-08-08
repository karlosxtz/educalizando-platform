'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, CheckCircle2, ChevronRight, ChevronLeft, Package, 
  FileText, Video, BookOpen, Layers, HelpCircle, AlertTriangle, 
  DollarSign, Sparkles, Loader2, ShieldCheck 
} from 'lucide-react';
import FileUpload from './FileUpload';
import { Product, ProductType } from '@/lib/types';

interface ProductWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct?: Product | null;
  onSave: (productData: {
    titulo: string;
    descricao: string | null;
    tipo: ProductType;
    preco: number;
    capa_url: string | null;
    arquivo_url: string | null;
    status: 'publicado' | 'rascunho';
  }) => Promise<void>;
}

export default function ProductWizardModal({
  isOpen,
  onClose,
  editingProduct,
  onSave
}: ProductWizardModalProps) {
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [titulo, setTitulo] = useState(editingProduct?.titulo || '');
  const [tipo, setTipo] = useState<ProductType>(editingProduct?.tipo || 'pdf');
  const [descricao, setDescricao] = useState(editingProduct?.descricao || '');
  const [capaUrl, setCapaUrl] = useState<string | null>(editingProduct?.capa_url || null);
  const [arquivoUrl, setArquivoUrl] = useState<string | null>(editingProduct?.arquivo_url || null);
  const [videoLink, setVideoLink] = useState<string>(editingProduct?.arquivo_url || '');
  const [preco, setPreco] = useState<number>(editingProduct?.preco || 49.90);
  const [status, setStatus] = useState<'publicado' | 'rascunho'>(editingProduct?.status || 'publicado');

  // UI Errors & Loading State
  const [stepError, setStepError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Styled AlertDialog Close Confirmation State
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);

  if (!isOpen) return null;

  const hasUnsavedData = Boolean(titulo || descricao || capaUrl || arquivoUrl);

  const handleRequestClose = () => {
    if (hasUnsavedData) {
      setShowCloseConfirmation(true);
    } else {
      onClose();
    }
  };

  const confirmCancel = () => {
    setShowCloseConfirmation(false);
    onClose();
  };

  // Step Validations
  const handleNextStep = () => {
    setStepError(null);

    if (currentStep === 1) {
      if (!titulo.trim() || titulo.trim().length < 4) {
        setStepError('Por favor, informe um título claro para o material (mínimo 4 caracteres).');
        return;
      }
    }

    if (currentStep === 2) {
      // Cover is optional, but if provided is fine
    }

    if (currentStep === 3) {
      if (tipo === 'video' || tipo === 'curso') {
        if (!videoLink.trim() && !arquivoUrl) {
          setStepError('Informe o link do vídeo (YouTube/Vimeo) ou faça upload do arquivo do curso.');
          return;
        }
      } else {
        if (!arquivoUrl) {
          setStepError('Por favor, faça upload do arquivo PDF ou digital do seu produto didático.');
          return;
        }
      }
    }

    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const handlePrevStep = () => {
    setStepError(null);
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmitFinal = async () => {
    setStepError(null);
    setIsSubmitting(true);
    try {
      const finalFileUrl = (tipo === 'video' || tipo === 'curso') ? (videoLink || arquivoUrl) : arquivoUrl;
      await onSave({
        titulo,
        descricao: descricao || null,
        tipo,
        preco: Number(preco) || 0,
        capa_url: capaUrl,
        arquivo_url: finalFileUrl,
        status
      });
      onClose();
    } catch (err: any) {
      setStepError(err.message || 'Erro ao cadastrar o produto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTipoLabel = (t: ProductType) => {
    switch (t) {
      case 'pdf': return 'Apostila PDF';
      case 'ebook': return 'E-Book Interativo';
      case 'video': return 'Videoaula / Vídeo';
      case 'curso': return 'Curso Completo';
      case 'simulado': return 'Simulado Gabaritado';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      
      {/* Main Wizard Dialog Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="bg-white rounded-3xl border border-slate-200 w-full max-w-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[92vh]"
      >
        
        {/* Header Bar */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 leading-tight">
                {editingProduct ? 'Editar Produto Didático' : 'Wizard de Cadastro de Produto'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Passo {currentStep} de 4 — {
                  currentStep === 1 ? 'Informações Básicas' :
                  currentStep === 2 ? 'Capa do Material' :
                  currentStep === 3 ? 'Arquivo Entregável' : 'Preço e Publicação'
                }
              </p>
            </div>
          </div>

          <button
            onClick={handleRequestClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar Indicator */}
        <div className="bg-slate-100 px-6 py-3 border-b border-slate-200">
          <div className="flex items-center justify-between gap-2 max-w-xl mx-auto">
            {[
              { num: 1, label: 'Básico' },
              { num: 2, label: 'Capa' },
              { num: 3, label: 'Arquivo' },
              { num: 4, label: 'Revisão' }
            ].map((step, idx) => {
              const isCompleted = currentStep > step.num;
              const isCurrent = currentStep === step.num;

              return (
                <div key={step.num} className="flex items-center gap-2 flex-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                      isCompleted ? 'bg-emerald-600 text-white' :
                      isCurrent ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
                      'bg-slate-200 text-slate-500'
                    }`}>
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step.num}
                    </div>
                    <span className={`text-xs font-bold hidden sm:inline ${
                      isCurrent ? 'text-blue-600' : 'text-slate-500'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                  {idx < 3 && (
                    <div className={`flex-1 h-1 rounded-full ${
                      currentStep > step.num ? 'bg-emerald-500' : 'bg-slate-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Body Content */}
        <div className="p-6 sm:p-8 flex-1 overflow-y-auto space-y-6">
          
          {stepError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs flex items-center gap-3 font-semibold">
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <span>{stepError}</span>
            </div>
          )}

          {/* PASSO 1: Informações Básicas */}
          {currentStep === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Título do Material Didático *
                </label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Apostila Completa de Matemática Básica para o ENEM"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm focus:outline-none transition-all"
                />
                <p className="text-[11px] text-slate-500 font-medium">
                  💡 <strong>Dica:</strong> Use um nome claro e direto que os alunos procuram nas pesquisas (ex: "Combo 50 Simulado Gabaritado de Medicina").
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Tipo de Conteúdo Didático *
                </label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as ProductType)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm focus:outline-none font-medium"
                >
                  <option value="pdf">Apostila em PDF</option>
                  <option value="ebook">E-Book Interativo</option>
                  <option value="video">Videoaula (Link YouTube/Vimeo)</option>
                  <option value="curso">Curso Completo (Módulos)</option>
                  <option value="simulado">Simulado Gabaritado</option>
                </select>
                <p className="text-[11px] text-slate-500 font-medium">
                  💡 Define a etiqueta de exibição e o tipo de entregável na vitrine da sua loja.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Descrição Detalhada do Conteúdo
                </label>
                <textarea
                  rows={4}
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descreva o que o aluno vai encontrar no material (quantidade de páginas, matérias cobertas, gabarito)..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm focus:outline-none transition-all"
                />
                <p className="text-[11px] text-slate-500 font-medium">
                  💡 Descreva os benefícios do conteúdo para aumentar as conversões no checkout PIX.
                </p>
              </div>

            </motion.div>
          )}

          {/* PASSO 2: Upload de Capa */}
          {currentStep === 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <FileUpload
                label="Upload da Imagem de Capa"
                helperText="Envie uma imagem chamativa em alta qualidade. Formatos suportados: JPG, PNG ou WEBP."
                bucket="product-covers"
                accept="image/jpeg,image/png,image/webp"
                maxSizeMB={5}
                value={capaUrl}
                onChange={(url) => setCapaUrl(url)}
                isImage={true}
              />
            </motion.div>
          )}

          {/* PASSO 3: Upload do Arquivo do Material */}
          {currentStep === 3 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {(tipo === 'video' || tipo === 'curso') ? (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Link da Videoaula / Plataforma de Transmissão *
                  </label>
                  <input
                    type="url"
                    value={videoLink}
                    onChange={(e) => setVideoLink(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... ou Vimeo"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500 font-medium">
                    💡 Informe o link do vídeo não-listado ou restrito que será disponibilizado na Área de Membros do aluno.
                  </p>
                </div>
              ) : (
                <FileUpload
                  label="Upload do Arquivo Didático Real (PDF / Material Digital)"
                  helperText="Este é o arquivo seguro que o aluno poderá baixar após o pagamento via PIX. Máximo 100MB."
                  bucket="product-files"
                  accept="application/pdf,application/epub+zip,application/x-mobipocket-ebook,application/zip"
                  maxSizeMB={100}
                  value={arquivoUrl}
                  onChange={(url) => setArquivoUrl(url)}
                  isImage={false}
                />
              )}
            </motion.div>
          )}

          {/* PASSO 4: Preço, Status e Revisão Resumida */}
          {currentStep === 4 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Preço de Venda (R$) *
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      step="0.01"
                      value={preco}
                      onChange={(e) => setPreco(parseFloat(e.target.value) || 0)}
                      placeholder="49.90"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm font-bold focus:outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    💡 Preço cobrado no checkout PIX instantâneo.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Status de Publicação *
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'publicado' | 'rascunho')}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm focus:outline-none font-medium"
                  >
                    <option value="publicado">Publicado (Visível na loja agora)</option>
                    <option value="rascunho">Rascunho (Oculto da loja)</option>
                  </select>
                </div>
              </div>

              {/* Revision Summary Card */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase text-blue-700">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Resumo do Produto a ser Cadastrado</span>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block font-bold">Título:</span>
                    <span className="font-bold text-slate-900">{titulo}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold">Tipo:</span>
                    <span className="font-bold text-slate-900">{getTipoLabel(tipo)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold">Investimento:</span>
                    <span className="font-black text-emerald-600 text-sm">R$ {preco.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold">Capa e Arquivo:</span>
                    <span className="font-bold text-slate-900">
                      {capaUrl ? '✅ Capa anexada' : '⚠️ Sem capa'} | {arquivoUrl || videoLink ? '✅ Conteúdo pronto' : '⚠️ Sem arquivo'}
                    </span>
                  </div>
                </div>
              </div>

            </motion.div>
          )}

        </div>

        {/* Wizard Footer Controls */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrevStep}
            disabled={currentStep === 1 || isSubmitting}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 flex items-center gap-1.5 transition-all"
          >
            <ChevronLeft className="w-4 h-4" /> Voltar
          </button>

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-6 py-2.5 rounded-xl font-extrabold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md flex items-center gap-1.5 transition-all"
            >
              <span>Próximo Passo</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmitFinal}
              disabled={isSubmitting}
              className="px-7 py-3 rounded-xl font-extrabold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex items-center gap-2 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Cadastrando no Supabase...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Concluir e Cadastrar Produto</span>
                </>
              )}
            </button>
          )}
        </div>

      </motion.div>

      {/* Close Confirmation AlertDialog */}
      <AnimatePresence>
        {showCloseConfirmation && (
          <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 shadow-2xl text-center"
            >
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Cancelar o cadastro do produto?</h3>
              <p className="text-xs text-slate-500">
                Os dados preenchidos até agora neste produto não serão salvos.
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCloseConfirmation(false)}
                  className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  Continuar Editando
                </button>
                <button
                  type="button"
                  onClick={confirmCancel}
                  className="w-full py-2.5 rounded-xl font-bold text-xs bg-rose-600 text-white hover:bg-rose-700 shadow-sm"
                >
                  Sim, Descartar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
