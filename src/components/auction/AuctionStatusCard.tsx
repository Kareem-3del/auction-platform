import { Chip } from '@mui/material';

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
  isConnected,
}: AuctionStatusCardProps) {
  const getStatusConfig = () => {
    switch (auctionStatus) {
      case 'LIVE':
        return {
          label: isConnected ? `LIVE ${timeLeft ? `• ${timeLeft}` : ''}` : 'LIVE • RECONNECTING',
          color: 'error' as const,
          bgcolor: 'error.main',
          textColor: 'common.white',
        };
      case 'ENDED':
        return {
          label: 'ENDED',
          color: 'default' as const,
          bgcolor: 'grey.700',
          textColor: 'common.white',
        };
      case 'SCHEDULED':
        return {
          label: 'UPCOMING',
          color: 'info' as const,
          bgcolor: 'info.main',
          textColor: 'common.white',
        };
      default:
        return {
          label: 'AUCTION',
          color: 'default' as const,
          bgcolor: 'grey.500',
          textColor: 'common.white',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Chip
      label={config.label}
      sx={{
        fontSize: '0.75rem',
        height: 26,
        fontWeight: 700,
        letterSpacing: 0.5,
        bgcolor: config.bgcolor,
        color: config.textColor,
        border: '1px solid',
        borderColor: config.bgcolor,
        '& .MuiChip-label': {
          px: 1.5,
        },
      }}
    />
  );
}
