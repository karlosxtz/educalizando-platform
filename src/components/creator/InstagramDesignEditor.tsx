'use client';
import { useState } from 'react';
import { defaultInstagramDesign, type InstagramDesign } from '@/lib/instagram-design';

type Props = { value: InstagramDesign; onChange: (value: InstagramDesign) => void; productTitle: string; storeColor: string; onBackground: (url: string) => void; onLogo: (url: string) => void; onSave: () => void; disabled: boolean };
const input = 'mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900';
async function localImage(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8000000) throw new Error('Escolha JPG, PNG ou WebP de até 8 MB.');
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width > 16000 || bitmap.height > 16000) throw new Error('Use uma imagem com até 16 mil pixels por lado.');
    const scale = Math.min(1, 2048 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('O navegador não conseguiu abrir a imagem.');
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height); return canvas.toDataURL('image/png');
  } finally { bitmap.close(); }
}
export default function InstagramDesignEditor({ value, onChange, productTitle, storeColor, onBackground, onLogo, onSave, disabled }: Props) {
  const [fileError, setFileError] = useState('');
  const set = <K extends keyof InstagramDesign>(key: K, next: InstagramDesign[K]) => onChange({ ...value, [key]: next });
  const upload = async (file: File | undefined, kind: 'background' | 'logo') => {
    if (!file) return;
    try { setFileError(''); const url = await localImage(file); if (kind === 'background') { onBackground(url); set('background', 'photo'); } else onLogo(url); }
    catch (cause) { setFileError(cause instanceof Error ? cause.message : 'Não foi possível abrir esta imagem.'); }
  };
  return <fieldset disabled={disabled} className="space-y-5 rounded-2xl border border-violet-100 bg-violet-50/40 p-4 disabled:opacity-60">
    <legend className="px-2 text-lg font-bold text-violet-950">Personalize sua arte</legend>
    <p className="text-sm leading-6 text-slate-600">A prévia acompanha suas alterações. O preço começa oculto. Seus produtos e arquivos originais não são alterados.</p>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-bold text-slate-700">Modelo<select className={input} value={value.layout} onChange={e => set('layout', e.target.value as InstagramDesign['layout'])}><option value="classic">Vitrine clássica</option><option value="cover">Capa em destaque</option><option value="editorial">Editorial com faixa</option></select></label>
      <label className="text-sm font-bold text-slate-700">Fundo<select className={input} value={value.background} onChange={e => set('background', e.target.value as InstagramDesign['background'])}><option value="gradient">Degradê de duas cores</option><option value="solid">Cor única</option><option value="paper">Papel claro</option><option value="photo">Minha imagem</option></select></label>
    </div>
    <div className="grid grid-cols-3 gap-3">{([['primary', 'Cor principal'], ['secondary', 'Segunda cor'], ['textColor', 'Cor do texto']] as const).map(([key, label]) => <label key={key} className="text-xs font-bold text-slate-700">{label}<input aria-label={label} type="color" value={value[key]} onChange={e => set(key, e.target.value)} className="mt-2 h-11 w-full cursor-pointer rounded-lg border border-slate-200 bg-white p-1" /></label>)}</div>
    {value.background === 'paper' && <p className="text-xs text-slate-500">No papel claro, o texto usa tinta escura para manter a leitura.</p>}
    {value.background === 'photo' && <label className="block text-sm font-bold text-slate-700">Imagem de fundo<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => void upload(e.target.files?.[0], 'background')} className="mt-2 block w-full text-xs" /><span className="mt-2 block text-xs font-normal text-slate-500">A imagem recebe uma camada escura para facilitar a leitura. Até 8 MB; preparo local, sem upload.</span></label>}
    <label className="block text-sm font-bold text-slate-700">Título na arte<input maxLength={180} placeholder={productTitle} value={value.title} onChange={e => set('title', e.target.value)} className={input} /><span className="text-xs font-normal text-slate-500">Vazio usa o título original do produto.</span></label>
    <label className="block text-sm font-bold text-slate-700">Texto complementar<input maxLength={120} value={value.subtitle} onChange={e => set('subtitle', e.target.value)} placeholder="Destaque uma informação real do material" className={input} /></label>
    <label className="block text-sm font-bold text-slate-700">Chamada para ação<input maxLength={100} value={value.cta} onChange={e => set('cta', e.target.value)} className={input} /></label>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-bold text-slate-700">Fonte<select value={value.font} onChange={e => set('font', e.target.value as InstagramDesign['font'])} className={input}><option>Arial</option><option>Georgia</option><option>Verdana</option></select></label>
      <label className="text-sm font-bold text-slate-700">Alinhamento<select value={value.align} onChange={e => set('align', e.target.value as InstagramDesign['align'])} className={input}><option value="left">À esquerda</option><option value="center">Centralizado</option></select></label>
      <label className="text-sm font-bold text-slate-700">Tamanho do título: {value.titleSize}<input type="range" min={30} max={76} step={2} value={value.titleSize} onChange={e => set('titleSize', Number(e.target.value))} className="mt-3 w-full" /></label>
      <label className="text-sm font-bold text-slate-700">Enquadramento da capa<select value={value.fit} onChange={e => set('fit', e.target.value as InstagramDesign['fit'])} className={input}><option value="contain">Imagem inteira, sem cortar</option><option value="cover">Preencher com recorte central</option></select></label>
    </div>
    <div className="grid gap-3 sm:grid-cols-2">{([['showPrice', 'Mostrar preço na arte e legenda inicial'], ['showStore', 'Mostrar nome da loja'], ['showTitle', 'Mostrar título'], ['showLogo', 'Mostrar logo da loja'], ['showLink', 'Mostrar endereço da loja'], ['showQr', 'QR code para o produto']] as const).map(([key, label]) => <label key={key} className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={value[key]} onChange={e => set(key, e.target.checked)} />{label}</label>)}</div>
    {value.showLogo && <label className="block text-sm font-bold text-slate-700">Logo para esta arte (opcional)<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => void upload(e.target.files?.[0], 'logo')} className="mt-2 block w-full text-xs" /><span className="mt-2 block text-xs font-normal text-slate-500">Se não escolher, usamos a logo cadastrada na loja. Este arquivo fica no navegador.</span><button type="button" onClick={() => onLogo('')} className="mt-2 text-xs font-bold text-violet-800 underline">Usar logo cadastrada</button></label>}
    {fileError && <p role="alert" className="text-sm text-rose-700">{fileError}</p>}
    <div className="flex flex-wrap gap-3"><button type="button" onClick={onSave} className="min-h-11 rounded-xl bg-white px-4 text-sm font-bold text-violet-800 ring-1 ring-violet-200">Salvar meu estilo neste navegador</button><button type="button" onClick={() => { onChange(defaultInstagramDesign(storeColor)); onBackground(''); onLogo(''); }} className="min-h-11 px-2 text-sm font-bold text-slate-600">Restaurar padrão</button></div>
    <p className="text-xs leading-5 text-slate-500">O estilo é salvo por loja neste dispositivo. Textos do produto, fundo e logo enviados não são salvos como preferência.</p>
  </fieldset>;
}
