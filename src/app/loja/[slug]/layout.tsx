import { CartProvider } from '@/components/store/CartContext';
import CartSidebar from '@/components/store/CartSidebar';
import CartWidget from '@/components/store/CartWidget';
import StoreCartTracker from '@/components/store/StoreCartTracker';
import { readPublicStore as getStoreBySlug } from '@/lib/public-page-data';
import { notFound } from 'next/navigation';
import { ReactNode } from 'react';

interface StoreLayoutProps {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function StoreLayout({ children, params }: StoreLayoutProps) {
  const { slug } = await params;
  
  // Buscar loja para obter o ID que escopa o carrinho
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  return (
    <CartProvider storeId={store.id}>
      <StoreCartTracker storeId={store.id} storeSlug={store.slug} />
      {children}
      <CartWidget />
      <CartSidebar storeSlug={store.slug} store={store} />
    </CartProvider>
  );
}
