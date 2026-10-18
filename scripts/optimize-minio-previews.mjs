// Maintenance only, executed locally. No image processing runs in a Worker.
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { loadEnv } from 'vite';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const write = process.argv.includes('--write');
const prepare = process.argv.includes('--prepare');
const args = process.argv.slice(2);
const listIndex = args.indexOf('--sources');
const listFile = listIndex >= 0 ? args[listIndex + 1] : null;
const knownArgs = listIndex < 0 ? args : args.filter((_, index) => index !== listIndex && index !== listIndex + 1);
if ((write && prepare) || (listIndex >= 0 && (!listFile || listFile.startsWith('--'))) || knownArgs.some(arg => !['--write', '--prepare'].includes(arg))) throw new Error('Use --write, --prepare or no options; optionally --sources path-to-public-url-list.json.');
const env = { ...loadEnv('production', process.cwd(), ''), ...process.env };
const bucket = env.OBJECT_STORAGE_BUCKET_PUBLIC_IMAGES || 'public-images';
if (bucket !== 'public-images') throw new Error('Maintenance restricted to the existing public-images bucket.');
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const sourceUrls = new Set();
function add(value) {
  try {
    let url = new URL(value, 'https://www.educalizando.com.br');
    if (['www.educalizando.com.br','educalizando.com.br','localhost','127.0.0.1'].includes(url.hostname)) {
      if (/^\/api\/storage\/public-(image|media)$/.test(url.pathname) && url.searchParams.get('bucket') === 'public-images') {
        const key = url.searchParams.get('key') || '';
        if (key.startsWith('uploads/') && !key.split('/').some(part => part === '..' || part === '.')) {
          url = new URL('https://arquivos.educalizando.com.br/public-images/' + key.split('/').map(encodeURIComponent).join('/'));
        }
      } else if (url.pathname.startsWith('/media/catalogo/uploads/')) {
        url = new URL('https://arquivos.educalizando.com.br/public-images/' + url.pathname.slice('/media/catalogo/'.length));
      }
    }
    if (url.origin === 'https://arquivos.educalizando.com.br' && !url.search && !url.hash
      && url.pathname.startsWith('/public-images/uploads/') && !url.pathname.includes('/previews/')
      && /\.(?:jpe?g|png|webp|avif)$/i.test(url.pathname)) sourceUrls.add(url.href);
  } catch { /* Private, external and invalid URLs are deliberately excluded. */ }
}
if (listFile) {
  const sources = JSON.parse(await fs.readFile(listFile, 'utf8'));
  if (!Array.isArray(sources) || sources.some(url => typeof url !== 'string')) throw new Error('Sources must be a JSON array of public URLs.');
  for (const url of sources) add(url);
} else {
// Prioritize the currently visible home. This is public HTML without a session.
const home = await fetch('https://www.educalizando.com.br', { signal: AbortSignal.timeout(45000) });
if (!home.ok) throw new Error('Public homepage unavailable.');
for (const match of (await home.text()).matchAll(/<img[^>]*src="([^"]+)"/g)) add(match[1].replaceAll('&amp;', '&'));
// Stable pagination prevents the Supabase response limit from silently truncating inventory.
for (const [table, fields] of [['products', 'id,capa_url'], ['stores', 'id,logo_url,author_image_url']]) {
  for (let from = 0;; from += 500) {
    let query = db.from(table).select(fields).order('id').range(from, from + 499);
    if (table === 'products') query = query.eq('status', 'publicado').is('excluido_em', null);
    const { data, error } = await query;
    if (error) throw new Error(`Public ${table} inventory unavailable.`);
    for (const row of data || []) for (const field of fields.split(',').filter(field => field !== 'id')) add(row[field]);
    if ((data || []).length < 500) break;
  }
}
}
console.log(JSON.stringify({ mode: write ? 'create-public-previews' : prepare ? 'prepare-local-files' : 'inventory-only', sources: sourceUrls.size }));
if (!write && !prepare) process.exit(0);
for (const key of write ? ['OBJECT_STORAGE_ENDPOINT','OBJECT_STORAGE_ACCESS_KEY_ID','OBJECT_STORAGE_SECRET_ACCESS_KEY'] : []) {
  if (!env[key]) throw new Error(`Missing configuration: ${key}`);
}
const storage = write ? new S3Client({ endpoint: env.OBJECT_STORAGE_ENDPOINT, region: env.OBJECT_STORAGE_REGION || 'us-east-1',
  forcePathStyle: env.OBJECT_STORAGE_FORCE_PATH_STYLE !== 'false', requestChecksumCalculation: 'WHEN_REQUIRED',
  credentials: { accessKeyId: env.OBJECT_STORAGE_ACCESS_KEY_ID, secretAccessKey: env.OBJECT_STORAGE_SECRET_ACCESS_KEY } }) : null;
