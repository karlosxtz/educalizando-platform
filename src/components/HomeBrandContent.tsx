import Link from 'next/link';
import { ArrowRight, ArrowUpRight, BookOpen, Download, Store } from 'lucide-react';
import CatalogCover from '@/components/CatalogCover';
import { HOME_FAQ } from '@/lib/home-content';

type HeroMaterial = { id: string; slug?: string | null; titulo: string; capa_url: string | null };

export function HomeIntroduction({ products = [] }: { products?: HeroMaterial[] }) {
  const covers = products.filter(product => product.capa_url).slice(0, 3);
  return <section className="home-introduction" aria-labelledby="home-title">
    <div className="home-layout grid items-center gap-8 py-9 sm:py-12 lg:grid-cols-[1.05fr_.95fr] lg:gap-14 lg:py-10">
      <div>
        <p className="home-eyebrow">Ideias que ganham vida na sua sala</p>
        <h1 id="home-title" className="mt-4 max-w-2xl text-[2.35rem] font-bold leading-[1.08] tracking-[-.045em] text-white sm:text-5xl lg:text-[3.6rem]">Materiais didáticos.<br /><span className="text-[#ffe3a6]">Mais vida para<br className="hidden sm:block" /> cada aula.</span></h1>
        <p className="mt-5 max-w-lg text-base leading-7 text-blue-100">Na Educalizando, você encontra atividades, jogos e recursos digitais de lojas de educadores. Escolha o que combina com a sua turma.</p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Link href="/materiais-didaticos" className="home-primary">Explorar materiais <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
          <Link href="/materiais-gratis" className="home-secondary">Conhecer os gratuitos</Link>
        </div>
        <p className="mt-5 flex items-center gap-2 text-xs leading-5 text-blue-100"><Download aria-hidden="true" className="h-4 w-4 shrink-0" />Materiais digitais. Confira o formato e a licença em cada produto.</p>
      </div>
      <div className="home-material-board relative overflow-hidden rounded-[2rem] border border-white/20 bg-white/10 p-4 sm:p-5">
        {covers[0] ? <Link href={`/produto/${covers[0].slug || covers[0].id}`} className="group relative block overflow-hidden rounded-[1.5rem] bg-[#f6f0ff] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white" aria-label={`Conhecer ${covers[0].titulo}`}>
          <CatalogCover value={covers[0].capa_url} title={covers[0].titulo} priority className="h-[310px] w-full object-contain p-3 sm:h-[360px]" />
          <div className="flex items-center justify-between gap-4 bg-white p-4 sm:p-5"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-widest text-violet-700">Descoberta no catálogo</p><p className="mt-1 line-clamp-2 text-sm font-bold leading-5 text-[#12344a]">{covers[0].titulo}</p></div><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#093b6c] text-white transition group-hover:bg-violet-700"><ArrowRight aria-hidden="true" className="h-5 w-5" /></span></div>
          <span className="absolute left-4 top-4 rounded-full bg-[#093b6c] px-3 py-2 text-xs font-bold text-white shadow-md">Conheça este material</span>
        </Link> : <div className="flex min-h-64 flex-col justify-center p-7 text-white"><BookOpen aria-hidden="true" className="h-12 w-12" /><p className="mt-5 text-2xl font-semibold">Ideias para ensinar. Espaço para criar.</p><Link href="/lojas" className="mt-6 text-sm font-bold underline">Descubra as lojas →</Link></div>}
      </div>
    </div>
  </section>;
}

export function HomeFaq() {
  return <section aria-labelledby="home-faq" className="home-layout py-12 sm:py-16">
    <div className="grid gap-7 lg:grid-cols-[.7fr_1.3fr] lg:gap-16">
      <div><p className="home-eyebrow">Pode perguntar</p><h2 id="home-faq" className="home-heading mt-3">Sua próxima escolha,<br />com mais clareza.</h2><p className="mt-4 text-sm leading-6 text-slate-600">Entenda como encontrar materiais e acessar suas compras.</p><Link href="/ajuda" className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#093b6c]">Central de ajuda <ArrowUpRight aria-hidden="true" className="h-4 w-4" /></Link></div>
      <div className="divide-y divide-slate-200 border-y border-slate-200">{HOME_FAQ.map(item => <details key={item.question} className="group py-5">
        <summary className="cursor-pointer pr-3 text-sm font-semibold leading-6 text-[#12344a] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#093b6c]">{item.question}</summary>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">{item.answer}</p>
      </details>)}</div>
    </div>
    <div className="mt-12 flex items-start gap-3 rounded-2xl bg-[#eef1e9] p-5 text-sm leading-6 text-[#355548]"><Store aria-hidden="true" className="mt-1 h-5 w-5 shrink-0" /><p>Você cria materiais didáticos? Organize seu catálogo em uma loja própria na Educalizando e disponibilize os arquivos aos compradores após a confirmação do pagamento. <Link href="/cadastro/produtor" className="font-semibold underline underline-offset-4">Conheça a área do criador.</Link></p></div>
  </section>;
}
