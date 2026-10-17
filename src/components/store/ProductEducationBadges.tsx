import { GraduationCap } from 'lucide-react';
import { productEducationLevels } from '@/lib/product-education-levels';
import type { EducationLevel, Product } from '@/lib/types';

export default function ProductEducationBadges({ product, levels }: { product: Product; levels: EducationLevel[] }) {
  return productEducationLevels(product, levels).map(level => <span key={level.id} className="inline-flex max-w-full items-start gap-1 rounded-md border border-indigo-100/80 bg-indigo-50/80 px-2 py-0.5 text-[10px] font-extrabold text-indigo-700"><GraduationCap aria-hidden="true" className="mt-0.5 h-3 w-3 shrink-0" /><span className="min-w-0 whitespace-normal break-words">{level.nome}</span></span>);
}
