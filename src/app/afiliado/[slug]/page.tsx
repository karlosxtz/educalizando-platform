import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getAffiliateProfileBySlug, getAffiliateApprovedProducts } from '@/lib/affiliate-service';
import AffiliateStoreClientView from './AffiliateStoreClientView';

function StoreSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <div className="w-full pt-12 pb-24 bg-slate-800">
        <div className="max-w-3xl mx-auto px-4 mt-8 flex flex-col items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-slate-700 animate-pulse border-4 border-slate-600" />
          <div className="w-64 h-12 bg-slate-700 animate-pulse rounded-xl" />
          <div className="w-96 h-6 bg-slate-700 animate-pulse rounded-lg" />
        </div>
      </div>
      <main className="max-w-7xl mx-auto px-4 -mt-12 relative z-20">
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 mb-8 max-w-5xl mx-auto flex gap-3 overflow-x-hidden">
          <div className="h-10 w-48 bg-slate-100 animate-pulse rounded-lg" />
          <div className="h-10 w-32 bg-slate-100 animate-pulse rounded-full" />
          <div className="h-10 w-32 bg-slate-100 animate-pulse rounded-full" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm flex flex-col h-[400px]">
              <div className="p-5 flex-1 flex flex-col gap-4">
                <div className="w-full aspect-[3/4] bg-slate-100 animate-pulse rounded-xl" />
                <div className="space-y-2">
                  <div className="w-full h-5 bg-slate-100 animate-pulse rounded" />
                  <div className="w-2/3 h-5 bg-slate-100 animate-pulse rounded" />
                </div>
                <div className="mt-auto flex flex-col gap-3">
                  <div className="w-32 h-6 bg-slate-100 animate-pulse rounded mx-auto" />
                  <div className="w-full h-12 bg-slate-100 animate-pulse rounded-xl" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

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
    <Suspense fallback={<StoreSkeleton />}>
      <AffiliateStoreClientView 
        profile={profile}
        products={products}
      />
    </Suspense>
  );
}
