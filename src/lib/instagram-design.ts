export const INSTAGRAM_BRAND = '@educalizando_brasil';
export type InstagramDesign = {
  version: 2;
  layout: 'image' | 'minimal' | 'classic' | 'cover' | 'editorial' | 'spotlight';
  background: 'blur' | 'gradient' | 'solid' | 'paper' | 'photo';
  primary: string; secondary: string; textColor: string;
  font: 'Arial' | 'Georgia' | 'Verdana'; align: 'left' | 'center';
  title: string; subtitle: string; cta: string; titleSize: number;
  showPrice: boolean; showStore: boolean; showTitle: boolean; showLink: boolean;
  showQr: boolean; showLogo: boolean; fit: 'contain' | 'cover';
  showCta: boolean; showBrand: boolean; square: boolean;
  padding: number; radius: number; imageZoom: number; imageX: number; imageY: number;
  brightness: number; saturation: number; overlay: number; textPlacement: 'top' | 'bottom';
};
export function defaultInstagramDesign(_primary?: string): InstagramDesign {
  return { version: 2, layout: 'image', background: 'blur', primary: '#172033', secondary: '#37304f', textColor: '#ffffff',
    font: 'Arial', align: 'left', title: '', subtitle: '', cta: 'Conheça o material na nossa loja', titleSize: 54,
    showPrice: false, showStore: true, showTitle: true, showLink: false, showQr: false, showLogo: true, fit: 'contain',
    showCta: true, showBrand: true, square: false, padding: 0, radius: 0, imageZoom: 100, imageX: 50, imageY: 50,
    brightness: 100, saturation: 100, overlay: 35, textPlacement: 'bottom' };
}
export function instagramDesignPreset(layout: InstagramDesign['layout'], previous: InstagramDesign): InstagramDesign {
  const base = { ...defaultInstagramDesign(), title: previous.title, subtitle: previous.subtitle, cta: previous.cta, square: previous.square, layout };
  if (layout === 'image') return base;
  if (layout === 'spotlight') return { ...base, background: 'blur', fit: 'cover', radius: 0, padding: 0, titleSize: 64, overlay: 65 };
  if (layout === 'minimal') return { ...base, background: 'paper', padding: 48, radius: 20, textColor: '#172033', titleSize: 58 };
  if (layout === 'editorial') return { ...base, background: 'paper', padding: 72, radius: 8, font: 'Georgia', titleSize: 62, textColor: '#172033', showLogo: false };
  if (layout === 'cover') return { ...base, background: 'blur', padding: 34, radius: 32, titleSize: 52 };
  return { ...base, background: 'gradient', padding: 60, radius: 24, showLink: true };
}
export function instagramDesignFormat(target: 'story' | 'feed', design: Pick<InstagramDesign, 'square'>) {
  return { width: 1080, height: target === 'story' ? 1920 : design.square ? 1080 : 1350 };
}
/** Only style preferences are persisted locally; product copy and file URLs are not reused across products. */
export function savedInstagramDesign(value: unknown, primary?: string): InstagramDesign {
  const defaults = defaultInstagramDesign(primary);
  if (!value || typeof value !== 'object' || Array.isArray(value)) return defaults;
  const input = value as Record<string, unknown>, result = { ...defaults };
  // Retire the old small-cover layouts; saved v2 styles keep the creator's choices.
  if (input.version !== 2) return defaults;
  for (const key of ['primary', 'secondary', 'textColor'] as const) if (typeof input[key] === 'string' && /^#[0-9a-f]{6}$/i.test(input[key])) result[key] = input[key];
  for (const key of ['showPrice', 'showStore', 'showTitle', 'showLink', 'showQr', 'showLogo', 'showCta', 'showBrand', 'square'] as const) if (typeof input[key] === 'boolean') result[key] = input[key];
  if (['image', 'minimal', 'classic', 'cover', 'editorial', 'spotlight'].includes(String(input.layout))) result.layout = input.layout as InstagramDesign['layout'];
  if (['blur', 'gradient', 'solid', 'paper'].includes(String(input.background))) result.background = input.background as InstagramDesign['background'];
  if (['Arial', 'Georgia', 'Verdana'].includes(String(input.font))) result.font = input.font as InstagramDesign['font'];
  if (input.align === 'center') result.align = 'center';
  if (input.fit === 'cover') result.fit = 'cover';
  if (typeof input.titleSize === 'number' && Number.isFinite(input.titleSize)) result.titleSize = Math.min(76, Math.max(30, input.titleSize));
  if (input.textPlacement === 'top') result.textPlacement = 'top';
  for (const [key, min, max] of [['padding', 0, 100], ['radius', 0, 70], ['imageZoom', 100, 180], ['imageX', 0, 100], ['imageY', 0, 100], ['brightness', 60, 140], ['saturation', 0, 180], ['overlay', 0, 85]] as const) {
    if (typeof input[key] === 'number' && Number.isFinite(input[key])) result[key] = Math.min(max, Math.max(min, input[key]));
  }
  return result;
}
export function instagramBrandedCaption(caption: string) {
  const clean = caption.trim();
  if (/(?:^|\s)@educalizando_brasil(?![a-z0-9_.])/i.test(clean)) return clean;
  return [clean, INSTAGRAM_BRAND].filter(Boolean).join('\n\n');
}
