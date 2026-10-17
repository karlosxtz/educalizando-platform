import type { UploadBucket } from './direct-storage-upload';

export type ImageRole = 'avatar' | 'banner' | 'cover';
export function imageUploadProfile(bucket: UploadBucket, role?: ImageRole) {
  if (bucket === 'product-files' || bucket === 'plr-files') return null;
  if (bucket === 'student-avatars' || role === 'avatar') return { maxSizeMB: 0.06, maxWidthOrHeight: 320 };
  if (bucket === 'main-banners' || role === 'banner') return { maxSizeMB: 0.32, maxWidthOrHeight: 1920 };
  return { maxSizeMB: 0.18, maxWidthOrHeight: 1200 };
}
