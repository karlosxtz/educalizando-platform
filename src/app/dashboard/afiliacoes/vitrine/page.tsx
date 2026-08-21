'use client';

import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Store as StoreIcon, Copy, ExternalLink, Check, Save, 
  Palette, Sparkles, Loader2, AlertCircle, MessageCircle 
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
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

import { affiliateProfileSchema, type AffiliateProfileFormValues } from '@/lib/zod-schemas';
import { getOrCreateAffiliateProfile, updateAffiliateProfile } from '@/lib/affiliate-service';
import { AffiliateProfile } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import FileUpload from '@/components/dashboard/FileUpload';

export default function AffiliateStoreSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [currentProfile, setCurrentProfile] = useState<AffiliateProfile | null>(null);
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
  } = useForm<AffiliateProfileFormValues>({
    resolver: zodResolver(affiliateProfileSchema),
    defaultValues: {
      nome: '',
      slug: '',
      descricao: '',
      logo_url: '',
      banner_url: '',
      cor_primaria: '#2563eb',
      whatsapp: '',
      instagram: '',
      tema: 'default',
      youtube: '',
      tiktok: '',
      facebook: ''
    }
  });

  const watchedNome = watch('nome');
  const watchedSlug = watch('slug');
  const watchedDescricao = watch('descricao');
  const watchedCorPrimaria = watch('cor_primaria');
  const watchedLogoUrl = watch('logo_url');
  const watchedBannerUrl = watch('banner_url');
  const watchedWhatsapp = watch('whatsapp');
  const watchedInstagram = watch('instagram');
  const watchedTema = watch('tema');

  useEffect(() => {
    async function loadProfileData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const profile = await getOrCreateAffiliateProfile(user.id, user.user_metadata?.full_name);
        if (profile) {
          setCurrentProfile(profile);
          reset({
            nome: profile.nome || '',
            slug: profile.slug,
            descricao: profile.descricao || '',
            logo_url: profile.logo_url || '',
            banner_url: profile.banner_url || '',
            cor_primaria: profile.cor_primaria || '#2563eb',
            whatsapp: profile.whatsapp ? formatWhatsApp(profile.whatsapp) : '',
            instagram: profile.instagram || '',
            tema: profile.tema || 'default',
            youtube: profile.youtube || '',
            tiktok: profile.tiktok || '',
            facebook: profile.facebook || ''
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProfileData();
  }, [reset]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.educalizando.com.br';
  const publicUrl = `${siteUrl}/afiliado/${watchedSlug || 'sua-vitrine'}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const onSubmit: SubmitHandler<AffiliateProfileFormValues> = async (values) => {
    if (!currentProfile) return;
    setActionError(null);
    try {
      const updated = await updateAffiliateProfile(currentProfile.user_id, {
        nome: values.nome,
        slug: values.slug,
        descricao: values.descricao,
        logo_url: values.logo_url,
        banner_url: values.banner_url,
        cor_primaria: values.cor_primaria,
        whatsapp: values.whatsapp,
        instagram: values.instagram,
        tema: values.tema,
        youtube: values.youtube,
        tiktok: values.tiktok,
        facebook: values.facebook
      });
      setCurrentProfile(updated);
      setSavedSuccess(true);
      router.refresh(); 
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setActionError(err.message || 'Erro ao salvar configurações da vitrine.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-navy" />
      </div>
    );
  }

  if (!currentProfile) {
    return (
      <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Vitrine não configurada</h2>
        <p className="text-slate-600">Ocorreu um erro ao carregar sua vitrine.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Title & Link Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-3">
            <StoreIcon className="w-7 h-7 text-blue-600" /> Configurações da Sua Vitrine
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Personalize a identidade visual, logo, banner e o link da sua vitrine pública.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2 rounded-xl text-xs w-full sm:w-auto justify-between sm:justify-start">
          <span className="font-mono text-slate-700 font-bold truncate max-w-[200px] sm:max-w-xs">
            /afiliado/{watchedSlug}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopyLink}
              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold flex items-center gap-1 transition-colors"
              title="Copiar Link da Vitrine"
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
                <span>Configurações salvas com sucesso! As alterações já estão ativas na sua vitrine.</span>
              </div>
            )}

            {/* Nome da Vitrine */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Nome da Vitrine / Marca *
              </label>
              <input
                type="text"
                {...register('nome')}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-1 transition-all"
                placeholder="Ex: Prof. Ricardo Silva"
              />
              {errors.nome && (
                <p className="text-xs text-rose-500 mt-1 font-medium">{errors.nome.message}</p>
              )}
            </div>

            {/* Slug Exclusivo */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Link Exclusivo (Slug) *
              </label>
              <div className="flex items-center">
                <span className="bg-slate-100 border border-r-0 border-slate-200 text-slate-500 text-xs px-3 py-3 rounded-l-xl font-mono">
                  educalizando.com.br/afiliado/
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

            {/* Descrição */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Descrição & Bio da Sua Vitrine
              </label>
              <textarea
                rows={3}
                {...register('descricao')}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm focus:outline-none"
                placeholder="Apresente sua experiência e o objetivo das suas recomendações..."
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
              <p className="text-[11px] text-slate-500 font-medium mt-1">Os compradores poderão falar com você direto pelo WhatsApp através da sua vitrine.</p>
              {errors.whatsapp && (
                <p className="text-xs text-rose-500 mt-1 font-medium">{errors.whatsapp.message}</p>
              )}
            </div>

            {/* Instagram */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Instagram da Vitrine
              </label>
              <input
                type="text"
                {...register('instagram')}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-1 transition-all"
                placeholder="@seuinstagram ou link completo"
              />
            </div>

            {/* YouTube */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Canal do YouTube
              </label>
              <input
                type="text"
                {...register('youtube')}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-1 transition-all"
                placeholder="https://youtube.com/@seucanal"
              />
            </div>

            {/* TikTok */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                TikTok
              </label>
              <input
                type="text"
                {...register('tiktok')}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-1 transition-all"
                placeholder="@seutiktok"
              />
            </div>

            {/* Facebook */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Página do Facebook
              </label>
              <input
                type="text"
                {...register('facebook')}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-1 transition-all"
                placeholder="https://facebook.com/suapagina"
              />
            </div>

            {/* Cor Primária */}
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

            {/* Upload do Logo */}
            <FileUpload
              label="Foto / Logo da Vitrine"
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

            {/* Upload do Banner */}
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
                  { id: 'default', name: 'Padrão (Default)', desc: 'Listagem com visual focado em produtos' }
                ].map(theme => (
                  <label 
                    key={theme.id}
                    className={`cursor-pointer flex flex-col p-3 rounded-xl border-2 transition-all ${
                      watchedTema === theme.id 
                        ? 'border-blue-600 bg-blue-50/50' 
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <input 
                        type="radio" 
                        value={theme.id} 
                        {...register('tema')} 
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-bold text-slate-900 text-sm">{theme.name}</span>
                    </div>
                    <span className="text-xs text-slate-500 pl-6">{theme.desc}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Validation Errors Alert */}
            {Object.keys(errors).length > 0 && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs flex flex-col gap-2 font-semibold">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                  <span>Não foi possível salvar. Verifique os erros abaixo:</span>
                </div>
                <ul className="list-disc pl-8 font-medium">
                  {errors.nome && <li>Nome da Vitrine: {errors.nome.message}</li>}
                  {errors.slug && <li>Slug (Link): {errors.slug.message}</li>}
                  {errors.cor_primaria && <li>Cor: {errors.cor_primaria.message}</li>}
                  {errors.whatsapp && <li>WhatsApp: {errors.whatsapp.message}</li>}
                </ul>
              </div>
            )}

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
                  <span>Salvar Configurações da Vitrine</span>
                </>
              )}
            </button>

          </form>
        </div>

        {/* Live Preview Panel (Real-time updates as user types or uploads files) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-500 tracking-wider">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Preview em Tempo Real da Sua Vitrine</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-lg space-y-4 sticky top-6">
            {/* Banner Preview */}
            <div className="h-32 bg-slate-800 relative overflow-hidden" style={{ backgroundColor: watchedCorPrimaria || '#1e293b' }}>
              {watchedBannerUrl ? (
                <img src={watchedBannerUrl} alt="Banner Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-white/10 flex items-center justify-center text-slate-200 text-xs font-bold">
                  Banner da Vitrine
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
                    {(watchedNome || 'L').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {watchedNome || 'Nome da Sua Vitrine'}
                </h3>
                <p className="text-xs text-blue-600 font-mono font-bold">
                  educalizando.com.br/afiliado/{watchedSlug || 'sua-vitrine'}
                </p>
                <p className="text-xs text-slate-500 line-clamp-2 mt-1 font-medium">
                  {watchedDescricao || 'Sua bio e apresentação oficial aparecerão aqui para os seus compradores.'}
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
