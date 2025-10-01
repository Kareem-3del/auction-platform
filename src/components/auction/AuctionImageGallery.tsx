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
        bgcolor: 'grey.900',
        border: '2px solid',
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

      {/* Navigation Arrows - Formal Design */}
      {hasMultipleImages && (
        <>
          <IconButton
            onClick={handlePrevious}
            sx={{
              position: 'absolute',
              left: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: 'common.white',
              color: 'grey.900',
              width: 40,
              height: 40,
              border: '2px solid',
              borderColor: 'grey.300',
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: 'primary.main',
                color: 'common.white',
                borderColor: 'primary.main',
                transform: 'translateY(-50%) scale(1.05)',
              },
            }}
          >
            <ChevronLeftIcon sx={{ fontSize: '1.5rem', fontWeight: 700 }} />
          </IconButton>

          <IconButton
            onClick={handleNext}
            sx={{
              position: 'absolute',
              right: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: 'common.white',
              color: 'grey.900',
              width: 40,
              height: 40,
              border: '2px solid',
              borderColor: 'grey.300',
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: 'primary.main',
                color: 'common.white',
                borderColor: 'primary.main',
                transform: 'translateY(-50%) scale(1.05)',
              },
            }}
          >
            <ChevronRightIcon sx={{ fontSize: '1.5rem', fontWeight: 700 }} />
          </IconButton>
        </>
      )}

      {/* Image Counter - Professional Style */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 16,
          right: 16,
        }}
      >
        <Chip
          label={`${currentImageIndex + 1} / ${images?.length || 1}`}
          size="small"
          sx={{
            bgcolor: 'common.white',
            color: 'grey.900',
            fontWeight: 700,
            fontSize: '0.75rem',
            height: 28,
            border: '1px solid',
            borderColor: 'grey.300',
            '& .MuiChip-label': {
              px: 2,
            },
          }}
        />
      </Box>

      {/* Thumbnail Navigation - Formal Design */}
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
                  width: 56,
                  height: 56,
                  objectFit: 'cover',
                  cursor: 'pointer',
                  border: '2px solid',
                  borderColor: currentImageIndex === index ? 'primary.main' : 'common.white',
                  opacity: currentImageIndex === index ? 1 : 0.7,
                  transition: 'all 0.2s',
                  bgcolor: 'grey.900',
                  '&:hover': {
                    opacity: 1,
                    borderColor: currentImageIndex === index ? 'primary.main' : 'primary.light',
                    transform: 'scale(1.08)',
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
