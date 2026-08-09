'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Ticket, Plus, Search, Filter, Edit, Trash2, CheckCircle2, 
  XCircle, Clock, AlertCircle, RefreshCw, X, Check, Package, Boxes, Loader2, Sparkles, HelpCircle 
} from 'lucide-react';
import { getStoreByCreatorId, getProductsByStoreId } from '@/lib/store-service';
import { getKitsByStoreId } from '@/lib/kit-service';
import { 
  getCouponsByStoreId, createCoupon, updateCoupon, 
  deleteCoupon, toggleCouponStatus 
} from '@/lib/coupon-service';
import { Coupon, CouponDiscountType, CouponStatus, Product, Kit } from '@/lib/types';

export default function CouponsDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [kits, setKits] = useState<Kit[]>([]);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ativo' | 'inativo' | 'expirado'>('all');

  // Modal Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  // Form Fields
  const [codigo, setCodigo] = useState('');
  const [tipoDesconto, setTipoDesconto] = useState<CouponDiscountType>('percentual');
  const [valorDesconto, setValorDesconto] = useState<number>(10);
  const [dataInicio, setDataInicio] = useState<string>(new Date().toISOString().split('T')[0]);
  const [hasExpiration, setHasExpiration] = useState<boolean>(false);
  const [dataExpiracao, setDataExpiracao] = useState<string>('');
  const [hasUsageLimit, setHasUsageLimit] = useState<boolean>(false);
  const [limiteDeUsos, setLimiteDeUsos] = useState<number>(50);
  const [status, setStatus] = useState<CouponStatus>('ativo');

  // Scope selection (All vs Specific)
  const [scopeType, setScopeType] = useState<'all' | 'specific'>('all');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedKitIds, setSelectedKitIds] = useState<string[]>([]);

  // Form Submission & Deletion State
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const store = await getStoreByCreatorId('current');
      const sId = store?.id || 'store-1';
      setStoreId(sId);

      const [cList, pList, kList] = await Promise.all([
        getCouponsByStoreId(sId),
        getProductsByStoreId(sId),
        getKitsByStoreId(sId)
      ]);

      setCoupons(cList);
      setProducts(pList.filter(p => p.status === 'publicado'));
      setKits(kList.filter(k => k.status === 'publicado'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'DESCONTO-';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCodigo(result);
  };

  const handleOpenCreateModal = () => {
    setEditingCoupon(null);
    setCodigo('');
    setTipoDesconto('percentual');
    setValorDesconto(10);
    setDataInicio(new Date().toISOString().split('T')[0]);
    setHasExpiration(false);
    setDataExpiracao('');
    setHasUsageLimit(false);
    setLimiteDeUsos(50);
    setStatus('ativo');
    setScopeType('all');
    setSelectedProductIds([]);
    setSelectedKitIds([]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setCodigo(coupon.codigo);
    setTipoDesconto(coupon.tipo_desconto);
    setValorDesconto(coupon.valor_desconto);
    setDataInicio(coupon.data_inicio ? coupon.data_inicio.split('T')[0] : new Date().toISOString().split('T')[0]);
    
    if (coupon.data_expiracao) {
      setHasExpiration(true);
      setDataExpiracao(coupon.data_expiracao.split('T')[0]);
    } else {
      setHasExpiration(false);
      setDataExpiracao('');
    }

    if (coupon.limite_de_usos !== null && coupon.limite_de_usos !== undefined) {
      setHasUsageLimit(true);
      setLimiteDeUsos(coupon.limite_de_usos);
    } else {
      setHasUsageLimit(false);
      setLimiteDeUsos(50);
    }

    setStatus(coupon.status);

    const cProducts = coupon.coupon_products || [];
    if (cProducts.length > 0) {
      setScopeType('specific');
      setSelectedProductIds(cProducts.map(p => p.product_id).filter(Boolean) as string[]);
      setSelectedKitIds(cProducts.map(p => p.kit_id).filter(Boolean) as string[]);
    } else {
      setScopeType('all');
      setSelectedProductIds([]);
      setSelectedKitIds([]);
    }

    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!codigo.trim()) {
      setFormError('Informe o código do cupom.');
      return;
    }

    if (!valorDesconto || valorDesconto <= 0) {
      setFormError('Informe um valor de desconto válido maior que zero.');
      return;
    }

    if (tipoDesconto === 'percentual' && valorDesconto > 100) {
      setFormError('Desconto percentual não pode exceder 100%.');
      return;
    }

    if (scopeType === 'specific' && selectedProductIds.length === 0 && selectedKitIds.length === 0) {
      setFormError('Selecione pelo menos um produto ou kit para o escopo específico.');
      return;
    }

    setSaving(true);
    try {
      if (editingCoupon) {
        await updateCoupon(editingCoupon.id, {
          codigo,
          tipo_desconto: tipoDesconto,
          valor_desconto: Number(valorDesconto),
          data_inicio: new Date(dataInicio).toISOString(),
          data_expiracao: hasExpiration && dataExpiracao ? new Date(dataExpiracao).toISOString() : null,
          limite_de_usos: hasUsageLimit ? Number(limiteDeUsos) : null,
          status,
          productIds: scopeType === 'specific' ? selectedProductIds : [],
          kitIds: scopeType === 'specific' ? selectedKitIds : []
        });
      } else {
        await createCoupon({
          store_id: storeId || 'store-1',
          codigo,
          tipo_desconto: tipoDesconto,
          valor_desconto: Number(valorDesconto),
          data_inicio: new Date(dataInicio).toISOString(),
          data_expiracao: hasExpiration && dataExpiracao ? new Date(dataExpiracao).toISOString() : null,
          limite_de_usos: hasUsageLimit ? Number(limiteDeUsos) : null,
          productIds: scopeType === 'specific' ? selectedProductIds : [],
          kitIds: scopeType === 'specific' ? selectedKitIds : []
        });
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'Erro ao salvar o cupom.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (coupon: Coupon) => {
    const nextStatus: CouponStatus = coupon.status === 'ativo' ? 'inativo' : 'ativo';
    await toggleCouponStatus(coupon.id, nextStatus);
    await loadData();
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteConfirmationId) return;
    await deleteCoupon(deleteConfirmationId);
    setDeleteConfirmationId(null);
    await loadData();
  };

  // Filtered List
  const filteredCoupons = coupons.filter(c => {
    const matchesQuery = c.codigo.toLowerCase().includes(searchQuery.toLowerCase());
    
    const now = new Date();
    const isExpired = c.data_expiracao && new Date(c.data_expiracao) < now;

    if (statusFilter === 'ativo') return matchesQuery && c.status === 'ativo' && !isExpired;
    if (statusFilter === 'inativo') return matchesQuery && c.status === 'inativo';
    if (statusFilter === 'expirado') return matchesQuery && isExpired;
    return matchesQuery;
  });

  const getBadgeStatus = (coupon: Coupon) => {
    const now = new Date();
    const isExpired = coupon.data_expiracao && new Date(coupon.data_expiracao) < now;
    const isEsgotado = coupon.limite_de_usos !== null && coupon.limite_de_usos !== undefined && coupon.usos_atuais >= coupon.limite_de_usos;

    if (coupon.status === 'inativo') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200 inline-flex items-center gap-1">
          <XCircle className="w-3 h-3 text-slate-400" /> Inativo
        </span>
      );
    }

    if (isExpired) {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
          <Clock className="w-3 h-3 text-rose-500" /> Expirado
        </span>
      );
    }

    if (isEsgotado) {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
          <AlertCircle className="w-3 h-3 text-amber-600" /> Esgotado
        </span>
      );
    }

    return (
      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-brand-green border border-emerald-200 inline-flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3 text-brand-green" /> Ativo
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-brand-navy animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      {/* Page Title & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-3">
            <Ticket className="w-7 h-7 text-brand-navy" /> Cupons de Desconto ({coupons.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Crie códigos promocionais para aumentar as vendas dos seus materiais didáticos e kits.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-5 py-3 rounded-2xl font-extrabold text-xs bg-brand-navy hover:bg-brand-navy-hover text-white shadow-md shadow-brand-navy/20 transition-all flex items-center justify-center gap-2 min-h-[44px]"
        >
          <Plus className="w-4 h-4 text-brand-teal" />
          <span>Criar Novo Cupom</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por código do cupom..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-brand-navy rounded-xl text-xs text-slate-900 font-medium focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1 flex-shrink-0">
            <Filter className="w-3.5 h-3.5 text-brand-teal" /> Status:
          </span>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex-shrink-0 ${
              statusFilter === 'all' ? 'bg-brand-navy text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({coupons.length})
          </button>
          <button
            onClick={() => setStatusFilter('ativo')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex-shrink-0 ${
              statusFilter === 'ativo' ? 'bg-brand-green text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Ativos
          </button>
          <button
            onClick={() => setStatusFilter('expirado')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex-shrink-0 ${
              statusFilter === 'expirado' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Expirados
          </button>
        </div>
      </div>

      {/* Coupons Table / Cards List */}
      {filteredCoupons.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Ticket className="w-8 h-8 text-slate-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900">Nenhum cupom encontrado</h3>
            <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
              Crie cupons de desconto promocionais para atrair novos alunos para a sua loja.
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-brand-navy text-white shadow-md inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-brand-teal" /> Criar Meu Primeiro Cupom
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto min-w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                  <th className="py-4 px-6">Código do Cupom</th>
                  <th className="py-4 px-6">Desconto</th>
                  <th className="py-4 px-6">Validade</th>
                  <th className="py-4 px-6">Utilizações</th>
                  <th className="py-4 px-6">Escopo</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredCoupons.map((coupon) => {
                  const scopeItems = coupon.coupon_products || [];
                  const isAllScope = scopeItems.length === 0;

                  return (
                    <tr key={coupon.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 font-black text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-blue-50 text-brand-navy border border-blue-100 flex items-center justify-center flex-shrink-0">
                            <Ticket className="w-4 h-4 text-brand-teal" />
                          </div>
                          <span className="font-mono text-sm tracking-wide bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                            {coupon.codigo}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-6 font-extrabold text-slate-900">
                        {coupon.tipo_desconto === 'percentual' ? (
                          <span className="text-brand-navy bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 font-black">
                            {coupon.valor_desconto}% OFF
                          </span>
                        ) : (
                          <span className="text-brand-green bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-black">
                            R$ {coupon.valor_desconto.toFixed(2).replace('.', ',')} OFF
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-slate-600 font-medium">
                        {coupon.data_expiracao ? (
                          <div className="space-y-0.5">
                            <span className="block text-slate-900 font-bold">
                              Até {new Date(coupon.data_expiracao).toLocaleDateString('pt-BR')}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              Início: {new Date(coupon.data_inicio).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px]">
                            Sem Expiração
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 font-bold text-slate-700">
                        {coupon.limite_de_usos !== null && coupon.limite_de_usos !== undefined ? (
                          <span>
                            <strong>{coupon.usos_atuais}</strong> / {coupon.limite_de_usos} usos
                          </span>
                        ) : (
                          <span>
                            <strong>{coupon.usos_atuais}</strong> usos (Ilimitado)
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-slate-600 font-medium">
                        {isAllScope ? (
                          <span className="text-slate-700 font-bold bg-slate-100 px-2.5 py-1 rounded-lg text-[11px]">
                            Toda a Loja
                          </span>
                        ) : (
                          <span className="text-blue-700 font-bold bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 text-[11px]">
                            {scopeItems.length} itens específicos
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6">
                        {getBadgeStatus(coupon)}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleStatus(coupon)}
                            className={`p-2 rounded-xl text-xs font-bold transition-all min-h-[38px] ${
                              coupon.status === 'ativo' 
                                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                            title={coupon.status === 'ativo' ? 'Desativar Cupom' : 'Ativar Cupom'}
                          >
                            {coupon.status === 'ativo' ? 'Desativar' : 'Ativar'}
                          </button>

                          <button
                            onClick={() => handleOpenEditModal(coupon)}
                            className="p-2 text-slate-600 hover:text-brand-navy bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
                            title="Editar Cupom"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setDeleteConfirmationId(coupon.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
                            title="Excluir Cupom"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT COUPON MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-200 max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-navy text-white flex items-center justify-center font-bold">
                    <Ticket className="w-5 h-5 text-brand-teal" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">
                      {editingCoupon ? 'Editar Cupom de Desconto' : 'Criar Novo Cupom de Desconto'}
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Configure as regras de desconto e escopo de utilização.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSaveCoupon} className="space-y-5">
                
                {/* Coupon Code Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 block">
                    Código do Cupom *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={codigo}
                      onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                      placeholder="Ex: PROMO10, BEMVINDO20"
                      className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 focus:border-brand-navy rounded-xl text-slate-900 font-mono text-sm font-black focus:outline-none uppercase"
                    />
                    <button
                      type="button"
                      onClick={generateRandomCode}
                      className="px-3.5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors flex-shrink-0 min-h-[44px]"
                    >
                      <Sparkles className="w-4 h-4 text-brand-teal" />
                      <span>Gerar Código</span>
                    </button>
                  </div>
                </div>

                {/* Discount Type & Value */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 block">
                      Tipo de Desconto *
                    </label>
                    <select
                      value={tipoDesconto}
                      onChange={(e) => setTipoDesconto(e.target.value as CouponDiscountType)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-brand-navy rounded-xl text-slate-900 text-xs font-bold focus:outline-none min-h-[44px]"
                    >
                      <option value="percentual">Percentual (%)</option>
                      <option value="valor_fixo">Valor Fixo (R$)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 block">
                      Valor do Desconto *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={tipoDesconto === 'percentual' ? '100' : undefined}
                        value={valorDesconto}
                        onChange={(e) => setValorDesconto(parseFloat(e.target.value) || 0)}
                        className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 focus:border-brand-navy rounded-xl text-slate-900 font-black text-sm focus:outline-none min-h-[44px]"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                        {tipoDesconto === 'percentual' ? '%' : 'R$'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Start Date & Expiration */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 block">
                      Data de Início
                    </label>
                    <input
                      type="date"
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-brand-navy rounded-xl text-slate-900 text-xs font-bold focus:outline-none min-h-[44px]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                        Data de Expiração
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-slate-500 font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hasExpiration}
                          onChange={(e) => setHasExpiration(e.target.checked)}
                          className="rounded border-slate-300 text-brand-navy focus:ring-brand-navy"
                        />
                        <span>Definir validade</span>
                      </label>
                    </div>

                    {hasExpiration ? (
                      <input
                        type="date"
                        value={dataExpiracao}
                        onChange={(e) => setDataExpiracao(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-brand-navy rounded-xl text-slate-900 text-xs font-bold focus:outline-none min-h-[44px]"
                      />
                    ) : (
                      <div className="w-full px-4 py-3 bg-slate-100 rounded-xl text-slate-400 text-xs font-bold border border-slate-200">
                        Sem Expiração (Validade Vitalícia)
                      </div>
                    )}
                  </div>
                </div>

                {/* Usage Limit */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                      Limite Máximo de Usos
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-500 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasUsageLimit}
                        onChange={(e) => setHasUsageLimit(e.target.checked)}
                        className="rounded border-slate-300 text-brand-navy focus:ring-brand-navy"
                      />
                      <span>Limitar utilizações</span>
                    </label>
                  </div>

                  {hasUsageLimit ? (
                    <input
                      type="number"
                      min="1"
                      value={limiteDeUsos}
                      onChange={(e) => setLimiteDeUsos(parseInt(e.target.value) || 1)}
                      placeholder="Ex: 50 utilizações"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-brand-navy rounded-xl text-slate-900 text-xs font-bold focus:outline-none min-h-[44px]"
                    />
                  ) : (
                    <div className="w-full px-4 py-3 bg-slate-100 rounded-xl text-slate-400 text-xs font-bold border border-slate-200">
                      Uso Ilimitado por Alunos
                    </div>
                  )}
                </div>

                {/* Scope Selection */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 block">
                    Escopo de Aplicação do Cupom
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setScopeType('all')}
                      className={`p-3 rounded-2xl border text-left font-bold text-xs transition-all ${
                        scopeType === 'all'
                          ? 'bg-brand-navy/10 border-brand-navy text-brand-navy shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="block font-black text-sm">Toda a Loja</span>
                      <span className="text-[11px] font-medium text-slate-500 block mt-0.5">
                        Vale para todos os produtos e kits
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setScopeType('specific')}
                      className={`p-3 rounded-2xl border text-left font-bold text-xs transition-all ${
                        scopeType === 'specific'
                          ? 'bg-brand-navy/10 border-brand-navy text-brand-navy shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="block font-black text-sm">Itens Específicos</span>
                      <span className="text-[11px] font-medium text-slate-500 block mt-0.5">
                        Selecione produtos/kits da lista
                      </span>
                    </button>
                  </div>

                  {scopeType === 'specific' && (
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4 max-h-48 overflow-y-auto">
                      {products.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block flex items-center gap-1">
                            <Package className="w-3.5 h-3.5" /> Produtos:
                          </span>
                          {products.map((p) => {
                            const checked = selectedProductIds.includes(p.id);
                            return (
                              <label key={p.id} className="flex items-center gap-2.5 text-xs text-slate-700 font-semibold cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedProductIds([...selectedProductIds, p.id]);
                                    } else {
                                      setSelectedProductIds(selectedProductIds.filter(id => id !== p.id));
                                    }
                                  }}
                                  className="rounded border-slate-300 text-brand-navy focus:ring-brand-navy"
                                />
                                <span className="truncate">{p.titulo} — R$ {p.preco.toFixed(2).replace('.', ',')}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {kits.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-slate-200">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block flex items-center gap-1">
                            <Boxes className="w-3.5 h-3.5" /> Kits Promocionais:
                          </span>
                          {kits.map((k) => {
                            const checked = selectedKitIds.includes(k.id);
                            return (
                              <label key={k.id} className="flex items-center gap-2.5 text-xs text-slate-700 font-semibold cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedKitIds([...selectedKitIds, k.id]);
                                    } else {
                                      setSelectedKitIds(selectedKitIds.filter(id => id !== k.id));
                                    }
                                  }}
                                  className="rounded border-slate-300 text-brand-navy focus:ring-brand-navy"
                                />
                                <span className="truncate">{k.titulo} — R$ {k.preco_kit.toFixed(2).replace('.', ',')}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 min-h-[44px]"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl font-extrabold text-xs bg-brand-navy hover:bg-brand-navy-hover text-white shadow-md flex items-center gap-2 disabled:opacity-50 min-h-[44px]"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-brand-teal" />}
                    <span>{saving ? 'Salvando...' : editingCoupon ? 'Salvar Alterações' : 'Criar Cupom'}</span>
                  </button>
                </div>

              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION DIALOG */}
      <AnimatePresence>
        {deleteConfirmationId && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-200 w-full max-w-sm p-6 space-y-4 shadow-2xl text-center"
            >
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Excluir Cupom de Desconto?</h3>
              <p className="text-xs text-slate-500 font-medium">
                Esta ação removerá o código promocional e ele deixará de funcionar na sua loja.
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmationId(null)}
                  className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 min-h-[44px]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirmed}
                  className="w-full py-2.5 rounded-xl font-bold text-xs bg-rose-600 text-white hover:bg-rose-700 shadow-sm min-h-[44px]"
                >
                  Sim, Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
