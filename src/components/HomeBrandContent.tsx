import Link from 'next/link';
import { HOME_FAQ } from '@/lib/home-content';

export function HomeIntroduction() {
  return <section className="mx-auto w-full max-w-6xl px-4 py-9 sm:px-6 sm:py-14" aria-labelledby="home-title">
    <p className="text-sm font-bold text-blue-800">Plataforma para educadores e criadores</p>
    <h1 id="home-title" className="mt-3 max-w-4xl text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">Educalizando: materiais didáticos digitais para suas aulas</h1>
    <p className="mt-5 max-w-3xl text-base leading-7 text-slate-700">Encontre atividades, apostilas, jogos e recursos pedagógicos em lojas de educadores. Compare as propostas, confira o formato e a licença de cada material e escolha o que faz sentido para a sua turma.</p>
    <p className="mt-3 max-w-3xl text-base leading-7 text-slate-700">Você cria materiais didáticos? A Educalizando permite organizar seu catálogo em uma loja própria e disponibilizar os arquivos digitais aos compradores após a confirmação do pagamento.</p>
    <div className="mt-6 flex flex-wrap gap-3">
      <Link href="/materiais-didaticos" className="rounded-xl bg-blue-900 px-5 py-3 font-bold text-white">Explorar materiais didáticos</Link>
      <Link href="/lojas" className="rounded-xl border border-blue-200 px-5 py-3 font-bold text-blue-900">Conhecer as lojas</Link>
    </div>
  </section>;
}

export function HomeFaq() {
  return <section aria-labelledby="home-faq" className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
    <h2 id="home-faq" className="text-2xl font-black text-slate-950 sm:text-3xl">Dúvidas sobre a Educalizando</h2>
    <div className="mt-6 space-y-3">{HOME_FAQ.map(item => <details key={item.question} className="rounded-2xl border border-slate-200 bg-white p-5">
      <summary className="cursor-pointer font-bold text-blue-950">{item.question}</summary>
      <p className="mt-3 leading-7 text-slate-700">{item.answer}</p>
    </details>)}</div>
    <p className="mt-5 text-sm text-slate-600">Precisa de orientação? <Link href="/ajuda" className="font-bold text-blue-800 underline">Acesse a central de ajuda</Link>.</p>
  </section>;
}
