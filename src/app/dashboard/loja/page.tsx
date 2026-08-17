'use client';

import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Store as StoreIcon, Copy, ExternalLink, Check, Save, 
  Palette, ImageIcon, Sparkles, Loader2, AlertCircle, MessageCircle 
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const formatWhatsApp = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return digits; // Let user type DDD without forcing ()
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

import { storeSettingsSchema, type StoreSettingsFormValues } from '@/lib/zod-schemas';
import { getCurrentCreatorStore, updateStore } from '@/lib/store-service';
import { Store, StoreThemeProps } from '@/lib/types';
import FileUpload from '@/components/dashboard/FileUpload';

export default function StoreSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<StoreSettingsFormValues>({
    resolver: zodResolver(storeSettingsSchema),
    defaultValues: {
      nome_loja: '',
      slug: '',
      descricao: '',
      logo_url: '',
      banner_url: '',
      cor_primaria: '#2563eb',
      whatsapp: '',
      instagram: '',
      layout_theme: 'default'
    }
  });

  const watchedNomeLoja = watch('nome_loja');
  const watchedSlug = watch('slug');
  const watchedDescricao = watch('descricao');
  const watchedCorPrimaria = watch('cor_primaria');
  const watchedLogoUrl = watch('logo_url');
  const watchedBannerUrl = watch('banner_url');
  const watchedWhatsapp = watch('whatsapp');
  const watchedInstagram = watch('instagram');
  const watchedLayoutTheme = watch('layout_theme');

  useEffect(() => {
    async function loadStoreData() {
      try {
        const store = await getCurrentCreatorStore();
        setCurrentStore(store);
        reset({
          nome_loja: store.nome_loja,
          slug: store.slug,
          descricao: store.descricao || '',
          logo_url: store.logo_url || '',
          banner_url: store.banner_url || '',
          cor_primaria: store.cor_primaria || '#2563eb',
          whatsapp: store.whatsapp ? formatWhatsApp(store.whatsapp) : '',
          instagram: store.instagram || '',
          layout_theme: store.layout_theme || 'default'
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStoreData();
  }, [reset]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.educalizando.com.br';
  const publicUrl = `${siteUrl}/loja/${watchedSlug || 'sua-loja'}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const onSubmit: SubmitHandler<StoreSettingsFormValues> = async (values) => {
    if (!currentStore) return;
    setActionError(null);
    try {
      const updated = await updateStore(currentStore.id, {
        nome_loja: values.nome_loja,
        slug: values.slug,
        descricao: values.descricao,
        logo_url: values.logo_url,
        banner_url: values.banner_url,
        cor_primaria: values.cor_primaria,
        whatsapp: values.whatsapp,
        instagram: values.instagram,
        layout_theme: values.layout_theme
      });
      setCurrentStore(updated);
      setSavedSuccess(true);
      router.refresh(); // Invalida o cache do Next.js para garantir dados frescos
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setActionError(err.message || 'Erro ao salvar configurações da loja.');
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
      {/* Title & Link Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-3">
            <StoreIcon className="w-7 h-7 text-blue-600" /> Configurações da Sua Loja
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Personalize a identidade visual, logo, banner e o link da sua vitrine pública.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2 rounded-xl text-xs w-full sm:w-auto justify-between sm:justify-start">
          <span className="font-mono text-slate-700 font-bold truncate max-w-[200px] sm:max-w-xs">
            /loja/{watchedSlug}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopyLink}
              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold flex items-center gap-1 transition-colors"
              title="Copiar Link da Loja"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1 transition-colors"
              title="Abrir Vitrine Pública"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Grid: Form Settings & Live Preview */}
      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* Form Container */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {actionError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs flex items-center gap-3 font-semibold">
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {savedSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs flex items-center gap-3 font-semibold">
                <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>Configurações salvas com sucesso! As alterações já estão ativas na sua loja.</span>
              </div>
            )}

            {/* Nome da Loja */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Nome da Loja / Marca *
              </label>
              <input
                type="text"
                {...register('nome_loja')}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-1 transition-all"
                placeholder="Ex: Prof. Ricardo Silva"
              />
              {errors.nome_loja && (
                <p className="text-xs text-rose-500 mt-1 font-medium">{errors.nome_loja.message}</p>
              )}
            </div>

            {/* Slug Exclusivo */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Link Exclusivo (Slug) *
              </label>
              <div className="flex items-center">
                <span className="bg-slate-100 border border-r-0 border-slate-200 text-slate-500 text-xs px-3 py-3 rounded-l-xl font-mono">
                  educalizando.com.br/loja/
                </span>
                <input
                  type="text"
                  {...register('slug')}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-r-xl text-slate-900 text-sm focus:outline-none font-mono"
                  placeholder="prof-ricardo"
                />
              </div>
              {errors.slug && (
                <p className="text-xs text-rose-500 mt-1 font-medium">{errors.slug.message}</p>
              )}
            </div>

            {/* Descrição da Loja */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Descrição & Bio da Sua Loja
              </label>
              <textarea
                rows={3}
                {...register('descricao')}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm focus:outline-none"
                placeholder="Apresente sua experiência e o objetivo dos seus materiais didáticos..."
              />
            </div>

            {/* WhatsApp para Contato */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                WhatsApp para Contato
              </label>
              <input
                type="text"
                {...register('whatsapp', {
                  onChange: (e) => {
                    setValue('whatsapp', formatWhatsApp(e.target.value), { shouldValidate: true, shouldDirty: true });
                  }
                })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-1 transition-all"
                placeholder="(11) 91234-5678"
              />
              <p className="text-[11px] text-slate-500 font-medium mt-1">Os alunos poderão falar com você direto pelo WhatsApp através da sua loja.</p>
              {errors.whatsapp && (
                <p className="text-xs text-rose-500 mt-1 font-medium">{errors.whatsapp.message}</p>
              )}
            </div>

            {/* Instagram da Loja */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Instagram da Loja
              </label>
              <input
                type="text"
                {...register('instagram')}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-1 transition-all"
                placeholder="@seuinstagram ou link completo"
              />
              <p className="text-[11px] text-slate-500 font-medium mt-1">Aparecerá como um ícone clicável na sua loja pública.</p>
              {errors.instagram && (
                <p className="text-xs text-rose-500 mt-1 font-medium">{errors.instagram.message}</p>
              )}
            </div>

            {/* Cor Primária de Destaque da Loja */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block flex items-center gap-2">
                <Palette className="w-4 h-4 text-blue-600" /> Cor Primária de Destaque da Sua Vitrine Pública *
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  {...register('cor_primaria')}
                  className="w-12 h-10 rounded-lg cursor-pointer bg-transparent border border-slate-200"
                />
                <input
                  type="text"
                  {...register('cor_primaria')}
                  className="w-32 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono text-xs uppercase"
                />
                <div className="flex gap-2">
                  {['#ff5722', '#2563eb', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'].map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setValue('cor_primaria', color)}
                      style={{ backgroundColor: color }}
                      className="w-6 h-6 rounded-full border border-slate-300 hover:scale-110 transition-transform"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Upload do Logo da Loja (Reutiliza FileUpload) */}
            <FileUpload
              label="Foto / Logo da Loja"
              helperText="Upload do avatar da marca (JPG, PNG ou WEBP, máx. 2MB)."
              recommendationText="Recomendado: imagem quadrada (proporção 1:1, mínimo 400x400px)"
              bucket="store-assets"
              accept="image/jpeg,image/png,image/webp"
              maxSizeMB={2}
              value={watchedLogoUrl}
              onChange={(url) => setValue('logo_url', url || '')}
              isImage={true}
              aspectRatio="1:1"
            />

            {/* Upload do Banner da Loja (Reutiliza FileUpload) */}
            <FileUpload
              label="Imagem do Banner Principal"
              helperText="Upload da imagem de capa de topo da vitrine (JPG, PNG ou WEBP, máx. 5MB)."
              recommendationText="Recomendado: proporção 3:1 (ex: 1200x400px)"
              bucket="store-assets"
              accept="image/jpeg,image/png,image/webp"
              maxSizeMB={5}
              value={watchedBannerUrl}
              onChange={(url) => setValue('banner_url', url || '')}
              isImage={true}
              aspectRatio="3:1"
            />

            {/* Seletor de Tema */}
            <div className="space-y-3 pb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Tema / Layout da Vitrine Pública
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: 'default', name: 'Padrão (Default)', desc: 'Listagem com barra lateral' },
                  { id: 'minimalist', name: 'Minimalista', desc: 'Foco no produto, visual limpo' },
                  { id: 'netflix', name: 'Carrossel Dark', desc: 'Fundo escuro, estilo Netflix' },
                  { id: 'linktree', name: 'Link-in-Bio', desc: 'Lista vertical mobile-first' },
                  { id: 'pinterest', name: 'Pinterest Grid', desc: 'Grade moderna e densa' }
                ].map(theme => (
                  <label 
                    key={theme.id}
                    className={`cursor-pointer flex flex-col p-3 rounded-xl border-2 transition-all ${
                      watchedLayoutTheme === theme.id 
                        ? 'border-blue-600 bg-blue-50/50' 
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <input 
                        type="radio" 
                        value={theme.id} 
                        {...register('layout_theme')} 
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-bold text-slate-900 text-sm">{theme.name}</span>
                    </div>
                    <span className="text-xs text-slate-500 pl-6">{theme.desc}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-xl font-extrabold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Salvando Alterações...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Salvar Configurações da Loja</span>
                </>
              )}
            </button>

          </form>
        </div>

        {/* Live Preview Panel (Real-time updates as user types or uploads files) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-500 tracking-wider">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Preview em Tempo Real da Sua Loja</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-lg space-y-4 sticky top-6">
            {/* Banner Preview */}
            <div className="h-32 bg-slate-800 relative overflow-hidden">
              {watchedBannerUrl ? (
                <img src={watchedBannerUrl} alt="Banner Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-slate-900 to-indigo-950 flex items-center justify-center text-slate-400 text-xs font-bold">
                  Banner da Loja
                </div>
              )}
            </div>

            {/* Profile Avatar & Info Preview */}
            <div className="px-6 pb-6 pt-0 -mt-12 space-y-3 relative">
              <div className="w-20 h-20 rounded-full bg-white p-1 border-4 border-white shadow-md overflow-hidden">
                {watchedLogoUrl ? (
                  <img src={watchedLogoUrl} alt="Logo Preview" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div
                    className="w-full h-full rounded-full flex items-center justify-center text-white font-black text-2xl"
                    style={{ backgroundColor: watchedCorPrimaria || '#2563eb' }}
                  >
                    {(watchedNomeLoja || 'L').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {watchedNomeLoja || 'Nome da Sua Loja'}
                </h3>
                <p className="text-xs text-blue-600 font-mono font-bold">
                  educalizando.com.br/loja/{watchedSlug || 'sua-loja'}
                </p>
                <p className="text-xs text-slate-500 line-clamp-2 mt-1 font-medium">
                  {watchedDescricao || 'Sua bio e apresentação oficial aparecerão aqui para os seus alunos.'}
                </p>

                {/* Preview Social Links */}
                {(watchedWhatsapp || watchedInstagram) && (
                  <div className="flex items-center gap-2 mt-3">
                    {watchedInstagram && (
                      <div className="p-1.5 bg-white rounded-full text-slate-400 border border-slate-200 flex items-center justify-center shadow-sm">
                        <InstagramIcon className="w-4 h-4" />
                      </div>
                    )}
                    {watchedWhatsapp && (
                      <div className="px-3 py-1.5 bg-[#25D366] text-white rounded-full text-[10px] font-bold flex items-center gap-1.5 shadow-sm">
                        <MessageCircle className="w-3 h-3 fill-white" />
                        WhatsApp
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Cor de Destaque:</span>
                <span
                  className="px-3 py-1 rounded-full text-white text-[10px] font-extrabold uppercase"
                  style={{ backgroundColor: watchedCorPrimaria || '#2563eb' }}
                >
                  Botão de Compra
                </span>
              </div>
            </div>
            
            {/* Simulated Floating WhatsApp Button in Preview */}
            {watchedWhatsapp && (
              <div className="absolute bottom-4 right-4 w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center shadow-md">
                <MessageCircle className="w-5 h-5 text-white fill-white" />
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
