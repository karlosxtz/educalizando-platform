'use client';

import { motion } from 'framer-motion';
import {
CheckCircle2,
FileText,
Link as LinkIcon,
ShieldCheck,
UploadCloud,
User
} from 'lucide-react';

import DeliveryFilesUpload from '@/components/dashboard/DeliveryFilesUpload';
import { isUploadedMaterial,normalizeDeliveryLink } from '@/lib/delivery-link';
import { toast } from 'sonner';


// The wizard owns state and persistence; this component only renders one visual step.
export default function ProductWizardStepThree({ state }: { state: any }) {
  const { editId, currentStep, preco, setPreco, precoOriginal, setPrecoOriginal, deliveryMethod, setDeliveryMethod, arquivoUrl, setArquivoUrl, arquivoNome, setArquivoNome, driveLinkDraft, setDriveLinkDraft, deliveryFiles, setDeliveryFiles, isFree, setIsFree, isPlr, setIsPlr, plrDescricao, setPlrDescricao, precoPlr, setPrecoPlr, plrLicenseUrl, setPlrLicenseUrl, plrDeliveryFiles, setPlrDeliveryFiles, plrDeliveryMethod, setPlrDeliveryMethod } = state;
  return <>
          {/* STEP 3: Preços e Entregáveis */}
          {currentStep === 3 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  3. Preços e Entregáveis
                </h2>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Configure o preço de venda e como os materiais serão entregues.
                </p>
              </div>

              {/* BLOCO 1: PRODUTO FINAL */}
              <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Bloco 1: Produto Final (Acesso do Cliente)
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    O material padrão e o preço que os clientes pagarão para acessar o seu conteúdo.
                  </p>
                </div>

                <div className="pt-2">
                  <div
                    onClick={() => {
                      setIsFree(!isFree);
                      if (!isFree) setPreco('0,00');
                      else setPreco('29,90');
                    }}
                    className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${isFree ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}
                  >
                    <div className={`mt-0.5 w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center border transition-colors ${isFree ? 'bg-emerald-600 border-emerald-600' : 'bg-white border-slate-300'}`}>
                      {isFree && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${isFree ? 'text-emerald-900' : 'text-slate-700'}`}>🎁 Material Gratuito (Brinde)</span>
                      </div>
                      <p className={`text-[11px] mt-1 font-medium leading-relaxed ${isFree ? 'text-emerald-700' : 'text-slate-500'}`}>
                        Se marcado, o cliente poderá baixar este material gratuitamente.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                      Preço de Venda (R$) {isFree ? '' : '*'}
                    </label>
                    <p className="mb-2 text-[11px] font-medium text-slate-500">Valor que a pessoa pagará pelo material.</p>
                    <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                    <input
                      type="text"
                      value={isFree ? '0,00' : preco}
                      disabled={isFree}
                      onChange={(e) => setPreco(e.target.value)}
                      placeholder="29,90"
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm font-black focus:outline-none transition-colors ${
                        isFree
                          ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-slate-50 border-slate-200 focus:border-blue-600 text-slate-900'
                      }`}
                    />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">Preço original</label>
                    <p className="mb-2 text-[11px] font-medium text-slate-500">Opcional — aparece riscado e entra em Oferta em Destaque.</p>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                      <input
                        type="text"
                        value={isFree ? '' : precoOriginal}
                        disabled={isFree}
                        onChange={(e) => setPrecoOriginal(e.target.value)}
                        placeholder="Ex.: 39,90"
                        className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm font-black focus:outline-none transition-colors ${isFree ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-amber-50/40 border-amber-200 focus:border-amber-500 text-slate-900'}`}
                      />
                    </div>
                  </div>
                </div>
                {!isFree && precoOriginal.trim() && (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">✨ Este material será exibido na vitrine <strong>Oferta em Destaque</strong>. O contador do card indica apenas a rotação da vitrine, não a validade do preço.</p>
                )}

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
                    Arquivo do Produto Final
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2 mb-4">
                    <button
                      type="button"
                      onClick={() => {
                        setDeliveryMethod('link');
                        if (isUploadedMaterial(arquivoUrl)) setArquivoUrl(null);
                      }}
                      className={`rounded-2xl border p-4 text-left transition-all ${
                        deliveryMethod === 'link' ? 'border-emerald-500 bg-emerald-50 shadow-sm ring-1 ring-emerald-200' : 'border-slate-200 bg-white hover:border-emerald-300'
                      }`}
                    >
                      <span className="flex items-start gap-3">
                        <span className={`mt-0.5 rounded-full p-1 ${deliveryMethod === 'link' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}><LinkIcon className="w-4 h-4" /></span>
                        <span><span className="flex items-center gap-2 text-sm font-black text-slate-900">Link do Drive <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-700">Recomendado</span></span><span className="mt-1 block text-xs font-medium text-slate-500">Google Drive, Mega, Dropbox e outros.</span></span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeliveryMethod('upload');
                        if (!isUploadedMaterial(arquivoUrl)) setArquivoUrl(null);
                        setDriveLinkDraft('');
                        setArquivoNome('');
                      }}
                      className={`rounded-2xl border p-4 text-left transition-all ${
                        deliveryMethod === 'upload' ? 'border-blue-500 bg-blue-50 shadow-sm ring-1 ring-blue-200' : 'border-slate-200 bg-white hover:border-blue-300'
                      }`}
                    >
                      <span className="flex items-start gap-3">
                        <span className={`mt-0.5 rounded-full p-1 ${deliveryMethod === 'upload' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}><UploadCloud className="w-4 h-4" /></span>
                        <span><span className="text-sm font-black text-slate-900">Upload dos arquivos</span><span className="mt-1 block text-xs font-medium text-slate-500">Quantidade ilimitada, até 15 MB por arquivo.</span></span>
                      </span>
                    </button>
                  </div>

                  {deliveryMethod === 'upload' ? (
                    <DeliveryFilesUpload
                      bucket="product-files"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.zip,.rar"
                      value={deliveryFiles}
                      onChange={setDeliveryFiles}
                    />
                  ) : (
                    <div className="bg-emerald-50/60 border border-emerald-200 p-4 rounded-2xl space-y-3">
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <LinkIcon className="w-4 h-4 text-emerald-600" />
                        Adicionar link do Drive
                      </h4>
                      <p className="text-xs font-medium text-slate-600">Cole um link público com permissão para qualquer pessoa com o link visualizar ou baixar.</p>
                      <input
                        type="text"
                        value={arquivoNome}
                        onChange={(e) => setArquivoNome(e.target.value)}
                        placeholder="Nome do material (ex.: Apostila completa)"
                        className="w-full px-4 py-3 bg-white border border-emerald-200 focus:border-emerald-600 rounded-xl text-slate-900 text-sm font-medium focus:outline-none shadow-sm"
                      />
                      <input
                        type="url"
                        value={driveLinkDraft}
                        onChange={(e) => setDriveLinkDraft(e.target.value)}
                        placeholder="https://drive.google.com/... ou https://1drv.ms/..."
                        className="w-full px-4 py-3 bg-white border border-emerald-200 focus:border-emerald-600 rounded-xl text-slate-900 text-sm font-medium focus:outline-none shadow-sm"
                      />
                      <button type="button" onClick={() => {
                        let normalizedLink: string;
                        if (!arquivoNome.trim()) { toast.error('Informe o nome do material antes de salvar o link.'); return; }
                        try {
                          normalizedLink = normalizeDeliveryLink(driveLinkDraft);
                        } catch { toast.error('Informe um link válido iniciado por https://.'); return; }
                        setArquivoUrl(normalizedLink);
                        toast.success('Link de entrega salvo.');
                      }} className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-emerald-600 px-5 text-sm font-black text-white shadow-sm transition-colors hover:bg-emerald-700"><LinkIcon className="h-4 w-4" /> Salvar link</button>
                      {arquivoUrl && deliveryMethod === 'link' && <p className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-bold text-emerald-800">✓ Link salvo para entrega: {arquivoNome}</p>}
                      <p className="text-xs font-medium text-slate-600">Aceitamos links do Google Drive, OneDrive, Mega e Dropbox. Garanta a permissão “qualquer pessoa com o link”.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* BLOCO 2: LICENÇA PLR */}
              <div className="bg-blue-50 border border-blue-200 p-5 rounded-xl shadow-sm space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-blue-900 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-blue-700" />
                      Bloco 2: Licença PLR (Mercado de Revenda)
                    </h3>
                    <p className="text-xs text-blue-700 mt-1">
                      Opcional. Venda os direitos de revenda deste produto. Quem compra recebe o pacote completo (Produto Final + Licença).
                    </p>
                  </div>
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-6 bg-blue-200/50 rounded-full cursor-pointer relative overflow-hidden" onClick={() => setIsPlr(!isPlr)}>
                      <div className={`absolute inset-0 bg-blue-600 transition-transform duration-300 ${isPlr ? 'translate-x-0' : '-translate-x-full'}`} />
                      <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${isPlr ? 'translate-x-6' : 'translate-x-0'}`} />
                    </div>
                  </div>
                </div>

                {isPlr && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  className="pt-4 border-t border-blue-200 space-y-5"
                  >
                    <div className="rounded-2xl border border-blue-200 bg-white p-4">
                      <label className="text-xs font-bold uppercase tracking-wider text-blue-900 block mb-1.5">Descrição exclusiva da licença PLR {!editId && <span className="text-rose-600">*</span>}</label>
                      <p className="mb-3 text-xs leading-5 text-slate-500">Esta descrição aparece apenas para quem acessar a oferta de licença para revenda. A descrição principal do produto final não será alterada.</p>
                      <textarea value={plrDescricao} onChange={(event) => setPlrDescricao(event.target.value)} required={!editId} minLength={!editId ? 20 : undefined} placeholder="Explique o que a licença inclui, para quem ela serve e como funciona a revenda deste material." className="min-h-32 w-full rounded-xl border border-blue-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none focus:border-blue-600" />
                      <p className="mt-2 text-[11px] text-blue-700">Use uma explicação voltada a criadores e revendedores. Esta informação é separada do produto final.</p>
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-blue-900 block mb-1.5">
                        Preço da Licença de Revenda (R$)
                      </label>
                      <div className="relative max-w-xs">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                        <input
                          type="text"
                          value={precoPlr}
                          onChange={(e) => setPrecoPlr(e.target.value)}
                          placeholder="99,90"
                          className="w-full pl-10 pr-4 py-3 bg-white border border-blue-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm font-black focus:outline-none shadow-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-blue-900 block mb-2">
                        Arquivos da Licença PLR
                      </label>
                      <div className="flex bg-blue-100/50 p-1 rounded-xl w-full mb-4">
                        <button
                          type="button"
                          onClick={() => {
                            setPlrDeliveryMethod('upload');
                            if (!isUploadedMaterial(plrLicenseUrl)) setPlrLicenseUrl(null);
                          }}
                          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                            plrDeliveryMethod === 'upload' ? 'bg-white shadow-sm text-blue-700' : 'text-blue-700/70 hover:text-blue-900'
                          }`}
                        >
                          <span className="flex items-center justify-center gap-2">
                            <UploadCloud className="w-4 h-4" /> Upload Seguro
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPlrDeliveryMethod('link');
                            if (isUploadedMaterial(plrLicenseUrl)) setPlrLicenseUrl(null);
                          }}
                          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                            plrDeliveryMethod === 'link' ? 'bg-white shadow-sm text-blue-700' : 'text-blue-700/70 hover:text-blue-900'
                          }`}
                        >
                          <span className="flex items-center justify-center gap-2">
                            <LinkIcon className="w-4 h-4" /> Link Externo
                          </span>
                        </button>
                      </div>

                      {plrDeliveryMethod === 'upload' ? (
                        <DeliveryFilesUpload
                          bucket="plr-files"
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.zip,.rar,.png,.jpg,.jpeg,.webp"
                          value={plrDeliveryFiles}
                          onChange={setPlrDeliveryFiles}
                        />
                      ) : (
                        <div className="bg-white/50 border border-blue-200 p-4 rounded-xl space-y-3">
                          <h4 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                            <LinkIcon className="w-4 h-4 text-blue-600" />
                            Link do Certificado/Licença
                          </h4>
                          <input
                            type="url"
                            value={plrLicenseUrl || ''}
                            onChange={(e) => setPlrLicenseUrl(e.target.value)}
                            placeholder="https://drive.google.com/..."
                            className="w-full px-4 py-2.5 bg-white border border-blue-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm font-medium focus:outline-none shadow-sm"
                          />
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>

            </motion.div>
          )}


  </>;
}
