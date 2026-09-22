import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import MarketplaceHeader from '@/components/MarketplaceHeader';
import Footer from '@/components/Footer';
import { getPublishedBlogPostBySlug } from '@/lib/blog-service';

interface BlogPostPageProps { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const post = await getPublishedBlogPostBySlug((await params).slug);
  if (!post) return { title: 'Conteúdo não encontrado | Educalizando', robots: { index: false, follow: false } };
  const title = post.seo_title || `${post.title} | Blog Educalizando`;
  const description = post.seo_description || post.excerpt;
  return { title, description, alternates: { canonical: `https://www.educalizando.com.br/blog/${post.slug}` }, openGraph: { title, description, type: 'article', images: post.cover_url ? [post.cover_url] : undefined }, twitter: { card: 'summary_large_image', title, description, images: post.cover_url ? [post.cover_url] : undefined } };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const post = await getPublishedBlogPostBySlug((await params).slug);
  if (!post) notFound();
  const url = `https://www.educalizando.com.br/blog/${post.slug}`;
  return <div className="flex min-h-screen flex-col bg-slate-50"><MarketplaceHeader /><main className="flex-1"><article className="mx-auto max-w-3xl px-4 py-7 sm:px-6 sm:py-14"><Link href="/blog" className="inline-flex min-h-11 items-center rounded-lg px-1 text-sm font-bold text-blue-700 hover:text-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">← Voltar aos guias</Link><p className="mt-6 text-xs font-black uppercase tracking-[0.16em] text-blue-600">Guia Educalizando</p><h1 className="mt-3 break-words text-3xl font-black leading-tight text-slate-900 sm:text-5xl">{post.title}</h1><p className="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg">{post.excerpt}</p>{post.cover_url && <img src={post.cover_url} alt={`Capa do guia: ${post.title}`} width={1200} height={630} fetchPriority="high" decoding="async" className="mt-7 aspect-[1.9/1] w-full rounded-2xl object-cover" />}{post.published_at && <p className="mt-5 text-sm text-slate-500">Publicado em {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(post.published_at))}</p>}<div className="mt-8 break-words whitespace-pre-line text-base leading-8 text-slate-700">{post.content}</div></article><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'Article', headline: post.title, description: post.excerpt, ...(post.published_at ? { datePublished: post.published_at } : {}), mainEntityOfPage: url, ...(post.cover_url ? { image: post.cover_url } : {}) }) }} /></main><Footer /></div>;
}
