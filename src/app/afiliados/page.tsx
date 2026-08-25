import Link from 'next/link';
import MarketplaceHeader from '@/components/MarketplaceHeader';
import Footer from '@/components/Footer';
import { 
  UserPlus, 
  Megaphone, 
  Banknote, 
  Percent, 
  Cookie, 
  LayoutDashboard,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export default function AfiliadosPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      <MarketplaceHeader />
      
      <main className="flex-1 flex flex-col">
        {/* HERO SECTION - CABEÇALHO DE CONVERSÃO */}
        <section className="relative bg-slate-900 overflow-hidden pt-20 pb-24 sm:pt-28 sm:pb-32">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-indigo-900/40 to-slate-900"></div>
          
          {/* Decorações de fundo */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-blue-600/20 blur-[100px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-emerald-600/20 blur-[100px] pointer-events-none"></div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-bold uppercase tracking-widest mx-auto">
              <ShieldCheck className="w-4 h-4" /> Programa de Parcerias
            </span>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight max-w-4xl mx-auto">
              Seja um <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Afiliado Parceiro</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-medium leading-relaxed">
              Recomende os melhores materiais didáticos e ganhe comissões por cada venda realizada através do seu link exclusivo.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link 
                href="/cadastro" 
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-black text-base shadow-lg shadow-blue-900/50 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 group"
              >
                Criar Conta de Afiliado
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link 
                href="/login" 
                className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/15 text-white border border-white/20 rounded-2xl font-bold text-base backdrop-blur-sm transition-all flex items-center justify-center gap-2"
              >
                <LayoutDashboard className="w-5 h-5" />
                Acessar meu Painel
              </Link>
            </div>
          </div>
        </section>

        {/* COMO FUNCIONA */}
        <section className="py-20 sm:py-28 bg-white border-b border-slate-200 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
            <div className="text-center space-y-4">
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Como Funciona?
              </h2>
              <p className="text-slate-500 font-medium max-w-xl mx-auto">
                Um fluxo simples e transparente para você começar a faturar indicando materiais educativos de alta qualidade.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 relative">
              {/* Linha conectora invisível no mobile, visível no desktop */}
              <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 -z-10"></div>

              {/* Passo 1 */}
              <div className="bg-white pt-8 px-6 pb-10 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center space-y-4 relative group hover:-translate-y-2 transition-transform duration-300">
                <div className="w-20 h-20 mx-auto bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner mb-6 group-hover:scale-110 transition-transform duration-300">
                  <UserPlus className="w-10 h-10" />
                </div>
                <div className="absolute top-0 right-0 -mt-3 -mr-3 w-8 h-8 rounded-full bg-blue-600 text-white font-black flex items-center justify-center shadow-md">1</div>
                <h3 className="text-xl font-black text-slate-900">Cadastre-se</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                  Crie sua conta gratuitamente em menos de 2 minutos e tenha acesso imediato ao painel de parceiros.
                </p>
              </div>

              {/* Passo 2 */}
              <div className="bg-white pt-8 px-6 pb-10 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center space-y-4 relative group hover:-translate-y-2 transition-transform duration-300">
                <div className="w-20 h-20 mx-auto bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Megaphone className="w-10 h-10" />
                </div>
                <div className="absolute top-0 right-0 -mt-3 -mr-3 w-8 h-8 rounded-full bg-indigo-600 text-white font-black flex items-center justify-center shadow-md">2</div>
                <h3 className="text-xl font-black text-slate-900">Divulgue</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                  Escolha os materiais do nosso catálogo e compartilhe seu link exclusivo nas redes sociais, WhatsApp ou blog.
                </p>
              </div>

              {/* Passo 3 */}
              <div className="bg-white pt-8 px-6 pb-10 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center space-y-4 relative group hover:-translate-y-2 transition-transform duration-300">
                <div className="w-20 h-20 mx-auto bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Banknote className="w-10 h-10" />
                </div>
                <div className="absolute top-0 right-0 -mt-3 -mr-3 w-8 h-8 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center shadow-md">3</div>
                <h3 className="text-xl font-black text-slate-900">Fature</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                  Receba suas comissões por cada venda realizada. O dinheiro vai direto para sua carteira digital na plataforma.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* VANTAGENS / BENEFÍCIOS */}
        <section className="py-20 sm:py-28 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                  A melhor tecnologia para alavancar suas vendas
                </h2>
                <p className="text-slate-600 font-medium text-lg leading-relaxed">
                  Nós cuidamos de toda a infraestrutura, entrega e suporte. Seu único trabalho é recomendar produtos de altíssima qualidade que seus seguidores já querem comprar.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0 mt-1">
                    <Percent className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">Comissões Atrativas</h4>
                    <p className="text-sm text-slate-500 font-medium mt-1">Produtores definem comissões generosas que recompensam o seu esforço de divulgação de forma justa.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
                    <Cookie className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">Cookies Seguros e Globais</h4>
                    <p className="text-sm text-slate-500 font-medium mt-1">Tecnologia avançada de rastreamento garante que você não perca nenhuma comissão, mesmo se o cliente comprar dias depois.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                    <LayoutDashboard className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">Painel Transparente</h4>
                    <p className="text-sm text-slate-500 font-medium mt-1">Acompanhe cliques, leads e vendas em tempo real através de um dashboard intuitivo e fácil de usar.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Imagem / Card Decorativo */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-200 to-emerald-200 rounded-[3rem] transform rotate-3 scale-105 opacity-50 blur-lg"></div>
              <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] shadow-2xl relative border border-slate-100/50 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                      <LayoutDashboard className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <div className="h-3 w-24 bg-slate-200 rounded-full mb-1.5"></div>
                      <div className="h-2 w-16 bg-slate-100 rounded-full"></div>
                    </div>
                  </div>
                  <div className="h-6 w-20 bg-emerald-50 rounded-full border border-emerald-100"></div>
                </div>
                
                <div className="space-y-4 py-4">
                  <div className="flex items-end gap-3">
                    <span className="text-4xl font-black text-slate-900">R$ 1.250<span className="text-xl text-slate-400">,00</span></span>
                    <span className="text-emerald-500 font-bold text-sm mb-1">+45%</span>
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Comissões da Semana</p>
                </div>

                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        <div className="space-y-1">
                          <div className="h-2.5 w-32 bg-slate-200 rounded-full"></div>
                          <div className="h-2 w-20 bg-slate-100 rounded-full"></div>
                        </div>
                      </div>
                      <div className="h-4 w-16 bg-emerald-100 rounded-full"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
