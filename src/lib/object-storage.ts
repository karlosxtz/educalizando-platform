import 'server-only';

import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export type LegacyUploadBucket = 'product-covers' | 'product-files' | 'store-assets' | 'student-avatars' | 'main-banners';

const PRIVATE_URI_PREFIX = 'minio://';

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Configuração de armazenamento ausente: ${name}`);
  return value;
}

function config() {
  const endpoint = required('OBJECT_STORAGE_ENDPOINT').replace(/\/+$/, '');
  return {
    endpoint,
    region: process.env.OBJECT_STORAGE_REGION || 'us-east-1',
    forcePathStyle: process.env.OBJECT_STORAGE_FORCE_PATH_STYLE !== 'false',
    credentials: {
      accessKeyId: required('OBJECT_STORAGE_ACCESS_KEY_ID'),
      secretAccessKey: required('OBJECT_STORAGE_SECRET_ACCESS_KEY'),
    },
  };
}

function client() {
  return new S3Client(config());
}

export function resolveBucket(legacyBucket: LegacyUploadBucket) {
  if (legacyBucket === 'product-files') {
    return process.env.OBJECT_STORAGE_BUCKET_PRIVATE_MATERIALS || 'private-materials';
  }
  return process.env.OBJECT_STORAGE_BUCKET_PUBLIC_IMAGES || 'public-images';
}

export function isPrivateStorageUri(value: string) {
  return value.startsWith(PRIVATE_URI_PREFIX);
}

export function parsePrivateStorageUri(value: string) {
  if (!isPrivateStorageUri(value)) return null;
  const withoutPrefix = value.slice(PRIVATE_URI_PREFIX.length);
  const slash = withoutPrefix.indexOf('/');
  if (slash < 1 || slash === withoutPrefix.length - 1) return null;
  return { bucket: withoutPrefix.slice(0, slash), key: withoutPrefix.slice(slash + 1) };
}

function encodedKey(key: string) {
  return key.split('/').map(encodeURIComponent).join('/');
}

export function publicObjectUrl(bucket: string, key: string) {
  return `${config().endpoint}/${encodeURIComponent(bucket)}/${encodedKey(key)}`;
}

export async function createUploadUrl({ bucket, key, contentType }: { bucket: string; key: string; contentType: string }) {
  return getSignedUrl(client(), new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    CacheControl: bucket === (process.env.OBJECT_STORAGE_BUCKET_PUBLIC_IMAGES || 'public-images')
      ? 'public, max-age=31536000, immutable'
      : 'private, no-store',
  }), { expiresIn: 15 * 60 });
}

export async function createDownloadUrl(bucket: string, key: string, filename?: string) {
  return getSignedUrl(client(), new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    ...(filename ? { ResponseContentDisposition: `attachment; filename="${filename.replace(/["\\]/g, '_')}"` } : {}),
  }), { expiresIn: 60 * 15 });
}
