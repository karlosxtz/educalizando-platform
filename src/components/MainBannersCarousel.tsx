'use client';

import CatalogImage from '@/components/ui/CatalogImage';

import type { MainBanner } from '@/lib/banners-service';
import { catalogImageUrl } from '@/lib/catalog-image-url';
import { ChevronLeft,ChevronRight,Search,Pause,Play } from 'lucide-react';
import Link from 'next/link';
import { useEffect,useRef,useState } from 'react';

export default function MainBannersCarousel({ banners }: { banners: MainBanner[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const carousel = useRef<HTMLElement>(null);

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => setReducedMotion(motion.matches);
    syncMotion();
    motion.addEventListener('change', syncMotion);
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(entries => {
      setVisible(entries.some(entry => entry.isIntersecting));
    });
    if (carousel.current) observer?.observe(carousel.current);
    if (!observer) setVisible(true);
    return () => { motion.removeEventListener('change', syncMotion); observer?.disconnect(); };
  }, [banners.length]);

  useEffect(() => {
    if (isHovered || paused || !visible || reducedMotion || !banners || banners.length <= 1) return;
    const interval = setInterval(() => {
      if (document.hidden) return;
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length, isHovered, paused, visible, reducedMotion]);

  // Se não houver banners, renderiza o Hero original como fallback
  if (!banners || banners.length === 0) {
    return (
      <section className="w-full bg-gradient-to-r from-blue-900 to-blue-700 pt-20 pb-24 overflow-hidden relative">
        <div className="absolute inset-0 bg-black/5"></div>
        <div className="absolute top-10 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6 py-16">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight tracking-tight max-w-4xl mx-auto drop-shadow-sm">
            Materiais didáticos para <span className="text-cyan-300">apoiar sua aula</span>
          </h2>
          <p className="text-lg sm:text-xl text-blue-50 font-medium max-w-2xl mx-auto drop-shadow-sm">
            Explore atividades, apostilas, jogos e recursos digitais disponíveis no catálogo.
          </p>
          <div className="pt-6">
            <Link href="/buscar" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-900 hover:bg-slate-50 font-black rounded-full shadow-xl shadow-blue-900/20 transition-transform hover:-translate-y-1 text-lg">
              <Search className="w-5 h-5" /> Explorar Materiais
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % banners.length);
  const handlePrev = () => setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));

  const activeBanner = banners[currentIndex % banners.length];

  return (
    <section 
      ref={carousel}
      aria-label="Campanhas em destaque"
      className="w-full relative overflow-hidden aspect-[21/9] bg-slate-50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setIsHovered(true)}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setIsHovered(false); }}
    >
        <div
          key={activeBanner.id}
          className="absolute inset-0 w-full h-full"
        >
          {activeBanner.link_url ? (
            <Link prefetch={false} href={activeBanner.link_url} className="block w-full h-full">
              <picture className="w-full h-full">
                {activeBanner.image_mobile_url && (
                  <source media="(max-width: 768px)" srcSet={catalogImageUrl(activeBanner.image_mobile_url) || undefined} />
                )}
                <CatalogImage 
                  src={catalogImageUrl(activeBanner.image_desktop_url) || undefined}
                  thumbnail={false} loading="lazy" fetchPriority="auto" decoding="async"
                  alt={activeBanner.title || 'Banner principal'} 
                  className="w-full h-full object-contain object-center"
                />
              </picture>
            </Link>
          ) : (
            <picture className="w-full h-full">
              {activeBanner.image_mobile_url && (
                <source media="(max-width: 768px)" srcSet={catalogImageUrl(activeBanner.image_mobile_url) || undefined} />
              )}
              <CatalogImage 
                src={catalogImageUrl(activeBanner.image_desktop_url) || undefined}
                thumbnail={false} loading="lazy" fetchPriority="auto" decoding="async"
                alt={activeBanner.title || 'Banner principal'} 
                className="w-full h-full object-contain object-center"
              />
            </picture>
          )}
        </div>

      {/* Controles: Setas e Dots (só aparecem se tiver mais de 1 banner) */}
      {banners.length > 1 && (
        <>
          <button type="button" onClick={() => setPaused(value => !value)} aria-label={paused ? 'Reproduzir banners' : 'Pausar banners'} aria-pressed={paused} className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white text-blue-900 shadow-sm">
            {paused ? <Play aria-hidden="true" className="h-5 w-5" /> : <Pause aria-hidden="true" className="h-5 w-5" />}
          </button>
          <button 
            onClick={handlePrev}
            aria-label="Banner anterior"
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md flex items-center justify-center text-white transition-all opacity-0 md:opacity-100 focus:opacity-100 group-hover/section:opacity-100 z-10 shadow-sm"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button 
            onClick={handleNext}
            aria-label="Próximo banner"
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md flex items-center justify-center text-white transition-all opacity-0 md:opacity-100 focus:opacity-100 group-hover/section:opacity-100 z-10 shadow-sm"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 shadow-sm ${
                  idx === currentIndex ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`Ir para o banner ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
