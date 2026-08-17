import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAffiliateProfile, getAffiliateApprovedProducts } from '@/lib/affiliate-service';
import AffiliateStoreClientView from './AffiliateStoreClientView';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const profile = await getAffiliateProfile(id);

  if (!profile) {
    return {
      title: 'Afiliado Não Encontrado — Educalizando'
    };
  }

  return {
    title: `Vitrine de ${profile.nome_loja} — Educalizando`,
    description: profile.descricao || `Confira as recomendações de ${profile.nome_loja} na Educalizando.`,
    openGraph: {
      title: `Vitrine de ${profile.nome_loja} — Educalizando`,
      images: profile.logo_url ? [{ url: profile.logo_url }] : []
    }
  };
}

export default async function AffiliateStorePage({ params }: PageProps) {
  const { id } = await params;
  
  const profile = await getAffiliateProfile(id);

  if (!profile) {
    notFound();
  }

  const products = await getAffiliateApprovedProducts(id);

  return (
    <AffiliateStoreClientView 
      affiliateId={id} 
      profile={profile} 
      products={products} 
    />
  );
}
