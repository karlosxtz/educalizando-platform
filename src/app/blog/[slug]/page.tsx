import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import MarketplaceHeader from '@/components/MarketplaceHeader';
import Footer from '@/components/Footer';
import { getPublishedBlogPostBySlug } from '@/lib/blog-service';

interface BlogPostPageProps { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const post = await getPublishedBlogPostBySlug((await params).slug);
  if (!post) return { title: 'Conteúdo não encontrado | Educalizando' };
  const title = post.seo_title || `${post.title} | Blog Educalizando`;
  const description = post.seo_description || post.excerpt;
  return { title, description, alternates: { canonical: `https://www.educalizando.com.br/blog/${post.slug}` }, openGraph: { title, description, type: 'article', images: post.cover_url ? [post.cover_url] : undefined } };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const post = await getPublishedBlogPostBySlug((await params).slug);
  if (!post) notFound();
  const url = `https://www.educalizando.com.br/blog/${post.slug}`;
  return <div className="flex min-h-screen flex-col bg-slate-50"><MarketplaceHeader /><main className="flex-1"><article className="mx-auto max-w-3xl px-4 py-8 sm:py-14"><Link href="/blog" className="text-sm font-bold text-blue-700">← Voltar aos guias</Link><p className="mt-8 text-xs font-black uppercase tracking-[0.16em] text-blue-600">Guia Educalizando</p><h1 className="mt-3 text-3xl font-black leading-tight text-slate-900 sm:text-5xl">{post.title}</h1><p className="mt-5 text-lg leading-relaxed text-slate-600">{post.excerpt}</p>{post.cover_url && <img src={post.cover_url} alt={`Capa do guia: ${post.title}`} width={1200} height={630} fetchPriority="high" decoding="async" className="mt-8 aspect-[1.9/1] w-full rounded-2xl object-cover" />}{post.published_at && <p className="mt-5 text-sm text-slate-500">Publicado em {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(post.published_at))}</p>}<div className="mt-8 whitespace-pre-line text-base leading-8 text-slate-700">{post.content}</div></article><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'Article', headline: post.title, description: post.excerpt, datePublished: post.published_at, mainEntityOfPage: url, image: post.cover_url }) }} /></main><Footer /></div>;
}
