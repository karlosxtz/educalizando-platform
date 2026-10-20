import type { SupabaseClient, User } from '@supabase/supabase-js';

export const CREATOR_CUSTOMER_LOGIN_MESSAGE = 'Esta conta é de criador. Acesse o Painel do Criador em “Entrar como criador”. Para a área do cliente, use uma conta de cliente.';

// Identifica a área da conta; não concede propriedade nem acesso a uma loja.
// Contas antigas podem possuir loja sem ter a identificação no cadastro.
export async function resolveAccountArea(
  user: Pick<User, 'id' | 'user_metadata'>,
  client: Pick<SupabaseClient, 'from'>,
): Promise<'creator' | 'student'> {
  const metadata = user.user_metadata || {};
  if (['creator', 'seller', 'admin'].includes(metadata.role) || metadata.is_creator === true) return 'creator';
  const { data, error } = await client.from('stores').select('id').eq('creator_id', user.id).limit(1).maybeSingle();
  // Uma falha de consulta não pode transformar uma conta de criador em cliente.
  if (error) throw new Error('Não foi possível verificar o tipo da sua conta. Tente novamente.');
  return data ? 'creator' : 'student';
}
