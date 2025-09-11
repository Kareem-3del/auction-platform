'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Box, Typography, CircularProgress } from '@mui/material';

export default function ProductDetailRedirectPage() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    // Redirect to auction detail page
    if (params.id) {
      router.replace(`/auctions/${params.id}`);
    } else {
      router.replace('/auctions');
    }
  }, [router, params.id]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        gap: 2,
      }}
    >
      <CircularProgress />
      <Typography variant="h6" color="text.secondary">
        Redirecting to Auction Details...
      </Typography>
    </Box>
  );
}