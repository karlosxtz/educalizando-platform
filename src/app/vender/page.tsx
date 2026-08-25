import Header from '@/components/Header';
import Hero from '@/components/Hero';
import SocialProof from '@/components/SocialProof';
import HowItWorks from '@/components/HowItWorks';
import Benefits from '@/components/Benefits';
import Pricing from '@/components/Pricing';
import FAQ from '@/components/FAQ';

import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Fixed Navigation Bar */}
      <Header />

      {/* Main Page Content */}
      <main className="flex-1">
        {/* 1. Hero Section */}
        <Hero />

        {/* 2. Impact Social Proof Metrics */}
        <SocialProof />

        {/* 3. How It Works (4 Steps) */}
        <HowItWorks />

        {/* 4. Creator Benefits & Differentials */}
        <Benefits />

        {/* 5. Transparent Commission & Pricing */}
        <Pricing />

        {/* 6. Frequently Asked Questions */}
        <FAQ />

        {/* 7. CTA de Conversão Final */}
        <div className="py-24 bg-white text-center">
          <div className="max-w-4xl mx-auto px-4 space-y-6">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">Pronto para monetizar seus materiais?</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">Junte-se aos melhores educadores do Brasil e comece a vender hoje mesmo.</p>
            <div className="pt-4">
              <a href="/cadastro/produtor" className="inline-block px-8 py-4 bg-blue-600 text-white font-bold rounded-full shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:scale-105 transition-all">
                Criar Minha Loja Grátis Agora
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
