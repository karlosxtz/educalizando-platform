import { env } from 'cloudflare:workers';

// Processing only: the caller still saves the returned file to MinIO.
export async function optimizeProductImage(source) {
  if (!env.IMAGES) throw new Error('O processamento de imagens da Cloudflare não está configurado.');
  const stream = new Blob([source]).stream();
  const output = await env.IMAGES.input(stream)
    .transform({ width: 1920, height: 1920, fit: 'scale-down' })
    .output({ format: 'image/webp', quality: 84 });
  const response = output.response();
  if (!response.ok) throw new Error('Não foi possível otimizar a imagem.');
  return new Uint8Array(await response.arrayBuffer());
}
