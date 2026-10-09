import 'server-only';
import { supabaseAdmin } from './supabase';

export async function recordOperationalFailure(service: string) {
  try {
    const { error } = await supabaseAdmin.from('operational_events').insert({ service, event: 'failure' });
    if (error) console.error('[operational-events] Falha ao registrar evento:', error.code);
  } catch { /* A observabilidade não altera a resposta do checkout. */ }
}
