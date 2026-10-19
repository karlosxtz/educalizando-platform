import { supabase } from '@/lib/supabase';
import { cache } from 'react';

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
  store_id?: string | null;
  topic?: string | null;
  store?: { nome_loja:string;slug:string;logo_url?:string|null } | null;
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

export const getPublishedBlogPostBySlug = cache(async (slug: string): Promise<BlogPost | null> => {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*,store:stores(nome_loja,slug,logo_url)')
    .eq('slug', slug)
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .maybeSingle();

  if (error) {
    if (error.code !== '42P01') console.error('[blog] Erro ao buscar post:', error.message);
    return null;
  }
  return data as BlogPost | null;
});

export const BLOG_PAGE_SIZE = 12;
export const getPublicBlogPage = cache(async (q:string,topic:string,page:number) => {
  let query=supabase.from('blog_posts').select('id,title,slug,excerpt,cover_url,topic,store_id,published_at,updated_at,store:stores(nome_loja,slug,logo_url)',{count:'exact'}).eq('status','published').lte('published_at',new Date().toISOString());
  if(q) query=query.ilike('title','%'+q.replace(/[%_]/g,' ')+'%');
  if(topic) query=query.eq('topic',topic);
  const {data,count,error}=await query.order('published_at',{ascending:false}).order('id').range((page-1)*BLOG_PAGE_SIZE,page*BLOG_PAGE_SIZE-1);
  return {posts:(data || []) as unknown as BlogPost[],total:count || 0,unavailable:Boolean(error)};
});
