import Link from 'next/link';
import CatalogImage from '@/components/ui/CatalogImage';
import PresentationVideoPlayer from '@/components/PresentationVideoPlayer';
import { productPresentationVideo } from '@/lib/presentation-video';
import type { DiscoveryProduct } from '@/lib/discovery-catalog';
import CatalogCover from '@/components/CatalogCover';
import { ArrowUpRight } from 'lucide-react';

export default function CreatorVideoCard({ product, priority = false }: { product: DiscoveryProduct; priority?: boolean }) {
  const video = productPresentationVideo(product);
  if (!video) return null;
  const href = `/produto/${product.slug || product.id}`;
  return <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
    <PresentationVideoPlayer url={video.url} title={product.titulo} hoverPreview={Boolean(product.video_as_cover)} className={`${video.provider === 'instagram' ? 'aspect-[4/5]' : 'aspect-video'} bg-slate-900`}>
      <CatalogCover value={product.capa_url} title={product.titulo} priority={priority} className="h-full w-full object-contain" />
      <span className="absolute right-3 top-3 rounded-full bg-slate-950/85 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white">{video.provider === 'youtube' ? 'YouTube' : 'Instagram'}</span>
    </PresentationVideoPlayer>
    <div className="p-5">
      <Link href={href} className="font-bold leading-6 text-[#12344a] hover:underline"><h2 className="line-clamp-2">{product.titulo}</h2></Link>
      {product.store && <Link href={`/loja/${product.store.slug}`} className="mt-3 flex items-center gap-2 text-xs text-slate-600">{product.store.logo_url && <CatalogImage src={product.store.logo_url} alt="" width={24} height={24} className="h-6 w-6 rounded-full object-cover" />}{product.store.nome_loja}</Link>}
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4"><span className="text-sm font-bold text-[#093b6c]">{product.is_free ? 'Grátis · confira as condições' : Number(product.preco).toLocaleString('pt-BR', {style:'currency',currency:'BRL'})}</span><Link href={href} className="inline-flex min-h-11 items-center gap-1 rounded-xl bg-blue-50 px-3 text-xs font-bold text-blue-800">Ver material <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link></div>
    </div>
  </article>;
}



