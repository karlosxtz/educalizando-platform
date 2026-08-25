import MarketplaceHeader from '@/components/MarketplaceHeader';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { BookOpen, Baby, GraduationCap, School, Search, ChevronRight, CheckCircle2 } from 'lucide-react';

export default function AtividadesPorAnoPage() {
  const etapasEnsino = [
    {
      id: 'infantil',
      icon: <Baby className="w-8 h-8 text-pink-500" />,
      titulo: 'Educação Infantil',
      descricao: 'Berçário e Pré-escola',
      bgBase: 'bg-pink-50',
      borderColor: 'border-pink-100',
      links: [
        { label: 'Berçário (0 a 1 ano)', href: '/buscar?ano_escolar=bercario' },
        { label: 'Maternal (2 a 3 anos)', href: '/buscar?ano_escolar=maternal' },
        { label: 'Pré-escola (4 a 5 anos)', href: '/buscar?ano_escolar=pre-escola' },
        { label: 'Ver todos de Ed. Infantil', href: '/buscar?ano_escolar=educacao-infantil' },
      ]
    },
    {
      id: 'fundamental-1',
      icon: <BookOpen className="w-8 h-8 text-blue-500" />,
      titulo: 'Ensino Fundamental I',
      descricao: 'Anos Iniciais (1º ao 5º ano)',
      bgBase: 'bg-blue-50',
      borderColor: 'border-blue-100',
      links: [
        { label: '1º Ano (Alfabetização)', href: '/buscar?ano_escolar=1-ano' },
        { label: '2º Ano', href: '/buscar?ano_escolar=2-ano' },
        { label: '3º Ano', href: '/buscar?ano_escolar=3-ano' },
        { label: '4º e 5º Ano', href: '/buscar?ano_escolar=4-ano' },
        { label: 'Ver todos do Fund. I', href: '/buscar?ano_escolar=ensino-fundamental-1' },
      ]
    },
    {
      id: 'fundamental-2',
      icon: <School className="w-8 h-8 text-emerald-500" />,
      titulo: 'Ensino Fundamental II',
      descricao: 'Anos Finais (6º ao 9º ano)',
      bgBase: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
      links: [
        { label: '6º Ano', href: '/buscar?ano_escolar=6-ano' },
        { label: '7º Ano', href: '/buscar?ano_escolar=7-ano' },
        { label: '8º Ano', href: '/buscar?ano_escolar=8-ano' },
        { label: '9º Ano', href: '/buscar?ano_escolar=9-ano' },
        { label: 'Ver todos do Fund. II', href: '/buscar?ano_escolar=ensino-fundamental-2' },
      ]
    },
    {
      id: 'medio',
      icon: <GraduationCap className="w-8 h-8 text-purple-500" />,
      titulo: 'Ensino Médio',
      descricao: 'Preparação e Enem',
      bgBase: 'bg-purple-50',
      borderColor: 'border-purple-100',
      links: [
        { label: '1º Ano (Ensino Médio)', href: '/buscar?ano_escolar=1-ano-medio' },
        { label: '2º Ano (Ensino Médio)', href: '/buscar?ano_escolar=2-ano-medio' },
        { label: '3º Ano (Enem/Vestibular)', href: '/buscar?ano_escolar=3-ano-medio' },
        { label: 'Ver todos do Ensino Médio', href: '/buscar?ano_escolar=ensino-medio' },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      <MarketplaceHeader />
      
      <main className="flex-1">
        {/* 1. Hero Section */}
        <section className="bg-blue-50 py-16 md:py-24 text-center border-b border-blue-100 px-4">
          <div className="max-w-4xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-bold mb-6">
              <CheckCircle2 className="w-4 h-4" /> BNCC Atualizada
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
              Encontre Materiais por <br className="hidden md:block"/> Ano Escolar e BNCC
            </h1>
            <p className="text-lg md:text-xl text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
              Navegue pelo nosso acervo organizado pelas etapas de ensino e rigorosamente alinhado à Base Nacional Comum Curricular.
            </p>
          </div>
        </section>

        {/* 2. O Grid de Etapas de Ensino */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {etapasEnsino.map(etapa => (
              <div key={etapa.id} className={`flex flex-col bg-white rounded-3xl border ${etapa.borderColor} overflow-hidden shadow-sm hover:shadow-md transition-shadow`}>
                <div className={`${etapa.bgBase} p-6 flex flex-col items-center text-center border-b ${etapa.borderColor}`}>
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">
                    {etapa.icon}
                  </div>
                  <h2 className="text-xl font-black text-slate-900 mb-1">{etapa.titulo}</h2>
                  <p className="text-sm font-medium text-slate-500">{etapa.descricao}</p>
                </div>
                
                <div className="p-2 flex-1 flex flex-col">
                  <ul className="space-y-1 flex-1">
                    {etapa.links.map((link, i) => (
                      <li key={i}>
                        <Link 
                          href={link.href}
                          className={`flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-colors ${
                            i === etapa.links.length - 1 
                              ? 'text-blue-600 bg-blue-50/50 hover:bg-blue-100 mt-2 font-bold' 
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          {link.label}
                          <ChevronRight className="w-4 h-4 opacity-50" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Seção Estratégica da BNCC */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 relative overflow-hidden shadow-xl">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/3"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-y-1/3 -translate-x-1/3"></div>
            
            <div className="flex-1 relative z-10 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 text-blue-200 text-sm font-bold mb-4 backdrop-blur-sm border border-white/10">
                <Search className="w-4 h-4" /> Busca Precisa
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">
                Busca Direta por Código BNCC
              </h2>
              <p className="text-slate-300 text-lg leading-relaxed max-w-2xl">
                Procurando uma habilidade específica? Você pode digitar o código exato da BNCC (ex: <strong className="text-white bg-white/10 px-1.5 py-0.5 rounded">EF15AR01</strong>, <strong className="text-white bg-white/10 px-1.5 py-0.5 rounded">EI02CG01</strong>) na nossa barra de pesquisa principal no topo do site para encontrar materiais 100% alinhados àquela competência.
              </p>
            </div>
            
            <div className="relative z-10 shrink-0">
              <Link 
                href="/buscar"
                className="inline-flex items-center justify-center px-8 py-4 bg-blue-500 hover:bg-blue-400 text-white font-black rounded-2xl transition-all shadow-[0_4px_14px_0_rgba(59,130,246,0.39)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.23)] hover:-translate-y-1"
              >
                Ir para a Busca Principal
              </Link>
            </div>
          </div>
        </section>

      </main>
      
      <Footer />
    </div>
  );
}
