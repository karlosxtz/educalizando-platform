import Link from 'next/link';
import type { Category, EducationLevel, Product, Store } from '@/lib/types';

/** Server-rendered links remain available before/after the interactive view loads. */
export default function ProductDiscoveryLinks({ store, category, levels, products, storefront = false }: {
  store: Pick<Store, 'slug' | 'nome_loja'>;
  category?: Category | null;
  levels: EducationLevel[];
  products: Pick<Product, 'id' | 'slug' | 'titulo'>[];
  storefront?: boolean;
}) {
  const storePath = `/loja/${encodeURIComponent(store.slug)}`;
  const links = [
    { href: storePath, label: `Materiais de ${store.nome_loja}` },
    ...(category ? [{
      href: category.store_id ? `${storePath}?category=${encodeURIComponent(category.id)}` : `/categorias/${encodeURIComponent(category.slug || category.id)}`,
      label: category.nome,
    }] : []),
    ...levels.map(level => ({ href: `/atividades-por-ano/${encodeURIComponent(level.slug || level.id)}`, label: level.nome })),
  ];
  return <nav aria-label="Explore materiais relacionados" className="mx-auto w-full max-w-6xl px-4 py-8">
    <h2 className="text-xl font-bold text-slate-900">Continue explorando</h2>
    <ul className="mt-4 flex flex-wrap gap-3">{links.map(link => <li key={link.href}>
      <Link prefetch={false} href={link.href} className="inline-flex min-h-11 items-center rounded-xl border border-blue-100 bg-white px-4 py-2 text-sm font-semibold text-blue-900 hover:bg-blue-50">{link.label}</Link>
    </li>)}</ul>
    {products.length > 0 && <>
      <h3 className="mt-6 font-bold text-slate-800">Outros materiais desta loja</h3>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">{products.map(product => <li key={product.id}>
        <Link prefetch={false} href={`${storefront ? storePath : ''}/produto/${encodeURIComponent(product.slug || product.id)}`} className="block rounded-xl bg-white p-4 text-sm font-medium text-blue-800 underline decoration-blue-200 underline-offset-4 hover:decoration-blue-800">{product.titulo}</Link>
      </li>)}</ul>
    </>}
  </nav>;
}
