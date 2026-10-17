'use client';
import type { Product, Store } from './types';
import { INSTAGRAM_FORMATS, type InstagramTarget } from './instagram-contract';
import { catalogImageUrl } from './catalog-image-url';

type ArtworkProduct = Pick<Product, 'titulo' | 'capa_url' | 'preco' | 'is_free'>;
type ArtworkStore = Pick<Store, 'nome_loja' | 'slug' | 'cor_primaria'>;
async function coverImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image(); image.crossOrigin = 'anonymous';
    const timer = setTimeout(() => { image.src = ''; reject(new Error('A capa demorou para carregar. Tente novamente.')); }, 15000);
    image.onload = () => { clearTimeout(timer); resolve(image); };
    image.onerror = () => { clearTimeout(timer); reject(new Error('Não foi possível carregar a capa para criar a arte. Confira a imagem e o acesso público no armazenamento.')); };
    image.src = url;
  });
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
function fitted(context: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, height: number, startSize: number, color: string) {
  let size = startSize, rows: string[];
  do { context.font = `700 ${size}px Arial, sans-serif`; rows = lines(context, text, width); if (rows.length * size * 1.22 <= height) break; size -= 2; } while (size >= 18);
  if (rows.length * size * 1.22 > height) throw new Error('O título é muito longo para esta arte. Revise o título do produto antes de criar a divulgação.');
  context.fillStyle = color;
  rows.forEach((row, index) => context.fillText(row, x, y + index * size * 1.22));
}
/** JPEG is generated locally, then sent directly to MinIO only on confirmation. */
export async function createInstagramArtwork(product: ArtworkProduct, store: ArtworkStore, target: InstagramTarget): Promise<Blob> {
  if (!product.is_free && (!Number.isFinite(Number(product.preco)) || Number(product.preco) < 0)) throw new Error('Confira o preço no cadastro do produto antes de criar a arte.');
  const source = catalogImageUrl(product.capa_url); if (!source) throw new Error('Adicione a capa do produto antes de criar a divulgação.');
  const cover = await coverImage(source);
  const canvas = document.createElement('canvas'), format = INSTAGRAM_FORMATS[target];
  canvas.width = format.width; canvas.height = format.height;
  const context = canvas.getContext('2d'); if (!context) throw new Error('Este navegador não conseguiu preparar a imagem.');
  const brand = /^#[0-9a-f]{6}$/i.test(store.cor_primaria) ? store.cor_primaria : '#173b79';
  const background = context.createLinearGradient(0, 0, 1080, format.height); background.addColorStop(0, brand); background.addColorStop(1, '#111827');
  context.fillStyle = background; context.fillRect(0, 0, 1080, format.height); context.textBaseline = 'top';
  fitted(context, store.nome_loja, 72, 74, 936, 78, 30, '#dbeafe');
  fitted(context, product.titulo, 72, target === 'story' ? 205 : 180, 936, target === 'story' ? 255 : 200, target === 'story' ? 58 : 48, '#ffffff');
  const imageY = target === 'story' ? 500 : 410, imageHeight = target === 'story' ? 900 : 570;
  context.fillStyle = '#ffffff'; context.fillRect(72, imageY, 936, imageHeight);
  const scale = Math.min(896 / cover.naturalWidth, (imageHeight - 40) / cover.naturalHeight);
  const width = cover.naturalWidth * scale, height = cover.naturalHeight * scale;
  context.drawImage(cover, 72 + (936 - width) / 2, imageY + (imageHeight - height) / 2, width, height);
  const price = product.is_free || Number(product.preco) === 0 ? 'Gratuito' : Number(product.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  fitted(context, price, 72, target === 'story' ? 1480 : 1045, 936, 105, 76, '#ffffff');
  fitted(context, 'Conheça o material na nossa loja', 72, target === 'story' ? 1650 : 1170, 936, 80, 34, '#dbeafe');
  fitted(context, `www.educalizando.com.br/loja/${store.slug}`, 72, target === 'story' ? 1775 : 1260, 936, 62, 26, '#ffffff');
  return new Promise((resolve, reject) => {
    try { canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Não foi possível exportar a arte.')), 'image/jpeg', 0.9); }
    catch { reject(new Error('O armazenamento precisa permitir o uso público da capa para gerar esta arte.')); }
  });
}
