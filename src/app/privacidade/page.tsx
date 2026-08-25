import MarketplaceHeader from '@/components/MarketplaceHeader';
import Footer from '@/components/Footer';
import { ShieldCheck } from 'lucide-react';

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      <MarketplaceHeader />
      
      <main className="flex-1 py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8 sm:p-16">
          
          <div className="border-b border-slate-100 pb-8 mb-10 text-center sm:text-left">
            <div className="w-16 h-16 bg-slate-100 text-slate-700 rounded-2xl flex items-center justify-center mb-6 mx-auto sm:mx-0">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-3">
              Política de Privacidade - Educalizando
            </h1>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>

          <div className="space-y-10 text-slate-600 font-medium leading-relaxed">
            
            <section className="space-y-4">
              <h2 className="text-xl font-black text-slate-900">1. Coleta de Dados</h2>
              <p>
                O Educalizando preza pela transparência e minimização na coleta de dados. Coletamos apenas as informações estritamente necessárias para o funcionamento seguro do serviço. Isso inclui: dados de cadastro (nome e e-mail) para liberar o acesso aos materiais, CPF/CNPJ quando necessário para emissão de notas fiscais ou transferências bancárias de produtores/afiliados, e dados básicos de navegação.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-black text-slate-900">2. Uso das Informações</h2>
              <p>
                Os dados coletados são utilizados exclusivamente para as finalidades descritas abaixo:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Processar pagamentos e liberar imediatamente o acesso aos materiais didáticos adquiridos.</li>
                <li>Calcular e atribuir corretamente as comissões de afiliados pelas indicações geradas.</li>
                <li>Enviar comunicações essenciais sobre compras, atualizações da plataforma ou segurança da sua conta.</li>
                <li>Prevenir fraudes e manter a integridade do marketplace.</li>
              </ul>
              <p className="font-bold text-slate-700 mt-2">
                Em nenhuma hipótese comercializamos, alugamos ou vendemos seus dados pessoais para terceiros.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-black text-slate-900">3. Proteção e Pagamentos</h2>
              <p>
                A segurança financeira dos nossos usuários é nossa prioridade absoluta. Todos os dados financeiros sensíveis (como números de cartão de crédito) são rigorosamente criptografados e processados diretamente pelos nossos gateways de pagamento parceiros homologados pelo Banco Central. <strong>Essas informações financeiras confidenciais nunca são armazenadas nos servidores do Educalizando.</strong>
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-black text-slate-900">4. Uso de Cookies</h2>
              <p>
                A plataforma utiliza cookies com duas funções essenciais e fundamentais para o nosso modelo de negócios:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Cookies de Autenticação:</strong> Para manter sua sessão ativa e segura na área do aluno, painel do produtor ou vitrine do afiliado.</li>
                <li><strong>Cookies de Rastreamento (Afiliados):</strong> Para identificar de qual parceiro veio o comprador, garantindo que as comissões de venda sejam pagas corretamente e de forma justa a quem indicou o material.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-black text-slate-900">5. Seus Direitos (LGPD)</h2>
              <p>
                Em total conformidade com a Lei Geral de Proteção de Dados (LGPD), você detém controle total sobre suas informações. O usuário tem o direito de solicitar a alteração, exportação ou exclusão definitiva de sua conta e de todos os seus dados pessoais a qualquer momento.
              </p>
              <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl mt-4">
                <p className="mb-2 font-bold text-slate-900">Para exercer seus direitos relativos à privacidade, entre em contato:</p>
                <p>E-mail oficial: <a href="mailto:educalizando@proton.me" className="text-blue-600 font-bold hover:underline">educalizando@proton.me</a></p>
              </div>
            </section>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
