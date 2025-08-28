'use client';

import type { FC } from 'react';

import { styled } from '@mui/material/styles';
import { Box, Card, Stack, Button, Typography } from '@mui/material';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  color: theme.palette.common.white,
  padding: theme.spacing(3),
  minHeight: 280,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  position: 'relative',
  overflow: 'hidden',
  cursor: 'pointer',
  transition: theme.transitions.create(['transform', 'box-shadow'], {
    duration: theme.transitions.duration.standard,
  }),
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    right: 0,
    width: '40%',
    height: '100%',
    background: theme.palette.action.hover,
    borderRadius: '50% 0 0 50%',
    transform: 'translateX(20%)',
    opacity: 0.1,
  },
}));

const CategoryIcon = styled(Box)(({ theme }) => ({
  width: 48,
  height: 48,
  borderRadius: '50%',
  backgroundColor: theme.palette.common.white,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: theme.spacing(2),
  opacity: 0.2,
}));

const ViewAllButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.common.white,
  color: theme.palette.common.white,
  borderRadius: 20,
  padding: theme.spacing(1, 2),
  fontSize: '0.875rem',
  fontWeight: theme.typography.fontWeightSemiBold,
  textTransform: 'none',
  backdropFilter: 'blur(10px)',
  border: `1px solid ${theme.palette.common.white}`,
  opacity: 0.2,
  '&:hover': {
    opacity: 0.3,
    transform: 'translateY(-1px)',
    backgroundColor: theme.palette.common.white,
  },
}));

// ----------------------------------------------------------------------

export interface FeaturedCategoryCardProps {
  id: string;
  name: string;
  productCount: number;
  icon?: string;
  colorVariant?: 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error';
  onClick?: () => void;
}

export const FeaturedCategoryCard: FC<FeaturedCategoryCardProps> = ({
  id,
  name,
  productCount,
  icon = 'mdi:package-variant',
  colorVariant = 'primary',
  onClick,
}) => (
    <StyledCard 
      onClick={onClick}
      sx={(theme) => ({ 
        background: `linear-gradient(135deg, ${theme.palette[colorVariant].main} 0%, ${theme.palette[colorVariant].dark} 100%)`,
      })}
    >
      <Box>
        <CategoryIcon>
          <Iconify icon={icon} width={24} sx={{ color: 'common.white' }} />
        </CategoryIcon>
        
        <Stack spacing={1}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700,
              fontSize: '2rem',
              lineHeight: 1.2,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            {name}
          </Typography>
          
          <Typography 
            variant="body1" 
            sx={{ 
              opacity: 0.9,
              fontSize: '1rem',
              fontWeight: 400
            }}
          >
            {productCount} Product{productCount !== 1 ? 's' : ''}
          </Typography>
        </Stack>
      </Box>

      <ViewAllButton
        endIcon={<Iconify icon="eva:arrow-forward-outline" width={16} />}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
      >
        VIEW ALL ITEMS
      </ViewAllButton>
    </StyledCard>
  );