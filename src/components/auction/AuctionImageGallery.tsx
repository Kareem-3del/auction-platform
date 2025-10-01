import { useState } from 'react';
import { Box, Chip, IconButton, Paper, Stack } from '@mui/material';
import { ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon } from '@mui/icons-material';

interface AuctionImageGalleryProps {
  images: string[];
  title: string;
}

export default function AuctionImageGallery({ images, title }: AuctionImageGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handlePrevious = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? (images?.length || 1) - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentImageIndex((prev) => (prev === (images?.length || 1) - 1 ? 0 : prev + 1));
  };

  const hasMultipleImages = images?.length > 1;

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16/10',
        minHeight: { xs: '350px', md: '450px', lg: '500px' },
        maxHeight: { xs: '400px', md: '500px', lg: '600px' },
        overflow: 'hidden',
        borderRadius: 2,
        bgcolor: 'grey.900',
      }}
    >
      {/* Main Image */}
      <Box
        component="img"
        src={images?.[currentImageIndex] || '/placeholder-image.jpg'}
        alt={`${title} - Image ${currentImageIndex + 1}`}
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />

      {/* Navigation Arrows */}
      {hasMultipleImages && (
        <>
          <IconButton
            onClick={handlePrevious}
            sx={{
              position: 'absolute',
              left: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: 'rgba(255, 255, 255, 0.95)',
              color: 'grey.800',
              width: 48,
              height: 48,
              transition: 'all 0.3s',
              '&:hover': {
                bgcolor: 'primary.main',
                color: 'common.white',
                transform: 'translateY(-50%) scale(1.15)',
              },
            }}
          >
            <ChevronLeftIcon sx={{ fontSize: '1.75rem' }} />
          </IconButton>

          <IconButton
            onClick={handleNext}
            sx={{
              position: 'absolute',
              right: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: 'rgba(255, 255, 255, 0.95)',
              color: 'grey.800',
              width: 48,
              height: 48,
              transition: 'all 0.3s',
              '&:hover': {
                bgcolor: 'primary.main',
                color: 'common.white',
                transform: 'translateY(-50%) scale(1.15)',
              },
            }}
          >
            <ChevronRightIcon sx={{ fontSize: '1.75rem' }} />
          </IconButton>
        </>
      )}

      {/* Image Counter */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 16,
          right: 16,
        }}
      >
        <Chip
          label={`${currentImageIndex + 1} / ${images?.length || 1}`}
          sx={{
            bgcolor: 'rgba(0, 0, 0, 0.8)',
            color: 'common.white',
            fontWeight: 700,
            fontSize: '0.875rem',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            '& .MuiChip-label': {
              px: 2,
            },
          }}
        />
      </Box>

      {/* Thumbnail Navigation (for multiple images) */}
      {hasMultipleImages && images.length <= 5 && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <Stack direction="row" spacing={1}>
            {images.map((img, index) => (
              <Box
                key={index}
                component="img"
                src={img}
                alt={`Thumbnail ${index + 1}`}
                onClick={() => setCurrentImageIndex(index)}
                sx={{
                  width: 60,
                  height: 60,
                  objectFit: 'cover',
                  borderRadius: 1,
                  cursor: 'pointer',
                  border: '3px solid',
                  borderColor: currentImageIndex === index ? 'primary.main' : 'transparent',
                  opacity: currentImageIndex === index ? 1 : 0.6,
                  transition: 'all 0.3s',
                  bgcolor: 'grey.900',
                  '&:hover': {
                    opacity: 1,
                    borderColor: 'primary.light',
                    transform: 'scale(1.1)',
                  },
                }}
              />
            ))}
          </Stack>
        </Box>
      )}
    </Paper>
  );
}
