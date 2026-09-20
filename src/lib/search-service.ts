import { supabase } from './supabase';
import { Product, Store } from './types';
import { getAllPublicMarketplaceProducts } from './store-service';
import { INITIAL_GLOBAL_CATEGORIES, INITIAL_EDUCATION_LEVELS } from './category-service';

export interface SearchFilters {
  q?: string;
  categoria?: string;
  preco?: string;
  ano_escolar?: string;
  disciplina?: string;
  formato?: string;
  sort?: string;
  filter?: string;
  data?: string;
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

  const page = Number.isSafeInteger(filters.page) && Number(filters.page) > 0 ? Number(filters.page) : 1;
  const from = (page - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  if (isRealSupabase) {
    try {
      let query = supabase
        .from('products')
        .select('*, store:store_id(*), category:category_id(*)', { count: 'exact' })
        .eq('status', 'publicado')
        .is('excluido_em', null);

      // 1. Busca Flexível (Fragmentos via ILIKE na coluna unaccent)
      if (filters.q) {
        const queryLimpo = filters.q.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        query = query.ilike('titulo_limpo', `%${queryLimpo}%`);
      }

      // 2. Categoria
      if (filters.categoria) {
        const { data: cat } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', filters.categoria)
          .single();
          
        if (cat) {
          query = query.eq('category_id', cat.id);
        } else {
          query = query.eq('category_id', '00000000-0000-0000-0000-000000000000'); // Força zero resultados
        }
      }

      // 3. Preço
      if (filters.filter === 'plr') {
        query = query.eq('is_plr', true).gt('preco_plr', 0).eq('has_plr_delivery', true);
      }

      if (filters.data) query = query.contains('seasonal_tags', [filters.data]);

      if (filters.preco) {
        if (filters.preco === 'gratis') {
          query = query.or('preco.eq.0,is_free.eq.true');
        } else if (filters.preco === 'pago') {
          query = query.gt('preco', 0).eq('is_free', false);
        }
      }

      // 4. Ano Escolar
      if (filters.ano_escolar) {
        const { data: eduLevel } = await supabase
          .from('education_levels')
          .select('id')
          .eq('slug', filters.ano_escolar)
          .maybeSingle();
        if (eduLevel) {
          query = query.eq('education_level_id', eduLevel.id);
        } else {
          // Uma URL de nível inexistente nunca deve devolver o catálogo todo.
          query = query.eq('education_level_id', '00000000-0000-0000-0000-000000000000');
        }
      }

      // 5. Disciplina: produtos são associados à disciplina pelas habilidades
      // da BNCC. Primeiro localizamos as habilidades, depois os materiais que
      // as utilizam; assim a rota pública não depende de texto livre no título.
      if (filters.disciplina) {
        const { data: skills } = await supabase
          .from('bncc_skills')
          .select('id')
          .eq('subject', filters.disciplina);
        const skillIds = (skills || []).map((skill) => skill.id);

        if (!skillIds.length) {
          query = query.eq('id', '00000000-0000-0000-0000-000000000000');
        } else {
          const { data: links } = await supabase
            .from('product_bncc_skills')
            .select('product_id')
            .in('bncc_skill_id', skillIds);
          const productIds = [...new Set((links || []).map((link) => link.product_id))];
          query = productIds.length
            ? query.in('id', productIds)
            : query.eq('id', '00000000-0000-0000-0000-000000000000');
        }
      }

      // 6. Formato. PDF é um tipo próprio; Word, PowerPoint e planilha são
      // detalhes declarados pelo criador e não devem ser confundidos com
      // e-book ou simulado.
      if (filters.formato) {
        if (filters.formato === 'pdf') query = query.eq('tipo', 'pdf');
        if (filters.formato === 'word') query = query.ilike('format_details', '%word%');
        if (filters.formato === 'ppt') query = query.or('format_details.ilike.%powerpoint%,format_details.ilike.%ppt%,format_details.ilike.%slides%');
        if (filters.formato === 'planilha') query = query.or('format_details.ilike.%planilha%,format_details.ilike.%excel%');
      }

      // 7. Ordenação
      if (filters.sort) {
        if (filters.sort === 'popular') {
          query = query.order('views_count', { ascending: false }).order('created_at', { ascending: false });
        } else if (filters.sort === 'menor-preco') {
          query = query.order(filters.filter === 'plr' ? 'preco_plr' : 'preco', { ascending: true });
        } else if (filters.sort === 'maior-preco') {
          query = query.order(filters.filter === 'plr' ? 'preco_plr' : 'preco', { ascending: false });
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

  // O fallback não contém os vínculos BNCC: não apresentar materiais como
  // correspondentes a uma disciplina que não pudemos verificar.
  if (filters.disciplina) return { data: [], count: 0, totalPages: 0 };

  if (filters.q) {
    const qLower = filters.q.toLowerCase();
    allProducts = allProducts.filter(p => p.titulo.toLowerCase().includes(qLower) || (p.descricao && p.descricao.toLowerCase().includes(qLower)));
  }

  if (filters.filter === 'plr') {
    allProducts = allProducts.filter(p =>
      p.is_plr === true && Number(p.preco_plr || 0) > 0 && Boolean(p.has_plr_delivery || p.plr_license_url)
    );
  }
  if (filters.data) allProducts = allProducts.filter((product) => product.seasonal_tags?.includes(filters.data as string));

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
    const format = (product: Product) => (product.format_details || '').toLocaleLowerCase('pt-BR');
    if (filters.formato === 'word') allProducts = allProducts.filter(p => format(p).includes('word'));
    if (filters.formato === 'ppt') allProducts = allProducts.filter(p => ['powerpoint', 'ppt', 'slides'].some(term => format(p).includes(term)));
    if (filters.formato === 'planilha') allProducts = allProducts.filter(p => ['planilha', 'excel'].some(term => format(p).includes(term)));
  }

  if (filters.sort) {
    if (filters.sort === 'popular') {
      allProducts.sort((a, b) => Number(b.views_count || 0) - Number(a.views_count || 0));
    } else if (filters.sort === 'menor-preco') {
      allProducts.sort((a, b) => filters.filter === 'plr'
        ? Number(a.preco_plr || 0) - Number(b.preco_plr || 0)
        : a.preco - b.preco);
    } else if (filters.sort === 'maior-preco') {
      allProducts.sort((a, b) => filters.filter === 'plr'
        ? Number(b.preco_plr || 0) - Number(a.preco_plr || 0)
        : b.preco - a.preco);
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
