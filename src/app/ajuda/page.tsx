import Link from 'next/link';
import MarketplaceHeader from '@/components/MarketplaceHeader';
import Footer from '@/components/Footer';
import { 
  HelpCircle, 
  Mail, 
  MessageCircle, 
  GraduationCap, 
  Store, 
  Megaphone,
  ChevronDown
} from 'lucide-react';

export default function AjudaPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      <MarketplaceHeader />
      
      <main className="flex-1 flex flex-col">
        {/* HERO SECTION */}
        <section className="bg-blue-50 py-16 sm:py-24 border-b border-blue-100 relative overflow-hidden">
          {/* Decorações sutis */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-blue-100/50 blur-[80px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-indigo-100/50 blur-[80px] pointer-events-none"></div>
          
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-blue-200">
              <HelpCircle className="w-8 h-8" />
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              Central de Ajuda Educalizando
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-600 font-medium max-w-2xl mx-auto">
              Como podemos te ajudar hoje? Encontre as respostas para as principais dúvidas de alunos, produtores e parceiros abaixo.
            </p>
          </div>
        </section>

        {/* ESTRUTURA DE DÚVIDAS FREQUENTES (FAQ) */}
        <section className="py-16 sm:py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-16">
          
          {/* Categoria: Compradores */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">Para Compradores (Área do Aluno)</h2>
            </div>
            
            <div className="space-y-4">
              <details className="group bg-white border border-slate-200 rounded-2xl shadow-sm open:shadow-md transition-all duration-200">
                <summary className="flex items-center justify-between cursor-pointer p-5 font-bold text-slate-800 marker:content-none select-none">
                  <span>Como acesso os materiais que comprei?</span>
                  <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform duration-200" />
                </summary>
                <div className="px-5 pb-5 pt-0 text-slate-600 font-medium leading-relaxed">
                  Os materiais ficam disponíveis imediatamente após a aprovação do pagamento. Basta acessar a sua conta, clicar no menu superior e ir até a aba <strong>"Minhas Compras"</strong>. Todo o seu acervo digital estará lá para download a qualquer momento.
                </div>
              </details>

              <details className="group bg-white border border-slate-200 rounded-2xl shadow-sm open:shadow-md transition-all duration-200">
                <summary className="flex items-center justify-between cursor-pointer p-5 font-bold text-slate-800 marker:content-none select-none">
                  <span>Quais são as formas de pagamento aceitas?</span>
                  <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform duration-200" />
                </summary>
                <div className="px-5 pb-5 pt-0 text-slate-600 font-medium leading-relaxed">
                  Aceitamos <strong>Pix</strong> (com aprovação e liberação imediata do material) e <strong>Cartão de Crédito</strong>. Todo o processo é 100% seguro e criptografado.
                </div>
              </details>

              <details className="group bg-white border border-slate-200 rounded-2xl shadow-sm open:shadow-md transition-all duration-200">
                <summary className="flex items-center justify-between cursor-pointer p-5 font-bold text-slate-800 marker:content-none select-none">
                  <span>Como funciona o reembolso?</span>
                  <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform duration-200" />
                </summary>
                <div className="px-5 pb-5 pt-0 text-slate-600 font-medium leading-relaxed">
                  Trabalhamos com total transparência. Você tem <strong>7 dias de garantia incondicional</strong> em todas as compras realizadas na plataforma. Se não estiver satisfeito, basta solicitar o reembolso na sua área do aluno.
                </div>
              </details>
            </div>
          </div>

          {/* Categoria: Produtores */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <Store className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">Para Produtores (Vendedores)</h2>
            </div>
            
            <div className="space-y-4">
              <details className="group bg-white border border-slate-200 rounded-2xl shadow-sm open:shadow-md transition-all duration-200">
                <summary className="flex items-center justify-between cursor-pointer p-5 font-bold text-slate-800 marker:content-none select-none">
                  <span>Quanto custa para vender na plataforma?</span>
                  <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform duration-200" />
                </summary>
                <div className="px-5 pb-5 pt-0 text-slate-600 font-medium leading-relaxed">
                  Criar sua loja e cadastrar produtos é <strong>100% grátis</strong>, sem mensalidades. Cobramos apenas uma pequena taxa administrativa fixa por cada venda realizada com sucesso. Você não paga nada se não vender.
                </div>
              </details>

              <details className="group bg-white border border-slate-200 rounded-2xl shadow-sm open:shadow-md transition-all duration-200">
                <summary className="flex items-center justify-between cursor-pointer p-5 font-bold text-slate-800 marker:content-none select-none">
                  <span>Como recebo o meu dinheiro?</span>
                  <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform duration-200" />
                </summary>
                <div className="px-5 pb-5 pt-0 text-slate-600 font-medium leading-relaxed">
                  O valor das suas vendas vai diretamente para o seu saldo (Carteira Digital) no painel do produtor. Após o período de garantia (7 dias), o saldo fica disponível e pode ser sacado diretamente para a sua conta bancária via Pix.
                </div>
              </details>

              <details className="group bg-white border border-slate-200 rounded-2xl shadow-sm open:shadow-md transition-all duration-200">
                <summary className="flex items-center justify-between cursor-pointer p-5 font-bold text-slate-800 marker:content-none select-none">
                  <span>Posso vender qualquer tipo de material?</span>
                  <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform duration-200" />
                </summary>
                <div className="px-5 pb-5 pt-0 text-slate-600 font-medium leading-relaxed">
                  Aceitamos materiais focados em educação e didática. Os formatos digitais suportados incluem <strong>PDF, Word, PowerPoint (Slides) e Planilhas do Excel</strong>. Arquivos de imagem (PNG, JPG) também podem ser agrupados.
                </div>
              </details>
            </div>
          </div>

          {/* Categoria: Afiliados */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100">
                <Megaphone className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">Para Afiliados (Parceiros)</h2>
            </div>
            
            <div className="space-y-4">
              <details className="group bg-white border border-slate-200 rounded-2xl shadow-sm open:shadow-md transition-all duration-200">
                <summary className="flex items-center justify-between cursor-pointer p-5 font-bold text-slate-800 marker:content-none select-none">
                  <span>Como funciona a Loja do Afiliado?</span>
                  <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform duration-200" />
                </summary>
                <div className="px-5 pb-5 pt-0 text-slate-600 font-medium leading-relaxed">
                  Na Educalizando, você não ganha apenas um "link solto". Você recebe uma vitrine exclusiva (sua própria loja) para personalizar com sua foto e banner. É nela que você expõe todos os produtos que escolheu divulgar, passando muito mais credibilidade aos seus clientes.
                </div>
              </details>

              <details className="group bg-white border border-slate-200 rounded-2xl shadow-sm open:shadow-md transition-all duration-200">
                <summary className="flex items-center justify-between cursor-pointer p-5 font-bold text-slate-800 marker:content-none select-none">
                  <span>Quando recebo minhas comissões?</span>
                  <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform duration-200" />
                </summary>
                <div className="px-5 pb-5 pt-0 text-slate-600 font-medium leading-relaxed">
                  As comissões de cada venda aprovada entram na mesma hora no seu saldo "A Receber". Assim que a garantia de 7 dias do produto expira (sem contestação do comprador), o valor fica "Disponível" e você pode sacar via Pix direto no seu painel financeiro.
                </div>
              </details>
            </div>
          </div>

        </section>

        {/* SEÇÃO DE CONTATO DIRETO */}
        <section className="bg-slate-50 py-16 sm:py-20 border-t border-slate-200">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-3xl p-8 sm:p-10 text-center shadow-xl border border-slate-200 space-y-6">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                Ainda precisa de ajuda?
              </h2>
              <p className="text-slate-600 font-medium text-lg">
                Nossa equipe de suporte está pronta para te atender. Escolha o melhor canal abaixo e fale conosco.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                {/* Botão de E-mail */}
                <a 
                  href="mailto:educalizando@proton.me"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
                >
                  <Mail className="w-5 h-5 text-slate-500" />
                  educalizando@proton.me
                </a>

                {/* Botão de WhatsApp */}
                <a 
                  href="#"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-colors shadow-lg shadow-emerald-500/20"
                >
                  <MessageCircle className="w-5 h-5" />
                  Chamar no WhatsApp
                </a>
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
