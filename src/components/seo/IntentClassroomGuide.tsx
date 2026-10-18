import { INTENT_CLASSROOM_EXAMPLES } from '@/lib/intent-classroom-examples';

export default function IntentClassroomGuide({ slug }: { slug: string }) {
  const example = INTENT_CLASSROOM_EXAMPLES[slug];
  if (!example) return null;
  return <section aria-label="Exemplo de planejamento para adaptar" className="mt-12 rounded-3xl border border-teal-100 bg-teal-50/60 p-5 sm:p-8">
    <p className="text-xs font-bold uppercase tracking-widest text-teal-800">Orientações da plataforma</p>
    <h2 className="mt-2 text-2xl font-black text-slate-950">Exemplo de uso para planejar sua aula</h2>
    <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">Esta é uma sugestão de planejamento para adaptar à sua turma. Ela não descreve os arquivos de um produto específico; confira o anúncio e as condições de cada material.</p>
    <h3 className="mt-6 text-lg font-bold text-slate-900">{example.title}</h3>
    <ol className="mt-4 grid gap-4 lg:grid-cols-3">{example.steps.map((step, index) => <li key={step} className="rounded-2xl border border-teal-100 bg-white p-5">
      <span aria-hidden="true" className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-teal-800 text-sm font-bold text-white">{index + 1}</span>
      <p className="mt-3 text-sm leading-7 text-slate-700">{step}</p>
    </li>)}</ol>
    <p className="mt-5 text-sm leading-7 text-slate-700"><strong className="font-bold text-teal-900">O que observar: </strong>{example.observation}</p>
  </section>;
}
