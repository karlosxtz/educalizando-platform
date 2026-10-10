import { exclusiveFinancials } from './exclusive-material';
import type { PlatformPaymentMethod } from './payment-fees';

export const CREATOR_CLUB_DURATION_DAYS = 30;

export function creatorClubMaterialEligible(clubType: string, product: { is_plr?: boolean | null; has_plr_delivery?: boolean | null }, requireDelivery = false) {
  return clubType === 'final' || (clubType === 'plr' && product.is_plr === true && (!requireDelivery || product.has_plr_delivery === true));
}

export function creatorClubFinancials(amount: number, paymentMethod: PlatformPaymentMethod = 'pix', installments = 1) {
  return exclusiveFinancials(amount, paymentMethod, installments);
}

export function creatorClubSlug(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 72) || 'clube-do-criador';
}

