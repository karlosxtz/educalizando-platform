import GuidedStoreChat from '@/components/store/GuidedStoreChat';
import { supabase } from '@/lib/supabase';
import type { Product,Store } from '@/lib/types';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { alternates: { canonical: `/atendimento/${encodeURIComponent(slug)}` } };
}

export default async function GuidedChatPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data: store } = await supabase.from('stores').select('*').eq('slug', slug).maybeSingle();
  if (!store || store.guided_chat_enabled === false) notFound();
  const { data: products } = await supabase.from('products').select('*, category:categories(*), education_level:education_levels(*)').eq('store_id', store.id).eq('status', 'publicado').is('excluido_em', null).order('created_at', { ascending: false });
  return <GuidedStoreChat store={store as Store} products={(products || []) as Product[]} />;
}
