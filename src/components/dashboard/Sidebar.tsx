'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Store, Package, Boxes, Ticket, Tags, ShoppingCart, 
  Wallet, Settings, ExternalLink, LogOut, Menu, X, ChevronRight, User, Users, FolderCheck, PlaySquare, Library, Gift, Sparkles, Wrench, MessagesSquare, MessageCircle, ChartNoAxesCombined
} from 'lucide-react';
import { signOutUser } from '@/lib/supabase';
import { Store as StoreType } from '@/lib/types';
import NotificationCenter from '@/components/dashboard/NotificationCenter';
interface SidebarProps {
  store?: StoreType | null;
  storeId?: string;
  creatorName?: string;
  creatorEmail?: string;
}

export default function Sidebar({ store, storeId, creatorName = 'Prof. Ricardo Silva', creatorEmail = 'prof.rico@gmail.com' }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const closeMobileMenu = useCallback((restoreFocus = true) => {
    setMobileOpen(false);
    if (restoreFocus) requestAnimationFrame(() => menuButtonRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMobileMenu();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [mobileOpen, closeMobileMenu]);

  const handleLogout = async () => {
    await signOutUser();
    router.push('/login');
  };



  const storeSlug = store?.slug || 'prof-ricardo';
  const storeName = store?.nome_loja || 'Prof. Ricardo Silva';

  const NAV_ITEMS = [
    {
      label: 'Visão Geral',
      href: '/dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      label: 'Aprenda a Usar',
      href: '/dashboard/tutoriais',
      icon: PlaySquare,
      badge: 'NOVO'
    },
    {
      label: 'Configuração da Loja',
      href: '/dashboard/loja',
      icon: Store,
      badge: null
    },
    {
      label: 'Meus Produtos',
      href: '/dashboard/produtos',
      icon: Package,
      badge: null
    },
    {
      label: 'Material Grátis',
      href: '/dashboard/brindes',
      icon: Gift,
      badge: 'NOVO'
    },
    {
      label: 'Caixa de Ferramentas',
      href: '/dashboard/ferramentas',
      icon: Wrench,
      badge: 'GRÁTIS'
    },
    {
      label: 'Mercado de PLR',
      href: '/dashboard/plr',
      icon: Library,
      badge: 'NOVO'
    },
    {
      label: 'PLRs Comprados',
      href: '/dashboard/plr/comprados',
      icon: Package,
      badge: null
    },
    {
      label: 'Conteúdo & Entregas',
      href: '/dashboard/conteudo',
      icon: FolderCheck,
      badge: null
    },
    {
      label: 'Kits (Combos)',
      href: '/dashboard/kits',
      icon: Boxes,
      badge: null
    },
    {
      label: 'Cupons de Desconto',
      href: '/dashboard/cupons',
      icon: Ticket,
      badge: null
    },
    {
      label: 'Categorias',
      href: '/dashboard/categorias',
      icon: Tags,
      badge: null
    },
    {
      label: 'Pedidos & Vendas',
      href: '/dashboard/pedidos',
      icon: ShoppingCart,
      badge: null
    },
    {
      label: 'Clientes e Acessos',
      href: '/dashboard/clientes',
      icon: Users,
      badge: 'NOVO'
    },
    {
      label: 'Atendimento Guiado',
      href: '/dashboard/atendimento',
      icon: MessagesSquare,
      badge: 'NOVO'
    },
    { label: 'Métricas e Anúncios', href: '/dashboard/metricas-anuncios', icon: ChartNoAxesCombined, badge: 'NOVO' },
    { label: 'WhatsApp da Loja', href: '/dashboard/whatsapp-loja', icon: MessageCircle, badge: 'PREMIUM' },
    {
      label: 'Minhas Afiliações',
      href: '/dashboard/gerenciar-afiliacoes',
      icon: Users,
      badge: 'NOVO'
    },
    {
      label: 'Financeiro',
      href: '/dashboard/financeiro',
      icon: Wallet,
      badge: null
    },
    {
      label: 'Inteligência Artificial',
      href: '/dashboard/ia',
      icon: Sparkles,
      badge: 'BETA'
    },
    {
      label: 'Configurações da Conta',
      href: '/dashboard/conta',
      icon: Settings,
      badge: null
    }
  ];

  const NAV_GROUPS = [
    { label: 'Visão geral', hrefs: ['/dashboard', '/dashboard/tutoriais'] },
    { label: 'Vender', hrefs: ['/dashboard/produtos', '/dashboard/brindes', '/dashboard/kits', '/dashboard/plr', '/dashboard/plr/comprados', '/dashboard/conteudo'] },
    { label: 'Gerenciar loja', hrefs: ['/dashboard/loja', '/dashboard/categorias', '/dashboard/clientes', '/dashboard/atendimento', '/dashboard/whatsapp-loja'] },
    { label: 'Pedidos e financeiro', hrefs: ['/dashboard/pedidos', '/dashboard/financeiro'] },
    { label: 'Marketing e crescimento', hrefs: ['/dashboard/cupons', '/dashboard/gerenciar-afiliacoes', '/dashboard/metricas-anuncios', '/dashboard/ia'] },
    { label: 'Outros recursos', hrefs: ['/dashboard/ferramentas', '/dashboard/conta'] },
  ].map((group) => ({ ...group, items: NAV_ITEMS.filter((item) => group.hrefs.includes(item.href)) }));

  const activeItem = NAV_ITEMS.find((item) => pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(`${item.href}/`))) || NAV_ITEMS[0];

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="sticky top-0 z-40 flex min-h-16 items-center gap-2 border-b border-slate-200 bg-white px-3 py-2 shadow-xs lg:hidden">
        <button
          ref={menuButtonRef}
          onClick={() => mobileOpen ? closeMobileMenu(false) : setMobileOpen(true)}
          className="min-h-11 min-w-11 shrink-0 rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={mobileOpen}
          aria-controls="creator-mobile-navigation"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Painel da loja</p>
          <p className="truncate text-sm font-black text-slate-900">{activeItem.label}</p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Link
            href={`/loja/${storeSlug}`}
            target="_blank"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            aria-label="Abrir loja pública em nova guia"
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Desktop Sidebar & Mobile Drawer Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 bottom-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } h-[100dvh] w-[min(86vw,22rem)] lg:w-64 overflow-x-hidden shadow-2xl lg:shadow-none`}
        id="creator-mobile-navigation"
        aria-label="Menu principal do criador"
      >
        <div className="min-w-0 flex-1 space-y-6 overflow-x-hidden overflow-y-auto p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          
          {/* Top Brand Logo & Active Store Indicator */}
          <div className="flex min-w-0 items-center justify-between gap-2 pt-1">
            <Link href="/" className="group flex min-w-0 max-w-[118px] items-center">
              <img
                src="/branding/logo-educalizando.png?v=3"
                alt="Educalizando"
                className="h-[42px] w-auto max-w-full object-contain transition-transform group-hover:scale-[1.02]"
                style={{ width: 'auto', height: '42px' }}
              />
            </Link>

            <div className="flex shrink-0 items-center gap-1">
              {/* Notificações em tempo real */}
              {storeId && <NotificationCenter storeId={storeId} />}

              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/90 text-emerald-800 text-[10px] font-extrabold shrink-0 shadow-2xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="hidden sm:inline">Loja ativa</span>
              </div>

              <button onClick={() => closeMobileMenu()} className="lg:hidden min-h-11 min-w-11 text-slate-400 p-2 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg" aria-label="Fechar menu">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Current Store Badge */}
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center gap-3">
            {store?.logo_url ? <img src={store.logo_url} alt={`Logo ${storeName}`} className="h-9 w-9 flex-shrink-0 rounded-lg border border-slate-200 bg-white object-contain p-0.5 shadow-xs" /> : <div className="w-9 h-9 rounded-lg bg-brand-navy text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-xs">
              {storeName.charAt(0).toUpperCase()}
            </div>}
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sua Loja Ativa:</span>
              <span className="text-xs font-bold text-slate-900 truncate block">{storeName}</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-5 pt-2" aria-label="Navegação do painel do vendedor">
            {NAV_GROUPS.map((group) => (
              <div key={group.label} className="space-y-1">
                <h2 className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">{group.label}</h2>
                {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(`${item.href}/`));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => closeMobileMenu(false)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex min-h-11 items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                    isActive
                      ? 'bg-slate-100 text-brand-navy font-bold shadow-xs border-l-4 border-brand-navy'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-brand-navy'
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-brand-navy' : 'text-slate-400'}`} />
                    <span className="min-w-0 leading-tight">{item.label}</span>
                  </div>

                  {item.badge ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200">
                      {item.badge}
                    </span>
                  ) : (
                    isActive && <ChevronRight className="w-3.5 h-3.5 text-brand-navy" />
                  )}
                </Link>
              );
                })}
              </div>
            ))}
          </nav>

          {/* Navigation Links */}

          {/* Open Public Store External Link */}
          <div className="pt-4 border-t border-slate-100">
            <Link
              href={`/loja/${storeSlug}`}
              target="_blank"
            className="flex min-h-11 items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-bold text-brand-green transition-all hover:bg-emerald-100/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            >
              <div className="flex items-center gap-2.5">
                <ExternalLink className="w-4 h-4 text-brand-green" />
                <span>Ver Loja Pública</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-brand-green" />
            </Link>
          </div>
        </div>

        {/* Sidebar Footer: Creator Account & Logout */}
        <div className="flex min-w-0 items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-brand-navy text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-900 truncate block">{creatorName}</span>
              <span className="text-[10px] text-slate-500 truncate block">{creatorEmail}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="min-h-11 min-w-11 rounded-lg border border-transparent p-2 text-rose-600 transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600"
            title="Encerrar Sessão"
            aria-label="Encerrar sessão"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Overlay Backdrop for Mobile Drawer */}
      {mobileOpen && (
        <div
          onClick={() => closeMobileMenu()}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          aria-hidden="true"
        />
      )}
    </>
  );
}
