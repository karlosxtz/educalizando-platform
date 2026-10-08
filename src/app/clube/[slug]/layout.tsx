import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { alternates: { canonical: `/clube/${encodeURIComponent(slug)}` } };
}

export default function ClubLayout({ children }: { children: ReactNode }) {
  return children;
}
