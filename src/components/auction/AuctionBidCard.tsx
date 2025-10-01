import { Box, Card, CardContent, Grid, Typography } from '@mui/material';
import { formatCurrency } from 'src/lib/utils';

interface AuctionBidCardProps {
  currentBid: number;
  bidCount: number;
  uniqueBidders: number;
  auctionStatus: 'SCHEDULED' | 'LIVE' | 'ENDED' | null;
}

export default function AuctionBidCard({
  currentBid,
  bidCount,
  uniqueBidders,
  auctionStatus,
}: AuctionBidCardProps) {
  const getBorderColor = () => {
    switch (auctionStatus) {
      case 'LIVE':
        return '#CE0E2D';
      case 'ENDED':
        return '#f59e0b';
      default:
        return 'divider';
    }
  };

  const getBackground = () => {
    switch (auctionStatus) {
      case 'LIVE':
        return 'linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)';
      case 'ENDED':
        return 'linear-gradient(135deg, #fffbeb 0%, #ffffff 100%)';
      default:
        return 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)';
    }
  };

  const getTopBarColor = () => {
    switch (auctionStatus) {
      case 'LIVE':
        return 'linear-gradient(90deg, #CE0E2D 0%, #dc2626 100%)';
      case 'ENDED':
        return 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)';
      default:
        return 'linear-gradient(90deg, #64748b 0%, #475569 100%)';
    }
  };

  const getTitleColor = () => {
    switch (auctionStatus) {
      case 'LIVE':
        return '#dc2626';
      case 'ENDED':
        return '#d97706';
      default:
        return '#64748b';
    }
  };

  const getTitle = () => {
    switch (auctionStatus) {
      case 'ENDED':
        return '👑 WINNING BID';
      case 'LIVE':
        return '💰 CURRENT BID';
      default:
        return '💵 STARTING BID';
    }
  };

  return (
    <Card
      sx={{
        mb: 3,
        textAlign: 'center',
        borderRadius: 3,
        border: '3px solid',
        borderColor: getBorderColor(),
        boxShadow:
          auctionStatus === 'LIVE'
            ? '0 20px 40px rgba(206, 14, 45, 0.15)'
            : (theme) => `0 8px 32px ${theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0,0,0,0.08)'}`,
        background: getBackground(),
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '6px',
          background: getTopBarColor(),
        },
      }}
    >
      <CardContent sx={{ p: { xs: 2.5, lg: 3 }, pt: 4 }}>
        <Typography
          variant="h6"
          fontWeight={700}
          mb={2}
          sx={{
            color: getTitleColor(),
            fontSize: { xs: '1rem', md: '1.1rem' },
            letterSpacing: '0.5px',
          }}
        >
          {getTitle()}
        </Typography>
        <Typography
          variant="h2"
          fontWeight="bold"
          mb={3}
          sx={{
            color: 'text.primary',
            fontSize: { xs: '2rem', md: '2.5rem', lg: '3rem' },
            lineHeight: 1,
            textShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          {formatCurrency(currentBid)}
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Box
              sx={{
                textAlign: 'center',
                p: 2,
                bgcolor: 'rgba(206, 14, 45, 0.05)',
                borderRadius: 2,
                border: '2px solid rgba(206, 14, 45, 0.1)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: 'rgba(206, 14, 45, 0.1)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <Typography
                variant="h5"
                fontWeight="bold"
                sx={{
                  color: 'primary.main',
                  fontSize: { xs: '1.25rem', md: '1.5rem' },
                }}
              >
                {bidCount}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                fontWeight={600}
                sx={{
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Total Bids
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box
              sx={{
                textAlign: 'center',
                p: 2,
                bgcolor: 'rgba(59, 130, 246, 0.05)',
                borderRadius: 2,
                border: '2px solid rgba(59, 130, 246, 0.1)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: 'rgba(59, 130, 246, 0.1)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <Typography
                variant="h5"
                fontWeight="bold"
                sx={{
                  color: '#3b82f6',
                  fontSize: { xs: '1.25rem', md: '1.5rem' },
                }}
              >
                {uniqueBidders}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                fontWeight={600}
                sx={{
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Bidders
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
