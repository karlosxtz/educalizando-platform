'use client';
import type { Product, Store } from './types';
import { INSTAGRAM_FORMATS, type InstagramTarget } from './instagram-contract';
import { catalogImageUrl } from './catalog-image-url';
import { defaultInstagramDesign, INSTAGRAM_BRAND, type InstagramDesign } from './instagram-design';
import { instagramProductLink } from './instagram-contract';

type ArtworkProduct = Pick<Product, 'titulo' | 'capa_url' | 'preco' | 'is_free'> & Partial<Pick<Product, 'id' | 'slug'>>;
type ArtworkStore = Pick<Store, 'nome_loja' | 'slug' | 'cor_primaria'> & { logo_url?: string | null };
export type InstagramArtworkOptions = InstagramDesign & { backgroundUrl?: string; logoUrl?: string };
const images = new Map<string, Promise<HTMLImageElement>>();
async function coverImage(url: string): Promise<HTMLImageElement> {
  const cached = images.get(url); if (cached) return cached;
  const pending = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image(); image.crossOrigin = 'anonymous';
    const timer = setTimeout(() => { image.src = ''; reject(new Error('A capa demorou para carregar. Tente novamente.')); }, 15000);
    image.onload = () => { clearTimeout(timer); resolve(image); };
    image.onerror = () => { clearTimeout(timer); reject(new Error('Não foi possível carregar a capa para criar a arte. Confira a imagem e o acesso público no armazenamento.')); };
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
function fitted(context: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, height: number, startSize: number, color: string, font = 'Arial', align: 'left' | 'center' = 'left') {
  if (!text.trim()) return;
  let size = startSize, rows: string[];
  do { context.font = `700 ${size}px ${font}`; rows = lines(context, text, width); if (rows.length * size * 1.22 <= height) break; size -= 2; } while (size >= 18);
  if (rows.length * size * 1.22 > height) throw new Error('O título é muito longo para esta arte. Revise o título do produto antes de criar a divulgação.');
  context.fillStyle = color;
  context.textAlign = align;
  rows.forEach((row, index) => context.fillText(row, align === 'center' ? x + width / 2 : x, y + index * size * 1.22));
}
function drawFitted(context: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number, fit: 'contain' | 'cover') {
  if (fit === 'contain') {
    const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
    const w = image.naturalWidth * scale, h = image.naturalHeight * scale;
    context.drawImage(image, x + (width - w) / 2, y + (height - h) / 2, w, h);
  } else {
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const sw = width / scale, sh = height / scale;
    context.drawImage(image, (image.naturalWidth - sw) / 2, (image.naturalHeight - sh) / 2, sw, sh, x, y, width, height);
  }
}
/** JPEG is generated locally, then sent directly to MinIO only on confirmation. */
export async function createInstagramArtwork(product: ArtworkProduct, store: ArtworkStore, target: InstagramTarget, options?: InstagramArtworkOptions): Promise<Blob> {
  const design = { ...defaultInstagramDesign(store.cor_primaria), ...options };
  if (design.background === 'photo' && !options?.backgroundUrl) throw new Error('Escolha a imagem de fundo ou selecione outro tipo de fundo.');
  if (design.showPrice && !product.is_free && (!Number.isFinite(Number(product.preco)) || Number(product.preco) < 0)) throw new Error('Confira o preço no cadastro do produto antes de criar a arte.');
  const source = catalogImageUrl(product.capa_url); if (!source) throw new Error('Adicione a capa do produto antes de criar a divulgação.');
  const cover = await coverImage(source);
  const canvas = document.createElement('canvas'), format = INSTAGRAM_FORMATS[target];
  canvas.width = format.width; canvas.height = format.height;
  const context = canvas.getContext('2d'); if (!context) throw new Error('Este navegador não conseguiu preparar a imagem.');
  const background = context.createLinearGradient(0, 0, 1080, format.height); background.addColorStop(0, design.primary); background.addColorStop(1, design.secondary);
  context.fillStyle = design.background === 'gradient' ? background : design.background === 'paper' ? '#faf7f0' : design.primary;
  context.fillRect(0, 0, 1080, format.height); context.textBaseline = 'top';
  if (design.background === 'photo' && options?.backgroundUrl) {
    drawFitted(context, await coverImage(options.backgroundUrl), 0, 0, 1080, format.height, 'cover');
    context.fillStyle = 'rgba(0,0,0,0.58)'; context.fillRect(0, 0, 1080, format.height);
  }
  const ink = design.background === 'paper' ? '#172033' : design.textColor;
  const text = (value: string, y: number, height: number, size: number, width = 936) => fitted(context, value, 72, y, width, height, size, ink, design.font, design.align);
  const top = target === 'story' ? 150 : 64;
  if (design.showStore) text(store.nome_loja, top, 72, 30, design.showLogo && (options?.logoUrl || store.logo_url) ? 780 : 936);
  if (design.showLogo && (options?.logoUrl || store.logo_url)) {
    const logoSource = options?.logoUrl || catalogImageUrl(store.logo_url);
    if (logoSource) { context.fillStyle = '#fff'; context.fillRect(894, top - 12, 114, 114); drawFitted(context, await coverImage(logoSource), 900, top - 6, 102, 102, 'contain'); }
  }
  const titleY = top + 110;
  if (design.showTitle) text(design.title || product.titulo, titleY, target === 'story' ? 260 : 190, design.titleSize);
  const imageY = target === 'story' ? 560 : 390;
  const imageHeight = target === 'story' ? 850 : 570;
  const editorial = design.layout === 'editorial';
  const frameX = editorial ? 260 : design.layout === 'cover' ? 40 : 72, frameWidth = editorial ? 748 : design.layout === 'cover' ? 1000 : 936;
  const frameY = imageY;
  const frameHeight = design.layout === 'cover' ? imageHeight + 20 : imageHeight;
  context.fillStyle = '#ffffff'; context.fillRect(72, imageY, 936, imageHeight);
  context.fillRect(frameX, frameY, frameWidth, frameHeight);
  drawFitted(context, cover, frameX + 20, frameY + 20, frameWidth - 40, frameHeight - 40, design.fit);
  if (editorial) { context.fillStyle = design.primary; context.fillRect(72, imageY, 164, imageHeight); fitted(context, 'MATERIAL\nDIDÁTICO', 88, imageY + 38, 130, imageHeight - 60, 26, '#ffffff', design.font); }
  const price = product.is_free || Number(product.preco) === 0 ? 'Gratuito' : Number(product.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const bottom = target === 'story' ? 1460 : 1000, footerWidth = design.showQr ? 690 : 936;
  text(design.showPrice ? price : design.subtitle, bottom, 90, design.showPrice ? 64 : 34, footerWidth);
  text(design.showPrice ? design.subtitle : '', bottom + 95, 60, 28, footerWidth);
  text(design.cta, bottom + 160, 70, 32, footerWidth);
  if (design.showLink) text(`www.educalizando.com.br/loja/${store.slug}`, bottom + 245, 45, 22, footerWidth);
  text(INSTAGRAM_BRAND, target === 'story' ? 1775 : 1304, 40, 24);
  if (design.showQr) {
    if (!product.id) throw new Error('Selecione um produto para criar o QR code.');
    const QRCode = await import('qrcode');
    const qr = await QRCode.toDataURL(instagramProductLink(store, { id: product.id, slug: product.slug }), { width: 210, margin: 2, errorCorrectionLevel: 'M' });
    context.drawImage(await coverImage(qr), 798, bottom + 15, 210, 210);
  }
  return new Promise((resolve, reject) => {
    try { canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Não foi possível exportar a arte.')), 'image/jpeg', 0.9); }
    catch { reject(new Error('O armazenamento precisa permitir o uso público da capa para gerar esta arte.')); }
  });
}
