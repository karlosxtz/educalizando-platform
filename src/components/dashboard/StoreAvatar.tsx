'use client';

import { useState } from 'react';
import { catalogImageUrl } from '@/lib/catalog-image-url';

export default function StoreAvatar({ name, logo }: { name: string; logo?: string | null }) {
  const src = catalogImageUrl(logo);
  return <Avatar key={src} name={name} src={src} />;
}

function Avatar({ name, src }: { name: string; src: string | null }) {
  const [failed, setFailed] = useState(false);
  const initials = name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(word => Array.from(word)[0]).join('').toLocaleUpperCase('pt-BR') || 'L';
  return <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-100 text-sm font-extrabold text-blue-800 shadow-sm">
    {src && !failed ? <img src={src} alt={`Logo da loja ${name}`} width={40} height={40} decoding="async" className="h-full w-full bg-white object-contain p-1" onError={() => setFailed(true)} /> : <span aria-hidden="true">{initials}</span>}
  </div>;
}
