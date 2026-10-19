import type { Metadata } from 'next';
import Link from 'next/link';
import MarketplaceHeader from '@/components/MarketplaceHeader';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import CreatorVideoCard from '@/components/CreatorVideoCard';
import DiscoverySidebar from '@/components/DiscoverySidebar';
import { getCategories } from '@/lib/category-service';
import { discoveryFilters, readDiscoveryProducts, DISCOVERY_PAGE_SIZE } from '@/lib/discovery-catalog';
import { socialMetadata, SITE_URL, serializeJsonLd } from '@/lib/seo';
import { productPresentationVideo } from '@/lib/presentation-video';
import { ArrowRight, Film, Search, Store } from 'lucide-react';

export type DiscoveryParams = Promise<Record<string, string | string[] | undefined>>;
const pathFor = (videos: boolean) => videos ? '/videos' : '/marketplace-de-materiais-pedagogicos';
export async function discoveryMetadata(videos: boolean, searchParams: DiscoveryParams): Promise<Metadata> {
  const { q, category, page } = discoveryFilters(await searchParams);
  const catalog = await readDiscoveryProducts(videos, q, category, page);
  const title = videos ? 'Vídeos de professores | Educalizando' : 'Marketplace de materiais pedagógicos | Educalizando';
  const description = videos ? 'Veja demonstrações de materiais pedagógicos em vídeos dos criadores. Conheça a proposta, visite a loja e confira os detalhes antes de comprar.' : 'Explore materiais pedagógicos digitais de lojas de educadores. Veja demonstrações em vídeo, compare propostas e encontre recursos para sua turma.';
  return { ...socialMetadata({ title, description, url: pathFor(videos) }), robots: q || category || page > 1 || !catalog.total || catalog.unavailable ? {index:false,follow:true} : {index:true,follow:true} };
}
export default async function PublicDiscoveryPage({ videos = false, searchParams }: { videos?: boolean; searchParams: DiscoveryParams }) {
  const { q, category, page } = discoveryFilters(await searchParams);
  const [catalog, categories, spotlight] = await Promise.all([
    readDiscoveryProducts(videos, q, category, page), getCategories(),
    videos ? Promise.resolve(null) : readDiscoveryProducts(true, '', '', 1),
  ]);
  const base = pathFor(videos);
  const link = (next: { q?: string; category?: string; page?: number }) => {
    const params = new URLSearchParams();
    if (next.q) params.set('q', next.q); if(next.category) params.set('categoria', next.category); if(next.page && next.page > 1) params.set('pagina', String(next.page));
    return base + (params.size ? '?' + params.toString() : '');
  };
  return <div className="min-h-screen bg-[#f4f4fc] text-slate-900">
    <MarketplaceHeader />
    <main>
      <section className="border-b border-indigo-100 bg-[radial-gradient(ellipse_at_top_right,#dabfff,transparent_55%),linear-gradient(120deg,#e5edff,#f4edff)]">
        <div className="home-layout py-9 sm:py-12"><nav aria-label="Caminho da página" className="mb-5 text-xs text-slate-600"><Link href="/">Início</Link> / {videos ? 'Vídeos' : 'Marketplace'}</nav><p className="home-eyebrow">Ideias reais. Criadores para conhecer.</p><div className="mt-3 flex flex-wrap items-end justify-between gap-5"><div className="max-w-3xl"><h1 className="text-3xl font-bold leading-tight tracking-tight text-[#12344a] sm:text-5xl">{videos ? 'Vídeos de professores' : 'Marketplace de materiais pedagógicos'}</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">{videos ? 'Veja os materiais em ação. Descubra demonstrações dos criadores e abra o produto para conferir formato, conteúdo e condições de compra.' : 'Explore atividades, jogos e recursos digitais publicados pelas lojas da Educalizando. Encontre uma ideia para sua turma e conheça quem está por trás dela.'}</p></div><Link href={videos ? '/dashboard/produtos' : '/videos'} className="home-primary">{videos ? 'Gerenciar meus materiais' : 'Vídeos de professores'} <Film className="h-4 w-4" aria-hidden="true" /></Link></div>
          <form action={base} role="search" className="mt-7 flex max-w-2xl gap-2"><label htmlFor="discovery-query" className="sr-only">Pesquisar materiais e vídeos</label><input id="discovery-query" type="search" name="q" defaultValue={q} maxLength={100} placeholder="Qual ideia você procura para sua turma?" className="min-h-12 min-w-0 flex-1 rounded-xl border border-indigo-200 bg-white px-4 text-sm" />{category && <input type="hidden" name="categoria" value={category} />}<button className="flex min-h-12 items-center gap-2 rounded-xl bg-[#093b6c] px-4 text-sm font-bold text-white"><Search className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">Buscar</span><span className="sr-only sm:hidden">Buscar</span></button></form>
        </div>
      </section>
      <div className="home-layout py-7 sm:py-10">
        <nav aria-label="Explorar categorias" className="mb-6 flex gap-2 overflow-x-auto pb-3 [scrollbar-width:thin]"><Link href={link({q})} aria-current={!category ? 'page' : undefined} className={`inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-xs font-bold ${!category ? 'border-violet-800 bg-violet-800 text-white' : 'border-slate-200 bg-white text-slate-700'}`}>Para você</Link>{categories.map(item => <Link key={item.id} href={link({q,category:item.id})} aria-current={category===item.id ? 'page' : undefined} className={`inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-xs font-bold ${category===item.id ? 'border-violet-800 bg-violet-800 text-white' : 'border-slate-200 bg-white text-slate-700'}`}>{item.nome}</Link>)}</nav>
        <div className={`grid items-start gap-7 ${!videos ? 'xl:grid-cols-[minmax(0,1fr)_290px]' : ''}`}>
          <section aria-label={videos ? 'Demonstrações dos criadores' : 'Materiais publicados'}>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600"><p>{catalog.total} {catalog.total===1 ? 'material publicado' : 'materiais publicados'}{q && <> para <strong>{q}</strong></>}</p>{(q||category) && <Link href={base} className="inline-flex min-h-11 items-center font-bold text-violet-800">Limpar filtros</Link>}</div>
            {catalog.products.length ? videos ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{catalog.products.map((product,index) => <CreatorVideoCard key={product.id} product={product} priority={index<4} />)}</div> : <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-2 min-[1500px]:columns-3">{catalog.products.map((product,index) => <div key={product.id} className="mb-5 break-inside-avoid [&>article]:h-auto">{productPresentationVideo(product) && product.video_as_cover ? <CreatorVideoCard product={product} priority={index<4} /> : <ProductCard product={product} priority={index<4} />}</div>)}</div> : <div role="status" className="rounded-3xl border border-dashed border-indigo-200 bg-white p-8"><Film className="h-9 w-9 text-violet-600" /><h2 className="mt-4 text-xl font-bold text-[#12344a]">{catalog.unavailable ? 'Não foi possível carregar o catálogo agora' : videos ? 'Novas demonstrações vão aparecer aqui' : 'Nenhum material para esta busca'}</h2><p className="mt-3 text-sm leading-6 text-slate-600">{catalog.unavailable ? 'Tente recarregar a página em instantes.' : videos ? 'Os criadores podem adicionar um link público de apresentação no cadastro do produto. Explore também o catálogo completo.' : 'Experimente outro tema ou remova os filtros para descobrir mais materiais.'}</p><Link href="/buscar" className="home-primary mt-5">Explorar catálogo <ArrowRight className="h-4 w-4" /></Link></div>}
            <nav aria-label="Páginas do catálogo" className="mt-8 flex items-center justify-center gap-4">{page>1 && <Link href={link({q,category,page:page-1})} className="home-secondary">Anterior</Link>}<span className="text-sm text-slate-600">Página {page}</span>{page*DISCOVERY_PAGE_SIZE<catalog.total && <Link href={link({q,category,page:page+1})} className="home-secondary">Próxima</Link>}</nav>
          </section>
          {!videos && <DiscoverySidebar><div className="rounded-3xl border border-violet-200 bg-violet-50 p-5"><Film className="h-7 w-7 text-violet-700" /><h2 className="mt-3 text-lg font-bold text-[#12344a]">Veja antes de escolher</h2><p className="mt-2 text-sm leading-6 text-slate-600">Conheça as demonstrações dos criadores e encontre novas ideias para suas aulas.</p><Link href="/videos" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-violet-800">Explorar vídeos <ArrowRight className="h-4 w-4" /></Link></div>{spotlight?.products.slice(0,2).map(product => <CreatorVideoCard key={product.id} product={product} />)}<Link href="/lojas" className="flex min-h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 font-bold text-[#093b6c]"><Store className="h-5 w-5" />Conheça as lojas</Link></DiscoverySidebar>}
        </div>
        <section className="mt-12 rounded-3xl border border-indigo-100 bg-white p-6 sm:p-8"><h2 className="text-2xl font-bold text-[#12344a]">{videos ? 'Demonstrações para uma escolha mais informada' : 'Como funciona o marketplace da Educalizando'}</h2><div className="mt-5 grid gap-6 md:grid-cols-3">{[
          ['Explore a proposta', 'Leia a descrição e consulte imagens, vídeos e amostras disponíveis. Compare o conteúdo com o objetivo da sua aula; cada material tem suas próprias características.'],
          ['Conheça a loja', 'Confira quem disponibiliza o material e visite a vitrine do criador. O formato, a faixa indicada e a licença devem ser consultados na página do produto.'],
          ['Confira e compre', 'Veja o preço e as condições no checkout. Após a confirmação do pagamento, os materiais adquiridos ficam disponíveis na sua conta. Demonstrações públicas não substituem os arquivos da compra.'],
        ].map(([title,text])=><div key={title}><h3 className="font-bold text-[#093b6c]">{title}</h3><p className="mt-2 text-sm leading-7 text-slate-600">{text}</p></div>)}</div><p className="mt-6 text-xs leading-6 text-slate-500">Vídeos são carregados do YouTube ou Instagram apenas quando você interage com a prévia. O autor pode restringir a incorporação, e o provedor pode exigir login ou um clique para reproduzir. Use o link do material para conferir todos os detalhes. <Link href="/privacidade" className="underline">Saiba mais sobre privacidade.</Link></p></section>
      </div>
    </main>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:serializeJsonLd({'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Início',item:SITE_URL+'/'},{'@type':'ListItem',position:2,name:videos?'Vídeos de professores':'Marketplace de materiais pedagógicos',item:SITE_URL+base}]})}} />
    <Footer />
  </div>;
}

