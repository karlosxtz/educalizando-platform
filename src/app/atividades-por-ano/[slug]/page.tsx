import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getEducationLevels } from '@/lib/category-service';
import { searchProducts } from '@/lib/search-service';
import ProductCard from '@/components/ProductCard';
import MarketplaceHeader from '@/components/MarketplaceHeader';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

interface EducationLevelPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: EducationLevelPageProps): Promise<Metadata> {
  const { slug } = await params;
  const levels = await getEducationLevels();
  const level = levels.find(l => l.slug === slug);

  if (!level) {
    return { title: 'Ano Escolar não encontrado | Educalizando' };
  }

  const title = `Atividades para ${level.nome} para Imprimir | Educalizando`;
  const description = `Encontre os melhores materiais didáticos, apostilas e atividades prontas para ${level.nome}. Alinhados à BNCC e desenvolvidos por especialistas para potencializar suas aulas.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://educalizando.com.br/atividades-por-ano/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function EducationLevelLandingPage({ params }: EducationLevelPageProps) {
  const { slug } = await params;

  // Validate education level existence
  const levels = await getEducationLevels();
  const level = levels.find(l => l.slug === slug);

  if (!level) {
    notFound();
  }

  // Fetch products for this education level
  const result = await searchProducts({
    ano_escolar: slug,
    page: 1,
    sort: 'recentes'
  });

  const products = result.data;

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f9fa] selection:bg-blue-600 selection:text-white">
      <MarketplaceHeader />
      
      <main className="flex-1">
        {/* SEO Optimized Header */}
        <section className="bg-white border-b py-12 md:py-16">
          <div className="container mx-auto px-4 max-w-[1200px] text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-bold mb-6">
              <CheckCircle2 className="w-4 h-4" /> Alinhado à BNCC
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-[#093b6c] mb-6 tracking-tight leading-tight">
              Materiais e Atividades para <br className="hidden md:block"/> {level.nome}
            </h1>
            <h2 className="text-gray-600 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
              Explore nossa seleção de apostilas, e-books e recursos pedagógicos desenvolvidos especificamente para {level.nome}.
            </h2>
          </div>
        </section>

        {/* Product Grid */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 max-w-[1200px]">
            {products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100 max-w-2xl mx-auto">
                <div className="bg-[#f0f7ff] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-[#093b6c] text-2xl font-semibold">{level.nome.charAt(0)}</span>
                </div>
                <h3 className="text-xl font-bold text-[#093b6c] mb-2">
                  Nenhum material encontrado
                </h3>
                <p className="text-gray-600 mb-6 font-medium">
                  Ainda não temos atividades cadastradas especificamente para <strong>{level.nome}</strong>. Que tal explorar outros recursos no acervo principal?
                </p>
                <Link 
                  href="/buscar"
                  className="inline-flex items-center justify-center px-6 py-3 bg-[#093b6c] text-white font-bold rounded-xl hover:bg-[#06284a] transition-colors shadow-sm"
                >
                  Explorar Todo o Acervo
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
