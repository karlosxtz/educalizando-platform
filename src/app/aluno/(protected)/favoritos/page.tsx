'use client';

import ProductCard from '@/components/ProductCard';
import StudentHeader from '@/components/aluno/StudentHeader';
import { getCurrentStudentSession } from '@/lib/student-service';
import { supabase } from '@/lib/supabase';
import type { Product, Store } from '@/lib/types';
import { Heart, Loader2, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type FavoriteProduct = Product & { store?: Store };
type FavoriteRow = { product_id: string; products: FavoriteProduct | null };

export default function StudentFavoritesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [products, setProducts] = useState<FavoriteProduct[]>([]);
  const [student, setStudent] = useState<{ fullName: string; email: string; avatarUrl?: string } | null>(null);

  useEffect(() => {
    async function loadFavorites() {
      try {
        const session = await getCurrentStudentSession();
        if (!session) {
          router.replace('/cliente/login?returnTo=/cliente/favoritos');
          return;
        }
        setStudent(session);

        const { data, error: queryError } = await supabase
          .from('product_favorites')
          .select('product_id, products(*, store:stores(*))')
          .eq('user_id', session.id)
          .order('created_at', { ascending: false });

        if (queryError) throw queryError;
        const rows = (data || []) as unknown as FavoriteRow[];
        setProducts(rows.map((row) => row.products).filter((product): product is FavoriteProduct => Boolean(product && product.status === 'publicado' && !product.excluido_em)));
      } catch {
        setError('Não foi possível carregar seus materiais favoritos agora.');
      } finally {
        setLoading(false);
      }
    }

    void loadFavorites();
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <StudentHeader studentName={student?.fullName} studentEmail={student?.email} studentAvatarUrl={student?.avatarUrl} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-3xl border border-rose-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-rose-50 text-rose-600"><Heart className="h-6 w-6 fill-current" /></span>
            <div><p className="text-xs font-black uppercase tracking-[.16em] text-rose-600">Sua seleção</p><h1 className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">Materiais favoritos</h1><p className="mt-2 text-sm text-slate-600">Guarde os materiais que deseja consultar ou comprar depois.</p></div>
          </div>
        </section>

        {loading ? <div className="grid min-h-72 place-items-center"><Loader2 className="h-8 w-8 animate-spin text-blue-700" /></div> : error ? <p className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">{error}</p> : products.length > 0 ? <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <section className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center"><Heart className="mx-auto h-10 w-10 text-slate-300" /><h2 className="mt-4 text-lg font-black text-slate-900">Nenhum favorito ainda</h2><p className="mt-2 text-sm text-slate-500">Use o botão Favoritar nas páginas dos materiais para montar sua lista.</p><Link href="/buscar" className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 text-sm font-black text-white hover:bg-blue-800"><Search className="h-4 w-4" />Encontrar materiais</Link></section>}
      </main>
    </div>
  );
}
