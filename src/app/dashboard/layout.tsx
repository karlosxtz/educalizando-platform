'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import Sidebar from '@/components/dashboard/Sidebar';
import { getCurrentUserSession, isRealSupabaseConfigured } from '@/lib/supabase';
import { getCurrentCreatorStore } from '@/lib/store-service';
import { Store } from '@/lib/types';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [store, setStore] = useState<Store | null>(null);
  const [creatorEmail, setCreatorEmail] = useState('criador@educalizando.com.br');

  useEffect(() => {
    async function verifyAuthAndLoadStore() {
      try {
        const session = await getCurrentUserSession();
        if (!session && isRealSupabaseConfigured()) {
          router.push('/login');
          return;
        }

        if (session?.user?.email) {
          setCreatorEmail(session.user.email);
        }

        const storeData = await getCurrentCreatorStore();
        setStore(storeData);
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col lg:flex-row font-sans">
      {/* Fixed Left Sidebar */}
      <Sidebar 
        store={store} 
        creatorName={store?.nome_loja || 'Prof. Ricardo Silva'} 
        creatorEmail={creatorEmail} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
