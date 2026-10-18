'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { createPlatformMetrics, isMetricsPage, isPurchaseConfirmation, metricsPageContext, PLATFORM_CONSENT_KEY, PLATFORM_GA4_ID, type MetricsConsent } from '@/lib/platform-analytics';
import type { TrackingBrowser } from '@/lib/store-analytics-events';

export default function PlatformAnalytics() {
  const pathname = usePathname() || '';
  const [consent, setConsent] = useState<MetricsConsent>(null);
  const [restored, setRestored] = useState(false);
  const [preferences, setPreferences] = useState(false);
  const metrics = useMemo(() => createPlatformMetrics(() => window as typeof window & TrackingBrowser), []);
  const publicPage = isMetricsPage(pathname);
  const eligible = publicPage || isPurchaseConfirmation(pathname);

  useEffect(() => {
    let choice: MetricsConsent = null;
    try { const stored = localStorage.getItem(PLATFORM_CONSENT_KEY); if (stored === 'accepted' || stored === 'rejected') choice = stored; } catch { /* Local consent still works when storage is unavailable. */ }
    metrics.consent(choice); setConsent(choice); setRestored(true);
  }, [metrics]);

  useEffect(() => {
    const listener = (event: Event) => metrics.event((event as CustomEvent).detail, pathname);
    window.addEventListener('educalizando:tracking', listener);
    return () => window.removeEventListener('educalizando:tracking', listener);
  }, [metrics, pathname]);

  useEffect(() => {
    if (consent === 'accepted') metrics.page(pathname, document.referrer, window.location.search);
  }, [metrics, pathname, consent]);

  function choose(choice: Exclude<MetricsConsent, null>) {
    // Disabling this destination also stops a previously loaded SDK after withdrawal or private navigation.
    const browser = window as typeof window & Record<string, unknown>;
    browser[`ga-disable-${PLATFORM_GA4_ID}`] = choice !== 'accepted';
    try { localStorage.setItem(PLATFORM_CONSENT_KEY, choice); } catch { /* Never interrupt a visit. */ }
    metrics.consent(choice); setConsent(choice); setPreferences(false);
  }

  useEffect(() => {
    (window as typeof window & Record<string, unknown>)[`ga-disable-${PLATFORM_GA4_ID}`] = consent !== 'accepted' || !eligible;
  }, [consent, eligible]);

  if (!restored) return null;
  // Direct shop visitors keep the shop's own consent. Platform preferences remain independent.
  const showBanner = publicPage && (preferences || (consent === null && !pathname.startsWith('/loja/')));
  return <>
    {eligible && consent === 'accepted' && <>
      <Script id="educalizando-ga4-init" strategy="afterInteractive" onReady={() => queueMicrotask(() => metrics.ready())}>{`
        window.dataLayer=window.dataLayer||[];
        window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};
        window.gtag('js',new Date());
        window.gtag('config','${PLATFORM_GA4_ID}',${JSON.stringify({ ...metricsPageContext(pathname, typeof document === 'undefined' ? '' : document.referrer, typeof window === 'undefined' ? '' : window.location.search), send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false, cookie_prefix: 'educalizando_platform' })});
      `}</Script>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${PLATFORM_GA4_ID}`} strategy="afterInteractive" />
    </>}
    {showBanner ? <section aria-label="Preferências de métricas da Educalizando" className="fixed inset-x-3 bottom-3 z-[101] mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
      <p className="text-sm font-black text-slate-900">Você permite medir sua visita?</p>
      <p className="mt-1 text-xs leading-6 text-slate-600">Com sua permissão, a Educalizando usa Google Analytics para entender visitas, campanhas e compras confirmadas. Não enviamos nome, e-mail ou documentos. Sua escolha não impede a compra. <a href="/privacidade#metricas" className="font-bold underline">Saiba mais</a>.</p>
      <div className="mt-3 flex flex-wrap gap-2"><button onClick={() => choose('accepted')} className="min-h-11 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white">Aceitar métricas</button><button onClick={() => choose('rejected')} className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-800">Recusar métricas</button></div>
    </section> : publicPage && <button onClick={() => setPreferences(true)} className="fixed bottom-2 left-2 z-40 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm">Preferências de métricas</button>}
  </>;
}
