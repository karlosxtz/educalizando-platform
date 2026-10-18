export const STORE_THEMES = [
  { id: 'default', name: 'Clássico', description: 'A vitrine atual, com banner e catálogo organizado.', color: '#2563eb', background: '#f8fafc', layout: 'grid' },
  { id: 'aurora', name: 'Aurora', description: 'Cores vibrantes, apresentação em duas colunas e capas em destaque.', color: '#6d28d9', background: '#f5f3ff', layout: 'split' },
  { id: 'editorial', name: 'Editorial', description: 'Uma livraria digital: tons de papel, títulos serifados e respiro.', color: '#9a3412', background: '#f8f4eb', layout: 'magazine' },
  { id: 'brincar', name: 'Brincar', description: 'Formas arredondadas, detalhes lúdicos e uma paleta de cores suaves.', color: '#6d28d9', background: '#fffbea', layout: 'playful' },
  { id: 'noite', name: 'Noite', description: 'Vitrine escura, banner imersivo e detalhes em cores luminosas.', color: '#67e8f9', background: '#101827', layout: 'immersive' },
  { id: 'estudio', name: 'Estúdio', description: 'Perfil lateral no computador e catálogo em fichas horizontais.', color: '#0f766e', background: '#f0f7f4', layout: 'sidebar' },
] as const;
export type StoreThemeId = (typeof STORE_THEMES)[number]['id'];
export type NewStoreThemeId = Exclude<StoreThemeId, 'default'>;
export function storeThemeId(value: unknown): StoreThemeId {
  return STORE_THEMES.some(theme => theme.id === value) ? value as StoreThemeId : 'default';
}
export function storeTheme(value: unknown) { return STORE_THEMES.find(theme => theme.id === storeThemeId(value))!; }
/** Keep the creator's saved accent; readable foreground for any valid hex. */
export function storeThemeColors(value: unknown, primary?: string | null) {
  const theme = storeTheme(value);
  const raw = primary && /^#(?:[a-f0-9]{3}|[a-f0-9]{6})$/i.test(primary) ? primary : theme.color;
  const hex = raw.slice(1), normalized = hex.length === 3 ? hex.split('').map(char => char + char).join('') : hex;
  const accent = '#' + normalized, rgb = normalized.match(/.{2}/g)!.map(part => parseInt(part, 16) / 255);
  const luminance = rgb.map(channel => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4).reduce((sum, channel, index) => sum + channel * [.2126, .7152, .0722][index], 0);
  return { accent, foreground: luminance > .179 ? '#111827' : '#ffffff' };
}
