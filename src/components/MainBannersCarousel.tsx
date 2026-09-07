'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import Link from 'next/link';
import { MainBanner } from '@/lib/banners-service';

export default function MainBannersCarousel({ banners }: { banners: MainBanner[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Se não houver banners, renderiza o Hero original como fallback
  if (!banners || banners.length === 0) {
    return (
      <section className="w-full bg-gradient-to-r from-blue-900 to-blue-700 pt-20 pb-24 overflow-hidden relative">
        <div className="absolute inset-0 bg-black/5"></div>
        <div className="absolute top-10 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6 py-16">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight tracking-tight max-w-4xl mx-auto drop-shadow-sm">
            O Maior Acervo de Atividades para <span className="text-cyan-300">Transformar sua Aula</span>
          </h1>
          <p className="text-lg sm:text-xl text-blue-50 font-medium max-w-2xl mx-auto drop-shadow-sm">
            Materiais didáticos criados por professores especialistas, prontos para imprimir e aplicar.
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

  // Auto-play do carrossel (avança a cada 5 segundos)
  useEffect(() => {
    if (isHovered || banners.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length, isHovered]);

  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % banners.length);
  const handlePrev = () => setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));

  const activeBanner = banners[currentIndex];

  return (
    <section 
      className="w-full relative bg-slate-900 overflow-hidden" 
      style={{ aspectRatio: '21/9', minHeight: '300px', maxHeight: '500px' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={activeBanner.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          className="absolute inset-0 w-full h-full"
        >
          {activeBanner.link_url ? (
            <Link href={activeBanner.link_url} className="block w-full h-full">
              <picture className="w-full h-full">
                {activeBanner.image_mobile_url && (
                  <source media="(max-width: 768px)" srcSet={activeBanner.image_mobile_url} />
                )}
                <img 
                  src={activeBanner.image_desktop_url} 
                  alt={activeBanner.title || 'Banner principal'} 
                  className="w-full h-full object-cover object-center"
                />
              </picture>
            </Link>
          ) : (
            <picture className="w-full h-full">
              {activeBanner.image_mobile_url && (
                <source media="(max-width: 768px)" srcSet={activeBanner.image_mobile_url} />
              )}
              <img 
                src={activeBanner.image_desktop_url} 
                alt={activeBanner.title || 'Banner principal'} 
                className="w-full h-full object-cover object-center"
              />
            </picture>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Controles: Setas e Dots (só aparecem se tiver mais de 1 banner) */}
      {banners.length > 1 && (
        <>
          <button 
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md flex items-center justify-center text-white transition-all opacity-0 md:opacity-100 focus:opacity-100 group-hover/section:opacity-100 z-10 shadow-sm"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button 
            onClick={handleNext}
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
