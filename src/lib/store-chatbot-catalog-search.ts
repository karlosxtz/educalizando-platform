export function normalizeCatalogSearch(value: unknown) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim()
    .slice(0, 120);
}

export function catalogItemMatches(item: Record<string, unknown>, query: string) {
  if (!query) return true;

  const values: string[] = [];
  const collect = (value: unknown) => {
    if (value == null) return;
    if (Array.isArray(value)) return value.forEach(collect);
    if (typeof value === 'object') return Object.values(value as Record<string, unknown>).forEach(collect);
    values.push(String(value));
  };

  collect(item);
  if (item.isPlr === true) values.push('plr licença licenca revenda revender direitos de revenda');
  if (item.isFree === true) values.push('grátis gratis gratuito material grátis material gratis');

  const text = normalizeCatalogSearch(values.join(' '));
  return query.split(/\s+/).filter(Boolean).every((term) => text.includes(term));
}

type WhatsAppCatalogMessageInput = {
  title: string;
  description: string | null;
  finalPrice: number;
  finalUrl: string;
  free?: boolean;
  plr?: { price: number; url: string } | null;
};

function money(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function buildWhatsAppCatalogMessage(input: WhatsAppCatalogMessageInput) {
  const catalogDescription = input.description?.replace(/\s+/g, ' ').trim().slice(0, 1200);
  const purchaseOptions = input.free
    ? ['🎁 Versão final gratuita', `🔗 Acessar versão final: ${input.finalUrl}`]
    : [`💰 Versão final: ${money(input.finalPrice)}`, `🛒 Comprar versão final: ${input.finalUrl}`];

  if (input.plr) {
    purchaseOptions.push(
      `♻️ Versão PLR com licença de revenda: ${money(input.plr.price)}`,
      `🛒 Comprar versão PLR: ${input.plr.url}`,
    );
  }

  return [`📚 ${input.title}`, catalogDescription || null, ...purchaseOptions].filter(Boolean).join('\n\n');
}
