import type { Metadata } from 'next';
import { Suspense } from 'react';
import LessonPlanner from '@/components/teaching/LessonPlanner';
export const metadata:Metadata={title:'Meu planejamento de aulas | Educalizando',robots:{index:false,follow:false}};
export default function Page(){return <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6"><div className="mx-auto max-w-6xl"><Suspense fallback={<p>Carregando planejamento…</p>}><LessonPlanner/></Suspense></div></main>;}
