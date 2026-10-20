'use client';
import { signOutStudent } from '@/lib/student-service';
import { BookOpen,BookmarkCheck,CalendarDays,Crown,FilePenLine,Gift,Heart,LogOut,UserRound } from 'lucide-react';
import Link from '@/components/OnDemandLink';
import { usePathname,useRouter } from 'next/navigation';
import c from '@/components/teaching/CommerceExperience.module.css';
interface StudentHeaderProps{studentName?:string;studentEmail?:string;studentAvatarUrl?:string;}
export default function StudentHeader({studentName='Cliente Educalizando',studentEmail='',studentAvatarUrl}:StudentHeaderProps){
  const router=useRouter(),pathname=usePathname();
  const normalized=(pathname||'').replace(/^\/aluno/,'/cliente');
  const links=[{href:'/cliente/dashboard',label:'Minha biblioteca',icon:BookOpen},{href:'/cliente/planejamento',label:'Planejar aulas',icon:CalendarDays},{href:'/cliente/favoritos',label:'Favoritos e lojas',icon:Heart},{href:'/cliente/buscas-salvas',label:'Buscas salvas',icon:BookmarkCheck},{href:'/cliente/brindes',label:'Brindes',icon:Gift},{href:'/cliente/materiais-exclusivos',label:'Exclusivos',icon:FilePenLine},{href:'/cliente/clubes',label:'Meus clubes',icon:Crown},{href:'/cliente/conta',label:'Minha conta',icon:UserRound}];
  async function logout(){await signOutStudent();router.push('/cliente/login');}
  return <header className={c.customerHeader}>
    <div className={c.customerTop}><Link href="/cliente/dashboard" className={c.brand}><img src="/branding/logo-educalizando.png?v=3" alt="Educalizando"/><span>Meu espaço de ensinar</span></Link>
      <div className={c.account}><Link href="/cliente/conta" aria-label="Minha conta"><span className={c.avatar}>{studentAvatarUrl?<img src={studentAvatarUrl} alt=""/>:studentName.charAt(0).toUpperCase()}</span><span><strong>{studentName}</strong><small>{studentEmail}</small></span></Link><button type="button" onClick={()=>void logout()} title="Encerrar sessão" aria-label="Sair da conta"><LogOut size={16}/><span>Sair</span></button></div>
    </div>
    <nav aria-label="Área do cliente" className={c.customerNav}>{links.map(({href,label,icon:Icon})=><Link key={href} href={href} aria-current={normalized===href?'page':undefined}><Icon/>{label}</Link>)}</nav>
  </header>;
}