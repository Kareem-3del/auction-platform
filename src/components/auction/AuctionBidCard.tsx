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

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 2,
        border: '2px solid',
        borderColor: getBorderColor(),
      }}
    >
      <Box
        sx={{
          bgcolor: getBorderColor(),
          color: 'common.white',
          py: 1,
          px: 1.5,
          textAlign: 'center',
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            letterSpacing: 0.5,
            fontSize: '0.7rem',
            textTransform: 'uppercase',
          }}
        >
          {getTitle()}
        </Typography>
      </Box>

      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 'bold',
            fontSize: '1.5rem',
            mb: 1.5,
            textAlign: 'center',
            color: 'text.primary',
          }}
        >
          {formatCurrency(currentBid)}
        </Typography>

        <Grid container spacing={1}>
          <Grid item xs={6}>
            <Box
              sx={{
                p: 1,
                bgcolor: 'grey.50',
                borderRadius: 1.5,
                textAlign: 'center',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography
                variant="body2"
                fontWeight="bold"
                color="primary.main"
                sx={{ fontSize: '0.95rem' }}
              >
                {bidCount}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  fontSize: '0.65rem',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                }}
              >
                Bids
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box
              sx={{
                p: 1,
                bgcolor: 'grey.50',
                borderRadius: 1.5,
                textAlign: 'center',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography
                variant="body2"
                fontWeight="bold"
                color="info.main"
                sx={{ fontSize: '0.95rem' }}
              >
                {uniqueBidders}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  fontSize: '0.65rem',
                  textTransform: 'uppercase',
                  fontWeight: 600,
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
