import { FileText, Layers, Users, Palette, Play, ExternalLink } from 'lucide-react';
import type { ReactNode } from 'react';
import type { EducationLevel, Product, ProductType } from '@/lib/types';
import { productSampleLink, productSelectionFacts } from '@/lib/product-selection';
import { productPresentationVideo } from '@/lib/presentation-video';

type Props = { product: Product; educationLevel?: EducationLevel | null; hasConfiguredDelivery: boolean; getTipoIcon?: (type: ProductType) => ReactNode; plr?: boolean };
export default function ProductQuickSpecs({ product, educationLevel, hasConfiguredDelivery, plr = false }: Props) {
  const facts = productSelectionFacts(product, plr);
  if (!plr && educationLevel) facts.push({ label: 'Nível de ensino', value: educationLevel.nome });
  const sample = plr ? null : productSampleLink(product.preview_url);
  const video = plr ? null : productPresentationVideo(product);
  const icons = [FileText, Layers, Users, Palette];
  return <section aria-label="O que você vai receber" className="space-y-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
    <h2 className="text-sm font-black text-slate-950">O que você vai receber</h2>
    <dl className="grid grid-cols-2 gap-3">{facts.map((fact, index) => { const Icon = icons[index % icons.length]; return <div key={fact.label} className="min-w-0 rounded-xl border border-white bg-white/80 p-3"><dt className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500"><Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />{fact.label}</dt><dd className="mt-1 break-words text-xs font-bold leading-5 text-slate-900">{fact.value}</dd></div>; })}</dl>
    {hasConfiguredDelivery && <p className="text-xs leading-5 text-slate-600">Arquivo ou link de entrega disponibilizado conforme as condições da modalidade escolhida, após a confirmação da compra.</p>}
    {(sample || video) && <div className="flex flex-wrap gap-2">{sample && <a href={sample} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-blue-200 bg-white px-3 text-xs font-bold text-blue-900">Ver prévia<ExternalLink aria-hidden="true" className="h-3.5 w-3.5" /></a>}{video && <a href={video.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-blue-200 bg-white px-3 text-xs font-bold text-blue-900"><Play aria-hidden="true" className="h-3.5 w-3.5" />Assistir demonstração<span className="sr-only"> em nova aba no {video.provider === 'youtube' ? 'YouTube' : 'Instagram'}</span></a>}</div>}
    <p className="text-[11px] leading-5 text-slate-500">Informações fornecidas pelo criador. Confira a descrição e as condições de uso antes de escolher.</p>
  </section>;
}
