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
