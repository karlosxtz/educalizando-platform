// Maintenance only. Public catalogue images become immutable static CDN assets.
// No private delivery buckets, service-role key or storage credentials are used.
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { loadEnv } from 'vite';
import { createClient } from '@supabase/supabase-js';

const env = { ...loadEnv('production', process.cwd(), 'NEXT_PUBLIC_'), ...process.env };
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const supabaseOrigin = new URL(env.NEXT_PUBLIC_SUPABASE_URL).origin;
const folder = 'public/images/catalog-previews';
const manifestFile = 'src/lib/catalog-preview-manifest.json';
const previous = JSON.parse(await fs.readFile('src/lib/minio-preview-manifest.json', 'utf8'));
let manifest = {};
try { manifest = JSON.parse(await fs.readFile(manifestFile, 'utf8')); } catch { /* First run. */ }
await fs.mkdir(folder, { recursive: true });
const digest = bytes => createHash('sha256').update(bytes).digest('hex').slice(0, 32);
async function store(bytes) {
  const metadata = await sharp(bytes, { limitInputPixels: 40000000 }).metadata();
  if (metadata.format !== 'webp' || !metadata.width || metadata.width > 640 || metadata.height > 640) throw Error('Invalid preview');
  const hash = digest(bytes);
  await fs.writeFile(`${folder}/${hash}.webp`, bytes);
  return hash;
}
// Reuse previously generated, publicly verified previews; verify the bytes again.
let reused = 0;
for (const [path, hash] of Object.entries(previous)) {
  if (!path.startsWith('/public-images/uploads/') || !/^[a-f0-9]{32}$/.test(hash)) continue;
  try {
    const bytes = await fs.readFile(`.cloudflare/minio-previews/v1/${hash}.webp`);
    if (digest(bytes) !== hash) continue;
    manifest[`https://arquivos.educalizando.com.br${path}`] = await store(bytes);
    reused++;
  } catch { /* Missing local copies will be fetched with the public inventory below. */ }
}
const sources = new Set();
function add(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) return;
    const minio = url.origin === 'https://arquivos.educalizando.com.br' && url.pathname.startsWith('/public-images/uploads/');
    const supabase = url.origin === supabaseOrigin && /^\/storage\/v1\/object\/public\/(product-covers|store-assets|product-previews)\//.test(url.pathname);
    if ((minio || supabase) && /\.(png|jpe?g|webp|avif)$/i.test(url.pathname) && !url.pathname.includes('/../')) sources.add(url.href);
  } catch { /* Never process private, signed or unknown URLs. */ }
}
for (const [table, fields] of [['products', 'id,capa_url'], ['stores', 'id,logo_url,author_image_url']]) {
  for (let offset = 0;; offset += 500) {
    let query = db.from(table).select(fields).order('id').range(offset, offset + 499);
    if (table === 'products') query = query.eq('status', 'publicado').is('excluido_em', null);
    const { data, error } = await query;
    if (error) throw Error(`Public ${table} inventory unavailable`);
    for (const row of data || []) for (const field of fields.split(',').slice(1)) add(row[field]);
    if ((data || []).length < 500) break;
  }
}
const results = [];
async function prepare(url) {
  if (manifest[url]) {
    try { await fs.access(`${folder}/${manifest[url]}.webp`); return; } catch { /* Regenerate missing asset. */ }
  }
  const start = Date.now();
  try {
    const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(30000) });
    if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) throw Error('source_unavailable');
    if (Number(response.headers.get('content-length')) > 15 * 1024 * 1024) throw Error('source_too_large');
    const parts = []; let size = 0;
    for await (const part of response.body) { size += part.length; if (size > 15 * 1024 * 1024) throw Error('source_too_large'); parts.push(part); }
    const original = Buffer.concat(parts);
    const preview = await sharp(original, { limitInputPixels: 40000000 }).rotate().resize({ width: 480, height: 480, fit: 'inside', withoutEnlargement: true }).webp({ quality: 78, effort: 4 }).toBuffer();
    manifest[url] = await store(preview);
    results.push({ url, before: size, after: preview.length, sourceMs: Date.now() - start });
  } catch (error) { results.push({ url, error: error.message, sourceMs: Date.now() - start }); }
}
const urls = [...sources];
for (let index = 0; index < urls.length; index += 4) {
  await Promise.all(urls.slice(index, index + 4).map(prepare));
  console.log(JSON.stringify({ checked: Math.min(index + 4, urls.length), total: urls.length, generated: results.filter(row => row.after).length, failed: results.filter(row => row.error).length }));
}
manifest = Object.fromEntries(Object.entries(manifest).sort());
await fs.writeFile(manifestFile, JSON.stringify(manifest, null, 2) + '\n');
await fs.writeFile('.cloudflare/catalog-preview-report.json', JSON.stringify({ reused, mapped: Object.keys(manifest).length, results }, null, 2));
console.log(JSON.stringify({ reused, mapped: Object.keys(manifest).length, generated: results.filter(row => row.after).length, failed: results.filter(row => row.error).length, before: results.reduce((n,row)=>n+(row.before||0),0), after: results.reduce((n,row)=>n+(row.after||0),0) }));
