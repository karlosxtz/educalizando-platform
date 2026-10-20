import 'server-only';
import { publicSiteOrigin } from './public-links';
import { publicImageObjectUrl } from './public-image-url';

import { DeleteObjectCommand,GetObjectCommand,HeadBucketCommand,HeadObjectCommand,PutObjectCommand,S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export type LegacyUploadBucket = 'product-covers' | 'product-files' | 'plr-files' | 'store-assets' | 'student-avatars' | 'main-banners';

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
    requestChecksumCalculation: 'WHEN_REQUIRED' as const,
    credentials: {
      accessKeyId: required('OBJECT_STORAGE_ACCESS_KEY_ID'),
      secretAccessKey: required('OBJECT_STORAGE_SECRET_ACCESS_KEY'),
    },
  };
}

let storageClient: S3Client | undefined;
let storageClientConfig: string | undefined;

function client() {
  const settings = config();
  const identity = JSON.stringify(settings);
  if (!storageClient || storageClientConfig !== identity) {
    storageClient = new S3Client(settings);
    storageClientConfig = identity;
  }
  return storageClient;
}

export function resolveBucket(legacyBucket: LegacyUploadBucket) {
  if (legacyBucket === 'plr-files') {
    return process.env.OBJECT_STORAGE_BUCKET_PRIVATE_PLR || 'private-plr';
  }
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

export function platformPublicImageUrl(bucket: string, key: string) {
  const direct = publicImageObjectUrl(bucket, key);
  if (direct) return direct;
  const origin = publicSiteOrigin(process.env.NEXT_PUBLIC_SITE_URL);
  const params = new URLSearchParams({ bucket, key });
  return `${origin}/api/storage/public-image?${params.toString()}`;
}

export function platformPublicMediaUrl(bucket: string, key: string) {
  const origin = publicSiteOrigin(process.env.NEXT_PUBLIC_SITE_URL);
  const params = new URLSearchParams({ bucket, key });
  return `${origin}/api/storage/public-media?${params.toString()}`;
}

export function uploadCacheControl(bucket: string) {
  return bucket === (process.env.OBJECT_STORAGE_BUCKET_PUBLIC_IMAGES || 'public-images')
    ? 'public, max-age=31536000, immutable' : 'private, no-store';
}

export async function createUploadUrl({ bucket, key, contentType, size }: { bucket: string; key: string; contentType: string; size: number }) {
  return getSignedUrl(client(), new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    ContentLength: size,
    CacheControl: uploadCacheControl(bucket),
  }), { expiresIn: 15 * 60, signableHeaders: new Set(['content-type', 'content-length', 'cache-control']) });
}

export async function uploadObject({ bucket, key, body, contentType }: {
  bucket: string;
  key: string;
  body: Uint8Array;
  contentType: string;
}) {
  return client().send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
    CacheControl: bucket === (process.env.OBJECT_STORAGE_BUCKET_PUBLIC_IMAGES || 'public-images')
      ? 'public, max-age=31536000, immutable'
      : 'private, no-store',
  }));
}

export async function getObject(bucket: string, key: string) {
  return client().send(new GetObjectCommand({ Bucket: bucket, Key: key }));
}

/** Atomic create for content-addressed imports, including versioned buckets. */
export async function uploadObjectIfAbsent({ bucket, key, body, contentType }: {
  bucket: string;
  key: string;
  body: Uint8Array;
  contentType: string;
}) {
  try {
    await client().send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: 'private, no-store',
      IfNoneMatch: '*',
    }));
    return true;
  } catch (error) {
    const failure = error as { name?: string; $metadata?: { httpStatusCode?: number } };
    // Only a confirmed failed precondition means that the same key exists.
    // Permission, connection and unsupported-operation errors must still stop.
    if (failure.$metadata?.httpStatusCode === 412) return false;
    throw error;
  }
}

export async function headObject(bucket: string, key: string) {
  return client().send(new HeadObjectCommand({ Bucket: bucket, Key: key }), { abortSignal: AbortSignal.timeout(10000) });
}

export async function deleteObject(bucket: string, key: string) {
  return client().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export async function checkObjectStorageHealth() {
  const bucket = process.env.OBJECT_STORAGE_BUCKET_PUBLIC_IMAGES || 'public-images';
  await client().send(new HeadBucketCommand({ Bucket: bucket }), { abortSignal: AbortSignal.timeout(8000) });
  return true;
}

export async function createDownloadUrl(bucket: string, key: string, filename?: string) {
  return getSignedUrl(client(), new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    ResponseCacheControl: 'private, no-store, max-age=0',
    ...(filename ? { ResponseContentDisposition: `attachment; filename="${filename.replace(/["\\]/g, '_')}"` } : {}),
  }), { expiresIn: 60 * 15 });
}
