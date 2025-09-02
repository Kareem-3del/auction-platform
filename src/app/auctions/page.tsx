'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuctionsRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Preserve all query parameters when redirecting from /auctions to /products
    const queryString = searchParams.toString();
    const redirectUrl = queryString ? `/products?${queryString}` : '/products';
    
    // Perform the redirect
    router.replace(redirectUrl);
  }, [router, searchParams]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontSize: '18px',
      color: '#666'
    }}>
      Redirecting to products...
    </div>
  );
}