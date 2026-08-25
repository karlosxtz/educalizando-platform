import Link from 'next/link';
import MarketplaceHeader from '@/components/MarketplaceHeader';
import Footer from '@/components/Footer';
import { 
  Heart, 
  GraduationCap, 
  Store, 
  Megaphone,
  Search,
  ArrowRight
} from 'lucide-react';

export default function SobrePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      <MarketplaceHeader />
      
      <main className="flex-1 flex flex-col">
        {/* HERO SECTION - A GRANDE MENSAGEM */}
        <section className="relative bg-white overflow-hidden pt-24 pb-20 sm:pt-32 sm:pb-28 border-b border-slate-100">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-50/60 to-transparent"></div>
          
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[500px] h-[500px] rounded-full bg-blue-100/40 blur-[100px] pointer-events-none"></div>
          
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-widest mx-auto border border-blue-100">
              Sobre Nós
            </span>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-tight tracking-tight max-w-5xl mx-auto">
              Transformando a Educação Através do <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500">Compartilhamento.</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto font-medium leading-relaxed">
              O Educalizando é o maior marketplace focado em conectar educadores brilhantes a professores que buscam materiais didáticos de excelência para transformar suas salas de aula.
            </p>
          </div>
        </section>

        {/* A NOSSA MISSÃO (TEXTO DE AUTORIDADE) */}
        <section className="py-20 sm:py-28 bg-slate-50 relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <div className="w-16 h-16 bg-white text-rose-500 rounded-2xl flex items-center justify-center mx-auto shadow-md border border-slate-100 mb-8 transform -rotate-6">
              <Heart className="w-8 h-8 fill-rose-100" />
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-8 tracking-tight">Nossa Missão</h2>
            
            <div className="bg-white p-8 sm:p-12 rounded-[2.5rem] shadow-xl border border-slate-100 relative">
              <div className="absolute top-0 left-8 -mt-6 text-6xl text-blue-100 font-serif">"</div>
              <p className="text-xl sm:text-2xl text-slate-700 font-medium leading-relaxed italic relative z-10">
                Acreditamos que o tempo do professor é valioso. Nossa missão é acabar com as horas perdidas criando materiais do zero, oferecendo um ecossistema seguro onde os melhores conteúdos do Brasil estão a um clique de distância. Valorizamos quem cria e facilitamos a vida de quem ensina.
              </p>
              <div className="absolute bottom-4 right-8 -mb-6 text-6xl text-blue-100 font-serif rotate-180">"</div>
            </div>
          </div>
        </section>

        {/* O NOSSO ECOSSISTEMA (OS 3 PILARES) */}
        <section className="py-20 sm:py-28 bg-white border-y border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
            <div className="text-center space-y-4">
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                O Nosso Ecossistema
              </h2>
              <p className="text-slate-500 font-medium max-w-2xl mx-auto text-lg">
                Uma plataforma construída para gerar valor em todas as pontas da educação.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
              
              {/* Pilar 1: Educador */}
              <div className="bg-slate-50 p-8 sm:p-10 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 border border-indigo-200">
                  <GraduationCap className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-4">Para o Educador</h3>
                <p className="text-slate-600 font-medium leading-relaxed">
                  Acesso instantâneo a milhares de atividades, planejamentos e jogos lúdicos alinhados à BNCC. Chega de passar madrugadas em claro montando aulas.
                </p>
              </div>

              {/* Pilar 2: Criador */}
              <div className="bg-slate-50 p-8 sm:p-10 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 border border-emerald-200">
                  <Store className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-4">Para o Criador</h3>
                <p className="text-slate-600 font-medium leading-relaxed">
                  Uma vitrine poderosa e profissional para você monetizar seu conhecimento sem taxas abusivas. Transforme os materiais que você já usa em uma fonte de renda passiva.
                </p>
              </div>

              {/* Pilar 3: Afiliado */}
              <div className="bg-slate-50 p-8 sm:p-10 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-6 border border-orange-200">
                  <Megaphone className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-4">Para o Afiliado</h3>
                <p className="text-slate-600 font-medium leading-relaxed">
                  A oportunidade de ter sua própria loja e lucrar recomendando educação de qualidade. Crie sua vitrine em 5 minutos e fature comissões generosas.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* CALL TO ACTION FINAL */}
        <section className="bg-slate-900 py-20 sm:py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 to-transparent"></div>
          
          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Faça parte da nossa comunidade
            </h2>
            <p className="text-lg text-slate-300 font-medium max-w-2xl mx-auto">
              Junte-se a milhares de professores que já estão revolucionando a educação no Brasil.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Link 
                href="/buscar" 
                className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-100 text-blue-900 rounded-2xl font-black text-base shadow-xl transition-transform hover:-translate-y-1 flex items-center justify-center gap-2"
              >
                <Search className="w-5 h-5" />
                Explorar Materiais
              </Link>
              
              <Link 
                href="/vender" 
                className="w-full sm:w-auto px-8 py-4 bg-transparent hover:bg-white/10 text-white border border-white/30 rounded-2xl font-bold text-base transition-colors flex items-center justify-center gap-2 group"
              >
                Comece a Vender
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
