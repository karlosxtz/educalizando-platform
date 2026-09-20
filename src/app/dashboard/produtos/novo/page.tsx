'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, CheckCircle2, ChevronRight, FileText, Video, BookOpen, 
  Layers, HelpCircle, UploadCloud, Eye, Tags, GraduationCap, DollarSign, 
  Sparkles, ShieldCheck, Loader2, AlertCircle, Save, Link as LinkIcon, User, Search, X
} from 'lucide-react';

import { getCurrentCreatorStore, createProduct, updateProduct, getProductById } from '@/lib/store-service';
import { supabase } from '@/lib/supabase';
import { getCategories, getEducationLevels, getBnccSkills } from '@/lib/category-service';
import { ProductType, Category, EducationLevel, Store, Product, BnccSkill } from '@/lib/types';
import FileUpload from '@/components/dashboard/FileUpload';
import FileUploadMultiple from '@/components/dashboard/FileUploadMultiple';
import CustomSelect, { CustomSelectOption } from '@/components/ui/CustomSelect';
import { getPublicProductsByStoreId } from '@/lib/store-service';
import { toast } from 'sonner';
import { SCHOOL_CALENDAR_TAGS } from '@/lib/school-calendar';
import { isUploadedMaterial, normalizeDeliveryLink } from '@/lib/delivery-link';

function ProductWizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const plrProductId = searchParams.get('licenca-plr');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [store, setStore] = useState<Store | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [educationLevels, setEducationLevels] = useState<EducationLevel[]>([]);
  const [bnccSkillsMaster, setBnccSkillsMaster] = useState<BnccSkill[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Wizard Step Control (1, 2, 3, 4)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form Fields
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tipo, setTipo] = useState<ProductType>('pdf');
  const [pageCount, setPageCount] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [formatDetails, setFormatDetails] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [instagramVideoUrl, setInstagramVideoUrl] = useState('');
  const [preco, setPreco] = useState<string>('');
  const [precoOriginal, setPrecoOriginal] = useState<string>('');
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [deliveryMethod, setDeliveryMethod] = useState<'upload' | 'link'>('link');
  const [arquivoUrl, setArquivoUrl] = useState<string | null>(null);
  const [arquivoNome, setArquivoNome] = useState('');
  const [driveLinkDraft, setDriveLinkDraft] = useState('');
  const [status, setStatus] = useState<'publicado' | 'rascunho'>('publicado');
  const [categoryId, setCategoryId] = useState<string>('');
  const [educationLevelId, setEducationLevelId] = useState<string>('');
  const [seasonalTags, setSeasonalTags] = useState<string[]>([]);
  const [isSeasonalPickerOpen, setIsSeasonalPickerOpen] = useState(false);
  const [seasonalTagSearch, setSeasonalTagSearch] = useState('');
  const [selectedBnccSkills, setSelectedBnccSkills] = useState<string[]>([]);
  const [usesBncc, setUsesBncc] = useState(false);
  const [bnccSearch, setBnccSearch] = useState('');
  const [bnccStage, setBnccStage] = useState<'all' | 'EI' | 'EF' | 'EM'>('all');
  const [bnccSubject, setBnccSubject] = useState('all');
  const [isFree, setIsFree] = useState<boolean>(false);
  const [isPlr, setIsPlr] = useState<boolean>(false);
  const [precoPlr, setPrecoPlr] = useState<string>('99,90');
  const [plrLicenseUrl, setPlrLicenseUrl] = useState<string | null>(null);
  const [plrDeliveryMethod, setPlrDeliveryMethod] = useState<'upload' | 'link'>('upload');
  const [plrSourceTitle, setPlrSourceTitle] = useState<string | null>(null);

  const [allowAffiliates, setAllowAffiliates] = useState<boolean>(false);
  const [affiliateCommissionRate, setAffiliateCommissionRate] = useState<string>('50');

  // Order Bump
  const [orderBumpId, setOrderBumpId] = useState<string>('');
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function initData() {
      try {
        const currentStore = await getCurrentCreatorStore();
        setStore(currentStore);

        // Alerta imediato: o usuário não tem loja configurada
        const isValidUUID = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
        if (!currentStore.id || !isValidUUID(currentStore.id)) {
          setErrorMsg(
            '⚠️ Você ainda não configurou sua loja. ' +
            'Acesse "Configurações da Loja" no menu lateral, preencha o nome e slug, e salve. ' +
            'Após salvar, volte aqui para cadastrar seus produtos.'
          );
        }

        const [cats, edLevels, storeProducts, bnccList] = await Promise.all([
          getCategories(currentStore.id),
          getEducationLevels(),
          getPublicProductsByStoreId(currentStore.id),
          getBnccSkills()
        ]);
        setCategories(cats);
        setEducationLevels(edLevels);
        setAvailableProducts(storeProducts);
        setBnccSkillsMaster(bnccList);

        if (editId) {
          const existing = await getProductById(editId);
          if (existing) {
            setTitulo(existing.titulo);
            setDescricao(existing.descricao || '');
            setTipo(existing.tipo);
            setPageCount(existing.page_count ? String(existing.page_count) : '');
            setAgeRange(existing.age_range || '');
            setFormatDetails(existing.format_details || '');
            setPreviewUrl(existing.preview_url || '');
            setInstagramVideoUrl(existing.instagram_video_url || '');
            setPreco(existing.preco.toString().replace('.', ','));
            setPrecoOriginal(existing.preco_original ? existing.preco_original.toString().replace('.', ',') : '');
            
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
            setArquivoNome(existing.arquivo_nome || '');
            setDeliveryMethod(isUploadedMaterial(existing.arquivo_url) ? 'upload' : 'link');
            setDriveLinkDraft(existing.arquivo_url || '');
            if (existing.arquivo_url && (existing.arquivo_url.startsWith('http://') || existing.arquivo_url.startsWith('https://'))) {
              if (!existing.arquivo_url.includes('supabase.co')) {
                setDeliveryMethod('link');
              }
            }

            setStatus(existing.status === 'rascunho' ? 'rascunho' : 'publicado');
            setCategoryId(existing.category_id || '');
            setEducationLevelId(existing.education_level_id || '');
            setSeasonalTags(existing.seasonal_tags || []);
            setIsFree(existing.is_free || false);
            setIsPlr(existing.is_plr || false);
            if (existing.preco_plr) setPrecoPlr(existing.preco_plr.toString().replace('.', ','));
            
            setPlrLicenseUrl(existing.plr_license_url || null);
            setPlrDeliveryMethod(isUploadedMaterial(existing.plr_license_url) ? 'upload' : 'link');
            if (existing.plr_license_url && (existing.plr_license_url.startsWith('http://') || existing.plr_license_url.startsWith('https://'))) {
              if (!existing.plr_license_url.includes('supabase.co')) {
                setPlrDeliveryMethod('link');
              }
            }

            setAllowAffiliates(existing.allow_affiliates || false);
            setAffiliateCommissionRate(existing.affiliate_commission_rate ? existing.affiliate_commission_rate.toString() : '50');
            setOrderBumpId(existing.order_bump_id || '');
            
            if (existing.bncc_skill_ids && Array.isArray(existing.bncc_skill_ids)) {
              setSelectedBnccSkills(existing.bncc_skill_ids);
              setUsesBncc(existing.bncc_skill_ids.length > 0);
            }
          }
        } else if (plrProductId) {
          const { data: sessionData } = await supabase.auth.getSession();
          const token = sessionData.session?.access_token;
          const response = await fetch(`/api/plr/purchases/${encodeURIComponent(plrProductId)}/publish-data`, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined
          });
          const plrData = await response.json().catch(() => null);
          if (!response.ok) {
            toast.warning(plrData?.error || 'Não foi possível carregar os dados da licença PLR.');
          } else if (plrData?.data) {
            const source = plrData.data;
            setPlrSourceTitle(plrData.sourceTitle || 'Material PLR');
            setTitulo(source.title || '');
            setDescricao(source.description || '');
            setGalleryUrls(Array.isArray(source.galleryUrls) && source.galleryUrls.length > 0
              ? source.galleryUrls
              : source.coverUrl ? [source.coverUrl] : []);
            setPreviewUrl(source.previewUrl || '');
            setInstagramVideoUrl(source.instagramVideoUrl || '');
            setSeasonalTags(Array.isArray(source.seasonalTags) ? source.seasonalTags : []);
            setTipo(source.tipo || 'pdf');
            setCategoryId(source.categoryId || '');
            setEducationLevelId(source.educationLevelId || '');
            setPageCount(source.pageCount ? String(source.pageCount) : '');
            setAgeRange(source.ageRange || '');
            setFormatDetails(source.formatDetails || '');
            setSelectedBnccSkills(Array.isArray(source.bnccSkillIds) ? source.bnccSkillIds : []);
            setUsesBncc(Array.isArray(source.bnccSkillIds) && source.bnccSkillIds.length > 0);
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

  const bnccSubjects = useMemo(() => Array.from(new Set(
    bnccSkillsMaster.map(skill => skill.subject).filter((subject): subject is string => Boolean(subject))
  )).sort((a, b) => a.localeCompare(b, 'pt-BR')), [bnccSkillsMaster]);

  const filteredBnccSkills = useMemo(() => {
    const term = bnccSearch.trim().toLocaleLowerCase('pt-BR');
    const matches = bnccSkillsMaster.filter(skill => {
      const code = skill.code.toUpperCase();
      const stageMatches = bnccStage === 'all' || code.startsWith(bnccStage);
      const subjectMatches = bnccSubject === 'all' || skill.subject === bnccSubject;
      const searchMatches = !term || `${skill.code} ${skill.description} ${skill.grade_level || ''} ${skill.subject || ''}`
        .toLocaleLowerCase('pt-BR').includes(term);
      return stageMatches && subjectMatches && searchMatches;
    });

    const selected = bnccSkillsMaster.filter(skill => selectedBnccSkills.includes(skill.id));
    return Array.from(new Map([...selected, ...matches.slice(0, 150)].map(skill => [skill.id, skill])).values());
  }, [bnccSearch, bnccSkillsMaster, bnccStage, bnccSubject, selectedBnccSkills]);

  const handleOptimizeAll = async () => {
    if (!store?.id) {
      toast.error('Loja não configurada.');
      return;
    }
    if (!titulo || titulo.length < 10) {
      toast.error('Digite pelo menos 10 caracteres no título para que a IA possa gerar o material.');
      return;
    }

    const loadingToast = toast.loading('A IA está gerando o material mágico...');
    try {
      const res = await fetch('/api/ai/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo,
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
      
      toast.success(`Material gerado com sucesso!`, { id: loadingToast });
    } catch (err: any) {
      toast.error(err.message, { id: loadingToast });
    }
  };

  const handleNextStep = () => {
    setErrorMsg(null);
    if (currentStep === 1) {
      if (!titulo.trim()) {
        setErrorMsg('Por favor, informe o título do produto didático.');
        return;
      }
    }
    if (currentStep === 3) {
      if (!isFree) {
        const numPrice = parseFloat(preco.replace(',', '.'));
        if (isNaN(numPrice) || numPrice <= 0) {
          setErrorMsg('Informe um preço de venda maior que zero, ou marque como Material Gratuito.');
          return;
        }
        const numOriginalPrice = precoOriginal.trim() ? parseFloat(precoOriginal.replace(',', '.')) : null;
        if (numOriginalPrice !== null && (isNaN(numOriginalPrice) || numOriginalPrice <= numPrice)) {
          setErrorMsg('O preço original deve ser maior que o preço de venda para exibir uma oferta.');
          return;
        }
      }
      if (deliveryMethod === 'link') {
        try {
          setArquivoUrl(normalizeDeliveryLink(driveLinkDraft));
        } catch {
          setErrorMsg('Informe um link de entrega válido iniciado por https://.');
          return;
        }
      }
      if (deliveryMethod === 'upload' && !isUploadedMaterial(arquivoUrl)) {
        setErrorMsg('O Arquivo Didático Digital (Produto Final) é obrigatório. Faça o upload ou insira um link externo.');
        return;
      }
      if (isPlr) {
        const numPlrPrice = parseFloat(precoPlr.replace(',', '.'));
        if (isNaN(numPlrPrice) || numPlrPrice <= 0) {
          setErrorMsg('Informe um preço maior que zero para a Licença PLR.');
          return;
        }
        if (!plrLicenseUrl) {
          setErrorMsg('Envie o arquivo ou informe o link de entrega da Licença PLR.');
          return;
        }
        if (plrDeliveryMethod === 'link') {
          try { setPlrLicenseUrl(normalizeDeliveryLink(plrLicenseUrl)); }
          catch { setErrorMsg('Informe um link válido para a licença PLR.'); return; }
        }
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

    // Guarda de segurança: verificar se a loja possui um ID real no banco
    const isValidUUID = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
    if (!store.id || !isValidUUID(store.id)) {
      setErrorMsg(
        '⚠️ Sua loja ainda não foi configurada. Antes de cadastrar produtos, acesse ' +
        '"Configurações da Loja" (menu lateral) e salve os dados da sua loja. ' +
        'Isso é necessário para vincular os produtos corretamente.'
      );
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    const numericPrice = isFree ? 0 : (parseFloat(preco.replace(',', '.')) || 0);
    const numericOriginalPrice = !isFree && precoOriginal.trim() ? parseFloat(precoOriginal.replace(',', '.')) : null;
    const numericPrecoPlr = parseFloat(precoPlr.replace(',', '.')) || 0;
    const numericCommissionRate = parseFloat(affiliateCommissionRate.replace(',', '.')) || 0;
    const numericPageCount = pageCount.trim() ? Number(pageCount) : null;
    const computedCapaUrl = galleryUrls.length > 0 ? galleryUrls[0] : null;

    try {
      if (editId) {
        await updateProduct(editId, {
          titulo,
          descricao: descricao || null,
          tipo,
          page_count: numericPageCount,
          age_range: ageRange.trim() || null,
          format_details: formatDetails.trim() || null,
          preview_url: previewUrl.trim() || null,
          instagram_video_url: instagramVideoUrl.trim() || null,
          preco: numericPrice,
          preco_original: numericOriginalPrice,
          capa_url: computedCapaUrl,
          arquivo_url: arquivoUrl,
          arquivo_nome: arquivoNome.trim() || null,
          status,
          category_id: categoryId || null,
          education_level_id: educationLevelId || null,
          seasonal_tags: seasonalTags,
          bncc_skill_ids: selectedBnccSkills,
          gallery_urls: galleryUrls,
          is_free: isFree,
          is_plr: isPlr,
          preco_plr: numericPrecoPlr,
          plr_license_url: plrLicenseUrl,
          allow_affiliates: allowAffiliates,
          affiliate_commission_rate: numericCommissionRate,
          order_bump_id: orderBumpId || null
        });
      } else {
        await createProduct({
          store_id: store.id,
          titulo,
          descricao: descricao || null,
          tipo,
          page_count: numericPageCount,
          age_range: ageRange.trim() || null,
          format_details: formatDetails.trim() || null,
          preview_url: previewUrl.trim() || null,
          instagram_video_url: instagramVideoUrl.trim() || null,
          preco: numericPrice,
          preco_original: numericOriginalPrice,
          capa_url: computedCapaUrl,
          arquivo_url: arquivoUrl,
          arquivo_nome: arquivoNome.trim() || null,
          status,
          category_id: categoryId || null,
          education_level_id: educationLevelId || null,
          seasonal_tags: seasonalTags,
          bncc_skill_ids: selectedBnccSkills,
          gallery_urls: galleryUrls,
          is_free: isFree,
          is_plr: isPlr,
          preco_plr: numericPrecoPlr,
          plr_license_url: plrLicenseUrl,
          allow_affiliates: allowAffiliates,
          affiliate_commission_rate: numericCommissionRate,
          order_bump_id: orderBumpId || null
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

              {plrSourceTitle && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                  <p className="font-black">Licença PLR confirmada: {plrSourceTitle}</p>
                  <p className="mt-1 text-xs leading-relaxed text-amber-800">
                    Preenchemos título, descrição, capa, galeria e dados pedagógicos para agilizar. Antes de publicar, altere título, descrição e capa para diferenciar sua versão; envie também seus próprios arquivos ou links de entrega.
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                      Título do Material Didático *
                    </label>
                    <button type="button" onClick={handleOptimizeAll} className="text-sm text-blue-600 flex items-center gap-1 font-bold hover:text-blue-800 transition-colors">
                      <Sparkles className="w-4 h-4"/> Gerar com IA
                    </button>
                  </div>
                  <input
                    type="text"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Ex: Apostila Ilustrada de História do Brasil - ENEM & Concursos"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm font-medium focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                      Descrição Detalhada & O que o cliente vai receber
                    </label>
                  </div>
                  <textarea
                    rows={4}
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Descreva o conteúdo do material, número de páginas, temas abordados e benefícios..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm font-medium focus:outline-none"
                  />
                </div>

                <div className="pt-2">
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

                <div className="grid sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                      Número de páginas / telas
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      inputMode="numeric"
                      value={pageCount}
                      onChange={(event) => setPageCount(event.target.value)}
                      placeholder={tipo === 'video' ? 'Ex.: 12 aulas' : 'Ex.: 45'}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm font-medium focus:outline-none"
                    />
                    <p className="mt-1 text-[11px] text-slate-500">Opcional. Para vídeos, informe a quantidade de aulas/telas.</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                      Faixa etária recomendada
                    </label>
                    <input
                      type="text"
                      maxLength={120}
                      value={ageRange}
                      onChange={(event) => setAgeRange(event.target.value)}
                      placeholder="Ex.: 6 a 8 anos"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm font-medium focus:outline-none"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-pink-100 bg-pink-50/60 p-4">
                  <label className="text-xs font-bold uppercase tracking-wider text-pink-800 block mb-1.5">Vídeo do Instagram na galeria</label>
                  <input type="url" value={instagramVideoUrl} onChange={(event) => setInstagramVideoUrl(event.target.value)} placeholder="https://www.instagram.com/reel/..." className="w-full px-4 py-3 bg-white border border-pink-200 focus:border-pink-500 rounded-xl text-slate-900 text-sm font-medium focus:outline-none" />
                  <p className="mt-2 text-[11px] text-pink-800">Cole o link público de um Reel ou post. Ele aparecerá junto das fotos do material com acesso ao Instagram da loja.</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">Datas e projetos escolares</label>
                      <p className="mt-1 text-xs text-slate-500">Conecte campanhas e temas para facilitar a descoberta na vitrine.</p>
                    </div>
                    <button type="button" onClick={() => setIsSeasonalPickerOpen(true)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-sm transition-colors hover:bg-blue-700">
                      <Tags className="h-4 w-4" /> Selecionar datas e temas
                    </button>
                  </div>
                  {seasonalTags.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">
                    {seasonalTags.map((tag) => <button key={tag} type="button" onClick={() => setSeasonalTags((current) => current.filter((item) => item !== tag))} className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100">{tag}<X className="h-3 w-3" /></button>)}
                  </div>}
                </div>

                {isSeasonalPickerOpen && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
                  <div className="w-full max-w-2xl rounded-3xl bg-white p-5 shadow-2xl sm:p-7">
                    <div className="flex items-start justify-between gap-4">
                      <div><p className="text-[10px] font-black uppercase tracking-[0.15em] text-blue-600">Catálogo escolar</p><h3 className="mt-1 text-xl font-black text-slate-900">Conectar datas e temas</h3><p className="mt-1 text-xs text-slate-500">Pesquise e selecione todas as ocasiões relacionadas ao material.</p></div>
                      <button type="button" onClick={() => setIsSeasonalPickerOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Fechar"><X className="h-5 w-5" /></button>
                    </div>
                    <label className="relative mt-5 block"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input autoFocus value={seasonalTagSearch} onChange={(event) => setSeasonalTagSearch(event.target.value)} placeholder="Pesquisar: mulher, Páscoa, cabelo maluco..." className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-blue-500" /></label>
                    <div className="mt-4 max-h-[45vh] overflow-y-auto rounded-2xl border border-slate-100 p-2">
                      {SCHOOL_CALENDAR_TAGS.filter((tag) => tag.toLocaleLowerCase('pt-BR').includes(seasonalTagSearch.toLocaleLowerCase('pt-BR'))).map((tag) => { const selected = seasonalTags.includes(tag); return <button key={tag} type="button" onClick={() => setSeasonalTags((current) => selected ? current.filter((item) => item !== tag) : [...current, tag])} className={`m-1 rounded-xl border px-3 py-2 text-left text-xs font-bold transition-colors ${selected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50'}`}>{tag}</button>; })}
                    </div>
                    <div className="mt-5 flex items-center justify-between"><span className="text-xs font-medium text-slate-500">{seasonalTags.length} tema(s) selecionado(s)</span><button type="button" onClick={() => setIsSeasonalPickerOpen(false)} className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white">Concluir seleção</button></div>
                  </div>
                </div>}

                <div className="grid sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                      Detalhes do formato
                    </label>
                    <input
                      type="text"
                      maxLength={180}
                      value={formatDetails}
                      onChange={(event) => setFormatDetails(event.target.value)}
                      placeholder="Ex.: PDF colorido, pronto para imprimir"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm font-medium focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                      Link público de prévia
                    </label>
                    <input
                      type="url"
                      value={previewUrl}
                      onChange={(event) => setPreviewUrl(event.target.value)}
                      placeholder="https://..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm font-medium focus:outline-none"
                    />
                    <p className="mt-1 text-[11px] text-slate-500">Use uma prévia sem acesso ao arquivo completo vendido.</p>
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

                {/* Habilidades da BNCC */}
                <div className="pt-2">
                  <label className="flex items-center gap-3 mb-3 cursor-pointer">
                    <input type="checkbox" checked={usesBncc} onChange={(e) => { setUsesBncc(e.target.checked); if (!e.target.checked) setSelectedBnccSkills([]); }} className="w-4 h-4 accent-blue-600" />
                    <span className="text-sm font-bold text-slate-800">Este material é alinhado à BNCC</span>
                  </label>
                  {!usesBncc ? <p className="text-xs text-slate-500">Marque esta opção para informar as habilidades BNCC trabalhadas.</p> : null}
                  {usesBncc && <>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
                    Habilidades da BNCC (Opcional)
                  </label>
                  <p className="text-xs text-slate-500 mb-3">
                    Selecione as habilidades da Base Nacional Comum Curricular que este material desenvolve. 
                    Isso ajuda os professores a encontrarem seu conteúdo mais rápido.
                  </p>

                  <div className="grid gap-2 sm:grid-cols-[1fr_160px_220px] mb-3">
                    <label className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="search"
                        value={bnccSearch}
                        onChange={(event) => setBnccSearch(event.target.value)}
                        placeholder="Buscar código, tema ou palavra..."
                        className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
                      />
                    </label>
                    <select
                      value={bnccStage}
                      onChange={(event) => setBnccStage(event.target.value as 'all' | 'EI' | 'EF' | 'EM')}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                      aria-label="Filtrar por etapa da BNCC"
                    >
                      <option value="all">Todas as etapas</option>
                      <option value="EI">Educação Infantil</option>
                      <option value="EF">Ensino Fundamental</option>
                      <option value="EM">Ensino Médio</option>
                    </select>
                    <select
                      value={bnccSubject}
                      onChange={(event) => setBnccSubject(event.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                      aria-label="Filtrar por componente da BNCC"
                    >
                      <option value="all">Todos os componentes</option>
                      {bnccSubjects.map(subject => <option key={subject} value={subject}>{subject}</option>)}
                    </select>
                  </div>

                  <div className="flex items-center justify-between mb-2 text-xs text-slate-500">
                    <span>{bnccSkillsMaster.length.toLocaleString('pt-BR')} habilidades disponíveis</span>
                    <span className="font-semibold text-blue-700">{selectedBnccSkills.length} selecionada(s)</span>
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl bg-white p-2 space-y-1">
                    {bnccSkillsMaster.length > 0 ? (
                      filteredBnccSkills.length > 0 ? filteredBnccSkills.map(skill => {
                        const isSelected = selectedBnccSkills.includes(skill.id);
                        return (
                          <div 
                            key={skill.id}
                            onClick={() => {
                              setSelectedBnccSkills(prev => 
                                isSelected 
                                  ? prev.filter(id => id !== skill.id)
                                  : [...prev, skill.id]
                              );
                            }}
                            className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors border-2 ${
                              isSelected 
                                ? 'bg-blue-50 border-blue-500' 
                                : 'bg-transparent border-transparent hover:bg-slate-50 hover:border-slate-200'
                            }`}
                          >
                            <div className={`mt-0.5 w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border transition-colors ${
                              isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'
                            }`}>
                              {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-800">{skill.code}</div>
                              <div className="text-[11px] font-medium text-blue-700">{[skill.grade_level, skill.subject].filter(Boolean).join(' · ')}</div>
                              <div className="text-xs text-slate-600 leading-snug line-clamp-2">{skill.description}</div>
                            </div>
                          </div>
                        )
                      }) : <div className="p-4 text-center text-sm font-medium text-slate-500">Nenhuma habilidade encontrada com esses filtros.</div>
                    ) : (
                      <div className="p-4 text-center text-sm font-medium text-slate-500">
                        Carregando habilidades...
                      </div>
                    )}
                  </div>
                  {filteredBnccSkills.length >= 150 && (
                    <p className="mt-2 text-xs text-slate-500">Exibindo os primeiros 150 resultados. Refine a busca para encontrar uma habilidade específica.</p>
                  )}
                  </>}
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
                maxSizeMB={15}
                value={galleryUrls}
                onChange={setGalleryUrls}
                label="Capa e Galeria do Produto"
                helperText="Selecione ou arraste arquivos PNG, JPG ou WEBP (até 15MB/cada)."
                maxItems={10}
                cropCover={true}
              />
            </motion.div>
          )}

          {/* STEP 3: Preços e Entregáveis */}
          {currentStep === 3 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  3. Preços e Entregáveis
                </h2>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Configure o preço de venda e como os materiais serão entregues.
                </p>
              </div>

              {/* BLOCO 1: PRODUTO FINAL */}
              <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Bloco 1: Produto Final (Acesso do Cliente)
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    O material padrão e o preço que os clientes pagarão para acessar o seu conteúdo.
                  </p>
                </div>

                <div className="pt-2">
                  <div 
                    onClick={() => {
                      setIsFree(!isFree);
                      if (!isFree) setPreco('0,00');
                      else setPreco('29,90');
                    }}
                    className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${isFree ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}
                  >
                    <div className={`mt-0.5 w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center border transition-colors ${isFree ? 'bg-emerald-600 border-emerald-600' : 'bg-white border-slate-300'}`}>
                      {isFree && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${isFree ? 'text-emerald-900' : 'text-slate-700'}`}>🎁 Material Gratuito (Brinde)</span>
                      </div>
                      <p className={`text-[11px] mt-1 font-medium leading-relaxed ${isFree ? 'text-emerald-700' : 'text-slate-500'}`}>
                        Se marcado, o cliente poderá baixar este material gratuitamente.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                      Preço de Venda (R$) {isFree ? '' : '*'}
                    </label>
                    <p className="mb-2 text-[11px] font-medium text-slate-500">Valor que a pessoa pagará pelo material.</p>
                    <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                    <input
                      type="text"
                      value={isFree ? '0,00' : preco}
                      disabled={isFree}
                      onChange={(e) => setPreco(e.target.value)}
                      placeholder="29,90"
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm font-black focus:outline-none transition-colors ${
                        isFree 
                          ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' 
                          : 'bg-slate-50 border-slate-200 focus:border-blue-600 text-slate-900'
                      }`}
                    />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">Preço original</label>
                    <p className="mb-2 text-[11px] font-medium text-slate-500">Opcional — aparece riscado e entra em Oferta em Destaque.</p>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                      <input
                        type="text"
                        value={isFree ? '' : precoOriginal}
                        disabled={isFree}
                        onChange={(e) => setPrecoOriginal(e.target.value)}
                        placeholder="Ex.: 39,90"
                        className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm font-black focus:outline-none transition-colors ${isFree ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-amber-50/40 border-amber-200 focus:border-amber-500 text-slate-900'}`}
                      />
                    </div>
                  </div>
                </div>
                {!isFree && precoOriginal.trim() && (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">✨ Este material será exibido na vitrine <strong>Oferta em Destaque</strong>. O contador do card indica apenas a rotação da vitrine, não a validade do preço.</p>
                )}

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
                    Arquivo do Produto Final
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2 mb-4">
                    <button
                      type="button"
                      onClick={() => {
                        setDeliveryMethod('link');
                        if (isUploadedMaterial(arquivoUrl)) setArquivoUrl(null);
                      }}
                      className={`rounded-2xl border p-4 text-left transition-all ${
                        deliveryMethod === 'link' ? 'border-emerald-500 bg-emerald-50 shadow-sm ring-1 ring-emerald-200' : 'border-slate-200 bg-white hover:border-emerald-300'
                      }`}
                    >
                      <span className="flex items-start gap-3">
                        <span className={`mt-0.5 rounded-full p-1 ${deliveryMethod === 'link' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}><LinkIcon className="w-4 h-4" /></span>
                        <span><span className="flex items-center gap-2 text-sm font-black text-slate-900">Link do Drive <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-700">Recomendado</span></span><span className="mt-1 block text-xs font-medium text-slate-500">Google Drive, Mega, Dropbox e outros.</span></span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeliveryMethod('upload');
                        if (!isUploadedMaterial(arquivoUrl)) setArquivoUrl(null);
                        setDriveLinkDraft('');
                        setArquivoNome('');
                      }}
                      className={`rounded-2xl border p-4 text-left transition-all ${
                        deliveryMethod === 'upload' ? 'border-blue-500 bg-blue-50 shadow-sm ring-1 ring-blue-200' : 'border-slate-200 bg-white hover:border-blue-300'
                      }`}
                    >
                      <span className="flex items-start gap-3">
                        <span className={`mt-0.5 rounded-full p-1 ${deliveryMethod === 'upload' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}><UploadCloud className="w-4 h-4" /></span>
                        <span><span className="text-sm font-black text-slate-900">Upload do arquivo</span><span className="mt-1 block text-xs font-medium text-slate-500">Envie do seu computador (até 15 MB).</span></span>
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
                      label="Upload do Arquivo Final"
                      helperText="Formatos suportados: PDF, DOCX, ZIP, etc. (máx. 15MB)."
                    />
                  ) : (
                    <div className="bg-emerald-50/60 border border-emerald-200 p-4 rounded-2xl space-y-3">
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <LinkIcon className="w-4 h-4 text-emerald-600" />
                        Adicionar link do Drive
                      </h4>
                      <p className="text-xs font-medium text-slate-600">Cole um link público com permissão para qualquer pessoa com o link visualizar ou baixar.</p>
                      <input
                        type="text"
                        value={arquivoNome}
                        onChange={(e) => setArquivoNome(e.target.value)}
                        placeholder="Nome do material (ex.: Apostila completa)"
                        className="w-full px-4 py-3 bg-white border border-emerald-200 focus:border-emerald-600 rounded-xl text-slate-900 text-sm font-medium focus:outline-none shadow-sm"
                      />
                      <input
                        type="url"
                        value={driveLinkDraft}
                        onChange={(e) => setDriveLinkDraft(e.target.value)}
                        placeholder="https://drive.google.com/... ou https://1drv.ms/..."
                        className="w-full px-4 py-3 bg-white border border-emerald-200 focus:border-emerald-600 rounded-xl text-slate-900 text-sm font-medium focus:outline-none shadow-sm"
                      />
                      <button type="button" onClick={() => {
                        let normalizedLink: string;
                        if (!arquivoNome.trim()) { toast.error('Informe o nome do material antes de salvar o link.'); return; }
                        try {
                          normalizedLink = normalizeDeliveryLink(driveLinkDraft);
                        } catch { toast.error('Informe um link válido iniciado por https://.'); return; }
                        setArquivoUrl(normalizedLink);
                        toast.success('Link de entrega salvo.');
                      }} className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-emerald-600 px-5 text-sm font-black text-white shadow-sm transition-colors hover:bg-emerald-700"><LinkIcon className="h-4 w-4" /> Salvar link</button>
                      {arquivoUrl && deliveryMethod === 'link' && <p className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-bold text-emerald-800">✓ Link salvo para entrega: {arquivoNome}</p>}
                      <p className="text-xs font-medium text-slate-600">Aceitamos links do Google Drive, OneDrive, Mega e Dropbox. Garanta a permissão “qualquer pessoa com o link”.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* BLOCO 2: LICENÇA PLR */}
              <div className="bg-blue-50 border border-blue-200 p-5 rounded-xl shadow-sm space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-blue-900 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-blue-700" />
                      Bloco 2: Licença PLR (Mercado de Revenda)
                    </h3>
                    <p className="text-xs text-blue-700 mt-1">
                      Opcional. Venda os direitos de revenda deste produto. Quem compra recebe o pacote completo (Produto Final + Licença).
                    </p>
                  </div>
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-6 bg-blue-200/50 rounded-full cursor-pointer relative overflow-hidden" onClick={() => setIsPlr(!isPlr)}>
                      <div className={`absolute inset-0 bg-blue-600 transition-transform duration-300 ${isPlr ? 'translate-x-0' : '-translate-x-full'}`} />
                      <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${isPlr ? 'translate-x-6' : 'translate-x-0'}`} />
                    </div>
                  </div>
                </div>

                {isPlr && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="pt-4 border-t border-blue-200 space-y-5"
                  >
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-blue-900 block mb-1.5">
                        Preço da Licença de Revenda (R$)
                      </label>
                      <div className="relative max-w-xs">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                        <input
                          type="text"
                          value={precoPlr}
                          onChange={(e) => setPrecoPlr(e.target.value)}
                          placeholder="99,90"
                          className="w-full pl-10 pr-4 py-3 bg-white border border-blue-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm font-black focus:outline-none shadow-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-blue-900 block mb-2">
                        Arquivo da Licença (PDF/Imagem)
                      </label>
                      <div className="flex bg-blue-100/50 p-1 rounded-xl w-full mb-4">
                        <button
                          type="button"
                          onClick={() => {
                            setPlrDeliveryMethod('upload');
                            if (!isUploadedMaterial(plrLicenseUrl)) setPlrLicenseUrl(null);
                          }}
                          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                            plrDeliveryMethod === 'upload' ? 'bg-white shadow-sm text-blue-700' : 'text-blue-700/70 hover:text-blue-900'
                          }`}
                        >
                          <span className="flex items-center justify-center gap-2">
                            <UploadCloud className="w-4 h-4" /> Upload Seguro
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPlrDeliveryMethod('link');
                            if (isUploadedMaterial(plrLicenseUrl)) setPlrLicenseUrl(null);
                          }}
                          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                            plrDeliveryMethod === 'link' ? 'bg-white shadow-sm text-blue-700' : 'text-blue-700/70 hover:text-blue-900'
                          }`}
                        >
                          <span className="flex items-center justify-center gap-2">
                            <LinkIcon className="w-4 h-4" /> Link Externo
                          </span>
                        </button>
                      </div>

                      {plrDeliveryMethod === 'upload' ? (
                        <FileUpload
                          bucket="product-files"
                          accept=".pdf,.png,.jpg,.jpeg"
                          maxSizeMB={5}
                          value={plrLicenseUrl}
                          onChange={(url: string | null) => setPlrLicenseUrl(url)}
                          label="Licença de Revenda"
                          helperText="PDF ou Imagem (máx. 5MB)."
                        />
                      ) : (
                        <div className="bg-white/50 border border-blue-200 p-4 rounded-xl space-y-3">
                          <h4 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                            <LinkIcon className="w-4 h-4 text-blue-600" />
                            Link do Certificado/Licença
                          </h4>
                          <input
                            type="url"
                            value={plrLicenseUrl || ''}
                            onChange={(e) => setPlrLicenseUrl(e.target.value)}
                            placeholder="https://drive.google.com/..."
                            className="w-full px-4 py-2.5 bg-white border border-blue-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm font-medium focus:outline-none shadow-sm"
                          />
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>

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
                    <span className="text-2xl font-black text-slate-900">{isFree ? 'Grátis' : `R$ ${preco || '0,00'}`}</span>
                    
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

              {/* Aumente seu Ticket Médio (Order Bump) */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mt-6 space-y-4">
                <div>
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" /> Aumente seu Ticket Médio (Order Bump)
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Ofereça um produto complementar na tela de checkout com apenas 1 clique.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">Produto Complementar</label>
                  <select
                    value={orderBumpId}
                    onChange={(e) => setOrderBumpId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="">Nenhum (Desativado)</option>
                    {availableProducts.filter(p => p.id !== editId).map(p => (
                      <option key={p.id} value={p.id}>
                        {p.titulo} - R$ {p.preco.toFixed(2).replace('.', ',')}
                      </option>
                    ))}
                  </select>
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
