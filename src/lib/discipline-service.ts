import { supabase } from '@/lib/supabase';

export interface Discipline {
  name: string;
  slug: string;
}

const FALLBACK_DISCIPLINES = [
  'Língua Portuguesa', 'Matemática', 'Ciências', 'História', 'Geografia',
  'Arte', 'Educação Física', 'Língua Inglesa', 'Ensino Religioso',
].map((name) => ({ name, slug: toDisciplineSlug(name) }));

function toDisciplineSlug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function getDisciplines(): Promise<Discipline[]> {
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-id') &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase) {
    try {
      const { data, error } = await supabase
        .from('bncc_skills')
        .select('subject')
        .not('subject', 'is', null);
      if (!error && data?.length) {
        return [...new Set(data.map((skill) => skill.subject?.trim()).filter(Boolean) as string[])]
          .sort((a, b) => a.localeCompare(b, 'pt-BR'))
          .map((name) => ({ name, slug: toDisciplineSlug(name) }));
      }
    } catch (error) {
      console.error('[getDisciplines] Erro ao carregar disciplinas:', error);
    }
  }

  return FALLBACK_DISCIPLINES;
}
