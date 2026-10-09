'use client';

import { motion } from 'framer-motion';
import {
AlertCircle,
ArrowLeft,CheckCircle2,ChevronRight,
Eye,
Loader2,
Save,
Sparkles,
UploadCloud
} from 'lucide-react';
import Link from 'next/link';

import FileUploadMultiple from '@/components/dashboard/FileUploadMultiple';


import ProductWizardStepOne from './ProductWizardStepOne';
import ProductWizardStepThree from './ProductWizardStepThree';

// State and actions stay in the page controller; this component renders the wizard shell.
export default function ProductWizardView({ state }: { state: any }) {
  const { editId, saving, errorMsg, currentStep, titulo, descricao, tipo, preco, ageRange, galleryUrls, setGalleryUrls, status, setStatus, isFree, isImportedWoo, confirmImportPrice, setConfirmImportPrice, orderBumpId, setOrderBumpId, availableProducts, handleNextStep, handlePrevStep, handleSaveProduct } = state;
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Fixed Navigation Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 min-h-16 py-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
          <Link
            href="/dashboard/produtos"
            className="min-h-11 min-w-0 flex items-center gap-2 rounded-lg px-1 text-xs font-bold text-slate-600 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="truncate">Voltar</span><span className="hidden sm:inline">para Produtos</span>
          </Link>

          <div className="hidden min-w-0 items-center gap-2 sm:flex">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h1 className="text-sm font-black text-slate-900">
              {editId ? 'Editar Produto Didático' : 'Wizard de Cadastro de Produto'}
            </h1>
          </div>

          <div className="text-xs text-slate-400 font-semibold hidden sm:block">
            Passo {currentStep} de 4
          </div>
        </div>
      </header>

      {/* Step Progress Indicator Bar */}
      <div className="bg-white border-b border-slate-200 py-3 sm:py-4 px-4 sm:px-6 shadow-xs" aria-label={`Etapa ${currentStep} de 4 do cadastro`}>
        <div className="max-w-4xl mx-auto flex items-center justify-between relative">
          {/* Connector Line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 z-0" />

          {[
            { step: 1, title: 'Informações Básicas' },
            { step: 2, title: 'Capa do Produto' },
            { step: 3, title: 'Arquivo Digital' },
            { step: 4, title: 'Revisão & Publicação' }
          ].map((item: any) => {
            const isCompleted = currentStep > item.step;
            const isCurrent = currentStep === item.step;

            return (
              <div key={item.step} aria-current={isCurrent ? 'step' : undefined} className="relative z-10 flex flex-col items-center gap-1.5 bg-white px-1 sm:px-2">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                    isCompleted
                      ? 'bg-emerald-600 text-white shadow-md'
                      : isCurrent
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-md'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : item.step}
                </div>
                <span className={`text-[11px] font-bold hidden sm:block ${isCurrent ? 'text-blue-600' : 'text-slate-500'}`}>
                  {item.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Wizard Form Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {errorMsg && (
          <div role="alert" aria-live="assertive" className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs font-bold flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-lg p-5 sm:p-10 space-y-8">
          <ProductWizardStepOne state={state} />
          {/* STEP 2: Product Cover Upload */}
          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-blue-600" />
                  2. Imagem de Capa do Produto
                </h2>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Envie uma imagem atraente na proporção 3:4 (mínimo 600x800px).
                </p>
              </div>

              <FileUploadMultiple
                bucket="product-covers"
                accept="image/*"
                maxSizeMB={15}
                value={galleryUrls}
                onChange={setGalleryUrls}
                label="Capa e Galeria do Produto"
                helperText="Selecione ou arraste arquivos PNG, JPG ou WEBP (até 15MB/cada)."
                maxItems={10}
                cropCover={true}
              />
            </motion.div>
          )}

          <ProductWizardStepThree state={state} />
          {/* STEP 4: Review & Publish */}
          {currentStep === 4 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  4. Revisão & Publicação
                </h2>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Confira o visual do seu produto antes de salvar na plataforma.
                </p>
              </div>

              {isImportedWoo && <label className="flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><input type="checkbox" checked={confirmImportPrice} onChange={event => setConfirmImportPrice(event.target.checked)} className="mt-0.5 h-5 w-5 accent-amber-600" /><span><b className="block">Confirmo o preço deste produto</b>Revise o valor de {isFree ? 'Grátis' : `R$ ${preco || '0,00'}`} antes de publicar na Educalizando.</span></label>}

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-6">
                <div className="w-36 h-48 rounded-xl bg-slate-200 overflow-hidden flex-shrink-0 relative shadow-md">
                  {galleryUrls.length > 0 ? (
                    <img src={galleryUrls[0]} alt={titulo} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-semibold p-2 text-center">
                      Sem Capa
                    </div>
                  )}
                </div>

                <div className="space-y-3 flex-1">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                      {tipo}
                    </span>
                    <h3 className="text-lg font-black text-slate-900 mt-2">{titulo || 'Título não preenchido'}</h3>
                    <p className="text-xs text-slate-500 line-clamp-3 mt-1">{descricao || 'Sem descrição'}</p>
                    {ageRange && (
                      <p className="mt-2 inline-flex rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-900">
                        Faixa etária: {ageRange}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-200">
                    <span className="text-2xl font-black text-slate-900">{isFree ? 'Grátis' : `R$ ${preco || '0,00'}`}</span>

                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-slate-600">Status:</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as 'publicado' | 'rascunho')}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                      >
                        <option value="publicado">Publicado (Visível)</option>
                        <option value="rascunho">Rascunho (Privado)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Aumente seu Ticket Médio (Order Bump) */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mt-6 space-y-4">
                <div>
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" /> Aumente seu Ticket Médio (Order Bump)
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Ofereça um produto complementar na tela de checkout com apenas 1 clique.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">Produto Complementar</label>
                  <select
                    value={orderBumpId}
                    onChange={(e) => setOrderBumpId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="">Nenhum (Desativado)</option>
                    {availableProducts.filter((p: any) => p.id !== editId).map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.titulo} - R$ {p.preco.toFixed(2).replace('.', ',')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

            </motion.div>
          )}

          {/* Navigation Controls Bar */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handlePrevStep}
              disabled={currentStep === 1 || saving}
              className="min-h-11 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-700 transition-all"
            >
              Anterior
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="min-h-11 px-4 sm:px-6 py-2.5 rounded-xl font-extrabold text-xs bg-blue-600 text-white hover:bg-blue-700 shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 flex items-center gap-2 transition-all"
              >
                <span>Próximo Passo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveProduct}
                disabled={saving}
                className="min-h-11 px-4 sm:px-7 py-3 rounded-xl font-extrabold text-xs bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg disabled:cursor-wait disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 flex items-center gap-2 transition-all"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Save className="w-4 h-4" aria-hidden="true" />}
                <span role={saving ? 'status' : undefined}>{saving ? 'Salvando...' : editId ? 'Atualizar Produto' : 'Publicar Produto Didático'}</span>
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
