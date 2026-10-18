import Link from 'next/link';
import Image from 'next/image';
import CatalogImage from '@/components/ui/CatalogImage';
import type { Product, Store } from '@/lib/types';
import ProductDescriptionContent from './ProductDescriptionContent';
import { productCoverImageUrl, productPublicImageUrls } from '@/lib/seo';
import CampaignAttribution from '@/components/CampaignAttribution';
import { Suspense } from 'react';

export default function ProductPublicSummary({ product, store, plr = false }: { product: Product; store: Store; plr?: boolean }) {
  const license = plr && product.is_plr;
  const price = license ? product.preco_plr : product.is_free ? 0 : product.preco;
  const description = license && product.plr_descricao ? product.plr_descricao : product.descricao;
  const images = license ? [] : productPublicImageUrls(product, 4);
  const cover = product.capa_url ? productCoverImageUrl(product.slug || product.id, product.capa_url) : null;
  const gallery = images.filter(url => url !== cover).slice(0, 3);
  const checkout = `/loja/${encodeURIComponent(store.slug)}/checkout?produtoId=${encodeURIComponent(product.id)}${license ? '&licenca=plr' : ''}`;
  return (
    <main className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 md:grid-cols-2">
      <Suspense fallback={null}><CampaignAttribution storeId={store.id} /></Suspense>
      <div className="space-y-4">
        {product.capa_url && <Image unoptimized src={productCoverImageUrl(product.slug || product.id, product.capa_url)} alt={`Capa de ${product.titulo}`} width={600} height={800} loading="eager" fetchPriority="high" className="max-h-[640px] w-full rounded-2xl bg-white object-contain" />}
        {gallery.length > 0 && <section aria-label="Imagens cadastradas do material" className="grid grid-cols-3 gap-2">
          {gallery.map((url, index) => <a key={url} href={url} target="_blank" rel="noopener noreferrer" aria-label={`Ampliar imagem da galeria ${index + 1} de ${product.titulo}`}>
            <CatalogImage src={url} alt={`Imagem da galeria ${index + 1} de ${product.titulo}`} width={240} height={240} loading="lazy" className="aspect-square w-full rounded-xl border border-slate-200 bg-white object-contain" />
          </a>)}
        </section>}
      </div>
      <article className="space-y-5">
        <Link href={`/loja/${encodeURIComponent(store.slug)}`} className="font-bold text-blue-800">{store.nome_loja}</Link>
        <h1 className="text-3xl font-black text-slate-900">{product.titulo}</h1>
        {Number(product.review_count) > 0 && <p className="text-sm text-slate-700">Avaliação: {product.average_rating}/5 · {product.review_count} avaliações</p>}
        <p className="text-sm font-bold text-slate-600">{license ? 'Versão PLR' : 'Material digital'}{!license && product.format_details ? ` · ${product.format_details}` : ''}</p>
        <p className="text-2xl font-bold text-blue-900">{price != null && Number.isFinite(Number(price)) ? Number(price) === 0 ? 'Gratuito' : Number(price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Consulte as opções de compra'}</p>
        <Link href={checkout} className="inline-block rounded-xl bg-blue-900 px-6 py-3 font-bold text-white">Ver opções de compra</Link>
        <h2 className="text-xl font-bold">Sobre este material</h2>
        <ProductDescriptionContent value={description || ''} />
        <dl className="space-y-2 text-slate-700">
          {!license && product.page_count ? <div><dt className="inline font-bold">{product.tipo === 'video' ? 'Itens: ' : 'Páginas: '}</dt><dd className="inline">{product.page_count}</dd></div> : null}
          {!license && product.age_range && <div><dt className="inline font-bold">Faixa indicada: </dt><dd className="inline">{product.age_range}</dd></div>}
        </dl>
      </article>
    </main>
  );
}
