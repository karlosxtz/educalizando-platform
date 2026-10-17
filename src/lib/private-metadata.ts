import type { Metadata } from 'next';

export const PRIVATE_METADATA: Metadata = {
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};
