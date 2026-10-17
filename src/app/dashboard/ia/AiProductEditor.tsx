'use client';
import CatalogImage from '@/components/ui/CatalogImage';
import type { Dispatch, SetStateAction } from 'react';
import { useState } from 'react';
import type { Product, Category, EducationLevel } from '@/lib/types';
import { SCHOOL_CALENDAR_TAGS } from '@/lib/school-calendar';
import { BookOpen, Search, FileText, Sparkles, CheckCircle2, X, Loader2 } from 'lucide-react';
import { fillAiSeoProposal, type SeoProposal } from '@/lib/ai-seo-fill';
import { AiSeoFillPanel } from './AiSeoFillPanel';
import type { AiEditorialValues } from '@/lib/ai-workspace';
import { AiEditorialReview } from './AiEditorialReview';
import { AiSeoGuidance } from './AiSeoGuidance';
import { AiDescriptionChoices } from './AiDescriptionChoices';
type Props = { proposal: SeoProposal & { analysis?: string[]; titles?: string[]; descriptionOptions?: string[]; metaDescription?: string; keywords?: string[] }; activeProduct: Product | null; categories: Category[]; educationLevels: EducationLevel[]; editingTarget: 'product' | 'plr'; editedTitle: string; editedDescription: string; editedTags: string[]; editedThemes: string[]; editedCategoryId: string; editedEducationLevelId: string; editedAgeRange: string; editedFormatDetails: string; tagDraft: string; applying: boolean; applyProposal: () => Promise<void>; baseline: AiEditorialValues; values: AiEditorialValues; draftStatus: string; onClose: () => void; setEditedTitle: Dispatch<SetStateAction<string>>; setEditedDescription: Dispatch<SetStateAction<string>>; setEditedCategoryId: Dispatch<SetStateAction<string>>; setEditedEducationLevelId: Dispatch<SetStateAction<string>>; setEditedAgeRange: Dispatch<SetStateAction<string>>; setEditedFormatDetails: Dispatch<SetStateAction<string>>; setTagDraft: Dispatch<SetStateAction<string>>; setEditedTags: Dispatch<SetStateAction<string[]>>; setEditedThemes: Dispatch<SetStateAction<string[]>>; };
export function AiProductEditor({ proposal, activeProduct, categories, educationLevels, editingTarget, editedTitle, setEditedTitle, editedDescription, setEditedDescription, editedTags, setEditedTags, editedThemes, setEditedThemes, editedCategoryId, setEditedCategoryId, editedEducationLevelId, setEditedEducationLevelId, editedAgeRange, setEditedAgeRange, editedFormatDetails, setEditedFormatDetails, tagDraft, setTagDraft, applying, applyProposal, baseline, values, draftStatus, onClose }: Props) {
  const [fillMessage, setFillMessage] = useState('');
  function fillSuggestions() {
    const filled = fillAiSeoProposal(values, proposal, editingTarget);
    setEditedTitle(filled.title); setEditedDescription(filled.description); setEditedTags(filled.tags); setEditedCategoryId(filled.categoryId); setEditedEducationLevelId(filled.educationLevelId); setEditedAgeRange(filled.ageRange); setEditedFormatDetails(filled.formatDetails);
    setFillMessage('Ajustes preenchidos nos campos abaixo. Revise e clique em Salvar alterações para gravar no produto.');
  }
  return (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/60 p-3 sm:p-6 lg:pl-16">
          <div className="mx-auto my-4 flex max-h-[calc(100dvh-5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl">
            <header className="flex items-start justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-violet-700 to-fuchsia-600 px-5 py-5 text-white sm:px-7">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-100">Editor do material com IA</p>
                <h2 className="mt-1 text-xl font-black sm:text-2xl">Revise e salve as melhorias no seu produto</h2>
                <p className="mt-1 text-sm text-violet-100">Você controla cada informação antes de publicar a alteração.</p>
              </div>
              <button type="button" aria-label="Fechar editor" onClick={onClose} className="rounded-xl bg-white/15 p-2 text-white transition hover:bg-white/25"><X className="h-5 w-5" /></button>
            </header>

            <div className="grid min-h-0 gap-6 overflow-y-auto p-5 sm:p-7 lg:grid-cols-[240px_minmax(0,1fr)]">
              <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-wider text-slate-500">Material selecionado</p>
                {activeProduct?.capa_url ? (
                  <CatalogImage src={activeProduct.capa_url} alt={`Capa de ${activeProduct.titulo}`} className="mt-3 aspect-[4/3] w-full rounded-xl object-cover shadow-sm" />
                ) : (
                  <div className="mt-3 flex aspect-[4/3] items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-fuchsia-100 text-violet-600"><BookOpen className="h-10 w-10" /></div>
                )}
                <h3 className="mt-4 line-clamp-3 text-base font-black text-slate-900">{activeProduct?.titulo || 'Material selecionado'}</h3>
                <p className="mt-1 text-sm text-slate-500">{activeProduct?.tipo || 'Material digital'}</p>
                <div className="mt-4 rounded-xl bg-white p-3 text-xs leading-5 text-slate-600">
                  A capa e o contexto ficam visíveis aqui para você editar o produto certo.
                </div>
              </aside>

              <fieldset disabled={applying} aria-label="Campos editoriais do material" className="min-w-0 space-y-6">
                <AiSeoFillPanel product={activeProduct} values={values} target={editingTarget} disabled={applying} onFill={fillSuggestions} />
                {fillMessage && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{fillMessage}</p>}
                <p role="status" className="text-xs text-violet-700">{draftStatus}</p>
                <AiEditorialReview before={baseline} after={values} source={{ ...activeProduct, titulo: baseline.title, descricao: editingTarget === 'product' ? baseline.description : activeProduct?.descricao, plr_descricao: editingTarget === 'plr' ? baseline.description : activeProduct?.plr_descricao, age_range: baseline.ageRange, format_details: baseline.formatDetails }} target={editingTarget} categoryNames={Object.fromEntries(categories.map(item => [item.id, item.nome]))} levelNames={Object.fromEntries(educationLevels.map(item => [item.id, item.nome]))} />
                {proposal.analysis?.length ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-xs font-black uppercase tracking-wider text-amber-800">Diagnóstico da IA</p>
                    <ul className="mt-2 space-y-1 text-sm leading-6 text-amber-950">{proposal.analysis.map((item: string) => <li key={item}>• {item}</li>)}</ul>
                  </div>
                ) : null}

                {editingTarget === 'plr' ? <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><p className="font-black">Você está editando a licença PLR</p><p className="mt-1">Esta alteração será salva somente na descrição para revendedores. O título, as tags e os temas do produto final permanecem como estão.</p></div> : null}

                {editingTarget !== 'plr' ? <div className="rounded-2xl border border-slate-200 p-4 sm:p-5">
                  <div className="flex items-center gap-2"><Search className="h-4 w-4 text-violet-600" /><h3 className="font-black text-slate-900">1. Título do produto</h3></div>
                  <p className="mt-1 text-sm text-slate-500">Escolha uma sugestão ou escreva um título que descreva seu material com clareza.</p>
                  {proposal.titles?.length ? <div className="mt-3 grid gap-2">{proposal.titles.map((title: string) => <button key={title} type="button" onClick={() => setEditedTitle(title)} className={`rounded-xl border p-3 text-left text-sm font-bold transition ${editedTitle === title ? 'border-violet-600 bg-violet-50 text-violet-900' : 'border-slate-200 text-slate-700 hover:border-violet-300'}`}>{title}</button>)}</div> : null}
                  <input maxLength={160} value={editedTitle} onChange={event => setEditedTitle(event.target.value)} placeholder="Título do seu material" className="mt-3 min-h-12 w-full rounded-xl border border-slate-300 px-3 text-sm font-semibold outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" />
                </div> : null}

                <div className="rounded-2xl border border-slate-200 p-4 sm:p-5">
                  <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-violet-600" /><h3 className="font-black text-slate-900">{editingTarget === 'plr' ? 'Descrição da licença PLR' : '2. Descrição de venda'}</h3></div>
                  <p className="mt-1 text-sm text-slate-500">{editingTarget === 'plr' ? 'Escolha ou ajuste o texto que será mostrado apenas para quem compra a licença para revenda.' : 'Escolha um modelo pronto da IA ou ajuste o texto antes de salvar.'}</p>
                  <AiDescriptionChoices options={proposal.descriptionOptions} current={baseline.description} selected={editedDescription} onSelect={setEditedDescription} />
                  <textarea maxLength={8000} value={editedDescription} onChange={event => setEditedDescription(event.target.value)} placeholder="Descreva o seu material" className="mt-3 min-h-40 w-full rounded-xl border border-slate-300 p-3 text-sm leading-6 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" />
                </div>

                {editingTarget !== 'plr' ? <><div className="rounded-2xl border border-slate-200 p-4 sm:p-5">
                  <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-violet-600" /><h3 className="font-black text-slate-900">3. Tags de busca</h3></div>
                  <p className="mt-1 text-sm text-slate-500">Palavras curtas que descrevem o material. Tags não são datas nem temas do calendário.</p>
                  <div className="mt-3 flex flex-wrap gap-2">{editedTags.length ? editedTags.map(tag => <button key={tag} type="button" onClick={() => setEditedTags(tags => tags.filter(item => item !== tag))} className="rounded-full bg-violet-100 px-3 py-1.5 text-xs font-bold text-violet-800">{tag} ×</button>) : <span className="text-sm text-slate-500">Nenhuma tag selecionada ainda.</span>}</div>
                  <div className="mt-3 flex gap-2"><input value={tagDraft} onChange={event => setTagDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); const tag = tagDraft.trim().toLowerCase(); if (tag && !editedTags.includes(tag)) setEditedTags(tags => [...tags, tag]); setTagDraft(''); } }} placeholder="Ex.: alfabetização, jogo educativo" className="min-h-11 flex-1 rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-violet-500" /><button type="button" onClick={() => { const tag = tagDraft.trim().toLowerCase(); if (tag && !editedTags.includes(tag)) setEditedTags(tags => [...tags, tag]); setTagDraft(''); }} className="rounded-xl bg-violet-100 px-4 text-sm font-black text-violet-800">Adicionar</button></div>
                </div>

                <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4 sm:p-5">
                  <div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-blue-600" /><h3 className="font-black text-slate-900">4. Temas e datas pedagógicas</h3></div>
                  <p className="mt-1 text-sm text-slate-500">Esta área é exclusiva para o calendário e os projetos escolares do material.</p>
                  <div className="mt-3 flex flex-wrap gap-2">{editedThemes.length ? editedThemes.map(theme => <button key={theme} type="button" onClick={() => setEditedThemes(themes => themes.filter(item => item !== theme))} className="rounded-full bg-blue-100 px-3 py-1.5 text-xs font-bold text-blue-800">{theme} ×</button>) : <span className="text-sm text-slate-500">Nenhum tema ou data selecionado.</span>}</div>
                  <details className="mt-4 rounded-xl bg-white/80 p-3"><summary className="cursor-pointer text-sm font-black text-blue-700">Selecionar temas e datas</summary><div className="mt-3 flex flex-wrap gap-2">{SCHOOL_CALENDAR_TAGS.map(theme => <button key={theme} type="button" onClick={() => setEditedThemes(themes => themes.includes(theme) ? themes.filter(item => item !== theme) : [...themes, theme])} className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${editedThemes.includes(theme) ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300'}`}>{theme}</button>)}</div></details>
                </div>

                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 sm:p-5">
                  <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /><h3 className="font-black text-slate-900">5. Classificação do material</h3></div>
                  <p className="mt-1 text-sm text-slate-500">Categoria e nível principais do cadastro. Confira antes de salvar; os demais vínculos do produto são preservados.</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-600">Categoria<select value={editedCategoryId} onChange={event => setEditedCategoryId(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold normal-case outline-none focus:border-emerald-500"><option value="">Selecione uma categoria</option>{categories.map(category => <option key={category.id} value={category.id}>{category.nome}</option>)}</select></label>
                    <label className="text-xs font-black uppercase tracking-wider text-slate-600">Nível de ensino<select value={editedEducationLevelId} onChange={event => setEditedEducationLevelId(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold normal-case outline-none focus:border-emerald-500"><option value="">Selecione o nível</option>{educationLevels.map(level => <option key={level.id} value={level.id}>{level.nome}</option>)}</select></label>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-600">Ano ou faixa indicada<input maxLength={120} value={editedAgeRange} onChange={event => setEditedAgeRange(event.target.value)} placeholder="Ex.: 1º ao 3º ano" className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold normal-case outline-none focus:border-emerald-500" /></label>
                    <label className="text-xs font-black uppercase tracking-wider text-slate-600">Formato e modo de uso<input maxLength={180} value={editedFormatDetails} onChange={event => setEditedFormatDetails(event.target.value)} placeholder="Ex.: PDF para imprimir e usar em sala" className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold normal-case outline-none focus:border-emerald-500" /></label>
                  </div>
                </div></> : null}

                <AiSeoGuidance summary={proposal.metaDescription} keywords={proposal.keywords} />
              </fieldset>
            </div>

            <footer className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7"><p className="text-xs leading-5 text-slate-500">{editingTarget === 'plr' ? 'Ao salvar, apenas a descrição exclusiva da licença PLR será atualizada.' : 'Ao salvar, título, descrição, tags, temas, categoria, nível, anos indicados e formato serão atualizados. Preço, link e conteúdo não serão alterados.'}</p><div className="flex gap-2"><button type="button" onClick={onClose} className="min-h-11 rounded-xl px-4 text-sm font-bold text-slate-600 hover:bg-slate-200">Cancelar</button><button type="button" onClick={() => void applyProposal()} disabled={applying || JSON.stringify(values) === JSON.stringify(baseline) || !editedDescription.trim() || (editingTarget === 'product' && editedTitle.trim().length < 4)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 disabled:opacity-60">{applying && <Loader2 className="h-4 w-4 animate-spin" />} Salvar alterações</button></div></footer>
          </div>
        </div>
  );
}
