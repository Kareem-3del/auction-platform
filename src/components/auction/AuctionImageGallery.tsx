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
      elevation={0}
      sx={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16/9',
        minHeight: { xs: '300px', md: '400px', lg: '480px' },
        maxHeight: { xs: '350px', md: '450px', lg: '540px' },
        overflow: 'hidden',
        borderRadius: 2,
        bgcolor: 'grey.900',
        border: '1px solid',
        borderColor: 'divider',
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
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: 'rgba(255, 255, 255, 0.9)',
              color: 'grey.800',
              width: 36,
              height: 36,
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: 'primary.main',
                color: 'common.white',
                transform: 'translateY(-50%) scale(1.1)',
              },
            }}
          >
            <ChevronLeftIcon sx={{ fontSize: '1.25rem' }} />
          </IconButton>

          <IconButton
            onClick={handleNext}
            sx={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: 'rgba(255, 255, 255, 0.9)',
              color: 'grey.800',
              width: 36,
              height: 36,
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: 'primary.main',
                color: 'common.white',
                transform: 'translateY(-50%) scale(1.1)',
              },
            }}
          >
            <ChevronRightIcon sx={{ fontSize: '1.25rem' }} />
          </IconButton>
        </>
      )}

      {/* Image Counter - Compact */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 12,
          right: 12,
        }}
      >
        <Chip
          label={`${currentImageIndex + 1} / ${images?.length || 1}`}
          size="small"
          sx={{
            bgcolor: 'rgba(0, 0, 0, 0.7)',
            color: 'common.white',
            fontWeight: 600,
            fontSize: '0.7rem',
            height: 24,
            backdropFilter: 'blur(8px)',
            '& .MuiChip-label': {
              px: 1.5,
            },
          }}
        />
      </Box>

      {/* Thumbnail Navigation (for multiple images) */}
      {hasMultipleImages && images.length <= 5 && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 12,
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <Stack direction="row" spacing={0.75}>
            {images.map((img, index) => (
              <Box
                key={index}
                component="img"
                src={img}
                alt={`Thumbnail ${index + 1}`}
                onClick={() => setCurrentImageIndex(index)}
                sx={{
                  width: 48,
                  height: 48,
                  objectFit: 'cover',
                  borderRadius: 1,
                  cursor: 'pointer',
                  border: '2px solid',
                  borderColor: currentImageIndex === index ? 'primary.main' : 'transparent',
                  opacity: currentImageIndex === index ? 1 : 0.6,
                  transition: 'all 0.2s',
                  bgcolor: 'grey.900',
                  '&:hover': {
                    opacity: 1,
                    borderColor: 'primary.light',
                    transform: 'scale(1.05)',
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
