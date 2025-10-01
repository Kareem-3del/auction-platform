import { Box, Card, CardContent, Chip, Typography } from '@mui/material';
import { CountdownTimer } from 'src/components/common/CountdownTimer';

interface AuctionStatusCardProps {
  auctionStatus: 'SCHEDULED' | 'LIVE' | 'ENDED' | null;
  timeLeft: string;
  startTime: string | null;
  endTime: string | null;
  isConnected: boolean;
}

export default function AuctionStatusCard({
  auctionStatus,
  timeLeft,
  startTime,
  endTime,
  isConnected,
}: AuctionStatusCardProps) {
  const getBackgroundColor = () => {
    switch (auctionStatus) {
      case 'LIVE':
        return 'primary.main';
      case 'ENDED':
        return 'warning.main';
      default:
        return 'grey.600';
    }
  };

  const getStatusTitle = () => {
    switch (auctionStatus) {
      case 'LIVE':
        return 'LIVE AUCTION';
      case 'ENDED':
        return 'AUCTION ENDED';
      case 'SCHEDULED':
        return 'UPCOMING AUCTION';
      default:
        return 'AUCTION';
    }
  };

  const getStatusIcon = () => {
    switch (auctionStatus) {
      case 'LIVE':
        return '🔴';
      case 'ENDED':
        return '👑';
      case 'SCHEDULED':
        return '📅';
      default:
        return '🔨';
    }
  };

  return (
    <Card
      elevation={3}
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        border: '2px solid',
        borderColor: getBackgroundColor(),
      }}
    >
      <Box
        sx={{
          bgcolor: getBackgroundColor(),
          color: 'common.white',
          py: 2,
          px: 2.5,
          textAlign: 'center',
        }}
      >
        <Typography
          variant="h6"
          fontWeight="bold"
          sx={{
            fontSize: { xs: '1rem', md: '1.1rem' },
            letterSpacing: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
          }}
        >
          <span>{getStatusIcon()}</span>
          {getStatusTitle()}
        </Typography>
      </Box>

      <CardContent sx={{ p: 2.5 }}>
        <Box textAlign="center">
          {auctionStatus === 'LIVE' && timeLeft && (
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'error.lighter',
                border: '2px solid',
                borderColor: 'error.light',
              }}
            >
              <Typography
                variant="caption"
                color="error.dark"
                fontWeight={700}
                sx={{
                  display: 'block',
                  mb: 1,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Time Remaining
              </Typography>
              <Typography
                variant="h5"
                fontWeight="bold"
                color="text.primary"
                sx={{ fontFamily: 'monospace' }}
              >
                {timeLeft}
              </Typography>
            </Box>
          )}

          {auctionStatus === 'SCHEDULED' && (
            <Box sx={{ mt: 1 }}>
              <CountdownTimer
                startTime={startTime ? new Date(startTime) : undefined}
                endTime={endTime ? new Date(endTime) : undefined}
                variant="modern"
                size="large"
              />
            </Box>
          )}

          {auctionStatus === 'LIVE' && (
            <Chip
              label={isConnected ? 'CONNECTED' : 'DISCONNECTED'}
              size="small"
              sx={{
                mt: 2,
                bgcolor: isConnected ? 'success.main' : 'error.main',
                color: 'common.white',
                fontWeight: 700,
                fontSize: '0.75rem',
                '& .MuiChip-label': {
                  px: 2,
                },
              }}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
