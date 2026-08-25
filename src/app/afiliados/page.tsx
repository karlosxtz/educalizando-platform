import Link from 'next/link';
import MarketplaceHeader from '@/components/MarketplaceHeader';
import Footer from '@/components/Footer';
import { 
  Store, 
  Sparkles, 
  LayoutTemplate, 
  CheckCircle2, 
  UserPlus, 
  MousePointerClick, 
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Link as LinkIcon
} from 'lucide-react';

export default function AfiliadosPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      <MarketplaceHeader />
      
      <main className="flex-1 flex flex-col">
        {/* HERO SECTION - CLEAN & PREMIUM */}
        <section className="relative bg-white overflow-hidden pt-20 pb-24 sm:pt-28 sm:pb-32 border-b border-slate-100">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-transparent"></div>
          
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-widest mx-auto shadow-sm">
              <Sparkles className="w-4 h-4 text-blue-600" /> Nova Era para Afiliados
            </span>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-tight tracking-tight max-w-4xl mx-auto">
              Muito mais que um link:<br/>Tenha sua própria <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Loja de Materiais Didáticos</span> e fature alto.
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
              Cadastre-se como afiliado, crie uma vitrine com a sua cara, escolha os melhores produtos da plataforma e ganhe comissões por cada venda. Tudo pronto em menos de 5 minutos.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link 
                href="/cadastro" 
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-black text-base shadow-xl shadow-blue-900/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 group"
              >
                <Store className="w-5 h-5" />
                Criar Minha Loja Grátis
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link 
                href="/login" 
                className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-200 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2"
              >
                Já sou afiliado (Entrar)
              </Link>
            </div>
          </div>
        </section>

        {/* DESTAQUE: A SUA LOJA (O DIFERENCIAL) */}
        <section className="py-20 sm:py-28 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Imagem / Mockup da Loja */}
            <div className="relative order-2 lg:order-1">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-200 to-indigo-200 rounded-[3rem] transform -rotate-3 scale-105 opacity-50 blur-lg"></div>
              <div className="bg-white rounded-[2.5rem] shadow-2xl relative border border-slate-200 overflow-hidden">
                {/* Header Mockup */}
                <div className="h-32 bg-slate-800 relative">
                  <div className="absolute -bottom-10 left-8 w-20 h-20 bg-white rounded-full border-4 border-white shadow-md flex items-center justify-center">
                    <span className="text-2xl font-black text-slate-300">AF</span>
                  </div>
                </div>
                <div className="pt-12 px-8 pb-8 space-y-6">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Loja do Professor João</h3>
                    <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 w-max px-2 py-0.5 rounded-md mt-1 border border-emerald-100">
                      <LinkIcon className="w-3 h-3" /> educalizando.com.br/loja/joao-silva
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-32 rounded-xl bg-slate-100 border border-slate-200"></div>
                    <div className="h-32 rounded-xl bg-slate-100 border border-slate-200"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Texto Explicativo */}
            <div className="space-y-8 order-1 lg:order-2">
              <div className="space-y-4">
                <span className="text-blue-600 font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                  <LayoutTemplate className="w-5 h-5" /> O Seu Diferencial
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                  Esqueça os links feios.<br/>Construa sua própria marca.
                </h2>
                <p className="text-slate-600 font-medium text-lg leading-relaxed">
                  Ao se tornar nosso parceiro, você ganha acesso instantâneo a uma vitrine virtual exclusiva. Seu link deixa de ser um código estranho e passa a ser o seu nome.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="mt-1">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">Personalize com sua foto e banner</h4>
                    <p className="text-sm text-slate-500 font-medium mt-1">Deixe a loja com a sua identidade visual para gerar mais conexão com seu público.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="mt-1">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">Organize os produtos que você mais confia</h4>
                    <p className="text-sm text-slate-500 font-medium mt-1">Monte prateleiras com as suas recomendações favoritas. Você no controle do que vende.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="mt-1">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">Passe mais credibilidade aos seguidores</h4>
                    <p className="text-sm text-slate-500 font-medium mt-1">Clientes compram mais quando confiam no ambiente. Uma vitrine profissional multiplica sua conversão.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* COMO FUNCIONA (3 Passos Simples) */}
        <section className="py-20 sm:py-28 bg-white border-t border-slate-200 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
            <div className="text-center space-y-4">
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                3 Passos Simples para Faturar
              </h2>
              <p className="text-slate-500 font-medium max-w-xl mx-auto">
                Não precisa entender de programação. Montamos um fluxo intuitivo para colocar sua loja no ar hoje mesmo.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 relative">
              {/* Linha conectora invisível no mobile, visível no desktop */}
              <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-slate-100 via-blue-200 to-slate-100 -z-10"></div>

              {/* Passo 1 */}
              <div className="bg-slate-50 pt-8 px-6 pb-10 rounded-3xl border border-slate-200 shadow-sm text-center space-y-4 relative group hover:-translate-y-2 transition-transform duration-300">
                <div className="w-20 h-20 mx-auto bg-white text-blue-600 rounded-2xl flex items-center justify-center shadow-md border border-slate-100 mb-6 group-hover:scale-110 transition-transform duration-300">
                  <UserPlus className="w-10 h-10" />
                </div>
                <div className="absolute top-0 right-0 -mt-3 -mr-3 w-8 h-8 rounded-full bg-blue-600 text-white font-black flex items-center justify-center shadow-md">1</div>
                <h3 className="text-xl font-black text-slate-900">Cadastre-se</h3>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                  Crie sua conta e configure o visual da sua vitrine (foto, banner e links das suas redes sociais).
                </p>
              </div>

              {/* Passo 2 */}
              <div className="bg-slate-50 pt-8 px-6 pb-10 rounded-3xl border border-slate-200 shadow-sm text-center space-y-4 relative group hover:-translate-y-2 transition-transform duration-300">
                <div className="w-20 h-20 mx-auto bg-white text-indigo-600 rounded-2xl flex items-center justify-center shadow-md border border-slate-100 mb-6 group-hover:scale-110 transition-transform duration-300">
                  <MousePointerClick className="w-10 h-10" />
                </div>
                <div className="absolute top-0 right-0 -mt-3 -mr-3 w-8 h-8 rounded-full bg-indigo-600 text-white font-black flex items-center justify-center shadow-md">2</div>
                <h3 className="text-xl font-black text-slate-900">Selecione e Afilie-se</h3>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                  Navegue pelo nosso catálogo e adicione os melhores materiais à sua loja com apenas 1 clique.
                </p>
              </div>

              {/* Passo 3 */}
              <div className="bg-slate-50 pt-8 px-6 pb-10 rounded-3xl border border-slate-200 shadow-sm text-center space-y-4 relative group hover:-translate-y-2 transition-transform duration-300">
                <div className="w-20 h-20 mx-auto bg-white text-emerald-600 rounded-2xl flex items-center justify-center shadow-md border border-slate-100 mb-6 group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-10 h-10" />
                </div>
                <div className="absolute top-0 right-0 -mt-3 -mr-3 w-8 h-8 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center shadow-md">3</div>
                <h3 className="text-xl font-black text-slate-900">Venda e Lucre</h3>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                  Divulgue o link da sua loja e acompanhe suas comissões caindo em tempo real no seu painel financeiro.
                </p>
              </div>
            </div>
            
            <div className="pt-8 text-center">
              <Link 
                href="/cadastro" 
                className="inline-flex px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-base shadow-xl transition-all hover:scale-105 items-center gap-2"
              >
                <Store className="w-5 h-5" />
                Começar Minha Loja Agora
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
