export const INSTAGRAM_BRAND = '@educalizando_brasil';
export type InstagramDesign = {
  layout: 'classic' | 'cover' | 'editorial';
  background: 'gradient' | 'solid' | 'paper' | 'photo';
  primary: string; secondary: string; textColor: string;
  font: 'Arial' | 'Georgia' | 'Verdana'; align: 'left' | 'center';
  title: string; subtitle: string; cta: string; titleSize: number;
  showPrice: boolean; showStore: boolean; showTitle: boolean; showLink: boolean;
  showQr: boolean; showLogo: boolean; fit: 'contain' | 'cover';
};
export function defaultInstagramDesign(primary = '#173b79'): InstagramDesign {
  return { layout: 'classic', background: 'gradient', primary: /^#[0-9a-f]{6}$/i.test(primary) ? primary : '#173b79', secondary: '#111827', textColor: '#ffffff',
    font: 'Arial', align: 'left', title: '', subtitle: '', cta: 'Conheça o material na nossa loja', titleSize: 54,
    showPrice: false, showStore: true, showTitle: true, showLink: true, showQr: false, showLogo: true, fit: 'contain' };
}
/** Only style preferences are persisted locally; product copy and file URLs are not reused across products. */
export function savedInstagramDesign(value: unknown, primary?: string): InstagramDesign {
  const defaults = defaultInstagramDesign(primary);
  if (!value || typeof value !== 'object' || Array.isArray(value)) return defaults;
  const input = value as Record<string, unknown>, result = { ...defaults };
  for (const key of ['primary', 'secondary', 'textColor'] as const) if (typeof input[key] === 'string' && /^#[0-9a-f]{6}$/i.test(input[key])) result[key] = input[key];
  for (const key of ['showPrice', 'showStore', 'showTitle', 'showLink', 'showQr', 'showLogo'] as const) if (typeof input[key] === 'boolean') result[key] = input[key];
  if (['classic', 'cover', 'editorial'].includes(String(input.layout))) result.layout = input.layout as InstagramDesign['layout'];
  if (['gradient', 'solid', 'paper'].includes(String(input.background))) result.background = input.background as InstagramDesign['background'];
  if (['Arial', 'Georgia', 'Verdana'].includes(String(input.font))) result.font = input.font as InstagramDesign['font'];
  if (input.align === 'center') result.align = 'center';
  if (input.fit === 'cover') result.fit = 'cover';
  if (typeof input.titleSize === 'number' && Number.isFinite(input.titleSize)) result.titleSize = Math.min(76, Math.max(30, input.titleSize));
  return result;
}
export function instagramBrandedCaption(caption: string) {
  const clean = caption.trim();
  if (/(?:^|\s)@educalizando_brasil(?![a-z0-9_.])/i.test(clean)) return clean;
  return [clean, INSTAGRAM_BRAND].filter(Boolean).join('\n\n');
}
