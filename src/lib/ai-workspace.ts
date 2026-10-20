import { MAX_PRODUCT_TAGS } from './product-tags';
export type AiEditorialValues = { title: string; description: string; tags: string[]; themes: string[]; categoryId: string; educationLevelId: string; ageRange: string; formatDetails: string };
export type AiWorkInput = { productId: string; target: 'product' | 'plr'; productTitle: string; sourceUpdatedAt?: string | null; values: AiEditorialValues; baseline: AiEditorialValues };
export type AiWork = AiWorkInput & { id: string; at: number; kind: 'draft' | 'generated' | 'edited' | 'before-save' | 'saved' };
type Workspace = { schema: 1; drafts: AiWork[]; history: AiWork[] };
type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem'>;
const MAX_AGE = 30 * 24 * 60 * 60 * 1000;
const text = (value: unknown, max: number) => typeof value === 'string' ? value.slice(0, max) : '';
const list = (value: unknown, max: number) => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').slice(0, max).map(item => item.slice(0, 120)) : [];
const values = (value: unknown): AiEditorialValues => {
  const row = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return { title: text(row.title, 160), description: text(row.description, 8000), tags: list(row.tags, MAX_PRODUCT_TAGS), themes: list(row.themes, 48), categoryId: text(row.categoryId, 80), educationLevelId: text(row.educationLevelId, 80), ageRange: text(row.ageRange, 120), formatDetails: text(row.formatDetails, 180) };
};
export function editorialFromProduct(product: Record<string, any>, target: 'product' | 'plr'): AiEditorialValues {
  return values({ title: product.titulo || '', description: target === 'plr' ? product.plr_descricao || '' : product.descricao || '', tags: product.tags || [], themes: product.seasonal_tags || [], categoryId: product.category_id || '', educationLevelId: product.education_level_id || '', ageRange: product.age_range || '', formatDetails: product.format_details || '' });
}
export const aiWorkspaceKey = (storeId: string) => `educalizando:ai-workspace:v1:${encodeURIComponent(storeId)}`;
function validWork(value: unknown, now: number): AiWork | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  if (typeof row.productId !== 'string' || !row.productId || !['product', 'plr'].includes(String(row.target)) || typeof row.at !== 'number' || !Number.isFinite(row.at) || row.at > now + 60_000 || now - row.at > MAX_AGE || !['draft', 'generated', 'edited', 'before-save', 'saved'].includes(String(row.kind))) return null;
  return { id: text(row.id, 100), productId: text(row.productId, 100), target: row.target as AiWork['target'], productTitle: text(row.productTitle, 160), at: row.at, kind: row.kind as AiWork['kind'], values: values(row.values), baseline: values(row.baseline), sourceUpdatedAt: typeof row.sourceUpdatedAt === 'string' ? text(row.sourceUpdatedAt, 80) : null };
}
export function readAiWorkspace(storage: Storage, storeId: string, now = Date.now()): Workspace {
  const empty: Workspace = { schema: 1, drafts: [], history: [] };
  try {
    const parsed = JSON.parse(storage.getItem(aiWorkspaceKey(storeId)) || 'null');
    if (parsed?.schema !== 1) return empty;
    const read = (items: unknown) => Array.isArray(items) ? items.map(item => validWork(item, now)).filter((item): item is AiWork => Boolean(item)).sort((a, b) => b.at - a.at) : [];
    return { schema: 1, drafts: read(parsed.drafts).slice(0, 10), history: read(parsed.history).slice(0, 20) };
  } catch { return empty; }
}
export function writeAiWork(storage: Storage, storeId: string, input: AiWorkInput, kind: AiWork['kind'], now = Date.now()) {
  const work = validWork({ ...input, id: `${now}-${Math.random().toString(36).slice(2, 10)}`, at: now, kind }, now);
  if (!work || !storeId) throw new Error('Rascunho inválido.');
  const workspace = readAiWorkspace(storage, storeId, now);
  const same = (item: AiWork) => item.productId === work.productId && item.target === work.target;
  if (kind === 'draft') workspace.drafts = [work, ...workspace.drafts.filter(item => !same(item))].slice(0, 10);
  else {
    const last = workspace.history[0];
    if (last && same(last) && last.kind === kind && JSON.stringify(last.values) === JSON.stringify(work.values)) return last;
    workspace.history = [work, ...workspace.history].slice(0, 20);
  }
  storage.setItem(aiWorkspaceKey(storeId), JSON.stringify(workspace));
  return work;
}
export function clearAiDraft(storage: Storage, storeId: string, productId: string, target: AiWork['target']) {
  const workspace = readAiWorkspace(storage, storeId);
  workspace.drafts = workspace.drafts.filter(item => item.productId !== productId || item.target !== target);
  storage.setItem(aiWorkspaceKey(storeId), JSON.stringify(workspace));
}
