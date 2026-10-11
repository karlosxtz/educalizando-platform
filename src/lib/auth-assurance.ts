// AAL vem de claims verificados pelo Supabase, nunca de um JWT decodificado sem assinatura.
export function requiresSecondFactor(factors: { status: string }[] | undefined, assurance: unknown) {
  return Boolean(factors?.some(factor => factor.status === 'verified') && assurance !== 'aal2');
}
