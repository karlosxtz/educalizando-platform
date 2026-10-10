import sharp from 'sharp';

/** Node deployment implementation. Cloudflare resolves its own implementation. */
export async function optimizeProductImage(source: Uint8Array, tolerateErrors = false): Promise<Uint8Array> {
  return new Uint8Array(await sharp(source, tolerateErrors ? { failOn: 'none' } : undefined)
    .rotate()
    .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 84, effort: 4 })
    .toBuffer());
}
