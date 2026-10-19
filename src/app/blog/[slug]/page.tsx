import CatalogImage from '@/components/ui/CatalogImage';
import BlogRelatedMaterials from '@/components/blog/BlogRelatedMaterials';
import BlogArticleBody from '@/components/blog/BlogArticleBody';
import Footer from '@/components/Footer';
import MarketplaceHeader from '@/components/MarketplaceHeader';
import { getPublishedBlogPostBySlug } from '@/lib/blog-service';
import { DEFAULT_SOCIAL_IMAGE,serializeJsonLd,SITE_URL,socialMetadata } from '@/lib/seo';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const revalidate=3600;
interface Props {params:Promise<{slug:string}>}
export async function generateMetadata({params}:Props):Promise<Metadata> {
  const post=await getPublishedBlogPostBySlug((await params).slug);if(!post)notFound();
  return socialMetadata({title:post.seo_title || `${post.title} | Blog Educalizando`,description:post.seo_description || post.excerpt,url:SITE_URL+'/blog/'+post.slug,type:'article',image:post.cover_url || DEFAULT_SOCIAL_IMAGE,imageAlt:'Capa: '+post.title});
}
export default async function BlogPostPage({params}:Props) {
  const post=await getPublishedBlogPostBySlug((await params).slug);if(!post)notFound();
  const url=SITE_URL+'/blog/'+post.slug;
  const author=post.store?{'@type':'Organization',name:post.store.nome_loja,url:SITE_URL+'/loja/'+post.store.slug}:{'@type':'Organization',name:'Educalizando',url:SITE_URL};
  return <div className="min-h-screen bg-[#f5f4fc]"><MarketplaceHeader/><main className="home-layout py-7 sm:py-12"><article className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-5 sm:p-9"><nav aria-label="Caminho do artigo" className="flex flex-wrap gap-2 text-xs text-slate-500"><Link href="/">Início</Link><span>/</span><Link href="/blog" className="font-bold text-violet-800">Blog</Link><span>/</span><span className="break-words">{post.title}</span></nav><p className="mt-7 text-xs font-bold uppercase tracking-widest text-violet-700">{post.topic || 'Guia Educalizando'}</p><h1 className="mt-3 break-words text-3xl font-bold leading-tight text-slate-950 sm:text-5xl">{post.title}</h1><p className="mt-5 text-lg leading-8 text-slate-600">{post.excerpt}</p><div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-100 pb-5 text-sm">{post.store?<Link href={'/loja/'+post.store.slug} className="font-bold text-violet-800">Por {post.store.nome_loja}</Link>:<span className="font-bold text-violet-800">Equipe Educalizando</span>}{post.published_at && <time dateTime={post.published_at} className="text-xs text-slate-500">{new Intl.DateTimeFormat('pt-BR',{dateStyle:'long',timeZone:'America/Sao_Paulo'}).format(new Date(post.published_at))}</time>}</div>{post.cover_url && <CatalogImage src={post.cover_url} alt={'Capa: '+post.title} width={1200} height={720} fetchPriority="high" className="mt-7 max-h-[550px] w-full rounded-2xl bg-slate-50 object-contain"/>}<div className="mt-8"><BlogArticleBody content={post.content}/></div>{post.store && <aside className="mt-10 rounded-2xl border border-violet-100 bg-violet-50 p-5"><p className="text-xs font-bold uppercase tracking-widest text-violet-700">Conheça quem compartilhou esta ideia</p><h2 className="mt-2 text-xl font-bold text-slate-950">{post.store.nome_loja}</h2><p className="mt-2 text-sm leading-7 text-slate-600">Visite a vitrine do criador para conhecer os materiais disponíveis e conferir as condições de cada recurso.</p><Link href={'/loja/'+post.store.slug} className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-violet-700 px-4 text-sm font-bold text-white">Conhecer a loja →</Link></aside>}<BlogRelatedMaterials post={post}/><Link href="/blog" className="mt-8 inline-flex min-h-11 items-center text-sm font-bold text-violet-800">← Mais ideias no blog</Link></article>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:serializeJsonLd({'@context':'https://schema.org','@graph':[{'@type':'BlogPosting','@id':url+'#article',headline:post.title,description:post.excerpt,author,publisher:{'@type':'Organization',name:'Educalizando',url:SITE_URL,logo:{'@type':'ImageObject',url:SITE_URL+'/branding/logo-educalizando-icon-512.png'}},dateModified:post.updated_at,...(post.published_at?{datePublished:post.published_at}:{}),mainEntityOfPage:url,...(post.cover_url?{image:post.cover_url}:{})},{'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Início',item:SITE_URL},{'@type':'ListItem',position:2,name:'Blog',item:SITE_URL+'/blog'},{'@type':'ListItem',position:3,name:post.title,item:url}]}]})}}/>
  </main><Footer/></div>;
}
