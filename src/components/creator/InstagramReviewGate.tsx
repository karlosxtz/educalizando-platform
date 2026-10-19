'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { instagramFetch } from '@/lib/instagram-client';
import InstagramWorkspace from './InstagramWorkspace';

export default function InstagramReviewGate({ children }: { children: ReactNode }) {
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    void instagramFetch('/api/creator/instagram/review-access', { signal: controller.signal })
      .then(result => { if (alive) setAllowed(result.allowed === true); })
      .catch(() => { if (alive) setAllowed(false); });
    return () => { alive = false; controller.abort(); };
  }, []);
  return allowed ? <InstagramWorkspace /> : children;
}
