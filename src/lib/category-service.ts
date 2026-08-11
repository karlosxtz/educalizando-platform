import { supabase } from './supabase';
import { Category, EducationLevel } from './types';

// Initial Mock Seed Data for Local Development
// Initial Global Seed Data with valid UUIDs
export const INITIAL_GLOBAL_CATEGORIES: Category[] = [
  { id: '11111111-1111-4111-a111-111111111101', nome: 'Matemática', slug: 'matematica', store_id: null, created_at: new Date().toISOString() },
  { id: '11111111-1111-4111-a111-111111111102', nome: 'Português & Literatura', slug: 'portugues-literatura', store_id: null, created_at: new Date().toISOString() },
  { id: '11111111-1111-4111-a111-111111111103', nome: 'Redação 1000', slug: 'redacao-1000', store_id: null, created_at: new Date().toISOString() },
  { id: '11111111-1111-4111-a111-111111111104', nome: 'Ciências & Biologia', slug: 'ciencias-biologia', store_id: null, created_at: new Date().toISOString() },
  { id: '11111111-1111-4111-a111-111111111105', nome: 'História & Geografia', slug: 'historia-geografia', store_id: null, created_at: new Date().toISOString() },
  { id: '11111111-1111-4111-a111-111111111106', nome: 'Concursos Públicos', slug: 'concursos-publicos', store_id: null, created_at: new Date().toISOString() },
  { id: '11111111-1111-4111-a111-111111111107', nome: 'Vestibular & ENEM', slug: 'vestibular-enem', store_id: null, created_at: new Date().toISOString() },
  { id: '11111111-1111-4111-a111-111111111108', nome: 'Outros Conteúdos', slug: 'outros-conteudos', store_id: null, created_at: new Date().toISOString() }
];

export const INITIAL_EDUCATION_LEVELS: EducationLevel[] = [
  { id: '22222222-2222-4222-a222-222222222201', nome: 'Educação Infantil', slug: 'educacao-infantil', ordem: 1, created_at: new Date().toISOString() },
  { id: '22222222-2222-4222-a222-222222222202', nome: 'Ensino Fundamental I', slug: 'ensino-fundamental-1', ordem: 2, created_at: new Date().toISOString() },
  { id: '22222222-2222-4222-a222-222222222203', nome: 'Ensino Fundamental II', slug: 'ensino-fundamental-2', ordem: 3, created_at: new Date().toISOString() },
  { id: '22222222-2222-4222-a222-222222222204', nome: 'Ensino Médio', slug: 'ensino-medio', ordem: 4, created_at: new Date().toISOString() },
  { id: '22222222-2222-4222-a222-222222222205', nome: 'Pré-Vestibular / ENEM', slug: 'pre-vestibular-enem', ordem: 5, created_at: new Date().toISOString() },
  { id: '22222222-2222-4222-a222-222222222206', nome: 'Ensino Superior & Pós', slug: 'ensino-superior-pos', ordem: 6, created_at: new Date().toISOString() },
  { id: '22222222-2222-4222-a222-222222222207', nome: 'Concursos Públicos', slug: 'concursos-publicos', ordem: 7, created_at: new Date().toISOString() },
  { id: '22222222-2222-4222-a222-222222222208', nome: 'Idiomas & Cursos Livres', slug: 'idiomas-cursos-livres', ordem: 8, created_at: new Date().toISOString() }
];

function getLocalCustomCategories(): Category[] {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem('educalizando_custom_categories');
  return saved ? JSON.parse(saved) : [];
}

function saveLocalCustomCategories(cats: Category[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('educalizando_custom_categories', JSON.stringify(cats));
  }
}

// 1. Obter Categorias (Globais + Customizadas da Loja)
export async function getCategories(storeId?: string): Promise<Category[]> {
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase) {
    try {
      let query = supabase.from('categories').select('*');
      if (storeId) {
        query = query.or(`store_id.is.null,store_id.eq.${storeId}`);
      } else {
        query = query.is('store_id', null);
      }
      
      const { data, error } = await query.order('nome', { ascending: true });
      if (!error && data && data.length > 0) {
        return data as Category[];
      }
    } catch (err) {
      console.error('[getCategories] Erro:', err);
    }
  }

  // Fallback Local
  const custom = getLocalCustomCategories().filter(c => !storeId || c.store_id === storeId);
  return [...INITIAL_GLOBAL_CATEGORIES, ...custom];
}

// 2. Obter Níveis de Escolaridade Globais
export async function getEducationLevels(): Promise<EducationLevel[]> {
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase) {
    try {
      const { data, error } = await supabase
        .from('education_levels')
        .select('*')
        .order('ordem', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as EducationLevel[];
      }
    } catch (err) {
      console.error('[getEducationLevels] Erro:', err);
    }
  }

  return INITIAL_EDUCATION_LEVELS;
}

// 3. Criar Categoria Customizada da Loja
export async function createCustomCategory(storeId: string, nome: string): Promise<Category> {
  const slug = nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase) {
    const { data, error } = await supabase
      .from('categories')
      .insert([{ nome, slug, store_id: storeId }])
      .select()
      .single();

    if (error) throw new Error(`Erro ao criar categoria: ${error.message}`);
    return data as Category;
  }

  // Fallback Local
  const newCat: Category = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `cat_${Date.now()}`,
    nome,
    slug,
    store_id: storeId,
    created_at: new Date().toISOString()
  };

  const custom = getLocalCustomCategories();
  custom.push(newCat);
  saveLocalCustomCategories(custom);
  return newCat;
}

// 4. Editar Categoria Customizada
export async function updateCustomCategory(categoryId: string, nome: string): Promise<Category> {
  const slug = nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase) {
    const { data, error } = await supabase
      .from('categories')
      .update({ nome, slug })
      .eq('id', categoryId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Category;
  }

  // Fallback Local
  const custom = getLocalCustomCategories();
  const index = custom.findIndex(c => c.id === categoryId);
  if (index === -1) throw new Error('Categoria não encontrada.');
  custom[index].nome = nome;
  custom[index].slug = slug;
  saveLocalCustomCategories(custom);
  return custom[index];
}

// 5. Excluir Categoria Customizada (Com trava de uso em produtos)
export async function deleteCustomCategory(categoryId: string): Promise<void> {
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase) {
    // Verificar se a categoria está associada a algum produto
    const { count, error: countErr } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', categoryId);

    if (!countErr && count && count > 0) {
      throw new Error(`Esta categoria não pode ser excluída pois está associada a ${count} produto(s). Altere os produtos antes de excluir.`);
    }

    const { error } = await supabase.from('categories').delete().eq('id', categoryId);
    if (error) throw new Error(error.message);
    return;
  }

  // Fallback Local
  const custom = getLocalCustomCategories();
  const filtered = custom.filter(c => c.id !== categoryId);
  saveLocalCustomCategories(filtered);
}
