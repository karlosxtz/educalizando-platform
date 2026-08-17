import { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { getStoreBySlug } from '@/lib/store-service';
import { CartProvider } from '@/components/store/CartContext';
import CartSidebar from '@/components/store/CartSidebar';
import CartWidget from '@/components/store/CartWidget';

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
      {children}
      <CartWidget />
      <CartSidebar storeSlug={store.slug} />
    </CartProvider>
  );
}
