"use client";

import { useEffect, useState } from 'react';
import { X, ExternalLink, Info, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';

interface BannerData {
  id: string;
  title: string | null;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  link_url: string | null;
  link_text: string | null;
}

export default function SystemBanners() {
  const [banners, setBanners] = useState<BannerData[]>([]);

  useEffect(() => {
    async function fetchActiveBanners() {
      try {
        const res = await fetch('/api/banners/active');
        const data = await res.json();
        
        if (data.success && data.banners && data.banners.length > 0) {
          // Filtra apenas os que não foram fechados pelo usuário no localStorage
          const activeAndNotDismissed = data.banners.filter((b: BannerData) => {
            const isDismissed = localStorage.getItem(`dismissed_banner_${b.id}`);
            return !isDismissed;
          });
          
          setBanners(activeAndNotDismissed);
        }
      } catch (e) {
        console.error('Erro ao buscar avisos globais:', e);
      }
    }
    fetchActiveBanners();
  }, []);

  if (banners.length === 0) return null;

  const handleDismiss = (id: string) => {
    localStorage.setItem(`dismissed_banner_${id}`, 'true');
    setBanners(banners.filter(b => b.id !== id));
  };

  const getStyle = (type: string) => {
    switch (type) {
      case 'info':
        return { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800', icon: <Info className="w-5 h-5 text-blue-600 shrink-0" /> };
      case 'warning':
        return { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-800', icon: <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0" /> };
      case 'error':
        return { bg: 'bg-red-50 border-red-200', text: 'text-red-800', icon: <AlertCircle className="w-5 h-5 text-red-600 shrink-0" /> };
      case 'success':
        return { bg: 'bg-green-50 border-green-200', text: 'text-green-800', icon: <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" /> };
      default:
        return { bg: 'bg-slate-50 border-slate-200', text: 'text-slate-800', icon: <Info className="w-5 h-5 text-slate-600 shrink-0" /> };
    }
  };

  return (
    <div className="flex flex-col gap-3 mb-6">
      {banners.map((banner) => {
        const style = getStyle(banner.type);
        
        return (
          <div 
            key={banner.id} 
            className={`relative flex items-start sm:items-center gap-3 p-4 rounded-xl border ${style.bg} ${style.text} shadow-sm transition-all`}
          >
            {style.icon}
            
            <div className="flex-1 pr-8">
              {banner.title && <h4 className="font-bold mb-0.5">{banner.title}</h4>}
              <p className="text-sm opacity-90 leading-relaxed">
                {banner.message}
                {banner.link_url && (
                  <a 
                    href={banner.link_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-bold underline underline-offset-2 ml-2 hover:opacity-80 transition-opacity"
                  >
                    {banner.link_text || 'Saiba mais'}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </p>
            </div>

            <button 
              onClick={() => handleDismiss(banner.id)}
              className="absolute top-3 right-3 sm:top-1/2 sm:-translate-y-1/2 p-1.5 rounded-lg opacity-60 hover:opacity-100 hover:bg-black/5 transition-all"
              aria-label="Fechar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
