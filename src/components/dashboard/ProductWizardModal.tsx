'use client';

import CustomSelect from '@/components/ui/CustomSelect';
import { createCustomCategory,getCategories,getEducationLevels } from '@/lib/category-service';
import { Category,EducationLevel,Product,ProductType } from '@/lib/types';
import { motion } from 'framer-motion';
import {
AlertTriangle,
CheckCircle2,
ChevronLeft,
ChevronRight,
DollarSign,
GraduationCap,
Loader2,Plus,
Sparkles,
Tags
} from 'lucide-react';
import { useEffect,useState } from 'react';
import { toast } from 'sonner';
import FileUpload from './FileUpload';
import ProductWizardDialogs from './ProductWizardDialogs';
import ProductWizardHeader from './ProductWizardHeader';

interface ProductWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId?: string;
  editingProduct?: Product | null;
  isBrindeMode?: boolean;
  onSave: (productData: {
    titulo: string;
    descricao: string | null;
    tipo: ProductType;
    preco: number;
    capa_url: string | null;
    arquivo_url: string | null;
    status: 'publicado' | 'rascunho';
    category_id: string | null;
    education_level_id: string | null;
    is_free?: boolean;
    faixa_etaria?: string;
    bncc_references?: string;
    paginas?: number;
  }) => Promise<void>;
}

