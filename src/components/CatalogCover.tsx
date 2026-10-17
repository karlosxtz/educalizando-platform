'use client';

import { useState } from 'react';
import Image from 'next/image';
import { BookOpen } from 'lucide-react';
import { catalogThumbnailUrl } from '@/lib/catalog-image-url';
import { normalizePublicAssetUrl } from '@/lib/public-links';

export default function CatalogCover({ value, title, priority, className }: { value: string | null; title: string; priority: boolean; className: string }) {
  const source = catalogThumbnailUrl(value);
  // Keyed child resets the failure state when a different cover arrives.
  return <Cover key={source} source={source} fallback={normalizePublicAssetUrl(value)} title={title} priority={priority} className={className} />;
}

function Cover({ source, fallback, title, priority, className }: { source: string | null; fallback: string | null; title: string; priority: boolean; className: string }) {
  const [failure, setFailure] = useState(0);
  const src = failure === 1 ? fallback : source;
  if (!src || failure > 1) return <div role="img" aria-label={`Material sem capa: ${title}`} className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400"><BookOpen aria-hidden="true" className="h-9 w-9 sm:h-12 sm:w-12" /></div>;
  return <Image unoptimized src={src} alt={`Capa do material: ${title}`} width={600} height={600} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} decoding="async" className={className} onError={() => setFailure(failure === 0 && fallback && fallback !== source ? 1 : 2)} />;
}
