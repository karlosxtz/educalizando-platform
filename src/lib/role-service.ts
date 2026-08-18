import { supabase } from './supabase';
import { Store } from './types';

export interface UserRoles {
  isCreator: boolean;
  isAffiliate: boolean;
  store: Store | null;
  affiliateCount: number;
  userId: string;
}

/**
 * Determina os papéis REAIS de um usuário consultando o banco de dados.
 * NÃO cria nenhum registro. Apenas lê.
 * 
 * - isCreator: possui loja em `stores` com `creator_id = userId`
 * - isAffiliate: possui pelo menos 1 registro em `affiliates` com `user_id = userId`
 */
export async function resolveUserRoles(userId: string): Promise<UserRoles> {
  const result: UserRoles = {
    isCreator: false,
    isAffiliate: false,
    store: null,
    affiliateCount: 0,
    userId,
  };

  if (!userId) return result;

  try {
    // 1. Verificar se possui loja (criador)
    const { data: storeData } = await supabase
      .from('stores')
      .select('*')
      .eq('creator_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (storeData) {
      result.isCreator = true;
      result.store = storeData as Store;
    }

    // 2. Verificar se a conta tem natureza de afiliado (Metadata)
    const { data: authData } = await supabase.auth.getUser();
    const isAffiliateRole = authData?.user?.user_metadata?.role === 'affiliate' || authData?.user?.user_metadata?.is_affiliate === true;

    // 3. Verificar se possui afiliações ativas no banco (afiliado estrutural)
    const { count, error: countError } = await supabase
      .from('affiliates')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (!countError && count !== null) {
      result.affiliateCount = count;
      if (count > 0 || isAffiliateRole) {
        result.isAffiliate = true;
      }
    } else if (isAffiliateRole) {
      result.isAffiliate = true;
    }
  } catch (err) {
    console.error('[resolveUserRoles] Erro:', err);
  }

  return result;
}

/**
 * Retorna o papel ativo preferido do usuário.
 * Se for criador+afiliado, usa o cookie/localStorage para determinar a preferência.
 * Se for apenas um, retorna esse.
 */
export function getActiveRole(roles: UserRoles, preference?: string | null): 'creator' | 'affiliate' {
  if (roles.isCreator && roles.isAffiliate) {
    // Ambos os papéis — respeitar preferência
    if (preference === 'affiliate') return 'affiliate';
    if (preference === 'creator') return 'creator';
    // Default: criador (comportamento legacy)
    return 'creator';
  }
  
  if (roles.isAffiliate) return 'affiliate';
  if (roles.isCreator) return 'creator';
  
  // Fallback seguro para novas contas que ainda não propagaram o DB
  if (preference === 'affiliate') return 'affiliate';

  // Fallback: criador (para novos usuários sem nenhum papel ainda)
  return 'creator';
}

/**
 * Salva a preferência de papel ativo no localStorage.
 * Isso sobrevive ao F5 no lado do cliente.
 */
export function saveRolePreference(role: 'creator' | 'affiliate') {
  if (typeof window !== 'undefined') {
    localStorage.setItem('educalizando_active_role', role);
  }
}

/**
 * Lê a preferência de papel ativo do localStorage.
 */
export function getRolePreference(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('educalizando_active_role');
  }
  return null;
}
