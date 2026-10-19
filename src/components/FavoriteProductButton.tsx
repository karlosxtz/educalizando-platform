'use client';
import { Heart, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { toggleBuyerFavorite, useBuyerFavorites } from '@/lib/buyer-favorites';

export default function FavoriteProductButton({ productId, title, compact = false }: { productId: string; title: string; compact?: boolean }) {
  const favorites = useBuyerFavorites();
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const path = usePathname();
  const saved = favorites.ids.has(productId);
  return <button type="button" disabled={pending} aria-pressed={saved} aria-label={`${saved ? 'Remover dos favoritos' : 'Favoritar'}: ${title}`} title={saved ? 'Remover dos favoritos' : 'Salvar para depois'} onClick={async event => {
    event.preventDefault(); event.stopPropagation(); setPending(true);
    try {
      if (!await toggleBuyerFavorite(productId)) {
        const returnTo = (path || '/buscar') + window.location.search;
        router.push(`/cliente/login?returnTo=${encodeURIComponent(returnTo)}`);
      }
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Não foi possível salvar agora.'); }
    finally { setPending(false); }
  }} className={`inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-full border bg-white/95 shadow-sm transition hover:border-rose-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:opacity-50 ${saved ? 'border-rose-200 text-rose-600' : 'border-slate-200 text-slate-600'} ${compact ? '' : 'px-4 text-sm font-bold'}`}>
    {pending ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Heart aria-hidden="true" className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} />}{!compact && (saved ? 'Salvo nos favoritos' : 'Salvar material')}
  </button>;
}
