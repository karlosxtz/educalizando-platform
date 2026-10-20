import type { Metadata } from 'next';
import { Suspense } from 'react';
import LessonPlanner from '@/components/teaching/LessonPlanner';
import { studioStyles as s } from '@/components/teaching/TeachingStudio';
export const metadata:Metadata={title:'Meu planejamento de aulas | Educalizando',robots:{index:false,follow:false}};
export default function Page(){return <main className={s.page}><div className={s.container}><Suspense fallback={<p>Carregando planejamento…</p>}><LessonPlanner/></Suspense></div></main>;}
