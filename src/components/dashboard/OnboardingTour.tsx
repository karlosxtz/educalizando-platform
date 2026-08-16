'use client';

import { useState, useEffect } from 'react';
import { 
  X, ChevronRight, ChevronLeft, Map, LayoutDashboard, Package, 
  ShoppingCart, Video, ShieldCheck, DollarSign 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ONBOARDING_STEPS = [
  {
    title: 'Boas-vindas à Educalizando!',
    description: 'Estamos muito felizes em ter você aqui. Preparamos um painel completo para você vender seus materiais com facilidade. Vamos dar uma rápida olhada nas principais funções?',
    icon: <Map className="w-12 h-12 text-blue-500" />,
    color: 'bg-blue-50 border-blue-200'
  },
  {
    title: '1. Início (Dashboard)',
    description: 'Aqui é sua central de comando. Acompanhe suas vendas diárias, receitas, produtos mais vendidos e acesse atalhos rápidos para o suporte.',
    icon: <LayoutDashboard className="w-12 h-12 text-indigo-500" />,
    color: 'bg-indigo-50 border-indigo-200'
  },
  {
    title: '2. Meus Produtos',
    description: 'Cadastre, edite e gerencie seus materiais, apostilas e cursos. Defina preços e disponibilize-os instantaneamente na sua loja.',
    icon: <Package className="w-12 h-12 text-emerald-500" />,
    color: 'bg-emerald-50 border-emerald-200'
  },
  {
    title: '3. Acompanhar Vendas',
    description: 'Visualize todas as transações, confirme os pagamentos via PIX ou Cartão e gerencie os acessos de seus alunos com um clique.',
    icon: <ShoppingCart className="w-12 h-12 text-purple-500" />,
    color: 'bg-purple-50 border-purple-200'
  },
  {
    title: '4. Recebimentos & Saques',
    description: 'Todo o dinheiro de suas vendas fica disponível na sua carteira. Solicite saques diretos para sua chave PIX com total segurança.',
    icon: <DollarSign className="w-12 h-12 text-emerald-500" />,
    color: 'bg-emerald-50 border-emerald-200'
  },
  {
    title: '5. Tutoriais & Ajuda',
    description: 'Ficou com dúvida? Acesse nossos tutoriais em vídeo e materiais de apoio para dominar todas as ferramentas e faturar mais.',
    icon: <Video className="w-12 h-12 text-rose-500" />,
    color: 'bg-rose-50 border-rose-200'
  },
  {
    title: 'Tudo pronto para começar!',
    description: 'Agora a casa é sua. Comece cadastrando seu primeiro produto e divulgue sua loja. Boas vendas!',
    icon: <ShieldCheck className="w-12 h-12 text-blue-600" />,
    color: 'bg-blue-50 border-blue-200'
  }
];

export default function OnboardingTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if user has already seen the onboarding
    const hasSeenOnboarding = localStorage.getItem('educalizando_onboarding_completed');
    if (!hasSeenOnboarding) {
      // Delay opening slightly for better UX
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      finishOnboarding();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const finishOnboarding = () => {
    localStorage.setItem('educalizando_onboarding_completed', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  const step = ONBOARDING_STEPS[currentStep];

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
            onClick={finishOnboarding}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors z-10"
            title="Pular tour"
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
              {ONBOARDING_STEPS.map((_, idx) => (
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
                {currentStep === ONBOARDING_STEPS.length - 1 ? 'Começar Agora!' : 'Avançar'} 
                {currentStep < ONBOARDING_STEPS.length - 1 && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
