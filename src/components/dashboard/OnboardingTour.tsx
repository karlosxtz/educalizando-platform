'use client';

import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight,Boxes,ChartNoAxesCombined,ChevronLeft,CircleHelp,DollarSign,Gift,LayoutDashboard,Library,Map,MessageCircle,MessagesSquare,Package,PlaySquare,Settings,ShoppingCart,Sparkles,Store,Tags,Ticket,Users,Wrench,X } from 'lucide-react';
import { usePathname,useRouter,useSearchParams } from 'next/navigation';
import { useEffect,useState } from 'react';

type TourStep = { title: string; description: string; task: string; icon: LucideIcon; href: string };
const TOUR_STEPS: TourStep[] = [
  { title: 'Visão geral', description: 'A central de comando da sua loja: vendas, receita e atalhos.', task: 'Comece aqui para entender seus números e encontrar os próximos passos.', icon: LayoutDashboard, href: '/dashboard' },
  { title: 'Aprenda a usar', description: 'Vídeos e materiais de apoio para operar a plataforma.', task: 'Use este módulo quando quiser rever uma função ou aprender um recurso novo.', icon: PlaySquare, href: '/dashboard/tutoriais' },
  { title: 'Configuração da loja', description: 'Nome, identidade visual, informações e regras da sua vitrine.', task: 'Preencha primeiro os dados públicos que seus clientes verão.', icon: Store, href: '/dashboard/loja' },
  { title: 'Meus produtos', description: 'Seu catálogo de apostilas, cursos e materiais digitais.', task: 'Clique em novo produto, defina título, preço, capa e material de entrega.', icon: Package, href: '/dashboard/produtos' },
  { title: 'Minhas indicações', description: 'Link, criadoras indicadas e bônus de 3% das vendas elegíveis.', task: 'Copie seu link e acompanhe cada indicação e comissão nesta área.', icon: Gift, href: '/dashboard/indicacoes' },
  { title: 'Material grátis', description: 'Brindes que ajudam você a encantar clientes.', task: 'Crie um material gratuito para usar como bônus ou estratégia de divulgação.', icon: Gift, href: '/dashboard/brindes' },
  { title: 'Caixa de ferramentas', description: 'Recursos extras para organizar e criar seus materiais.', task: 'Explore as ferramentas conforme sua necessidade de produção.', icon: Wrench, href: '/dashboard/ferramentas' },
  { title: 'Mercado de PLR', description: 'Materiais com licença para você adquirir e revender.', task: 'Avalie a licença e publique um PLR comprado no seu próprio catálogo.', icon: Library, href: '/dashboard/plr' },
  { title: 'PLRs comprados', description: 'Histórico dos materiais PLR que já fazem parte do seu acervo.', task: 'Abra uma compra para acessar a licença ou publicar o material na loja.', icon: Package, href: '/dashboard/plr/comprados' },
  { title: 'Kits e combos', description: 'Agrupe materiais relacionados em uma oferta maior.', task: 'Crie um kit quando quiser aumentar o valor médio de cada pedido.', icon: Boxes, href: '/dashboard/kits' },
  { title: 'Cupons de desconto', description: 'Códigos promocionais para campanhas e datas especiais.', task: 'Defina o desconto, validade e produtos participantes antes de compartilhar.', icon: Ticket, href: '/dashboard/cupons' },
  { title: 'Categorias', description: 'Organização que facilita encontrar seus materiais na vitrine.', task: 'Cadastre categorias claras e relacione os produtos a elas.', icon: Tags, href: '/dashboard/categorias' },
  { title: 'Pedidos e vendas', description: 'Todas as transações, pagamentos e status dos pedidos.', task: 'Acompanhe vendas confirmadas e use esta tela para investigar um pedido.', icon: ShoppingCart, href: '/dashboard/pedidos' },
  { title: 'Clientes e acessos', description: 'Pessoas que compraram e os conteúdos liberados para elas.', task: 'Consulte o perfil do cliente e reenvie o acesso quando for necessário.', icon: Users, href: '/dashboard/clientes' },
  { title: 'Atendimento guiado', description: 'Ajuda para encontrar materiais e orientar clientes até o carrinho.', task: 'Configure assuntos e respostas para tornar o atendimento mais ágil.', icon: MessagesSquare, href: '/dashboard/atendimento' },
  { title: 'Métricas e anúncios', description: 'Integrações para acompanhar visitas e campanhas.', task: 'Conecte Pixel e Analytics antes de investir em tráfego pago.', icon: ChartNoAxesCombined, href: '/dashboard/metricas-anuncios' },
  { title: 'WhatsApp da loja', description: 'Conexão por QR Code para atendimento e mensagens da loja.', task: 'Use apenas o número que atenderá seus clientes e conclua a conexão.', icon: MessageCircle, href: '/dashboard/whatsapp-loja' },
  { title: 'Minhas afiliações', description: 'Programas de afiliação e produtos que você pode divulgar.', task: 'Veja oportunidades, solicite afiliação e acompanhe seus links.', icon: Users, href: '/dashboard/gerenciar-afiliacoes' },
  { title: 'Financeiro', description: 'Saldo, movimentações e pedidos de saque via PIX.', task: 'Confira seu saldo disponível e mantenha seus dados de recebimento atualizados.', icon: DollarSign, href: '/dashboard/financeiro' },
  { title: 'Inteligência artificial', description: 'Recursos para acelerar a criação de conteúdos e ideias.', task: 'Use a IA como apoio para criar, revisar e estruturar materiais.', icon: Sparkles, href: '/dashboard/ia' },
  { title: 'Configurações da conta', description: 'Dados pessoais, segurança e preferências da sua conta.', task: 'Revise seus dados e mantenha suas informações de acesso atualizadas.', icon: Settings, href: '/dashboard/conta' },
];

