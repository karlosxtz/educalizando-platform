'use client';

import { MessageCircle,Sparkles } from 'lucide-react';

const InstagramIcon = ({ className }: { className?: string }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="18" cy="6" r="1" fill="currentColor" /></svg>;

interface StoreLivePreviewProps {
  layoutTheme?: string;
  bannerUrl?: string;
  logoUrl?: string;
  primaryColor?: string;
  storeName?: string;
  slug?: string;
  description?: string;
  whatsapp?: string;
  instagram?: string;
  buttonRadius?: string;
  variant?: 'store' | 'affiliate';
}

export default function StoreLivePreview({ layoutTheme = 'default', bannerUrl, logoUrl, primaryColor = '#2563eb', storeName, slug, description, whatsapp, instagram, buttonRadius = 'rounded-xl', variant = 'store' }: StoreLivePreviewProps) {
  const affiliate = variant === 'affiliate';
  return <div className="space-y-4 lg:col-span-5"><div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500"><Sparkles className="h-4 w-4 text-blue-600" /><span>Preview em Tempo Real da Sua {affiliate ? 'Vitrine' : 'Loja'}</span></div><div className={`sticky top-6 relative space-y-4 overflow-hidden rounded-2xl border shadow-lg ${layoutTheme === 'netflix' ? 'border-slate-700 bg-slate-950 text-white' : layoutTheme === 'pinterest' ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-white'}`}>
    <div className="absolute right-3 top-3 z-20 rounded-full bg-slate-950/75 px-2.5 py-1 text-[10px] font-black text-white">Prévia: padrão</div><div className="relative h-32 overflow-hidden bg-slate-800">{bannerUrl ? <img src={bannerUrl} alt="Banner Preview" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center bg-gradient-to-r from-slate-900 to-indigo-950 text-xs font-bold text-slate-400">Banner da Loja</div>}</div>
    <div className="relative -mt-12 space-y-3 px-6 pb-6 pt-0"><div className="h-20 w-20 overflow-hidden rounded-full border-4 border-white bg-white p-1 shadow-md">{logoUrl ? <img src={logoUrl} alt="Logo Preview" className="h-full w-full rounded-full object-cover" /> : <div className="flex h-full w-full items-center justify-center rounded-full text-2xl font-black text-white" style={{ backgroundColor: primaryColor }}>{(storeName || 'L').charAt(0).toUpperCase()}</div>}</div><div><h3 className="text-lg font-black text-slate-900">{storeName || `Nome da Sua ${affiliate ? 'Vitrine' : 'Loja'}`}</h3><p className="font-mono text-xs font-bold text-blue-600">educalizando.com.br/{affiliate ? 'afiliado' : 'loja'}/{slug || (affiliate ? 'sua-vitrine' : 'sua-loja')}</p><p className="mt-1 line-clamp-2 text-xs font-medium text-slate-500">{description || `Sua bio e apresentação oficial aparecerão aqui para os seus ${affiliate ? 'compradores' : 'clientes'}.`}</p>{(whatsapp || instagram) && <div className="mt-3 flex items-center gap-2">{instagram && <div className="flex items-center justify-center rounded-full border border-slate-200 bg-white p-1.5 text-slate-400 shadow-sm"><InstagramIcon className="h-4 w-4" /></div>}{whatsapp && <div className="flex items-center gap-1.5 rounded-full bg-[#25D366] px-3 py-1.5 text-[10px] font-bold text-white shadow-sm"><MessageCircle className="h-3 w-3 fill-white" />WhatsApp</div>}</div>}</div>{!affiliate && <><div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs"><span className="font-medium text-slate-400">Cor de Destaque:</span><span className={`${buttonRadius} px-3 py-1 text-[10px] font-extrabold uppercase text-white`} style={{ backgroundColor: primaryColor }}>Botão de Compra</span></div><div className={`grid gap-2 ${layoutTheme === 'linktree' ? 'grid-cols-1' : 'grid-cols-2'}`}><button type="button" className={`${buttonRadius} min-h-10 bg-slate-100 px-3 text-xs font-black text-slate-700`}>Adicionar</button><button type="button" className={`${buttonRadius} min-h-10 px-3 text-xs font-black text-white`} style={{ backgroundColor: primaryColor }}>Comprar</button></div></>}</div>{whatsapp && <div className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366] shadow-md"><MessageCircle className="h-5 w-5 fill-white text-white" /></div>}</div></div>;
}
