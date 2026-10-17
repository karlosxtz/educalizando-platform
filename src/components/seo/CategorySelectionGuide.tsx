import Link from 'next/link';
import type { Product } from '@/lib/types';

export default function CategorySelectionGuide({ name, products }: { name: string; products: Product[] }) {
  if (!products.length) return null;
  const levels = [...new Map(products.flatMap(p => p.education_level?.slug ? [[p.education_level.slug, p.education_level] as const] : [])).values()];
  const themes = [...new Set(products.flatMap(p => p.seasonal_tags || []).filter(Boolean))].slice(0, 6);
  return <section aria-labelledby="categoria-escolha" className="mx-auto max-w-[1200px] px-4 pt-8">
    <div className="rounded-2xl border border-blue-100 bg-white p-5 sm:p-8">
      <h2 id="categoria-escolha" className="text-xl font-bold text-slate-900">Como escolher materiais de {name}</h2>
      <ol className="mt-4 grid list-inside list-decimal gap-4 text-sm leading-6 text-slate-700 md:grid-cols-3">
        <li><strong>Defina o objetivo.</strong> Identifique o que deseja trabalhar e o que a turma já conhece. A categoria ajuda a localizar recursos; a descrição mostra a proposta de cada um.</li>
        <li><strong>Examine o que está incluído.</strong> Confira as prévias disponíveis, o formato, o público indicado e a quantidade de páginas, quando informados pelo criador.</li>
        <li><strong>Planeje a aplicação.</strong> Considere o tempo de preparação e a necessidade de imprimir ou montar. Confira a licença antes de editar ou reutilizar o conteúdo.</li>
      </ol>
      {levels.length > 0 && <div className="mt-5"><h3 className="text-sm font-bold text-slate-800">Explore também por nível presente nesta seleção</h3>
        <ul className="mt-2 flex flex-wrap gap-2">{levels.map(level => <li key={level.id}><Link prefetch={false} className="inline-flex min-h-11 items-center rounded-xl bg-blue-50 px-3 text-sm font-semibold text-blue-800" href={`/atividades-por-ano/${encodeURIComponent(level.slug)}`}>{level.nome}</Link></li>)}</ul>
      </div>}
      {themes.length > 0 && <div className="mt-5"><h3 className="text-sm font-bold text-slate-800">Datas e temas presentes nesta seleção</h3>
        <ul className="mt-2 flex flex-wrap gap-2">{themes.map(theme => <li key={theme}><Link prefetch={false} className="inline-flex min-h-11 items-center rounded-xl bg-violet-50 px-3 text-sm font-semibold text-violet-800" href={`/buscar?data=${encodeURIComponent(theme)}`}>{theme}</Link></li>)}</ul>
      </div>}
    </div>
  </section>;
}
