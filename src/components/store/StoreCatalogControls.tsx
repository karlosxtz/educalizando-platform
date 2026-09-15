'use client';

import { CalendarDays, GraduationCap, Search, SlidersHorizontal, Tags, X } from 'lucide-react';
import { Category, EducationLevel, StoreCollection } from '@/lib/types';
import CustomSelect, { CustomSelectOption } from '@/components/ui/CustomSelect';
import StoreCollections from '@/components/store/StoreCollections';
import { SCHOOL_CALENDAR_TAGS } from '@/lib/school-calendar';

interface StoreCatalogControlsProps {
  categories: Category[];
  educationLevels: EducationLevel[];
  searchFilter: string;
  selectedCategory: string;
  selectedEducation: string;
  selectedCollection: StoreCollection;
  setSearchFilter: (value: string) => void;
  setSelectedCategory: (value: string) => void;
  setSelectedEducation: (value: string) => void;
  setSelectedCollection: (value: StoreCollection) => void;
  variant?: 'default' | 'minimalist' | 'netflix' | 'linktree' | 'pinterest';
}

const collectionTitles: Record<StoreCollection, string> = {
  all: 'Encontre o material ideal',
  popular: 'Materiais em alta',
  new: 'Novidades da loja',
  plr: 'Licenças PLR',
};

export default function StoreCatalogControls({
  categories,
  educationLevels,
  searchFilter,
  selectedCategory,
  selectedEducation,
  selectedCollection,
  setSearchFilter,
  setSelectedCategory,
  setSelectedEducation,
  setSelectedCollection,
  variant = 'default',
}: StoreCatalogControlsProps) {
  const categoryOptions: CustomSelectOption[] = [
    { value: 'all', label: 'Todas as categorias' },
    ...categories.map((category) => ({ value: category.id, label: category.nome })),
  ];
  const educationOptions: CustomSelectOption[] = [
    { value: 'all', label: 'Todos os níveis' },
    ...educationLevels.map((level) => ({ value: level.id, label: level.nome })),
  ];
  const dateOptions: CustomSelectOption[] = [
    { value: 'all', label: 'Todas as datas e temas' },
    ...SCHOOL_CALENDAR_TAGS.map((tag) => ({ value: tag, label: tag })),
  ];
  const hasFilters = searchFilter || selectedCategory !== 'all' || selectedEducation !== 'all' || selectedCollection !== 'all';
  const isDark = variant === 'netflix';
  const hasCategoryFilter = categories.length > 1;
  const hasEducationFilter = educationLevels.length > 1;
  const dateFilterValue = SCHOOL_CALENDAR_TAGS.includes(searchFilter as typeof SCHOOL_CALENDAR_TAGS[number]) ? searchFilter : 'all';
  const controlColumns = hasCategoryFilter && hasEducationFilter
    ? 'sm:grid-cols-2 xl:grid-cols-[minmax(0,1.25fr)_minmax(170px,.75fr)_minmax(170px,.75fr)_minmax(190px,.85fr)]'
    : hasCategoryFilter || hasEducationFilter
      ? 'sm:grid-cols-2 lg:grid-cols-[minmax(0,1.2fr)_minmax(200px,.8fr)_minmax(210px,.85fr)]'
      : 'sm:grid-cols-2 lg:grid-cols-[minmax(0,1.2fr)_minmax(220px,.8fr)]';

  return (
    <section className={`border-y p-4 sm:p-6 shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white/95 border-slate-200'}`} aria-label="Explorar materiais">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className={`text-[10px] font-black uppercase tracking-[0.16em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Explorar materiais</span>
            <h2 className={`mt-1 text-lg sm:text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{collectionTitles[selectedCollection]}</h2>
          </div>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setSearchFilter('');
                setSelectedCategory('all');
                setSelectedEducation('all');
                setSelectedCollection('all');
              }}
              className={`mt-1 inline-flex min-h-10 items-center justify-center gap-1.5 self-start rounded-xl px-3 text-xs font-bold transition-colors sm:self-auto ${isDark ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              <X className="h-3.5 w-3.5" /> Limpar filtros
            </button>
          )}
        </div>

        <StoreCollections active={selectedCollection} onChange={setSelectedCollection} variant={variant} />

        <div className={`grid gap-2 rounded-2xl p-2 ${controlColumns} ${isDark ? 'bg-slate-950/70' : 'bg-slate-50 border border-slate-100'}`}>
          <label className="relative block">
            <span className="sr-only">Buscar material</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Busque por material, tema ou assunto"
              value={searchFilter}
              onChange={(event) => setSearchFilter(event.target.value)}
              className={`min-h-11 w-full rounded-xl border px-10 pr-4 text-sm font-medium outline-none transition-shadow focus:ring-2 focus:ring-blue-500/25 ${isDark ? 'border-slate-800 bg-slate-900 text-white placeholder:text-slate-500' : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400'}`}
            />
          </label>
          {hasCategoryFilter && <div className="min-w-0"><CustomSelect options={categoryOptions} value={selectedCategory} onChange={setSelectedCategory} icon={<Tags className="h-3.5 w-3.5" />} /></div>}
          {hasEducationFilter && <div className="min-w-0"><CustomSelect options={educationOptions} value={selectedEducation} onChange={setSelectedEducation} icon={<GraduationCap className="h-3.5 w-3.5" />} /></div>}
          <div className="min-w-0"><CustomSelect options={dateOptions} value={dateFilterValue} onChange={(value) => setSearchFilter(value === 'all' ? '' : value)} icon={<CalendarDays className="h-3.5 w-3.5" />} /></div>
        </div>

        <p className={`flex items-center gap-1.5 text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          <SlidersHorizontal className="h-3.5 w-3.5" /> Use as coleções e filtros para descobrir materiais com mais rapidez.
        </p>
      </div>
    </section>
  );
}
