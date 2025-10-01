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
        return 'primary.main';
      case 'ENDED':
        return 'warning.main';
      default:
        return 'grey.400';
    }
  };

  const getBackgroundColor = () => {
    switch (auctionStatus) {
      case 'LIVE':
        return 'primary.lighter';
      case 'ENDED':
        return 'warning.lighter';
      default:
        return 'grey.100';
    }
  };

  const getTitle = () => {
    switch (auctionStatus) {
      case 'ENDED':
        return 'WINNING BID';
      case 'LIVE':
        return 'CURRENT BID';
      default:
        return 'STARTING BID';
    }
  };

  const getTitleIcon = () => {
    switch (auctionStatus) {
      case 'ENDED':
        return '👑';
      case 'LIVE':
        return '💰';
      default:
        return '💵';
    }
  };

  return (
    <Card
      elevation={3}
      sx={{
        textAlign: 'center',
        borderRadius: 2,
        border: '3px solid',
        borderColor: getBorderColor(),
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          bgcolor: getBorderColor(),
          color: 'common.white',
          py: 1.5,
          px: 2,
        }}
      >
        <Typography
          variant="subtitle1"
          fontWeight={700}
          sx={{
            letterSpacing: 1,
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
          }}
        >
          <span>{getTitleIcon()}</span>
          {getTitle()}
        </Typography>
      </Box>

      <CardContent sx={{ p: 3, bgcolor: getBackgroundColor() }}>
        <Typography
          variant="h2"
          fontWeight="bold"
          sx={{
            color: 'text.primary',
            fontSize: { xs: '2rem', md: '2.5rem', lg: '2.75rem' },
            lineHeight: 1,
            mb: 3,
          }}
        >
          {formatCurrency(currentBid)}
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Box
              sx={{
                p: 2,
                bgcolor: 'common.white',
                borderRadius: 2,
                border: '2px solid',
                borderColor: 'primary.light',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                },
              }}
            >
              <Typography
                variant="h4"
                fontWeight="bold"
                color="primary.main"
                sx={{ fontSize: { xs: '1.5rem', md: '1.75rem' } }}
              >
                {bidCount}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={600}
                sx={{
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  display: 'block',
                  mt: 0.5,
                }}
              >
                Total Bids
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box
              sx={{
                p: 2,
                bgcolor: 'common.white',
                borderRadius: 2,
                border: '2px solid',
                borderColor: 'info.light',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                },
              }}
            >
              <Typography
                variant="h4"
                fontWeight="bold"
                color="info.main"
                sx={{ fontSize: { xs: '1.5rem', md: '1.75rem' } }}
              >
                {uniqueBidders}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={600}
                sx={{
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  display: 'block',
                  mt: 0.5,
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
