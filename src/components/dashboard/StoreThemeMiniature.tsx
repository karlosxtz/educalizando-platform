import { storeTheme, storeThemeColors } from '@/lib/store-themes';
/** Schematic design preview, not invented products, prices or reviews. */
export default function StoreThemeMiniature({ theme: value, primary }: { theme: string; primary?: string }) {
  const theme = storeTheme(value), colors = storeThemeColors(value, primary), dark = theme.id === 'noite';
  const card = dark ? '#263247' : '#ffffff', ink = dark ? '#b7c8e1' : '#9ca8b7';
  const item = (key: number) => <div key={key} className={'min-w-0 rounded-md p-1.5 ' + (theme.id === 'estudio' ? 'flex gap-2' : '')} style={{ background: card, border: '1px solid ' + (dark ? '#3b4961' : '#e1e4eb') }}><div className={theme.id === 'estudio' ? 'h-7 w-6 shrink-0 rounded-sm' : 'h-9 rounded-sm'} style={{ background: key % 2 ? colors.accent + '25' : dark ? '#3b4961' : '#eae7e2' }} /><div className="min-w-0 flex-1"><div className="mt-2 h-1 w-4/5 rounded" style={{ background: ink }} /><div className="mt-1 h-1 w-1/2 rounded" style={{ background: ink, opacity: .4 }} /></div></div>;
  return <div aria-hidden="true" className="h-36 overflow-hidden rounded-xl p-3" style={{ background: theme.background }}>
    <div className="mb-2 h-1 w-10 rounded" style={{ background: colors.accent }} />
    <div className={theme.id === 'estudio' ? 'grid grid-cols-[38px_1fr] gap-2' : ''}>
      <div className={'mb-2 overflow-hidden p-2 ' + (theme.id === 'editorial' ? 'border-y border-stone-400 text-center' : theme.id === 'brincar' ? 'rounded-2xl border-2 border-violet-300' : 'rounded-md')} style={{ background: dark ? '#1e293b' : colors.accent + '18' }}>
        <div className={'mb-1.5 h-3 w-3 rounded-full ' + (theme.id === 'editorial' ? 'mx-auto' : '')} style={{ background: colors.accent }} /><div className={'h-1.5 w-3/4 rounded ' + (theme.id === 'editorial' ? 'mx-auto' : '')} style={{ background: ink }} />
        {theme.id === 'aurora' && <div className="float-right -mt-6 h-7 w-12 rounded-tl-xl rounded-br-xl" style={{ background: colors.accent + '40' }} />}
      </div>
      <div className={'grid gap-1.5 ' + (theme.id === 'estudio' ? 'grid-cols-1' : theme.id === 'editorial' ? 'grid-cols-2' : 'grid-cols-3')}>{[0, 1, 2].map(item)}</div>
    </div>
  </div>;
}
