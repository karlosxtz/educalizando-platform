import { FileText, GraduationCap, UserCheck, Zap } from 'lucide-react';
import type { ReactNode } from 'react';
import type { EducationLevel, Product, ProductType } from '@/lib/types';
type Props = { product: Product; educationLevel?: EducationLevel | null; hasConfiguredDelivery: boolean; getTipoIcon: (type: ProductType) => ReactNode };
export default function ProductQuickSpecs({ product, educationLevel, hasConfiguredDelivery, getTipoIcon }: Props) { return <>
              {/* Quick Specs Block (Alta Conversão) */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 border border-slate-200 text-slate-600 shadow-sm">
                    {getTipoIcon(product.tipo)}
                  </div>
                  <div className="flex flex-col pt-0.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Formato</span>
                    <span className="text-sm font-bold text-slate-800">{product.tipo.toUpperCase()}</span>
                  </div>
                </div>

                {educationLevel && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 border border-slate-200 text-slate-600 shadow-sm">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col pt-0.5">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Público</span>
                      <span className="text-sm font-bold text-slate-800">{educationLevel.nome}</span>
                    </div>
                  </div>
                )}

                {product.age_range && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0 border border-indigo-100 text-indigo-600 shadow-sm"><UserCheck className="w-4 h-4" /></div>
                    <div className="flex flex-col pt-0.5"><span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Faixa etária</span><span className="text-sm font-bold text-slate-800">{product.age_range}</span></div>
                  </div>
                )}

                {product.page_count && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 border border-blue-100 text-blue-600 shadow-sm"><FileText className="w-4 h-4" /></div>
                    <div className="flex flex-col pt-0.5"><span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">{product.tipo === 'video' ? 'Aulas / telas' : 'Quantidade'}</span><span className="text-sm font-bold text-slate-800">{product.page_count} {product.tipo === 'video' ? 'itens' : product.page_count === 1 ? 'página' : 'páginas'}</span></div>
                  </div>
                )}

                {hasConfiguredDelivery && <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 border border-emerald-100 text-emerald-600 shadow-sm">
                    <Zap className="w-4 h-4 fill-emerald-600" />
                  </div>
                  <div className="flex flex-col pt-0.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Entrega</span>
                    <span className="text-sm font-bold text-slate-800">Disponível após a confirmação do pagamento</span>
                  </div>
                </div>}
              </div>
</>; }
