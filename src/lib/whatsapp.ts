/**
 * Telefones de loja são cadastrados no formato brasileiro comum (DDD + número).
 * O link wa.me, por outro lado, exige o código do país. Centralizar esta regra
 * evita que cada vitrine abra um número incorreto ou incompleto.
 */
export function getStoreWhatsAppUrl(phone: string, message?: string): string {
  const digits = phone.replace(/\D/g, '');
  const internationalPhone = digits.startsWith('55') ? digits : `55${digits}`;
  const baseUrl = `https://wa.me/${internationalPhone}`;

  return message ? `${baseUrl}?text=${encodeURIComponent(message)}` : baseUrl;
}
