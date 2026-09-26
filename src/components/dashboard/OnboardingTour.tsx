'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, ChevronLeft, ChevronRight, CheckCircle2, Map, LayoutDashboard, Package, ShoppingCart, ShieldCheck, DollarSign, Store, Gift, MessagesSquare, ChartNoAxesCombined, MessageCircle, Sparkles, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

type TourStep = { title: string; description: string; task?: string; icon: typeof Map; color: string; href?: string; actionLabel?: string };

const TOUR_STEPS: TourStep[] = [
  { title: 'Bem-vindo ao Tour 360!', description: 'Este é um guia prático do seu painel. A cada etapa, você abre a ferramenta certa e entende exatamente como usá-la.', task: 'Reserve poucos minutos para conhecer as partes essenciais da sua loja.', icon: Map, color: 'from-blue-50 to-indigo-100 border-blue-200' },
  { title: '1. Visão geral', description: 'Sua central de comando mostra vendas, receita, produtos em destaque e atalhos para o dia a dia.', task: 'Confira os indicadores sempre que quiser saber como sua loja está performando.', icon: LayoutDashboard, color: 'from-indigo-50 to-blue-100 border-indigo-200', href: '/dashboard', actionLabel: 'Abrir visão geral' },
  { title: '2. Configure sua loja', description: 'Aqui você deixa sua vitrine com a sua identidade: nome, logo, cores, apresentação e condições comerciais.', task: 'Comece preenchendo as informações que seus clientes verão antes de comprar.', icon: Store, color: 'from-cyan-50 to-sky-100 border-cyan-200', href: '/dashboard/loja', actionLabel: 'Configurar minha loja' },
  { title: '3. Cadastre seu primeiro produto', description: 'Publique apostilas, cursos e materiais digitais. Você define título, preço, capa e o que o cliente receberá.', task: 'Use um nome claro, uma boa capa e descreva o resultado que o material entrega.', icon: Package, color: 'from-emerald-50 to-teal-100 border-emerald-200', href: '/dashboard/produtos', actionLabel: 'Ver meus produtos' },
  { title: '4. Materiais grátis e kits', description: 'Crie brindes para encantar seus clientes e kits para reunir materiais relacionados em uma oferta maior.', task: 'Use um brinde como bônus de compra ou monte um kit para aumentar o valor do pedido.', icon: Gift, color: 'from-amber-50 to-orange-100 border-amber-200', href: '/dashboard/brindes', actionLabel: 'Abrir materiais grátis' },
  { title: '5. Conteúdo e entregas', description: 'Revise arquivos, links e liberações para garantir que cada cliente receba o material correto após pagar.', task: 'Antes de divulgar um produto, confira se o arquivo ou link de acesso está preenchido.', icon: ShieldCheck, color: 'from-emerald-50 to-green-100 border-emerald-200', href: '/dashboard/conteudo', actionLabel: 'Revisar entregas' },
  { title: '6. Pedidos e vendas', description: 'Acompanhe cada transação, o status do pagamento e os acessos liberados para seus alunos.', task: 'Consulte esta área para tirar dúvidas de pedidos e acompanhar as vendas confirmadas.', icon: ShoppingCart, color: 'from-purple-50 to-violet-100 border-purple-200', href: '/dashboard/pedidos', actionLabel: 'Ver pedidos e vendas' },
  { title: '7. Financeiro e recebimentos', description: 'Veja seus saldos, histórico de movimentações e solicite saques para sua chave PIX.', task: 'Mantenha seus dados de recebimento atualizados para receber suas vendas sem imprevistos.', icon: DollarSign, color: 'from-emerald-50 to-lime-100 border-emerald-200', href: '/dashboard/financeiro', actionLabel: 'Abrir financeiro' },
  { title: '8. Atendimento guiado', description: 'Organize um atendimento que encontra materiais por tema, série, categoria e ofertas para levar o cliente ao carrinho.', task: 'Use este módulo quando quiser transformar perguntas em recomendações de materiais.', icon: MessagesSquare, color: 'from-teal-50 to-cyan-100 border-teal-200', href: '/dashboard/atendimento', actionLabel: 'Abrir atendimento' },
  { title: '9. Métricas e anúncios', description: 'Conecte Meta Pixel e Google Analytics à vitrine pública para medir visitas e melhorar suas campanhas.', task: 'Configure as integrações antes de investir em anúncios para acompanhar os resultados.', icon: ChartNoAxesCombined, color: 'from-blue-50 to-sky-100 border-blue-200', href: '/dashboard/metricas-anuncios', actionLabel: 'Abrir métricas' },
  { title: '10. WhatsApp da loja', description: 'Conecte o WhatsApp por QR Code para centralizar atendimento, confirmações e orientações de compra.', task: 'Ative somente o número que será usado para atender os clientes da sua loja.', icon: MessageCircle, color: 'from-emerald-50 to-green-100 border-emerald-200', href: '/dashboard/whatsapp-loja', actionLabel: 'Configurar WhatsApp' },
  { title: '11. Tutoriais e IA', description: 'Encontre vídeos de apoio e recursos para criar materiais e operar sua loja com mais agilidade.', task: 'Volte sempre que tiver uma dúvida ou quiser descobrir uma nova ferramenta.', icon: Sparkles, color: 'from-violet-50 to-fuchsia-100 border-violet-200', href: '/dashboard/tutoriais', actionLabel: 'Abrir tutoriais' },
  { title: 'Tudo pronto para começar!', description: 'Você já conhece o caminho. Seu próximo passo é publicar um material e compartilhar a sua loja.', task: 'Cadastre um produto agora e comece a construir seu catálogo.', icon: CheckCircle2, color: 'from-blue-50 to-indigo-100 border-blue-200', href: '/dashboard/produtos/novo', actionLabel: 'Cadastrar meu produto' },
];

