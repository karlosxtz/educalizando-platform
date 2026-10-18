'use client';

import Script from 'next/script';
import { captureStoreAttribution, readStoreAttribution } from '@/lib/store-webhook-contract';
import { useEffect,useMemo,useRef,useState } from 'react';
import { createStoreTracking, trackingIds, type TrackingBrowser, type TrackingProduct } from '@/lib/store-analytics-events';
type Props = { storeId: string; metaPixelId?: string | null; googleAnalyticsId?: string | null; viewContent?: TrackingProduct };

function currentCampaignParameters(storeId: string) {
  captureStoreAttribution(storeId);
  const campaign = readStoreAttribution(storeId);
  return Object.fromEntries(Object.entries(campaign).filter(([key]) => key.startsWith('utm_')));
}

export default function StoreAnalytics({ storeId, metaPixelId, googleAnalyticsId, viewContent }: Props) {
  const ids = useMemo(() => trackingIds(metaPixelId, googleAnalyticsId), [metaPixelId, googleAnalyticsId]);
  const hasTracking = Boolean(ids.meta || ids.google);
  const storageKey = `educalizando_metrics_consent_${storeId}`;
  const [choice, setChoice] = useState<{ key: string; value: 'accepted' | 'rejected' | null } | null>(null);
  const consent = choice?.key === storageKey ? choice.value : null;
  const viewedProduct = useRef<string | null>(null);
  const tracking = useMemo(() => createStoreTracking(storeId, ids, () => window as typeof window & TrackingBrowser, () => currentCampaignParameters(storeId)), [storeId, ids]);

  // Listen before restoring consent: payment confirmation may arrive while the SDK initializes.
  useEffect(() => {
    const onTrackingEvent = (event: Event) => tracking.enqueue((event as CustomEvent).detail);
    window.addEventListener('educalizando:tracking', onTrackingEvent);
    return () => window.removeEventListener('educalizando:tracking', onTrackingEvent);
  }, [tracking]);

  useEffect(() => {
    captureStoreAttribution(storeId);
    viewedProduct.current = null;
    let value: 'accepted' | 'rejected' | null = null;
    try { const stored = localStorage.getItem(storageKey); if (stored === 'accepted' || stored === 'rejected') value = stored; } catch { /* Consent still works for this page without storage. */ }
    tracking.consent(value);
    setChoice({ key: storageKey, value });
  }, [storeId, storageKey, tracking]);

  useEffect(() => {
    const key = `${storeId}:${viewContent?.productId}`;
    if (consent !== 'accepted' || !viewContent || viewedProduct.current === key) return;
    viewedProduct.current = key;
    tracking.enqueue({ event: 'ViewContent', storeId, product: viewContent });
  }, [consent, viewContent, storeId, tracking]);

  if (!hasTracking) return null;
  const choose = (value: 'accepted' | 'rejected') => {
    try { localStorage.setItem(storageKey, value); } catch { /* Do not break the store when browser storage is blocked. */ }
    tracking.consent(value); setChoice({ key: storageKey, value });
  };
  const accept = () => choose('accepted');
  const reject = () => choose('rejected');
  // Vinext calls inline Script.onReady before inserting the script element.
  // A microtask also works in Next and runs after the inline SDK queue is created.
  const ready = (destination: 'google' | 'meta') => queueMicrotask(() => tracking.ready(destination));

  return <>
    {consent === 'accepted' && ids.google && <><Script src={`https://www.googletagmanager.com/gtag/js?id=${ids.google}`} strategy="afterInteractive" /><Script id={`ga4-${storeId}-${ids.google}`} onReady={() => ready('google')} strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config','${ids.google}',{anonymize_ip:true});`}</Script></>}
    {consent === 'accepted' && ids.meta && <Script id={`meta-pixel-${storeId}-${ids.meta}`} onReady={() => ready('meta')} strategy="afterInteractive">{`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${ids.meta}');fbq('trackSingle','${ids.meta}','PageView');`}</Script>}
    {consent === null && <div className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:bottom-5"><p className="text-sm font-black text-slate-900">Esta loja usa métricas de navegação</p><p className="mt-1 text-xs leading-relaxed text-slate-600">Com sua permissão, usamos Meta Pixel e/ou Google Analytics para medir visitas e melhorar campanhas.</p><div className="mt-3 flex flex-wrap gap-2"><button onClick={accept} className="min-h-10 rounded-xl bg-slate-900 px-4 text-xs font-black text-white">Aceitar métricas</button><button onClick={reject} className="min-h-10 rounded-xl border border-slate-200 px-4 text-xs font-black text-slate-700">Recusar</button></div></div>}
  </>;
}
