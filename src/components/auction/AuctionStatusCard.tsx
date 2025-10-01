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
          icon: '🔴',
        };
      case 'ENDED':
        return {
          label: 'ENDED',
          color: 'default' as const,
          icon: '👑',
        };
      case 'SCHEDULED':
        return {
          label: 'UPCOMING',
          color: 'info' as const,
          icon: '📅',
        };
      default:
        return {
          label: 'AUCTION',
          color: 'default' as const,
          icon: '🔨',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Chip
      label={`${config.icon} ${config.label}`}
      color={config.color}
      size="small"
      sx={{
        fontSize: '0.7rem',
        height: 22,
        fontWeight: 700,
        letterSpacing: 0.3,
      }}
    />
  );
}
