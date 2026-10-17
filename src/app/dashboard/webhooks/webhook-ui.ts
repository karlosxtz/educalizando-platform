import type { StoreWebhookEvent } from '@/lib/store-webhook-contract';

export type Endpoint = { id: string; name: string; provider: 'generic' | 'utmify'; url: string; events: StoreWebhookEvent[]; include_customer: boolean; enabled: boolean };
export type Delivery = { id: string; endpoint_id: string; status: string; attempts: number; http_status: number | null; last_error: string | null; created_at: string; event: { type: StoreWebhookEvent; is_test?: boolean | null } | null };
export type Snapshot = { store: { nome_loja: string }; endpoints: Endpoint[]; deliveries: Delivery[] };
export type ConnectionForm = { id?: string; name: string; provider: 'generic' | 'utmify'; url: string; apiToken: string; events: StoreWebhookEvent[]; includeCustomer: boolean };
export const initialForm = (): ConnectionForm => ({ name: '', provider: 'generic', url: '', apiToken: '', events: ['order.paid'], includeCustomer: false });
export const button = 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50';
export const primaryButton = 'inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50';
export const field = 'mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100';
export const statusLabels: Record<string, string> = { pending: 'Aguardando envio', processing: 'Enviando agora', delivered: 'Recebido pelo destino', failed: 'Precisa de atenção', cancelled: 'Envio cancelado' };
export const statusStyles: Record<string, string> = { pending: 'bg-amber-50 text-amber-800', processing: 'bg-blue-50 text-blue-800', delivered: 'bg-emerald-50 text-emerald-800', failed: 'bg-rose-50 text-rose-800', cancelled: 'bg-slate-100 text-slate-600' };
export function deliveryExplanation(delivery: Delivery) {
  if (delivery.status === 'delivered') return 'A plataforma de destino aceitou este envio.';
  if (delivery.status === 'cancelled') return 'Este envio foi cancelado após uma mudança na integração.';
  if (delivery.status === 'processing') return 'Estamos aguardando a resposta da plataforma.';
  if (delivery.http_status === 401 || delivery.http_status === 403) return 'O destino recusou o acesso. Confira a credencial ou as permissões da integração.';
  if (delivery.last_error === 'redirect_rejected') return 'O endereço redirecionou para outra página. Edite a integração e use o endereço final de recebimento.';
  if (delivery.last_error === 'token_missing') return 'Falta cadastrar a credencial. Abra Editar e salve a credencial da sua plataforma.';
  if (delivery.last_error === 'payload_too_large') return 'Os dados excederam o tamanho permitido para este envio.';
  if (delivery.status === 'pending') return delivery.attempts ? 'O destino ainda não aceitou o envio. Uma nova tentativa será feita automaticamente.' : 'Seu envio está na fila e será processado automaticamente.';
  return 'Não foi possível concluir o envio. Confira o endereço e a credencial; depois, tente novamente.';
}
