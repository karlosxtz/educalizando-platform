'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, CheckCircle2, ChevronRight, FileText, Video, BookOpen, 
  Layers, HelpCircle, UploadCloud, Eye, Tags, GraduationCap, DollarSign, 
  Sparkles, ShieldCheck, Loader2, AlertCircle, Save, Link as LinkIcon
} from 'lucide-react';

import { getCurrentCreatorStore, createProduct, updateProduct, getProductById } from '@/lib/store-service';
import { getCategories, getEducationLevels } from '@/lib/category-service';
import { ProductType, Category, EducationLevel, Store, Product } from '@/lib/types';
import FileUpload from '@/components/dashboard/FileUpload';
import FileUploadMultiple from '@/components/dashboard/FileUploadMultiple';
import CustomSelect, { CustomSelectOption } from '@/components/ui/CustomSelect';

function ProductWizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [store, setStore] = useState<Store | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [educationLevels, setEducationLevels] = useState<EducationLevel[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Wizard Step Control (1, 2, 3, 4)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form Fields
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tipo, setTipo] = useState<ProductType>('pdf');
  const [preco, setPreco] = useState<string>('29,90');
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [deliveryMethod, setDeliveryMethod] = useState<'upload' | 'link'>('upload');
  const [arquivoUrl, setArquivoUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'publicado' | 'rascunho'>('publicado');
  const [categoryId, setCategoryId] = useState<string>('');
  const [educationLevelId, setEducationLevelId] = useState<string>('');
  const [isPlr, setIsPlr] = useState<boolean>(false);
  const [precoPlr, setPrecoPlr] = useState<string>('99,90');
  const [plrLicenseUrl, setPlrLicenseUrl] = useState<string | null>(null);

  const [allowAffiliates, setAllowAffiliates] = useState<boolean>(false);
  const [affiliateCommissionRate, setAffiliateCommissionRate] = useState<string>('50');

  useEffect(() => {
    async function initData() {
      try {
        const currentStore = await getCurrentCreatorStore();
        setStore(currentStore);

        const [cats, edLevels] = await Promise.all([
          getCategories(currentStore.id),
          getEducationLevels()
        ]);
        setCategories(cats);
        setEducationLevels(edLevels);

        if (editId) {
          const existing = await getProductById(editId);
          if (existing) {
            setTitulo(existing.titulo);
            setDescricao(existing.descricao || '');
            setTipo(existing.tipo);
            setPreco(existing.preco.toString().replace('.', ','));
            
            // Reconstruir galeria de imagens
            const urls = [];
            if (existing.capa_url) urls.push(existing.capa_url);
            if (existing.images && existing.images.length > 0) {
              existing.images.forEach(img => {
                if (img.url !== existing.capa_url) {
                  urls.push(img.url);
                }
              });
            }
            setGalleryUrls(urls);
            
            setArquivoUrl(existing.arquivo_url);
            if (existing.arquivo_url && (existing.arquivo_url.startsWith('http://') || existing.arquivo_url.startsWith('https://'))) {
              if (!existing.arquivo_url.includes('supabase.co')) {
                setDeliveryMethod('link');
              }
            }

            setStatus(existing.status === 'rascunho' ? 'rascunho' : 'publicado');
            setCategoryId(existing.category_id || '');
            setEducationLevelId(existing.education_level_id || '');
            setIsPlr(existing.is_plr || false);
            if (existing.preco_plr) setPrecoPlr(existing.preco_plr.toString().replace('.', ','));
            setPlrLicenseUrl(existing.plr_license_url || null);
            setAllowAffiliates(existing.allow_affiliates || false);
            if (existing.affiliate_commission_rate) setAffiliateCommissionRate(existing.affiliate_commission_rate.toString().replace('.', ','));
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

  const handleNextStep = () => {
    setErrorMsg(null);
    if (currentStep === 1) {
      if (!titulo.trim()) {
        setErrorMsg('Por favor, informe o título do produto didático.');
        return;
      }
      const numPrice = parseFloat(preco.replace(',', '.'));
      if (isNaN(numPrice) || numPrice < 0) {
        setErrorMsg('Informe um preço de venda válido.');
        return;
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

  const handleSaveProduct = async () => {
    if (!store) return;
    setSaving(true);
    setErrorMsg(null);

    const numericPrice = parseFloat(preco.replace(',', '.')) || 0;
    const numericPrecoPlr = parseFloat(precoPlr.replace(',', '.')) || 0;
    const numericCommissionRate = parseFloat(affiliateCommissionRate.replace(',', '.')) || 0;
    const computedCapaUrl = galleryUrls.length > 0 ? galleryUrls[0] : null;

    try {
      if (editId) {
        await updateProduct(editId, {
          titulo,
          descricao: descricao || null,
          tipo,
          preco: numericPrice,
          capa_url: computedCapaUrl,
          arquivo_url: arquivoUrl,
          status,
          category_id: categoryId || null,
          education_level_id: educationLevelId || null,
          gallery_urls: galleryUrls,
          is_plr: isPlr,
          preco_plr: numericPrecoPlr,
          plr_license_url: plrLicenseUrl,
          allow_affiliates: allowAffiliates,
          affiliate_commission_rate: numericCommissionRate
        });
      } else {
        await createProduct({
          store_id: store.id,
          titulo,
          descricao: descricao || null,
          tipo,
          preco: numericPrice,
          capa_url: computedCapaUrl,
          arquivo_url: arquivoUrl,
          status,
          category_id: categoryId || null,
          education_level_id: educationLevelId || null,
          gallery_urls: galleryUrls,
          is_plr: isPlr,
          preco_plr: numericPrecoPlr,
          plr_license_url: plrLicenseUrl,
          allow_affiliates: allowAffiliates,
          affiliate_commission_rate: numericCommissionRate
        });
      }

      router.push('/dashboard/produtos');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao salvar produto.');
      setSaving(false);
    }
  };

  const categoryOptions: CustomSelectOption[] = [
    { value: '', label: 'Selecione uma Categoria/Tema' },
    ...categories.map(c => ({ value: c.id, label: c.nome }))
  ];

  const educationOptions: CustomSelectOption[] = [
    { value: '', label: 'Selecione o Nível de Escolaridade' },
    ...educationLevels.map(e => ({ value: e.id, label: e.nome }))
  ];

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
            href="/dashboard/produtos"
            className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para Produtos</span>
          </Link>

          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h1 className="text-sm font-black text-slate-900">
              {editId ? 'Editar Produto Didático' : 'Wizard de Cadastro de Produto'}
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
          {/* Connector Line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 z-0" />

          {[
            { step: 1, title: 'Informações Básicas' },
            { step: 2, title: 'Capa do Produto' },
            { step: 3, title: 'Arquivo Digital' },
            { step: 4, title: 'Revisão & Publicação' }
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
          {/* STEP 1: Basic Information & Categorization */}
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  1. Informações Básicas do Produto
                </h2>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Defina o título, a descrição formatada, o tipo de arquivo e os filtros pedagógicos.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                    Título do Material Didático *
                  </label>
                  <input
                    type="text"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Ex: Apostila Ilustrada de História do Brasil - ENEM & Concursos"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm font-medium focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                    Descrição Detalhada & O que o aluno vai receber
                  </label>
                  <textarea
                    rows={4}
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Descreva o conteúdo do material, número de páginas, temas abordados e benefícios..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm font-medium focus:outline-none"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                      Preço de Venda (R$) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                      <input
                        type="text"
                        value={preco}
                        onChange={(e) => setPreco(e.target.value)}
                        placeholder="29,90"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm font-black focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                      Tipo de Conteúdo
                    </label>
                    <select
                      value={tipo}
                      onChange={(e) => setTipo(e.target.value as ProductType)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none"
                    >
                      <option value="pdf">Apostila / Documento PDF</option>
                      <option value="ebook">E-book Esquematizado</option>
                      <option value="video">Videoaula Interativa</option>
                      <option value="curso">Curso / Pacote de Módulos</option>
                      <option value="simulado">Simulado & Gabarito Comentado</option>
                    </select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                      Categoria / Tema
                    </label>
                    <CustomSelect
                      options={categoryOptions}
                      value={categoryId}
                      onChange={(val) => setCategoryId(val)}
                      icon={<Tags className="w-4 h-4" />}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                      Nível de Escolaridade
                    </label>
                    <CustomSelect
                      options={educationOptions}
                      value={educationLevelId}
                      onChange={(val) => setEducationLevelId(val)}
                      icon={<GraduationCap className="w-4 h-4" />}
                    />
                  </div>
                </div>

                {/* PLR Toggle */}
                <div className="pt-2">
                  <div 
                    onClick={() => setIsPlr(!isPlr)}
                    className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${isPlr ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}
                  >
                    <div className={`mt-0.5 w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center border transition-colors ${isPlr ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`}>
                      {isPlr && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${isPlr ? 'text-blue-900' : 'text-slate-700'}`}>Ativar Licença PLR para Revenda</span>
                        <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">Novo</span>
                      </div>
                      <p className={`text-[11px] mt-1 font-medium leading-relaxed ${isPlr ? 'text-blue-700' : 'text-slate-500'}`}>
                        Ao marcar esta opção, o seu produto aparecerá no **Mercado de PLRs** interno da Educalizando. 
                        Outros criadores poderão comprar este produto para revender nas próprias lojas deles, garantindo uma nova fonte de renda extra para você.
                      </p>
                    </div>
                  </div>
                  
                  {isPlr && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 p-4 bg-blue-50/50 border border-blue-100 rounded-xl flex flex-col gap-6"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">Preço da Licença de Revenda (PLR)</h4>
                          <p className="text-xs text-slate-500 mt-1">Este é o valor que outros criadores pagarão para poder revender seu produto.</p>
                        </div>
                        <div className="relative w-full sm:w-48 flex-shrink-0">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                          <input
                            type="text"
                            value={precoPlr}
                            onChange={(e) => setPrecoPlr(e.target.value)}
                            placeholder="99,90"
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-blue-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm font-black focus:outline-none shadow-sm"
                          />
                        </div>
                      </div>

                      <div className="pt-4 border-t border-blue-100/50">
                        <div className="mb-3">
                          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-blue-600" />
                            Arquivo da Licença de Revenda (PDF)
                          </h4>
                          <p className="text-xs text-slate-500 mt-1">
                            Para garantir a segurança dos compradores, faça o upload do certificado que autoriza a revenda deste produto. Os compradores farão o download automático dele após a compra.
                          </p>
                        </div>
                        <FileUpload
                          bucket="product-files"
                          accept=".pdf,.png,.jpg,.jpeg"
                          maxSizeMB={5}
                          value={plrLicenseUrl}
                          onChange={(url: string | null) => setPlrLicenseUrl(url)}
                          label="Licença de Revenda do Produto"
                          helperText="Formatos suportados: PDF ou Imagem. Tamanho máximo: 5MB."
                        />
                      </div>
                    </motion.div>
                  )}
                </div>
                
                {/* PROGRAMA DE AFILIADOS */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="pt-0.5 relative flex-shrink-0">
                      <div className="w-12 h-6 bg-slate-200 rounded-full cursor-pointer relative overflow-hidden" onClick={() => setAllowAffiliates(!allowAffiliates)}>
                        <div className={`absolute inset-0 bg-blue-600 transition-transform duration-300 ${allowAffiliates ? 'translate-x-0' : '-translate-x-full'}`} />
                        <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${allowAffiliates ? 'translate-x-6' : 'translate-x-0'}`} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${allowAffiliates ? 'text-blue-900' : 'text-slate-700'}`}>Habilitar Programa de Afiliados</span>
                        <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">Novo</span>
                      </div>
                      <p className={`text-[11px] mt-1 font-medium leading-relaxed ${allowAffiliates ? 'text-blue-700' : 'text-slate-500'}`}>
                        Ao marcar esta opção, seu produto vai para o **Mercado de Afiliação**.
                        Outros usuários poderão se afiliar e vender o seu produto em troca de uma comissão automática.
                      </p>
                    </div>
                  </div>
                  
                  {allowAffiliates && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 p-4 bg-blue-50/50 border border-blue-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">Comissão do Afiliado (%)</h4>
                        <p className="text-xs text-slate-500 mt-1">Defina qual porcentagem do valor da venda o afiliado irá receber.</p>
                      </div>
                      <div className="relative w-full sm:w-48 flex-shrink-0">
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                        <input
                          type="text"
                          value={affiliateCommissionRate}
                          onChange={(e) => setAffiliateCommissionRate(e.target.value)}
                          placeholder="50"
                          className="w-full pr-10 pl-4 py-2.5 bg-white border border-blue-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm font-black focus:outline-none shadow-sm"
                        />
                      </div>
                    </motion.div>
                  )}
                </div>

              </div>
            </motion.div>
          )}

          {/* STEP 2: Product Cover Upload */}
          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-blue-600" />
                  2. Imagem de Capa do Produto
                </h2>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Envie uma imagem atraente na proporção 3:4 (mínimo 600x800px).
                </p>
              </div>

              <FileUploadMultiple
                bucket="product-covers"
                accept="image/*"
                maxSizeMB={3}
                value={galleryUrls}
                onChange={setGalleryUrls}
                label="Capa e Galeria do Produto"
                helperText="Selecione ou arraste arquivos PNG, JPG ou WEBP (máx 3MB/cada)."
                maxItems={10}
              />
            </motion.div>
          )}

          {/* STEP 3: Digital File Upload */}
          {currentStep === 3 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  3. Arquivo Didático Digital
                </h2>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Como você deseja entregar o material para o aluno após a compra?
                </p>
              </div>

              <div className="flex bg-slate-100 p-1 rounded-xl w-full">
                <button
                  type="button"
                  onClick={() => {
                    setDeliveryMethod('upload');
                    if (arquivoUrl && !arquivoUrl.includes('supabase.co')) setArquivoUrl(null);
                  }}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                    deliveryMethod === 'upload' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <UploadCloud className="w-4 h-4" /> Upload Seguro
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryMethod('link')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                    deliveryMethod === 'link' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <LinkIcon className="w-4 h-4" /> Link Externo
                  </span>
                </button>
              </div>

              {deliveryMethod === 'upload' ? (
                <FileUpload
                  bucket="product-files"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.zip,.rar"
                  maxSizeMB={15}
                  value={arquivoUrl}
                  onChange={(url: string | null) => setArquivoUrl(url)}
                  label="Upload do Arquivo Didático Digital"
                  helperText="Formatos suportados: PDF, DOCX, XLSX, ZIP, etc. (máx. 15MB). Vídeos não são permitidos via upload."
                />
              ) : (
                <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl space-y-3">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-blue-600" />
                    Link do Arquivo Externo
                  </h4>
                  <p className="text-xs text-slate-500">
                    Insira o link para a pasta no Google Drive, OneDrive, Dropbox, Mega, etc. 
                    Certifique-se de que o link esteja com as permissões de acesso "Público" ou "Qualquer pessoa com o link".
                  </p>
                  <input
                    type="url"
                    value={arquivoUrl || ''}
                    onChange={(e) => setArquivoUrl(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full px-4 py-2.5 bg-white border border-blue-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm font-medium focus:outline-none shadow-sm"
                  />
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 4: Review & Publish */}
          {currentStep === 4 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  4. Revisão & Publicação
                </h2>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Confira o visual do seu produto antes de salvar na plataforma.
                </p>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-6">
                <div className="w-36 h-48 rounded-xl bg-slate-200 overflow-hidden flex-shrink-0 relative shadow-md">
                  {galleryUrls.length > 0 ? (
                    <img src={galleryUrls[0]} alt={titulo} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-semibold p-2 text-center">
                      Sem Capa
                    </div>
                  )}
                </div>

                <div className="space-y-3 flex-1">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                      {tipo}
                    </span>
                    <h3 className="text-lg font-black text-slate-900 mt-2">{titulo || 'Título não preenchido'}</h3>
                    <p className="text-xs text-slate-500 line-clamp-3 mt-1">{descricao || 'Sem descrição'}</p>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-200">
                    <span className="text-2xl font-black text-slate-900">R$ {preco}</span>
                    
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-slate-600">Status:</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as 'publicado' | 'rascunho')}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                      >
                        <option value="publicado">Publicado (Visível)</option>
                        <option value="rascunho">Rascunho (Privado)</option>
                      </select>
                    </div>
                  </div>
                </div>
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
                onClick={handleSaveProduct}
                disabled={saving}
                className="px-7 py-3 rounded-xl font-extrabold text-xs bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg flex items-center gap-2 transition-all"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{saving ? 'Salvando...' : editId ? 'Atualizar Produto' : 'Publicar Produto Didático'}</span>
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function FullScreenProductWizardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    }>
      <ProductWizardContent />
    </Suspense>
  );
}
