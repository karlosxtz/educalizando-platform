import { Metadata } from 'next';
import Link from 'next/link';
import MarketplaceHeader from '@/components/MarketplaceHeader';
import Footer from '@/components/Footer';
import { getPublishedBlogPosts } from '@/lib/blog-service';

export const metadata: Metadata = {
  title: 'Blog Educalizando | Ideias e Guias Pedagógicos',
  description: 'Guias pedagógicos, ideias de atividades e estratégias para educadores aproveitarem melhor seus materiais didáticos.',
  alternates: { canonical: 'https://www.educalizando.com.br/blog' },
};

export default async function BlogPage() {
  const posts = await getPublishedBlogPosts();
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <MarketplaceHeader />
      <main className="flex-1">
        <section className="border-b bg-gradient-to-br from-blue-700 to-indigo-800 px-4 py-14 text-center text-white sm:py-20">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-blue-100">Conteúdo para educadores</p>
          <h1 className="mx-auto max-w-3xl text-3xl font-black sm:text-5xl">Ideias que transformam a sua aula</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-blue-100 sm:text-lg">Guias pedagógicos, inspirações e orientações práticas para professores, famílias e criadores.</p>
        </section>
        <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-14">
          {posts.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <article key={post.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  {post.cover_url && <img src={post.cover_url} alt="" className="h-44 w-full object-cover" />}
                  <div className="p-5"><p className="text-xs font-bold text-blue-600">Guia Educalizando</p><h2 className="mt-2 text-xl font-black text-slate-900">{post.title}</h2><p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">{post.excerpt}</p><Link href={`/blog/${post.slug}`} className="mt-5 inline-flex min-h-11 items-center font-bold text-blue-700 hover:text-blue-900">Ler guia →</Link></div>
                </article>
              ))}
            </div>
          ) : <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm"><h2 className="text-xl font-black text-slate-900">Novos guias em breve</h2><p className="mx-auto mt-2 max-w-lg text-sm text-slate-600">Estamos preparando conteúdos práticos para apoiar sua rotina pedagógica.</p></div>}
        </section>
      </main>
      <Footer />
    </div>
  );
}
