import { Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import { LocationOn as LocationIcon } from '@mui/icons-material';
import { formatCurrency } from 'src/lib/utils';

interface AuctionInfoCardProps {
  title: string;
  location: string;
  condition: string;
  estimatedValueMin: number;
  estimatedValueMax: number;
}

const getConditionColor = (condition: string): any => {
  switch (condition) {
    case 'NEW':
      return 'success';
    case 'LIKE_NEW':
      return 'info';
    case 'VERY_GOOD':
      return 'primary';
    case 'GOOD':
      return 'secondary';
    case 'FAIR':
      return 'warning';
    case 'POOR':
      return 'error';
    default:
      return 'default';
  }
};

export default function AuctionInfoCard({
  title,
  location,
  condition,
  estimatedValueMin,
  estimatedValueMax,
}: AuctionInfoCardProps) {
  return (
    <Card
      sx={{
        mb: 3,
        flex: '1 1 auto',
        borderRadius: 3,
        boxShadow: (theme) => `0 8px 32px ${theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.08)'}`,
        border: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      <CardContent sx={{ p: { xs: 2.5, lg: 3 } }}>
        <Typography
          variant="h4"
          fontWeight="bold"
          mb={3}
          sx={{
            color: (theme) => theme.palette.text.primary,
            fontSize: { xs: '1.5rem', md: '1.75rem', lg: '2rem' },
            lineHeight: 1.3,
            letterSpacing: '-0.025em',
          }}
        >
          {title}
        </Typography>

        <Stack spacing={3}>
          <Box
            display="flex"
            alignItems="center"
            gap={1.5}
            sx={{
              p: 2,
              bgcolor: (theme) => theme.palette.action.hover,
              borderRadius: 2,
              border: (theme) => `1px solid ${theme.palette.divider}`,
            }}
          >
            <LocationIcon sx={{ color: 'primary.main', fontSize: '1.25rem' }} />
            <Typography variant="body1" fontWeight={500} color="text.secondary">
              {location}
            </Typography>
          </Box>

          <Box>
            <Typography
              variant="body2"
              color="text.secondary"
              fontWeight={600}
              mb={1}
              sx={{
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontSize: '0.75rem',
              }}
            >
              CONDITION
            </Typography>
            <Chip
              label={condition.replace('_', ' ')}
              color={getConditionColor(condition)}
              sx={{
                fontWeight: 600,
                fontSize: '0.875rem',
                height: '36px',
                borderRadius: 2,
                '& .MuiChip-label': {
                  px: 2,
                },
              }}
            />
          </Box>

          <Box
            sx={{
              p: 2.5,
              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(206, 14, 45, 0.1)' : 'rgba(254, 243, 199, 0.5)',
              borderRadius: 2,
              border: '2px solid',
              borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(206, 14, 45, 0.3)' : 'rgba(206, 14, 45, 0.2)',
            }}
          >
            <Typography
              variant="body2"
              color="warning.dark"
              fontWeight={700}
              mb={1}
              sx={{
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontSize: '0.75rem',
              }}
            >
              💰 ESTIMATED VALUE
            </Typography>
            <Typography
              variant="h6"
              fontWeight="bold"
              sx={{
                color: 'primary.main',
                fontSize: { xs: '1.1rem', md: '1.25rem' },
              }}
            >
              {formatCurrency(estimatedValueMin)} - {formatCurrency(estimatedValueMax)}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
