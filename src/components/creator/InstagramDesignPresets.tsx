'use client';
import { Check, Image as ImageIcon } from 'lucide-react';
import { instagramDesignPreset, type InstagramDesign } from '@/lib/instagram-design';

const MODELS = [
  { id: 'image', name: 'Somente imagem', caption: 'Sua foto como protagonista', color: '#e9e5e0' },
  { id: 'minimal', name: 'Minimal', caption: 'Leve, amplo e sem excessos', color: '#faf8f4' },
  { id: 'cover', name: 'Capa em destaque', caption: 'Imagem ampla e texto discreto', color: '#d9dee5' },
  { id: 'editorial', name: 'Editorial', caption: 'Tipografia com personalidade', color: '#f2eee7' },
  { id: 'spotlight', name: 'Imersivo', caption: 'Foto de fundo com sobreposição', color: '#242b3a' },
  { id: 'classic', name: 'Vitrine', caption: 'Identidade e informações', color: '#302c48' },
] as const;
export default function InstagramDesignPresets({ value, onChange, thumbnail }: { value: InstagramDesign; onChange: (next: InstagramDesign) => void; thumbnail?: string | null }) {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" role="group" aria-label="Modelos da arte">{MODELS.map(model => {
    const selected = value.layout === model.id, full = ['image', 'cover', 'spotlight'].includes(model.id);
    return <button key={model.id} type="button" aria-pressed={selected} onClick={() => onChange(instagramDesignPreset(model.id, value))} className={'group relative overflow-hidden rounded-2xl border p-2 text-left transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 ' + (selected ? 'border-violet-500 bg-violet-50 shadow-sm ring-1 ring-violet-500' : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md')}>
      <div aria-hidden="true" className="relative flex aspect-[4/5] flex-col overflow-hidden rounded-xl" style={{ background: model.color }}>
        {model.id !== 'image' && <div className={'z-10 px-3 pt-3 ' + (full ? 'absolute inset-x-0 top-0' : '')}><div className={'h-1 w-8 rounded-full ' + (model.id === 'classic' || model.id === 'spotlight' ? 'bg-white/60' : 'bg-slate-400/70')} /><div className={'mt-2 h-2 w-3/4 rounded-full ' + (model.id === 'classic' || model.id === 'spotlight' ? 'bg-white/90' : 'bg-slate-700/80')} /></div>}
        <div className={'relative flex min-h-0 flex-1 items-center justify-center overflow-hidden ' + (full ? '' : 'mx-3 my-3 rounded-lg')}>
          {thumbnail ? <img src={thumbnail} alt="" width={240} height={300} className={'h-full w-full ' + (model.id === 'image' ? 'object-contain' : 'object-cover')} loading="lazy" /> : <ImageIcon className="h-10 w-10 text-slate-400" strokeWidth={1} />}
          {(model.id === 'spotlight' || model.id === 'cover') && <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/20" />}
          {(model.id === 'spotlight' || model.id === 'cover') && <div className="absolute inset-x-3 bottom-4 h-2 w-2/3 rounded-full bg-white/90" />}
        </div>
        {!full && <div className="px-3 pb-3"><div className={'h-1 w-2/3 rounded-full ' + (model.id === 'classic' ? 'bg-white/70' : 'bg-slate-500/50')} /></div>}
        {selected && <span className="absolute right-2 top-2 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-white shadow"><Check className="h-3.5 w-3.5" /></span>}
      </div>
      <span className="mt-3 block text-xs font-bold text-slate-900">{model.name}</span><span className="mb-1 mt-1 block text-[10px] leading-4 text-slate-500">{model.caption}</span>
    </button>;
  })}</div>;
}
