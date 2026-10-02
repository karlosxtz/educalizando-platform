'use client';

import { Check,ChevronDown,X } from 'lucide-react';
import { useEffect,useRef,useState,type ReactNode } from 'react';

export type LimitedMultiSelectOption = { value: string; label: string };

export default function LimitedMultiSelect({
  options,
  values,
  onChange,
  placeholder,
  maxSelections = 5,
  icon,
}: {
  options: LimitedMultiSelectOption[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  maxSelections?: number;
  icon?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = options.filter(option => values.includes(option.value));

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const toggle = (value: string) => {
    if (values.includes(value)) {
      onChange(values.filter(item => item !== value));
      return;
    }
    if (values.length < maxSelections) onChange([...values, value]);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(current => !current)}
        aria-expanded={open}
        className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-left text-xs font-medium text-slate-900 shadow-xs transition hover:border-slate-300 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
      >
        <span className="flex min-w-0 items-center gap-2">
          {icon && <span className="shrink-0 text-blue-600">{icon}</span>}
          <span className={selected.length ? 'truncate font-bold text-slate-800' : 'truncate text-slate-500'}>
            {selected.length ? `${selected.length} selecionado(s)` : placeholder}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2 text-[10px] font-black text-slate-500">
          {values.length}/{maxSelections}
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180 text-blue-600' : ''}`} />
        </span>
      </button>

      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selected.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => toggle(option.value)}
              className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1.5 text-[11px] font-bold text-blue-700 ring-1 ring-blue-100"
              title={`Remover ${option.label}`}
            >
              {option.label}<X className="h-3 w-3" />
            </button>
          ))}
        </div>
      )}

      {open && (
        <div className="absolute left-0 z-50 mt-1.5 max-h-72 w-full min-w-[240px] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
          <p className="px-2 pb-2 text-[10px] font-bold text-slate-500">Selecione até {maxSelections} opções.</p>
          {options.map(option => {
            const checked = values.includes(option.value);
            const disabled = !checked && values.length >= maxSelections;
            return (
              <button
                key={option.value}
                type="button"
                disabled={disabled}
                onClick={() => toggle(option.value)}
                className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-bold transition ${checked ? 'bg-blue-50 text-blue-700' : disabled ? 'cursor-not-allowed text-slate-300' : 'text-slate-700 hover:bg-slate-50'}`}
              >
                <span>{option.label}</span>
                <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border ${checked ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'}`}>
                  {checked && <Check className="h-3.5 w-3.5" />}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
