export function normalizeCatalogSearch(value: unknown) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim();
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

  // Search content, never identifiers, URLs, prices or internal metadata.
  for (const key of ['title', 'name', 'description', 'type', 'ageRange', 'formatDetails', 'colorMode', 'themes', 'tags']) collect(item[key]);
  for (const key of ['categories', 'educationLevels']) {
    if (Array.isArray(item[key])) for (const entry of item[key] as Record<string, unknown>[]) collect(entry.name);
  }
  if (Array.isArray(item.materials)) for (const material of item.materials as Record<string, unknown>[]) {
    for (const key of ['title', 'description', 'themes', 'tags']) collect(material[key]);
  }
  if (item.isPlr === true) values.push('plr licença licenca revenda revender direitos de revenda');
  if (item.isFree === true) values.push('grátis gratis gratuito material grátis material gratis');

  const text = normalizeCatalogSearch(values.join(' '));
  const stopWords = new Set(['quero', 'preciso', 'um', 'uma', 'uns', 'umas', 'de', 'da', 'do', 'das', 'dos', 'para', 'por', 'com', 'e', 'o', 'a', 'os', 'as']);
  const terms = query.split(/[\s,;!?]+/).filter(term => term && !stopWords.has(term));
  return terms.length > 0 && terms.every(term => text.includes(term));
}

type WhatsAppCatalogMessageInput = {
  title: string;
  description: string | null;
  finalPrice: number | null;
  finalUrl: string;
  free?: boolean;
  plr?: { price: number | null; url: string } | null;
};

function money(value: number | null) {
  return value !== null && Number.isFinite(value) && value >= 0 ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Preço indisponível; consulte a página do material';
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
