'use client';

import CouponDialogs from './CouponDialogs';

import {
createCoupon,
deleteCoupon,
getCouponsByStoreId,
toggleCouponStatus,
updateCoupon
} from '@/lib/coupon-service';
import { getKitsByStoreId } from '@/lib/kit-service';
import { getProductsByStoreId,getStoreByCreatorId } from '@/lib/store-service';
import { Coupon,CouponDiscountType,CouponStatus,Kit,Product } from '@/lib/types';
import {
AlertCircle,
CheckCircle2,
Clock,
Edit,
Filter,
Loader2,
Plus,Search,
Ticket,
Trash2,
XCircle
} from 'lucide-react';
import { useEffect,useState } from 'react';

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
              Crie cupons de desconto promocionais para atrair novos clientes para a sua loja.
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

      <CouponDialogs {...{ isModalOpen, editingCoupon, setIsModalOpen, formError, handleSaveCoupon, codigo, setCodigo, generateRandomCode, tipoDesconto, setTipoDesconto, valorDesconto, setValorDesconto, dataInicio, setDataInicio, hasExpiration, setHasExpiration, dataExpiracao, setDataExpiracao, hasUsageLimit, setHasUsageLimit, limiteDeUsos, setLimiteDeUsos, scopeType, setScopeType, products, selectedProductIds, setSelectedProductIds, kits, selectedKitIds, setSelectedKitIds, saving, deleteConfirmationId, setDeleteConfirmationId, handleDeleteConfirmed }} />

    </div>
  );
}
