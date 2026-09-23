import { BookOpen, CalendarDays, Heart, Leaf, Landmark, Palette, ShieldCheck, Sparkles } from 'lucide-react';
import type { SchoolCalendarIcon } from '@/lib/school-calendar';

const icons = { book: BookOpen, calendar: CalendarDays, heart: Heart, leaf: Leaf, landmark: Landmark, palette: Palette, shield: ShieldCheck, sparkles: Sparkles } as const;

export const calendarKindStyles: Record<string, { chip: string; dot: string; icon: string }> = {
  'data comemorativa': { chip: 'bg-amber-50 text-amber-800 ring-amber-200', dot: 'bg-amber-500', icon: 'bg-amber-100 text-amber-800' },
  'data pedagógica': { chip: 'bg-blue-50 text-blue-800 ring-blue-200', dot: 'bg-blue-600', icon: 'bg-blue-100 text-blue-800' },
  ambiental: { chip: 'bg-emerald-50 text-emerald-800 ring-emerald-200', dot: 'bg-emerald-600', icon: 'bg-emerald-100 text-emerald-800' },
  cultural: { chip: 'bg-fuchsia-50 text-fuchsia-800 ring-fuchsia-200', dot: 'bg-fuchsia-600', icon: 'bg-fuchsia-100 text-fuchsia-800' },
  cidadania: { chip: 'bg-violet-50 text-violet-800 ring-violet-200', dot: 'bg-violet-600', icon: 'bg-violet-100 text-violet-800' },
  'saúde e bem-estar': { chip: 'bg-rose-50 text-rose-800 ring-rose-200', dot: 'bg-rose-600', icon: 'bg-rose-100 text-rose-800' },
  literatura: { chip: 'bg-orange-50 text-orange-800 ring-orange-200', dot: 'bg-orange-600', icon: 'bg-orange-100 text-orange-800' },
  'diversidade e direitos humanos': { chip: 'bg-indigo-50 text-indigo-800 ring-indigo-200', dot: 'bg-indigo-600', icon: 'bg-indigo-100 text-indigo-800' },
  segurança: { chip: 'bg-cyan-50 text-cyan-800 ring-cyan-200', dot: 'bg-cyan-600', icon: 'bg-cyan-100 text-cyan-800' },
  'campanha informativa': { chip: 'bg-slate-100 text-slate-800 ring-slate-200', dot: 'bg-slate-600', icon: 'bg-slate-200 text-slate-800' },
};

export default function CalendarEventIcon({ icon, className = 'h-5 w-5' }: { icon: SchoolCalendarIcon; className?: string }) {
  const Icon = icons[icon];
  return <Icon aria-hidden="true" className={className} />;
}
