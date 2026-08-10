'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  FolderCheck, FileText, Link2, Download, Eye, Plus, Search, 
  Trash2, AlertCircle, CheckCircle2, Info, VideoOff, ExternalLink, 
  RefreshCw, Layers, HardDrive, ShieldAlert, Sparkles, Package, Settings 
} from 'lucide-react';
import { 
  getContentByStoreId, 
  getContentDeliveryMetrics, 
  ContentItem, 
  ContentDeliveryMetrics 
} from '@/lib/content-delivery-service';
import { getProductsByStoreId } from '@/lib/store-service';
import { Product } from '@/lib/types';
import CustomSelect from '@/components/ui/CustomSelect';

export default function ContentDeliveryDashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [metrics, setMetrics] = useState<ContentDeliveryMetrics>({
    totalProdutosComConteudo: 0,
    totalConteudos: 0,
    totalArquivos: 0,
    totalLinksExternos: 0,
    totalDownloads: 0,
    totalAcessos: 0
  });

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'com_conteudo' | 'sem_conteudo' | 'ativo' | 'inativo'>('todos');
  const [tipoFilter, setTipoFilter] = useState<'todos' | 'ARQUIVO' | 'LINK_EXTERNO'>('todos');

  const storeId = 'store-demo';

  useEffect(() => {
    loadData();
  }, [storeId]);

  async function loadData() {
    setLoading(true);
    try {
      const [prodsData, contsData, metData] = await Promise.all([
        getProductsByStoreId(storeId),
        getContentByStoreId(storeId),
        getContentDeliveryMetrics(storeId)
      ]);
      setProducts(prodsData);
      setContents(contsData);
      setMetrics(metData);
    } catch (err) {
      console.error('Erro ao carregar módulo Conteúdo & Entregas:', err);
    } finally {
      setLoading(false);
    }
  }

  // Group contents by product ID
  const contentsByProductMap = new Map<string, ContentItem[]>();
  contents.forEach(c => {
    if (c.productId) {
      if (!contentsByProductMap.has(c.productId)) {
        contentsByProductMap.set(c.productId, []);
      }
      contentsByProductMap.get(c.productId)!.push(c);
    }
  });

  // Filter products list
  const filteredProducts = products.filter(prod => {
    const prodContents = contentsByProductMap.get(prod.id) || [];

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchProdName = prod.titulo.toLowerCase().includes(q);
      const matchContentName = prodContents.some(c => c.titulo.toLowerCase().includes(q));
      if (!matchProdName && !matchContentName) return false;
    }

    // Status Filter
    if (statusFilter === 'com_conteudo' && prodContents.length === 0) return false;
    if (statusFilter === 'sem_conteudo' && prodContents.length > 0) return false;
    if (statusFilter === 'ativo' && prod.status !== 'publicado') return false;
    if (statusFilter === 'inativo' && prod.status !== 'rascunho') return false;

    // Type Filter
    if (tipoFilter !== 'todos') {
      const hasType = prodContents.some(c => c.tipo === tipoFilter);
      if (!hasType) return false;
    }

    return true;
  });

  return (
    <div className="space-y-8 font-sans pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-brand-navy/10 text-brand-navy">
              <FolderCheck className="w-5 h-5 text-brand-navy" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Conteúdo & Entregas</h1>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            Gerencie os materiais digitais (PDFs ≤ 15MB) e links de videoaulas entregues automaticamente aos compradores.
          </p>
        </div>
      </div>

      {/* 4 Section 8 Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        {/* Card 1: Produtos com Conteúdo */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Produtos com Conteúdo</span>
            <div className="text-2xl font-black text-slate-900">{metrics.totalProdutosComConteudo}</div>
            <p className="text-[11px] text-slate-500 font-medium">Com entregáveis vinculados</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-brand-navy border border-blue-100 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Conteúdos Total */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Conteúdos</span>
            <div className="text-2xl font-black text-brand-navy">{metrics.totalConteudos}</div>
            <p className="text-[11px] text-slate-500 font-medium">
              {metrics.totalArquivos} arquivos | {metrics.totalLinksExternos} links
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
            <FolderCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Downloads */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Downloads</span>
            <div className="text-2xl font-black text-emerald-700">{metrics.totalDownloads}</div>
            <p className="text-[11px] text-slate-500 font-medium">Baixados por alunos</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
            <Download className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Acessos */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Acessos</span>
            <div className="text-2xl font-black text-purple-700">{metrics.totalAcessos}</div>
            <p className="text-[11px] text-slate-500 font-medium">Downloads + Acessos a Links</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center">
            <Eye className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Regra Visual de Validação */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-medium">
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-brand-teal flex-shrink-0" />
          <span>
            <strong>Fluxo Automático:</strong> Quando o pagamento do pedido é confirmado, o comprador recebe acesso imediato aos materiais cadastrados abaixo.
          </span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          
          {/* Search Input */}
          <div className="relative w-full lg:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome do produto ou conteúdo..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-brand-navy rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all font-medium"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full lg:w-auto overflow-x-auto">
            <button
              onClick={() => setStatusFilter('todos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === 'todos' ? 'bg-white text-brand-navy shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setStatusFilter('com_conteudo')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === 'com_conteudo' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Com conteúdo
            </button>
            <button
              onClick={() => setStatusFilter('sem_conteudo')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === 'sem_conteudo' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sem conteúdo
            </button>
          </div>

          {/* Type Filter Dropdown */}
          <div className="w-full lg:w-48">
            <CustomSelect
              options={[
                { value: 'todos', label: 'Tipo: Todos' },
                { value: 'ARQUIVO', label: 'Arquivo (PDF / ZIP)' },
                { value: 'LINK_EXTERNO', label: 'Link Externo (Vídeo)' }
              ]}
              value={tipoFilter}
              onChange={(val) => setTipoFilter(val as any)}
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Lista de Produtos com Conteúdo */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 font-medium">
          Carregando catálogo de entregáveis...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 sm:p-16 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 bg-blue-50 text-brand-navy rounded-2xl flex items-center justify-center mx-auto border border-blue-100">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-slate-900">Nenhum produto encontrado</h3>
          <p className="text-xs text-slate-600 font-medium max-w-md mx-auto">
            Nenhum produto corresponde aos critérios de busca ou filtros selecionados.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-6">Produto</th>
                  <th className="py-4 px-6 text-center">Conteúdos</th>
                  <th className="py-4 px-6">Tipo Principal</th>
                  <th className="py-4 px-6">Regra de Acesso</th>
                  <th className="py-4 px-6">Última Atualização</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredProducts.map(prod => {
                  const prodContents = contentsByProductMap.get(prod.id) || [];
                  const hasFiles = prodContents.some(c => c.tipo === 'ARQUIVO');
                  const hasLinks = prodContents.some(c => c.tipo === 'LINK_EXTERNO');

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Product Name & Cover */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={prod.capa_url || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=300&auto=format&fit=crop&q=80'}
                            alt={prod.titulo}
                            className="w-10 h-12 object-cover rounded-xl border border-slate-200 shadow-2xs flex-shrink-0"
                          />
                          <span className="font-bold text-slate-900 text-sm">{prod.titulo}</span>
                        </div>
                      </td>

                      {/* Content Count */}
                      <td className="py-4 px-6 text-center font-bold text-slate-900">
                        {prodContents.length === 0 ? (
                          <span className="text-slate-400 font-normal">0 itens</span>
                        ) : (
                          <span className="text-brand-navy font-bold">{prodContents.length} {prodContents.length === 1 ? 'item' : 'itens'}</span>
                        )}
                      </td>

                      {/* Main Type */}
                      <td className="py-4 px-6">
                        {prodContents.length === 0 ? (
                          <span className="text-slate-400 font-mono">Sem conteúdo</span>
                        ) : hasFiles && hasLinks ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Arquivo + Link
                          </span>
                        ) : hasFiles ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Arquivo (PDF/ZIP)
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            Link Externo (Vídeo)
                          </span>
                        )}
                      </td>

                      {/* Access Rule */}
                      <td className="py-4 px-6 text-slate-600">
                        Após confirmação do pagamento
                      </td>

                      {/* Updated Date */}
                      <td className="py-4 px-6 text-slate-500">
                        {new Date(prod.updated_at || prod.created_at).toLocaleDateString('pt-BR')}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 text-center">
                        {prod.status === 'publicado' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Publicado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Rascunho
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <Link
                          href={`/dashboard/conteudo/${prod.id}`}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-navy hover:bg-brand-navy/90 text-white shadow-2xs inline-flex items-center gap-1.5 transition-all"
                        >
                          <Settings className="w-3.5 h-3.5 text-brand-teal" />
                          <span>Gerenciar Conteúdo</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
