import { z } from 'zod';

export const INBOUND_PERMISSIONS = {
  'events.receive': 'Receber e registrar avisos',
  'products.write': 'Cadastrar materiais em rascunho e atualizar dados públicos',
  'categories.write': 'Cadastrar e atualizar categorias da loja',
  'customers.write': 'Cadastrar e atualizar clientes externos',
  'orders.write': 'Registrar vendas feitas em outras plataformas',
  'access.manage': 'Liberar e revogar materiais de vendas externas',
} as const;
export type InboundPermission = keyof typeof INBOUND_PERMISSIONS;
export const INBOUND_ACTIONS = ['product.upsert', 'category.upsert', 'customer.upsert', 'order.upsert', 'access.grant', 'access.revoke'] as const;
export type InboundReceiver = { id: string; store_id: string; name: string; enabled: boolean; permissions: InboundPermission[]; token_hash: string; token_encrypted: string; created_at: string };
export const INBOUND_EXAMPLES = {
  notice: { id: 'aviso-001', type: 'custom.notice', data: { message: 'Aviso enviado pela minha automação' } },
  product: { id: 'material-001-v1', type: 'product.upsert', data: { external_id: 'material-001', title: 'Atividades de leitura', description: 'Material para praticar leitura e interpretação.', price: 12.9, format: 'pdf', tags: ['leitura', 'interpretação'] } },
  category: { id: 'categoria-001-v1', type: 'category.upsert', data: { external_id: 'categoria-001', name: 'Leitura e interpretação' } },
  customer: { id: 'cliente-001-v1', type: 'customer.upsert', data: { external_id: 'cliente-001', name: 'Cliente de exemplo', email: 'cliente@example.com', phone: '5511999999999', marketing_consent: false } },
  order: { id: 'pedido-001-pago', type: 'order.upsert', data: { external_id: 'pedido-001', status: 'paid', email: 'cliente@example.com', customer_name: 'Cliente de exemplo', total_amount: 12.9, currency: 'BRL', items: [{ external_product_id: 'material-001', quantity: 1 }], grant_access: false } },
  access: { id: 'pedido-001-liberacao', type: 'access.grant', data: { external_order_id: 'pedido-001' } },
  revoke: { id: 'pedido-001-revogacao', type: 'access.revoke', data: { external_order_id: 'pedido-001' } },
} as const;

const externalId = z.string().trim().min(1).max(120).regex(/^[\p{L}\p{N}_.:@/-]+$/u);
const text = (max: number) => z.string().trim().max(max).transform(value => value.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<[^>]*>/g, ''));
const email = z.string().trim().toLowerCase().email().max(254);
const tags = z.array(text(80)).max(30);
const money = z.number().finite().min(0).max(9999999).transform(value => Math.round(value * 100) / 100);
const publicUrl = z.string().url().max(2048).refine(value => {
  const url = new URL(value);
  return url.protocol === 'https:' && !url.username && !url.password && !url.hash;
}, 'Use um endereço HTTPS público.');
const schemas: Record<string, z.ZodTypeAny> = {
  'product.upsert': z.object({ external_id: externalId, product_id: z.string().uuid().optional(), title: text(160).refine(value => value.length > 0), description: text(20000).optional(), price: money.optional(), format: z.enum(['pdf', 'ebook', 'video', 'curso', 'simulado']).optional(), cover_url: publicUrl.nullable().optional(), tags: tags.optional(), seasonal_tags: tags.optional(), category_ids: z.array(z.string().uuid()).max(5).optional(), education_level_ids: z.array(z.string().uuid()).max(5).optional(), page_count: z.number().int().min(1).max(100000).optional(), age_range: text(120).optional(), format_details: text(180).optional(), color_mode: z.enum(['colorido', 'preto_e_branco', 'colorido_e_preto_e_branco']).optional() }).strict(),
  'category.upsert': z.object({ external_id: externalId, category_id: z.string().uuid().optional(), name: text(100).refine(value => value.length > 0) }).strict(),
  'customer.upsert': z.object({ external_id: externalId, name: text(160), email, phone: z.string().trim().max(30).regex(/^[+\d\s()-]*$/).optional(), marketing_consent: z.boolean().default(false) }).strict(),
  'order.upsert': z.object({ external_id: externalId, status: z.enum(['pending', 'paid', 'cancelled', 'failed', 'refunded', 'chargedback']), email, customer_name: text(160).default(''), total_amount: money, currency: z.string().regex(/^[A-Z]{3}$/).default('BRL'), items: z.array(z.object({ product_id: z.string().uuid().optional(), external_product_id: externalId.optional(), quantity: z.number().int().min(1).max(100).default(1) }).strict().refine(item => Boolean(item.product_id) !== Boolean(item.external_product_id), 'Informe um identificador de material por item.')).min(1).max(50), grant_access: z.boolean().default(false) }).strict(),
  'access.grant': z.object({ external_order_id: externalId }).strict(),
  'access.revoke': z.object({ external_order_id: externalId }).strict(),
};
export class InboundInputError extends Error { constructor(message: string, public status = 400) { super(message); } }
export function normalizeInboundEvent(input: unknown) {
  const envelope = z.object({ id: externalId, type: z.string().min(1).max(100).regex(/^[a-z][a-z0-9_.-]*$/), occurred_at: z.string().datetime({ offset: true }).optional(), test: z.boolean().default(false), data: z.record(z.unknown()) }).strict().safeParse(input);
  if (!envelope.success) throw new InboundInputError('Use o modelo com id, type e data. Confira os tipos, tamanhos e campos informados.');
  const event = envelope.data;
  if (event.occurred_at && Date.parse(event.occurred_at) > Date.now() + 300000) throw new InboundInputError('A data do aviso não pode estar mais de cinco minutos no futuro.');
  const action = schemas[event.type];
  if (action && !event.test) {
    const parsed = action.safeParse(event.data);
    if (!parsed.success) throw new InboundInputError('Os dados não correspondem à ação ' + event.type + '. Use o exemplo disponível no painel.');
    event.data = parsed.data;
  }
  return event;
}
/** Keep secrets out of the private history as well; bound traversal to avoid deeply nested payloads. */
export function redactInboundData(value: unknown, depth = 0, budget = { nodes: 0 }): unknown {
  if (depth > 12 || ++budget.nodes > 4000) throw new InboundInputError('Os dados têm muitos campos ou níveis de detalhe.');
  if (Array.isArray(value)) return value.map(item => redactInboundData(item, depth + 1, budget));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, /password|senha|token|authorization|secret|credentials|credencial|(?:api|access|private).?key|cvv|cvc|card|cartao|(?:^|[_-])pan(?:$|[_-])|cookie/i.test(key) ? '[protegido]' : redactInboundData(item, depth + 1, budget)]));
  return value;
}
export function canonicalInboundJson(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonicalInboundJson).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, item]) => JSON.stringify(key) + ':' + canonicalInboundJson(item)).join(',') + '}';
  return JSON.stringify(value);
}
