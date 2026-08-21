import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAffiliateProfileBySlug, getAffiliateApprovedProducts } from '@/lib/affiliate-service';
import AffiliateStoreClientView from './AffiliateStoreClientView';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getAffiliateProfileBySlug(slug);

  if (!profile) {
    return {
      title: 'Afiliado Não Encontrado — Educalizando'
    };
  }

  return {
    title: `Vitrine de ${profile.nome || 'Afiliado'} — Educalizando`,
    description: profile.descricao || `Confira as recomendações de ${profile.nome || 'Afiliado'} na Educalizando.`,
    openGraph: {
      title: `Vitrine de ${profile.nome || 'Afiliado'} — Educalizando`,
      images: profile.logo_url ? [{ url: profile.logo_url }] : []
    }
  };
}

export default async function AffiliateStorePage({ params }: PageProps) {
  const { slug } = await params;
  
  const profile = await getAffiliateProfileBySlug(slug);

  if (!profile) {
    notFound();
  }

  const products = await getAffiliateApprovedProducts(profile.user_id);

  return (
    <AffiliateStoreClientView 
      profile={profile}
      products={products}
    />
  );
}
