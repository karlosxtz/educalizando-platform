'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FolderCheck, FileText, Link2, Download, Eye, Plus, Search, 
  Trash2, AlertCircle, CheckCircle2, Info, VideoOff, ExternalLink, 
  RefreshCw, Layers, HardDrive, ShieldAlert, Sparkles 
} from 'lucide-react';
import { 
  getContentByStoreId, 
  getContentDeliveryMetrics, 
  createContentItem, 
  deleteContentItem,
  validateContentFileUpload,
  ContentItem, 
  ContentDeliveryMetrics, 
  ContentType,
  recordAccessEvent
} from '@/lib/content-delivery-service';
import FileUpload from '@/components/dashboard/FileUpload';
import CustomSelect from '@/components/ui/CustomSelect';

export default function ContentDeliveryPage() {
  const [loading, setLoading] = useState(true);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [metrics, setMetrics] = useState<ContentDeliveryMetrics>({
    totalConteudos: 0,
    totalArquivos: 0,
    totalLinksExternos: 0,
    totalDownloads: 0,
    totalAcessos: 0
  });

  // Modal / Form state
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formTipo, setFormTipo] = useState<ContentType>('ARQUIVO');
  const [formTitulo, setFormTitulo] = useState('');
  const [formDescricao, setFormDescricao] = useState('');
  const [formUrl, setFormUrl] = useState<string | null>(null);
  const [formProductTitle, setFormProductTitle] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [tipoFilter, setTipoFilter] = useState<'todos' | 'ARQUIVO' | 'LINK_EXTERNO'>('todos');

  // Hardcoded store ID matching creator store context
  const storeId = 'store-demo';

  useEffect(() => {
    loadData();
  }, [storeId]);

  async function loadData() {
    setLoading(true);
    try {
      const [contData, metData] = await Promise.all([
        getContentByStoreId(storeId),
        getContentDeliveryMetrics(storeId)
      ]);
      setContents(contData);
      setMetrics(metData);
    } catch (err) {
      console.error('Erro ao carregar módulo Conteúdo & Entregas:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateContent = async (e: React.FormEvent) => {
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

    setSubmitting(true);
    try {
      await createContentItem(storeId, {
        titulo: formTitulo.trim(),
        descricao: formDescricao.trim() || undefined,
        tipo: formTipo,
        url: formUrl.trim(),
        productTitle: formProductTitle.trim() || 'Material Geral da Loja',
        fileName: formTipo === 'ARQUIVO' ? 'Arquivo_Digital_Educalizando.pdf' : undefined,
        fileSizeBytes: formTipo === 'ARQUIVO' ? 2500000 : undefined,
        fileSizeFormatted: formTipo === 'ARQUIVO' ? '2.5 MB' : undefined,
        mimeType: formTipo === 'ARQUIVO' ? 'application/pdf' : undefined
      });

      // Reset Form & Reload
      setModalOpen(false);
      setFormTitulo('');
      setFormDescricao('');
      setFormUrl(null);
      setFormProductTitle('');
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Erro ao cadastrar conteúdo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este conteúdo entregável?')) {
      await deleteContentItem(storeId, id);
      await loadData();
    }
  };

  const handleTestAccess = async (item: ContentItem) => {
    if (item.tipo === 'ARQUIVO') {
      await recordAccessEvent({
        storeId,
        contentId: item.id,
        contentTitle: item.titulo,
        productTitle: item.productTitle || undefined,
        tipoEvento: 'FILE_DOWNLOAD',
        customerName: 'Aluno Teste',
        customerEmail: 'aluno@exemplo.com'
      });
      window.open(item.url, '_blank');
    } else {
      await recordAccessEvent({
        storeId,
        contentId: item.id,
        contentTitle: item.titulo,
        productTitle: item.productTitle || undefined,
        tipoEvento: 'EXTERNAL_LINK_ACCESS',
        customerName: 'Aluno Teste',
        customerEmail: 'aluno@exemplo.com'
      });
      window.open(item.url, '_blank');
    }
    await loadData();
  };

  const filteredContents = contents.filter(c => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = c.titulo.toLowerCase().includes(q);
      const matchProd = c.productTitle ? c.productTitle.toLowerCase().includes(q) : false;
      if (!matchTitle && !matchProd) return false;
    }
    if (tipoFilter !== 'todos' && c.tipo !== tipoFilter) return false;
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
            Gerencie os arquivos digitais de até 15 MB e links externos disponibilizados aos seus alunos.
          </p>
        </div>

        <button
          onClick={() => { setFormError(null); setModalOpen(true); }}
          className="px-5 py-3 rounded-2xl bg-brand-navy hover:bg-brand-navy/90 text-white font-bold text-xs shadow-md shadow-brand-navy/20 flex items-center justify-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4 text-brand-teal" />
          <span>+ Adicionar Conteúdo</span>
        </button>
      </div>

      {/* 5 Section 13 Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Conteúdos */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Conteúdos</span>
          <div className="text-2xl font-black text-slate-900">{metrics.totalConteudos}</div>
          <p className="text-[10px] text-slate-500 font-medium">Itens cadastrados</p>
        </div>

        {/* Card 2: Arquivos Armazenados */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Arquivos</span>
          <div className="text-2xl font-black text-brand-navy">{metrics.totalArquivos}</div>
          <p className="text-[10px] text-slate-500 font-medium">Arquivos ≤ 15 MB</p>
        </div>

        {/* Card 3: Links Externos */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Links Externos</span>
          <div className="text-2xl font-black text-indigo-700">{metrics.totalLinksExternos}</div>
          <p className="text-[10px] text-slate-500 font-medium">Vídeos/Drive/Vimeo</p>
        </div>

        {/* Card 4: Downloads Realizados */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Downloads</span>
          <div className="text-2xl font-black text-emerald-700">{metrics.totalDownloads}</div>
          <p className="text-[10px] text-slate-500 font-medium">Baixados de arquivos</p>
        </div>

        {/* Card 5: Total de Acessos */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Acessos</span>
          <div className="text-2xl font-black text-blue-700">{metrics.totalAcessos}</div>
          <p className="text-[10px] text-slate-500 font-medium">Downloads + Acessos</p>
        </div>
      </div>

      {/* Regra Visual de Validação */}
      <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-medium">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <span>
            <strong>Diretrizes de Armazenamento:</strong> Cada arquivo pode ter no máximo <strong>15 MB</strong>. Vídeos não são hospedados no storage e devem ser cadastrados via <strong>Link Externo</strong>.
          </span>
        </div>
      </div>

      {/* Busca e Filtros */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por título ou produto..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-brand-navy rounded-xl text-xs text-slate-900 focus:outline-none transition-all font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setTipoFilter('todos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              tipoFilter === 'todos' ? 'bg-brand-navy text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({contents.length})
          </button>
          <button
            onClick={() => setTipoFilter('ARQUIVO')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              tipoFilter === 'ARQUIVO' ? 'bg-brand-navy text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            Arquivos ({contents.filter(c => c.tipo === 'ARQUIVO').length})
          </button>
          <button
            onClick={() => setTipoFilter('LINK_EXTERNO')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              tipoFilter === 'LINK_EXTERNO' ? 'bg-brand-navy text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            Links Externos ({contents.filter(c => c.tipo === 'LINK_EXTERNO').length})
          </button>
        </div>
      </div>

      {/* Lista / Tabela de Conteúdos */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 font-medium">
          Carregando materiais digitais...
        </div>
      ) : filteredContents.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 bg-blue-50 text-brand-navy rounded-2xl flex items-center justify-center mx-auto border border-blue-100">
            <FolderCheck className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-black text-slate-900">Nenhum conteúdo cadastrado</h3>
          <p className="text-xs text-slate-600 max-w-sm mx-auto font-medium">
            Clique em "+ Adicionar Conteúdo" para cadastrar arquivos em PDF (máx 15MB) ou links externos de videoaulas.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-6">Conteúdo / Título</th>
                  <th className="py-4 px-6">Tipo</th>
                  <th className="py-4 px-6">Produto Associado</th>
                  <th className="py-4 px-6 text-center">Downloads</th>
                  <th className="py-4 px-6 text-center">Acessos</th>
                  <th className="py-4 px-6">Data</th>
                  <th className="py-4 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredContents.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-900 text-sm block">{c.titulo}</span>
                        {c.descricao && <span className="text-[11px] text-slate-500 block">{c.descricao}</span>}
                        <span className="text-[10px] text-slate-400 font-mono block">
                          {c.tipo === 'ARQUIVO' ? (c.fileSizeFormatted || '≤ 15 MB') : c.url}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      {c.tipo === 'ARQUIVO' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1">
                          <FileText className="w-3 h-3 text-blue-600" /> Arquivo (≤15MB)
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200 inline-flex items-center gap-1">
                          <Link2 className="w-3 h-3 text-purple-600" /> Link Externo
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-6 font-semibold text-slate-800">
                      {c.productTitle || 'Geral da Loja'}
                    </td>

                    <td className="py-4 px-6 text-center font-bold text-slate-900">
                      {c.tipo === 'ARQUIVO' ? c.downloadsCount : '—'}
                    </td>

                    <td className="py-4 px-6 text-center font-bold text-blue-700">
                      {c.downloadsCount + c.externalAccessCount}
                    </td>

                    <td className="py-4 px-6 text-slate-500">
                      {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleTestAccess(c)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-brand-navy border border-slate-200 flex items-center gap-1 transition-colors"
                          title={c.tipo === 'ARQUIVO' ? 'Baixar Arquivo' : 'Abrir Link Externo'}
                        >
                          {c.tipo === 'ARQUIVO' ? <Download className="w-3.5 h-3.5" /> : <ExternalLink className="w-3.5 h-3.5" />}
                          <span>{c.tipo === 'ARQUIVO' ? 'Testar Download' : 'Abrir Link'}</span>
                        </button>

                        <button
                          onClick={() => handleDelete(c.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Excluir Conteúdo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: + Adicionar Conteúdo */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <FolderCheck className="w-5 h-5 text-brand-navy" /> Novo Conteúdo Entregável
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Cadastre arquivos didáticos ou links de vídeo para os compradores.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Type Selector (Arquivo vs Link Externo) */}
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

            {/* Mandatory Requirement 16 UI Guidance Banner */}
            {formTipo === 'ARQUIVO' ? (
              <div className="bg-blue-50 border border-blue-200 text-blue-900 p-3 rounded-xl text-xs font-medium space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-blue-900">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span>Instruções para Arquivos:</span>
                </div>
                <p className="text-[11px] text-blue-800 pl-5 leading-relaxed">
                  • <strong>Máximo de 15 MB por arquivo.</strong><br />
                  • <strong>Vídeos não podem ser enviados para a plataforma.</strong> (Utilize a opção Link Externo para cadastrar vídeos do YouTube/Vimeo/Drive).
                </p>
              </div>
            ) : (
              <div className="bg-purple-50 border border-purple-200 text-purple-900 p-3 rounded-xl text-xs font-medium space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-purple-900">
                  <VideoOff className="w-4 h-4 text-purple-600" />
                  <span>Instruções para Vídeos e Links Externos:</span>
                </div>
                <p className="text-[11px] text-purple-800 pl-5 leading-relaxed">
                  • <strong>Vídeos devem ser disponibilizados através de links externos. A Educalizando não hospeda arquivos de vídeo.</strong><br />
                  • Cole abaixo o link do YouTube, Vimeo, Google Drive ou plataforma de transmissão.
                </p>
              </div>
            )}

            <form onSubmit={handleCreateContent} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Título do Conteúdo *
                </label>
                <input
                  type="text"
                  value={formTitulo}
                  onChange={(e) => setFormTitulo(e.target.value)}
                  placeholder="Ex: Apostila de Exercícios PDF ou Videoaula 01"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-brand-navy rounded-xl text-xs text-slate-900 focus:outline-none font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Descrição Curta (Opcional)
                </label>
                <input
                  type="text"
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  placeholder="Ex: Material complementar referente ao Módulo 1"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-brand-navy rounded-xl text-xs text-slate-900 focus:outline-none font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Produto Associado (Opcional)
                </label>
                <input
                  type="text"
                  value={formProductTitle}
                  onChange={(e) => setFormProductTitle(e.target.value)}
                  placeholder="Ex: Apostila Concurso 2026"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-brand-navy rounded-xl text-xs text-slate-900 focus:outline-none font-medium"
                />
              </div>

              {/* Form Input: FileUpload vs External Link URL Input */}
              {formTipo === 'ARQUIVO' ? (
                <FileUpload
                  label="Upload do Arquivo Digital (PDF / DOCX / ZIP)"
                  helperText="Selecione o arquivo seguro que será liberado aos alunos após o pagamento."
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
