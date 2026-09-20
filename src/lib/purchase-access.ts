export type PurchaseAccess = {
  areaPath: '/dashboard/plr/comprados' | '/cliente/dashboard';
  loginPath: '/login' | '/cliente/login';
  areaLabel: string;
  actionLabel: string;
  url: string;
};

/**
 * Keeps the destination for a purchased item in one place.
 * A PLR is a creator licence and must never be sent to the customer library.
 */
export function getPurchaseAccess(isPlrPurchase = false, baseUrl?: string): PurchaseAccess {
  const areaPath = isPlrPurchase ? '/dashboard/plr/comprados' : '/cliente/dashboard';
  const loginPath = isPlrPurchase ? '/login' : '/cliente/login';
  const origin = baseUrl?.replace(/\/$/, '') || '';

  return {
    areaPath,
    loginPath,
    areaLabel: isPlrPurchase
      ? 'suas licenças PLR no painel do criador'
      : 'seus materiais na Área do Cliente',
    actionLabel: isPlrPurchase
      ? 'Acesse sua licença no painel do criador'
      : 'Acesse seus materiais na Área do Cliente',
    url: `${origin}${loginPath}?returnTo=${encodeURIComponent(areaPath)}`,
  };
}
