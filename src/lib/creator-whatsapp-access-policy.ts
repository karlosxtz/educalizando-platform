export type CreatorWhatsAppAccessSource = 'paid' | 'store_bonus' | 'global_free' | 'inactive';

export function determineCreatorWhatsAppAccess(input: {
  chargeEnabled: boolean;
  freeAccessEnabled?: boolean;
  status?: string;
  expiresAt?: string | null;
  now?: number;
}) {
  const paidActive = Boolean(
    input.status === 'active'
    && input.expiresAt
    && new Date(input.expiresAt).getTime() > (input.now ?? Date.now()),
  );
  const individualFree = input.freeAccessEnabled === true;
  const source: CreatorWhatsAppAccessSource = individualFree
    ? 'store_bonus'
    : !input.chargeEnabled
      ? 'global_free'
      : paidActive
        ? 'paid'
        : 'inactive';
  return { active: source !== 'inactive', source, paidActive, individualFree };
}
