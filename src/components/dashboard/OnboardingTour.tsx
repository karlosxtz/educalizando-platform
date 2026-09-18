'use client';

import { useState, useEffect } from 'react';
import { 
  X, ChevronRight, ChevronLeft, Map, LayoutDashboard, Package,
  ShoppingCart, Video, ShieldCheck, DollarSign, Store, Gift, MessagesSquare,
  ChartNoAxesCombined, MessageCircle, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TOUR_STEPS = [
  {
    title: 'Bem-vindo ao Tour 360!',
    description: 'Vamos percorrer as ferramentas que ajudam você a montar a loja, vender, entregar e acompanhar seus resultados. Você pode continuar depois: seu progresso fica salvo.',
    icon: <Map className="w-12 h-12 text-blue-500" />,
    color: 'bg-blue-50 border-blue-200'
  },
  {
    title: '1. Visão geral',
    description: 'Aqui é sua central de comando. Acompanhe suas vendas diárias, receitas, produtos mais vendidos e acesse atalhos rápidos para o suporte.',
    icon: <LayoutDashboard className="w-12 h-12 text-indigo-500" />,
    color: 'bg-indigo-50 border-indigo-200'
  },
  {
    title: '2. Configure sua loja',
    description: 'Defina nome, cores, logo, links e condições comerciais da sua vitrine antes de divulgá-la.',
    icon: <Store className="w-12 h-12 text-cyan-600" />,
    color: 'bg-cyan-50 border-cyan-200'
  },
  {
    title: '3. Cadastre seus produtos',
    description: 'Cadastre, edite e gerencie seus materiais, apostilas e cursos. Defina preços e disponibilize-os instantaneamente na sua loja.',
    icon: <Package className="w-12 h-12 text-emerald-500" />,
    color: 'bg-emerald-50 border-emerald-200'
  },
  {
    title: '4. Materiais grátis e kits',
    description: 'Ofereça brindes para clientes que já compraram na sua loja e crie kits para aumentar o valor de cada pedido.',
    icon: <Gift className="w-12 h-12 text-amber-500" />,
    color: 'bg-amber-50 border-amber-200'
  },
  {
    title: '5. Conteúdo e entregas',
    description: 'Confira seus arquivos, links de acesso e entregas dos materiais para que cada compra seja liberada corretamente.',
    icon: <ShieldCheck className="w-12 h-12 text-emerald-500" />,
    color: 'bg-emerald-50 border-emerald-200'
  },
  {
    title: '6. Acompanhar vendas',
    description: 'Visualize todas as transações, confirme os pagamentos via PIX ou Cartão e gerencie os acessos de seus alunos com um clique.',
    icon: <ShoppingCart className="w-12 h-12 text-purple-500" />,
    color: 'bg-purple-50 border-purple-200'
  },
  {
    title: '7. Financeiro e recebimentos',
    description: 'Todo o dinheiro de suas vendas fica disponível na sua carteira. Solicite saques diretos para sua chave PIX com total segurança.',
    icon: <DollarSign className="w-12 h-12 text-emerald-500" />,
    color: 'bg-emerald-50 border-emerald-200'
  },
  {
    title: '8. Atendimento guiado',
    description: 'Crie um atendimento que busca materiais reais por assunto, série, categoria, data e ofertas — e leva o cliente ao carrinho.',
    icon: <MessagesSquare className="w-12 h-12 text-teal-500" />,
    color: 'bg-teal-50 border-teal-200'
  },
  {
    title: '9. Métricas e anúncios',
    description: 'Conecte Meta Pixel e Google Analytics à vitrine pública para acompanhar as visitas e melhorar campanhas.',
    icon: <ChartNoAxesCombined className="w-12 h-12 text-blue-600" />,
    color: 'bg-blue-50 border-blue-200'
  },
  {
    title: '10. WhatsApp da loja',
    description: 'Quando ativado, conecte o WhatsApp da sua loja por QR Code para automatizar atendimento, confirmação e entrega.',
    icon: <MessageCircle className="w-12 h-12 text-emerald-600" />,
    color: 'bg-emerald-50 border-emerald-200'
  },
  {
    title: '11. Tutoriais e IA',
    description: 'Ficou com dúvida? Acesse nossos tutoriais em vídeo e materiais de apoio para dominar todas as ferramentas e faturar mais.',
    icon: <Sparkles className="w-12 h-12 text-violet-500" />,
    color: 'bg-violet-50 border-violet-200'
  },
  {
    title: 'Tudo pronto para começar!',
    description: 'Agora a casa é sua. Comece cadastrando seu primeiro produto e divulgue sua loja. Boas vendas!',
    icon: <ShieldCheck className="w-12 h-12 text-blue-600" />,
    color: 'bg-blue-50 border-blue-200'
  }
];

export default function OnboardingTour({ storageKey }: { storageKey: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved === 'completed') return;
    const savedStep = Number(saved);
    if (Number.isInteger(savedStep) && savedStep >= 0 && savedStep < TOUR_STEPS.length) {
      setCurrentStep(savedStep);
    }
    // Abre em toda entrada enquanto o tour não estiver concluído.
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 700);
    return () => clearTimeout(timer);
  }, [storageKey]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => {
        const next = prev + 1;
        localStorage.setItem(storageKey, String(next));
        return next;
      });
    } else {
      finishOnboarding();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => {
        const previous = prev - 1;
        localStorage.setItem(storageKey, String(previous));
        return previous;
      });
    }
  };

  const finishOnboarding = () => {
    localStorage.setItem(storageKey, 'completed');
    setIsOpen(false);
  };

  const continueLater = () => {
    localStorage.setItem(storageKey, String(currentStep));
    setIsOpen(false);
  };

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative"
        >
          {/* Close button */}
          <button 
            onClick={continueLater}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors z-10"
            title="Continuar tour depois"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header/Illustration Area */}
          <div className={`pt-12 pb-8 px-6 flex justify-center items-center ${step.color} border-b`}>
            <div className="bg-white p-6 rounded-3xl shadow-sm">
              {step.icon}
            </div>
          </div>

          {/* Content */}
          <div className="p-8 text-center space-y-4">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              {step.title}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed font-medium px-2">
              {step.description}
            </p>
          </div>

          {/* Footer Controls */}
          <div className="px-8 pb-8 flex flex-col gap-4">
            {/* Dots */}
            <div className="flex justify-center gap-1.5 mb-2">
              {TOUR_STEPS.map((_, idx) => (
                <div 
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-6 bg-blue-600' : 'w-1.5 bg-slate-200'}`}
                />
              ))}
            </div>
            
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={handlePrev}
                disabled={currentStep === 0}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-colors ${currentStep === 0 ? 'text-transparent cursor-default' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                <ChevronLeft className="w-4 h-4" /> Voltar
              </button>

              <button
                onClick={handleNext}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-sm flex items-center gap-1 shadow-md shadow-blue-600/20 transition-all"
              >
                {currentStep === TOUR_STEPS.length - 1 ? 'Concluir Tour 360' : 'Avançar'}
                {currentStep < TOUR_STEPS.length - 1 && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
