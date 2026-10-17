import 'server-only';
import { getRequestUser } from './api-auth';
import { supabaseAdmin as db } from './supabase';
import { wooJobColumns } from './woo-import-queue';
export const wooJson = (value: unknown, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex' } });
export async function wooCreator(request: Request) {
  const user = await getRequestUser(request); if (!user) return null;
  const { data: store, error } = await db.from('stores').select('id').eq('creator_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(); if (error) throw error;
  if (!store) return null;
  const { data: integration, error: integrationError } = await db.from('woocommerce_integrations').select('*').eq('store_id', store.id).maybeSingle(); if (integrationError) throw integrationError;
  return { store, integration };
}
export async function enqueueWooImport(integration: { id: string; store_id: string }, mode: 'all' | 'selected', ids: number[] = []) {
  const { data, error } = await db.from('woocommerce_import_jobs').insert({ integration_id: integration.id, store_id: integration.store_id, mode, queue: mode === 'selected' ? ids : [], source_done: mode === 'selected', discovered: mode === 'selected' ? ids.length : 0 }).select(wooJobColumns).single();
  if (error) {
    if (error.code === '23505') throw new Error('Já existe uma importação em andamento ou pausada. Retome ou cancele antes de iniciar outra.');
    if (['42P01', 'PGRST205'].includes(error.code)) throw new Error('A fila de importação aguarda ativação pela administração.');
    throw new Error('Não foi possível criar a importação. Tente novamente.');
  }
  return data;
}
