import { supabase } from './supabase';
import { Product, Store } from './types';
import { getAllPublicMarketplaceProducts } from './store-service';
import { INITIAL_GLOBAL_CATEGORIES, INITIAL_EDUCATION_LEVELS } from './category-service';

export interface SearchFilters {
  q?: string;
  categoria?: string;
  preco?: string;
  ano_escolar?: string;
  formato?: string;
  sort?: string;
  page?: number;
}

export interface SearchResult {
  data: (Product & { store?: Store })[];
  count: number;
  totalPages: number;
}

const ITEMS_PER_PAGE = 24;

export async function searchProducts(filters: SearchFilters): Promise<SearchResult> {
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-id') &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  const page = filters.page || 1;
  const from = (page - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  if (isRealSupabase) {
    try {
      let query = supabase
        .from('products')
        .select('*, store:store_id(*), category:category_id(*)', { count: 'exact' })
        .eq('status', 'publicado')
        .is('excluido_em', null);

      // 1. Busca Flexível (Fragmentos via ILIKE)
      if (filters.q) {
        query = query.ilike('titulo', `%${filters.q}%`);
      }

      // 2. Categoria
      if (filters.categoria) {
        const categoryObj = INITIAL_GLOBAL_CATEGORIES.find(c => c.slug === filters.categoria);
        if (categoryObj) {
          query = query.eq('category_id', categoryObj.id);
        }
      }

      // 3. Preço
      if (filters.preco) {
        if (filters.preco === 'gratis') {
          query = query.or('preco.eq.0,is_free.eq.true');
        } else if (filters.preco === 'pago') {
          query = query.gt('preco', 0).eq('is_free', false);
        }
      }

      // 4. Ano Escolar
      if (filters.ano_escolar) {
        const eduLevel = INITIAL_EDUCATION_LEVELS.find(e => e.slug === filters.ano_escolar);
        if (eduLevel) {
          query = query.eq('education_level_id', eduLevel.id);
        }
      }

      // 5. Formato (Map para tipo)
      if (filters.formato) {
        if (filters.formato === 'pdf') query = query.eq('tipo', 'pdf');
        if (filters.formato === 'word' || filters.formato === 'ppt') query = query.eq('tipo', 'ebook'); 
        if (filters.formato === 'planilha') query = query.eq('tipo', 'simulado'); // mock
      }

      // 6. Ordenação
      if (filters.sort) {
        if (filters.sort === 'menor-preco') {
          query = query.order('preco', { ascending: true });
        } else if (filters.sort === 'maior-preco') {
          query = query.order('preco', { ascending: false });
        } else {
          query = query.order('created_at', { ascending: false });
        }
      } else {
        query = query.order('created_at', { ascending: false });
      }

      query = query.range(from, to);

      const { data, error, count } = await query;

      if (!error && data) {
        return {
          data: data as (Product & { store?: Store })[],
          count: count || 0,
          totalPages: count ? Math.ceil(count / ITEMS_PER_PAGE) : 0
        };
      }
    } catch (err) {
      console.error('[searchProducts] Erro no Supabase:', err);
    }
  }

  // FALLBACK LOCAL
  let allProducts = await getAllPublicMarketplaceProducts(500);

  if (filters.q) {
    const qLower = filters.q.toLowerCase();
    allProducts = allProducts.filter(p => p.titulo.toLowerCase().includes(qLower) || (p.descricao && p.descricao.toLowerCase().includes(qLower)));
  }

  if (filters.categoria) {
    const categoryObj = INITIAL_GLOBAL_CATEGORIES.find(c => c.slug === filters.categoria);
    if (categoryObj) {
      allProducts = allProducts.filter(p => p.category_id === categoryObj.id);
    }
  }

  if (filters.preco) {
    if (filters.preco === 'gratis') {
      allProducts = allProducts.filter(p => p.is_free || p.preco === 0);
    } else if (filters.preco === 'pago') {
      allProducts = allProducts.filter(p => !p.is_free && p.preco > 0);
    }
  }

  if (filters.ano_escolar) {
    const eduLevel = INITIAL_EDUCATION_LEVELS.find(e => e.slug === filters.ano_escolar);
    if (eduLevel) {
      allProducts = allProducts.filter(p => p.education_level_id === eduLevel.id);
    }
  }

  if (filters.formato) {
    if (filters.formato === 'pdf') allProducts = allProducts.filter(p => p.tipo === 'pdf');
    if (filters.formato === 'word' || filters.formato === 'ppt') allProducts = allProducts.filter(p => p.tipo === 'ebook');
    if (filters.formato === 'planilha') allProducts = allProducts.filter(p => p.tipo === 'simulado');
  }

  if (filters.sort) {
    if (filters.sort === 'menor-preco') {
      allProducts.sort((a, b) => a.preco - b.preco);
    } else if (filters.sort === 'maior-preco') {
      allProducts.sort((a, b) => b.preco - a.preco);
    } else {
      allProducts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  } else {
    allProducts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  const paginated = allProducts.slice(from, to + 1);

  return {
    data: paginated,
    count: allProducts.length,
    totalPages: Math.ceil(allProducts.length / ITEMS_PER_PAGE)
  };
}

// Busca rápida e leve exclusiva para o Auto-complete
export async function quickSearch(query: string): Promise<Pick<Product, 'titulo'>[]> {
  if (!query || query.trim().length < 2) return [];

  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-id') &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase) {
    try {
      const { data, error } = await supabase
        .rpc('fuzzy_search_products', { search_term: query, max_results: 5 });

      if (error) {
        console.error('Erro detalhado RPC:', error);
      }

      if (!error && data) {
        return data as Pick<Product, 'titulo'>[];
      }
    } catch (err) {
      console.error('[quickSearch] Exceção na chamada Supabase:', err);
    }
  }

  // Fallback Local
  const all = await getAllPublicMarketplaceProducts(100);
  const qLower = query.toLowerCase();
  return all
    .filter(p => p.titulo.toLowerCase().includes(qLower))
    .slice(0, 5)
    .map(p => ({ titulo: p.titulo }));
}
