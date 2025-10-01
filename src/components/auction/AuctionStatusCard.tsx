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
  const getBackgroundGradient = () => {
    switch (auctionStatus) {
      case 'LIVE':
        return 'linear-gradient(135deg, #CE0E2D, #dc2626)';
      case 'ENDED':
        return 'linear-gradient(135deg, #f59e0b, #d97706)';
      default:
        return 'linear-gradient(135deg, #475569, #334155)';
    }
  };

  const getStatusTitle = () => {
    switch (auctionStatus) {
      case 'LIVE':
        return '🔴 LIVE AUCTION';
      case 'ENDED':
        return '👑 AUCTION ENDED';
      case 'SCHEDULED':
        return '📅 UPCOMING AUCTION';
      default:
        return 'AUCTION';
    }
  };

  return (
    <Card
      sx={{
        background: getBackgroundGradient(),
        color: 'white',
        borderRadius: 2,
        boxShadow: (theme) => `0 4px 15px ${theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)'}`,
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
        <Box textAlign="center">
          <Typography
            variant="h6"
            fontWeight="bold"
            mb={1.5}
            sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}
          >
            {getStatusTitle()}
          </Typography>

          {auctionStatus === 'LIVE' && timeLeft && (
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(255, 255, 255, 0.15)' }}>
              <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5, fontSize: '0.8rem' }}>
                Time Remaining:
              </Typography>
              <Typography
                variant="h6"
                fontWeight="bold"
                sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}
              >
                ⏰ {timeLeft}
              </Typography>
            </Box>
          )}

          {auctionStatus === 'SCHEDULED' && (
            <Box sx={{ mt: 1.5 }}>
              <CountdownTimer
                startTime={startTime ? new Date(startTime) : undefined}
                endTime={endTime ? new Date(endTime) : undefined}
                variant="modern"
                size="large"
              />
            </Box>
          )}

          {auctionStatus === 'LIVE' && isConnected && (
            <Chip
              label="🟢 CONNECTED"
              size="small"
              sx={{ mt: 1, bgcolor: 'rgba(76, 175, 80, 0.3)', color: 'white' }}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
