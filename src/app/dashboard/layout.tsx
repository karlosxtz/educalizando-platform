'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import Sidebar from '@/components/dashboard/Sidebar';
import AffiliateSidebar from '@/components/dashboard/AffiliateSidebar';
import SaleToast from '@/components/dashboard/SaleToast';
import { getCurrentUserSession, isRealSupabaseConfigured } from '@/lib/supabase';
import { getCurrentCreatorStore } from '@/lib/store-service';
import { Store } from '@/lib/types';
import { resolveUserRoles, getValidatedActiveRole, getRolePreference, UserRoles } from '@/lib/role-service';
import { supabase } from '@/lib/supabase';
import SystemBanners from '@/components/dashboard/SystemBanners';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [store, setStore] = useState<Store | null>(null);
  const [creatorEmail, setCreatorEmail] = useState('criador@educalizando.com.br');
  const [creatorName, setCreatorName] = useState('');
  const [activeRole, setActiveRole] = useState<'creator' | 'affiliate'>('creator');
  const [roles, setRoles] = useState<UserRoles | null>(null);

  useEffect(() => {
    async function verifyAuthAndLoadStore() {
      try {
        const session = await getCurrentUserSession();
        if (!session && isRealSupabaseConfigured()) {
          router.push('/login');
          return;
        }

        // Obter dados do usuário autenticado
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          if (isRealSupabaseConfigured()) {
            router.push('/login');
            return;
          }
        }

        if (user?.email) {
          setCreatorEmail(user.email);
        }
        
        const fullName = user?.user_metadata?.full_name || '';
        setCreatorName(fullName);

        if (user) {
          // Resolver papéis REAIS consultando o banco
          const userRoles = await resolveUserRoles(user.id);
          setRoles(userRoles);

          // Determinar papel ativo validando a preferência contra a permissão real
          const preference = getRolePreference();
          const role = getValidatedActiveRole(preference, userRoles);
          setActiveRole(role);

          // Carregar loja apenas se for criador e tiver uma loja real
          if (userRoles.isCreator && userRoles.store && userRoles.store.id) {
            setStore(userRoles.store);
          } else {
            // Fallback: tenta carregar via getCurrentCreatorStore (que agora não cria lojas phantom)
            const storeData = await getCurrentCreatorStore();
            if (storeData && storeData.id) {
              setStore(storeData);
            }
          }
        }
      } catch (err) {
        console.error('Erro ao verificar autenticação:', err);
      } finally {
        setCheckingAuth(false);
      }
    }
    verifyAuthAndLoadStore();
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-900 font-sans">
        <div className="flex items-center gap-3 bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          <span className="text-sm font-bold text-slate-700">Carregando seu Painel Educalizando...</span>
        </div>
      </div>
    );
  }

  const isAffiliateMode = activeRole === 'affiliate';

  return (
    <div className="min-h-screen lg:h-screen bg-slate-50 text-slate-900 flex flex-col lg:flex-row font-sans relative lg:overflow-hidden">
      {/* Premium Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-400/10 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-emerald-400/10 blur-[120px]" />
        <div className="absolute -bottom-[20%] left-[20%] w-[50%] h-[50%] rounded-full bg-purple-400/10 blur-[120px]" />
      </div>

      {/* Sidebar — bifurcada por papel */}
      <div className="relative z-10 lg:w-64 shrink-0 lg:h-screen">
        {isAffiliateMode ? (
          <AffiliateSidebar
            userName={creatorName || creatorEmail}
            userEmail={creatorEmail}
            hasCreatorRole={roles?.isCreator || false}
          />
        ) : (
          <Sidebar
            store={store}
            storeId={store?.id}
            creatorName={store?.nome_loja || creatorName || 'Minha Loja'}
            creatorEmail={creatorEmail}
            hasAffiliateRole={roles?.isAffiliate || false}
          />
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10 lg:overflow-y-auto lg:h-screen">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <SystemBanners />
          {children}
        </main>
      </div>

      {/* Toast de Venda em Tempo Real (global, fora do scroll) */}
      {store?.id && !isAffiliateMode && <SaleToast storeId={store.id} />}
    </div>
  );
}
