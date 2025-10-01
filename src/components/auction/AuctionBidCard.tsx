import { Box, Paper, Grid, Typography } from '@mui/material';
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
    <Paper
      elevation={0}
      sx={{
        border: '2px solid',
        borderColor: getBorderColor(),
        overflow: 'hidden',
      }}
    >
      {/* Header Bar */}
      <Box
        sx={{
          bgcolor: getBorderColor(),
          color: 'common.white',
          py: 1.25,
          px: 2,
          textAlign: 'center',
          borderBottom: '2px solid',
          borderColor: getBorderColor(),
        }}
      >
        <Typography
          variant="overline"
          sx={{
            fontWeight: 700,
            letterSpacing: 1.2,
            fontSize: '0.75rem',
          }}
        >
          {getTitle()}
        </Typography>
      </Box>

      {/* Content */}
      <Box sx={{ p: 2.5, bgcolor: 'background.paper' }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            fontSize: '2rem',
            mb: 2,
            textAlign: 'center',
            color: 'text.primary',
            letterSpacing: '-0.02em',
          }}
        >
          {formatCurrency(currentBid)}
        </Typography>

        <Grid container spacing={1.5}>
          <Grid item xs={6}>
            <Box
              sx={{
                p: 1.5,
                bgcolor: 'grey.50',
                textAlign: 'center',
                border: '1px solid',
                borderColor: 'grey.300',
              }}
            >
              <Typography
                variant="h6"
                fontWeight={700}
                color="primary.main"
                sx={{ fontSize: '1.25rem', mb: 0.25 }}
              >
                {bidCount}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  letterSpacing: 0.5,
                }}
              >
                Bids
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box
              sx={{
                p: 1.5,
                bgcolor: 'grey.50',
                textAlign: 'center',
                border: '1px solid',
                borderColor: 'grey.300',
              }}
            >
              <Typography
                variant="h6"
                fontWeight={700}
                color="info.main"
                sx={{ fontSize: '1.25rem', mb: 0.25 }}
              >
                {uniqueBidders}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  letterSpacing: 0.5,
                }}
              >
                Bidders
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
}
