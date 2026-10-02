'use client';

import { motion } from 'framer-motion';
import {
CheckCircle2,
FileText,
GraduationCap,
Loader2,
Search,
Sparkles,
Tags,
X
} from 'lucide-react';
import Link from 'next/link';

import LimitedMultiSelect from '@/components/ui/LimitedMultiSelect';
import TagInput from '@/components/ui/TagInput';
import { SCHOOL_CALENDAR_TAGS } from '@/lib/school-calendar';
import { ProductType } from '@/lib/types';


// The wizard owns state and persistence; this component only renders one visual step.
export default function ProductWizardStepOne({ state }: { state: any }) {
  const { bnccSkillsMaster, currentStep, titulo, setTitulo, descricao, setDescricao, tipo, setTipo, pageCount, setPageCount, ageRange, setAgeRange, formatDetails, setFormatDetails, previewUrl, setPreviewUrl, instagramVideoUrl, setInstagramVideoUrl, categoryIds, setCategoryIds, educationLevelIds, setEducationLevelIds, seasonalTags, setSeasonalTags, productTags, setProductTags, aiConfigured, aiGenerating, isSeasonalPickerOpen, setIsSeasonalPickerOpen, seasonalTagSearch, setSeasonalTagSearch, seasonalSuggestions, selectedBnccSkills, setSelectedBnccSkills, usesBncc, setUsesBncc, bnccSearch, setBnccSearch, bnccStage, setBnccStage, bnccSubject, setBnccSubject, plrSourceTitle, allowAffiliates, setAllowAffiliates, affiliateCommissionRate, setAffiliateCommissionRate, formatOptions, bnccSubjects, filteredBnccSkills, handleOptimizeAll, categoryOptions, educationOptions } = state;
  return <>
          {/* STEP 1: Basic Information & Categorization */}
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  1. Informações Básicas do Produto
                </h2>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Defina o título, a descrição formatada, o tipo de arquivo e os filtros pedagógicos.
                </p>
              </div>

              {plrSourceTitle && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                  <p className="font-black">Licença PLR confirmada: {plrSourceTitle}</p>
                  <p className="mt-1 text-xs leading-relaxed text-amber-800">
                    Preenchemos título, descrição, capa, galeria e dados pedagógicos para agilizar. Antes de publicar, altere título, descrição e capa para diferenciar sua versão; envie também seus próprios arquivos ou links de entrega.
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                      Título do Material Didático *
                    </label>
                    {aiConfigured ? (
                      <button type="button" onClick={handleOptimizeAll} disabled={aiGenerating} className="flex items-center gap-1 text-sm font-bold text-blue-600 transition-colors hover:text-blue-800 disabled:cursor-wait disabled:opacity-60">
                        {aiGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        {aiGenerating ? 'Identificando...' : 'Preencher cadastro com IA'}
                      </button>
                    ) : (
                      <Link href="/dashboard/ia" className="flex items-center gap-1 text-xs font-bold text-slate-500 transition hover:text-blue-700">
                        <Sparkles className="h-4 w-4" /> Conectar IA para preencher
                      </Link>
                    )}
                  </div>
                  <input
                    type="text"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Ex: Apostila Ilustrada de História do Brasil - ENEM & Concursos"
                    aria-describedby="product-title-guidance"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm font-medium focus:outline-none"
                  />
                  <p id="product-title-guidance" className={`mt-2 text-xs leading-relaxed ${titulo.length > 100 ? 'text-amber-700' : 'text-slate-500'}`}>
                    {titulo.length > 100 ? 'Seu título está longo. ' : ''}Prefira até 100 caracteres: nome do material, tema e ano escolar. Coloque preços, benefícios e detalhes na descrição.
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                      Descrição Detalhada & O que o cliente vai receber
                    </label>
                  </div>
                  <textarea
                    rows={4}
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Descreva o conteúdo do material, número de páginas, temas abordados e benefícios..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm font-medium focus:outline-none"
                  />
                </div>

                <div className="pt-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                    Tipo de Conteúdo
                  </label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as ProductType)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none"
                  >
                    <option value="pdf">Apostila / Documento PDF</option>
                    <option value="ebook">E-book Esquematizado</option>
                    <option value="video">Videoaula Interativa</option>
                    <option value="curso">Curso / Pacote de Módulos</option>
                    <option value="simulado">Simulado & Gabarito Comentado</option>
                  </select>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                      Número de páginas / telas
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      inputMode="numeric"
                      value={pageCount}
                      onChange={(event) => setPageCount(event.target.value)}
                      placeholder={tipo === 'video' ? 'Ex.: 12 aulas' : 'Ex.: 45'}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm font-medium focus:outline-none"
                    />
                    <p className="mt-1 text-[11px] text-slate-500">Opcional. Para vídeos, informe a quantidade de aulas/telas.</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                      Faixa etária recomendada
                    </label>
                    <input
                      type="text"
                      maxLength={120}
                      value={ageRange}
                      onChange={(event) => setAgeRange(event.target.value)}
                      placeholder="Ex.: 6 a 8 anos"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm font-medium focus:outline-none"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-pink-100 bg-pink-50/60 p-4">
                  <label className="text-xs font-bold uppercase tracking-wider text-pink-800 block mb-1.5">Vídeo do Instagram na galeria</label>
                  <input type="url" value={instagramVideoUrl} onChange={(event) => setInstagramVideoUrl(event.target.value)} placeholder="https://www.instagram.com/reel/..." className="w-full px-4 py-3 bg-white border border-pink-200 focus:border-pink-500 rounded-xl text-slate-900 text-sm font-medium focus:outline-none" />
                  <p className="mt-2 text-[11px] text-pink-800">Cole o link público de um Reel ou post. Ele aparecerá junto das fotos do material com acesso ao Instagram da loja.</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">Datas e projetos escolares</label>
                      <p className="mt-1 text-xs text-slate-500">Marque somente temas que realmente aparecem neste material. Isso o conecta às campanhas e à busca pública.</p>
                      <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Sugestões do mês">
                        {seasonalSuggestions.map((tag: any) => { const selected = seasonalTags.includes(tag); return <button key={tag} type="button" onClick={() => setSeasonalTags((current: any) => selected ? current.filter((item: any) => item !== tag) : [...current, tag])} className={'rounded-full border px-2.5 py-1 text-[11px] font-bold transition-colors ' + (selected ? 'border-violet-700 bg-violet-700 text-white' : 'border-violet-200 bg-white text-violet-800 hover:bg-violet-50')}>{selected ? '✓ ' : '+ '}{tag}</button>; })}
                      </div>
                    </div>
                    <button type="button" onClick={() => setIsSeasonalPickerOpen(true)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-sm transition-colors hover:bg-blue-700">
                      <Tags className="h-4 w-4" /> Selecionar datas e temas
                    </button>
                  </div>
                  {seasonalTags.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">
                    {seasonalTags.map((tag: any) => <button key={tag} type="button" onClick={() => setSeasonalTags((current: any) => current.filter((item: any) => item !== tag))} className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100">{tag}<X className="h-3 w-3" /></button>)}
                  </div>}
                </div>

                <div className="rounded-2xl border border-violet-200 bg-violet-50/50 p-4">
                  <label className="text-xs font-bold uppercase tracking-wider text-violet-900 block">Tags de busca do produto</label>
                  <p className="mt-1 text-xs text-slate-500">Digite uma tag e use vírgula, espaço ou Enter para confirmar. Cada tag confirmada ficará destacada abaixo. Use até 10 tags.</p>
                  <TagInput value={productTags} onChange={setProductTags} maxTags={10} placeholder="Ex.: alfabetização, jardim, exploradores" />
                </div>

                {isSeasonalPickerOpen && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
                  <div className="w-full max-w-2xl rounded-3xl bg-white p-5 shadow-2xl sm:p-7">
                    <div className="flex items-start justify-between gap-4">
                      <div><p className="text-[10px] font-black uppercase tracking-[0.15em] text-blue-600">Catálogo escolar</p><h3 className="mt-1 text-xl font-black text-slate-900">Conectar datas e temas</h3><p className="mt-1 text-xs text-slate-500">Pesquise e selecione todas as ocasiões relacionadas ao material.</p></div>
                      <button type="button" onClick={() => setIsSeasonalPickerOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Fechar"><X className="h-5 w-5" /></button>
                    </div>
                    <label className="relative mt-5 block"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input autoFocus value={seasonalTagSearch} onChange={(event) => setSeasonalTagSearch(event.target.value)} placeholder="Pesquisar: mulher, Páscoa, cabelo maluco..." className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-blue-500" /></label>
                    <div className="mt-4 max-h-[45vh] overflow-y-auto rounded-2xl border border-slate-100 p-2">
                      {SCHOOL_CALENDAR_TAGS.filter((tag: any) => tag.toLocaleLowerCase('pt-BR').includes(seasonalTagSearch.toLocaleLowerCase('pt-BR'))).map((tag: any) => { const selected = seasonalTags.includes(tag); return <button key={tag} type="button" onClick={() => setSeasonalTags((current: any) => selected ? current.filter((item: any) => item !== tag) : [...current, tag])} className={`m-1 rounded-xl border px-3 py-2 text-left text-xs font-bold transition-colors ${selected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50'}`}>{tag}</button>; })}
                    </div>
                    <div className="mt-5 flex items-center justify-between"><span className="text-xs font-medium text-slate-500">{seasonalTags.length} tema(s) selecionado(s)</span><button type="button" onClick={() => setIsSeasonalPickerOpen(false)} className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white">Concluir seleção</button></div>
                  </div>
                </div>}

                <div className="grid sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                      Detalhes do formato
                    </label>
                    <select value={formatDetails} onChange={(event) => setFormatDetails(event.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm font-medium focus:outline-none"><option value="">Escolha o formato do material</option>{formatOptions.map((option: any) => <option key={option} value={option}>{option}</option>)}</select>
                    <p className="mt-1 text-[11px] text-slate-500">Escolha uma opção para deixar a apresentação do produto mais clara.</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                      Link público de prévia
                    </label>
                    <input
                      type="url"
                      value={previewUrl}
                      onChange={(event) => setPreviewUrl(event.target.value)}
                      placeholder="https://..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm font-medium focus:outline-none"
                    />
                    <p className="mt-1 text-[11px] text-slate-500">Use uma prévia sem acesso ao arquivo completo vendido.</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                      Categoria / Tema
                    </label>
                    <LimitedMultiSelect
                      options={categoryOptions}
                      values={categoryIds}
                      onChange={setCategoryIds}
                      placeholder="Selecione até 5 categorias/temas"
                      maxSelections={5}
                      icon={<Tags className="w-4 h-4" />}
                    />
                    <p className="mt-2 text-[11px] text-slate-500">A primeira opção marcada será a categoria principal. Você pode escolher até 5.</p>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                      Nível de Escolaridade
                    </label>
                    <LimitedMultiSelect
                      options={educationOptions}
                      values={educationLevelIds}
                      onChange={setEducationLevelIds}
                      placeholder="Selecione até 5 níveis"
                      maxSelections={5}
                      icon={<GraduationCap className="w-4 h-4" />}
                    />
                    <p className="mt-2 text-[11px] text-slate-500">A primeira opção marcada será o nível principal. Você pode escolher até 5.</p>
                  </div>
                </div>

                {/* Habilidades da BNCC */}
                <div className="pt-2">
                  <label className="flex items-center gap-3 mb-3 cursor-pointer">
                    <input type="checkbox" checked={usesBncc} onChange={(e) => { setUsesBncc(e.target.checked); if (!e.target.checked) setSelectedBnccSkills([]); }} className="w-4 h-4 accent-blue-600" />
                    <span className="text-sm font-bold text-slate-800">Este material é alinhado à BNCC</span>
                  </label>
                  {!usesBncc ? <p className="text-xs text-slate-500">Marque esta opção para informar as habilidades BNCC trabalhadas.</p> : null}
                  {usesBncc && <>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
                    Habilidades da BNCC (Opcional)
                  </label>
                  <p className="text-xs text-slate-500 mb-3">
                    Selecione as habilidades da Base Nacional Comum Curricular que este material desenvolve.
                    Isso ajuda os professores a encontrarem seu conteúdo mais rápido.
                  </p>

                  <div className="grid gap-2 sm:grid-cols-[1fr_160px_220px] mb-3">
                    <label className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="search"
                        value={bnccSearch}
                        onChange={(event) => setBnccSearch(event.target.value)}
                        placeholder="Buscar código, tema ou palavra..."
                        className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
                      />
                    </label>
                    <select
                      value={bnccStage}
                      onChange={(event) => setBnccStage(event.target.value as 'all' | 'EI' | 'EF' | 'EM')}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                      aria-label="Filtrar por etapa da BNCC"
                    >
                      <option value="all">Todas as etapas</option>
                      <option value="EI">Educação Infantil</option>
                      <option value="EF">Ensino Fundamental</option>
                      <option value="EM">Ensino Médio</option>
                    </select>
                    <select
                      value={bnccSubject}
                      onChange={(event) => setBnccSubject(event.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                      aria-label="Filtrar por componente da BNCC"
                    >
                      <option value="all">Todos os componentes</option>
                      {bnccSubjects.map((subject: any) => <option key={subject} value={subject}>{subject}</option>)}
                    </select>
                  </div>

                  <div className="flex items-center justify-between mb-2 text-xs text-slate-500">
                    <span>{bnccSkillsMaster.length.toLocaleString('pt-BR')} habilidades disponíveis</span>
                    <span className="font-semibold text-blue-700">{selectedBnccSkills.length} selecionada(s)</span>
                  </div>

                  <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl bg-white p-2 space-y-1">
                    {bnccSkillsMaster.length > 0 ? (
                      filteredBnccSkills.length > 0 ? filteredBnccSkills.map((skill: any) => {
                        const isSelected = selectedBnccSkills.includes(skill.id);
                        return (
                          <div
                            key={skill.id}
                            onClick={() => {
                              setSelectedBnccSkills((prev: any) =>
                                isSelected
                                  ? prev.filter((id: any) => id !== skill.id)
                                  : [...prev, skill.id]
                              );
                            }}
                            className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors border-2 ${
                              isSelected
                                ? 'bg-blue-50 border-blue-500'
                                : 'bg-transparent border-transparent hover:bg-slate-50 hover:border-slate-200'
                            }`}
                          >
                            <div className={`mt-0.5 w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border transition-colors ${
                              isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'
                            }`}>
                              {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-800">{skill.code}</div>
                              <div className="text-[11px] font-medium text-blue-700">{[skill.grade_level, skill.subject].filter(Boolean).join(' · ')}</div>
                              <div className="text-xs text-slate-600 leading-snug line-clamp-2">{skill.description}</div>
                            </div>
                          </div>
                        )
                      }) : <div className="p-4 text-center text-sm font-medium text-slate-500">Nenhuma habilidade encontrada com esses filtros.</div>
                    ) : (
                      <div className="p-4 text-center text-sm font-medium text-slate-500">
                        Carregando habilidades...
                      </div>
                    )}
                  </div>
                  {filteredBnccSkills.length >= 150 && (
                    <p className="mt-2 text-xs text-slate-500">Exibindo os primeiros 150 resultados. Refine a busca para encontrar uma habilidade específica.</p>
                  )}
                  </>}
                </div>



                {/* PROGRAMA DE AFILIADOS */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="pt-0.5 relative flex-shrink-0">
                      <div className="w-12 h-6 bg-slate-200 rounded-full cursor-pointer relative overflow-hidden" onClick={() => setAllowAffiliates(!allowAffiliates)}>
                        <div className={`absolute inset-0 bg-blue-600 transition-transform duration-300 ${allowAffiliates ? 'translate-x-0' : '-translate-x-full'}`} />
                        <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${allowAffiliates ? 'translate-x-6' : 'translate-x-0'}`} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${allowAffiliates ? 'text-blue-900' : 'text-slate-700'}`}>Habilitar Programa de Afiliados</span>
                        <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">Novo</span>
                      </div>
                      <p className={`text-[11px] mt-1 font-medium leading-relaxed ${allowAffiliates ? 'text-blue-700' : 'text-slate-500'}`}>
                        Ao marcar esta opção, seu produto vai para o **Mercado de Afiliação**.
                        Outros usuários poderão se afiliar e vender o seu produto em troca de uma comissão automática.
                      </p>
                    </div>
                  </div>

                  {allowAffiliates && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 p-4 bg-blue-50/50 border border-blue-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">Comissão do Afiliado (%)</h4>
                        <p className="text-xs text-slate-500 mt-1">Defina qual porcentagem do valor da venda o afiliado irá receber.</p>
                      </div>
                      <div className="relative w-full sm:w-48 flex-shrink-0">
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                        <input
                          type="text"
                          value={affiliateCommissionRate}
                          onChange={(e) => setAffiliateCommissionRate(e.target.value)}
                          placeholder="50"
                          className="w-full pr-10 pl-4 py-2.5 bg-white border border-blue-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm font-black focus:outline-none shadow-sm"
                        />
                      </div>
                    </motion.div>
                  )}
                </div>

              </div>
            </motion.div>
          )}


  </>;
}
