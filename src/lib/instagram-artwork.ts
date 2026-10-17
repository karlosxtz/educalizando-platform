'use client';
import type { Product, Store } from './types';
import type { InstagramTarget } from './instagram-contract';
import { instagramProductLink } from './instagram-contract';
import { catalogImageUrl } from './catalog-image-url';
import { defaultInstagramDesign, instagramDesignFormat, INSTAGRAM_BRAND, type InstagramDesign } from './instagram-design';

type ArtworkProduct = Pick<Product, 'titulo' | 'capa_url' | 'preco' | 'is_free'> & Partial<Pick<Product, 'id' | 'slug'>>;
type ArtworkStore = Pick<Store, 'nome_loja' | 'slug' | 'cor_primaria'> & { logo_url?: string | null };
export type InstagramArtworkOptions = InstagramDesign & { backgroundUrl?: string; logoUrl?: string; imageUrl?: string };
const images = new Map<string, Promise<HTMLImageElement>>();
async function coverImage(url: string): Promise<HTMLImageElement> {
  const cached = images.get(url); if (cached) return cached;
  const pending = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image(); image.crossOrigin = 'anonymous';
    const timer = setTimeout(() => { image.src = ''; reject(new Error('A imagem demorou para carregar. Tente novamente.')); }, 15000);
    image.onload = () => { clearTimeout(timer); resolve(image); };
    image.onerror = () => { clearTimeout(timer); reject(new Error('Não foi possível carregar a imagem. Confira a capa ou escolha outro arquivo.')); };
    image.src = url;
  });
  if (images.size >= 8) images.delete(images.keys().next().value!);
  images.set(url, pending); pending.catch(() => images.delete(url)); return pending;
}
function lines(context: CanvasRenderingContext2D, text: string, width: number): string[] {
  const result: string[] = []; let current = '';
  for (const word of text.trim().split(/\s+/)) {
    if (context.measureText(word).width > width) {
      if (current) { result.push(current); current = ''; }
      for (const letter of word) {
        if (context.measureText(current + letter).width > width && current) { result.push(current); current = ''; }
        current += letter;
      }
    } else if (current && context.measureText(current + ' ' + word).width > width) { result.push(current); current = word; }
    else current += (current ? ' ' : '') + word;
  }
  if (current) result.push(current);
  return result;
}
function fitted(context: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, height: number, startSize: number, color: string, font = 'Arial', align: 'left' | 'center' = 'left', paint = true) {
  if (!text.trim()) return 0;
  let size = startSize, rows: string[];
  do { context.font = '700 ' + size + 'px ' + font; rows = lines(context, text, width); if (rows.length * size * 1.22 <= height) break; size -= 2; } while (size >= 18);
  if (rows.length * size * 1.22 > height) throw new Error('Encurte o texto na personalização ou reduza a fonte para caber na arte.');
  context.fillStyle = color; context.textAlign = align;
  if (paint) rows.forEach((row, index) => context.fillText(row, align === 'center' ? x + width / 2 : x, y + index * size * 1.22));
  return rows.length * size * 1.22;
}
function drawFitted(context: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number, fit: 'contain' | 'cover', zoom = 100, positionX = 50, positionY = 50) {
  if (fit === 'contain') {
    const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
    const w = image.naturalWidth * scale, h = image.naturalHeight * scale;
    context.drawImage(image, x + (width - w) / 2, y + (height - h) / 2, w, h);
  } else {
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight) * zoom / 100;
    const sw = width / scale, sh = height / scale;
    context.drawImage(image, (image.naturalWidth - sw) * positionX / 100, (image.naturalHeight - sh) * positionY / 100, sw, sh, x, y, width, height);
  }
}
function exportJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try { canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Não foi possível exportar a arte.')), 'image/jpeg', 0.94); }
    catch { reject(new Error('Não foi possível preparar a imagem. Tente outra capa ou confira o acesso à imagem.')); }
  });
}
/** Rendering stays on the device; only approved JPEGs use the existing direct upload. */
export async function createInstagramArtwork(product: ArtworkProduct, store: ArtworkStore, target: InstagramTarget, options?: InstagramArtworkOptions): Promise<Blob> {
  const design = { ...defaultInstagramDesign(), ...options };
  if (design.background === 'photo' && !options?.backgroundUrl) throw new Error('Escolha a imagem de fundo ou selecione outro tipo de fundo.');
  if (design.layout !== 'image' && design.showPrice && !product.is_free && (!Number.isFinite(Number(product.preco)) || Number(product.preco) < 0)) throw new Error('Confira o preço no cadastro do produto antes de criar a arte.');
  const source = options?.imageUrl || catalogImageUrl(product.capa_url); if (!source) throw new Error('Adicione a capa do produto ou escolha uma imagem para esta divulgação.');
  const cover = await coverImage(source);
  const canvas = document.createElement('canvas'), format = instagramDesignFormat(target, design);
  canvas.width = format.width; canvas.height = format.height;
  const context = canvas.getContext('2d'); if (!context) throw new Error('Este navegador não conseguiu preparar a imagem.');
  const background = context.createLinearGradient(0, 0, 1080, format.height); background.addColorStop(0, design.primary); background.addColorStop(1, design.secondary);
  context.fillStyle = design.background === 'gradient' ? background : design.background === 'paper' ? '#faf8f4' : design.primary;
  context.fillRect(0, 0, 1080, format.height); context.textBaseline = 'top';
  if (design.background === 'blur') {
    context.save(); context.filter = 'blur(40px) brightness(' + Math.max(0.2, 1 - design.overlay / 100) + ') saturate(0.75)';
    drawFitted(context, cover, -100, -100, 1280, format.height + 200, 'cover'); context.restore();
  } else if (design.background === 'photo' && options?.backgroundUrl) {
    drawFitted(context, await coverImage(options.backgroundUrl), 0, 0, 1080, format.height, 'cover');
    context.fillStyle = 'rgba(0,0,0,' + design.overlay / 100 + ')'; context.fillRect(0, 0, 1080, format.height);
  }
  const image = (x: number, y: number, width: number, height: number) => {
    const scale = Math.min(width / cover.naturalWidth, height / cover.naturalHeight);
    const visibleWidth = design.fit === 'contain' ? cover.naturalWidth * scale : width;
    const visibleHeight = design.fit === 'contain' ? cover.naturalHeight * scale : height;
    context.save(); context.beginPath(); context.roundRect(x + (width - visibleWidth) / 2, y + (height - visibleHeight) / 2, visibleWidth, visibleHeight, Math.min(design.radius, visibleWidth / 2, visibleHeight / 2)); context.clip();
    context.filter = 'brightness(' + design.brightness + '%) saturate(' + design.saturation + '%)';
    drawFitted(context, cover, x, y, width, height, design.fit, design.imageZoom, design.imageX, design.imageY); context.restore();
  };
  if (design.layout === 'image') {
    image(design.padding, design.padding, 1080 - 2 * design.padding, format.height - 2 * design.padding);
    return exportJpeg(canvas);
  }
  const ink = design.textColor;
  const edge = 72, top = target === 'story' ? 155 : 64, bottom = format.height - (target === 'story' ? 155 : 60);
  const immersive = design.layout === 'spotlight' || design.layout === 'cover';
  const textColor = ink;
  const text = (value: string, y: number, height: number, size: number, width = 936) => fitted(context, value, edge, y, width, height, size, textColor, design.font, design.align);
  const showLogo = design.showLogo && (options?.logoUrl || store.logo_url);
  let contentY = top;
  if (immersive) {
    image(design.padding, design.padding, 1080 - 2 * design.padding, format.height - 2 * design.padding);
    const gradient = context.createLinearGradient(0, 0, 0, format.height);
    const dark = Math.max(0.35, design.overlay / 100);
    gradient.addColorStop(0, 'rgba(0,0,0,' + dark * 0.65 + ')'); gradient.addColorStop(0.32, 'rgba(0,0,0,0)'); gradient.addColorStop(0.55, 'rgba(0,0,0,0.12)'); gradient.addColorStop(1, 'rgba(0,0,0,' + Math.min(0.95, dark + 0.25) + ')');
    context.fillStyle = gradient; context.fillRect(0, 0, 1080, format.height);
  }
  if (design.showStore) contentY += text(store.nome_loja, top, 60, 28, showLogo ? 780 : 936) + 30;
  if (showLogo) {
    const logoSource = options?.logoUrl || catalogImageUrl(store.logo_url);
    if (logoSource) { context.save(); context.beginPath(); context.roundRect(902, top - 12, 106, 106, 18); context.clip(); context.fillStyle = '#ffffff'; context.fillRect(902, top - 12, 106, 106); drawFitted(context, await coverImage(logoSource), 910, top - 4, 90, 90, 'contain'); context.restore(); }
    contentY = Math.max(contentY, top + 120);
  }
  if (design.layout === 'editorial') { context.fillStyle = design.primary; context.fillRect(edge, contentY, 60, 5); contentY += 32; }
  let footerHeight = 0;
  if (design.showPrice) footerHeight += 84;
  if (design.subtitle) footerHeight += 76;
  if (design.showCta && design.cta) footerHeight += 72;
  if (design.showLink) footerHeight += 50;
  if (design.showBrand) footerHeight += 44;
  footerHeight = Math.max(footerHeight, design.showQr ? 230 : 0);
  const footerY = bottom - footerHeight;
  const titleMaxHeight = target === 'story' ? 230 : design.square ? 160 : 200;
  if (immersive && design.textPlacement === 'bottom') {
    const titleHeight = design.showTitle ? fitted(context, design.title || product.titulo, edge, 0, 936, titleMaxHeight, design.titleSize, textColor, design.font, design.align, false) : 0;
    contentY = footerY - (titleHeight ? titleHeight + 28 : 0);
  }
  if (design.showTitle) contentY += text(design.title || product.titulo, contentY, titleMaxHeight, design.titleSize) + 32;
  if (!immersive) {
    const frameY = contentY, frameBottom = footerHeight ? footerY - 36 : bottom;
    const frameX = Math.max(24, design.padding);
    image(frameX, frameY, 1080 - 2 * frameX, Math.max(160, frameBottom - frameY));
  }
  const price = product.is_free || Number(product.preco) === 0 ? 'Gratuito' : Number(product.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const footerWidth = design.showQr ? 660 : 936;
  let footerLine = footerY;
  if (design.showPrice) { text(price, footerLine, 76, 56, footerWidth); footerLine += 84; }
  if (design.subtitle) { text(design.subtitle, footerLine, 68, 30, footerWidth); footerLine += 76; }
  if (design.showCta && design.cta) { text(design.cta, footerLine, 64, 30, footerWidth); footerLine += 72; }
  if (design.showLink) { text('www.educalizando.com.br/loja/' + store.slug, footerLine, 42, 22, footerWidth); footerLine += 50; }
  if (design.showBrand) text(INSTAGRAM_BRAND, footerLine, 36, 22, footerWidth);
  if (design.showQr) {
    if (!product.id) throw new Error('Selecione um produto para criar o QR code.');
    const QRCode = await import('qrcode');
    const qr = await QRCode.toDataURL(instagramProductLink(store, { id: product.id, slug: product.slug }), { width: 210, margin: 2, errorCorrectionLevel: 'M' });
    context.drawImage(await coverImage(qr), 798, footerY, 210, 210);
  }
  return exportJpeg(canvas);
}
