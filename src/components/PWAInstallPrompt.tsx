'use client';

import { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, Sparkles } from 'lucide-react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('PWA Service Worker registered:', reg.scope))
        .catch((err) => console.error('PWA SW registration failed:', err));
    }

    // Check iOS
    const ua = window.navigator.userAgent;
    const isAppleIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    
    if (isAppleIOS && !isStandalone) {
      setIsIOS(true);
      // Show prompt after 4 seconds on mobile iOS if not installed
      const timer = setTimeout(() => setShowPrompt(true), 4000);
      return () => clearTimeout(timer);
    }

    // Listen for BeforeInstallPromptEvent (Android / Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('PWA Choice outcome:', outcome);
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <>
      {/* Floating Bottom PWA Install Banner */}
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl border border-slate-800 shadow-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-brand-navy p-1.5 border border-brand-teal/30 flex items-center justify-center flex-shrink-0 shadow-xs">
              <img src="/branding/logo-educalizando-icon.png" alt="" aria-hidden="true" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block truncate flex items-center gap-1">
                Educalizando App <Sparkles className="w-3 h-3 text-brand-teal" />
              </span>
              <span className="text-[11px] text-slate-400 block truncate">
                Instale para acessar offline no seu celular
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3.5 py-2 rounded-xl bg-brand-navy hover:bg-brand-navy-hover text-white text-xs font-bold shadow-sm border border-brand-teal/30 flex items-center gap-1.5 transition-all min-h-[44px]"
            >
              <Download className="w-4 h-4 text-brand-teal" />
              <span>Instalar</span>
            </button>

            <button
              onClick={() => setShowPrompt(false)}
              className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Fechar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Modal Guide */}
      {showIOSGuide && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl p-6 max-w-sm w-full space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-brand-navy border border-slate-200 flex items-center justify-center mx-auto">
              <Download className="w-6 h-6 text-brand-teal" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-900">Como instalar no iPhone / iOS</h3>
              <p className="text-xs text-slate-600 font-medium">Siga estes 2 passos simples no Safari:</p>
            </div>

            <div className="space-y-3 text-xs font-semibold text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-brand-navy font-bold flex items-center justify-center flex-shrink-0">
                  <Share className="w-4 h-4 text-brand-navy" />
                </div>
                <span>1. Toque no ícone de <strong>Compartilhar</strong> na barra inferior do Safari.</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-brand-navy font-bold flex items-center justify-center flex-shrink-0">
                  <PlusSquare className="w-4 h-4 text-brand-navy" />
                </div>
                <span>2. Role para baixo e selecione <strong>Adicionar à Tela de Início</strong>.</span>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-3 rounded-xl font-bold bg-brand-navy text-white text-xs"
            >
              Entendido!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
