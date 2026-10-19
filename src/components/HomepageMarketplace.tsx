import CatalogImage from '@/components/ui/CatalogImage';
import MainBannersCarousel from '@/components/MainBannersCarousel';
import MarketplaceKitCard from '@/components/MarketplaceKitCard';
import ProductCard from '@/components/ProductCard';
import RecentlyViewed from '@/components/RecentlyViewed';
import UpcomingCalendarDates from '@/components/UpcomingCalendarDates';
import { HomeIntroduction } from '@/components/HomeBrandContent';
import type { MainBanner } from '@/lib/banners-service';
import type { MarketplaceKit } from '@/lib/marketplace-kit-service';
import type { Product, Store as StoreData } from '@/lib/types';
import { ArrowRight, ArrowUpRight, BookOpen, GraduationCap, Palette, Puzzle, Store } from 'lucide-react';
import Link from 'next/link';

type MarketplaceProduct = Product & { store?: StoreData };
const categories = [
  { href: '/atividades-alfabetizacao', label: 'Alfabetização', description: 'Letras, leitura e descobertas', icon: BookOpen, color: 'bg-[#edf3e9] text-[#47683c]' },
  { href: '/educacao-infantil', label: 'Educação infantil', description: 'Aprender, brincar e explorar', icon: Palette, color: 'bg-[#fff1e4] text-[#98622d]' },
  { href: '/atividades-ensino-fundamental', label: 'Ensino fundamental', description: 'Recursos para cada nova etapa', icon: GraduationCap, color: 'bg-[#eaf0f7] text-[#365c84]' },
  { href: '/jogos-pedagogicos', label: 'Jogos pedagógicos', description: 'Ideias para aprender jogando', icon: Puzzle, color: 'bg-[#f1edf7] text-[#70578d]' },
];

