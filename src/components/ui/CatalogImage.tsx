'use client';
import { useState, type ImgHTMLAttributes } from 'react';
import Image from 'next/image';
import { catalogImageUrl } from '@/lib/catalog-image-url';

/** Keep public MinIO reads on the platform origin, with one bounded recovery. */
export default function CatalogImage({ src, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const normalized = typeof src === 'string' ? catalogImageUrl(src) : null;
  return <ImageAttempt key={normalized} src={normalized} {...props} />;
}
function ImageAttempt({ src, alt, className, width = 600, height = 600, ...props }: Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & { src: string | null }) {
  const [retry, setRetry] = useState(false);
  const [failed, setFailed] = useState(false);
  const url = src && retry ? `${src}?image_retry=1` : src;
  if (!url || failed) return <div role="img" aria-label={alt || 'Imagem indisponível'} className={`${className || ''} flex items-center justify-center bg-slate-100 p-3 text-center text-xs text-slate-500`}>Imagem temporariamente indisponível</div>;
  return <Image {...props} unoptimized width={Number(width) || 600} height={Number(height) || 600} alt={alt || ''} className={className} src={url} decoding="async" onError={() => {
    if (!retry && src?.startsWith('/media/catalogo/')) setRetry(true);
    else setFailed(true);
  }} />;
}
