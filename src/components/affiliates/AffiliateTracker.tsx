"use client";

import { usePathname,useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function AffiliateTracker() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  useEffect(() => {
    const ref = searchParams?.get('ref');
    
    if (ref && pathname) {
      // Call server-side tracking endpoint securely
      fetch('/api/affiliates/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          ref, 
          pathname,
          referer: typeof document !== 'undefined' ? document.referrer : null 
        })
      }).catch(err => console.error('[AffiliateTracker] Erro:', err));
    }
  }, [searchParams, pathname]);

  return null;
}
