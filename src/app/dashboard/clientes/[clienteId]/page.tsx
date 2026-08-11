'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Users, Mail, Phone, Calendar, ShieldCheck, 
  ShoppingBag, DollarSign, TrendingUp, Clock, FileText, 
  CheckCircle2, AlertCircle, ExternalLink, Download, Lock, Package, Layers 
} from 'lucide-react';
import { getCustomerById, Customer } from '@/lib/customer-service';
import { getCurrentCreatorStore } from '@/lib/store-service';

interface CustomerDetailPageProps {
  params: Promise<{ clienteId: string }>;
}

export default function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [storeId, setStoreId] = useState('');
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState<'visao_geral' | 'compras' | 'produtos' | 'pagamentos' | 'acessos'>('visao_geral');

  useEffect(() => {
    async function initStore() {
      const store = await getCurrentCreatorStore();
      if (store?.id) setStoreId(store.id);
    }
    initStore();
  }, []);

  useEffect(() => {
    if (!storeId || !resolvedParams.clienteId) return;
    async function loadCustomer() {
      setLoading(true);
      try {
        const cust = await getCustomerById(storeId, resolvedParams.clienteId);
        setCustomer(cust);
      } catch (err) {
        console.error('Erro ao buscar dados do cliente:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCustomer();
  }, [storeId, resolvedParams.clienteId]);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 font-medium my-8">
        Carregando detalhes do cliente...
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="space-y-6 font-sans">
        <Link
          href="/dashboard/clientes"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-brand-navy transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Clientes</span>
        </Link>

        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Cliente não encontrado</h2>
          <p className="text-xs text-slate-600 font-medium">
            O cliente solicitado não foi localizado na base de dados da sua loja.
          </p>
        </div>
      </div>
    );
  }

  const ticketMedio = customer.totalCompras > 0 ? customer.valorTotalGasto / customer.totalCompras : 0;

  return (
    <div className="space-y-8 font-sans pb-12">
      
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/clientes"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-brand-navy transition-colors bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4 text-brand-navy" />
          <span>Voltar para Clientes</span>
        </Link>
      </div>

      {/* Main Profile Card Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-brand-navy text-white font-black text-2xl flex items-center justify-center shadow-md shadow-brand-navy/20 flex-shrink-0">
              {customer.nome.charAt(0).toUpperCase()}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">{customer.nome}</h1>
                {customer.status === 'ativo' ? (
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Cliente Ativo
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400" /> Inativo
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1.5 font-mono text-slate-700">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> {customer.email}
                </span>
                {customer.telefone && (
                  <span className="flex items-center gap-1.5 font-mono text-slate-700">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {customer.telefone}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Cadastrado em {new Date(customer.dataCadastro).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-slate-100">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total de Compras</span>
            <div className="text-xl font-black text-slate-900">{customer.totalCompras} pedidos</div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Valor Total Gasto</span>
            <div className="text-xl font-black text-emerald-700 font-mono">
              R$ {customer.valorTotalGasto.toFixed(2).replace('.', ',')}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Ticket Médio</span>
            <div className="text-xl font-black text-indigo-700 font-mono">
              R$ {ticketMedio.toFixed(2).replace('.', ',')}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Última Compra</span>
            <div className="text-sm font-extrabold text-slate-800 pt-1">
              {customer.ultimaCompra ? new Date(customer.ultimaCompra).toLocaleDateString('pt-BR') : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-2 shadow-xs flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('visao_geral')}
          className={`flex-1 min-w-[120px] py-3 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'visao_geral'
              ? 'bg-brand-navy text-white shadow-md shadow-brand-navy/20'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Visão Geral</span>
        </button>

        <button
          onClick={() => setActiveTab('compras')}
          className={`flex-1 min-w-[120px] py-3 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'compras'
              ? 'bg-brand-navy text-white shadow-md shadow-brand-navy/20'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Compras ({customer.pedidos.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('produtos')}
          className={`flex-1 min-w-[120px] py-3 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'produtos'
              ? 'bg-brand-navy text-white shadow-md shadow-brand-navy/20'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Produtos ({customer.produtos.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pagamentos')}
          className={`flex-1 min-w-[120px] py-3 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'pagamentos'
              ? 'bg-brand-navy text-white shadow-md shadow-brand-navy/20'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Pagamentos ({customer.pagamentos.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('acessos')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'acessos'
              ? 'bg-brand-navy text-white shadow-md shadow-brand-navy/20'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>Downloads & Acessos</span>
        </button>
      </div>

      {/* Tab 1: Visão Geral */}
      {activeTab === 'visao_geral' && (
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Column: Key Customer Attributes */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-teal" /> Dados do Cadastro
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Nome Completo:</span>
                  <strong className="text-slate-900 font-bold text-sm block">{customer.nome}</strong>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">E-mail:</span>
                  <span className="text-slate-700 font-mono font-medium block">{customer.email}</span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Telefone / WhatsApp:</span>
                  <span className="text-slate-700 font-mono font-medium block">{customer.telefone || '—'}</span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Data de Cadastro:</span>
                  <span className="text-slate-700 font-medium block">{new Date(customer.dataCadastro).toLocaleString('pt-BR')}</span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Status da Conta:</span>
                  <span className="text-emerald-700 font-bold block">{customer.status === 'ativo' ? 'Ativo com Compras Aprovadas' : 'Sem Compras Ativas'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Chronological Activity Timeline */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-navy" /> Linha do Tempo de Atividades
              </h3>

              {customer.linhaDoTempo.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 font-medium">
                  Nenhuma atividade registrada para este cliente.
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {customer.linhaDoTempo.map(event => (
                    <div key={event.id} className="relative flex items-start gap-3 text-xs">
                      {/* Timeline Dot */}
                      <span className={`absolute -left-6 top-1 w-3 h-3 rounded-full border-2 border-white ${
                        event.badgeColor === 'emerald' ? 'bg-emerald-500 shadow-2xs' :
                        event.badgeColor === 'blue' ? 'bg-brand-navy shadow-2xs' :
                        event.badgeColor === 'amber' ? 'bg-amber-500 shadow-2xs' : 'bg-slate-400'
                      }`} />

                      <div className="flex-1 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1">
                        <p className="font-bold text-slate-900">{event.descricao}</p>
                        <span className="text-[10px] text-slate-400 font-medium block">
                          {new Date(event.data).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Compras */}
      {activeTab === 'compras' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">Histórico de Pedidos Realizados</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-6">Pedido</th>
                  <th className="py-4 px-6">Data</th>
                  <th className="py-4 px-6">Produtos</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {customer.pedidos.map(p => (
                  <tr 
                    key={p.id} 
                    onClick={() => router.push('/dashboard/pedidos')}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-4 px-6 font-mono font-bold text-brand-navy">{p.codigoPedido}</td>
                    <td className="py-4 px-6 text-slate-500">{new Date(p.data).toLocaleString('pt-BR')}</td>
                    <td className="py-4 px-6 font-bold text-slate-900">{p.produtosTitulos.join(', ')}</td>
                    <td className="py-4 px-6 text-center">
                      {p.status === 'pago' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Aprovado
                        </span>
                      ) : p.status === 'estornado' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Reembolsado
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          Pendente
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right font-mono font-bold text-emerald-700">
                      R$ {p.valorTotal.toFixed(2).replace('.', ',')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Produtos */}
      {activeTab === 'produtos' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">Produtos Adquiridos pelo Cliente</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-6">Produto</th>
                  <th className="py-4 px-6 text-center">Quantidade</th>
                  <th className="py-4 px-6">Data da Compra</th>
                  <th className="py-4 px-6">Pedido</th>
                  <th className="py-4 px-6 text-right">Preço</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {customer.produtos.map(prod => (
                  <tr 
                    key={prod.id} 
                    onClick={() => router.push('/dashboard/produtos')}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-brand-navy flex items-center justify-center font-bold text-xs">
                          {prod.tipo.toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-900">{prod.titulo}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center font-bold">{prod.quantidade}</td>
                    <td className="py-4 px-6 text-slate-500">{new Date(prod.dataCompra).toLocaleDateString('pt-BR')}</td>
                    <td className="py-4 px-6 font-mono text-slate-600">#{prod.pedidoId.slice(-6).toUpperCase()}</td>
                    <td className="py-4 px-6 text-right font-mono font-bold text-emerald-700">
                      R$ {prod.preco.toFixed(2).replace('.', ',')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Pagamentos */}
      {activeTab === 'pagamentos' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">Extrato Financeiro de Pagamentos</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-6">Pedido</th>
                  <th className="py-4 px-6">Data</th>
                  <th className="py-4 px-6">Método</th>
                  <th className="py-4 px-6 text-right">Valor</th>
                  <th className="py-4 px-6 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {customer.pagamentos.map(pay => (
                  <tr key={pay.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-brand-navy">#{pay.pedidoId.slice(-6).toUpperCase()}</td>
                    <td className="py-4 px-6 text-slate-500">{new Date(pay.data).toLocaleString('pt-BR')}</td>
                    <td className="py-4 px-6 font-semibold text-slate-800">{pay.metodo}</td>
                    <td className="py-4 px-6 text-right font-mono font-bold text-emerald-700">
                      R$ {pay.valor.toFixed(2).replace('.', ',')}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {pay.status === 'pago' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Confirmado
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          Pendente
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Downloads e Acessos */}
      {activeTab === 'acessos' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          {customer.acessos.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 bg-blue-50 text-brand-navy rounded-2xl flex items-center justify-center mx-auto border border-blue-100">
                <Download className="w-8 h-8 text-brand-teal" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-xl font-black text-slate-900">Histórico de Downloads & Acessos</h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Nenhum histórico de downloads ou acessos disponível para este cliente.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto text-left">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Produto</th>
                    <th className="py-3 px-4">Conteúdo</th>
                    <th className="py-3 px-4 text-center">Tipo de Acesso</th>
                    <th className="py-3 px-4">Data / Hora</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {customer.acessos.map(acc => (
                    <tr key={acc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {customer.produtos.length > 0 ? customer.produtos[0].titulo : 'Material Digital'}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{acc.recurso}</td>
                      <td className="py-3.5 px-4 text-center">
                        {acc.tipo === 'Download' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1">
                            <Download className="w-3 h-3 text-blue-600" /> Download
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200 inline-flex items-center gap-1">
                            <ExternalLink className="w-3 h-3 text-purple-600" /> Acesso externo
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{new Date(acc.data).toLocaleString('pt-BR')}</td>
                      <td className="py-3.5 px-4 text-center">
                        {acc.tipo === 'Download' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Download Concluído
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            Link Externo Aberto
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
