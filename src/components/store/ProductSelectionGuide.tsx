import Link from 'next/link';
import type { Product, Store } from '@/lib/types';
import { productSampleLink, productSelectionFacts } from '@/lib/product-selection';
import { readableProductDescription } from '@/lib/product-description';

/** Persists outside the progressive client view; no extra queries or client JS. */
export default function ProductSelectionGuide({ product, store, plr = false }: {
  product: Product; store: Store; plr?: boolean;
}) {
  const license = plr && product.is_plr;
  const facts = productSelectionFacts(product, plr);
  const sample = license ? null : productSampleLink(product.preview_url);
  return <section aria-label="Informações para escolher o material" className="mx-auto w-full max-w-6xl px-4 py-8">
    <div className="grid gap-6 rounded-2xl border border-blue-100 bg-white p-5 sm:p-8 md:grid-cols-2">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Confira antes de escolher</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Informações cadastradas para {product.titulo}. Compare com os objetivos e as necessidades da sua turma.</p>
        <dl className="mt-4 space-y-3">{facts.map(fact => <div key={fact.label}>
          <dt className="text-sm font-bold text-slate-800">{fact.label}</dt>
          <dd className="mt-1 text-sm text-slate-600">{fact.value}</dd>
        </div>)}</dl>
        {sample && <a href={sample} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-blue-800 px-4 py-2 font-bold text-white">Conferir a prévia do material<span className="sr-only"> em nova aba</span></a>}
      </div>
      <div>
        <h3 className="font-bold text-slate-900">Conheça quem disponibiliza o material</h3>
        <Link prefetch={false} href={`/loja/${encodeURIComponent(store.slug)}`} className="mt-2 inline-flex min-h-11 items-center font-bold text-blue-800 underline">{store.nome_loja}</Link>
        {store.author_bio?.trim() && <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{readableProductDescription(store.author_bio)}</p>}
        <details className="mt-4 rounded-xl border border-slate-200 p-4">
          <summary className="cursor-pointer font-semibold text-slate-800">Como avaliar se este recurso atende à minha aula?</summary>
          <p className="mt-3 text-sm leading-6 text-slate-600">Leia o conteúdo incluído na descrição{sample ? ', abra a prévia' : ''} e compare as informações do cadastro com o que seus alunos já sabem. Verifique o formato e as condições de uso; não presuma que o arquivo seja editável ou inclua respostas se isso não estiver informado.</p>
        </details>
        {license && <p className="mt-4 text-sm leading-6 text-slate-600">Você está consultando a modalidade PLR. Os direitos e os arquivos incluídos devem ser conferidos na descrição e nas condições específicas dessa licença.</p>}
      </div>
    </div>
  </section>;
}