export default function ProductWizardModal({
  isOpen,
  onClose,
  storeId,
  editingProduct,
  isBrindeMode,
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
  const [preco, setPreco] = useState<number>(editingProduct?.preco || (isBrindeMode ? 0 : 49.90));
  const [status, setStatus] = useState<'publicado' | 'rascunho'>(editingProduct?.status === 'rascunho' ? 'rascunho' : 'publicado');
  const [categoryId, setCategoryId] = useState<string | null>(editingProduct?.category_id || null);
  const [educationLevelId, setEducationLevelId] = useState<string | null>(editingProduct?.education_level_id || null);
  const [faixaEtaria, setFaixaEtaria] = useState('');
  const [bnccReferences, setBnccReferences] = useState('');
  const [paginas, setPaginas] = useState('');

  // Category & Education Level Database Options
  const [categories, setCategories] = useState<Category[]>([]);
  const [educationLevels, setEducationLevels] = useState<EducationLevel[]>([]);

  // Create Inline Category Modal State
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);

  // UI Errors & Loading State
  const [stepError, setStepError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadOptions();
    }
  }, [isOpen, storeId]);

  const loadOptions = async () => {
    const cats = await getCategories(storeId);
    const edLevels = await getEducationLevels();
    setCategories(cats);
    setEducationLevels(edLevels);

    if (!categoryId && cats.length > 0) setCategoryId(cats[0].id);
    if (!educationLevelId && edLevels.length > 0) setEducationLevelId(edLevels[0].id);
  };

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

  const handleCreateNewCategory = async () => {
    if (!newCategoryName.trim()) return;
    setIsCategoryLoading(true);
    try {
      const created = await createCustomCategory(storeId || '', newCategoryName.trim());
      setCategories(prev => [...prev, created]);
      setCategoryId(created.id);
      setIsCreatingCategory(false);
      setNewCategoryName('');
    } catch (err: any) {
      setStepError(err.message || 'Erro ao criar categoria.');
    } finally {
      setIsCategoryLoading(false);
    }
  };

  const handleOptimizeSEO = async () => {
    if (!titulo || titulo.length < 3) {
      toast.error('Digite pelo menos 3 caracteres no título para que a IA possa otimizá-lo.');
      return;
    }

    const loadingToast = toast.loading('A IA está otimizando seu SEO...');
    try {
      const res = await fetch('/api/ai/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo,
          descricao,
          storeId
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao otimizar com IA.');

      setTitulo(data.titulo || titulo);
      setDescricao(data.descricao || descricao);
      toast.success('SEO otimizado com sucesso!', { id: loadingToast });
    } catch (err: any) {
      toast.error(err.message, { id: loadingToast });
    }
  };

  // Step Validations
  const handleNextStep = () => {
    setStepError(null);

    if (currentStep === 1) {
      if (!titulo.trim() || titulo.trim().length < 4) {
        setStepError('Por favor, informe um título claro para o material (mínimo 4 caracteres).');
        return;
      }
      if (!categoryId) {
        setStepError('Por favor, selecione uma Categoria / Tema para o material.');
        return;
      }
      if (!educationLevelId) {
        setStepError('Por favor, selecione o Nível de Escolaridade.');
        return;
      }
    }

    if (currentStep === 3) {
      if (tipo === 'video' || tipo === 'curso') {
        if (!videoLink.trim() && !arquivoUrl) {
          setStepError('Informe o link do vídeo (YouTube/Vimeo) ou faça upload do arquivo.');
          return;
        }
      } else {
        if (!arquivoUrl) {
          setStepError('Por favor, faça upload do arquivo PDF ou digital do seu produto.');
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
        preco: isBrindeMode ? 0 : (Number(preco) || 0),
        capa_url: capaUrl,
        arquivo_url: finalFileUrl,
        status,
        category_id: categoryId,
        education_level_id: educationLevelId,
        is_free: isBrindeMode || false
        , faixa_etaria: faixaEtaria || undefined
        , bncc_references: bnccReferences || undefined
        , paginas: paginas ? Number(paginas) : undefined
      });
      onClose();
    } catch (err: any) {
      setStepError(err.message || 'Erro ao cadastrar produto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const globalCats = categories.filter(c => c.store_id === null);
  const customCats = categories.filter(c => c.store_id !== null);

  const selectedCategoryObj = categories.find(c => c.id === categoryId);
  const selectedEducationObj = educationLevels.find(e => e.id === educationLevelId);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      
      {/* Main Wizard Dialog Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="bg-white rounded-3xl border border-slate-200 w-full max-w-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[92vh]"
      >
        
        <ProductWizardHeader currentStep={currentStep} editing={Boolean(editingProduct)} onClose={handleRequestClose} />

        {/* Step Body Content */}
        <div className="p-6 sm:p-8 flex-1 overflow-y-auto space-y-6">
          
          {stepError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs flex items-center gap-3 font-semibold">
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <span>{stepError}</span>
            </div>
          )}

          {/* PASSO 1: Informações & Categorização */}
          {currentStep === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Título do Material Didático *
                  </label>
                  <button 
                    type="button" 
                    onClick={handleOptimizeSEO} 
                    className="text-sm font-bold text-blue-600 flex items-center gap-1 hover:text-blue-800 transition-colors"
                  >
                    <Sparkles className="w-4 h-4"/> Otimizar com IA
                  </button>
                </div>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Apostila Completa de Matemática Básica para o ENEM"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm focus:outline-none transition-all"
                />
                <p className="text-[11px] text-slate-500 font-medium">
                  💡 <strong>Dica:</strong> Use um nome claro e direto que os alunos vão procurar (ex: 'Apostila de Matemática Básica ENEM').
                </p>
              </div>

              {/* Categorização Grid */}
              <div className="grid sm:grid-cols-2 gap-4">
                
                {/* Category Select */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block flex items-center gap-1.5">
                      <Tags className="w-3.5 h-3.5 text-blue-600" /> Categoria / Tema *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCreatingCategory(true)}
                      className="text-[11px] text-blue-600 font-bold hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> + Criar nova
                    </button>
                  </div>
                  
                  <CustomSelect
                    options={[
                      ...globalCats.map(cat => ({ value: cat.id, label: cat.nome, group: 'Categorias Globais' })),
                      ...customCats.map(cat => ({ value: cat.id, label: cat.nome, group: 'Minhas Categorias Customizadas' })),
                      { value: 'create_new', label: '+ Criar nova categoria...' }
                    ]}
                    value={categoryId || ''}
                    onChange={(val) => {
                      if (val === 'create_new') {
                        setIsCreatingCategory(true);
                      } else {
                        setCategoryId(val);
                      }
                    }}
                    placeholder="Selecione uma categoria..."
                    size="lg"
                  />
                  <p className="text-[11px] text-slate-500 font-medium">
                    💡 Agrupa seus materiais no filtro por assunto.
                  </p>
                </div>

                {/* Education Level Select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-600" /> Nível de Escolaridade *
                  </label>
                  <CustomSelect
                    options={educationLevels.map(ed => ({ value: ed.id, label: ed.nome }))}
                    value={educationLevelId || ''}
                    onChange={(val) => setEducationLevelId(val)}
                    placeholder="Selecione a escolaridade..."
                    size="lg"
                  />
                  <p className="text-[11px] text-slate-500 font-medium">
                    💡 Permite que o aluno filtre por etapa de ensino.
                  </p>
                </div>

              </div>

              <div className="grid sm:grid-cols-3 gap-4 mt-4">
                <input value={faixaEtaria} onChange={(e) => setFaixaEtaria(e.target.value)} placeholder="Faixa etária (ex.: 6 a 8 anos)" className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900" />
                <input value={paginas} onChange={(e) => setPaginas(e.target.value)} type="number" min="1" placeholder="Nº de páginas" className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900" />
                <input value={bnccReferences} onChange={(e) => setBnccReferences(e.target.value)} placeholder="Habilidades BNCC (opcional)" className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900" />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Tipo de Conteúdo Didático *
                  </label>
                  <CustomSelect
                    options={[
                      { value: 'pdf', label: 'Apostila em PDF' },
                      { value: 'ebook', label: 'E-Book Interativo' },
                      { value: 'video', label: 'Videoaula (Link YouTube/Vimeo)' },
                      { value: 'curso', label: 'Curso Completo (Módulos)' },
                      { value: 'simulado', label: 'Simulado Gabaritado' }
                    ]}
                    value={tipo}
                    onChange={(val) => setTipo(val as ProductType)}
                    size="lg"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Descrição Detalhada
                  </label>
                  <input
                    type="text"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Resumo do que o aluno encontrará..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm focus:outline-none transition-all"
                  />
                </div>
              </div>

            </motion.div>
          )}

          {/* PASSO 2: Upload de Capa */}
          {currentStep === 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <FileUpload
                label="Upload da Imagem de Capa"
                helperText="Envie uma imagem chamativa do seu produto. Formatos: JPG, PNG ou WEBP (até 15MB)."
                recommendationText="Recomendado: proporção 3:4 (ex: 600x800px) para capas de apostilas e e-books"
                bucket="product-covers"
                accept="image/jpeg,image/png,image/webp"
                maxSizeMB={15}
                value={capaUrl}
                onChange={(url) => setCapaUrl(url)}
                isImage={true}
                aspectRatio="3:4"
              />
            </motion.div>
          )}

          {/* PASSO 3: Upload do Arquivo do Material */}
          {currentStep === 3 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {(tipo === 'video' || tipo === 'curso') ? (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Link Externo da Videoaula / Plataforma de Transmissão *
                  </label>
                  <input
                    type="url"
                    value={videoLink}
                    onChange={(e) => setVideoLink(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... ou Vimeo"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500 font-medium">
                    Insira o link externo (YouTube, Vimeo, Google Drive). A Educalizando não faz upload de arquivos de vídeo.
                  </p>
                </div>
              ) : (
                <FileUpload
                  label="Upload do Arquivo Didático Real (PDF / Material Digital)"
                  helperText="Arquivo entregue na Área de Membros após a compra (máx. 15MB)."
                  bucket="product-files"
                  accept="application/pdf,application/epub+zip,application/x-mobipocket-ebook,application/zip,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,text/plain"
                  maxSizeMB={15}
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
                {!isBrindeMode && (
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
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Status de Publicação *
                  </label>
                  <CustomSelect
                    options={[
                      { value: 'publicado', label: 'Publicado (Visível na loja)' },
                      { value: 'rascunho', label: 'Rascunho (Oculto da loja)' }
                    ]}
                    value={status}
                    onChange={(val) => setStatus(val as 'publicado' | 'rascunho')}
                    size="lg"
                  />
                </div>
              </div>

              {/* Revision Summary Card */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase text-blue-700">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Resumo Completo do Produto</span>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block font-bold">Título:</span>
                    <span className="font-bold text-slate-900">{titulo}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold">Categoria:</span>
                    <span className="font-bold text-blue-600">{selectedCategoryObj?.nome || 'Não definida'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold">Escolaridade:</span>
                    <span className="font-bold text-indigo-600">{selectedEducationObj?.nome || 'Não definido'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold">Investimento:</span>
                    <span className="font-black text-emerald-600 text-sm">{isBrindeMode ? 'Grátis' : `R$ ${preco.toFixed(2).replace('.', ',')}`}</span>
                  </div>
                </div>
              </div>

            </motion.div>
          )}

        </div>

        {/* Wizard Footer Controls */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-slate-200 bg-slate-50 sticky bottom-0 z-10 flex items-center justify-between gap-2 shadow-xs">
          <button
            type="button"
            onClick={handlePrevStep}
            disabled={currentStep === 1 || isSubmitting}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 flex items-center gap-1.5 transition-all min-h-[44px]"
          >
            <ChevronLeft className="w-4 h-4" /> <span>Voltar</span>
          </button>

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-5 sm:px-6 py-2.5 rounded-xl font-extrabold text-xs bg-brand-navy hover:bg-brand-navy-hover text-white shadow-md flex items-center gap-1.5 transition-all min-h-[44px]"
            >
              <span>Próximo Passo</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmitFinal}
              disabled={isSubmitting}
              className="px-5 sm:px-7 py-3 rounded-xl font-extrabold text-xs bg-brand-green hover:bg-brand-green-hover text-white shadow-md flex items-center gap-2 disabled:opacity-50 transition-all min-h-[44px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Cadastrando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Concluir e Cadastrar</span>
                </>
              )}
            </button>
          )}
        </div>

      </motion.div>

      <ProductWizardDialogs isCreatingCategory={isCreatingCategory} setIsCreatingCategory={setIsCreatingCategory} newCategoryName={newCategoryName} setNewCategoryName={setNewCategoryName} handleCreateNewCategory={handleCreateNewCategory} isCategoryLoading={isCategoryLoading} showCloseConfirmation={showCloseConfirmation} setShowCloseConfirmation={setShowCloseConfirmation} confirmCancel={confirmCancel} />

    </div>
  );
}
