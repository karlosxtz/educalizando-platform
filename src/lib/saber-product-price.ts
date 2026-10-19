type Row = Record<string, unknown>;
const row = (input: unknown): Row => input && typeof input === 'object' && !Array.isArray(input) ? input as Row : {};
function reais(input: unknown): number | null {
  if (typeof input === 'number') return Number.isFinite(input) && input >= 0 && input <= 99999999 ? Math.round(input * 100) / 100 : null;
  if (typeof input !== 'string') return null;
  let raw = input.trim().replace(/^R\$\s*/, '');
  if (/^\d{1,3}(\.\d{3})+,\d{2}$/.test(raw)) raw = raw.replace(/\./g, '').replace(',', '.');
  else if (/^\d+,\d{1,2}$/.test(raw)) raw = raw.replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(raw)) return null;
  const amount = Number(raw);
  return Number.isFinite(amount) && amount <= 99999999 ? amount : null;
}
function centavos(input: unknown): number | null {
  const amount = typeof input === 'number' ? input : typeof input === 'string' && /^\d+$/.test(input.trim()) ? Number(input) : NaN;
  return Number.isSafeInteger(amount) && amount >= 0 && amount <= 9999999900 ? amount / 100 : null;
}
function amount(input: unknown): number | null {
  if (!input || typeof input !== 'object') return reais(input);
  const price = row(input);
  const currency = String(price.currency ?? price.moeda ?? 'BRL').toUpperCase();
  if (!['BRL', 'R$'].includes(currency)) return null;
  const unit = String(price.unit ?? price.unidade ?? '').toLowerCase();
  for (const key of ['amount_cents', 'amountCents', 'value_cents', 'valueCents', 'cents', 'centavos']) {
    if (price[key] !== undefined) { const result = centavos(price[key]); if (result !== null) return result; }
  }
  const raw = price.amount ?? price.value ?? price.valor;
  if (['cents', 'centavos', 'minor'].includes(unit)) return centavos(raw);
  if (unit && !['reais', 'real', 'brl', 'major'].includes(unit)) return null;
  // An unlabelled amount object has ambiguous units; never guess a factor of 100.
  return unit ? reais(raw) : null;
}
/** Exact aliases and explicit units only; no currency conversion or guessed discounts. */
export function saberProductPrice(source: Row, original = false): number | null {
  const currency = String(source.currency ?? source.moeda ?? 'BRL').toUpperCase();
  if (!['BRL', 'R$'].includes(currency)) return null;
  const keys = original
    ? ['regular_price', 'original_price', 'preco_original', 'compare_at_price', 'regularPrice', 'originalPrice', 'compareAtPrice', 'precoOriginal']
    : ['price', 'preco', 'sale_price', 'regular_price', 'salePrice', 'regularPrice', 'price_brl', 'priceBrl', 'valor', 'valor_venda', 'valorVenda', 'preco_venda', 'precoVenda', 'current_price', 'currentPrice', 'selling_price', 'sellingPrice'];
  const centKeys = original
    ? ['regular_price_cents', 'original_price_cents', 'originalPriceCents', 'regularPriceCents', 'compare_at_price_cents', 'compareAtPriceCents']
    : ['price_cents', 'priceCents', 'price_in_cents', 'priceInCents', 'preco_centavos', 'precoCentavos', 'sale_price_cents', 'salePriceCents', 'amount_cents', 'amountCents'];
  for (const container of [source, row(source.pricing), row(source.precos)]) {
    if (!['BRL', 'R$'].includes(String(container.currency ?? container.moeda ?? currency).toUpperCase())) continue;
    for (const key of keys) { const result = amount(container[key]); if (result !== null) return result; }
    for (const key of centKeys) { const result = centavos(container[key]); if (result !== null) return result; }
  }
  return original ? null : amount(source.pricing);
}

/** Field names/types only: never copy provider values, tokens or personal data. */
export function saberPriceFields(input: unknown): string[] {
  const fields: string[] = [];
  const visit = (object: Row, prefix: string, depth: number) => {
    if (depth > 3 || fields.length >= 40) return;
    for (const [key, value] of Object.entries(object)) {
      if (fields.length >= 40) return;
      if (!/^[a-zA-Z_][a-zA-Z0-9_]{0,39}$/.test(key) || /token|secret|password|auth|customer|client|download|delivery|email/i.test(key)) continue;
      const path = prefix ? prefix + '.' + key : key;
      if (/price|preco|valor|pricing|amount|currency|moeda|centavo|unit/i.test(path)) fields.push(path + ': ' + (value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value));
      if (value && typeof value === 'object' && !Array.isArray(value)) visit(row(value), path, depth + 1);
    }
  };
  visit(row(input), '', 0);
  return fields;
}
