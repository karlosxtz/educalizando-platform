
import CatalogImage from '@/components/ui/CatalogImage';
import Footer from '@/components/Footer';
import MarketplaceHeader from '@/components/MarketplaceHeader';
import { getPublishedBlogPostBySlug } from '@/lib/blog-service';
import { DEFAULT_SOCIAL_IMAGE,serializeJsonLd,SITE_URL, socialMetadata } from '@/lib/seo';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface BlogPostPageProps { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const post = await getPublishedBlogPostBySlug((await params).slug);
  if (!post) notFound();
  const title = post.seo_title || `${post.title} | Blog Educalizando`;
  const description = post.seo_description || post.excerpt || `Leia ${post.title} no blog da Educalizando.`;
  const url = `${SITE_URL}/blog/${post.slug}`;
  const image = post.cover_url || DEFAULT_SOCIAL_IMAGE;
  return socialMetadata({ title, description, url, type: 'article', image, imageAlt: `Capa do guia: ${post.title}` });
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const post = await getPublishedBlogPostBySlug((await params).slug);
  if (!post) notFound();
  const url = `https://www.educalizando.com.br/blog/${post.slug}`;
  return <div className="flex min-h-screen flex-col bg-slate-50"><MarketplaceHeader /><main className="flex-1"><article className="mx-auto max-w-3xl px-4 py-7 sm:px-6 sm:py-14"><Link href="/blog" className="inline-flex min-h-11 items-center rounded-lg px-1 text-sm font-bold text-blue-700 hover:text-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">← Voltar aos guias</Link><p className="mt-6 text-xs font-black uppercase tracking-[0.16em] text-blue-600">Guia Educalizando</p><h1 className="mt-3 break-words text-3xl font-black leading-tight text-slate-900 sm:text-5xl">{post.title}</h1><p className="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg">{post.excerpt}</p>{post.cover_url && <CatalogImage src={post.cover_url} alt={`Capa do guia: ${post.title}`} width={1200} height={630} fetchPriority="high" decoding="async" className="mt-7 aspect-[1.9/1] w-full rounded-2xl object-cover" />}{post.published_at && <p className="mt-5 text-sm text-slate-500">Publicado em {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(post.published_at))}</p>}<div className="mt-8 break-words whitespace-pre-line text-base leading-8 text-slate-700">{post.content}</div></article><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd({ '@context': 'https://schema.org', '@type': 'BlogPosting', '@id': url + '#article', headline: post.title, description: post.excerpt, author: { '@type': 'Organization', name: 'Educalizando', url: SITE_URL }, publisher: { '@id': SITE_URL + '/#organization', '@type': 'Organization', name: 'Educalizando', logo: { '@type': 'ImageObject', url: SITE_URL + '/branding/logo-educalizando.png?v=3' } }, ...(post.updated_at ? { dateModified: post.updated_at } : {}), ...(post.published_at ? { datePublished: post.published_at } : {}), mainEntityOfPage: url, ...(post.cover_url ? { image: post.cover_url } : {}) }) }} /></main><Footer /></div>;
}
