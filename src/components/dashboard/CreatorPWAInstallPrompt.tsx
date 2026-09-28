'use client';

import { useCallback, useEffect, useState } from 'react';
import { Download, Menu, Share, Smartphone, X } from 'lucide-react';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);

export default function CreatorPWAInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [showBrowserGuide, setShowBrowserGuide] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  const install = useCallback(async () => {
    if (isIos) {
      setShowIosGuide(true);
      return;
    }
    if (!installPrompt) {
      setShowBrowserGuide(true);
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') setIsInstalled(true);
    setInstallPrompt(null);
  }, [installPrompt, isIos]);

  useEffect(() => {
    if (isStandalone()) {
      setIsInstalled(true);
      return;
    }

    const appleDevice = /iPad|iPhone|iPod/.test(window.navigator.userAgent);
    setIsIos(appleDevice);

    // Remove o worker legado de escopo global caso ele tenha sido instalado em
    // versões antigas. A PWA do criador passa a cobrir somente /dashboard.
    if ('serviceWorker' in navigator) {
      void navigator.serviceWorker.getRegistrations()
        .then((registrations) => Promise.all(
          registrations
            .filter((registration) => new URL(registration.scope).pathname === '/')
            .map((registration) => registration.unregister()),
        ))
        .finally(() => navigator.serviceWorker.register('/dashboard-sw.js', { scope: '/dashboard' }));
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstallPrompt(null);
      setIsInstalled(true);
      setShowIosGuide(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  useEffect(() => {
    const handleInstallRequest = () => void install();
    window.addEventListener('creator-pwa-install', handleInstallRequest);
    return () => window.removeEventListener('creator-pwa-install', handleInstallRequest);
  }, [install]);

  if (isInstalled) return null;

  return (
    <>
      {showIosGuide && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/60 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="creator-pwa-ios-title">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-xs font-black uppercase tracking-wider text-blue-700">iPhone e iPad</p><h2 id="creator-pwa-ios-title" className="mt-1 text-xl font-black text-slate-900">Instale o Painel do Criador</h2></div>
              <button type="button" onClick={() => setShowIosGuide(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100" aria-label="Fechar instruções"><X className="h-5 w-5" /></button>
            </div>
            <ol className="mt-5 space-y-3 text-sm font-medium leading-relaxed text-slate-700">
              <li className="flex gap-3"><Share className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" /><span>1. No Safari, toque em <strong>Compartilhar</strong>.</span></li>
              <li className="flex gap-3"><Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" /><span>2. Escolha <strong>Adicionar à Tela de Início</strong>.</span></li>
            </ol>
            <button type="button" onClick={() => setShowIosGuide(false)} className="mt-6 min-h-11 w-full rounded-xl bg-slate-900 px-4 text-sm font-black text-white">Entendi</button>
          </div>
        </div>
      )}

      {showBrowserGuide && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/60 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="creator-pwa-browser-title">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-xs font-black uppercase tracking-wider text-blue-700">Instalação do aplicativo</p><h2 id="creator-pwa-browser-title" className="mt-1 text-xl font-black text-slate-900">Adicione o Painel do Criador</h2></div>
              <button type="button" onClick={() => setShowBrowserGuide(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100" aria-label="Fechar instruções"><X className="h-5 w-5" /></button>
            </div>
            <ol className="mt-5 space-y-3 text-sm font-medium leading-relaxed text-slate-700">
              <li className="flex gap-3"><Download className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" /><span>1. No computador, clique no ícone de <strong>instalar</strong> ao lado da barra de endereço.</span></li>
              <li className="flex gap-3"><Menu className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" /><span>2. No celular, abra o menu do navegador e escolha <strong>Instalar aplicativo</strong> ou <strong>Adicionar à tela inicial</strong>.</span></li>
            </ol>
            <p className="mt-4 rounded-xl bg-blue-50 p-3 text-xs font-medium leading-relaxed text-blue-900">Quando o navegador concluir a preparação, este botão abrirá a instalação automaticamente.</p>
            <button type="button" onClick={() => void install()} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 text-sm font-black text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">
              <Download className="h-5 w-5" /> Instalar aplicativo
            </button>
          </div>
        </div>
      )}
    </>
  );
}
