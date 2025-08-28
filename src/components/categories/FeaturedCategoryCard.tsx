'use client';

import { useRouter } from 'next/navigation';

import {
  Box,
  Card,
  Button,
  Typography,
} from '@mui/material';

interface FeaturedCategory {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  productCount: number;
}

interface FeaturedCategoryCardProps {
  category: FeaturedCategory;
}

export function FeaturedCategoryCard({ category }: FeaturedCategoryCardProps) {
  const router = useRouter();

  const handleViewAllClick = () => {
    router.push(`/categories/${category.slug}`);
  };

  return (
    <Card
      sx={{
        position: 'relative',
        height: '100%',
        borderRadius: 2,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #A855F7 100%)',
        boxShadow: '0 4px 20px rgba(139, 92, 246, 0.25)',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 30px rgba(139, 92, 246, 0.35)',
        },
      }}
      onClick={handleViewAllClick}
    >

      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: 3,
          color: 'white',
        }}
      >
        {/* Top section with category name */}
        <Box sx={{ textAlign: 'center', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography
            variant="h3"
            component="h2"
            sx={{
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: 2,
              fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' },
              textShadow: '0 2px 4px rgba(0,0,0,0.2)',
              lineHeight: 1.2,
              mb: 1,
            }}
          >
            {category.name.split(' ')[0]}
          </Typography>
          
          {category.name.split(' ').length > 1 && (
            <Typography
              variant="h5"
              sx={{
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                fontSize: { xs: '1rem', sm: '1.2rem', md: '1.4rem' },
                opacity: 0.9,
              }}
            >
              {category.name.split(' ').slice(1).join(' ')}
            </Typography>
          )}
        </Box>

        {/* Bottom section with count and button */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="body1"
            sx={{
              mb: 3,
              opacity: 0.9,
              fontWeight: 400,
              fontSize: '1rem',
            }}
          >
            ({category.productCount} items)
          </Typography>

          <Button
            variant="contained"
            fullWidth
            sx={{
              bgcolor: '#00D9FF',
              color: 'white',
              fontWeight: 'bold',
              py: 1.5,
              borderRadius: 1.5,
              textTransform: 'uppercase',
              letterSpacing: 1,
              fontSize: '0.85rem',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: '#00B8D4',
                boxShadow: '0 2px 8px rgba(0, 217, 255, 0.3)',
              },
              transition: 'all 0.2s ease',
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleViewAllClick();
            }}
          >
            VIEW ALL ITEMS
          </Button>
        </Box>
      </Box>
    </Card>
  );
}