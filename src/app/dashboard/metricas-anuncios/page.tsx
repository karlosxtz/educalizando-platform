'use client';

import { useEffect, useState } from 'react';
import { BarChart3, CheckCircle2, ExternalLink, Info, LineChart, Loader2, Save, Target } from 'lucide-react';
import { toast } from 'sonner';
import { getCurrentCreatorStore, updateStore } from '@/lib/store-service';
import type { Store } from '@/lib/types';

const META_EVENTS_MANAGER_URL = 'https://business.facebook.com/events_manager2/list/pixel/';
const GOOGLE_ANALYTICS_URL = 'https://analytics.google.com/analytics/web/';
const GOOGLE_HELP_URL = 'https://support.google.com/analytics/answer/9539598';

function TrackingStatus({ configured }: { configured: boolean }) {
  return configured ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Configurado</span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800"><Info className="h-3.5 w-3.5" /> A configurar</span>
  );
}

export default function MetricsAndAdsPage() {
  const [store, setStore] = useState<Store | null>(null);
  const [metaPixelId, setMetaPixelId] = useState('');
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const currentStore = await getCurrentCreatorStore();
        setStore(currentStore);
        setMetaPixelId(currentStore.meta_pixel_id || '');
        setGoogleAnalyticsId(currentStore.google_analytics_id || '');
      } catch {
        toast.error('Não foi possível carregar as métricas da loja.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    if (!store) return;
    const cleanMeta = metaPixelId.trim();
    const cleanGa = googleAnalyticsId.trim().toUpperCase();
    if (cleanMeta && !/^\d{5,20}$/.test(cleanMeta)) {
      toast.error('O ID do Meta Pixel deve conter somente números.');
      return;
    }
    if (cleanGa && !/^G-[A-Z0-9]+$/.test(cleanGa)) {
      toast.error('O ID do Google Analytics precisa começar com G-.');
      return;
    }
    setSaving(true);
    try {
      const updated = await updateStore(store.id, {
        meta_pixel_id: cleanMeta || null,
        google_analytics_id: cleanGa || null,
      });
      setStore(updated);
      toast.success('Métricas e anúncios salvos na sua vitrine.');
    } catch (error: any) {
      toast.error(error?.message || 'Não foi possível salvar os códigos agora.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex min-h-[45vh] items-center justify-center text-slate-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando módulo...</div>;

  return <div className="mx-auto max-w-6xl space-y-6 pb-10">
    <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-700 via-blue-700 to-cyan-600 p-7 text-white shadow-xl sm:p-10">
      <div className="absolute -right-14 -top-14 h-56 w-56 rounded-full bg-white/10" />
      <div className="relative max-w-3xl">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-black"><BarChart3 className="h-4 w-4" /> CRESÇA COM DADOS</span>
        <h1 className="mt-4 text-3xl font-black sm:text-4xl">Métricas e anúncios</h1>
        <p className="mt-3 text-base text-blue-50 sm:text-lg">Conecte Meta Pixel e Google Analytics 4 à sua vitrine para acompanhar visitas e melhorar suas campanhas.</p>
      </div>
    </section>

    <section className="grid gap-4 md:grid-cols-3">
      <article className="rounded-2xl border bg-white p-5 shadow-sm"><Target className="h-6 w-6 text-blue-600" /><p className="mt-3 font-black">Meta Pixel</p><div className="mt-2"><TrackingStatus configured={Boolean(metaPixelId)} /></div></article>
      <article className="rounded-2xl border bg-white p-5 shadow-sm"><LineChart className="h-6 w-6 text-indigo-600" /><p className="mt-3 font-black">Google Analytics 4</p><div className="mt-2"><TrackingStatus configured={Boolean(googleAnalyticsId)} /></div></article>
      <article className="rounded-2xl border border-blue-100 bg-blue-50 p-5"><Info className="h-6 w-6 text-blue-700" /><p className="mt-3 font-black text-blue-950">Onde os dados aparecem</p><p className="mt-1 text-sm text-blue-800">Nos painéis oficiais da Meta e do Google, não dentro da Educalizando.</p></article>
    </section>

    <section className="rounded-3xl border bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-black uppercase tracking-widest text-blue-600">Configuração da vitrine</p><h2 className="mt-1 text-2xl font-black">Cole seus identificadores</h2></div><p className="max-w-md text-sm text-slate-500">Eles são usados somente na loja pública de {store?.nome_loja || 'sua loja'}.</p></div>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 p-5"><div className="flex items-center justify-between gap-3"><h3 className="font-black">Meta Pixel</h3><a href={META_EVENTS_MANAGER_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-bold text-blue-700 hover:underline">Abrir Meta <ExternalLink className="h-3.5 w-3.5" /></a></div><label className="mt-5 block text-sm font-bold text-slate-700">ID do Pixel</label><input value={metaPixelId} onChange={(event) => setMetaPixelId(event.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="Ex.: 123456789012345" className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /><p className="mt-2 text-xs text-slate-500">Cole apenas o número do Pixel — não cole o código inteiro.</p></div>
        <div className="rounded-2xl border border-slate-200 p-5"><div className="flex items-center justify-between gap-3"><h3 className="font-black">Google Analytics 4</h3><a href={GOOGLE_ANALYTICS_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-bold text-blue-700 hover:underline">Abrir Analytics <ExternalLink className="h-3.5 w-3.5" /></a></div><label className="mt-5 block text-sm font-bold text-slate-700">ID de medição</label><input value={googleAnalyticsId} onChange={(event) => setGoogleAnalyticsId(event.target.value.toUpperCase())} placeholder="Ex.: G-ABC123XYZ" className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /><p className="mt-2 text-xs text-slate-500">Use o identificador que começa com <b>G-</b>.</p></div>
      </div>
      <button onClick={() => void save()} disabled={saving} className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-blue-700 px-5 font-black text-white shadow-sm transition hover:bg-blue-800 disabled:opacity-60"><Save className="h-4 w-4" />{saving ? 'Salvando...' : 'Salvar métricas e anúncios'}</button>
    </section>

    <section className="grid gap-5 lg:grid-cols-2">
      <article className="rounded-3xl border bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 font-black text-blue-700">1</span><div><h2 className="font-black">Como pegar o ID do Meta Pixel</h2><p className="text-sm text-slate-500">Para anúncios e medição no ecossistema Meta.</p></div></div><ol className="mt-5 space-y-3 text-sm leading-6 text-slate-700"><li><b>1.</b> Abra o Gerenciador de Eventos no botão acima.</li><li><b>2.</b> Crie ou selecione uma fonte de dados para <b>Web</b>.</li><li><b>3.</b> Abra seu Pixel e copie o <b>ID do Pixel</b>, composto apenas por números.</li><li><b>4.</b> Cole o número nesta tela e clique em salvar.</li></ol><a href={META_EVENTS_MANAGER_URL} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-black text-blue-700 hover:underline">Ir para o Gerenciador de Eventos <ExternalLink className="h-4 w-4" /></a></article>
      <article className="rounded-3xl border bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 font-black text-indigo-700">2</span><div><h2 className="font-black">Como pegar o ID do Google Analytics</h2><p className="text-sm text-slate-500">Para acompanhar o tráfego da sua vitrine.</p></div></div><ol className="mt-5 space-y-3 text-sm leading-6 text-slate-700"><li><b>1.</b> Abra o Google Analytics e escolha ou crie uma propriedade GA4.</li><li><b>2.</b> Vá em <b>Administração → Fluxos de dados</b>.</li><li><b>3.</b> Selecione o fluxo <b>Web</b> da sua loja.</li><li><b>4.</b> Copie o ID de medição que começa com <b>G-</b>, cole aqui e salve.</li></ol><div className="mt-5 flex flex-wrap gap-4"><a href={GOOGLE_ANALYTICS_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-black text-blue-700 hover:underline">Abrir Google Analytics <ExternalLink className="h-4 w-4" /></a><a href={GOOGLE_HELP_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-black text-blue-700 hover:underline">Ver tutorial do Google <ExternalLink className="h-4 w-4" /></a></div></article>
    </section>

    <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950"><h2 className="font-black">Como testar depois de salvar</h2><p className="mt-2 leading-6">Abra sua vitrine em uma nova aba, aceite o aviso de métricas e navegue por uma página de produto. Depois confira os eventos no Gerenciador de Eventos da Meta ou no relatório em tempo real do Google Analytics. Os dados podem levar alguns minutos para aparecer nas plataformas externas.</p></section>
  </div>;
}
