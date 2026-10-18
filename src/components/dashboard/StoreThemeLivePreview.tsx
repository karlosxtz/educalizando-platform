'use client';
import { useState } from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import CatalogImage from '@/components/ui/CatalogImage';
import { storeTheme, storeThemeColors } from '@/lib/store-themes';
import StoreThemeMiniature from './StoreThemeMiniature';

type Props = { theme: string; primary: string; banner?: string; logo?: string; name?: string; description?: string };
export default function StoreThemeLivePreview({ theme: id, primary, banner, logo, name, description }: Props) {
  const [mobile, setMobile] = useState(false), theme = storeTheme(id), dark = id === 'noite';
  const palette = storeThemeColors(id, primary);
  return <div className="sticky top-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 p-3"><strong className="text-xs text-slate-700">Prévia · {theme.name}</strong><div className="flex gap-1" role="group" aria-label="Formato da prévia">{[false, true].map(value => <button type="button" key={String(value)} aria-pressed={mobile === value} aria-label={value ? 'Prévia no celular' : 'Prévia no computador'} onClick={() => setMobile(value)} className={'flex h-9 w-9 items-center justify-center rounded-lg ' + (mobile === value ? 'bg-violet-100 text-violet-800' : 'text-slate-400 hover:bg-slate-50')}>{value ? <Smartphone className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}</button>)}</div></div>
    <div className="bg-slate-100 p-3"><div className={'mx-auto overflow-hidden rounded-xl border border-slate-200 transition-[max-width] ' + (mobile ? 'max-w-[260px]' : 'max-w-full')} style={{ background: theme.background, color: dark ? '#f1f5f9' : '#1e293b' }}>
      <div className={'p-4 ' + (id === 'editorial' ? 'text-center font-serif' : '')}>
        {banner && <CatalogImage src={banner} thumbnail={false} alt="Seu banner na prévia" width={600} height={200} className={'mb-4 w-full object-cover ' + (id === 'brincar' ? 'h-24 rounded-t-full' : 'h-20 rounded-lg')} />}
        <div className={'flex gap-3 ' + (id === 'estudio' || id === 'editorial' ? 'flex-col ' + (id === 'editorial' ? 'items-center' : '') : 'items-center')}>
          {logo ? <CatalogImage src={logo} alt="Seu logo na prévia" width={64} height={64} className="h-12 w-12 rounded-xl bg-white object-contain p-1" /> : <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-bold" style={{ background: palette.accent, color: palette.foreground }}>{(name || 'L').charAt(0)}</span>}<h3 className={'min-w-0 break-words text-lg ' + (id === 'editorial' ? 'text-2xl font-medium' : 'font-extrabold')}>{name || 'Nome da sua loja'}</h3>
        </div>
        <p className="mt-3 line-clamp-3 break-words text-xs leading-6 opacity-75">{description || 'Sua apresentação aparecerá aqui.'}</p><span className="mt-3 inline-flex min-h-8 items-center rounded-lg px-3 text-[10px] font-bold" style={{ background: palette.accent, color: palette.foreground }}>Explorar materiais</span>
      </div>
      <StoreThemeMiniature theme={id} primary={primary} />
      <p className="p-3 text-center text-[10px] leading-5 opacity-70">Representação do layout. Seu catálogo real aparecerá na loja.</p>
    </div></div><p className="p-3 text-[11px] leading-5 text-slate-500">O tema só será publicado depois de salvar as configurações.</p>
  </div>;
}
