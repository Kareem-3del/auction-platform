'use client';

import React from 'react';
import { Box } from '@mui/material';
import { SpotifyNavbar } from './SpotifyNavbar';
import Footer from './Footer';

interface SpotifyLayoutProps {
  children: React.ReactNode;
  transparent?: boolean;
  hideFooter?: boolean;
}

export default function SpotifyLayout({ 
  children, 
  transparent = false,
  hideFooter = false,
}: SpotifyLayoutProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Spotify-style Navigation */}
      <SpotifyNavbar transparent={transparent} />
      
      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          ...(transparent ? {} : { pt: '72px' }), // Add top padding if not transparent
        }}
      >
        {children}
      </Box>
      
      {/* Footer */}
      {!hideFooter && <Footer />}
    </Box>
  );
}