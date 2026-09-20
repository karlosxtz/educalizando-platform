'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

type TrackingProduct = { productId: string; title: string; price: number; currency?: string };
type TrackingDetail = { event: 'AddToCart' | 'InitiateCheckout' | 'Purchase'; storeId: string; product?: TrackingProduct; value?: number; currency?: string; transactionId?: string };
type Props = { storeId: string; metaPixelId?: string | null; googleAnalyticsId?: string | null; viewContent?: TrackingProduct };

function sendTrackingEvent(event: 'ViewContent' | TrackingDetail['event'], detail: Omit<TrackingDetail, 'event' | 'storeId'> & { product?: TrackingProduct }) {
  const product = detail.product;
  const currency = detail.currency || product?.currency || 'BRL';
  const payload = {
    currency,
    value: Number(detail.value ?? product?.price ?? 0),
    content_ids: product ? [product.productId] : undefined,
    content_name: product?.title,
    content_type: product ? 'product' : undefined,
    transaction_id: detail.transactionId,
  };
  const browser = window as typeof window & { fbq?: (...args: unknown[]) => void; gtag?: (...args: unknown[]) => void };
  const googleEvent: Record<string, string> = {
    ViewContent: 'view_item',
    AddToCart: 'add_to_cart',
    InitiateCheckout: 'begin_checkout',
    Purchase: 'purchase',
  };
  browser.fbq?.('track', event, payload, detail.transactionId ? { eventID: detail.transactionId } : undefined);
  browser.gtag?.('event', googleEvent[event], payload);
}

export default function StoreAnalytics({ storeId, metaPixelId, googleAnalyticsId, viewContent }: Props) {
  const hasTracking = Boolean(metaPixelId || googleAnalyticsId);
  const storageKey = `educalizando_metrics_consent_${storeId}`;
  const [consent, setConsent] = useState<'accepted' | 'rejected' | null>(null);
  const viewedProduct = useRef<string | null>(null);

  useEffect(() => {
    if (hasTracking) setConsent(localStorage.getItem(storageKey) as 'accepted' | 'rejected' | null);
  }, [hasTracking, storageKey]);

  useEffect(() => {
    if (consent !== 'accepted') return;
    const onTrackingEvent = (event: Event) => {
      const detail = (event as CustomEvent<TrackingDetail>).detail;
      if (!detail || detail.storeId !== storeId) return;
      sendTrackingEvent(detail.event, detail);
    };
    window.addEventListener('educalizando:tracking', onTrackingEvent);
    return () => window.removeEventListener('educalizando:tracking', onTrackingEvent);
  }, [consent, storeId]);

  useEffect(() => {
    if (consent !== 'accepted' || !viewContent || viewedProduct.current === viewContent.productId) return;
    viewedProduct.current = viewContent.productId;
    sendTrackingEvent('ViewContent', { product: viewContent });
  }, [consent, viewContent]);

  if (!hasTracking) return null;
  const accept = () => { localStorage.setItem(storageKey, 'accepted'); setConsent('accepted'); };
  const reject = () => { localStorage.setItem(storageKey, 'rejected'); setConsent('rejected'); };

  return <>
    {consent === 'accepted' && googleAnalyticsId && <><Script src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`} strategy="afterInteractive" /><Script id={`ga4-${storeId}`} strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config','${googleAnalyticsId}',{anonymize_ip:true});`}</Script></>}
    {consent === 'accepted' && metaPixelId && <Script id={`meta-pixel-${storeId}`} strategy="afterInteractive">{`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaPixelId}');fbq('track','PageView');`}</Script>}
    {consent === null && <div className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:bottom-5"><p className="text-sm font-black text-slate-900">Esta loja usa métricas de navegação</p><p className="mt-1 text-xs leading-relaxed text-slate-600">Com sua permissão, usamos Meta Pixel e/ou Google Analytics para medir visitas e melhorar campanhas.</p><div className="mt-3 flex flex-wrap gap-2"><button onClick={accept} className="min-h-10 rounded-xl bg-slate-900 px-4 text-xs font-black text-white">Aceitar métricas</button><button onClick={reject} className="min-h-10 rounded-xl border border-slate-200 px-4 text-xs font-black text-slate-700">Recusar</button></div></div>}
  </>;
}
