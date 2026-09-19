import { DeliveryAttemptsPanel } from '@/components/admin/DeliveryAttemptsPanel';

export default function AdminDeliveriesPage() {
  return <div className="space-y-6"><section className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-950 to-slate-950 p-6"><p className="text-xs font-black uppercase tracking-widest text-violet-300">Operação da plataforma</p><h1 className="mt-1 text-3xl font-black text-white">Entregas transacionais</h1><p className="mt-2 max-w-2xl text-sm text-slate-300">Acompanhe os e-mails de materiais liberados depois do pagamento. A fila é idempotente: uma confirmação repetida nunca deve duplicar uma entrega.</p></section><DeliveryAttemptsPanel /></div>;
}
