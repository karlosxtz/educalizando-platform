'use client';

import { useMemo } from 'react';

import {
  formatRecommendedAges,
  parseRecommendedAges,
  RECOMMENDED_AGE_OPTIONS
} from '@/lib/age-range';

interface AgeRangePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function AgeRangePicker({ value, onChange, className = '' }: AgeRangePickerProps) {
  const selectedAges = useMemo(() => parseRecommendedAges(value), [value]);
  const selectedSet = useMemo(() => new Set(selectedAges), [selectedAges]);

  const toggleAge = (age: number) => {
    const nextAges = selectedSet.has(age)
      ? selectedAges.filter((selectedAge) => selectedAge !== age)
      : [...selectedAges, age];

    onChange(formatRecommendedAges(nextAges));
  };

  return (
    <fieldset className={`rounded-2xl border border-slate-200 bg-slate-50/70 p-4 ${className}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <legend className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Faixa etária recomendada
          </legend>
          <p className="mt-1 text-xs text-slate-500">
            Marque todas as idades indicadas para este material, de 0 a 80 anos.
          </p>
        </div>
        {selectedAges.length > 0 && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="self-start text-xs font-bold text-rose-600 transition-colors hover:text-rose-800"
          >
            Limpar seleção
          </button>
        )}
      </div>

      <div
        className="mt-3 grid max-h-48 grid-cols-6 gap-2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-9"
        aria-label="Selecione as idades recomendadas"
      >
        {RECOMMENDED_AGE_OPTIONS.map((age) => {
          const selected = selectedSet.has(age);
          return (
            <button
              key={age}
              type="button"
              aria-pressed={selected}
              onClick={() => toggleAge(age)}
              className={`min-h-9 rounded-lg border text-xs font-black transition-colors ${
                selected
                  ? 'border-blue-700 bg-blue-700 text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-blue-400 hover:bg-blue-50'
              }`}
            >
              {age}
            </button>
          );
        })}
      </div>

      <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3" aria-live="polite">
        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Como aparecerá no produto</span>
        <p className="mt-0.5 text-sm font-black text-blue-950">
          {value || 'Nenhuma idade selecionada'}
        </p>
      </div>
    </fieldset>
  );
}
