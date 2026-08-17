"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getMyAffiliations } from '@/lib/affiliate-service';
import { Affiliate } from '@/lib/types';
import { Link2, Copy, Check, DollarSign, MousePointerClick, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

export default function AffiliateDashboardPage() {
  const [affiliations, setAffiliations] = useState<Affiliate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      const data = await getMyAffiliations();
      setAffiliations(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  const handleCopyLink = (storeSlug: string, affiliateId: string) => {
    const url = `${window.location.origin}/loja/${storeSlug}?ref=${affiliateId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(affiliateId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) {
    return <div className="p-8">Carregando afiliações...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Minhas Afiliações</h1>
        <p className="text-slate-500 mt-1">Acompanhe seus links de divulgação e comissões.</p>
      </div>

      {/* Resumo Financeiro (Mocked for now) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="font-medium text-slate-700">Comissões Recebidas</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">R$ 0,00</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h3 className="font-medium text-slate-700">Vendas Realizadas</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">0</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <MousePointerClick className="w-5 h-5" />
            </div>
            <h3 className="font-medium text-slate-700">Cliques nos Links</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">0</p>
        </div>
      </div>

      {/* Lojas Afiliadas */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Lojas Parceiras</h2>
        </div>
        
        <div className="divide-y divide-slate-100">
          {affiliations.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Link2 className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-slate-900 font-medium">Você ainda não é afiliado de nenhuma loja</h3>
              <p className="text-slate-500 text-sm mt-1 mb-6">
                Explore a vitrine e envie solicitações de parceria.
              </p>
              <Link href="/vitrine" className="px-6 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors">
                Explorar Lojas
              </Link>
            </div>
          ) : (
            affiliations.map(affiliate => (
              <div key={affiliate.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  {affiliate.store?.logo_url ? (
                    <img src={affiliate.store.logo_url} alt="" className="w-16 h-16 rounded-xl object-cover border border-slate-200" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-medium border border-slate-200">
                      Loja
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-slate-900 text-lg">{affiliate.store?.nome_loja}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        affiliate.status === 'aprovado' ? 'bg-green-100 text-green-700' :
                        affiliate.status === 'rejeitado' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {affiliate.status.toUpperCase()}
                      </span>
                      {affiliate.status === 'aprovado' && (
                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                          Comissão: {affiliate.commission_rate || affiliate.store?.affiliate_commission_rate || 0}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {affiliate.status === 'aprovado' && affiliate.store?.slug && (
                  <div className="flex-1 max-w-md bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center gap-3">
                    <div className="flex-1 truncate text-sm text-slate-600 font-mono">
                      {`${typeof window !== 'undefined' ? window.location.origin : ''}/loja/${affiliate.store.slug}?ref=${affiliate.id}`}
                    </div>
                    <button 
                      onClick={() => handleCopyLink(affiliate.store!.slug, affiliate.id)}
                      className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-600 shrink-0"
                      title="Copiar Link"
                    >
                      {copiedId === affiliate.id ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
