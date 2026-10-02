import { getStoreBySlug } from '@/lib/store-service';
import { notFound } from 'next/navigation';
import ExclusiveMaterialRequestForm from './request-form';
export const dynamic = 'force-dynamic';
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const store = await getStoreBySlug(slug); if (!store) notFound();
  return <ExclusiveMaterialRequestForm store={{ id: store.id, slug: store.slug, name: store.nome_loja, color: store.cor_primaria || '#2563eb' }} />;
}