const manifestFile = write ? 'src/lib/minio-preview-manifest.json' : '.cloudflare/minio-preview-manifest.pending.json';
const manifest = JSON.parse(await fs.readFile('src/lib/minio-preview-manifest.json', 'utf8'));
await fs.mkdir('.cloudflare/minio-previews/v1', { recursive: true });
const results = [];
async function optimize(url) {
  try {
    const path = decodeURIComponent(new URL(url).pathname);
    if (manifest[path]) { results.push({ path, existing: true }); return; }
    const response = await fetch(url, { signal: AbortSignal.timeout(45000), redirect: 'error' });
    if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) throw new Error('source_unavailable');
    if (Number(response.headers.get('content-length')) > 15 * 1024 * 1024) throw new Error('source_too_large');
    const parts = []; let size = 0;
    for await (const part of response.body) { size += part.length; if (size > 15 * 1024 * 1024) throw new Error('source_too_large'); parts.push(part); }
    const original = Buffer.concat(parts);
    const preview = await sharp(original, { limitInputPixels: 40000000 }).rotate()
      .resize({ width: 480, height: 480, fit: 'inside', withoutEnlargement: true }).webp({ quality: 78, effort: 4 }).toBuffer();
    // Keep the original if conversion would make the payload bigger.
    if (preview.length >= original.length) { results.push({ path, skipped: 'already_small', bytes: original.length }); return; }
    const hash = createHash('sha256').update(preview).digest('hex').slice(0, 32);
    const key = `uploads/previews/v1/${hash}.webp`;
    if (prepare) {
      await fs.writeFile(`.cloudflare/minio-previews/v1/${hash}.webp`, preview);
      manifest[path] = hash; // Pending file only; never used by the application before verification.
      results.push({ path, before: original.length, after: preview.length, prepared: true });
      return;
    }
    await storage.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: preview, ContentType: 'image/webp',
      CacheControl: 'public, max-age=31536000, immutable' }), { abortSignal: AbortSignal.timeout(30000) });
    const check = await fetch(`https://arquivos.educalizando.com.br/${bucket}/${key}`, { method: 'HEAD', signal: AbortSignal.timeout(20000) });
    if (!check.ok || Number(check.headers.get('content-length')) !== preview.length) throw new Error('preview_not_public');
    manifest[path] = hash; // Only verified objects become eligible for client delivery.
    results.push({ path, before: original.length, after: preview.length });
  } catch (error) { results.push({ path: new URL(url).pathname, error: error.name, status: error.$metadata?.httpStatusCode }); }
}
const urls = [...sourceUrls];
for (let offset = 0; offset < urls.length; offset += 3) {
  await Promise.all(urls.slice(offset, offset + 3).map(optimize));
  await fs.writeFile(manifestFile, JSON.stringify(Object.fromEntries(Object.entries(manifest).sort()), null, 2) + '\n');
  console.log(JSON.stringify({ completed: results.length, total: urls.length, failed: results.filter(item => item.error).length }));
}
const before = results.reduce((total, item) => total + (item.before || 0), 0);
const after = results.reduce((total, item) => total + (item.after || 0), 0);
const report = { sources: urls.length, generated: results.filter(item => item.after).length, failed: results.filter(item => item.error).length,
  before, after, reductionPercent: before ? Math.round((1 - after / before) * 100) : 0, results };
await fs.mkdir('.cloudflare', { recursive: true });
await fs.writeFile('.cloudflare/minio-preview-generation.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify({ ...report, results: undefined }));
storage?.destroy();
