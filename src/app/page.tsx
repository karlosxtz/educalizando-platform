import { supabaseAdmin, isRealSupabaseConfigured } from '@/lib/supabase';
import MarketplaceHeader from '@/components/MarketplaceHeader';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { Search, Star, ShoppingBag, ShoppingCart, Store, ChevronRight } from 'lucide-react';

// Revalidate this page every 60 seconds
export const revalidate = 60;

export default async function MarketplaceHome() {
  let products: any[] = [];
  let stores: any[] = [];

  if (isRealSupabaseConfigured()) {
    try {
      // 1. Fetch Featured Stores
      const { data: storesData } = await supabaseAdmin
        .from('platform_stores')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(8);
      
      if (storesData) stores = storesData;

      // 2. Fetch Latest Products (Only active ones)
      const { data: productsData } = await supabaseAdmin
        .from('products')
        .select(`
          *,
          store:store_id (
            nome_loja,
            slug,
            logo_url
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(12);
        
      if (productsData) products = productsData;
    } catch (e) {
      console.error('Error fetching marketplace data:', e);
    }
  }

  // Fallback Mocks for Dev
  if (stores.length === 0) {
    stores = [
      { id: '1', nome_loja: 'Prof. Carla Edu', slug: 'prof-carla', logo_url: null, cor_primaria: '#3b82f6' },
      { id: '2', nome_loja: 'Cantinho do Saber', slug: 'cantinho', logo_url: null, cor_primaria: '#ec4899' },
      { id: '3', nome_loja: 'Didática Master', slug: 'didatica', logo_url: null, cor_primaria: '#10b981' },
      { id: '4', nome_loja: 'Tia Rosa M.', slug: 'tia-rosa', logo_url: null, cor_primaria: '#f59e0b' },
    ];
  }

  if (products.length === 0) {
    products = [
      { 
        id: '1', 
        name: 'Kit de Alfabetização Completo', 
        price: 29.90, 
        cover_url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=400&auto=format&fit=crop',
        store: { nome_loja: 'Prof. Carla Edu', slug: 'prof-carla' }
      },
      { 
        id: '2', 
        name: 'Caderno de Caligrafia Mágica', 
        price: 15.50, 
        cover_url: 'https://images.unsplash.com/photo-1544716278-e513176f20b5?q=80&w=400&auto=format&fit=crop',
        store: { nome_loja: 'Cantinho do Saber', slug: 'cantinho' }
      },
      { 
        id: '3', 
        name: 'Atividades de Matemática 3º Ano', 
        price: 19.90, 
        cover_url: 'https://images.unsplash.com/photo-1596496050827-8299e0220de1?q=80&w=400&auto=format&fit=crop',
        store: { nome_loja: 'Didática Master', slug: 'didatica' }
      },
      { 
        id: '4', 
        name: 'Apostila Especial Folclore', 
        price: 12.00, 
        cover_url: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=400&auto=format&fit=crop',
        store: { nome_loja: 'Tia Rosa M.', slug: 'tia-rosa' }
      },
    ];
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const categories = [
    { name: 'Educação Infantil', icon: '🎨', color: 'bg-pink-100 text-pink-600' },
    { name: 'Ensino Fundamental', icon: '📚', color: 'bg-blue-100 text-blue-600' },
    { name: 'Matemática', icon: '🔢', color: 'bg-purple-100 text-purple-600' },
    { name: 'Alfabetização', icon: '📝', color: 'bg-green-100 text-green-600' },
    { name: 'Datas Comemorativas', icon: '🎉', color: 'bg-yellow-100 text-yellow-600' },
    { name: 'Educação Especial', icon: '🧩', color: 'bg-teal-100 text-teal-600' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col pt-20">
      <MarketplaceHeader />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="bg-white relative overflow-hidden">
          {/* Background decorations */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-brand-primary/5 blur-3xl" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-brand-secondary/5 blur-3xl" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 relative z-10 text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 mb-6">
              Os melhores <span className="text-brand-primary">materiais didáticos</span><br className="hidden md:block" />
              feitos por quem entende de ensinar.
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10">
              Encontre apostilas, atividades, planejamentos e jogos educativos criados por professores de todo o Brasil.
            </p>

            {/* Main Search Bar */}
            <div className="max-w-3xl mx-auto relative group">
              <div className="absolute inset-0 bg-brand-primary/20 blur-xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white rounded-full p-2 border border-slate-200 shadow-xl flex items-center">
                <div className="pl-4 pr-2 text-slate-400">
                  <Search className="w-6 h-6" />
                </div>
                <input 
                  type="text" 
                  placeholder="Ex: Atividades de alfabetização, Folclore, Matemática 3º Ano..."
                  className="w-full bg-transparent border-none focus:ring-0 text-lg py-3 px-2 outline-none"
                />
                <button className="bg-brand-primary hover:bg-brand-secondary text-white px-8 py-3 rounded-full font-bold transition-all shadow-md">
                  Buscar
                </button>
              </div>
            </div>

            {/* Popular Tags */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              <span className="text-sm font-medium text-slate-500 mr-2">Buscas populares:</span>
              <span className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-full text-xs font-medium text-slate-600 cursor-pointer transition-colors">Dia dos Pais</span>
              <span className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-full text-xs font-medium text-slate-600 cursor-pointer transition-colors">Semana da Pátria</span>
              <span className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-full text-xs font-medium text-slate-600 cursor-pointer transition-colors">Autismo</span>
              <span className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-full text-xs font-medium text-slate-600 cursor-pointer transition-colors">Rotina Escolar</span>
            </div>
          </div>
        </section>

        {/* CATEGORIES SECTION */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Explore por Categorias</h2>
              <p className="text-slate-500 text-sm mt-1">Encontre o material perfeito para a sua turma</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat, i) => (
              <Link href={`/busca?categoria=${encodeURIComponent(cat.name)}`} key={i} className="group">
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col items-center text-center hover:border-brand-primary/30">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-4 transition-transform group-hover:scale-110 ${cat.color}`}>
                    {cat.icon}
                  </div>
                  <h3 className="font-semibold text-slate-800 text-sm">{cat.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* LATEST PRODUCTS SECTION */}
        <section className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                  <Star className="text-amber-400 fill-amber-400 w-7 h-7" />
                  Lançamentos e Destaques
                </h2>
                <p className="text-slate-500 mt-2">Os materiais mais recentes adicionados pelos nossos criadores.</p>
              </div>
              <Link href="/busca" className="text-brand-primary hover:text-brand-secondary font-semibold flex items-center gap-1 group">
                Ver todos os materiais <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <div key={product.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all group flex flex-col h-full">
                  <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                    {product.cover_url ? (
                      <img 
                        src={product.cover_url} 
                        alt={product.name} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-50">
                        <ShoppingBag className="w-12 h-12 opacity-20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    {product.store && (
                      <Link href={`/loja/${product.store.slug}`} className="text-xs font-semibold text-brand-primary mb-2 hover:underline line-clamp-1">
                        {product.store.nome_loja}
                      </Link>
                    )}
                    <h3 className="font-bold text-slate-900 leading-tight mb-3 line-clamp-2 group-hover:text-brand-primary transition-colors">
                      {product.name}
                    </h3>
                    <div className="mt-auto flex items-end justify-between">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-0.5">Preço</p>
                        <span className="text-lg font-extrabold text-slate-900">{formatCurrency(product.price)}</span>
                      </div>
                      <Link href={product.store ? `/loja/${product.store.slug}/produto/${product.id}` : '#'} className="bg-slate-100 hover:bg-brand-primary hover:text-white text-slate-700 p-2.5 rounded-xl transition-colors">
                        <ShoppingCart className="w-5 h-5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURED STORES SECTION */}
        <section className="bg-slate-900 py-16 relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">Lojas em Destaque</h2>
              <p className="text-slate-400 max-w-2xl mx-auto">Conheça os criadores de conteúdo educativo que estão transformando a forma de ensinar no Brasil.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {stores.map((store) => (
                <Link href={`/loja/${store.slug}`} key={store.id} className="group">
                  <div className="bg-white/5 border border-white/10 hover:border-brand-primary/50 hover:bg-white/10 rounded-2xl p-6 flex flex-col items-center text-center transition-all backdrop-blur-sm">
                    <div 
                      className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-4 shadow-lg overflow-hidden border-2 border-white/20 group-hover:border-brand-primary transition-colors"
                      style={{ backgroundColor: store.cor_primaria || '#3b82f6' }}
                    >
                      {store.logo_url ? (
                        <img src={store.logo_url} alt={store.nome_loja} className="w-full h-full object-cover" />
                      ) : (
                        store.nome_loja.substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <h3 className="font-bold text-white mb-1 group-hover:text-brand-primary transition-colors line-clamp-1">{store.nome_loja}</h3>
                    <p className="text-xs text-slate-400">Ver materiais ➜</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA CREATORS */}
        <section className="py-20 bg-blue-600 text-white text-center">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Você também cria materiais didáticos?</h2>
            <p className="text-lg md:text-xl text-white/90 mb-8">
              Junte-se a milhares de professores, crie sua loja em 2 minutos e comece a vender com a menor taxa do mercado e PIX instantâneo.
            </p>
            <Link href="/vender" className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-full text-lg font-bold hover:scale-105 transition-transform shadow-xl">
              <Store className="w-5 h-5" /> Quero criar minha loja grátis
            </Link>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
