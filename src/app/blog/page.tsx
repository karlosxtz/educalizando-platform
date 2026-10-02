import Footer from '@/components/Footer';
import MarketplaceHeader from '@/components/MarketplaceHeader';
import { getPublishedBlogPosts } from '@/lib/blog-service';
import { serializeJsonLd,SITE_URL,socialMetadata } from '@/lib/seo';
import { Metadata } from 'next';
import Link from 'next/link';

const blogTitle = 'Blog Educalizando | Ideias e Guias Pedagógicos';
const blogDescription = 'Guias pedagógicos, ideias de atividades e estratégias para educadores aproveitarem melhor seus materiais didáticos.';

export const metadata: Metadata = {
  title: blogTitle,
  description: blogDescription,
  alternates: { canonical: 'https://www.educalizando.com.br/blog' },
  ...socialMetadata({ title: blogTitle, description: blogDescription, url: '/blog' }),
};

export default async function BlogPage() {
  const posts = await getPublishedBlogPosts();
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'CollectionPage', name: blogTitle, description: blogDescription, url: `${SITE_URL}/blog` },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Início', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
      ] },
      ...(posts.length ? [{ '@type': 'ItemList', name: 'Guias pedagógicos', itemListElement: posts.slice(0, 24).map((post, index) => ({ '@type': 'ListItem', position: index + 1, name: post.title, url: `${SITE_URL}/blog/${post.slug}` })) }] : []),
    ],
  };
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }} />
      <MarketplaceHeader />
      <main className="flex-1">
        <section className="border-b bg-gradient-to-br from-blue-700 to-indigo-800 px-4 py-10 text-center text-white sm:py-20">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-blue-100">Conteúdo para educadores</p>
          <h1 className="mx-auto max-w-3xl text-3xl font-black sm:text-5xl">Ideias que transformam a sua aula</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-blue-100 sm:text-lg">Guias pedagógicos, inspirações e orientações práticas para professores, famílias e criadores.</p>
        </section>
        <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-14">
          {posts.length ? (
            <div className="grid grid-cols-1 gap-4 min-[390px]:grid-cols-2 sm:gap-5 lg:grid-cols-3">
              {posts.map((post) => (
                <article key={post.id} className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                  {post.cover_url && <img src={post.cover_url} alt={`Capa do guia: ${post.title}`} width={640} height={352} loading="lazy" decoding="async" className="aspect-[16/9] w-full object-cover" />}
                  <div className="flex h-full flex-col p-4 sm:p-5"><p className="text-xs font-bold text-blue-600">Guia Educalizando</p><h2 className="mt-2 text-lg font-black leading-snug text-slate-900 sm:text-xl">{post.title}</h2><p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">{post.excerpt}</p><Link href={`/blog/${post.slug}`} className="mt-5 inline-flex min-h-11 items-center self-start rounded-lg px-1 text-sm font-bold text-blue-700 hover:text-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">Ler guia<span className="sr-only">: {post.title}</span> →</Link></div>
                </article>
              ))}
            </div>
          ) : <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10" role="status" aria-live="polite"><h2 className="text-xl font-black text-slate-900">Ainda não há guias publicados</h2><p className="mx-auto mt-2 max-w-lg text-sm text-slate-600">Quando novos conteúdos forem publicados, eles aparecerão aqui.</p><Link href="/" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">Voltar ao marketplace</Link></div>}
        </section>
      </main>
      <Footer />
    </div>
  );
}
