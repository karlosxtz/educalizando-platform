'use client';

import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Store as StoreIcon, Copy, ExternalLink, Check, Save, 
  Palette, Image as ImageIcon, Sparkles, Loader2 
} from 'lucide-react';

import { storeSettingsSchema, type StoreSettingsFormValues } from '@/lib/zod-schemas';
import { getStoreByCreatorId, updateStore } from '@/lib/store-service';
import { Store } from '@/lib/types';

export default function StoreSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<StoreSettingsFormValues>({
    resolver: zodResolver(storeSettingsSchema),
    defaultValues: {
      nome_loja: '',
      slug: '',
      descricao: '',
      logo_url: '',
      banner_url: '',
      cor_primaria: '#ff5722'
    }
  });

  const watchNome = watch('nome_loja');
  const watchSlug = watch('slug');
  const watchDescricao = watch('descricao');
  const watchLogo = watch('logo_url');
  const watchBanner = watch('banner_url');
  const watchColor = watch('cor_primaria');

  useEffect(() => {
    async function loadStoreData() {
      try {
        const store = await getStoreByCreatorId('creator-ricardo');
        setCurrentStore(store);
        reset({
          nome_loja: store.nome_loja,
          slug: store.slug,
          descricao: store.descricao || '',
          logo_url: store.logo_url || '',
          banner_url: store.banner_url || '',
          cor_primaria: store.cor_primaria || '#ff5722'
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStoreData();
  }, [reset]);

  const publicUrl = `https://educalizando.com.br/loja/${watchSlug || 'sua-loja'}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const onSubmit: SubmitHandler<StoreSettingsFormValues> = async (values) => {
    if (!currentStore) return;
    try {
      const updated = await updateStore(currentStore.id, {
        nome_loja: values.nome_loja,
        slug: values.slug,
        descricao: values.descricao,
        logo_url: values.logo_url,
        banner_url: values.banner_url,
        cor_primaria: values.cor_primaria
      });
      setCurrentStore(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar configurações da loja.');
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
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-3">
            <StoreIcon className="w-7 h-7 text-blue-600" /> Configuração da Sua Loja
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Personalize o nome, logo, cores e banner da sua vitrine exclusiva de materiais didáticos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center gap-2 transition-all"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
            <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link da Loja'}</span>
          </button>

          <a
            href={`/loja/${watchSlug || 'prof-ricardo'}`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 shadow-md shadow-emerald-500/20 transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Abrir Loja Pública</span>
          </a>
        </div>
      </div>

      {/* Main Grid: Form Left, Live Preview Right */}
      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* Left Form */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
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

            {/* URL da Logo */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-slate-500" /> URL da Foto / Logo
              </label>
              <input
                type="text"
                {...register('logo_url')}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm focus:outline-none"
                placeholder="https://..."
              />
            </div>

            {/* URL do Banner */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-slate-500" /> URL da Imagem do Banner
              </label>
              <input
                type="text"
                {...register('banner_url')}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm focus:outline-none"
                placeholder="https://..."
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-200">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Salvar Alterações da Loja</span>
              </button>
            </div>

          </form>
        </div>

        {/* Right Live Preview Panel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" /> Live Preview da Vitrine
            </span>
            <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Sincronizado
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-lg sticky top-8">
            {/* Banner Preview */}
            <div className="h-32 relative bg-slate-100 overflow-hidden">
              {watchBanner ? (
                <img src={watchBanner} alt="Banner Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-slate-800 via-indigo-900 to-slate-800 flex items-center justify-center text-slate-400 text-xs font-semibold">
                  Banner da Loja
                </div>
              )}
            </div>

            {/* Profile Info Preview */}
            <div className="p-5 relative space-y-4 -mt-10 bg-white">
              <div className="flex items-end gap-3">
                <div className="w-16 h-16 rounded-full bg-white p-0.5 border-2 border-white shadow-md overflow-hidden flex-shrink-0">
                  {watchLogo ? (
                    <img src={watchLogo} alt="Logo Preview" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl">
                      {watchNome ? watchNome.charAt(0).toUpperCase() : 'L'}
                    </div>
                  )}
                </div>
                <div className="pb-1">
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    {watchNome || 'Nome da Sua Loja'}
                  </h3>
                  <span 
                    className="text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider inline-block mt-0.5"
                    style={{ backgroundColor: `${watchColor}15`, color: watchColor }}
                  >
                    LOJA VERIFICADA
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2">
                {watchDescricao || 'Descrição e bio da sua loja aparecerão aqui para os alunos...'}
              </p>

              {/* Sample Product Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex gap-3 items-center">
                <div className="w-14 h-14 rounded-lg bg-slate-200 flex-shrink-0 overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=150&q=80" alt="Material" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: watchColor }}>
                    PDF Didático
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 truncate">Combo Exemplo de Apostila</h4>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs font-black text-slate-900">R$ 49,90</span>
                    <button 
                      className="px-2.5 py-1 rounded text-[10px] font-bold text-white shadow-xs"
                      style={{ backgroundColor: watchColor }}
                    >
                      Comprar
                    </button>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
