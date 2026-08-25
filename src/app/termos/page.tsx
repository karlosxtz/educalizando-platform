import MarketplaceHeader from '@/components/MarketplaceHeader';
import Footer from '@/components/Footer';
import { Scale } from 'lucide-react';

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      <MarketplaceHeader />
      
      <main className="flex-1 py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8 sm:p-16">
          
          <div className="border-b border-slate-100 pb-8 mb-10 text-center sm:text-left">
            <div className="w-16 h-16 bg-slate-100 text-slate-700 rounded-2xl flex items-center justify-center mb-6 mx-auto sm:mx-0">
              <Scale className="w-8 h-8" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-3">
              Termos de Uso - Educalizando
            </h1>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>

          <div className="space-y-10 text-slate-600 font-medium leading-relaxed">
            
            <section className="space-y-4">
              <h2 className="text-xl font-black text-slate-900">1. Aceitação dos Termos</h2>
              <p>
                Ao acessar, navegar e utilizar a plataforma Educalizando (seja como Comprador, Produtor ou Afiliado), você declara que leu, compreendeu e concorda expressamente com todas as regras, diretrizes e condições descritas neste documento. Caso não concorde com qualquer disposição aqui presente, você não deve utilizar os nossos serviços.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-black text-slate-900">2. A Plataforma</h2>
              <p>
                O Educalizando atua exclusivamente como um <strong>marketplace (intermediador de negócios)</strong> voltado ao nicho educacional. Nosso objetivo é fornecer a infraestrutura tecnológica para facilitar a conexão entre educadores e criadores de conteúdo (Produtores), clientes em busca de materiais de excelência (Compradores) e promotores de vendas (Afiliados). Não somos proprietários nem editores diretos dos materiais didáticos comercializados.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-black text-slate-900">3. Direitos Autorais e Propriedade Intelectual</h2>
              <p>
                Todos os Produtores cadastrados declaram e garantem que possuem os direitos autorais, de propriedade intelectual e a autorização legal para comercializar todos os arquivos (PDFs, Planilhas, Apresentações, etc.) enviados para a plataforma.
              </p>
              <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-lg text-rose-800 text-sm">
                <strong>Atenção:</strong> É terminantemente proibida a venda de conteúdo plagiado, pirateado ou que viole direitos de terceiros. A detecção de infração de direitos autorais resultará no banimento imediato do Produtor, bloqueio de saldo e repasse de informações às autoridades competentes.
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-black text-slate-900">4. Pagamentos e Reembolsos</h2>
              <p>
                Todas as transações financeiras na Educalizando são processadas de forma segura e criptografada (através de Pix com liberação imediata e Cartões de Crédito).
              </p>
              <p>
                Em conformidade com o Código de Defesa do Consumidor (Art. 49), garantimos ao Comprador o direito de arrependimento. Sendo assim, qualquer cliente tem direito a um <strong>reembolso incondicional</strong> no prazo de até 7 (sete) dias corridos a partir da data de aprovação da compra, sem necessidade de justificativa, processado diretamente através da sua Área do Aluno.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-black text-slate-900">5. Responsabilidades do Afiliado</h2>
              <p>
                Os parceiros que utilizam a ferramenta de Afiliados (incluindo a vitrine/Loja do Afiliado) comprometem-se a divulgar os produtos de maneira ética e transparente.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>É proibido fazer promessas falsas de resultados inalcançáveis sobre os materiais didáticos.</li>
                <li>É proibida a prática de SPAM em redes sociais e e-mails para promover links da plataforma.</li>
                <li>O afiliado é responsável por verificar a adequação dos produtos que adiciona à sua própria vitrine.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-black text-slate-900">6. Modificações dos Termos</h2>
              <p>
                O Educalizando reserva-se o direito de atualizar, modificar ou substituir estes Termos de Uso a qualquer momento, visando melhorias no ecossistema e adequações legais. A continuação do uso da plataforma após qualquer alteração constitui aceitação tácita dos novos termos. Recomendamos a leitura periódica desta página.
              </p>
            </section>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