type StoredProgress = { step: number };
const readProgress = (key: string): number => { try { const value = JSON.parse(localStorage.getItem(key) || '{}') as StoredProgress | number; return typeof value === 'number' ? value : value.step || 0; } catch { return Number(localStorage.getItem(key)) || 0; } };
const writeProgress = (key: string, step: number) => localStorage.setItem(key, JSON.stringify({ step }));

export default function OnboardingTour({ storageKey }: { storageKey: string }) {
  const router = useRouter(); const pathname = usePathname(); const searchParams = useSearchParams();
  const guided = searchParams.get('tour') === '1';
  const [isOpen, setIsOpen] = useState(false); const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (localStorage.getItem(storageKey) === 'completed') return;
    const saved = Math.min(Math.max(readProgress(storageKey), 0), TOUR_STEPS.length - 1);
    setStepIndex(saved);
    const timer = window.setTimeout(() => setIsOpen(true), guided ? 80 : 700);
    return () => window.clearTimeout(timer);
  }, [storageKey, guided, pathname]);

  const closeGuide = () => { setIsOpen(false); if (guided) router.replace(pathname); };
  const goTo = (nextIndex: number) => { writeProgress(storageKey, nextIndex); setStepIndex(nextIndex); setIsOpen(true); router.push(`${TOUR_STEPS[nextIndex].href}?tour=1`); };
  const finish = () => { localStorage.setItem(storageKey, 'completed'); setIsOpen(false); router.replace(pathname); };
  if (!isOpen) return null;
  const step = TOUR_STEPS[stepIndex]; const Icon = step.icon; const isLast = stepIndex === TOUR_STEPS.length - 1;

  if (guided) return <motion.aside initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="fixed bottom-4 right-4 z-[90] w-[calc(100vw-2rem)] max-w-md rounded-3xl border border-sky-100 bg-white p-5 shadow-2xl shadow-slate-900/20 sm:bottom-6 sm:right-6" aria-live="polite"><button onClick={closeGuide} className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Pausar tutorial"><X className="h-4 w-4" /></button><div className="flex items-start gap-3"><span className="rounded-2xl bg-sky-100 p-3 text-sky-700"><Icon className="h-6 w-6" /></span><div className="pr-7"><p className="text-[11px] font-black uppercase tracking-[0.14em] text-sky-700">Tutorial guiado · {stepIndex + 1} de {TOUR_STEPS.length}</p><h2 className="mt-1 text-lg font-black text-slate-950">{step.title}</h2></div></div><p className="mt-4 text-sm leading-6 text-slate-600">{step.description}</p><div className="mt-4 rounded-2xl bg-sky-50 p-3.5"><p className="text-xs font-black uppercase tracking-wider text-sky-800">O que fazer nesta tela</p><p className="mt-1 text-sm font-semibold leading-6 text-slate-700">{step.task}</p></div><p className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-500"><CircleHelp className="h-4 w-4 text-sky-600" /> O módulo atual está marcado com “Tour” no menu.</p><div className="mt-5 flex items-center justify-between gap-3"><button onClick={() => stepIndex === 0 ? closeGuide() : goTo(stepIndex - 1)} className="inline-flex min-h-10 items-center gap-1 rounded-xl px-2 text-sm font-bold text-slate-600 hover:bg-slate-100"><ChevronLeft className="h-4 w-4" /> Voltar</button><button onClick={() => isLast ? finish() : goTo(stepIndex + 1)} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-sky-600 px-4 text-sm font-black text-white shadow-lg shadow-sky-600/20 hover:bg-sky-700">{isLast ? 'Concluir tutorial' : 'Próximo módulo'} {!isLast && <ArrowRight className="h-4 w-4" />}</button></div></motion.aside>;

  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true"><motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="relative w-full max-w-lg overflow-hidden rounded-[2rem] bg-white shadow-2xl"><button onClick={closeGuide} className="absolute right-4 top-4 rounded-full bg-slate-100 p-2 text-slate-400 hover:text-slate-700" aria-label="Continuar depois"><X className="h-5 w-5" /></button><div className="bg-gradient-to-br from-sky-50 to-blue-100 px-7 pb-7 pt-10 text-center"><span className="mx-auto inline-flex rounded-3xl bg-white p-5 text-sky-600 shadow-lg"><Map className="h-10 w-10" /></span><h1 className="mt-5 text-2xl font-black text-slate-950">Tutorial completo da Educalizando</h1><p className="mt-3 text-sm leading-6 text-slate-600">Você vai percorrer todos os módulos. Em cada tela, o menu fica destacado e este guia explica exatamente o que fazer.</p></div><div className="p-6"><div className="rounded-2xl border border-sky-100 bg-sky-50 p-4"><p className="text-xs font-black uppercase tracking-wider text-sky-700">Próximo módulo</p><p className="mt-1 font-black text-slate-900">{step.title}</p><p className="mt-1 text-sm text-slate-600">{step.task}</p></div><button onClick={() => goTo(stepIndex)} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 text-sm font-black text-white shadow-lg shadow-sky-600/20 hover:bg-sky-700">{stepIndex ? 'Retomar tutorial guiado' : 'Começar tutorial guiado'} <ArrowRight className="h-4 w-4" /></button></div></motion.div></div>;
}
