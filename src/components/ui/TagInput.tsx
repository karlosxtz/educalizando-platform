'use client';

import { useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { normalizeProductTags } from '@/lib/product-tags';

export default function TagInput({
  value,
  onChange,
  maxTags = 10,
  placeholder,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState('');

  const commit = (input = draft) => {
    const next = normalizeProductTags([...value, input], maxTags);
    onChange(next);
    setDraft('');
  };

  const handleChange = (input: string) => {
    if (/[,;\n\t\s]$/.test(input)) {
      commit(input);
      return;
    }
    setDraft(input);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === 'Tab' || event.key === ',') {
      if (!draft.trim()) return;
      event.preventDefault();
      commit();
      return;
    }
    if (event.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1));
  };

  return (
    <div className="mt-3 rounded-xl border border-violet-200 bg-white p-2.5 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-100">
      {value.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2" aria-label="Tags selecionadas">
          {value.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => onChange(value.filter(item => item !== tag))}
              className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1.5 text-[11px] font-bold text-violet-800 transition hover:bg-violet-200"
              title={`Remover ${tag}`}
            >
              {tag}<X className="h-3 w-3" />
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <input
          value={draft}
          onChange={event => handleChange(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => draft.trim() && commit()}
          disabled={value.length >= maxTags}
          placeholder={value.length >= maxTags ? 'Limite de tags atingido' : placeholder}
          className="min-w-0 flex-1 bg-transparent px-1 py-1.5 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
        />
        <span className="shrink-0 text-[10px] font-black text-violet-600">{value.length}/{maxTags}</span>
      </div>
    </div>
  );
}
