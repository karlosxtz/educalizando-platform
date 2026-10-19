'use client';
import { createPortal } from 'react-dom';
import { useEffect, useId, useRef, useState } from 'react';
import CatalogImage from '@/components/ui/CatalogImage';
import { presentationEmbedUrl, productPresentationVideo } from '@/lib/presentation-video';
import type { Product } from '@/lib/types';

/** Passive preview for legacy cards whose entire image is already a link. */
export default function StoreVideoCover({ product, className }: { product: Product; className: string }) {
  const video = productPresentationVideo(product);
  const root = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const id = useId();
  const stop = () => { if(timer.current) clearTimeout(timer.current); timer.current = null; setRect(null); };
  useEffect(() => {
    const another = (event: Event) => { if((event as CustomEvent).detail !== id) stop(); };
    window.addEventListener('scroll', stop, true); window.addEventListener('resize', stop);
    window.addEventListener('educalizando:video-play', another); document.addEventListener('visibilitychange', stop);
    return () => { if(timer.current) clearTimeout(timer.current); window.removeEventListener('scroll', stop, true); window.removeEventListener('resize', stop); window.removeEventListener('educalizando:video-play', another); document.removeEventListener('visibilitychange', stop); };
  }, [id]);
  return <span ref={root} className="relative block h-full w-full" onPointerLeave={stop} onPointerEnter={() => {
    if(!product.video_as_cover || video?.provider !== 'youtube' || !window.matchMedia('(hover: hover) and (pointer: fine)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if(timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { const box = root.current?.getBoundingClientRect(); if(box && box.width >= 200 && box.height >= 200) { window.dispatchEvent(new CustomEvent('educalizando:video-play',{detail:id})); setRect(box); } },450);
  }}>
    <CatalogImage src={product.capa_url || ''} alt={product.titulo} className={className} />
    {product.video_as_cover && video && <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-slate-950/90 px-3 py-2 text-xs font-bold text-white">Vídeo · {video.provider==='youtube'?'YouTube':'Instagram'}</span>}
    {rect && video && createPortal(<iframe src={presentationEmbedUrl(video,true)} title={`Prévia de ${product.titulo}`} tabIndex={-1} aria-hidden allow="autoplay; encrypted-media" referrerPolicy="strict-origin-when-cross-origin" className="pointer-events-none fixed z-50 border-0 bg-slate-950" style={{left:rect.left,top:rect.top,width:rect.width,height:rect.height}} />,document.body)}
  </span>;
}
