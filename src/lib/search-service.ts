import { INITIAL_EDUCATION_LEVELS,INITIAL_GLOBAL_CATEGORIES } from './category-service';
import { searchMatchScore } from './search-matching';
import { parseRecommendedAges } from './age-range';
import { getAllPublicMarketplaceProducts } from './store-service';
import { supabase } from './supabase';
import { Product,Store } from './types';

export { getSearchTerms,normalizeSearchText,searchMatchScore } from './search-matching';

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
  idade?: string;
  tema?: string;
  bncc?: string;
  cor?: string;
  page?: number;
}

export interface SearchResult {
  data: (Product & { store?: Store })[];
  count: number;
  totalPages: number;
  /** Indica quando a busca encontrou o termo em descrição, tags ou formato. */
  matchMode?: 'exact' | 'expanded';
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

      // A busca com termo é aplicada depois de carregar o catálogo filtrado.
      // Isso inclui tags, descrição, formato e tema, não somente o título.

      // 2. Categoria
      if (filters.categoria) {
        const { data: cat } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', filters.categoria)
          .single();
          
        if (cat) {
          query = query.or(`category_id.eq.${cat.id},category_ids.cs.{${cat.id}}`);
        } else {
          query = query.eq('category_id', '00000000-0000-0000-0000-000000000000'); // Força zero resultados
        }
      }

      // 3. Preço
      if (filters.filter === 'plr') {
        query = query.eq('is_plr', true).gt('preco_plr', 0).eq('has_plr_delivery', true);
      }

      if (filters.data) query = query.contains('seasonal_tags', [filters.data]);
      if (filters.cor) query = ['colorido', 'preto_e_branco'].includes(filters.cor)
        ? query.in('color_mode', [filters.cor, 'colorido_e_preto_e_branco'])
        : query.eq('color_mode', filters.cor);
      if (filters.tema) {
        const theme = filters.tema.replace(/[%_,()]/g, ' ').trim();
        if (theme) query = query.or(`titulo.ilike.%${theme}%,descricao.ilike.%${theme}%,tags.cs.{${theme}}`);
      }

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
          query = query.or(`education_level_id.eq.${eduLevel.id},education_level_ids.cs.{${eduLevel.id}}`);
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

