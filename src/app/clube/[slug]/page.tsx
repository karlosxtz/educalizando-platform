import { getPublicClub } from '@/lib/public-club-service';
import { catalogMetadata } from '@/lib/catalog-seo';
import { serializeJsonLd, SITE_URL } from '@/lib/seo';
import { notFound } from 'next/navigation';
import PublicClubClientView from './PublicClubClientView';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublicClub(slug);
  if (!data) notFound();
  return catalogMetadata(data.club.name, data.club.description, '/clube/' + encodeURIComponent(slug), data.club.cover_url);
}

export default async function ClubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getPublicClub(slug);
  if (!data) notFound();
  const url = SITE_URL + '/clube/' + encodeURIComponent(slug);
  const store = Array.isArray(data.club.stores) ? data.club.stores[0] : data.club.stores;
  const schema = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'CollectionPage', '@id': url + '#page', name: data.club.name, description: data.club.description, url },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: SITE_URL },
      ...(store ? [{ '@type': 'ListItem', position: 2, name: store.nome_loja, item: SITE_URL + '/loja/' + encodeURIComponent(store.slug) }] : []),
      { '@type': 'ListItem', position: store ? 3 : 2, name: data.club.name, item: url },
    ] },
  ] };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }} /><PublicClubClientView slug={slug} initialData={data} /></>;
}
