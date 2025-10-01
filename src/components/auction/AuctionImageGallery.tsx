import { useState } from 'react';
import { Box, Chip, IconButton, Paper } from '@mui/material';
import { ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon } from '@mui/icons-material';

interface AuctionImageGalleryProps {
  images: string[];
  title: string;
}

export default function AuctionImageGallery({ images, title }: AuctionImageGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  return (
    <Paper
      sx={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16/10',
        minHeight: { xs: '350px', md: '450px', lg: '500px' },
        maxHeight: { xs: '400px', md: '500px', lg: '600px' },
        overflow: 'hidden',
        borderRadius: 2,
        boxShadow: (theme) => `0 8px 32px ${theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.12)'}`,
      }}
    >
      <Box
        component="img"
        src={images?.[currentImageIndex] || '/placeholder-image.jpg'}
        alt={title}
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />

      {images?.length > 1 && (
        <>
          <IconButton
            onClick={() =>
              setCurrentImageIndex((prev) => (prev === 0 ? (images?.length || 1) - 1 : prev - 1))
            }
            sx={{
              position: 'absolute',
              left: 20,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              width: 52,
              height: 52,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                bgcolor: 'primary.main',
                color: 'white',
                transform: 'translateY(-50%) scale(1.1)',
                boxShadow: '0 12px 40px rgba(206, 14, 45, 0.4)',
              },
            }}
          >
            <ChevronLeftIcon sx={{ fontSize: '1.5rem' }} />
          </IconButton>

          <IconButton
            onClick={() =>
              setCurrentImageIndex((prev) =>
                prev === (images?.length || 1) - 1 ? 0 : prev + 1
              )
            }
            sx={{
              position: 'absolute',
              right: 20,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              width: 52,
              height: 52,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                bgcolor: 'primary.main',
                color: 'white',
                transform: 'translateY(-50%) scale(1.1)',
                boxShadow: '0 12px 40px rgba(206, 14, 45, 0.4)',
              },
            }}
          >
            <ChevronRightIcon sx={{ fontSize: '1.5rem' }} />
          </IconButton>
        </>
      )}

      <Box
        sx={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          display: 'flex',
          gap: 1,
        }}
      >
        <Chip
          label={`${currentImageIndex + 1} / ${images?.length || 1}`}
          sx={{
            bgcolor: 'rgba(15, 23, 42, 0.9)',
            color: 'white',
            fontWeight: 600,
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            '& .MuiChip-label': {
              px: 2,
            },
          }}
        />
      </Box>
    </Paper>
  );
}
