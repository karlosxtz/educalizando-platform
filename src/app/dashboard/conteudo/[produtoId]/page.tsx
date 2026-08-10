'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, FolderCheck, Plus, FileText, Link2, Download, ExternalLink, 
  Trash2, AlertCircle, CheckCircle2, Info, VideoOff, ArrowUp, ArrowDown, 
  Eye, Edit3, Lock, ShieldAlert, Sparkles, Clock, Check, Power 
} from 'lucide-react';
import { 
  getContentByProductId, 
  createContentItem, 
  updateContentItem, 
  deleteContentItem, 
  reorderContents,
  ContentItem, 
  ContentType 
} from '@/lib/content-delivery-service';
import { getProductById } from '@/lib/store-service';
import { Product } from '@/lib/types';
import FileUpload from '@/components/dashboard/FileUpload';
import CustomSelect from '@/components/ui/CustomSelect';

interface ProductContentPageProps {
  params: Promise<{ produtoId: string }>;
}

export default function ProductContentManagementPage({ params }: ProductContentPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [contents, setContents] = useState<ContentItem[]>([]);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<ContentItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [formTipo, setFormTipo] = useState<ContentType>('ARQUIVO');
  const [formTitulo, setFormTitulo] = useState('');
  const [formDescricao, setFormDescricao] = useState('');
  const [formUrl, setFormUrl] = useState<string | null>(null);
  const [formDownloadLimit, setFormDownloadLimit] = useState<string>('unlimited');
  const [formValidityDays, setFormValidityDays] = useState<string>('unlimited');
  const [formError, setFormError] = useState<string | null>(null);

  const storeId = 'store-demo';

  useEffect(() => {
    loadData();
  }, [storeId, resolvedParams.produtoId]);

  async function loadData() {
    setLoading(true);
    try {
      const prod = await getProductById(resolvedParams.produtoId);
      setProduct(prod);

      const items = await getContentByProductId(storeId, resolvedParams.produtoId);
      setContents(items);
    } catch (err) {
      console.error('Erro ao carregar conteúdos do produto:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenAddModal = () => {
    setEditingContent(null);
    setFormTipo('ARQUIVO');
    setFormTitulo('');
    setFormDescricao('');
    setFormUrl(null);
    setFormDownloadLimit('unlimited');
    setFormValidityDays('unlimited');
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (item: ContentItem) => {
    setEditingContent(item);
    setFormTipo(item.tipo);
    setFormTitulo(item.titulo);
    setFormDescricao(item.descricao || '');
    setFormUrl(item.url);
    setFormDownloadLimit(item.downloadLimit ? String(item.downloadLimit) : 'unlimited');
    setFormValidityDays(item.validityDays ? String(item.validityDays) : 'unlimited');
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmitContent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formTitulo.trim()) {
      setFormError('Por favor, informe o título do conteúdo.');
      return;
    }

    if (!formUrl || !formUrl.trim()) {
      setFormError(formTipo === 'ARQUIVO' ? 'Por favor, realize o upload do arquivo.' : 'Por favor, informe o link externo.');
      return;
    }

    const downloadLimit = formDownloadLimit === 'unlimited' ? null : Number(formDownloadLimit);
    const validityDays = formValidityDays === 'unlimited' ? null : Number(formValidityDays);

    setSubmitting(true);
    try {
      if (editingContent) {
        await updateContentItem(storeId, editingContent.id, {
          titulo: formTitulo.trim(),
          descricao: formDescricao.trim() || undefined,
          tipo: formTipo,
          url: formUrl.trim(),
          downloadLimit,
          validityDays
        });
      } else {
        await createContentItem(storeId, {
          productId: resolvedParams.produtoId,
          productTitle: product?.titulo || 'Produto Digital',
          titulo: formTitulo.trim(),
          descricao: formDescricao.trim() || undefined,
          tipo: formTipo,
          url: formUrl.trim(),
          fileName: formTipo === 'ARQUIVO' ? 'Material_Didatico_Educalizando.pdf' : undefined,
          fileSizeBytes: formTipo === 'ARQUIVO' ? 2500000 : undefined,
          fileSizeFormatted: formTipo === 'ARQUIVO' ? '2.5 MB' : undefined,
          mimeType: formTipo === 'ARQUIVO' ? 'application/pdf' : undefined,
          downloadLimit,
          validityDays
        });
      }

      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar conteúdo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este conteúdo?')) {
      await deleteContentItem(storeId, id);
      await loadData();
    }
  };

  const handleToggleActive = async (item: ContentItem) => {
    await updateContentItem(storeId, item.id, { active: !item.active });
    await loadData();
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === contents.length - 1)) {
      return;
    }
    const newContents = [...contents];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newContents[index];
    newContents[index] = newContents[targetIndex];
    newContents[targetIndex] = temp;

    setContents(newContents);
    await reorderContents(storeId, newContents.map(c => c.id));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 font-medium my-8">
        Carregando gerenciador de conteúdos...
      </div>
    );
  }

  const productTitle = product?.titulo || 'Produto Digital';
  const productCover = product?.capa_url || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80';

  return (
    <div className="space-y-8 font-sans pb-12">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/conteudo"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-brand-navy transition-colors bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4 text-brand-navy" />
          <span>Voltar para Conteúdo & Entregas</span>
        </Link>
      </div>

      {/* Main Product Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <img
            src={productCover}
            alt={productTitle}
            className="w-20 h-24 object-cover rounded-2xl border border-slate-200 shadow-xs flex-shrink-0"
          />
          <div className="space-y-1.5">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{productTitle}</h1>
              <span className="px-3 py-0.5 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Produto Ativo
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Gerencie a lista de materiais digitais e videoaulas entregues automaticamente aos compradores deste produto.
            </p>
            <div className="flex items-center gap-4 text-xs font-bold text-slate-600 pt-1">
              <span>{contents.length} {contents.length === 1 ? 'conteúdo cadastrado' : 'conteúdos cadastrados'}</span>
              <span className="text-slate-300">•</span>
              <span className="text-brand-navy">
                {contents.filter(c => c.tipo === 'ARQUIVO').length} Arquivos (≤15MB) | {contents.filter(c => c.tipo === 'LINK_EXTERNO').length} Links
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-brand-navy hover:bg-brand-navy/90 text-white font-bold text-xs shadow-md shadow-brand-navy/20 flex items-center justify-center gap-2 transition-all flex-shrink-0"
        >
          <Plus className="w-4 h-4 text-brand-teal" />
          <span>+ Adicionar Conteúdo</span>
        </button>
      </div>

      {/* Requirement 33: Empty State if no content attached to product */}
      {contents.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 sm:p-16 text-center space-y-5 shadow-xs">
          <div className="w-16 h-16 bg-blue-50 text-brand-navy rounded-2xl flex items-center justify-center mx-auto border border-blue-100">
            <FolderCheck className="w-8 h-8 text-brand-teal" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-xl font-black text-slate-900">Este produto ainda não possui conteúdo</h3>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Adicione arquivos, vídeos, links ou outros materiais para disponibilizar este produto aos seus compradores.
            </p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="px-6 py-3 rounded-2xl bg-brand-navy text-white font-bold text-xs shadow-md shadow-brand-navy/20 inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-brand-teal" />
            <span>Adicionar conteúdo agora</span>
          </button>
        </div>
      ) : (
        /* Contents List for this product */
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
              Conteúdos Entregáveis ({contents.length})
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              Utilize as setas para alterar a ordem de exibição aos alunos
            </span>
          </div>

          <div className="space-y-3">
            {contents.map((item, idx) => (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border p-5 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  !item.active ? 'opacity-60 bg-slate-50 border-slate-200' : 'border-slate-200 hover:border-brand-navy/30'
                }`}
              >
                {/* Left Info */}
                <div className="flex items-start gap-4">
                  {/* Reorder Buttons */}
                  <div className="flex flex-col gap-1 text-slate-400 pt-0.5">
                    <button
                      onClick={() => handleMove(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 rounded-md hover:bg-slate-100 disabled:opacity-30 transition-colors"
                      title="Mover para cima"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMove(idx, 'down')}
                      disabled={idx === contents.length - 1}
                      className="p-1 rounded-md hover:bg-slate-100 disabled:opacity-30 transition-colors"
                      title="Mover para baixo"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="w-8 h-8 rounded-xl bg-slate-100 font-black text-slate-700 text-xs flex items-center justify-center flex-shrink-0">
                    #{idx + 1}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-slate-900 text-sm">{item.titulo}</h4>
                      {item.tipo === 'ARQUIVO' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                          <FileText className="w-3 h-3 text-blue-600" /> Arquivo (≤15MB)
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                          <Link2 className="w-3 h-3 text-purple-600" /> Link Externo
                        </span>
                      )}
                      {!item.active && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600">
                          Inativo
                        </span>
                      )}
                    </div>

                    {item.descricao && (
                      <p className="text-xs text-slate-500 font-medium">{item.descricao}</p>
                    )}

                    {/* Access Rules Badges */}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1 font-mono">
                      <span>{item.tipo === 'ARQUIVO' ? (item.fileSizeFormatted || '≤ 15 MB') : item.url}</span>
                      <span>•</span>
                      <span className="text-slate-700 font-bold">
                        {item.downloadLimit ? `Máx. ${item.downloadLimit} downloads` : 'Downloads ilimitados'}
                      </span>
                      <span>•</span>
                      <span className="text-slate-700 font-bold">
                        {item.validityDays ? `Validade: ${item.validityDays} dias` : 'Acesso vitalício'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center justify-between md:justify-end gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                  <div className="text-left md:text-right text-xs">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      {item.tipo === 'ARQUIVO' ? 'Downloads' : 'Acessos'}
                    </span>
                    <strong className="text-slate-900 text-sm">
                      {item.tipo === 'ARQUIVO' ? item.downloadsCount : item.externalAccessCount}
                    </strong>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(item)}
                      className={`p-2 rounded-xl border text-xs font-bold transition-colors ${
                        item.active ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-100 border-slate-200 text-slate-500'
                      }`}
                      title={item.active ? 'Desativar Conteúdo' : 'Ativar Conteúdo'}
                    >
                      <Power className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleOpenEditModal(item)}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors"
                      title="Editar Conteúdo"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 transition-colors"
                      title="Excluir Conteúdo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Adicionar / Editar Conteúdo do Produto */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <FolderCheck className="w-5 h-5 text-brand-navy" />
                  {editingContent ? 'Editar Conteúdo' : 'Adicionar Conteúdo ao Produto'}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {productTitle}
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Type Selector */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => { setFormTipo('ARQUIVO'); setFormUrl(null); }}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  formTipo === 'ARQUIVO' ? 'bg-white text-brand-navy shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Arquivo (≤ 15 MB)</span>
              </button>
              <button
                type="button"
                onClick={() => { setFormTipo('LINK_EXTERNO'); setFormUrl(null); }}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  formTipo === 'LINK_EXTERNO' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Link2 className="w-4 h-4" />
                <span>Link Externo (Vídeos)</span>
              </button>
            </div>

            {/* UX Guidance Banner (Requirement 16) */}
            {formTipo === 'ARQUIVO' ? (
              <div className="bg-blue-50 border border-blue-200 text-blue-900 p-3 rounded-xl text-xs font-medium space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-blue-900">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span>Máximo de 15 MB por arquivo.</span>
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Vídeos não podem ser enviados para a plataforma. (Utilize links externos para disponibilizar vídeos).
                </p>
              </div>
            ) : (
              <div className="bg-purple-50 border border-purple-200 text-purple-900 p-3 rounded-xl text-xs font-medium space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-purple-900">
                  <VideoOff className="w-4 h-4 text-purple-600" />
                  <span>Vídeos devem ser disponibilizados através de links externos.</span>
                </div>
                <p className="text-[11px] text-purple-800 leading-relaxed">
                  A Educalizando não hospeda arquivos de vídeo. Insira o link oficial do YouTube, Vimeo ou Drive.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmitContent} className="space-y-4 font-sans">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Título do Conteúdo *
                </label>
                <input
                  type="text"
                  value={formTitulo}
                  onChange={(e) => setFormTitulo(e.target.value)}
                  placeholder="Ex: Apostila em PDF ou Videoaula 01 — Didática"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-brand-navy rounded-xl text-xs text-slate-900 focus:outline-none font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Descrição (Opcional)
                </label>
                <input
                  type="text"
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  placeholder="Resumo do conteúdo..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-brand-navy rounded-xl text-xs text-slate-900 focus:outline-none font-medium"
                />
              </div>

              {/* Requirements 18 & 19: Download Limits and Validity Controls */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Limite de Downloads
                  </label>
                  <CustomSelect
                    options={[
                      { value: 'unlimited', label: 'Ilimitado' },
                      { value: '1', label: '1 download' },
                      { value: '3', label: '3 downloads' },
                      { value: '5', label: '5 downloads' },
                      { value: '10', label: '10 downloads' }
                    ]}
                    value={formDownloadLimit}
                    onChange={(val) => setFormDownloadLimit(val)}
                    size="sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Validade do Acesso
                  </label>
                  <CustomSelect
                    options={[
                      { value: 'unlimited', label: 'Ilimitado / Vitalício' },
                      { value: '7', label: '7 dias' },
                      { value: '15', label: '15 dias' },
                      { value: '30', label: '30 dias' },
                      { value: '90', label: '90 dias' },
                      { value: '365', label: '365 dias' }
                    ]}
                    value={formValidityDays}
                    onChange={(val) => setFormValidityDays(val)}
                    size="sm"
                  />
                </div>
              </div>

              {/* File Upload vs Link Input */}
              {formTipo === 'ARQUIVO' ? (
                <FileUpload
                  label="Upload do Arquivo Didático (PDF / DOCX / ZIP)"
                  helperText="O arquivo será liberado na Área do Aluno após o pagamento."
                  bucket="product-files"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.zip,.rar"
                  maxSizeMB={15}
                  value={formUrl}
                  onChange={(url) => setFormUrl(url)}
                />
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    URL do Link Externo / Videoaula *
                  </label>
                  <input
                    type="url"
                    value={formUrl || ''}
                    onChange={(e) => setFormUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... ou Vimeo / Drive"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-brand-navy rounded-xl text-xs text-slate-900 focus:outline-none font-medium font-mono"
                  />
                </div>
              )}

              {formError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-brand-navy hover:bg-brand-navy/90 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-brand-navy/20"
                >
                  {submitting ? 'Salvando...' : 'Salvar Conteúdo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
