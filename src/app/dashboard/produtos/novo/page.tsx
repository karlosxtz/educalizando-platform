'use client';

import {
Loader2
} from 'lucide-react';
import { useRouter,useSearchParams } from 'next/navigation';
import { Suspense,useEffect,useMemo,useState } from 'react';

import { getBnccSkills,getCategories,getEducationLevels } from '@/lib/category-service';
import { isUploadedMaterial,normalizeDeliveryLink } from '@/lib/delivery-link';
import { normalizeProductTags } from '@/lib/product-tags';
import { getSchoolCalendarTagsForMonth,SCHOOL_CALENDAR_TAGS } from '@/lib/school-calendar';
import { createProduct,getCurrentCreatorStore,getProductById,getPublicProductsByStoreId,updateProduct } from '@/lib/store-service';
import { supabase } from '@/lib/supabase';
import { BnccSkill,Category,EducationLevel,Product,ProductColorMode,ProductDeliveryFile,ProductType,Store } from '@/lib/types';
import { toast } from 'sonner';

import ProductWizardView from './ProductWizardView';

function ProductWizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const plrProductId = searchParams.get('licenca-plr');
  const suggestedTheme = searchParams.get('tema');
  const suggestedTitle = searchParams.get('titulo');

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
  const [colorMode, setColorMode] = useState<ProductColorMode | ''>('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [instagramVideoUrl, setInstagramVideoUrl] = useState('');
  const [preco, setPreco] = useState<string>('');
  const [precoOriginal, setPrecoOriginal] = useState<string>('');
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [deliveryMethod, setDeliveryMethod] = useState<'upload' | 'link'>('link');
  const [arquivoUrl, setArquivoUrl] = useState<string | null>(null);
  const [arquivoNome, setArquivoNome] = useState('');
  const [deliveryFiles, setDeliveryFiles] = useState<ProductDeliveryFile[]>([]);
  const [driveLinkDraft, setDriveLinkDraft] = useState('');
  const [status, setStatus] = useState<'publicado' | 'rascunho'>('publicado');
  const [isImportedWoo, setIsImportedWoo] = useState(false);
  const [confirmImportPrice, setConfirmImportPrice] = useState(false);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [educationLevelIds, setEducationLevelIds] = useState<string[]>([]);
  const [seasonalTags, setSeasonalTags] = useState<string[]>([]);
  const [productTags, setProductTags] = useState<string[]>([]);
  const [aiConfigured, setAiConfigured] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [isSeasonalPickerOpen, setIsSeasonalPickerOpen] = useState(false);
  const [seasonalTagSearch, setSeasonalTagSearch] = useState('');
  const seasonalSuggestions = useMemo(() => getSchoolCalendarTagsForMonth(), []);
  const [selectedBnccSkills, setSelectedBnccSkills] = useState<string[]>([]);
  const [usesBncc, setUsesBncc] = useState(false);
  const [bnccSearch, setBnccSearch] = useState('');
  const [bnccStage, setBnccStage] = useState<'all' | 'EI' | 'EF' | 'EM'>('all');
  const [bnccSubject, setBnccSubject] = useState('all');
  const [isFree, setIsFree] = useState<boolean>(false);
  const [isPlr, setIsPlr] = useState<boolean>(false);
  const [plrDescricao, setPlrDescricao] = useState('');
  const [precoPlr, setPrecoPlr] = useState<string>('99,90');
  const [plrLicenseUrl, setPlrLicenseUrl] = useState<string | null>(null);
  const [plrDeliveryFiles, setPlrDeliveryFiles] = useState<ProductDeliveryFile[]>([]);
  const [plrDeliveryMethod, setPlrDeliveryMethod] = useState<'upload' | 'link'>('upload');
  const [plrSourceTitle, setPlrSourceTitle] = useState<string | null>(null);

  const [allowAffiliates, setAllowAffiliates] = useState<boolean>(false);
  const [affiliateCommissionRate, setAffiliateCommissionRate] = useState<string>('50');

  // Order Bump
  const [orderBumpId, setOrderBumpId] = useState<string>('');
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const formatOptions = ['PDF colorido, pronto para imprimir', 'PDF em preto e branco, pronto para imprimir', 'Arquivo digital em PDF', 'E-book digital com atividades', 'Kit de atividades para recortar e montar', 'Cartas e fichas pedagógicas em PDF', 'Material editável + PDF para impressão'];

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

        const [cats, edLevels, storeProducts, bnccList, aiSettingsResponse] = await Promise.all([
          getCategories(currentStore.id),
          getEducationLevels(),
          getPublicProductsByStoreId(currentStore.id),
          getBnccSkills(),
          fetch(`/api/ai/settings?storeId=${encodeURIComponent(currentStore.id)}`).catch(() => null),
        ]);
        setCategories(cats);
        setEducationLevels(edLevels);
        setAvailableProducts(storeProducts);
        setBnccSkillsMaster(bnccList);
        if (aiSettingsResponse?.ok) {
          const aiSettings = await aiSettingsResponse.json().catch(() => null);
          setAiConfigured(Boolean(aiSettings?.configured));
        }

        if (editId) {
          const existing = await getProductById(editId);
          if (existing) {
            setTitulo(existing.titulo);
            setDescricao(existing.descricao || '');
            setTipo(existing.tipo);
            setPageCount(existing.page_count ? String(existing.page_count) : '');
            setAgeRange(existing.age_range || '');
            setFormatDetails(existing.format_details || '');
            setColorMode(existing.color_mode || '');
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
            setDeliveryFiles(existing.delivery_files?.length ? existing.delivery_files : existing.arquivo_url && isUploadedMaterial(existing.arquivo_url) ? [{ url: existing.arquivo_url, name: existing.arquivo_nome || 'Arquivo principal' }] : []);
            setDeliveryMethod(isUploadedMaterial(existing.arquivo_url) ? 'upload' : 'link');
            setDriveLinkDraft(existing.arquivo_url || '');
            if (existing.arquivo_url && (existing.arquivo_url.startsWith('http://') || existing.arquivo_url.startsWith('https://'))) {
              if (!existing.arquivo_url.includes('supabase.co')) {
                setDeliveryMethod('link');
              }
            }

            setStatus(existing.status === 'rascunho' ? 'rascunho' : 'publicado');
            setIsImportedWoo(existing.import_source === 'woocommerce' && Boolean(existing.import_incomplete));
            setConfirmImportPrice(Boolean(existing.import_price_confirmed));
            setCategoryIds((existing.category_ids?.length ? existing.category_ids : existing.category_id ? [existing.category_id] : []).slice(0, 5));
            setEducationLevelIds((existing.education_level_ids?.length ? existing.education_level_ids : existing.education_level_id ? [existing.education_level_id] : []).slice(0, 5));
            setSeasonalTags(existing.seasonal_tags || []);
            setProductTags(normalizeProductTags(existing.tags || []));
            setIsFree(existing.is_free || false);
            setIsPlr(existing.is_plr || false);
            setPlrDescricao(existing.plr_descricao || '');
            if (existing.preco_plr) setPrecoPlr(existing.preco_plr.toString().replace('.', ','));
            
            setPlrLicenseUrl(existing.plr_license_url || null);
            setPlrDeliveryFiles(existing.plr_delivery_files?.length ? existing.plr_delivery_files : existing.plr_license_url && isUploadedMaterial(existing.plr_license_url) ? [{ url: existing.plr_license_url, name: 'Arquivo da licença PLR' }] : []);
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
            setProductTags(normalizeProductTags(Array.isArray(source.tags) ? source.tags : []));
            setTipo(source.tipo || 'pdf');
            setCategoryIds(Array.isArray(source.categoryIds) ? source.categoryIds.slice(0, 5) : source.categoryId ? [source.categoryId] : []);
            setEducationLevelIds(Array.isArray(source.educationLevelIds) ? source.educationLevelIds.slice(0, 5) : source.educationLevelId ? [source.educationLevelId] : []);
            setPageCount(source.pageCount ? String(source.pageCount) : '');
            setAgeRange(source.ageRange || '');
            setFormatDetails(source.formatDetails || '');
            setColorMode(source.colorMode || '');
            setSelectedBnccSkills(Array.isArray(source.bnccSkillIds) ? source.bnccSkillIds : []);
            setUsesBncc(Array.isArray(source.bnccSkillIds) && source.bnccSkillIds.length > 0);
          }
        } else {
          const savedDraft = localStorage.getItem('educalizando_product_draft_v1');
          if (savedDraft) {
            try {
              const draft = JSON.parse(savedDraft);
              setTitulo(draft.titulo || ''); setDescricao(draft.descricao || ''); setTipo(draft.tipo || 'pdf'); setPageCount(draft.pageCount || ''); setAgeRange(draft.ageRange || ''); setFormatDetails(draft.formatDetails || ''); setColorMode(draft.colorMode || ''); setPreco(draft.preco || ''); setPrecoOriginal(draft.precoOriginal || ''); setCategoryIds(Array.isArray(draft.categoryIds) ? draft.categoryIds.slice(0, 5) : draft.categoryId ? [draft.categoryId] : []); setEducationLevelIds(Array.isArray(draft.educationLevelIds) ? draft.educationLevelIds.slice(0, 5) : draft.educationLevelId ? [draft.educationLevelId] : []); setSeasonalTags(draft.seasonalTags || []); setProductTags(normalizeProductTags(Array.isArray(draft.productTags) ? draft.productTags : typeof draft.productTags === 'string' ? [draft.productTags] : [])); setIsFree(Boolean(draft.isFree)); setIsPlr(Boolean(draft.isPlr)); setPlrDescricao(draft.plrDescricao || ''); setPrecoPlr(draft.precoPlr || '99,90'); setCurrentStep(draft.currentStep || 1);
            } catch { localStorage.removeItem('educalizando_product_draft_v1'); }
          }
          if (suggestedTheme && SCHOOL_CALENDAR_TAGS.includes(suggestedTheme as typeof SCHOOL_CALENDAR_TAGS[number])) setSeasonalTags([suggestedTheme as typeof SCHOOL_CALENDAR_TAGS[number]]);
          if (suggestedTitle) setTitulo(suggestedTitle.slice(0, 160));
        }
      } catch (err: unknown) {
        console.error(err);
        setErrorMsg('Erro ao carregar dados do formulário.');
      } finally {
        setLoading(false);
      }
    }
    initData();
  }, [editId, plrProductId, suggestedTheme, suggestedTitle]);

  useEffect(() => {
    if (loading || editId || plrProductId) return;
    const draft = { titulo, descricao, tipo, pageCount, ageRange, formatDetails, colorMode, preco, precoOriginal, categoryIds, educationLevelIds, seasonalTags, productTags, isFree, isPlr, plrDescricao, precoPlr, currentStep };
    if (Object.values(draft).some(value => Array.isArray(value) ? value.length : Boolean(value))) localStorage.setItem('educalizando_product_draft_v1', JSON.stringify(draft));
  }, [loading, editId, plrProductId, titulo, descricao, tipo, pageCount, ageRange, formatDetails, colorMode, preco, precoOriginal, categoryIds, educationLevelIds, seasonalTags, productTags, isFree, isPlr, plrDescricao, precoPlr, currentStep]);

  const bnccSubjects = useMemo(() => Array.from(new Set(
    bnccSkillsMaster.map(skill => skill.subject).filter((subject): subject is string => Boolean(subject))
  )).sort((a, b) => a.localeCompare(b, 'pt-BR')), [bnccSkillsMaster]);

  const filteredBnccSkills = useMemo(() => {
    const term = bnccSearch.trim().toLocaleLowerCase('pt-BR');
    const matches = bnccSkillsMaster.filter(skill => {
      const code = skill.code.toUpperCase();
      const gradeLevel = (skill.grade_level || '').toLocaleLowerCase('pt-BR');
      const ererStageMatches = code.startsWith('ERER') && (
        (bnccStage === 'EI' && gradeLevel.includes('educação infantil')) ||
        (bnccStage === 'EF' && gradeLevel.includes('ensino fundamental')) ||
        (bnccStage === 'EM' && gradeLevel.includes('ensino médio'))
      );
      const stageMatches = bnccStage === 'all' || code.startsWith(bnccStage) || ererStageMatches;
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
    if (!aiConfigured) {
      toast.error('Conecte sua API na área de IA antes de usar o preenchimento automático.');
      return;
    }
    if (titulo.trim().length < 4) {
      toast.error('Digite um título com pelo menos 4 caracteres para a IA identificar o material.');
      return;
    }

    setAiGenerating(true);
    const loadingToast = toast.loading('A IA está identificando e preenchendo o material...');
    try {
      const res = await fetch('/api/ai/product-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: titulo, storeId: store.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Não foi possível preencher o cadastro com IA.');
      }
      const draft = data.draft || {};
      if (draft.title) setTitulo(draft.title);
      if (draft.description) setDescricao(draft.description);
      if (Array.isArray(draft.tags)) setProductTags(normalizeProductTags(draft.tags));
      if (Array.isArray(draft.categoryIds)) setCategoryIds(draft.categoryIds.slice(0, 5));
      if (Array.isArray(draft.educationLevelIds)) setEducationLevelIds(draft.educationLevelIds.slice(0, 5));
      if (Array.isArray(draft.seasonalTags)) setSeasonalTags(draft.seasonalTags);
      if (draft.type) setTipo(draft.type as ProductType);
      if (draft.ageRange) setAgeRange(draft.ageRange);
      if (draft.formatDetails) setFormatDetails(draft.formatDetails);
      toast.success('Cadastro preenchido pela IA. Revise as sugestões antes de publicar.', { id: loadingToast });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível gerar o material agora.', { id: loadingToast });
    } finally {
      setAiGenerating(false);
    }
  };

  const handleNextStep = () => {
    setErrorMsg(null);
    if (currentStep === 1) {
      if (!titulo.trim()) {
        setErrorMsg('Por favor, informe o título do produto didático.');
        return;
      }
      if (!colorMode) {
        setErrorMsg('Escolha se o material é colorido, em preto e branco ou inclui ambas as versões.');
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
      if (deliveryMethod === 'upload' && deliveryFiles.length === 0) {
        setErrorMsg('O Arquivo Didático Digital (Produto Final) é obrigatório. Faça o upload ou insira um link externo.');
        return;
      }
      if (isPlr) {
        if (!editId && plrDescricao.trim().length < 20) {
          setErrorMsg('Escreva uma descrição exclusiva para a Licença PLR. Ela será exibida somente para quem acessar a oferta de revenda.');
          return;
        }
        const numPlrPrice = parseFloat(precoPlr.replace(',', '.'));
        if (isNaN(numPlrPrice) || numPlrPrice <= 0) {
          setErrorMsg('Informe um preço maior que zero para a Licença PLR.');
          return;
        }
        if ((plrDeliveryMethod === 'upload' && plrDeliveryFiles.length === 0) || (plrDeliveryMethod === 'link' && !plrLicenseUrl)) {
          setErrorMsg('Envie o arquivo ou informe o link de entrega da Licença PLR.');
          return;
        }
        if (plrDeliveryMethod === 'link') {
          try { setPlrLicenseUrl(normalizeDeliveryLink(plrLicenseUrl || '')); }
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
    if (!colorMode && !isImportedWoo) {
      setCurrentStep(1);
      setErrorMsg('Escolha se o material é colorido, em preto e branco ou inclui ambas as versões.');
      return;
    }

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
    const firstDeliveryFile = deliveryMethod === 'upload' ? deliveryFiles[0] : null;
    const firstPlrDeliveryFile = plrDeliveryMethod === 'upload' ? plrDeliveryFiles[0] : null;
    const finalArquivoUrl = deliveryMethod === 'upload' ? firstDeliveryFile?.url || null : arquivoUrl;
    const finalArquivoNome = deliveryMethod === 'upload' ? firstDeliveryFile?.name || null : arquivoNome.trim() || null;
    const finalPlrLicenseUrl = plrDeliveryMethod === 'upload' ? firstPlrDeliveryFile?.url || null : plrLicenseUrl;

    if (isImportedWoo && !confirmImportPrice) {
      setCurrentStep(4);
      setErrorMsg('Confira o preço e marque a confirmação antes de publicar o produto importado.');
      setSaving(false);
      return;
    }

    try {
      if (editId) {
        await updateProduct(editId, {
          titulo,
          descricao: descricao || null,
          tipo,
          page_count: numericPageCount,
          age_range: ageRange.trim() || null,
          format_details: formatDetails.trim() || null,
          ...(colorMode ? { color_mode: colorMode } : {}),
          preview_url: previewUrl.trim() || null,
          instagram_video_url: instagramVideoUrl.trim() || null,
          preco: numericPrice,
          preco_original: numericOriginalPrice,
          capa_url: computedCapaUrl,
          arquivo_url: finalArquivoUrl,
          arquivo_nome: finalArquivoNome,
          delivery_files: deliveryMethod === 'upload' ? deliveryFiles : [],
          status,
          category_id: categoryIds[0] || null,
          category_ids: categoryIds,
          education_level_id: educationLevelIds[0] || null,
          education_level_ids: educationLevelIds,
          seasonal_tags: seasonalTags,
          tags: productTags,
          bncc_skill_ids: selectedBnccSkills,
          gallery_urls: galleryUrls,
          is_free: isFree,
          is_plr: isPlr,
          ...(plrDescricao.trim() ? { plr_descricao: plrDescricao.trim() } : {}),
          preco_plr: numericPrecoPlr,
          plr_license_url: finalPlrLicenseUrl,
          plr_delivery_files: isPlr && plrDeliveryMethod === 'upload' ? plrDeliveryFiles : [],
          allow_affiliates: allowAffiliates,
          affiliate_commission_rate: numericCommissionRate,
          order_bump_id: orderBumpId || null,
          confirm_import_price: isImportedWoo ? confirmImportPrice : undefined
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
          color_mode: colorMode as ProductColorMode,
          preview_url: previewUrl.trim() || null,
          instagram_video_url: instagramVideoUrl.trim() || null,
          preco: numericPrice,
          preco_original: numericOriginalPrice,
          capa_url: computedCapaUrl,
          arquivo_url: finalArquivoUrl,
          arquivo_nome: finalArquivoNome,
          delivery_files: deliveryMethod === 'upload' ? deliveryFiles : [],
          status,
          category_id: categoryIds[0] || null,
          category_ids: categoryIds,
          education_level_id: educationLevelIds[0] || null,
          education_level_ids: educationLevelIds,
          seasonal_tags: seasonalTags,
          tags: productTags,
          bncc_skill_ids: selectedBnccSkills,
          gallery_urls: galleryUrls,
          is_free: isFree,
          is_plr: isPlr,
          plr_descricao: isPlr ? plrDescricao.trim() : null,
          preco_plr: numericPrecoPlr,
          plr_license_url: finalPlrLicenseUrl,
          plr_delivery_files: isPlr && plrDeliveryMethod === 'upload' ? plrDeliveryFiles : [],
          allow_affiliates: allowAffiliates,
          affiliate_commission_rate: numericCommissionRate,
          order_bump_id: orderBumpId || null
        });
      }

      if (!editId) localStorage.removeItem('educalizando_product_draft_v1');
      router.push('/dashboard/produtos');
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao salvar produto.');
      setSaving(false);
    }
  };

  const categoryOptions = categories.map(c => ({ value: c.id, label: c.nome }));

  const educationOptions = educationLevels.map(e => ({ value: e.id, label: e.nome }));

  if (loading) {
    return (
      <div role="status" className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3 text-sm font-semibold text-slate-600">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" aria-hidden="true" />
        Carregando formulário do produto...
      </div>
    );
  }

  return <ProductWizardView state={{ router, searchParams, editId, plrProductId, suggestedTheme, suggestedTitle, loading, setLoading, saving, setSaving, store, setStore, categories, setCategories, educationLevels, setEducationLevels, bnccSkillsMaster, setBnccSkillsMaster, errorMsg, setErrorMsg, currentStep, setCurrentStep, titulo, setTitulo, descricao, setDescricao, tipo, setTipo, pageCount, setPageCount, ageRange, setAgeRange, formatDetails, setFormatDetails, colorMode, setColorMode, previewUrl, setPreviewUrl, instagramVideoUrl, setInstagramVideoUrl, preco, setPreco, precoOriginal, setPrecoOriginal, galleryUrls, setGalleryUrls, deliveryMethod, setDeliveryMethod, arquivoUrl, setArquivoUrl, arquivoNome, setArquivoNome, driveLinkDraft, setDriveLinkDraft, deliveryFiles, setDeliveryFiles, status, setStatus, isImportedWoo, confirmImportPrice, setConfirmImportPrice, categoryIds, setCategoryIds, educationLevelIds, setEducationLevelIds, seasonalTags, setSeasonalTags, productTags, setProductTags, aiConfigured, setAiConfigured, aiGenerating, setAiGenerating, isSeasonalPickerOpen, setIsSeasonalPickerOpen, seasonalTagSearch, setSeasonalTagSearch, seasonalSuggestions, selectedBnccSkills, setSelectedBnccSkills, usesBncc, setUsesBncc, bnccSearch, setBnccSearch, bnccStage, setBnccStage, bnccSubject, setBnccSubject, isFree, setIsFree, isPlr, setIsPlr, plrDescricao, setPlrDescricao, precoPlr, setPrecoPlr, plrLicenseUrl, setPlrLicenseUrl, plrDeliveryFiles, setPlrDeliveryFiles, plrDeliveryMethod, setPlrDeliveryMethod, plrSourceTitle, setPlrSourceTitle, allowAffiliates, setAllowAffiliates, affiliateCommissionRate, setAffiliateCommissionRate, orderBumpId, setOrderBumpId, availableProducts, setAvailableProducts, formatOptions, bnccSubjects, filteredBnccSkills, handleOptimizeAll, handleNextStep, handlePrevStep, handleSaveProduct, categoryOptions, educationOptions }} />;
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
