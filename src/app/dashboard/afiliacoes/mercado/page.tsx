'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Store, Search, Filter, AlertCircle, ShoppingBag, DollarSign, Loader2, CheckCircle2, Users } from 'lucide-react';
import { applyForProductAffiliation, getMyAffiliations, cancelAffiliation } from '@/lib/affiliate-service';
import { getMarketplaceProductsAction, getMarketplaceStoresAction } from '@/app/actions/affiliate-actions';

export default function AffiliateMarketplacePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [myAffiliations, setMyAffiliations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [affiliatingId, setAffiliatingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [marketProducts, marketStores, myAff] = await Promise.all([
          getMarketplaceProductsAction(),
          getMarketplaceStoresAction(),
          getMyAffiliations()
        ]);
        setProducts(marketProducts);
        setStores(marketStores);
        setMyAffiliations(myAff);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleAffiliate = async (productId: string, storeId: string) => {
    setAffiliatingId(productId);
    setSuccessMsg(null);
    try {
      const res = await applyForProductAffiliation(productId, storeId);
      if (res.success) {
        setSuccessMsg(res.message);
        // Refresh affiliations to show "Afiliado" instead of the button
        const newAffs = await getMyAffiliations();
        setMyAffiliations(newAffs);
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert('Erro ao se afiliar. Tente novamente.');
    } finally {
      setAffiliatingId(null);
    }
  };

  const handleCancelAffiliation = async (affiliateId: string) => {
    if (!confirm('Tem certeza que deseja cancelar esta afiliação? O criador precisará aprovar novamente se você solicitar no futuro.')) return;
    
    try {
      const res = await cancelAffiliation(affiliateId);
      if (res.success) {
        alert('Afiliação cancelada com sucesso.');
        const newAffs = await getMyAffiliations();
        setMyAffiliations(newAffs);
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert('Erro ao cancelar afiliação. Tente novamente.');
    }
  };



  const filtered = products.filter(p => 
    p.titulo.toLowerCase().includes(search.toLowerCase()) || 
    (p.store?.nome_loja || '').toLowerCase().includes(search.toLowerCase())
  );

  const filteredStores = stores.filter(s =>
    s.nome_loja.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-7 h-7 text-brand-teal" />
            Mercado de Afiliação
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Encontre os melhores produtos para se afiliar e vender.
          </p>
        </div>
        <Link
          href="/dashboard/afiliacoes"
          className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
        >
          Minhas Afiliações
        </Link>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          {successMsg}
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400" />
        <input 
          type="text"
          placeholder="Buscar produto ou loja..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none text-sm font-semibold text-slate-900 placeholder:text-slate-400"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-brand-teal animate-spin" />
            <p className="text-sm font-bold text-slate-500">Carregando mercado...</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Nenhum produto encontrado</h3>
          <p className="text-sm font-medium text-slate-500 max-w-sm mx-auto">
            Não há produtos disponíveis no mercado com os filtros atuais.
          </p>
        </div>
      ) : (
        <div className="space-y-8">


          {/* Products Section */}
          {filtered.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-brand-teal" />
                Produtos Disponíveis
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map(product => {
                  const productAffiliate = myAffiliations.find(a => a.store_id === product.store_id && a.product_id === product.id && a.status !== 'cancelado');
                  const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                  const comissaoText = product.affiliate_commission_rate ? `${product.affiliate_commission_rate}%` : 'Não definida';
                  const comissaoCalc = product.affiliate_commission_rate ? (product.preco * (product.affiliate_commission_rate / 100)) : 0;

                  return (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col"
                    >
                      <div className="h-40 bg-slate-100 relative overflow-hidden flex-shrink-0">
                        {product.capa_url ? (
                          <img src={product.capa_url} alt={product.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                            <ShoppingBag className="w-8 h-8 mb-2 opacity-50" />
                            <span className="text-xs font-bold uppercase tracking-wider">Sem capa</span>
                          </div>
                        )}
                        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur shadow-sm px-2.5 py-1 rounded-lg text-xs font-bold text-slate-800 flex items-center gap-1.5 border border-slate-200">
                          <Store className="w-3.5 h-3.5 text-blue-600" />
                          {product.store?.nome_loja || 'Loja Excluída'}
                        </div>
                      </div>
                      
                      <div className="p-5 flex flex-col flex-1">
                        <h3 className="font-bold text-slate-900 text-lg line-clamp-1 mb-1">{product.titulo}</h3>
                        <div className="flex items-end justify-between mt-auto pt-4">
                          <div>
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Preço do Produto</p>
                            <p className="font-black text-slate-900 text-lg">{formatCurrency(product.preco)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Sua Comissão ({comissaoText})</p>
                            <div className="flex items-center justify-end gap-1 text-emerald-600">
                              <span className="font-black text-lg">{formatCurrency(comissaoCalc)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-5 pt-5 border-t border-slate-100">
                          {productAffiliate ? (
                            <div className="flex flex-col gap-2">
                              <div className={`w-full py-2.5 text-sm font-bold rounded-xl flex items-center justify-center gap-2 ${
                                productAffiliate.status === 'aprovado' ? 'bg-emerald-100 text-emerald-700' :
                                productAffiliate.status === 'rejeitado' ? 'bg-red-100 text-red-700' :
                                productAffiliate.status === 'cancelado' ? 'bg-slate-100 text-slate-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {productAffiliate.status === 'aprovado' && <><CheckCircle2 className="w-4 h-4" /> Afiliado Aprovado</>}
                                {productAffiliate.status === 'pendente' && 'Aguardando aprovação'}
                                {productAffiliate.status === 'rejeitado' && 'Solicitação rejeitada'}
                                {productAffiliate.status === 'cancelado' && 'Afiliação cancelada'}
                              </div>
                              {productAffiliate.status === 'rejeitado' && (
                                <button
                                  onClick={() => handleAffiliate(product.id, product.store_id)}
                                  disabled={affiliatingId === product.id}
                                  className="text-xs font-bold text-brand-navy hover:underline transition-colors w-full text-center py-1 disabled:opacity-50"
                                >
                                  {affiliatingId === product.id ? 'Processando...' : 'Solicitar Novamente'}
                                </button>
                              )}
                              {productAffiliate.status !== 'rejeitado' && productAffiliate.status !== 'cancelado' && (
                                <button
                                  onClick={() => handleCancelAffiliation(productAffiliate.id)}
                                  className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors w-full text-center py-1"
                                >
                                  Cancelar filiação
                                </button>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => handleAffiliate(product.id, product.store_id)}
                              disabled={affiliatingId === product.id}
                              className="w-full py-2.5 bg-brand-navy hover:bg-brand-navy-hover text-white text-sm font-bold rounded-xl transition-colors shadow-md shadow-brand-navy/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              {affiliatingId === product.id ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Processando...</>
                              ) : (
                                'Me Afiliar Agora'
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {filteredStores.length === 0 && filtered.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Nenhum resultado encontrado</h3>
              <p className="text-sm font-medium text-slate-500 max-w-sm mx-auto">
                Não há lojas ou produtos disponíveis com os filtros atuais.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

