import { supabase } from '@/lib/supabase';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_url?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  status: 'draft' | 'published';
  published_at?: string | null;
  created_at: string;
  updated_at: string;
}

export async function getPublishedBlogPosts(limit = 24): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    if (error.code !== '42P01') console.error('[blog] Erro ao listar posts:', error.message);
    return [];
  }
  return (data || []) as BlogPost[];
}

export async function getPublishedBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .maybeSingle();

  if (error) {
    if (error.code !== '42P01') console.error('[blog] Erro ao buscar post:', error.message);
    return null;
  }
  return data as BlogPost | null;
}
