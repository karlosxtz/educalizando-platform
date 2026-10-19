'use client';
import { useEffect, useRef, type ReactNode } from 'react';

/** Keep every video reachable even when the rail is taller than the viewport. */
export default function DiscoverySidebar({ children }: { children: ReactNode }) {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = root.current;
    const header = document.querySelector('.marketplace-header');
    if (!element || !header) return;
    const measure = () => element.style.setProperty('--discovery-top', `${Math.ceil(header.getBoundingClientRect().height) + 16}px`);
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(header);
    window.addEventListener('resize', measure);
    return () => { observer?.disconnect(); window.removeEventListener('resize', measure); };
  }, []);
  return <aside ref={root} aria-label="Vídeos e lojas para descobrir" tabIndex={0} className="space-y-5 rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-700 xl:sticky xl:top-[var(--discovery-top,176px)] xl:max-h-[calc(100dvh-var(--discovery-top,176px)-16px)] xl:overflow-y-auto xl:overscroll-y-contain xl:pr-2 [scrollbar-width:thin]">{children}</aside>;
}
