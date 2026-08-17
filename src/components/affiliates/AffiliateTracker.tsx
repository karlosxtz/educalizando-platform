"use client";

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function AffiliateTracker() {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // If the URL has ?ref=some_affiliate_id, store it
    const ref = searchParams?.get('ref');
    
    if (ref) {
      // Store in localStorage for persistence across sessions (e.g., 30 days)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      
      const affiliateData = {
        id: ref,
        expiry: expiryDate.getTime()
      };
      
      localStorage.setItem('@educalizando:affiliate', JSON.stringify(affiliateData));
      
      // We could also set a document.cookie if we want it accessible in Server Components easily
      document.cookie = `educalizando_affiliate_id=${ref}; path=/; max-age=${30 * 24 * 60 * 60}`;
    }
  }, [searchParams]);

  return null;
}
