import Link from 'next/link';
import { CALENDAR_EDITORIAL } from '@/lib/calendar-editorial';

export default function CalendarPlanningContent({ slug }: { slug: string }) {
  const editorial = CALENDAR_EDITORIAL[slug];
  if (!editorial) return null;
  return <section className="mt-7 grid gap-5 sm:grid-cols-2" aria-label="Planejamento para a data">
    {editorial.sections.map(section => <div key={section.title} className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
      <h2 className="text-xl font-black text-slate-950">{section.title}</h2>
      <p className="mt-4 leading-7 text-slate-600">{section.text}</p>
    </div>)}
    <nav aria-label="Continue o planejamento" className="flex flex-wrap gap-3 sm:col-span-2">
      {editorial.related.map(link => <Link prefetch={false} key={link.href} href={link.href} className="rounded-xl border border-blue-100 bg-white px-4 py-3 font-bold text-blue-800 hover:bg-blue-50">{link.label}</Link>)}
    </nav>
  </section>;
}