const saveStep = (storageKey: string, step: number) => localStorage.setItem(storageKey, JSON.stringify({ step }));

export default function OnboardingTour({ storageKey }: { storageKey: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved === 'completed') return;
    try {
      const parsed = JSON.parse(saved || '{}');
      const step = typeof parsed === 'number' ? parsed : parsed.step;
      if (Number.isInteger(step) && step >= 0 && step < TOUR_STEPS.length) setCurrentStep(step);
    } catch {
      const legacyStep = Number(saved);
      if (Number.isInteger(legacyStep) && legacyStep >= 0 && legacyStep < TOUR_STEPS.length) setCurrentStep(legacyStep);
    }
    const timer = window.setTimeout(() => setIsOpen(true), 700);
    return () => window.clearTimeout(timer);
  }, [storageKey]);

  const goToStep = (nextStep: number) => { saveStep(storageKey, nextStep); setCurrentStep(nextStep); };
  const finishOnboarding = () => { localStorage.setItem(storageKey, 'completed'); setIsOpen(false); };
  const visitModule = (step: TourStep) => {
    if (!step.href) return;
    saveStep(storageKey, currentStep);
    setIsOpen(false);
    router.push(step.href);
  };

  if (!isOpen) return null;
  const step = TOUR_STEPS[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      <AnimatePresence mode="wait">
        <motion.div key={currentStep} initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: -12 }} transition={{ duration: 0.22 }} className="relative w-full max-w-xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
          <button onClick={() => setIsOpen(false)} className="absolute right-4 top-4 z-10 rounded-full bg-white/80 p-2 text-slate-400 shadow-sm transition hover:bg-white hover:text-slate-700" title="Continuar o tour depois" aria-label="Continuar o tour depois"><X className="h-5 w-5" /></button>
          <div className={`border-b bg-gradient-to-br ${step.color} px-6 pb-7 pt-10 sm:px-10`}>
            <div className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500"><Map className="h-4 w-4" /> Tour interativo · etapa {currentStep + 1} de {TOUR_STEPS.length}</div>
            <div className="mt-6 flex items-center gap-5"><div className="rounded-3xl bg-white p-5 shadow-lg shadow-slate-900/10"><Icon className="h-10 w-10 text-blue-600" /></div><div><h2 id="tour-title" className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{step.title}</h2><p className="mt-1 text-sm font-semibold text-slate-600">Aprenda no próprio painel, passo a passo.</p></div></div>
          </div>
          <div className="space-y-5 px-6 py-7 sm:px-10"><p className="text-sm leading-7 text-slate-600 sm:text-base">{step.description}</p>{step.task && <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4"><p className="text-xs font-black uppercase tracking-wider text-blue-700">O que fazer aqui</p><p className="mt-1 text-sm font-semibold leading-6 text-slate-700">{step.task}</p></div>}</div>
          <div className="border-t border-slate-100 px-6 py-5 sm:px-10">
            <div className="mb-5 flex gap-1.5" aria-label={`Etapa ${currentStep + 1} de ${TOUR_STEPS.length}`}>{TOUR_STEPS.map((_, index) => <span key={index} className={`h-1.5 rounded-full transition-all ${index === currentStep ? 'w-7 bg-blue-600' : index < currentStep ? 'w-1.5 bg-blue-300' : 'w-1.5 bg-slate-200'}`} />)}</div>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between"><button onClick={() => currentStep === 0 ? setIsOpen(false) : goToStep(currentStep - 1)} className="inline-flex min-h-11 items-center justify-center gap-1 rounded-xl px-3 text-sm font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"><ChevronLeft className="h-4 w-4" /> {currentStep === 0 ? 'Continuar depois' : 'Voltar'}</button><div className="flex flex-col gap-2 sm:flex-row">{step.href && <button onClick={() => visitModule(step)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"><ArrowUpRight className="h-4 w-4" /> {step.actionLabel}</button>}<button onClick={() => isLastStep ? finishOnboarding() : goToStep(currentStep + 1)} className="inline-flex min-h-11 items-center justify-center gap-1 rounded-xl border border-slate-200 px-4 text-sm font-black text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">{isLastStep ? 'Concluir tour' : currentStep === 0 ? 'Começar tour' : 'Próxima etapa'} {!isLastStep && <ChevronRight className="h-4 w-4" />}</button></div></div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
