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
        <p className="home-eyebrow">Encontros que viram boas aulas</p>
        <h1 id="home-title" className="mt-4 max-w-2xl text-[2.35rem] font-bold leading-[1.08] tracking-[-.045em] text-[#12344a] sm:text-5xl lg:text-[3.6rem]">Materiais didáticos.<br /><span className="text-[#537c6b]">Mais ideias para<br className="hidden sm:block" /> a sua próxima aula.</span></h1>
        <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">Na Educalizando, você encontra atividades, jogos e recursos digitais de lojas de educadores. Escolha o que combina com a sua turma.</p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Link href="/materiais-didaticos" className="home-primary">Explorar materiais <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
          <Link href="/materiais-gratis" className="home-secondary">Conhecer os gratuitos</Link>
        </div>
        <p className="mt-5 flex items-center gap-2 text-xs leading-5 text-slate-500"><Download aria-hidden="true" className="h-4 w-4 shrink-0" />Materiais digitais. Confira o formato e a licença em cada produto.</p>
      </div>
      <div className="home-material-board relative rounded-[2rem] border border-[#e4e8df] bg-[#eef1e9] p-5 sm:p-7">
        <div className="mb-5 flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[.12em] text-[#53705b]">Da criatividade para a sala de aula</p><BookOpen aria-hidden="true" className="h-5 w-5 shrink-0 text-[#53705b]" /></div>
        {covers.length > 0 ? <div className="grid grid-cols-2 items-center gap-3 sm:gap-4">
          {covers.map((product, index) => <Link key={product.id} href={`/produto/${product.slug || product.id}`} className={`home-cover-link overflow-hidden rounded-2xl bg-white p-2 shadow-[0_8px_24px_#263b2f12] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#093b6c] ${index === 0 ? 'row-span-2 -rotate-3' : index === 1 ? 'rotate-2' : '-rotate-1'}`} aria-label={`Conhecer ${product.titulo}`}>
            <CatalogCover value={product.capa_url} title={product.titulo} priority={index === 0} className={`w-full rounded-xl object-contain ${index === 0 ? 'aspect-[3/4]' : 'aspect-[3/2]'}`} />
          </Link>)}
        </div> : <div className="flex min-h-64 flex-col justify-center rounded-2xl bg-white/70 p-7"><BookOpen aria-hidden="true" className="h-12 w-12 text-[#537c6b]" /><p className="mt-5 text-2xl font-semibold leading-tight text-[#12344a]">Ideias para ensinar.<br />Espaço para criar.</p><Link href="/lojas" className="mt-6 text-sm font-semibold text-[#093b6c]">Descubra as lojas →</Link></div>}
        <div className="mt-5 flex items-center justify-between gap-3 text-xs text-[#53705b]"><span>Conheça quem cria cada material</span><Link href="/lojas" className="inline-flex min-h-11 items-center gap-1 font-bold text-[#12344a]">Visitar lojas <ArrowUpRight aria-hidden="true" className="h-4 w-4" /></Link></div>
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
