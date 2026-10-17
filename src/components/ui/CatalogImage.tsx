'use client';
import { useState, type ImgHTMLAttributes } from 'react';
import Image from 'next/image';
import { catalogImageUrl, catalogThumbnailUrl } from '@/lib/catalog-image-url';

/** Both preview and fallback are direct MinIO URLs; no application image proxy. */
export default function CatalogImage({ src, thumbnail = true, ...props }: ImgHTMLAttributes<HTMLImageElement> & { thumbnail?: boolean }) {
  const original = typeof src === 'string' ? catalogImageUrl(src) : null;
  const normalized = thumbnail ? catalogThumbnailUrl(original) : original;
  return <ImageAttempt key={normalized} src={normalized} fallback={original} {...props} />;
}
function ImageAttempt({ src, fallback, alt, className, width = 600, height = 600, loading = 'lazy', ...props }: Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & { src: string | null; fallback: string | null }) {
  const [retry, setRetry] = useState(false);
  const [failed, setFailed] = useState(false);
  const url = retry ? fallback : src;
  if (!url || failed) return <div role="img" aria-label={alt || 'Imagem indisponível'} className={`${className || ''} flex items-center justify-center bg-slate-100 p-3 text-center text-xs text-slate-500`}>Imagem temporariamente indisponível</div>;
  return <Image {...props} loading={loading} unoptimized width={Number(width) || 600} height={Number(height) || 600} alt={alt || ''} className={className} src={url} decoding="async" onError={() => {
    if (!retry && fallback && fallback !== src) setRetry(true);
    else setFailed(true);
  }} />;
}
