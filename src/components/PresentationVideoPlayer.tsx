'use client';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { ExternalLink, Play, X } from 'lucide-react';
import { presentationEmbedUrl, presentationVideo } from '@/lib/presentation-video';

/** Providers serve their own bytes. No embeds until an intentional hover or click. */
export default function PresentationVideoPlayer({ url, title, children, hoverPreview = false, className = '' }: {
  url: string; title: string; children?: ReactNode; hoverPreview?: boolean; className?: string;
}) {
  const video = presentationVideo(url);
  const [playing, setPlaying] = useState(false);
  const id = useId();
  const [manual, setManual] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearHover = () => { if (hoverTimer.current) clearTimeout(hoverTimer.current); hoverTimer.current = null; };
  useEffect(() => {
    const stopOthers = (event: Event) => { if ((event as CustomEvent).detail !== id) setPlaying(false); };
    const hide = () => { if (document.hidden) { clearHover(); setPlaying(false); } };
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(entries => {
      if (!entries[0]?.isIntersecting) { clearHover(); setPlaying(false); }
    });
    if (root.current) observer?.observe(root.current);
    window.addEventListener('educalizando:video-play', stopOthers);
    document.addEventListener('visibilitychange', hide);
    return () => { clearHover(); observer?.disconnect(); window.removeEventListener('educalizando:video-play', stopOthers); document.removeEventListener('visibilitychange', hide); };
  }, [id]);
  if (!video) return <>{children}</>;
  const start = (clicked = false) => { setManual(clicked); window.dispatchEvent(new CustomEvent('educalizando:video-play', { detail: id })); setPlaying(true); };
  return <div ref={root} className={`relative isolate overflow-hidden ${className}`}
    onPointerEnter={() => { if (hoverPreview && video.provider === 'youtube' && window.matchMedia('(hover: hover) and (pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) { clearHover(); hoverTimer.current = setTimeout(() => start(), 450); } }}
    onPointerLeave={() => { clearHover(); if (hoverPreview && !manual) setPlaying(false); }}>
    {children}
    {playing ? <>
      <iframe src={presentationEmbedUrl(video, hoverPreview && !manual)} title={`Vídeo: ${title}`} className={`absolute inset-0 z-20 h-full w-full border-0 bg-slate-950 ${hoverPreview && !manual ? 'pointer-events-none' : ''}`} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
      <button type="button" onClick={() => setPlaying(false)} aria-label={`Fechar vídeo de ${title}`} className="absolute right-2 top-2 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-slate-950/90 text-white focus-visible:outline-2 focus-visible:outline-white"><X className="h-4 w-4" /></button>
      {<a href={video.url} target="_blank" rel="noopener noreferrer" className="absolute top-3 left-3 z-30 inline-flex min-h-11 items-center gap-2 rounded-full bg-slate-950/90 px-3 text-xs font-bold text-white">Abrir vídeo original <ExternalLink className="h-3 w-3" /></a>}
    </> : <button type="button" onClick={() => start(true)} className="absolute bottom-3 left-3 z-20 inline-flex min-h-11 max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-full bg-slate-950/90 px-3 text-xs font-bold text-white shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600" aria-label={`Assistir vídeo de ${title}`}><Play aria-hidden="true" className="h-4 w-4 shrink-0" /><span>{video.provider === 'youtube' ? 'Ver vídeo' : 'Ver no Instagram'}</span></button>}
  </div>;
}





