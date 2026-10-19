import Link from 'next/link';
import CatalogCover from '@/components/CatalogCover';
import { ArrowRight, CalendarDays, Gift } from 'lucide-react';
import type { Product } from '@/lib/types';

export default function HomeDiscoveryBanners({ freeProduct, offer }: { freeProduct?: Product; offer?: Product }) {
  return <section className="home-layout grid gap-4 py-7 sm:grid-cols-2" aria-label="Encontre sua próxima ideia">
    <Link href="/materiais-gratis" className="group relative flex min-h-52 overflow-hidden rounded-3xl bg-[#dfeee7] p-5 sm:p-7 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#093b6c]">
      <div className="relative z-10 flex w-3/5 flex-col items-start"><Gift aria-hidden="true" className="mb-3 h-6 w-6 text-[#22644e]" /><h2 className="text-xl font-bold leading-tight text-[#17483c] sm:text-2xl">Recursos gratuitos.<br />Novas possibilidades.</h2><p className="mt-2 text-xs leading-5 text-[#326453]">Conheça os recursos e confira as condições de resgate.</p><span className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#17483c] px-4 text-xs font-bold text-white">Explorar gratuitos <ArrowRight className="h-4 w-4" aria-hidden="true" /></span></div>
      {freeProduct?.capa_url && <div className="absolute -right-3 bottom-0 top-6 w-[42%] rotate-6 overflow-hidden rounded-tl-2xl bg-white p-2 shadow-xl"><CatalogCover value={freeProduct.capa_url} title={freeProduct.titulo} priority={false} className="h-full w-full object-cover" /></div>}
    </Link>
    <Link href={offer ? '/ofertas' : '/calendario'} className="group relative flex min-h-52 overflow-hidden rounded-3xl bg-[#eee4ff] p-5 sm:p-7 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#093b6c]">
      <div className="relative z-10 flex w-3/5 flex-col items-start"><CalendarDays aria-hidden="true" className="mb-3 h-6 w-6 text-[#654194]" /><h2 className="text-xl font-bold leading-tight text-[#463067] sm:text-2xl">Mais inspiração.<br />Novas descobertas.</h2><p className="mt-2 text-xs leading-5 text-[#654c83]">{offer ? 'Veja as ofertas publicadas pelas lojas.' : 'Planeje as próximas datas da sua turma.'}</p><span className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#573b80] px-4 text-xs font-bold text-white">{offer ? 'Ver ofertas' : 'Ver calendário'} <ArrowRight className="h-4 w-4" aria-hidden="true" /></span></div>
      {offer?.capa_url && <div className="absolute -right-3 bottom-0 top-6 w-[42%] -rotate-6 overflow-hidden rounded-tl-2xl bg-white p-2 shadow-xl"><CatalogCover value={offer.capa_url} title={offer.titulo} priority={false} className="h-full w-full object-cover" /></div>}
    </Link>
  </section>;
}