      if (filters.bncc) {
        const code = filters.bncc.trim().toLocaleLowerCase('pt-BR');
        const { data: skills } = await supabase.from('bncc_skills').select('id').ilike('code', `%${code}%`);
        const skillIds = (skills || []).map(skill => skill.id);
        const { data: links } = skillIds.length
          ? await supabase.from('product_bncc_skills').select('product_id').in('bncc_skill_id', skillIds)
          : { data: [] as { product_id: string }[] };
        const productIds = [...new Set((links || []).map(link => link.product_id))];
        query = productIds.length ? query.in('id', productIds) : query.eq('id', '00000000-0000-0000-0000-000000000000');
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

      if (filters.q || filters.idade) {
        const { data, error } = await query.order('created_at', { ascending: false }).limit(500);
        if (!error && data) {
          const matching = (data as (Product & { store?: Store })[])
            .filter(product => !filters.q || searchMatchScore(product, filters.q) > 0)
            .filter(product => !filters.idade || parseRecommendedAges(product.age_range).includes(Number(filters.idade)))
            .sort((a, b) => {
              if (filters.sort === 'recentes') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
              if (filters.sort === 'popular') return Number(b.views_count || 0) - Number(a.views_count || 0);
              if (filters.sort === 'menor-preco') return Number(filters.filter === 'plr' ? a.preco_plr : a.preco) - Number(filters.filter === 'plr' ? b.preco_plr : b.preco);
              if (filters.sort === 'maior-preco') return Number(filters.filter === 'plr' ? b.preco_plr : b.preco) - Number(filters.filter === 'plr' ? a.preco_plr : a.preco);
              if (filters.sort === 'avaliacao') return Number(b.average_rating || 0) - Number(a.average_rating || 0) || Number(b.review_count || 0) - Number(a.review_count || 0);
              if (filters.sort === 'vendas') return Number(b.sales_count || 0) - Number(a.sales_count || 0);
              const score = filters.q ? searchMatchScore(b, filters.q) - searchMatchScore(a, filters.q) : 0;
              return score || Number(b.views_count || 0) - Number(a.views_count || 0) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });
          return {
            data: matching.slice(from, to + 1),
            count: matching.length,
            totalPages: Math.ceil(matching.length / ITEMS_PER_PAGE),
            matchMode: 'expanded',
          };
        }
      }

      // 7. Ordenação
      if (filters.sort) {
        if (filters.sort === 'popular') {
          query = query.order('views_count', { ascending: false }).order('created_at', { ascending: false });
        } else if (filters.sort === 'menor-preco') {
          query = query.order(filters.filter === 'plr' ? 'preco_plr' : 'preco', { ascending: true });
        } else if (filters.sort === 'maior-preco') {
          query = query.order(filters.filter === 'plr' ? 'preco_plr' : 'preco', { ascending: false });
        } else if (filters.sort === 'avaliacao') {
          query = query.order('average_rating', { ascending: false }).order('review_count', { ascending: false });
        } else if (filters.sort === 'vendas') {
          query = query.order('sales_count', { ascending: false });
        } else {
          query = query.order('created_at', { ascending: false });
        }
      } else {
        query = query.order('created_at', { ascending: false });
      }

      query = query.range(from, to);

      const { data, error, count } = await query;

      if (!error && data && (data.length > 0 || !filters.q)) {
        return {
          data: data as (Product & { store?: Store })[],
          count: count || 0,
          totalPages: count ? Math.ceil(count / ITEMS_PER_PAGE) : 0,
          matchMode: 'exact',
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
  if (filters.disciplina || filters.bncc) return { data: [], count: 0, totalPages: 0 };

  if (filters.q) {
    allProducts = allProducts.filter((product) => searchMatchScore(product, filters.q as string) > 0);
  }

  if (filters.filter === 'plr') {
    allProducts = allProducts.filter(p =>
      p.is_plr === true && Number(p.preco_plr || 0) > 0 && Boolean(p.has_plr_delivery || p.plr_license_url)
    );
  }
  if (filters.data) allProducts = allProducts.filter((product) => product.seasonal_tags?.includes(filters.data as string));
  if (filters.cor) allProducts = allProducts.filter(product => product.color_mode === filters.cor || (['colorido', 'preto_e_branco'].includes(filters.cor!) && product.color_mode === 'colorido_e_preto_e_branco'));
  if (filters.idade) {
    const age = Number.parseInt(filters.idade, 10);
    if (Number.isFinite(age)) allProducts = allProducts.filter(product => parseRecommendedAges(product.age_range).includes(age));
  }
  if (filters.tema) {
    const theme = filters.tema.toLocaleLowerCase('pt-BR');
    allProducts = allProducts.filter(product => [product.titulo, product.descricao, ...(product.tags || [])].filter(Boolean).join(' ').toLocaleLowerCase('pt-BR').includes(theme));
  }

  if (filters.categoria) {
    const categoryObj = INITIAL_GLOBAL_CATEGORIES.find(c => c.slug === filters.categoria);
    if (categoryObj) {
      allProducts = allProducts.filter(p => p.category_id === categoryObj.id || p.category_ids?.includes(categoryObj.id));
    } else {
      // Uma URL adulterada não pode transformar um filtro inexistente em
      // acesso ao catálogo completo.
      allProducts = [];
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
      allProducts = allProducts.filter(p => p.education_level_id === eduLevel.id || p.education_level_ids?.includes(eduLevel.id));
    } else {
      allProducts = [];
    }
  }

  if (filters.formato) {
    if (filters.formato === 'pdf') allProducts = allProducts.filter(p => p.tipo === 'pdf');
    const format = (product: Product) => (product.format_details || '').toLocaleLowerCase('pt-BR');
    if (filters.formato === 'word') allProducts = allProducts.filter(p => format(p).includes('word'));
    if (filters.formato === 'ppt') allProducts = allProducts.filter(p => ['powerpoint', 'ppt', 'slides'].some(term => format(p).includes(term)));
    if (filters.formato === 'planilha') allProducts = allProducts.filter(p => ['planilha', 'excel'].some(term => format(p).includes(term)));
  }

  if (filters.q && !filters.sort) {
    allProducts.sort((a, b) => {
      const scoreDifference = searchMatchScore(b, filters.q as string) - searchMatchScore(a, filters.q as string);
      return scoreDifference || new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  } else if (filters.sort) {
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
    } else if (filters.sort === 'avaliacao') {
      allProducts.sort((a, b) => Number(b.average_rating || 0) - Number(a.average_rating || 0) || Number(b.review_count || 0) - Number(a.review_count || 0));
    } else if (filters.sort === 'vendas') {
      allProducts.sort((a, b) => Number(b.sales_count || 0) - Number(a.sales_count || 0));
    } else if (filters.sort === 'relevancia' && filters.q) {
      allProducts.sort((a, b) => searchMatchScore(b, filters.q!) - searchMatchScore(a, filters.q!));
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
    totalPages: Math.ceil(allProducts.length / ITEMS_PER_PAGE),
    matchMode: filters.q ? 'expanded' : 'exact',
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
  return all
    .filter((product) => searchMatchScore(product, query) > 0)
    .sort((a, b) => searchMatchScore(b, query) - searchMatchScore(a, query))
    .slice(0, 5)
    .map(p => ({ titulo: p.titulo }));
}