export default function HomepageMarketplace({ banners, products, stores, kits, monthlyTags }: {
  banners: MainBanner[]; products: MarketplaceProduct[]; stores: StoreData[];
  kits: MarketplaceKit[]; monthlyTags: readonly string[];
}) {
  const featured = products.slice(0, 4);
  const freeProducts = products.filter(product => product.is_free || Number(product.preco) === 0).slice(0, 4);
  const plrProducts = products.filter(product => product.is_plr && Number(product.preco_plr || 0) > 0 && product.has_plr_delivery).slice(0, 4);
  const offers = products.filter(product => !product.is_free && Number(product.preco_original || 0) > Number(product.preco || 0)).slice(0, 4);
  return <main className="home-marketplace flex-1 pb-8">
    <HomeIntroduction products={featured} />
    <section className="home-layout py-8 sm:py-10" aria-labelledby="home-categorias">
      <SectionHeading id="home-categorias" eyebrow="Um bom ponto de partida" title="O que sua turma vai descobrir?" href="/buscar" label="Todas as categorias" />
      <div className="mt-5 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">{categories.map(category => <Link key={category.href} href={category.href} className="home-category group flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${category.color}`}><category.icon aria-hidden="true" className="h-5 w-5" /></span><span className="min-w-0"><span className="block text-sm font-semibold text-[#12344a]">{category.label}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{category.description}</span></span>
      </Link>)}</div>
    </section>
    <Shelf title="Novas ideias no catálogo" description="Conheça materiais publicados pelas lojas da Educalizando." href="/buscar" products={featured} />
    <section className="home-layout py-5" aria-label="Planeje com o calendário escolar"><div className="flex flex-col gap-5 rounded-2xl border border-[#e4e8df] bg-[#eef1e9] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7"><div><p className="home-eyebrow">Seu planejamento, com inspiração</p><h2 className="mt-2 text-xl font-semibold tracking-tight text-[#12344a]">Os temas do mês em um só lugar</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">{monthlyTags.slice(0, 3).join(' · ') || 'Explore datas comemorativas e projetos para a sua turma.'}</p></div><Link href="/calendario" className="home-secondary shrink-0">Explorar calendário <ArrowUpRight aria-hidden="true" className="h-4 w-4" /></Link></div></section>
    <UpcomingCalendarDates products={products} />
    {freeProducts.length > 0 && <Shelf title="Para conhecer sem pagar" description="Explore os materiais gratuitos e confira as condições de cada recurso." href="/materiais-gratis" products={freeProducts} />}
    {offers.length > 0 && <Shelf title="Encontre uma boa oferta" description="Preços promocionais cadastrados pelas próprias lojas." href="/ofertas" products={offers} />}
    {kits.length > 0 && <section className="home-layout py-8 sm:py-10" aria-labelledby="home-combos"><SectionHeading id="home-combos" eyebrow="Escolhas que se complementam" title="Mais ideias em um combo" href="/buscar?categoria=combo" /><p className="mt-2 text-sm text-slate-600">Materiais reunidos em um pedido, com acesso individual aos arquivos.</p><div className="mt-6 grid grid-cols-1 gap-5 min-[600px]:grid-cols-2 xl:grid-cols-4">{kits.slice(0, 4).map(kit => <MarketplaceKitCard key={kit.id} kit={kit} />)}</div></section>}
    <section className="home-layout py-9 sm:py-12" aria-labelledby="home-lojas">
      <SectionHeading id="home-lojas" eyebrow="Conheça quem está por trás das ideias" title="Cada loja, um universo para descobrir" href="/lojas" label="Conhecer todas" />
      <div className="mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4 [scrollbar-width:thin]" aria-label="Lojas de criadores">{stores.map(store => <Link prefetch={false} href={`/loja/${store.slug}`} key={store.id} className="home-category flex min-h-24 w-64 shrink-0 snap-start items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        {store.logo_url ? <CatalogImage src={store.logo_url} alt="" width={48} height={48} loading="lazy" className="h-12 w-12 shrink-0 rounded-full border border-slate-100 object-cover" /> : <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#eef1e9] text-lg font-semibold text-[#53705b]">{store.nome_loja?.charAt(0).toUpperCase() || 'L'}</span>}
        <span className="min-w-0"><span className="block text-sm font-semibold leading-5 text-[#12344a]">{store.nome_loja}</span><span className="mt-1 flex items-center gap-1 text-xs text-slate-500"><Store aria-hidden="true" className="h-3 w-3" />Visitar loja</span></span>
      </Link>)}{!stores.length && <Link href="/lojas" className="home-secondary">Explorar as lojas disponíveis</Link>}</div>
    </section>
    <section className="home-layout py-8" aria-labelledby="home-beneficios"><div className="border-y border-slate-200 py-8"><h2 id="home-beneficios" className="home-heading">Da escolha à sua próxima aula</h2><div className="mt-6 grid gap-6 sm:grid-cols-3">{[
      ['Escolha com calma', 'Confira a descrição, a capa, o formato e a licença do material.'],
      ['Compre na loja', 'Consulte o preço e as condições de pagamento no checkout.'],
      ['Acesse suas compras', 'Com o pagamento confirmado, encontre os arquivos na sua conta.'],
    ].map(([title, text], index) => <div key={title} className="flex items-start gap-3"><span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eaf0f7] text-xs font-semibold text-[#093b6c]">0{index + 1}</span><div><h3 className="text-sm font-semibold text-[#12344a]">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></div></div>)}</div></div></section>
    {plrProducts.length > 0 && <Shelf title="Crie novas possibilidades de revenda" description="Confira os materiais com licença PLR e as regras de uso de cada produto." href="/buscar?filter=plr" products={plrProducts} purchaseMode="plr" />}
    <section className="home-layout py-8 sm:py-10"><div className="flex flex-col items-start gap-6 rounded-[1.75rem] bg-[#12344a] p-7 text-white sm:p-10 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.15em] text-[#c6ddc4]">Seu talento também tem espaço aqui</p><h2 className="mt-3 max-w-xl text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">Suas ideias merecem uma loja própria.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-slate-200">Organize seu catálogo, personalize sua vitrine e disponibilize materiais digitais para outros educadores.</p></div><Link href="/cadastro/produtor" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-3 rounded-xl bg-white px-6 text-sm font-semibold text-[#12344a] transition hover:bg-[#eef1e9] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Quero criar minha loja <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></div></section>
    <RecentlyViewed />
    {banners.length > 0 && <section className="home-layout py-8" aria-label="Banners e campanhas disponíveis"><div className="overflow-hidden rounded-2xl border border-slate-200"><MainBannersCarousel banners={banners} /></div></section>}
  </main>;
}

function SectionHeading({ id, eyebrow, title, href, label = 'Ver todos' }: { id?: string; eyebrow: string; title: string; href: string; label?: string }) {
  return <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="home-eyebrow">{eyebrow}</p><h2 id={id} className="home-heading mt-2">{title}</h2></div><Link href={href} className="inline-flex min-h-11 shrink-0 items-center gap-1 text-sm font-semibold text-[#093b6c] hover:underline focus-visible:outline-2 focus-visible:outline-offset-4">{label}<ArrowUpRight aria-hidden="true" className="h-4 w-4" /></Link></div>;
}
function Shelf({ title, description, href, products, purchaseMode }: { title: string; description: string; href: string; products: MarketplaceProduct[]; purchaseMode?: 'plr' }) {
  return <section className="home-layout py-8 sm:py-10"><SectionHeading eyebrow="Descubra no catálogo" title={title} href={href} /><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p><div className="mt-6 grid grid-cols-1 gap-5 min-[600px]:grid-cols-2 xl:grid-cols-4">{products.length ? products.map(product => <ProductCard key={product.id} product={product} purchaseMode={purchaseMode} presentation="showcase" />) : <p className="col-span-full rounded-2xl border border-slate-200 p-5 text-sm text-slate-600">Não foi possível exibir materiais neste momento. <Link href="/buscar" className="font-semibold text-[#093b6c] underline">Explorar catálogo</Link></p>}</div></section>;
}
