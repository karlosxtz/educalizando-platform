'use client';

import { StudioHero,StudioEmpty,studioStyles as s } from '@/components/teaching/TeachingStudio';
import c from '@/components/teaching/CommerceExperience.module.css';
import {
ArrowRight,CalendarDays,Heart,Search,
BookOpen,
Loader2,
ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect,useState } from 'react';

import PurchasedMaterialFinder from '@/components/aluno/PurchasedMaterialFinder';
import type { Purchase } from '@/lib/types';
import StudentHeader from '@/components/aluno/StudentHeader';
import { getCurrentStudentSession,getStudentPurchases,GroupedStudentStore } from '@/lib/student-service';

export default function StudentDashboardStoresPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [studentSession, setStudentSession] = useState<{ id: string; email: string; fullName: string; avatarUrl?: string } | null>(null);
  const [groupedStores, setGroupedStores] = useState<GroupedStudentStore[]>([]);
  const [purchases,setPurchases] = useState<Purchase[]>([]);
  const [search, setSearch] = useState('');
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const visibleStores = groupedStores.filter(({ store }) => normalize(store.nome_loja).includes(normalize(search.trim())));

  useEffect(() => {
    async function loadStudentData() {
      try {
        const session = await getCurrentStudentSession();
        if (!session) {
          router.push('/cliente/login');
          return;
        }
        setStudentSession(session);

        const purchased = await getStudentPurchases(session.id);
        setPurchases(purchased);
        const grouped = new Map<string,GroupedStudentStore>();
        for(const purchase of purchased){if(!purchase.store)continue;const entry=grouped.get(purchase.store.id);if(entry)entry.purchasesCount++;else grouped.set(purchase.store.id,{store:purchase.store,purchasesCount:1});}
        const stores = [...grouped.values()];
        const exclusiveResponse = await fetch('/api/aluno/materiais-exclusivos', { cache: 'no-store' });
        const exclusivePayload = await exclusiveResponse.json().catch(() => ({}));
        const merged = new Map(stores.map((entry) => [entry.store.id, entry]));
        if (exclusiveResponse.ok) {
          for (const material of exclusivePayload.materials || []) {
            if (!material.store?.id) continue;
            const current = merged.get(material.store.id);
            if (current) current.purchasesCount += 1;
            else merged.set(material.store.id, { store: material.store, purchasesCount: 1 });
          }
        }
        setGroupedStores(Array.from(merged.values()));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStudentData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return <div className={`${c.surface} ${s.studio}`}>
    <StudentHeader studentName={studentSession?.fullName} studentEmail={studentSession?.email} studentAvatarUrl={studentSession?.avatarUrl}/>
    <main className={c.content}>
      <StudioHero eyebrow="Seu espaço de ensinar" title="Seus materiais. Suas próximas boas aulas." description={`Olá${studentSession?.fullName?', '+studentSession.fullName.split(' ')[0]:''}! Encontre suas compras, organize suas ideias e continue descobrindo recursos para a sua turma.`} icon={BookOpen} tag="Tudo perto, quando precisar"/>
      <nav aria-label="Atalhos da sua biblioteca" className={c.quickLinks}>
        <Link href="/cliente/planejamento"><span className={s.icon}><CalendarDays/></span><div><strong>Prepare sua próxima aula</strong><p>Reúna ideias e materiais em um plano.</p></div><ArrowRight size={15} className="ml-auto text-slate-400"/></Link>
        <Link href="/cliente/favoritos"><span className={`${s.icon} ${s.peach}`}><Heart/></span><div><strong>Suas ideias favoritas</strong><p>Volte aos materiais que você guardou.</p></div><ArrowRight size={15} className="ml-auto text-slate-400"/></Link>
        <Link href="/encontrar-material"><span className={`${s.icon} ${s.mint}`}><Search/></span><div><strong>Encontre por objetivo</strong><p>Uma nova possibilidade para ensinar.</p></div><ArrowRight size={15} className="ml-auto text-slate-400"/></Link>
      </nav>
      {studentSession&&<PurchasedMaterialFinder purchases={purchases} userId={studentSession.id}/>}
      <section className="mt-8" aria-label="Lojas das minhas compras">
        <div className={s.sectionHeading}><div><h2>Minhas compras por loja</h2><p>Combos, materiais exclusivos e arquivos organizados com seus criadores.</p></div><span className={`${s.badge} ${s.badgeGreen}`}><ShieldCheck/>Na sua conta</span></div>
        {groupedStores.length>0&&<div className={s.card+' mb-5'}><div className="flex flex-col gap-3 sm:flex-row sm:items-end"><label htmlFor="purchase-store-search" className={s.field+' min-w-0 flex-1'}>Encontrar uma loja<input id="purchase-store-search" type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Nome da loja em que você comprou" className={s.input}/></label>{search&&<button onClick={()=>setSearch('')} className={s.secondary}>Limpar busca</button>}<span role="status" className={s.note+' py-3'}>{visibleStores.length} de {groupedStores.length} lojas</span></div></div>}
        {!groupedStores.length?<div className={s.help}><strong>Suas lojas aparecem aqui depois da primeira compra</strong>Quando o acesso estiver disponível, escolha a loja para abrir seus materiais. Você também pode explorar o catálogo e guardar ideias nos favoritos.</div>:!visibleStores.length?<div className={s.card}><StudioEmpty compact icon={Search} title="Não encontramos essa loja" description="Tente outro nome ou limpe a busca para ver todas as suas lojas."/></div>:<div className={c.storeGrid}>{visibleStores.map(({store,purchasesCount})=><article key={store.id} className={c.storeCard}><div className={c.storeBody}><div className="flex items-center gap-3">{store.logo_url?<img src={store.logo_url} alt="" className={c.storeLogo}/>:<span className={c.storeLogo}>{store.nome_loja.charAt(0).toUpperCase()}</span>}<div className="min-w-0"><span className={s.eyebrow+' !mb-1'}>Minha coleção</span><h3>{store.nome_loja}</h3></div></div>{store.descricao&&<p className="line-clamp-2">{store.descricao}</p>}</div><div className={c.storeFooter}><span className={s.badge}><BookOpen size={12}/>{purchasesCount} {purchasesCount===1?'acesso':'acessos'}</span><Link href={`/cliente/loja/${store.id}`} className={s.primary}>Ver meus materiais<ArrowRight/></Link></div></article>)}</div>}
      </section>
    </main>
  </div>;
}
