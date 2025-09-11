'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, CircularProgress } from '@mui/material';

export default function ProductsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to auctions page
    router.replace('/auctions');
  }, [router]);

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
        Redirecting to Auctions...
      </Typography>
    </Box>
  );
}