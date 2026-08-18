import { supabase } from './supabase';
import { Store } from './types';

export interface UserRoles {
  isCreator: boolean;
  isAffiliate: boolean;
  isStudent: boolean;
  store: Store | null;
  affiliateCount: number;
  userId: string;
}

/**
 * Determina os papéis REAIS (identidade de negócio) de um usuário consultando o banco de dados.
 * NÃO cria nenhum registro. Apenas lê.
 * 
 * REGRAS DE IDENTIDADE (independentes entre si):
 * - isCreator: possui loja em `stores` com `creator_id = userId`
 * - isAffiliate: possui pelo menos 1 registro em `affiliates` com `user_id = userId` OU metadata `role=affiliate`
 * - isStudent: qualquer usuário autenticado
 * 
 * IMPORTANTE: isCreator NÃO implica isAffiliate. isAffiliate NÃO implica isCreator.
 */
export async function resolveUserRoles(userId: string): Promise<UserRoles> {
  const result: UserRoles = {
    isCreator: false,
    isAffiliate: false,
    isStudent: false,
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

    // Qualquer usuário autenticado tem inerentemente o direito de ser aluno
    if (authData?.user) {
      result.isStudent = true;
    }

    // 3. Verificar se possui afiliações ativas no banco (afiliado estrutural)
    const { count, error: countError } = await supabase
      .from('affiliates')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (!countError && count !== null) {
      result.affiliateCount = count;
      // isAffiliate = true SOMENTE se existir registro real OU metadata legítima
      // NUNCA inferir de isCreator
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
 * Determina se o usuário pode ACESSAR a Central de Afiliados (permissão de contexto/rota).
 * Isso é DIFERENTE de ser afiliado (identidade de negócio).
 * 
 * Um Criador pode acessar a Central para visualizar o Marketplace e solicitar afiliações,
 * mas isso NÃO o transforma em Afiliado.
 */
export function canAccessAffiliateCenter(roles: UserRoles): boolean {
  return roles.isAffiliate || roles.isCreator;
}

/**
 * Determina se o usuário pode acessar o Dashboard de Criador.
 */
export function canAccessCreatorDashboard(roles: UserRoles): boolean {
  return roles.isCreator;
}

/**
 * Determina se o usuário pode acessar o Portal do Aluno.
 */
export function canAccessStudentPortal(roles: UserRoles): boolean {
  return roles.isStudent;
}

/**
 * Determina qual contexto visual (sidebar) deve ser exibido com base na ROTA e nos PAPÉIS.
 * 
 * Retorna:
 *  - 'creator': Sidebar de Criador
 *  - 'affiliate': AffiliateSidebar
 *  - null: o usuário não tem permissão para nenhum contexto do dashboard (deve ir para /aluno)
 */
export function resolveContextForRoute(pathname: string, roles: UserRoles): 'creator' | 'affiliate' | null {
  const isAffiliateRoute = pathname?.includes('/dashboard/afiliacoes');

  if (isAffiliateRoute) {
    // Rota de afiliado: qualquer um com canAccessAffiliateCenter pode entrar
    if (canAccessAffiliateCenter(roles)) return 'affiliate';
    // Sem permissão para painel algum
    return null;
  }

  // Rota de criador (/dashboard sem /afiliacoes)
  if (roles.isCreator) return 'creator';
  // Se é afiliado puro tentando acessar /dashboard, redireciona para afiliacoes
  if (roles.isAffiliate) return 'affiliate';
  // Sem permissão
  return null;
}

/**
 * Salva a preferência de papel ativo no localStorage.
 * Isso sobrevive ao F5 no lado do cliente.
 * IMPORTANTE: Isso é preferência visual, NUNCA autorização.
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
