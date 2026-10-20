import Link from 'next/link';
import { CalendarDays } from 'lucide-react';
export default function PlanningLink({productId,plr=false}:{productId:string;plr?:boolean}){return <Link href={`/cliente/planejamento?material=${encodeURIComponent(productId)}${plr?'&licenca=plr':''}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 text-sm font-bold text-violet-900"><CalendarDays className="h-4 w-4"/>Usar no meu planejamento</Link>;}
