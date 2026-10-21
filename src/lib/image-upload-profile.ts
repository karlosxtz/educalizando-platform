import type { UploadBucket } from './direct-storage-upload';

export type ImageRole = 'avatar' | 'banner' | 'cover';
export function imageUploadProfile(bucket: UploadBucket, role?: ImageRole) {
  if (bucket === 'product-files' || bucket === 'plr-files') return null;
  if (bucket === 'student-avatars' || role === 'avatar') return { maxSizeMB: 0.03, maxWidthOrHeight: 256 };
  if (bucket === 'main-banners' || role === 'banner') return { maxSizeMB: 0.24, maxWidthOrHeight: 1920 };
  return { maxSizeMB: 0.12, maxWidthOrHeight: 1200 };
}
